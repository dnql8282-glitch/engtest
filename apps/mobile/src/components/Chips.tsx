import { Pressable, ScrollView, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';

// 가로로 스크롤되는 카테고리 칩. 맨 앞에 "탐색" 나침반 칩 (iOS 앱과 같은 구성)
export function Chips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { t } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      style={{ flexGrow: 0, flexShrink: 0, backgroundColor: t.bg }}
    >
      <Pressable style={{ height: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.surface, justifyContent: 'center' }}>
        <Icon name="explore" size={20} color={t.text} />
      </Pressable>
      {items.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={{
              height: 32,
              paddingHorizontal: 12,
              borderRadius: 8,
              justifyContent: 'center',
              backgroundColor: active ? t.text : t.surface,
            }}
          >
            <Text style={{ color: active ? t.bg : t.text, fontSize: 14, fontWeight: '600' }}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
