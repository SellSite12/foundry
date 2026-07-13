"use client";

import { useEffect, useRef } from "react";

/**
 * WebGL shader hero backgrounds (inspired by reactbits.dev).
 * Dependency-free: raw WebGL1 fullscreen fragment shaders driven by theme colors.
 * Falls back to the CSS gradient behind the canvas when WebGL is unavailable,
 * and renders a single static frame for prefers-reduced-motion users.
 */

export type ShaderVariant =
  | "silk"
  | "iridescence"
  | "liquid-chrome"
  | "galaxy"
  | "light-rays"
  | "hyperspeed"
  | "aurora-flow";

const VERTEX_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const COMMON = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_c1;
uniform vec3 u_c2;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.3, 9.1);
    a *= 0.5;
  }
  return v;
}
`;

const FRAGMENTS: Record<ShaderVariant, string> = {
  // Flowing silk waves with soft directional lighting.
  silk: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  uv += u_mouse * 0.04;
  float t = u_time * 0.22;

  float warp = fbm(uv * 2.4 + vec2(t * 0.6, -t * 0.35));
  float warp2 = fbm(uv * 3.1 - vec2(t * 0.4, t * 0.5) + warp);
  float bands = sin((uv.x + uv.y * 1.4) * 5.0 + warp2 * 5.5 + t * 1.6);
  float sheen = pow(0.5 + 0.5 * bands, 3.0);

  vec3 base = mix(u_c1 * 0.22, u_c2 * 0.30, 0.5 + 0.5 * sin(warp * 4.0 + t));
  vec3 col = base + mix(u_c1, u_c2, 0.5 + 0.5 * bands) * sheen * 0.85;
  col += vec3(1.0) * pow(sheen, 6.0) * 0.22;

  float vig = 1.0 - 0.55 * dot(uv, uv);
  gl_FragColor = vec4(col * vig, 1.0);
}
`,

  // Soft interference rings that ripple like an oil slick.
  iridescence: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  uv += u_mouse * 0.08;
  float t = u_time * 0.4;

  float d = 0.0;
  vec2 p = uv * 2.2;
  for (int i = 0; i < 4; i++) {
    p = abs(p) / dot(p, p) - 0.9;
    d += length(p) * 0.28;
  }

  vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (d * 0.8 + t * 0.12) + vec3(0.0, 2.1, 4.2));
  vec3 tinted = mix(rainbow, mix(u_c1, u_c2, rainbow.b), 0.55);
  float glow = smoothstep(1.6, 0.2, length(uv));
  vec3 col = tinted * (0.35 + 0.65 * glow) + u_c1 * 0.08;

  gl_FragColor = vec4(col, 1.0);
}
`,

  // Molten reflective metal with moving specular highlights.
  "liquid-chrome": `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  uv += u_mouse * 0.05;
  float t = u_time * 0.18;

  float n1 = fbm(uv * 2.0 + vec2(t, -t * 0.7));
  float n2 = fbm(uv * 2.6 + n1 * 1.4 + vec2(-t * 0.5, t * 0.9));
  float flow = sin(n2 * 9.0 + t * 2.0);

  float metal = pow(0.5 + 0.5 * flow, 4.0);
  float dark = pow(0.5 - 0.5 * flow, 2.0);

  vec3 col = mix(u_c1 * 0.15, u_c2 * 0.55, n2);
  col += mix(u_c1, vec3(1.0), 0.45) * metal * 1.1;
  col -= dark * 0.12;

  float vig = 1.0 - 0.5 * dot(uv, uv);
  gl_FragColor = vec4(col * vig, 1.0);
}
`,

  // Layered starfield drifting through a tinted nebula.
  galaxy: `
