import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getVideo } from '@mytube/core/videoService';
import { playerStore } from '@mytube/core/playerStore';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { usePlayerState } from '@mytube/hooks/usePlayerState';
import { useUserState } from '@mytube/hooks/useUserStore';
import { controls, video } from './playback';

// 화면 없이 "재생 엔진"만 담당하는 컴포넌트 (App에 한 번만 둠)
//  - playerStore의 videoId가 바뀌면 영상 소스를 바꾸고 재생
//  - 시청 기록 남기기, 볼륨 설정 기억하기
//  - 시청 페이지를 벗어나면 미니 플레이어로 전환
//  - 미디어 세션: 키보드 미디어 키, 안드로이드·macOS 잠금 화면/제어 센터 컨트롤
export function PlayerController() {
  const { videoId } = usePlayerState();
  const { data: current } = useAsync(getVideo, videoId ?? '');
  const { loaded, playerPrefs } = useUserState();
  const { pathname } = useLocation();

  // 저장된 볼륨 적용 (처음 한 번)
  useEffect(() => {
    if (!loaded) return;
    video.volume = playerPrefs.volume;
    video.muted = playerPrefs.muted;
    // 볼륨을 바꾸면 기억
    const onVolume = () => userStore.setPlayerPrefs({ volume: video.volume, muted: video.muted });
    video.addEventListener('volumechange', onVolume);
    return () => video.removeEventListener('volumechange', onVolume);
    // 처음 불러온 값만 적용하려고 일부러 loaded만 지켜봐요
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 영상 교체
  useEffect(() => {
    if (!current) return;
    if (video.dataset.videoId !== current.id) {
      video.dataset.videoId = current.id;
      video.src = current.videoUrl;
      video.poster = current.thumbnailUrl;
      void video.play().catch(() => {
        /* 사용자가 아직 페이지를 누른 적이 없으면 브라우저가 소리 있는 자동재생을 막아요 */
      });
      userStore.recordWatch(current.id);
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.channel.name,
        album: 'MyTube',
        artwork: [{ src: new URL(current.thumbnailUrl, location.href).href, sizes: '640x360', type: 'image/jpeg' }],
      });
    }
  }, [current]);

  // 플레이어 닫기
  useEffect(() => {
    if (videoId) return;
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    delete video.dataset.videoId;
    video.load();
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  }, [videoId]);

  // 시청 페이지를 떠나면 미니 플레이어로
  useEffect(() => {
    if (!pathname.startsWith('/watch') && playerStore.getSnapshot().mode === 'full') playerStore.minimize();
  }, [pathname]);

  // 미디어 세션 버튼 연결
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* 지원하지 않는 동작 */
      }
    };
    set('play', () => void video.play());
    set('pause', () => video.pause());
    set('seekbackward', (d) => controls.seekBy(-(d.seekOffset ?? 10)));
    set('seekforward', (d) => controls.seekBy(d.seekOffset ?? 10));
    set('seekto', (d) => d.seekTime !== undefined && controls.seekTo(d.seekTime));
    return () => {
      for (const a of ['play', 'pause', 'seekbackward', 'seekforward', 'seekto'] as MediaSessionAction[]) set(a, null);
    };
  }, []);

  return null;
}
