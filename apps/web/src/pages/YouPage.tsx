import { Link } from 'react-router-dom';
import { getVideosByIds } from '@mytube/core/videoService';
import { likedVideoIds, userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Thumbnail } from '../components/Thumbnail';
import { Icon, type IconName } from '../components/Icon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// "나" 페이지: /feed/you — 프로필, 최근 기록(가로 스크롤), 재생목록, 설정
export function YouPage() {
  const user = useUserState();
  const { data: history = [] } = useAsync(getVideosByIds, user.history.slice(0, 12).map((h) => h.videoId).join(','));
  const liked = likedVideoIds(user);
  const dark = user.theme === 'dark';
  useDocumentTitle('나');

  return (
    <div className="you-page">
      <div className="you-profile">
        <span className="avatar huge-sm" style={{ background: '#5c6bc0' }}>나</span>
        <div>
          <h1 className="you-name">나</h1>
          <p className="you-handle">@me · 공부용 계정</p>
        </div>
      </div>

      <section className="you-section">
        <div className="you-section-head">
          <h2>기록</h2>
          <Link to="/feed/history" className="pill small">모두 보기</Link>
        </div>
        {history.length === 0 ? (
          <p className="you-empty">아직 시청한 영상이 없어요.</p>
        ) : (
          <div className="you-row">
            {history.map((v) => (
              <Link key={v.id} to={`/watch/${v.id}`} className="you-card">
                <Thumbnail video={v} />
                <p className="you-card-title">{v.title}</p>
                <p className="you-card-meta">{v.channel.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="you-section">
        <div className="you-section-head">
          <h2>재생목록</h2>
        </div>
        <YouRow to="/playlist?list=LL" icon="thumbUp" label="좋아요 표시한 동영상" sub={`동영상 ${liked.length}개`} />
        <YouRow to="/playlist?list=WL" icon="clock" label="나중에 볼 동영상" sub={`동영상 ${user.watchLater.length}개`} />
      </section>

      <section className="you-section">
        <div className="you-section-head">
          <h2>설정</h2>
        </div>
        <button className="you-row-item" onClick={() => userStore.setTheme(dark ? 'light' : 'dark')}>
          <Icon name={dark ? 'sun' : 'moon'} />
          <span className="you-row-label">{dark ? '밝은 테마로 바꾸기' : '어두운 테마로 바꾸기'}</span>
        </button>
      </section>
    </div>
  );
}

function YouRow({ to, icon, label, sub }: { to: string; icon: IconName; label: string; sub: string }) {
  return (
    <Link to={to} className="you-row-item">
      <Icon name={icon} />
      <span className="you-row-label">
        {label}
        <small>{sub}</small>
      </span>
      <Icon name="chevronRight" />
    </Link>
  );
}
