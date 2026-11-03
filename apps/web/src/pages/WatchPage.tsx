import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { VideoWithChannel } from '@mytube/core/types';
import { getRelatedVideos, getVideo } from '@mytube/core/videoService';
import {
  formatCount,
  formatDate,
  formatFullCount,
  formatRelativeTime,
} from '@mytube/core/format';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { userStore } from '@mytube/core/userStore';
import { Icon } from '../components/Icon';
import { CompactVideoCard } from '../components/CompactVideoCard';
import { SubscribeButton } from '../components/SubscribeButton';
import { RatingButtons } from '../components/RatingButtons';
import { Comments } from '../components/Comments';
import { NotFoundPage } from './NotFoundPage';

// 시청 페이지: /watch/:videoId
// 주소의 videoId가 이 페이지의 "입력값"이에요. 주소만 바뀌면 같은 컴포넌트가 다른 영상을 보여줘요.
export function WatchPage() {
  const { videoId = '' } = useParams();
  const { data: video, loading } = useAsync(getVideo, videoId);
  const { data: related } = useAsync(getRelatedVideos, videoId);

  // 다른 영상으로 넘어가면 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  // 영상을 불러오면 시청 기록에 남겨요 (전역 상태 → 저장소)
  useEffect(() => {
    if (video) userStore.recordWatch(video.id);
  }, [video]);

  if (!loading && video === null) return <NotFoundPage />;

  return (
    <div className="watch">
      <div className="watch-primary">
        {loading || !video ? <WatchSkeleton /> : <VideoInfo video={video} />}
      </div>
      <aside className="watch-secondary">
        {related?.map((v) => <CompactVideoCard key={v.id} video={v} />)}
      </aside>
    </div>
  );
}

function VideoInfo({ video }: { video: VideoWithChannel }) {
  return (
    <>
      <div className="player">
        {/* key를 주면 영상이 바뀔 때 플레이어를 새로 만들어서 처음부터 재생해요 */}
        <video key={video.id} src={video.videoUrl} poster={video.thumbnailUrl} controls autoPlay />
      </div>
      <h1 className="watch-title">{video.title}</h1>

      <div className="watch-owner-row">
        <div className="owner">
          <Link to={`/channel/${video.channel.id}`} className="avatar large" style={{ background: video.channel.avatarColor }}>
            {video.channel.name[0]}
          </Link>
          <div className="owner-text">
            <Link to={`/channel/${video.channel.id}`} className="owner-name">{video.channel.name}</Link>
            <p className="owner-subs">구독자 {formatCount(video.channel.subscribers)}명</p>
          </div>
          <SubscribeButton channelId={video.channel.id} />
        </div>

        <div className="actions">
          <RatingButtons video={video} />
          <button className="pill">
            <Icon name="share" />
            <span>공유</span>
          </button>
          <WatchLaterButton videoId={video.id} />
        </div>
      </div>

      {/* key: 영상이 바뀌면 "더보기" 펼침 상태를 초기화 */}
      <Description key={video.id} video={video} />
      <Comments key={video.id} videoId={video.id} />
    </>
  );
}

function Description({ video }: { video: VideoWithChannel }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`description ${expanded ? 'expanded' : ''}`}
      onClick={() => !expanded && setExpanded(true)}
    >
      <p className="description-meta">
        {expanded
          ? `조회수 ${formatFullCount(video.views)}회  ${formatDate(video.uploadedAt)}`
          : `조회수 ${formatCount(video.views)}회  ${formatRelativeTime(video.uploadedAt)}`}
        <span className="description-tag">#{video.category}</span>
      </p>
      <p className="description-text">{video.description}</p>
      {expanded ? (
        <>
          <div className="description-channel">
            <span className="avatar" style={{ background: video.channel.avatarColor }}>
              {video.channel.name[0]}
            </span>
            <div>
              <p className="owner-name">{video.channel.name}</p>
              <p className="owner-subs">구독자 {formatCount(video.channel.subscribers)}명</p>
            </div>
          </div>
          <button
            className="description-toggle"
            onClick={(e) => {
              e.stopPropagation(); // 상자 클릭(펼치기)과 겹치지 않게
              setExpanded(false);
            }}
          >
            간략히
          </button>
        </>
      ) : (
        <span className="description-toggle">...더보기</span>
      )}
    </div>
  );
}

function WatchSkeleton() {
  return (
    <>
      <div className="player skeleton-block" />
      <div className="skeleton-line" style={{ height: 28, width: '70%' }} />
      <div className="skeleton-line short" />
    </>
  );
}

function WatchLaterButton({ videoId }: { videoId: string }) {
  const { watchLater } = useUserState();
  const saved = watchLater.includes(videoId);
  return (
    <button className="pill hide-narrow" onClick={() => userStore.toggleWatchLater(videoId)} aria-pressed={saved}>
      <Icon name="clock" />
      <span>{saved ? '저장됨' : '나중에 보기'}</span>
    </button>
  );
}
