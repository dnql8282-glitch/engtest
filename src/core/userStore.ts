import type { Rating } from './types';
import { readJson, writeJson } from './storage';

// 사용자 데이터 저장소 (전역 상태)
// 구독 목록, 좋아요/싫어요처럼 "여러 화면이 함께 보는 데이터"를 한 곳에서 관리해요.
//   - 시청 페이지에서 구독하면 → 사이드바 구독 목록도 바로 바뀌어야 함
//   - 이렇게 여러 화면이 같은 데이터를 봐야 할 때 전역 상태가 필요해요.
// React를 쓰지 않는 순수 TypeScript라서 모바일 앱에서도 그대로 쓸 수 있어요.
// 화면은 subscribe()로 "바뀌면 알려줘"라고 등록하고, getSnapshot()으로 현재 값을 읽어요.

export interface UserState {
  loaded: boolean;
  subscriptions: string[]; // 채널 ID 목록
  ratings: Record<string, Rating>; // 영상 ID → 좋아요/싫어요
}

const DEFAULT_SUBSCRIPTIONS = ['c1', 'c2', 'c5']; // 처음 실행할 때 기본 구독

let state: UserState = { loaded: false, subscriptions: [], ratings: {} };
const listeners = new Set<() => void>();

function setState(next: Partial<UserState>) {
  // 매번 "새 객체"를 만들어야 React가 바뀐 것을 알아채요 (불변성)
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const userStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): UserState {
    return state;
  },

  /** 앱 시작 시 저장된 데이터를 불러와요 */
  async init() {
    const [subscriptions, ratings] = await Promise.all([
      readJson<string[]>('subscriptions', DEFAULT_SUBSCRIPTIONS),
      readJson<Record<string, Rating>>('ratings', {}),
    ]);
    setState({ loaded: true, subscriptions, ratings });
  },

  isSubscribed(channelId: string) {
    return state.subscriptions.includes(channelId);
  },

  toggleSubscription(channelId: string) {
    const subscriptions = state.subscriptions.includes(channelId)
      ? state.subscriptions.filter((id) => id !== channelId)
      : [...state.subscriptions, channelId];
    setState({ subscriptions }); // 화면 먼저 바꾸고(낙관적 업데이트)
    void writeJson('subscriptions', subscriptions); // 저장은 뒤에서
  },

  /** 같은 버튼을 다시 누르면 취소 (YouTube와 같은 동작) */
  toggleRating(videoId: string, rating: Exclude<Rating, null>) {
    const current = state.ratings[videoId] ?? null;
    const ratings = { ...state.ratings, [videoId]: current === rating ? null : rating };
    setState({ ratings });
    void writeJson('ratings', ratings);
  },
};

/** 테스트용: 상태를 처음으로 되돌려요 */
export function resetUserStoreForTest() {
  state = { loaded: false, subscriptions: [], ratings: {} };
  listeners.clear();
}
