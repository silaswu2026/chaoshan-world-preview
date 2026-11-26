(() => {
  "use strict";

  const stage = document.getElementById("hall-stage");
  const incenseBox = document.getElementById("altar-incense-box");
  const candlesLayer = document.getElementById("altar-candles-layer");
  const lotusLayer = document.getElementById("altar-lotus-layer");
  const teaRowEl = document.getElementById("altar-tea-row");
  const cushionsLayer = document.getElementById("hall-cushions-layer");
  const visitorsLayer = document.getElementById("hall-visitors-layer");
  const popupStack = document.getElementById("live-popup-stack");
  const boardEl = document.getElementById("merit-board");
  const boardListEl = document.getElementById("board-list");
  const boardTotalEl = document.getElementById("board-total-actions");
  const toastEl = document.getElementById("hall-toast");
  const bgm = document.getElementById("hall-bgm");

  const fpIncense = document.getElementById("fp-incense-actor");
  const fpHands = document.getElementById("fp-hands-actor");
  const fpOffer = document.getElementById("fp-offer-actor");
  const fpOfferImg = document.getElementById("fp-offer-img");

  const popover = document.getElementById("offering-popover");
  const popoverMeta = document.getElementById("popover-meta");
  const popoverWish = document.getElementById("popover-wish");
  const popoverBlessBtn = document.getElementById("popover-bless-btn");
  const popoverBlessNum = document.getElementById("popover-bless-num");

  const V = "20261126-3dv1-11";
  let isEn = false;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-show"), 2500);
  }

  function formatNow() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${mi}`;
  }

  /* ===== WebAudio 柔和法器清音 ===== */
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

  /* ===== 1. 前方实时动态弹窗：【地址】日期、某某、做了什么 ===== */
  function pushLivePopup(city, name, actionText) {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    while (popupStack.children.length >= 2) {
      popupStack.firstElementChild?.remove();
    }
    const card = document.createElement("div");
    card.className = "live-popup-card";
    card.innerHTML = `
      <span class="pop-city">【${city}】</span>
      <span class="pop-time">${formatNow()}</span>
      <span class="pop-who">${name}</span>
      <span class="pop-act">${actionText}</span>
    `;
    popupStack.appendChild(card);
    setTimeout(() => card.remove(), 4200);
  }

  /* ===== 2. 右上角共修行为清单 / 排行榜（同一个人自动累计计数） ===== */
  const ledger = new Map();
  const ACT_LABELS = { incense: "香", bow: "礼", lamp: "灯", tea: "茶", lotus: "花" };
  const ACT_LABELS_EN = { incense: "Inc", bow: "Bow", lamp: "Lmp", tea: "Tea", lotus: "Flw" };

  function recordAction(id, name, city, type, isMe = false) {
    let entry = ledger.get(id);
    if (!entry) {
      entry = { id, name, city, isMe, total: 0, counts: { incense: 0, bow: 0, lamp: 0, tea: 0, lotus: 0 }, lastTs: 0 };
      ledger.set(id, entry);
    }
    entry.counts[type] = (entry.counts[type] || 0) + 1;
    entry.total += 1;
    entry.lastTs = Date.now();
    renderBoard(id);
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

  // 预置几位刚刚入殿的同修记录，确保打开就有真实共修排行榜氛围
  recordAction("u-lin",   "林安",   "旧金山", "incense");
  recordAction("u-lin",   "林安",   "旧金山", "bow");
  recordAction("u-ruo",   "若水",   "温哥华", "lamp");
  recordAction("u-ruo",   "若水",   "温哥华", "bow");
  recordAction("u-chen",  "陈志远", "纽约",   "incense");
  recordAction("u-maya",  "Maya",   "Seattle","tea");

  const boardToggleBtn = document.getElementById("btn-board-toggle");
  boardToggleBtn.addEventListener("click", () => {
    const collapsed = boardEl.classList.toggle("is-collapsed");
    boardToggleBtn.textContent = collapsed ? (isEn ? "Open" : "展开") : (isEn ? "Hide" : "收起");
  });

  /* ===== 3. 殿前写实蒲团阵（左右 4 席同修蒲团 + 正中 1 席你的主蒲团） ===== */
  const cushionSlots = [
    { id: "c-lb", x: 24.5, y: 80.5, scale: 0.78, vh: 148, role: "visitor" },
    { id: "c-rb", x: 75.5, y: 80.5, scale: 0.78, vh: 148, role: "visitor" },
    { id: "c-lf", x: 15.5, y: 89.5, scale: 0.96, vh: 184, role: "visitor" },
    { id: "c-rf", x: 84.5, y: 89.5, scale: 0.96, vh: 184, role: "visitor" },
    { id: "c-me", x: 50.0, y: 90.8, scale: 1.00, vh: 0,   role: "self" },
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
    { x: -8,  rot: -4,  h: 30, name: "清和",   city: "台北",   wish: "智慧明澈，不染尘劳", bless: 14 },
    { x: 0,   rot: 0,   h: 32, name: "陈志远", city: "纽约",   wish: "愿众生安乐，所求皆安", bless: 16 },
    { x: 8,   rot: 4,   h: 30, name: "周宁",   city: "上海",   wish: "平安喜乐，自在清净", bless: 8 },
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

  // ② 四盏对称古铜酥油灯（稳居须弥座石台内侧与木质供桌两角，与原图高烛台互不重叠）
  const peerCandles = [
    { name: "清和",  city: "台北",   tag: "平安",    wish: "愿一家老小四季平安", x: 31.4, y: 62.6, scale: 0.84, bless: 9 },
    { name: "Maya",  city: "Seattle",tag: "Peace",   wish: "Quiet peace for everyone", x: 36.6, y: 67.6, scale: 0.94, bless: 12 },
    { name: "Grace", city: "Toronto",tag: "Family",  wish: "Blessings for my family", x: 63.4, y: 67.6, scale: 0.94, bless: 11 },
    { name: "慧心",  city: "洛杉矶", tag: "安宁",    wish: "一灯能除千年暗", x: 68.6, y: 62.6, scale: 0.84, bless: 13 },
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

  /* ===== 5. 模拟多位其他用户动态进入大殿（在左右蒲团上真实烧香、跪拜） ===== */
  const visitorPool = [
    { id: "u-lin",   name: "林安",   city: "旧金山", filter: "brightness(0.92) contrast(1.06)" },
    { id: "u-ruo",   name: "若水",   city: "温哥华", filter: "brightness(0.88) sepia(0.24) hue-rotate(-10deg)" },
    { id: "u-chen",  name: "陈志远", city: "纽约",   filter: "brightness(0.84) contrast(1.1) saturate(0.85)" },
    { id: "u-maya",  name: "Maya",   city: "Seattle",filter: "brightness(0.95) sepia(0.18) hue-rotate(8deg)" },
    { id: "u-zhou",  name: "周宁",   city: "上海",   filter: "brightness(0.86) hue-rotate(165deg) saturate(0.55)" },
    { id: "u-david", name: "David",  city: "Boston", filter: "brightness(0.9) sepia(0.28)" },
  ];

  // 4 个同修蒲团席位状态
  const visitorSlots = cushionSlots.slice(0, 4).map((slot, idx) => ({
    slotIndex: idx,
    x: slot.x,
    y: slot.y + 0.6,
    vh: slot.vh,
    user: null,
    el: null,
  }));

  function spawnVisitorAt(slotIdx, user) {
    const s = visitorSlots[slotIdx];
    if (s.el) s.el.remove();
    s.user = user;
    const el = document.createElement("div");
    el.className = "visitor-actor";
    el.style.left = `${s.x}%`;
    el.style.top = `${s.y}%`;
    el.style.setProperty("--vh", `${s.vh}px`);
    el.style.setProperty("--robe-filter", user.filter);
    el.innerHTML = `
      <div class="visitor-badge"><b>${user.name}</b> · ${user.city}</div>
      <div class="visitor-shadow"></div>
      <img class="visitor-img is-stand" src="./assets/pilgrim-fg.png?v=${V}" alt="" />
      <img class="visitor-img is-bow" src="./assets/pilgrim-bow.png?v=${V}" alt="" />
    `;
    visitorsLayer.appendChild(el);
    s.el = el;
    requestAnimationFrame(() => el.classList.add("is-present"));
  }

  // 初始让 2 位同修已在左右后排蒲团静立共修
  spawnVisitorAt(0, visitorPool[0]);
  spawnVisitorAt(1, visitorPool[1]);
  // 稍后再模拟第 3 位同修入殿至左前蒲团
  setTimeout(() => {
    if (!document.hidden) {
      spawnVisitorAt(2, visitorPool[2]);
      pushLivePopup(visitorPool[2].city, visitorPool[2].name, "步入大雄宝殿，立于佛前蒲团");
    }
  }, 2400);

  let simStep = 0;
  function runVisitorSimulation() {
    if (document.hidden) return;
    const activeSlots = visitorSlots.filter((s) => s.user && s.el);
    // 每隔几轮轮换一位同修离殿并迎入新同修
    if (simStep > 0 && simStep % 5 === 0) {
      const targetSlot = visitorSlots[simStep % 4];
      const nextUser = visitorPool[(simStep + 2) % visitorPool.length];
      if (!visitorSlots.some((s) => s.user && s.user.id === nextUser.id)) {
        if (targetSlot.el) {
          targetSlot.el.classList.remove("is-present");
          setTimeout(() => spawnVisitorAt(targetSlot.slotIndex, nextUser), 700);
        } else {
          spawnVisitorAt(targetSlot.slotIndex, nextUser);
        }
        pushLivePopup(nextUser.city, nextUser.name, "步入大雄宝殿");
        simStep++;
        return;
      }
    }

    const actor = activeSlots[simStep % activeSlots.length];
    if (!actor) return;
    const u = actor.user;
    const actionCycle = ["bow", "incense", "lamp", "tea", "bow", "lotus"];
    const act = actionCycle[simStep % actionCycle.length];
    simStep++;

    if (act === "bow") {
      actor.el.classList.add("is-bowing");
      setTimeout(() => actor.el && actor.el.classList.remove("is-bowing"), 3200);
      recordAction(u.id, u.name, u.city, "bow");
      pushLivePopup(u.city, u.name, "于蒲团虔诚合十礼拜");
    } else if (act === "incense") {
      addIncenseStick(u.name, u.city, "愿心安住，吉祥平安");
      recordAction(u.id, u.name, u.city, "incense");
      pushLivePopup(u.city, u.name, "敬了一炷清香");
    } else if (act === "lamp") {
      const idx = lampCursor++ % peerCandles.length;
      peerCandles[idx] = { ...peerCandles[idx], name: u.name, city: u.city, wish: "点亮心灯，光明常照", bless: 1 };
      renderCandles(idx);
      recordAction(u.id, u.name, u.city, "lamp");
      pushLivePopup(u.city, u.name, "供奉了一盏长明酥油灯");
    } else if (act === "tea") {
      const idx = teaCursor++ % teaCups.length;
      teaCups[idx] = { ...teaCups[idx], filled: true, name: u.name, city: u.city, wish: "奉茶净心，清安自在", bless: 1 };
      renderTeaRow(idx);
      recordAction(u.id, u.name, u.city, "tea");
      pushLivePopup(u.city, u.name, "奉上了一盏青瓷清茶");
    } else if (act === "lotus") {
      const idx = lotusCursor++ % lotusItems.length;
      lotusItems[idx] = { ...lotusItems[idx], name: u.name, city: u.city, wish: "佛前供莲，清净庄严", bless: 1 };
      renderLotus(idx);
      recordAction(u.id, u.name, u.city, "lotus");
      pushLivePopup(u.city, u.name, "于佛前献上一盘白莲");
    }
  }

  setTimeout(runVisitorSimulation, 1500);
  setInterval(runVisitorSimulation, 5400);

  /* ===== 6. 第一人称四大仪式动画（敬香 / 礼拜 / 供灯 / 奉茶 / 献花） ===== */
  let busyRitual = false;

  // ① 敬香：点香 → 插上香炉 → 亮起火星与青烟
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
      pushLivePopup("本机", "你", "点燃清香并插于佛前香炉");
      showToast("清香已燃并插于香炉 · 丝缕青烟徐徐升空");
    }, 1550);

    setTimeout(() => {
      fpIncense.classList.remove("is-playing");
      busyRitual = false;
    }, 2450);
  });

  // ② 礼拜：自然暖光双手合十 → 第一人称镜头下跪俯首 → 缓缓起身
  document.getElementById("btn-act-bow").addEventListener("click", () => {
    if (busyRitual) return;
    busyRitual = true;
    playTone("bell");
    fpHands.classList.add("is-raised");

    setTimeout(() => {
      stage.classList.add("is-fp-bowing");
      fpHands.classList.add("is-bowed");
      recordAction("u-me", "你", "本机", "bow", true);
      pushLivePopup("本机", "你", "合十跪拜顶礼");
      showToast("合十跪拜 · 一心顶礼");
    }, 650);

    setTimeout(() => {
      stage.classList.remove("is-fp-bowing");
      fpHands.classList.remove("is-bowed");
    }, 2350);

    setTimeout(() => {
      fpHands.classList.remove("is-raised");
      busyRitual = false;
    }, 3250);
  });

  function playOfferFly(imgSrc, targetXPercent, targetYFromBottomVh, onLand) {
    if (busyRitual) return;
    busyRitual = true;
    fpOfferImg.src = imgSrc;
    fpOffer.style.setProperty("--offer-tx", `${targetXPercent}%`);
    fpOffer.style.setProperty("--offer-ty", `${targetYFromBottomVh}vh`);
    fpOffer.classList.remove("is-playing");
    void fpOffer.offsetWidth;
    fpOffer.classList.add("is-playing");
    setTimeout(onLand, 1400);
    setTimeout(() => {
      fpOffer.classList.remove("is-playing");
      busyRitual = false;
    }, 1900);
  }

  // ③ 供灯动画
  document.getElementById("btn-act-lamp").addEventListener("click", () => {
    const idx = lampCursor++ % peerCandles.length;
    const seat = peerCandles[idx];
    playTone("lamp");
    playOfferFly(`./assets/offering-lamp.png?v=${V}`, seat.x, 100 - seat.y, () => {
      peerCandles[idx] = { ...seat, name: "你", city: "本机", tag: "心灯", wish: "点亮一盏长明酥油灯，愿光明温暖常伴", bless: 1 };
      renderCandles(idx);
      recordAction("u-me", "你", "本机", "lamp", true);
      pushLivePopup("本机", "你", "奉上并点亮一盏古铜酥油灯");
      showToast("酥油灯已奉至供台 · 暖金灯火亮起");
    });
  });

  // ④ 奉茶动画
  function triggerSelfTea(forcedIdx = -1) {
    const idx = forcedIdx >= 0 ? forcedIdx : (teaCups.findIndex((c) => !c.filled) >= 0 ? teaCups.findIndex((c) => !c.filled) : (teaCursor++ % teaCups.length));
    const seat = teaCups[idx];
    playTone("tea");
    playOfferFly(`./assets/offering-tea.png?v=${V}`, seat.x, 100 - seat.y, () => {
      teaCups[idx] = { ...seat, filled: true, name: "你", city: "本机", wish: "奉一盏青瓷清茶，愿心如止水", bless: 1 };
      renderTeaRow(idx);
      recordAction("u-me", "你", "本机", "tea", true);
      pushLivePopup("本机", "你", "于佛前奉上一盏青瓷清茶");
      showToast("清茶已奉上供桌 · 水纹轻漾、茶雾微升");
    });
  }
  document.getElementById("btn-act-tea").addEventListener("click", () => triggerSelfTea());

  // ⑤ 献花动画
  document.getElementById("btn-act-lotus").addEventListener("click", () => {
    const idx = lotusCursor++ % lotusItems.length;
    const seat = lotusItems[idx];
    playTone("lotus");
    playOfferFly(`./assets/offering-lotus.png?v=${V}`, seat.x, 100 - seat.y, () => {
      lotusItems[idx] = { ...seat, name: "你", city: "本机", wish: "佛前供莲，清净庄严", bless: 1 };
      renderLotus(idx);
      recordAction("u-me", "你", "本机", "lotus", true);
      pushLivePopup("本机", "你", "于佛前供上一盘白莲");
      showToast("白莲已奉至供台 · 清雅绽放");
    });
  });

  /* ===== 7. 丝绸状缠绕檀香青烟 + 60fps 金光浮尘 + 刚体视差 ===== */
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
    w = window.innerWidth; h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    drawSilkIncenseSmoke(t);
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

  /* ===== 8. 顶栏开关 ===== */
  const quietBtn = document.getElementById("btn-quiet");
  quietBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("quiet-mode");
    quietBtn.classList.toggle("is-on", on);
    quietBtn.textContent = on ? "已清净" : "清净模式";
    if (on) closePopover();
    showToast(on ? "已开启清净模式 · 独享静谧大雄宝殿" : "已恢复多人共修与实时榜单");
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
    document.getElementById("t-hall-sub").textContent = isEn ? "First-Person Sanctuary · Cushions, Rituals & Live Merit Board" : "第一人称共修测试 · 殿前蒲团 + 四大仪式动画 + 实时共修榜";
    document.getElementById("t-online").textContent = isEn ? "Pilgrims" : "位同修在殿";
    document.getElementById("t-board-title").textContent = isEn ? "Hall Merit Board" : "殿内共修榜";
    document.getElementById("t-incense").textContent = isEn ? "Incense" : "敬香";
    document.getElementById("t-bow").textContent = isEn ? "Bow" : "礼拜";
    document.getElementById("t-lamp").textContent = isEn ? "Lamp" : "供灯";
    document.getElementById("t-tea").textContent = isEn ? "Tea" : "奉茶";
    document.getElementById("t-lotus").textContent = isEn ? "Lotus" : "献花";
    boardToggleBtn.textContent = boardEl.classList.contains("is-collapsed") ? (isEn ? "Open" : "展开") : (isEn ? "Hide" : "收起");
    renderBoard();
  });
})();
