import { useState } from 'react';
import { controls, usePlayback } from './playback';
import { selectQuality, useStreamState } from './streaming';
import { PIcon } from './icons';

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// 톱니바퀴 메뉴: 첫 화면(목록) → 재생 속도 화면
export function SettingsMenu({ onClose, onShowStats }: { onClose: () => void; onShowStats: () => void }) {
  const { rate } = usePlayback();
  const [panel, setPanel] = useState<'main' | 'speed' | 'quality'>('main');
  const st = useStreamState();
  const qualityValue =
    st.kind === 'stream'
      ? st.auto
        ? `자동${st.activeHeight ? ` (${st.activeHeight}p)` : ''}`
        : `${st.activeHeight}p`
      : st.activeHeight
        ? `${st.activeHeight}p`
        : '-';

  if (panel === 'quality') {
    return (
      <div className="settings-menu" role="menu">
        <button className="settings-header" onClick={() => setPanel('main')}>
          <PIcon name="chevronLeft" /> 화질
        </button>
        {st.kind !== 'stream' ? (
          <p className="settings-note">이 영상은 화질이 하나뿐이에요 ({st.activeHeight ?? '?'}p 단일 파일)</p>
        ) : (
          <>
            {st.qualities.map((q) => (
              <button
                key={q.height}
                className="settings-item"
                role="menuitemradio"
                aria-checked={!st.auto && st.activeHeight === q.height}
                onClick={() => {
                  void selectQuality(q.height);
                  onClose();
                }}
              >
                <span className="settings-check">{!st.auto && st.activeHeight === q.height && <PIcon name="check" size={20} />}</span>
                {q.height}p{q.height >= 720 && <sup className="hd">HD</sup>}
              </button>
            ))}
            <button
              className="settings-item"
              role="menuitemradio"
              aria-checked={st.auto}
              onClick={() => {
                void selectQuality(null);
                onClose();
              }}
            >
              <span className="settings-check">{st.auto && <PIcon name="check" size={20} />}</span>
              자동{st.auto && st.activeHeight ? ` (${st.activeHeight}p)` : ''}
            </button>
          </>
        )}
      </div>
    );
  }
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
      <button className="settings-item" onClick={() => setPanel('quality')}>
        <PIcon name="quality" />
        <span className="settings-label">화질</span>
        <span className="settings-value">{qualityValue}</span>
        <PIcon name="chevronRight" />
      </button>
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
      <button
        className="settings-item"
        onClick={() => {
          onShowStats();
          onClose();
        }}
      >
        <PIcon name="stats" />
        <span className="settings-label">전문가용 통계</span>
      </button>
    </div>
  );
}
