import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
  }

  const canvas = root.querySelector("canvas");
  const cards = Array.from(root.querySelectorAll("[data-portfolio-card]"));
  const holoEffects = ["holo-regular", "holo-cosmos", "holo-radiant", "holo-rainbow"];

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

        // Original by localthunk (https://www.playbalatro.com)

        // Configuration (modify these values to change the effect)
        #define SPIN_ROTATION -2.0
        #define SPIN_SPEED 7.0
        #define OFFSET vec2(0.0)
        #define COLOUR_1 vec4(0.10, 0.88, 1.00, 1.0)
        #define COLOUR_2 vec4(0.95, 0.18, 0.86, 1.0)
        #define COLOUR_3 vec4(0.05, 0.04, 0.09, 1.0)
        #define CONTRAST 3.5
        #define LIGTHING 0.4
        #define SPIN_AMOUNT 0.25
        #define PIXEL_FILTER 745.0
        #define SPIN_EASE 1.0
        #define PI 3.14159265359
        #define IS_ROTATE false

        vec4 effect(vec2 screenSize, vec2 screen_coords) {
            float pixel_size = length(screenSize.xy) / PIXEL_FILTER;
            vec2 uv = (floor(screen_coords.xy*(1./pixel_size))*pixel_size - 0.5*screenSize.xy)/length(screenSize.xy) - OFFSET;
            float uv_len = length(uv);

            float speed = (SPIN_ROTATION*SPIN_EASE*0.2);
            if(IS_ROTATE){
               speed = iTime * speed;
            }
            speed += 302.2;
            float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE*20.*(1.*SPIN_AMOUNT*uv_len + (1. - 1.*SPIN_AMOUNT));
            vec2 mid = (screenSize.xy/length(screenSize.xy))/2.;
            uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

            uv *= 30.;
            speed = iTime*(SPIN_SPEED);
            vec2 uv2 = vec2(uv.x+uv.y);

            for(int i=0; i < 5; i++) {
                uv2 += sin(max(uv.x, uv.y)) + uv;
                uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
                uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
            }

            float contrast_mod = (0.25*CONTRAST + 0.5*SPIN_AMOUNT + 1.2);
            float paint_res = min(2., max(0.,length(uv)*(0.035)*contrast_mod));
            float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
            float c2p = max(0.,1. - contrast_mod*abs(paint_res));
            float c3p = 1. - min(1., c1p + c2p);
            float light = (LIGTHING - 0.2)*max(c1p*5. - 4., 0.) + LIGTHING*max(c2p*5. - 4., 0.);
            return (0.3/CONTRAST)*COLOUR_1 + (1. - 0.3/CONTRAST)*(COLOUR_1*c1p + COLOUR_2*c2p + vec4(c3p*COLOUR_3.rgb, c3p*COLOUR_1.a)) + light;
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord/iResolution.xy;

            fragColor = effect(iResolution.xy, uv * iResolution.xy);
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

    cards.forEach((card, index) => {
      const effect = holoEffects[Math.floor(Math.random() * holoEffects.length)];
      card.classList.add(effect);
      card.style.setProperty("--holo-seed", String(index + Math.random()));

      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 18;
        const rotateX = (0.5 - y) * 18;
        const fromCenter = Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2);
        const backgroundX = 37 + x * 26;
        const backgroundY = 33 + y * 34;

        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.setProperty("--pointer-x", `${x * 100}%`);
        card.style.setProperty("--pointer-y", `${y * 100}%`);
        card.style.setProperty("--pointer-from-center", fromCenter.toFixed(3));
        card.style.setProperty("--pointer-from-left", x.toFixed(3));
        card.style.setProperty("--pointer-from-top", y.toFixed(3));
        card.style.setProperty("--background-x", `${backgroundX.toFixed(2)}%`);
        card.style.setProperty("--background-y", `${backgroundY.toFixed(2)}%`);
        card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        card.style.setProperty("--holo-opacity", "0.72");
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "50%");
        card.style.setProperty("--pointer-from-center", "0");
        card.style.setProperty("--pointer-from-left", "0.5");
        card.style.setProperty("--pointer-from-top", "0.5");
        card.style.setProperty("--background-x", "50%");
        card.style.setProperty("--background-y", "50%");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--holo-opacity", "0.48");
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
