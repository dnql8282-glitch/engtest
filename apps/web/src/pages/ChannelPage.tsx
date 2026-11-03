import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChannelPage, sortChannelVideos, type ChannelSort } from '@mytube/core/videoService';
import { formatCount, formatDate, formatFullCount } from '@mytube/core/format';
import { useAsync } from '@mytube/hooks/useAsync';
import { SubscribeButton } from '../components/SubscribeButton';
import { Icon } from '../components/Icon';
import { NotFoundPage } from './NotFoundPage';
import { VideoGrid } from './HomePage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SORTS: [ChannelSort, string][] = [
  ['latest', '최신순'],
  ['popular', '인기순'],
  ['oldest', '날짜순'],
];

// 채널 페이지: /channel/:channelId — 탭(동영상 / 정보), 정렬 칩
export function ChannelPage() {
  const { channelId = '' } = useParams();
  const { data, loading } = useAsync(getChannelPage, channelId);
  const [tab, setTab] = useState<'videos' | 'about'>('videos');
  const [sort, setSort] = useState<ChannelSort>('latest');
  useDocumentTitle(data?.channel.name);

  if (!loading && data === null) return <NotFoundPage />;
  const channel = data?.channel;
  const totalViews = data?.videos.reduce((sum, v) => sum + v.views, 0) ?? 0;
  const firstUpload = data?.videos.reduce((min, v) => (v.uploadedAt < min ? v.uploadedAt : min), data.videos[0]?.uploadedAt ?? '');

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
      <div className="channel-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'videos'} className={`channel-tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>
          동영상
        </button>
        <button role="tab" aria-selected={tab === 'about'} className={`channel-tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>
          정보
        </button>
      </div>

      {tab === 'videos' ? (
        <>
          <div className="channel-sort">
            {SORTS.map(([key, label]) => (
              <button key={key} className={`chip ${sort === key ? 'active' : ''}`} onClick={() => setSort(key)}>
                {label}
              </button>
            ))}
          </div>
          <VideoGrid videos={data ? sortChannelVideos(data.videos, sort) : undefined} showChannel={false} />
        </>
      ) : (
        channel && (
          <div className="channel-about">
            <h2>설명</h2>
            <p>{channel.name} 채널입니다. 공개 라이선스 영상을 소개하는 가상의 채널이에요.</p>
            <h2>채널 세부정보</h2>
            <ul>
              <li><Icon name="you" /> 구독자 {formatFullCount(channel.subscribers)}명</li>
              <li><Icon name="subscriptions" /> 동영상 {data.videos.length}개</li>
              <li><Icon name="fire" /> 조회수 {formatFullCount(totalViews)}회</li>
              {firstUpload && <li><Icon name="clock" /> 첫 업로드 {formatDate(firstUpload)}</li>}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
