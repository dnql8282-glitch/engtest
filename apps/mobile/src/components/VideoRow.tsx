import { Pressable, Text, View } from 'react-native';
import type { VideoWithChannel } from '@mytube/core/types';
import { formatCount, formatRelativeTime } from '@mytube/core/format';
import { playerStore } from '@mytube/core/playerStore';
import { useTheme } from '../theme/useTheme';
import { Thumbnail } from './Thumbnail';

// 작은 가로형 행 (재생목록, 시청 기록, 검색 결과에서 사용)
export function VideoRow({ video, trailing }: { video: VideoWithChannel; trailing?: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={() => playerStore.open(video.id)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: pressed ? t.surface : 'transparent',
      })}
    >
      <Thumbnail video={video} radius={8} style={{ width: 160 }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ color: t.text, fontSize: 14, fontWeight: '500', lineHeight: 20 }}>
          {video.title}
        </Text>
        <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 12, marginTop: 4 }}>
          {video.channel.name}
        </Text>
        <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 12 }}>
          조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
        </Text>
      </View>
      {trailing}
    </Pressable>
  );
}
