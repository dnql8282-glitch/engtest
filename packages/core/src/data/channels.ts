import type { Channel } from '../types';

// 가짜(mock) 채널 데이터. 채널은 가상의 채널이고, 영상은 공개 라이선스 작품이에요(videos.ts 참고).
export const channels: Channel[] = [
  { id: 'c1', name: '오픈무비 극장', subscribers: 1_230_000, avatarColor: '#e11d48' },
  { id: 'c2', name: '예고편 모음', subscribers: 452_000, avatarColor: '#f59e0b' },
  { id: 'c3', name: 'SF 매니아', subscribers: 89_400, avatarColor: '#3b82f6' },
  { id: 'c4', name: '산책하는 하루', subscribers: 27_800, avatarColor: '#22c55e' },
  { id: 'c5', name: '자연 다큐 한 컷', subscribers: 640_000, avatarColor: '#14b8a6' },
  { id: 'c6', name: '개발자 도구함', subscribers: 315_000, avatarColor: '#a855f7' },
];
