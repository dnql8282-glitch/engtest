import type { VideoWithChannel } from '../../core/types';
import { formatCount, formatRelativeTime } from '../../core/format';
import { Thumbnail } from './Thumbnail';
import { Icon } from './Icon';

// 홈 화면 그리드의 영상 카드 하나
export function VideoCard({ video }: { video: VideoWithChannel }) {
  return (
    <article className="video-card">
      <Thumbnail video={video} />
      <div className="video-details">
        <span className="avatar" style={{ background: video.channel.avatarColor }}>
          {video.channel.name[0]}
        </span>
        <div className="video-text">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-meta">{video.channel.name}</p>
          <p className="video-meta">
            조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
          </p>
        </div>
        <button className="card-menu" aria-label="작업 메뉴">
          <Icon name="moreVert" />
        </button>
      </div>
    </article>
  );
}
