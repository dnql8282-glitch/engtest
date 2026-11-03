import { Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

export function EmptyState({ emoji, title, text }: { emoji: string; title: string; text?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 8 }}>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      {text && <Text style={{ color: t.textSub, fontSize: 14, textAlign: 'center' }}>{text}</Text>}
    </View>
  );
}
