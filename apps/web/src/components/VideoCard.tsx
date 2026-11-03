import { Link } from 'react-router-dom';
import type { VideoWithChannel } from '@mytube/core/types';
import { formatCount, formatRelativeTime } from '@mytube/core/format';
import { Thumbnail } from './Thumbnail';
import { VideoActionsMenu } from './VideoActionsMenu';

// 홈 화면 그리드의 영상 카드 하나. 누르면 /watch/영상ID 로 이동해요.
export function VideoCard({ video, showChannel = true }: { video: VideoWithChannel; showChannel?: boolean }) {
  return (
    <article className="video-card">
      <Link to={`/watch/${video.id}`}>
        <Thumbnail video={video} preview />
      </Link>
      <div className="video-details">
        {showChannel && (
          <Link to={`/channel/${video.channel.id}`} className="avatar" style={{ background: video.channel.avatarColor }}>
            {video.channel.name[0]}
          </Link>
        )}
        <div className="video-text">
          <Link to={`/watch/${video.id}`}>
            <h3 className="video-title">{video.title}</h3>
          </Link>
          {showChannel && (
            <Link to={`/channel/${video.channel.id}`} className="video-meta channel-link">
              {video.channel.name}
            </Link>
          )}
          <p className="video-meta">
            조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
          </p>
        </div>
        <VideoActionsMenu videoId={video.id} />
      </div>
    </article>
  );
}
