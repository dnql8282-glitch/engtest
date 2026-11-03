import { useSyncExternalStore } from 'react';

// CSS 미디어쿼리 결과를 React에서 쓰는 훅. 창 크기가 바뀌면 자동으로 다시 그려요.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
