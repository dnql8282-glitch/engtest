import { splitTimestamps } from '@mytube/core/chapters';
import { controls, video } from '../player/playback';

// 글 속의 "3:15" 같은 시간을 누르면 그 장면으로 이동 (YouTube 설명란·댓글과 같은 동작)
export function LinkifiedText({ text, videoId }: { text: string; videoId: string }) {
  return (
    <>
      {splitTimestamps(text).map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <button
            key={i}
            className="timestamp-link"
            onClick={(e) => {
              e.stopPropagation();
              if (video.dataset.videoId !== videoId) return;
              controls.seekTo(part.seconds);
              void video.play().catch(() => {});
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {part.label}
          </button>
        ),
      )}
    </>
  );
}
