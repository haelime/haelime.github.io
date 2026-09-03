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
description: 멀티플레이어 데스크탑 컴패니언
image:
  path: /assets/img/projects/idle-together/gameplay.gif
  alt: 작은 섬의 모닥불 앞에 캐릭터가 앉아 있는 Idle Together 플레이 화면
thumbnail: /assets/img/projects/idle-together/gameplay.gif
stack: C# · Unity 6 · Netcode for GameObjects · Steamworks.NET · URP
period: 2026.06–진행 중
repository: https://github.com/haelime/IdleTogether-2026-06-24_16-19-29
project_order: 1
project_group: games
portfolio: true
hide_from_home: true
toc: true
---
작성 중인 초안입니다.

## 소개

홀로 작업하고 공부하기 외롭고 고단할 때, 같이 음악을 듣거나 말 없이 소통할 수 있었으면 좋을 것 같다는 생각으로 시작한 프로젝트입니다.

함께 있다는 느낌을 해치지 않기 위해 악기 연주와 그림 등을 저지연 실시간 통신으로 구현했습니다.

## 문제
- 실시간 합주에서 연주자가 입력한 음을 즉시 듣고 상대도 최신 음을 빠르게 받아야 했으며, Client→Host→Client 왕복과 패킷 유실 복구가 지연과 재생 상태에 영향을 주는 조건이었음.
- 그림에서는 Host 응답을 기다리면 손끝보다 선이 늦고 드래그 좌표마다 전송하면 메시지 수가 입력 빈도만큼 증가하는 문제가 있었음.

## 기술적 판단

- 악기 입력을 Reliable 순서 보장 메시지로 보내면 유실된 과거 이벤트의 재전송이 최신 음을 늦출 수 있고 Press·Release만 신뢰성 없이 보내면 Release 유실 시 음이 계속 남으므로 두 방식 모두 배제했음.
- 양쪽 Client가 같은 악기 샘플을 보유하므로 오디오 스트리밍은 전송량과 구현 범위를 늘리고 지터 버퍼는 의도적인 재생 지연을 추가한다고 판단해 현재 눌린 음의 상태만 전달하기로 했음.
- 그림의 256×192 RGBA32 전체 픽셀은 압축 전 192 KiB이고 최종 픽셀만 보관하면 늦게 참가한 Client가 그림을 복원할 수 없으므로 로컬 선반영과 선분 명령 동기화를 선택했음.

## 해결과 검증

- 연주자는 256 sample DSP buffer를 요청한 `AudioSource`로 입력을 즉시 듣고 원격 Client는 18바이트 `UnreliableNoDelay` 상태 패킷, 0.05초 전체 snapshot, 순서 번호와 0.3초 timeout으로 최신 연주를 복원하도록 구현했음.
- 그림은 좌표 4개의 `ushort`와 속성 3개의 `byte`로 선분을 표현해 로컬에 먼저 그리고 0.08초 또는 최대 32개 단위로 Host에 보내며, 승인된 선분은 Server 쓰기 `NetworkList`에 보존해 늦게 참가해도 재생하도록 구현했음.
- 패킷 형식·순서·만료와 좌표 양자화·권한·배치·저작 계층을 검사하는 Edit Mode 회귀 테스트를 작성했으나 신규 테스트 실행 결과, 원격 오디오 지연 수치, 거절된 로컬 선분의 되돌리기와 8,192개 이후 그림 압축은 아직 확보하거나 구현하지 않았음.
