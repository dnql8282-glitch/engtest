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
