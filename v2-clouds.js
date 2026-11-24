(() => {
  "use strict";

  /**
   * 见山 · 朝山 WebGL 实时分形体积云雾引擎 (Persepolis 风格)
   * - 采用 Domain-Warped FBM (域扭曲分形噪波) 实时渲染丝缕感、受光感极强的流动云海
   * - 支持「等目标 4K 图真正加载并 decode 完成后」再从中心向四周拨云见日般散开
   * - 零外部库依赖，支持 WebGL 自动降级
   */

  const app = document.querySelector("#app");
  if (!app) return;

  // 创建全屏 WebGL 云雾过场容器
  const stage = document.createElement("div");
  stage.className = "v2-webgl-mist";
  stage.id = "v2-webgl-mist";
  stage.setAttribute("aria-hidden", "true");
  stage.innerHTML = `
    <canvas class="v2-webgl-mist-canvas" id="v2-webgl-mist-canvas"></canvas>
    <div class="v2-webgl-mist-copy" id="v2-webgl-mist-copy">
      <small id="v2-wm-sub">云 雾 缭 绕 · 静 候 山 门</small>
      <p id="v2-wm-quote"></p>
      <div class="v2-wm-loader" id="v2-wm-loader"><i></i></div>
    </div>
  `;
  app.appendChild(stage);

  const canvas = document.querySelector("#v2-webgl-mist-canvas");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });

  const VERT_SRC = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // Domain-Warped 5-Octave FBM 体积云海着色器：青玉山岚 + 晨曦暖金透光 + 中心拨云半径
  const FRAG_SRC = `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_density;   // 0.0 (完全清透) -> 1.0 (浓云缭绕)
    uniform float u_parting;   // 0.0 (满屏云海) -> 1.0 (从中心向四周拨开)

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
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
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.03 + vec2(13.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 aspect = vec2(u_res.x / max(1.0, u_res.y), 1.0);
      vec2 uv = (v_uv - 0.5) * aspect;
      float t = u_time * 0.16;

      // 镜头穿云微放大，模拟向前穿行进入云海的纵深
      float zoom = 1.0 - u_parting * 0.24;
      vec2 p = uv * 2.15 * zoom;

      // 双重域扭曲 (Domain Warping)，形成丝缕缠绕的真实山岚云雾
      vec2 q = vec2(
        fbm(p + vec2(t * 0.65, -t * 0.22)),
        fbm(p + vec2(-t * 0.48, t * 0.35) + vec2(5.2, 1.3))
      );
      vec2 r = vec2(
        fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.35),
        fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.28)
      );
      float f = fbm(p + 2.6 * r);

      // 中心向四周自然拨云（结合云纹边缘，不是生硬圆形洞）
      float dist = length(uv);
      float holeRadius = u_parting * 1.18;
      float edgeMask = smoothstep(holeRadius - 0.42, holeRadius + 0.34, dist + (f - 0.5) * 0.48);

      // 云雾体积密度
      float cloud = smoothstep(0.18, 0.86, f * 0.92 + 0.14);
      float alpha = clamp(cloud * u_density * edgeMask, 0.0, 1.0);
      // 最浓阶段确保彻底遮住后台场景切换，无闪屏
      float solidVeil = smoothstep(0.76, 1.0, u_density) * (1.0 - smoothstep(0.0, 0.35, u_parting));
      alpha = max(alpha, solidVeil * (0.86 + 0.14 * cloud));

      // 东方电影级云雾受光配色：深青玉影 -> 柔白丝云 -> 中轴晨曦暖金透光
      vec3 deepMist = vec3(0.08, 0.14, 0.16);
      vec3 silverMist = vec3(0.72, 0.80, 0.80);
      vec3 goldenSun = vec3(0.98, 0.84, 0.54);

      float centerGlow = exp(-dist * dist * 2.8);
      vec3 col = mix(deepMist, silverMist, smoothstep(0.25, 0.82, f));
      col = mix(col, goldenSun, clamp(centerGlow * (0.42 + 0.45 * r.x), 0.0, 0.85));

      // 云丝高光边缘
      float rim = pow(clamp(f * 1.1, 0.0, 1.0), 3.0) * 0.22;
      col += goldenSun * rim;

      gl_FragColor = vec4(col, alpha);
    }
  `;

  let prog = null;
  let uRes = null;
  let uTime = null;
  let uDensity = null;
  let uParting = null;

  if (gl) {
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (vs && fs) {
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "a_pos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uRes = gl.getUniformLocation(prog, "u_res");
        uTime = gl.getUniformLocation(prog, "u_time");
        uDensity = gl.getUniformLocation(prog, "u_density");
        uParting = gl.getUniformLocation(prog, "u_parting");
      } else {
        prog = null;
      }
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(320, Math.round(window.innerWidth * dpr));
    const h = Math.max(480, Math.round(window.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (gl) gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener("resize", resize);
  resize();

  let rafId = 0;
  let density = 0;
  let targetDensity = 0;
  let parting = 0;
  let targetParting = 0;
  let speedMul = 1;
  let active = false;
  let startTime = performance.now();

  function render(now) {
    if (!active) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(render);
    density += (targetDensity - density) * (0.075 * speedMul);
    parting += (targetParting - parting) * (0.055 * speedMul);

    if (gl && prog) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - startTime) * 0.001);
      gl.uniform1f(uDensity, density);
      gl.uniform1f(uParting, parting);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // 完全散开后自动停帧省电
    if (targetDensity === 0 && density < 0.012 && parting > 0.92) {
      active = false;
      stage.classList.remove("is-active", "is-copy-show");
      stage.setAttribute("aria-hidden", "true");
    }
  }

  function startLoop() {
    if (!active) {
      active = true;
      stage.classList.add("is-active");
      stage.setAttribute("aria-hidden", "false");
      if (!rafId) rafId = requestAnimationFrame(render);
    }
  }

  /* ===== 真实图片预加载工具（含 decode 保证零卡顿闪屏） ===== */
  function preloadImages(urls = [], timeoutMs = 4500) {
    if (!urls.length) return Promise.resolve();
    const tasks = urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().catch(() => {}).finally(resolve);
        } else {
          resolve();
        }
      };
      img.onerror = resolve;
      img.src = url;
    }));
    const guard = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    return Promise.race([Promise.all(tasks), guard]);
  }

  function getLang() {
    const l = document.documentElement.lang || "zh-Hans";
    return l === "en" || l === "zh-Hant" ? l : "zh-Hans";
  }

  let busy = false;

  /**
   * 1. 首屏「等待 4K 山门装载完成后再拨云见山」开场动画
   */
  function runInitialReveal() {
    const reduce = document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const isPortraitMobile = window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
    const theme = document.querySelector("#screen-landing")?.dataset.gateTheme || "cinema";
    const heroUrl = theme === "classic"
      ? "./assets/scene-gate-4k-classic.jpg?v=20261125-v2-7"
      : isPortraitMobile
        ? "./assets/scene-gate-4k-cinema-mobile.jpg?v=20261125-v2-7"
        : "./assets/scene-gate-4k-cinema.jpg?v=20261125-v2-7";

    const lang = getLang();
    const subEl = document.querySelector("#v2-wm-sub");
    const quoteEl = document.querySelector("#v2-wm-quote");
    const loaderEl = document.querySelector("#v2-wm-loader");
    if (subEl) subEl.textContent = lang === "en" ? "JIANSHAN · CHAOSHAN" : "见 山 · 朝 山";
    if (quoteEl) quoteEl.textContent = document.querySelector("#v2-hero-quote")?.textContent || "";
    if (loaderEl) loaderEl.style.display = "block";

    density = 1.0;
    targetDensity = 1.0;
    parting = 0.0;
    targetParting = 0.0;
    speedMul = 0.9;
    stage.classList.add("is-copy-show");
    startLoop();

    const minShow = new Promise((r) => setTimeout(r, 950));
    Promise.all([preloadImages([heroUrl], 4000), minShow]).then(() => {
      if (loaderEl) loaderEl.style.display = "none";
      stage.classList.remove("is-copy-show");
      targetParting = 1.0;
      targetDensity = 0.0;
    });
  }

  /**
   * 2. 穿门 / 切换场景：云雾缭绕涌入 -> 等目标 4K 场景装载就绪 -> 拨云见景
   */
  window.JianshanWebGLMist = function runTransition({
    isGateEntry = false,
    preloadUrls = [],
    quoteText = "",
    onMidpoint,
  } = {}) {
    if (busy) return;
    busy = true;
    const reduce = document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      if (typeof onMidpoint === "function") onMidpoint();
      busy = false;
      return;
    }

    const landing = document.querySelector("#screen-landing");
    const lang = getLang();
    const subEl = document.querySelector("#v2-wm-sub");
    const quoteEl = document.querySelector("#v2-wm-quote");
    const loaderEl = document.querySelector("#v2-wm-loader");

    if (subEl) {
      subEl.textContent = lang === "en"
        ? (isGateEntry ? "ENTERING THE SACRED GATE" : "DRIFTING THROUGH THE MIST")
        : lang === "zh-Hant"
          ? (isGateEntry ? "推 開 山 門 · 步 入 淨 境" : "雲 霧 繚 繞 · 移 步 換 景")
          : (isGateEntry ? "推 开 山 门 · 步 入 净 境" : "云 雾 缭 绕 · 移 步 换 景");
    }
    if (quoteEl) quoteEl.textContent = quoteText || "";
    if (loaderEl) loaderEl.style.display = isGateEntry ? "block" : "none";

    // 若从山门进入，启动 3D 镜头沿中轴向前推进
    if (isGateEntry && landing) landing.classList.add("is-entering-3d");

    // 云雾从四周柔和涌入并聚拢
    density = 0.05;
    targetDensity = 1.0;
    parting = 0.85;
    targetParting = 0.0;
    speedMul = isGateEntry ? 1.15 : 1.75;
    startLoop();

    if (quoteText) {
      setTimeout(() => stage.classList.add("is-copy-show"), isGateEntry ? 420 : 120);
    }

    // 并行等待：云雾聚拢到最浓 + 目标 4K 图像真正加载并 decode 完成
    const gatherTime = new Promise((r) => setTimeout(r, isGateEntry ? 1150 : 420));
    const preloadPromise = preloadImages(preloadUrls, 4500);

    Promise.all([gatherTime, preloadPromise]).then(() => {
      // 在浓云遮罩下无痕切换目标场景
      if (typeof onMidpoint === "function") onMidpoint();
      if (landing) landing.classList.remove("is-entering-3d");
      if (loaderEl) loaderEl.style.display = "none";

      // 略停片刻让用户读完禅语，随后拨云见日般散开
      setTimeout(() => {
        stage.classList.remove("is-copy-show");
        speedMul = isGateEntry ? 0.92 : 1.45;
        targetParting = 1.0;
        targetDensity = 0.0;
        setTimeout(() => { busy = false; }, isGateEntry ? 950 : 480);
      }, isGateEntry ? 520 : 140);
    });
  };

  // 页面就绪后启动首次「装载完成再拨云见山门」开场
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(runInitialReveal, 30));
  } else {
    setTimeout(runInitialReveal, 30);
  }
})();
