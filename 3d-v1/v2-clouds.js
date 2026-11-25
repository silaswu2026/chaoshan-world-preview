(() => {
  "use strict";

  /**
   * 见山 · 朝山 写实云雾 Loading 引擎（即时装载 + 金色莲光 Loading + 每次随机佛学启示）
   * - 云雾即是 Loading 本身：点击瞬间进入云雾 + 金色莲光进度 + 随机佛学启示
   * - 后台真实预加载并 decode 目标 4K 资源，一旦装载完成立即淡出显现画面，绝不空等拖沓
   */

  const app = document.querySelector("#app");
  if (!app) return;

  const ENLIGHTENMENT_QUOTES = [
    {
      "zh-Hans": "应无所住，而生其心。——《金刚经》",
      "zh-Hant": "應無所住，而生其心。——《金剛經》",
      en: "Awaken a mind that abides nowhere. — Diamond Sutra",
    },
    {
      "zh-Hans": "心无挂碍，无挂碍故，无有恐怖。——《心经》",
      "zh-Hant": "心無掛礙，無掛礙故，無有恐怖。——《心經》",
      en: "With no hindrance in the mind, there is no fear. — Heart Sutra",
    },
    {
      "zh-Hans": "步步登高，是为放下；一念朝山，即是见佛。",
      "zh-Hant": "步步登高，是為放下；一念朝山，即是見佛。",
      en: "Every step upward is a letting go; one sincere turning is to meet the Buddha.",
    },
    {
      "zh-Hans": "若见诸相非相，即见如来。——《金刚经》",
      "zh-Hant": "若見諸相非相，即見如來。——《金剛經》",
      en: "When you see that all forms are not fixed forms, you see the Tathāgata. — Diamond Sutra",
    },
    {
      "zh-Hans": "山在云外，佛在心中；循香而上，与清净重逢。",
      "zh-Hant": "山在雲外，佛在心中；循香而上，與清淨重逢。",
      en: "Beyond the clouds lies the mountain; within stillness dwells the awakened heart.",
    },
    {
      "zh-Hans": "不忘初心，方得始终。——《华严经》",
      "zh-Hant": "不忘初心，方得始終。——《華嚴經》",
      en: "Never forget your original vow, and you shall reach fulfillment. — Avatamsaka Sutra",
    },
    {
      "zh-Hans": "春有百花秋有月，若无闲事挂心头，便是人间好时节。",
      "zh-Hant": "春有百花秋有月，若無閒事掛心頭，便是人間好時節。",
      en: "If no idle worry clouds the mind, every season is the finest season.",
    },
    {
      "zh-Hans": "慈心遍照，如母护独子。——《法句经》",
      "zh-Hant": "慈心遍照，如母護獨子。——《法句經》",
      en: "Radiate boundless compassion, as a mother guards her only child. — Dhammapada",
    },
    {
      "zh-Hans": "上山朝佛，下山见己。",
      "zh-Hant": "上山朝佛，下山見己。",
      en: "Ascend to bow before the Buddha; return to see yourself.",
    },
    {
      "zh-Hans": "一切有为法，如梦幻泡影，如露亦如电，应作如是观。——《金刚经》",
      "zh-Hant": "一切有為法，如夢幻泡影，如露亦如電，應作如是觀。——《金剛經》",
      en: "All conditioned things are like a dream, a dewdrop, a flash of lightning. — Diamond Sutra",
    },
  ];

  let lastQuoteIdx = -1;
  function pickRandomQuote() {
    let idx = Math.floor(Math.random() * ENLIGHTENMENT_QUOTES.length);
    if (idx === lastQuoteIdx) idx = (idx + 1) % ENLIGHTENMENT_QUOTES.length;
    lastQuoteIdx = idx;
    const lang = getLang();
    return ENLIGHTENMENT_QUOTES[idx][lang] || ENLIGHTENMENT_QUOTES[idx]["zh-Hans"];
  }

  const stage = document.createElement("div");
  stage.className = "v2-photo-mist";
  stage.id = "v2-photo-mist";
  stage.setAttribute("aria-hidden", "true");
  stage.innerHTML = `
    <div class="v2-pm-backdrop"></div>
    <div class="v2-pm-layer v2-pm-far"></div>
    <div class="v2-pm-layer v2-pm-mid-left"></div>
    <div class="v2-pm-layer v2-pm-mid-right"></div>
    <div class="v2-pm-layer v2-pm-front"></div>
    <div class="v2-pm-glow"></div>
    <div class="v2-pm-copy" id="v2-pm-copy">
      <div class="v2-gold-lotus-loader" id="v2-gold-lotus-loader" aria-hidden="true">
        <span class="v2-gl-ring"></span>
        <span class="v2-gl-ring is-inner"></span>
        <b class="v2-gl-core"></b>
      </div>
      <small id="v2-wm-sub">见 山 · 朝 山</small>
      <p id="v2-wm-quote"></p>
      <div class="v2-wm-loader" id="v2-wm-loader"><i></i></div>
    </div>
  `;
  app.appendChild(stage);

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
    return Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, timeoutMs))]);
  }

  function getLang() {
    const l = document.documentElement.lang || "zh-Hans";
    return l === "en" || l === "zh-Hant" ? l : "zh-Hans";
  }

  let busy = false;

  /**
   * 1. 首屏 Loading：云雾 + 金色莲灯 Loading -> 4K 山门装载解码完成即刻淡出
   */
  function runInitialReveal() {
    const reduce = document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const isPortraitMobile = window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
    const theme = document.querySelector("#screen-landing")?.dataset.gateTheme || "cinema";
    const heroUrl = theme === "classic"
      ? "./assets/scene-gate-4k-classic.jpg?v=20261125-v2-17"
      : isPortraitMobile
        ? "./assets/scene-gate-4k-cinema-mobile.jpg?v=20261125-v2-17"
        : "./assets/scene-gate-4k-cinema.jpg?v=20261125-v2-17";

    const lang = getLang();
    const subEl = document.querySelector("#v2-wm-sub");
    const quoteEl = document.querySelector("#v2-wm-quote");
    if (subEl) subEl.textContent = lang === "en" ? "LOADING SACRED GATE" : "云 雾 启 程 · 静 候 山 门";
    if (quoteEl) quoteEl.textContent = pickRandomQuote();

    stage.classList.add("is-active", "is-in", "is-copy-show");
    stage.setAttribute("aria-hidden", "false");

    const minFrame = new Promise((r) => setTimeout(r, 420));
    Promise.all([preloadImages([heroUrl], 3600), minFrame]).then(() => {
      stage.classList.remove("is-copy-show");
      stage.classList.add("is-out");
      setTimeout(() => {
        stage.classList.remove("is-active", "is-in", "is-out");
        stage.setAttribute("aria-hidden", "true");
      }, 850);
    });
  }

  /**
   * 2. 切屏 Loading：点击即刻进入云雾 + 金色 Loading + 随机佛学启示 -> 装载完成后立刻切换并淡出
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

    if (subEl) {
      subEl.textContent = lang === "en"
        ? (isGateEntry ? "OPENING THE MOUNTAIN GATE" : "ENTERING THE SANCTUARY")
        : lang === "zh-Hant"
          ? (isGateEntry ? "推 開 山 門 · 載 入 聖 境" : "雲 霧 載 入 · 前 往 道 場")
          : (isGateEntry ? "推 开 山 门 · 载 入 圣 境" : "云 雾 载 入 · 前 往 道 场");
    }
    // 每次切换均呈现一句随机佛学启示短句
    if (quoteEl) quoteEl.textContent = quoteText || pickRandomQuote();

    if (isGateEntry && landing) landing.classList.add("is-entering-3d");

    stage.classList.toggle("is-quick", !isGateEntry);
    stage.classList.remove("is-out", "is-copy-show");
    stage.classList.add("is-active");
    stage.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      stage.classList.add("is-in", "is-copy-show");
    }));

    // 点击后立刻启动真实预加载，只保留极短的淡入保护时间（不装载完再拖延！）
    const minVisual = new Promise((r) => setTimeout(r, isGateEntry ? 650 : 380));
    const preloadPromise = preloadImages(preloadUrls, 4000);

    Promise.all([minVisual, preloadPromise]).then(() => {
      if (typeof onMidpoint === "function") onMidpoint();
      if (landing) landing.classList.remove("is-entering-3d");

      // 装载完成即刻淡出显现目标画面
      requestAnimationFrame(() => {
        stage.classList.remove("is-copy-show");
        stage.classList.add("is-out");
        setTimeout(() => {
          stage.classList.remove("is-active", "is-in", "is-out", "is-quick");
          stage.setAttribute("aria-hidden", "true");
          busy = false;
        }, isGateEntry ? 780 : 520);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(runInitialReveal, 16));
  } else {
    setTimeout(runInitialReveal, 16);
  }
})();
