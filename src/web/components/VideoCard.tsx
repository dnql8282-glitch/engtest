import type { VideoWithChannel } from '../../core/types';
import { formatCount, formatRelativeTime } from '../../core/format';
import { Thumbnail } from './Thumbnail';

// 홈 화면 그리드의 영상 카드 하나
export function VideoCard({ video }: { video: VideoWithChannel }) {
  return (
    <article className="video-card">
      <Thumbnail video={video} />
      <div className="video-meta">
        <div className="avatar" style={{ background: video.channel.avatarColor }}>
          {video.channel.name[0]}
        </div>
        <div>
          <h3 className="video-title">{video.title}</h3>
          <p className="video-sub">{video.channel.name}</p>
          <p className="video-sub">
            조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
