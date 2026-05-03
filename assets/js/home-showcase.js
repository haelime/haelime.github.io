import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  const canvas = root.querySelector("canvas");
  const fpsLabel = root.querySelector("[data-home-fps]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = new THREE.Vector2(0.5, 0.5);
  const targetPointer = new THREE.Vector2(0.5, 0.5);

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.35, 6.2);

    const shaderUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: pointer },
    };

    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: shaderUniforms,
        vertexShader: `
          void main() {
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec2 uPointer;

          mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
          }

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p = rot(0.52) * p * 2.02 + 0.17;
              a *= 0.52;
            }
            return v;
          }

          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
            vec2 mouse = (uPointer * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
            float t = uTime * 0.18;

            vec2 p = uv;
            p += 0.16 * vec2(sin(uv.y * 2.4 + t * 5.0), cos(uv.x * 2.0 - t * 4.0));
            p += mouse * 0.12;

            float field = fbm(p * 2.2 + vec2(t * 1.6, -t));
            float rings = sin((length(uv - mouse * 0.18) * 9.2) - uTime * 1.55 + field * 5.4);
            float contour = smoothstep(0.32, 0.96, abs(rings));
            float beam = pow(max(0.0, 1.0 - abs(uv.x * 0.42 + uv.y * 0.2 + sin(t) * 0.18)), 3.5);
            float core = exp(-length(uv - vec2(0.42, 0.02)) * 1.6);

            vec3 base = vec3(0.018, 0.028, 0.045);
            vec3 teal = vec3(0.08, 0.86, 0.68);
            vec3 gold = vec3(1.0, 0.56, 0.16);
            vec3 blue = vec3(0.2, 0.44, 1.0);

            vec3 color = base;
            color += teal * field * 0.42;
            color += blue * (1.0 - contour) * 0.18;
            color += gold * beam * 0.36;
            color += mix(teal, gold, field) * core * 0.34;
            color += vec3(0.05, 0.08, 0.11) * smoothstep(0.92, 0.1, length(uv));

            float vignette = smoothstep(1.35, 0.15, length(uv));
            color *= vignette;
            color += pow(max(0.0, 1.0 - length(uv + vec2(0.35, -0.28))), 5.0) * teal * 0.24;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    );
    field.frustumCulled = false;
    scene.add(field);

    const rig = new THREE.Group();
    rig.position.set(1.55, 0.1, 0);
    scene.add(rig);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x83ffe0,
      metalness: 0.72,
      roughness: 0.18,
      emissive: 0x0d302b,
      emissiveIntensity: 1.1,
    });
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc74,
      wireframe: true,
      transparent: true,
      opacity: 0.52,
    });
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x57d7b7,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 3), coreMaterial);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.22, 2), shellMaterial);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.72, 48, 24), haloMaterial);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.018, 12, 160), shellMaterial);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.014, 12, 160), shellMaterial);

    ringA.rotation.x = Math.PI / 2.25;
    ringB.rotation.set(Math.PI / 2.8, 0.2, Math.PI / 3.4);
    rig.add(halo, core, shell, ringA, ringB);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointCount = window.innerWidth < 720 ? 220 : 420;
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);

    for (let i = 0; i < pointCount; i += 1) {
      const radius = 2.1 + Math.random() * 4.2;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1.1;

      const warm = Math.random() > 0.72;
      colors[i * 3] = warm ? 1.0 : 0.36;
      colors[i * 3 + 1] = warm ? 0.72 : 0.92;
      colors[i * 3 + 2] = warm ? 0.36 : 0.82;
    }

    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.74,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(points);

    scene.add(new THREE.AmbientLight(0x7ca6b4, 0.72));

    const key = new THREE.DirectionalLight(0xdffff3, 2.4);
    key.position.set(3.2, 3.8, 4.5);
    scene.add(key);

    const rim = new THREE.PointLight(0xffb85c, 5.4, 12);
    rim.position.set(-2.8, 1.2, 2.4);
    scene.add(rim);

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      shaderUniforms.uResolution.value.set(width, height);

      rig.position.x = width < 800 ? 0.85 : 1.55;
      rig.position.y = width < 800 ? 0.72 : 0.1;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resize();

    root.addEventListener("pointermove", (event) => {
      const rect = root.getBoundingClientRect();
      targetPointer.set(
        (event.clientX - rect.left) / Math.max(1, rect.width),
        1.0 - (event.clientY - rect.top) / Math.max(1, rect.height),
      );
    });

    let lastTime = performance.now();
    let smoothedMs = 16.7;
    let frame = 0;

    const animate = (now) => {
      const delta = Math.min(64, now - lastTime);
      lastTime = now;
      smoothedMs = smoothedMs * 0.9 + delta * 0.1;

      pointer.lerp(targetPointer, reducedMotion ? 0.035 : 0.08);
      shaderUniforms.uTime.value = now * 0.001;

      const spin = reducedMotion ? 0.00005 : 0.00022;
      rig.rotation.y += delta * spin;
      rig.rotation.x = (pointer.y - 0.5) * 0.16;
      rig.rotation.z = (pointer.x - 0.5) * -0.1;
      shell.rotation.y -= delta * spin * 1.5;
      ringA.rotation.z += delta * spin * 1.9;
      ringB.rotation.z -= delta * spin * 1.35;
      halo.scale.setScalar(1.0 + Math.sin(now * 0.0018) * 0.035);
      points.rotation.y -= delta * spin * 0.28;

      camera.position.x = (pointer.x - 0.5) * 0.32;
      camera.position.y = 0.35 + (pointer.y - 0.5) * 0.18;
      camera.lookAt(0.35, 0.12, 0);

      renderer.render(scene, camera);

      frame += 1;
      if (frame % 14 === 0) {
        fpsLabel.textContent = `${Math.round(1000 / smoothedMs)} fps`;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("Home showcase failed to initialize.", error);
  }
}
