import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-about-showcase]");

if (root) {
  const canvas = root.querySelector("canvas");
  const frameLabel = root.querySelector("[data-gfx-frame]");
  const fpsLabel = root.querySelector("[data-gfx-fps]");
  const buttons = Array.from(root.querySelectorAll("[data-gfx-mode]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0.35, 1.0, 5.4);

    const rig = new THREE.Group();
    scene.add(rig);

    const pbrMaterial = new THREE.MeshStandardMaterial({
      color: 0x7be3c6,
      metalness: 0.62,
      roughness: 0.28,
      emissive: 0x06110f,
    });

    const normalMaterial = new THREE.MeshNormalMaterial();
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd06b,
      wireframe: true,
    });

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 2), pbrMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.035, 18, 120), pbrMaterial);
    const tiltedRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.025, 16, 120), pbrMaterial);
    const inner = new THREE.Mesh(new THREE.TorusKnotGeometry(0.5, 0.08, 120, 14), pbrMaterial);

    ring.rotation.x = Math.PI / 2.35;
    tiltedRing.rotation.set(Math.PI / 2.1, 0.1, Math.PI / 4);
    inner.rotation.set(0.4, 0.2, 0);

    rig.add(core, ring, tiltedRing, inner);

    const pointGeometry = new THREE.BufferGeometry();
    const pointCount = 90;
    const pointPositions = new Float32Array(pointCount * 3);

    for (let i = 0; i < pointCount; i += 1) {
      const radius = 2.1 + Math.random() * 1.45;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.3;
      pointPositions[i * 3] = Math.cos(theta) * radius;
      pointPositions[i * 3 + 1] = y;
      pointPositions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
    const points = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({
        color: 0x9fb6d8,
        size: 0.025,
        transparent: true,
        opacity: 0.58,
      }),
    );
    rig.add(points);

    scene.add(new THREE.AmbientLight(0x8fa7bd, 0.42));

    const keyLight = new THREE.DirectionalLight(0xdffdf2, 2.4);
    keyLight.position.set(3.4, 4.2, 4.6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffd27c, 1.35);
    rimLight.position.set(-4.6, 1.2, -3.4);
    scene.add(rimLight);

    const meshes = [core, ring, tiltedRing, inner];

    const setMode = (mode) => {
      const material = mode === "normal" ? normalMaterial : mode === "wire" ? wireMaterial : pbrMaterial;
      meshes.forEach((mesh) => {
        mesh.material = material;
      });
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.gfxMode === mode);
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.gfxMode));
    });

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resize();

    let lastTime = performance.now();
    let smoothedMs = 16.7;
    let frame = 0;

    const animate = (now) => {
      const delta = Math.min(64, now - lastTime);
      lastTime = now;
      smoothedMs = smoothedMs * 0.9 + delta * 0.1;

      const spin = reducedMotion ? 0.00006 : 0.00022;
      rig.rotation.y += delta * spin;
      core.rotation.x += delta * spin * 0.72;
      inner.rotation.y -= delta * spin * 1.8;
      points.rotation.y -= delta * spin * 0.35;

      renderer.render(scene, camera);

      frame += 1;
      if (frame % 12 === 0) {
        frameLabel.textContent = `${smoothedMs.toFixed(1)} ms`;
        fpsLabel.textContent = `${Math.round(1000 / smoothedMs)} fps`;
      }

      requestAnimationFrame(animate);
    };

    setMode("pbr");
    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("About showcase failed to initialize.", error);
  }
}
