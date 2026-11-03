import type { Category, Channel, VideoWithChannel } from './types';
import { videos } from './data/videos';
import { channels } from './data/channels';
import { searchVideos as runSearch, suggest } from './search';

// "서비스" 계층: 화면은 데이터가 어디서 오는지 몰라도 되게 여기서만 데이터를 다뤄요.
// 지금은 메모리의 가짜 데이터를 쓰지만, 나중에 서버를 붙이면 이 파일 안쪽만 fetch로 바꾸면 됩니다.
// 그래서 일부러 실제 서버처럼 Promise(비동기)로 돌려줘요.

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withChannel(videoId: string): VideoWithChannel | undefined {
  const video = videos.find((v) => v.id === videoId);
  if (!video) return undefined;
  const channel = channels.find((c) => c.id === video.channelId);
  if (!channel) return undefined;
  return { ...video, channel };
}

function allWithChannel(): VideoWithChannel[] {
  return videos
    .map((v) => withChannel(v.id))
    .filter((v): v is VideoWithChannel => v !== undefined);
}

export const categories: Category[] = ['전체', '음악', '게임', '프로그래밍', '요리', '여행', '스포츠'];

export async function getVideos(category: Category = '전체'): Promise<VideoWithChannel[]> {
  await delay(200); // 네트워크 지연 흉내
  return allWithChannel().filter((v) => category === '전체' || v.category === category);
}

/** 영상 하나. 없으면 null (서버의 404 응답에 해당) */
export async function getVideo(id: string): Promise<VideoWithChannel | null> {
  await delay(150);
  return withChannel(id) ?? null;
}

/** 추천 영상: 같은 카테고리 → 같은 채널 → 나머지 순서 */
export async function getRelatedVideos(id: string): Promise<VideoWithChannel[]> {
  await delay(200);
  const current = withChannel(id);
  if (!current) return [];
  const score = (v: VideoWithChannel) =>
    (v.category === current.category ? 2 : 0) + (v.channelId === current.channelId ? 1 : 0);
  return allWithChannel()
    .filter((v) => v.id !== id)
    .sort((a, b) => score(b) - score(a) || b.views - a.views);
}

export async function getChannels(): Promise<Channel[]> {
  await delay(100);
  return channels;
}

/** 검색 결과 (서버가 생기면 GET /search?q=... 에 해당) */
export async function searchVideos(query: string): Promise<VideoWithChannel[]> {
  await delay(250);
  return runSearch(allWithChannel(), query);
}

/** 검색어 자동완성. 타이핑할 때마다 불리니까 지연 없이 바로 돌려줘요. */
export async function getSuggestions(query: string): Promise<string[]> {
  return suggest(allWithChannel(), query);
}
