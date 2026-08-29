---
title: "FlappyBoids"
date: 2026-08-28 20:00:00 +0900
categories: [Portfolio]
tags: [C#, Unity, DOTS, ECS, Burst, Procedural Generation]
description: "고정된 DOTS 물고기 군집과 순환하는 Marching Cubes 코스로 구성한 3D 캐주얼 게임"
stack: "C# · Unity 6 · DOTS/ECS · Burst · URP"
period: "2026.08.26–2026.08.28"
repository: "https://github.com/haelime/FlappyBoids"
project_order: 2
project_group: games
portfolio: true
toc: true
---

## 요약

- **42마리의 Boid를 하나의 조작 단위로 묶고, 충돌한 개체만 제거되는 군집 생존 게임을 구현했습니다.**
- **군집의 월드 Z를 고정한 채 GameObject 코스와 ECS 장애물을 함께 스크롤해 카메라 안정성과 충돌 일관성을 확보했습니다.**
- **Marching Cubes 메시만 파라미터로 갱신하고 렌더러·재질은 씬과 프리팹에 고정해 런타임 시각 계층 생성을 차단했습니다.**

## 군집과 코스 중 어느 쪽을 움직일 것인가

- **선택한 해결법:** 군집의 Z축 기준을 고정하고, 게이트 GameObject·해저 청크·ECS의 `GateObstacle`을 같은 속도로 −Z 방향으로 이동시켰습니다. 지나간 게이트는 12개 풀의 앞쪽 슬롯으로 되돌립니다.
  - **근거:** 초기 구조는 움직이는 리더 앵커와 Boid의 전진 속도를 모두 위치에 적분해 군집 이동이 중복됐습니다. 군집 좌표를 고정하면 카메라와 입력 기준을 유지할 수 있습니다. 대신 화면과 ECS 데이터를 함께 갱신해야 하므로, Play Mode 회귀 시나리오로 군집 중심과 두 게이트 풀의 재사용을 검증합니다.

## Marching Cubes를 어디까지 런타임에 맡길 것인가

- **선택한 해결법:** 해저와 게이트 메시만 밀도 함수와 파라미터로 생성하고, MeshFilter·MeshRenderer·재질은 씬과 프리팹에 미리 연결했습니다. 해저와 게이트에는 서로 다른 격자 해상도 상한을 적용했습니다.
  - **근거:** Marching Cubes의 샘플링과 표면 추출 비용은 3차원 격자의 셀 수에 따라 증가합니다. 렌더러와 재질까지 런타임에 만들면 Edit Mode 계층과 실제 실행 계층이 달라지고 리소스 수명도 숨겨집니다. 절차 생성 범위를 메시로 제한하면 제작 유연성을 유지하면서 생성 비용과 객체 수명을 통제할 수 있습니다.

현재 [GitHub 저장소](https://github.com/haelime/FlappyBoids)에 플레이 가능한 프로토타입과 소스를 공개했습니다. WebGL 시연과 대표 게임플레이 영상은 준비 중이며, 모바일 입력과 장시간 플레이 밸런싱은 후속 작업입니다.
