import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  const canvas = root.querySelector("canvas");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      uMotion: { value: prefersReducedMotion ? 0.18 : 1.0 },
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

        const float PI = 3.14159265359;

        mat2 rotate2d(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float valueNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash12(i);
          float b = hash12(i + vec2(1.0, 0.0));
          float c = hash12(i + vec2(0.0, 1.0));
          float d = hash12(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float sum = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 5; i++) {
            sum += amp * valueNoise(p);
            p = rotate2d(0.72) * p * 2.03 + 19.17;
            amp *= 0.52;
          }
          return sum;
        }

        vec3 blackbodyRamp(float x) {
          x = clamp(x, 0.0, 1.0);
          vec3 cool = vec3(0.22, 0.46, 1.0);
          vec3 warm = vec3(1.0, 0.42, 0.08);
          vec3 whiteHot = vec3(1.0, 0.92, 0.66);
          return mix(mix(cool, warm, smoothstep(0.05, 0.62, x)), whiteHot, smoothstep(0.52, 1.0, x));
        }

        float starLayer(vec2 uv, float scale, float seed, float t) {
          vec2 p = uv * scale + seed;
          vec2 cell = floor(p);
          vec2 local = fract(p) - 0.5;
          float h = hash12(cell + seed);
          vec2 starPos = vec2(hash12(cell + 7.1), hash12(cell + 13.9)) - 0.5;
          float d = length(local - starPos);
          float sparkle = 0.65 + 0.35 * sin(t * (1.2 + h * 4.0) + h * 40.0);
          return smoothstep(0.038, 0.0, d) * step(0.88, h) * sparkle;
        }

        vec3 backgroundStars(vec2 uv, vec2 lensUv, float t) {
          float s1 = starLayer(lensUv, 18.0, 4.0, t);
          float s2 = starLayer(lensUv + uv * 0.24, 34.0, 17.0, t) * 0.62;
          float dust = fbm(lensUv * 1.25 + vec2(t * 0.01, -t * 0.012));
          vec3 space = mix(vec3(0.004, 0.006, 0.014), vec3(0.018, 0.014, 0.035), dust);
          return space + vec3(0.72, 0.82, 1.0) * (s1 + s2);
        }

        float diskStripe(vec2 p, float r, float a, float t) {
          float flow = a * 2.2 + log(max(r, 0.035)) * 4.0 - t * 1.7;
          float turbulence = fbm(vec2(flow * 0.55, r * 4.5 - t * 0.15));
          float bands = 0.62 + 0.38 * sin(flow * 3.0 + turbulence * 5.8);
          return bands * (0.58 + 0.55 * turbulence);
        }

        vec3 accretionDisk(vec2 p, float r, float a, float t, float spin) {
          float tilt = 0.34;
          float y = p.y + sin(p.x * 0.9 + t * 0.18) * 0.018;
          float x = p.x;
          float diskWidth = 0.026 + 0.018 * smoothstep(0.0, 1.0, abs(x));
          float mainDisk = exp(-(y * y) / diskWidth);
          float radial = smoothstep(0.19, 0.48, abs(x)) * smoothstep(1.55, 0.18, abs(x));
          float nearSide = smoothstep(-0.82, 0.38, x);
          float farSide = exp(-pow((p.y * tilt - 0.105) / 0.052, 2.0)) * smoothstep(0.22, 1.25, r) * 0.42;
          float streaks = diskStripe(p, r, a, t);
          float doppler = 0.62 + 0.55 * smoothstep(-1.0, 1.0, -x * spin);
          float intensity = (mainDisk * radial * nearSide + farSide) * streaks * doppler;
          vec3 color = blackbodyRamp(streaks * doppler);
          color = mix(color, vec3(0.34, 0.22, 1.0), smoothstep(0.92, 1.45, abs(x)) * 0.22);
          return color * intensity * 1.7;
        }

        vec3 relativisticJet(vec2 p, float r, float t) {
          float core = exp(-p.x * p.x / 0.012);
          float upper = smoothstep(0.18, 0.46, p.y) * exp(-abs(p.x) * 5.4) * smoothstep(1.42, 0.18, p.y);
          float lower = smoothstep(0.18, 0.46, -p.y) * exp(-abs(p.x) * 5.4) * smoothstep(1.42, 0.18, -p.y);
          float pulse = fbm(vec2(p.y * 2.6 - t * 0.45, p.x * 8.0));
          float beam = core * (upper + lower) * (0.42 + pulse * 0.76);
          float shell = exp(-pow(abs(p.x) - 0.08 - abs(p.y) * 0.035, 2.0) / 0.004) * (upper + lower) * 0.42;
          return (vec3(0.28, 0.66, 1.0) * beam + vec3(0.86, 0.38, 1.0) * shell) * smoothstep(1.7, 0.12, r);
        }

        void main() {
          vec2 frag = gl_FragCoord.xy;
          vec2 uv = (frag * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
          vec2 mouse = (uPointer * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
          float t = uTime * uMotion;

          vec2 center = vec2(0.0, 0.01) + mouse * 0.04;
          vec2 p = uv - center;
          p = rotate2d(0.04 * sin(t * 0.23)) * p;

          float spin = 0.96;
          float r = length(p);
          float a = atan(p.y, p.x);

          float gravity = 0.075 / max(r * r + 0.018, 0.018);
          float swirl = gravity * spin * smoothstep(1.25, 0.08, r);
          vec2 bent = uv + normalize(p + 0.0001) * gravity * 0.42;
          bent += vec2(cos(a + swirl), sin(a - swirl)) * gravity * 0.055;
          bent = rotate2d(swirl * 0.18) * bent;

          vec3 color = backgroundStars(uv, bent, t);

          vec2 diskP = p;
          diskP.y *= 0.58;
          diskP = rotate2d(-0.02) * diskP;
          color += accretionDisk(diskP, r, a, t, spin);

          float photon = exp(-pow((r - 0.255) / 0.018, 2.0));
          float secondary = exp(-pow((r - 0.365) / 0.052, 2.0)) * 0.34;
          float ringHotNoise = 0.72 + 0.32 * fbm(vec2(a * 2.5 + t * 0.28, r * 12.0));
          color += vec3(1.0, 0.74, 0.28) * photon * ringHotNoise * 1.25;
          color += vec3(0.22, 0.54, 1.0) * secondary;

          color += relativisticJet(p, r, t) * 0.9;

          float shadow = smoothstep(0.295, 0.155, r);
          color = mix(color, vec3(0.0), shadow);

          float rim = exp(-pow((r - 0.185) / 0.012, 2.0));
          color += vec3(0.02, 0.05, 0.12) * rim * (1.0 - shadow);

          float lensGlow = exp(-r * 1.6) * (1.0 - shadow);
          color += vec3(0.08, 0.14, 0.42) * lensGlow * 0.34;

          float grain = hash12(frag + floor(t * 38.0)) - 0.5;
          color += grain * 0.01;

          float vignette = smoothstep(1.56, 0.16, length(uv));
          color *= vignette;

          color = 1.0 - exp(-color * 1.08);
          color = pow(color, vec3(0.88));

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

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
      pointer.lerp(targetPointer, prefersReducedMotion ? 0.025 : 0.07);
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
