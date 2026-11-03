import { Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

// MyTube 로고 (YouTube 로고와 구분되는 자체 로고)
export function Logo() {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: t.brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            marginLeft: 2,
            width: 0,
            height: 0,
            borderTopWidth: 6,
            borderBottomWidth: 6,
            borderLeftWidth: 9,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: '#fff',
          }}
        />
      </View>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', letterSpacing: -1 }}>MyTube</Text>
    </View>
  );
}
