import { useSyncExternalStore } from 'react';
import { accountStore } from '@mytube/core/accountStore';

// 로그인 상태를 React에 연결 (웹·모바일 공용)
export function useAccountState() {
  return useSyncExternalStore(accountStore.subscribe, accountStore.getSnapshot);
}
