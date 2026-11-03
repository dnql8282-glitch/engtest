import type { Video } from '@mytube/core/types';
import { userStore } from '@mytube/core/userStore';
import { formatCount } from '@mytube/core/format';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Icon } from './Icon';

// 좋아요/싫어요 버튼. 좋아요 수는 "원래 수 + 내가 누른 것"으로 계산해요(저장하지 않고 계산 = 파생 상태).
export function RatingButtons({ video }: { video: Video }) {
  const { ratings } = useUserState();
  const rating = ratings[video.id] ?? null;
  const likes = video.likes + (rating === 'like' ? 1 : 0);

  return (
    <div className="pill segmented">
      <button
        className={`pill-part ${rating === 'like' ? 'active' : ''}`}
        onClick={() => userStore.toggleRating(video.id, 'like')}
        aria-pressed={rating === 'like'}
        aria-label="좋아요"
      >
        <Icon name={rating === 'like' ? 'thumbUp' : 'thumbUpOutline'} />
        <span>{formatCount(likes)}</span>
      </button>
      <span className="pill-divider" />
      <button
        className={`pill-part ${rating === 'dislike' ? 'active' : ''}`}
        onClick={() => userStore.toggleRating(video.id, 'dislike')}
        aria-pressed={rating === 'dislike'}
        aria-label="싫어요"
      >
        <Icon name={rating === 'dislike' ? 'thumbDown' : 'thumbDownOutline'} />
      </button>
    </div>
  );
}
