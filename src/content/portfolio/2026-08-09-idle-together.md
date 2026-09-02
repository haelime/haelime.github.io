---
title: Idle Together
date: 2026-08-09 09:00:00 +0900
categories:
  - Portfolio
tags:
  - C#
  - Unity
  - Multiplayer
  - Netcode
  - Steamworks
description: Steam P2P로 친구와 모닥불·음악·시간을 공유하는 Windows 데스크톱 컴패니언 게임
image:
  path: /assets/img/projects/idle-together/cover.png
  alt: 투명한 데스크톱 위 작은 섬에 플레이어와 모닥불이 배치된 Idle Together 화면
thumbnail: /assets/img/projects/idle-together/cover.png
stack: C# · Unity 6 · Netcode for GameObjects · Steamworks.NET · URP
period: 2026.06–진행 중
repository: https://github.com/haelime/IdleTogether-2026-06-24_16-19-29
project_order: 1
project_group: games
portfolio: true
hide_from_home: true
toc: true
---

- Host 권위로 장작·좌석의 동시 요청을 하나만 승인하고, 늦게 참가한 Client에도 같은 모닥불 상태를 복원합니다.
- 로컬 검증은 Unity Transport, 배포 연결은 Steam Networking Sockets로 분리해 게임 규칙을 전송 계층에서 독립시켰습니다.
- 장작 한 개의 연소 시간을 25분으로 두고 이모트·라디오·낮밤을 결합해 플레이를 강제하지 않는 동행 경험을 만들었습니다.

![Idle Together의 투명 데스크톱 섬](/assets/img/projects/idle-together/cover.png)

Idle Together는 Windows 바탕화면 위 작은 섬에서 두 사람이 각자의 일을 하며 함께 머무는 개인 프로젝트입니다. Unity 6과 C#으로 투명 오버레이, Host 권위형 멀티플레이와 Steam Lobby를 구현했습니다.

초기 건설·낚시 프로토타입에서 기능 범위를 줄이고, 모닥불·음악·짧은 반응을 공유하는 동행 공간을 첫 출시 목표로 정했습니다.

## 핵심 구현

### Host가 공유 상태를 결정합니다

Client는 클릭 의도만 RPC로 보내고 Host가 거리와 대상 상태를 검증합니다. 같은 장작이나 좌석에 요청이 겹쳐도 먼저 처리한 유효 요청 하나만 승인합니다.

모닥불은 연료량 대신 종료 시각 `burnEndServerTime`을 복제합니다. 늦게 참가한 Client도 서버 시간으로 남은 연료를 계산하며, 불꽃·조명·소리는 각 Client가 같은 값에서 재현합니다. Host migration은 아직 없어 Host가 나가면 세션이 종료됩니다.

### 로컬 테스트와 Steam 전송을 분리했습니다

게임플레이는 Netcode for GameObjects의 RPC와 `NetworkVariable`만 사용합니다. 로컬 Host·Client 테스트는 Unity Transport의 loopback으로 실행하고, Steam 세션에서는 전용 `SteamNetworkingSocketsTransport`로 교체합니다.

Steam Lobby 생성·검색·참가, 친구 초대, 연결 종료와 강퇴를 연결했습니다. 비밀번호 원문은 공개 Lobby metadata에 저장하지 않고 Lobby ID로 만든 SHA-256 proof를 연결 승인 과정에서 검증합니다.

### 공유 기능이 집중을 방해하지 않게 했습니다

모닥불이 꺼져도 불이익을 주지 않으며 장작 한 개는 25분 동안 탑니다. 공유 라디오의 재생 상태와 네 가지 낮밤 Look은 Host 시간을 따르지만 음량은 각자의 로컬 설정으로 남습니다.

투명 창의 빈 영역은 바탕화면으로 클릭을 통과시키고 UI와 상호작용 대상만 입력을 받습니다. VFX·Light·AudioSource와 UI는 씬·프리팹에 미리 저작했으며, 회귀 테스트로 런타임 시각 오브젝트 생성 fallback이 다시 생기지 않게 고정했습니다.

## 현재 상태

클릭 이동, 네트워크 플레이어, 장작 운반과 모닥불, 좌석, 이모트, Steam Lobby, 공유 라디오와 낮밤까지 수직 슬라이스가 연결되어 있습니다. 출시 전에는 실제 Steam 2계정 통합 테스트, 배포 음원 라이선스 확정과 Windows IL2CPP 빌드 검증이 남아 있습니다.

[GitHub에서 소스 보기](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29)
