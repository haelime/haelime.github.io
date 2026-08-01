---
title: "자율주행 셔틀: FSM 제어와 시스템 진단"
date: 2026-07-22 09:00:00 +0900
categories: [Portfolio]
tags: [C++, ROS2, FSM, UDP, LiDAR, Fail-Safe]
description: "인천국제공항 자율주행 셔틀의 LiDAR 통신, FSM 제어, heartbeat 기반 Fail-Safe 시스템을 개발한 실무 경험"
image:
  path: /assets/img/projects/autonomous-shuttle/cover-clean.png
  alt: Autonomous shuttle systems project
thumbnail: /assets/img/projects/autonomous-shuttle/cover-clean.png
stack: "C++ · ROS2 · UDP · LiDAR"
project_order: 7
project_group: general
portfolio: true
toc: true
---

2024년 11월부터 2025년 4월까지 웨어러블에이아이에서 차량 시스템 엔지니어로 근무하며 인천국제공항 제2여객터미널 자율주행 셔틀 도입 및 시범 운행 프로젝트에 참여했습니다.

차량 시스템의 센서 통신, 최상위 제어 아키텍처, 분산 모듈 헬스 모니터링과 Fail-Safe 로직을 개발했습니다.

## 센서 데이터 처리 및 네트워크 통신

32kHz 샘플링 레이트와 600RPM 사양의 2D LiDAR 하드웨어 원시 데이터를 UDP 프로토콜로 직접 수신하고 파싱하는 로직을 구현했습니다.

- 커스텀 LiDAR 패킷의 수신, 검증, 파싱 흐름 구현
- 비전 센서 없이 포인트 클라우드를 사용하는 3D 인지 환경에 맞춘 센서 데이터 처리 파이프라인 구축
- 커스텀 하드웨어와 자율주행 시스템 사이의 안정적인 데이터 연동 확보

## 주행 시나리오 기반 시스템 아키텍처 및 제어 로직

승객 탑승, 대기, 주행 등 공항 셔틀 운행 시나리오를 시스템 상태와 전이 조건으로 정의하고 C++/ROS2 기반 최상위 제어 로직을 구현했습니다.

- 상태별 책임과 전이 조건을 분리한 FSM 설계
- 모든 운행 상태에서 즉시 비상 정지로 전환할 수 있는 전역 상태 전이 구성
- 안전 조건을 충족한 뒤 운행 흐름으로 복귀할 수 있는 양방향 비상 정지 아키텍처 설계

## 시스템 안정성 및 헬스 모니터링

Heartbeat 메시지의 발행 및 수신 패턴을 구현해 SLAM, Perception 등 자율주행 분산 모듈의 작동 상태와 생존 여부를 실시간으로 감시했습니다.

- 모듈별 heartbeat와 Alert/Error 레벨 수신 및 상태 판정
- 센서 장애물 근접 경고나 모듈 오류 발생 시 하드웨어 제어 권한 회수
- 위험 상황에서 셔틀을 즉시 정지시키는 Fail-Safe 로직 구현
- 분산 모듈의 이상 상태가 차량 제어 계층까지 전달되는 진단 흐름 구축
