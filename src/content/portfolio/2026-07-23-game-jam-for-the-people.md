---
title: For the people
date: 2026-07-23 09:00:00 +0900
categories:
  - Portfolio
tags:
  - C#
  - Unity
  - GameJam
  - Gameplay
description: GMTK Game Jam 2026
image:
  path: /assets/img/projects/game-jam/screen-2.png
  alt: For the people 게임 화면
thumbnail: /assets/img/projects/game-jam/screen-2.png
stack: C#, Unity, HTML5
project_order: 3
project_group: games
portfolio: true
toc: true
---
[![For the people 플레이 화면](/assets/img/projects/game-jam/gameplay.png)](https://haelime.itch.io/for-the-people)

[**For the people 플레이하기**](https://haelime.itch.io/for-the-people)

## 요약

- 빠른 프로토타입 및 구현 능력으로 하루 만에 플레이 가능한 빌드 개발
- 세계에서 가장 제출 수가 많은 게임 잼에서 Creativity, Enjoyment 부문 상위 3% 성적 달성

### 조작법

- 이동: 마우스 클릭이나 화면 터치 또는 옵션에서 `WASD` 모드 선택
- 불릿 타임 증폭: `Space`를 누르고 있기(모바일은 두 손가락 터치)
- 재시도: `R` 또는 결과 화면의 `RETRY`

GMTK Game Jam 2026의 주제인 **COUNTDOWN**을 폭발 시점을 읽고 시민을 구조하는 규칙으로 풀었습니다. Unity로 제작해 브라우저에서 바로 실행할 수 있는 HTML5 빌드로 공개했습니다.

---

고민한 것들
## Slow-motion 시간축 분리

위험만 느려지고 조작은 즉시 반응하도록 시간축을 분리해, bullet time을 회피 경로를 바꾸는 gameplay rule로 구현했음.

### Why?

- 모든 system을 `timeScale`에 묶으면 충격파와 함께 이동, 입력, UI 반응까지 느려져 조작 의도가 늦게 반영되었음.
- `fixedDeltaTime`을 고정한 채 감속 비율만 바꾸면 실제 시간 기준 물리 갱신 빈도도 함께 달라졌음.

### How?

- 위험과 함께 느려져야 하는 simulation과 실제 시간에 반응해야 하는 system을 어떤 기준으로 나눌지 고민했음.
- 전체 게임플레이에 `timeScale`만 적용하는 방식은 위험과 조작을 함께 늦추므로 배제.

### Solution

- 충격파 확산은 `Time.deltaTime`, 이동, 입력, UI, 폭탄 점화 지연은 `Time.unscaledDeltaTime`으로 갱신
- 감속 비율이 바뀔 때 `Time.fixedDeltaTime`도 같은 비율로 조절해 실제 시간 기준 물리 갱신 간격을 유지
- 조작 속도를 유지하면서 위험만 늦췄지만, 각 system이 사용할 시간축을 명시하고 함께 관리하는 비용을 감수했음.

---
## 결과

| 부문  |     순위 |    점수 |
| --- | -----: | ----: |
| 창의성 |   326위 | 4.292 |
| 재미  |   382위 | 4.042 |
| 음향  | 1,220위 | 3.500 |
| 서사  | 2,813위 | 2.833 |
| 그래픽 | 2,890위 | 3.458 |

[GMTK 게임 잼 출품작 보기](https://itch.io/jam/gmtk-jam-2026/rate/4820527)
