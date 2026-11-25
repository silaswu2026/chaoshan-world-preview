(() => {
  "use strict";

  /**
   * 见山 · 朝山 V2 统一沉浸净境引擎
   * 1. 静心冥想：4K 背景 + 地面共修蒲团阵列（其他同修名字 + 实时跳动倒计时 + 自己主蒲团）
   * 2. 后山（心灯祈福 + 高僧解惑）：全屏 4K 古刹山径背景 + V1 金色按钮 + 千灯名录祈福海 + 高僧解惑双语开示引擎
   * 3. 西方极乐 · 归莲净土（怀念故人）：4K 莲境背景 + 远方同修静谧献莲微光 + 保留完整四步安心引导
   */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const LAMP_STORE_KEY = "jianshan-v2-lamps";

  /* ===== 1. 静心冥想：地面共修蒲团阵列（同修名字 + 实时倒计时） ===== */
  function enhanceMeditation() {
    const stage = $("#meditation-fullscreen");
    if (!stage || $("#v2-meditation-cushions")) return;

    const headTitle = stage.querySelector(".meditation-head h2");
    if (headTitle) headTitle.textContent = "静心冥想 · 共修禅堂";

    const peers = [
      { name: "清和", sec: 522, x: 14, y: 74 },
      { name: "Maya", sec: 855, x: 26, y: 66 },
      { name: "静远", sec: 207, x: 37, y: 80 },
      { name: "林安", sec: 1148, x: 63, y: 80 },
      { name: "David", sec: 411, x: 74, y: 66 },
      { name: "慧心", sec: 690, x: 86, y: 74 },
      { name: "云舒", sec: 318, x: 20, y: 88 },
      { name: "Grace", sec: 964, x: 80, y: 88 },
    ];

    const wrap = document.createElement("div");
    wrap.className = "v2-meditation-cushions";
    wrap.id = "v2-meditation-cushions";

    const fmt = (s) => {
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const r = String(s % 60).padStart(2, "0");
      return `${m}:${r}`;
    };

    wrap.innerHTML = `
      <div class="v2-med-peer-bar">
        <i></i><span>此刻有 <b id="v2-med-peer-count">36</b> 位同修正在禅堂一同静坐</span>
      </div>
      <div class="v2-cushion-field">
        ${peers.map((p, idx) => `
          <div class="v2-cushion is-peer" style="left:${p.x}%;top:${p.y}%" data-peer-idx="${idx}">
            <div class="v2-cushion-tag"><b>${p.name}</b><time data-peer-time="${idx}">${fmt(p.sec)}</time></div>
            <div class="v2-cushion-pad"><i></i></div>
          </div>
        `).join("")}
        <div class="v2-cushion is-self" id="v2-self-cushion" style="left:50%;top:86%">
          <div class="v2-cushion-tag"><b id="v2-self-cushion-name">你 · 蒲团</b><time id="v2-self-cushion-time">静候入座</time></div>
          <div class="v2-cushion-pad"><i></i></div>
        </div>
      </div>
    `;
    stage.appendChild(wrap);

    // 点击“选择本次冥想”时隐藏介绍层，彻底避免文字重叠
    $("#btn-meditation-open")?.addEventListener("click", () => {
      const intro = $("#meditation-intro");
      if (intro) intro.style.display = "none";
    });

    // 每秒真实跳动同修倒计时 + 同步自己的冥想状态
    setInterval(() => {
      const overlay = $("#overlay-world-meditation");
      if (!overlay || !overlay.classList.contains("is-open")) return;
      peers.forEach((p, idx) => {
        p.sec = p.sec > 1 ? p.sec - 1 : 300 + Math.floor(Math.random() * 900);
        const el = $(`[data-peer-time="${idx}"]`, wrap);
        if (el) el.textContent = fmt(p.sec);
      });
      const selfClock = $("#meditation-countdown");
      const selfPad = $("#v2-self-cushion");
      const selfTime = $("#v2-self-cushion-time");
      const selfName = $("#v2-self-cushion-name");
      if (selfName) selfName.textContent = ($("#hud-name")?.textContent || "清风") + " · 蒲团";
      const running = stage.classList.contains("is-meditating");
      if (selfPad) selfPad.classList.toggle("is-active", running);
      if (selfTime && selfClock) selfTime.textContent = running ? selfClock.textContent : "静候入座";
    }, 1000);
  }

  /* ===== 2. 后山（统一为「心灯祈福」与「高僧解惑」双殿 4K 沉浸空间） ===== */
  function rebuildBackMountain() {
    const sheet = $("#overlay-world-backmountain .backmountain-sheet");
    if (!sheet || $("#v2-backmountain-root")) return;

    let savedLamps = [];
    try { savedLamps = JSON.parse(localStorage.getItem(LAMP_STORE_KEY) || "[]"); } catch (_) { savedLamps = []; }

    const seedLamps = [
      { name: "林", tag: "平安", wish: "愿父母岁岁安康，灯火可亲", x: 14, y: 24 },
      { name: "陈", tag: "考学", wish: "愿一举登科，心明眼亮", x: 30, y: 20 },
      { name: "Maya", tag: "Peace", wish: "May all beings find inner calm tonight", x: 48, y: 22 },
      { name: "苏", tag: "康健", wish: "愿家人病痛远离，喜乐常伴", x: 66, y: 20 },
      { name: "Alex", tag: "Clarity", wish: "Grateful for wisdom on the path ahead", x: 82, y: 25 },
      { name: "周", tag: "顺遂", wish: "愿事业踏实有进，所行皆善", x: 18, y: 46 },
      { name: "清和", tag: "平安", wish: "愿天下众生离苦得乐", x: 35, y: 44 },
      { name: "Grace", tag: "Family", wish: "Blessings of warmth for my parents", x: 64, y: 44 },
      { name: "慧安", tag: "安宁", wish: "愿夜深好眠，心无挂碍", x: 80, y: 47 },
      { name: "郑", tag: "静心", wish: "愿放下焦虑，安住当下", x: 16, y: 70 },
      { name: "陆", tag: "学业", wish: "愿孩子静心向学，稳步前行", x: 34, y: 72 },
      { name: "明心", tag: "慈悲", wish: "愿以微光温暖身边每一个人", x: 52, y: 74 },
      { name: "David", tag: "Hope", wish: "Lighting a lamp for courage and peace", x: 70, y: 72 },
      { name: "云舒", tag: "康泰", wish: "愿长辈福寿绵长", x: 84, y: 69 },
    ];

    const guidanceLibrary = [
      {
        id: "anxiety",
        label: "心绪焦虑",
        keywords: ["焦虑", "紧张", "压力", "慌", "烦", "anxious", "stress", "worry"],
        sutra: "《金刚经》：过去心不可得，现在心不可得，未来心不可得。",
        insight: "心之所以发紧，往往是因为我们同时背着昨天的懊恼与明天的担忧。山风吹过松林时，松针不会去抓留上一阵风。你此刻能觉察到自己在焦虑，这份觉察本身就是清明的开始。",
        practice: "今日一行：放下手机三分钟，缓慢深呼吸十次，只感受气息进出鼻尖，不评判任何念头。",
      },
      {
        id: "family",
        label: "亲情牵挂",
        keywords: ["父母", "家人", "孩子", "家庭", "亲人", "family", "parents", "love"],
        sutra: "《法句经》：慈心遍照，如母护独子。",
        insight: "对亲人的牵挂，本质是深厚的慈爱；但若把牵挂变成控制与恐惧，双方都会疲惫。真正的护念，是先让自己安稳温暖，再把善意与祝福自然传递给他们。",
        practice: "今日一行：给最牵挂的家人发一句简单温暖的问候，不讲道理、不催促，只说“愿你今天顺心”。",
      },
      {
        id: "career",
        label: "事业抉择",
        keywords: ["工作", "事业", "迷茫", "选择", "前途", "钱", "career", "work", "choice"],
        sutra: "《华严经》：不忘初心，方得始终。",
        insight: "世间道路看似千条，让人迟疑的往往不是缺信息，而是害怕失去。佛学讲因缘和合：尽心耕耘当下这一步，不执着于一步到位，机缘自会在行进中明朗。",
        practice: "今日一行：写下你正在犹豫的两条路，只问自己一句“哪一条更符合内心的坦荡”，然后迈出最小的一步。",
      },
      {
        id: "loss",
        label: "失去与释怀",
        keywords: ["失去", "离开", "告别", "逝去", "难过", "伤心", "loss", "grief", "sad"],
        sutra: "《心经》：心无挂碍，无挂碍故，无有恐怖。",
        insight: "聚散离合是天地常道，但悲伤并不是软弱，而是爱曾真实来过的印记。不必强迫自己立刻放下，允许思念像清泉一样流过，慢慢把它化作善意与力量。",
        practice: "今日一行：点一盏心灯或念一声佛号回向给所念之人，然后认真吃一顿温热的饭。",
      },
      {
        id: "sleep",
        label: "夜深难眠",
        keywords: ["失眠", "睡不着", "熬夜", "累", "疲惫", "sleep", "tired", "night"],
        sutra: "《八大人觉经》：心无所住，安稳寂静。",
        insight: "夜深时思绪最容易放大，白日里的一点小事在黑暗中会显得像一座山。把今晚的烦恼暂时寄放在山门外，天亮之后再看，许多事本就轻如云烟。",
        practice: "今日一行：打开本殿「清音」里的《心经》或《六字真言》，调至极低音量，闭眼随呼吸安静躺下。",
      },
      {
        id: "self",
        label: "自我接纳",
        keywords: ["自卑", "不够好", "后悔", "内耗", "讨厌", "self", "doubt", "regret"],
        sutra: "《涅槃经》：一切众生，悉有佛性。",
        insight: "我们对旁人常有耐心，却唯独对自己格外苛刻。莲花本就生于淤泥，不完美并不是污点，而是生命成长的土壤。接纳此刻的自己，才能真正生出改变的力量。",
        practice: "今日一行：像安慰一位远道而来的老朋友一样，在心里对自己说一句“你已经很努力了，今天先歇一歇”。",
      },
    ];

    sheet.innerHTML = `
      <div class="v2-sanctuary-hero v2-bm-hero" id="v2-backmountain-root">
        <div class="v2-sh-bg v2-bm-bg" aria-hidden="true"></div>
        <div class="v2-sh-shade" aria-hidden="true"></div>
        <div class="v2-sh-top">
          <div>
            <small>BACK MOUNTAIN · HEART LAMPS & MASTER GUIDANCE</small>
            <h2>后山 · 心灯祈福与高僧解惑</h2>
            <p>穿林而入，万盏心灯长明；心有困惑，于古松下请益开示</p>
          </div>
          <div class="v2-sh-top-actions">
            <div class="v2-bm-tabs" role="tablist">
              <button type="button" class="is-on" data-bm-tab="lamps">心灯祈福</button>
              <button type="button" data-bm-tab="master">高僧解惑</button>
            </div>
            <button type="button" class="sheet-close" data-world-close>关闭</button>
          </div>
        </div>

        <!-- 面板一：心灯祈福（千灯名录海） -->
        <section class="v2-bm-panel is-on" data-bm-panel="lamps">
          <div class="v2-lamp-presence"><i></i><span>此刻后山共有 <b id="v2-lamp-total">${128 + savedLamps.length}</b> 盏同修心灯正在长明 · 点击任意心灯可观其愿</span></div>
          <div class="v2-lamp-sea" id="v2-lamp-sea"></div>
          <div class="v2-lamp-inspect" id="v2-lamp-inspect">轻触上方任意一盏心灯，聆听同修此刻的善愿；或亲手点亮属于你的心灯。</div>
          <div class="v2-lamp-form">
            <div class="v2-lamp-cats" id="v2-lamp-cats">
              <button type="button" class="is-on" data-lamp-cat="平安">家人平安</button>
              <button type="button" data-lamp-cat="考学">学业精进</button>
              <button type="button" data-lamp-cat="顺遂">事业顺遂</button>
              <button type="button" data-lamp-cat="安宁">身心安宁</button>
            </div>
            <div class="v2-lamp-input-row">
              <input id="v2-lamp-wish" type="text" maxlength="40" placeholder="写下一句清净祈愿（仅存本机）…" />
              <button type="button" class="btn-primary v2-gold-btn" id="v2-btn-light-lamp">点亮心灯 · 融入灯海</button>
            </div>
          </div>
        </section>

        <!-- 面板二：高僧解惑 -->
        <section class="v2-bm-panel" data-bm-panel="master">
          <div class="v2-lamp-presence"><i></i><span>此刻有 <b>19</b> 位同修正在古松禅院静心请益 · <b>净远法师（虚拟导览）</b></span></div>
          <div class="v2-master-layout">
            <div class="v2-master-card">
              <div class="v2-master-avatar"><span>净远</span></div>
              <h3>高僧解惑 · 净远法师</h3>
              <p class="v2-master-intro">“人人皆有惑。与其在尘嚣里反复内耗，不如静坐片刻，借一句古圣先贤的经偈，照见自己本有的清明。”</p>
              <div class="v2-master-topics" id="v2-master-topics">
                ${guidanceLibrary.map((g, i) => `<button type="button" class="${i === 0 ? "is-on" : ""}" data-guide-id="${g.id}">${g.label}</button>`).join("")}
              </div>
              <form class="v2-master-form" id="v2-master-form">
                <input id="v2-master-input" type="text" maxlength="100" placeholder="写下你此刻的心事或困惑，请法师以佛学经义开示…" />
                <button type="submit" class="btn-primary v2-gold-btn">呈上所惑 · 请益开示</button>
              </form>
              <p class="v2-master-note">当前为内置佛学经藏智能导览（零报错秒响应）；未来版本将开放预约真实寺院高僧在线开示。</p>
            </div>
            <div class="v2-master-reply" id="v2-master-reply">
              <small>净远法师 · 开示</small>
              <blockquote id="v2-mr-sutra">${guidanceLibrary[0].sutra}</blockquote>
              <p id="v2-mr-insight">${guidanceLibrary[0].insight}</p>
              <div class="v2-mr-practice" id="v2-mr-practice">${guidanceLibrary[0].practice}</div>
            </div>
          </div>
        </section>
      </div>
    `;

    let selectedCat = "平安";

    function renderLampSea() {
      const sea = $("#v2-lamp-sea");
      if (!sea) return;
      const allLamps = [
        ...seedLamps.map((l) => ({ ...l, isSelf: false })),
        ...savedLamps.map((l, i) => ({
          ...l,
          isSelf: true,
          x: 50 + ((i % 3) - 1) * 14,
          y: 52 + (Math.floor(i / 3) % 2) * 10,
        })),
      ];
      sea.innerHTML = allLamps.map((l, idx) => `
        <button type="button" class="v2-sea-lamp ${l.isSelf ? "is-self" : ""}" style="left:${l.x}%;top:${l.y}%;animation-delay:${-(idx * 0.45)}s" data-lamp-idx="${idx}">
          <span class="v2-lamp-flame"><i></i></span>
          <span class="v2-lamp-label"><b>${l.name}</b> · ${l.tag}</span>
        </button>
      `).join("");

      sea.onclick = (e) => {
        const btn = e.target.closest("[data-lamp-idx]");
        if (!btn) return;
        const item = allLamps[Number(btn.dataset.lampIdx)];
        const box = $("#v2-lamp-inspect");
        if (item && box) {
          box.innerHTML = `<strong>${item.name} · ${item.tag}</strong>：“${item.wish}”`;
        }
      };
      const totalEl = $("#v2-lamp-total");
      if (totalEl) totalEl.textContent = String(128 + savedLamps.length);
    }

    renderLampSea();

    // 切换心灯 / 高僧解惑
    sheet.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-bm-tab]");
      if (tab) {
        const key = tab.dataset.bmTab;
        $$("[data-bm-tab]", sheet).forEach((b) => b.classList.toggle("is-on", b.dataset.bmTab === key));
        $$("[data-bm-panel]", sheet).forEach((p) => p.classList.toggle("is-on", p.dataset.bmPanel === key));
        return;
      }
      const cat = e.target.closest("[data-lamp-cat]");
      if (cat) {
        selectedCat = cat.dataset.lampCat;
        $$("[data-lamp-cat]", sheet).forEach((b) => b.classList.toggle("is-on", b.dataset.lampCat === selectedCat));
        return;
      }
      const guideBtn = e.target.closest("[data-guide-id]");
      if (guideBtn) {
        const g = guidanceLibrary.find((item) => item.id === guideBtn.dataset.guideId) || guidanceLibrary[0];
        $$("[data-guide-id]", sheet).forEach((b) => b.classList.toggle("is-on", b.dataset.guideId === g.id));
        showGuidance(g);
      }
    });

    $("#v2-btn-light-lamp")?.addEventListener("click", () => {
      const input = $("#v2-lamp-wish");
      const text = (input?.value || "").trim() || `愿${selectedCat}常伴，内心清净安然`;
      const guest = ($("#hud-name")?.textContent || "清风").slice(0, 4);
      savedLamps.push({ name: guest, tag: selectedCat, wish: text });
      if (savedLamps.length > 8) savedLamps = savedLamps.slice(-8);
      try { localStorage.setItem(LAMP_STORE_KEY, JSON.stringify(savedLamps)); } catch (_) { /* ignore */ }
      if (input) input.value = "";
      renderLampSea();
      const box = $("#v2-lamp-inspect");
      if (box) box.innerHTML = `<strong>${guest} · ${selectedCat}（已点亮）</strong>：“${text}”`;
      const toast = $("#toast");
      if (toast) {
        toast.textContent = "心灯已点亮，融入后山灯海";
        toast.classList.add("is-show");
        setTimeout(() => toast.classList.remove("is-show"), 2200);
      }
    });

    function showGuidance(g, customQuestion = "") {
      const box = $("#v2-master-reply");
      if (!box) return;
      box.classList.remove("is-fresh");
      void box.offsetWidth;
      box.classList.add("is-fresh");
      $("#v2-mr-sutra").textContent = g.sutra;
      $("#v2-mr-insight").textContent = customQuestion
        ? `关于你所问的「${customQuestion}」：${g.insight}`
        : g.insight;
      $("#v2-mr-practice").textContent = g.practice;
    }

    $("#v2-master-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#v2-master-input");
      const q = (input?.value || "").trim();
      if (!q) return;
      const lower = q.toLowerCase();
      const matched = guidanceLibrary.find((g) => g.keywords.some((kw) => lower.includes(kw)))
        || guidanceLibrary[q.length % guidanceLibrary.length];
      showGuidance(matched, q.slice(0, 24));
      input.value = "";
    });

    // 允许外部直接定位到后山的“高僧解惑”或“心灯祈福”
    window.openBackMountainTab = (tabName) => {
      const trigger = document.querySelector('[data-world-open="backmountain"]');
      if (trigger) trigger.click();
      setTimeout(() => {
        const btn = $(`#overlay-world-backmountain [data-bm-tab="${tabName}"]`);
        if (btn) btn.click();
      }, 60);
    };
  }

  /* ===== 3. 西方极乐 · 归莲净土（怀念故人）：4K 背景 + 远方同修静谧献莲微光 + 追思莲位切换 ===== */
  function enhancePureLand() {
    const sheet = $("#overlay-world-pureland .pureland-sheet");
    if (!sheet || $("#v2-pureland-presence")) return;

    const head = sheet.querySelector(".world-head");
    if (head) {
      const h2 = head.querySelector("h2");
      const small = head.querySelector("small");
      if (small) small.textContent = "WESTERN PURE LAND · IN LOVING MEMORY";
      if (h2) h2.textContent = "西方极乐 · 归莲净土";
    }

    const bar = document.createElement("div");
    bar.className = "v2-lamp-presence v2-pureland-presence";
    bar.id = "v2-pureland-presence";
    bar.innerHTML = `
      <i></i>
      <span>此刻有 <b>24</b> 位同修正在莲池静心怀念故人（林氏献白莲 · 陈先生供心灯 · Sarah · In Memory）</span>
      <button type="button" class="v2-inline-switch" data-world-open="ancestors">前往追思莲位清供 →</button>
    `;
    const notice = sheet.querySelector(".sanctuary-notice");
    if (notice) notice.insertAdjacentElement("afterend", bar);
  }

  /* ===== 初始化 ===== */
  setTimeout(() => {
    enhanceMeditation();
    rebuildBackMountain();
    enhancePureLand();
  }, 120);
})();
