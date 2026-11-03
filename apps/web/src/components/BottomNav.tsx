import { Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { AccountAvatar } from './AccountAvatar';

// 좁은 화면(휴대폰)에서만 보이는 하단 내비게이션 — YouTube 모바일과 같은 구성
const ITEMS: { to: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { to: '/', label: '홈', icon: 'home', match: (p) => p === '/' },
  { to: '/shorts', label: 'Shorts', icon: 'shorts', match: (p) => p.startsWith('/shorts') },
  { to: '/feed/subscriptions', label: '구독', icon: 'subscriptions', match: (p) => p === '/feed/subscriptions' },
  { to: '/feed/you', label: '나', icon: 'you', match: (p) => p === '/feed/you' || p === '/feed/history' || p === '/playlist' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link key={item.to} to={item.to} className={`bottom-nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
            {item.icon === 'you' ? (
              <AccountAvatar size={24} className={active ? 'ring' : ''} />
            ) : (
              <Icon name={item.icon} />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
