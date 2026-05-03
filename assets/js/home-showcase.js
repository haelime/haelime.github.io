import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  const canvas = root.querySelector("canvas");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = new THREE.Vector2(0.5, 0.5);
  const targetPointer = new THREE.Vector2(0.5, 0.5);

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: pointer },
      uMotion: { value: reducedMotion ? 0.28 : 1.0 },
    };

    const material = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms,
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
        uniform float uMotion;

        mat2 rot(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        float hash(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
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
          for (int i = 0; i < 6; i++) {
            v += a * noise(p);
            p = rot(0.54) * p * 2.03 + vec2(17.7, 3.9);
            a *= 0.52;
          }
          return v;
        }

        float stars(vec2 p, float t) {
          vec2 cell = floor(p);
          vec2 local = fract(p) - 0.5;
          float h = hash(cell);
          vec2 pos = vec2(hash(cell + 4.7), hash(cell + 9.2)) - 0.5;
          float d = length(local - pos);
          float glint = 0.55 + 0.45 * sin(t * (1.2 + h * 4.0) + h * 30.0);
          return smoothstep(0.045, 0.0, d) * step(0.865, h) * glint;
        }

        void main() {
          vec2 frag = gl_FragCoord.xy;
          vec2 uv = (frag * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
          vec2 mouse = (uPointer * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
          float t = uTime * uMotion;

          vec2 center = vec2(0.0, 0.03) + mouse * 0.045;
          vec2 p = uv - center;
          p.x *= 1.02;

          float r = length(p);
          float a = atan(p.y, p.x);
          float gravity = 0.055 / max(r * r, 0.012);
          float bend = gravity * (0.45 + 0.55 * smoothstep(1.15, 0.12, r));

          vec2 lensed = uv;
          lensed += normalize(p + 0.0001) * bend;
          lensed += vec2(cos(a * 2.0), sin(a * 3.0)) * bend * 0.08;

          vec3 color = vec3(0.002, 0.003, 0.007);

          float spaceNoise = fbm(lensed * 1.4 + vec2(t * 0.015, -t * 0.02));
          color += mix(vec3(0.006, 0.011, 0.024), vec3(0.025, 0.018, 0.044), spaceNoise) * 0.9;

          vec2 starUv = lensed * 22.0 + vec2(t * 0.015, -t * 0.01);
          float starField = stars(starUv, t) + stars(starUv * 0.52 + 11.0, t) * 0.65;
          color += vec3(0.72, 0.84, 1.0) * starField * smoothstep(0.16, 0.42, r);

          float diskY = p.y + sin(p.x * 1.7 + t * 0.36) * 0.035;
          float diskShape = exp(-diskY * diskY / 0.016) * smoothstep(1.42, 0.18, abs(p.x));
          float diskHole = smoothstep(0.19, 0.42, r);
          float innerFade = smoothstep(0.09, 0.22, abs(p.x));
          float streaks = fbm(vec2(abs(p.x) * 4.0 - t * 0.82, a * 2.0 + t * 0.2));
          float orbitBands = 0.55 + 0.45 * sin(abs(p.x) * 18.0 - t * 4.0 + streaks * 5.0);
          float disk = diskShape * diskHole * innerFade * (0.58 + streaks * 0.55) * (0.72 + orbitBands * 0.45);

          float backDiskY = p.y * 0.62 - 0.08 + sin(p.x * 1.3 - t * 0.22) * 0.025;
          float backDisk = exp(-backDiskY * backDiskY / 0.02) * smoothstep(1.05, 0.2, abs(p.x)) * smoothstep(0.16, 0.34, r) * 0.34;

          vec3 hot = vec3(1.0, 0.56, 0.16);
          vec3 whiteHot = vec3(1.0, 0.92, 0.68);
          vec3 magenta = vec3(0.75, 0.18, 1.0);
          vec3 diskColor = mix(hot, whiteHot, smoothstep(0.45, 1.4, disk + streaks));
          diskColor = mix(diskColor, magenta, smoothstep(0.7, 1.35, abs(p.x)) * 0.28);

          color += diskColor * disk * 1.35;
          color += vec3(0.45, 0.2, 1.0) * backDisk;

          float photonRing = exp(-pow((r - 0.235) / 0.018, 2.0));
          float outerRing = exp(-pow((r - 0.34) / 0.045, 2.0)) * 0.32;
          color += vec3(1.0, 0.78, 0.38) * photonRing * (0.82 + streaks * 0.4);
          color += vec3(0.38, 0.68, 1.0) * outerRing;

          float eventHorizon = smoothstep(0.245, 0.14, r);
          color = mix(color, vec3(0.0), eventHorizon);

          float shadow = smoothstep(0.58, 0.16, r);
          color *= 1.0 - shadow * 0.28;

          float glow = exp(-r * 1.75) * (1.0 - eventHorizon);
          color += vec3(0.2, 0.34, 0.8) * glow * 0.18;

          float grain = hash(frag + floor(t * 36.0)) - 0.5;
          color += grain * 0.012;

          float vignette = smoothstep(1.5, 0.18, length(uv));
          color *= vignette;
          color = 1.0 - exp(-color * 1.18);
          color = pow(color, vec3(0.9));

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
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

    const animate = (now) => {
      pointer.lerp(targetPointer, reducedMotion ? 0.03 : 0.07);
      uniforms.uTime.value = now * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("Home showcase failed to initialize.", error);
  }
}
