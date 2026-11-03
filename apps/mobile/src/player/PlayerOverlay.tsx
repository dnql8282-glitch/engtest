import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  PanResponder,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getVideo } from '@mytube/core/videoService';
import { playerStore } from '@mytube/core/playerStore';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { usePlayerState } from '@mytube/hooks/usePlayerState';
import { useTheme } from '../theme/useTheme';
import { layout } from '../theme/tokens';
import { Icon } from '../components/Icon';
import { PlayerControls } from './PlayerControls';
import { WatchDetails } from './WatchDetails';

// ─────────────────────────────────────────────────────────────────────────────
// 앱 전체에 딱 하나 있는 플레이어.
// 화면(페이지)이 아니라 모든 화면 "위에" 떠 있어서, 탭을 옮겨도 영상이 끊기지 않아요.
//   progress 0 = 전체 화면, 1 = 미니 플레이어(탭 바 위)
// 아래로 끌어내리면 미니로 접히고, 미니를 누르거나 위로 끌면 다시 펼쳐져요.
//
// 백그라운드·잠금 화면·PiP는 expo-video 기능을 켜서 구현해요:
//   app.json 플러그인: supportsBackgroundPlayback, supportsPictureInPicture
//   player.staysActiveInBackground = true      → 앱을 나가거나 화면을 잠가도 계속 재생
//   player.showNowPlayingNotification = true   → 잠금 화면·제어 센터에 재생 컨트롤 표시
//   <VideoView allowsPictureInPicture startsPictureInPictureAutomatically>
//                                              → 홈으로 나가면 자동으로 PiP 창
// ─────────────────────────────────────────────────────────────────────────────

const MINI_H = layout.miniPlayerHeight;
const MINI_W = Math.round((MINI_H * 16) / 9);

