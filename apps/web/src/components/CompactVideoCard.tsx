import { Link } from 'react-router-dom';
import type { VideoWithChannel } from '@mytube/core/types';
import { formatCount, formatRelativeTime } from '@mytube/core/format';
import { Thumbnail } from './Thumbnail';

// 시청 페이지 오른쪽 추천 목록에 쓰는 가로형 작은 카드
export function CompactVideoCard({ video }: { video: VideoWithChannel }) {
  return (
    <Link to={`/watch/${video.id}`} className="compact-card">
      <div className="compact-thumb">
        <Thumbnail video={video} />
      </div>
      <div className="compact-text">
        <h3 className="compact-title">{video.title}</h3>
        <p className="compact-meta">{video.channel.name}</p>
        <p className="compact-meta">
          조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
        </p>
      </div>
    </Link>
  );
}
