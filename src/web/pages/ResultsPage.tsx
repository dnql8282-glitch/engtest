import { Link, useSearchParams } from 'react-router-dom';
import type { VideoWithChannel } from '../../core/types';
import { searchVideos } from '../../core/videoService';
import { formatCount, formatRelativeTime } from '../../core/format';
import { useAsync } from '../hooks/useAsync';
import { Thumbnail } from '../components/Thumbnail';
import { Icon } from '../components/Icon';

// 검색 결과: /results?search_query=검색어
export function ResultsPage() {
  const [params] = useSearchParams();
  const query = params.get('search_query') ?? '';
  const { data: results, loading } = useAsync(searchVideos, query);

  return (
    <div className="results">
      {loading || !results ? (
        Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="result-row">
            <div className="result-thumb skeleton-thumb" />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))
      ) : results.length === 0 ? (
        <div className="not-found">
          <p className="not-found-emoji">🔍</p>
          <h2>검색결과가 없습니다</h2>
          <p>다른 키워드를 사용해 보거나 검색 필터를 삭제하세요.</p>
        </div>
      ) : (
        results.map((v) => <ResultRow key={v.id} video={v} />)
      )}
    </div>
  );
}

function ResultRow({ video }: { video: VideoWithChannel }) {
  return (
    <div className="result-row">
      <Link to={`/watch/${video.id}`} className="result-thumb">
        <Thumbnail video={video} />
      </Link>
      <div className="result-text">
        <div className="result-title-row">
          <Link to={`/watch/${video.id}`}>
            <h3 className="result-title">{video.title}</h3>
          </Link>
          <button className="card-menu" aria-label="작업 메뉴">
            <Icon name="moreVert" />
          </button>
        </div>
        <p className="result-meta">
          조회수 {formatCount(video.views)}회 · {formatRelativeTime(video.uploadedAt)}
        </p>
        <div className="result-channel">
          <span className="avatar tiny" style={{ background: video.channel.avatarColor }}>
            {video.channel.name[0]}
          </span>
          <span>{video.channel.name}</span>
        </div>
        <p className="result-desc">{video.description}</p>
      </div>
    </div>
  );
}
