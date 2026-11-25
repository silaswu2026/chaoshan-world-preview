(() => {
  "use strict";

  const stage = document.getElementById("hall-stage");
  const incenseBox = document.getElementById("altar-incense-box");
  const candlesLayer = document.getElementById("altar-candles-layer");
  const lotusLeftEl = document.getElementById("altar-lotus-left");
  const lotusRightEl = document.getElementById("altar-lotus-right");
  const teaRowEl = document.getElementById("altar-tea-row");
  const censerZone = document.getElementById("live-censer-zone");
  const lampsLeft = document.getElementById("live-lamps-left");
  const lampsRight = document.getElementById("live-lamps-right");
  const statsEl = document.getElementById("altar-stats");
  const toastEl = document.getElementById("hall-toast");
  const bgm = document.getElementById("hall-bgm");

  const popover = document.getElementById("offering-popover");
  const popoverMeta = document.getElementById("popover-meta");
  const popoverWish = document.getElementById("popover-wish");
  const popoverBlessBtn = document.getElementById("popover-bless-btn");
  const popoverBlessNum = document.getElementById("popover-bless-num");

  const counts = { incense: 18, lamp: 24, lotus: 11, tea: 14 };
  let isEn = false;

  function updateStats() {
    statsEl.textContent = isEn
      ? `Incense ${counts.incense} · Lamp ${counts.lamp} · Lotus ${counts.lotus} · Tea ${counts.tea}`
      : `香${counts.incense} 灯${counts.lamp} 花${counts.lotus} 茶${counts.tea}`;
  }
  updateStats();

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-show"), 2600);
  }

  /* ===== WebAudio 柔和法器清音（铜磬 / 水滴 / 禅钟） ===== */
  let audioCtx = null;
  function playTone(kind = "bell") {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      audioCtx ||= new Ctor();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime;
      const freqs =
        kind === "tea"   ? [528, 792] :
        kind === "lotus" ? [396, 594, 792] :
        kind === "lamp"  ? [329.6, 659.2] :
                           [146.8, 293.7, 440];
      const dur = kind === "bell" ? 3.1 : 1.9;
      freqs.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime((kind === "bell" ? 0.12 : 0.065) / (i + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur - i * 0.35);
        o.connect(g).connect(audioCtx.destination);
        o.start(now);
        o.stop(now + dur + 0.1);
      });
    } catch (_) {}
  }

  /* ===== 通用：点击任意供品弹出「同修祈愿 & 合十随喜」 ===== */
  let activeOffering = null;
  let activeTargetEl = null;

  function openPopover(item, targetEl) {
    if (document.body.classList.contains("quiet-mode")) return;
    activeOffering = item;
    activeTargetEl = targetEl;
    popoverMeta.textContent = `${item.city ? item.city + " · " : ""}${item.name} · ${item.kindLabel}`;
    popoverWish.textContent = `「${item.wish}」`;
    popoverBlessNum.textContent = String(item.bless || 1);
    popover.classList.add("is-open");
    popover.setAttribute("aria-hidden", "false");
  }
  function closePopover() {
    popover.classList.remove("is-open");
    popover.setAttribute("aria-hidden", "true");
    activeOffering = null;
    activeTargetEl = null;
  }
  document.getElementById("popover-close").addEventListener("click", closePopover);
  stage.addEventListener("click", (e) => {
    if (!popover.classList.contains("is-open")) return;
    if (e.target.closest("#offering-popover") || e.target.closest("[data-offering]")) return;
    closePopover();
  });
  popoverBlessBtn.addEventListener("click", () => {
    if (!activeOffering) return;
    activeOffering.bless = (activeOffering.bless || 1) + 1;
    popoverBlessNum.textContent = String(activeOffering.bless);
    playTone("lamp");
    if (activeTargetEl) {
      activeTargetEl.classList.remove("is-blessed");
      void activeTargetEl.offsetWidth;
      activeTargetEl.classList.add("is-blessed");
    }
    showToast(`已为「${activeOffering.name}」的${activeOffering.kindLabel}合十随喜`);
  });

  /* ===== ① 正中大香炉：燃香阵（多柱线香 + 橘红呼吸香头） ===== */
  const incenseSticks = [
    { x: -24, rot: -14, h: 24, name: "苏明轩", city: "旧金山", wish: "愿心安住，诸事顺遂", bless: 7 },
    { x: -18, rot: -10, h: 27, name: "林安",   city: "温哥华", wish: "父母康健，岁岁无忧", bless: 11 },
    { x: -12, rot: -6,  h: 29, name: "Maya",   city: "Seattle", wish: "Peace & stillness for my family", bless: 9 },
    { x: -6,  rot: -3,  h: 31, name: "清和",   city: "台北",   wish: "智慧明澈，不染尘劳", bless: 14 },
    { x: 0,   rot: 0,   h: 32, name: "陈志远", city: "纽约",   wish: "愿众生安乐，所求皆安", bless: 16 },
    { x: 6,   rot: 3,   h: 30, name: "周宁",   city: "上海",   wish: "平安喜乐，自在清净", bless: 8 },
    { x: 12,  rot: 7,   h: 28, name: "David",  city: "Boston", wish: "Clarity and compassion today", bless: 6 },
    { x: 18,  rot: 11,  h: 26, name: "慧心",   city: "洛杉矶", wish: "愿此一炷清香回向十方", bless: 12 },
    { x: 24,  rot: 15,  h: 24, name: "Grace",  city: "Toronto", wish: "Gratitude and warmth", bless: 10 },
  ];

  function renderIncense(freshIdx = -1) {
    incenseBox.innerHTML = incenseSticks.map((s, i) => `
      <span class="incense-stick ${i === freshIdx ? "is-fresh" : ""}"
            style="margin-left:${s.x}px;height:${s.h}px;--rot:${s.rot}deg;transform:rotate(${s.rot}deg)">
        <i class="incense-ember" style="animation-delay:${-(i * 0.37)}s"></i>
      </span>
    `).join("");
  }
  renderIncense();

  incenseBox.dataset.offering = "incense";
  incenseBox.addEventListener("click", () => {
    const latest = incenseSticks[incenseSticks.length - 1];
    openPopover({ ...latest, kindLabel: "敬香" }, incenseBox);
  });

  function addIncenseStick(name, city, wish) {
    const idx = Math.floor(Math.random() * incenseSticks.length);
    incenseSticks[idx] = {
      ...incenseSticks[idx],
      h: 28 + Math.round(Math.random() * 6),
      name, city, wish, bless: 1,
    };
    counts.incense += 1;
    updateStats();
    extraStrands = 1.0;
    renderIncense(idx);
  }

  /* ===== ② 左右长明酥油灯海（近大远小，真实铜灯盏 + 暖光） ===== */
  const peerCandles = [
    { name: "清和",  city: "台北",   tag: "平安",    wish: "愿一家老小四季平安，夜夜好眠", x: 13, y: 69, scale: 0.78, bless: 9 },
    { name: "Maya",  city: "Seattle",tag: "Peace",   wish: "May everyone in this hall find quiet peace", x: 20, y: 74, scale: 0.90, bless: 12 },
    { name: "周宁",  city: "上海",   tag: "康健",    wish: "愿母亲早日康复，身心轻安", x: 14, y: 80, scale: 1.02, bless: 15 },
    { name: "苏明",  city: "旧金山", tag: "考学",    wish: "愿心定神宁，金榜题名", x: 35, y: 70, scale: 0.74, bless: 6 },
    { name: "David", city: "Boston", tag: "Clarity", wish: "Light in the fog, calm in the heart", x: 65, y: 70, scale: 0.74, bless: 8 },
    { name: "Grace", city: "Toronto",tag: "Family",  wish: "Blessings for my parents and children", x: 80, y: 74, scale: 0.90, bless: 11 },
    { name: "慧心",  city: "洛杉矶", tag: "安宁",    wish: "一灯能除千年暗，愿心里常明", x: 87, y: 69, scale: 0.78, bless: 13 },
    { name: "Alex",  city: "NYC",    tag: "Hope",    wish: "Sending warmth to those who feel alone", x: 86, y: 80, scale: 1.02, bless: 10 },
  ];

  function renderCandles(newIdx = -1) {
    candlesLayer.innerHTML = peerCandles.map((p, idx) => `
      <button type="button" class="peer-candle ${idx === newIdx ? "is-new" : ""}" data-offering="lamp" data-idx="${idx}"
              style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${p.scale})">
        <span class="candle-halo" style="animation-delay:${-(idx * 0.4)}s">
          <i class="candle-flame-tip" style="animation-delay:${-(idx * 0.35)}s"></i>
        </span>
        <span class="candle-cup"></span>
        <span class="peer-offering-tag"><b>${p.name}</b> · ${p.tag}</span>
      </button>
    `).join("");
  }
  renderCandles();

  candlesLayer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-offering='lamp']");
    if (!btn) return;
    const item = peerCandles[Number(btn.dataset.idx)];
    openPopover({ ...item, kindLabel: "供灯" }, btn);
  });

  /* ===== ③ 左右青瓷铜盘供莲（暖金烛光映照多层写实白莲） ===== */
  function makeLotusSvg(uid) {
    return `
      <svg class="lotus-svg" viewBox="0 0 80 62" aria-hidden="true">
        <defs>
          <linearGradient id="lp-outer-${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f7ecd4" stop-opacity="0.92"/>
            <stop offset="68%" stop-color="#d2b68a" stop-opacity="0.88"/>
            <stop offset="100%" stop-color="#6b5232" stop-opacity="0.92"/>
          </linearGradient>
          <linearGradient id="lp-inner-${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fff8e6" stop-opacity="0.98"/>
            <stop offset="65%" stop-color="#e8cfa0" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="#8c6a3c" stop-opacity="0.9"/>
          </linearGradient>
          <radialGradient id="lp-core-${uid}" cx="50%" cy="62%" r="48%">
            <stop offset="0%" stop-color="#ffe082" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#c48a2e" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- 深碧莲叶衬底 -->
        <ellipse cx="40" cy="52" rx="30" ry="7.5" fill="rgba(26,56,48,0.88)" stroke="rgba(168,196,154,0.28)" stroke-width="0.8"/>
        <!-- 外层花瓣 -->
        <path d="M40 50 C20 48, 8 34, 11 22 C21 25, 32 34, 40 50Z" fill="url(#lp-outer-${uid})"/>
        <path d="M40 50 C60 48, 72 34, 69 22 C59 25, 48 34, 40 50Z" fill="url(#lp-outer-${uid})"/>
        <!-- 中层花瓣 -->
        <path d="M40 50 C24 44, 17 24, 24 12 C32 19, 37 32, 40 50Z" fill="url(#lp-inner-${uid})"/>
        <path d="M40 50 C56 44, 63 24, 56 12 C48 19, 43 32, 40 50Z" fill="url(#lp-inner-${uid})"/>
        <!-- 中央主瓣与暖金莲心 -->
        <path d="M40 50 C30 38, 30 18, 40 6 C50 18, 50 38, 40 50Z" fill="url(#lp-inner-${uid})" stroke="rgba(255,244,214,0.65)" stroke-width="0.6"/>
        <ellipse cx="40" cy="39" rx="11" ry="8" fill="url(#lp-core-${uid})"/>
      </svg>`;
  }

  const lotusSlots = {
    left: [
      { left: 26, scale: 0.88, name: "清岚", city: "杭州",   wish: "心如白莲，不染尘埃", bless: 8 },
      { left: 53, scale: 1.04, name: "Elena",city: "London", wish: "Grace and serenity for all", bless: 11 },
      { left: 78, scale: 0.82, name: "远山", city: "旧金山", wish: "愿所行皆善，所遇皆暖", bless: 5 },
    ],
    right: [
      { left: 22, scale: 0.84, name: "知行", city: "新加坡", wish: "愿得清净心，常生欢喜意", bless: 7 },
      { left: 48, scale: 1.04, name: "若水", city: "温哥华", wish: "愿家人岁岁长安，花开见佛", bless: 13 },
      { left: 75, scale: 0.88, name: "Ken",  city: "Tokyo",  wish: "Peaceful mind, gentle days", bless: 6 },
    ],
  };

  function renderLotusVessel(side, freshIdx = -1) {
    const el = side === "left" ? lotusLeftEl : lotusRightEl;
    const list = lotusSlots[side];
    el.innerHTML = `<div class="vessel-dish"></div>` + list.map((f, i) => `
      <button type="button" class="lotus-item ${i === freshIdx ? "is-fresh" : ""}" data-offering="lotus" data-side="${side}" data-idx="${i}"
              style="left:${f.left}%;transform:translateX(-50%) scale(${f.scale})">
        ${makeLotusSvg(`${side}-${i}`)}
        <span class="peer-offering-tag"><b>${f.name}</b> · 供莲</span>
      </button>
    `).join("");
  }
  renderLotusVessel("left");
  renderLotusVessel("right");

  [lotusLeftEl, lotusRightEl].forEach((el) => {
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-offering='lotus']");
      if (!btn) return;
      const item = lotusSlots[btn.dataset.side][Number(btn.dataset.idx)];
      openPopover({ ...item, kindLabel: "佛前供莲" }, btn);
    });
  });

  function offerLotus(name, city, wish) {
    const side = Math.random() > 0.5 ? "left" : "right";
    const idx = Math.floor(Math.random() * lotusSlots[side].length);
    lotusSlots[side][idx] = { ...lotusSlots[side][idx], name, city, wish, bless: 1 };
    counts.lotus += 1;
    updateStats();
    renderLotusVessel(side, idx);
    return side;
  }

  /* ===== ④ 佛前最前排：五盏青瓷供茶 / 八功德净水 ===== */
  const teaCups = [
    { filled: true, name: "明觉", city: "旧金山", wish: "奉一盏清茶，愿心如止水", bless: 9 },
    { filled: true, name: "静远", city: "成都",   wish: "禅茶一味，去除烦躁昏沉", bless: 12 },
    { filled: true, name: "Chloe",city: "LA",     wish: "Still water, clear mind", bless: 14 },
    { filled: true, name: "安然", city: "纽约",   wish: "愿以八功德水，洗去一切疲惫", bless: 7 },
    { filled: false,name: "虚位", city: "",       wish: "点击下方「奉茶」，在佛前注满这一盏清茶", bless: 0 },
  ];

  function renderTeaRow(rippleIdx = -1) {
    teaRowEl.innerHTML = teaCups.map((c, i) => `
      <button type="button" class="tea-cup ${c.filled ? "is-filled" : ""} ${i === rippleIdx ? "is-rippling" : ""}"
              data-offering="tea" data-idx="${i}">
        <span class="tea-steam"><i></i><i></i></span>
        <span class="tea-bowl">
          <span class="tea-surface"></span>
          <span class="tea-ripple"></span>
        </span>
        <span class="peer-offering-tag">${c.filled ? `<b>${c.name}</b> · 供茶` : "待奉清茶"}</span>
      </button>
    `).join("");
  }
  renderTeaRow();

  teaRowEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-offering='tea']");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const item = teaCups[idx];
    if (!item.filled) {
      offerTea("你", "此刻", "奉上一盏清茶，愿身心澄明安住", idx);
      playTone("tea");
      showToast("已于佛前奉上一盏清茶 · 水纹轻漾");
      return;
    }
    openPopover({ ...item, kindLabel: "供茶净水" }, btn);
  });

  function offerTea(name, city, wish, forcedIdx = -1) {
    let idx = forcedIdx;
    if (idx < 0) {
      idx = teaCups.findIndex((c) => !c.filled);
      if (idx < 0) idx = Math.floor(Math.random() * teaCups.length);
    }
    teaCups[idx] = { filled: true, name, city, wish, bless: 1 };
    counts.tea += 1;
    updateStats();
    renderTeaRow(idx);
  }

  /* ===== ⑤ 实时同修共修流动（香、灯、花、茶四供轮流真实发生） ===== */
  const liveEvents = [
    { type: "tea",     name: "旧金山 · 明觉", city: "旧金山", wish: "愿心如止水，清明自在", text: "旧金山 · 明觉 刚刚奉上一盏清茶" },
    { type: "lotus",   name: "温哥华 · 若水", city: "温哥华", wish: "花开见佛，愿亲友皆安", text: "温哥华 · 若水 刚刚于佛前供上一枝白莲" },
    { type: "incense", name: "Seattle · Maya",city: "Seattle",wish: "Peace and calm for all", text: "Seattle · Maya 刚刚敬了一炷清香" },
    { type: "lamp",    name: "纽约 · 陈志远", city: "纽约",   wish: "长明一盏心灯，照破迷惘", text: "纽约 · 陈志远 刚刚点亮一盏长明酥油灯" },
    { type: "tea",     name: "Boston · David",city: "Boston", wish: "Still water, gentle heart", text: "Boston · David 刚刚供奉八功德净水" },
    { type: "lotus",   name: "洛杉矶 · 慧心", city: "洛杉矶", wish: "清净庄严，吉祥如意", text: "洛杉矶 · 慧心 刚刚供奉一朵清莲" },
  ];
  let liveIdx = 0;
  let extraStrands = 0;

  function showWhisper(text, zone = "center") {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    const whisper = document.createElement("div");
    whisper.className = "live-whisper";
    whisper.textContent = text;
    const target = zone === "left" ? lampsLeft : zone === "right" ? lampsRight : censerZone;
    target.appendChild(whisper);
    setTimeout(() => whisper.remove(), 3800);
  }

  function runPeerEvent(ev) {
    if (document.hidden) return;
    const shortName = ev.name.split(" · ").pop();
    if (ev.type === "incense") {
      addIncenseStick(shortName, ev.city, ev.wish);
      showWhisper(ev.text, "center");
    } else if (ev.type === "lotus") {
      const side = offerLotus(shortName, ev.city, ev.wish);
      showWhisper(ev.text, side);
    } else if (ev.type === "tea") {
      offerTea(shortName, ev.city, ev.wish);
      showWhisper(ev.text, "center");
    } else {
      const idx = Math.floor(Math.random() * peerCandles.length);
      peerCandles[idx] = { ...peerCandles[idx], name: shortName, city: ev.city, wish: ev.wish, bless: 1 };
      counts.lamp += 1;
      updateStats();
      renderCandles(idx);
      showWhisper(ev.text, peerCandles[idx].x < 50 ? "left" : "right");
    }
  }

  setTimeout(() => runPeerEvent(liveEvents[liveIdx++ % liveEvents.length]), 1800);
  setInterval(() => runPeerEvent(liveEvents[liveIdx++ % liveEvents.length]), 5800);

  /* ===== ⑥ 丝绸状缠绕檀香青烟 + 60fps 金光浮尘 + 刚体视差 ===== */
  const canvas = document.getElementById("hall-fx-canvas");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  const motes = [];

  const strands = [
    { ox: -10, freq: 0.014, amp: 14, speed: 1.15, phase: 0.0, width: 1.5, alpha: 0.24 },
    { ox:   0, freq: 0.011, amp: 20, speed: 0.92, phase: 1.7, width: 2.1, alpha: 0.30 },
    { ox:  10, freq: 0.016, amp: 16, speed: 1.28, phase: 3.1, width: 1.4, alpha: 0.22 },
    { ox:  -5, freq: 0.009, amp: 25, speed: 0.78, phase: 4.4, width: 3.2, alpha: 0.14 },
    { ox:   6, freq: 0.012, amp: 22, speed: 0.85, phase: 5.5, width: 2.6, alpha: 0.16 },
  ];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!motes.length) {
      for (let i = 0; i < 54; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.6,
          vy: -(0.14 + Math.random() * 0.28),
          phase: Math.random() * Math.PI * 2,
          alpha: 0.22 + Math.random() * 0.5,
        });
      }
    }
  }
  window.addEventListener("resize", resize);
  resize();

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, w) - 0.5) * 18;
    targetY = (e.clientY / Math.max(1, h) - 0.5) * 10;
  });

  function drawSilkIncenseSmoke(t) {
    const baseX = w * 0.5 + curX * 0.85;
    const baseY = h * 0.655 + curY * 0.55;
    const topY = h * 0.23;
    const heightSpan = Math.max(120, baseY - topY);
    const boost = 1 + extraStrands * 0.55;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let s = 0; s < strands.length; s++) {
      const st = strands[s];
      const steps = 40;
      for (let i = 0; i < steps; i++) {
        const p0 = i / steps;
        const p1 = (i + 1) / steps;
        const y0 = baseY - p0 * heightSpan;
        const y1 = baseY - p1 * heightSpan;
        const sway0 = Math.sin(p0 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p0 * 1.35)
                    + Math.cos(p0 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.2 * p0;
        const sway1 = Math.sin(p1 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p1 * 1.35)
                    + Math.cos(p1 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.2 * p1;
        const x0 = baseX + st.ox * (1 + p0 * 1.35) + sway0;
        const x1 = baseX + st.ox * (1 + p1 * 1.35) + sway1;
        const fadeIn = Math.min(1, p0 * 7);
        const fadeOut = Math.pow(1 - p0, 1.45);
        const alpha = st.alpha * fadeIn * fadeOut * boost;
        if (alpha < 0.004) continue;
        ctx.strokeStyle = `rgba(234, 232, 224, ${alpha.toFixed(3)})`;
        ctx.lineWidth = st.width * (0.68 + p0 * 4.0);
        ctx.shadowColor = `rgba(236, 232, 220, ${(alpha * 0.85).toFixed(3)})`;
        ctx.shadowBlur = 4 + p0 * 14;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const t = now * 0.001;
    curX += (targetX + Math.sin(t * 0.38) * 2.2 - curX) * 0.06;
    curY += (targetY + Math.cos(t * 0.3) * 1.5 - curY) * 0.06;
    stage.style.setProperty("--px", `${curX.toFixed(2)}px`);
    stage.style.setProperty("--py", `${curY.toFixed(2)}px`);

    extraStrands *= 0.988;
    ctx.clearRect(0, 0, w, h);
    drawSilkIncenseSmoke(t);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.phase += 0.024;
      m.y += m.vy;
      m.x += Math.sin(m.phase) * 0.18;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      const a = m.alpha * (0.55 + 0.45 * Math.sin(m.phase * 1.4));
      ctx.fillStyle = `rgba(255, 234, 174, ${a})`;
      ctx.beginPath();
      ctx.arc(m.x + curX * 0.35, m.y + curY * 0.25, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  requestAnimationFrame(tick);

  /* ===== ⑦ 底部五键共修互动（香、灯、花、茶、礼拜） ===== */
  document.getElementById("btn-act-incense").addEventListener("click", () => {
    playTone("bell");
    addIncenseStick("你", "此刻", "清香一炷，愿心安住、诸事吉祥");
    showWhisper("你 刚刚敬了一炷清香 · 香云供养", "center");
    showToast("清香已插于佛前香炉 · 丝缕青烟徐徐升空");
  });

  document.getElementById("btn-act-lamp").addEventListener("click", () => {
    playTone("lamp");
    const isLeft = Math.random() > 0.5;
    const newCandle = {
      name: "你",
      city: "此刻",
      tag: "心灯",
      wish: "点亮一盏长明酥油灯，愿光明温暖常伴",
      x: isLeft ? 28 + Math.random() * 8 : 64 + Math.random() * 8,
      y: 78 + Math.random() * 4,
      scale: 1.04,
      bless: 1,
    };
    peerCandles.push(newCandle);
    if (peerCandles.length > 12) peerCandles.splice(8, 1);
    counts.lamp += 1;
    updateStats();
    renderCandles(peerCandles.length - 1);
    showWhisper("你 刚刚点亮一盏长明酥油灯", isLeft ? "left" : "right");
    showToast("你的长明烛已融入佛前烛海");
  });

  document.getElementById("btn-act-lotus").addEventListener("click", () => {
    playTone("lotus");
    const side = offerLotus("你", "此刻", "佛前献上一枝清莲，愿清净庄严、诸善圆满");
    showWhisper("你 刚刚于佛前供上一枝白莲", side);
    showToast("一枝白莲已在佛前莲盘柔和绽开");
  });

  document.getElementById("btn-act-tea").addEventListener("click", () => {
    playTone("tea");
    offerTea("你", "此刻", "奉一盏清茶净水，愿心如止水、澄明清安");
    showWhisper("你 刚刚于佛前奉上一盏清茶", "center");
    showToast("清茶已奉于佛前供案 · 水纹轻漾、茶雾微升");
  });

  document.getElementById("btn-act-bow").addEventListener("click", () => {
    playTone("bell");
    const bow = document.getElementById("bow-hands-layer");
    bow.classList.add("is-show");
    setTimeout(() => bow.classList.remove("is-show"), 2600);
    showToast("一心顶礼 · 愿心无散乱");
  });

  /* ===== 顶栏开关 ===== */
  const quietBtn = document.getElementById("btn-quiet");
  quietBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("quiet-mode");
    quietBtn.classList.toggle("is-on", on);
    quietBtn.textContent = on ? "已清净" : "清净模式";
    if (on) closePopover();
    showToast(on ? "已开启清净模式 · 隐去他人姓名与动态，独享宁静供案" : "已恢复满殿同修供养与随喜互动");
  });

  const soundBtn = document.getElementById("btn-sound");
  soundBtn.addEventListener("click", () => {
    if (bgm.paused) {
      bgm.volume = 0.36;
      bgm.play().then(() => { soundBtn.textContent = "清音 · 开"; soundBtn.classList.add("is-on"); }).catch(() => {});
    } else {
      bgm.pause();
      soundBtn.textContent = "清音 · 关";
      soundBtn.classList.remove("is-on");
    }
  });

  document.getElementById("btn-lang").addEventListener("click", (e) => {
    isEn = !isEn;
    e.target.textContent = isEn ? "中文" : "EN";
    document.getElementById("t-hall-name").textContent = isEn ? "Mahāvīra Hall · Shakyamuni Buddha" : "大雄宝殿 · 释迦牟尼佛";
    document.getElementById("t-hall-sub").textContent = isEn ? "Live Four Offerings Altar · Incense, Lamp, Lotus & Tea" : "佛前四供实时共修 · 香、灯、花、茶以物见人";
    document.getElementById("t-online").textContent = isEn ? "Pilgrims" : "位同修在殿";
    document.getElementById("t-incense").textContent = isEn ? "Incense" : "敬香";
    document.getElementById("t-lamp").textContent = isEn ? "Lamp" : "供灯";
    document.getElementById("t-lotus").textContent = isEn ? "Lotus" : "献花";
    document.getElementById("t-tea").textContent = isEn ? "Tea" : "奉茶";
    document.getElementById("t-bow").textContent = isEn ? "Bow" : "礼拜";
    updateStats();
  });
})();
