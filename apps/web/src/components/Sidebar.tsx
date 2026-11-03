import { Link, useLocation } from 'react-router-dom';
import { getChannels } from '@mytube/core/videoService';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
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

// 메뉴 항목 = 아이콘 + 이름 + 이동할 주소. 데이터로 정의해 두면 펼침/미니 메뉴가 같은 목록을 써요.
const mainItems: NavItem[] = [
  { icon: 'home', label: '홈', to: '/' },
  { icon: 'fire', label: '인기 급상승', to: '/feed/trending' },
  { icon: 'subscriptions', label: '구독', to: '/feed/subscriptions' },
];
const youItems: NavItem[] = [
  { icon: 'history', label: '시청 기록', to: '/feed/history' },
  { icon: 'clock', label: '나중에 볼 동영상', to: '/playlist?list=WL' },
  { icon: 'thumbUp', label: '좋아요 표시한 동영상', to: '/playlist?list=LL' },
];
const exploreItems: NavItem[] = [
  { icon: 'movie', label: '애니메이션', to: '/?category=애니메이션' },
  { icon: 'theaters', label: '예고편', to: '/?category=예고편' },
  { icon: 'eco', label: '자연', to: '/?category=자연' },
];
const miniItems: NavItem[] = [...mainItems, { icon: 'history', label: '나', to: '/feed/history' }];

export function Sidebar({ variant, drawerOpen, onClose, onToggle }: SidebarProps) {
  const { pathname, search } = useLocation();
  const { data: channels = [] } = useAsync(getChannels, 'all');
  const { subscriptions } = useUserState();
  // 전역 상태의 구독 ID 목록으로 채널을 골라요. 시청 페이지에서 구독하면 여기도 바로 바뀌어요.
  const subs = channels.filter((c) => subscriptions.includes(c.id));

  // 현재 주소와 메뉴 주소가 같으면 강조 표시
  const current = decodeURIComponent(pathname + search);
  const isActive = (to: string) => current === to;

  if (variant === 'mini') {
    return (
      <nav className="mini-guide">
        {miniItems.map((item) => (
          <Link key={item.label} to={item.to} className={`mini-item ${isActive(item.to) ? 'active' : ''}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  const link = (item: NavItem) => (
    <Link
      key={item.label}
      to={item.to}
      className={`guide-item ${isActive(item.to) ? 'active' : ''}`}
      onClick={onClose}
    >
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
      <section className="guide-section">{mainItems.map(link)}</section>

      <section className="guide-section">
        <Link to="/feed/history" className="guide-title" onClick={onClose}>
          나 <Icon name="chevronRight" size={20} />
        </Link>
        {youItems.map(link)}
      </section>

      <section className="guide-section">
        <Link to="/feed/subscriptions" className="guide-title" onClick={onClose}>
          구독 <Icon name="chevronRight" size={20} />
        </Link>
        {subs.length === 0 && <p className="guide-empty">구독한 채널이 없습니다.</p>}
        {subs.map((c) => (
            <Link
              key={c.id}
              to={`/channel/${c.id}`}
              className={`guide-item ${isActive(`/channel/${c.id}`) ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="avatar tiny" style={{ background: c.avatarColor }}>{c.name[0]}</span>
              <span className="guide-label">{c.name}</span>
            </Link>
        ))}
      </section>

      <section className="guide-section">
        <h3 className="guide-title">탐색</h3>
        {exploreItems.map(link)}
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
