import type { KeyValueStore } from '@mytube/core/storage';

// 웹 브라우저용 저장소 구현. core의 KeyValueStore 약속을 localStorage로 지켜요.
// 시크릿 모드 등에서 localStorage 접근이 막히면 에러가 나므로 try/catch로 감싸요.
export const localStorageStore: KeyValueStore = {
  async getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* 저장 실패는 무시 */
    }
  },
};
