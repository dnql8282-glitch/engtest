import { useEffect, useRef, useState } from 'react';
import type { Video } from '@mytube/core/types';
import { formatDuration } from '@mytube/core/format';
import { useUserState } from '@mytube/hooks/useUserStore';
import { isFinished } from '@mytube/core/userStore';

// 썸네일 이미지 + 오른쪽 아래 재생 시간. 이미지가 뜨기 전엔 배경색이 보여요.
// preview: 마우스를 0.6초 올려 두면 소리 없이 미리보기 재생 (YouTube 홈과 같은 동작, 마우스가 있는 기기에서만)
export function Thumbnail({ video, preview = false }: { video: Video; preview?: boolean }) {
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [ready, setReady] = useState(false); // 미리보기가 실제로 재생되기 전까지는 썸네일을 그대로 보여줘요
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (hovering) timer.current = setTimeout(() => setPlaying(true), 600);
    return () => clearTimeout(timer.current);
  }, [hovering]);

  const progress = useUserState().progress[video.id];
  const ratio = progress ? (isFinished(progress) ? 1 : Math.min(1, progress.t / progress.d)) : 0;

  const canPreview = preview && typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  return (
    <div
      className="thumbnail"
      style={{ background: video.thumbnailColors[0] }}
      onMouseEnter={canPreview ? () => setHovering(true) : undefined}
      onMouseLeave={
        canPreview
          ? () => {
              setHovering(false);
              setPlaying(false);
              setLeft(null);
              setReady(false);
            }
          : undefined
      }
    >
      <img src={video.thumbnailUrl} alt="" loading="lazy" />
      {playing && (
        <video
          className="thumbnail-preview"
          style={{ opacity: ready ? 1 : 0 }}
          onPlaying={() => setReady(true)}
          src={video.videoUrl}
          muted
          autoPlay
          playsInline
          onTimeUpdate={(e) => setLeft(Math.max(0, Math.floor(e.currentTarget.duration - e.currentTarget.currentTime)))}
        />
      )}
      <span className="duration">{formatDuration(left ?? video.durationSec)}</span>
      {/* 이 계정이 본 만큼 빨간 선 (다 본 영상은 끝까지) */}
      {progress && !playing && (
        <span className="thumb-progress" aria-label={`${Math.round(ratio * 100)}% 시청함`}>
          <span style={{ width: `${ratio * 100}%` }} />
        </span>
      )}
    </div>
  );
}
