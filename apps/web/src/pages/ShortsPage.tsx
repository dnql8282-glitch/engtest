import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { VideoWithChannel } from '@mytube/core/types';
import { getShorts } from '@mytube/core/videoService';
import { formatCount } from '@mytube/core/format';
import { playerStore } from '@mytube/core/playerStore';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Icon } from '../components/Icon';
import { SubscribeButton } from '../components/SubscribeButton';

// Shorts: 세로로 한 장씩 넘겨 보는 짧은 영상 (CSS scroll-snap)
// 화면에 보이는 영상만 재생하고, 나머지는 멈춰요 (IntersectionObserver).
// Shorts는 각자 <video>를 가져요. 메인 플레이어와 겹치지 않게 들어올 때 메인 플레이어는 닫아요.
export function ShortsPage() {
  const { data: shorts } = useAsync(getShorts, 'all');
  const [muted, setMuted] = useState(true); // 브라우저 자동재생 정책: 처음엔 음소거로 시작

  useEffect(() => {
    playerStore.close();
  }, []);

  return (
    <div className="shorts">
      {shorts?.map((v) => (
        <ShortItem key={v.id} video={v} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
      ))}
    </div>
  );
}

function ShortItem({ video, muted, onToggleMute }: { video: VideoWithChannel; muted: boolean; onToggleMute: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const { ratings } = useUserState();
  const rating = ratings[video.id] ?? null;

  // 화면에 70% 이상 보이면 처음부터 재생, 벗어나면 멈춤
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.currentTime = 0;
          void el.play().catch(() => {});
          setPaused(false);
          userStore.recordWatch(video.id);
        } else el.pause();
      },
      { threshold: 0.7 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [video.id]);

  return (
    <section className="short" aria-label={video.title}>
      <div className="short-frame">
        <video
          ref={ref}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          loop
          playsInline
          muted={muted}
          onClick={(e) => {
            const v = e.currentTarget;
            if (v.paused) void v.play();
            else v.pause();
            setPaused(v.paused);
          }}
        />
        {paused && (
          <div className="short-paused" aria-hidden="true">
            <Icon name="play" />
          </div>
        )}
        <button className="short-mute" onClick={onToggleMute} aria-label={muted ? '음소거 해제' : '음소거'}>
          <Icon name={muted ? 'volumeOff' : 'volumeUp'} />
        </button>
        <div className="short-info">
          <div className="short-channel">
            <Link to={`/channel/${video.channel.id}`} className="avatar small" style={{ background: video.channel.avatarColor }}>
              {video.channel.name[0]}
            </Link>
            <Link to={`/channel/${video.channel.id}`} className="short-channel-name">
              @{video.channel.name}
            </Link>
            <SubscribeButton channelId={video.channel.id} />
          </div>
          <p className="short-title">{video.title}</p>
        </div>
      </div>
      <div className="short-actions">
        <ShortAction
          icon={rating === 'like' ? 'thumbUp' : 'thumbUpOutline'}
          label={formatCount(video.likes + (rating === 'like' ? 1 : 0))}
          pressed={rating === 'like'}
          onClick={() => userStore.toggleRating(video.id, 'like')}
          aria="좋아요"
        />
        <ShortAction
          icon={rating === 'dislike' ? 'thumbDown' : 'thumbDownOutline'}
          label="싫어요"
          pressed={rating === 'dislike'}
          onClick={() => userStore.toggleRating(video.id, 'dislike')}
          aria="싫어요"
        />
        <Link to={`/watch/${video.id}`} className="short-action" aria-label="댓글 보기">
          <span className="short-action-icon"><Icon name="comment" /></span>
          <span>댓글</span>
        </Link>
        <ShortAction
          icon="share"
          label="공유"
          onClick={() => void navigator.clipboard?.writeText(`${location.origin}/watch/${video.id}`)}
          aria="공유 (링크 복사)"
        />
      </div>
    </section>
  );
}

function ShortAction({
  icon,
  label,
  onClick,
  pressed,
  aria,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onClick: () => void;
  pressed?: boolean;
  aria: string;
}) {
  return (
    <button className="short-action" onClick={onClick} aria-pressed={pressed} aria-label={aria}>
      <span className="short-action-icon"><Icon name={icon} /></span>
      <span>{label}</span>
    </button>
  );
}
