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
description: Cozy한 데스크톱 컴패니언 게임
image:
  path: /assets/img/projects/idle-together/gameplay.gif
  alt: 작은 섬의 모닥불 앞에 캐릭터가 앉아 있는 Idle Together 플레이 화면
thumbnail: /assets/img/projects/idle-together/gameplay.gif
stack: C# , Unity 6 , Netcode for GameObjects , Steamworks.NET , URP
period: 2026.06–진행 중
project_order: 2
project_group: games
portfolio: true
hide_from_home: false
toc: true
---
현재 개발 중인 데스크톱 컴패니언 게임입니다. 제목은 가제이며. 아래 영상은 개발 중인 버전의 모습입니다.

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/8TIG3hvAFB4" title="Idle Together 개발 중인 버전 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=8TIG3hvAFB4">Idle Together 개발 영상</a></figcaption>
</figure>

계속 대화하거나 무언가를 함께 달성하지 않아도, 옆에 누군가 있다는 느낌을 주고 싶었습니다.

빗소리나 바람 소리, 음악을 들으며 각자의 일을 하고, 잠깐 쉬고 싶을 때 악기를 연주하거나 같은 캔버스에 그림을 그리는 공간을 기획했습니다.

이런 상호작용일수록 반응이 바로 옆에 있는 것처럼 자연스러워야 한다고 생각했습니다. 입력한 뒤 한참 지나서 소리가 나거나, 옆 사람이 그린 선이 내 화면에만 없는 일은 없어야 했습니다.

---
## 합주 프레임워크

<figure>
  <img src="/assets/img/projects/idle-together/ocarina.png" alt="오카리나를 연주하는 캐릭터와 6개 운지 키를 표시한 조작 화면" width="1111" height="650" loading="lazy" />
  <figcaption>개발 중인 오카리나 연주 화면</figcaption>
</figure>

마비노기와 검은사막의 연주 시스템을 좋아해 악보를 찍어 올리곤 했지만, 실시간 연주를 지원하지 않는 점은 아쉬웠습니다. 이 경험이 합주 프레임워크를 만든 계기가 되었고, 자율주행 시스템 프로그래머로 일하며 쌓은 로우 레이턴시 프로토콜 분석 경험이 설계에 큰 도움이 되었습니다.

연주 동기화는 Yamaha의 [SYNCROOM](https://syncroom.yamaha.com/about/)을 참고했습니다.

각 PC에 악기 음원이 준비되어 있으므로, **누가 어떤 음을 언제 연주했는지** 전달하도록 설계했습니다. 피아노의 건반 입력과 기타의 줄 튕기기를 공통 이벤트로 바꿔, 악기가 늘어나도 같은 전송 방식을 사용할 수 있습니다.

새 프로토콜은 **연결과 악기 설정은 확실하게 공유하고, 연주는 빠진 패킷을 기다리지 않는 것**을 기준으로 설계했습니다.

- **연주 준비:** reliable 핸드셰이크로 버전과 악기 데이터, 초기 상태를 확인한 뒤 전송 시작
- **연주 전달:** UDP 기반 Steam 전송의 unreliable로 즉시 전달. 최근 이벤트를 반복해서 포함하고 ID로 중복 제거
- **상태 복구:** 현재 울리는 음과 페달 상태를 주기적으로 공유해, 종료 입력이 빠져 계속 울리는 음 정리
- **재생 시점:** 내 입력은 즉시 반영하고, 상대 입력은 짧은 버퍼로 연주 간격 유지. 너무 늦은 시작 입력은 건너뛰어 이후 연주 지연 방지

패킷은 필드 위치와 바이트 순서를 고정한 바이너리로, **헤더 40바이트 + 개수 2바이트 + 이벤트당 16바이트**로 구성했습니다(Steam과 UDP/IP 헤더 별도). Host는 소유권, 패킷 형식과 악기별 입력 범위를 검사하도록 했습니다.

같은 음을 다시 눌러도 구분할 수 있도록 시작마다 ID를 부여하고, 종료할 때 그 ID를 지정하도록 했습니다. 이전 종료 입력이 늦게 도착해 새 음을 끊는 일을 막기 위한 설계입니다. 다만 반복 전송에서도 놓친 짧은 음까지 복구할 수는 없습니다.

## 함께 그리기

<figure>
  <img src="/assets/img/projects/idle-together/canvas-gameplay.gif" alt="섬 위에 직접 그린 그림이 담긴 캔버스와 캐릭터가 보이는 게임 화면" width="800" height="529" loading="lazy" />
  <figcaption>개발 중인 캔버스와 게임 화면</figcaption>
</figure>

그림도 같은 기준으로 만들었습니다. 내 손이 움직일 때 선은 바로 보여야 하고, 다른 사람과 함께 그린 결과는 서로 같아야 합니다.

1. **그리는 동안:** 내 화면에 선을 먼저 표시하고, 선분을 묶어 Host에 전송
2. **공유할 때:** Host가 권한과 입력값을 검사하고, 받아들인 선을 참가자에게 전달
3. **응답을 받으면:** Host가 확정한 그림 위에 아직 승인받지 않은 내 선만 겹쳐 표시

손님에게 그리기 권한이 없거나 너무 많은 입력을 보내 선이 거절되면, 그 선은 내 화면에서도 지웁니다. 동시에 그린 선이 겹치면 Host가 확정한 순서를 따릅니다.

늦게 들어온 사람에게는 처음부터 모든 선을 다시 보내지 않습니다. **현재 그림을 압축해 전달**하므로, 얼마나 오래 그렸든 지금의 캔버스에서 함께 시작할 수 있습니다.

- 평소에는 시작점과 끝점, 색상, 굵기와 도구를 담은 11바이트 선분 전송
- 참가하거나 그림이 어긋났을 때는 현재 픽셀 데이터를 Deflate로 압축해 나누어 전달
- 기본 캔버스는 256 × 192, 압축 전 48 KiB
- 자유롭게 그리는 붓 외에 Shift+드래그 직선 도구 제공

새 프로토콜의 구현과 검증, 실행 취소를 비롯한 나머지 기능은 개발 중입니다.
