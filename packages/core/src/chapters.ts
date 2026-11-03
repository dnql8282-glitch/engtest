import type { Chapter } from './types';

// 챕터·타임바 관련 순수 함수들 (화면과 무관, 테스트 가능)

/** 시간 t가 속한 챕터 번호 (챕터가 없으면 -1) */
export function chapterIndexAt(chapters: Chapter[], t: number): number {
  let idx = -1;
  for (let i = 0; i < chapters.length; i++) if (chapters[i].start <= t) idx = i;
  return idx;
}

/** 챕터 구간들: [시작, 끝) — 마지막 챕터는 영상 끝까지 */
export function chapterRanges(chapters: Chapter[], duration: number): { start: number; end: number; title: string }[] {
  return chapters.map((c, i) => ({ start: c.start, end: chapters[i + 1]?.start ?? duration, title: c.title }));
}

/**
 * 이전/다음 챕터로 이동할 시간 (YouTube: Ctrl+←/→)
 *  이전: 지금 챕터가 시작한 지 3초가 지났으면 지금 챕터 처음으로, 아니면 앞 챕터로
 */
export function adjacentChapterTime(chapters: Chapter[], t: number, dir: -1 | 1): number | null {
  if (chapters.length === 0) return null;
  const i = chapterIndexAt(chapters, t);
  if (dir === 1) return chapters[i + 1]?.start ?? null;
  if (i >= 0 && t - chapters[i].start > 3) return chapters[i].start;
  return chapters[Math.max(0, i - 1)].start;
}

/**
 * 끌어서 이동할 때 챕터 경계에 "착" 붙기 (YouTube처럼 경계 근처에서 살짝 끌어당김)
 *  ratio: 0~1 위치, threshold: 경계와 이 거리(비율) 안이면 경계로
 */
export function snapToChapter(chapters: Chapter[], duration: number, ratio: number, threshold: number): { ratio: number; snapped: boolean } {
  for (const c of chapters) {
    if (c.start === 0) continue;
    const r = c.start / duration;
    if (Math.abs(r - ratio) <= threshold) return { ratio: r, snapped: true };
  }
  return { ratio, snapped: false };
}

/** "3:15", "1:02:05" 같은 시간 글자를 초로 (아니면 null) */
export function parseTimestamp(s: string): number | null {
  const m = s.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** 글 안의 시간 표시(예: "3:15 부분")를 찾아 [글, 시간, 글, …] 조각으로 나눠요 → 화면에서 시간만 링크로 */
export function splitTimestamps(text: string): (string | { label: string; seconds: number })[] {
  const out: (string | { label: string; seconds: number })[] = [];
  const re = /\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const sec = parseTimestamp(m[0]);
    if (sec === null) continue;
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push({ label: m[0], seconds: sec });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * "가장 많이 다시 본 장면" 그래프 값 (0~1, n개)
 *  실제 YouTube는 수많은 시청자의 되감기 기록으로 만들지만, 여기는 시청자가 없어서
 *  영상 id로 정해지는 의사 난수 + 챕터 시작·절정 부분 봉우리로 그럴듯한 모양을 만들어요(항상 같은 모양).
 */
export function mostReplayed(videoId: string, chapters: Chapter[], duration: number, n = 100): number[] {
  let seed = 0;
  for (const ch of videoId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const raw = Array.from({ length: n }, () => 0.15 + rand() * 0.25);
  const bump = (center: number, width: number, height: number) => {
    for (let i = 0; i < n; i++) raw[i] += height * Math.exp(-(((i - center) / width) ** 2));
  };
  bump(1, 2, 0.5); // 시작 부분은 다들 봐요
  for (const c of chapters) if (c.start > 0) bump((c.start / duration) * n, 2.5, 0.35 + rand() * 0.3);
  bump(n * (0.55 + rand() * 0.3), 3, 0.8); // 절정 장면
  // 부드럽게 (이동 평균)
  const smooth = raw.map((_, i) => {
    let sum = 0;
    let cnt = 0;
    for (let k = -2; k <= 2; k++) if (raw[i + k] !== undefined) (sum += raw[i + k]), cnt++;
    return sum / cnt;
  });
  const max = Math.max(...smooth);
  return smooth.map((v) => v / max);
}
