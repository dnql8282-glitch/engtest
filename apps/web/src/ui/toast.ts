import { useSyncExternalStore } from 'react';

// 화면 왼쪽 아래에 잠깐 떴다 사라지는 알림(토스트). 어디서든 toast('메시지')로 띄워요.
export interface Toast {
  id: number;
  text: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, ms = 3000) {
  const id = Date.now() + Math.random();
  toasts = [...toasts.slice(-2), { id, text }]; // 최대 3개
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ms);
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
}
