(() => {
  "use strict";

  /**
   * 见山 · 朝山 五座大殿差异化体验引擎
   * 1. 每尊佛/菩萨旁设「本尊简介」按钮（中英双语：由来、法器寓意、保佑愿力）
   * 2. 每尊菩萨专属「本殿祈愿簿」（带名字的同修祈愿清单，大家都能看、可实时写入置顶）
   * 3. 每尊菩萨不同的「专属任务/功课」（紧扣大悲/大智/大行/大愿/圆满回向）
   */

  const $ = (sel, root = document) => root.querySelector(sel);
  const VOW_STORE_KEY = "jianshan-v2-deity-vows";
  const TASK_STORE_KEY = "jianshan-v2-deity-tasks";

  const DEITY_DATA = {
    putuo: {
      btnIntro: "观音简介",
      btnVows: "观音祈愿簿",
      title: "观世音菩萨 · 普陀山圆通殿",
      enTitle: "Avalokiteśvara (Guanyin) · Mount Putuo",
      blessing: "大悲救苦 · 平安顺遂 · 身心疗愈 · 家宅康宁",
      intro: "观世音菩萨以“千处祈求千处应”的大悲愿力闻名，手持净瓶与杨柳枝，象征以甘露抚平世间苦厄与焦虑。无论海外游子祈求父母安康，还是心神疲惫渴望疗愈，皆可在此静心供灯、倾诉所愿。",
      enIntro: "Revered as the Bodhisattva of Infinite Compassion, Guanyin holds a willow branch and nectar vase to soothe suffering and anxiety—a sanctuary for peace, healing, and family well-being.",
      taskTitle: "观音殿专属功课：供一盏平安慈悲灯",
      taskBtn: "点亮平安慈悲灯",
      taskDone: "已供平安慈悲灯 · 愿家宅康宁",
      taskAction: "lamp",
      placeholder: "向观世音菩萨写下平安、康健或家宅祈愿…",
      seedVows: [
        { name: "林清婉", text: "愿远在故乡的父母身体康健，出入平安，岁岁无忧。", time: "3 分钟前" },
        { name: "Maya L.", text: "May peace and gentle healing embrace my family through this season.", time: "12 分钟前" },
        { name: "陈志远", text: "愿家人手术顺利恢复，身心安稳，灯火可亲。", time: "26 分钟前" },
        { name: "周静安", text: "愿心中焦虑渐渐平息，以柔软慈悲对待身边每一个人。", time: "41 分钟前" },
        { name: "Grace W.", text: "Praying for safety on my travels and warmth for everyone I love.", time: "1 小时前" },
      ],
    },
    wutai: {
      btnIntro: "文殊简介",
      btnVows: "文殊祈愿簿",
      title: "文殊师利菩萨 · 五台山大智殿",
      enTitle: "Mañjuśrī · Mount Wutai",
      blessing: "大智开慧 · 学业考学 · 职场抉择 · 破除迷茫",
      intro: "文殊师利菩萨为“诸佛之师”，象征般若大智慧。右手高举金刚智慧剑，意在斩断烦恼与犹豫；左手持莲花托般若经卷，照见世事本源。凡面临考试升学、重要抉择或心生迷茫时，最宜来此开卷启慧。",
      enIntro: "Known as the Bodhisattva of Transcendent Wisdom, Mañjuśrī wields the sword of clarity to cut through confusion—guiding students, thinkers, and anyone facing a major life decision.",
      taskTitle: "文殊殿专属功课：开卷启慧 · 领一句般若经偈",
      taskBtn: "开卷领智慧偈",
      taskDone: "已领般若智慧偈 · 心明眼亮",
      taskAction: "wisdom-verse",
      placeholder: "向文殊菩萨写下学业、考试或人生抉择心愿…",
      seedVows: [
        { name: "苏明轩", text: "愿今年秋季研究生考试沉着发挥，不负多年苦读。", time: "5 分钟前" },
        { name: "David K.", text: "Seeking clarity and calm judgment for an important career crossroads.", time: "18 分钟前" },
        { name: "吴思齐", text: "愿孩子静心向学，养成独立思考的定力与智慧。", time: "33 分钟前" },
        { name: "陆嘉言", text: "愿破除内耗与犹疑，看清内心真正想走的路。", time: "52 分钟前" },
        { name: "Kevin Z.", text: "Wishing for focus, sharp memory, and steady composure on exam day.", time: "1 小时前" },
      ],
    },
    emei: {
      btnIntro: "普贤简介",
      btnVows: "普贤祈愿簿",
      title: "普贤菩萨 · 峨眉山普贤金顶",
      enTitle: "Samantabhadra · Mount Emei",
      blessing: "大行践行 · 事业精进 · 坚持踏实 · 所行如愿",
      intro: "普贤菩萨以“十大愿王”著称，坐骑为六牙白象，象征脚踏实地、一步一印的坚韧行动力。佛学讲“有愿无行，如舟无桨”——在此礼拜普贤，重在把美好的心愿落实到今日的踏实行持之中。",
      enIntro: "The Bodhisattva of Great Practice rides a six-tusked white elephant—symbolizing grounded perseverance and turning noble aspirations into steady daily action.",
      taskTitle: "普贤殿专属功课：立今日一善行（行愿打卡）",
      taskBtn: "立今日一善行",
      taskDone: "已立今日行愿 · 步步踏实",
      taskAction: "daily-vow",
      placeholder: "向普贤菩萨写下事业精进或今日一善行…",
      seedVows: [
        { name: "郑行远", text: "愿新项目脚踏实地推进，不急不躁，正财安稳。", time: "4 分钟前" },
        { name: "Alex C.", text: "Committing to one act of quiet patience and generosity today.", time: "15 分钟前" },
        { name: "沈知行", text: "愿坚持每天早起读书与锻炼，知行合一，渐成大器。", time: "29 分钟前" },
        { name: "许文博", text: "愿团队同心协力，所做之事真正利人利己。", time: "47 分钟前" },
        { name: "Claire H.", text: "May steady effort and integrity guide every step of my work this year.", time: "1 小时前" },
      ],
    },
    jiuhua: {
      btnIntro: "地藏简介",
      btnVows: "地藏祈愿簿",
      title: "地藏王菩萨 · 九华山肉身宝殿",
      enTitle: "Kṣitigarbha · Mount Jiuhua",
      blessing: "大愿孝亲 · 父母延寿 · 追思故人 · 护念众生",
      intro: "地藏王菩萨以“地狱不空，誓不成佛”的宏大愿力与至孝精神闻名，手持锡杖与摩尼宝珠，照亮幽暗、抚慰苦痛。华人在九华山多为父母祈福延寿、亦为已故亲人回向祈安。",
      enIntro: "Honored for boundless filial devotion and steadfast vows, Kṣitigarbha carries a staff and luminous pearl—dedicated to parents' longevity, remembrance of loved ones, and comforting all beings.",
      taskTitle: "地藏殿专属功课：孝亲祈寿 / 献白莲回向故人",
      taskBtn: "献白莲 · 孝亲回向",
      taskDone: "已献白莲回向 · 愿亲安乐",
      taskAction: "lotus-dedicate",
      placeholder: "向地藏王菩萨写下孝亲延寿或追思回向心愿…",
      seedVows: [
        { name: "黄念慈", text: "愿外婆在净土安详自在，也愿家中长辈福寿绵长。", time: "6 分钟前" },
        { name: "Sarah T.", text: "Remembering my grandfather with gratitude; may he rest in peace.", time: "21 分钟前" },
        { name: "赵孝安", text: "愿母亲腿脚轻健，夜夜好眠，喜乐安康。", time: "38 分钟前" },
        { name: "李怀远", text: "以今日善念回向先父，感恩一生养育与教诲。", time: "55 分钟前" },
        { name: "Daniel W.", text: "Dedicating a quiet white lotus for all departed loved ones.", time: "1 小时前" },
      ],
    },
    gate: {
      btnIntro: "大雄宝殿简介",
      btnVows: "大雄宝殿祈愿簿",
      title: "释迦牟尼佛 · 山门大雄宝殿",
      enTitle: "Shakyamuni Buddha · Mahāvīra Hall",
      blessing: "本师觉悟 · 内心安宁 · 四山圆满总回向",
      intro: "大雄宝殿为汉传佛寺中轴最高主殿，供奉本师释迦牟尼佛。“大雄”意为以无畏智慧降伏内心贪嗔痴烦恼。走完普陀、五台、峨眉、九华四座圣山后，可回到此处做四山总回向，领取圆满纪念卡。",
      enIntro: "The supreme central sanctuary housing Shakyamuni Buddha—the Awakened One. After completing your pilgrimage across the Four Sacred Mountains, return here for final dedication.",
      taskTitle: "大雄宝殿专属功课：四山香印圆满总回向",
      taskBtn: "查看四山圆满进度",
      taskDone: "四山总回向已启 · 功德圆满",
      taskAction: "dedicate",
      placeholder: "在释迦牟尼佛前写下总回向或清净发愿…",
      seedVows: [
        { name: "清风", text: "愿四山朝圣功德回向十方众生，愿世间少些戾气，多些安宁。", time: "2 分钟前" },
        { name: "Elena R.", text: "Grateful for this quiet sanctuary amid a noisy world.", time: "19 分钟前" },
        { name: "明心", text: "愿自己常保觉察，诸恶莫作，众善奉行。", time: "35 分钟前" },
        { name: "陈安然", text: "愿海外游子皆得心灵栖所，平安喜乐。", time: "58 分钟前" },
      ],
    },
  };

  let userVows = {};
  let doneTasks = {};
  try { userVows = JSON.parse(localStorage.getItem(VOW_STORE_KEY) || "{}"); } catch (_) { userVows = {}; }
  try { doneTasks = JSON.parse(localStorage.getItem(TASK_STORE_KEY) || "{}"); } catch (_) { doneTasks = {}; }

  function saveVows() {
    try { localStorage.setItem(VOW_STORE_KEY, JSON.stringify(userVows)); } catch (_) { /* ignore */ }
  }
  function saveTasks() {
    try { localStorage.setItem(TASK_STORE_KEY, JSON.stringify(doneTasks)); } catch (_) { /* ignore */ }
  }

  function currentKey() {
    const key = $("#temple-scene")?.dataset.mountain || "gate";
    return DEITY_DATA[key] ? key : "gate";
  }

  /* ===== 1. 在殿内注入「本尊简介 + 本殿祈愿簿」双按钮 与「本殿专属功课条」 ===== */
  const templeScene = $("#temple-scene");
  if (!templeScene) return;

  const sideBar = document.createElement("div");
  sideBar.className = "v2-deity-side-bar";
  sideBar.id = "v2-deity-side-bar";
  sideBar.innerHTML = `
    <button type="button" class="v2-deity-pill" id="v2-btn-deity-intro"><i>传</i><span id="v2-lbl-intro">观音简介</span></button>
    <button type="button" class="v2-deity-pill is-vow" id="v2-btn-deity-vows"><i>愿</i><span id="v2-lbl-vows">观音祈愿簿</span><em id="v2-vow-count">5</em></button>
  `;
  templeScene.appendChild(sideBar);

  const taskBanner = document.createElement("div");
  taskBanner.className = "v2-deity-task";
  taskBanner.id = "v2-deity-task";
  taskBanner.innerHTML = `
    <span class="v2-dt-dot"></span>
    <span class="v2-dt-title" id="v2-dt-title"></span>
    <button type="button" class="v2-dt-btn" id="v2-dt-btn"></button>
  `;
  templeScene.appendChild(taskBanner);

  /* ===== 2. 创建「本尊简介」弹窗 &「本殿祈愿簿清单」弹窗 ===== */
  const modalsWrap = document.createElement("div");
  modalsWrap.innerHTML = `
    <div class="overlay world-overlay" id="overlay-v2-deity-intro" role="dialog" aria-modal="true" aria-label="本尊简介">
      <div class="sheet world-sheet v2-deity-sheet">
        <div class="sheet-head world-head">
          <div><small id="v2-intro-en"></small><h2 id="v2-intro-title"></h2></div>
          <button type="button" class="sheet-close" data-v2-modal-close>关闭</button>
        </div>
        <div class="v2-intro-blessing" id="v2-intro-blessing"></div>
        <p class="v2-intro-body" id="v2-intro-body"></p>
        <p class="v2-intro-body-en" id="v2-intro-body-en"></p>
        <div class="v2-intro-actions">
          <button type="button" class="btn-primary v2-gold-btn" id="v2-intro-to-vows">打开本殿祈愿簿</button>
          <button type="button" class="chip" data-v2-modal-close>回到大殿</button>
        </div>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-v2-deity-vows" role="dialog" aria-modal="true" aria-label="本殿祈愿簿">
      <div class="sheet world-sheet v2-deity-sheet">
        <div class="sheet-head world-head">
          <div><small>SACRED VOW REGISTRY · 公开祈愿清单</small><h2 id="v2-vows-title"></h2><p id="v2-vows-sub"></p></div>
          <button type="button" class="sheet-close" data-v2-modal-close>关闭</button>
        </div>
        <form class="v2-vow-form" id="v2-vow-form">
          <input id="v2-vow-input" type="text" maxlength="60" placeholder="写下你的心愿，署名后将呈现在本殿祈愿清单中…" />
          <button type="submit" class="btn-primary v2-gold-btn">写入本殿祈愿簿</button>
        </form>
        <div class="v2-vow-list" id="v2-vow-list"></div>
      </div>
    </div>
  `;
  $("#app")?.appendChild(modalsWrap);

  function getVowsFor(key) {
    const custom = Array.isArray(userVows[key]) ? userVows[key] : [];
    const seeds = DEITY_DATA[key]?.seedVows || [];
    return [...custom, ...seeds];
  }

  function syncHallUI() {
    const key = currentKey();
    const d = DEITY_DATA[key];
    if (!d) return;
    $("#v2-lbl-intro").textContent = d.btnIntro;
    $("#v2-lbl-vows").textContent = d.btnVows;
    $("#v2-vow-count").textContent = String(getVowsFor(key).length);

    const isDone = Boolean(doneTasks[key]);
    $("#v2-dt-title").textContent = isDone ? d.taskDone : d.taskTitle;
    const btn = $("#v2-dt-btn");
    btn.textContent = isDone ? "再次随喜" : d.taskBtn;
    taskBanner.classList.toggle("is-done", isDone);
  }

  function openIntroModal() {
    const d = DEITY_DATA[currentKey()];
    if (!d) return;
    $("#v2-intro-en").textContent = d.enTitle;
    $("#v2-intro-title").textContent = d.title;
    $("#v2-intro-blessing").textContent = `保佑与愿力方向：${d.blessing}`;
    $("#v2-intro-body").textContent = d.intro;
    $("#v2-intro-body-en").textContent = d.enIntro;
    $("#overlay-v2-deity-intro").classList.add("is-open");
  }

  function renderVowList(key) {
    const d = DEITY_DATA[key];
    const list = getVowsFor(key);
    $("#v2-vows-title").textContent = `${d.btnVows}（${list.length} 份心愿）`;
    $("#v2-vows-sub").textContent = `${d.blessing} · 其他同修心愿皆可共见`;
    $("#v2-vow-input").placeholder = d.placeholder;
    $("#v2-vow-list").innerHTML = list.map((item) => `
      <article class="v2-vow-item ${item.isSelf ? "is-self" : ""}">
        <header><b>${item.name}</b><time>${item.time}</time></header>
        <p>${item.text}</p>
      </article>
    `).join("");
  }

  function openVowsModal() {
    const key = currentKey();
    renderVowList(key);
    $("#overlay-v2-deity-vows").classList.add("is-open");
  }

  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-show"), 2600);
  }

  $("#v2-btn-deity-intro").addEventListener("click", openIntroModal);
  $("#v2-btn-deity-vows").addEventListener("click", openVowsModal);
  $("#v2-intro-to-vows").addEventListener("click", () => {
    $("#overlay-v2-deity-intro").classList.remove("is-open");
    openVowsModal();
  });

  $("#v2-dt-btn").addEventListener("click", () => {
    const key = currentKey();
    const d = DEITY_DATA[key];
    doneTasks[key] = true;
    saveTasks();
    syncHallUI();
    if (d.taskAction === "lamp") {
      document.querySelector('[data-ritual="lamp"]')?.click();
    } else if (d.taskAction === "dedicate") {
      $("#btn-dedicate")?.click();
    } else if (d.taskAction === "wisdom-verse") {
      toast("文殊般若偈：「应无所住而生其心」——愿你此刻心明眼亮");
      if (typeof window.ChaoshanPrayer === "function") window.ChaoshanPrayer("领受文殊智慧偈：心明眼亮", $("#hud-name")?.textContent || "清风");
    } else if (d.taskAction === "daily-vow") {
      toast("已立普贤今日一善行：以平和踏实之心完成手头一事");
      if (typeof window.ChaoshanPrayer === "function") window.ChaoshanPrayer("立今日普贤行愿 · 步步踏实", $("#hud-name")?.textContent || "清风");
    } else if (d.taskAction === "lotus-dedicate") {
      toast("已于地藏殿献上白莲，愿父母康健延寿、故人安乐");
      if (typeof window.ChaoshanPrayer === "function") window.ChaoshanPrayer("地藏殿献白莲 · 孝亲回向", $("#hud-name")?.textContent || "清风");
    }
  });

  $("#v2-vow-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const key = currentKey();
    const input = $("#v2-vow-input");
    const text = (input.value || "").trim();
    if (!text) return;
    const guest = ($("#hud-name")?.textContent || "清风").slice(0, 8);
    if (!Array.isArray(userVows[key])) userVows[key] = [];
    userVows[key].unshift({ name: guest, text, time: "刚刚", isSelf: true });
    if (userVows[key].length > 20) userVows[key] = userVows[key].slice(0, 20);
    saveVows();
    input.value = "";
    renderVowList(key);
    syncHallUI();
    if (typeof window.ChaoshanPrayer === "function") window.ChaoshanPrayer(text, guest);
    toast(`已写入${DEITY_DATA[key].btnVows}`);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-v2-modal-close]")) {
      $("#overlay-v2-deity-intro")?.classList.remove("is-open");
      $("#overlay-v2-deity-vows")?.classList.remove("is-open");
    }
  });

  // 监听大殿切换 (data-mountain 属性变化)，实时同步本尊简介、祈愿簿与专属任务
  const observer = new MutationObserver(syncHallUI);
  observer.observe(templeScene, { attributes: true, attributeFilter: ["data-mountain"] });
  syncHallUI();
})();
