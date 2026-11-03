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
import { StatsForNerds } from './StatsForNerds';
import { useStreamState } from './streaming';
import { adjacentChapterTime, chapterIndexAt } from '@mytube/core/chapters';
import { PIcon, type PlayerIconName } from './icons';

interface FullPlayerProps {
  video: VideoWithChannel; // 지금 영상 (챕터, 스토리보드)
  next?: VideoWithChannel; // 다음 영상 (자동재생, 다음 버튼)
  onNext: () => void;
  onShowChapters?: () => void; // 시간 옆 챕터 이름을 누르면
}

// 시청 페이지의 큰 플레이어: YouTube 스타일 컨트롤 + 키보드 단축키 + 끝나면 다음 영상 카운트다운
export function FullPlayer({ video: current, next, onNext, onShowChapters }: FullPlayerProps) {
  const pb = usePlayback();
  const { playerPrefs } = useUserState();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true); // 컨트롤 보이기
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const stream = useStreamState();
  const [scrubT, setScrubT] = useState<number | null>(null); // 타임바를 끄는 중인 시간
  const [boost, setBoost] = useState(false); // 길게 눌러 2배속
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; sec: number; key: number } | null>(null);
  const gesture = useRef<{ x: number; y: number; t: number; type: string; hold?: ReturnType<typeof setTimeout>; boosted?: boolean; prevRate?: number; moved?: boolean } | null>(null);
  const lastTap = useRef<{ t: number; side: 'left' | 'right' | 'center' } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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
      if (t.closest('input, textarea, [contenteditable="true"]') || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const v = video;
      // Ctrl + ←/→ : 이전/다음 챕터 (YouTube와 같은 키)
      if (e.ctrlKey) {
        if (k !== 'arrowleft' && k !== 'arrowright') return;
        const to = adjacentChapterTime(current.chapters, v.currentTime, k === 'arrowleft' ? -1 : 1);
        if (to !== null) {
          controls.seekTo(to);
          const ch = current.chapters[chapterIndexAt(current.chapters, to)];
          flash(k === 'arrowleft' ? 'rewind' : 'fastForward', ch?.title, k === 'arrowleft' ? 'left' : 'right');
        }
        e.preventDefault();
        return;
      }
      // , . : 일시정지 중 한 프레임씩 (약 1/30초)
      if ((e.key === ',' || e.key === '.') && v.paused) {
        controls.seekBy(e.key === ',' ? -1 / 30 : 1 / 30);
        e.preventDefault();
        return;
      }
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
  }, [flash, poke, toggleFullscreen, toggleTheater, goMiniplayer, next, onNext, current.chapters]);

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
      onContextMenu={(e) => {
        e.preventDefault();
        // 휴대폰에서 길게 누르기는 2배속이라, 통계 창은 마우스 우클릭일 때만
        if ((e.nativeEvent as PointerEvent).pointerType === 'touch') return;
        setStatsOpen((o) => !o);
      }}
    >
      <PlayerSlot className="player-slot" />

      {/* 영상 위 손동작
          마우스: 클릭 = 재생/일시정지, 두 번 클릭 = 전체 화면
          터치:   한 번 탭 = 컨트롤 보이기/숨기기, 왼쪽/오른쪽 두 번 탭 = 10초 뒤로/앞으로 (연속 탭은 누적)
          공통:   길게 누르기 = 누르는 동안 2배속 */}
      <div
        className="player-hit"
        onPointerDown={(e) => {
          if (settingsOpen) return setSettingsOpen(false);
          const g = { x: e.clientX, y: e.clientY, t: Date.now(), type: e.pointerType } as NonNullable<typeof gesture.current>;
          g.hold = setTimeout(() => {
            if (video.paused || g.moved) return;
            g.boosted = true;
            g.prevRate = video.playbackRate;
            controls.setRate(2);
            setBoost(true);
          }, 500);
          gesture.current = g;
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (g && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 12) g.moved = true;
        }}
        onPointerUp={(e) => {
          const g = gesture.current;
          gesture.current = null;
          if (!g) return;
          clearTimeout(g.hold);
          if (g.boosted) {
            controls.setRate(g.prevRate ?? 1);
            setBoost(false);
            return;
          }
          if (g.moved) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const side = x < 0.35 ? 'left' : x > 0.65 ? 'right' : 'center';

          if (g.type === 'mouse') {
            const prev = lastTap.current;
            lastTap.current = { t: Date.now(), side };
            if (prev && Date.now() - prev.t < 300) {
              toggleFullscreen();
              controls.toggle(); // 첫 클릭으로 바뀐 재생 상태를 되돌림
              lastTap.current = null;
              return;
            }
            controls.toggle();
            flash(video.paused ? 'pause' : 'play');
            return;
          }

          // 터치
          const prev = lastTap.current;
          const isDouble = prev && Date.now() - prev.t < 350 && side !== 'center' && (prev.side === side || ripple?.side === side);
          lastTap.current = { t: Date.now(), side };
          if (isDouble) {
            clearTimeout(tapTimer.current);
            const dir = side === 'left' ? -1 : 1;
            controls.seekBy(dir * 10);
            setRipple((r) => ({ side, sec: r && r.side === side && Date.now() - r.key < 1000 ? r.sec + 10 : 10, key: Date.now() }));
            return;
          }
          clearTimeout(tapTimer.current);
          tapTimer.current = setTimeout(() => {
            setActive((a) => !a); // 한 번 탭: 컨트롤 보이기/숨기기
            lastTap.current = null;
          }, 300);
        }}
        onPointerCancel={() => {
          const g = gesture.current;
          if (g) clearTimeout(g.hold);
          if (g?.boosted) {
            controls.setRate(g.prevRate ?? 1);
            setBoost(false);
          }
          gesture.current = null;
        }}
      />

      {boost && <div className="speed-boost">2배속 ▶▶</div>}
      {ripple && (
        <div key={ripple.key} className={`seek-ripple ${ripple.side}`} onAnimationEnd={() => setRipple(null)}>
          <PIcon name={ripple.side === 'left' ? 'rewind' : 'fastForward'} size={28} />
          <span>{ripple.sec}초</span>
        </div>
      )}

      {pb.waiting && pb.playing && <div className="player-spinner" aria-label="로딩 중" />}
      {statsOpen && <StatsForNerds onClose={() => setStatsOpen(false)} />}

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
        <ProgressBar video={current} onScrub={setScrubT} />
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
            <span className={`player-time ${scrubT !== null ? 'scrubbing' : ''}`}>
              {formatDuration(Math.floor(scrubT ?? pb.currentTime))} / {formatDuration(Math.floor(pb.duration))}
            </span>
            {current.chapters.length > 0 && (
              <button className="chapter-chip" onClick={onShowChapters} title="챕터 보기">
                <span className="chapter-dot">•</span>
                {current.chapters[Math.max(0, chapterIndexAt(current.chapters, scrubT ?? pb.currentTime))].title}
                <PIcon name="chevronRight" size={18} />
              </button>
            )}
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
                {stream.activeHeight !== null && stream.activeHeight >= 720 && <span className="hd-badge">HD</span>}
              </CtrlButton>
              {settingsOpen && <SettingsMenu onClose={() => setSettingsOpen(false)} onShowStats={() => setStatsOpen(true)} />}
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
