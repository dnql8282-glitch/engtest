import type { Category, Channel, VideoWithChannel } from './types';
import { videos } from './data/videos';
import { channels } from './data/channels';

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

export async function getVideos(category: Category = '전체'): Promise<VideoWithChannel[]> {
  await delay(200); // 네트워크 지연 흉내
  return videos
    .filter((v) => category === '전체' || v.category === category)
    .map((v) => withChannel(v.id))
    .filter((v): v is VideoWithChannel => v !== undefined);
}

export const categories: Category[] = ['전체', '음악', '게임', '프로그래밍', '요리', '여행', '스포츠'];

// 사이드바 "구독" 목록 (4단계에서 실제 구독 기능과 연결할 예정)
export async function getSubscriptions(): Promise<Channel[]> {
  await delay(100);
  return channels;
}
