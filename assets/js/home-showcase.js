import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

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

        // CC0: Trailing the Twinkling Tunnelwisp
        float gyroid(vec4 p, float scale) {
          p *= scale;
          return abs(dot(sin(p), cos(p.zxwy)) - 1.0) / scale;
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          float i = 0.0;
          float d = 0.0;
          float z = 0.0;
          float s = 0.0;
          float t = iTime;
          vec4 color = vec4(0.0);
          vec4 q = vec4(0.0);
          vec4 p = vec4(0.0);
          vec4 U = vec4(2.0, 1.0, 0.0, 3.0);
          vec2 resolution = iResolution.xy;

          for (; ++i < 79.0; z += d + 5e-4) {
            q = vec4(normalize(vec3(fragCoord - 0.5 * resolution, resolution.y)) * z, 0.2);
            q.z += t / 30.0;

            s = q.y + 0.1;
            q.y = abs(s);
            p = q;
            p.y -= 0.11;
            p.xy *= mat2(cos(11.0 * U.zywz - 2.0 * p.z));
            p.y -= 0.2;

            d = abs(gyroid(p, 8.0) - gyroid(p, 24.0)) / 4.0;
            p = 1.0 + cos(0.7 * U + 5.0 * q.z);
            color += (s > 0.0 ? 1.0 : 0.1) * p.w * p / max(s > 0.0 ? d : d * d * d, 5e-4);
          }

          color += (1.4 + sin(t) * sin(1.7 * t) * sin(2.3 * t)) * 1e3 * U / length(q.xy);
          fragColor = tanh(color / 1e5);
        }

        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

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
    resize();

    const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
    const round = (value, precision = 3) => Number(value.toFixed(precision));
    const adjust = (value, fromMin, fromMax, toMin, toMax) => {
      const progress = (value - fromMin) / (fromMax - fromMin);
      return toMin + progress * (toMax - toMin);
    };

    cards.forEach((card) => {
      const image = card.dataset.image || card.querySelector(".card__front img")?.getAttribute("src") || "";
      const label = card.querySelector(".card__label");
      const seedX = Math.random();
      const seedY = Math.random();

      if (label) {
        const title = label.querySelector(".card__label-title");
        const subtitle = label.querySelector(".card__label-subtitle");
        if (title && card.dataset.title) title.textContent = card.dataset.title;
        if (subtitle && card.dataset.subtitle) subtitle.textContent = card.dataset.subtitle;
      }

      card.style.setProperty("--seedx", seedX.toFixed(6));
      card.style.setProperty("--seedy", seedY.toFixed(6));
      card.style.setProperty("--cosmosbg", `${Math.floor(seedX * 734)}px ${Math.floor(seedY * 1280)}px`);
      card.style.setProperty("--mask", "none");

      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();
        const absoluteX = event.clientX - rect.left;
        const absoluteY = event.clientY - rect.top;
        const percentX = clamp(round((100 / rect.width) * absoluteX));
        const percentY = clamp(round((100 / rect.height) * absoluteY));
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
      });

      card.addEventListener("pointerleave", () => {
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

    const animate = (now) => {
      uniforms.iTime.value = now * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    root.classList.add("is-unavailable");
    console.warn("Home showcase failed to initialize.", error);
  }
}
