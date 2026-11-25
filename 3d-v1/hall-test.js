(() => {
  "use strict";

  const stage = document.getElementById("hall-stage");
  const cushionsEl = document.getElementById("hall-cushions");
  const censerZone = document.getElementById("live-censer-zone");
  const lampsLeft = document.getElementById("live-lamps-left");
  const lampsRight = document.getElementById("live-lamps-right");
  const toastEl = document.getElementById("hall-toast");
  const bgm = document.getElementById("hall-bgm");

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-show"), 2500);
  }

  /* ===== 1. 前景透视蒲团共修席位（6 位同修背影剪影 + 中央自己主蒲团） ===== */
  const peers = [
    { name: "清和",  action: "礼拜中",         mode: "bowing",  x: 16, y: 74, scale: 0.86 },
    { name: "Maya",  action: "Meditation 08:42", mode: "sitting", x: 30, y: 70, scale: 0.78 },
    { name: "林安",  action: "念珠 42/108",    mode: "sitting", x: 22, y: 83, scale: 0.96 },
    { name: "David", action: "Praying",        mode: "bowing",  x: 70, y: 70, scale: 0.78 },
    { name: "静远",  action: "合十静坐",       mode: "sitting", x: 84, y: 74, scale: 0.86 },
    { name: "Grace", action: "敬香祈福中",     mode: "bowing",  x: 78, y: 83, scale: 0.96 },
  ];

  function renderCushions() {
    cushionsEl.innerHTML = peers.map((p, idx) => `
      <button type="button" class="peer-seat is-${p.mode}" style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${p.scale})" data-peer="${idx}">
        <span class="peer-seat-tag"><b>${p.name}</b><span>${p.action}</span></span>
        <span class="peer-silhouette"><i class="p-head"></i><i class="p-body"></i></span>
        <span class="peer-pad"></span>
      </button>
    `).join("") + `
      <div class="peer-seat is-self" id="self-seat" style="left:50%;top:82%">
        <span class="peer-seat-tag"><b>你 · 主蒲团</b><span id="self-status">静候礼佛</span></span>
        <span class="peer-pad"></span>
      </div>
    `;

    cushionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-peer]");
      if (!btn) return;
      const p = peers[Number(btn.dataset.peer)];
      btn.classList.remove("is-blessed");
      void btn.offsetWidth;
      btn.classList.add("is-blessed");
      showToast(`已向同修「${p.name}」随喜共愿 · 莲光相应`);
    });
  }
  renderCushions();

  /* ===== 2. 环境光影实时联动他人动作（香炉实时新烟 + 两侧灯台亮灯） ===== */
  const liveEvents = [
    { type: "incense", text: "苏明轩 刚刚敬了一炷清香" },
    { type: "lamp",    side: "left",  text: "Grace 刚刚点亮一盏平安灯" },
    { type: "incense", text: "Maya 刚刚合十敬香 · Peace" },
    { type: "lamp",    side: "right", text: "周静安 刚刚供灯祈愿家人康健" },
    { type: "incense", text: "陈志远 刚刚于大雄宝殿敬香回向" },
    { type: "lamp",    side: "left",  text: "David 刚刚点亮智慧心灯" },
  ];
  let liveIdx = 0;
  let smokeBoost = 0;

  function triggerLiveAction(ev) {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    const whisper = document.createElement("div");
    whisper.className = "live-whisper";
    whisper.textContent = ev.text;

    if (ev.type === "incense") {
      smokeBoost = 1.0;
      censerZone.appendChild(whisper);
      setTimeout(() => whisper.remove(), 3600);
    } else {
      const target = ev.side === "right" ? lampsRight : lampsLeft;
      const dot = document.createElement("div");
      dot.className = "live-lamp-dot";
      target.appendChild(dot);
      target.appendChild(whisper);
      while (target.querySelectorAll(".live-lamp-dot").length > 4) {
        target.querySelector(".live-lamp-dot")?.remove();
      }
      setTimeout(() => whisper.remove(), 3600);
    }
  }

  setTimeout(() => triggerLiveAction(liveEvents[liveIdx++ % liveEvents.length]), 1200);
  setInterval(() => triggerLiveAction(liveEvents[liveIdx++ % liveEvents.length]), 4800);

  /* ===== 3. 60fps Canvas 金光浮尘 + 香炉实时升烟 + 刚体阻尼视差 ===== */
  const canvas = document.getElementById("hall-fx-canvas");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  const motes = [];
  const smokes = [];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!motes.length) {
      for (let i = 0; i < 64; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.9 + Math.random() * 1.9,
          vy: -(0.16 + Math.random() * 0.34),
          phase: Math.random() * Math.PI * 2,
          alpha: 0.25 + Math.random() * 0.55,
        });
      }
      for (let i = 0; i < 24; i++) {
        smokes.push({
          x: w * 0.5 + (Math.random() - 0.5) * 28,
          y: h * (0.42 + Math.random() * 0.22),
          r: 10 + Math.random() * 18,
          vy: -(0.35 + Math.random() * 0.35),
          phase: Math.random() * Math.PI * 2,
          alpha: 0.06 + Math.random() * 0.08,
        });
      }
    }
  }
  window.addEventListener("resize", resize);
  resize();

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, w) - 0.5) * 24;
    targetY = (e.clientY / Math.max(1, h) - 0.5) * 14;
  });
  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", (e) => {
      if (typeof e.gamma === "number" && typeof e.beta === "number") {
        targetX = Math.max(-24, Math.min(24, (e.gamma / 25) * 24));
        targetY = Math.max(-14, Math.min(14, ((e.beta - 45) / 25) * 14));
      }
    });
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const t = now * 0.001;
    curX += (targetX + Math.sin(t * 0.4) * 3 - curX) * 0.06;
    curY += (targetY + Math.cos(t * 0.32) * 2 - curY) * 0.06;
    stage.style.setProperty("--px", `${curX.toFixed(2)}px`);
    stage.style.setProperty("--py", `${curY.toFixed(2)}px`);

    smokeBoost *= 0.985;
    ctx.clearRect(0, 0, w, h);

    // 香炉实时青烟
    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      s.phase += 0.02;
      s.y += s.vy * (1 + smokeBoost * 0.7);
      s.x += Math.sin(s.phase) * 0.35;
      if (s.y < h * 0.34) {
        s.y = h * 0.64;
        s.x = w * 0.5 + (Math.random() - 0.5) * 26;
      }
      const progress = (h * 0.64 - s.y) / (h * 0.30);
      const fade = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI);
      const a = s.alpha * fade * (1 + smokeBoost * 1.4);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * (1 + progress * 0.6));
      g.addColorStop(0, `rgba(236, 232, 222, ${a})`);
      g.addColorStop(1, "rgba(236, 232, 222, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (1 + progress * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // 殿内金光浮尘
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.phase += 0.025;
      m.y += m.vy;
      m.x += Math.sin(m.phase) * 0.2;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      const a = m.alpha * (0.55 + 0.45 * Math.sin(m.phase * 1.4));
      ctx.fillStyle = `rgba(255, 234, 174, ${a})`;
      ctx.beginPath();
      ctx.arc(m.x + curX * 0.4, m.y + curY * 0.3, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  requestAnimationFrame(tick);

  /* ===== 4. 底部礼佛互动 + 顶栏开关 ===== */
  let bellCtx = null;
  function playBell() {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      bellCtx ||= new Ctor();
      if (bellCtx.state === "suspended") bellCtx.resume().catch(() => {});
      const now = bellCtx.currentTime;
      [146.8, 293.7, 440].forEach((f, i) => {
        const o = bellCtx.createOscillator();
        const g = bellCtx.createGain();
        o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.14 / (i + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2 - i * 0.6);
        o.connect(g).connect(bellCtx.destination);
        o.start(now); o.stop(now + 3.4);
      });
    } catch (_) {}
  }

  document.getElementById("btn-act-incense").addEventListener("click", () => {
    playBell();
    triggerLiveAction({ type: "incense", text: "你 刚刚敬了一炷清香 · 香云供养" });
    document.getElementById("self-status").textContent = "已敬清香";
    showToast("清香已奉上 · 炉中青烟袅袅升起");
  });

  document.getElementById("btn-act-bow").addEventListener("click", () => {
    const bow = document.getElementById("bow-hands-layer");
    bow.classList.add("is-show");
    document.getElementById("self-seat").classList.add("is-blessed");
    document.getElementById("self-status").textContent = "一心顶礼中";
    setTimeout(() => {
      bow.classList.remove("is-show");
      document.getElementById("self-seat").classList.remove("is-blessed");
    }, 2600);
    showToast("一心顶礼 · 愿心无散乱");
  });

  document.getElementById("btn-act-lamp").addEventListener("click", () => {
    triggerLiveAction({ type: "lamp", side: Math.random() > 0.5 ? "left" : "right", text: "你 刚刚于大雄宝殿点亮一盏心灯" });
    document.getElementById("self-status").textContent = "已供心灯";
    showToast("心灯已于殿前点亮");
  });

  const quietBtn = document.getElementById("btn-quiet");
  quietBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("quiet-mode");
    quietBtn.classList.toggle("is-on", on);
    quietBtn.textContent = on ? "已清净" : "清净模式";
    showToast(on ? "已开启清净模式 · 隐藏同修与联动动态" : "已恢复多人共修同在感");
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

  let isEn = false;
  document.getElementById("btn-lang").addEventListener("click", (e) => {
    isEn = !isEn;
    e.target.textContent = isEn ? "中文" : "EN";
    document.getElementById("t-hall-name").textContent = isEn ? "Mahāvīra Hall · Shakyamuni Buddha" : "大雄宝殿 · 释迦牟尼佛";
    document.getElementById("t-hall-sub").textContent = isEn ? "3D-v1 Single-Hall Test · 4K Rigid Parallax + Live Presence" : "3D-v1 单页测试 · 4K 刚体视差 + 多人在场感";
    document.getElementById("t-online").textContent = isEn ? "Pilgrims in Hall" : "位同修正在殿内";
    document.getElementById("t-incense").textContent = isEn ? "Incense" : "敬香";
    document.getElementById("t-bow").textContent = isEn ? "Bow" : "礼拜";
    document.getElementById("t-lamp").textContent = isEn ? "Lamp" : "供灯";
  });
})();
