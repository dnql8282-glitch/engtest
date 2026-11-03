import { getFeedForChannels } from '../../core/videoService';
import { useAsync } from '../hooks/useAsync';
import { useUserState } from '../hooks/useUserStore';
import { EmptyState } from '../components/EmptyState';
import { VideoGrid } from './HomePage';

// 구독 피드: /feed/subscriptions — 구독한 채널의 영상만 최신순
export function SubscriptionsPage() {
  const { subscriptions, loaded } = useUserState();
  // 배열은 매번 새로 만들어져서 비교가 어려우니, 문자열 키로 바꿔서 넘겨요
  const { data } = useAsync(getFeedForChannels, subscriptions.join(','));

  if (loaded && subscriptions.length === 0) {
    return <EmptyState emoji="📺" title="구독한 채널이 없습니다" text="마음에 드는 채널을 구독하면 새 영상이 여기에 표시됩니다." />;
  }
  return (
    <div className="feed">
      <h1 className="page-title padded">최신순</h1>
      <VideoGrid videos={data} />
    </div>
  );
}
