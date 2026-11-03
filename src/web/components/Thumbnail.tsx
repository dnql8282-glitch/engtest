import type { Video } from '../../core/types';
import { formatDuration } from '../../core/format';

// 실제 썸네일 이미지 대신 그라데이션 + 제목으로 만든 썸네일 (서버/이미지 파일 없이 동작)
export function Thumbnail({ video }: { video: Video }) {
  const [from, to] = video.thumbnailColors;
  return (
    <div className="thumbnail" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <span className="thumbnail-title">{video.title}</span>
      <span className="duration">{formatDuration(video.durationSec)}</span>
    </div>
  );
}
