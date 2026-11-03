import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { Icon } from '../components/Icon';

// 아래에서 올라오는 큰 시트 (설명, 댓글에 공통 사용)
export function DescriptionSheet({
  visible,
  onClose,
  title = '설명',
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ height: '30%' }} onPress={onClose} />
      <View style={{ flex: 1, backgroundColor: t.sheet, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.textMuted, marginTop: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: t.divider }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
          <Pressable onPress={onClose} accessibilityLabel="닫기" style={{ padding: 6 }}>
            <Icon name="close" color={t.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        {footer}
      </View>
    </Modal>
  );
}
