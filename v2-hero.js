(() => {
  "use strict";

  const landing = document.querySelector("#screen-landing");
  const atmosphere = landing?.querySelector(".hero-atmosphere");
  if (!landing || !atmosphere) return;

  const THEME_KEY = "jianshan-v2-gate-theme";
  let currentTheme = "cinema";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "classic" || saved === "cinema") currentTheme = saved;
  } catch (_) { /* ignore */ }

  /* ===== 1. 注入电影级光影层、石灯微焰与 Canvas 粒子画布 ===== */
  const fxLayer = document.createElement("div");
  fxLayer.className = "v2-cinema-fx";
  fxLayer.setAttribute("aria-hidden", "true");
  fxLayer.innerHTML = `
    <div class="v2-god-rays"><i></i><i></i><i></i><i></i></div>
    <div class="v2-lantern v2-lantern-left"></div>
    <div class="v2-lantern v2-lantern-right"></div>
    <div class="v2-velvet-mist v2-mist-a"></div>
    <div class="v2-velvet-mist v2-mist-b"></div>
    <canvas class="v2-hero-canvas" id="v2-hero-canvas"></canvas>
    <div class="v2-foreground-vignette"></div>
  `;
  atmosphere.appendChild(fxLayer);

  /* ===== 2. 注入 A/B 4K 山门一键切换胶囊 ===== */
  const switcher = document.createElement("div");
  switcher.className = "v2-gate-switcher";
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "4K 山门画卷切换");
  switcher.innerHTML = `
    <button type="button" data-gate-theme="cinema" class="is-on"><i class="dot"></i><span data-v2-gate="cinema">新 4K 电影山门</span></button>
    <button type="button" data-gate-theme="classic"><i class="dot"></i><span data-v2-gate="classic">原 4K 经典山门</span></button>
  `;
  landing.appendChild(switcher);

  function updateSwitcherLabels() {
    const lang = document.documentElement.lang || "zh-Hans";
    const labels = lang === "en"
      ? { cinema: "New 4K Cinema", classic: "Classic 4K Gate" }
      : lang === "zh-Hant"
        ? { cinema: "新 4K 電影山門", classic: "原 4K 經典山門" }
        : { cinema: "新 4K 电影山门", classic: "原 4K 经典山门" };
    switcher.querySelector('[data-v2-gate="cinema"]').textContent = labels.cinema;
    switcher.querySelector('[data-v2-gate="classic"]').textContent = labels.classic;
  }

  function applyGateTheme(theme) {
    currentTheme = theme === "classic" ? "classic" : "cinema";
    landing.dataset.gateTheme = currentTheme;
    document.body.dataset.gateTheme = currentTheme;
    switcher.querySelectorAll("[data-gate-theme]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.gateTheme === currentTheme);
    });
    try { localStorage.setItem(THEME_KEY, currentTheme); } catch (_) { /* ignore */ }
  }

  switcher.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-gate-theme]");
    if (btn) applyGateTheme(btn.dataset.gateTheme);
  });

  window.addEventListener("chaoshan:lang", updateSwitcherLabels);
  applyGateTheme(currentTheme);
  updateSwitcherLabels();

  /* ===== 3. 悬停「推开山门」按钮：联动暖金佛光、镜头前推与粒子汇聚 ===== */
  const enterBtn = document.querySelector("#btn-v2-enter-gate");
  let ctaHover = false;
  if (enterBtn) {
    enterBtn.addEventListener("pointerenter", () => {
      ctaHover = true;
      landing.classList.add("v2-gate-hover");
    });
    enterBtn.addEventListener("pointerleave", () => {
      ctaHover = false;
      landing.classList.remove("v2-gate-hover");
    });
  }

  /* ===== 4. 五层平滑阻尼景深 + 60fps Canvas 三层金光粒子 ===== */
  const canvas = document.querySelector("#v2-hero-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let pointerPxX = -9999;
  let pointerPxY = -9999;

  const particles = [];

  function createParticle(layer, randomY = true) {
    if (layer === 0) {
      // 远景光柱细尘
      return {
        layer: 0,
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 10,
        r: 0.7 + Math.random() * 1.1,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -(0.12 + Math.random() * 0.22),
        alpha: 0.18 + Math.random() * 0.36,
        phase: Math.random() * Math.PI * 2,
        speed: 0.012 + Math.random() * 0.016,
        hue: 42 + Math.random() * 10,
      };
    }
    if (layer === 1) {
      // 中景香火金星萤光
      return {
        layer: 1,
        x: width * (0.15 + Math.random() * 0.7),
        y: randomY ? Math.random() * height : height + 20,
        r: 1.5 + Math.random() * 2.1,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.28 + Math.random() * 0.42),
        alpha: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.025,
        hue: 38 + Math.random() * 12,
      };
    }
    // 近景大光圈柔焦暖金光斑 (Bokeh)
    return {
      layer: 2,
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + 60,
      r: 16 + Math.random() * 26,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.14 + Math.random() * 0.2),
      alpha: 0.04 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.01,
      hue: 40 + Math.random() * 10,
    };
  }

  function resize() {
    const rect = landing.getBoundingClientRect();
    width = Math.max(320, Math.round(rect.width || window.innerWidth));
    height = Math.max(480, Math.round(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (particles.length === 0) {
      const isMobile = width < 700;
      const farCount = isMobile ? 34 : 58;
      const midCount = isMobile ? 16 : 28;
      const bokehCount = isMobile ? 4 : 7;
      for (let i = 0; i < farCount; i++) particles.push(createParticle(0, true));
      for (let i = 0; i < midCount; i++) particles.push(createParticle(1, true));
      for (let i = 0; i < bokehCount; i++) particles.push(createParticle(2, true));
    }
  }

  landing.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, width) - 0.5) * 2;  // -1 .. 1
    targetY = (e.clientY / Math.max(1, height) - 0.5) * 2; // -1 .. 1
    pointerPxX = e.clientX;
    pointerPxY = e.clientY;
  });

  landing.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    pointerPxX = -9999;
    pointerPxY = -9999;
  });

  window.addEventListener("resize", resize);
  resize();

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !landing.classList.contains("is-active")) return;
    if (document.body.classList.contains("reduce-motion") || reduceMotionQuery.matches) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // 1. 阻尼缓动更新五层景深 CSS 变量
    const idleX = Math.sin(now * 0.00035) * 0.14;
    const idleY = Math.cos(now * 0.00028) * 0.1;
    const goalX = targetX + idleX;
    const goalY = targetY + idleY;
    curX += (goalX - curX) * 0.055;
    curY += (goalY - curY) * 0.055;

    atmosphere.style.setProperty("--v2-far-x", `${(-curX * 12).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-far-y", `${(-curY * 7).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-mid-x", `${(-curX * 22).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-mid-y", `${(-curY * 12).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-near-x", `${(curX * 34).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-near-y", `${(curY * 18).toFixed(2)}px`);

    // 2. 绘制三层 Canvas 金光粒子
    ctx.clearRect(0, 0, width, height);
    const gateX = width * 0.5;
    const gateY = height * 0.43;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += p.speed;

      // 水平微风漂移 + 上升
      p.x += p.vx + Math.sin(p.phase) * (p.layer === 1 ? 0.24 : 0.09);
      p.y += p.vy * (ctaHover && p.layer === 1 ? 1.45 : 1);

      // 悬停「推开山门」时，中景金光粒子温柔向山门中心汇聚
      if (ctaHover && p.layer === 1) {
        p.x += (gateX - p.x) * 0.008;
        p.y += (gateY - p.y) * 0.005;
      }

      // 鼠标划过时的微风扰动
      if (pointerPxX > -1000 && p.layer < 2) {
        const dx = p.x - pointerPxX;
        const dy = p.y - pointerPxY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 14000 && distSq > 4) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / 118) * 0.9;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // 越界重生
      if (p.y < -p.r * 2 - 20 || p.x < -80 || p.x > width + 80) {
        particles[i] = createParticle(p.layer, false);
        continue;
      }

      const twinkle = 0.55 + 0.45 * Math.sin(p.phase * 1.4);
      const a = p.alpha * twinkle * (ctaHover ? 1.25 : 1);

      // 叠加视差偏移
      const pxOffset = p.layer === 0 ? -curX * 8 : p.layer === 1 ? curX * 14 : curX * 28;
      const pyOffset = p.layer === 0 ? -curY * 5 : p.layer === 1 ? curY * 9 : curY * 16;
      const drawX = p.x + pxOffset;
      const drawY = p.y + pyOffset;

      if (p.layer === 2) {
        // 柔焦大光斑
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 88%, 78%, ${a})`);
        grad.addColorStop(0.55, `hsla(${p.hue}, 80%, 62%, ${a * 0.4})`);
        grad.addColorStop(1, "hsla(42, 80%, 60%, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.layer === 1) {
        // 中景带光晕金星
        const haloR = p.r * 4.2;
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, haloR);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 86%, ${Math.min(1, a)})`);
        grad.addColorStop(0.35, `hsla(${p.hue}, 85%, 65%, ${a * 0.45})`);
        grad.addColorStop(1, "hsla(42, 85%, 60%, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, haloR, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 远景微尘
        ctx.fillStyle = `hsla(${p.hue}, 90%, 84%, ${a})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(tick);
})();
