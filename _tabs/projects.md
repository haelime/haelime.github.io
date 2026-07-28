---
title: Projects
icon: fas fa-cubes
order: 6
---

## Clasher

`Unity` `C#` `Node.js` `MySQL` `Redis` `TCP`

Unity 클라이언트와 authoritative 게임 서버로 구성한 실시간 1대1 전략 게임 프로토타입입니다.

### 구현 내용

- 회원가입, 로그인, JWT 갱신과 matchmaking queue
- match ticket 검증을 통과한 클라이언트만 게임 입장 허용
- 100ms 서버 틱 기반 이동, 소환, 전투와 승패 판정
- 소환 위치, 비용, 중복 액션을 서버에서 검증
- custom binary packet 기반 클라이언트/서버 통신

### 설계 목표

클라이언트의 화면 표현과 서버의 게임 판정을 분리해 조작된 요청이 게임 결과를 바꾸지 못하도록 구성했습니다. 인증부터 매칭, 전투, 결과 저장까지 한 판의 전체 흐름을 직접 구현했습니다.

## VestaEngine

`C++` `Vulkan` `GLSL` `CMake` `ImGui`

게임 엔진의 렌더링 구조와 GPU 자원 흐름을 직접 다루기 위해 개발한 Vulkan 렌더링 엔진입니다.

### 구현 내용

- Deferred rasterization과 PBR material
- Progressive path tracing과 hardware ray tracing
- Render graph 기반 pass, resource, barrier 추적
- GPU timestamp profiler와 resource inspector
- Shader hot reload와 컴파일 실패 시 기존 pipeline 유지
- Raster/path tracing 비교와 debug visualization

### 설계 목표

최종 화면만 출력하는 렌더러가 아니라, 프레임이 어떤 pass와 resource transition을 거쳐 만들어졌는지 런타임에서 확인할 수 있는 엔진을 목표로 했습니다.

## GPU Boids Simulation

`Unity` `C#` `Compute Shader` `GPU Instancing`

많은 에이전트가 동시에 움직이는 군집 시뮬레이션을 GPU에서 처리하는 프로젝트입니다.

### 구현 내용

- Boids force 계산과 위치 적분을 Compute Shader로 처리
- 상태를 GPU buffer에 유지해 CPU/GPU 왕복 최소화
- `DrawMeshInstancedIndirect` 기반 대량 렌더링
- 속도, 행동 가중치, attract/repel을 실시간 조절

[Demo Video](https://www.youtube.com/watch?v=zoZexSNFHc8)

## Related Experience

자율주행 셔틀 프로젝트에서 FSM 제어 로직, watchdog 진단/복구 모듈, LiDAR 검증 도구를 개발했습니다. 실시간 상태 처리와 fail-safe 설계 경험을 게임플레이 및 서버 시스템 구현에 활용하고 있습니다.

## Links

- [GitHub](https://github.com/haelime)
- [Shadertoy](https://www.shadertoy.com/view/lffGRj)
- [Resume]({{ '/resume/' | relative_url }})
