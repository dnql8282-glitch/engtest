import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { getChannels, getFeedForChannels } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { TopBar } from '../../components/TopBar';
import { VideoCard } from '../../components/VideoCard';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { Screen, useBottomSpace } from '../../components/Screen';
import { useTheme } from '../../theme/useTheme';

// 구독 탭: 위쪽에 구독 채널 아바타 가로 줄, 아래에 최신 영상
export default function SubscriptionsScreen() {
  const { t } = useTheme();
  const { subscriptions, loaded } = useUserState();
  const { data: channels = [] } = useAsync(getChannels, 'all');
  const { data: feed } = useAsync(getFeedForChannels, subscriptions.join(','));
  const subs = channels.filter((c) => subscriptions.includes(c.id));
  const bottom = useBottomSpace();

  return (
    <Screen>
      <TopBar />
      {loaded && subs.length === 0 ? (
        <EmptyState emoji="📺" title="구독한 채널이 없습니다" text="마음에 드는 채널을 구독하면 새 영상이 여기에 표시됩니다." />
      ) : (
        <FlatList
          data={feed ?? []}
          keyExtractor={(v) => v.id}
          ListHeaderComponent={
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingHorizontal: 12, paddingVertical: 12 }}
              style={{ flexGrow: 0, flexShrink: 0, borderBottomWidth: 0.5, borderBottomColor: t.divider, marginBottom: 12 }}
            >
              {subs.map((c) => (
                <Link key={c.id} href={`/channel/${c.id}`} asChild>
                  <Pressable style={{ alignItems: 'center', width: 64, gap: 6 }}>
                    <Avatar name={c.name} color={c.avatarColor} size={56} />
                    <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 11 }}>{c.name}</Text>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          }
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={{ paddingBottom: bottom }}
        />
      )}
    </Screen>
  );
}
