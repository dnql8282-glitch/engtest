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

import { mediaUrl, setMediaBase } from './media';

describe('미디어 주소', () => {
  it('기본은 그대로, 기준 주소를 정하면 앞에 붙이고, 전체 주소는 건드리지 않는다', () => {
    expect(mediaUrl('/thumbs/v1.jpg')).toBe('/thumbs/v1.jpg');
    setMediaBase('http://192.168.0.10:5173/');
    expect(mediaUrl('/thumbs/v1.jpg')).toBe('http://192.168.0.10:5173/thumbs/v1.jpg');
    expect(mediaUrl('https://example.com/a.mp4')).toBe('https://example.com/a.mp4');
    setMediaBase('');
  });
});

import { accountStore, resetAccountStoreForTest } from './accountStore';
import { isFinished, resumePosition } from './userStore';
import { addComment, getComments } from './commentService';

describe('계정별 데이터', () => {
  beforeEach(() => resetAccountStoreForTest());

  it('계정마다 구독·시청 위치가 따로 저장되고, 다시 로그인하면 그대로 돌아온다', async () => {
    await accountStore.init();
    await accountStore.signIn({ id: 'google:1', provider: 'google', name: '민수' });
    userStore.toggleSubscription('c4');
    userStore.saveProgress('v1', 120, 596);
    await Promise.resolve();

    await accountStore.createLocal('테스트');
    expect(userStore.getSnapshot().subscriptions).not.toContain('c4');
    expect(userStore.getSnapshot().progress.v1).toBeUndefined();

    await accountStore.switchTo('google:1');
    expect(userStore.getSnapshot().subscriptions).toContain('c4');
    expect(userStore.getSnapshot().progress.v1.t).toBe(120);
    expect(accountStore.getSnapshot().accounts).toHaveLength(2);
  });

  it('로그아웃하면 게스트, 로그인 정보는 남는다', async () => {
    await accountStore.init();
    await accountStore.signIn({ id: 'google:2', provider: 'google', name: '지수' });
    await accountStore.signOut();
    expect(accountStore.getSnapshot().currentId).toBeNull();
    expect(accountStore.getSnapshot().accounts.map((a) => a.id)).toEqual(['google:2']);
  });

  it('댓글은 모든 계정에 보이지만 "내 댓글"은 쓴 계정에서만', async () => {
    await accountStore.init();
    await accountStore.signIn({ id: 'google:3', provider: 'google', name: '하늘' });
    await addComment('v1', '안녕하세요');
    expect((await getComments('v1'))[0]).toMatchObject({ author: '@하늘', mine: true });
    await accountStore.createLocal('다른사람');
    expect((await getComments('v1'))[0]).toMatchObject({ author: '@하늘', mine: false });
  });
});

describe('시청 위치', () => {
  it('거의 다 본 영상은 "다 봄", 이어 보기는 처음 5초·다 본 영상이면 처음부터', () => {
    expect(isFinished({ t: 590, d: 596, at: '' })).toBe(true);
    expect(isFinished({ t: 300, d: 596, at: '' })).toBe(false);
    expect(resumePosition({ t: 300, d: 596, at: '' })).toBe(300);
    expect(resumePosition({ t: 3, d: 596, at: '' })).toBe(0);
    expect(resumePosition({ t: 595, d: 596, at: '' })).toBe(0);
    expect(resumePosition(undefined)).toBe(0);
  });

  it('보던 영상을 기억하고, 끝까지 보면 지운다', () => {
    userStore.saveProgress('v2', 10, 33);
    expect(userStore.getSnapshot().lastSession?.videoId).toBe('v2');
    userStore.saveProgress('v2', 33, 33);
    expect(userStore.getSnapshot().lastSession).toBeNull();
  });
});
