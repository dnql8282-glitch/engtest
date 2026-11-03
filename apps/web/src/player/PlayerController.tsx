import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getVideo } from '@mytube/core/videoService';
import { playerStore } from '@mytube/core/playerStore';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { usePlayerState } from '@mytube/hooks/usePlayerState';
import { useUserState } from '@mytube/hooks/useUserStore';
import { controls, video } from './playback';
import { hasPendingStart, loadVideo, requestStartAt, unloadVideo } from './streaming';
import { resumePosition } from '@mytube/core/userStore';
import { currentScope } from '@mytube/core/storage';
import { useAccountState } from '@mytube/hooks/useAccountState';

// 화면 없이 "재생 엔진"만 담당하는 컴포넌트 (App에 한 번만 둠)
//  - playerStore의 videoId가 바뀌면 영상 소스를 바꾸고 재생
//  - 시청 기록 남기기, 볼륨 설정 기억하기
//  - 시청 페이지를 벗어나면 미니 플레이어로 전환
//  - 미디어 세션: 키보드 미디어 키, 안드로이드·macOS 잠금 화면/제어 센터 컨트롤
export function PlayerController() {
  const { videoId } = usePlayerState();
  const { data: current } = useAsync(getVideo, videoId ?? '');
  const { playerPrefs } = useUserState();
  const prefsLoaded = useUserState().loaded;
  const { pathname } = useLocation();

  // 저장된 볼륨 적용 (처음 한 번)
  useEffect(() => {
    if (!prefsLoaded) return;
    video.volume = playerPrefs.volume;
    video.muted = playerPrefs.muted;
    // 볼륨을 바꾸면 기억
    const onVolume = () => userStore.setPlayerPrefs({ volume: video.volume, muted: video.muted });
    video.addEventListener('volumechange', onVolume);
    return () => video.removeEventListener('volumechange', onVolume);
    // 처음 불러온 값만 적용하려고 일부러 loaded만 지켜봐요
  }, [prefsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 영상 교체
  useEffect(() => {
    if (!current) return;
    if (video.dataset.videoId !== current.id) {
      video.dataset.videoId = current.id;
      video.dataset.scope = currentScope(); // 어느 계정에서 튼 영상인지 (계정 전환 때 기록이 섞이지 않게)
      video.poster = current.thumbnailUrl;
      // 전에 보던 곳부터 이어서 (공유 링크 ?t= 가 있으면 그게 우선)
      if (!hasPendingStart(current.id)) {
        const at = resumePosition(userStore.getSnapshot().progress[current.id]);
        if (at > 0) requestStartAt(current.id, at);
      }
      const autoplay = !playerStore.getSnapshot().restored; // "이어서 시청하기"로 복원한 경우엔 누를 때까지 기다려요
      // 스트리밍(화질·코덱 자동 선택) 또는 MP4 파일로 불러온 뒤 재생
      void loadVideo(current).then(() => {
        if (video.dataset.videoId !== current.id || !autoplay) return;
        void video.play().catch(() => {
          /* 사용자가 아직 페이지를 누른 적이 없으면 브라우저가 소리 있는 자동재생을 막아요 */
        });
      });
      if (autoplay) userStore.recordWatch(current.id);
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

  // ── 시청 위치 저장: 재생 중 5초마다 + 일시정지·이동·끝·창 닫기 순간 ─────────────
  useEffect(() => {
    let last = 0;
    const save = () => {
      const id = video.dataset.videoId;
      // 다른 계정으로 바뀐 뒤에는 이전 계정의 영상 위치를 새 계정에 저장하지 않아요
      if (video.dataset.scope !== currentScope()) return;
      if (id && video.duration > 0 && video.currentTime > 0) userStore.saveProgress(id, video.currentTime, video.duration);
    };
    const onTime = () => {
      if (Date.now() - last > 5000) {
        last = Date.now();
        save();
      }
    };
    const onHide = () => document.visibilityState === 'hidden' && save();
    video.addEventListener('timeupdate', onTime);
    for (const e of ['pause', 'seeked', 'ended']) video.addEventListener(e, save);
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      for (const e of ['pause', 'seeked', 'ended']) video.removeEventListener(e, save);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // ── 앱을 다시 켰을 때 / 계정을 바꿨을 때: 마지막에 보던 영상을 "이어서 시청하기" 미니 플레이어로 ──
  const { currentId } = useAccountState();
  const { loaded, lastSession } = useUserState();
  const sessionFor = useRef<string | undefined>(undefined); // 어느 계정에 대해 복원을 마쳤는지
  useEffect(() => {
    if (!loaded || sessionFor.current === (currentId ?? 'guest')) return;
    // 계정이 바뀌면 이전 계정의 영상은 닫아요
    if (sessionFor.current !== undefined) playerStore.close();
    sessionFor.current = currentId ?? 'guest';
    if (lastSession && !location.pathname.startsWith('/watch') && !location.pathname.startsWith('/shorts')) {
      playerStore.restore(lastSession.videoId);
    }
  }, [loaded, currentId, lastSession]);

  // 플레이어 닫기
  useEffect(() => {
    if (videoId) return;
    video.pause();
    video.removeAttribute('poster');
    delete video.dataset.videoId;
    delete video.dataset.scope;
    void unloadVideo();
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
