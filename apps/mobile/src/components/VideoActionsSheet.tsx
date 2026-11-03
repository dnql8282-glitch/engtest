import { Share } from 'react-native';
import { userStore } from '@mytube/core/userStore';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Sheet, type SheetItem } from './Sheet';

// 영상 ⋮ 메뉴: 나중에 볼 동영상, 공유 (+ 화면마다 추가 항목)
export function VideoActionsSheet({
  videoId,
  visible,
  onClose,
  extra = [],
}: {
  videoId: string;
  visible: boolean;
  onClose: () => void;
  extra?: SheetItem[];
}) {
  const { watchLater } = useUserState();
  const saved = watchLater.includes(videoId);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      items={[
        {
          icon: 'watch-later',
          label: saved ? '나중에 볼 동영상에서 삭제' : '나중에 볼 동영상에 저장',
          onPress: () => userStore.toggleWatchLater(videoId),
        },
        { icon: 'share', label: '공유', onPress: () => void Share.share({ message: `mytube://watch/${videoId}` }) },
        ...extra,
      ]}
    />
  );
}
