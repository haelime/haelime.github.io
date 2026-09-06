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

## 고민한 부분

### Slow-motion 중에도 조작 유지

충격파와 함께 이동, 입력, UI까지 느려지면 회피 경로를 바꾸기 어려워 시간축을 분리함. 충격파는 `Time.deltaTime`, 이동과 입력, UI, 폭탄 점화 지연은 `Time.unscaledDeltaTime`을 사용해 위험만 늦추고 조작은 즉시 반응하도록 구성.

감속 비율에 맞춰 `Time.fixedDeltaTime`도 조절해 실제 시간 기준 물리 갱신 간격을 유지함.

### Countdown을 플레이 규칙으로

폭발까지 남은 시간을 읽고 시민을 구조하도록 시한 폭탄을 중심 규칙으로 사용. 주제를 화면의 타이머뿐 아니라 이동과 회피 판단에 연결

폭탄에 여러 동심원을 그려 플레이어가 3초 안에 파악하고 결정하기 쉽게 유도했음 

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
