import { beforeEach, describe, expect, it } from 'vitest';
import type { Comment, VideoWithChannel } from './types';
import { buildThreads } from './commentService';
import { countUnread, sortChannelVideos, type Notification } from './videoService';
import { configureStore, createMemoryStore } from './storage';
import { resetUserStoreForTest, userStore } from './userStore';

beforeEach(() => {
  configureStore(createMemoryStore());
  resetUserStoreForTest();
});

const c = (id: string, likes: number, createdAt: string, extra: Partial<Comment> = {}): Comment => ({
  id, videoId: 'v1', author: '@a', authorColor: '#000', text: id, createdAt, likes, mine: false, ...extra,
});

describe('댓글 묶기·정렬', () => {
  const list = [
    c('a', 10, '2026-01-01'),
    c('b', 50, '2026-01-02'),
    c('mine', 0, '2026-01-03', { mine: true }),
    c('r2', 0, '2026-01-05', { parentId: 'b' }),
    c('r1', 0, '2026-01-04', { parentId: 'b' }),
  ];

  it('인기순: 내 댓글이 맨 위, 나머지는 좋아요 순. 답글은 부모 아래에 오래된 순', () => {
    const t = buildThreads(list, 'top');
    expect(t.map((x) => x.comment.id)).toEqual(['mine', 'b', 'a']);
    expect(t[1].replies.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('최신순', () => {
    expect(buildThreads(list, 'newest').map((x) => x.comment.id)).toEqual(['mine', 'b', 'a']);
    expect(buildThreads([c('x', 0, '2026-02-01'), c('y', 0, '2026-03-01')], 'newest').map((x) => x.comment.id)).toEqual(['y', 'x']);
  });
});

describe('알림', () => {
  const n = (createdAt: string) => ({ id: createdAt, createdAt, video: {} as VideoWithChannel }) as Notification;
  it('한 번도 안 열었으면 전부 안 읽음, 연 뒤로는 그 이후 것만', () => {
    const list = [n('2026-03-01'), n('2026-02-01')];
    expect(countUnread(list, null)).toBe(2);
    expect(countUnread(list, '2026-02-15')).toBe(1);
  });
  it('알림 확인 시각과 댓글 좋아요가 저장된다', () => {
    userStore.markNotificationsSeen(new Date('2026-05-05T00:00:00Z'));
    userStore.toggleCommentLike('c1');
    expect(userStore.getSnapshot().notificationsSeenAt).toBe('2026-05-05T00:00:00.000Z');
    expect(userStore.getSnapshot().likedComments).toEqual(['c1']);
    userStore.toggleCommentLike('c1');
    expect(userStore.getSnapshot().likedComments).toEqual([]);
  });
});

describe('채널 영상 정렬', () => {
  const v = (id: string, views: number, uploadedAt: string) => ({ id, views, uploadedAt }) as VideoWithChannel;
  const list = [v('a', 5, '2026-01-02'), v('b', 9, '2026-01-01'), v('c', 1, '2026-01-03')];
  it('최신순 / 인기순 / 오래된 순', () => {
    expect(sortChannelVideos(list, 'latest').map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(sortChannelVideos(list, 'popular').map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(sortChannelVideos(list, 'oldest').map((x) => x.id)).toEqual(['b', 'a', 'c']);
  });
});