float starLayer(vec2 uv, float scale, float t, float twinkleSeed) {
  vec2 g = uv * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  float star = smoothstep(0.08, 0.0, length(f - (vec2(h, fract(h * 7.7)) - 0.5) * 0.7));
  float twinkle = 0.55 + 0.45 * sin(t * (1.5 + h * 3.0) + h * 40.0 + twinkleSeed);
  return star * step(0.75, h) * twinkle;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  uv += u_mouse * 0.03;
  float t = u_time;

  vec2 drift = vec2(t * 0.008, t * 0.004);
  float stars = starLayer(uv + drift, 22.0, t, 0.0) * 0.9
    + starLayer(uv + drift * 2.2, 40.0, t, 3.1) * 0.6
    + starLayer(uv + drift * 3.5, 70.0, t, 6.2) * 0.35;

  float neb = fbm(uv * 2.0 + vec2(t * 0.015, -t * 0.01));
  float neb2 = fbm(uv * 3.4 - vec2(t * 0.02, t * 0.012) + neb);
  vec3 nebula = mix(u_c1, u_c2, neb2) * pow(neb, 2.2) * 1.4;

  vec3 col = vec3(0.012, 0.014, 0.03) + nebula + vec3(stars);
  float core = smoothstep(1.1, 0.0, length(uv - vec2(0.25, 0.05)));
  col += u_c2 * core * 0.12;

  gl_FragColor = vec4(col, 1.0);
}
`,

  // Volumetric light rays falling from above.
  "light-rays": `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 src = vec2(u_mouse.x * 0.25, 0.62);
  vec2 d = uv - src;
  float ang = atan(d.x, -d.y);
  float dist = length(d);
  float t = u_time * 0.3;

  float rays = 0.0;
  rays += pow(0.5 + 0.5 * sin(ang * 14.0 + t * 2.0 + fbm(vec2(ang * 3.0, t)) * 3.0), 3.0) * 0.7;
  rays += pow(0.5 + 0.5 * sin(ang * 7.0 - t * 1.4), 5.0) * 0.5;
  rays *= smoothstep(1.6, 0.05, dist);
  rays *= smoothstep(-0.85, 0.4, -uv.y + 0.5);

  float haze = fbm(uv * 3.0 + vec2(t * 0.4, -t * 0.2)) * 0.14;
  vec3 col = vec3(0.015, 0.013, 0.02);
  col += mix(u_c1, u_c2, 0.5 + 0.5 * sin(ang * 2.0)) * rays;
  col += u_c1 * haze;
  col += u_c2 * smoothstep(0.5, 0.0, dist) * 0.25;

  gl_FragColor = vec4(col, 1.0);
}
`,

  // Streaks of light rushing past — warp-speed travel.
  hyperspeed: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  uv -= u_mouse * 0.06;
  float t = u_time;

  float ang = atan(uv.y, uv.x);
  float dist = length(uv) + 0.05;

  float streaks = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float seed = hash(vec2(floor(ang * (60.0 + fi * 37.0)), fi));
    float speed = 0.5 + seed * 1.6 + fi * 0.3;
    float trail = fract(seed * 17.0 - t * speed / (dist * 2.2 + 0.2));
    float beam = smoothstep(0.35, 0.0, abs(fract(ang * (60.0 + fi * 37.0) / 6.2831) - 0.5) * 2.0 - 0.32);
    streaks += beam * pow(trail, 6.0) * smoothstep(0.02, 0.6, dist) * (0.6 - fi * 0.15);
  }

  vec3 col = vec3(0.01, 0.012, 0.028);
  col += mix(u_c1, u_c2, smoothstep(0.0, 1.2, dist)) * streaks * 2.4;
  col += u_c2 * smoothstep(0.4, 0.0, dist) * 0.35;
  col += u_c1 * pow(smoothstep(0.25, 0.0, dist), 2.0) * 0.8;

  gl_FragColor = vec4(col, 1.0);
}
`,

  // Aurora curtains breathing across a night sky.
  "aurora-flow": `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.25;

  vec3 col = mix(vec3(0.012, 0.015, 0.035), vec3(0.03, 0.02, 0.06), uv.y);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float wave = fbm(vec2(p.x * (1.4 + fi * 0.5) + t * (0.5 + fi * 0.25), t * 0.4 + fi * 7.0));
    float band = uv.y - (0.35 + fi * 0.18 + wave * 0.28 + u_mouse.y * 0.03);
    float curtain = exp(-band * band * (26.0 - fi * 6.0));
    float shimmer = fbm(vec2(p.x * 6.0 - t * 2.0, fi * 3.0)) * 0.5 + 0.5;
    vec3 tint = mix(u_c1, u_c2, fi * 0.5 + shimmer * 0.4);
    col += tint * curtain * shimmer * (0.55 - fi * 0.12);
  }

  float stars = step(0.9975, hash(floor(gl_FragCoord.xy / 1.6))) * (0.4 + 0.6 * sin(u_time * 2.0 + p.x * 40.0));
  col += vec3(stars) * (1.0 - uv.y * 0.6) * 0.5;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

export const SHADER_VARIANTS = Object.keys(FRAGMENTS) as ShaderVariant[];

export function isShaderHero(style: string | null | undefined): style is ShaderVariant {
  return Boolean(style) && (SHADER_VARIANTS as string[]).includes(style as string);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.9, 0.64, 0.24];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readThemeColor(el: HTMLElement, name: string, fallback: string): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  return hexToRgb(raw || fallback);
}

export function HeroShader({ variant }: { variant: ShaderVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const fragSrc = COMMON + FRAGMENTS[variant];

    function compile(type: number, src: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uC1 = gl.getUniformLocation(program, "u_c1");
    const uC2 = gl.getUniformLocation(program, "u_c2");

    const c1 = readThemeColor(canvas, "--sf-primary", "#E8A33D");
    const c2 = readThemeColor(canvas, "--sf-accent", "#B85C2E");
    gl.uniform3f(uC1, c1[0], c1[1], c1[2]);
    gl.uniform3f(uC2, c2[0], c2[1], c2[2]);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let raf = 0;
    let visible = true;
    let mouseX = 0;
    let mouseY = 0;
    const start = performance.now();

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      if (!w || !h) return;
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas!.width !== bw || canvas!.height !== bh) {
        canvas!.width = bw;
        canvas!.height = bh;
        gl!.viewport(0, 0, bw, bh);
      }
    }

    function draw(now: number) {
      resize();
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, (now - start) / 1000);
      gl!.uniform2f(uMouse, mouseX, mouseY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    function loop(now: number) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
    }

    function startLoop() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    if (reduceMotion) {
      // Static frame — still beautiful, no motion.
      resize();
      draw(start + 4000);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) startLoop();
          else stopLoop();
        },
        { threshold: 0.01 }
      );
      io.observe(canvas);
      const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("mousemove", onMove, { passive: true });
      startLoop();

      return () => {
        stopLoop();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("mousemove", onMove);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    return () => {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{
        // CSS fallback shows through for a frame before WebGL paints (and forever if WebGL is unavailable).
        background:
          "radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--sf-primary) 30%, #05060a), #05060a 70%)",
      }}
    />
  );
}
