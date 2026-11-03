import { getTrending } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { ListSkeleton, VideoListItem } from '../components/VideoListItem';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// 인기 급상승: /feed/trending
export function TrendingPage() {
  const { data } = useAsync(getTrending, 'all');
  useDocumentTitle('인기 급상승');
  return (
    <div className="results">
      <h1 className="page-title">
        <span className="page-title-icon trending"><Icon name="fire" size={32} /></span>
        인기 급상승
      </h1>
      {data ? data.map((v, i) => <VideoListItem key={v.id} video={v} index={i + 1} />) : <ListSkeleton />}
    </div>
  );
}
