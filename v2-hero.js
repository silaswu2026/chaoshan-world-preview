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

  /* ===== 1. 五句随机「朝山意境文案」（中 / 繁 / 英） ===== */
  const QUOTES = [
    {
      "zh-Hans": "步步登高，是为放下；一念朝山，即是见佛。",
      "zh-Hant": "步步登高，是為放下；一念朝山，即是見佛。",
      en: "Every step upward is a letting go; one sincere turning of the heart is to meet the Buddha.",
    },
    {
      "zh-Hans": "山在云外，佛在心中；循香而上，暂别尘嚣，与清净重逢。",
      "zh-Hant": "山在雲外，佛在心中；循香而上，暫別塵囂，與清淨重逢。",
      en: "Beyond the clouds lies the mountain; within the stillness dwells the awakened heart.",
    },
    {
      "zh-Hans": "世人上山拜佛，非求远方神明，只为在云雾钟声里，照见本自具足的安宁。",
      "zh-Hant": "世人上山拜佛，非求遠方神明，只為在雲霧鐘聲裡，照見本自具足的安寧。",
      en: "We climb the sacred mountain not to seek a distant god, but to awaken the peace already within.",
    },
    {
      "zh-Hans": "踏云入山门，一炷清香礼诸佛；心有所向，步步皆是道场。",
      "zh-Hant": "踏雲入山門，一炷清香禮諸佛；心有所向，步步皆是道場。",
      en: "Step through the misty gate with one incense; wherever the heart bows in sincerity, the sanctuary appears.",
    },
    {
      "zh-Hans": "上山朝佛，下山见己。",
      "zh-Hant": "上山朝佛，下山見己。",
      en: "Ascend to bow before the Buddha; return to see yourself.",
    },
  ];

  // 每次进入页面随机择一句缘分禅语
  const sessionQuoteIndex = Math.floor(Math.random() * QUOTES.length);

  function getLang() {
    const l = document.documentElement.lang || "zh-Hans";
    return l === "en" || l === "zh-Hant" ? l : "zh-Hans";
  }

  function getSessionQuote(offset = 0) {
    const q = QUOTES[(sessionQuoteIndex + offset) % QUOTES.length];
    return q[getLang()] || q["zh-Hans"];
  }

  /* ===== 2. 注入电影级光影层 + 独立近景左右苍松透视图层 + Canvas 飘渺云海与粒子 ===== */
  const fxLayer = document.createElement("div");
  fxLayer.className = "v2-cinema-fx";
  fxLayer.setAttribute("aria-hidden", "true");
  fxLayer.innerHTML = `
    <div class="v2-sanctuary-glow"></div>
    <div class="v2-god-rays"><i></i><i></i><i></i><i></i></div>
    <div class="v2-lantern v2-lantern-left"></div>
    <div class="v2-lantern v2-lantern-right"></div>
    <div class="v2-velvet-mist v2-mist-a"></div>
    <div class="v2-velvet-mist v2-mist-b"></div>
    <div class="v2-velvet-mist v2-mist-c"></div>
    <canvas class="v2-hero-canvas" id="v2-hero-canvas"></canvas>
    <div class="v2-foreground-vignette"></div>
  `;
  atmosphere.appendChild(fxLayer);

  /* ===== 3. 首页注入随机「朝山意境禅语」与 InPeace 式声音开启引导 ===== */
  const landingContent = landing.querySelector(".landing-content");
  if (landingContent) {
    const quoteEl = document.createElement("p");
    quoteEl.className = "v2-hero-quote";
    quoteEl.id = "v2-hero-quote";
    const taglineEl = landingContent.querySelector(".tagline");
    if (taglineEl) taglineEl.insertAdjacentElement("afterend", quoteEl);

    const soundCue = document.createElement("button");
    soundCue.type = "button";
    soundCue.className = "v2-sound-cue";
    soundCue.id = "v2-sound-cue";
    soundCue.innerHTML = `<i class="v2-sound-waves"><span></span><span></span><span></span></i><em id="v2-sound-cue-text">建议开启声音 · 聆听古刹钟声与梵呗</em>`;
    const actionsEl = landingContent.querySelector(".landing-actions");
    if (actionsEl) actionsEl.insertAdjacentElement("afterend", soundCue);

    soundCue.addEventListener("click", () => {
      const musicBtn = document.querySelector('#overlay-music [data-music="0"]');
      if (musicBtn && !soundCue.classList.contains("is-playing")) {
        musicBtn.click();
        soundCue.classList.add("is-playing");
        updateDynamicTexts();
      } else {
        document.querySelector("#overlay-music")?.classList.add("is-open");
      }
    });
  }

  /* ===== 4. 暴露 Persepolis 式 WebGL 分形体积云雾穿门接口 ===== */
  window.JianshanMistTransition = function runMistTransition({ isGateEntry = false, preloadUrls = [], onMidpoint } = {}) {
    if (typeof window.JianshanWebGLMist === "function") {
      window.JianshanWebGLMist({
        isGateEntry,
        preloadUrls,
        quoteText: isGateEntry ? getSessionQuote(0) : "",
        onMidpoint,
      });
    } else if (typeof onMidpoint === "function") {
      onMidpoint();
    }
  };

  /* ===== 5. 注入 A/B 4K 山门一键切换胶囊 ===== */
  const switcher = document.createElement("div");
  switcher.className = "v2-gate-switcher";
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "4K 山门画卷切换");
  switcher.innerHTML = `
    <button type="button" data-gate-theme="cinema" class="is-on"><i class="dot"></i><span data-v2-gate="cinema">新 4K 大雄宝殿山门</span></button>
    <button type="button" data-gate-theme="classic"><i class="dot"></i><span data-v2-gate="classic">原 4K 经典山门</span></button>
  `;
  landing.appendChild(switcher);

  function updateDynamicTexts() {
    const lang = getLang();
    const quoteEl = document.querySelector("#v2-hero-quote");
    if (quoteEl) quoteEl.textContent = getSessionQuote(0);

    const cue = document.querySelector("#v2-sound-cue");
    const cueText = document.querySelector("#v2-sound-cue-text");
    if (cue && cueText) {
      const playing = cue.classList.contains("is-playing");
      if (lang === "en") {
        cueText.textContent = playing ? "Sanctuary sound on · Tap to adjust" : "Turn on sound · Temple bell & real chants";
      } else if (lang === "zh-Hant") {
        cueText.textContent = playing ? "清淨梵唄已開啟 · 點此調整" : "建議開啟聲音 · 聆聽古剎鐘聲與梵唄";
      } else {
        cueText.textContent = playing ? "清净梵呗已开启 · 点此调整" : "建议开启声音 · 聆听古刹钟声与梵呗";
      }
    }

    const labels = lang === "en"
      ? { cinema: "New 4K Mahāvīra Gate", classic: "Classic 4K Gate" }
      : lang === "zh-Hant"
        ? { cinema: "新 4K 大雄寶殿山門", classic: "原 4K 經典山門" }
        : { cinema: "新 4K 大雄宝殿山门", classic: "原 4K 经典山门" };
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

  window.addEventListener("chaoshan:lang", updateDynamicTexts);
  applyGateTheme(currentTheme);
  updateDynamicTexts();

  /* ===== 6. （云雾过场已由 WebGL 分形云引擎接管） ===== */

  /* ===== 7. 悬停「推开山门」按钮：联动暖金佛光、3D 镜头前推与粒子汇聚 ===== */
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

  /* ===== 8. 五层 3D 平滑阻尼景深 + 60fps Canvas 飘渺云絮 & 三层金光粒子 ===== */
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
  const mistPuffs = [];

  function createMistPuff(randomX = true) {
    const dir = Math.random() > 0.5 ? 1 : -1;
    return {
      x: randomX ? Math.random() * width : (dir > 0 ? -240 : width + 240),
      y: height * (0.28 + Math.random() * 0.62),
      rx: 150 + Math.random() * 220,
      ry: 46 + Math.random() * 72,
      vx: dir * (0.14 + Math.random() * 0.24),
      alpha: 0.045 + Math.random() * 0.065,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() > 0.65,
    };
  }

  function createParticle(layer, randomY = true) {
    if (layer === 0) {
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
      for (let i = 0; i < (isMobile ? 34 : 58); i++) particles.push(createParticle(0, true));
      for (let i = 0; i < (isMobile ? 16 : 28); i++) particles.push(createParticle(1, true));
      for (let i = 0; i < (isMobile ? 4 : 7); i++) particles.push(createParticle(2, true));
      for (let i = 0; i < (isMobile ? 7 : 12); i++) mistPuffs.push(createMistPuff(true));
    }
  }

  landing.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, width) - 0.5) * 2;
    targetY = (e.clientY / Math.max(1, height) - 0.5) * 2;
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

    // 3D 阻尼透视更新（远 / 中 / 近前景苍松 2.8× 速度差）
    const idleX = Math.sin(now * 0.00032) * 0.16;
    const idleY = Math.cos(now * 0.00025) * 0.1;
    curX += (targetX + idleX - curX) * 0.055;
    curY += (targetY + idleY - curY) * 0.055;

    atmosphere.style.setProperty("--v2-far-x", `${(-curX * 14).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-far-y", `${(-curY * 8).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-mid-x", `${(-curX * 24).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-mid-y", `${(-curY * 14).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-near-x", `${(curX * 42).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-near-y", `${(curY * 22).toFixed(2)}px`);
    atmosphere.style.setProperty("--v2-rot-y", `${(curX * 1.4).toFixed(2)}deg`);
    atmosphere.style.setProperty("--v2-rot-x", `${(-curY * 0.9).toFixed(2)}deg`);

    ctx.clearRect(0, 0, width, height);

    // 1. 极飘渺流动水墨云絮
    for (let i = 0; i < mistPuffs.length; i++) {
      const m = mistPuffs[i];
      m.x += m.vx;
      m.phase += 0.004;
      const yFloat = m.y + Math.sin(m.phase) * 10;
      if (m.x < -m.rx * 2 || m.x > width + m.rx * 2) {
        mistPuffs[i] = createMistPuff(false);
        continue;
      }
      ctx.save();
      ctx.translate(m.x + curX * 18, yFloat + curY * 10);
      ctx.scale(1, m.ry / m.rx);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, m.rx);
      const rgb = m.warm ? "246, 234, 206" : "212, 232, 232";
      grad.addColorStop(0, `rgba(${rgb}, ${m.alpha})`);
      grad.addColorStop(0.5, `rgba(${rgb}, ${m.alpha * 0.42})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, m.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 三层金光粒子
    const gateX = width * 0.5;
    const gateY = height * 0.43;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += p.speed;
      p.x += p.vx + Math.sin(p.phase) * (p.layer === 1 ? 0.24 : 0.09);
      p.y += p.vy * (ctaHover && p.layer === 1 ? 1.45 : 1);

      if (ctaHover && p.layer === 1) {
        p.x += (gateX - p.x) * 0.009;
        p.y += (gateY - p.y) * 0.006;
      }

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

      if (p.y < -p.r * 2 - 20 || p.x < -80 || p.x > width + 80) {
        particles[i] = createParticle(p.layer, false);
        continue;
      }

      const twinkle = 0.55 + 0.45 * Math.sin(p.phase * 1.4);
      const a = p.alpha * twinkle * (ctaHover ? 1.25 : 1);
      const pxOffset = p.layer === 0 ? -curX * 8 : p.layer === 1 ? curX * 16 : curX * 32;
      const pyOffset = p.layer === 0 ? -curY * 5 : p.layer === 1 ? curY * 10 : curY * 18;
      const drawX = p.x + pxOffset;
      const drawY = p.y + pyOffset;

      if (p.layer === 2) {
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 88%, 78%, ${a})`);
        grad.addColorStop(0.55, `hsla(${p.hue}, 80%, 62%, ${a * 0.4})`);
        grad.addColorStop(1, "hsla(42, 80%, 60%, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.layer === 1) {
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
        ctx.fillStyle = `hsla(${p.hue}, 90%, 84%, ${a})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(tick);
})();
