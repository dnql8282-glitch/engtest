import { accountStore, type Account } from '@mytube/core/accountStore';
import { useAccountState } from '@mytube/hooks/useAccountState';

// 계정 아바타: 구글 프로필 사진이 있으면 사진, 없으면 색 + 첫 글자. 게스트는 사람 모양.
export function AccountAvatar({ account, size = 32, className = '' }: { account?: Account | null; size?: number; className?: string }) {
  useAccountState(); // 계정이 바뀌면 다시 그리기
  const a = account === undefined ? accountStore.current() : account;
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (a?.picture) {
    return <img className={`avatar avatar-img ${className}`} style={style} src={a.picture} alt="" referrerPolicy="no-referrer" />;
  }
  if (!a) {
    return (
      <span className={`avatar avatar-guest ${className}`} style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`avatar ${className}`} style={{ ...style, background: a.color }}>
      {a.name[0]}
    </span>
  );
}
