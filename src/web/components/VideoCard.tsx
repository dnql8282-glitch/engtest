import { Link } from 'react-router-dom';
import type { VideoWithChannel } from '../../core/types';
import { formatCount, formatRelativeTime } from '../../core/format';
import { Thumbnail } from './Thumbnail';
import { Icon } from './Icon';

// 홈 화면 그리드의 영상 카드 하나. 누르면 /watch/영상ID 로 이동해요.
export function VideoCard({ video }: { video: VideoWithChannel }) {
  return (
    <article className="video-card">
      <Link to={`/watch/${video.id}`}>
        <Thumbnail video={video} />
      </Link>
      <div className="video-details">
        <span className="avatar" style={{ background: video.channel.avatarColor }}>
          {video.channel.name[0]}
        </span>
        <div className="video-text">
          <Link to={`/watch/${video.id}`}>
            <h3 className="video-title">{video.title}</h3>
          </Link>
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
