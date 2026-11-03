import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { VideoWithChannel } from '@mytube/core/types';
import { formatCount, formatRelativeTime } from '@mytube/core/format';
import { playerStore } from '@mytube/core/playerStore';
import { useTheme } from '../theme/useTheme';
import { Thumbnail } from './Thumbnail';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { VideoActionsSheet } from './VideoActionsSheet';
import { useState } from 'react';

// iOS 앱 홈 피드 카드: 화면 너비 꽉 찬 썸네일 + [아바타 | 제목 2줄 / 채널 · 조회수 · 시간 | ⋮]
// 누르면 페이지 이동이 아니라 플레이어를 열어요 (playerStore.open)
export function VideoCard({ video, showChannel = true }: { video: VideoWithChannel; showChannel?: boolean }) {
  const { t } = useTheme();
  const [menu, setMenu] = useState(false);
  return (
    <View style={{ marginBottom: 20 }}>
      <Pressable onPress={() => playerStore.open(video.id)}>
        <Thumbnail video={video} />
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 12, paddingLeft: 12, paddingTop: 12 }}>
        {showChannel && (
          <Link href={`/channel/${video.channel.id}`} asChild>
            <Pressable>
              <Avatar name={video.channel.name} color={video.channel.avatarColor} />
            </Pressable>
          </Link>
        )}
        <Pressable style={{ flex: 1 }} onPress={() => playerStore.open(video.id)}>
          <Text numberOfLines={2} style={{ color: t.text, fontSize: 15, fontWeight: '500', lineHeight: 21 }}>
            {video.title}
          </Text>
          <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 12, marginTop: 4 }}>
            {showChannel ? `${video.channel.name} · ` : ''}조회수 {formatCount(video.views)}회 ·{' '}
            {formatRelativeTime(video.uploadedAt)}
          </Text>
        </Pressable>
        <Pressable onPress={() => setMenu(true)} hitSlop={8} style={{ paddingHorizontal: 8 }} accessibilityLabel="작업 메뉴">
          <Icon name="more-vert" size={20} color={t.text} />
        </Pressable>
      </View>
      <VideoActionsSheet videoId={video.id} visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}
