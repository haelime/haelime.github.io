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

        mat2 rot(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        float sceneMap(vec3 p) {
          float cell = 4.4;
          vec3 rp = mod(p + cell * 0.5, cell) - cell * 0.5;
          rp.xy *= rot(iTime * 0.42);
          rp.xz *= rot(iTime * 0.31);
          rp.yz *= rot(iTime * 0.27);
          return sdBox(rp, vec3(0.86));
        }

        vec3 getNormal(vec3 p) {
          vec2 e = vec2(0.004, 0.0);
          return normalize(vec3(
            sceneMap(p + e.xyy) - sceneMap(p - e.xyy),
            sceneMap(p + e.yxy) - sceneMap(p - e.yxy),
            sceneMap(p + e.yyx) - sceneMap(p - e.yyx)
          ));
        }

        void mainImage(out vec4 o, vec2 fragCoord) {
          vec2 uv = (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
          vec3 ro = vec3(0.0, 0.0, -22.0);
          vec3 target = vec3(0.0, 0.0, 0.0);

          vec3 forward = normalize(target - ro);
          vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(right, forward);
          vec3 rd = normalize(forward + uv.x * right + uv.y * up);

          vec3 color = vec3(1.0);
          float total = 0.0;

          for (int i = 0; i < 96; i++) {
            vec3 p = ro + rd * total;
            float d = sceneMap(p);

            if (d < 0.002) {
              vec3 n = getNormal(p);
              float light = 0.18 + 0.82 * max(dot(n, normalize(vec3(-0.4, 0.7, -0.6))), 0.0);
              color = vec3(0.0) + vec3(0.16) * light;
              break;
            }

            total += max(d * 0.72, 0.015);
            if (total > 54.0) break;
          }

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
