import type { Channel } from '../types';

// 가짜(mock) 채널 데이터. 서버가 생기면 이 부분만 API 호출로 바꾸면 돼요.
export const channels: Channel[] = [
  { id: 'c1', name: '코딩하는 고양이', subscribers: 1_230_000, avatarColor: '#f97316' },
  { id: 'c2', name: '오늘의 집밥', subscribers: 452_000, avatarColor: '#22c55e' },
  { id: 'c3', name: '여행가 J', subscribers: 89_400, avatarColor: '#3b82f6' },
  { id: 'c4', name: '게임하는 형', subscribers: 2_780_000, avatarColor: '#a855f7' },
  { id: 'c5', name: '로파이 라디오', subscribers: 640_000, avatarColor: '#ec4899' },
  { id: 'c6', name: '스포츠 하이라이트', subscribers: 315_000, avatarColor: '#eab308' },
];
