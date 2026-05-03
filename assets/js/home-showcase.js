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

        float ribbon(vec2 uv, float offset, float thickness, float warp, float t) {
          vec2 p = uv;
          p.x += fbm(vec2(uv.y * 1.55 + offset, t * 0.24)) * warp;
          p.x += sin(uv.y * 2.2 + offset + t) * 0.08;
          float line = abs(p.x - sin(uv.y * 1.12 + offset + t * 0.42) * 0.34);
          return exp(-line * line / thickness);
        }

        float star(vec2 uv, vec2 id, float t) {
          vec2 cell = floor(uv);
          vec2 local = fract(uv) - 0.5;
          float h = hash(cell + id);
          vec2 pos = vec2(hash(cell + id * 1.7), hash(cell + id * 2.3)) - 0.5;
          float d = length(local - pos);
          float twinkle = 0.55 + 0.45 * sin(t * (1.5 + h * 3.0) + h * 18.0);
          return smoothstep(0.05, 0.0, d) * step(0.82, h) * twinkle;
        }

        void main() {
          vec2 frag = gl_FragCoord.xy;
          vec2 uv = (frag * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
          vec2 screenUv = frag / uResolution.xy;
          vec2 mouse = (uPointer * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
          float t = uTime * uMotion;

          vec2 flow = uv;
          flow += mouse * 0.12;
          flow.x += sin(flow.y * 1.7 + t * 0.18) * 0.12;
          flow.y += cos(flow.x * 1.2 - t * 0.14) * 0.08;

          float nebula = fbm(flow * 1.25 + vec2(t * 0.05, -t * 0.035));
          float silk = fbm(rot(0.7) * flow * 2.4 + vec2(-t * 0.13, t * 0.08));

          float r1 = ribbon(flow + vec2(-0.34, 0.0), 0.4, 0.018, 0.48, t);
          float r2 = ribbon(rot(-0.18) * flow + vec2(0.22, 0.0), 2.1, 0.026, 0.34, -t * 0.8);
          float r3 = ribbon(rot(0.28) * flow + vec2(0.55, 0.0), 4.5, 0.038, 0.24, t * 0.62);
          float veil = r1 * 0.95 + r2 * 0.72 + r3 * 0.42;

          float lens = exp(-length(uv - vec2(0.18, 0.02) - mouse * 0.08) * 1.22);
          float horizon = exp(-abs(uv.y + 0.18 + sin(uv.x * 0.8 + t * 0.2) * 0.08) * 2.6);

          vec3 deep = vec3(0.005, 0.009, 0.018);
          vec3 ink = vec3(0.018, 0.026, 0.045);
          vec3 cyan = vec3(0.08, 0.96, 0.78);
          vec3 violet = vec3(0.62, 0.22, 1.0);
          vec3 rose = vec3(1.0, 0.28, 0.68);
          vec3 gold = vec3(1.0, 0.72, 0.26);

          vec3 color = mix(deep, ink, nebula * 0.8);
          color += cyan * r1 * (0.46 + silk * 0.38);
          color += violet * r2 * 0.48;
          color += rose * r3 * 0.3;
          color += mix(cyan, gold, silk) * lens * 0.24;
          color += cyan * horizon * 0.08;

          vec2 starsUv = uv * 18.0 + vec2(t * 0.06, -t * 0.025);
          float stars = 0.0;
          stars += star(starsUv, vec2(2.0, 7.0), t);
          stars += star(starsUv * 0.58 + 18.0, vec2(11.0, 5.0), t) * 0.72;
          color += vec3(0.78, 0.95, 1.0) * stars * 0.68;

          float grain = hash(frag + floor(t * 48.0)) - 0.5;
          color += grain * 0.018;

          float vignette = smoothstep(1.48, 0.22, length(uv));
          color *= vignette;
          color = 1.0 - exp(-color * 1.28);
          color = pow(color, vec3(0.92));

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
