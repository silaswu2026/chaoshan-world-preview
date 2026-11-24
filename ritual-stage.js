(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const names = ["清和", "静遥", "明心", "慧安", "云舒", "觉知", "安然", "思远", "嘉言", "星遥", "予宁", "书恒", "念慈", "弘毅", "婉清"];
  const wishes = [
    { category: "study", label: "求学", text: "愿孩子静心向学，考试稳定发挥" },
    { category: "study", label: "求学", text: "愿我学业精进，顺利通过考试" },
    { category: "career", label: "事业", text: "愿工作顺遂，正财安稳，勤劳有获" },
    { category: "career", label: "事业", text: "愿事业有进，所行向善，衣食无忧" },
    { category: "peace", label: "平安", text: "愿父母康健，家人平安，灯火可亲" },
    { category: "peace", label: "平安", text: "愿家人四季安康，出入平安" },
    { category: "memory", label: "亲人", text: "为远方亲人祈福，愿平安自在" },
    { category: "memory", label: "亲人", text: "愿故人离苦得乐，愿思念化作温柔" },
  ];
  const titles = { bow: "俯首礼拜", take: "请香 · 点香", offer: "佛前上香", chant: "念佛 · 同声持诵", muyu: "木鱼 · 收摄身心", lamp: "虚拟供灯", plaque: "请佛牌 · 供奉心愿" };
  const durations = { bow: 3200, take: 3100, offer: 3100, muyu: 3000, lamp: 3000 };
  const plaqueTypes = {
    peace: { glyph: "安", name: "莲光平安牌", sub: "家人平安 · 身心安乐", category: "peace" },
    study: { glyph: "慧", name: "文殊慧学牌", sub: "静心向学 · 智慧增长", category: "study" },
    wish: { glyph: "愿", name: "普贤如意牌", sub: "事业顺遂 · 正善丰盈", category: "career" },
    memory: { glyph: "念", name: "地藏追思牌", sub: "怀念亲人 · 追思回向", category: "memory" },
  };
  let timers = [];
  let activeType = "";
  let previousFocus = null;
  let selectedPlaque = "peace";
  let selectedCategory = "peace";
  let enshrining = false;
  let woodfishContext = null;

  const stage = document.createElement("div");
  stage.className = "rite-stage";
  stage.id = "rite-stage";
  stage.setAttribute("role", "dialog");
  stage.setAttribute("aria-modal", "true");
  stage.setAttribute("aria-label", "前景礼佛仪式");
  stage.innerHTML = `
    <button type="button" class="rite-stage-close" aria-label="关闭仪式">×</button>
    <header class="rite-stage-head"><p class="rite-stage-kicker">同 修 祈 愿 · 虚 拟 演 示</p><h2 id="rite-stage-title"></h2><div class="rite-witnesses"></div></header>
    <div class="rite-view" id="rite-view"></div>
    <p class="rite-caption" id="rite-caption"></p>
    <div class="rite-controls" id="rite-controls"></div>`;
  $("#app").appendChild(stage);
  const view = $("#rite-view", stage);
  const caption = $("#rite-caption", stage);
  const controls = $("#rite-controls", stage);

  function later(callback, delay) {
    const timer = setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function reduced() {
    return document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-show"), 2100);
  }
  function count(key) {
    window.dispatchEvent(new CustomEvent("chaoshan:count", { detail: { key } }));
  }
  function syncVisual(patch) {
    window.dispatchEvent(new CustomEvent("chaoshan:sync", { detail: { patch } }));
  }
  function prayer(text, name) {
    if (window.ChaoshanPrayer) window.ChaoshanPrayer(text, name);
  }
  function randomItems(list, amount) {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy.slice(0, amount);
  }
  function witnessesMarkup(amount = 3) {
    return randomItems(names, amount).map((name, index) => {
      const wish = wishes[Math.floor(Math.random() * wishes.length)];
      return `<div class="rite-witness"><b>${name}</b><span>${wish.text}</span></div>`;
    });
  }
  function renderWitnesses(target = $(".rite-witnesses", stage)) {
    if (target) target.innerHTML = witnessesMarkup();
  }
  function setControls(items) {
    controls.innerHTML = items.map((item) => `<button type="button" class="${item.primary ? "primary" : ""}" data-stage-action="${item.action}">${item.label}</button>`).join("");
  }
  function commonControls(label = "再次观礼") {
    setControls([{ action: "replay", label }, { action: "close", label: "返回殿内" }]);
  }

  function bowScene() {
    return `<div class="bow-scene"><div class="bow-mandala"></div><div class="bow-person"><div class="bow-head"></div><div class="bow-neck"></div><div class="bow-body"></div></div><img class="bow-hands-real" src="./assets/hands-jade.webp" alt="" /></div><div class="rite-floor"></div>`;
  }
  function incenseScene() {
    return `<div class="incense-scene"><div class="incense-candle"><i class="incense-flame"></i></div><div class="incense-censer"></div><div class="incense-bundle"><i></i><i></i><i></i></div><div class="incense-smoke-3d"><i></i><i></i><i></i></div></div><div class="rite-floor"></div>`;
  }
  function chantScene() {
    let avatar = "qing";
    try { avatar = JSON.parse(localStorage.getItem("chaoshan-visual-v1") || "{}").avatar || "qing"; } catch (_) { /* 使用默认立绘 */ }
    if (!["qing", "shao", "zhong", "lao"].includes(avatar)) avatar = "qing";
    return `<div class="chant-scene"><div class="chant-halo"></div><div class="chant-platform"></div><img class="chant-person" src="./assets/avatar-${avatar}.webp" alt="虚拟香客持诵" /><i class="chant-sound"></i><i class="chant-sound"></i><span class="chant-word">南无阿弥陀佛</span></div>`;
  }
  function muyuScene() {
    return `<div class="muyu-scene"><div class="muyu-base"></div><div class="muyu-body"></div><div class="muyu-mallet"></div><i class="muyu-ring"></i></div><div class="rite-floor"></div>`;
  }
  function lampScene() {
    return `<div class="lamp-scene"><div class="lamp-light"></div><div class="lamp-3d">${"<i class=\"lamp-petal\"></i>".repeat(8)}<div class="lamp-cup"></div><div class="lamp-flame-3d"></div></div></div><div class="rite-floor"></div>`;
  }
  function plaqueScene() {
    return `<div class="plaque-scene"><div class="plaque-gallery">${Object.entries(plaqueTypes).map(([key, item]) => `<button type="button" class="plaque-card ${key === selectedPlaque ? "is-selected" : ""}" data-plaque="${key}" data-style="${key}" aria-label="选择${item.name}"><span class="plaque-face"><b class="plaque-glyph">${item.glyph}</b><span class="plaque-name">${item.name}</span><small class="plaque-sub">${item.sub}</small></span></button>`).join("")}</div><div class="plaque-wishes">${wishes.filter((item, index, array) => array.findIndex((other) => other.category === item.category) === index).map((item) => `<button type="button" data-wish-category="${item.category}" class="${item.category === selectedCategory ? "is-on" : ""}">${item.label}祈愿</button>`).join("")}</div><input class="plaque-input" id="plaque-wish-input" maxlength="40" aria-label="佛牌愿文" placeholder="写下心愿，仅保存于本机" /></div>`;
  }

  function playWoodfish() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      woodfishContext ||= new AudioCtor();
      woodfishContext.resume();
      const oscillator = woodfishContext.createOscillator();
      const gain = woodfishContext.createGain();
      const now = woodfishContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(220, now);
      oscillator.frequency.exponentialRampToValueAtTime(76, now + 0.1);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      oscillator.connect(gain).connect(woodfishContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (_) { /* 无音频权限时保留动画 */ }
  }

  function completeBow() {
    count("bow");
    const witness = randomItems(names, 1)[0];
    prayer("愿心无散乱，所行皆安稳", witness);
    toast("俯首礼拜圆满 · 愿心无散乱");
    close();
  }
  function completeIncense(type) {
    syncVisual({ incenseReady: type === "take", incensePlaced: true });
    count(type);
    $("#placed-incense").classList.add("is-offered");
    $("#incense-smoke").classList.add("is-offered");
    prayer("愿家人平安，清香一缕寄心愿", randomItems(names, 1)[0]);
    toast(type === "take" ? "清香已请 · 点香上炉" : "清香已奉上 · 香云供养");
    close();
  }
  function completeLamp() {
    $(".candle-flames").classList.add("is-lamp");
    count("lamp");
    prayer("愿智慧光明，照亮家人前路", randomItems(names, 1)[0]);
    toast("虚拟心灯已点亮 · 不对应线下灯位");
    close();
  }

  function run(type) {
    clearTimers();
    enshrining = false;
    stage.classList.remove("is-running", "is-enshrining");
    void stage.offsetWidth;
    stage.classList.add("is-running");
    const fast = reduced();
    if (type === "bow") {
      caption.textContent = "合掌 · 俯首 · 一心顶礼";
      commonControls("再拜一次");
      later(completeBow, fast ? 160 : durations.bow);
    }
    if (type === "take" || type === "offer") {
      caption.textContent = "取香";
      commonControls("再敬一炷香");
      later(() => { caption.textContent = "烛火点香 · 香头亮起"; }, fast ? 20 : 850);
      later(() => { caption.textContent = "恭敬上香 · 插入香炉"; }, fast ? 50 : 1800);
      later(() => completeIncense(type), fast ? 160 : durations[type]);
    }
    if (type === "chant") {
      caption.textContent = "虚拟香客同声持诵 · 设备中文语音";
      setControls([{ action: "amitabha", label: "阿弥陀佛" }, { action: "diamond", label: "金刚经", primary: true }, { action: "close", label: "停止并返回" }]);
      later(() => $('[data-chant="amitabha"]').click(), fast ? 20 : 350);
    }
    if (type === "muyu") {
      caption.textContent = "木鱼轻鸣 · 一声一静心";
      commonControls("再敲三声");
      [350, 1250, 2150].forEach((delay, index) => later(() => {
        playWoodfish();
        if (index === 0) count("muyu");
      }, fast ? 20 + index * 30 : delay));
      later(close, fast ? 180 : durations.muyu);
    }
    if (type === "lamp") {
      caption.textContent = "莲灯升起 · 点亮心灯";
      commonControls("再供一盏");
      later(() => { caption.textContent = "愿智慧光明 · 离苦得乐"; }, fast ? 30 : 1200);
      later(completeLamp, fast ? 160 : durations.lamp);
    }
    if (type === "plaque") {
      stage.classList.remove("is-running");
      caption.textContent = "选择佛牌与祈愿类别，再供奉上座";
      setControls([{ action: "enshrine", label: "请牌供奉", primary: true }, { action: "close", label: "返回殿内" }]);
      const input = $("#plaque-wish-input", stage);
      input.value = wishes.find((item) => item.category === selectedCategory).text;
    }
  }

  function open(type) {
    if (!titles[type]) return;
    clearTimers();
    if (activeType === "chant" && type !== "chant") speechSynthesis.cancel();
    activeType = type;
    $("#toast").classList.remove("is-show");
    previousFocus = document.activeElement;
    stage.dataset.type = type;
    stage.className = "rite-stage is-active";
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("rite-stage-open");
    $("#rite-stage-title", stage).textContent = titles[type];
    renderWitnesses();
    if (type === "bow") view.innerHTML = bowScene();
    if (type === "take" || type === "offer") view.innerHTML = incenseScene();
    if (type === "chant") view.innerHTML = chantScene();
    if (type === "muyu") view.innerHTML = muyuScene();
    if (type === "lamp") view.innerHTML = lampScene();
    if (type === "plaque") {
      try {
        const saved = JSON.parse(localStorage.getItem("chaoshan-plaque-v1") || "{}");
        if (plaqueTypes[saved.style]) selectedPlaque = saved.style;
        if (wishes.some((item) => item.category === saved.category)) selectedCategory = saved.category;
      } catch (_) { /* 使用默认佛牌 */ }
      view.innerHTML = plaqueScene();
    }
    run(type);
    later(() => $(".rite-stage-close", stage).focus({ preventScroll: true }), 30);
  }

  function close() {
    clearTimers();
    if (activeType === "chant" && "speechSynthesis" in window) speechSynthesis.cancel();
    stage.className = "rite-stage";
    stage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("rite-stage-open");
    activeType = "";
    enshrining = false;
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
  }

  function enshrinePlaque() {
    if (enshrining) return;
    const input = $("#plaque-wish-input", stage);
    const wish = input.value.trim().slice(0, 40);
    if (!wish) { input.focus(); toast("请先写下一句心愿"); return; }
    enshrining = true;
    stage.classList.add("is-enshrining");
    caption.textContent = `${plaqueTypes[selectedPlaque].name} · 供奉上座`;
    const item = plaqueTypes[selectedPlaque];
    try { localStorage.setItem("chaoshan-plaque-v1", JSON.stringify({ style: selectedPlaque, category: selectedCategory, wish, updatedAt: Date.now() })); } catch (_) { /* 保持本次体验 */ }
    renderEnshrinedPlaque();
    $("#ritual-wish").value = wish;
    later(() => {
      $("#btn-save-ritual").click();
    }, reduced() ? 30 : 750);
    later(() => {
      enshrining = false;
      close();
      toast(`${item.name}已供奉 · 愿文仅存本机`);
    }, reduced() ? 160 : 1650);
  }

  function renderEnshrinedPlaque() {
    let badge = $("#enshrined-plaque");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "enshrined-plaque";
      badge.className = "enshrined-plaque";
      badge.setAttribute("aria-hidden", "true");
      $("#temple-scene").appendChild(badge);
    }
    try {
      const saved = JSON.parse(localStorage.getItem("chaoshan-plaque-v1") || "{}");
      const item = plaqueTypes[saved.style];
      if (!item) return;
      badge.textContent = item.glyph;
      badge.title = item.name;
      badge.classList.add("is-visible");
    } catch (_) { /* 无存储权限时不显示 */ }
  }

  stage.addEventListener("click", (event) => {
    const plaque = event.target.closest("[data-plaque]");
    if (plaque && !enshrining) {
      selectedPlaque = plaque.dataset.plaque;
      selectedCategory = plaqueTypes[selectedPlaque].category;
      $$("[data-plaque]", stage).forEach((button) => button.classList.toggle("is-selected", button === plaque));
      $$("[data-wish-category]", stage).forEach((button) => button.classList.toggle("is-on", button.dataset.wishCategory === selectedCategory));
      $("#plaque-wish-input", stage).value = wishes.find((item) => item.category === selectedCategory).text;
      return;
    }
    const category = event.target.closest("[data-wish-category]");
    if (category && !enshrining) {
      selectedCategory = category.dataset.wishCategory;
      $$("[data-wish-category]", stage).forEach((button) => button.classList.toggle("is-on", button === category));
      $("#plaque-wish-input", stage).value = wishes.find((item) => item.category === selectedCategory).text;
      return;
    }
    const button = event.target.closest("[data-stage-action]");
    if (!button) return;
    const action = button.dataset.stageAction;
    if (action === "close") close();
    if (action === "replay" && activeType) run(activeType);
    if (action === "amitabha" || action === "diamond") {
      $(`[data-chant="${action}"]`).click();
      caption.textContent = action === "diamond" ? "虚拟香客持诵《金刚经》节选" : "虚拟香客同声持诵阿弥陀佛圣号";
    }
    if (action === "enshrine") enshrinePlaque();
  });
  $(".rite-stage-close", stage).addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && stage.classList.contains("is-active")) close();
  });

  function decorateBeads() {
    const sheet = $("#overlay-beads .beads-sheet");
    if (!sheet) return;
    let row = $("#bead-witnesses");
    if (!row) {
      row = document.createElement("div");
      row.id = "bead-witnesses";
      row.className = "rite-witnesses";
      $(".sheet-head", sheet).after(row);
    }
    renderWitnesses(row);
  }

  // 佛珠沿用已有可逐粒拨动的 3D 场景，只补充随机同修祈愿。
  document.addEventListener("click", (event) => {
    const action = event.target.closest('[data-ritual="beads"], #btn-beads');
    if (!action) return;
    later(() => {
      const sheet = $("#overlay-beads .beads-sheet");
      if (!sheet || !$("#overlay-beads").classList.contains("is-open")) return;
      let row = $("#bead-witnesses");
      if (!row) {
        row = document.createElement("div");
        row.id = "bead-witnesses";
        row.className = "rite-witnesses";
        $(".sheet-head", sheet).after(row);
      }
      renderWitnesses(row);
    }, 30);
  });

  window.ChaoshanPrayerData = { names, wishes, randomItems, witnessesMarkup };
  window.ChaoshanStage = {
    open,
    close,
    decorateBeads,
    handles(type) { return Object.prototype.hasOwnProperty.call(titles, type); },
    isOpen() { return stage.classList.contains("is-active"); },
  };
  renderEnshrinedPlaque();
})();
