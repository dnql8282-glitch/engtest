import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { playerStore } from '@mytube/core/playerStore';
import { FullPlayer } from '../player/FullPlayer';

// 시청 페이지: /watch/:videoId
// 주소의 videoId가 이 페이지의 "입력값"이에요. 주소만 바뀌면 같은 컴포넌트가 다른 영상을 보여줘요.
export function WatchPage() {
  const { videoId = '' } = useParams();
  const navigate = useNavigate();
  const { data: video, loading } = useAsync(getVideo, videoId);
  const { data: related } = useAsync(getRelatedVideos, videoId);
  const { playerPrefs } = useUserState();

  // 다른 영상으로 넘어가면 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  // 이 페이지가 플레이어에게 "이 영상을 크게 틀어 줘"라고 알려요.
  // 미니 플레이어에서 같은 영상을 펼친 경우엔 이어서 재생(expand), 다른 영상이면 새로 재생(open).
  useEffect(() => {
    if (!video) return;
    if (playerStore.getSnapshot().videoId === video.id) playerStore.expand();
    else playerStore.open(video.id);
  }, [video]);

  if (!loading && video === null) return <NotFoundPage />;

  const next = related?.[0];
  const player = video ? (
    <div className="player">
      <FullPlayer key="player" next={next} onNext={() => next && navigate(`/watch/${next.id}`)} />
    </div>
  ) : (
    <div className="player skeleton-block" />
  );

  return (
    <div className={`watch ${playerPrefs.theater ? 'theater' : ''}`}>
      {/* 영화관 모드: 플레이어가 위에 가로로 꽉 차고, 아래에 두 칸 */}
      {playerPrefs.theater && <div className="theater-stage">{player}</div>}
      <div className="watch-columns">
        <div className="watch-primary">
          {!playerPrefs.theater && player}
          {loading || !video ? <WatchSkeleton /> : <VideoInfo video={video} />}
        </div>
        <aside className="watch-secondary">
          {related?.map((v) => <CompactVideoCard key={v.id} video={v} />)}
        </aside>
      </div>
    </div>
  );
}

function VideoInfo({ video }: { video: VideoWithChannel }) {
  return (
    <>
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
