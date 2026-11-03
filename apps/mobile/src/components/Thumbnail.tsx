import { Image, Text, View, type ViewStyle } from 'react-native';
import type { Video } from '@mytube/core/types';
import { formatDuration } from '@mytube/core/format';

export function Thumbnail({ video, radius = 0, style }: { video: Video; radius?: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        { aspectRatio: 16 / 9, backgroundColor: video.thumbnailColors[0], borderRadius: radius, overflow: 'hidden' },
        style,
      ]}
    >
      <Image source={{ uri: video.thumbnailUrl }} style={{ width: '100%', height: '100%' }} />
      <View
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.7)',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{formatDuration(video.durationSec)}</Text>
      </View>
    </View>
  );
}
