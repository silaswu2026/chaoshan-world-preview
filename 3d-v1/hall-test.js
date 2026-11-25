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

  /* ===== 1. 真实光影同修烛火海（彻底移除假剪影人偶，每盏摇曳烛火对应一位在场同修） ===== */
  const peerCandles = [
    { name: "清和",  tag: "平安",     x: 15, y: 69, scale: 0.78 },
    { name: "Maya",  tag: "Peace",    x: 24, y: 74, scale: 0.90 },
    { name: "林安",  tag: "静心",     x: 33, y: 78, scale: 1.00 },
    { name: "周宁",  tag: "康健",     x: 19, y: 81, scale: 1.06 },
    { name: "苏明",  tag: "考学",     x: 29, y: 66, scale: 0.72 },
    { name: "David", tag: "Clarity",  x: 71, y: 66, scale: 0.72 },
    { name: "静远",  tag: "顺遂",     x: 67, y: 78, scale: 1.00 },
    { name: "Grace", tag: "Family",   x: 76, y: 74, scale: 0.90 },
    { name: "慧心",  tag: "安宁",     x: 85, y: 69, scale: 0.78 },
    { name: "Alex",  tag: "Hope",     x: 81, y: 81, scale: 1.06 },
  ];

  function renderPeerCandles() {
    cushionsEl.innerHTML = peerCandles.map((p, idx) => `
      <button type="button" class="peer-candle" style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${p.scale})" data-peer="${idx}">
        <span class="candle-halo" style="animation-delay:${-(idx * 0.4)}s"><i class="candle-flame-tip" style="animation-delay:${-(idx * 0.35)}s"></i></span>
        <span class="candle-wax"></span>
        <span class="peer-candle-label"><b>${p.name}</b> · ${p.tag}</span>
      </button>
    `).join("");

    cushionsEl.onclick = (e) => {
      const btn = e.target.closest("[data-peer]");
      if (!btn) return;
      const p = peerCandles[Number(btn.dataset.peer)];
      btn.classList.remove("is-blessed");
      void btn.offsetWidth;
      btn.classList.add("is-blessed");
      showToast(`已为同修「${p.name}」的平安烛随喜添光`);
    };
  }
  renderPeerCandles();

  /* ===== 2. 环境光影实时联动他人动作（香炉丝烟加浓 + 两侧烛火微字） ===== */
  const liveEvents = [
    { type: "incense", text: "苏明轩 刚刚敬了一炷清香" },
    { type: "lamp",    side: "left",  text: "Grace 刚刚点亮一盏平安烛" },
    { type: "incense", text: "Maya 刚刚合十敬香 · Peace" },
    { type: "lamp",    side: "right", text: "周静安 刚刚供灯祈愿家人康健" },
    { type: "incense", text: "陈志远 刚刚于大雄宝殿敬香回向" },
    { type: "lamp",    side: "left",  text: "David 刚刚点亮智慧心灯" },
  ];
  let liveIdx = 0;
  let extraStrands = 0;

  function triggerLiveAction(ev) {
    if (document.body.classList.contains("quiet-mode") || document.hidden) return;
    const whisper = document.createElement("div");
    whisper.className = "live-whisper";
    whisper.textContent = ev.text;

    if (ev.type === "incense") {
      extraStrands = 1.0;
      censerZone.appendChild(whisper);
      setTimeout(() => whisper.remove(), 3600);
    } else {
      const target = ev.side === "right" ? lampsRight : lampsLeft;
      const dot = document.createElement("div");
      dot.className = "live-lamp-dot";
      target.appendChild(dot);
      target.appendChild(whisper);
      while (target.querySelectorAll(".live-lamp-dot").length > 3) {
        target.querySelector(".live-lamp-dot")?.remove();
      }
      setTimeout(() => whisper.remove(), 3600);
    }
  }

  setTimeout(() => triggerLiveAction(liveEvents[liveIdx++ % liveEvents.length]), 1400);
  setInterval(() => triggerLiveAction(liveEvents[liveIdx++ % liveEvents.length]), 5200);

  /* ===== 3. 重构香烟：纤细丝绸状缠绕青烟丝缕 + 60fps 金光微尘 + 刚体视差 ===== */
  const canvas = document.getElementById("hall-fx-canvas");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  const motes = [];

  // 5 条真实丝绸状檀香青烟丝缕参数
  const strands = [
    { ox: -8,  freq: 0.014, amp: 14, speed: 1.15, phase: 0.0, width: 1.6, alpha: 0.24 },
    { ox:  0,  freq: 0.011, amp: 20, speed: 0.92, phase: 1.7, width: 2.2, alpha: 0.30 },
    { ox:  8,  freq: 0.016, amp: 16, speed: 1.28, phase: 3.1, width: 1.5, alpha: 0.22 },
    { ox: -4,  freq: 0.009, amp: 26, speed: 0.78, phase: 4.4, width: 3.4, alpha: 0.14 },
    { ox:  5,  freq: 0.012, amp: 22, speed: 0.85, phase: 5.5, width: 2.8, alpha: 0.16 },
  ];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!motes.length) {
      for (let i = 0; i < 58; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.7,
          vy: -(0.14 + Math.random() * 0.30),
          phase: Math.random() * Math.PI * 2,
          alpha: 0.22 + Math.random() * 0.52,
        });
      }
    }
  }
  window.addEventListener("resize", resize);
  resize();

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = (e.clientX / Math.max(1, w) - 0.5) * 20;
    targetY = (e.clientY / Math.max(1, h) - 0.5) * 12;
  });
  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", (e) => {
      if (typeof e.gamma === "number" && typeof e.beta === "number") {
        targetX = Math.max(-20, Math.min(20, (e.gamma / 25) * 20));
        targetY = Math.max(-12, Math.min(12, ((e.beta - 45) / 25) * 12));
      }
    });
  }

  function drawSilkIncenseSmoke(t) {
    const baseX = w * 0.5 - curX * 0.55;
    const baseY = h * 0.67 - curY * 0.35;
    const topY = h * 0.24;
    const heightSpan = Math.max(120, baseY - topY);
    const boost = 1 + extraStrands * 0.55;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let s = 0; s < strands.length; s++) {
      const st = strands[s];
      const steps = 42;
      // 分段绘制，让烟缕从底部纤细凝实 -> 顶部随风轻盈拉宽消散
      for (let i = 0; i < steps; i++) {
        const p0 = i / steps;
        const p1 = (i + 1) / steps;
        const y0 = baseY - p0 * heightSpan;
        const y1 = baseY - p1 * heightSpan;

        // 越往上摆幅越大、烟丝越飘渺
        const sway0 = Math.sin(p0 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p0 * 1.35)
                    + Math.cos(p0 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.5 * p0;
        const sway1 = Math.sin(p1 * 7.5 - t * st.speed + st.phase) * st.amp * (0.25 + p1 * 1.35)
                    + Math.cos(p1 * 13.0 - t * st.speed * 0.7 + st.phase) * 4.5 * p1;

        const x0 = baseX + st.ox * (1 + p0 * 1.4) + sway0;
        const x1 = baseX + st.ox * (1 + p1 * 1.4) + sway1;

        const fadeIn = Math.min(1, p0 * 7);
        const fadeOut = Math.pow(1 - p0, 1.45);
        const alpha = st.alpha * fadeIn * fadeOut * boost;
        if (alpha < 0.004) continue;

        ctx.strokeStyle = `rgba(234, 232, 224, ${alpha.toFixed(3)})`;
        ctx.lineWidth = st.width * (0.7 + p0 * 4.2);
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
    curX += (targetX + Math.sin(t * 0.38) * 2.6 - curX) * 0.06;
    curY += (targetY + Math.cos(t * 0.3) * 1.8 - curY) * 0.06;
    stage.style.setProperty("--px", `${curX.toFixed(2)}px`);
    stage.style.setProperty("--py", `${curY.toFixed(2)}px`);

    extraStrands *= 0.988;
    ctx.clearRect(0, 0, w, h);

    // 1. 重构后的丝绸状檀香青烟
    drawSilkIncenseSmoke(t);

    // 2. 殿内金光浮尘
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
    showToast("清香已奉上 · 丝缕青烟徐徐升空");
  });

  document.getElementById("btn-act-bow").addEventListener("click", () => {
    const bow = document.getElementById("bow-hands-layer");
    bow.classList.add("is-show");
    setTimeout(() => bow.classList.remove("is-show"), 2600);
    showToast("一心顶礼 · 愿心无散乱");
  });

  document.getElementById("btn-act-lamp").addEventListener("click", () => {
    peerCandles.push({
      name: "你",
      tag: "心灯",
      x: 44 + Math.random() * 12,
      y: 77 + Math.random() * 6,
      scale: 1.08,
    });
    if (peerCandles.length > 14) peerCandles.splice(10, 1);
    renderPeerCandles();
    triggerLiveAction({ type: "lamp", side: Math.random() > 0.5 ? "left" : "right", text: "你 刚刚于大雄宝殿点亮一盏长明烛" });
    showToast("你的长明烛已融入大殿烛海");
  });

  const quietBtn = document.getElementById("btn-quiet");
  quietBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("quiet-mode");
    quietBtn.classList.toggle("is-on", on);
    quietBtn.textContent = on ? "已清净" : "清净模式";
    showToast(on ? "已开启清净模式 · 隐藏同修烛火与联动动态" : "已恢复满殿同修烛火与香火氛围");
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
    document.getElementById("t-hall-sub").textContent = isEn ? "3D-v1 Single-Hall Test · Candlelight Presence & Silk Incense" : "3D-v1 单页测试 · 同修长明烛海与丝缕青烟";
    document.getElementById("t-online").textContent = isEn ? "Pilgrims in Hall" : "位同修正在殿内";
    document.getElementById("t-incense").textContent = isEn ? "Incense" : "敬香";
    document.getElementById("t-bow").textContent = isEn ? "Bow" : "礼拜";
    document.getElementById("t-lamp").textContent = isEn ? "Candle" : "供灯";
  });
})();
