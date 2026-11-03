import type { VideoWithChannel } from './types';

// 검색 규칙 (순수 함수라 화면 없이 테스트할 수 있어요)
// - 검색어를 띄어쓰기로 나눈 "모든 단어"가 영상 정보 어딘가에 있어야 결과에 포함
// - 대소문자 구분 없음
// - 제목에 맞으면 점수가 더 높아서 위로 올라와요

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

export function scoreVideo(video: VideoWithChannel, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const title = video.title.toLowerCase();
  const fields = [title, video.description, video.channel.name, video.category].join(' ').toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (!fields.includes(t)) return 0; // 하나라도 없으면 탈락
    score += title.includes(t) ? 3 : 1;
  }
  return score;
}

export function searchVideos(videos: VideoWithChannel[], query: string): VideoWithChannel[] {
  const tokens = tokenize(query);
  return videos
    .map((v) => ({ v, s: scoreVideo(v, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.v.views - a.v.views)
    .map((x) => x.v);
}

/** 자동완성: 입력한 글자가 들어 있는 제목·채널명 최대 limit개 */
export function suggest(videos: VideoWithChannel[], query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = new Set<string>();
  for (const v of videos) {
    pool.add(v.title);
    pool.add(v.channel.name);
  }
  return [...pool]
    .filter((s) => s.toLowerCase().includes(q))
    .sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q))
    .slice(0, limit);
}
