import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { VideoWithChannel } from '@mytube/core/types';
import { getRelatedVideos } from '@mytube/core/videoService';
import { getComments } from '@mytube/core/commentService';
import { formatCount, formatDate, formatFullCount, formatRelativeTime } from '@mytube/core/format';
import { userStore } from '@mytube/core/userStore';
import { playerStore } from '@mytube/core/playerStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { useTheme } from '../theme/useTheme';
import { Avatar } from '../components/Avatar';
import { Icon, type IconName } from '../components/Icon';
import { SubscribeButton } from '../components/SubscribeButton';
import { VideoCard } from '../components/VideoCard';
import { CommentsSheet } from './CommentsSheet';
import { DescriptionSheet } from './DescriptionSheet';

// 시청 화면의 영상 아래 부분 (iOS 앱 구성)
//   제목 → 조회수·날짜 ...더보기 → 채널 줄 → 가로 스크롤 버튼들 → 댓글 미리보기 카드 → 추천 영상
export function WatchDetails({ video }: { video: VideoWithChannel }) {
  const { t } = useTheme();
  const { data: related = [] } = useAsync(getRelatedVideos, video.id);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  return (
    <>
      <FlatList
        data={related}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 12 }}>
            <Pressable onPress={() => setDescOpen(true)} style={{ paddingHorizontal: 12, paddingTop: 12 }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', lineHeight: 24 }}>{video.title}</Text>
              <Text style={{ color: t.textSub, fontSize: 12, marginTop: 6 }}>
                조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)} #{video.category}{' '}
                <Text style={{ color: t.text, fontWeight: '600' }}>...더보기</Text>
              </Text>
            </Pressable>

            <ChannelRow video={video} />
            <ActionPills video={video} />
            <CommentsPreview videoId={video.id} onPress={() => setCommentsOpen(true)} />
          </View>
        }
      />
      <CommentsSheet videoId={video.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <DescriptionSheet visible={descOpen} onClose={() => setDescOpen(false)}>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{video.title}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
          <Stat value={formatFullCount(video.likes)} label="좋아요" />
          <Stat value={formatFullCount(video.views)} label="조회수" />
          <Stat value={formatDate(video.uploadedAt)} label="업로드" />
        </View>
        <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>{video.description}</Text>
      </DescriptionSheet>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ChannelRow({ video }: { video: VideoWithChannel }) {
  const { t } = useTheme();
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 }}>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
        onPress={() => {
          playerStore.minimize(); // 채널로 이동할 때 플레이어는 미니로 접어서 계속 재생
          router.push(`/channel/${video.channel.id}`);
        }}
      >
        <Avatar name={video.channel.name} color={video.channel.avatarColor} size={32} />
        <Text numberOfLines={1} style={{ color: t.text, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{video.channel.name}</Text>
        <Text style={{ color: t.textSub, fontSize: 12 }}>{formatCount(video.channel.subscribers)}</Text>
      </Pressable>
      <SubscribeButton channelId={video.channel.id} />
    </View>
  );
}

function ActionPills({ video }: { video: VideoWithChannel }) {
  const { t } = useTheme();
  const { ratings, watchLater } = useUserState();
  const rating = ratings[video.id] ?? null;
  const saved = watchLater.includes(video.id);
  const likes = video.likes + (rating === 'like' ? 1 : 0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
      {/* 좋아요 | 싫어요 붙은 버튼 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 34, borderRadius: 17, backgroundColor: t.surface }}>
        <Pressable
          onPress={() => userStore.toggleRating(video.id, 'like')}
          accessibilityLabel="좋아요"
          accessibilityState={{ selected: rating === 'like' }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 10, height: '100%' }}
        >
          <Icon name={rating === 'like' ? 'thumb-up' : 'thumb-up-off-alt'} size={20} color={t.text} />
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{formatCount(likes)}</Text>
        </Pressable>
        <View style={{ width: 1, height: 20, backgroundColor: t.divider }} />
        <Pressable
          onPress={() => userStore.toggleRating(video.id, 'dislike')}
          accessibilityLabel="싫어요"
          accessibilityState={{ selected: rating === 'dislike' }}
          style={{ paddingLeft: 10, paddingRight: 12, height: '100%', justifyContent: 'center' }}
        >
          <Icon name={rating === 'dislike' ? 'thumb-down' : 'thumb-down-off-alt'} size={20} color={t.text} />
        </Pressable>
      </View>
      <Pill icon="share" label="공유" onPress={() => void Share.share({ message: `${video.title} — mytube://watch/${video.id}` })} />
      <Pill icon="watch-later" label={saved ? '저장됨' : '나중에 보기'} onPress={() => userStore.toggleWatchLater(video.id)} />
      <Pill icon="download" label="오프라인 저장" onPress={() => Alert.alert('오프라인 저장', '영상 파일 저장은 다음 단계에서 다뤄요.')} />
    </ScrollView>
  );
}

function Pill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 17,
        backgroundColor: pressed ? t.surfaceHover : t.surface,
      })}
    >
      <Icon name={icon} size={20} color={t.text} />
      <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

// 댓글 미리보기 카드: "댓글 N" + 인기 댓글 한 줄 (누르면 댓글 시트)
function CommentsPreview({ videoId, onPress }: { videoId: string; onPress: () => void }) {
  const { t } = useTheme();
  const { data: comments } = useAsync(getComments, videoId);
  const top = comments?.[0];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ marginHorizontal: 12, marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: pressed ? t.surfaceHover : t.surface })}
    >
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
        댓글 <Text style={{ color: t.textSub, fontWeight: '400' }}>{comments?.length ?? ''}</Text>
      </Text>
      {top && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Avatar name={top.author} color={top.authorColor} size={24} />
          <Text numberOfLines={2} style={{ flex: 1, color: t.text, fontSize: 13 }}>{top.text}</Text>
        </View>
      )}
    </Pressable>
  );
}
