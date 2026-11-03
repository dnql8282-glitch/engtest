// 앱 전체에서 쓰는 데이터 모양(타입) 정의
// core 폴더는 React나 브라우저에 의존하지 않아서, 나중에 React Native 앱으로 그대로 가져갈 수 있어요.

export interface Channel {
  id: string;
  name: string;
  subscribers: number;
  avatarColor: string; // 프로필 이미지 대신 쓰는 색
}

export type Category = '전체' | '애니메이션' | 'SF' | '판타지' | '예고편' | '브이로그' | '자연' | '개발';

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
  thumbnailUrl: string;
  thumbnailColors: [string, string]; // 썸네일 이미지가 뜨기 전에 보여줄 배경색
  videoUrl: string;
}

// 화면에서 쓰기 편하도록 영상에 채널 정보를 붙인 형태
export interface VideoWithChannel extends Video {
  channel: Channel;
}

export type Rating = 'like' | 'dislike' | null;

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  authorColor: string;
  text: string;
  createdAt: string;
  likes: number;
  mine: boolean; // 내가 쓴 댓글이면 삭제 가능
  parentId?: string; // 답글이면 원래 댓글의 id
}

export type CommentSort = 'top' | 'newest';
