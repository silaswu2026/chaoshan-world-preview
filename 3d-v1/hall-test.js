(() => {
  "use strict";

  const stage = document.getElementById("hall-stage");
  const incenseBox = document.getElementById("altar-incense-box");
  const candlesLayer = document.getElementById("altar-candles-layer");
  const lotusLayer = document.getElementById("altar-lotus-layer");
  const teaRowEl = document.getElementById("altar-tea-row");
  const cushionsLayer = document.getElementById("hall-cushions-layer");
  const visitorsLayer = document.getElementById("hall-visitors-layer");
  const spotFloatLayer = document.getElementById("spot-float-layer");
  const danmakuBar = document.getElementById("hall-danmaku-bar");
  const boardEl = document.getElementById("merit-board");
  const boardListEl = document.getElementById("board-list");
  const boardTotalEl = document.getElementById("board-total-actions");
  const toastEl = document.getElementById("hall-toast");
  const bgm = document.getElementById("hall-bgm");

  const fpIncense = document.getElementById("fp-incense-actor");
  const fpHands = document.getElementById("fp-hands-actor");
  const fpOffer = document.getElementById("fp-offer-actor");
  const fpOfferImg = document.getElementById("fp-offer-img");

  const listenSutraText = document.getElementById("listen-sutra-text");
  const fishWidget = document.getElementById("zen-fish-widget");
  const fishBtn = document.getElementById("btn-tap-fish");
  const fishCountEl = document.getElementById("fish-count");
  const beadsWidget = document.getElementById("zen-beads-widget");
  const beadsTrack = document.getElementById("beads-track");
  const beadsCountEl = document.getElementById("beads-count");

  const popover = document.getElementById("offering-popover");
  const popoverMeta = document.getElementById("popover-meta");
  const popoverWish = document.getElementById("popover-wish");
  const popoverBlessBtn = document.getElementById("popover-bless-btn");
  const popoverBlessNum = document.getElementById("popover-bless-num");

  const V = "20261128-3dv1-19";
  let isEn = false;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-show"), 2200);
  }

  function formatNow() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${mi}`;
  }

  /* ===== WebAudio 真实法器音效（禅钟 / 铜磬 / 水韵 / 木鱼 / 沉香念珠） ===== */
  let audioCtx = null;
  function getAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx ||= new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playTone(kind = "bell") {
    try {
      const ctx = getAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (kind === "fish") {
        // 浑厚中空木鱼敲击声
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(520, now);
        o.frequency.exponentialRampToValueAtTime(285, now + 0.09);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.24, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        o.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + 0.25);
        return;
      }

      if (kind === "bead") {
        // 温润檀木佛珠轻碰声
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(980, now);
        o.frequency.exponentialRampToValueAtTime(620, now + 0.04);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.11, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        o.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + 0.11);
        return;
      }

      const freqs =
        kind === "tea"   ? [528, 792] :
        kind === "lotus" ? [396, 594, 792] :
        kind === "lamp"  ? [329.6, 659.2] :
                           [146.8, 293.7, 440];
      const dur = kind === "bell" ? 3.1 : 1.9;
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime((kind === "bell" ? 0.11 : 0.06) / (i + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur - i * 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + dur + 0.1);
      });
    } catch (_) {}
  }

  /* ===== 1. 部位就地 +1 向上飘散 + 底部安全带轻流动态（不再固定左上角） ===== */
  function spawnSpotFloat(xPct, yPct, plusText, whoText = "") {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    const tag = document.createElement("div");
    tag.className = "spot-float-tag";
    tag.style.left = `${xPct}%`;
    tag.style.top = `${yPct}%`;
    tag.innerHTML = `<span class="sf-plus">${plusText}</span>${whoText ? `<span class="sf-who">${whoText}</span>` : ""}`;
    spotFloatLayer.appendChild(tag);
    setTimeout(() => tag.remove(), 2750);
  }

  function pushDanmaku(city, name, actionText) {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    while (danmakuBar.children.length >= 2) {
      danmakuBar.firstElementChild?.remove();
    }
    const pill = document.createElement("div");
    pill.className = "danmaku-pill";
    pill.innerHTML = `
      <span class="dm-city">【${city}】</span>
      <span class="dm-time">${formatNow()}</span>
      <span>${name}</span>
      <span class="dm-act">${actionText}</span>
    `;
    danmakuBar.appendChild(pill);
    setTimeout(() => pill.remove(), 3850);
  }

  /* ===== 2. 右上角共修行为清单 / 排行榜（同一个人自动累计计数） ===== */
  const ledger = new Map();
  const ACT_LABELS = { incense: "香", bow: "礼", lamp: "灯", tea: "茶", lotus: "花", listen: "听", beads: "珠", fish: "鱼" };
  const ACT_LABELS_EN = { incense: "Inc", bow: "Bow", lamp: "Lmp", tea: "Tea", lotus: "Flw", listen: "Zen", beads: "Mala", fish: "Fish" };
  let totalHallActions = 0;

  function recordAction(id, name, city, type, isMe = false) {
    let entry = ledger.get(id);
    if (!entry) {
      entry = { id, name, city, isMe, total: 0, counts: { incense: 0, bow: 0, lamp: 0, tea: 0, lotus: 0, listen: 0, beads: 0, fish: 0 }, lastTs: 0 };
      ledger.set(id, entry);
    }
    entry.counts[type] = (entry.counts[type] || 0) + 1;
    entry.total += 1;
    entry.lastTs = Date.now();
    totalHallActions += 1;
    renderBoard(id);

    // 共鸣彩蛋：每累计满 12 次行为，全殿在席同修同步合十跪拜一礼
    if (totalHallActions > 6 && totalHallActions % 12 === 0) {
      triggerUnisonBow();
    }
  }

  function renderBoard(flashId = null) {
    const sorted = Array.from(ledger.values()).sort((a, b) => b.total - a.total || b.lastTs - a.lastTs);
    const totalAll = sorted.reduce((acc, r) => acc + r.total, 0);
    boardTotalEl.textContent = isEn ? `${totalAll} acts` : `累计 ${totalAll} 次`;
    const labels = isEn ? ACT_LABELS_EN : ACT_LABELS;

    boardListEl.innerHTML = sorted.slice(0, 8).map((r, i) => {
      const breakdown = Object.entries(r.counts)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${labels[k]}${n}`)
        .join(" · ");
      return `
        <li class="board-row ${r.isMe ? "is-me" : ""} ${r.id === flashId ? "is-flash" : ""}">
          <span class="board-rank">${i + 1}</span>
          <div class="board-info">
            <div class="board-name"><em>[${r.city}]</em>${r.name}</div>
            <div class="board-acts">${breakdown}</div>
          </div>
          <span class="board-total">${isEn ? `${r.total}x` : `${r.total}次`}</span>
        </li>
      `;
    }).join("");
  }

  recordAction("u-lin",   "林安",   "旧金山", "incense");
  recordAction("u-ruo",   "若水",   "温哥华", "bow");
  recordAction("u-elder", "周老伯", "台北",   "lamp");
  recordAction("u-child", "小豆子", "台北",   "bow");
  recordAction("u-chen",  "陈志远", "纽约",   "tea");

  const boardOpenBtn = document.getElementById("btn-board-open");
  const boardToggleBtn = document.getElementById("btn-board-toggle");
  function setBoardOpen(open) {
    boardEl.classList.toggle("is-open", open);
    boardEl.setAttribute("aria-hidden", open ? "false" : "true");
    boardOpenBtn.classList.toggle("is-on", open);
  }
  boardOpenBtn.addEventListener("click", () => setBoardOpen(!boardEl.classList.contains("is-open")));
  boardToggleBtn.addEventListener("click", () => setBoardOpen(false));

  /* ===== 3. 殿前 7 席写实蒲团阵（左右 2 排 6 席同修 + 正中 1 席你的主蒲团） ===== */
  const cushionSlots = [
    { id: "c-lb",  x: 24.0, y: 78.8, scale: 0.74, vh: 142, role: "visitor" },
    { id: "c-rb",  x: 76.0, y: 78.8, scale: 0.74, vh: 142, role: "visitor" },
    { id: "c-lf1", x: 11.5, y: 88.0, scale: 0.90, vh: 174, role: "visitor" },
    { id: "c-lf2", x: 27.5, y: 88.8, scale: 0.92, vh: 178, role: "visitor" },
    { id: "c-rf1", x: 72.5, y: 88.8, scale: 0.92, vh: 178, role: "visitor" },
    { id: "c-rf2", x: 88.5, y: 88.0, scale: 0.90, vh: 174, role: "visitor" },
    { id: "c-me",  x: 50.0, y: 90.5, scale: 1.00, vh: 0,   role: "self" },
  ];

  cushionsLayer.innerHTML = cushionSlots.map((c) => `
    <div class="temple-cushion ${c.role === "self" ? "is-self" : ""}"
         style="left:${c.x}%;top:${c.y}%;transform:translate(-50%,-50%) scale(${c.scale})">
      ${c.role === "self" ? `<div class="cushion-self-ring"></div>` : ""}
      <img src="./assets/temple-cushion.png?v=${V}" alt="礼佛蒲团" />
    </div>
  `).join("");

  /* ===== 4. 佛前四供写实供案（一炉、二莲、四灯、四茶，中轴对称） ===== */
  let activeOffering = null;
  let activeTargetEl = null;
  function openPopover(item, targetEl) {
    if (document.body.classList.contains("quiet-mode")) return;
    activeOffering = item; activeTargetEl = targetEl;
    popoverMeta.textContent = `${item.city ? item.city + " · " : ""}${item.name} · ${item.kindLabel}`;
    popoverWish.textContent = `「${item.wish}」`;
    popoverBlessNum.textContent = String(item.bless || 1);
    popover.classList.add("is-open");
    popover.setAttribute("aria-hidden", "false");
  }
  function closePopover() {
    popover.classList.remove("is-open");
    popover.setAttribute("aria-hidden", "true");
    activeOffering = null; activeTargetEl = null;
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

  // ① 香炉燃香
  const incenseSticks = [
    { x: -22, rot: -13, h: 24, name: "林安",   city: "旧金山", wish: "愿心安住，诸事顺遂", bless: 7 },
    { x: -15, rot: -8,  h: 27, name: "Maya",   city: "Seattle",wish: "Peace for all", bless: 9 },
    { x: -8,  rot: -4,  h: 30, name: "周老伯", city: "台北",   wish: "阖家平安，健康长寿", bless: 14 },
    { x: 0,   rot: 0,   h: 32, name: "陈志远", city: "纽约",   wish: "愿众生安乐，所求皆安", bless: 16 },
    { x: 8,   rot: 4,   h: 30, name: "若水",   city: "温哥华", wish: "平安喜乐，自在清净", bless: 8 },
    { x: 15,  rot: 8,   h: 27, name: "David",  city: "Boston", wish: "Clarity and compassion", bless: 6 },
    { x: 22,  rot: 13,  h: 24, name: "慧心",   city: "洛杉矶", wish: "清香一炷回向十方", bless: 12 },
  ];
  let extraStrands = 0;
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
  incenseBox.addEventListener("click", () => openPopover({ ...incenseSticks[3], kindLabel: "敬香" }, incenseBox));

  function addIncenseStick(name, city, wish) {
    const idx = Math.floor(Math.random() * incenseSticks.length);
    incenseSticks[idx] = { ...incenseSticks[idx], h: 28 + Math.round(Math.random() * 5), name, city, wish, bless: 1 };
    extraStrands = 1.0;
    renderIncense(idx);
  }

  // ② 四盏对称古铜酥油灯
  const peerCandles = [
    { name: "周老伯", city: "台北",   tag: "平安",    wish: "愿一家老小四季平安", x: 31.4, y: 62.6, scale: 0.84, bless: 9 },
    { name: "Maya",   city: "Seattle",tag: "Peace",   wish: "Quiet peace for everyone", x: 36.6, y: 67.6, scale: 0.94, bless: 12 },
    { name: "Grace",  city: "Toronto",tag: "Family",  wish: "Blessings for my family", x: 63.4, y: 67.6, scale: 0.94, bless: 11 },
    { name: "慧心",   city: "洛杉矶", tag: "安宁",    wish: "一灯能除千年暗", x: 68.6, y: 62.6, scale: 0.84, bless: 13 },
  ];
  let lampCursor = 0;
  function renderCandles(newIdx = -1) {
    candlesLayer.innerHTML = peerCandles.map((p, idx) => `
      <button type="button" class="peer-candle ${idx === newIdx ? "is-new" : ""}" data-offering="lamp" data-idx="${idx}"
              style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${p.scale})">
        <span class="lamp-visual">
          <img class="lamp-img" src="./assets/offering-lamp.png?v=${V}" alt="古铜酥油灯" />
          <i class="lamp-flame-glow" style="animation-delay:${-(idx * 0.42)}s"></i>
        </span>
        <span class="peer-offering-tag"><b>${p.name}</b> · ${p.tag}</span>
      </button>
    `).join("");
  }
  renderCandles();
  candlesLayer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-offering='lamp']");
    if (btn) openPopover({ ...peerCandles[Number(btn.dataset.idx)], kindLabel: "供灯" }, btn);
  });

  // ③ 两盘对称宋瓷白莲
  const lotusItems = [
    { x: 35.0, y: 62.2, scale: 0.92, name: "清岚", city: "杭州",   wish: "心如白莲，不染尘埃", bless: 8 },
    { x: 65.0, y: 62.2, scale: 0.92, name: "若水", city: "温哥华", wish: "花开见佛，岁岁长安", bless: 13 },
  ];
  let lotusCursor = 0;
  function renderLotus(freshIdx = -1) {
    lotusLayer.innerHTML = lotusItems.map((f, i) => `
      <button type="button" class="lotus-item ${i === freshIdx ? "is-fresh" : ""}" data-offering="lotus" data-idx="${i}"
              style="left:${f.x}%;top:${f.y}%;transform:translate(-50%,-50%) scale(${f.scale})">
        <span class="lotus-visual">
          <img class="lotus-img" src="./assets/offering-lotus.png?v=${V}" alt="佛前供莲" style="animation-delay:${-(i * 0.9)}s" />
        </span>
        <span class="peer-offering-tag"><b>${f.name}</b> · 供莲</span>
      </button>
    `).join("");
  }
  renderLotus();
  lotusLayer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-offering='lotus']");
    if (btn) openPopover({ ...lotusItems[Number(btn.dataset.idx)], kindLabel: "佛前供莲" }, btn);
  });

  // ④ 四盏对称青瓷贡茶
  const teaCups = [
    { x: 41.2, y: 67.8, filled: true,  name: "明觉", city: "旧金山", wish: "奉一盏清茶，愿心如止水", bless: 9 },
    { x: 45.3, y: 67.8, filled: true,  name: "静远", city: "成都",   wish: "禅茶一味，自在清净", bless: 12 },
    { x: 54.7, y: 67.8, filled: true,  name: "Chloe",city: "LA",     wish: "Still water, clear mind", bless: 14 },
    { x: 58.8, y: 67.8, filled: false, name: "虚位", city: "",       wish: "点击下方「奉茶」注满这一盏清茶", bless: 0 },
  ];
  let teaCursor = 3;
  function renderTeaRow(rippleIdx = -1) {
    teaRowEl.innerHTML = teaCups.map((c, i) => `
      <button type="button" class="tea-cup ${c.filled ? "is-filled" : ""} ${i === rippleIdx ? "is-rippling" : ""}"
              style="left:${c.x}%;top:${c.y}%" data-offering="tea" data-idx="${i}">
        <span class="tea-steam"><i></i><i></i></span>
        <span class="tea-visual">
          <img class="tea-img" src="./assets/offering-tea.png?v=${V}" alt="宋瓷贡茶" />
          <span class="tea-ripple"></span>
        </span>
        <span class="peer-offering-tag">${c.filled ? `<b>${c.name}</b> · 贡茶` : "待奉清茶"}</span>
      </button>
    `).join("");
  }
  renderTeaRow();
  teaRowEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-offering='tea']");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    if (!teaCups[idx].filled) { triggerSelfTea(idx); return; }
    openPopover({ ...teaCups[idx], kindLabel: "青瓷贡茶" }, btn);
  });

  /* ===== 5. 多元写实角色池（男、女、老人、儿童，100% 不透明实像 + 平滑进出淡化） ===== */
  const ROLE_SPRITES = {
    male:   { stand: `./assets/pilgrim-fg.png?v=${V}`,           bow: `./assets/pilgrim-bow.png?v=${V}`,        hScale: 1.00 },
    female: { stand: `./assets/pilgrim-female-stand.png?v=${V}`, bow: `./assets/pilgrim-female-bow.png?v=${V}`, hScale: 0.94 },
    elder:  { stand: `./assets/pilgrim-elder-stand.png?v=${V}`,  bow: `./assets/pilgrim-elder-bow.png?v=${V}`,  hScale: 0.97 },
    child:  { stand: `./assets/pilgrim-child-stand.png?v=${V}`,  bow: `./assets/pilgrim-child-stand.png?v=${V}`,hScale: 0.63 },
  };

  const visitorPool = [
    { id: "u-ruo",   name: "若水",   city: "温哥华", role: "female" },
    { id: "u-elder", name: "周老伯", city: "台北",   role: "elder"  },
    { id: "u-child", name: "小豆子", city: "台北",   role: "child"  },
    { id: "u-lin",   name: "林安",   city: "旧金山", role: "male"   },
    { id: "u-maya",  name: "Maya",   city: "Seattle",role: "female" },
    { id: "u-chen",  name: "陈志远", city: "纽约",   role: "male"   },
    { id: "u-zhao",  name: "赵奶奶", city: "上海",   role: "elder"  },
    { id: "u-leo",   name: "安安",   city: "洛杉矶", role: "child"  },
  ];

  // 6 个侧席蒲团状态
  const visitorSlots = cushionSlots.slice(0, 6).map((slot, idx) => ({
    slotIndex: idx,
    x: slot.x,
    y: slot.y + 0.5,
    vh: slot.vh,
    user: null,
    el: null,
    actionsDone: 0,
  }));

  let targetCrowd = 5; // 默认 5-6 人热闹模式，可一键切换 3-4 人冷启动模式

  function spawnVisitorAt(slotIdx, user) {
    const s = visitorSlots[slotIdx];
    if (s.el) s.el.remove();
    s.user = user;
    s.actionsDone = 0;
    const sp = ROLE_SPRITES[user.role] || ROLE_SPRITES.male;
    const el = document.createElement("div");
    el.className = `visitor-actor ${user.role === "child" ? "is-child" : ""}`;
    el.style.left = `${s.x}%`;
    el.style.top = `${s.y}%`;
    el.style.setProperty("--vh", `${Math.round(s.vh * sp.hScale)}px`);
    el.innerHTML = `
      <div class="visitor-badge"><b>${user.name}</b> · ${user.city}</div>
      <div class="visitor-shadow"></div>
      <img class="visitor-img is-stand" src="${sp.stand}" alt="" />
      <img class="visitor-img is-bow" src="${sp.bow}" alt="" />
    `;
    visitorsLayer.appendChild(el);
    s.el = el;
    requestAnimationFrame(() => el.classList.add("is-present"));
  }

  function clearVisitorAt(slotIdx) {
    const s = visitorSlots[slotIdx];
    if (!s.el) return;
    const oldEl = s.el;
    oldEl.classList.remove("is-present");
    s.user = null;
    s.el = null;
    setTimeout(() => oldEl.remove(), 1100);
  }

  function pickUnusedUser() {
    const activeIds = new Set(visitorSlots.filter((s) => s.user).map((s) => s.user.id));
    const candidates = visitorPool.filter((u) => !activeIds.has(u.id));
    return candidates[Math.floor(Math.random() * candidates.length)] || visitorPool[0];
  }

  function applyCrowdDensity(count) {
    targetCrowd = count;
    // 优先保证老/少/女/男多元搭配
    const order = [0, 1, 3, 4, 2, 5]; // 先填中后与内前席，再填外前席
    for (let i = 0; i < order.length; i++) {
      const slotIdx = order[i];
      if (i < count) {
        if (!visitorSlots[slotIdx].user) {
          spawnVisitorAt(slotIdx, visitorPool[i % visitorPool.length]);
        }
      } else {
        clearVisitorAt(slotIdx);
      }
    }
  }

  // 初始落位 5 位多元同修（女、老人、儿童、男、女），展示热闹和谐的真实大殿
  applyCrowdDensity(5);

  document.querySelectorAll(".density-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".density-pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const n = Number(btn.dataset.density);
      applyCrowdDensity(n);
      showToast(n <= 3 ? "已切换：3-4 人舒朗冷启动模式" : "已切换：5-6 人热闹共修模式");
    });
  });

  function triggerUnisonBow() {
    if (document.hidden) return;
    playTone("bell");
    visitorSlots.forEach((s) => {
      if (s.el) {
        s.el.classList.add("is-bowing");
        setTimeout(() => s.el && s.el.classList.remove("is-bowing"), 3200);
      }
    });
    pushDanmaku("大雄宝殿", "全场同修", "闻钟同步合十跪拜一礼");
  }

  let simStep = 0;
  function runVisitorSimulation() {
    if (document.hidden) return;
    const activeSlots = visitorSlots.filter((s) => s.user && s.el);
    if (!activeSlots.length) return;

    // 让做满 3 次行为的同修自然淡出离殿，几秒后迎入新同修
    const leaving = activeSlots.find((s) => s.actionsDone >= 3);
    if (leaving) {
      const idx = leaving.slotIndex;
      clearVisitorAt(idx);
      setTimeout(() => {
        if (!document.hidden && visitorSlots.filter((s) => s.user).length < targetCrowd) {
          const nextU = pickUnusedUser();
          spawnVisitorAt(idx, nextU);
          pushDanmaku(nextU.city, nextU.name, "步入大雄宝殿");
        }
      }, 2200);
      return;
    }

    const actor = activeSlots[simStep % activeSlots.length];
    const u = actor.user;
    const actionCycle = ["incense", "bow", "lamp", "tea", "lotus", "bow"];
    const act = actionCycle[simStep % actionCycle.length];
    simStep++;
    actor.actionsDone += 1;

    if (act === "bow") {
      actor.el.classList.add("is-bowing");
      setTimeout(() => actor.el && actor.el.classList.remove("is-bowing"), 3200);
      recordAction(u.id, u.name, u.city, "bow");
      spawnSpotFloat(actor.x, actor.y - 22, "礼拜 +1", u.name);
      pushDanmaku(u.city, u.name, "于蒲团虔诚礼拜");
    } else if (act === "incense") {
      actor.el.classList.add("is-offering");
      setTimeout(() => actor.el && actor.el.classList.remove("is-offering"), 1200);
      addIncenseStick(u.name, u.city, "愿心安住，吉祥平安");
      recordAction(u.id, u.name, u.city, "incense");
      spawnSpotFloat(50, 50, "敬香 +1", u.name);
      pushDanmaku(u.city, u.name, "敬了一炷清香");
    } else if (act === "lamp") {
      const idx = lampCursor++ % peerCandles.length;
      const seat = peerCandles[idx];
      peerCandles[idx] = { ...seat, name: u.name, city: u.city, wish: "点亮心灯，光明常照", bless: 1 };
      renderCandles(idx);
      recordAction(u.id, u.name, u.city, "lamp");
      spawnSpotFloat(seat.x, seat.y - 6, "供灯 +1", u.name);
      pushDanmaku(u.city, u.name, "供奉了一盏古铜酥油灯");
    } else if (act === "tea") {
      const idx = teaCursor++ % teaCups.length;
      const seat = teaCups[idx];
      teaCups[idx] = { ...seat, filled: true, name: u.name, city: u.city, wish: "奉茶净心，清安自在", bless: 1 };
      renderTeaRow(idx);
      recordAction(u.id, u.name, u.city, "tea");
      spawnSpotFloat(seat.x, seat.y - 6, "奉茶 +1", u.name);
      pushDanmaku(u.city, u.name, "奉上了一盏青瓷清茶");
    } else if (act === "lotus") {
      const idx = lotusCursor++ % lotusItems.length;
      const seat = lotusItems[idx];
      lotusItems[idx] = { ...seat, name: u.name, city: u.city, wish: "佛前供莲，清净庄严", bless: 1 };
      renderLotus(idx);
      recordAction(u.id, u.name, u.city, "lotus");
      spawnSpotFloat(seat.x, seat.y - 7, "献花 +1", u.name);
      pushDanmaku(u.city, u.name, "于佛前献上一盘白莲");
    }
  }

  setTimeout(runVisitorSimulation, 1400);
  setInterval(runVisitorSimulation, 4600);

  /* ===== 6. 第一人称供养礼敬动画（敬香 / 礼拜 / 供灯 / 奉茶 / 献花） ===== */
  let busyRitual = false;

  document.getElementById("btn-act-incense").addEventListener("click", () => {
    if (busyRitual) return;
    busyRitual = true;
    playTone("bell");
    fpIncense.classList.remove("is-playing");
    void fpIncense.offsetWidth;
    fpIncense.classList.add("is-playing");

    setTimeout(() => {
      addIncenseStick("你", "本机", "清香一炷，愿心安住、诸事吉祥");
      recordAction("u-me", "你", "本机", "incense", true);
      spawnSpotFloat(50, 50, "敬香 +1", "你");
      pushDanmaku("本机", "你", "点燃清香并插于佛前香炉");
    }, 1500);

    setTimeout(() => { fpIncense.classList.remove("is-playing"); busyRitual = false; }, 2350);
  });

  document.getElementById("btn-act-bow").addEventListener("click", () => {
    if (busyRitual) return;
    busyRitual = true;
    playTone("bell");
    fpHands.classList.add("is-raised");

    setTimeout(() => {
      stage.classList.add("is-fp-bowing");
      fpHands.classList.add("is-bowed");
      recordAction("u-me", "你", "本机", "bow", true);
      spawnSpotFloat(50, 76, "礼拜 +1", "你");
      pushDanmaku("本机", "你", "于主蒲团合十跪拜顶礼");
    }, 620);

    setTimeout(() => {
      stage.classList.remove("is-fp-bowing");
      fpHands.classList.remove("is-bowed");
    }, 2350);

    setTimeout(() => { fpHands.classList.remove("is-raised"); busyRitual = false; }, 3200);
  });

  function playGentlePresent(imgSrc, onLand) {
    if (busyRitual) return;
    busyRitual = true;
    fpOfferImg.src = imgSrc;
    fpOffer.classList.remove("is-playing");
    void fpOffer.offsetWidth;
    fpOffer.classList.add("is-playing");
    setTimeout(onLand, 1150);
    setTimeout(() => { fpOffer.classList.remove("is-playing"); busyRitual = false; }, 1600);
  }

  document.getElementById("btn-act-lamp").addEventListener("click", () => {
    const idx = lampCursor++ % peerCandles.length;
    const seat = peerCandles[idx];
    playTone("lamp");
    playGentlePresent(`./assets/offering-lamp.png?v=${V}`, () => {
      peerCandles[idx] = { ...seat, name: "你", city: "本机", tag: "心灯", wish: "点亮一盏长明酥油灯，愿光明温暖常伴", bless: 1 };
      renderCandles(idx);
      recordAction("u-me", "你", "本机", "lamp", true);
      spawnSpotFloat(seat.x, seat.y - 6, "供灯 +1", "你");
      pushDanmaku("本机", "你", "奉上并点亮一盏古铜酥油灯");
    });
  });

  function triggerSelfTea(forcedIdx = -1) {
    const emptyIdx = teaCups.findIndex((c) => !c.filled);
    const idx = forcedIdx >= 0 ? forcedIdx : (emptyIdx >= 0 ? emptyIdx : (teaCursor++ % teaCups.length));
    const seat = teaCups[idx];
    playTone("tea");
    playGentlePresent(`./assets/offering-tea.png?v=${V}`, () => {
      teaCups[idx] = { ...seat, filled: true, name: "你", city: "本机", wish: "奉一盏青瓷清茶，愿心如止水", bless: 1 };
      renderTeaRow(idx);
      recordAction("u-me", "你", "本机", "tea", true);
      spawnSpotFloat(seat.x, seat.y - 6, "奉茶 +1", "你");
      pushDanmaku("本机", "你", "于佛前奉上一盏青瓷清茶");
    });
  }
  document.getElementById("btn-act-tea").addEventListener("click", () => triggerSelfTea());

  document.getElementById("btn-act-lotus").addEventListener("click", () => {
    const idx = lotusCursor++ % lotusItems.length;
    const seat = lotusItems[idx];
    playTone("lotus");
    playGentlePresent(`./assets/offering-lotus.png?v=${V}`, () => {
      lotusItems[idx] = { ...seat, name: "你", city: "本机", wish: "佛前供莲，清净庄严", bless: 1 };
      renderLotus(idx);
      recordAction("u-me", "你", "本机", "lotus", true);
      spawnSpotFloat(seat.x, seat.y - 7, "献花 +1", "你");
      pushDanmaku("本机", "你", "于佛前供上一盘白莲");
    });
  });

  /* ===== 7. 新增静修三件套：听佛（坐下来）+ 拨佛珠 + 敲木鱼 ===== */
  const sutraLines = [
    "观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空",
    "心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想",
    "一念清净，烈焰成池；一念警觉，船登彼岸",
    "静坐常思己过，闲谈莫论人非，愿心安住当下",
    "闻钟声，烦恼轻，智慧长，菩提生",
  ];
  let sutraIdx = 0;
  let sutraTimer = null;
  const listenBtn = document.getElementById("btn-act-listen");
  const soundBtn = document.getElementById("btn-sound");

  listenBtn.addEventListener("click", () => {
    const sitting = stage.classList.toggle("is-fp-sitting");
    listenBtn.classList.toggle("is-active", sitting);
    if (sitting) {
      playTone("bell");
      recordAction("u-me", "你", "本机", "listen", true);
      spawnSpotFloat(50, 74, "静坐听佛", "你");
      pushDanmaku("本机", "你", "落座主蒲团，静心听佛");
      if (bgm.paused) {
        bgm.volume = 0.36;
        bgm.play().then(() => { soundBtn.textContent = "清音 · 开"; soundBtn.classList.add("is-on"); }).catch(() => {});
      }
      listenSutraText.textContent = sutraLines[sutraIdx % sutraLines.length];
      clearInterval(sutraTimer);
      sutraTimer = setInterval(() => {
        sutraIdx++;
        listenSutraText.textContent = sutraLines[sutraIdx % sutraLines.length];
      }, 6000);
      showToast("已落座蒲团静心听佛 · 再点「听佛」起身");
    } else {
      clearInterval(sutraTimer);
      showToast("已从蒲团从容起身");
    }
  });

  // 真实 3D 透视圆环沉香 18 子佛珠（一颗一颗平滑转动 + 手动/自动切换）
  let beadsCount = 0;
  let beadsAutoTimer = null;
  let beadsTargetAngle = 0;
  let beadsCurAngle = 0;
  const BEAD_TOTAL = 18;
  const STEP_RAD = (Math.PI * 2) / BEAD_TOTAL;

  const beadsBtn = document.getElementById("btn-act-beads");
  const beadsManualBtn = document.getElementById("btn-beads-manual");
  const beadsAutoBtn = document.getElementById("btn-beads-auto");
  const beadsRoundLabel = document.getElementById("beads-round-label");
  const beadsCanvas = document.getElementById("beads-canvas");
  const bctx = beadsCanvas.getContext("2d");

  function drawRosaryRing(nowSec) {
    beadsCurAngle += (beadsTargetAngle - beadsCurAngle) * 0.18;
    const cw = beadsCanvas.width;
    const ch = beadsCanvas.height;
    bctx.clearRect(0, 0, cw, ch);

    const cx = cw * 0.5;
    const cy = ch * 0.48;
    const rx = cw * 0.37;
    const ry = ch * 0.26;

    // 1. 先绘制丝绳椭圆轨道
    bctx.save();
    bctx.strokeStyle = "rgba(182, 134, 72, 0.42)";
    bctx.lineWidth = 3.5;
    bctx.beginPath();
    bctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    bctx.stroke();
    bctx.restore();

    // 2. 计算 18 颗珠子的 3D 透视位置并按景深从后往前排序绘制
    const beads = [];
    for (let i = 0; i < BEAD_TOTAL; i++) {
      const theta = beadsCurAngle + i * STEP_RAD + Math.PI * 0.5; // +PI/2 让第 0 颗初始在最前方
      const x = cx + Math.cos(theta) * rx;
      const depth = Math.sin(theta); // -1(最远后排) .. +1(最近前排正中)
      const y = cy + depth * ry;
      const scale = 0.62 + (depth + 1) * 0.30; // 0.62 .. 1.22
      const isGuru = i === 0;
      const r = (isGuru ? 21 : 17.5) * scale;
      beads.push({ i, x, y, depth, scale, r, isGuru });
    }
    beads.sort((a, b) => a.depth - b.depth);

    for (const b of beads) {
      bctx.save();
      // 接触暗影
      bctx.fillStyle = `rgba(0, 0, 0, ${(0.25 + (b.depth + 1) * 0.2).toFixed(2)})`;
      bctx.beginPath();
      bctx.ellipse(b.x, b.y + b.r * 0.72, b.r * 0.9, b.r * 0.32, 0, 0, Math.PI * 2);
      bctx.fill();

      // 若是佛头母珠，绘制垂坠金穗流苏
      if (b.isGuru) {
        const sway = Math.sin(nowSec * 2.2) * 3.5;
        const gradT = bctx.createLinearGradient(b.x, b.y + b.r, b.x + sway, b.y + b.r + 30 * b.scale);
        gradT.addColorStop(0, "#f2c86b");
        gradT.addColorStop(1, "rgba(186, 118, 38, 0.25)");
        bctx.strokeStyle = gradT;
        bctx.lineWidth = 4.5 * b.scale;
        bctx.lineCap = "round";
        bctx.beginPath();
        bctx.moveTo(b.x, b.y + b.r * 0.85);
        bctx.quadraticCurveTo(b.x + sway * 0.5, b.y + b.r + 14 * b.scale, b.x + sway, b.y + b.r + 28 * b.scale);
        bctx.stroke();
      }

      // 沉香木珠球体渐变（随景深明暗自然过渡）
      const lightBoost = 0.72 + (b.depth + 1) * 0.22;
      const gx = b.x - b.r * 0.34;
      const gy = b.y - b.r * 0.36;
      const grad = bctx.createRadialGradient(gx, gy, b.r * 0.08, b.x, b.y, b.r);
      if (b.isGuru) {
        grad.addColorStop(0, "#ffe4a2");
        grad.addColorStop(0.32, "#c6883a");
        grad.addColorStop(0.72, "#6b3e14");
        grad.addColorStop(1, "#261205");
      } else {
        grad.addColorStop(0, `rgba(222, 168, 108, ${Math.min(1, lightBoost).toFixed(2)})`);
        grad.addColorStop(0.34, `rgba(128, 76, 34, ${Math.min(1, lightBoost).toFixed(2)})`);
        grad.addColorStop(0.76, "#42220d");
        grad.addColorStop(1, "#180a03");
      }
      bctx.fillStyle = grad;
      bctx.beginPath();
      bctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      bctx.fill();

      // 细腻木纹高光弧线
      bctx.strokeStyle = b.isGuru ? "rgba(255, 232, 168, 0.65)" : `rgba(232, 186, 124, ${(0.12 + (b.depth + 1) * 0.14).toFixed(2)})`;
      bctx.lineWidth = b.isGuru ? 1.8 : 1.1;
      bctx.beginPath();
      bctx.arc(b.x, b.y, b.r * 0.78, -Math.PI * 0.82, -Math.PI * 0.22);
      bctx.stroke();

      // 最前方当前拨动主珠的暖金微光晕
      if (b.depth > 0.92) {
        bctx.strokeStyle = "rgba(255, 226, 152, 0.68)";
        bctx.lineWidth = 2;
        bctx.beginPath();
        bctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
        bctx.stroke();
      }
      bctx.restore();
    }
  }

  function setBeadsMode(autoOn) {
    clearInterval(beadsAutoTimer);
    beadsAutoTimer = null;
    beadsManualBtn.classList.toggle("is-on", !autoOn);
    beadsAutoBtn.classList.toggle("is-on", autoOn);
    if (autoOn) {
      beadsRoundLabel.textContent = isEn ? "Auto rotating · 1 bead / 1.2s" : "自动念佛中 · 逐颗流转";
      beadsAutoTimer = setInterval(() => {
        if (!document.hidden && beadsWidget.classList.contains("is-open")) rollOneBead();
      }, 1250);
    } else {
      beadsRoundLabel.textContent = isEn ? "Click / drag / wheel to turn" : "点击 / 滑过 / 滚轮逐颗拨珠";
    }
  }

  beadsManualBtn.addEventListener("click", () => setBeadsMode(false));
  beadsAutoBtn.addEventListener("click", () => setBeadsMode(true));

  beadsBtn.addEventListener("click", () => {
    const open = beadsWidget.classList.toggle("is-open");
    beadsBtn.classList.toggle("is-active", open);
    if (!open) setBeadsMode(false);
  });

  function rollOneBead() {
    beadsCount += 1;
    beadsTargetAngle -= STEP_RAD; // 每次精确顺时针转动一颗珠子
    beadsCountEl.textContent = String(beadsCount);
    const fullRound = beadsCount % BEAD_TOTAL === 0;
    playTone(fullRound ? "lamp" : "bead");
    recordAction("u-me", "你", "本机", "beads", true);
    spawnSpotFloat(82, 74, fullRound ? "圆满一串 +1" : "念诵 +1");
    if (fullRound) {
      showToast(`已圆满念诵 ${beadsCount / BEAD_TOTAL} 串（${beadsCount} 声）`);
    }
  }

  beadsTrack.addEventListener("click", rollOneBead);
  beadsTrack.addEventListener("wheel", (e) => {
    e.preventDefault();
    rollOneBead();
  }, { passive: false });
  let dragStartX = null;
  beadsTrack.addEventListener("pointerdown", (e) => { dragStartX = e.clientX; });
  beadsTrack.addEventListener("pointermove", (e) => {
    if (dragStartX === null) return;
    if (Math.abs(e.clientX - dragStartX) > 22) {
      dragStartX = e.clientX;
      rollOneBead();
    }
  });
  window.addEventListener("pointerup", () => { dragStartX = null; });

  // 敲木鱼（支持手动点击/空格键 + 自动敲击切换）
  let fishCount = 0;
  let fishAutoTimer = null;
  const fishToggleBtn = document.getElementById("btn-act-fish");
  const fishAutoBtn = document.getElementById("btn-fish-auto");

  function setFishAuto(on) {
    clearInterval(fishAutoTimer);
    fishAutoTimer = null;
    fishAutoBtn.classList.toggle("is-on", on);
    fishAutoBtn.textContent = on ? (isEn ? "Auto On" : "自动中") : (isEn ? "Auto" : "自动");
    if (on) {
      fishAutoTimer = setInterval(() => {
        if (!document.hidden && fishWidget.classList.contains("is-open")) strikeFish();
      }, 1150);
    }
  }
  fishAutoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setFishAuto(!fishAutoBtn.classList.contains("is-on"));
  });

  fishToggleBtn.addEventListener("click", () => {
    const open = fishWidget.classList.toggle("is-open");
    fishToggleBtn.classList.toggle("is-active", open);
    if (!open) setFishAuto(false);
  });

  function strikeFish() {
    fishCount += 1;
    fishCountEl.textContent = String(fishCount);
    playTone("fish");
    fishBtn.classList.remove("is-struck");
    void fishBtn.offsetWidth;
    fishBtn.classList.add("is-struck");
    recordAction("u-me", "你", "本机", "fish", true);
    spawnSpotFloat(16, 74, "静心 +1");
  }
  fishBtn.addEventListener("click", strikeFish);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && fishWidget.classList.contains("is-open")) {
      e.preventDefault();
      strikeFish();
    }
  });

  /* ===== 8. 丝绸状缠绕檀香青烟 + 60fps 金光浮尘 + 刚体视差 ===== */
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

  const haloScreen = { x: 0, y: 0, r: 110 };
  const haloSparks = [];

  function syncHaloToPaintedRing() {
    // 精确匹配 3840x2405 原图 .hall-bg-layer (inset:-3%, bg-pos:50% 16%/12%, cover, scale:1.03) 的项光圆心与直径
    const IW = 3840, IH = 2405;
    const isMob = w <= 780;
    const bgPosY = isMob ? 0.12 : 0.16;
    const bw = w * 1.06, bh = h * 1.06;
    const sCover = Math.max(bw / IW, bh / IH);
    const rw = IW * sCover, rh = IH * sCover;
    const imgLeft = (bw - rw) * 0.50;
    const imgTop  = (bh - rh) * bgPosY;
    const hxLocal = imgLeft + 0.4984 * rw;
    const hyLocal = imgTop  + 0.1979 * rh;
    const hrLocal = 0.1110 * rh;
    const hxScreen = (w * 0.5) + (hxLocal - bw * 0.5) * 1.03;
    const hyScreen = (h * 0.5) + (hyLocal - bh * 0.5) * 1.03;
    const hrScreen = hrLocal * 1.03;
    const hdScreen = hrScreen * 2.0;
    haloScreen.x = hxScreen;
    haloScreen.y = hyScreen;
    haloScreen.r = hrScreen;
    stage.style.setProperty("--halo-x", `${hxScreen.toFixed(1)}px`);
    stage.style.setProperty("--halo-y", `${hyScreen.toFixed(1)}px`);
    stage.style.setProperty("--halo-d", `${hdScreen.toFixed(1)}px`);
  }

  function initHaloSparks() {
    if (haloSparks.length) return;
    for (let i = 0; i < 30; i++) {
      // 集中在佛头后方与上方 240° 扇区，避免穿过下方佛胸
      const angle = -Math.PI * 1.16 + Math.random() * (Math.PI * 1.32);
      haloSparks.push({
        angle,
        prog: Math.random(),
        speed: 0.0022 + Math.random() * 0.0028,
        size: 1.0 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 0.0015,
      });
    }
  }

  function drawRadiatingHaloSparks() {
    const cx = haloScreen.x - curX * 0.45;
    const cy = haloScreen.y - curY * 0.32;
    const r0 = haloScreen.r * 0.96;
    const span = haloScreen.r * 1.45;
    ctx.save();
    for (let i = 0; i < haloSparks.length; i++) {
      const s = haloSparks[i];
      s.prog += s.speed;
      s.angle += s.drift;
      if (s.prog >= 1) {
        s.prog = 0;
        s.angle = -Math.PI * 1.16 + Math.random() * (Math.PI * 1.32);
      }
      const dist = r0 + s.prog * span;
      const sx = cx + Math.cos(s.angle) * dist;
      const sy = cy + Math.sin(s.angle) * dist;
      const fadeIn = Math.min(1, s.prog * 5);
      const fadeOut = Math.pow(1 - s.prog, 1.35);
      const alpha = 0.72 * fadeIn * fadeOut;
      if (alpha < 0.01) continue;
      ctx.fillStyle = `rgba(255, 238, 178, ${alpha.toFixed(3)})`;
      ctx.shadowColor = `rgba(255, 214, 108, ${(alpha * 0.9).toFixed(3)})`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size * (1 - s.prog * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    syncHaloToPaintedRing();
    initHaloSparks();
    if (!motes.length) {
      for (let i = 0; i < 48; i++) {
        motes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.8 + Math.random() * 1.5, vy: -(0.14 + Math.random() * 0.26), phase: Math.random() * Math.PI * 2, alpha: 0.2 + Math.random() * 0.48 });
      }
    }
  }
  window.addEventListener("resize", resize);
  resize();

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, w) - 0.5) * 16;
    targetY = (e.clientY / Math.max(1, h) - 0.5) * 9;
  });

  function drawSilkIncenseSmoke(t) {
    const baseX = w * 0.5 + curX * 0.24;
    const baseY = h * 0.55 + curY * 0.16;
    const topY = h * 0.19;
    const heightSpan = Math.max(120, baseY - topY);
    const boost = 1 + extraStrands * 0.55;
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let s = 0; s < strands.length; s++) {
      const st = strands[s];
      const steps = 40;
      for (let i = 0; i < steps; i++) {
        const p0 = i / steps, p1 = (i + 1) / steps;
        const y0 = baseY - p0 * heightSpan, y1 = baseY - p1 * heightSpan;
        const sway0 = Math.sin(p0 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p0 * 1.35) + Math.cos(p0 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.2 * p0;
        const sway1 = Math.sin(p1 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p1 * 1.35) + Math.cos(p1 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.2 * p1;
        const x0 = baseX + st.ox * (1 + p0 * 1.35) + sway0, x1 = baseX + st.ox * (1 + p1 * 1.35) + sway1;
        const alpha = st.alpha * Math.min(1, p0 * 7) * Math.pow(1 - p0, 1.45) * boost;
        if (alpha < 0.004) continue;
        ctx.strokeStyle = `rgba(234, 232, 224, ${alpha.toFixed(3)})`;
        ctx.lineWidth = st.width * (0.68 + p0 * 4.0);
        ctx.shadowColor = `rgba(236, 232, 220, ${(alpha * 0.85).toFixed(3)})`;
        ctx.shadowBlur = 4 + p0 * 14;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const t = now * 0.001;
    curX += (targetX + Math.sin(t * 0.38) * 2.0 - curX) * 0.06;
    curY += (targetY + Math.cos(t * 0.3) * 1.3 - curY) * 0.06;
    stage.style.setProperty("--px", `${curX.toFixed(2)}px`);
    stage.style.setProperty("--py", `${curY.toFixed(2)}px`);

    extraStrands *= 0.988;
    ctx.clearRect(0, 0, w, h);
    drawRadiatingHaloSparks();
    drawSilkIncenseSmoke(t);
    if (beadsWidget.classList.contains("is-open")) {
      drawRosaryRing(t);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.phase += 0.024; m.y += m.vy; m.x += Math.sin(m.phase) * 0.18;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      const a = m.alpha * (0.55 + 0.45 * Math.sin(m.phase * 1.4));
      ctx.fillStyle = `rgba(255, 234, 174, ${a})`;
      ctx.beginPath(); ctx.arc(m.x + curX * 0.35, m.y + curY * 0.25, m.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  requestAnimationFrame(tick);

  /* ===== 9. 顶栏开关 ===== */
  const quietBtn = document.getElementById("btn-quiet");
  quietBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("quiet-mode");
    quietBtn.classList.toggle("is-on", on);
    quietBtn.textContent = on ? "已清净" : "清净模式";
    if (on) closePopover();
    showToast(on ? "已开启清净模式 · 独享静谧大雄宝殿" : "已恢复多人共修与实时榜单");
  });

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
    document.getElementById("t-hall-sub").textContent = isEn ? "First-Person Sanctuary · 7 Cushions, Diverse Pilgrims & Zen Tools" : "第一人称多人共修 · 7席蒲团 + 多角色同修 + 听佛/佛珠/木鱼";
    document.getElementById("t-online").textContent = isEn ? "Pilgrims" : "位同修在殿";
    document.getElementById("t-board-title").textContent = isEn ? "Hall Merit Board" : "殿内共修榜";
    document.getElementById("t-incense").textContent = isEn ? "Incense" : "敬香";
    document.getElementById("t-bow").textContent = isEn ? "Bow" : "礼拜";
    document.getElementById("t-lamp").textContent = isEn ? "Lamp" : "供灯";
    document.getElementById("t-tea").textContent = isEn ? "Tea" : "奉茶";
    document.getElementById("t-lotus").textContent = isEn ? "Lotus" : "献花";
    document.getElementById("t-listen").textContent = isEn ? "Listen" : "听佛";
    document.getElementById("t-beads").textContent = isEn ? "Beads" : "佛珠";
    document.getElementById("t-fish").textContent = isEn ? "Fish" : "木鱼";
    boardOpenBtn.textContent = isEn ? "Board" : "共修榜";
    boardToggleBtn.textContent = isEn ? "Close" : "收起";
    renderBoard();
  });
})();
