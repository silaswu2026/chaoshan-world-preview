(() => {
  "use strict";
  const app = document.querySelector("#app");
  if (!app) return;

  const entry = document.createElement("button");
  entry.type = "button";
  entry.className = "landing-world-entry";
  entry.dataset.worldOpen = "map";
  entry.innerHTML = "<span>世界小地图</span><small><b id=\"landing-online\">1,286</b> 位虚拟同修 · 四山同愿</small>";
  document.querySelector(".entry-hint")?.insertAdjacentElement("beforebegin", entry);

  const fragment = document.createElement("div");
  fragment.innerHTML = `
    <div class="world-presence" id="world-presence" aria-hidden="true"></div>
    <div class="world-tools" aria-label="虚拟世界工具">
      <button type="button" data-world-open="map"><b>图</b><span>小地图</span></button>
      <button type="button" data-world-open="room"><b>众</b><span>同行</span><i></i></button>
    </div>

    <div class="overlay world-overlay" id="overlay-world-map" role="dialog" aria-modal="true" aria-label="朝山世界小地图">
      <div class="sheet world-sheet world-map-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>CHAOSHAN WORLD</small><h2>朝山世界</h2><p>择一处前行，云雾为你开门</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="world-map-visual" aria-label="朝山世界图片示意地图">
          <div class="world-map-canvas">
            <picture class="world-map-background"><source media="(max-width: 700px)" srcset="./assets/world-map-sacred.webp" /><img src="./assets/world-map-sacred-wide.webp" alt="峨眉、五台、普陀、九华四道场与云海殿宇组成的朝山世界示意图" /></picture>
            <div class="world-map-shade" aria-hidden="true"></div>
            <svg class="world-map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 65 L18 18 M50 65 L82 18 M50 65 L13 48 M50 65 L87 48 M50 65 L20 82 M50 65 L80 82" /></svg>
            <div class="world-map-clouds" aria-hidden="true"><i></i><i></i></div>
            <button type="button" class="world-map-marker" style="--map-x:18%;--map-y:18%" data-world-open="pureland" aria-label="进入西天极乐世界怀念亲人"><span class="world-map-thumb"><img src="./assets/bg-realm-vertical.webp" alt="" /></span><span class="world-map-label"><b>西天极乐世界</b><small>怀念亲人</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:82%;--map-y:18%" data-world-open="backmountain" aria-label="进入后山心灯与解惑"><span class="world-map-thumb"><img src="./assets/scene-path.webp" alt="" /></span><span class="world-map-label"><b>后山</b><small>心灯 · 解惑</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:13%;--map-y:48%" data-world-open="room" aria-label="进入同行禅院"><span class="world-map-thumb"><img src="./assets/scene-hall.webp" alt="" /></span><span class="world-map-label"><b>同行禅院</b><small>莲灯同愿</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:87%;--map-y:48%" data-world-open="culture" aria-label="进入朝山文化网"><span class="world-map-thumb"><img src="./assets/scene-emei.webp" alt="" /></span><span class="world-map-label"><b>文化网</b><small>学习 · 活动</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:50%;--map-y:65%" data-world-memorial aria-label="进入缅怀堂"><span class="world-map-thumb"><img src="./assets/scene-hall.webp" alt="" /></span><span class="world-map-label"><b>缅怀堂</b><small>追思卡 · 清供</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:20%;--map-y:76%" data-world-open="ancestors" aria-label="进入追思莲位"><span class="world-map-thumb"><img src="./assets/scene-hall.webp" alt="" /></span><span class="world-map-label"><b>追思莲位</b><small>清供 · 回向</small></span></button>
            <button type="button" class="world-map-marker" style="--map-x:80%;--map-y:76%" data-world-open="meditation" aria-label="进入个人冥想"><span class="world-map-thumb"><img src="./assets/meditation-hall.webp" alt="" /></span><span class="world-map-label"><b>个人冥想</b><small>佛音 · 静心</small></span></button>
            <button type="button" class="world-map-return" data-world-open="chaoshan" aria-label="返回朝山世界"><img src="./assets/scene-gate.webp" alt="" /><span><b>返回朝山世界</b><small>四大道场 · 朝山主界</small></span><i>→</i></button>
          </div>
          <div class="world-map-caption"><span>朝山世界 · 场景示意</span><small>点击图片标记前往 · 非真实地理比例</small></div>
        </div>
        <section class="world-map-services" aria-labelledby="world-services-title"><div class="world-map-section-title"><h3 id="world-services-title">沿途去处</h3><small>闻思、祈愿与记录</small></div><div class="world-service-grid">
          <button type="button" class="world-service-card" data-world-open="store"><img src="./assets/product-bead-sandal.webp" alt="" /><span><b>纪念物</b><small>实物效果展示</small></span></button>
          <button type="button" class="world-service-card" data-world-open="wisdom"><img src="./assets/scene-wutai.webp" alt="" /><span><b>佛学藏阁</b><small>经典与道场知识</small></span></button>
          <button type="button" class="world-service-card" data-world-open="ai"><img src="./assets/scene-gate.webp" alt="" /><span><b>AI 祈福</b><small>经文与一步行动</small></span></button>
          <button type="button" class="world-service-card" data-world-open="relatives"><img src="./assets/scene-jiuhua.webp" alt="" /><span><b>亲人缅怀</b><small>祈福与追思陪伴</small></span></button>
          <button type="button" class="world-service-card" data-world-open="records"><img src="./assets/scene-map.webp" alt="" /><span><b>个人记录</b><small>本机足迹管理</small></span></button>
        </div></section>
        <details class="world-map-index"><summary>查看全部地点文字索引 <span>共 13 处</span></summary><div class="world-map-grid">
          <button type="button" class="world-place is-main" data-world-open="chaoshan"><i>山</i><span>朝山主界<small>四大道场 · 第一人称礼佛</small></span><b>返回</b></button>
          <button type="button" class="world-place" data-world-open="room"><i>众</i><span>同行禅院<small>虚拟服务器 · 同行者 · 聊天</small></span><b id="map-online">1,286 在线</b></button>
          <button type="button" class="world-place" data-world-open="store"><i>物</i><span>纪念物<small>念珠 · 祈福包 · 祈福灯</small></span><b>进入</b></button>
          <button type="button" class="world-place" data-world-open="wisdom"><i>闻</i><span>佛学藏阁<small>经典节选 · 仪轨 · 道场知识</small></span><b>进入</b></button>
          <button type="button" class="world-place" data-world-open="ai"><i>愿</i><span>AI 祈福<small>一句心事 · 一段经文 · 一步行动</small></span><b>进入</b></button>
          <button type="button" class="world-place" data-world-open="relatives"><i>忆</i><span>亲人缅怀<small>祈福 · 怀念 · AI 追思陪伴</small></span><b>进入</b></button>
          <button type="button" class="world-place" data-world-memorial><i>怀</i><span>缅怀堂<small>追思卡 · 白莲 · 心灯 · 清香</small></span><b>进入</b></button>
          <button type="button" class="world-place" data-world-open="records"><i>记</i><span>个人记录<small>行为足迹 · 聊天记忆 · 本机管理</small></span><b>进入</b></button>
        </div></details>
        <p class="world-privacy">无需注册即可体验。虚拟同行者与人数仅用于世界氛围演示，并非真实联网用户。</p>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-room" role="dialog" aria-modal="true" aria-label="同行禅院">
      <div class="sheet world-sheet room-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>VIRTUAL PILGRIMS</small><h2>同行禅院</h2><p>虽隔千里，同发一念善心</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="server-tabs" id="server-tabs">
          <button type="button" class="is-on" data-server="0"><span>云海一服</span><small><i></i><b>1,286</b> 虚拟在线</small></button>
          <button type="button" data-server="1"><span>莲灯二服</span><small><i></i><b>864</b> 虚拟在线</small></button>
          <button type="button" data-server="2"><span>松风三服</span><small><i></i><b>432</b> 虚拟在线</small></button>
        </div>
        <p class="simulation-note">演示房间：人物、在线人数与自动回复均为虚拟内容；你发送的内容只保存在本机。</p>
        <div class="room-layout">
          <div class="room-scene" id="room-scene"><div class="room-temple-glow"></div><div class="room-people" id="room-people"></div><div class="room-caption"><span id="room-server-name">云海一服</span><small>莲灯同愿 · 虚拟同行动态</small></div></div>
          <div class="room-chat">
            <div class="chat-title"><span>同行聊天</span><button type="button" id="btn-clear-chat">清空本房记录</button></div>
            <div class="chat-log" id="room-chat-log" aria-live="polite"></div>
            <form class="chat-form" id="room-chat-form"><input id="room-chat-input" maxlength="80" placeholder="说一句问候或祈愿…" autocomplete="off" /><button type="submit">发送</button></form>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-store" role="dialog" aria-modal="true" aria-label="纪念物">
      <div class="sheet world-sheet store-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>MEMORIAL OBJECTS</small><h2>纪念物</h2><p>留一件清净文创，记一念善心</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="store-notice">文创实物效果示意与虚拟纪念品展示，图片不代表已生产或备货的实物。当前仅生成意向单，不接支付、开光承诺或物流服务。</div>
        <div class="store-filter" id="store-filter"><button type="button" class="is-on" data-category="all">全部</button><button type="button" data-category="beads">佛珠念珠</button><button type="button" data-category="bag">祈福包</button><button type="button" data-category="lamp">祈福灯</button></div>
        <div class="product-grid" id="product-grid"></div>
        <div class="cart-bar"><div><span>纪念袋 <b id="cart-count">0</b> 件</span><strong id="cart-total">¥0</strong></div><button type="button" id="btn-checkout">生成意向单</button></div>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-wisdom" role="dialog" aria-modal="true" aria-label="佛学知识">
      <div class="sheet world-sheet wisdom-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>BUDDHIST WISDOM</small><h2>佛学藏阁</h2><p>闻一句，思一层，行一步</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="wisdom-search"><input id="wisdom-search" type="search" placeholder="搜索经典、道场或礼佛知识" /><span id="wisdom-count"></span></div>
        <div class="wisdom-layout"><nav id="wisdom-nav" aria-label="知识分类"></nav><div class="wisdom-list" id="wisdom-list"></div></div>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-ai" role="dialog" aria-modal="true" aria-label="AI 祈福">
      <div class="sheet world-sheet ai-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>AI BLESSING</small><h2>AI 祈福</h2><p>说一句话，借经文照见心结</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="ai-boundary">AI 会引用有出处的经典并作生活化解读，不代替宗教导师、医生或心理咨询。请勿输入身份、电话等敏感信息。</div>
        <div class="ai-chat-log" id="ai-chat-log" aria-live="polite"><div class="ai-message is-ai"><b>祈福助手</b><p>此刻有什么心事？可以只说一句。我会陪你从经文中找一个看待它的角度。</p></div></div>
        <div class="ai-suggestions"><button type="button">最近总是焦虑</button><button type="button">放不下一段关系</button><button type="button">为家人祈求平安</button></div>
        <form class="ai-form" id="ai-form"><textarea id="ai-input" maxlength="240" rows="2" placeholder="写下此刻的一句话…"></textarea><div><span id="ai-status">真实 AI · 流式回复 · 历史仅作本轮上下文</span><button type="button" id="btn-ai-stop" hidden>停止</button><button type="submit" id="btn-ai-send">祈福解答</button></div></form>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-relatives" role="dialog" aria-modal="true" aria-label="亲人缅怀">
      <div class="sheet world-sheet relatives-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>REMEMBRANCE</small><h2>亲人缅怀</h2><p>为故人留灯，也照顾好仍在人间的自己</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="memorial-world-hero"><div class="memorial-lotus"><i></i><i></i><i></i><b></b></div><div><h3 id="relative-card-title">一盏思念灯</h3><p id="relative-card-text">尚未建立追思卡。可以写下故人称谓、一段怀念，献白莲、供心灯或敬清香。</p></div><button type="button" id="world-open-memorial">建立追思卡</button></div>
        <div class="relative-ai">
          <div class="relative-ai-head"><h3>AI 追思陪伴</h3><span>不是逝者本人，不模拟逝者身份</span></div>
          <div class="ai-chat-log" id="relative-chat-log"><div class="ai-message is-ai"><b>追思陪伴</b><p>如果你愿意，可以告诉我，你最想念亲人的哪一个瞬间。我会陪你整理思念，而不是代替亲人回答。</p></div></div>
          <form class="ai-form" id="relative-ai-form"><textarea id="relative-ai-input" maxlength="240" rows="2" placeholder="写下想说却来不及说的话…"></textarea><div><span>AI 心理支持式回应 · 不宣称通灵</span><button type="submit" id="btn-relative-send">寄出思念</button></div></form>
        </div>
      </div>
    </div>

    <div class="overlay world-overlay" id="overlay-world-records" role="dialog" aria-modal="true" aria-label="个人记录">
      <div class="sheet world-sheet records-sheet">
        <div class="world-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="sheet-head world-head"><div><small>MY JOURNEY</small><h2>个人记录</h2><p>一念一行，都有来处</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <div class="record-summary" id="record-summary"></div>
        <div class="record-toolbar"><div id="record-filters"><button type="button" class="is-on" data-record-filter="all">全部</button><button type="button" data-record-filter="ritual">礼佛行为</button><button type="button" data-record-filter="chat">聊天记忆</button><button type="button" data-record-filter="visit">区域足迹</button></div><div><button type="button" id="btn-export-records">导出</button><button type="button" id="btn-clear-records">清除</button></div></div>
        <p class="world-privacy">个人行为与聊天记忆仅保存于本机浏览器；AI 提问会为生成回复而发送至模型服务。清除浏览器数据会删除本机记录。</p>
        <div class="record-timeline" id="record-timeline"></div>
      </div>
    </div>
  `;
  while (fragment.firstElementChild) app.insertBefore(fragment.firstElementChild, document.querySelector("#toast"));
})();
