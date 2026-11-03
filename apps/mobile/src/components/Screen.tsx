import { View } from 'react-native';
import { usePlayerState } from '@mytube/hooks/usePlayerState';
import { useTheme } from '../theme/useTheme';
import { layout } from '../theme/tokens';

// 모든 화면의 바탕. 미니 플레이어가 떠 있으면 그만큼 아래 여백을 줘서 내용이 가려지지 않게 해요.
export function Screen({ children }: { children: React.ReactNode }) {
  const { t } = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
}

export function useBottomSpace() {
  const { mode } = usePlayerState();
  return mode === 'mini' ? layout.miniPlayerHeight + 8 : 8;
}
