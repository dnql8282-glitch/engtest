import type { Chapter } from '../types';

// 영상별 챕터 — 스토리보드 장면을 보며 실제 내용에 맞춰 나눴어요.
// (YouTube처럼 0:00에서 시작하고, 짧은 영상에는 챕터를 넣지 않아요)
export const chapters: Record<string, Chapter[]> = {
  v1: [
    { start: 0, title: '오프닝' },
    { start: 30, title: '숲속의 아침' },
    { start: 115, title: '다람쥐 삼총사의 등장' },
    { start: 200, title: '장난이 도를 넘다' },
    { start: 245, title: '복수를 결심하다' },
    { start: 305, title: '함정 만들기' },
    { start: 370, title: '함정 대작전' },
    { start: 492, title: '엔딩 크레딧' },
  ],
  v3: [
    { start: 0, title: '설원의 소녀' },
    { start: 90, title: '기억 속 오두막' },
    { start: 155, title: '도시에서 만난 아기 용' },
    { start: 290, title: '납치된 스케일즈' },
    { start: 325, title: '긴 여정' },
    { start: 390, title: '다시 설원으로' },
    { start: 445, title: '용의 동굴' },
    { start: 545, title: '거대한 용과의 결투' },
    { start: 685, title: '깨달음, 그리고 엔딩' },
    { start: 750, title: '엔딩 크레딧' },
  ],
  v5: [
    { start: 0, title: '타이틀' },
    { start: 30, title: '기계 장치의 세계' },
    { start: 145, title: '붉은 방의 전화' },
    { start: 210, title: '프루그의 안내' },
    { start: 280, title: '갈라지는 두 사람의 세계' },
    { start: 350, title: '문 너머' },
    { start: 420, title: '충돌' },
    { start: 490, title: '무너지는 세계' },
    { start: 555, title: '엔딩 크레딧' },
  ],
  v6: [
    { start: 0, title: '오프닝' },
    { start: 25, title: '다리 위의 이별' },
    { start: 70, title: '40년 후, 로봇과의 전쟁' },
    { start: 180, title: '과거로 돌아가는 계획' },
    { start: 250, title: '다시 그 다리 위에서' },
    { start: 315, title: '다시 쓰는 그날' },
    { start: 410, title: '최후의 전투' },
    { start: 540, title: '엔딩' },
    { start: 590, title: '엔딩 크레딧' },
  ],
  v7: [
    { start: 0, title: '오프닝' },
    { start: 50, title: '외딴 섬의 양 프랭크' },
    { start: 170, title: '수상한 판매원 빅터' },
    { start: 240, title: '평생의 삶을 제안하다' },
    { start: 465, title: '새로운 삶 속으로' },
    { start: 560, title: '코스모스 세탁소' },
    { start: 610, title: '엔딩 크레딧' },
  ],
  // 플레이어 기능 시험용: 1분마다 챕터
  v12: [
    { start: 0, title: '0분 구간' },
    { start: 60, title: '1분 구간' },
    { start: 120, title: '2분 구간' },
    { start: 180, title: '3분 구간' },
    { start: 240, title: '4분 구간' },
  ],
};
