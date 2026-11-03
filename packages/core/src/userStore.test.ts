import { beforeEach, describe, expect, it } from 'vitest';
import { configureStore, createMemoryStore, readScoped } from './storage';
import { resetUserStoreForTest, userStore } from './userStore';
import { addComment, deleteComment, getComments } from './commentService';

beforeEach(() => {
  configureStore(createMemoryStore());
  resetUserStoreForTest();
});

describe('userStore', () => {
  it('처음 실행하면 기본 구독 채널을 불러온다', async () => {
    await userStore.init();
    expect(userStore.getSnapshot().subscriptions).toEqual(['c1', 'c2', 'c5']);
  });

  it('구독을 토글하고 저장소에 기록한다', async () => {
    await userStore.init();
    userStore.toggleSubscription('c3');
    expect(userStore.isSubscribed('c3')).toBe(true);
    await Promise.resolve();
    expect(await readScoped('subscriptions', [])).toContain('c3');
    userStore.toggleSubscription('c3');
    expect(userStore.isSubscribed('c3')).toBe(false);
  });

  it('같은 평가를 다시 누르면 취소되고, 반대 평가는 바뀐다', async () => {
    await userStore.init();
    userStore.toggleRating('v1', 'like');
    expect(userStore.getSnapshot().ratings.v1).toBe('like');
    userStore.toggleRating('v1', 'dislike');
    expect(userStore.getSnapshot().ratings.v1).toBe('dislike');
    userStore.toggleRating('v1', 'dislike');
    expect(userStore.getSnapshot().ratings.v1).toBeNull();
  });

  it('상태가 바뀌면 구독자에게 알리고, 매번 새 객체를 만든다', async () => {
    let calls = 0;
    userStore.subscribe(() => calls++);
    const before = userStore.getSnapshot();
    await userStore.init();
    expect(calls).toBe(1);
    expect(userStore.getSnapshot()).not.toBe(before);
  });
});

describe('commentService', () => {
  it('내 댓글은 맨 위에 오고, 삭제할 수 있다', async () => {
    const seeded = await getComments('v1');
    const mine = await addComment('v1', '  좋은 영상! ');
    const after = await getComments('v1');
    expect(after).toHaveLength(seeded.length + 1);
    expect(after[0]).toMatchObject({ text: '좋은 영상!', mine: true });
    await deleteComment(mine.id);
    expect(await getComments('v1')).toHaveLength(seeded.length);
  });

  it('빈 댓글은 거부한다', async () => {
    await expect(addComment('v1', '   ')).rejects.toThrow();
  });
});

import { playerStore } from './playerStore';

describe('playerStore', () => {
  it('열기 → 접기 → 펼치기 → 닫기', () => {
    playerStore.open('v1');
    expect(playerStore.getSnapshot()).toEqual({ videoId: 'v1', mode: 'full' });
    playerStore.minimize();
    expect(playerStore.getSnapshot().mode).toBe('mini');
    playerStore.open('v2'); // 다른 영상을 열면 다시 전체 화면
    expect(playerStore.getSnapshot()).toEqual({ videoId: 'v2', mode: 'full' });
    playerStore.close();
    expect(playerStore.getSnapshot()).toEqual({ videoId: null, mode: null });
    playerStore.expand(); // 영상이 없으면 아무 일도 안 일어남
    expect(playerStore.getSnapshot().mode).toBeNull();
  });
});
