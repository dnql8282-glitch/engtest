#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// YouTube 방식 영상 인코딩 파이프라인
//
//  원본 영상 1개 →  화질 사다리(1080p · 720p · 480p · 360p · 240p · 144p, 원본보다 큰 화질은 만들지 않음)
//              ×  비디오 코덱 2종:  AV1 (최신·고효율, YouTube가 지원 기기에 주는 코덱)
//                                  H.264 (모든 기기 호환, iPhone/Safari 기본)
//              +  오디오 2종:       Opus 160kbps 48kHz (YouTube itag 251과 같은 방식)
//                                  AAC-LC 192kbps 48kHz (YouTube itag 140은 44.1kHz/128kbps → 더 좋게)
//              +  음량 평준화:      -14 LUFS (YouTube 기준 음량), 2-pass loudnorm
//  →  4초 단위 CMAF(fMP4) 조각 + 두 가지 목록 파일
//       manifest.mpd  : DASH — 웹 (Shaka Player가 기기에 맞는 코덱·화질을 자동 선택)
//       hls.m3u8      : HLS  — iPhone/Safari·모바일 앱 (H.264 + AAC만 포함)
//     두 목록이 같은 조각 파일을 함께 써서 용량이 두 배로 늘지 않아요.
//
// 사용법:  npm run encode            (전체)
//          npm run encode -- v4 v11  (일부만)
// 필요한 것: ffmpeg (libsvtav1, libx264, libopus 포함 빌드)
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = join(ROOT, 'tools', 'encode', '.cache');
const OUT = join(ROOT, 'apps', 'web', 'public', 'media');

// 인코딩할 영상 (원본은 가능한 가장 높은 화질)
const SOURCES = {
  v2: 'https://download.blender.org/peach/trailer/trailer_1080p.mov', // Big Buck Bunny 예고편 1080p, 5.1ch
  v4: 'https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4', // Sintel 예고편 1080p
  // 공원 클립(v8~v10)은 1080p 30fps + 나뭇잎이 많아 용량이 커서(영상당 약 40MB) 저장소에는 넣지 않았어요.
  // 직접 만들어 보려면 주석을 풀고 `npm run encode -- v8` 후, core/data/videos.ts의 해당 영상에 stream을 추가하세요.
  // v8: 'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
  // v9: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
  // v10: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
  v11: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  v12: 'https://media.w3.org/2010/05/video/movie_300.mp4',
};

// 화질 사다리: 높이별 H.264 CRF·최대 비트레이트, AV1 CRF (숫자가 작을수록 고화질)
const LADDER = [
  { h: 1080, x264: { crf: 23, max: 3000 }, av1: 32 },
  { h: 720, x264: { crf: 23, max: 1800 }, av1: 33 },
  { h: 480, x264: { crf: 24, max: 900 }, av1: 34 },
  { h: 360, x264: { crf: 25, max: 550 }, av1: 35 },
  { h: 240, x264: { crf: 26, max: 300 }, av1: 36 },
  { h: 144, x264: { crf: 27, max: 150 }, av1: 38 },
];
const SEGMENT_SEC = 4;
const TARGET_LUFS = -14;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} 실패:\n${r.stderr?.slice(-3000)}`);
  return r;
}

function download(id, url) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${id}${url.slice(url.lastIndexOf('.'))}`);
  if (!existsSync(file)) {
    console.log(`  ↓ 원본 받는 중: ${url}`);
    run('curl', ['-sSL', '--fail', '-o', file, url]);
  }
  return file;
}

function probe(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', file]);
  const streams = JSON.parse(r.stdout).streams;
  const v = streams.find((s) => s.codec_type === 'video');
  const a = streams.find((s) => s.codec_type === 'audio');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  return { width: v.width, height: v.height, fps: n / d, hasAudio: Boolean(a) };
}

