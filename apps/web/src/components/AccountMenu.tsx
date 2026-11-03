import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountStore } from '@mytube/core/accountStore';
import { userStore } from '@mytube/core/userStore';
import { useAccountState } from '@mytube/hooks/useAccountState';
import { useUserState } from '@mytube/hooks/useUserStore';
import { AccountAvatar } from './AccountAvatar';
import { Icon } from './Icon';
import { SignInDialog } from './SignInDialog';
import { toast } from '../ui/toast';

// 오른쪽 위 프로필 메뉴 (YouTube와 같은 구성)
//  로그인 상태: 내 정보 / 계정 전환 / 로그아웃 / 테마
//  게스트:     "로그인" 버튼
export function AccountMenu() {
  const { accounts, currentId } = useAccountState();
  const { theme } = useUserState();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = accounts.find((a) => a.id === currentId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setSwitching(false);
  };

  return (
    <div className="menu-anchor" ref={ref}>
      {me ? (
        <button
          className="avatar-btn"
          aria-label="계정 메뉴"
          aria-expanded={open}
          onClick={() => {
            setSwitching(false); // 열 때는 항상 첫 화면부터
            setOpen((o) => !o);
          }}
        >
          <AccountAvatar size={32} />
        </button>
      ) : (
        <button className="signin-btn" onClick={() => setSignIn(true)}>
          <AccountAvatar account={null} size={24} />
          <span>로그인</span>
        </button>
      )}

      {open && me && (
        <div className="account-popup" role="menu">
          {switching ? (
            <>
              <button className="account-row back" onClick={() => setSwitching(false)}>
                <Icon name="arrowBack" /> 계정
              </button>
              {accounts.map((a) => (
                <button
                  key={a.id}
                  className="account-row"
                  role="menuitemradio"
                  aria-checked={a.id === currentId}
                  onClick={async () => {
                    await accountStore.switchTo(a.id);
                    toast(`${a.name} 계정으로 전환했어요`);
                    close();
                  }}
                >
                  <AccountAvatar account={a} size={36} />
                  <span className="account-text">
                    <b>{a.name}</b>
                    <small>{a.email ?? (a.provider === 'local' ? '테스트 계정' : '')}</small>
                  </span>
                  {a.id === currentId && <Icon name="check" />}
                </button>
              ))}
              <button
                className="account-row"
                onClick={() => {
                  close();
                  setSignIn(true);
                }}
              >
                <Icon name="personAdd" /> 계정 추가
              </button>
            </>
          ) : (
            <>
              <div className="account-head">
                <AccountAvatar size={40} />
                <div>
                  <b>{me.name}</b>
                  <small>{me.email ?? '테스트 계정'}</small>
                  <Link to="/feed/you" onClick={close} className="account-link">
                    내 정보 보기
                  </Link>
                </div>
              </div>
              <button className="account-row" onClick={() => setSwitching(true)}>
                <Icon name="switchAccount" /> 계정 전환 <Icon name="chevronRight" />
              </button>
              <button
                className="account-row"
                onClick={async () => {
                  await accountStore.signOut();
                  toast('로그아웃했어요');
                  close();
                }}
              >
                <Icon name="logout" /> 로그아웃
              </button>
              <div className="account-sep" />
              <button className="account-row" onClick={() => userStore.setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} /> 디자인: {theme === 'dark' ? '어두운 테마' : '밝은 테마'}
              </button>
            </>
          )}
        </div>
      )}
      {signIn && <SignInDialog onClose={() => setSignIn(false)} />}
    </div>
  );
}
