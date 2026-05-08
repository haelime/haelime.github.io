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
      uScroll: { value: 0 },
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
        uniform float uScroll;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 5; i++) {
            value += noise(p) * amp;
            p = p * 2.03 + 11.7;
            amp *= 0.5;
          }
          return value;
        }

        float caustic(vec2 p, float t) {
          float a = sin(p.x * 8.0 + t) + sin(p.y * 7.0 - t * 1.2);
          float b = sin((p.x + p.y) * 6.0 + t * 0.7);
          return pow(max(0.0, 1.0 - abs(a + b) * 0.42), 5.0);
        }

        void mainImage(out vec4 o, vec2 fragCoord) {
          vec2 uv = (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
          float t = iTime;
          float cameraY = -uScroll * 1.35;
          vec3 ro = vec3(0.0, cameraY, -2.8);
          vec3 rd = normalize(vec3(uv * 0.92, 1.55));

          vec3 waterTop = vec3(0.56, 0.9, 1.0);
          vec3 waterDeep = vec3(0.0, 0.09, 0.18);
          vec3 color = mix(waterTop, waterDeep, clamp(-cameraY / 4.0, 0.0, 1.0));
          float volume = 0.0;
          float shafts = 0.0;
          float sparkle = 0.0;

          for (int i = 0; i < 64; i++) {
            float d = float(i) * 0.13;
            vec3 p = ro + rd * d;

            float surfaceWarp = fbm(p.xz * 0.18 + vec2(t * 0.035, -t * 0.025));
            float density = fbm(p.xz * 0.55 + vec2(t * 0.05, p.y * 0.03));
            density = smoothstep(0.18, 0.92, density) * exp(-max(0.0, -p.y) * 0.08);

            float rayBand = sin((p.x + surfaceWarp * 3.0) * 2.7 + p.y * 0.34 + t * 0.45);
            rayBand += sin((p.z - surfaceWarp * 2.0) * 2.1 - p.y * 0.25 - t * 0.32);
            float lightRay = pow(max(0.0, rayBand * 0.5 + 0.5), 8.0);
            lightRay *= 1.0 - smoothstep(-2.5, 1.2, p.y);

            float c = caustic(p.xz * 0.34 + surfaceWarp, t);
            volume += density * 0.018;
            shafts += lightRay * (0.02 + density * 0.035);
            sparkle += c * 0.008 * (1.0 - smoothstep(-3.6, 1.4, p.y));
          }

          color += vec3(0.18, 0.62, 0.95) * volume;
          color += vec3(0.72, 0.96, 1.0) * shafts;
          color += vec3(0.85, 1.0, 0.92) * sparkle;
          color *= 1.0 - smoothstep(0.7, 2.2, length(uv)) * 0.28;
          o.rgb = color;
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
      uniforms.iTime.value = now * 0.001;
      uniforms.uScroll.value = progress;
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