// 1차: 음량 측정 → 2차 인코딩에 넣을 loudnorm 필터 (linear 모드: 음질 손상 없이 전체 음량만 맞춤)
function loudnormFilter(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = r.stderr.match(/\{[\s\S]*?\}/g);
  const j = JSON.parse(m[m.length - 1]);
  const measured = Number(j.input_i);
  if (!Number.isFinite(measured) || measured < -70) {
    // 소리가 없는(무음) 트랙: 키울 소리가 없으니 형식만 맞춰요
    console.log('  ♪ 무음 트랙 — 음량 평준화 생략');
    return 'aresample=48000';
  }
  console.log(`  ♪ 원본 음량 ${j.input_i} LUFS → ${TARGET_LUFS} LUFS`);
  return `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
}

function encode(id) {
  const src = download(id, SOURCES[id]);
  const info = probe(src);
  const rungs = LADDER.filter((r) => r.h <= info.height);
  if (rungs.length === 0) rungs.push(LADDER[LADDER.length - 1]);
  const gop = Math.round(info.fps * 2); // 2초마다 키프레임 → 4초 조각 경계가 모든 화질에서 일치
  console.log(`▶ ${id}: ${info.width}x${info.height} @${info.fps.toFixed(2)}fps → ${rungs.map((r) => r.h + 'p').join(', ')}`);

  const out = join(OUT, id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  // 필터: 원본을 화질 수 × 2(코덱)로 나눠 각각 크기 조절
  const n = rungs.length;
  const labels = rungs.flatMap((r) => [`av${r.h}`, `h${r.h}`]);
  const filter =
    `[0:v]split=${n * 2}${labels.map((l) => `[s_${l}]`).join('')};` +
    // setdar: 854x480처럼 짝수로 맞춘 크기도 화면 비율은 원본과 정확히 같게 표시 (DASH는 같은 묶음 안의 비율이 같아야 함)
    labels.map((l) => `[s_${l}]scale=-2:${l.replace(/\D/g, '')}:flags=lanczos,setdar=${info.width}/${info.height},format=yuv420p[${l}]`).join(';');

  const args = ['-hide_banner', '-loglevel', 'error', '-stats', '-y', '-i', src, '-filter_complex', filter];
  // 0..n-1: AV1,  n..2n-1: H.264
  rungs.forEach((r, i) => {
    args.push('-map', `[av${r.h}]`, `-c:v:${i}`, 'libsvtav1', `-preset:v:${i}`, '6', `-crf:v:${i}`, String(r.av1), `-g:v:${i}`, String(gop));
  });
  rungs.forEach((r, i) => {
    const k = n + i;
    args.push(
      '-map', `[h${r.h}]`, `-c:v:${k}`, 'libx264', `-preset:v:${k}`, 'slow', `-profile:v:${k}`, 'high',
      `-crf:v:${k}`, String(r.x264.crf), `-maxrate:v:${k}`, `${r.x264.max}k`, `-bufsize:v:${k}`, `${r.x264.max * 2}k`,
      `-x264-params:v:${k}`, `keyint=${gop}:min-keyint=${gop}:scenecut=0`,
    );
  });
  let audioSets = '';
  if (info.hasAudio) {
    const af = loudnormFilter(src);
    args.push('-map', '0:a:0', '-c:a:0', 'libopus', '-b:a:0', '160k', '-ac:a:0', '2', '-filter:a:0', af);
    args.push('-map', '0:a:0', '-c:a:1', 'aac', '-b:a:1', '192k', '-ac:a:1', '2', '-filter:a:1', af);
    audioSets = ` id=2,streams=${2 * n} id=3,streams=${2 * n + 1}`;
  }
  const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i).join(',');
  args.push(
    '-f', 'dash', '-seg_duration', String(SEGMENT_SEC), '-use_template', '1', '-use_timeline', '1',
    '-hls_playlist', '1', '-hls_master_name', 'ffmpeg-master.m3u8',
    '-adaptation_sets', `id=0,streams=${range(0, n)} id=1,streams=${range(n, 2 * n)}${audioSets}`,
    '-init_seg_name', 'init-$RepresentationID$.m4s', '-media_seg_name', 'seg-$RepresentationID$-$Number%05d$.m4s',
    join(out, 'manifest.mpd'),
  );
  run('ffmpeg', args, { stdio: ['ignore', 'inherit', 'pipe'] });

  writeHlsMaster(out, n, info.hasAudio);
  rmSync(join(out, 'ffmpeg-master.m3u8'), { force: true });
  const size = readdirSync(out).reduce((s, f) => s + statSync(join(out, f)).size, 0);
  console.log(`  ✓ ${(size / 1e6).toFixed(1)}MB`);
}

// iPhone·Safari·모바일 앱용 HLS 목록: H.264 화질들 + AAC 오디오만
// (ffmpeg가 만든 화질별 목록 파일을 그대로 가리키고, 조각 파일도 DASH와 공유)
function writeHlsMaster(dir, n, hasAudio) {
  const mpd = readFileSync(join(dir, 'manifest.mpd'), 'utf8');
  const reps = [...mpd.matchAll(/<Representation id="(\d+)"[^>]*codecs="([^"]+)"[^>]*bandwidth="(\d+)"(?:[^>]*width="(\d+)" height="(\d+)")?/g)].map(
    (m) => ({ id: Number(m[1]), codecs: m[2], bandwidth: Number(m[3]), width: Number(m[4]), height: Number(m[5]) }),
  );
  const fps = mpd.match(/frameRate="(\d+)(?:\/(\d+))?"/);
  const frameRate = fps ? (Number(fps[1]) / Number(fps[2] ?? 1)).toFixed(3) : undefined;
  const aac = hasAudio ? reps.find((r) => r.id === 2 * n + 1) : undefined;

  // HLS의 BANDWIDTH는 "최고" 비트레이트여야 해요 → 실제 조각 파일 크기로 계산
  const peak = (id) => {
    const files = readdirSync(dir).filter((f) => f.startsWith(`seg-${id}-`));
    const max = Math.max(...files.map((f) => statSync(join(dir, f)).size));
    return Math.ceil((max * 8) / SEGMENT_SEC);
  };

  const lines = ['#EXTM3U', '#EXT-X-VERSION:7', '#EXT-X-INDEPENDENT-SEGMENTS'];
  if (aac) {
    lines.push(`#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aac",NAME="기본",LANGUAGE="und",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="media_${aac.id}.m3u8"`);
  }
  for (const r of reps.filter((r) => r.id >= n && r.id < 2 * n)) {
    const avg = r.bandwidth + (aac?.bandwidth ?? 0);
    // 최고값은 평균보다 작을 수 없어요 (짧은 영상은 마지막 조각이 짧아서 계산값이 작게 나올 수 있음)
    const bw = Math.max(peak(r.id) + (aac ? peak(aac.id) : 0), Math.ceil(avg * 1.1));
    const codecs = aac ? `${r.codecs},${aac.codecs}` : r.codecs;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bw},AVERAGE-BANDWIDTH=${avg},CODECS="${codecs}",RESOLUTION=${r.width}x${r.height}` +
        (frameRate ? `,FRAME-RATE=${frameRate}` : '') +
        (aac ? ',AUDIO="aac"' : ''),
      `media_${r.id}.m3u8`,
    );
  }
  writeFileSync(join(dir, 'hls.m3u8'), lines.join('\n') + '\n');
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SOURCES);
for (const id of ids) {
  if (!SOURCES[id]) throw new Error(`알 수 없는 영상: ${id}`);
  encode(id);
}
console.log('완료:', OUT);
