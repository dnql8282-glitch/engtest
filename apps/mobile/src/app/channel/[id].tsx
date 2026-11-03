import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChannelPage } from '@mytube/core/videoService';
import { formatCount } from '@mytube/core/format';
import { useAsync } from '@mytube/hooks/useAsync';
import { IconButton } from '../../components/TopBar';
import { Avatar } from '../../components/Avatar';
import { SubscribeButton } from '../../components/SubscribeButton';
import { VideoCard } from '../../components/VideoCard';
import { EmptyState } from '../../components/EmptyState';
import { Screen, useBottomSpace } from '../../components/Screen';
import { useTheme } from '../../theme/useTheme';

export default function ChannelScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = useAsync(getChannelPage, id);
  const bottom = useBottomSpace();

  return (
    <Screen>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', height: 48 + insets.top, paddingHorizontal: 4 }}>
        <IconButton name="arrow-back" color={t.text} onPress={() => router.back()} label="뒤로" />
        <Text style={{ flex: 1, color: t.text, fontSize: 18, fontWeight: '600' }} numberOfLines={1}>{data?.channel.name}</Text>
        <IconButton name="search" color={t.text} onPress={() => router.push('/search')} label="검색" />
      </View>
      {loading ? (
        <ActivityIndicator color={t.textSub} style={{ marginTop: 48 }} />
      ) : !data ? (
        <EmptyState emoji="📺" title="채널을 찾을 수 없어요" />
      ) : (
        <FlatList
          data={data.videos}
          keyExtractor={(v) => v.id}
          ListHeaderComponent={
            <View>
              <View style={{ height: 96, marginHorizontal: 12, borderRadius: 12, backgroundColor: data.channel.avatarColor, opacity: 0.85 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
                <Avatar name={data.channel.name} color={data.channel.avatarColor} size={72} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{data.channel.name}</Text>
                  <Text style={{ color: t.textSub, fontSize: 12 }}>
                    @{data.channel.id} · 구독자 {formatCount(data.channel.subscribers)}명 · 동영상 {data.videos.length}개
                  </Text>
                </View>
              </View>
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, alignItems: 'flex-start' }}>
                <SubscribeButton channelId={data.channel.id} />
              </View>
              <View style={{ borderBottomWidth: 0.5, borderBottomColor: t.divider, marginBottom: 12, paddingHorizontal: 16 }}>
                <Text style={{ color: t.text, fontWeight: '600', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: t.text, alignSelf: 'flex-start' }}>동영상</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => <VideoCard video={item} showChannel={false} />}
          contentContainerStyle={{ paddingBottom: bottom }}
        />
      )}
    </Screen>
  );
}
