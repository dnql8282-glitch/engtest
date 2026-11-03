import { useEffect, useState } from 'react';
import { readStats, useStreamState } from './streaming';
import { usePlayback, video } from './playback';

// "전문가용 통계" — YouTube 플레이어 우클릭 메뉴에 있는 그 패널.
// 지금 어떤 코덱·해상도·오디오 샘플레이트로 재생 중인지, 버퍼와 인터넷 속도는 어떤지 보여줘요.
export function StatsForNerds({ onClose }: { onClose: () => void }) {
  const st = useStreamState();
  const pb = usePlayback();
  const [s, setS] = useState<Awaited<ReturnType<typeof readStats>> | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () => void readStats().then((r) => alive && setS(r));
    tick();
    const id = setInterval(tick, 500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const kbps = (b: number | null | undefined) => (b ? `${Math.round(b / 1000).toLocaleString()} Kbps` : '-');
  const rows: [string, string][] = s
    ? [
        ['동영상 ID', video.dataset.videoId ?? '-'],
        ['재생 방식', st.kind === 'stream' ? '적응형 스트리밍 (DASH, 4초 조각)' : st.kind === 'file' ? '단일 MP4 파일' : '-'],
        ['뷰포트 / 프레임', `${s.viewport} / 드롭 ${s.droppedFrames} / ${s.totalFrames}`],
        ['현재 해상도', `${s.width}x${s.height}${s.frameRate ? `@${Math.round(s.frameRate)}` : ''}${st.kind === 'stream' ? (st.auto ? ' (자동)' : ' (고정)') : ''}`],
        ['볼륨 / 음량 평준화', `${Math.round((pb.muted ? 0 : pb.volume) * 100)}% / ${st.kind === 'stream' ? '콘텐츠 -14 LUFS로 평준화' : '없음'}`],
        ['비디오 코덱', st.videoCodec ? `${st.videoCodec} (${codecName(st.videoCodec)}) ${kbps(s.videoBandwidth)}` : '브라우저 기본 디코더'],
        ['오디오 코덱', st.audioCodec ? `${st.audioCodec} (${codecName(st.audioCodec)}) ${kbps(s.audioBandwidth)}` : '-'],
        ['오디오', st.audioSampleRate ? `${st.audioSampleRate.toLocaleString()} Hz · ${st.audioChannels ?? 2}ch` : '-'],
        ['연결 속도 (추정)', kbps(s.estimatedBandwidth)],
        ['버퍼 상태', `${s.bufferAhead.toFixed(2)} 초`],
        ['받은 데이터', `${(s.bytesDownloaded / 1e6).toFixed(1)} MB`],
      ]
    : [];

  return (
    <div className="stats-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="전문가용 통계">
      <button className="stats-close" onClick={onClose} aria-label="닫기">
        [X]
      </button>
      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function codecName(c: string) {
  if (c.startsWith('av01')) return 'AV1';
  if (c.startsWith('avc1')) return 'H.264';
  if (c.startsWith('vp09')) return 'VP9';
  if (c.startsWith('hvc1') || c.startsWith('hev1')) return 'HEVC';
  if (c === 'opus') return 'Opus';
  if (c.startsWith('mp4a')) return 'AAC';
  return c;
}
