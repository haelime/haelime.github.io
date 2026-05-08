import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { installCardHolo } from "./card-holo.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
  }

  const canvas = root.querySelector("canvas");
  const cards = Array.from(root.querySelectorAll("[data-card]"));

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x02030a, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 240);
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    const pointerWorld = new THREE.Vector3(0, 0, 0);
    const particlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const orbitTarget = new THREE.Vector3(0, 0, 0);
    const orbit = {
      yaw: 0,
      pitch: 0.22,
      radius: 42,
      dragging: false,
      x: 0,
      y: 0,
    };
    const particleLimit = 70000;
    const emitRate = 620;
    const positions = new Float32Array(particleLimit * 3);
    const colors = new Float32Array(particleLimit * 3);
    const velocities = new Float32Array(particleLimit * 3);
    const ages = new Float32Array(particleLimit);
    const lifetimes = new Float32Array(particleLimit);
    const geometry = new THREE.BufferGeometry();
    const color = new THREE.Color();
    const pointer = {
      x: 0,
      y: 0,
      z: 0,
      active: false,
      down: false,
    };
    let width = 1;
    let height = 1;
    let particleCursor = 0;
    let activeParticles = 0;

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, 0);

    const particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.18,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.68,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    );
    scene.add(particles);

    const colorForTime = (seconds) => {
      color.setRGB(
        (Math.sin(seconds) + 1) * 0.5,
        (Math.sin(seconds + (4 * Math.PI) / 3) + 1) * 0.5,
        1,
      );
      return color;
    };

    const syncCamera = () => {
      const radiusXZ = Math.cos(orbit.pitch) * orbit.radius;
      camera.position.set(
        Math.sin(orbit.yaw) * radiusXZ,
        Math.sin(orbit.pitch) * orbit.radius,
        Math.cos(orbit.yaw) * radiusXZ,
      );
      camera.lookAt(orbitTarget);
    };

    const updatePointerWorld = (clientX, clientY) => {
      const rect = root.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
      raycaster.setFromCamera(pointerNdc, camera);
      raycaster.ray.intersectPlane(particlePlane, pointerWorld);
      pointer.x = pointerWorld.x;
      pointer.y = pointerWorld.y;
      pointer.z = pointerWorld.z;
      pointer.active = true;
    };

    const emitParticle = (x, y, z, seconds) => {
      const index = particleCursor;
      const angle = Math.random() * Math.PI * 2;
      const radial = Math.sqrt(Math.random()) * 3.8;
      const zSpread = (Math.random() - 0.5) * 3.8;
      const speed = 4 + Math.random() * 7.5;
      const particleColor = colorForTime(seconds);

      positions[index * 3] = x + Math.cos(angle) * radial;
      positions[index * 3 + 1] = y + Math.sin(angle) * radial;
      positions[index * 3 + 2] = z + zSpread;
      colors[index * 3] = particleColor.r;
      colors[index * 3 + 1] = particleColor.g;
      colors[index * 3 + 2] = particleColor.b;
      velocities[index * 3] = Math.cos(angle) * speed;
      velocities[index * 3 + 1] = Math.sin(angle) * speed;
      velocities[index * 3 + 2] = (Math.random() - 0.5) * speed;
      ages[index] = 0;
      lifetimes[index] = 2.2 + Math.random() * 2.8;

      particleCursor = (particleCursor + 1) % particleLimit;
      activeParticles = Math.min(activeParticles + 1, particleLimit);
    };

    const emitBurst = (count, seconds) => {
      for (let i = 0; i < count; i += 1) {
        emitParticle(pointer.x, pointer.y, pointer.z, seconds);
      }
      geometry.setDrawRange(0, activeParticles);
    };

    const updateParticles = (deltaSeconds) => {
      const strength = pointer.down ? 270 : 74;
      const drag = Math.max(0, 1 - deltaSeconds * 1.8);

      for (let i = 0; i < activeParticles; i += 1) {
        ages[i] += deltaSeconds;

        if (ages[i] > lifetimes[i]) {
          colors[i * 3] = 0;
          colors[i * 3 + 1] = 0;
          colors[i * 3 + 2] = 0;
          continue;
        }

        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];
        const dx = pointer.x - px;
        const dy = pointer.y - py;
        const dz = pointer.z - pz;
        const distanceSq = Math.max(dx * dx + dy * dy + dz * dz, 1.6);
        const distance = Math.sqrt(distanceSq);
        const acceleration = (strength / distanceSq) * deltaSeconds;
        const life = Math.max(0, 1 - ages[i] / lifetimes[i]);

        velocities[i * 3] = (velocities[i * 3] + (dx / distance) * acceleration) * drag;
        velocities[i * 3 + 1] = (velocities[i * 3 + 1] + (dy / distance) * acceleration) * drag;
        velocities[i * 3 + 2] = (velocities[i * 3 + 2] + (dz / distance) * acceleration) * drag;
        positions[i * 3] += velocities[i * 3] * deltaSeconds;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaSeconds;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaSeconds;

        colors[i * 3] *= 0.985 + life * 0.015;
        colors[i * 3 + 1] *= 0.985 + life * 0.015;
        colors[i * 3 + 2] *= 0.985 + life * 0.015;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width || window.innerWidth));
      height = Math.max(1, Math.round(rect.height || window.innerHeight));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      syncCamera();
    };

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener("contextmenu", (event) => {
      if (root.contains(event.target)) event.preventDefault();
    });
    window.addEventListener("pointermove", (event) => {
      updatePointerWorld(event.clientX, event.clientY);

      if (orbit.dragging) {
        const dx = event.clientX - orbit.x;
        const dy = event.clientY - orbit.y;
        orbit.x = event.clientX;
        orbit.y = event.clientY;
        orbit.yaw -= dx * 0.006;
        orbit.pitch = Math.max(-1.18, Math.min(1.18, orbit.pitch - dy * 0.006));
        syncCamera();
      }
    });
    window.addEventListener("pointerdown", (event) => {
      updatePointerWorld(event.clientX, event.clientY);
      pointer.down = event.button === 0;

      if (event.button === 2) {
        orbit.dragging = true;
        orbit.x = event.clientX;
        orbit.y = event.clientY;
        event.preventDefault();
      }
    });
    window.addEventListener("pointerup", () => {
      pointer.down = false;
      orbit.dragging = false;
    });
    window.addEventListener("blur", () => {
      pointer.down = false;
      orbit.dragging = false;
    });
    resize();

    const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
    const round = (value, precision = 3) => Number(value.toFixed(precision));
    const adjust = (value, fromMin, fromMax, toMin, toMax) => {
      const progress = (value - fromMin) / (fromMax - fromMin);
      return toMin + progress * (toMax - toMin);
    };

    cards.forEach((card, index) => {
      const image = card.dataset.image || "";
      const slot = card.closest(".card-slot");
      const label = slot?.querySelector(".card-caption");
      const seedX = Math.random();
      const seedY = Math.random();
      let pendingInteraction = null;
      let interactionFrame = 0;

      if (label) {
        const title = label.querySelector(".card__label-title");
        const subtitle = label.querySelector(".card__label-subtitle");
        if (title && card.dataset.title) title.textContent = card.dataset.title;
        if (subtitle && card.dataset.subtitle) subtitle.textContent = card.dataset.subtitle;
      }

      card.style.setProperty("--seedx", seedX.toFixed(6));
      card.style.setProperty("--seedy", seedY.toFixed(6));
      if (image) {
        card.style.setProperty("--card-image", `url("${image}")`);
      }
      installCardHolo(card, index);

      const logHolo = (eventName) => {
        console.log("[card-holo]", eventName, {
          index,
          effect: card.dataset.holoEffect,
          rarity: card.dataset.rarity,
          subtypes: card.dataset.subtypes,
          supertype: card.dataset.supertype,
          trainerGallery: card.dataset.trainerGallery,
        });
      };
      logHolo("init");

      const applyInteraction = ({ percentX, percentY }) => {
        const centerX = percentX - 50;
        const centerY = percentY - 50;
        const fromCenter = clamp(Math.sqrt(centerY * centerY + centerX * centerX) / 50, 0, 1);

        card.classList.add("interacting");
        card.style.setProperty("--pointer-x", `${percentX}%`);
        card.style.setProperty("--pointer-y", `${percentY}%`);
        card.style.setProperty("--pointer-from-center", fromCenter.toFixed(4));
        card.style.setProperty("--pointer-from-left", `${percentX / 100}`);
        card.style.setProperty("--pointer-from-top", `${percentY / 100}`);
        card.style.setProperty("--background-x", `${adjust(percentX, 0, 100, 37, 63).toFixed(3)}%`);
        card.style.setProperty("--background-y", `${adjust(percentY, 0, 100, 33, 67).toFixed(3)}%`);
        card.style.setProperty("--rotate-x", `${round(-(centerX / 3.5))}deg`);
        card.style.setProperty("--rotate-y", `${round(centerY / 3.5)}deg`);
        card.style.setProperty("--card-opacity", "1");
      };

      const scheduleInteraction = (event) => {
        if (event.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();
        const absoluteX = event.clientX - rect.left;
        const absoluteY = event.clientY - rect.top;
        pendingInteraction = {
          percentX: clamp(round((100 / rect.width) * absoluteX)),
          percentY: clamp(round((100 / rect.height) * absoluteY)),
        };

        if (interactionFrame) return;
        interactionFrame = requestAnimationFrame(() => {
          if (pendingInteraction) {
            applyInteraction(pendingInteraction);
            pendingInteraction = null;
          }
          interactionFrame = 0;
        });
      };

      card.addEventListener("pointerenter", () => logHolo("pointerenter"));
      card.addEventListener("mouseover", () => logHolo("mouseover"));
      card.addEventListener("pointerenter", scheduleInteraction);
      card.addEventListener("pointermove", scheduleInteraction);

      card.addEventListener("pointerleave", () => {
        if (interactionFrame) {
          cancelAnimationFrame(interactionFrame);
          interactionFrame = 0;
        }
        pendingInteraction = null;
        card.classList.remove("interacting");
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "50%");
        card.style.setProperty("--pointer-from-center", "0");
        card.style.setProperty("--pointer-from-left", "0");
        card.style.setProperty("--pointer-from-top", "0");
        card.style.setProperty("--background-x", "50%");
        card.style.setProperty("--background-y", "50%");
        card.style.setProperty("--rotate-x", "0deg");
        card.style.setProperty("--rotate-y", "0deg");
        card.style.setProperty("--card-opacity", "0");
      });
    });

    let lastTime = performance.now();

    const animate = (now) => {
      const deltaSeconds = Math.min(0.05, (now - lastTime) * 0.001 || 0.016);
      const seconds = now * 0.001;
      lastTime = now;

      if (!pointer.active) {
        pointer.x = Math.sin(seconds * 0.45) * 10;
        pointer.y = Math.cos(seconds * 0.31) * 5;
        pointer.z = 0;
      }

      emitBurst(pointer.active ? Math.round(emitRate * deltaSeconds) : 24, seconds);
      updateParticles(deltaSeconds);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("Home showcase failed to initialize.", error);
  }
}
