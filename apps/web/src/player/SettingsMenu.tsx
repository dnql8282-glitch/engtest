import { useState } from 'react';
import { controls, usePlayback } from './playback';
import { PIcon } from './icons';

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// 톱니바퀴 메뉴: 첫 화면(목록) → 재생 속도 화면
export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { rate } = usePlayback();
  const [panel, setPanel] = useState<'main' | 'speed'>('main');
  const pipSupported = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;

  if (panel === 'speed') {
    return (
      <div className="settings-menu" role="menu">
        <button className="settings-header" onClick={() => setPanel('main')}>
          <PIcon name="chevronLeft" /> 재생 속도
        </button>
        {RATES.map((r) => (
          <button
            key={r}
            className="settings-item"
            role="menuitemradio"
            aria-checked={r === rate}
            onClick={() => {
              controls.setRate(r);
              onClose();
            }}
          >
            <span className="settings-check">{r === rate && <PIcon name="check" size={20} />}</span>
            {r === 1 ? '보통' : r}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="settings-menu" role="menu">
      <button className="settings-item" onClick={() => setPanel('speed')}>
        <PIcon name="speed" />
        <span className="settings-label">재생 속도</span>
        <span className="settings-value">{rate === 1 ? '보통' : rate}</span>
        <PIcon name="chevronRight" />
      </button>
      {pipSupported && (
        <button
          className="settings-item"
          onClick={() => {
            void controls.togglePictureInPicture();
            onClose();
          }}
        >
          <PIcon name="pip" />
          <span className="settings-label">PIP 모드</span>
        </button>
      )}
    </div>
  );
}
