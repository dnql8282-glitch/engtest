import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VideoWithChannel } from '@mytube/core/types';
import { formatDuration } from '@mytube/core/format';
import { userStore } from '@mytube/core/userStore';
import { useUserState } from '@mytube/hooks/useUserStore';
import { controls, usePlayback, video } from './playback';
import { PlayerSlot } from './PlayerSlot';
import { ProgressBar } from './ProgressBar';
import { SettingsMenu } from './SettingsMenu';
import { PIcon, type PlayerIconName } from './icons';

interface FullPlayerProps {
  next?: VideoWithChannel; // 다음 영상 (자동재생, 다음 버튼)
  onNext: () => void;
}

// 시청 페이지의 큰 플레이어: YouTube 스타일 컨트롤 + 키보드 단축키 + 끝나면 다음 영상 카운트다운
export function FullPlayer({ next, onNext }: FullPlayerProps) {
  const pb = usePlayback();
  const { playerPrefs } = useUserState();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true); // 컨트롤 보이기
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [bubble, setBubble] = useState<{ icon: PlayerIconName; text?: string; side?: 'left' | 'right'; key: number } | null>(null);
  const [countdownCancelled, setCountdownCancelled] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback((icon: PlayerIconName, text?: string, side?: 'left' | 'right') => {
    setBubble({ icon, text, side, key: Date.now() });
  }, []);

  // 마우스를 움직이면 컨트롤 표시, 2.5초 동안 가만히 있으면 숨김 (재생 중일 때만)
  const poke = useCallback(() => {
    setActive(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(false), 2500);
  }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  }, []);
  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const toggleTheater = useCallback(() => userStore.setPlayerPrefs({ theater: !userStore.getSnapshot().playerPrefs.theater }), []);
  const goMiniplayer = useCallback(() => {
    // YouTube처럼 이전 페이지로 돌아가면서 영상은 미니 플레이어로 계속 재생
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  }, [navigate]);

  // ── 키보드 단축키 (YouTube와 같은 키) ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const v = video;
      const handled = (() => {
        if (k === ' ' || k === 'k') {
          if (k === ' ' && t.closest('button, a')) return false; // 버튼 위에서 스페이스는 버튼 클릭
          controls.toggle();
          flash(v.paused ? 'pause' : 'play');
        } else if (k === 'j') {
          controls.seekBy(-10);
          flash('rewind', '10초', 'left');
        } else if (k === 'l') {
          controls.seekBy(10);
          flash('fastForward', '10초', 'right');
        } else if (k === 'arrowleft') {
          controls.seekBy(-5);
          flash('rewind', '5초', 'left');
        } else if (k === 'arrowright') {
          controls.seekBy(5);
          flash('fastForward', '5초', 'right');
        } else if (k === 'arrowup') {
          controls.setVolume(v.volume + 0.05);
          flash('volumeUp', `${Math.round(v.volume * 100)}%`);
        } else if (k === 'arrowdown') {
          controls.setVolume(v.volume - 0.05);
          flash(v.volume === 0 ? 'volumeOff' : 'volumeDown', `${Math.round(v.volume * 100)}%`);
        } else if (k === 'm') {
          controls.toggleMute();
          flash(v.muted ? 'volumeOff' : 'volumeUp');
        } else if (k === 'f') toggleFullscreen();
        else if (k === 't') toggleTheater();
        else if (k === 'i') goMiniplayer();
        else if (e.key === '>' || e.key === '<') {
          const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const i = rates.indexOf(v.playbackRate);
          const nextRate = rates[Math.max(0, Math.min(rates.length - 1, (i < 0 ? 3 : i) + (e.key === '>' ? 1 : -1)))];
          controls.setRate(nextRate);
          flash('speed', `${nextRate}x`);
        } else if (e.key === 'N' && e.shiftKey && next) onNext();
        else if (/^[0-9]$/.test(k)) controls.seekTo((Number(k) / 10) * (v.duration || 0));
        else return false;
        return true;
      })();
      if (handled) {
        e.preventDefault();
        poke();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flash, poke, toggleFullscreen, toggleTheater, goMiniplayer, next, onNext]);

  // ── 끝나면 다음 영상 카운트다운 ───────────────────────────────────────────
  const showCountdown = pb.ended && playerPrefs.autoplay && next && !countdownCancelled;
  // 영상이 다시 재생되면 "취소"를 초기화
  if (!pb.ended && countdownCancelled) setCountdownCancelled(false);

  const showControls = active || !pb.playing || settingsOpen;
  const volumeIcon: PlayerIconName = pb.muted || pb.volume === 0 ? 'volumeOff' : pb.volume < 0.5 ? 'volumeDown' : 'volumeUp';

  return (
    <div
      ref={rootRef}
      className={`yt-player ${showControls ? 'controls-on' : 'controls-off'} ${fullscreen ? 'is-fullscreen' : ''}`}
      onMouseMove={poke}
      onMouseLeave={() => pb.playing && setActive(false)}
    >
      <PlayerSlot className="player-slot" />

      {/* 영상 위를 누르면 재생/일시정지, 두 번 누르면 전체 화면 */}
      <div
        className="player-hit"
        onClick={() => {
          if (settingsOpen) return setSettingsOpen(false);
          controls.toggle();
          flash(video.paused ? 'pause' : 'play');
        }}
        onDoubleClick={() => {
          toggleFullscreen();
          controls.toggle(); // 두 번 클릭의 첫 클릭으로 바뀐 재생 상태를 되돌림
        }}
      />

      {pb.waiting && pb.playing && <div className="player-spinner" aria-label="로딩 중" />}

      {bubble && (
        <div key={bubble.key} className={`player-bubble ${bubble.side ?? 'center'}`}>
          <PIcon name={bubble.icon} size={bubble.side ? 28 : 36} />
          {bubble.text && <span>{bubble.text}</span>}
        </div>
      )}

      {pb.ended && !showCountdown && (
        <button className="player-replay" onClick={() => void video.play()} aria-label="다시 보기">
          <PIcon name="replay" size={48} />
        </button>
      )}

      {showCountdown && next && (
        <Countdown
          next={next}
          onPlay={onNext}
          onCancel={() => setCountdownCancelled(true)}
        />
      )}

      <div className="player-gradient" />
      <div className="player-chrome" onClick={(e) => e.stopPropagation()}>
        <ProgressBar />
        <div className="player-bar">
          <div className="player-bar-left">
            <CtrlButton label={pb.ended ? '다시 보기' : pb.playing ? '일시정지 (k)' : '재생 (k)'} onClick={() => (pb.ended ? void video.play() : controls.toggle())}>
              <PIcon name={pb.ended ? 'replay' : pb.playing ? 'pause' : 'play'} size={30} />
            </CtrlButton>
            {next && (
              <CtrlButton label="다음 (SHIFT+n)" onClick={onNext}>
                <PIcon name="next" size={28} />
              </CtrlButton>
            )}
            <div className="volume">
              <CtrlButton label={pb.muted ? '음소거 해제 (m)' : '음소거 (m)'} onClick={controls.toggleMute}>
                <PIcon name={volumeIcon} />
              </CtrlButton>
              <input
                className="volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={pb.muted ? 0 : pb.volume}
                onChange={(e) => controls.setVolume(Number(e.target.value))}
                aria-label="볼륨"
                style={{ ['--vol' as string]: `${(pb.muted ? 0 : pb.volume) * 100}%` }}
              />
            </div>
            <span className="player-time">
              {formatDuration(Math.floor(pb.currentTime))} / {formatDuration(Math.floor(pb.duration))}
            </span>
          </div>
          <div className="player-bar-right">
            <button
              className={`autoplay-toggle ${playerPrefs.autoplay ? 'on' : ''}`}
              onClick={() => userStore.setPlayerPrefs({ autoplay: !playerPrefs.autoplay })}
              aria-pressed={playerPrefs.autoplay}
              title={playerPrefs.autoplay ? '자동재생 사용 중' : '자동재생 사용 중지됨'}
              aria-label="자동재생"
            >
              <span className="autoplay-knob">
                <PIcon name={playerPrefs.autoplay ? 'play' : 'pause'} size={12} />
              </span>
            </button>
            <div className="settings-anchor">
              <CtrlButton label="설정" onClick={() => setSettingsOpen((o) => !o)}>
                <span className={`gear ${settingsOpen ? 'open' : ''}`}>
                  <PIcon name="settings" />
                </span>
              </CtrlButton>
              {settingsOpen && <SettingsMenu onClose={() => setSettingsOpen(false)} />}
            </div>
            {!fullscreen && (
              <CtrlButton label="미니 플레이어 (i)" onClick={goMiniplayer}>
                <PIcon name="miniplayer" />
              </CtrlButton>
            )}
            {!fullscreen && (
              <CtrlButton label={playerPrefs.theater ? '기본 보기 (t)' : '영화관 모드 (t)'} onClick={toggleTheater}>
                <PIcon name={playerPrefs.theater ? 'theaterExit' : 'theater'} />
              </CtrlButton>
            )}
            <CtrlButton label={fullscreen ? '전체 화면 종료 (f)' : '전체 화면 (f)'} onClick={toggleFullscreen}>
              <PIcon name={fullscreen ? 'fullscreenExit' : 'fullscreen'} />
            </CtrlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="ctrl-btn" onClick={onClick} aria-label={label} data-tooltip={label}>
      {children}
    </button>
  );
}

// 끝나면 나오는 "다음 동영상" 화면: 5초 뒤 자동으로 넘어가요
function Countdown({ next, onPlay, onCancel }: { next: VideoWithChannel; onPlay: () => void; onCancel: () => void }) {
  const [left, setLeft] = useState(5);
  useEffect(() => {
    if (left <= 0) {
      onPlay();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onPlay]);

  return (
    <div className="upnext" onClick={(e) => e.stopPropagation()}>
      <p className="upnext-label">{left}초 후 다음 동영상 재생</p>
      <div className="upnext-card">
        <img src={next.thumbnailUrl} alt="" />
        <div>
          <p className="upnext-title">{next.title}</p>
          <p className="upnext-meta">{next.channel.name}</p>
        </div>
      </div>
      <div className="upnext-actions">
        <button className="upnext-cancel" onClick={onCancel}>취소</button>
        <button className="upnext-play" onClick={onPlay}>
          지금 재생
        </button>
      </div>
      <svg className="upnext-ring" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" />
        <circle cx="20" cy="20" r="18" className="upnext-ring-fill" style={{ animationDuration: '5s' }} />
      </svg>
    </div>
  );
}
