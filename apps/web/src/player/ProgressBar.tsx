import { useMemo, useRef, useState } from 'react';
import type { Chapter, Storyboard, VideoWithChannel } from '@mytube/core/types';
import { formatDuration } from '@mytube/core/format';
import { chapterIndexAt, chapterRanges, mostReplayed, snapToChapter } from '@mytube/core/chapters';
import { controls, usePlayback } from './playback';

// ─────────────────────────────────────────────────────────────────────────────
// YouTube 타임바
//  · 마우스를 올리면: 막대가 두꺼워지고, 그 시점의 미리보기 장면 + 시간 + 챕터 제목, 위에 "가장 많이 다시 본 장면" 그래프
//  · 챕터가 있으면 막대가 구간별로 틈을 두고 나뉘고, 마우스가 있는 구간만 더 두꺼워져요
//  · 손잡이를 누르면 커지고, 끄는 동안 미리보기와 큰 시간 표시. 놓는 순간 그 위치로 이동
//  · 끌다가 손가락(마우스)을 위로 올리면 "정밀 탐색": 움직임이 5배 느려지고 장면 필름 띠가 나타나요
//  · 챕터 경계 근처에서는 경계에 착 붙어요 (휴대폰은 짧게 진동)
// ─────────────────────────────────────────────────────────────────────────────

const PRECISE_LIFT = 40; // 이만큼(px) 위로 올리면 정밀 탐색
const PRECISE_SLOWDOWN = 5;

interface Drag {
  ratio: number;
  precise: boolean;
  startY: number;
  baseRatio: number; // 정밀 탐색을 시작한 지점
  baseX: number;
  snappedAt: number | null;
}

