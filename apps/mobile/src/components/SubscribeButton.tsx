import { Pressable, Text } from 'react-native';
import { userStore } from '@mytube/core/userStore';
import { useUserState } from '@mytube/hooks/useUserStore';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';

// 웹의 SubscribeButton과 같은 로직 (userStore), 그리는 방법만 React Native
export function SubscribeButton({ channelId }: { channelId: string }) {
  const { t } = useTheme();
  const { subscriptions } = useUserState();
  const subscribed = subscriptions.includes(channelId);
  return (
    <Pressable
      onPress={() => userStore.toggleSubscription(channelId)}
      accessibilityRole="button"
      accessibilityState={{ selected: subscribed }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: subscribed ? t.surface : t.invertBg,
      }}
    >
      {subscribed && <Icon name="notifications-none" size={18} color={t.text} />}
      <Text style={{ color: subscribed ? t.text : t.invertText, fontSize: 14, fontWeight: '600' }}>
        {subscribed ? '구독중' : '구독'}
      </Text>
    </Pressable>
  );
}
