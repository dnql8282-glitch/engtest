import { getVideosByIds } from '@mytube/core/videoService';
import { userStore } from '@mytube/core/userStore';
import { groupHistoryByDay } from '@mytube/core/history';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { ListSkeleton, VideoListItem } from '../components/VideoListItem';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

// 시청 기록: /feed/history — 날짜별로 묶어서 보여줘요
export function HistoryPage() {
  const { history } = useUserState();
  const { data: videos } = useAsync(getVideosByIds, history.map((h) => h.videoId).join(','));
  const byId = new Map(videos?.map((v) => [v.id, v]));
  const groups = groupHistoryByDay(history);

  return (
    <div className="results history">
      <div className="page-head">
        <h1 className="page-title">시청 기록</h1>
        {history.length > 0 && (
          <button
            className="pill"
            onClick={() => {
              if (window.confirm('시청 기록을 모두 지울까요?')) userStore.clearHistory();
            }}
          >
            <Icon name="delete" />
            <span>시청 기록 지우기</span>
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <EmptyState emoji="🕘" title="시청 기록이 없습니다" text="영상을 보면 여기에 기록됩니다." />
      ) : !videos ? (
        <ListSkeleton />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="history-group">
            <h2 className="group-title">{g.label}</h2>
            {g.entries.map((e) => {
              const v = byId.get(e.videoId);
              return v ? (
                <VideoListItem
                  key={e.videoId}
                  video={v}
                  trailing={
                    <button className="icon-btn" aria-label="시청 기록에서 삭제" onClick={() => userStore.removeFromHistory(v.id)}>
                      <Icon name="close" />
                    </button>
                  }
                />
              ) : null;
            })}
          </section>
        ))
      )}
    </div>
  );
}
