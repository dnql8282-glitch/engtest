import { readJson, setStorageScope, writeJson } from './storage';
import { userStore } from './userStore';

// ─────────────────────────────────────────────────────────────────────────────
// 계정 (로그인 상태)
//  - 이 기기에 로그인한 적 있는 계정 목록과, 지금 쓰는 계정을 기억해요.
//  - 계정을 바꾸면 저장 공간(setStorageScope)을 바꾸고 사용자 데이터를 다시 불러와요.
//    → 구독, 시청 기록, 재생목록, 시청 위치가 계정마다 따로 보여요.
//  - 로그인하지 않은 상태 = 게스트 (YouTube처럼 그래도 영상은 볼 수 있어요)
//
//  서버가 없어서 "로그인"은 이 기기 안에서만 의미가 있어요.
//  구글 로그인은 구글이 확인해 준 이름·이메일·사진을 받아 계정을 구분하는 데 써요.
// ─────────────────────────────────────────────────────────────────────────────

export interface Account {
  id: string; // 'google:<구글 사용자 id>' 또는 'local:<임의 id>'
  provider: 'google' | 'local';
  name: string;
  email?: string;
  picture?: string;
  color: string; // 사진이 없을 때 아바타 색
}

export interface AccountState {
  loaded: boolean;
  accounts: Account[];
  currentId: string | null; // null = 게스트
}

let state: AccountState = { loaded: false, accounts: [], currentId: null };
const listeners = new Set<() => void>();
const set = (next: Partial<AccountState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const COLORS = ['#5c6bc0', '#e91e63', '#009688', '#ff9800', '#795548', '#3f51b5', '#8bc34a'];

async function activate(id: string | null) {
  setStorageScope(id);
  set({ currentId: id });
  await writeJson('currentAccount', id);
  await userStore.init(); // 이 계정의 데이터로 다시 불러오기
}

export const accountStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,

  /** 앱 시작 시: 계정 목록과 마지막 계정을 불러오고, 그 계정의 데이터를 불러와요 */
  async init() {
    const [accounts, currentId] = await Promise.all([
      readJson<Account[]>('accounts', []),
      readJson<string | null>('currentAccount', null),
    ]);
    const valid = currentId && accounts.some((a) => a.id === currentId) ? currentId : null;
    set({ loaded: true, accounts });
    await activate(valid);
  },

  current(): Account | null {
    return state.accounts.find((a) => a.id === state.currentId) ?? null;
  },

  /** 로그인: 처음 보는 계정이면 목록에 추가하고 그 계정으로 전환 */
  async signIn(input: Omit<Account, 'color'> & { color?: string }) {
    const existing = state.accounts.find((a) => a.id === input.id);
    const account: Account = { ...existing, ...input, color: input.color ?? existing?.color ?? COLORS[state.accounts.length % COLORS.length] };
    const accounts = existing ? state.accounts.map((a) => (a.id === account.id ? account : a)) : [...state.accounts, account];
    set({ accounts });
    await writeJson('accounts', accounts);
    await activate(account.id);
  },

  /** 테스트용 로컬 계정 만들기 (구글 설정 없이도 계정별 기능을 확인할 수 있게) */
  async createLocal(name: string) {
    const id = `local:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await accountStore.signIn({ id, provider: 'local', name: name.trim() || '새 계정' });
  },

  switchTo: (id: string | null) => activate(id),

  /** 로그아웃: 게스트로 (계정과 그 데이터는 기기에 남아서 다시 로그인하면 그대로) */
  signOut: () => activate(null),

  /** 이 기기에서 계정 삭제 (목록에서만 빼요) */
  async remove(id: string) {
    const accounts = state.accounts.filter((a) => a.id !== id);
    set({ accounts });
    await writeJson('accounts', accounts);
    if (state.currentId === id) await activate(null);
  },
};

/** 테스트용 */
export function resetAccountStoreForTest() {
  state = { loaded: false, accounts: [], currentId: null };
  listeners.clear();
  setStorageScope(null);
}
