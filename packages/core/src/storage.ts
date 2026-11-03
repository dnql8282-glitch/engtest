// 저장소 추상화 (Storage Abstraction)
// core는 "어딘가에 문자열을 저장하고 꺼낼 수 있다"는 약속(인터페이스)만 알아요.
// 실제로 어디에 저장할지는 플랫폼이 정해서 끼워 넣어요(의존성 주입).
//   웹:           localStorage        (web/platform/localStorageStore.ts)
//   React Native: AsyncStorage        (나중에 같은 모양으로 만들면 끝)
//   테스트:       메모리               (createMemoryStore)
// AsyncStorage가 비동기라서, 처음부터 Promise 기반으로 맞춰 뒀어요.

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
  };
}

let store: KeyValueStore = createMemoryStore();

/** 앱 시작 시 플랫폼이 한 번 호출해서 실제 저장소를 끼워 넣어요 */
export function configureStore(s: KeyValueStore) {
  store = s;
}

const PREFIX = 'mytube:';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await store.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback; // 깨진 데이터가 있어도 앱은 계속 동작하게
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간이 꽉 찼거나 막힌 경우: 이번 세션 동안은 메모리 상태로만 동작
  }
}

// ── 계정별 저장 공간 ─────────────────────────────────────────────────────────
// 같은 기기에서 여러 계정을 쓰면 구독·시청 기록 같은 데이터는 계정마다 따로 있어야 해요.
// 키 앞에 계정 id를 붙여 공간을 나눠요:  mytube:u:<계정id>:history
// 테마·볼륨처럼 "기기 설정"은 readJson/writeJson(공용)으로, 계정 데이터는 아래 두 함수로 읽고 써요.
let scope = 'guest';

export function setStorageScope(accountId: string | null) {
  scope = accountId ?? 'guest';
}

export function currentScope() {
  return scope;
}

export async function readScoped<T>(key: string, fallback: T): Promise<T> {
  const v = await readJson<T | null>(`u:${scope}:${key}`, null);
  if (v !== null) return v;
  // 계정 기능 이전에 저장된 데이터(게스트)는 그대로 이어서 써요
  if (scope === 'guest') return readJson<T>(key, fallback);
  return fallback;
}

export async function writeScoped(key: string, value: unknown): Promise<void> {
  await writeJson(`u:${scope}:${key}`, value);
}
