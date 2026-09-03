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
- 같은 장작·좌석에 요청이 겹쳐도 Host만 소유 상태를 쓰게 해 유효한 요청 하나만 확정했음.
- 모닥불은 종료 시각, 라디오는 재생 기준 시각을 복제해 늦게 참가한 Client도 현재 상태를 복원하도록 구성했음.
- 게임 규칙과 전송 계층을 분리했으며 로비·전송 경계 관련 Edit Mode 검증 8건이 2026-08-28 모두 통과했음.

![Idle Together의 투명 데스크톱 섬](/assets/img/projects/idle-together/cover.png)

Idle Together는 Windows 바탕화면 위 작은 섬에서 두 사람이 각자의 일을 하며 함께 머무는 멀티플레이 게임임. 2026년 6월 24일부터 기획, Unity 클라이언트, 네트워크 게임플레이, Steam 연결과 저작 도구를 혼자 개발하고 있음.

핵심 과제는 대화를 강요하지 않는 동행 공간에서 동시 입력과 늦은 참가가 발생해도 모든 플레이어가 같은 장작·좌석·모닥불 상태를 보게 만드는 것이었음. 이를 위해 Host 권위 판정, 서버 시각 기반 상태 복원, 실행 환경별 전송 교체를 하나의 경계로 설계했음.

공개 구현 근거: [공유 상호작용](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Campfire/SceneComponents/NetworkPlayerCarryInteractor.cs) · [모닥불 시간 상태](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Campfire/SceneComponents/NetworkCampfire.cs) · [전송 계층 교체](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Multiplayer/SceneComponents/MultiplayerSessionController.cs) · [검증 결과](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Artifacts/UI/multiplayer-ui-tests.xml)

## 동시 입력에서 소유 상태가 갈리는 문제

두 Client가 같은 장작이나 좌석을 거의 동시에 선택하면 각 화면의 선행 결과나 왕복 지연만으로 소유자를 정할 수 없었음. Client마다 다른 승자를 선택하는 상황을 예방하기 위해 Client는 클릭 의도와 대상만 RPC로 보내고, Host가 거리·대상 종류·가용 상태·현재 운반 상태를 다시 판정하도록 했음.

장작의 `available`과 `claimedByClientId`, 좌석의 `occupantClientId`는 Server 쓰기 권한을 가진 `NetworkVariable`로 유지했음. Host가 먼저 처리한 유효 요청에서 가용 상태와 소유자를 함께 바꾸므로 뒤따른 요청은 거절되며, [장작과 좌석의 점유 규칙](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Campfire/Tests/Editor/CampfirePrototypeTests.cs)은 두 요청 중 정확히 하나만 성공하는 동작을 고정함.

모든 판정을 Host에 모은 대신 현재 Host migration은 지원하지 않음. Host가 종료되면 세션도 끝나는 비용을 첫 출시 범위에서 받아들였음.

## 늦게 참가한 Client가 현재 상태를 복원하는 문제

모닥불의 점화 이벤트만 RPC로 보내면 이후 참가자는 이미 지나간 이벤트를 받을 수 없었음. 매 프레임 연료량을 보내는 대신 Host가 확정한 `burnEndServerTime` 하나를 복제하고, 각 Client가 NGO 서버 시간과의 차이로 남은 연소 시간을 계산하도록 했음.

네트워크에는 복원에 필요한 게임 상태만 남기고 불꽃 파티클, 조명과 소리는 각 Client가 `NormalizedFuel`에서 재현하도록 분리했음. Particle System·Light·AudioSource는 캠프파이어 프리팹에 미리 저작했으며 런타임은 활성도·크기·방출량·음량만 변경함. 이 경계 덕분에 늦은 참가자도 같은 연료 상태를 얻는 한편 개별 파티클의 무작위 움직임까지 일치시키는 비용은 지지 않음.

같은 시간 모델을 [공유 라디오](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Radio/SceneComponents/NetworkRadioMusic.cs)와 낮밤 주기에도 적용했음. 라디오는 트랙·재생 여부·기준 위치·변경 시각을 Host가 확정하고, 낮밤은 서버 시간으로 네 개의 Look 사이 위상을 계산함.

상태 동기화가 플레이어에게 유지 노동을 요구하지 않도록 장작 한 개의 연소 시간을 프리팹에서 1,500초로 설정했음. 한 번의 행동이 25분 동안 남고 불이 꺼져도 이동이나 다른 기능을 막지 않도록 해, 네트워크 상태를 경쟁 점수가 아닌 조용한 동행의 흔적으로 사용했음.

## 로컬 검증과 Steam 배포의 전송 경계

Steam 계정 하나로 두 프로세스를 실행하면 로그인 충돌이 생기므로 로컬 회귀 경로를 실제 배포 전송과 분리해야 했음. 게임플레이 코드는 NGO의 RPC와 `NetworkVariable`에만 의존하게 두고, 로컬 Host·Client 도구는 Unity Transport의 loopback을 사용하며 Steam Lobby에서는 [Steam Networking Sockets 기반 `NetworkTransport`](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Assets/_Game/Scripts/Multiplayer/SceneComponents/SteamNetworkingSocketsTransport.cs)로 교체했음.

원클릭 검증 도구는 씬과 스크립트 해시가 바뀌었을 때만 Windows 개발 빌드를 만들고, 같은 실행 파일을 Host와 Client 역할의 독립 창으로 실행함. Host가 30초 안에 Host를 포함한 연결 항목 2개와 PlayerObject 2개를 확인하면 PASS를 기록하도록 기준을 코드에 남겼음.

Steam Lobby 비밀번호는 원문이나 재사용 가능한 검증값을 공개 metadata에 싣는 방안을 배제했음. Lobby에는 비밀번호 필요 여부만 공개하고, Lobby ID와 비밀번호로 만든 SHA-256 proof를 연결 승인 payload로 보내 Host가 검증하도록 했음. 공개 목록 노출은 막지만 PAKE가 아니므로 고가치 계정 인증을 대신하지 않는다는 한계도 유지했음.

## 검증과 현재 상태

[2026-08-28 Edit Mode 결과](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29/blob/2b4be8f221f51a5f7408b5d7881276e4226f8c9b/Artifacts/UI/multiplayer-ui-tests.xml)에서 원클릭 Host·Client 실행 인자, Lobby 비밀번호 proof, 씬에 저작된 Steam transport와 로비 UI 참조를 검사한 8건이 모두 통과했음. 이 결과는 구조와 회귀 경계를 검증하지만 실제 Steam P2P 연결 성공을 증명하지는 않음.

현재 장작 운반·모닥불·좌석·이모트·Steam Lobby·공유 라디오·낮밤이 연결된 멀티플레이 수직 슬라이스를 구현했음. 출시 전에는 서로 다른 Steam 계정과 PC에서의 통합 검증, Host 종료·강퇴·연결 끊김 UX, Windows IL2CPP 빌드와 클린 PC 실행 검증이 남아 있음.

[GitHub에서 소스 보기](https://github.com/haelime/IdleTogether-2026-06-24_16-19-29)
