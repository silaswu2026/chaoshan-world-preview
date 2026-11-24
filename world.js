(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const KEY = "chaoshan-world-v1";
  const publicConfig = Object.freeze({
    endpoint: "https://chaoshan-world.app.workbuddy.host",
    oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
    publishableKey: "wbpk_B77kbxuGDWT3NgsauK6Mfl_Wa59x1AxJcfnLvTF4892SBJA9agOz00j",
  });
  const defaults = { server: 0, chats: [[], [], []], cart: {}, records: [], aiHistory: [], relativeHistory: [], conversationId: "", relativeConversationId: "" };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { saved = {}; }
  const state = { ...defaults, ...saved, chats: defaults.chats.map((_, i) => Array.isArray(saved.chats?.[i]) ? saved.chats[i].slice(-60) : []) };
  let worldBusy = false;
  let activeWorld = "";
  let recordFilter = "all";
  let wisdomCategory = "全部";
  let storeCategory = "all";
  let cloud = null;
  let selectedModel = null;
  let aiBusy = false;
  let relativeBusy = false;
  let aiController = null;
  let lastAiCall = 0;

  if (window.WorkBuddyCloud) {
    cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: publicConfig.endpoint,
      oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
      publishableKey: publicConfig.publishableKey,
    });
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* 无存储权限时保留本次会话 */ }
  }
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-show"), 2400);
  }
  function id() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
  function conversationId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  if (!state.conversationId) state.conversationId = conversationId();
  if (!state.relativeConversationId) state.relativeConversationId = conversationId();

  function record(type, title, detail = "") {
    state.records.unshift({ id: id(), time: new Date().toISOString(), type, title, detail: String(detail).slice(0, 1800) });
    state.records = state.records.slice(0, 180);
    persist();
    if (activeWorld === "records") renderRecords();
  }
  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  const NAMES = ["清和", "一心", "静遥", "明净", "安岚", "慧行", "如云", "觉晓"];
  const ACTIVITIES = ["普陀 · 礼佛", "五台 · 诵经", "峨眉 · 供灯", "九华 · 敬香"];
  const SERVERS = [
    { name: "云海一服", count: 1286, seed: [["清和", "愿大家今日心安神定。"], ["静遥", "刚从普陀山礼佛回来，愿家人平安。"], ["一心", "同愿，同行。"]] },
    { name: "莲灯二服", count: 864, seed: [["觉知", "今晚供了一盏心灯，愿逝者安息。"], ["安岚", "愿每一位思念亲人的人都被温柔以待。"], ["明净", "一念放下，万般自在。"]] },
    { name: "松风三服", count: 432, seed: [["如云", "山间松风很适合静心。"], ["慧行", "读完一段《金刚经》，再来坐坐。"], ["清和", "愿所求皆向善，所行皆安稳。"]] },
  ];

  function createPeople() {
    const presence = $("#world-presence");
    const summary = make("div", "presence-summary");
    summary.append(make("b", "presence-count"), make("span", "presence-activity"));
    presence.appendChild(summary);
    ACTIVITIES.forEach((activity, index) => {
      const item = make("div", "presence-light");
      item.append(make("i", "presence-lamp"), make("span", "", `${NAMES[index]} · ${activity}`));
      presence.appendChild(item);
    });
    renderRoomPeople();
  }
  function renderRoomPeople() {
    const server = SERVERS[state.server];
    $(".presence-count").textContent = `${server.count.toLocaleString()} 位同修在线`;
    if ($("#landing-online")) $("#landing-online").textContent = server.count.toLocaleString();
    $(".presence-activity").textContent = `虚拟动态 · ${NAMES[state.server]} 正在${ACTIVITIES[state.server]}`;
    const room = $("#room-people");
    room.replaceChildren();
    ACTIVITIES.forEach((activity, index) => {
      const item = make("div", "room-lantern");
      const name = NAMES[(index + state.server * 2) % NAMES.length];
      item.append(make("i", "room-lamp"), make("span", "", `${name} · 虚拟`), make("small", "", activity));
      room.appendChild(item);
    });
  }

  function closeWorld(immediate = true) {
    const closingName = activeWorld;
    $$(".world-overlay.is-open").forEach((el) => el.classList.remove("is-open"));
    document.body.classList.remove("world-open");
    activeWorld = "";
    window.dispatchEvent(new CustomEvent("chaoshan:worldclose", { detail: { name: closingName } }));
    if (!immediate) return;
  }
  function playGate(action, label) {
    if (worldBusy) return;
    worldBusy = true;
    document.body.classList.add("world-transitioning");
    const gate = $("#gate-transition");
    const loadingText = $("#loading-label");
    loadingText.textContent = `正在前往${label}`;
    $("#gate-transition p").textContent = "云 开 一 境 · 心 到 一 处";
    gate.classList.remove("is-opening");
    gate.classList.add("is-active");
    gate.setAttribute("aria-hidden", "false");
    const reduce = document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const middle = reduce ? 40 : 760;
    const finish = reduce ? 120 : 1650;
    requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add("is-opening")));
    setTimeout(action, middle);
    setTimeout(() => {
      gate.classList.remove("is-active");
      gate.setAttribute("aria-hidden", "true");
      document.body.classList.remove("world-transitioning");
      $("#gate-transition p").textContent = "一 念 起 · 万 缘 放 下";
      worldBusy = false;
    }, finish);
  }
  function openWorld(name) {
    const titles = { map: "世界小地图", room: "同行禅院", store: "纪念物", wisdom: "佛学藏阁", ai: "AI 祈福", relatives: "亲人缅怀", ancestors: "追思莲位", pureland: "西方极乐", backmountain: "后山心灯塔", meditation: "个人冥想", culture: "朝山文化网", records: "个人记录", chaoshan: "朝山主界" };
    playGate(() => {
      closeWorld();
      if (name === "chaoshan") {
        document.querySelector('[data-go="landing"]')?.click();
        record("visit", "返回朝山主界");
        return;
      }
      const overlay = $(`#overlay-world-${name}`);
      if (!overlay) return;
      overlay.classList.add("is-open");
      document.body.classList.add("world-open");
      activeWorld = name;
      overlay.scrollTop = 0;
      $(".world-sheet", overlay)?.scrollTo({ top: 0 });
      if (name === "records") renderRecords();
      if (name === "relatives") renderRelativeCard();
      if (name === "room") renderRoomChat();
      window.dispatchEvent(new CustomEvent("chaoshan:worldopen", { detail: { name } }));
      record("visit", `进入${titles[name]}`);
    }, titles[name] || "另一处空间");
  }

  document.addEventListener("click", (event) => {
    const memorialOpener = event.target.closest("[data-world-memorial]");
    if (memorialOpener) {
      event.preventDefault();
      event.stopImmediatePropagation();
      playGate(() => {
        closeWorld();
        $("#overlay-memorial")?.classList.add("is-open");
        record("visit", "进入缅怀堂");
      }, "缅怀堂");
      return;
    }
    const opener = event.target.closest("[data-world-open]");
    if (opener) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWorld(opener.dataset.worldOpen);
      return;
    }
    const closer = event.target.closest("[data-world-close]");
    if (closer) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeWorld();
    }
  }, true);

  // 房间与虚拟服务器
  function appendChatMessage(message, log = $("#room-chat-log")) {
    const item = make("div", `chat-message${message.self ? " is-self" : ""}`);
    item.append(make("b", "", message.name), make("p", "", message.text));
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }
  function renderRoomChat() {
    const log = $("#room-chat-log");
    log.replaceChildren();
    const server = SERVERS[state.server];
    const seeds = server.seed.map(([name, text], index) => ({ id: `seed-${state.server}-${index}`, name: `${name} · 虚拟同行`, text, self: false }));
    [...seeds, ...state.chats[state.server]].forEach((message) => appendChatMessage(message, log));
    $("#room-server-name").textContent = server.name;
    $("#map-online").textContent = `${server.count.toLocaleString()} 在线`;
    $$("#server-tabs button").forEach((button, index) => button.classList.toggle("is-on", index === state.server));
  }
  $("#server-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-server]");
    if (!button) return;
    state.server = Number(button.dataset.server);
    persist();
    renderRoomPeople();
    renderRoomChat();
  });
  $("#room-chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#room-chat-input");
    const text = input.value.trim();
    if (!text) return;
    const guest = $("#guest-name")?.value.trim() || "清风";
    const message = { id: id(), name: `${guest} · 我`, text, self: true };
    state.chats[state.server].push(message);
    state.chats[state.server] = state.chats[state.server].slice(-60);
    appendChatMessage(message);
    record("chat", `${SERVERS[state.server].name} · 我的发言`, text);
    input.value = "";
    persist();
    const serverAtSend = state.server;
    setTimeout(() => {
      const replies = ["愿你所念皆向善，所行皆安稳。", "看到你来了，愿这里的一份宁静也陪着你。", "同愿。慢慢走，也是一种前行。", "愿今日的一念善意，成为明日的一点从容。"];
      const reply = { id: id(), name: `${NAMES[(state.chats[serverAtSend].length + serverAtSend) % NAMES.length]} · 虚拟同行`, text: replies[(state.chats[serverAtSend].length + serverAtSend) % replies.length], self: false };
      state.chats[serverAtSend].push(reply);
      state.chats[serverAtSend] = state.chats[serverAtSend].slice(-60);
      persist();
      if (activeWorld === "room" && state.server === serverAtSend) appendChatMessage(reply);
    }, 850);
  });
  $("#btn-clear-chat").addEventListener("click", () => {
    if (!window.confirm("只清空当前虚拟服务器的本机聊天记录，确定继续吗？")) return;
    state.chats[state.server] = [];
    persist();
    renderRoomChat();
    toast("当前房间本机聊天记录已清空");
  });

  // 纪念物：只生成意向单，不伪装支付或发货。
  const PRODUCTS = [
    { id: "bead-sandal", category: "beads", image: "bead-sandal", name: "檀色念珠 · 文创", desc: "108 颗珠粒设计，作为日常正念提醒。", price: 128 },
    { id: "bead-jade", category: "beads", image: "bead-jade", name: "青玉色手持珠 · 文创", desc: "温润青色珠串，不含宗教功效承诺。", price: 168 },
    { id: "bead-lotus", category: "beads", image: "bead-lotus", name: "莲纹计数念珠 · 文创", desc: "便携计数设计，适合个人诵读记录。", price: 88 },
    { id: "bag-peace", category: "bag", image: "bag-peace", name: "平安祈福包 · 文创", desc: "可书写心愿的布艺纪念袋，不宣称护佑功效。", price: 59 },
    { id: "bag-letter", category: "bag", image: "bag-letter", name: "心愿书信包 · 文创", desc: "内含信笺与封套，留存给家人或自己的话。", price: 69 },
    { id: "lamp-virtual", category: "lamp", image: "lamp-virtual", name: "虚拟祈福灯 · 网页纪念", desc: "在本机点亮一盏数字心灯，无实体寄送；图片仅为形象示意。", price: 12 },
  ];
  function renderProducts() {
    const grid = $("#product-grid");
    grid.replaceChildren();
    PRODUCTS.filter((product) => storeCategory === "all" || product.category === storeCategory).forEach((product) => {
      const card = make("article", "product-card");
      const visual = make("div", "product-visual");
      const image = make("img", "product-photo");
      image.src = `./assets/product-${product.image}.webp?v=20261124-7`;
      image.alt = `${product.name}实物效果示意`;
      image.loading = "lazy";
      const badge = make("span", "product-photo-note", "效果示意");
      visual.append(image, badge);
      const info = make("div", "product-info");
      info.append(make("h3", "", product.name), make("p", "", product.desc));
      const buy = make("div", "product-buy");
      buy.append(make("strong", "", `¥${product.price}`));
      const button = make("button", "", "加入纪念袋");
      button.type = "button";
      button.dataset.product = product.id;
      buy.appendChild(button);
      info.appendChild(buy);
      card.append(visual, info);
      grid.appendChild(card);
    });
    renderCart();
  }
  function cartDetails() {
    return Object.entries(state.cart).map(([productId, quantity]) => ({ product: PRODUCTS.find((item) => item.id === productId), quantity })).filter((item) => item.product && item.quantity > 0);
  }
  function renderCart() {
    const items = cartDetails();
    $("#cart-count").textContent = items.reduce((sum, item) => sum + item.quantity, 0);
    $("#cart-total").textContent = `¥${items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)}`;
  }
  $("#store-filter").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    storeCategory = button.dataset.category;
    $$("#store-filter button").forEach((el) => el.classList.toggle("is-on", el === button));
    renderProducts();
  });
  $("#product-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-product]");
    if (!button) return;
    const productId = button.dataset.product;
    state.cart[productId] = Math.min(9, (state.cart[productId] || 0) + 1);
    persist();
    renderCart();
    toast("已加入纪念袋");
  });
  $("#btn-checkout").addEventListener("click", () => {
    const items = cartDetails();
    if (!items.length) { toast("纪念袋还是空的"); return; }
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const detail = items.map((item) => `${item.product.name} × ${item.quantity}`).join("\n");
    record("order", `纪念物意向单 · ¥${total}`, `${detail}\n未支付，未产生实体订单`);
    state.cart = {};
    persist();
    renderCart();
    toast("意向单已保存到个人记录，未扣款");
  });

  // 佛学知识
  const ARTICLES = [
    { category: "经典", title: "《金刚经》：换一种看法", tag: "缘起与无住", quote: "一切有为法，如梦幻泡影，如露亦如电，应作如是观。", body: "这不是教人消极或否定生活，而是提醒：因缘聚合的事物都在变化。面对烦恼时，可以先承认感受，再观察它的来去，不必把一时境遇当成永恒定论。" },
    { category: "经典", title: "《心经》：色与空", tag: "般若", quote: "色即是空，空即是色。", body: "“空”不等于一无所有，而是说万物没有孤立、固定、不变的自性，都依条件而生。学习这一义理时，宜结合可靠注疏，避免把“空”误读为虚无。" },
    { category: "经典", title: "《普贤行愿品》：礼敬诸佛", tag: "行愿", quote: "所有礼敬供养中，法供养为最。", body: "普贤行愿强调把敬意落实到实践。对网页体验而言，真正可持续的“行愿”不是点击次数，而是在生活中多一分慈悲、守信与利他。" },
    { category: "仪轨", title: "为什么敬香重在恭敬", tag: "礼佛入门", quote: "一支清香，提醒自己收摄身心。", body: "线上敬香是文化体验，不替代实体寺院仪轨。可依次了解请香、点香、上香、礼拜与回向，不必执着形式数量，也不以香烛大小比较心愿。" },
    { category: "仪轨", title: "拜佛时如何安放注意力", tag: "第一人称礼拜", quote: "合掌、俯身、起身，都把注意力带回当下。", body: "网页中的第一人称礼拜用于模拟动作节奏。现实礼佛应量力而行，膝盖、腰背或行动不便者不必勉强跪拜，可用合掌、问询等合适方式。" },
    { category: "道场", title: "普陀山与观音信仰", tag: "东海普陀", quote: "慈悲，不只是被安慰，也包括学习体谅他人。", body: "普陀山以观音道场著称。本体验以白衣观音立像和圆通殿作为视觉识别。具体历史沿革、殿宇名称与现实参访安排，应以寺方和可靠史料为准。" },
    { category: "道场", title: "五台山与文殊智慧", tag: "清凉五台", quote: "智慧并非巧辩，而是看清因缘、减少执著。", body: "五台山以文殊道场著称。Demo 使用文殊骑青狮、举智慧剑的视觉符号；剑象征断烦恼，并非鼓励争斗。" },
    { category: "道场", title: "峨眉金顶与普贤行愿", tag: "行愿实践", quote: "把愿望化成今天能够完成的一小步。", body: "峨眉山以普贤道场著称。金顶画面采用四面十方普贤、六牙白象和后方殿宇作为识别元素，强调“行愿”：慈悲与智慧需要落实为行动。" },
    { category: "道场", title: "九华山与地藏愿力", tag: "孝亲与回向", quote: "怀念故人，也善待眼前的人。", body: "九华山以地藏道场著称。Demo 使用地藏比丘相、锡杖、谛听等视觉元素。线上缅怀不构成宗教超度证明，不替代现实殡仪与寺院法务。" },
  ];
  function renderWisdom() {
    const categories = ["全部", ...new Set(ARTICLES.map((article) => article.category))];
    const nav = $("#wisdom-nav");
    nav.replaceChildren();
    categories.forEach((category) => {
      const button = make("button", category === wisdomCategory ? "is-on" : "", category);
      button.type = "button";
      button.dataset.wisdomCategory = category;
      nav.appendChild(button);
    });
    const query = $("#wisdom-search").value.trim().toLowerCase();
    const filtered = ARTICLES.filter((article) => (wisdomCategory === "全部" || article.category === wisdomCategory) && (!query || `${article.title}${article.tag}${article.body}`.toLowerCase().includes(query)));
    $("#wisdom-count").textContent = `${filtered.length} 篇`;
    const list = $("#wisdom-list");
    list.replaceChildren();
    filtered.forEach((article, index) => {
      const card = make("article", `wisdom-article${index === 0 && !query ? " is-open" : ""}`);
      const button = make("button");
      button.type = "button";
      button.append(make("span", "", article.title), make("small", "", article.tag));
      const body = make("div", "wisdom-body");
      body.append(make("blockquote", "", article.quote), make("p", "", article.body));
      card.append(button, body);
      button.addEventListener("click", () => card.classList.toggle("is-open"));
      list.appendChild(card);
    });
    if (!filtered.length) list.appendChild(make("p", "record-empty", "没有找到相关内容，可以换个关键词。"));
  }
  $("#wisdom-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-wisdom-category]");
    if (!button) return;
    wisdomCategory = button.dataset.wisdomCategory;
    renderWisdom();
  });
  $("#wisdom-search").addEventListener("input", renderWisdom);

  // 真实大模型：失败时明确报错，不使用本地模板冒充 AI。
  async function getModel() {
    if (!cloud) throw new Error("AI 组件未能加载，请检查网络后刷新。");
    if (selectedModel) return selectedModel;
    const models = await cloud.llm.models.list();
    const available = models.filter((item) => item.disabled !== true && item.enabled !== false);
    selectedModel = available.find((item) => item.id === "hy4flash-free") || available[0];
    if (!selectedModel) throw new Error("当前没有可用模型，请稍后再试。");
    return selectedModel;
  }
  function appendAiMessage(log, role, text, label, error = false) {
    const item = make("div", `ai-message ${role === "user" ? "is-user" : "is-ai"}${error ? " is-error" : ""}`);
    const content = make("p", "", text);
    item.append(make("b", "", label), content);
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    return content;
  }
  function errorMessage(error) {
    const code = error?.error?.code || error?.code || "";
    if (code.startsWith("quota_")) return "模型调用额度暂时不足或请求过于频繁，请稍后再试。";
    if (code.startsWith("auth_")) return "当前预览域名尚未获得 AI 服务授权，发布到应用域名后可使用。";
    if (code.startsWith("request_")) return "请求未被模型接受，请缩短内容或稍后再试。";
    if (code.startsWith("gateway_") || code.startsWith("model_")) return "模型服务暂时不可用，请保留文字并稍后重试。";
    return error?.message || "网络连接失败，请稍后重试。";
  }
  async function requestAi(prompt, mode) {
    const isRelative = mode === "relative";
    const busyKey = isRelative ? "relativeBusy" : "aiBusy";
    if ((isRelative ? relativeBusy : aiBusy)) return;
    if (Date.now() - lastAiCall < 3500) { toast("请稍等片刻，再发起下一次祈福"); return; }
    lastAiCall = Date.now();
    if (isRelative) relativeBusy = true; else aiBusy = true;
    const log = isRelative ? $("#relative-chat-log") : $("#ai-chat-log");
    const input = isRelative ? $("#relative-ai-input") : $("#ai-input");
    const button = isRelative ? $("#btn-relative-send") : $("#btn-ai-send");
    const history = isRelative ? state.relativeHistory : state.aiHistory;
    const label = isRelative ? "追思陪伴" : "祈福助手";
    appendAiMessage(log, "user", prompt, "我");
    const answerEl = appendAiMessage(log, "assistant", "正在静心作答…", label);
    input.value = "";
    button.disabled = true;
    if (!isRelative) {
      aiController = new AbortController();
      $("#btn-ai-stop").hidden = false;
      $("#ai-status").textContent = "AI 正在生成，可随时停止";
    }
    history.push({ role: "user", content: prompt });
    let answer = "";
    try {
      const model = await getModel();
      const system = isRelative
        ? "你是朝山网页中的 AI 追思陪伴者。用户正在怀念逝者。用简体中文温和回应，先承接情绪，再帮助用户整理回忆或完成一个可执行的告别小动作。绝不能冒充逝者、声称通灵、传达逝者意愿或作宗教效果保证。不要诊断心理疾病；如有自伤风险，建议立即联系当地急救、危机干预和可信赖的人。回复不超过260字。"
        : "你是朝山网页中的 AI 祈福助手。用简体中文温和、克制地回应用户心结。经文只能从以下已核验原文中任选最贴切的一条，禁止引用或编造其他经文：1.《金刚经》：“一切有为法，如梦幻泡影，如露亦如电，应作如是观。” 2.《金刚经》：“应无所住而生其心。” 3.《法句经》：“诸恶莫作，众善奉行，自净其意，是诸佛教。” 按“经文”“解心”“一行”三个短段输出，不使用 Markdown 符号：经文完整给出所选原文和出处；解心把义理用于用户处境，不空泛说教；一行给一个今天可执行的小行动。不得算命、承诺功德或宗教效果，不代替宗教导师、医生、律师或心理咨询。回复不超过320字。";
      const messages = [{ role: "system", content: system }, ...history.slice(-6)];
      for await (const chunk of cloud.llm.chat.completions.create({
        model: model.id,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.65,
        max_tokens: 420,
        conversationId: isRelative ? state.relativeConversationId : state.conversationId,
        signal: aiController?.signal,
      })) {
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          if (!answer) answerEl.textContent = "";
          answer += delta.content;
          answerEl.textContent = answer.replace(/\*\*/g, "");
          log.scrollTop = log.scrollHeight;
        }
      }
      if (!answer.trim()) throw new Error("模型没有返回文字，请再试一次。");
      history.push({ role: "assistant", content: answer });
      record("chat", isRelative ? "AI 追思陪伴" : "AI 祈福解答", `我：${prompt}\n${label}：${answer}`);
      if (!isRelative) $("#ai-status").textContent = "回复已存入本机个人记录";
    } catch (error) {
      answerEl.dataset.errorCode = error?.error?.code || error?.code || "unknown";
      if (answer) {
        history.push({ role: "assistant", content: answer });
        answerEl.textContent = `${answer}\n\n[本次回复中断，可稍后继续]`;
      } else {
        answerEl.textContent = errorMessage(error);
        answerEl.parentElement.classList.add("is-error");
      }
      if (!isRelative) $("#ai-status").textContent = "本次未完成，请稍后重试";
    } finally {
      if (isRelative) state.relativeHistory = history.slice(-12); else state.aiHistory = history.slice(-12);
      persist();
      button.disabled = false;
      if (isRelative) relativeBusy = false; else aiBusy = false;
      if (!isRelative) {
        aiController = null;
        $("#btn-ai-stop").hidden = true;
      }
    }
  }
  $("#ai-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = $("#ai-input").value.trim();
    if (prompt) requestAi(prompt, "blessing");
  });
  $$(".ai-suggestions button").forEach((button) => button.addEventListener("click", () => {
    $("#ai-input").value = button.textContent;
    $("#ai-input").focus();
  }));
  $("#btn-ai-stop").addEventListener("click", () => aiController?.abort());
  $("#relative-ai-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = $("#relative-ai-input").value.trim();
    if (prompt) requestAi(prompt, "relative");
  });

  function renderRelativeCard() {
    let ritual = {};
    try { ritual = JSON.parse(localStorage.getItem("chaoshan-ritual-v1") || "{}"); } catch (_) { ritual = {}; }
    const memorial = ritual.memorial || {};
    $("#relative-card-title").textContent = memorial.name ? `致 ${memorial.name}` : "一盏思念灯";
    $("#relative-card-text").textContent = memorial.message || "尚未建立追思卡。可以写下故人称谓、一段怀念，献白莲、供心灯或敬清香。";
    $("#world-open-memorial").textContent = memorial.name ? "查看追思卡" : "建立追思卡";
  }
  $("#world-open-memorial").addEventListener("click", () => {
    closeWorld();
    $("#overlay-memorial").classList.add("is-open");
  });
  $("#btn-save-memorial").addEventListener("click", () => {
    setTimeout(renderRelativeCard, 50);
    record("ritual", "更新亲人追思卡", $("#memorial-message")?.value.trim() || "为故人留一盏灯");
  });

  // 个人记录
  const TYPE_NAMES = { all: "全部", ritual: "礼佛行为", chat: "聊天记忆", visit: "区域足迹", order: "纪念物意向单" };
  function renderRecords() {
    const records = state.records.filter((item) => recordFilter === "all" || item.type === recordFilter);
    const summary = $("#record-summary");
    summary.replaceChildren();
    const stats = [
      [state.records.length, "全部记忆"],
      [state.records.filter((item) => item.type === "ritual").length, "礼佛行为"],
      [state.records.filter((item) => item.type === "chat").length, "聊天记忆"],
      [new Set(state.records.filter((item) => item.type === "visit").map((item) => item.title)).size, "到访区域"],
    ];
    stats.forEach(([value, label]) => {
      const stat = make("div", "record-stat");
      stat.append(make("b", "", value), make("span", "", label));
      summary.appendChild(stat);
    });
    const timeline = $("#record-timeline");
    timeline.replaceChildren();
    if (!records.length) {
      timeline.appendChild(make("p", "record-empty", "这里还没有记录。去朝山、同行或祈福后，再回来看看。"));
      return;
    }
    records.forEach((item) => {
      const row = make("article", "record-item");
      const date = new Date(item.time);
      row.append(make("time", "", `${date.toLocaleDateString("zh-CN")} ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} · ${TYPE_NAMES[item.type] || "记录"}`), make("b", "", item.title));
      if (item.detail) row.appendChild(make("p", "", item.detail));
      timeline.appendChild(row);
    });
  }
  $("#record-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-record-filter]");
    if (!button) return;
    recordFilter = button.dataset.recordFilter;
    $$("#record-filters button").forEach((el) => el.classList.toggle("is-on", el === button));
    renderRecords();
  });
  $("#btn-export-records").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records: state.records, chats: state.chats }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `朝山个人记录-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("个人记录已导出");
  });
  $("#btn-clear-records").addEventListener("click", () => {
    if (!window.confirm("将永久清除本机的个人行为、AI 对话摘要和房间聊天记忆，且无法恢复。确定继续吗？")) return;
    state.records = [];
    state.chats = [[], [], []];
    state.aiHistory = [];
    state.relativeHistory = [];
    state.conversationId = conversationId();
    state.relativeConversationId = conversationId();
    persist();
    renderRecords();
    toast("本机个人记忆已清除");
  });

  // 采集已有礼佛行为，避免记录自动拨珠的每一次计时器事件。
  document.addEventListener("click", (event) => {
    const ritualButton = event.target.closest("[data-ritual]");
    if (ritualButton) {
      const names = { bow: "第一人称拜佛", take: "请香点香", offer: "佛前上香", chant: "念佛闻思", beads: "拨动佛珠", muyu: "木鱼", lamp: "虚拟供灯", plaque: "虚拟佛牌" };
      record("ritual", names[ritualButton.dataset.ritual] || "礼佛操作");
      return;
    }
    const mountain = event.target.closest(".map-node[data-mountain]");
    if (mountain) record("visit", `前往${mountain.dataset.mountain === "memorial" ? "缅怀堂" : "道场"}`, $(".name", mountain)?.textContent || "");
  });

  createPeople();
  renderProducts();
  renderWisdom();
  renderRoomChat();
  renderRelativeCard();
  persist();
})();
