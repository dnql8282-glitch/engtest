import { useSyncExternalStore } from 'react';
import type shakaNs from 'shaka-player';
import type { Video } from '@mytube/core/types';
import { video } from './playback';

// ─────────────────────────────────────────────────────────────────────────────
// 적응형 스트리밍 (YouTube 방식)
//
//  YouTube 웹 플레이어는 영상을 통째로 받지 않아요. 화질별·코덱별로 미리 잘라 둔 4~5초 조각을
//  인터넷 속도에 맞춰 골라 받으며(ABR), 브라우저의 MediaSource API로 이어 붙여 재생해요.
//  여기서는 같은 일을 Google의 오픈소스 플레이어 "Shaka Player"가 해요.
//
//  코덱 선택 순서 (기기가 지원하고, 가능하면 하드웨어로 부드럽게 재생할 수 있는 것 우선):
//    영상: AV1 → H.264      오디오: Opus → AAC
//
//  스트리밍 버전이 없는 영상은 기존처럼 MP4 파일 하나를 재생해요(화질 선택 불가).
// ─────────────────────────────────────────────────────────────────────────────

type Shaka = typeof shakaNs;
type ShakaPlayer = shakaNs.Player;

export interface QualityOption {
  height: number;
  label: string; // "1080p HD"
}

export interface StreamState {
  kind: 'stream' | 'file' | 'none';
  auto: boolean; // 자동 화질 (ABR)
  qualities: QualityOption[]; // 높은 화질부터
  activeHeight: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  audioSampleRate: number | null;
  audioChannels: number | null;
}

const EMPTY: StreamState = {
  kind: 'none',
  auto: true,
  qualities: [],
  activeHeight: null,
  videoCodec: null,
  audioCodec: null,
  audioSampleRate: null,
  audioChannels: null,
};

let state = EMPTY;
const listeners = new Set<() => void>();
const emit = (next: Partial<StreamState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export function useStreamState(): StreamState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// Shaka Player는 크기가 커서(수백 KB) 처음 영상을 틀 때 한 번만 따로 불러와요 (코드 분할)
let ready: Promise<{ shaka: Shaka; player: ShakaPlayer } | null> | null = null;

function getPlayer() {
  ready ??= (async () => {
    const shaka = (await import('shaka-player')).default as unknown as Shaka;
    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) return null;
    const player = new shaka.Player();
    await player.attach(video);
    player.configure({
      preferredVideo: [{ codec: 'av01' }, { codec: 'avc1' }],
      preferredAudio: [{ codec: 'opus' }, { codec: 'mp4a' }],
      // MediaCapabilities로 "부드럽게·전력 효율적으로" 재생 가능한 코덱을 먼저 고름
      // (예: AV1 하드웨어 디코더가 없는 기기는 H.264로)
      preferredDecodingAttributes: ['smooth', 'powerEfficient'],
      abr: { enabled: true },
      streaming: { bufferingGoal: 30, rebufferingGoal: 2 },
    } as unknown as shakaNs.extern.PlayerConfiguration);
    for (const e of ['trackschanged', 'variantchanged', 'adaptation', 'loaded']) {
      player.addEventListener(e, () => refresh(player));
    }
    return { shaka, player };
  })();
  return ready;
}

function refresh(player: ShakaPlayer) {
  const tracks = player.getVariantTracks();
  const active = tracks.find((t) => t.active);
  // 지금 쓰는 코덱 계열의 화질만 보여줘요 (AV1 재생 중이면 AV1 화질 목록)
  const family = active?.videoCodec?.slice(0, 4);
  const heights = [...new Set(tracks.filter((t) => t.videoCodec?.slice(0, 4) === family && t.height).map((t) => t.height!))].sort((a, b) => b - a);
  emit({
    kind: 'stream',
    auto: player.getConfiguration().abr.enabled,
    qualities: heights.map((h) => ({ height: h, label: `${h}p${h >= 720 ? ' HD' : ''}` })),
    activeHeight: active?.height ?? null,
    videoCodec: active?.videoCodec ?? null,
    audioCodec: active?.audioCodec ?? null,
    audioSampleRate: active?.audioSamplingRate ?? null,
    audioChannels: active?.channelsCount ?? null,
  });
}

