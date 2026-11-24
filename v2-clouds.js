(() => {
  "use strict";

  /**
   * 见山 · 朝山 写实摄影云海过场引擎（Cinema VFX 多层真实云雾合成）
   * - 使用真实摄影质感黑底云雾素材 + screen 滤色多层合成，彻底告别数学噪波和 CSS 椭圆色块
   * - 支持「云雾柔缓淡进 -> 等目标 4K 场景真正加载并 decode 完成 -> 拨云淡出」
   */

  const app = document.querySelector("#app");
  if (!app) return;

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
   * 1. 首屏：写实云海承接 -> 等待 4K 山门真正解码完成 -> 云雾柔和淡出散开
   */
  function runInitialReveal() {
    const reduce = document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const isPortraitMobile = window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
    const theme = document.querySelector("#screen-landing")?.dataset.gateTheme || "cinema";
    const heroUrl = theme === "classic"
      ? "./assets/scene-gate-4k-classic.jpg?v=20261125-v2-9"
      : isPortraitMobile
        ? "./assets/scene-gate-4k-cinema-mobile.jpg?v=20261125-v2-9"
        : "./assets/scene-gate-4k-cinema.jpg?v=20261125-v2-9";

    const lang = getLang();
    const subEl = document.querySelector("#v2-wm-sub");
    const quoteEl = document.querySelector("#v2-wm-quote");
    const loaderEl = document.querySelector("#v2-wm-loader");
    if (subEl) subEl.textContent = lang === "en" ? "JIANSHAN · CHAOSHAN" : "见 山 · 朝 山";
    if (quoteEl) quoteEl.textContent = document.querySelector("#v2-hero-quote")?.textContent || "";
    if (loaderEl) loaderEl.style.display = "block";

    stage.classList.add("is-active", "is-in", "is-copy-show");
    stage.setAttribute("aria-hidden", "false");

    const minShow = new Promise((r) => setTimeout(r, 950));
    Promise.all([preloadImages([heroUrl, "./assets/vfx-cloud-billow.jpg?v=20261125-v2-9", "./assets/vfx-cloud-wisp.jpg?v=20261125-v2-9"], 4200), minShow]).then(() => {
      if (loaderEl) loaderEl.style.display = "none";
      stage.classList.remove("is-copy-show");
      stage.classList.add("is-out");
      setTimeout(() => {
        stage.classList.remove("is-active", "is-in", "is-out");
        stage.setAttribute("aria-hidden", "true");
      }, 1250);
    });
  }

  /**
   * 2. 穿门 / 切换场景：写实云雾淡进 -> 等目标 4K 画面装载完成 -> 拨云淡出
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

    if (isGateEntry && landing) landing.classList.add("is-entering-3d");

    stage.classList.toggle("is-quick", !isGateEntry);
    stage.classList.remove("is-out", "is-copy-show");
    stage.classList.add("is-active");
    stage.setAttribute("aria-hidden", "false");
    // 下一帧触发平滑淡进
    requestAnimationFrame(() => requestAnimationFrame(() => {
      stage.classList.add("is-in");
      if (quoteText) stage.classList.add("is-copy-show");
    }));

    const fadeInTime = new Promise((r) => setTimeout(r, isGateEntry ? 1100 : 480));
    const preloadPromise = preloadImages(preloadUrls, 4500);

    Promise.all([fadeInTime, preloadPromise]).then(() => {
      if (typeof onMidpoint === "function") onMidpoint();
      if (landing) landing.classList.remove("is-entering-3d");
      if (loaderEl) loaderEl.style.display = "none";

      setTimeout(() => {
        stage.classList.remove("is-copy-show");
        stage.classList.add("is-out");
        setTimeout(() => {
          stage.classList.remove("is-active", "is-in", "is-out", "is-quick");
          stage.setAttribute("aria-hidden", "true");
          busy = false;
        }, isGateEntry ? 1200 : 620);
      }, isGateEntry ? 480 : 120);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(runInitialReveal, 20));
  } else {
    setTimeout(runInitialReveal, 20);
  }
})();
