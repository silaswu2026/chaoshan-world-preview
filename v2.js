(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const PREF_KEY = "jianshan-v2-prefs";

  let prefs = { quiet: false, lang: "" };
  try {
    prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch (_) { /* ignore */ }

  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) { /* ignore */ }
  }

  /* ===== 1. 古刹铜钟音效（Web Audio API 零外部依赖） ===== */
  let bellCtx = null;
  function playTempleBell() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      bellCtx ||= new AudioCtor();
      if (bellCtx.state === "suspended") bellCtx.resume().catch(() => {});
      const now = bellCtx.currentTime;
      const partials = [
        { freq: 146.8, gain: 0.18, decay: 4.2 }, // D3 基频
        { freq: 293.7, gain: 0.11, decay: 3.4 }, // 八度泛音
        { freq: 440.0, gain: 0.06, decay: 2.5 }, // 五度泛音
        { freq: 587.3, gain: 0.035, decay: 1.8 }, // 铜鸣
      ];
      partials.forEach(({ freq, gain, decay }) => {
        const osc = bellCtx.createOscillator();
        const g = bellCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.996, now + decay);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        osc.connect(g).connect(bellCtx.destination);
        osc.start(now);
        osc.stop(now + decay + 0.08);
      });
    } catch (_) { /* 静音设备静默降级 */ }
  }

  /* ===== 2. V2 三语字典（EN / 简 / 繁） ===== */
  const V2_I18N = {
    "zh-Hans": {
      brandMain: "见山",
      brandSub: "JIANSHAN",
      navAbout: "关于",
      navLearn: "佛学学习",
      navChaoshan: "朝山",
      navStore: "请佛物",
      navEvents: "最新活动",
      sound: "清音",
      eyebrow: "云 雾 之 间 · 心 有 所 向",
      heroTitle: "朝山",
      tagline: "一支香，四座山。",
      enterGateMain: "推开山门",
      entryHint: "免注册 · 免费 · 仅存本机",
      mapBackGate: "山门",
      mapProfile: "香客档案",
      quietOff: "清净模式",
      quietOn: "已清净",
      dockTitle: "朝山净境 · 直达入口",
      dockHint: "点选四山入殿，或前往净境静修",
      realmMeditation: "静心冥想",
      realmMeditationSub: "真实梵呗 · 呼吸凝神",
      realmLamp: "心灯祈福",
      realmLampSub: "点亮心灯 · 留存愿牌",
      realmPureland: "追思与极乐",
      realmPurelandSub: "莲位清供 · 温情陪伴",
      realmGuidance: "解惑殿",
      realmGuidanceSub: "佛学开示 · 经义启明",
      onlineSuffix: "位同修在线",
      quietToastOn: "已开启清净模式 · 隐藏飘屏与同修动态",
      quietToastOff: "已恢复同修人气与飘屏氛围",
    },
    "zh-Hant": {
      brandMain: "見山",
      brandSub: "JIANSHAN",
      navAbout: "關於",
      navLearn: "佛學學習",
      navChaoshan: "朝山",
      navStore: "請佛物",
      navEvents: "最新活動",
      sound: "清音",
      eyebrow: "雲 霧 之 間 · 心 有 所 向",
      heroTitle: "朝山",
      tagline: "一支香，四座山。",
      enterGateMain: "推開山門",
      entryHint: "免註冊 · 免費 · 僅存本機",
      mapBackGate: "山門",
      mapProfile: "香客檔案",
      quietOff: "清淨模式",
      quietOn: "已清淨",
      dockTitle: "朝山淨境 · 直達入口",
      dockHint: "點選四山入殿，或前往淨境靜修",
      realmMeditation: "靜心冥想",
      realmMeditationSub: "真實梵唄 · 呼吸凝神",
      realmLamp: "心燈祈福",
      realmLampSub: "點亮心燈 · 留存願牌",
      realmPureland: "追思與極樂",
      realmPurelandSub: "蓮位清供 · 溫情陪伴",
      realmGuidance: "解惑殿",
      realmGuidanceSub: "佛學開示 · 經義啟明",
      onlineSuffix: "位同修在線",
      quietToastOn: "已開啟清淨模式 · 隱藏飄屏與同修動態",
      quietToastOff: "已恢復同修人氣與飄屏氛圍",
    },
    en: {
      brandMain: "Jianshan",
      brandSub: "SEEING",
      navAbout: "About",
      navLearn: "Learn",
      navChaoshan: "Chaoshan",
      navStore: "Objects",
      navEvents: "Events",
      sound: "Sound",
      eyebrow: "AMID THE MIST · THE HEART FINDS ITS WAY",
      heroTitle: "CHAOSHAN",
      tagline: "One Incense, Four Sacred Mountains.",
      enterGateMain: "Enter the Gate",
      entryHint: "No Sign-up · Free · Private on Your Device",
      mapBackGate: "Gate",
      mapProfile: "Pilgrim",
      quietOff: "Quiet Mode",
      quietOn: "Quiet On",
      dockTitle: "SACRED SANCTUARIES",
      dockHint: "Choose a mountain hall above or enter a sanctuary below",
      realmMeditation: "Meditation",
      realmMeditationSub: "Real Chants · Mindful Breath",
      realmLamp: "Heart Lamp",
      realmLampSub: "Light a Lamp · Wish Plaques",
      realmPureland: "Remembrance",
      realmPurelandSub: "Lotus Altar · Pure Land",
      realmGuidance: "Guidance",
      realmGuidanceSub: "Buddhist Wisdom & Reflection",
      onlineSuffix: "Pilgrims Online",
      quietToastOn: "Quiet Mode enabled — floating wishes & presence hidden",
      quietToastOff: "Community presence & floating wishes restored",
    },
  };

  function currentLang() {
    const lang = document.documentElement.lang || "zh-Hans";
    return V2_I18N[lang] ? lang : "zh-Hans";
  }

  function applyV2Language(lang) {
    const dict = V2_I18N[lang] || V2_I18N["zh-Hans"];
    $$("[data-v2-i18n]").forEach((el) => {
      const key = el.getAttribute("data-v2-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    updateQuietButtons();
    prefs.lang = lang;
    savePrefs();
  }

  /* ===== 3. 一键「清净模式」 ===== */
  function updateQuietButtons() {
    const dict = V2_I18N[currentLang()];
    $$("[data-v2-quiet]").forEach((btn) => {
      btn.classList.toggle("is-on", prefs.quiet);
      btn.setAttribute("aria-pressed", String(prefs.quiet));
      const label = btn.querySelector("span") || btn;
      label.textContent = prefs.quiet ? dict.quietOn : dict.quietOff;
    });
  }

  function applyQuietMode(silent = false) {
    document.body.classList.toggle("quiet-mode", prefs.quiet);
    document.body.classList.toggle("hide-wishes", prefs.quiet);
    updateQuietButtons();
    if (!silent) {
      const dict = V2_I18N[currentLang()];
      const toastEl = $("#toast");
      if (toastEl) {
        toastEl.textContent = prefs.quiet ? dict.quietToastOn : dict.quietToastOff;
        toastEl.classList.add("is-show");
        clearTimeout(applyQuietMode._t);
        applyQuietMode._t = setTimeout(() => toastEl.classList.remove("is-show"), 2200);
      }
    }
  }

  /* ===== 4. 见山 5 柱导航跳转逻辑 ===== */
  function openCultureSection(page) {
    const trigger = document.querySelector('[data-world-open="culture"]');
    if (trigger) {
      trigger.click();
    } else {
      $("#overlay-world-culture")?.classList.add("is-open");
    }
    setTimeout(() => {
      const tab = $(`#overlay-world-culture [data-culture-page="${page}"]`);
      if (tab) tab.click();
    }, 120);
  }

  function triggerEnterChaoshan() {
    playTempleBell();
    // 若用户未静音且尚未开启佛音，点击推开山门时可轻柔淡入清净佛音（InPeace 式体验）
    const cue = document.querySelector("#v2-sound-cue");
    if (cue && !cue.classList.contains("is-playing")) {
      const musicBtn = document.querySelector('#overlay-music [data-music="0"]');
      if (musicBtn) {
        musicBtn.click();
        cue.classList.add("is-playing");
        window.dispatchEvent(new CustomEvent("chaoshan:lang", { detail: { lang: currentLang() } }));
      }
    }
    const isPortraitMobile = window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
    const panoramaUrl = isPortraitMobile
      ? "./assets/world-panorama-4k-mobile.jpg?v=20261125-v2-7"
      : "./assets/world-panorama-4k.jpg?v=20261125-v2-7";
    const enterMapDirect = () => {
      $$(".overlay").forEach((o) => o.classList.remove("is-open"));
      $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === "map"));
      syncOnlineCount();
    };
    if (typeof window.JianshanMistTransition === "function") {
      window.JianshanMistTransition({
        isGateEntry: true,
        preloadUrls: [panoramaUrl],
        onMidpoint: enterMapDirect,
      });
    } else {
      enterMapDirect();
    }
  }

  document.addEventListener("click", (event) => {
    const navBtn = event.target.closest("[data-jianshan-nav]");
    if (navBtn) {
      const target = navBtn.dataset.jianshanNav;
      if (target === "chaoshan") {
        if ($("#screen-landing")?.classList.contains("is-active")) {
          triggerEnterChaoshan();
        } else {
          $$(".overlay").forEach((o) => o.classList.remove("is-open"));
          $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === "map"));
        }
      } else if (target === "store") {
        document.querySelector('[data-world-open="store"]')?.click();
      } else if (target === "about" || target === "learn" || target === "events") {
        openCultureSection(target);
      }
      return;
    }

    const enterV2 = event.target.closest("#btn-v2-enter-gate");
    if (enterV2) {
      event.preventDefault();
      event.stopImmediatePropagation();
      triggerEnterChaoshan();
      return;
    }

    const quietBtn = event.target.closest("[data-v2-quiet]");
    if (quietBtn) {
      prefs.quiet = !prefs.quiet;
      savePrefs();
      applyQuietMode(false);
      return;
    }

    const soundBtn = event.target.closest("[data-v2-sound]");
    if (soundBtn) {
      $("#overlay-music")?.classList.add("is-open");
      return;
    }

    const profileBtn = event.target.closest("[data-v2-profile]");
    if (profileBtn) {
      $$(".overlay").forEach((o) => o.classList.remove("is-open"));
      $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === "avatar"));
      return;
    }

    // 在朝山世界全景点击四大道场节点时，走轻盈 WebGL 云雾缭绕 + 预加载大殿原画
    const mapNode = event.target.closest("#screen-map .map-node");
    if (mapNode && !mapNode.dataset.v2Bypass && typeof window.JianshanWebGLMist === "function") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const m = mapNode.dataset.mountain || "gate";
      const imgMap = {
        putuo: "./assets/scene-putuo.webp?v=20261124-7",
        wutai: "./assets/scene-wutai.webp?v=20261124-7",
        emei: "./assets/scene-emei.webp?v=20261124-7",
        jiuhua: "./assets/scene-jiuhua.webp?v=20261124-7",
        gate: "./assets/scene-hall.webp?v=20261124-7",
      };
      window.JianshanWebGLMist({
        isGateEntry: false,
        preloadUrls: imgMap[m] ? [imgMap[m]] : [],
        onMidpoint: () => {
          mapNode.dataset.v2Bypass = "1";
          mapNode.click();
          delete mapNode.dataset.v2Bypass;
        },
      });
      return;
    }
  }, true);

  window.addEventListener("chaoshan:lang", (event) => {
    applyV2Language(event.detail?.lang || currentLang());
  });

  /* ===== 5. 同步在线人数到朝山世界顶栏 ===== */
  function syncOnlineCount() {
    const src = $("#map-online") || $("#landing-online");
    const dst = $("#v2-map-online-num");
    if (src && dst) {
      const num = (src.textContent || "1,286").replace(/[^\d,]/g, "") || "1,286";
      dst.textContent = num;
    }
  }

  /* ===== 6. 初始化 ===== */
  applyQuietMode(true);
  applyV2Language(currentLang());
  setTimeout(syncOnlineCount, 300);
})();
