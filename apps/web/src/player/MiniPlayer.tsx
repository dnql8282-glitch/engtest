import { useNavigate } from 'react-router-dom';
import { getVideo } from '@mytube/core/videoService';
import { playerStore } from '@mytube/core/playerStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { usePlayerState } from '@mytube/hooks/usePlayerState';
import { controls, usePlayback, video } from './playback';
import { PlayerSlot } from './PlayerSlot';
import { PIcon } from './icons';
import { userStore } from '@mytube/core/userStore';
import { formatDuration } from '@mytube/core/format';

// 화면 오른쪽 아래 미니 플레이어 (YouTube 데스크톱과 같은 위치·구성)
// 시청 페이지를 떠나도 같은 <video>가 이리로 옮겨와서 계속 재생돼요.
export function MiniPlayer() {
  const { videoId, mode, restored } = usePlayerState();
  const { data: current } = useAsync(getVideo, videoId ?? '');
  const pb = usePlayback();
  const navigate = useNavigate();

  if (mode !== 'mini' || !videoId) return null;
  const expand = () => navigate(`/watch/${videoId}`);
  // 사용자가 직접 닫으면 다음에 앱을 켤 때 "이어서 시청하기"를 다시 띄우지 않아요
  const close = () => {
    userStore.clearLastSession();
    playerStore.close();
  };
  const play = () => {
    if (restored) {
      playerStore.markResumed();
      userStore.recordWatch(videoId);
    }
    if (pb.ended) void video.play();
    else controls.toggle();
  };
  const ratio = pb.duration ? pb.currentTime / pb.duration : 0;

  return (
    <div className="miniplayer" role="region" aria-label="미니 플레이어">
      <div className="miniplayer-video">
        <PlayerSlot className="player-slot" />
        <div className="miniplayer-overlay" onClick={expand}>
          <button className="mini-btn mini-expand" aria-label="펼치기 (i)" onClick={(e) => { e.stopPropagation(); expand(); }}>
            <PIcon name="expand" size={20} />
          </button>
          <button className="mini-btn mini-close" aria-label="닫기" onClick={(e) => { e.stopPropagation(); close(); }}>
            <PIcon name="close" size={20} />
          </button>
          <button
            className="mini-btn mini-play"
            aria-label={pb.playing ? '일시정지' : '재생'}
            onClick={(e) => {
              e.stopPropagation();
              play();
            }}
          >
            <PIcon name={pb.ended ? 'replay' : pb.playing ? 'pause' : 'play'} size={40} />
          </button>
        </div>
        <div className="miniplayer-progress">
          <div style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
      {current && (
        <div className="miniplayer-info" onClick={expand}>
          {restored && <p className="miniplayer-resume">이어서 시청하기 · {formatDuration(Math.floor(pb.currentTime))}부터</p>}
          <p className="miniplayer-title">{current.title}</p>
          <p className="miniplayer-channel">{current.channel.name}</p>
        </div>
      )}
      {/* 휴대폰에서는 막대 모양 미니 플레이어: 오른쪽에 재생/닫기 버튼 */}
      <div className="miniplayer-inline">
        <button aria-label={pb.playing ? '일시정지' : '재생'} onClick={play}>
          <PIcon name={pb.ended ? 'replay' : pb.playing ? 'pause' : 'play'} />
        </button>
        <button aria-label="닫기" onClick={close}>
          <PIcon name="close" />
        </button>
      </div>
    </div>
  );
}
