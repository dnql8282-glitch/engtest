import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureStore } from '@mytube/core/storage';
import { userStore } from '@mytube/core/userStore';
import { asyncStorageStore } from '../platform/asyncStorageStore';
import { PlayerOverlay } from '../player/PlayerOverlay';
import { useTheme } from '../theme/useTheme';
import { setMediaBase } from '@mytube/core/media';

// 앱 시작 준비 — 웹의 main.tsx와 똑같은 두 줄. 저장소 구현만 다름(AsyncStorage).
configureStore(asyncStorageStore);
void userStore.init();
// 썸네일·영상 파일이 있는 서버 주소 (.env의 EXPO_PUBLIC_MEDIA_BASE, 예: 같은 와이파이의 PC에서 띄운 웹 개발 서버)
setMediaBase(process.env.EXPO_PUBLIC_MEDIA_BASE ?? '');

// 화면 구조
//   Stack (앞으로/뒤로 쌓이는 화면)
//    ├─ (tabs)        하단 탭 5개: 홈 · 쇼츠 · 만들기 · 구독 · 나
//    ├─ search        검색 (탭 위로 덮음)
//    ├─ results       검색 결과
//    ├─ channel/[id]  채널
//    └─ playlist/[list] 재생목록
//   PlayerOverlay     ← 모든 화면 위에 떠 있는 플레이어 (페이지가 아님!)
export default function RootLayout() {
  const { t, isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
        </Stack>
        <PlayerOverlay />
      </View>
    </SafeAreaProvider>
  );
}
