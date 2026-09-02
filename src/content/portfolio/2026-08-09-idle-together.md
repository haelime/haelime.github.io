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

- 장작과 좌석에 동시에 요청이 들어와도 Host가 하나만 승인하고, 늦게 참가한 Client는 모닥불 종료 시각과 점유 상태를 서버 시간으로 복원합니다.
- 로컬 회귀 테스트는 Unity Transport, 배포 연결은 Steam Networking Sockets로 분리해 게임 규칙을 전송 계층에서 독립시켰습니다.
- 장작 한 개가 25분 동안 타고 이모트·라디오·낮밤이 진행을 강제하지 않으면서 다른 플레이어의 존재를 남기도록 핵심 루프를 설계했습니다.

![Idle Together의 투명 데스크톱 섬](/assets/img/projects/idle-together/cover.png)

Idle Together는 Windows 바탕화면 위에 투명한 작은 섬을 띄워 두 사람이 각자의 일을 하면서도 서로 곁에 있음을 느끼게 하는 개인 프로젝트입니다. 2026년 6월부터 Unity 6과 C#으로 개발하고 있습니다.

초기의 건설·생산 시뮬레이션과 낚시 프로토타입을 검토한 뒤, 첫 출시 범위를 모닥불 주위에 머물고 음악과 짧은 반응을 나누는 동행 공간으로 좁혔습니다. 낚시 구현은 `Archive/FishingPrototype-2026-08-20`으로 분리했으며 현재 완성 기준에는 포함하지 않습니다.

## Host 권위로 공유 공간을 일치시키기

### 동시에 같은 장작을 집는 경우

Client는 클릭 의도와 대상만 RPC로 보냅니다. Host는 거리, 장작의 가용 상태, 플레이어의 운반 여부를 검사하고 먼저 처리한 유효 요청 하나에만 소유권을 부여합니다. 같은 좌석을 두 명이 선택할 때도 `occupantClientId`를 Host만 변경해 한 명만 앉도록 했습니다.

플레이어별로 결과를 추측하게 두지 않아 왕복 지연이 달라도 장작과 좌석의 소유자가 갈리지 않습니다. 대신 모든 판정이 Host에 의존하므로 현재 버전에는 Host migration이 없고, Host가 나가면 세션을 종료해야 합니다.

### 늦게 참가해도 같은 불을 보는 경우

모닥불은 매 프레임 연료량을 전송하지 않고 Host가 확정한 `burnEndServerTime` 하나를 `NetworkVariable`로 복제합니다. Client는 Netcode 서버 시간과 종료 시각의 차이로 남은 연료를 계산하므로 늦게 참가해도 같은 상태에서 시작합니다.

불꽃의 개별 파티클이나 오디오 재생 위치는 네트워크로 보내지 않습니다. 각 Client가 정규화된 연료량으로 프리팹에 저작된 Particle System의 활성도·크기·방출량과 Light·AudioSource 상태를 갱신합니다. 공유해야 할 게임 상태와 로컬에서 재현할 표현을 나눠 전송 범위를 줄였습니다.

## 로컬 검증과 Steam 배포의 전송 계층 분리

게임플레이는 Netcode for GameObjects의 RPC와 `NetworkVariable`에만 의존합니다. 로컬 Host·Client 회귀 테스트에서는 Unity Transport의 loopback을 사용하고, Steam Lobby를 만들거나 참가하면 `SteamNetworkingSocketsTransport`가 NGO 패킷을 Steam P2P 연결로 전달합니다.

한 번의 메뉴 실행으로 현재 씬과 스크립트의 변경 여부를 확인한 뒤 같은 Windows 개발 빌드를 Host와 Client 역할의 독립된 두 프로세스로 실행하는 도구도 만들었습니다. Host는 제한 시간 안에 연결된 Client와 PlayerObject 수를 검사해 전용 로그에 결과를 남깁니다. Steam 계정 로그인 충돌 없이 게임 규칙을 반복 검증하기 위한 경계이며, 실제 Steam 전송 검증을 대신하지는 않습니다.

