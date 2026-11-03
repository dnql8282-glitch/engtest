import { Link } from 'react-router-dom';
import { getChannels } from '../../core/videoService';
import { useAsync } from '../hooks/useAsync';
import { useUserState } from '../hooks/useUserStore';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';

// full: 펼친 메뉴(240px), mini: 아이콘만(72px), drawer: 평소엔 숨김 + 메뉴 버튼으로 덮어서 열기
export type SidebarVariant = 'full' | 'mini' | 'drawer';

interface SidebarProps {
  variant: SidebarVariant;
  drawerOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface NavItem {
  icon: IconName;
  label: string;
  to: string;
}

const mainItems: NavItem[] = [
  { icon: 'home', label: '홈', to: '/' },
  { icon: 'fire', label: '인기 급상승', to: '/' },
  { icon: 'subscriptions', label: '구독', to: '/' },
];
const youItems: NavItem[] = [
  { icon: 'history', label: '시청 기록', to: '/' },
  { icon: 'playlist', label: '재생목록', to: '/' },
  { icon: 'clock', label: '나중에 볼 동영상', to: '/' },
  { icon: 'thumbUp', label: '좋아요 표시한 동영상', to: '/' },
];
const exploreItems: NavItem[] = [
  { icon: 'music', label: '음악', to: '/' },
  { icon: 'game', label: '게임', to: '/' },
  { icon: 'trophy', label: '스포츠', to: '/' },
];

export function Sidebar({ variant, drawerOpen, onClose, onToggle }: SidebarProps) {
  const { data: channels = [] } = useAsync(getChannels, 'all');
  const { subscriptions } = useUserState();
  // 전역 상태의 구독 ID 목록으로 채널을 골라요. 시청 페이지에서 구독하면 여기도 바로 바뀌어요.
  const subs = channels.filter((c) => subscriptions.includes(c.id));

  if (variant === 'mini') {
    return (
      <nav className="mini-guide">
        {[...mainItems, { icon: 'history', label: '나', to: '/' } as NavItem].map((item, i) => (
          <Link key={item.label} to={item.to} className={`mini-item ${i === 0 ? 'active' : ''}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  const link = (item: NavItem, active = false) => (
    <Link key={item.label} to={item.to} className={`guide-item ${active ? 'active' : ''}`} onClick={onClose}>
      <Icon name={item.icon} />
      <span className="guide-label">{item.label}</span>
    </Link>
  );

  const guide = (
    <nav className={`guide ${variant === 'drawer' ? 'drawer' : ''} ${drawerOpen ? 'open' : ''}`}>
      {variant === 'drawer' && (
        <div className="drawer-header">
          <button className="icon-btn" aria-label="메뉴" onClick={onToggle}>
            <Icon name="menu" />
          </button>
          <Logo />
        </div>
      )}
      <section className="guide-section">{mainItems.map((item, i) => link(item, i === 0))}</section>

      <section className="guide-section">
        <Link to="/" className="guide-title" onClick={onClose}>
          나 <Icon name="chevronRight" size={20} />
        </Link>
        {youItems.map((item) => link(item))}
      </section>

      <section className="guide-section">
        <h3 className="guide-title">구독</h3>
        {subs.length === 0 && <p className="guide-empty">구독한 채널이 없습니다.</p>}
        {subs.map((c) => (
          <Link key={c.id} to="/" className="guide-item" onClick={onClose}>
            <span className="avatar tiny" style={{ background: c.avatarColor }}>{c.name[0]}</span>
            <span className="guide-label">{c.name}</span>
          </Link>
        ))}
      </section>

      <section className="guide-section">
        <h3 className="guide-title">탐색</h3>
        {exploreItems.map((item) => link(item))}
      </section>

      <footer className="guide-footer">
        <p>공부용 클론 프로젝트입니다.</p>
        <p>© 2026 MyTube</p>
      </footer>
    </nav>
  );

  if (variant === 'drawer') {
    return (
      <>
        {drawerOpen && <div className="backdrop" onClick={onClose} />}
        {guide}
      </>
    );
  }
  return guide;
}
