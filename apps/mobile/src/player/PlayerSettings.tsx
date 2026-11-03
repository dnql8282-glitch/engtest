import { useState } from 'react';
import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { Sheet, type SheetItem } from '../components/Sheet';

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// 플레이어 톱니바퀴 → 아래에서 올라오는 설정 시트 (YouTube 앱과 같은 구성)
//   화질: 자동 / 1080p … 144p  — 적응형 스트리밍의 "최대 해상도"를 정해요 (maxResolution)
//   재생 속도: 0.25 ~ 2배
//   PIP 모드
export function PlayerSettings({
  player,
  visible,
  onClose,
  onPictureInPicture,
}: {
  player: VideoPlayer;
  visible: boolean;
  onClose: () => void;
  onPictureInPicture: () => void;
}) {
  const [panel, setPanel] = useState<'main' | 'quality' | 'speed'>('main');
  // 영상 트랙이 바뀌면 다시 그려서 현재 화질을 보여줘요
  const { videoTrack } = useEvent(player, 'videoTrackChange', { videoTrack: player.videoTrack });
  const heights = [...new Set(player.availableVideoTracks.map((t) => t.size.height).filter((h) => h > 0))].sort((a, b) => b - a);
  const auto = player.maxResolution === null;
  const current = videoTrack?.size.height;
  const capped = player.maxResolution?.height;

  const close = () => {
    onClose();
    setPanel('main');
  };
  const goto = (p: typeof panel) => () => setPanel(p);

  let items: SheetItem[];
  if (panel === 'quality') {
    items = [
      {
        icon: auto ? 'check' : 'blank',
        label: `자동${auto && current ? ` (${current}p)` : ''}`,
        onPress: () => {
          player.maxResolution = null;
        },
      },
      ...heights.map(
        (h): SheetItem => ({
          icon: !auto && capped === h ? 'check' : 'blank',
          label: `${h}p${h >= 720 ? ' HD' : ''}`,
          onPress: () => {
            player.maxResolution = { width: Math.round((h * 16) / 9), height: h };
          },
        }),
      ),
    ];
    if (heights.length === 0) items = [{ icon: 'info-outline', label: '이 영상은 화질이 하나뿐이에요', onPress: () => {} }];
  } else if (panel === 'speed') {
    items = RATES.map((r) => ({
      icon: player.playbackRate === r ? 'check' : 'blank',
      label: r === 1 ? '보통' : `${r}x`,
      onPress: () => {
        player.playbackRate = r;
      },
    }));
  } else {
    items = [
      { icon: 'tune', label: `화질 · ${auto ? `자동${current ? ` (${current}p)` : ''}` : `${capped}p`}`, onPress: goto('quality'), keepOpen: true },
      { icon: 'slow-motion-video', label: `재생 속도 · ${player.playbackRate === 1 ? '보통' : `${player.playbackRate}x`}`, onPress: goto('speed'), keepOpen: true },
      { icon: 'picture-in-picture-alt', label: 'PIP 모드', onPress: onPictureInPicture },
    ];
  }

  return <Sheet visible={visible} onClose={close} items={items} />;
}
