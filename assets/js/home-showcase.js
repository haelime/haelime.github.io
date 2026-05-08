import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
  }

  const canvas = root.querySelector("canvas");
  const slides = Array.from(root.querySelectorAll("[data-home-slide]"));
  const progressBar = root.querySelector("[data-home-progress]");
  const maxProgress = Math.max(0, slides.length - 1);

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
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      uProgress: { value: 0 },
      uClick: { value: 0 },
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

        uniform vec3 iResolution;
        uniform float iTime;
        uniform float uProgress;
        uniform float uClick;

        #define PALETTE vec3(6.0, 4.0, 2.0)

        mat2 rot(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        float fractal(vec3 p) {
          float i = 0.0;
          float s = 0.0;
          float w = 1.2;
          vec3 b = vec3(0.5, 1.0, 1.5);

          p /= 12.0;
          for (; i++ < 5.0;) {
            p = mod(p + b, 2.0 * b) - b;
            s = 2.0 / dot(p, p);
            p *= s;
            w *= s;
          }
          return length(p) / w * 6.0;
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        float sceneMap(vec3 p, out float fogDensity) {
          float morph = smoothstep(0.0, 3.0, uProgress);
          float cell = mix(4.4, 2.25, morph) + 0.32 * sin(iTime + uProgress * 2.4);
          float twist = 0.08 * p.z + uProgress * 0.32 + uClick * 0.35;
          p.xy *= rot(twist);
          p.xz *= rot(sin(uProgress * 1.7) * 0.18);

          vec3 rp = mod(p + cell * 0.5, cell) - cell * 0.5;
          rp.xy *= rot(p.z * (0.035 + uProgress * 0.018));

          float boxSize = mix(0.62, 1.12, 0.5 + 0.5 * sin(uProgress * 2.1 + iTime * 0.7));
          float cube = sdBox(rp, vec3(boxSize));
          float shell = abs(cube) - mix(0.06, 0.16, morph);

          float cloud = fractal(p + vec3(0.0, 0.0, iTime * 1.2 + uProgress * 4.0));
          fogDensity = 0.045 / (0.035 + cloud * cloud);
          fogDensity += 0.022 / (0.04 + abs(shell));
          fogDensity *= 1.0 + uClick * 1.8;

          return shell;
        }

        vec3 getNormal(vec3 p) {
          float fog;
          vec2 e = vec2(0.004, 0.0);
          return normalize(vec3(
            sceneMap(p + e.xyy, fog) - sceneMap(p - e.xyy, fog),
            sceneMap(p + e.yxy, fog) - sceneMap(p - e.yxy, fog),
            sceneMap(p + e.yyx, fog) - sceneMap(p - e.yyx, fog)
          ));
        }

        void mainImage(out vec4 o, vec2 fragCoord) {
          vec2 uv = (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
          float t = iTime * 0.32;
          float camTravel = uProgress * 7.5 + t * 2.2;
          vec3 ro = vec3(
            sin(uProgress * 0.9) * 2.2,
            0.5 + sin(uProgress * 1.4) * 0.65,
            -12.0 + camTravel
          );
          vec3 target = vec3(
            sin(uProgress * 0.72) * 1.8,
            cos(uProgress * 1.2) * 0.55,
            camTravel + 4.0
          );

          vec3 forward = normalize(target - ro);
          vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(right, forward);
          vec3 rd = normalize(forward + uv.x * right + uv.y * up);

          vec3 color = vec3(0.0);
          float total = 0.0;
          float hitGlow = 0.0;
          bool hit = false;

          for (int i = 0; i < 72; i++) {
            vec3 p = ro + rd * total;
            float fog;
            float d = sceneMap(p, fog);
            float stepSize = clamp(abs(d) * 0.55 + 0.035, 0.035, 0.32);
            float depthFade = exp(-total * 0.025);
            vec3 cloudColor = 1.0 + cos(4.0 * t + 0.6 * p.z + float(i) * 0.4 + PALETTE);

            color += cloudColor * fog * depthFade;
            color += vec3(4.0, 2.0, 1.0) * 0.0015 * depthFade / max(0.15, length(uv - vec2(0.8, 0.1)));

            if (d < 0.018 && !hit) {
              vec3 n = getNormal(p);
              float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
              float edge = 0.18 + fresnel * 1.8 + uClick * 0.8;
              color += vec3(0.005, 0.004, 0.004) + vec3(7.0, 2.0, 1.0) * edge * 0.22;
              hitGlow += edge;
              hit = true;
            }

            total += stepSize;
            if (total > 46.0) break;
          }

          color += hitGlow * vec3(0.8, 0.25, 0.08);
          color = mix(color, color.yzx, smoothstep(2.0, 0.1, length(uv)));
          color *= 1.0 + uClick * 0.35;
          color = color * color / 3.0;
          o.rgb = color / (1.0 + color);
          o.a = 1.0;
        }

        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let targetProgress = 0;
    let progress = 0;
    let clickImpulse = 0;
    let touchStartY = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateSlides = () => {
      slides.forEach((slide, index) => {
        const distance = Math.abs(progress - index);
        const visible = distance < 0.72;
        const opacity = clamp(1 - distance * 1.65, 0, 1);
        slide.classList.toggle("is-active", visible);
        slide.style.setProperty("--slide-opacity", opacity.toFixed(3));
        slide.style.setProperty("--slide-shift", `${((index - progress) * 42).toFixed(2)}px`);
        slide.style.setProperty("--slide-scale", (0.94 + opacity * 0.06).toFixed(3));
      });

      if (progressBar) {
        progressBar.style.transform = `scaleX(${(progress / maxProgress).toFixed(4)})`;
      }
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || window.innerWidth));
      const height = Math.max(1, Math.round(rect.height || window.innerHeight));
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.set(width, height, 1);
    };

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        targetProgress = clamp(targetProgress + event.deltaY * 0.0022, 0, maxProgress);
      },
      { passive: false },
    );
    window.addEventListener("click", () => {
      clickImpulse = 1;
      targetProgress = clamp(targetProgress + 0.38, 0, maxProgress);
    });
    window.addEventListener("touchstart", (event) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    });
    window.addEventListener(
      "touchmove",
      (event) => {
        const y = event.touches[0]?.clientY ?? touchStartY;
        targetProgress = clamp(targetProgress + (touchStartY - y) * 0.008, 0, maxProgress);
        touchStartY = y;
        event.preventDefault();
      },
      { passive: false },
    );
    resize();
    updateSlides();

    const animate = (now) => {
      progress += (targetProgress - progress) * 0.075;
      clickImpulse *= 0.9;
      uniforms.iTime.value = now * 0.001;
      uniforms.uProgress.value = progress;
      uniforms.uClick.value = clickImpulse;
      updateSlides();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("Home showcase failed to initialize.", error);
  }
}
