import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { VideoWithChannel } from '../../core/types';
import { formatCount, formatRelativeTime } from '../../core/format';
import { Thumbnail } from './Thumbnail';
import { VideoActionsMenu } from './VideoActionsMenu';
import type { MenuItem } from './Menu';

// 가로형 목록 아이템 (검색 결과, 인기 급상승, 시청 기록, 재생목록에서 공통으로 사용)
interface VideoListItemProps {
  video: VideoWithChannel;
  index?: number; // 재생목록 번호
  compact?: boolean; // 재생목록처럼 작은 썸네일
  extraMenu?: MenuItem[];
  trailing?: ReactNode; // 오른쪽 끝에 붙일 버튼(예: 시청 기록 X)
}

export function VideoListItem({ video, index, compact, extraMenu, trailing }: VideoListItemProps) {
  return (
    <div className={`result-row ${compact ? 'compact' : ''}`}>
      {index !== undefined && <span className="list-index">{index}</span>}
      <Link to={`/watch/${video.id}`} className="result-thumb">
        <Thumbnail video={video} />
      </Link>
      <div className="result-text">
        <div className="result-title-row">
          <Link to={`/watch/${video.id}`}>
            <h3 className="result-title">{video.title}</h3>
          </Link>
          <div className="result-actions">
            {trailing}
            <VideoActionsMenu videoId={video.id} extra={extraMenu} />
          </div>
        </div>
        {compact ? (
          <p className="result-meta">
            <Link to={`/channel/${video.channel.id}`} className="channel-link">{video.channel.name}</Link>
            {' · '}조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
          </p>
        ) : (
          <>
            <p className="result-meta">
              조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
            </p>
            <Link to={`/channel/${video.channel.id}`} className="result-channel">
              <span className="avatar tiny" style={{ background: video.channel.avatarColor }}>
                {video.channel.name[0]}
              </span>
              <span>{video.channel.name}</span>
            </Link>
            <p className="result-desc">{video.description}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="result-row">
          <div className="result-thumb skeleton-thumb" />
          <div className="result-text">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </>
  );
}
