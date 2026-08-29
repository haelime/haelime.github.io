---
title: FlappyBoids
date: 2026-08-28 20:00:00 +0900
categories:
  - Portfolio
tags:
  - C#
  - Unity
  - Burst
  - Procedural Generation
description: 물고기 군집을 하나의 플레이어로 조종하는 3D Flappy Bird 프로토타입
thumbnail: /assets/img/projects/flappy-boids/thumbnail.jpg
stack: C# · Unity 6 · Burst · URP · Marching Cubes
period: 2026.08.26–2026.08.28
repository: https://github.com/haelime/FlappyBoids
project_order: 2
project_group: games
portfolio: true
toc: true
---

## 핵심 성과

- **42마리 물고기를 DOTS 군집으로 시뮬레이션하고, 충돌한 개체만 제거되는 생존 규칙을 구현했습니다.**
- **군집의 Z축 위치를 고정한 채 12개 게이트와 ECS 충돌 데이터를 함께 순환시켜 카메라와 조작 기준을 안정화했습니다.**
- **Marching Cubes의 런타임 책임을 메시 갱신으로 제한하고 렌더러와 재질은 씬·프리팹에 직렬화했습니다.**

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/wx1vzctrdEY" title="Flappy boids 게임플레이" allowfullscreen></iframe>
</div>

Unity 6과 DOTS로 제작한 3D Flappy Bird 프로토타입입니다. `BoidFlockingSystem`이 separation·alignment·cohesion을 Burst 병렬 작업으로 계산하고, 플레이어는 물고기 한 마리가 아니라 군집의 이동 기준을 조종합니다. 게임플레이와 절차 생성 코스, 씬·프리팹 저작 도구를 구현했습니다.

## 고정된 군집과 움직이는 코스

초기 구현은 리더와 각 물고기의 전진 속도를 모두 Z축 위치에 반영했습니다. 이를 군집의 Z축 기준은 고정하고 게이트·해저·ECS 장애물 데이터를 같은 속도로 이동하는 구조로 바꿨습니다. 지나간 게이트는 새로 만들지 않고 12개 풀의 앞쪽으로 되돌리며, 플레이 모드 테스트로 군집 위치와 화면·충돌 풀의 재사용을 함께 검증합니다.

## 절차 생성의 경계

Marching Cubes는 해저와 게이트의 메시만 갱신합니다. `MeshFilter`, `MeshRenderer`, 재질과 충돌 구성은 씬과 프리팹에 미리 연결해 편집 계층과 실행 계층을 일치시켰습니다. 절차 지형을 유지하면서도 어떤 객체와 리소스가 존재하는지 Edit Mode에서 확인할 수 있습니다.

현재 [GitHub 저장소](https://github.com/haelime/FlappyBoids)에 소스를, 위 영상에 플레이 결과를 공개했습니다.