Steam 쪽에는 다음 흐름을 연결했습니다.

- Lobby 생성·검색·참가와 친구 초대
- Steam Networking Sockets 기반 P2P 연결
- 연결 종료와 세션 동안 유지되는 Host 강퇴 목록
- Lobby ID를 salt로 사용한 SHA-256 비밀번호 proof 검증

공개 Lobby metadata에는 비밀번호 원문이나 검증용 해시를 두지 않고 비밀번호 필요 여부만 기록합니다. proof는 Steam의 암호화된 P2P 연결 승인 payload로 전달합니다. 공개 목록의 비밀번호 노출은 피하지만 PAKE는 아니므로 계정 보안용 인증 체계로 취급하지 않습니다.

## 주의를 빼앗지 않는 공유 기능

모닥불은 유지비가 아니라 누군가 남긴 온기를 표현합니다. 장작 한 개의 연소 시간을 25분으로 두고, 불이 꺼져도 이동이나 다른 행동을 막거나 보상을 깎지 않습니다. 꺼진 불을 켤 때만 강한 피드백을 주고 이미 타는 불을 보충할 때는 조용히 처리합니다.

공유 라디오는 누구나 재생·일시정지와 트랙 변경을 요청할 수 있지만 Host가 트랙, 재생 위치와 기준 서버 시각을 확정합니다. 늦게 참가한 Client도 현재 위치를 복원하며 음량은 각자의 로컬 설정으로 남습니다. 배포 권리가 확인된 음악이 아직 없어 실제 트랙은 포함하지 않았습니다.

낮과 밤은 런타임에 조명을 다시 굽지 않습니다. 에디터에서 작성한 Dawn·Day·Dusk·Night Look 네 개를 보간하고, 온라인에서는 Host 서버 시간을 기준으로 같은 위상을 재생합니다. 카메라의 투명 배경은 유지해 바탕화면 합성을 깨지 않습니다.

투명 창은 빈 영역에서 `WS_EX_TRANSPARENT`를 켜 바탕화면으로 클릭을 통과시키고, UI나 상호작용 오브젝트 위에서는 입력을 다시 받습니다. Overlay와 일반 창 모드, 항상 위, 모니터 선택과 입력 통과 방식을 설정에서 전환할 수 있습니다.

## 저작된 프리팹과 회귀 경계

캠프파이어 VFX·Light·AudioSource, 라디오 모델·Collider·음악 창, 플레이어 이모트 UI와 Particle System은 씬과 프리팹에 미리 저작했습니다. 런타임은 직렬화된 참조의 상태만 바꾸며 표시 오브젝트나 머티리얼을 숨겨서 생성하지 않습니다.

Editor 회귀 테스트는 동시 점유 규칙, 서버 시간 계산, Lobby UI 연결뿐 아니라 이 저작 경계도 검사합니다. 특히 런타임 코드에 `Instantiate`, `new GameObject`, `AddComponent`, `new Material` 기반 시각 fallback이 다시 들어오지 않도록 고정했습니다.

## 현재 상태와 남은 검증

현재 클릭 이동, 네트워크 플레이어 동기화, 장작 운반과 모닥불, 좌석, 이모트, Steam Lobby, 공유 라디오와 낮밤까지 플레이 가능한 수직 슬라이스가 연결되어 있습니다. 공동 그림과 실시간 악기 연주는 작업 트리에서 통합 중이므로 완료 범위에는 포함하지 않았습니다.

첫 배포 전에 다음 검증이 남아 있습니다.

- 서로 다른 Steam 계정과 PC에서 Lobby 생성·참가부터 모닥불·좌석·라디오 상태까지 통합 확인
- Host 종료, 강퇴, 잘못된 비밀번호와 연결 끊김을 구분하는 사용자 안내
- 배포 가능한 음악과 효과음의 라이선스 확정 및 최종 믹스
- Windows IL2CPP 빌드의 장시간 실행과 클린 PC 배포 확인

[GitHub에서 소스 보기](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29)
