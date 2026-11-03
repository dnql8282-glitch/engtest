import { useSearchParams } from 'react-router-dom';
import { searchVideos } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { ListSkeleton, VideoListItem } from '../components/VideoListItem';
import { EmptyState } from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// 검색 결과: /results?search_query=검색어
export function ResultsPage() {
  const [params] = useSearchParams();
  const query = params.get('search_query') ?? '';
  const { data: results, loading } = useAsync(searchVideos, query);
  useDocumentTitle(query);

  return (
    <div className="results">
      {loading || !results ? (
        <ListSkeleton />
      ) : results.length === 0 ? (
        <EmptyState emoji="🔍" title="검색결과가 없습니다" text="다른 키워드를 사용해 보거나 검색 필터를 삭제하세요." />
      ) : (
        results.map((v) => <VideoListItem key={v.id} video={v} />)
      )}
    </div>
  );
}
