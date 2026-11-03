import { useEffect, useState } from 'react';

// 비동기 데이터 불러오기 공통 훅.
// loader(key)를 호출해서 결과를 key와 함께 저장해요.
// 저장된 key가 현재 key와 다르면 "아직 로딩 중"으로 봐요. 그래서 로딩 상태를 따로 관리할 필요가 없어요.
// 사용 예: const { data, loading } = useAsync(getVideo, videoId);
export function useAsync<K, T>(loader: (key: K) => Promise<T>, key: K) {
  const [state, setState] = useState<{ key: K; data: T } | null>(null);

  useEffect(() => {
    let cancelled = false; // 응답이 오기 전에 key가 바뀌면 옛 응답은 버려요
    loader(key).then((data) => {
      if (!cancelled) setState({ key, data });
    });
    return () => {
      cancelled = true;
    };
  }, [loader, key]);

  const ready = state !== null && Object.is(state.key, key);
  return { data: ready ? state.data : undefined, loading: !ready };
}
