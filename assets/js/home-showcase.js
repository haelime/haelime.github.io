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
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
      uCameraHeight: { value: 5.5 },
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
        uniform vec4 iMouse;
        uniform float uCameraHeight;

        #define DRAG_MULT 0.38
        #define WATER_DEPTH 1.0
        #define ITERATIONS_RAYMARCH 12
        #define ITERATIONS_NORMAL 36
        #define NormalizedMouse (iMouse.xy / iResolution.xy)

        vec2 wavedx(vec2 position, vec2 direction, float frequency, float timeshift) {
          float x = dot(direction, position) * frequency + timeshift;
          float wave = exp(sin(x) - 1.0);
          float dx = wave * cos(x);
          return vec2(wave, -dx);
        }

        float getwaves(vec2 position, int iterations) {
          float wavePhaseShift = length(position) * 0.1;
          float iter = 0.0;
          float frequency = 1.0;
          float timeMultiplier = 2.0;
          float weight = 1.0;
          float sumOfValues = 0.0;
          float sumOfWeights = 0.0;
          for (int i = 0; i < ITERATIONS_NORMAL; i++) {
            if (i >= iterations) break;
            vec2 p = vec2(sin(iter), cos(iter));
            vec2 res = wavedx(position, p, frequency, iTime * timeMultiplier + wavePhaseShift);
            position += p * res.y * weight * DRAG_MULT;
            sumOfValues += res.x * weight;
            sumOfWeights += weight;
            weight = mix(weight, 0.0, 0.2);
            frequency *= 1.18;
            timeMultiplier *= 1.07;
            iter += 1232.399963;
          }
          return sumOfValues / sumOfWeights;
        }

        float raymarchwater(vec3 camera, vec3 start, vec3 end, float depth, int iterations) {
          vec3 pos = start;
          vec3 dir = normalize(end - start);
          for (int i = 0; i < 64; i++) {
            float height = getwaves(pos.xz, iterations) * depth - depth;
            if (height + 0.01 > pos.y) {
              return distance(pos, camera);
            }
            pos += dir * (pos.y - height);
          }
          return distance(start, camera);
        }

        vec3 normal(vec2 pos, float e, float depth, int iterations) {
          vec2 ex = vec2(e, 0.0);
          float H = getwaves(pos.xy, iterations) * depth;
          vec3 a = vec3(pos.x, H, pos.y);
          return normalize(cross(
            a - vec3(pos.x - e, getwaves(pos.xy - ex.xy, iterations) * depth, pos.y),
            a - vec3(pos.x, getwaves(pos.xy + ex.yx, iterations) * depth, pos.y + e)
          ));
        }

        mat3 createRotationMatrixAxisAngle(vec3 axis, float angle) {
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          return mat3(
            oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
            oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
            oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
          );
        }

        vec3 getRay(vec2 fragCoord) {
          vec2 uv = ((fragCoord.xy / iResolution.xy) * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
          vec3 proj = normalize(vec3(uv.x, uv.y, 1.5));
          if (iResolution.x < 600.0) {
            return proj;
          }
          return createRotationMatrixAxisAngle(vec3(0.0, -1.0, 0.0), 3.0 * ((NormalizedMouse.x + 0.5) * 2.0 - 1.0))
            * createRotationMatrixAxisAngle(vec3(1.0, 0.0, 0.0), 0.5 + 1.5 * (((NormalizedMouse.y == 0.0 ? 0.27 : NormalizedMouse.y) * 1.0) * 2.0 - 1.0))
            * proj;
        }

        vec3 getCubeCenter() {
          return vec3(0.35, 0.58, 5.15);
        }

        vec3 getOrbitOrigin(vec3 cubeCenter) {
          float angle = iTime * 0.1;
          float radius = 7.0;
          return vec3(
            cubeCenter.x + sin(angle) * radius,
            uCameraHeight,
            cubeCenter.z + cos(angle) * radius
          );
        }

        vec3 getOrbitRay(vec2 fragCoord, vec3 origin, vec3 target) {
          vec2 uv = ((fragCoord.xy / iResolution.xy) * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
          vec3 forward = normalize(target - origin);
          vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(right, forward);
          return normalize(forward * 1.5 + right * uv.x + up * uv.y);
        }

        float intersectPlane(vec3 origin, vec3 direction, vec3 point, vec3 normal) {
          return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        vec3 cubeLocal(vec3 p, vec3 cubeCenter) {
          vec3 q = p - cubeCenter;
          q = createRotationMatrixAxisAngle(normalize(vec3(0.0, 1.0, 0.25)), iTime * 0.28) * q;
          q = createRotationMatrixAxisAngle(normalize(vec3(1.0, 0.0, 0.2)), iTime * 0.18) * q;
          return q;
        }

        float cubeMap(vec3 p, vec3 cubeCenter) {
          return sdBox(cubeLocal(p, cubeCenter), vec3(0.46));
        }

        float raymarchCube(vec3 origin, vec3 ray, vec3 cubeCenter, bool mobile) {
          float total = 0.0;
          for (int i = 0; i < 48; i++) {
            if (mobile && i >= 28) break;
            vec3 p = origin + ray * total;
            float d = cubeMap(p, cubeCenter);
            if (d < 0.003) return total;
            total += max(d * 0.82, 0.012);
            if (total > 12.0) break;
          }
          return -1.0;
        }

        vec3 cubeNormal(vec3 p, vec3 cubeCenter) {
          vec2 e = vec2(0.004, 0.0);
          return normalize(vec3(
            cubeMap(p + e.xyy, cubeCenter) - cubeMap(p - e.xyy, cubeCenter),
            cubeMap(p + e.yxy, cubeCenter) - cubeMap(p - e.yxy, cubeCenter),
            cubeMap(p + e.yyx, cubeCenter) - cubeMap(p - e.yyx, cubeCenter)
          ));
        }

        vec3 renderCube(vec3 origin, vec3 ray, float dist, vec3 cubeCenter) {
          vec3 p = origin + ray * dist;
          vec3 n = cubeNormal(p, cubeCenter);
          vec3 lightDir = normalize(vec3(-0.45, 0.8, -0.35));
          float diffuse = max(dot(n, lightDir), 0.0);
          float rim = pow(1.0 - max(dot(n, -ray), 0.0), 3.0);
          return vec3(0.012) + vec3(0.16) * diffuse + vec3(0.08) * rim;
        }

        vec3 extra_cheap_atmosphere(vec3 raydir, vec3 sundir) {
          float special_trick = 1.0 / (raydir.y * 1.0 + 0.1);
          float special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
          float raysundt = pow(abs(dot(sundir, raydir)), 2.0);
          float sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
          float mymie = sundt * special_trick * 0.2;
          vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
          vec3 bluesky = vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
          vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
          bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
          return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0)) + mymie;
        }

        vec3 getSunDirection() {
          return normalize(vec3(-0.0773502691896258, 0.5 + sin(iTime * 0.2 + 2.6) * 0.45, 0.5773502691896258));
        }

        vec3 getAtmosphere(vec3 dir) {
          return extra_cheap_atmosphere(dir, getSunDirection()) * 0.5;
        }

        float getSun(vec3 dir) {
          return pow(max(0.0, dot(dir, getSunDirection())), 720.0) * 210.0;
        }

        vec3 aces_tonemap(vec3 color) {
          mat3 m1 = mat3(
            0.59719, 0.07600, 0.02840,
            0.35458, 0.90834, 0.13383,
            0.04823, 0.01566, 0.83777
          );
          mat3 m2 = mat3(
            1.60475, -0.10208, -0.00327,
            -0.53108, 1.10813, -0.07276,
            -0.07367, -0.00605, 1.07602
          );
          vec3 v = m1 * color;
          vec3 a = v * (v + 0.0245786) - 0.000090537;
          vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
          return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec3 cubeCenter = getCubeCenter();
          vec3 origin = getOrbitOrigin(cubeCenter);
          vec3 ray = getOrbitRay(fragCoord, origin, cubeCenter);
          bool mobile = iResolution.x < 700.0;
          int rayIterations = mobile ? 8 : ITERATIONS_RAYMARCH;
          int normalIterations = mobile ? 20 : ITERATIONS_NORMAL;
          float cubeDist = raymarchCube(origin, ray, cubeCenter, mobile);

          if (ray.y >= 0.0) {
            if (cubeDist > 0.0) {
              fragColor = vec4(aces_tonemap(renderCube(origin, ray, cubeDist, cubeCenter) * 2.0), 1.0);
              return;
            }
            vec3 C = getAtmosphere(ray) + getSun(ray);
            fragColor = vec4(aces_tonemap(C * 2.0), 1.0);
            return;
          }

          vec3 waterPlaneHigh = vec3(0.0, 0.0, 0.0);
          vec3 waterPlaneLow = vec3(0.0, -WATER_DEPTH, 0.0);

          float highPlaneHit = intersectPlane(origin, ray, waterPlaneHigh, vec3(0.0, 1.0, 0.0));
          float lowPlaneHit = intersectPlane(origin, ray, waterPlaneLow, vec3(0.0, 1.0, 0.0));
          vec3 highHitPos = origin + ray * highPlaneHit;
          vec3 lowHitPos = origin + ray * lowPlaneHit;

          float dist = raymarchwater(origin, highHitPos, lowHitPos, WATER_DEPTH, rayIterations);
          if (cubeDist > 0.0 && cubeDist < dist) {
            fragColor = vec4(aces_tonemap(renderCube(origin, ray, cubeDist, cubeCenter) * 2.0), 1.0);
            return;
          }
          vec3 waterHitPos = origin + ray * dist;
          vec3 N = normal(waterHitPos.xz, 0.01, WATER_DEPTH, normalIterations);
          N = mix(N, vec3(0.0, 1.0, 0.0), 0.8 * min(1.0, sqrt(dist * 0.01) * 1.1));

          float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - max(0.0, dot(-N, ray)), 5.0);
          vec3 R = normalize(reflect(ray, N));
          R.y = abs(R.y);

          vec3 reflection = getAtmosphere(R) + getSun(R);
          vec3 scattering = vec3(0.0293, 0.0698, 0.1717) * 0.1 * (0.2 + (waterHitPos.y + WATER_DEPTH) / WATER_DEPTH);
          vec3 C = fresnel * reflection + scattering;
          fragColor = vec4(aces_tonemap(C * 2.0), 1.0);
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
    let mouseDown = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const updateMouse = (event) => {
      const rect = root.getBoundingClientRect();
      uniforms.iMouse.value.x = event.clientX - rect.left;
      uniforms.iMouse.value.y = rect.height - (event.clientY - rect.top);
      if (mouseDown) {
        uniforms.iMouse.value.z = uniforms.iMouse.value.x;
        uniforms.iMouse.value.w = uniforms.iMouse.value.y;
      }
    };

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
      if (uniforms.iMouse.value.x === 0 && uniforms.iMouse.value.y === 0) {
        uniforms.iMouse.value.set(width * 0.5, height * 0.27, 0, 0);
      }
    };

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener("pointermove", updateMouse);
    window.addEventListener("pointerdown", (event) => {
      mouseDown = true;
      updateMouse(event);
    });
    window.addEventListener("pointerup", () => {
      mouseDown = false;
      uniforms.iMouse.value.z = 0;
      uniforms.iMouse.value.w = 0;
    });
    window.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        targetProgress = clamp(targetProgress + event.deltaY * 0.0022, 0, maxProgress);
      },
      { passive: false },
    );
    window.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
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
      const depth = maxProgress > 0 ? progress / maxProgress : 0;
      uniforms.iTime.value = now * 0.001;
      uniforms.uCameraHeight.value = 5.5 - depth * 4.0;
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
