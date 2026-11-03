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

export const categories: Category[] = ['전체', '애니메이션', 'SF', '판타지', '예고편', '브이로그', '자연', '개발'];

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

/** 인기 급상승: 조회수 순 */
export async function getTrending(): Promise<VideoWithChannel[]> {
  await delay(200);
  return allWithChannel().sort((a, b) => b.views - a.views);
}

/** 여러 채널의 영상을 최신순으로 (구독 피드). 키는 "c1,c2" 형태 문자열 */
export async function getFeedForChannels(channelIdsKey: string): Promise<VideoWithChannel[]> {
  await delay(200);
  const ids = channelIdsKey ? channelIdsKey.split(',') : [];
  return allWithChannel()
    .filter((v) => ids.includes(v.channelId))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** ID 목록 순서 그대로 영상들을 돌려줘요 (시청 기록, 재생목록). 키는 "v1,v2" 형태 */
export async function getVideosByIds(videoIdsKey: string): Promise<VideoWithChannel[]> {
  await delay(150);
  const ids = videoIdsKey ? videoIdsKey.split(',') : [];
  return ids.map((id) => withChannel(id)).filter((v): v is VideoWithChannel => v !== undefined);
}

export interface ChannelPageData {
  channel: Channel;
  videos: VideoWithChannel[];
}

export async function getChannelPage(channelId: string): Promise<ChannelPageData | null> {
  await delay(200);
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) return null;
  const list = allWithChannel()
    .filter((v) => v.channelId === channelId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return { channel, videos: list };
}

/** Shorts: 60초 이하 영상 (최신순) */
export const SHORTS_MAX_SEC = 60;
export async function getShorts(): Promise<VideoWithChannel[]> {
  await delay(150);
  return allWithChannel()
    .filter((v) => v.durationSec <= SHORTS_MAX_SEC)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

// ── 알림: 구독한 채널의 최근 업로드 ──────────────────────────────────────────
export interface Notification {
  id: string;
  video: VideoWithChannel;
  createdAt: string;
}

/** 구독 채널 키("c1,c2")로 최근 업로드 알림 목록 (최신순, 최대 limit개) */
export async function getNotifications(channelIdsKey: string, limit = 8): Promise<Notification[]> {
  await delay(120);
  const ids = channelIdsKey ? channelIdsKey.split(',') : [];
  return allWithChannel()
    .filter((v) => ids.includes(v.channelId))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, limit)
    .map((v) => ({ id: `n-${v.id}`, video: v, createdAt: v.uploadedAt }));
}

/** 읽지 않은 알림 수: 마지막으로 알림을 열어 본 뒤에 생긴 것 */
export function countUnread(list: Notification[], seenAt: string | null): number {
  if (!seenAt) return list.length;
  return list.filter((n) => n.createdAt > seenAt).length;
}

// ── 채널 영상 정렬 ──────────────────────────────────────────────────────────
export type ChannelSort = 'latest' | 'popular' | 'oldest';

export function sortChannelVideos(list: VideoWithChannel[], sort: ChannelSort): VideoWithChannel[] {
  const copy = [...list];
  if (sort === 'popular') return copy.sort((a, b) => b.views - a.views);
  if (sort === 'oldest') return copy.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
  return copy.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
