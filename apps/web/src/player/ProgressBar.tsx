import { useRef, useState } from 'react';
import { formatDuration } from '@mytube/core/format';
import { controls, usePlayback } from './playback';

// 빨간 진행 막대
//  회색: 전체 / 밝은 회색: 미리 받은 부분(버퍼) / 빨강: 본 부분
//  마우스를 올리면 막대가 두꺼워지고 동그란 손잡이와 시간 툴팁이 나타나요. 누르고 끌면 그 위치로 이동.
export function ProgressBar() {
  const { currentTime, duration, bufferedEnd } = usePlayback();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null); // 0~1
  const [drag, setDrag] = useState<number | null>(null);

  const ratioAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const played = drag ?? (duration ? currentTime / duration : 0);
  const buffered = duration ? bufferedEnd / duration : 0;
  const pct = (x: number) => `${(x * 100).toFixed(3)}%`;

  return (
    <div
      ref={ref}
      className={`progress ${drag !== null ? 'dragging' : ''}`}
      role="slider"
      aria-label="탐색 슬라이더"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={`${formatDuration(Math.floor(currentTime))} / ${formatDuration(Math.floor(duration))}`}
      onMouseMove={(e) => setHover(ratioAt(e.clientX))}
      onMouseLeave={() => setHover(null)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(ratioAt(e.clientX));
      }}
      onPointerMove={(e) => {
        if (drag !== null) {
          const r = ratioAt(e.clientX);
          setDrag(r);
          setHover(r);
        }
      }}
      onPointerUp={(e) => {
        if (drag !== null) controls.seekTo(ratioAt(e.clientX) * duration);
        setDrag(null);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="progress-track">
        <div className="progress-buffered" style={{ width: pct(buffered) }} />
        {hover !== null && <div className="progress-hover" style={{ width: pct(hover) }} />}
        <div className="progress-played" style={{ width: pct(played) }} />
      </div>
      <div className="progress-scrubber" style={{ left: pct(played) }} />
      {hover !== null && duration > 0 && (
        <div className="progress-tooltip" style={{ left: `clamp(24px, ${pct(hover)}, calc(100% - 24px))` }}>
          {formatDuration(Math.floor(hover * duration))}
        </div>
      )}
    </div>
  );
}
