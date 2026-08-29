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

### 요약
- 빠른 프로토타입 및 구현 능력으로 하루 만에 플레이 가능한 빌드 개발
- 세계에서 가장 제출 수가 많은 게임 잼에서 Creativity, Enjoyment 부문 상위 3% 성적 달성
- 

### 조작법

- 이동: 마우스 클릭이나 화면 터치 또는 옵션에서 `WASD` 모드 선택
- 불릿 타임 증폭: `Space`를 누르고 있기(모바일은 두 손가락 터치)
- 재시도: `R` 또는 결과 화면의 `RETRY`

GMTK Game Jam 2026의 주제인 **COUNTDOWN**을 폭발 시점을 읽고 시민을 구조하는 규칙으로 풀었습니다. Unity로 제작해 브라우저에서 바로 실행할 수 있는 HTML5 빌드로 공개했습니다.

## 전역 시간 배율이 입력과 물리 갱신까지 바꾸는 문제

- **선택한 해결법:** 플레이어 이동·입력·UI·폭탄 점화 지연은 `Time.unscaledDeltaTime`으로 갱신하고, 느려져야 하는 충격파 확산만 `Time.deltaTime`으로 계산했습니다. 감속 비율이 바뀔 때는 `Time.fixedDeltaTime`도 같은 비율로 조절했습니다.
- **근거:** Unity의 `timeScale`은 `deltaTime`뿐 아니라 물리 갱신의 실제 호출 간격에도 영향을 줍니다. 모든 시스템을 같은 시간축에 두면 충격파와 함께 조작 반응이 느려지고, 고정된 `fixedDeltaTime`은 감속 비율에 따라 실제 시간 기준 물리 갱신 빈도를 바꿉니다. 시간 영향을 받아야 하는 시뮬레이션과 실제 시간에 반응해야 하는 시스템을 분리하고 `fixedDeltaTime`을 함께 보정해, 위험만 느려지는 동안 조작 속도와 물리 갱신 간격을 유지했습니다. 각 시스템의 시간축을 명시하고 함께 관리해야 하는 비용은 생기지만, 불릿 타임을 경로를 수정하는 게임 규칙으로 구현했습니다.

## 결과

| 부문  |     순위 |    점수 |
| --- | -----: | ----: |
| 창의성 |   326위 | 4.292 |
| 재미  |   382위 | 4.042 |
| 음향  | 1,220위 | 3.500 |
| 서사  | 2,813위 | 2.833 |
| 그래픽 | 2,890위 | 3.458 |

[GMTK 게임 잼 출품작 보기](https://itch.io/jam/gmtk-jam-2026/rate/4820527)
