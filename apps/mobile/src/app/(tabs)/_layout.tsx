import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/useTheme';
import { layout } from '../../theme/tokens';
import { Icon, type IconName } from '../../components/Icon';
import { Avatar } from '../../components/Avatar';

// 하단 탭 바 — YouTube iOS 앱 구성: 홈 · 쇼츠 · (+) · 구독 · 나
const TABS: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  index: { label: '홈', icon: 'home', activeIcon: 'home-filled' },
  shorts: { label: '쇼츠', icon: 'slow-motion-video', activeIcon: 'slow-motion-video' },
  create: { label: '', icon: 'add', activeIcon: 'add' },
  subscriptions: { label: '구독', icon: 'subscriptions', activeIcon: 'subscriptions' },
  you: { label: '나', icon: 'account-circle', activeIcon: 'account-circle' },
};

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        height: layout.tabBarHeight + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: t.bg,
        borderTopWidth: 0.5,
        borderTopColor: t.divider,
      }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;

        if (route.name === 'create') {
          // 가운데 (+) 버튼: 화면 이동 대신 동작만
          return (
            <Pressable
              key={route.key}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="만들기"
              onPress={() => Alert.alert('만들기', '영상 업로드는 서버가 있어야 해서 이 프로젝트에서는 지원하지 않아요.')}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="add" size={28} color={t.text} />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            {route.name === 'you' ? (
              <View style={{ borderWidth: focused ? 1.5 : 0, borderColor: t.text, borderRadius: 14, padding: focused ? 1 : 2.5 }}>
                <Avatar name="나" color="#5c6bc0" size={22} />
              </View>
            ) : (
              <Icon name={focused ? tab.activeIcon : tab.icon} size={24} color={t.text} />
            )}
            <Text style={{ color: t.text, fontSize: 10, fontWeight: focused ? '600' : '400' }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="shorts" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="subscriptions" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
