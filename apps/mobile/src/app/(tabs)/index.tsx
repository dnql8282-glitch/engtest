import { useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import type { Category } from '@mytube/core/types';
import { categories, getVideos } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { TopBar } from '../../components/TopBar';
import { Chips } from '../../components/Chips';
import { VideoCard } from '../../components/VideoCard';
import { Screen, useBottomSpace } from '../../components/Screen';
import { useTheme } from '../../theme/useTheme';

// 홈 탭 — 웹 HomePage와 같은 서비스(getVideos)와 같은 훅(useAsync)을 써요. 그리는 부분만 다름.
export default function HomeScreen() {
  const { t } = useTheme();
  const [category, setCategory] = useState<Category>('전체');
  const { data: videos } = useAsync(getVideos, category);
  const bottom = useBottomSpace();

  return (
    <Screen>
      <TopBar />
      <Chips items={categories} value={category} onChange={setCategory} />
      {!videos ? (
        <ActivityIndicator color={t.textSub} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: bottom }}
        />
      )}
    </Screen>
  );
}
