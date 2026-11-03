import { userStore } from '../../core/userStore';
import { useUserState } from '../hooks/useUserStore';
import { Icon } from './Icon';
import { Menu, type MenuItem } from './Menu';

// 영상 카드의 ⋮ 메뉴. 화면마다 추가 항목(예: 시청 기록에서 삭제)을 넣을 수 있어요.
export function VideoActionsMenu({ videoId, extra = [] }: { videoId: string; extra?: MenuItem[] }) {
  const { watchLater } = useUserState();
  const saved = watchLater.includes(videoId);
  const items: MenuItem[] = [
    {
      icon: <Icon name="clock" />,
      label: saved ? '나중에 볼 동영상에서 삭제' : '나중에 볼 동영상에 저장',
      onSelect: () => userStore.toggleWatchLater(videoId),
    },
    ...extra,
  ];
  return (
    <Menu
      items={items}
      trigger={(props) => (
        <button className="card-menu" aria-label="작업 메뉴" {...props}>
          <Icon name="moreVert" />
        </button>
      )}
    />
  );
}
