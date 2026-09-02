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

- Host가 장작·좌석의 동시 요청을 직렬 판정해 하나의 소유 상태만 확정합니다.
- 서버 종료 시각 하나로 모닥불을 동기화해 늦게 참가한 Client도 같은 상태를 복원합니다.
- 게임 규칙을 NGO에 고정하고 Unity Transport와 Steam Networking Sockets를 실행 환경에 따라 교체합니다.

![Idle Together의 투명 데스크톱 섬](/assets/img/projects/idle-together/cover.png)

Idle Together는 Windows 바탕화면 위 투명한 섬을 공유하는 멀티플레이 게임으로, Unity 6과 C#으로 개발한 개인 프로젝트입니다.

## 서버 권위 상태 동기화

Client는 클릭 의도만 RPC로 보내고 Host가 거리·대상 상태·현재 소유권을 검증합니다. 동시에 같은 장작이나 좌석을 선택해도 먼저 처리한 유효 요청 하나만 승인합니다.

모닥불은 연료량 대신 `burnEndServerTime`을 `NetworkVariable`로 복제합니다. 늦게 참가한 Client는 서버 시간으로 남은 연료를 복원하고, 불꽃·조명·소리는 그 값에서 로컬로 재현합니다. 현재 Host migration은 지원하지 않습니다.

## 실행 환경 경계

게임플레이는 Netcode for GameObjects의 RPC와 `NetworkVariable`만 사용합니다. 로컬 테스트는 Unity Transport의 loopback, Steam 세션은 전용 `SteamNetworkingSocketsTransport`를 사용합니다. Steam Lobby 비밀번호는 원문을 공개 metadata에 저장하지 않고 Lobby ID 기반 SHA-256 proof로 승인합니다.

투명 창은 Win32 `WS_EX_TRANSPARENT`를 제어해 빈 영역의 클릭만 바탕화면으로 통과시킵니다. VFX·Light·AudioSource와 UI는 씬·프리팹에 저작하고, 회귀 테스트로 런타임 시각 오브젝트 생성 fallback을 금지했습니다.

## 현재 상태

멀티플레이 수직 슬라이스는 연결됐으며, 출시 전 실제 Steam 2계정 통합 테스트와 Windows IL2CPP 빌드 검증이 남아 있습니다.

[GitHub에서 소스 보기](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29)
