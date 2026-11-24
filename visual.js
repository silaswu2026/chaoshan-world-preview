(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "chaoshan-visual-v1";
  const defaults = { avatar: "qing", counts: { bow: 0, take: 0, offer: 0, chant: 0, muyu: 0, lamp: 0, plaque: 0 }, wish: "", incenseReady: false, incensePlaced: false };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { saved = {}; }
  const visual = {
    ...defaults,
    ...saved,
    counts: { ...defaults.counts, ...(saved.counts || {}) },
  };
  let navigating = false;
  let bubbleTimer = 0;
  let bubbleIndex = 0;
  let audioContext = null;
  let incensePlaying = false;
  let incenseTimers = [];

  const avatarNames = { qing: "清行", shao: "澄心", zhong: "静远", lao: "慧安" };
  const wishes = [
    "愿孩子静心向学，考试稳定发挥",
    "愿我学业精进，顺利通过考试",
    "愿工作顺遂，正财安稳，勤劳有获",
    "愿事业有进，所行向善，衣食无忧",
    "愿父母康健，家人平安，灯火可亲",
    "愿家人四季安康，出入平安",
    "为远方亲人祈福，愿平安自在",
    "愿故人离苦得乐，愿思念化作温柔",
  ];

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visual)); } catch (_) { /* 隐私模式下保持本次体验 */ }
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-show"), 2100);
  }

  function directScreen(name) {
    $$(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
    $$(".overlay").forEach((overlay) => overlay.classList.remove("is-open"));
  }

  function syncVisualGuest() {
    const name = ($("#guest-name").value || "清风").trim().slice(0, 8) || "清风";
    $("#guest-name").value = name;
    $("#hud-name").textContent = name;
    $("#card-guest").textContent = `香客 · ${name}`;
  }

  function enterWithGate(destination, mountain) {
    if (navigating) return;
    navigating = true;
    syncVisualGuest();
    const reduce = document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gate = $("#gate-transition");
    $("#lotus-loading").classList.remove("is-active");
    gate.classList.remove("is-opening");
    gate.classList.add("is-active");
    gate.setAttribute("aria-hidden", "false");
    $("#loading-label").textContent = destination === "avatar" ? "正在净手入场" : mountain ? "正在前往道场" : "正在展开朝山图";
    requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add("is-opening")));

    // 滚云最浓时在后台切换场景，云层散开后直接显现，避免硬切。
    setTimeout(() => {
      if (destination === "temple" && mountain) {
        const node = $(`.map-node[data-mountain="${mountain}"]`);
        if (node) node.click(); else directScreen("temple");
      } else {
        directScreen(destination);
      }
    }, reduce ? 40 : 820);

    setTimeout(() => {
      gate.classList.remove("is-active");
      gate.setAttribute("aria-hidden", "true");
      navigating = false;
      if (destination === "temple") startBubbles();
    }, reduce ? 120 : 1650);
  }

  function setAvatar(key, announce = false) {
    if (!avatarNames[key]) return;
    visual.avatar = key;
    const image = $("#avatar-image");
    image.classList.remove("is-ready");
    image.src = `./assets/avatar-${key}.webp?v=20261124-7`;
    image.srcset = `./assets/avatar-${key}.webp?v=20261124-7 1x, ./assets/@2x/avatar-${key}.webp?v=20261124-7 2x`;
    image.alt = `${avatarNames[key]}香客立绘`;
    $$("[data-avatar]").forEach((button) => button.classList.toggle("is-on", button.dataset.avatar === key));
    persist();
    if (announce) toast(`已选择香客 · ${avatarNames[key]}`);
  }

  function feedback(text) {
    const el = $("#ritual-feedback");
    el.textContent = text;
    el.classList.remove("is-playing");
    void el.offsetWidth;
    el.classList.add("is-playing");
  }

  function addBubble(text, name = "") {
    if (document.body.classList.contains("hide-wishes")) return;
    const box = $("#prayer-bubbles");
    const bubble = document.createElement("div");
    bubble.className = "prayer-bubble";
    const allNames = window.ChaoshanPrayerData?.names || ["清和", "静遥", "明心", "慧安", "云舒", "觉知"];
    const person = name || allNames[Math.floor(Math.random() * allNames.length)];
    const author = document.createElement("b");
    const content = document.createElement("span");
    author.textContent = person;
    content.textContent = text;
    bubble.append(author, content);
    bubble.style.left = `${12 + (bubbleIndex % 3) * 20}%`;
    bubble.style.top = `${39 + (bubbleIndex % 2) * 9}%`;
    bubbleIndex += 1;
    box.appendChild(bubble);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => bubble.remove(), 8200);
  }

  function startBubbles() {
    clearInterval(bubbleTimer);
    if (!$("#screen-temple").classList.contains("is-active")) return;
    addBubble(wishes[bubbleIndex % wishes.length]);
    bubbleTimer = setInterval(() => {
      if (document.hidden || !$("#screen-temple").classList.contains("is-active")) return;
      addBubble(wishes[bubbleIndex % wishes.length]);
    }, 4600);
  }

  function playWoodfish() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioContext ||= new AudioCtor();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(210, now);
      oscillator.frequency.exponentialRampToValueAtTime(78, now + 0.09);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.17);
    } catch (_) { /* 无音频权限时保留视觉反馈 */ }
  }

  function openPlaque() {
    const seals = $$("#hud-seals .seal.is-on").length;
    $("#ritual-title").textContent = "四山佛牌";
    $("#ritual-card-mark").textContent = seals === 4 ? "圆" : "愿";
    $("#ritual-description").textContent = seals === 4
      ? "四山香印已齐。此牌记录本次朝山圆满，愿文仅保存于本机。"
      : `已点亮 ${seals} / 4 枚香印。可写下心愿，随朝山进度留存佛牌。`;
    $("#ritual-wish").value = visual.wish || $("#local-wish").value || "";
    $("#overlay-ritual").classList.add("is-open");
  }

  function startIncenseAnimation(action) {
    if (incensePlaying) return;
    if (action === "offer" && !visual.incenseReady && !visual.incensePlaced) {
      toast("请先请香，再上香");
      return;
    }
    incensePlaying = true;
    incenseTimers.forEach(clearTimeout);
    incenseTimers = [];
    const rite = $("#incense-rite");
    const caption = $("#incense-rite-caption");
    const buttons = $$('[data-ritual="take"], [data-ritual="offer"]');
    const reduce = document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    buttons.forEach((button) => { button.disabled = true; });
    rite.setAttribute("aria-hidden", "false");
    caption.textContent = "取香";
    rite.classList.remove("is-playing");
    void rite.offsetWidth;
    rite.classList.add("is-playing");
    if (action === "take") {
      visual.counts.take += 1;
      visual.incenseReady = true;
      persist();
    }

    const captions = reduce ? [[0, "香云供养"]] : [[850, "烛火点香"], [1750, "恭敬上香"], [2500, "香云供养"]];
    captions.forEach(([delay, text]) => incenseTimers.push(setTimeout(() => { caption.textContent = text; }, delay)));
    incenseTimers.push(setTimeout(() => {
      rite.classList.remove("is-playing");
      rite.setAttribute("aria-hidden", "true");
      visual.incenseReady = false;
      visual.incensePlaced = true;
      visual.counts.offer += 1;
      persist();
      $("#placed-incense").classList.add("is-offered");
      $("#incense-smoke").classList.add("is-offered");
      buttons.forEach((button) => { button.disabled = false; });
      incensePlaying = false;
      feedback("香云供养");
      toast("清香已奉上 · 愿心有所归");
    }, reduce ? 120 : 2900));
  }

  function performRitual(action) {
    if (action === "beads") {
      $("#btn-beads").click();
      feedback("念珠 +1");
      return;
    }
    if (action === "plaque") {
      openPlaque();
      return;
    }
    if (action === "take" || action === "offer") {
      startIncenseAnimation(action);
      return;
    }
    const responses = {
      bow: ["一心顶礼", "合十礼拜，愿心无散乱"],
      chant: ["南无阿弥陀佛", "念佛一声，功德随喜"],
      muyu: ["木鱼 · 一声", "木鱼轻鸣，收摄身心"],
      lamp: ["供灯一盏", "心灯已点亮，愿智慧光明"],
    };
    const response = responses[action];
    if (!response) return;
    if (action === "lamp") $(".candle-flames").classList.add("is-lamp");
    if (action === "muyu") playWoodfish();
    visual.counts[action] = (visual.counts[action] || 0) + 1;
    persist();
    feedback(response[0]);
    toast(response[1]);
    if (action === "chant" || action === "lamp") addBubble(action === "chant" ? "南无阿弥陀佛" : "愿智慧光明");
  }

  document.addEventListener("click", (event) => {
    const enterAvatar = event.target.closest("#screen-landing [data-go='avatar']");
    const enterMap = event.target.closest("#btn-enter-gate");
    const mountainCard = event.target.closest("[data-visual-mountain]");
    if (enterAvatar || enterMap || mountainCard) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (mountainCard) enterWithGate("temple", mountainCard.dataset.visualMountain);
      else enterWithGate(enterAvatar ? "avatar" : "map");
    }
  }, true);

  document.addEventListener("click", (event) => {
    const avatar = event.target.closest("[data-avatar]");
    if (avatar) setAvatar(avatar.dataset.avatar, true);

    const ritual = event.target.closest("[data-ritual]");
    if (ritual) performRitual(ritual.dataset.ritual);

    const toggle = event.target.closest("[data-toggle]");
    if (toggle) {
      if (toggle.dataset.toggle === "reduce-motion") document.body.classList.toggle("reduce-motion", toggle.classList.contains("is-on"));
      if (toggle.dataset.toggle === "hide-wishes") document.body.classList.toggle("hide-wishes", toggle.classList.contains("is-on"));
    }
    if (event.target.closest("[data-go='temple'], .map-node")) setTimeout(startBubbles, 50);
  });

  $("#btn-save-ritual").addEventListener("click", () => {
    visual.wish = $("#ritual-wish").value.trim().slice(0, 40);
    visual.counts.plaque += 1;
    $("#local-wish").value = visual.wish;
    persist();
    $("#overlay-ritual").classList.remove("is-open");
    feedback("心愿留存");
    if (visual.wish) addBubble(visual.wish, $("#hud-name").textContent || "清心");
    toast("愿文已保存于本机");
  });

  $("#guest-name").addEventListener("change", syncVisualGuest);
  $("#local-wish").addEventListener("change", (event) => {
    visual.wish = event.target.value.trim().slice(0, 40);
    persist();
  });
  $("#avatar-image").addEventListener("load", (event) => event.target.classList.add("is-ready"));

  let parallaxFrame = 0;
  $("#temple-scene").addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || document.body.classList.contains("reduce-motion")) return;
    if (parallaxFrame) return;
    parallaxFrame = requestAnimationFrame(() => {
      const x = (event.clientX / innerWidth - 0.5) * -7;
      const y = (event.clientY / innerHeight - 0.5) * -4;
      $(".temple-art").style.translate = `${x}px ${y}px`;
      parallaxFrame = 0;
    });
  });
  $("#temple-scene").addEventListener("pointerleave", () => { $(".temple-art").style.translate = "0 0"; });

  const landingScreen = $("#screen-landing");
  const landingAtmosphere = $(".hero-atmosphere", landingScreen);
  let landingParallaxFrame = 0;
  function resetLandingParallax() {
    ["--far-x", "--far-y", "--near-x", "--near-y"].forEach((name) => landingAtmosphere.style.setProperty(name, "0px"));
  }
  landingScreen.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || document.body.classList.contains("reduce-motion") || landingParallaxFrame) return;
    landingParallaxFrame = requestAnimationFrame(() => {
      const x = event.clientX / innerWidth - 0.5;
      const y = event.clientY / innerHeight - 0.5;
      landingAtmosphere.style.setProperty("--far-x", `${x * -5}px`);
      landingAtmosphere.style.setProperty("--far-y", `${y * -3}px`);
      landingAtmosphere.style.setProperty("--near-x", `${x * 11}px`);
      landingAtmosphere.style.setProperty("--near-y", `${y * 6}px`);
      landingParallaxFrame = 0;
    });
  });
  landingScreen.addEventListener("pointerleave", resetLandingParallax);
  document.addEventListener("visibilitychange", () => document.body.classList.toggle("is-hidden", document.hidden));

  window.addEventListener("chaoshan:sync", (event) => {
    Object.assign(visual, event.detail?.patch || {});
    persist();
  });

  window.ChaoshanPrayer = addBubble;

  window.addEventListener("chaoshan:count", (event) => {
    const key = event.detail?.key;
    if (!key) return;
    visual.counts[key] = (visual.counts[key] || 0) + 1;
    persist();
  });

  setAvatar(avatarNames[visual.avatar] ? visual.avatar : "qing");
  $("#local-wish").value = visual.wish || "";
  if (visual.incensePlaced) {
    $("#placed-incense").classList.add("is-offered");
    $("#incense-smoke").classList.add("is-offered");
  }
  if ($("#avatar-image").complete) $("#avatar-image").classList.add("is-ready");
})();
