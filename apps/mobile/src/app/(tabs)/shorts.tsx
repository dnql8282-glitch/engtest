import { Screen } from '../../components/Screen';
import { TopBar } from '../../components/TopBar';
import { EmptyState } from '../../components/EmptyState';

export default function ShortsScreen() {
  return (
    <Screen>
      <TopBar />
      <EmptyState emoji="🎬" title="쇼츠는 준비 중이에요" text="세로 영상을 위아래로 넘겨 보는 화면은 다음 단계에서 만들어요." />
    </Screen>
  );
}
