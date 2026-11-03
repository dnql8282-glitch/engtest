import type { Rating } from './types';
import { readJson, writeJson } from './storage';

// 사용자 데이터 저장소 (전역 상태)
// 구독 목록, 좋아요/싫어요처럼 "여러 화면이 함께 보는 데이터"를 한 곳에서 관리해요.
//   - 시청 페이지에서 구독하면 → 사이드바 구독 목록도 바로 바뀌어야 함
//   - 이렇게 여러 화면이 같은 데이터를 봐야 할 때 전역 상태가 필요해요.
// React를 쓰지 않는 순수 TypeScript라서 모바일 앱에서도 그대로 쓸 수 있어요.
// 화면은 subscribe()로 "바뀌면 알려줘"라고 등록하고, getSnapshot()으로 현재 값을 읽어요.

export interface HistoryEntry {
  videoId: string;
  watchedAt: string; // ISO 날짜
}

export type Theme = 'dark' | 'light';

/** 플레이어 설정 — YouTube처럼 볼륨, 자동재생, 극장 모드를 기억해요 */
export interface PlayerPrefs {
  volume: number; // 0 ~ 1
  muted: boolean;
  autoplay: boolean; // 영상이 끝나면 다음 영상 자동 재생
  theater: boolean; // 극장 모드 (넓은 플레이어)
}

export const DEFAULT_PLAYER_PREFS: PlayerPrefs = { volume: 1, muted: false, autoplay: true, theater: false };

export interface UserState {
  loaded: boolean;
  subscriptions: string[]; // 채널 ID 목록
  ratings: Record<string, Rating>; // 영상 ID → 좋아요/싫어요
  history: HistoryEntry[]; // 최근 본 영상이 앞에
  watchLater: string[]; // 나중에 볼 영상 ID (최근에 넣은 것이 앞에)
  theme: Theme;
  playerPrefs: PlayerPrefs;
  likedComments: string[]; // 내가 좋아요 누른 댓글 id
  notificationsSeenAt: string | null; // 알림을 마지막으로 열어 본 시각
}

const MAX_HISTORY = 200;

const DEFAULT_SUBSCRIPTIONS = ['c1', 'c2', 'c5']; // 처음 실행할 때 기본 구독

const INITIAL: UserState = {
  loaded: false,
  subscriptions: [],
  ratings: {},
  history: [],
  watchLater: [],
  theme: 'dark',
  playerPrefs: DEFAULT_PLAYER_PREFS,
  likedComments: [],
  notificationsSeenAt: null,
};

let state: UserState = INITIAL;
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
    const [subscriptions, ratings, history, watchLater, theme, savedPrefs, likedComments, notificationsSeenAt] = await Promise.all([
      readJson<string[]>('subscriptions', DEFAULT_SUBSCRIPTIONS),
      readJson<Record<string, Rating>>('ratings', {}),
      readJson<HistoryEntry[]>('history', []),
      readJson<string[]>('watchLater', []),
      readJson<Theme>('theme', 'dark'),
      readJson<Partial<PlayerPrefs>>('playerPrefs', {}),
      readJson<string[]>('likedComments', []),
      readJson<string | null>('notificationsSeenAt', null),
    ]);
    // 저장된 값에 빠진 항목이 있어도(예: 새 설정이 추가됨) 기본값으로 채워요
    const playerPrefs = { ...DEFAULT_PLAYER_PREFS, ...savedPrefs };
    setState({ loaded: true, subscriptions, ratings, history, watchLater, theme, playerPrefs, likedComments, notificationsSeenAt });
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

  /** 시청 기록 추가. 같은 영상을 다시 보면 맨 앞으로 옮겨요. */
  recordWatch(videoId: string, now: Date = new Date()) {
    const history = [
      { videoId, watchedAt: now.toISOString() },
      ...state.history.filter((h) => h.videoId !== videoId),
    ].slice(0, MAX_HISTORY);
    setState({ history });
    void writeJson('history', history);
  },

  removeFromHistory(videoId: string) {
    const history = state.history.filter((h) => h.videoId !== videoId);
    setState({ history });
    void writeJson('history', history);
  },

  clearHistory() {
    setState({ history: [] });
    void writeJson('history', []);
  },

  toggleWatchLater(videoId: string) {
    const watchLater = state.watchLater.includes(videoId)
      ? state.watchLater.filter((id) => id !== videoId)
      : [videoId, ...state.watchLater];
    setState({ watchLater });
    void writeJson('watchLater', watchLater);
  },

  setPlayerPrefs(patch: Partial<PlayerPrefs>) {
    const playerPrefs = { ...state.playerPrefs, ...patch };
    setState({ playerPrefs });
    void writeJson('playerPrefs', playerPrefs);
  },

  toggleCommentLike(commentId: string) {
    const likedComments = state.likedComments.includes(commentId)
      ? state.likedComments.filter((id) => id !== commentId)
      : [...state.likedComments, commentId];
    setState({ likedComments });
    void writeJson('likedComments', likedComments);
  },

  markNotificationsSeen(now: Date = new Date()) {
    const notificationsSeenAt = now.toISOString();
    setState({ notificationsSeenAt });
    void writeJson('notificationsSeenAt', notificationsSeenAt);
  },

  setTheme(theme: Theme) {
    setState({ theme });
    void writeJson('theme', theme);
  },
};

/** 좋아요 누른 영상 ID 목록 (파생 데이터: ratings에서 계산) */
export function likedVideoIds(s: UserState): string[] {
  return Object.entries(s.ratings)
    .filter(([, r]) => r === 'like')
    .map(([id]) => id);
}

/** 테스트용: 상태를 처음으로 되돌려요 */
export function resetUserStoreForTest() {
  state = INITIAL;
  listeners.clear();
}