// 공유 링크(?t=초)로 들어왔을 때 "이 영상은 이 시점부터"를 잠깐 기억해 뒀다가 불러올 때 넘겨줘요.
// (불러온 뒤에 따로 이동시키면 플레이어가 처음 위치로 되돌려 버릴 수 있어서)
let pendingStart: { id: string; t: number } | null = null;
export function requestStartAt(videoId: string, t: number) {
  pendingStart = { id: videoId, t };
}
export function hasPendingStart(videoId: string) {
  return pendingStart?.id === videoId;
}

/** 영상 불러오기: 스트리밍(DASH) → 안 되면 HLS(구형 iPhone) → 안 되면 MP4 파일 */
export async function loadVideo(v: Video) {
  const startAt = pendingStart?.id === v.id ? pendingStart.t : undefined;
  pendingStart = null;
  const p = await getPlayer();
  if (v.stream && p) {
    try {
      await p.player.load(v.stream.dash, startAt ?? null);
      refresh(p.player);
      return;
    } catch (e) {
      // 다른 영상으로 바뀌어서 중단된 경우(코드 7000)는 정상 — 아무것도 안 해요
      if ((e as { code?: number }).code === 7000 || video.dataset.videoId !== v.id) return;
      console.warn('스트리밍 재생 실패, MP4로 전환', e);
    }
  }
  if (v.stream && !p && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = v.stream.hls + (startAt ? `#t=${startAt}` : ''); // MediaSource가 없는 구형 iOS: 브라우저 내장 HLS
    emit({ ...EMPTY, kind: 'stream' });
    return;
  }
  if (video.dataset.videoId !== v.id) return; // 기다리는 사이 다른 영상으로 바뀜
  if (p) await p.player.load(v.videoUrl, startAt ?? null, 'video/mp4').catch(() => {});
  else video.src = v.videoUrl + (startAt ? `#t=${startAt}` : '');
  const onMeta = () => emit({ ...EMPTY, kind: 'file', activeHeight: video.videoHeight || null });
  video.addEventListener('loadedmetadata', onMeta, { once: true });
  emit({ ...EMPTY, kind: 'file' });
}

export async function unloadVideo() {
  const p = await ready;
  if (p) await p.player.unload().catch(() => {});
  else {
    video.removeAttribute('src');
    video.load();
  }
  emit(EMPTY);
}

/** 화질 고르기: null = 자동 */
export async function selectQuality(height: number | null) {
  const p = await ready;
  if (!p) return;
  if (height === null) {
    p.player.configure({ abr: { enabled: true } } as unknown as shakaNs.extern.PlayerConfiguration);
  } else {
    const tracks = p.player.getVariantTracks();
    const active = tracks.find((t) => t.active);
    const pick =
      tracks.find((t) => t.height === height && t.videoCodec === active?.videoCodec && t.audioCodec === active?.audioCodec) ??
      tracks.find((t) => t.height === height);
    if (!pick) return;
    p.player.configure({ abr: { enabled: false } } as unknown as shakaNs.extern.PlayerConfiguration);
    p.player.selectVariantTrack(pick, /* 버퍼 비우고 바로 바꾸기 */ true);
  }
  refresh(p.player);
}

/** 전문가용 통계에 쓰는 값들 */
export async function readStats() {
  const p = await ready;
  const q = video.getVideoPlaybackQuality?.();
  let bufferAhead = 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
      bufferAhead = video.buffered.end(i) - video.currentTime;
    }
  }
  const s = p?.player.getStats();
  const active = p?.player.getVariantTracks().find((t) => t.active);
  return {
    width: video.videoWidth,
    height: video.videoHeight,
    viewport: `${video.clientWidth}x${video.clientHeight}`,
    droppedFrames: q?.droppedVideoFrames ?? 0,
    totalFrames: q?.totalVideoFrames ?? 0,
    bufferAhead,
    estimatedBandwidth: s?.estimatedBandwidth ?? 0,
    streamBandwidth: s?.streamBandwidth ?? 0,
    bytesDownloaded: s?.bytesDownloaded ?? 0,
    videoBandwidth: active?.videoBandwidth ?? null,
    audioBandwidth: active?.audioBandwidth ?? null,
    frameRate: active?.frameRate ?? null,
  };
}
