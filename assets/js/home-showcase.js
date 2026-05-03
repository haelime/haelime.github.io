import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const root = document.querySelector("[data-home-showcase]");

if (root) {
  const canvas = root.querySelector("canvas");

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

        //I would like to express my gratitude to Yohei for the following source code
        //https://x.com/YoheiNishitsuji/status/2050206104211398785?s=20

        // rotate2D builds a 2D rotation matrix.
        // Visual effect: this makes the whole fractal structure slowly spin in space.
        mat2 rotate2D(float a)
        {
            // c and s are cosine and sine of the angle.
            // Visual effect: these values define the rotation amount used for the animated twist.
            float c = cos(a), s = sin(a);

            // Return the standard 2D rotation matrix.
            // Visual effect: rotating the zx-plane creates the drifting, orbital motion of the glowing structure.
            return mat2(c, -s, s, c);
        }

        // hsv converts hue, saturation, and value into RGB color.
        // Visual effect: this gives the fractal its neon-like pink, violet, and gold color shifts.
        vec3 hsv(float h, float s, float v)
        {
            // Build a rainbow-like RGB basis from the hue value.
            // Visual effect: hue changes along the shape, producing color variation across the glowing network.
            vec3 rgb = clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);

            // Mix pure white with the hue-based color using saturation, then scale by brightness.
            // Visual effect: bright zones glow vividly while dim zones stay soft and smoky.
            return v * mix(vec3(1.0), rgb, s);
        }

        // mainImage is the entry point for each pixel.
        // Visual effect: every screen pixel traces through the same fractal field and accumulates light.
        void mainImage(out vec4 fragColor, in vec2 fragCoord)
        {
            // r stores the screen resolution.
            // Visual effect: this keeps the image correctly proportioned regardless of screen size.
            vec2 r = iResolution.xy;

            // t stores elapsed time.
            // Visual effect: time drives the slow rotation and makes the structure feel alive.
            float t = iTime;

            // o accumulates the final color output.
            // Visual effect: repeated additions create the glowing, layered, volumetric appearance.
            vec4 o = vec4(0.0);

            // FC is a short alias for fragCoord.
            // Visual effect: no visual change by itself; it simply shortens the formula syntax.
            #define FC fragCoord

            // Outer loop marches through the scene many times.
            // Visual effect: this behaves like a lightweight raymarch, layering many samples into one luminous image.
            for (float i = 0.0, g = 0.0, e = 0.0, s = 0.0; ++i < 79.0;)
            {
                // Build a 3D point from the current pixel and the marching depth g.
                // Visual effect: x and y come from the screen, while z evolves through the loop, giving depth to the fractal.
                vec3 p = vec3((FC.xy - 0.5 * r) / r.y * 2.0 + vec2(0.0, 1.0), g - 0.5);

                // Rotate the zx-plane over time.
                // Visual effect: the entire crystalline web slowly turns, which enhances the hypnotic motion.
                p.zx *= rotate2D(t * 0.5);

                // Reset the scale accumulator.
                // Visual effect: each marched sample starts with neutral brightness contribution.
                s = 1.0;

                // Inner loop repeatedly folds space into a fractal pattern.
                // Visual effect: this is the core generator of the clustered, cellular, web-like geometry.
                for (int j = 0; j++ < 16;
                     p = vec3(2.0, 5.0, 3.0) - abs(abs(p) * e - vec3(3.0, 1.4, 4.5)))
                {
                    // Compute an expansion factor from distance to the origin.
                    // Visual effect: points near key regions expand more, sharpening bright nodes and dense filaments.
                    e = max(1.005, 8.0 / dot(p, p));

                    // Accumulate that expansion into s.
                    // Visual effect: repeated scaling builds the intensity that later becomes glow.
                    s *= e;
                }

                // Advance the march depth using a modulated radial measure.
                // Visual effect: this creates the layered shell-like spacing and contributes to the netted, bubble-like structure.
                g += mod(length(p.xz), p.y) / s;

                // Convert accumulated scale into a brightness-like quantity.
                // Visual effect: logarithmic compression turns huge fractal values into manageable glow levels.
                s = log(s) / g;

                // Add colored light based on height and intensity.
                // Visual effect: p.y shifts hue and saturation, while s controls the brightness of the luminous bloom.
                o.rgb += hsv(0.4 * p.y, 1.0 - p.y, s / 2e4);
            }

            // Write the accumulated color to the screen.
            // Visual effect: the final image appears as a dark scene filled with sparkling fractal energy.
            fragColor = o;
        }

        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.set(width, height, 1);
    };

    window.addEventListener("resize", resize);
    resize();

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
