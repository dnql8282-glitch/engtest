import { useSearchParams } from 'react-router-dom';
import type { Category, VideoWithChannel } from '@mytube/core/types';
import { categories, getVideos } from '@mytube/core/videoService';
import { VideoCard } from '../components/VideoCard';
import { useAsync } from '@mytube/hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// 홈: 카테고리 칩 + 영상 그리드
// 선택한 카테고리는 주소(?category=음악)에 담아요. 사이드바 "탐색" 메뉴도 이 주소로 연결돼요.
export function HomePage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('category');
  const category: Category = categories.includes(raw as Category) ? (raw as Category) : '전체';
  const { data: videos, loading } = useAsync(getVideos, category);
  useDocumentTitle(null);

  return (
    <div className="home">
      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? 'active' : ''}`}
            onClick={() => setParams(c === '전체' ? {} : { category: c })}
          >
            {c}
          </button>
        ))}
      </div>
      <VideoGrid videos={loading ? undefined : videos} />
    </div>
  );
}

export function VideoGrid({ videos, showChannel = true }: { videos?: VideoWithChannel[]; showChannel?: boolean }) {
  return (
    <div className="grid">
      {!videos
        ? Array.from({ length: 9 }, (_, i) => (
            <div key={i}>
              <div className="skeleton-thumb" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))
        : videos.map((v) => <VideoCard key={v.id} video={v} showChannel={showChannel} />)}
    </div>
  );
}
