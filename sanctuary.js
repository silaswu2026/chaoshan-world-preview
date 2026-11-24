(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const KEY = "chaoshan-sanctuary-v1";
  const defaults = {
    ancestor: { name: "先故亲人", memory: "", offerings: [] },
    pureland: { name: "", avatar: "qing", composed: false },
    meditation: { track: "diamond", minutes: 10, sessions: 0, seconds: 0 },
    backmountain: { lights: 0, prayers: [], flowers: 0, wishType: "家人平安" },
    events: [],
  };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { stored = {}; }
  const state = {
    ...defaults,
    ...stored,
    ancestor: { ...defaults.ancestor, ...(stored.ancestor || {}) },
    pureland: { ...defaults.pureland, ...(stored.pureland || {}) },
    meditation: { ...defaults.meditation, ...(stored.meditation || {}) },
    backmountain: { ...defaults.backmountain, ...(stored.backmountain || {}) },
    events: Array.isArray(stored.events) ? stored.events.slice(0, 12) : [],
  };
  state.ancestor.offerings = Array.isArray(state.ancestor.offerings) ? state.ancestor.offerings : [];
  state.backmountain.prayers = Array.isArray(state.backmountain.prayers) ? state.backmountain.prayers.slice(0, 8) : [];
  state.backmountain.lights = Math.max(0, Number(state.backmountain.lights) || 0);
  state.backmountain.flowers = Math.max(0, Number(state.backmountain.flowers) || 0);
  let backTab = "beacon";
  let pureStep = 1;
  let uploadedUrl = "";
  let composing = false;
  let meditationPlaying = false;
  let meditationTimer = 0;
  let meditationEndsAt = 0;
  let meditationSessionStarted = 0;
  let culturePage = "about";
  let videoTimer = 0;

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* 无存储权限时保留当前会话 */ }
  }
  function toast(text) {
    const element = $("#toast");
    element.textContent = text;
    element.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("is-show"), 2300);
  }
  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function reduced() {
    return document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // 追思莲位：采用清供与善行回向，不作宗教效果承诺。
  function renderAncestor() {
    $("#ancestor-name").value = state.ancestor.name === "先故亲人" ? "" : state.ancestor.name;
    $("#ancestor-memory").value = state.ancestor.memory;
    $("#ancestor-tablet-name").textContent = state.ancestor.name || "先故亲人";
    const altar = $("#ancestor-altar");
    altar.classList.toggle("has-flower", state.ancestor.offerings.includes("flower"));
    altar.classList.toggle("has-incense", state.ancestor.offerings.includes("incense"));
    altar.classList.toggle("has-lamp", state.ancestor.offerings.includes("lamp"));
  }
  $("#btn-ancestor-save").addEventListener("click", () => {
    const name = $("#ancestor-name").value.trim().slice(0, 16);
    state.ancestor.name = name || "先故亲人";
    state.ancestor.memory = $("#ancestor-memory").value.trim().slice(0, 80);
    persist();
    renderAncestor();
    $("#ancestor-response").textContent = state.ancestor.memory
      ? `已安放“${state.ancestor.name}”莲位。你记下的是：${state.ancestor.memory}`
      : `已安放“${state.ancestor.name}”莲位。愿清净追思，也愿在世者安好。`;
    toast("莲位与追思已保存于本机");
  });
  const ancestorResponses = {
    flower: "白莲已奉上。鲜花供养寓意清净与无常，也提醒我们珍惜当下。",
    incense: "清香已点起。此处仅为网页动画，不对应实体寺院香火。",
    lamp: "心灯已点亮。愿以智慧照见思念，以慈悲照顾自己。",
    bow: "合掌、俯首、起身。行动不便时不必勉强跪拜，心中有敬即可。",
    chant: "南无阿弥陀佛。愿这一声声佛号，陪你把散乱的心带回当下。",
    dedicate: "愿以今日一念善行，回向故人离苦得乐，也愿在世者慈悲自在。",
  };
  $$("[data-ancestor-rite]").forEach((button) => button.addEventListener("click", () => {
    const type = button.dataset.ancestorRite;
    const altar = $("#ancestor-altar");
    if (["flower", "incense", "lamp"].includes(type) && !state.ancestor.offerings.includes(type)) {
      state.ancestor.offerings.push(type);
      persist();
      renderAncestor();
    }
    if (type === "bow" || type === "dedicate") {
      const className = type === "bow" ? "is-bowing" : "is-dedicated";
      altar.classList.remove(className);
      void altar.offsetWidth;
      altar.classList.add(className);
      setTimeout(() => altar.classList.remove(className), reduced() ? 180 : 2500);
    }
    if (type === "chant") {
      window.ChaoshanRitual?.stopMusic();
      window.ChaoshanRitual?.speak("amitabha");
    }
    $("#ancestor-response").textContent = ancestorResponses[type];
  }));

  // 极乐胜境：本地图片合成，无面部识别、换脸或声音克隆。
  function avatarLabel(key) {
    return { qing: "清行", shao: "澄心", zhong: "静远", lao: "慧安" }[key] || "清行";
  }
  function showPureStep(step) {
    if (step === 2 && !$("#pureland-consent").checked) return;
    if ((step === 3 || step === 4) && !state.pureland.composed) {
      toast("请先在本机生成纪念形象");
      step = 2;
    }
    pureStep = step;
    $$(".pureland-step").forEach((section) => section.classList.toggle("is-on", Number(section.dataset.pureStep) === step));
    $$("#pureland-progress li").forEach((item, index) => item.classList.toggle("is-on", index + 1 <= step));
    $("#overlay-world-pureland .world-sheet").scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    if (step === 3) {
      const scene = $("#pureland-scene");
      scene.classList.remove("is-arriving");
      void scene.offsetWidth;
      scene.classList.add("is-arriving");
    }
  }
  function updatePurelandFigure() {
    const source = uploadedUrl || `./assets/avatar-${state.pureland.avatar}.webp?v=20261124-7`;
    $("#pureland-source-preview").src = source;
    $("#pureland-final-image").src = source;
    $("#pureland-dialog-image").src = source;
    const name = state.pureland.name.trim() || "亲人";
    $("#pureland-figure-name").textContent = `${name} · 数字纪念形象`;
    $("#pureland-dialog-name").textContent = `${name}的数字纪念形象`;
  }
  $("#pureland-consent").addEventListener("change", (event) => {
    $("[data-pure-next='2']").disabled = !event.target.checked;
  });
  $("#pureland-name").addEventListener("input", (event) => {
    state.pureland.name = event.target.value.trim().slice(0, 16);
    persist();
    updatePurelandFigure();
  });
  $$("[data-pure-next]").forEach((button) => button.addEventListener("click", () => showPureStep(Number(button.dataset.pureNext))));
  $$("[data-pure-avatar]").forEach((button) => button.addEventListener("click", () => {
    if (uploadedUrl) { URL.revokeObjectURL(uploadedUrl); uploadedUrl = ""; }
    $("#pureland-photo").value = "";
    $(".pureland-upload").classList.remove("is-on");
    state.pureland.avatar = button.dataset.pureAvatar;
    state.pureland.composed = false;
    $$("[data-pure-avatar]").forEach((item) => item.classList.toggle("is-on", item === button));
    $("#compose-preview").classList.remove("is-composed");
    $("#compose-preview span").textContent = "等待光影合成";
    $("#compose-title").textContent = `${avatarLabel(state.pureland.avatar)} · 基础形象`;
    $("#compose-description").textContent = "将形象转为低饱和、半透明的莲光纪念样式。本原型不做面部识别、换脸、年龄推断或声音克隆。";
    $("#compose-status").textContent = "";
    persist();
    updatePurelandFigure();
  }));
  $("#pureland-photo").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      toast("请选择 8MB 以内的 JPG、PNG 或 WebP 图片");
      event.target.value = "";
      return;
    }
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    uploadedUrl = URL.createObjectURL(file);
    state.pureland.composed = false;
    $$("[data-pure-avatar]").forEach((item) => item.classList.remove("is-on"));
    $(".pureland-upload").classList.add("is-on");
    $("#compose-preview").classList.remove("is-composed");
    $("#compose-preview span").textContent = "照片仅在本机预览";
    $("#compose-title").textContent = "亲人照片 · 本机临时读取";
    $("#compose-description").textContent = "照片不会上传服务器，也不会写入本机存档；刷新或关闭页面后即释放。这里只做光影样式，不推断身份或性格。";
    $("#compose-status").textContent = "已读取照片，可以进行本机光影合成。";
    persist();
    updatePurelandFigure();
  });
  $("#btn-pure-compose").addEventListener("click", () => {
    if (composing) return;
    composing = true;
    const preview = $("#compose-preview");
    preview.classList.remove("is-composed", "is-composing");
    void preview.offsetWidth;
    preview.classList.add("is-composing");
    $("#btn-pure-compose").disabled = true;
    $("#compose-status").textContent = "正在本机调整透明度、色调与莲光…";
    setTimeout(() => {
      preview.classList.remove("is-composing");
      preview.classList.add("is-composed");
      $("#compose-preview span").textContent = "光影合成完成 · 数字模拟";
      $("#compose-status").textContent = "形象已生成。现在可以进入极乐圣境。";
      state.pureland.composed = true;
      persist();
      updatePurelandFigure();
      composing = false;
      $("#btn-pure-compose").disabled = false;
      setTimeout(() => showPureStep(3), reduced() ? 100 : 650);
    }, reduced() ? 180 : 1350);
  });
  const simulatedReplies = [
    "这是一段模拟陪伴文案：谢谢你愿意把这份思念说出来。被爱过的记忆，也可以成为照顾自己的力量。",
    "这是一段模拟陪伴文案：家里平安，是很珍贵的日常。你也可以给自己留一点休息，不必一直坚强。",
    "这是一段模拟陪伴文案：心事可以慢慢讲。若它正困扰现实生活，也可以找可信赖的人或专业人士一起面对。",
    "这是一段模拟陪伴文案：不必急着得到回答。把这一刻的想念写下来，本身就是一种温柔的整理。",
  ];
  let replyIndex = 0;
  function appendPureMessage(text, self = false) {
    const item = document.createElement("div");
    item.className = `pureland-message${self ? " is-user" : ""}`;
    const label = document.createElement("b");
    label.textContent = self ? "我的寄语 · 仅当前页面" : "模拟陪伴文案 · 非本人回应";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    item.append(label, paragraph);
    $("#pureland-dialog-log").appendChild(item);
    $("#pureland-dialog-log").scrollTop = $("#pureland-dialog-log").scrollHeight;
  }
  function sendPureMessage(text) {
    const clean = text.trim().slice(0, 180);
    if (!clean) return;
    appendPureMessage(clean, true);
    $("#pureland-dialog-input").value = "";
    setTimeout(() => {
      let index = replyIndex % simulatedReplies.length;
      if (/家里|平安|都好/.test(clean)) index = 1;
      if (/心事|烦|难过|压力|焦虑/.test(clean)) index = 2;
      appendPureMessage(simulatedReplies[index]);
      replyIndex += 1;
    }, reduced() ? 100 : 650);
  }
  $("#pureland-dialog-form").addEventListener("submit", (event) => {
    event.preventDefault();
    sendPureMessage($("#pureland-dialog-input").value);
  });
  $$(".pureland-quick-words button").forEach((button) => button.addEventListener("click", () => sendPureMessage(button.textContent)));
  $("#btn-pure-finish").addEventListener("click", () => {
    appendPureMessage("愿我把思念化作善待自己与家人的行动。今日寄语到这里，回到人间，好好生活。", false);
    toast("本次模拟寄语已合十回向 · 对话未保存");
  });

  // 后山：所有点灯、愿牌与虚拟导览都在本机完成。
  function showBackTab(tab) {
    if (!["beacon", "prayer", "memory", "guide"].includes(tab)) return;
    backTab = tab;
    $$("[data-back-tab]").forEach((button) => button.classList.toggle("is-on", button.dataset.backTab === tab));
    $$("[data-back-panel]").forEach((panel) => panel.classList.toggle("is-on", panel.dataset.backPanel === tab));
  }
  function renderBackmountain() {
    const back = state.backmountain;
    const scene = $("#backmountain-scene");
    scene.classList.toggle("is-lit", back.lights > 0);
    $("#backmountain-light-count").textContent = `本机已点亮 ${back.lights} 次`;
    $("#backmountain-scene-status").textContent = back.lights ? "心灯已亮 · 愿光明也在日常善行中" : "等你点亮第一盏心灯";
    $("#backmountain-memory-status").textContent = back.flowers ? `已在后山献白莲 ${back.flowers} 枝 · 仅本机纪念` : "献花不求回报，只把思念轻轻放在这里。";
    $$("[data-back-wish-type]").forEach((button) => button.classList.toggle("is-on", button.dataset.backWishType === back.wishType));
    const tags = $("#backmountain-wish-tags");
    tags.replaceChildren();
    back.prayers.slice(0, 3).forEach((prayer) => {
      const tag = document.createElement("span");
      tag.textContent = prayer.type;
      tags.appendChild(tag);
    });
    const list = $("#backmountain-prayer-list");
    list.innerHTML = back.prayers.length
      ? back.prayers.slice(0, 4).map((prayer) => `<p><b>${escapeText(prayer.type)}</b> · ${escapeText(prayer.text)}</p>`).join("")
      : "<p>尚未挂上愿牌。心愿不必宏大，可以只写一句真诚的话。</p>";
    showBackTab(backTab);
  }
  $$("[data-back-tab]").forEach((button) => button.addEventListener("click", () => showBackTab(button.dataset.backTab)));
  $$("[data-back-wish-type]").forEach((button) => button.addEventListener("click", () => {
    state.backmountain.wishType = button.dataset.backWishType;
    persist();
    renderBackmountain();
    $("#back-prayer-text").placeholder = { 家人平安: "例：愿父母康健，也愿我懂得珍惜与陪伴", 学业进步: "例：愿我专注向学，踏实完成今天的功课", 事业顺遂: "例：愿工作勤勉有获，待人正直，不急于求成", 亲人祈福: "例：愿故人离苦得乐，愿在世者平安珍重" }[state.backmountain.wishType];
  }));
  $("#btn-back-light").addEventListener("click", () => {
    state.backmountain.lights += 1;
    persist();
    renderBackmountain();
    const scene = $("#backmountain-scene");
    scene.classList.remove("is-lighting");
    void scene.offsetWidth;
    scene.classList.add("is-lighting");
    setTimeout(() => scene.classList.remove("is-lighting"), 1500);
    toast("后山心灯已点亮 · 仅本机纪念");
  });
  $("#btn-back-prayer-save").addEventListener("click", () => {
    const text = $("#back-prayer-text").value.trim().slice(0, 80);
    if (!text) { toast("先写下一句心愿，再挂愿牌"); $("#back-prayer-text").focus(); return; }
    state.backmountain.prayers.unshift({ type: state.backmountain.wishType, text });
    state.backmountain.prayers = state.backmountain.prayers.slice(0, 8);
    $("#back-prayer-text").value = "";
    persist();
    renderBackmountain();
    toast("愿牌已挂上后山松枝 · 愿文仅存本机");
  });
  $("#btn-back-flower").addEventListener("click", () => {
    state.backmountain.flowers += 1;
    persist();
    renderBackmountain();
    toast("一枝白莲 · 愿思念清净，愿自己安好");
  });
  const guideAnswers = {
    calm: "先不急着让烦恼立刻消失。把注意带回一呼一吸，再处理眼前最小的一件事。《金刚经》说“应无所住而生其心”：不是逃避生活，而是不让一个念头绑住全部生活。",
    family: "慈悲也包括边界。可以先听完对方的一句真实需要，再说出自己的感受，不急着评判。今晚做一件具体的小事：好好吃一顿饭、道一声感谢，或停止一次相互指责。",
    study: "把大愿化成今日可完成的一小步。学习或事业遇阻时，先分清哪些能行动、哪些只能等待。普贤行愿重在实践：专注二十五分钟、诚实完成一项任务，比反复担忧结果更可靠。",
    grief: "思念并不需要被劝成“马上放下”。可以记住一件温暖的小事，再用一件善行延续它。极乐与莲位都是本产品的艺术模拟，不是逝者回应；若悲伤已影响饮食、睡眠或安全，请尽快联系可信赖的人和专业支持。",
  };
  function guideTopic(text) {
    if (/家|父母|伴侣|孩子|相处|关系/.test(text)) return "family";
    if (/学|考试|工作|事业|求职|财/.test(text)) return "study";
    if (/故人|逝|去世|死亡|思念|亲人/.test(text)) return "grief";
    return "calm";
  }
  function askBackGuide(text) {
    const clean = text.trim().slice(0, 100);
    if (!clean) return;
    const log = $("#backmountain-guide-log");
    const user = document.createElement("div");
    user.className = "is-user";
    const userLabel = document.createElement("b");
    userLabel.textContent = "我的问题 · 仅当前页面";
    const userText = document.createElement("p");
    userText.textContent = clean;
    user.append(userLabel, userText);
    log.appendChild(user);
    const answer = document.createElement("div");
    const answerLabel = document.createElement("b");
    answerLabel.textContent = "净远 · 虚拟导览回答";
    const answerText = document.createElement("p");
    answerText.textContent = guideAnswers[guideTopic(clean)];
    answer.append(answerLabel, answerText);
    setTimeout(() => { log.appendChild(answer); log.scrollTop = log.scrollHeight; }, reduced() ? 50 : 400);
    $("#back-guide-input").value = "";
    log.scrollTop = log.scrollHeight;
  }
  $$("[data-back-guide-topic]").forEach((button) => button.addEventListener("click", () => askBackGuide(button.dataset.backGuideTopic)));
  $("#back-guide-form").addEventListener("submit", (event) => { event.preventDefault(); askBackGuide($("#back-guide-input").value); });

  // 冥想：真实录音复用统一播放器，金刚经和佛号使用设备语音。
  const meditationTracks = {
    diamond: { name: "金刚经", speech: "diamond" },
    heart: { name: "心经", music: 0 },
    compassion: { name: "大悲咒", music: 1 },
    six: { name: "六字真言", music: 2 },
    amitabha: { name: "阿弥陀佛", speech: "amitabha" },
  };
  function formatTime(seconds) {
    const safe = Math.max(0, Math.round(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }
  function renderMeditation() {
    $$("[data-meditation-track]").forEach((button) => button.classList.toggle("is-on", button.dataset.meditationTrack === state.meditation.track));
    $$("[data-meditation-minutes]").forEach((button) => button.classList.toggle("is-on", Number(button.dataset.meditationMinutes) === state.meditation.minutes));
    $("#meditation-now").textContent = `${meditationTracks[state.meditation.track].name} · ${meditationPlaying ? "正在聆听" : "尚未开始"}`;
    $("#meditation-countdown").textContent = state.meditation.minutes ? formatTime(state.meditation.minutes * 60) : "不限时";
    $("#btn-meditation-start").textContent = meditationPlaying ? "暂停冥想" : "点击开始冥想";
    $("#meditation-fullscreen").classList.toggle("is-meditating", meditationPlaying);
  }
  function accountMeditation() {
    if (!meditationSessionStarted) return;
    const seconds = Math.max(0, Math.round((Date.now() - meditationSessionStarted) / 1000));
    state.meditation.seconds += seconds;
    meditationSessionStarted = 0;
    persist();
  }
  function stopMeditation(completed = false) {
    clearInterval(meditationTimer);
    meditationTimer = 0;
    if (meditationPlaying) {
      accountMeditation();
      if (completed) state.meditation.sessions += 1;
    }
    meditationPlaying = false;
    meditationEndsAt = 0;
    window.ChaoshanRitual?.stopMusic();
    window.ChaoshanRitual?.stopSpeech();
    persist();
    renderMeditation();
    if (completed) toast("本次冥想已结束 · 愿你带着从容回到生活");
  }
  async function startMeditation() {
    if (meditationPlaying) { stopMeditation(false); return; }
    const track = meditationTracks[state.meditation.track];
    window.ChaoshanRitual?.stopMusic();
    window.ChaoshanRitual?.stopSpeech();
    meditationPlaying = true;
    meditationSessionStarted = Date.now();
    meditationEndsAt = state.meditation.minutes ? Date.now() + state.meditation.minutes * 60000 : 0;
    $("#meditation-intro").style.opacity = "0";
    renderMeditation();
    if (track.speech) window.ChaoshanRitual?.speak(track.speech);
    else await window.ChaoshanRitual?.playMusic(track.music);
    clearInterval(meditationTimer);
    meditationTimer = setInterval(() => {
      if (!meditationPlaying) return;
      if (meditationEndsAt) {
        const remaining = Math.ceil((meditationEndsAt - Date.now()) / 1000);
        $("#meditation-countdown").textContent = formatTime(remaining);
        if (remaining <= 0) stopMeditation(true);
      } else {
        const elapsed = Math.floor((Date.now() - meditationSessionStarted) / 1000);
        $("#meditation-countdown").textContent = formatTime(elapsed);
      }
    }, 500);
  }
  $("#btn-meditation-open").addEventListener("click", () => {
    $("#meditation-player").hidden = false;
    $("#meditation-intro").style.opacity = ".15";
    $("#meditation-player").scrollIntoView({ block: "nearest" });
  });
  $$("[data-meditation-track]").forEach((button) => button.addEventListener("click", () => {
    stopMeditation(false);
    state.meditation.track = button.dataset.meditationTrack;
    persist();
    renderMeditation();
  }));
  $$("[data-meditation-minutes]").forEach((button) => button.addEventListener("click", () => {
    stopMeditation(false);
    state.meditation.minutes = Number(button.dataset.meditationMinutes);
    persist();
    renderMeditation();
  }));
  $("#btn-meditation-start").addEventListener("click", startMeditation);
  $("#btn-meditation-stop").addEventListener("click", () => stopMeditation(false));

  // 文化网站：内容为演示性通识，不冒充寺方发布。
  const learning = [
    { image: "scene-hall", tag: "入门 · 什么是佛", title: "佛，是“觉者”", body: "“佛”是佛陀的简称，意为觉悟者，不是创造世界、主宰赏罚的神。佛教修行重视戒、定、慧，以及对慈悲与智慧的实践。", more: "释迦牟尼是历史上的佛教创立者；“阿弥陀佛”“药师佛”等则属于不同经典所展开的佛国信仰。学习时可区分历史人物、经典义理与民间习俗。" },
    { image: "scene-wutai", tag: "五台山 · 文殊", title: "文殊菩萨：以智慧照见", body: "文殊菩萨在汉传佛教中象征般若智慧，常见持智慧剑、骑青狮的形象。五台山与文殊信仰联系深厚，被视为其道场。", more: "智慧剑象征断除烦恼，青狮常用来表现智慧的威猛与无畏。这些属于宗教艺术语言，不应按字面理解为鼓励争斗。" },
    { image: "scene-emei", tag: "峨眉山 · 普贤", title: "普贤菩萨：把愿化为行动", body: "普贤菩萨以行愿著称，经典中常见十大愿王的思想。峨眉山与普贤信仰相连，金顶十方普贤像是今日广为人知的视觉标志。", more: "“行愿”强调把礼敬、赞叹、随喜与回向落实到行动中。网页点击次数不等于现实修行，善待他人、诚实守信同样是可实践的善行。" },
    { image: "scene-jiuhua", tag: "九华山 · 地藏", title: "地藏菩萨：大愿与孝亲", body: "地藏菩萨以救度众生的大愿闻名，形象常作比丘相，持锡杖或宝珠。九华山因地藏信仰与金乔觉的历史传说而成为重要道场。", more: "唐代新罗僧金乔觉在九华山修行，后世将其与地藏信仰相联。介绍这段历史时，宜把史料记载、寺院传统和民间传说分别说明。" },
    { image: "scene-putuo", tag: "普陀山 · 观世音", title: "观音菩萨：慈悲与倾听", body: "观世音菩萨以慈悲救苦的形象广受尊崇，名称与“观世间音声”的传统解释相关。普陀山是中国观音信仰的重要道场。", more: "观音形象在不同地区和时代有丰富变化，汉地常见白衣、净瓶、杨柳等艺术元素。慈悲不只是获得安慰，也意味着愿意体谅和帮助他人。" },
    { image: "scene-map", tag: "中国佛教传统", title: "四大道场不是“四尊佛”", body: "五台、峨眉、九华、普陀分别与文殊、普贤、地藏、观音四位菩萨相联。“四位菩萨”是中国佛教传统中的组合，不宜写成“四佛的由来”。", more: "四大道场的形成经历了经典信仰、历代寺院建设、朝圣活动与地方历史的长期积淀。具体年代和沿革请结合学术研究及各寺方资料阅读。" },
  ];
  function learningMarkup() {
    return `<section class="culture-section"><div class="culture-section-head"><div><small>LEARN BUDDHISM</small><h2>佛学学习 · 从可靠常识开始</h2></div><p>文字、图片与动态影像结合，区分佛教义理、历史事实和艺术表达。深入学习宜参考完整经典、可靠注疏与学术研究。</p></div><div class="culture-learning-grid">${learning.map((item) => `<article class="culture-learning-card"><img src="./assets/${item.image}.webp?v=20261124-7" alt="${item.title}" /><div><small>${item.tag}</small><h3>${item.title}</h3><p>${item.body}</p><details><summary>继续阅读</summary><p>${item.more}</p></details></div></article>`).join("")}</div><div class="culture-video" id="culture-video"><div class="culture-video-screen" id="culture-video-screen"><button type="button" class="culture-video-play" id="btn-culture-video" aria-label="播放动态影像导览">▶</button><p class="culture-video-caption" id="culture-video-caption">14 秒动态影像 · 四大道场导览</p></div><div class="culture-video-copy"><small>VISUAL INTRODUCTION</small><h3>从山门到四大道场</h3><p>这是一段由现有原画制作的网页动态影像，不含实拍或寺院官方影像。依次认识文殊的智慧、普贤的行愿、地藏的愿力与观音的慈悲。</p><button type="button" id="btn-culture-video-secondary">播放动态导览</button></div></div></section>`;
  }
  const cultureRenderers = {
    about() {
      return `<section class="culture-hero"><div><small>CHAOSHAN BUDDHIST CULTURE</small><h1>不止于朝山，<br />也是一扇理解之门。</h1><p>这里把佛教文化、四大道场、经典阅读与清净纪念放在同一个虚拟世界。它不是任何实体寺院的官网，而是可以慢慢阅读、观看和体验的文化原型。</p><button type="button" data-culture-page="learn">开始佛学学习</button></div></section><section class="culture-section"><div class="culture-section-head"><div><small>OUR APPROACH</small><h2>以尊重为边界，以理解为目的</h2></div></div><div class="culture-values"><article><b>不神秘化</b><p>不承诺改运、超度或宗教功效；不把虚拟供灯、佛牌与莲位说成线下寺院服务。</p></article><article><b>不娱乐化信仰</b><p>视觉与互动用于帮助理解礼仪、历史与义理，不以功德排名刺激攀比。</p></article><article><b>不侵犯隐私</b><p>个人愿文与记录留在本机；极乐照片只在当前页面读取，不上传服务器。</p></article></div></section>`;
    },
    learn: learningMarkup,
    objects() {
      const products = [["珠","檀色念珠 · 文创","108 颗珠粒设计，作为日常正念提醒。","¥128"],["安","平安祈福包 · 文创","可书写心愿的布艺纪念袋，不宣称护佑功效。","¥59"],["灯","虚拟祈福灯 · 网页纪念","只在本机点亮的数字心灯，无实体寄送。","¥12"]];
      return `<section class="culture-section"><div class="culture-section-head"><div><small>CULTURAL OBJECTS</small><h2>佛学纪念品 · 文创展示</h2></div><p>当前只作设计和价格演示，可在世界“纪念物”中生成意向单；不接支付、开光承诺或物流服务。</p></div><div class="culture-product-grid">${products.map((item) => `<article class="culture-product"><div class="culture-product-visual">${item[0]}</div><div><h3>${item[1]}</h3><p>${item[2]}</p><footer><strong>${item[3]}</strong><button type="button" data-world-open="store">进入纪念物</button></footer></div></article>`).join("")}</div></section>`;
    },
    books() {
      const books = [
        { title: "《金刚经》", type: "般若经典 · 节选试读", quote: "应无所住而生其心。", desc: "认识“无住”不是否定生活，而是练习不把一时境遇执为永恒。" },
        { title: "《心经》", type: "般若经典 · 节选试读", quote: "色即是空，空即是色。", desc: "“空”并非虚无，宜结合完整经文和可靠注疏理解缘起与无自性。" },
        { title: "《普贤行愿品》", type: "行愿实践 · 节选试读", quote: "所有礼敬供养中，法供养为最。", desc: "从礼敬诸佛到普皆回向，重点是把善念落实于日常行动。" },
      ];
      return `<section class="culture-section"><div class="culture-section-head"><div><small>BUDDHIST READING</small><h2>佛书 · 经典试读</h2></div><p>当前仅提供少量已核验节选和学习提示，不冒充完整数字出版；完整阅读可选正规出版注疏。</p></div><div class="culture-book-grid">${books.map((book) => `<article class="culture-book"><div><small>${book.type}</small><h3>${book.title}</h3><blockquote>${book.quote}</blockquote><p>${book.desc}</p><button type="button" data-world-open="wisdom">进入藏阁学习</button></div></article>`).join("")}</div><p class="culture-empty-note" style="margin-top:20px">推荐学习路径：先读入门导论，再读经典原文与注疏，最后结合历史背景思考。遇到具体礼仪和实修问题，应向有资质、可信赖的法师或教师请教。</p></section>`;
    },
    events() {
      const events = [
        { id: "reading", day: "12", month: "十二月", title: "《金刚经》七日共读", text: "每日一小节，记录一个“今天可以放下什么”。网页演示活动，非寺院官方共修。", time: "每晚 20:00 · 线上演示" },
        { id: "kindness", day: "21", month: "十二月", title: "一日一善行", text: "给家人写一句感谢，或完成一次不求回报的帮助，再回来留下匿名善行记录。", time: "全天 · 自主参与" },
        { id: "quiet", day: "31", month: "十二月", title: "岁末十分钟静心", text: "选择一段佛音，安静坐十分钟，以感恩与祝愿结束一年。", time: "全天 · 个人冥想" },
      ];
      return `<section class="culture-section"><div class="culture-section-head"><div><small>CULTURAL EVENTS</small><h2>活动 · 从线上走向生活</h2></div><p>以下均为功能模拟活动，不是实体寺院法讯；参与只会把活动名称保存到本机。</p></div><div class="culture-event-grid">${events.map((event) => { const joined = state.events.includes(event.id); return `<article class="culture-event"><time><b>${event.day}</b><span>${event.month}</span></time><div><small>${event.time}<span class="is-demo">演示活动</span></small><h3>${event.title}</h3><p>${event.text}</p><button type="button" data-culture-event="${event.id}">${joined ? "已加入本机计划" : "加入本机计划"}</button></div></article>`; }).join("")}</div></section>`;
    },
  };
  function renderCulture() {
    clearTimeout(videoTimer);
    $("#culture-main").innerHTML = cultureRenderers[culturePage]();
    $$("[data-culture-page]", $("#overlay-world-culture .culture-site-head")).forEach((button) => button.classList.toggle("is-on", button.dataset.culturePage === culturePage));
    $(".culture-site").scrollTop = 0;
    if (culturePage === "learn") bindCultureVideo();
  }
  function playCultureVideo() {
    clearTimeout(videoTimer);
    const screen = $("#culture-video-screen");
    if (!screen) return;
    const backgrounds = ["scene-wutai", "scene-emei", "scene-jiuhua", "scene-putuo"];
    const captions = ["五台山 · 文殊：以智慧照见因缘", "峨眉山 · 普贤：把愿望化成行动", "九华山 · 地藏：大愿、孝亲与回向", "普陀山 · 观音：慈悲，也学习倾听"];
    let index = 0;
    screen.classList.add("is-playing");
    $("#btn-culture-video").textContent = "Ⅱ";
    const advance = () => {
      if (index >= backgrounds.length) {
        screen.classList.remove("is-playing");
        $("#btn-culture-video").textContent = "▶";
        $("#culture-video-caption").textContent = "导览已播完 · 可重新播放";
        return;
      }
      screen.style.backgroundImage = `linear-gradient(rgba(14,31,27,.15),rgba(14,31,27,.45)),url('./assets/${backgrounds[index]}.webp?v=20261124-7')`;
      $("#culture-video-caption").textContent = captions[index];
      index += 1;
      videoTimer = setTimeout(advance, 3500);
    };
    advance();
  }
  function bindCultureVideo() {
    $("#btn-culture-video")?.addEventListener("click", playCultureVideo);
    $("#btn-culture-video-secondary")?.addEventListener("click", playCultureVideo);
  }
  document.addEventListener("click", (event) => {
    const page = event.target.closest("[data-culture-page]");
    if (page && $("#overlay-world-culture").contains(page)) {
      culturePage = page.dataset.culturePage;
      renderCulture();
    }
    const eventButton = event.target.closest("[data-culture-event]");
    if (eventButton) {
      const id = eventButton.dataset.cultureEvent;
      if (!state.events.includes(id)) state.events.push(id);
      persist();
      eventButton.textContent = "已加入本机计划";
      toast("演示活动已加入本机计划");
    }
  });

  window.addEventListener("chaoshan:worldopen", (event) => {
    const name = event.detail?.name;
    if (name === "ancestors") renderAncestor();
    if (name === "pureland") {
      $("#pureland-name").value = state.pureland.name;
      updatePurelandFigure();
      showPureStep(state.pureland.composed ? 3 : 1);
    }
    if (name === "backmountain") renderBackmountain();
    if (name === "meditation") renderMeditation();
    if (name === "culture") renderCulture();
  });
  window.addEventListener("chaoshan:worldclose", (event) => {
    if (event.detail?.name === "meditation") stopMeditation(false);
    if (event.detail?.name === "culture") clearTimeout(videoTimer);
    if (event.detail?.name === "pureland" && uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
      uploadedUrl = "";
      state.pureland.composed = false;
      persist();
      $("#pureland-photo").value = "";
      $(".pureland-upload").classList.remove("is-on");
      $$("[data-pure-avatar]").forEach((button) => button.classList.toggle("is-on", button.dataset.pureAvatar === state.pureland.avatar));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#overlay-world-meditation").classList.contains("is-open")) stopMeditation(false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && meditationPlaying) stopMeditation(false);
  });
  window.addEventListener("pagehide", () => {
    accountMeditation();
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
  });

  renderAncestor();
  $("#pureland-name").value = state.pureland.name;
  updatePurelandFigure();
  renderBackmountain();
  renderMeditation();
  renderCulture();
})();
