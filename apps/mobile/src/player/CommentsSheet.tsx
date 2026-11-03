import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Comment } from '@mytube/core/types';
import { addComment, deleteComment, getComments } from '@mytube/core/commentService';
import { formatRelativeTime } from '@mytube/core/format';
import { useAsync } from '@mytube/hooks/useAsync';
import { useTheme } from '../theme/useTheme';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { DescriptionSheet } from './DescriptionSheet';

// 댓글 시트 — 웹 Comments 컴포넌트와 같은 서비스(commentService)와 같은 상태 설계
export function CommentsSheet({ videoId, visible, onClose }: { videoId: string; visible: boolean; onClose: () => void }) {
  const { t } = useTheme();
  const { data: loaded = [] } = useAsync(getComments, videoId);
  const [added, setAdded] = useState<Comment[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [text, setText] = useState('');
  const comments = [...added, ...loaded].filter((c) => !removed.includes(c.id));

  const submit = async () => {
    if (!text.trim()) return;
    const c = await addComment(videoId, text);
    setAdded((prev) => [c, ...prev]);
    setText('');
  };

  return (
    <DescriptionSheet
      visible={visible}
      onClose={onClose}
      title={`댓글 ${comments.length}`}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: t.divider }}>
          <Avatar name="나" color="#5c6bc0" size={28} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="댓글 추가..."
            placeholderTextColor={t.textMuted}
            onSubmitEditing={() => void submit()}
            returnKeyType="send"
            style={{ flex: 1, height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: t.surface, color: t.text }}
          />
          <Pressable onPress={() => void submit()} disabled={!text.trim()} accessibilityLabel="댓글 등록" style={{ opacity: text.trim() ? 1 : 0.4, padding: 4 }}>
            <Icon name="send" color={t.link} />
          </Pressable>
        </View>
      }
    >
      {comments.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
          <Avatar name={c.author} color={c.authorColor} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.textSub, fontSize: 12 }}>
              {c.author} · {formatRelativeTime(c.createdAt)}
            </Text>
            <Text style={{ color: t.text, fontSize: 14, lineHeight: 20, marginTop: 2 }}>{c.text}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="thumb-up-off-alt" size={16} color={t.textSub} />
                {c.likes > 0 && <Text style={{ color: t.textSub, fontSize: 12 }}>{c.likes}</Text>}
              </View>
              <Icon name="thumb-down-off-alt" size={16} color={t.textSub} />
              {c.mine && (
                <Pressable
                  onPress={async () => {
                    setRemoved((prev) => [...prev, c.id]);
                    await deleteComment(c.id);
                  }}
                >
                  <Text style={{ color: t.danger, fontSize: 12 }}>삭제</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ))}
    </DescriptionSheet>
  );
}
