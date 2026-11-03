import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { layout } from '../theme/tokens';
import { Icon } from './Icon';
import { Logo } from './Logo';

// iOS 앱 상단 바: 왼쪽 로고, 오른쪽 [전송 · 알림 · 검색]
export function TopBar({ title }: { title?: React.ReactNode }) {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top,
        height: layout.topBarHeight + insets.top,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: t.bg,
      }}
    >
      {title ?? <Logo />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <IconButton name="cast" color={t.text} onPress={() => {}} label="TV로 전송" />
        <IconButton name="notifications-none" color={t.text} onPress={() => {}} label="알림" />
        <IconButton name="search" color={t.text} onPress={() => router.push('/search')} label="검색" />
      </View>
    </View>
  );
}

export function IconButton({
  name,
  color,
  onPress,
  label,
  size = 24,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  color: string;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ padding: 8, borderRadius: 20, opacity: pressed ? 0.5 : 1 })}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}
