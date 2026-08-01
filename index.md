---
layout: page
permalink: /
title: Home
description: ""
---

<link rel="stylesheet" href="{{ '/assets/css/project-gallery.css' | relative_url }}">

## Profile
{: .home-section-title}

<div class="profile-intro">
  <img class="profile-intro__photo" src="/assets/img/IMG_8923.jpg" alt="Hae Eem profile">
  <div class="profile-intro__body">
    <h3>Hae Eem</h3>
    <p>게임플레이와 그 아래의 실시간 시스템을 구현하는 <strong>C++ / C# 게임 프로그래머</strong>입니다.</p>
    <div class="profile-intro__links">
      <a href="https://github.com/haelime">GitHub</a>
      <a href="mailto:loreminder@gmail.com">Email</a>
    </div>
  </div>
</div>

## Work Experience
{: .home-section-title}

### 웨어러블에이아이

**시스템 소프트웨어 엔지니어 / 주임연구원** · 2024.11–2025.04

인천국제공항 자율주행 셔틀 프로젝트에서 UDP 기반 LiDAR 데이터 처리, C++/ROS2 기반 FSM 제어 로직, heartbeat 기반 진단 및 Fail-Safe 시스템을 개발했습니다.

{% include project-gallery.html group="general" %}

## Education
{: .home-section-title}

### École 42

**과정 수료** · 2022.11–2024.11

2년간 2,633시간 이상 오프라인으로 참여해 시스템 레벨 프로그래밍 중심의 자기주도적 동료 학습 프로젝트를 수행했습니다.

- C/C++ 기반 로우 레벨 프로그래밍, 운영체제, 시스템 아키텍처 역량 확보
- 성능 최적화, UNIX 시스템 관리, 네트워크 인프라 구축 기술 습득
- 110회 이상의 Peer Review를 주도하며 코드 분석, 기술 피드백, 코드 리뷰 역량 입증

## Skills

- Languages: `C++` `C#` `Python` `GLSL` `Shell`
- Game: `Unity` `Godot` `Steamworks` `Multiplayer`
- Graphics: `Vulkan` `Compute Shader` `Ray Tracing` `3D Graphics`
- Systems & Tools: `ROS2` `Linux` `CMake` `Git` `GDB` `Valgrind`

## Projects

### Games

{% include project-gallery.html group="games" %}

### Graphics

{% include project-gallery.html group="graphics" %}
