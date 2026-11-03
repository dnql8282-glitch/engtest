import { describe, expect, it } from 'vitest';
import type { VideoWithChannel } from './types';
import { searchVideos, suggest, tokenize } from './search';

const channel = { id: 'c', name: '코딩하는 고양이', subscribers: 1, avatarColor: '#000' };
const make = (id: string, title: string, description = '', views = 0): VideoWithChannel => ({
  id, title, description, views, channel, channelId: 'c', category: '프로그래밍', likes: 0,
  durationSec: 1, uploadedAt: '', thumbnailUrl: '', thumbnailColors: ['#000', '#000'], videoUrl: '',
});

const videos = [
  make('a', 'React 입문', 'TypeScript와 함께'),
  make('b', 'TypeScript 기초', '타입 정리', 10),
  make('c', '김치볶음밥 레시피'),
];

describe('search', () => {
  it('띄어쓰기로 단어를 나누고 소문자로 바꾼다', () => {
    expect(tokenize('  React   TypeScript ')).toEqual(['react', 'typescript']);
  });

  it('제목에 맞는 영상이 설명에만 맞는 영상보다 위에 온다', () => {
    expect(searchVideos(videos, 'typescript').map((v) => v.id)).toEqual(['b', 'a']);
  });

  it('모든 단어가 있어야 결과에 포함된다', () => {
    expect(searchVideos(videos, 'react 김치')).toEqual([]);
  });

  it('채널 이름으로도 찾을 수 있다', () => {
    expect(searchVideos(videos, '고양이')).toHaveLength(3);
  });

  it('빈 검색어는 결과가 없다', () => {
    expect(searchVideos(videos, '   ')).toEqual([]);
  });

  it('자동완성은 앞쪽에서 일치하는 것을 먼저 보여준다', () => {
    expect(suggest(videos, '김치')).toEqual(['김치볶음밥 레시피']);
    expect(suggest(videos, 'type')[0]).toBe('TypeScript 기초');
  });
});
