import { useEffect, useState } from 'react';
import type { Category, VideoWithChannel } from '../../core/types';
import { categories, getVideos } from '../../core/videoService';
import { VideoCard } from '../components/VideoCard';

// 홈: 카테고리 칩 + 영상 그리드
export function HomePage() {
  const [category, setCategory] = useState<Category>('전체');
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // 카테고리를 빠르게 바꿀 때 이전 요청 결과를 무시하기 위한 플래그
    getVideos(category).then((list) => {
      if (cancelled) return;
      setVideos(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="home">
      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? 'active' : ''}`}
            onClick={() => {
              setLoading(true); // 로딩 표시는 클릭한 순간에 켜요
              setCategory(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid">
        {loading
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
