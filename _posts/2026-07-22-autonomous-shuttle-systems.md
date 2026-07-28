---
title: "자율주행 셔틀: FSM 제어와 시스템 진단"
date: 2026-07-22 09:00:00 +0900
categories: [Portfolio]
tags: [C++, ROS2, FSM, Watchdog, Python]
description: "인천국제공항 자율주행 셔틀의 상태 제어, fail-safe, 진단 도구를 개발한 실무 경험"
image:
  path: /assets/img/projects/autonomous-shuttle/cover.png
  alt: Autonomous shuttle systems project
thumbnail: /assets/img/projects/autonomous-shuttle/thumb.webp
stack: "C++ · ROS2 · Python · PyQt"
project_order: 7
portfolio: true
toc: true
---

2024년 11월부터 2025년 4월까지 웨어러블에이아이에서 차량 시스템 엔지니어로 근무하며 인천국제공항 제2여객터미널 자율주행 셔틀 프로젝트에 참여했습니다.

차량의 최상위 상태를 제어하는 FSM, 프로세스 상태를 감시하는 watchdog, 현장 검증을 위한 LiDAR 시각화 도구를 개발했습니다.

## 주행 제어 FSM

승객 탑승 대기, 주행, 회피, 비상 정지처럼 공항 운행 중 발생하는 시나리오를 상태와 전이 조건으로 분리했습니다.

- C++/ROS2 기반 최상위 제어 로직 구현
- 상태별 책임을 분리한 OOP 기반 FSM 구성
- 센서 오작동과 돌발 장애물 발생 시 안전 모드로 진입하는 fail-safe 루틴
- 복잡한 전이 조건을 명시적으로 관리해 유지보수성과 확장성 확보

게임의 캐릭터 상태나 전투 흐름과 도메인은 다르지만, 입력과 조건에 따라 상태를 전이하고 잘못된 전이를 차단한다는 점에서는 동일한 문제였습니다.

## Health Check와 자동 복구

셔틀은 다수의 센서와 ROS2 프로세스로 구성됩니다. 한 모듈의 지연이나 크래시가 전체 시스템 정지로 이어지지 않도록 각 프로세스의 heartbeat를 감시했습니다.

- 응답 지연과 프로세스 종료 감지
- 오류 발생 시 자동 재시작
- 복구 실패 또는 반복 장애 발생 시 관리자 알림
- 실제 시운전 전에 소프트웨어 fault를 조기에 발견할 수 있는 진단 흐름 구성

## LiDAR 시각화 도구

현장에서 센서 데이터를 빠르게 확인할 수 있도록 Python/PyQt 기반 경량 도구를 만들었습니다.

LiDAR point cloud를 2D 평면에 실시간으로 표시해 차량의 인식 범위와 장애물 위치를 확인할 수 있게 했습니다. 기존 분석 도구보다 가볍게 실행할 수 있어 필드 테스트와 로그 분석 시간을 줄였습니다.

## 게임 프로그래밍으로 이어진 경험

이 프로젝트에서 배운 핵심은 단순한 기능 구현보다 **실패를 관찰하고 복구할 수 있는 구조**였습니다.

- 실시간 상태와 전이 조건을 명확하게 모델링하기
- 비정상 입력과 예외 상황을 기본 흐름 안에서 처리하기
- 로그와 시각화 도구로 문제를 재현하기
- 여러 프로세스가 함께 동작할 때 데이터와 상태의 정합성을 지키기

이 경험을 게임플레이 FSM, authoritative 서버, 런타임 디버그 도구 설계에 활용하고 있습니다.

[Original Notion Page](https://app.notion.com/p/Portfolio-2e0b4a6f7577805fbfdece7398185fa4)
