(() => {
  const MOUNTAINS = {
    gate: {
      tag: "山门 · 大雄宝殿",
      glyph: "佛",
      name: "释迦牟尼佛",
      verse: "诸恶莫作 · 众善奉行",
      practice: "总回向（需四山香印）",
    },
    putuo: {
      tag: "普陀山 · 圆通殿",
      glyph: "观",
      name: "观世音菩萨",
      verse: "慈悲喜舍 · 救苦救难",
      practice: "供灯 / 许大愿",
      seal: "putuo",
    },
    wutai: {
      tag: "五台山 · 大智殿",
      glyph: "智",
      name: "文殊师利菩萨",
      verse: "开智慧门 · 照见分明",
      practice: "开卷祈福",
      seal: "wutai",
    },
    emei: {
      tag: "峨眉山 · 普贤殿",
      glyph: "行",
      name: "普贤菩萨",
      verse: "愿力践行 · 步步踏实",
      practice: "行愿抄经",
      seal: "emei",
    },
    jiuhua: {
      tag: "九华山 · 地藏殿",
      glyph: "愿",
      name: "地藏王菩萨",
      verse: "愿力广大 · 护生回向",
      practice: "延生 / 超荐（隐私分层）",
      seal: "jiuhua",
    },
    memorial: {
      tag: "缅怀堂 · 追思莲位",
      glyph: "忆",
      name: "追思缅怀",
      verse: "慎终追远 · 愿力回向",
      practice: "追思卡 / 虚拟献花供灯（仅本机）",
    },
  };

  const INCENSE_STEPS = [
    { visual: "合十", copy: "站定于香炉前，合十片刻。移动与视角已锁定，以免打断仪式。" },
    { visual: "取香", copy: "取一炷清香。设定中可改为三炷常礼。" },
    { visual: "引燃", copy: "于炉火处引燃。烟气升起，请保持站定。" },
    { visual: "安放", copy: "将香安稳插入炉中。若中途走动，将提示重新敬香，不会默默取消。" },
    { visual: "回向", copy: "可默念或填写本机愿文，然后回向。完成后点亮本殿香印。" },
  ];

  const NAMES = ["清风", "莲生", "止水", "云闲", "静安", "明心", "妙音", "自在"];

  const I18N = {
    "zh-Hans": {
      tagline: "一支香，四座山。",
      enter: "推开山门 · 进入道场",
      quick: "快速朝山",
      avatarTitle: "香客",
      avatarNote: "名号与形象只留在本机，可随时更改。无需注册。",
      nameLabel: "香客号",
      randomName: "助拟",
      robeLabel: "衣着",
      beadLabel: "念珠",
      enterGate: "进入山门",
      mapProgress: "四山香印",
      quickFour: "今日一巡（轻量）",
      streak: "连续朝山",
      beads: "念珠",
      dockMap: "朝山图",
      dockIncense: "敬香",
      dockPractice: "功课",
      dockGate: "回山门",
      incenseTitle: "敬香",
      close: "退出",
      practiceTitle: "功课",
      bookTitle: "祈愿簿",
    },
    "zh-Hant": {
      tagline: "一支香，四座山。",
      enter: "推開山門 · 進入道場",
      quick: "快速朝山",
      avatarTitle: "香客",
      avatarNote: "名號與形象只留在本機，可隨時更改。無需註冊。",
      nameLabel: "香客號",
      randomName: "助擬",
      robeLabel: "衣著",
      beadLabel: "念珠",
      enterGate: "進入山門",
      mapProgress: "四山香印",
      quickFour: "今日一巡（輕量）",
      streak: "連續朝山",
      beads: "念珠",
      dockMap: "朝山圖",
      dockIncense: "敬香",
      dockPractice: "功課",
      dockGate: "回山門",
      incenseTitle: "敬香",
      close: "退出",
      practiceTitle: "功課",
      bookTitle: "祈願簿",
    },
  };

  const state = {
    screen: "landing",
    mountain: "gate",
    guestName: "清风",
    lang: "zh-Hans",
    seals: { putuo: false, wutai: false, emei: false, jiuhua: false },
    beads: 0,
    incenseStep: 0,
    completed: false,
  };

  try {
    const saved = JSON.parse(localStorage.getItem("chaoshan-progress-v1") || "null");
    if (saved) {
      state.guestName = saved.guestName || state.guestName;
      state.seals = { ...state.seals, ...(saved.seals || {}) };
      state.beads = Math.max(0, Math.min(108, Number(saved.beads) || 0));
      state.completed = Boolean(saved.completed);
    }
  } catch (_) { /* 无存储权限时使用临时会话 */ }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function persistState() {
    try {
      localStorage.setItem("chaoshan-progress-v1", JSON.stringify({ guestName: state.guestName, seals: state.seals, beads: state.beads, completed: state.completed }));
    } catch (_) { /* 无存储权限时保持本次体验 */ }
  }

  function showToast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  function sealCount() {
    return Object.values(state.seals).filter(Boolean).length;
  }

  function applyI18n() {
    const dict = I18N[state.lang];
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    $$(".lang-switch button").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.lang === state.lang);
    });
    document.documentElement.lang = state.lang;
  }

  function goScreen(name) {
    state.screen = name;
    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
    persistState();
  }

  function setMountain(key) {
    const m = MOUNTAINS[key];
    if (!m) return;
    state.mountain = key;
    persistState();
    const scene = $("#temple-scene");
    scene.dataset.mountain = key;
    $("#place-tag").textContent = m.tag;
    $("#deity-glyph").textContent = m.glyph;
    $("#deity-name").textContent = m.name;
    $("#deity-verse").textContent = m.verse;
    $$(".map-node").forEach((node) => {
      node.classList.toggle("is-current", node.dataset.mountain === key);
    });
  }

  function refreshSeals() {
    const n = sealCount();
    $("#seal-count").textContent = String(n);
    $$("[data-seal]").forEach((el) => {
      const key = el.dataset.seal;
      if (!key || !(key in state.seals)) return;
      el.classList.toggle("is-on", state.seals[key]);
      el.classList.toggle("is-done", state.seals[key]);
    });
    const note = $("#book-seal-note");
    if (note) {
      note.textContent =
        n === 0
          ? "尚未点亮香印。可至各山主殿敬香，或使用快速朝山。"
          : n < 4
            ? `已点亮 ${n} 枚香印。回山门可在四印齐后做总回向。`
            : "四山香印已齐。请回山门大雄宝殿完成总回向。";
    }
  }

  function syncGuest() {
    state.guestName = ($("#guest-name").value || "香客").slice(0, 8);
    $("#hud-name").textContent = state.guestName;
    $("#card-guest").textContent = `香客 · ${state.guestName}`;
    persistState();
  }

  function openOverlay(id) {
    $(id)?.classList.add("is-open");
  }

  function closeOverlays() {
    $$(".overlay").forEach((o) => o.classList.remove("is-open"));
  }

  function renderIncenseStep() {
    const step = INCENSE_STEPS[state.incenseStep];
    $("#incense-visual").textContent = step.visual;
    $("#incense-copy").textContent = step.copy;
    $$("#incense-steps .step").forEach((el, i) => {
      el.classList.toggle("is-on", i === state.incenseStep);
      el.classList.toggle("is-done", i < state.incenseStep);
    });
    const next = $("#btn-incense-next");
    next.textContent = state.incenseStep === INCENSE_STEPS.length - 1 ? "完成敬香" : "下一步";
  }

  function startIncense() {
    if (state.mountain === "gate") {
      showToast("请先选择一座山，在主殿香炉前敬香");
      goScreen("map");
      return;
    }
    const sealKey = MOUNTAINS[state.mountain].seal;
    if (state.seals[sealKey]) {
      showToast("本殿香印已点亮");
      return;
    }
    state.incenseStep = 0;
    renderIncenseStep();
    openOverlay("#overlay-incense");
  }

  function finishIncense() {
    const sealKey = MOUNTAINS[state.mountain].seal;
    if (sealKey) state.seals[sealKey] = true;
    persistState();
    closeOverlays();
    refreshSeals();
    showToast(sealKey ? `${MOUNTAINS[state.mountain].tag.split("·")[0].trim()}香印已点亮` : "缅怀堂敬香圆满 · 追思回向");
  }

  function tryDedicate() {
    setMountain("gate");
    goScreen("temple");
    if (sealCount() < 4) {
      showToast(`还需 ${4 - sealCount()} 枚香印方可总回向`);
      return;
    }
    if (state.completed) {
      goScreen("card");
      return;
    }
    state.completed = true;
    const d = new Date();
    $("#card-date").textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    syncGuest();
    showToast("四山圆满 · 回向成就");
    setTimeout(() => goScreen("card"), 500);
  }

  function quickFour() {
    Object.keys(state.seals).forEach((k) => {
      state.seals[k] = true;
    });
    refreshSeals();
    showToast("快速朝山完成 · 四印已就位");
    setMountain("gate");
    goScreen("temple");
  }

  // events
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-open],[data-close],[data-mountain],[data-lang],[data-robe],[data-bead],[data-tab],[data-toggle]");
    if (!t) return;

    if (t.dataset.close !== undefined) closeOverlays();

    if (t.dataset.open) {
      if (t.dataset.open === "book") {
        refreshSeals();
        openOverlay("#overlay-book");
      }
      if (t.dataset.open === "settings") openOverlay("#overlay-settings");
    }

    if (t.dataset.lang) {
      state.lang = t.dataset.lang;
      applyI18n();
    }

    if (t.dataset.robe) {
      $$("#robe-options .option-pill").forEach((b) => b.classList.remove("is-on"));
      t.classList.add("is-on");
      $("#avatar-body").dataset.robe = t.dataset.robe;
    }

    if (t.dataset.bead) {
      $$("#bead-options .option-pill").forEach((b) => b.classList.remove("is-on"));
      t.classList.add("is-on");
      $("#avatar-beads").style.setProperty("--bead", t.dataset.bead);
    }

    if (t.dataset.tab) {
      $$(".tab").forEach((tab) => tab.classList.toggle("is-on", tab === t));
      $$(".tab-panel").forEach((p) => p.classList.toggle("is-on", p.dataset.panel === t.dataset.tab));
    }

    if (t.dataset.toggle) {
      t.classList.toggle("is-on");
      t.setAttribute("aria-pressed", t.classList.contains("is-on") ? "true" : "false");
    }

    if (t.dataset.mountain && t.classList.contains("map-node")) {
      setMountain(t.dataset.mountain);
      syncGuest();
      goScreen("temple");
      return;
    }

    if (t.dataset.go) {
      const dest = t.dataset.go;
      if (dest === "about-note") {
        showToast("虚构线上道场 · 不代表实体寺院");
        return;
      }
      if (t.dataset.mountain) setMountain(t.dataset.mountain);
      if (dest === "temple" || dest === "avatar" || dest === "map" || dest === "landing" || dest === "card") {
        if (dest === "temple") syncGuest();
        goScreen(dest);
      }
    }
  });

  $("#btn-random-name").addEventListener("click", () => {
    const next = NAMES[Math.floor(Math.random() * NAMES.length)];
    $("#guest-name").value = next;
  });

  $("#btn-enter-gate").addEventListener("click", () => {
    syncGuest();
    setMountain("gate");
    goScreen("temple");
    showToast("已入山门 · 可打开朝山图");
  });

  $("#btn-incense").addEventListener("click", startIncense);
  $("#btn-incense-next").addEventListener("click", () => {
    if (state.incenseStep >= INCENSE_STEPS.length - 1) {
      finishIncense();
      return;
    }
    state.incenseStep += 1;
    renderIncenseStep();
  });

  $("#btn-practice").addEventListener("click", () => {
    $("#practice-main").textContent = MOUNTAINS[state.mountain].practice;
    openOverlay("#overlay-practice");
  });

  $("#practice-main").addEventListener("click", () => {
    closeOverlays();
    showToast(`${MOUNTAINS[state.mountain].practice}（专项流程原型占位）`);
  });

  function bumpBeads() {
    state.beads = Math.min(108, state.beads + 1);
    persistState();
    $("#bead-count").textContent = String(state.beads);
    if (state.beads === 108) showToast("念珠圆满 · 可生成纪念品卡");
    else showToast(`念珠 ${state.beads} / 108`);
  }

  $("#practice-beads").addEventListener("click", () => {
    bumpBeads();
  });

  $("#btn-beads").addEventListener("click", bumpBeads);
  $("#btn-dedicate").addEventListener("click", tryDedicate);
  $("#btn-quick-four").addEventListener("click", quickFour);

  $$(".hud-dock [data-go='map']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeOverlays();
      goScreen("map");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlays();
  });

  // init
  applyI18n();
  $("#guest-name").value = state.guestName;
  syncGuest();
  $("#bead-count").textContent = String(state.beads);
  refreshSeals();
  setMountain("gate");
  $("#card-date").textContent = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
})();
