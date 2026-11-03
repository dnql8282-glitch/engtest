import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchVideos } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { IconButton } from '../components/TopBar';
import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { Screen, useBottomSpace } from '../components/Screen';
import { useTheme } from '../theme/useTheme';

// 검색 결과: 웹의 /results?search_query= 와 같은 개념 (주소 파라미터 q)
export default function ResultsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q = '' } = useLocalSearchParams<{ q: string }>();
  const { data } = useAsync(searchVideos, q);
  const bottom = useBottomSpace();

  return (
    <Screen>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4, height: 48 + insets.top }}>
        <IconButton name="arrow-back" color={t.text} onPress={() => router.back()} label="뒤로" />
        <Pressable
          onPress={() => router.push('/search')}
          style={{ flex: 1, height: 36, borderRadius: 18, paddingHorizontal: 16, backgroundColor: t.surface, justifyContent: 'center' }}
        >
          <Text style={{ color: t.text, fontSize: 15 }} numberOfLines={1}>{q}</Text>
        </Pressable>
        <IconButton name="mic" color={t.text} onPress={() => {}} label="음성 검색" />
      </View>
      {!data ? (
        <ActivityIndicator color={t.textSub} style={{ marginTop: 48 }} />
      ) : data.length === 0 ? (
        <EmptyState emoji="🔍" title="검색결과가 없습니다" text="다른 키워드를 사용해 보세요." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottom }}
        />
      )}
    </Screen>
  );
}
