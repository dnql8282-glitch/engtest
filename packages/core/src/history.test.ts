import { beforeEach, describe, expect, it } from 'vitest';
import { groupHistoryByDay } from './history';
import { configureStore, createMemoryStore } from './storage';
import { likedVideoIds, resetUserStoreForTest, userStore } from './userStore';

beforeEach(() => {
  configureStore(createMemoryStore());
  resetUserStoreForTest();
});

describe('시청 기록', () => {
  it('같은 영상을 다시 보면 중복 없이 맨 앞으로 온다', () => {
    userStore.recordWatch('v1');
    userStore.recordWatch('v2');
    userStore.recordWatch('v1');
    expect(userStore.getSnapshot().history.map((h) => h.videoId)).toEqual(['v1', 'v2']);
  });

  it('하나 삭제, 전체 삭제', () => {
    userStore.recordWatch('v1');
    userStore.recordWatch('v2');
    userStore.removeFromHistory('v1');
    expect(userStore.getSnapshot().history.map((h) => h.videoId)).toEqual(['v2']);
    userStore.clearHistory();
    expect(userStore.getSnapshot().history).toEqual([]);
  });

  it('날짜별로 오늘/어제/날짜 묶음을 만든다', () => {
    const now = new Date(2026, 10, 3, 15);
    const at = (d: number, h: number) => new Date(2026, 10, d, h).toISOString();
    const groups = groupHistoryByDay(
      [
        { videoId: 'a', watchedAt: at(3, 10) },
        { videoId: 'b', watchedAt: at(3, 9) },
        { videoId: 'c', watchedAt: at(2, 22) },
        { videoId: 'd', watchedAt: at(1, 8) },
      ],
      now,
    );
    expect(groups.map((g) => [g.label, g.entries.length])).toEqual([
      ['오늘', 2],
      ['어제', 1],
      ['11월 1일', 1],
    ]);
  });
});

describe('나중에 볼 동영상 / 좋아요 목록', () => {
  it('나중에 볼 동영상은 토글되고 최근 것이 앞에 온다', () => {
    userStore.toggleWatchLater('v1');
    userStore.toggleWatchLater('v2');
    expect(userStore.getSnapshot().watchLater).toEqual(['v2', 'v1']);
    userStore.toggleWatchLater('v2');
    expect(userStore.getSnapshot().watchLater).toEqual(['v1']);
  });

  it('좋아요 목록은 ratings에서 계산된다', () => {
    userStore.toggleRating('v1', 'like');
    userStore.toggleRating('v2', 'dislike');
    userStore.toggleRating('v3', 'like');
    expect(likedVideoIds(userStore.getSnapshot()).sort()).toEqual(['v1', 'v3']);
  });
});
