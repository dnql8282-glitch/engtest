import { useUserState } from '@mytube/hooks/useUserStore';
import { darkTokens, lightTokens } from './tokens';

// 현재 테마의 색 토큰. 테마 값은 core의 userStore에 있어서 웹과 같은 방식으로 저장돼요.
export function useTheme() {
  const { theme } = useUserState();
  return { t: theme === 'light' ? lightTokens : darkTokens, isDark: theme !== 'light' };
}