export function PlayerOverlay() {
  const { t } = useTheme();
  const { videoId, mode } = usePlayerState();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === '(tabs)';
  const { data: video } = useAsync(getVideo, videoId ?? '');

  // 플레이어 엔진(소리·영상 재생)은 한 번만 만들고, 영상이 바뀌면 소스만 교체해요.
  const player = useVideoPlayer(null, (p) => {
    p.staysActiveInBackground = true;
    p.showNowPlayingNotification = true;
    p.timeUpdateEventInterval = 0.25;
  });
  const videoViewRef = useRef<VideoView>(null);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (!video) return;
    // metadata는 잠금 화면/제어 센터의 "지금 재생 중"에 표시돼요.
    void player
      .replaceAsync({
        uri: video.videoUrl,
        metadata: { title: video.title, artist: video.channel.name, artwork: video.thumbnailUrl },
      })
      .then(() => player.play());
    userStore.recordWatch(video.id);
  }, [video, player]);

  useEffect(() => {
    if (!videoId) player.pause();
  }, [videoId, player]);

  // ── 전체 ↔ 미니 애니메이션 ──────────────────────────────────────────────
  const bottomOffset = inTabs ? layout.tabBarHeight + insets.bottom : insets.bottom;
  const range = H - bottomOffset - MINI_H; // 전체 화면 위치에서 미니 위치까지 내려가는 거리
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!mode) return;
    Animated.spring(progress, {
      toValue: mode === 'full' ? 0 : 1,
      useNativeDriver: false,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [mode, progress]);

  // 안드로이드 뒤로가기: 전체 화면이면 미니로 접기
  useEffect(() => {
    if (Platform.OS === 'web') return; // 웹에는 하드웨어 뒤로가기 버튼이 없어요
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (playerStore.getSnapshot().mode === 'full') {
        playerStore.minimize();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  // 손가락으로 끌기 (세로 방향만)
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);
  // 손을 뗐을 때: 충분히 내렸으면 미니, 아니면 원래 자리로
  const settle = (dy: number, vy: number) => {
    const wasMini = playerStore.getSnapshot().mode === 'mini';
    const goMini = wasMini ? !(dy < -60 || vy < -0.5) : dy > 120 || vy > 0.5;
    if (goMini) playerStore.minimize();
    else playerStore.expand();
    // 상태가 그대로면 effect가 다시 안 돌아서, 직접 제자리로 돌려놔요
    Animated.spring(progress, { toValue: goMini ? 1 : 0, useNativeDriver: false, bounciness: 0 }).start();
  };
  const settleRef = useRef(settle);
  useEffect(() => {
    settleRef.current = settle;
  });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => {
        const start = playerStore.getSnapshot().mode === 'mini' ? 1 : 0;
        const next = Math.min(1, Math.max(0, start + g.dy / rangeRef.current));
        progress.setValue(next);
      },
      // 다른 요소(스크롤, 버튼)가 제스처를 빼앗지 못하게 해요
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => settleRef.current(g.dy, g.vy),
      // 시스템이 제스처를 끊어도(전화 수신 등) 중간에 멈춰 있지 않도록 똑같이 마무리
      onPanResponderTerminate: (_, g) => settleRef.current(g.dy, g.vy),
    }),
  ).current;

  if (!videoId) return null;

  const videoFullH = (W * 9) / 16;
  const isFull = mode === 'full';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: progress.interpolate({ inputRange: [0, 1], outputRange: [0, range] }),
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [H, MINI_H] }),
        backgroundColor: isFull ? t.bg : t.sheet,
        borderTopWidth: isFull ? 0 : 0.5,
        borderTopColor: t.divider,
        overflow: 'hidden',
      }}
    >
      {/* 상태 표시줄(노치) 영역: 전체 화면일 때만 검은 띠 */}
      <Animated.View
        style={{
          height: progress.interpolate({ inputRange: [0, 1], outputRange: [insets.top, 0] }),
          backgroundColor: '#000',
        }}
      />

      <View {...pan.panHandlers}>
        <Animated.View
          style={{
            width: progress.interpolate({ inputRange: [0, 1], outputRange: [W, MINI_W] }),
            height: progress.interpolate({ inputRange: [0, 1], outputRange: [videoFullH, MINI_H] }),
            backgroundColor: '#000',
          }}
        >
          <VideoView
            ref={videoViewRef}
            player={player}
            style={{ width: '100%', height: '100%' }}
            nativeControls={false}
            contentFit="contain"
            allowsPictureInPicture
            startsPictureInPictureAutomatically
          />
          {isFull && video && (
            <PlayerControls
              player={player}
              isPlaying={isPlaying}
              onMinimize={() => playerStore.minimize()}
              onPictureInPicture={() => void videoViewRef.current?.startPictureInPicture().catch(() => {})}
              onFullscreen={() => void videoViewRef.current?.enterFullscreen()}
            />
          )}
        </Animated.View>

        {/* 미니 플레이어의 글자·버튼 줄 */}
        {!isFull && video && (
          <Pressable
            onPress={() => playerStore.expand()}
            style={{ position: 'absolute', left: MINI_W, right: 0, top: 0, height: MINI_H, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}
          >
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: t.text, fontSize: 14, fontWeight: '500' }}>{video.title}</Text>
              <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>{video.channel.name}</Text>
            </View>
            <Pressable
              onPress={() => (isPlaying ? player.pause() : player.play())}
              accessibilityLabel={isPlaying ? '일시정지' : '재생'}
              style={{ padding: 12 }}
            >
              <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={28} color={t.text} />
            </Pressable>
            <Pressable onPress={() => playerStore.close()} accessibilityLabel="닫기" style={{ padding: 12 }}>
              <Icon name="close" size={24} color={t.text} />
            </Pressable>
          </Pressable>
        )}
      </View>

      {/* 영상 정보, 댓글, 추천 (전체 화면일 때만) */}
      <Animated.View
        pointerEvents={isFull ? 'auto' : 'none'}
        style={{ flex: 1, opacity: progress.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' }) }}
      >
        {video && <WatchDetails key={video.id} video={video} />}
      </Animated.View>
    </Animated.View>
  );
}
