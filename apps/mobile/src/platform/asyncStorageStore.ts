import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from '@mytube/core/storage';

// 모바일용 저장소 구현. 웹의 localStorageStore와 "같은 약속"을 지켜요.
// core는 이 파일이 있는지도 몰라요. 앱 시작 시 configureStore()로 끼워 넣을 뿐이에요.
export const asyncStorageStore: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
