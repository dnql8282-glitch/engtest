import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { formatDuration } from '@mytube/core/format';
import { Icon } from '../components/Icon';

// YouTube 앱 스타일 자체 컨트롤 (기본 iOS 컨트롤 대신)
// 영상을 한 번 누르면 컨트롤이 나타나고, 3초 뒤 저절로 사라져요.
export function PlayerControls({
  player,
  isPlaying,
  onMinimize,
  onPictureInPicture,
  onFullscreen,
}: {
  player: VideoPlayer;
  isPlaying: boolean;
  onMinimize: () => void;
  onPictureInPicture: () => void;
  onFullscreen: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(1);
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const duration = player.duration || 0;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 재생 중이면 3초 뒤 컨트롤 숨기기
  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (visible && isPlaying) hideTimer.current = setTimeout(() => setVisible(false), 3000);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, isPlaying]);

  const ratio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setVisible((v) => !v)}>
      {visible && (
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4 }}>
            <CtrlButton icon="keyboard-arrow-down" label="최소화" onPress={onMinimize} size={30} />
            <CtrlButton icon="picture-in-picture-alt" label="PIP 모드" onPress={onPictureInPicture} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
            <CtrlButton icon="replay-10" label="10초 뒤로" onPress={() => player.seekBy(-10)} size={32} />
            <Pressable
              onPress={() => (isPlaying ? player.pause() : player.play())}
              accessibilityLabel={isPlaying ? '일시정지' : '재생'}
              style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={44} color="#fff" />
            </Pressable>
            <CtrlButton icon="forward-10" label="10초 앞으로" onPress={() => player.seekBy(10)} size={32} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </Text>
            <CtrlButton icon="fullscreen" label="전체 화면" onPress={onFullscreen} />
          </View>
        </View>
      )}

      {/* 빨간 진행 막대: 누른 위치로 이동 */}
      <Pressable
        onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
        onPress={(e) => {
          if (duration > 0) player.currentTime = (e.nativeEvent.locationX / barWidth) * duration;
        }}
        hitSlop={{ top: 12, bottom: 8 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.3)' }}
      >
        <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: '#ff0033' }} />
      </Pressable>
    </Pressable>
  );
}

function CtrlButton({ icon, label, onPress, size = 24 }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; onPress: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8} style={{ padding: 8 }}>
      <Icon name={icon} size={size} color="#fff" />
    </Pressable>
  );
}
