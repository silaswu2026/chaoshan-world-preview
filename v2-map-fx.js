(() => {
  "use strict";

  /**
   * 见山 · 朝山世界全景四山专属动态点缀引擎
   * - 峨眉山（上中）：金顶佛光柔和呼吸 + 细微晨光金尘
   * - 五台山（中左）：清凉圣境极轻细雪缓飘
   * - 普陀山（中右）：南海海面细腻水波涟漪与银青微光
   * - 九华山（下中）：古刹暖灯微焰 + 极细香烟丝缕
   */

  const mapScreen = document.querySelector("#screen-map");
  const mapCanvasWrap = mapScreen?.querySelector(".map-canvas");
  if (!mapScreen || !mapCanvasWrap) return;

  // 注入与首页同源的真实摄影薄雾层 + 四山动态画布
  const fxWrap = document.createElement("div");
  fxWrap.className = "v2-map-fx";
  fxWrap.setAttribute("aria-hidden", "true");
  fxWrap.innerHTML = `
    <div class="v2-map-mist-drift"></div>
    <div class="v2-map-emei-rays"></div>
    <canvas class="v2-map-canvas" id="v2-map-canvas"></canvas>
  `;
  mapCanvasWrap.insertBefore(fxWrap, mapCanvasWrap.firstChild.nextSibling);

  const canvas = document.querySelector("#v2-map-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  // 五台山细雪（左半区域）
  const snowflakes = [];
  // 峨眉山金顶微尘（上中区域）
  const emeiMotes = [];
  // 普陀山南海波光（右侧海面）
  const waterGlints = [];
  // 九华山松间香烟（下中区域）
  const smokeWisps = [];

  function initParticles() {
    snowflakes.length = 0;
    emeiMotes.length = 0;
    waterGlints.length = 0;
    smokeWisps.length = 0;

    for (let i = 0; i < 26; i++) {
      snowflakes.push({
        x: Math.random() * w * 0.42,
        y: h * (0.14 + Math.random() * 0.56),
        r: 0.9 + Math.random() * 1.4,
        vx: 0.14 + Math.random() * 0.22,
        vy: 0.24 + Math.random() * 0.36,
        alpha: 0.22 + Math.random() * 0.42,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 20; i++) {
      emeiMotes.push({
        x: w * (0.36 + Math.random() * 0.28),
        y: h * (0.06 + Math.random() * 0.28),
        r: 0.9 + Math.random() * 1.6,
        vy: -(0.12 + Math.random() * 0.2),
        alpha: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 18; i++) {
      waterGlints.push({
        x: w * (0.64 + Math.random() * 0.32),
        y: h * (0.34 + Math.random() * 0.34),
        len: 12 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        speed: 0.018 + Math.random() * 0.02,
        alpha: 0.16 + Math.random() * 0.28,
      });
    }

    for (let i = 0; i < 12; i++) {
      smokeWisps.push({
        x: w * (0.48 + (Math.random() - 0.5) * 0.06),
        y: h * (0.52 + Math.random() * 0.18),
        r: 5 + Math.random() * 10,
        vy: -(0.16 + Math.random() * 0.18),
        alpha: 0.06 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    const rect = mapCanvasWrap.getBoundingClientRect();
    w = Math.max(320, Math.round(rect.width || window.innerWidth));
    h = Math.max(480, Math.round(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  window.addEventListener("resize", resize);
  resize();

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !mapScreen.classList.contains("is-active")) return;
    if (document.body.classList.contains("reduce-motion") || reduceQuery.matches) {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    const t = now * 0.001;
    ctx.clearRect(0, 0, w, h);

    // 1. 峨眉山（上中）：柔和呼吸的金顶佛光 + 细微晨光金尘
    const emeiX = w * 0.5;
    const emeiY = h * 0.17;
    const emeiPulse = 0.72 + 0.28 * Math.sin(t * 0.9);
    const emeiR = Math.min(w, h) * 0.22;
    const emeiGrad = ctx.createRadialGradient(emeiX, emeiY, 0, emeiX, emeiY, emeiR);
    emeiGrad.addColorStop(0, `rgba(255, 234, 170, ${0.34 * emeiPulse})`);
    emeiGrad.addColorStop(0.4, `rgba(238, 190, 92, ${0.14 * emeiPulse})`);
    emeiGrad.addColorStop(1, "rgba(238, 190, 92, 0)");
    ctx.fillStyle = emeiGrad;
    ctx.beginPath();
    ctx.arc(emeiX, emeiY, emeiR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < emeiMotes.length; i++) {
      const m = emeiMotes[i];
      m.phase += 0.025;
      m.y += m.vy;
      m.x += Math.sin(m.phase) * 0.16;
      if (m.y < h * 0.04) {
        m.y = h * 0.30;
        m.x = w * (0.36 + Math.random() * 0.28);
      }
      const a = m.alpha * (0.5 + 0.5 * Math.sin(m.phase * 1.5));
      ctx.fillStyle = `rgba(255, 232, 166, ${a})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 五台山（中左）：清凉细雪缓飘
    for (let i = 0; i < snowflakes.length; i++) {
      const s = snowflakes[i];
      s.phase += 0.02;
      s.x += s.vx + Math.sin(s.phase) * 0.22;
      s.y += s.vy;
      if (s.y > h * 0.70 || s.x > w * 0.44) {
        s.x = Math.random() * w * 0.36;
        s.y = h * 0.14;
      }
      const edgeFade = Math.max(0, 1 - s.x / (w * 0.44));
      ctx.fillStyle = `rgba(230, 242, 248, ${s.alpha * edgeFade})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 普陀山（中右）：南海潮音水波涟漪 + 柔和波光
    const waveOriginX = w * 0.80;
    const waveOriginY = h * 0.48;
    for (let k = 0; k < 3; k++) {
      const progress = ((t * 0.22 + k / 3) % 1);
      const rx = (28 + progress * Math.min(w * 0.18, 150));
      const ry = rx * 0.28;
      const alpha = Math.sin(progress * Math.PI) * 0.22;
      ctx.strokeStyle = `rgba(206, 236, 232, ${alpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(waveOriginX, waveOriginY + progress * 14, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < waterGlints.length; i++) {
      const g = waterGlints[i];
      g.phase += g.speed;
      const shimmer = 0.5 + 0.5 * Math.sin(g.phase);
      const xShift = Math.sin(g.phase * 0.6) * 5;
      const grad = ctx.createLinearGradient(g.x + xShift - g.len, g.y, g.x + xShift + g.len, g.y);
      grad.addColorStop(0, "rgba(218, 242, 238, 0)");
      grad.addColorStop(0.5, `rgba(226, 244, 238, ${g.alpha * shimmer})`);
      grad.addColorStop(1, "rgba(218, 242, 238, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(g.x + xShift - g.len, g.y);
      ctx.lineTo(g.x + xShift + g.len, g.y);
      ctx.stroke();
    }

    // 4. 九华山（下中）：暖灯微焰 + 松间极细香烟
    const jhX = w * 0.5;
    const jhY = h * 0.60;
    const lampPulse = 0.72 + 0.28 * Math.sin(t * 2.1 + 0.8);
    const jhR = Math.min(w, h) * 0.13;
    const jhGrad = ctx.createRadialGradient(jhX, jhY, 0, jhX, jhY, jhR);
    jhGrad.addColorStop(0, `rgba(255, 206, 120, ${0.28 * lampPulse})`);
    jhGrad.addColorStop(0.5, `rgba(232, 152, 62, ${0.1 * lampPulse})`);
    jhGrad.addColorStop(1, "rgba(232, 152, 62, 0)");
    ctx.fillStyle = jhGrad;
    ctx.beginPath();
    ctx.arc(jhX, jhY, jhR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < smokeWisps.length; i++) {
      const sm = smokeWisps[i];
      sm.phase += 0.018;
      sm.y += sm.vy;
      sm.x += Math.sin(sm.phase) * 0.25;
      if (sm.y < h * 0.42) {
        sm.y = h * 0.64;
        sm.x = w * (0.48 + (Math.random() - 0.5) * 0.04);
      }
      const fade = Math.sin(((h * 0.64 - sm.y) / (h * 0.22)) * Math.PI);
      const sg = ctx.createRadialGradient(sm.x, sm.y, 0, sm.x, sm.y, sm.r);
      sg.addColorStop(0, `rgba(232, 236, 232, ${sm.alpha * Math.max(0, fade)})`);
      sg.addColorStop(1, "rgba(232, 236, 232, 0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(tick);
})();
