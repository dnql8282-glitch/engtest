import { useState } from 'react';
import type { Category } from '../../core/types';
import { categories, getVideos } from '../../core/videoService';
import { VideoCard } from '../components/VideoCard';
import { useAsync } from '../hooks/useAsync';

// 홈: 카테고리 칩 + 영상 그리드
export function HomePage() {
  const [category, setCategory] = useState<Category>('전체');
  const { data: videos, loading } = useAsync(getVideos, category);

  return (
    <div className="home">
      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid">
        {loading || !videos
          ? Array.from({ length: 9 }, (_, i) => (
              <div key={i}>
                <div className="skeleton-thumb" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))
          : videos.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </div>
  );
}
