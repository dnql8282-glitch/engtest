import { useSyncExternalStore } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 앱 전체에서 딱 하나만 쓰는 <video> 요소.
// 시청 페이지 ↔ 미니 플레이어로 옮겨 다녀도 같은 요소라서 재생이 끊기지 않아요.
// (브라우저는 미디어 요소를 같은 순간에 다른 곳으로 옮기면 멈추지 않고 계속 재생해요.)
//
// 이 요소의 상태(재생 중?, 현재 시간, 볼륨 …)를 React가 읽을 수 있게
// userStore와 같은 "구독(subscribe) + 스냅샷" 방식으로 감싸요.
// ─────────────────────────────────────────────────────────────────────────────

export const video: HTMLVideoElement = document.createElement('video');
video.playsInline = true;
video.preload = 'auto';
video.className = 'player-video';

export interface PlaybackState {
  playing: boolean;
  waiting: boolean; // 버퍼링 중
  ended: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number; // 미리 받아 둔 지점
  volume: number;
  muted: boolean;
  rate: number;
  hasSource: boolean;
}

function read(): PlaybackState {
  let bufferedEnd = 0;
  const b = video.buffered;
  for (let i = 0; i < b.length; i++) {
    if (b.start(i) <= video.currentTime + 0.5) bufferedEnd = Math.max(bufferedEnd, b.end(i));
  }
  return {
    playing: !video.paused && !video.ended,
    waiting: waiting,
    ended: video.ended,
    currentTime: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    bufferedEnd,
    volume: video.volume,
    muted: video.muted,
    rate: video.playbackRate,
    hasSource: Boolean(video.currentSrc),
  };
}

let waiting = false;
let snapshot = read();
const listeners = new Set<() => void>();

function update() {
  snapshot = read();
  listeners.forEach((l) => l());
}

video.addEventListener('waiting', () => {
  waiting = true;
  update();
});
for (const e of ['playing', 'canplay', 'seeked', 'emptied', 'pause']) {
  video.addEventListener(e, () => {
    waiting = false;
    update();
  });
}
for (const e of ['play', 'timeupdate', 'durationchange', 'progress', 'volumechange', 'ratechange', 'ended', 'loadedmetadata', 'seeking']) {
  video.addEventListener(e, update);
}

export function usePlayback(): PlaybackState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

// ── 조작 함수 (컨트롤 버튼, 키보드 단축키, 미디어 세션이 함께 씀) ──────────
export const controls = {
  toggle() {
    if (video.paused || video.ended) void video.play().catch(() => {});
    else video.pause();
  },
  seekBy(sec: number) {
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + sec));
  },
  seekTo(sec: number) {
    video.currentTime = Math.max(0, Math.min(video.duration || 0, sec));
  },
  setVolume(v: number) {
    video.volume = Math.max(0, Math.min(1, v));
    if (video.volume > 0) video.muted = false;
  },
  toggleMute() {
    video.muted = !video.muted;
  },
  setRate(rate: number) {
    video.playbackRate = rate;
  },
  async togglePictureInPicture() {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* 지원하지 않는 브라우저 */
    }
  },
};
