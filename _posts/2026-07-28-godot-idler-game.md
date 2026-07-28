---
title: "Godot Desktop Idler Game"
date: 2026-07-28 09:00:00 +0900
categories: [Portfolio]
tags: [C#, Godot, Steamworks, Multiplayer, Win32]
description: "투명 desktop overlay, tick simulation, Steam P2P를 결합한 Godot multiplayer idler prototype"
image:
  path: /assets/img/projects/godot-idler/cover.png
  alt: Godot desktop overlay idler game
thumbnail: /assets/img/projects/godot-idler/thumb.webp
stack: "C# · Godot 4 · Steamworks · Win32 API"
project_order: 1
project_group: games
portfolio: true
toc: true
---

Godot 4, C#, Steamworks API로 개발 중인 desktop overlay 방식의 multiplayer idler game입니다.

일반적인 game window 대신 배경이 투명한 창이 바탕화면 위에 상주합니다. 웹서핑이나 코딩을 방해하지 않으면서 캐릭터가 생활하고, 친구의 캐릭터가 내 화면에 방문하는 경험을 목표로 합니다.

<video class="w-100 mb-4" controls preload="metadata" poster="/assets/img/projects/godot-idler/demo-1.jpg">
  <source src="/assets/img/projects/godot-idler/demo-1.mp4" type="video/mp4">
</video>

> 현재 핵심 architecture를 검증하는 prototype 단계이며 일부 기능은 구현 및 refactoring 중입니다.
{: .prompt-info }

## Desktop Overlay와 Click-through

Godot 기본 기능만으로 처리하기 어려운 투명 click-through window를 C#과 Win32 API로 구현했습니다.

- `user32.dll`을 P/Invoke로 호출
- `SetWindowLong`과 `WS_EX_LAYERED` flag로 layered window 구성
- chroma key 영역을 투명하게 처리
- 투명 영역의 mouse input을 desktop으로 전달
- game window를 always-on-top으로 유지

게임플레이와 UI는 GDScript로, OS 수준의 window control은 C#으로 분리했습니다. 각 언어가 잘 처리하는 영역에만 책임을 배치했습니다.

## Layered Tick Simulation

Desktop에 계속 실행되는 game 특성상 낮은 resource usage가 중요합니다. 모든 system을 매 frame 갱신하지 않고 작업 성격에 따라 tick을 나눴습니다.

- **Normal Tick (60Hz):** UI와 movement interpolation
- **Rare Tick (~4s):** AI state decision과 pathfinding
- **Long Tick (~33s):** save와 무거운 statistics 처리

현실 시간과 game time의 비율을 별도로 조절해 idler genre에 맞는 진행 속도를 구성했습니다.

## Steamworks P2P Multiplayer

GodotSteam을 이용해 lobby matchmaking과 P2P packet 전송을 구현했습니다.

- `MultiplayerSpawner`로 network object 생성
- `MultiplayerSynchronizer`로 character position 동기화
- host/client authority 분리
- customization data를 JSON으로 전송

<video class="w-100 mb-4" controls preload="metadata" poster="/assets/img/projects/godot-idler/demo-2.jpg">
  <source src="/assets/img/projects/godot-idler/demo-2.mp4" type="video/mp4">
</video>

## AI와 Job System

채집, 운반, 제작 작업을 중앙 job queue에서 관리하고 사용 가능한 Pawn에게 배분합니다.

Pawn은 공통 `PawnState`를 기반으로 Idle, Working, Moving 상태를 분리했습니다. 새로운 행동은 state와 job을 추가하는 방식으로 확장할 수 있습니다.

```text
GodotIdlerGame/
├── managers/
│   ├── game_server.gd       # time and simulation
│   ├── steam_lobby_server.gd
│   └── job_server.gd
└── states/                  # pawn FSM
```

## 현재 검증 중인 것

- 장시간 실행해도 부담이 적은 simulation update 구조
- Steam lobby와 P2P session 안정성
- host migration과 authority boundary
- job allocation과 Pawn FSM의 확장성

[Original Notion Page](https://app.notion.com/p/Godot-idler-game-project-2e8b4a6f757780178a4ae4497a4854c3?source=copy_link)
