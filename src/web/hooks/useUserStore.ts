import { useSyncExternalStore } from 'react';
import { userStore } from '../../core/userStore';

// core의 전역 상태(userStore)를 React 화면에 연결하는 다리.
// 상태가 바뀌면 이 훅을 쓰는 모든 컴포넌트가 자동으로 다시 그려져요.
export function useUserState() {
  return useSyncExternalStore(userStore.subscribe, userStore.getSnapshot);
}
