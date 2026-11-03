import type { Video } from '@mytube/core/types';
import { formatDuration } from '@mytube/core/format';

// 썸네일 이미지 + 오른쪽 아래 재생 시간. 이미지가 뜨기 전엔 배경색이 보여요.
export function Thumbnail({ video }: { video: Video }) {
  return (
    <div className="thumbnail" style={{ background: video.thumbnailColors[0] }}>
      <img src={video.thumbnailUrl} alt="" loading="lazy" />
      <span className="duration">{formatDuration(video.durationSec)}</span>
    </div>
  );
}
