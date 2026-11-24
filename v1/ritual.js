(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const KEY = "chaoshan-ritual-v1";
  const defaults = { music: 0, volume: 0.45, coins: 108, memorial: { name: "", message: "", offering: "lotus" } };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { saved = {}; }
  const ritual = { ...defaults, ...saved, memorial: { ...defaults.memorial, ...(saved.memorial || {}) } };
  let bowing = false;
  let autoBeads = false;
  let beadTimer = 0;
  let beadRotation = 0;
  let allowOriginalBead = false;
  let offering = ritual.memorial.offering;

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(ritual)); } catch (_) { /* 保持临时体验 */ }
  }
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-show"), 2200);
  }
  function feedback(text) {
    const el = $("#ritual-feedback");
    el.textContent = text;
    el.classList.remove("is-playing");
    void el.offsetWidth;
    el.classList.add("is-playing");
  }
  function bumpVisualCount(key) {
    window.dispatchEvent(new CustomEvent("chaoshan:count", { detail: { key } }));
  }
  function open(selector) { $(selector).classList.add("is-open"); }
  function close(selector) { $(selector).classList.remove("is-open"); }
  function addBubble(text) {
    if (window.ChaoshanPrayer) { window.ChaoshanPrayer(text); return; }
    const box = $("#prayer-bubbles");
    if (!box || document.body.classList.contains("hide-wishes")) return;
    const bubble = document.createElement("div");
    bubble.className = "prayer-bubble";
    bubble.textContent = text;
    bubble.style.left = "18%";
    bubble.style.top = "42%";
    box.appendChild(bubble);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => bubble.remove(), 8200);
  }

  // 真实佛音录音：用户点击后播放，不在刷新或进入页面时自动响起。
  const TRACKS = [
    { name: "般若波罗蜜多心经", src: "./assets/audio/heart-sutra.mp3" },
    { name: "大悲咒", src: "./assets/audio/great-compassion.mp3" },
    { name: "六字真言", src: "./assets/audio/six-syllable.mp3" },
  ];
  const audio = { element: new Audio(), playing: false };
  audio.element.preload = "none";
  audio.element.loop = true;
  audio.element.volume = 0.32 * ritual.volume;

  async function startMusic(index, force = false) {
    if (!TRACKS[index]) return;
    if (!force && audio.playing && ritual.music === index) { stopMusic(); return; }
    ritual.music = index;
    audio.element.pause();
    audio.element.src = TRACKS[index].src;
    audio.element.volume = 0.32 * ritual.volume;
    try {
      await audio.element.play();
      audio.playing = true;
      persist();
      updateMusicUI();
    } catch (_) {
      audio.playing = false;
      updateMusicUI();
      toast("佛音未能播放，请检查网络后再次点击");
    }
  }
  function stopMusic() {
    audio.element.pause();
    audio.element.currentTime = 0;
    audio.playing = false;
    updateMusicUI();
  }
  function updateMusicUI() {
    $("#btn-music").classList.toggle("is-playing", audio.playing);
    $("#btn-music span").textContent = audio.playing ? TRACKS[ritual.music].name : "清音";
    $$("[data-music]").forEach((button) => {
      const on = audio.playing && Number(button.dataset.music) === ritual.music;
      button.classList.toggle("is-on", on);
      $("i", button).textContent = on ? "播放中" : "播放";
    });
  }

  function speak(kind) {
    if (!("speechSynthesis" in window)) { toast("当前设备不支持语音诵读"); return; }
    speechSynthesis.cancel();
    const text = kind === "diamond"
      ? "《金刚经》节选。应无所住而生其心。一切有为法，如梦幻泡影，如露亦如电，应作如是观。"
      : "南无阿弥陀佛。南无阿弥陀佛。南无阿弥陀佛。";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = kind === "diamond" ? 0.78 : 0.72;
    utterance.pitch = 0.9;
    const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { $("#chant-verse").textContent = text; };
    utterance.onerror = (event) => {
      if (!["canceled", "interrupted"].includes(event.error)) toast("未能启动设备语音，请检查系统语音设置");
    };
    speechSynthesis.speak(utterance);
    bumpVisualCount("chant");
    feedback(kind === "diamond" ? "金刚经 · 闻思" : "南无阿弥陀佛");
  }

  function firstPersonBow() {
    if (bowing) return;
    bowing = true;
    const scene = $("#temple-scene");
    const reduce = document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    scene.classList.add("is-bowing");
    document.body.classList.add("is-bowing");
    $$('[data-ritual="bow"]').forEach((button) => { button.disabled = true; });
    setTimeout(() => {
      scene.classList.remove("is-bowing");
      document.body.classList.remove("is-bowing");
      $$('[data-ritual="bow"]').forEach((button) => { button.disabled = false; });
      bowing = false;
      bumpVisualCount("bow");
      feedback("一心顶礼");
      toast("礼拜圆满 · 愿心无散乱");
    }, reduce ? 160 : 2750);
  }

  // 3D 佛珠：24 粒可视珠代表整圈 108 计数，每次严格推进一粒。
  function buildBeads() {
    const orbit = $("#bead-orbit");
    if (orbit.children.length) return;
    for (let index = 0; index < 24; index += 1) {
      const bead = document.createElement("i");
      bead.className = "bead-3d";
      const angle = index * 15;
      bead.style.transform = `rotateZ(${angle}deg) translateX(108px) rotateZ(${-angle}deg) rotateX(-62deg)`;
      orbit.appendChild(bead);
    }
  }
  function beadCount() { return Number($("#bead-count").textContent) || 0; }
  function renderBeads() {
    buildBeads();
    const count = beadCount();
    beadRotation = -count * 15;
    $("#bead-orbit").style.transform = `rotateX(62deg) rotateZ(${beadRotation}deg)`;
    $("#bead-3d-count").textContent = String(count);
    $("#coin-count").textContent = String(ritual.coins);
    $$(".bead-3d").forEach((bead, index) => bead.classList.toggle("is-current", index === count % 24));
  }
  function stopAutoBeads(message = "") {
    autoBeads = false;
    clearInterval(beadTimer);
    beadTimer = 0;
    $("#btn-bead-auto").textContent = "自动拨珠 · 1 金币/珠";
    $("#auto-bead-status").textContent = message;
  }
  function advanceBead(fromAuto = false) {
    if (beadCount() >= 108) {
      stopAutoBeads("本圈 108 已圆满");
      toast("念珠圆满 · 可生成纪念品卡");
      return;
    }
    if (fromAuto && ritual.coins < 1) {
      stopAutoBeads("金币不足，自动拨珠已停止");
      return;
    }
    allowOriginalBead = true;
    $("#btn-beads").click();
    allowOriginalBead = false;
    if (fromAuto) {
      ritual.coins -= 1;
      persist();
      $("#toast").classList.remove("is-show");
      $("#auto-bead-status").textContent = `自动拨珠中 · 剩余 ${ritual.coins} 金币`;
    }
    renderBeads();
  }
  function openBeads() {
    renderBeads();
    $("#auto-bead-status").textContent = autoBeads ? `自动拨珠中 · 剩余 ${ritual.coins} 金币` : "";
    open("#overlay-beads");
    if (window.ChaoshanStage?.decorateBeads) window.ChaoshanStage.decorateBeads();
  }

  function openPlaque() {
    const seals = $$("#hud-seals .seal.is-on").length;
    $("#ritual-title").textContent = "虚拟佛牌";
    $("#ritual-card-mark").textContent = seals === 4 ? "圆" : "愿";
    $("#ritual-description").textContent = `本机虚拟纪念佛牌，已点亮 ${seals} / 4 枚香印。无实体寄送，不对应线下寺院牌位；愿文仅保存于本机。`;
    open("#overlay-ritual");
  }
  function lightLamp() {
    $("#virtual-lotus-lamp").classList.add("is-lit");
    $(".candle-flames").classList.add("is-lamp");
    bumpVisualCount("lamp");
    feedback("心灯已亮");
    addBubble("愿智慧光明");
    toast("虚拟心灯已点亮 · 愿离苦得乐");
    setTimeout(() => close("#overlay-lamp"), 700);
  }

  function openMemorial() {
    $("#memorial-name").value = ritual.memorial.name;
    $("#memorial-message").value = ritual.memorial.message;
    offering = ritual.memorial.offering;
    $$("[data-offering]").forEach((button) => button.classList.toggle("is-on", button.dataset.offering === offering));
    renderMemorialCard();
    open("#overlay-memorial");
  }
  function renderMemorialCard() {
    const card = ritual.memorial;
    $("#memorial-saved").textContent = card.name || card.message
      ? `${card.name || "故人"}\n${card.message || "愿离苦得乐，愿在世者平安珍重。"}`
      : "";
  }
  function saveMemorial() {
    ritual.memorial = {
      name: $("#memorial-name").value.trim().slice(0, 16),
      message: $("#memorial-message").value.trim().slice(0, 120),
      offering,
    };
    persist();
    renderMemorialCard();
    if (offering === "lamp") $(".candle-flames").classList.add("is-lamp");
    if (offering === "incense") {
      $("#placed-incense").classList.add("is-offered");
      $("#incense-smoke").classList.add("is-offered");
    }
    addBubble("愿故人离苦得乐");
    feedback("追思回向");
    toast("追思卡已保存于本机");
  }

  // 捕获扩展礼佛入口，避免旧版“只加计数”的行为先执行。
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-ritual]");
    if (action && window.ChaoshanStage?.handles(action.dataset.ritual)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.ChaoshanStage.open(action.dataset.ritual);
      return;
    }
    const beadWidget = event.target.closest("#btn-beads");
    if (beadWidget && !allowOriginalBead) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openBeads();
      return;
    }
    if (!action || !["bow", "beads", "chant", "lamp", "plaque"].includes(action.dataset.ritual)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const type = action.dataset.ritual;
    if (type === "bow") firstPersonBow();
    if (type === "beads") openBeads();
    if (type === "chant") open("#overlay-chant");
    if (type === "lamp") open("#overlay-lamp");
    if (type === "plaque") openPlaque();
  }, true);

  document.addEventListener("click", (event) => {
    const music = event.target.closest("[data-music]");
    if (music) startMusic(Number(music.dataset.music));
    const chant = event.target.closest("[data-chant]");
    if (chant) speak(chant.dataset.chant);
    const offeringButton = event.target.closest("[data-offering]");
    if (offeringButton) {
      offering = offeringButton.dataset.offering;
      $$("[data-offering]").forEach((button) => button.classList.toggle("is-on", button === offeringButton));
    }
    const closing = event.target.closest("[data-close]");
    if (closing) {
      if (closing.closest("#overlay-beads")) stopAutoBeads();
      if (closing.closest("#overlay-chant")) speechSynthesis.cancel();
    }
  });

  $("#btn-music").addEventListener("click", () => open("#overlay-music"));
  $("#btn-music-stop").addEventListener("click", stopMusic);
  $("#music-volume").value = String(Math.round(ritual.volume * 100));
  $("#music-volume").addEventListener("input", (event) => {
    ritual.volume = Number(event.target.value) / 100;
    audio.element.volume = 0.32 * ritual.volume;
    persist();
  });
  $("#btn-chant-stop").addEventListener("click", () => speechSynthesis.cancel());
  $("#btn-light-lamp").addEventListener("click", lightLamp);
  $("#btn-memorial").addEventListener("click", openMemorial);
  $("#btn-save-memorial").addEventListener("click", saveMemorial);
  $("#btn-bead-manual").addEventListener("click", () => advanceBead(false));
  $("#btn-bead-auto").addEventListener("click", () => {
    if (autoBeads) { stopAutoBeads("已暂停自动拨珠"); return; }
    if (ritual.coins < 1) { toast("虚拟金币不足"); return; }
    if (beadCount() >= 108) { toast("本圈 108 已圆满"); return; }
    autoBeads = true;
    $("#btn-bead-auto").textContent = "暂停自动拨珠";
    advanceBead(true);
    beadTimer = setInterval(() => advanceBead(true), 700);
  });

  let dragX = 0;
  let dragged = false;
  $("#bead-tap-zone").addEventListener("pointerdown", (event) => {
    dragX = event.clientX;
    dragged = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  $("#bead-tap-zone").addEventListener("pointermove", (event) => {
    if (!event.buttons) return;
    if (Math.abs(event.clientX - dragX) >= 28) {
      advanceBead(false);
      dragX = event.clientX;
      dragged = true;
    }
  });
  $("#bead-tap-zone").addEventListener("click", () => {
    if (dragged) { dragged = false; return; }
    advanceBead(false);
  });

  document.addEventListener("visibilitychange", () => {
    if (!audio.context) return;
    if (document.hidden) audio.context.suspend();
    else if (audio.playing) audio.context.resume();
  });

  ritual.music = Math.max(0, Math.min(2, Number(ritual.music) || 0));
  ritual.coins = Math.max(0, Number(ritual.coins) || 0);
  window.ChaoshanRitual = {
    playMusic(index) { return startMusic(index, true); },
    stopMusic,
    speak,
    stopSpeech() { if ("speechSynthesis" in window) speechSynthesis.cancel(); },
    tracks: TRACKS.map((track) => ({ ...track })),
  };
  updateMusicUI();
  renderBeads();
})();
