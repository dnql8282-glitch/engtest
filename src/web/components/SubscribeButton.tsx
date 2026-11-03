import { userStore } from '../../core/userStore';
import { useUserState } from '../hooks/useUserStore';
import { Icon } from './Icon';

// 구독 버튼. 상태는 전역 저장소에 있어서, 누르면 사이드바 구독 목록도 함께 바뀌어요.
export function SubscribeButton({ channelId }: { channelId: string }) {
  const { subscriptions } = useUserState();
  const subscribed = subscriptions.includes(channelId);
  return (
    <button
      className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
      onClick={() => userStore.toggleSubscription(channelId)}
      aria-pressed={subscribed}
    >
      {subscribed && <Icon name="bell" size={20} />}
      {subscribed ? '구독중' : '구독'}
    </button>
  );
}
