// 플레이어 상태 (어떤 영상을, 어떤 크기로 보고 있나)
// YouTube 앱처럼 영상을 보면서 다른 탭으로 이동할 수 있으려면, 플레이어가 특정 화면(페이지)에 속하면 안 돼요.
// 그래서 "지금 재생 중인 영상"을 화면 밖의 전역 상태로 두고, 플레이어는 앱 맨 위층에 하나만 둬요.
//   full: 전체 화면으로 시청 중
//   mini: 탭 바 위에 작은 플레이어로 접힘 (다른 화면을 보면서 계속 재생)
//   null: 재생 중인 영상 없음

export type PlayerMode = 'full' | 'mini';

export interface PlayerState {
  videoId: string | null;
  mode: PlayerMode | null;
  /** 앱을 다시 켰을 때 "이어서 시청하기"로 띄운 상태 (자동재생하지 않고 기다려요) */
  restored?: boolean;
}

let state: PlayerState = { videoId: null, mode: null };
const listeners = new Set<() => void>();

function setState(next: PlayerState) {
  state = next;
  listeners.forEach((l) => l());
}

export const playerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): PlayerState {
    return state;
  },
  /** 앱을 다시 켰을 때: 마지막에 보던 영상을 미니 플레이어로, 재생은 하지 않고 */
  restore(videoId: string) {
    if (state.videoId) return; // 이미 뭔가 보고 있으면 건드리지 않아요
    setState({ videoId, mode: 'mini', restored: true });
  },
  /** "이어서 시청하기" 표시를 지워요 (사용자가 재생을 누름) */
  markResumed() {
    if (state.restored) setState({ videoId: state.videoId, mode: state.mode });
  },
  /** 영상 열기: 항상 전체 화면으로 */
  open(videoId: string) {
    setState({ videoId, mode: 'full' });
  },
  /** 모드는 그대로 두고 영상만 바꾸기 (미니 플레이어에서 다음 영상) */
  replace(videoId: string) {
    setState({ videoId, mode: state.mode ?? 'full' });
  },
  minimize() {
    if (state.videoId) setState({ ...state, mode: 'mini' });
  },
  expand() {
    // 펼치면 "이어서 시청하기" 대기 상태도 끝나요
    if (state.videoId) setState({ videoId: state.videoId, mode: 'full' });
  },
  close() {
    setState({ videoId: null, mode: null });
  },
};
