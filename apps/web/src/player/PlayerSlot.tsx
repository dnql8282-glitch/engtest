import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { video } from './playback';

// 하나뿐인 <video>를 이 자리에 "꽂아" 주는 컴포넌트.
// 시청 페이지와 미니 플레이어가 각자 PlayerSlot을 가지고 있고, 화면에 나타나는 쪽으로 video가 옮겨가요.
//
// 주의: 시청 페이지 → 미니 플레이어로 갈 때는 "시청 페이지가 사라진 다음 렌더"에 미니 플레이어가 나타나요.
// 그 사이 잠깐 video가 문서에서 빠지면 브라우저가 자동으로 일시정지해요.
// 그래서 빠질 때 재생 중이었는지 기억했다가, 새 자리에 꽂히면 다시 재생해요.
let resumeOnAttach = false;

export function PlayerSlot({ className, children }: { className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.prepend(video);
    if (resumeOnAttach) {
      resumeOnAttach = false;
      void video.play().catch(() => {});
    }
    return () => {
      // 이 자리를 떠날 때 재생 중이었으면 기억
      if (video.parentElement === el) resumeOnAttach = !video.paused && !video.ended;
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
