import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';

export interface SheetItem {
  icon: IconName | 'blank';
  label: string;
  onPress: () => void;
  danger?: boolean;
  keepOpen?: boolean; // 누른 뒤에도 시트를 닫지 않음 (하위 메뉴로 이동할 때)
}

// iOS 앱의 바텀시트 메뉴 (⋮ 를 누르면 아래에서 올라오는 목록)
export function Sheet({ visible, onClose, items }: { visible: boolean; onClose: () => void; items: SheetItem[] }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: t.sheet,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.textMuted, marginBottom: 8 }} />
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => {
              if (!item.keepOpen) onClose();
              item.onPress();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              paddingHorizontal: 20,
              height: 48,
              backgroundColor: pressed ? t.surface : 'transparent',
            })}
          >
            {item.icon === 'blank' ? <View style={{ width: 24 }} /> : <Icon name={item.icon} color={item.danger ? t.danger : t.text} />}
            <Text style={{ color: item.danger ? t.danger : t.text, fontSize: 15 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
