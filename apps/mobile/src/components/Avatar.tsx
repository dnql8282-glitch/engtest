import { Text, View } from 'react-native';

// 프로필 이미지 대신 색 + 첫 글자
export function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: size * 0.4 }}>
        {name.replace('@', '')[0]}
      </Text>
    </View>
  );
}
