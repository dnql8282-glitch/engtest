import type { VideoWithChannel } from '@mytube/core/types';
import { chapterIndexAt } from '@mytube/core/chapters';
import { formatDuration } from '@mytube/core/format';
import { controls, usePlayback, video as videoEl } from '../player/playback';
import { StoryboardFrame } from '../player/ProgressBar';
import { Icon } from './Icon';

const seek = (t: number) => {
  controls.seekTo(t);
  void videoEl.play().catch(() => {});
};

// 설명란의 가로 스크롤 챕터 카드 (YouTube: 설명 펼치면 "챕터" 섹션)
export function ChapterCards({ video, onShowAll }: { video: VideoWithChannel; onShowAll: () => void }) {
  const { currentTime } = usePlayback();
  if (video.chapters.length === 0) return null;
  const now = chapterIndexAt(video.chapters, currentTime);
  return (
    <div className="chapter-cards" onClick={(e) => e.stopPropagation()}>
      <div className="chapter-cards-head">
        <b>챕터</b>
        <button className="text-btn small" onClick={onShowAll}>
          모두 보기
        </button>
      </div>
      <div className="chapter-cards-row">
        {video.chapters.map((c, i) => (
          <button key={c.start} className={`chapter-card ${i === now ? 'current' : ''}`} onClick={() => seek(c.start)}>
            {video.storyboard ? <StoryboardFrame sb={video.storyboard} t={c.start + 1} /> : <div className="storyboard-frame" />}
            <span className="chapter-card-title">{c.title}</span>
            <span className="chapter-card-time">{formatDuration(c.start)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 오른쪽 "챕터" 패널 (YouTube의 참여 패널): 목록, 지금 챕터 강조, 누르면 이동
export function ChaptersPanel({ video, onClose }: { video: VideoWithChannel; onClose: () => void }) {
  const { currentTime } = usePlayback();
  const now = chapterIndexAt(video.chapters, currentTime);
  return (
    <section className="chapters-panel" aria-label="챕터">
      <div className="chapters-panel-head">
        <h2>챕터</h2>
        <button className="icon-btn" onClick={onClose} aria-label="챕터 닫기">
          <Icon name="close" />
        </button>
      </div>
      <div className="chapters-panel-list">
        {video.chapters.map((c, i) => (
          <button key={c.start} className={`chapters-panel-item ${i === now ? 'current' : ''}`} onClick={() => seek(c.start)}>
            {video.storyboard && <StoryboardFrame sb={video.storyboard} t={c.start + 1} scale={0.7} />}
            <span className="chapters-panel-text">
              <b>{c.title}</b>
              <span className="timestamp-link as-text">{formatDuration(c.start)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
