#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// 스토리보드(타임바 미리보기 장면) 만들기 — YouTube와 같은 방식
//
//  영상에서 일정 간격으로 작은 장면(160x90)을 뽑아 한 장의 큰 이미지(스프라이트)에 바둑판처럼 붙여요.
//  타임바 위에 마우스를 올리면 그 시간에 해당하는 칸만 잘라서 보여줘요.
//  (장면마다 이미지를 따로 받으면 요청이 수백 번이지만, 한 장으로 묶으면 한 번이면 돼요)
//
//  긴 영화도 파일 전체를 받지 않아요: 필요한 시점으로 바로 건너뛰어(-ss) 한 프레임씩 읽어요.
//  결과: apps/web/public/storyboards/<id>.jpg  +  packages/core/src/data/storyboards.ts (칸 정보)
//
//  사용법: npm run storyboard   (ffmpeg 필요)
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'apps', 'web', 'public', 'storyboards');
const DATA = join(ROOT, 'packages', 'core', 'src', 'data', 'storyboards.ts');

// 각 영상의 원본 (videos.ts의 videoUrl과 같음, 예고편은 고화질 원본)
const SOURCES = {
  v1: 'https://media.w3.org/2010/05/bunny/movie.mp4',
  v2: 'https://download.blender.org/peach/trailer/trailer_1080p.mov',
  v3: 'https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4',
  v4: 'https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4',
  v5: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
  v6: 'https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov',
  v7: 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4',
  v8: 'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
  v9: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
  v10: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
  v11: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  v12: 'https://media.w3.org/2010/05/video/movie_300.mp4',
};

const W = 160, H = 90, COLS = 10, MAX_FRAMES = 100, PARALLEL = 4;

function duration(url) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', url], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

function grab(url, t, file) {
  return new Promise((resolve) => {
    // 원본 비율을 지키며 160x90 칸에 맞추고 남는 곳은 검게 (레터박스)
    const p = spawn('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(2), '-i', url, '-frames:v', '1',
      '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`, file]);
    p.on('close', (code) => resolve(code === 0));
  });
}

async function build(id) {
  const url = SOURCES[id];
  const d = duration(url);
  // 간격: 짧은 영상은 1초, 긴 영상은 최대 100칸이 되도록 (예: 10분 → 6초 간격)
  const interval = Math.max(1, Math.ceil(d / MAX_FRAMES));
  const count = Math.max(1, Math.floor(d / interval));
  const dir = join(tmpdir(), `sb-${id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const times = Array.from({ length: count }, (_, i) => Math.min(d - 0.5, i * interval + interval / 2));
  let next = 0;
  const worker = async () => {
    while (next < times.length) {
      const i = next++;
      const file = join(dir, `f${String(i).padStart(3, '0')}.jpg`);
      if (!(await grab(url, times[i], file))) await grab(url, Math.max(0, times[i] - 1), file); // 실패하면 1초 앞에서 다시
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  // 칸들을 바둑판으로 이어 붙이기 (tile 필터)
  const rows = Math.ceil(count / COLS);
  mkdirSync(OUT, { recursive: true });
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', join(dir, 'f%03d.jpg'), '-vf', `tile=${COLS}x${rows}`, '-frames:v', '1', '-q:v', '5', join(OUT, `${id}.jpg`)], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  rmSync(dir, { recursive: true, force: true });
  console.log(`✓ ${id}: ${Math.round(d)}초, ${count}칸 (${interval}초 간격)`);
  return { id, interval, count, cols: COLS, w: W, h: H };
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SOURCES);
const results = [];
for (const id of ids) results.push(await build(id));

// core에서 읽을 칸 정보 파일 (자동 생성)
const lines = [
  '// 자동 생성 파일 — tools/encode/storyboard.mjs 가 만들어요. 직접 고치지 마세요.',
  "import type { Storyboard } from '../types';",
  '',
  'export const storyboards: Record<string, Storyboard> = {',
  ...results.map((s) => `  ${s.id}: { url: '/storyboards/${s.id}.jpg', interval: ${s.interval}, count: ${s.count}, cols: ${s.cols}, w: ${s.w}, h: ${s.h} },`),
  '};',
  '',
];
writeFileSync(DATA, lines.join('\n'));
console.log('완료:', DATA);
