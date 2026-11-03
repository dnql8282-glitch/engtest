import { useSyncExternalStore } from 'react';
import { playerStore } from '@mytube/core/playerStore';

// 플레이어 전역 상태를 React에 연결 (웹·모바일 공용)
export function usePlayerState() {
  return useSyncExternalStore(playerStore.subscribe, playerStore.getSnapshot);
}
