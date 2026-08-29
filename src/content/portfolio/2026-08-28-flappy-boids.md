---
title: "FlappyBoids"
date: 2026-08-28 20:00:00 +0900
categories: [Portfolio]
tags: [C#, Unity, Burst, Procedural Generation]
description: "고정된 물고기 군집과 순환하는 Marching Cubes 코스로 구성한 3D 캐주얼 게임"
thumbnail: /assets/img/projects/flappy-boids/thumbnail.jpg
stack: "C# · Unity 6 · Burst · URP · Marching Cubes"
period: "2026.08.26–2026.08.28"
repository: "https://github.com/haelime/FlappyBoids"
project_order: 2
project_group: games
portfolio: true
toc: true
---

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/wx1vzctrdEY" title="Flappy boids 게임플레이" allowfullscreen></iframe>
</div>

## 요약

- **42마리 군집을 하나의 조작 단위로 묶고 개체별 충돌 손실이 누적되는 생존 규칙 구현**
- **전진 주체를 군집에서 순환 코스로 바꿔 카메라 기준과 충돌 좌표 안정화**
- **절차 생성 범위를 메시로 제한하고 화면 계층은 씬에 고정해 객체 수명 명시**

## 군집과 코스 중 어느 쪽을 움직일 것인가

- **선택한 해결법:** 군집의 Z축 기준을 고정하고, 화면 코스와 충돌 데이터를 같은 속도로 −Z 방향으로 이동시켰습니다. 지나간 게이트는 12개 게이트로 구성한 풀의 앞쪽 슬롯으로 되돌립니다.
- **근거:** 초기 구조는 움직이는 리더 앵커와 각 물고기의 전진 속도를 모두 위치에 적분해 군집 이동이 중복됐습니다. 군집 좌표를 고정하면 카메라와 입력 기준을 유지할 수 있습니다. 대신 화면과 충돌 데이터를 함께 갱신해야 하므로, 회귀 시나리오로 군집 중심과 두 표현의 풀 재사용을 검증합니다.

## Marching Cubes를 어디까지 런타임에 맡길 것인가

- **선택한 해결법:** 해저와 게이트 메시만 밀도 함수와 파라미터로 생성하고, 렌더러와 재질은 씬과 프리팹에 미리 연결했습니다. 해저와 게이트에는 서로 다른 격자 해상도 상한을 적용했습니다.
- **근거:** Marching Cubes의 샘플링과 표면 추출 비용은 3차원 격자의 셀 수에 따라 증가합니다. 화면 객체까지 런타임에 만들면 편집 계층과 실행 계층이 달라지고 리소스 수명도 숨겨집니다. 절차 생성 범위를 메시로 제한하면 제작 유연성을 유지하면서 생성 비용과 객체 수명을 통제할 수 있습니다.

현재 [GitHub 저장소](https://github.com/haelime/FlappyBoids)에 플레이 가능한 프로토타입과 소스를 공개했습니다. WebGL 빌드, 모바일 입력과 장시간 플레이 밸런싱은 후속 작업입니다.
