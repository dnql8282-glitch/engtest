import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVideosByIds } from '@mytube/core/videoService';
import { likedVideoIds } from '@mytube/core/userStore';
import { playerStore } from '@mytube/core/playerStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { IconButton } from '../../components/TopBar';
import { VideoRow } from '../../components/VideoRow';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/EmptyState';
import { Screen, useBottomSpace } from '../../components/Screen';
import { mediaUrl } from '@mytube/core/media';

// 재생목록: /playlist/LL (좋아요) · /playlist/WL (나중에 볼) — 웹 PlaylistPage와 같은 로직
const META = {
  LL: { title: '좋아요 표시한 동영상', empty: '좋아요 표시한 동영상이 없습니다' },
  WL: { title: '나중에 볼 동영상', empty: '나중에 볼 동영상이 없습니다' },
} as const;

export default function PlaylistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { list = 'LL' } = useLocalSearchParams<{ list: string }>();
  const user = useUserState();
  const key = list === 'WL' ? 'WL' : 'LL';
  const ids = key === 'LL' ? likedVideoIds(user) : user.watchLater;
  const { data: videos = [] } = useAsync(getVideosByIds, ids.join(','));
  const bottom = useBottomSpace();
  const cover = videos[0];

  return (
    <Screen>
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingBottom: bottom }}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top, backgroundColor: '#2a2a2a', marginBottom: 8 }}>
            {cover && <Image source={{ uri: mediaUrl(cover.thumbnailUrl) }} blurRadius={30} style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />}
            <View style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
              <IconButton name="arrow-back" color="#fff" onPress={() => router.back()} label="뒤로" />
            </View>
            <View style={{ padding: 16, gap: 8 }}>
              {cover && <Image source={{ uri: mediaUrl(cover.thumbnailUrl) }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} />}
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 8 }}>{META[key].title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>나 · 동영상 {ids.length}개 · 비공개</Text>
              {videos.length > 0 && (
                <Pressable
                  onPress={() => playerStore.open(videos[0].id)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 20, backgroundColor: '#fff', marginTop: 8 }}
                >
                  <Icon name="play-arrow" color="#0f0f0f" />
                  <Text style={{ color: '#0f0f0f', fontWeight: '600' }}>모두 재생</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState emoji="📂" title={META[key].empty} />}
        renderItem={({ item }) => <VideoRow video={item} />}
      />
    </Screen>
  );
}