export function ProgressBar({ video, onScrub }: { video: VideoWithChannel; onScrub?: (t: number | null) => void }) {
  const { currentTime, duration, bufferedEnd } = usePlayback();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null); // 0~1
  const [drag, setDrag] = useState<Drag | null>(null);
  const d = duration || video.durationSec;

  const ranges = useMemo(() => (video.chapters.length ? chapterRanges(video.chapters, d) : [{ start: 0, end: d, title: '' }]), [video.chapters, d]);
  const heat = useMemo(() => (d >= 60 ? mostReplayed(video.id, video.chapters, d) : null), [video.id, video.chapters, d]);

  const ratioAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const played = drag ? drag.ratio : d ? currentTime / d : 0;
  const buffered = d ? bufferedEnd / d : 0;
  const pointer = drag?.ratio ?? hover; // 미리보기를 보여줄 위치
  const pointerT = pointer !== null ? pointer * d : null;
  const hoverChapter = pointerT !== null ? chapterIndexAt(video.chapters, pointerT) : -1;

  const pct = (x: number) => `${(x * 100).toFixed(3)}%`;
  const fill = (x: number, r: { start: number; end: number }) => Math.min(1, Math.max(0, (x * d - r.start) / (r.end - r.start)));

  const update = (next: Drag) => {
    setDrag(next);
    onScrub?.(next.ratio * d);
  };

  return (
    <div
      ref={ref}
      className={`progress ${drag ? 'dragging' : ''} ${drag?.precise ? 'precise' : ''} ${video.chapters.length ? 'has-chapters' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label="탐색 슬라이더"
      aria-valuemin={0}
      aria-valuemax={Math.floor(d)}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={`${formatDuration(Math.floor(currentTime))} / ${formatDuration(Math.floor(d))}`}
      onMouseMove={(e) => !drag && setHover(ratioAt(e.clientX))}
      onMouseLeave={() => setHover(null)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = ratioAt(e.clientX);
        update({ ratio: r, precise: false, startY: e.clientY, baseRatio: r, baseX: e.clientX, snappedAt: null });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const width = ref.current!.getBoundingClientRect().width;
        // 위로 충분히 올리면 정밀 탐색 시작
        if (!drag.precise && drag.startY - e.clientY > PRECISE_LIFT) {
          update({ ...drag, precise: true, baseRatio: drag.ratio, baseX: e.clientX });
          vibrate(15);
          return;
        }
        if (drag.precise && drag.startY - e.clientY < PRECISE_LIFT / 2) {
          update({ ...drag, precise: false }); // 다시 내리면 일반 탐색
          return;
        }
        let r = drag.precise
          ? Math.min(1, Math.max(0, drag.baseRatio + (e.clientX - drag.baseX) / width / PRECISE_SLOWDOWN))
          : ratioAt(e.clientX);
        let snappedAt = null;
        if (!drag.precise) {
          const s = snapToChapter(video.chapters, d, r, 6 / width); // 경계 6px 안이면 붙기
          r = s.ratio;
          if (s.snapped) {
            snappedAt = r;
            if (drag.snappedAt !== r) vibrate(10);
          }
        }
        update({ ...drag, ratio: r, snappedAt });
        setHover(r);
      }}
      onPointerUp={() => {
        if (drag) controls.seekTo(drag.ratio * d);
        setDrag(null);
        onScrub?.(null);
      }}
      onPointerCancel={() => {
        setDrag(null);
        onScrub?.(null);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 가장 많이 다시 본 장면 그래프 (마우스를 올리거나 끌 때) */}
      {heat && pointer !== null && <Heatmap values={heat} />}

      {/* 챕터별 구간 (챕터가 없으면 한 구간) */}
      <div className="progress-segments">
        {ranges.map((r, i) => (
          <div
            key={r.start}
            className={`progress-segment ${i === hoverChapter ? 'hover' : ''}`}
            style={{ width: pct((r.end - r.start) / d) }}
          >
            <div className="progress-buffered" style={{ width: pct(fill(buffered, r)) }} />
            {pointer !== null && <div className="progress-hover" style={{ width: pct(fill(pointer, r)) }} />}
            <div className="progress-played" style={{ width: pct(fill(played, r)) }} />
          </div>
        ))}
      </div>
      <div className="progress-scrubber" style={{ left: pct(played) }} />

      {/* 미리보기: 장면 + 챕터 제목 + 시간 */}
      {pointerT !== null && d > 0 && !drag?.precise && (
        <div className="progress-preview" style={{ left: `clamp(84px, ${pct(pointer!)}, calc(100% - 84px))` }}>
          {video.storyboard && <StoryboardFrame sb={video.storyboard} t={pointerT} />}
          {hoverChapter >= 0 && <div className="progress-preview-chapter">{video.chapters[hoverChapter].title}</div>}
          <div className="progress-preview-time">{formatDuration(Math.floor(pointerT))}</div>
        </div>
      )}

      {/* 정밀 탐색: 필름 띠 */}
      {drag?.precise && video.storyboard && <Filmstrip sb={video.storyboard} t={drag.ratio * d} chapters={video.chapters} />}
    </div>
  );
}

/** 스토리보드 스프라이트에서 t초에 해당하는 칸만 잘라 보여줘요 */
export function StoryboardFrame({ sb, t, scale = 1 }: { sb: Storyboard; t: number; scale?: number }) {
  const i = Math.min(sb.count - 1, Math.max(0, Math.floor(t / sb.interval)));
  const col = i % sb.cols;
  const row = Math.floor(i / sb.cols);
  return (
    <div
      className="storyboard-frame"
      style={{
        width: sb.w * scale,
        height: sb.h * scale,
        backgroundImage: `url(${sb.url})`,
        backgroundSize: `${sb.cols * sb.w * scale}px auto`,
        backgroundPosition: `${-col * sb.w * scale}px ${-row * sb.h * scale}px`,
      }}
    />
  );
}

function Filmstrip({ sb, t, chapters }: { sb: Storyboard; t: number; chapters: Chapter[] }) {
  const center = Math.floor(t / sb.interval);
  const items = [-3, -2, -1, 0, 1, 2, 3].map((k) => center + k).filter((i) => i >= 0 && i < sb.count);
  const ch = chapterIndexAt(chapters, t);
  return (
    <div className="filmstrip">
      <div className="filmstrip-label">
        정밀 탐색 · {formatDuration(Math.floor(t))}
        {ch >= 0 && ` · ${chapters[ch].title}`}
      </div>
      <div className="filmstrip-row">
        {items.map((i) => (
          <div key={i} className={`filmstrip-cell ${i === center ? 'current' : ''}`}>
            <StoryboardFrame sb={sb} t={i * sb.interval} scale={0.75} />
          </div>
        ))}
      </div>
      <div className="filmstrip-hint">아래로 내리면 일반 탐색 · 놓으면 이동</div>
    </div>
  );
}

function Heatmap({ values }: { values: number[] }) {
  const n = values.length;
  const pts = values.map((v, i) => `${(i / (n - 1)) * 1000},${100 - v * 100}`).join(' ');
  return (
    <svg className="heatmap" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,100 ${pts} 1000,100`} />
    </svg>
  );
}

function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* 진동을 지원하지 않는 기기 */
  }
}
