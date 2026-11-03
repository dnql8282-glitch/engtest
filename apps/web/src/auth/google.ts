// ─────────────────────────────────────────────────────────────────────────────
// 구글 로그인 (Google Identity Services, 구글 공식 웹 로그인)
//
//  준비물: Google Cloud Console에서 만든 "OAuth 클라이언트 ID (웹 애플리케이션)"
//   1. https://console.cloud.google.com → API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID 만들기
//   2. 승인된 JavaScript 원본에 http://localhost:5173 추가
//   3. apps/web/.env.local 파일에  VITE_GOOGLE_CLIENT_ID=발급받은ID  저장
//
//  구글이 돌려주는 "ID 토큰"(JWT) 안에 이름·이메일·사진·고유번호(sub)가 들어 있어요.
//  서버가 없어서 토큰 서명 검증은 하지 않고, 이 기기 안에서 계정을 구분하는 데만 써요.
//  (서버를 붙이면 반드시 서버에서 토큰을 검증해야 해요)
// ─────────────────────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export interface GoogleProfile {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let loading: Promise<GoogleAccountsId> | null = null;

/** 구글 로그인 스크립트를 한 번만 불러와요 */
export function loadGoogle(): Promise<GoogleAccountsId> {
  loading ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('구글 로그인을 불러오지 못했어요')));
    s.onerror = () => {
      loading = null;
      reject(new Error('구글 로그인 스크립트를 받을 수 없어요 (인터넷 연결 확인)'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** JWT 가운데 부분(내용)을 꺼내요: base64url → JSON (한글 이름도 깨지지 않게 UTF-8로) */
export function decodeIdToken(jwt: string): GoogleProfile {
  const part = jwt.split('.')[1] ?? '';
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const json = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, string>;
  return { sub: json.sub, name: json.name ?? json.email ?? '구글 사용자', email: json.email, picture: json.picture };
}
