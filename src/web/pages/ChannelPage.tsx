import { useParams } from 'react-router-dom';
import { getChannelPage } from '../../core/videoService';
import { formatCount } from '../../core/format';
import { useAsync } from '../hooks/useAsync';
import { SubscribeButton } from '../components/SubscribeButton';
import { NotFoundPage } from './NotFoundPage';
import { VideoGrid } from './HomePage';

// 채널 페이지: /channel/:channelId
export function ChannelPage() {
  const { channelId = '' } = useParams();
  const { data, loading } = useAsync(getChannelPage, channelId);

  if (!loading && data === null) return <NotFoundPage />;
  const channel = data?.channel;

  return (
    <div className="channel-page">
      <div
        className="channel-banner"
        style={{ background: channel ? `linear-gradient(120deg, ${channel.avatarColor}, #1f1f1f)` : undefined }}
      />
      {channel && (
        <div className="channel-head">
          <span className="avatar huge" style={{ background: channel.avatarColor }}>{channel.name[0]}</span>
          <div className="channel-info">
            <h1 className="channel-name">{channel.name}</h1>
            <p className="channel-meta">
              @{channel.id} · 구독자 {formatCount(channel.subscribers)}명 · 동영상 {data.videos.length}개
            </p>
            <SubscribeButton channelId={channel.id} />
          </div>
        </div>
      )}
      <div className="channel-tabs">
        <span className="channel-tab active">동영상</span>
      </div>
      <VideoGrid videos={data?.videos} showChannel={false} />
    </div>
  );
}
