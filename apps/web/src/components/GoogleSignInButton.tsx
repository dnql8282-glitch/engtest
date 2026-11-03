import { useEffect, useRef, useState } from 'react';
import { accountStore } from '@mytube/core/accountStore';
import { decodeIdToken, GOOGLE_CLIENT_ID, loadGoogle } from '../auth/google';
import { toast } from '../ui/toast';

// 구글이 직접 그려 주는 공식 "Google 계정으로 로그인" 버튼
export function GoogleSignInButton({ onDone }: { onDone?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const life = { alive: true };
    loadGoogle()
      .then((gid) => {
        if (!life.alive || !ref.current) return;
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID!,
          callback: async ({ credential }) => {
            const p = decodeIdToken(credential);
            await accountStore.signIn({ id: `google:${p.sub}`, provider: 'google', name: p.name, email: p.email, picture: p.picture });
            toast(`${p.name} 계정으로 로그인했어요`);
            onDone?.();
          },
        });
        gid.renderButton(ref.current, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'ko', width: 280 });
      })
      .catch((e: Error) => life.alive && setError(e.message));
    return () => {
      life.alive = false;
    };
  }, [onDone]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="signin-note">
        <b>구글 로그인을 쓰려면 설정이 하나 필요해요.</b>
        <br />
        Google Cloud Console에서 OAuth 클라이언트 ID를 만든 뒤, <code>apps/web/.env.local</code>에{' '}
        <code>VITE_GOOGLE_CLIENT_ID=…</code>를 넣고 개발 서버를 다시 켜 주세요. (자세한 방법: README)
      </div>
    );
  }
  return (
    <>
      <div ref={ref} className="google-btn" />
      {error && <p className="signin-error">{error}</p>}
    </>
  );
}
