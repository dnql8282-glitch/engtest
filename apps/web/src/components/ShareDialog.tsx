import { useState } from 'react';
import { formatDuration } from '@mytube/core/format';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/toast';

// 공유 창: 링크 복사 + "시작 시간" 체크 (YouTube와 같은 ?t=초 형식)
export function ShareDialog({ videoId, currentTime, onClose }: { videoId: string; currentTime?: number; onClose: () => void }) {
  const [withTime, setWithTime] = useState(false);
  const t = Math.floor(currentTime ?? 0);
  const url = `${location.origin}/watch/${videoId}${withTime && t > 0 ? `?t=${t}` : ''}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('링크가 클립보드에 복사되었습니다.');
    } catch {
      toast('복사하지 못했어요. 링크를 직접 선택해서 복사해 주세요.');
    }
    onClose();
  };

  return (
    <Modal title="공유" onClose={onClose}>
      <div className="share-row">
        <input className="share-url" value={url} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="공유 링크" />
        <button className="primary-btn" onClick={() => void copy()}>
          복사
        </button>
      </div>
      {t > 0 && (
        <label className="share-time">
          <input type="checkbox" checked={withTime} onChange={(e) => setWithTime(e.target.checked)} />
          시작 시간 {formatDuration(t)}
        </label>
      )}
    </Modal>
  );
}
