import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getVideosByIds } from '@mytube/core/videoService';
import { likedVideoIds, userStore } from '@mytube/core/userStore';
import { playerStore } from '@mytube/core/playerStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { TopBar } from '../../components/TopBar';
import { Avatar } from '../../components/Avatar';
import { Thumbnail } from '../../components/Thumbnail';
import { Icon, type IconName } from '../../components/Icon';
import { Screen, useBottomSpace } from '../../components/Screen';
import { useTheme } from '../../theme/useTheme';

// "나" 탭: 프로필, 시청 기록(가로 스크롤), 재생목록, 설정
export default function YouScreen() {
  const { t, isDark } = useTheme();
  const user = useUserState();
  const { data: history = [] } = useAsync(getVideosByIds, user.history.map((h) => h.videoId).join(','));
  const bottom = useBottomSpace();
  const liked = likedVideoIds(user);

  return (
    <Screen>
      <TopBar title={<View />} />
      <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Avatar name="나" color="#5c6bc0" size={72} />
          <View>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>나</Text>
            <Text style={{ color: t.textSub, fontSize: 13, marginTop: 2 }}>@me · 공부용 계정</Text>
          </View>
        </View>

        <SectionHeader title="기록" />
        {history.length === 0 ? (
          <Text style={{ color: t.textSub, paddingHorizontal: 16 }}>아직 시청한 영상이 없어요.</Text>
        ) : (
          <FlatList
            horizontal
            data={history}
            keyExtractor={(v) => v.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => playerStore.open(item.id)} style={{ width: 150 }}>
                <Thumbnail video={item} radius={8} />
                <Text numberOfLines={2} style={{ color: t.text, fontSize: 13, fontWeight: '500', marginTop: 6 }}>{item.title}</Text>
                <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 11, marginTop: 2 }}>{item.channel.name}</Text>
              </Pressable>
            )}
          />
        )}

        <SectionHeader title="재생목록" />
        <Row icon="thumb-up-off-alt" label="좋아요 표시한 동영상" sub={`동영상 ${liked.length}개`} href="/playlist/LL" />
        <Row icon="watch-later" label="나중에 볼 동영상" sub={`동영상 ${user.watchLater.length}개`} href="/playlist/WL" />

        <SectionHeader title="설정" />
        <Row
          icon={isDark ? 'light-mode' : 'dark-mode'}
          label={isDark ? '밝은 테마로 바꾸기' : '어두운 테마로 바꾸기'}
          onPress={() => userStore.setTheme(isDark ? 'light' : 'dark')}
        />
        <Row
          icon="delete-outline"
          label="시청 기록 지우기"
          onPress={() =>
            Alert.alert('시청 기록 지우기', '시청 기록을 모두 지울까요?', [
              { text: '취소', style: 'cancel' },
              { text: '지우기', style: 'destructive', onPress: () => userStore.clearHistory() },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { t } = useTheme();
  return <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>{title}</Text>;
}

function Row({ icon, label, sub, href, onPress }: { icon: IconName; label: string; sub?: string; href?: '/playlist/LL' | '/playlist/WL'; onPress?: () => void }) {
  const { t } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={href ? () => router.push(href) : onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? t.surface : 'transparent' })}
    >
      <Icon name={icon} color={t.text} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15 }}>{label}</Text>
        {sub && <Text style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      {href && <Icon name="chevron-right" color={t.textSub} />}
    </Pressable>
  );
}
