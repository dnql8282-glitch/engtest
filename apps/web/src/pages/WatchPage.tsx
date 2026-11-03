import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { VideoCard } from '../components/VideoCard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ShareDialog } from '../components/ShareDialog';
import { video as videoEl } from '../player/playback';
import { requestStartAt } from '../player/streaming';
import { toast } from '../ui/toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getComments } from '@mytube/core/commentService';

// 시청 페이지: /watch/:videoId
// 주소의 videoId가 이 페이지의 "입력값"이에요. 주소만 바뀌면 같은 컴포넌트가 다른 영상을 보여줘요.
export function WatchPage() {
  const { videoId = '' } = useParams();
  const navigate = useNavigate();
  const { data: video, loading } = useAsync(getVideo, videoId);
  const { data: related } = useAsync(getRelatedVideos, videoId);
  const { playerPrefs } = useUserState();
  const isMobile = useMediaQuery('(max-width: 792px)');
  const [params] = useSearchParams();
  const startAt = Number(params.get('t') ?? 0);
  const [relatedFilter, setRelatedFilter] = useState<'all' | 'channel' | 'related'>('all');
  useDocumentTitle(video?.title);

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

  // 공유 링크의 ?t=초 : 이미 같은 영상이 재생 중이면 바로 이동, 아니면 불러올 때 그 시점부터 시작
  useEffect(() => {
    if (!video || !startAt) return;
    if (videoEl.dataset.videoId === video.id && videoEl.readyState >= 1) videoEl.currentTime = startAt;
    else requestStartAt(video.id, startAt);
  }, [video, startAt]);

  // 다른 영상으로 가면 추천 필터 초기화
  const [filterFor, setFilterFor] = useState(videoId);
  if (filterFor !== videoId) {
    setFilterFor(videoId);
    setRelatedFilter('all');
  }

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
      {playerPrefs.theater && !isMobile && <div className="theater-stage">{player}</div>}
      <div className="watch-columns">
        <div className="watch-primary">
          {(!playerPrefs.theater || isMobile) && player}
          {loading || !video ? <WatchSkeleton /> : <VideoInfo video={video} isMobile={isMobile} />}
        </div>
        <aside className="watch-secondary">
          {video && (
            <div className="related-chips">
              {(
                [
                  ['all', '모두'],
                  ['channel', `${video.channel.name} 제공`],
                  ['related', '관련 콘텐츠'],
                ] as const
              ).map(([key, label]) => (
                <button key={key} className={`chip ${relatedFilter === key ? 'active' : ''}`} onClick={() => setRelatedFilter(key)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* 휴대폰에서는 추천 영상도 홈처럼 큰 카드로 */}
          {(() => {
            const list =
              related?.filter((v) =>
                relatedFilter === 'channel'
                  ? v.channelId === video?.channelId
                  : relatedFilter === 'related'
                    ? v.category === video?.category
                    : true,
              ) ?? [];
            if (related && list.length === 0) return <p className="related-empty">표시할 동영상이 없습니다.</p>;
            return list.map((v) => (isMobile ? <VideoCard key={v.id} video={v} /> : <CompactVideoCard key={v.id} video={v} />));
          })()}
        </aside>
      </div>
    </div>
  );
}

function VideoInfo({ video, isMobile }: { video: VideoWithChannel; isMobile: boolean }) {
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
          <ShareButton videoId={video.id} />
          <WatchLaterButton videoId={video.id} />
        </div>
      </div>

      {/* key: 영상이 바뀌면 "더보기" 펼침 상태를 초기화 */}
      <Description key={video.id} video={video} />
      {isMobile ? <MobileComments key={video.id} videoId={video.id} /> : <Comments key={video.id} videoId={video.id} />}
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
      {/* 접혀 있을 땐 첫 문단만, 펼치면 전체 (라이선스 표기 포함) */}
      <p className="description-text">{expanded ? video.description : video.description.split('\n\n')[0]}</p>
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
    <button
      className="pill"
      onClick={() => {
        userStore.toggleWatchLater(videoId);
        toast(saved ? '나중에 볼 동영상에서 삭제됨' : '나중에 볼 동영상에 저장됨');
      }}
      aria-pressed={saved}
    >
      <Icon name="clock" />
      <span>{saved ? '저장됨' : '나중에 보기'}</span>
    </button>
  );
}

// 휴대폰: 댓글은 처음엔 "댓글 N + 인기 댓글 한 줄" 카드로 접혀 있고, 누르면 펼쳐져요 (YouTube 앱과 같은 방식)
function MobileComments({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const { data: comments } = useAsync(getComments, videoId);
  if (open) return <Comments videoId={videoId} />;
  const top = comments?.[0];
  return (
    <button className="comments-card" onClick={() => setOpen(true)}>
      <span className="comments-card-head">
        댓글 <span className="comments-card-count">{comments?.length ?? ''}</span>
      </span>
      {top && (
        <span className="comments-card-top">
          <span className="avatar tiny" style={{ background: top.authorColor }}>{top.author.replace('@', '')[0]}</span>
          <span className="comments-card-text">{top.text}</span>
        </span>
      )}
    </button>
  );
}

function ShareButton({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(0);
  return (
    <>
      <button
        className="pill"
        onClick={() => {
          setTime(videoEl.currentTime);
          setOpen(true);
        }}
      >
        <Icon name="share" />
        <span>공유</span>
      </button>
      {open && <ShareDialog videoId={videoId} currentTime={time} onClose={() => setOpen(false)} />}
    </>
  );
}
