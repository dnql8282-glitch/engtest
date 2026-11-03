// 앱 전체에서 쓰는 데이터 모양(타입) 정의
// core 폴더는 React나 브라우저에 의존하지 않아서, 나중에 React Native 앱으로 그대로 가져갈 수 있어요.

export interface Channel {
  id: string;
  name: string;
  subscribers: number;
  avatarColor: string; // 프로필 이미지 대신 쓰는 색
}

export type Category = '전체' | '음악' | '게임' | '프로그래밍' | '요리' | '여행' | '스포츠';

export interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  category: Exclude<Category, '전체'>;
  views: number;
  likes: number;
  durationSec: number;
  uploadedAt: string; // ISO 날짜 문자열
  thumbnailColors: [string, string]; // 썸네일 그라데이션 색
  videoUrl: string;
}

// 화면에서 쓰기 편하도록 영상에 채널 정보를 붙인 형태
export interface VideoWithChannel extends Video {
  channel: Channel;
}
