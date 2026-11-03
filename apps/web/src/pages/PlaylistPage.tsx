import { useSearchParams } from 'react-router-dom';
import { getVideosByIds } from '@mytube/core/videoService';
import { likedVideoIds } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { ListSkeleton, VideoListItem } from '../components/VideoListItem';
import { EmptyState } from '../components/EmptyState';
import { NotFoundPage } from './NotFoundPage';

// 재생목록: /playlist?list=LL (좋아요 표시한 동영상) / ?list=WL (나중에 볼 동영상)
// 두 목록은 데이터 출처만 다르고 화면은 같아서, 한 페이지가 주소의 list 값에 따라 출처를 골라요.
const PLAYLISTS = {
  LL: { title: '좋아요 표시한 동영상', empty: '좋아요 표시한 동영상이 없습니다' },
  WL: { title: '나중에 볼 동영상', empty: '나중에 볼 동영상이 없습니다' },
} as const;

export function PlaylistPage() {
  const [params] = useSearchParams();
  const listId = params.get('list');
  const user = useUserState();
  const ids = listId === 'LL' ? likedVideoIds(user) : listId === 'WL' ? user.watchLater : [];
  const { data: videos } = useAsync(getVideosByIds, ids.join(','));

  if (listId !== 'LL' && listId !== 'WL') return <NotFoundPage />;
  const meta = PLAYLISTS[listId];
  const cover = videos?.[0];

  return (
    <div className="playlist">
      <aside
        className="playlist-header"
        style={{ backgroundImage: cover ? `url(${cover.thumbnailUrl})` : undefined }}
      >
        <div className="playlist-header-inner">
          <div className="playlist-cover">
            {cover ? <img src={cover.thumbnailUrl} alt="" /> : <div className="skeleton-thumb" />}
          </div>
          <h1 className="playlist-title">{meta.title}</h1>
          <p className="playlist-owner">나</p>
          <p className="playlist-meta">동영상 {ids.length}개 · 비공개</p>
        </div>
      </aside>
      <div className="playlist-items">
        {ids.length === 0 ? (
          <EmptyState emoji="📂" title={meta.empty} />
        ) : !videos ? (
          <ListSkeleton />
        ) : (
          videos.map((v, i) => <VideoListItem key={v.id} video={v} index={i + 1} compact />)
        )}
      </div>
    </div>
  );
}
