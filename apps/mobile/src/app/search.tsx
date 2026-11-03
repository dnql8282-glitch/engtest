import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSuggestions } from '@mytube/core/videoService';
import { IconButton } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useTheme } from '../theme/useTheme';

// 검색 화면: [← 입력창] + 자동완성 목록 (iOS 앱처럼 화면 전체가 검색 모드)
export default function SearchScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getSuggestions(text).then((s) => !cancelled && setSuggestions(s));
    return () => {
      cancelled = true;
    };
  }, [text]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    router.replace({ pathname: '/results', params: { q: q.trim() } });
  };

  return (
    <Screen>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4, height: 48 + insets.top }}>
        <IconButton name="arrow-back" color={t.text} onPress={() => router.back()} label="뒤로" />
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => submit(text)}
          placeholder="MyTube 검색"
          placeholderTextColor={t.textMuted}
          returnKeyType="search"
          style={{ flex: 1, height: 36, borderRadius: 18, paddingHorizontal: 16, backgroundColor: t.surface, color: t.text, fontSize: 15 }}
        />
        <IconButton name="mic" color={t.text} onPress={() => {}} label="음성 검색" />
      </View>
      <FlatList
        data={suggestions}
        keyExtractor={(s) => s}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={() => submit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, height: 48 }}>
            <Icon name="search" color={t.text} />
            <Text style={{ flex: 1, color: t.text, fontSize: 15 }} numberOfLines={1}>{item}</Text>
            <Icon name="north-west" color={t.textSub} size={20} />
          </Pressable>
        )}
      />
    </Screen>
  );
}
