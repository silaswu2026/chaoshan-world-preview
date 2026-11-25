(() => {
  "use strict";
  const app = document.querySelector("#app");
  const map = document.querySelector(".world-map-grid");
  if (!app || !map) return;

  map.querySelector('[data-world-open="records"]')?.insertAdjacentHTML("beforebegin", `
    <button type="button" class="world-place" data-world-open="ancestors"><i>莲</i><span>追思莲位<small>清供 · 礼拜 · 诵经回向</small></span><b>进入</b></button>
    <button type="button" class="world-place" data-world-open="pureland"><i>西</i><span>西方极乐 · 怀念亲人<small>安心引导 · 数字纪念形象 · 模拟寄语</small></span><b>进入</b></button>
    <button type="button" class="world-place" data-world-open="backmountain"><i>灯</i><span>后山 · 心灯与解惑<small>灯塔 · 祈福 · 缅怀 · 虚拟高僧</small></span><b>进入</b></button>
    <button type="button" class="world-place" data-world-open="meditation"><i>定</i><span>个人冥想<small>殿内静坐 · 佛音相伴 · 自在聆听</small></span><b>进入</b></button>
    <button type="button" class="world-place" data-world-open="culture"><i>文</i><span>朝山文化网<small>关于 · 学习 · 影像 · 书籍 · 活动</small></span><b>进入</b></button>`);

  document.querySelector(".landing-world-entry")?.insertAdjacentHTML("afterend", `
    <div class="landing-extra-channels" aria-label="其他通道">
      <button type="button" data-world-open="pureland">西方极乐 · 怀念亲人</button><i></i><button type="button" data-world-open="backmountain">后山 · 心灯解惑</button><i></i><button type="button" data-world-open="meditation">静心冥想</button><i></i><button type="button" data-world-open="culture">佛学文化网</button>
    </div>`);
  document.querySelector(".memorial-world-hero")?.insertAdjacentHTML("afterend", `
    <div class="memorial-new-paths"><button type="button" data-world-open="ancestors"><b>佛教追思堂</b><span>设立莲位，以清香、花果与善行回向</span></button><button type="button" data-world-open="pureland"><b>极乐胜境 · 模拟体验</b><span>经过安心引导，生成数字纪念形象与交流</span></button></div>`);

  const fragment = document.createElement("div");
  fragment.innerHTML = `
    <div class="overlay world-overlay sanctuary-overlay" id="overlay-world-ancestors" role="dialog" aria-modal="true" aria-label="佛教追思堂">
      <div class="sheet world-sheet sanctuary-sheet ancestors-sheet">
        <div class="sheet-head world-head"><div><small>BUDDHIST REMEMBRANCE</small><h2>追思莲位</h2><p>慎终追远 · 以清净善行寄托怀念</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <p class="sanctuary-notice">佛教式虚拟追思演示：以“莲位”纪念故人，不将故人奉为神明，不宣称超度效果，也不对应实体寺院牌位。</p>
        <div class="ancestor-altar" id="ancestor-altar">
          <div class="altar-halo"></div><div class="altar-columns"><i></i><i></i></div>
          <div class="ancestor-lotus-seat"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="ancestor-tablet"><small>莲 位</small><b id="ancestor-tablet-name">先故亲人</b><span>南无阿弥陀佛</span></div>
          <div class="altar-offering is-water"><i></i><span>清水</span></div><div class="altar-offering is-fruit"><i></i><i></i><i></i><span>净果</span></div>
          <div class="altar-offering is-flower"><i></i><i></i><i></i><span>白莲</span></div>
          <div class="altar-censer"><i></i><i></i><i></i><b></b><div class="ancestor-smoke"><i></i><i></i></div></div>
          <div class="altar-lamp"><i></i><b></b></div><div class="altar-table"></div>
          <p class="altar-verse">愿故人离苦得乐 · 愿在世者平安珍重</p>
        </div>
        <div class="ancestor-editor"><div><label for="ancestor-name">莲位称谓</label><input id="ancestor-name" maxlength="16" placeholder="例：先考、先妣、祖父、慈母" /></div><div><label for="ancestor-memory">一段追思</label><input id="ancestor-memory" maxlength="80" placeholder="记住一件温暖的小事，不必公开隐私" /></div><button type="button" id="btn-ancestor-save">安放莲位</button></div>
        <div class="ancestor-actions" aria-label="追思供养"><button type="button" data-ancestor-rite="flower"><i>花</i><span>献白莲</span></button><button type="button" data-ancestor-rite="incense"><i>香</i><span>敬清香</span></button><button type="button" data-ancestor-rite="lamp"><i>灯</i><span>供心灯</span></button><button type="button" data-ancestor-rite="bow"><i>礼</i><span>合掌礼拜</span></button><button type="button" data-ancestor-rite="chant"><i>唵</i><span>称念佛号</span></button><button type="button" data-ancestor-rite="dedicate"><i>向</i><span>善行回向</span></button></div>
        <p class="ancestor-response" id="ancestor-response" aria-live="polite">清水与净果象征清净、感恩。此处所有动作只在网页与本机记录中发生。</p>
        <details class="buddhist-note"><summary>为什么采用这些供养？</summary><p>汉传佛教追思场合常见莲位、清水、鲜花、净果、香灯及念佛回向，重在孝思、慈悲与善行。不同寺院仪轨会有差异，现实办理应尊重家属意愿并咨询寺方，不以供品多寡衡量孝心。</p></details>
      </div>
    </div>

    <div class="overlay world-overlay sanctuary-overlay" id="overlay-world-pureland" role="dialog" aria-modal="true" aria-label="极乐胜境模拟体验">
      <div class="sheet world-sheet sanctuary-sheet pureland-sheet">
        <div class="sheet-head world-head"><div><small>PURE LAND · DIGITAL SIMULATION</small><h2>极乐胜境</h2><p>借一幅清净图景，安放未曾说完的思念</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <p class="sanctuary-notice">全程数字模拟，不是宗教意义上的净土证明、通灵或逝者复现。生成形象和交流文字不代表亲人的外貌、人格或真实意愿。</p>
        <ol class="pureland-progress" id="pureland-progress"><li class="is-on"><b>一</b><span>安心</span></li><li><b>二</b><span>造像</span></li><li><b>三</b><span>入境</span></li><li><b>四</b><span>寄语</span></li></ol>
        <section class="pureland-step is-on" data-pure-step="1">
          <div class="pureland-welcome"><div class="welcome-orb"><i></i><b>净</b></div><div><h3>先慢慢安住这一口气</h3><p>接下来，你可以选择一张亲人照片，或一个温和的基础形象。系统只在本机浏览器合成半透明光影形象，不会把照片上传服务器。</p><p>对话是预设的模拟陪伴文案，不是 AI 推测亲人的想法。若此刻让你过于难受，可以随时关闭，不必完成流程。</p></div></div>
          <div class="pureland-fields"><label for="pureland-name">希望怎样称呼这位亲人？</label><input id="pureland-name" maxlength="16" placeholder="例：外婆、父亲、亲爱的家人" /><label class="pureland-consent"><input id="pureland-consent" type="checkbox" /><span>我理解这是虚拟纪念体验，生成形象和对话均非亲人的真实表达。</span></label></div>
          <button type="button" class="sanctuary-primary" data-pure-next="2" disabled>我已了解 · 继续选择形象</button>
        </section>
        <section class="pureland-step" data-pure-step="2">
          <h3 class="sanctuary-section-title">选择一个纪念形象</h3>
          <div class="pureland-avatar-options"><button type="button" class="is-on" data-pure-avatar="qing"><img src="./assets/avatar-qing.webp?v=20261124-7" alt="清行基础形象" /><span>清行</span></button><button type="button" data-pure-avatar="shao"><img src="./assets/avatar-shao.webp?v=20261124-7" alt="澄心基础形象" /><span>澄心</span></button><button type="button" data-pure-avatar="zhong"><img src="./assets/avatar-zhong.webp?v=20261124-7" alt="静远基础形象" /><span>静远</span></button><button type="button" data-pure-avatar="lao"><img src="./assets/avatar-lao.webp?v=20261124-7" alt="慧安基础形象" /><span>慧安</span></button><label class="pureland-upload"><input id="pureland-photo" type="file" accept="image/jpeg,image/png,image/webp" /><b>＋</b><span>选择亲人照片<small>仅本机读取 · 最大 8MB</small></span></label></div>
          <div class="pureland-compose"><div class="compose-preview" id="compose-preview"><img id="pureland-source-preview" src="./assets/avatar-qing.webp?v=20261124-7" alt="纪念形象预览" /><i></i><span>等待光影合成</span></div><div><h3 id="compose-title">清行 · 基础形象</h3><p id="compose-description">将形象转为低饱和、半透明的莲光纪念样式。本原型不做面部识别、换脸、年龄推断或声音克隆。</p><button type="button" class="sanctuary-primary" id="btn-pure-compose">在本机生成纪念形象</button><p class="compose-status" id="compose-status" aria-live="polite"></p></div></div>
          <button type="button" class="sanctuary-text-button" data-pure-next="1">返回上一步</button>
        </section>
        <section class="pureland-step" data-pure-step="3">
          <div class="pureland-scene" id="pureland-scene" aria-label="多位菩萨围绕半透明数字纪念形象的模拟场景">
            <div class="pureland-sky"></div><div class="pureland-halo halo-one"></div><div class="pureland-halo halo-two"></div><div class="pureland-stars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="pureland-bodhisattvas" aria-hidden="true">
              <div class="pureland-bodhisattva bodhi-1"><span class="bodhi-halo"></span><i class="bodhi-head"></i><i class="bodhi-body"></i><b>观世音</b></div>
              <div class="pureland-bodhisattva bodhi-2"><span class="bodhi-halo"></span><i class="bodhi-head"></i><i class="bodhi-body"></i><b>文殊</b></div>
              <div class="pureland-bodhisattva bodhi-3"><span class="bodhi-halo"></span><i class="bodhi-head"></i><i class="bodhi-body"></i><b>普贤</b></div>
              <div class="pureland-bodhisattva bodhi-4"><span class="bodhi-halo"></span><i class="bodhi-head"></i><i class="bodhi-body"></i><b>地藏</b></div>
              <div class="pureland-bodhisattva bodhi-5"><span class="bodhi-halo"></span><i class="bodhi-head"></i><i class="bodhi-body"></i><b>大势至</b></div>
            </div>
            <div class="pureland-memory-figure"><span class="memory-figure-halo"></span><div class="memory-figure-frame"><img id="pureland-final-image" src="./assets/avatar-qing.webp?v=20261124-7" alt="半透明数字纪念形象" /></div><b id="pureland-figure-name">亲人 · 数字纪念形象</b><small>本机光影合成 · 非本人复现</small></div>
            <div class="pureland-lotus-floor"><i></i><i></i><i></i></div><p>一 念 清 净 · 慈 悲 相 伴</p>
          </div>
          <div class="pureland-arrival"><div><h3>圣境已展开</h3><p>这只是由网页图像、光影与动画构成的艺术场景。你可以在此写信、整理思念，再带着善意回到生活。</p></div><button type="button" class="sanctuary-primary" data-pure-next="4">走近 · 开始模拟寄语</button></div>
        </section>
        <section class="pureland-step" data-pure-step="4">
          <div class="pureland-dialog-layout"><div class="pureland-mini-scene"><img id="pureland-dialog-image" src="./assets/avatar-qing.webp?v=20261124-7" alt="数字纪念形象" /><span id="pureland-dialog-name">亲人的数字纪念形象</span><small>模拟陪伴 · 不是本人</small></div><div class="pureland-dialog-main"><div class="pureland-dialog-log" id="pureland-dialog-log" aria-live="polite"><div class="pureland-message"><b>模拟陪伴文案</b><p>此刻不必急着告别。你可以先说一件想分享的小事，也可以只是安静坐一会儿。这里的话由网页预先编写，不代表亲人的真实回应。</p></div></div><div class="pureland-quick-words"><button type="button">我很想念你</button><button type="button">最近家里都好</button><button type="button">我有一件心事</button></div><form id="pureland-dialog-form"><textarea id="pureland-dialog-input" maxlength="180" rows="2" placeholder="写下一句想说的话，只保存在当前页面…"></textarea><div><span>预设文案 · 不调用 AI · 不分析人格</span><button type="submit">写下寄语</button></div></form></div></div>
          <div class="pureland-finish"><button type="button" class="sanctuary-text-button" data-pure-next="3">回到圣境</button><button type="button" class="sanctuary-primary" id="btn-pure-finish">合十回向 · 结束本次寄语</button></div>
        </section>
      </div>
    </div>

    <div class="overlay world-overlay sanctuary-overlay" id="overlay-world-backmountain" role="dialog" aria-modal="true" aria-label="后山心灯与解惑">
      <div class="sheet world-sheet sanctuary-sheet backmountain-sheet">
        <div class="sheet-head world-head"><div><small>BACK MOUNTAIN · LIGHT & GUIDANCE</small><h2>后山 · 心灯与解惑</h2><p>沿山径往后走，留一盏灯，也留一个问题</p></div><button type="button" class="sheet-close" data-world-close>关闭</button></div>
        <p class="sanctuary-notice">后山为虚拟文化场景：心灯、愿牌与缅怀仅存本机；解惑者是有明确标识的虚拟角色，并非真实法师或寺院服务。</p>
        <div class="backmountain-layout">
          <div class="backmountain-scene" id="backmountain-scene" aria-label="云雾后山中的心灯塔">
            <div class="backmountain-moon"></div><div class="backmountain-cloud cloud-a"></div><div class="backmountain-cloud cloud-b"></div>
            <div class="beacon-beam"></div>
            <div class="heart-beacon"><div class="beacon-crown"><i></i><b></b></div><div class="beacon-room"><i></i><i></i><i></i></div><div class="beacon-body"><i></i><i></i><i></i></div><div class="beacon-base"></div></div>
            <div class="backmountain-path"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="backmountain-wish-tags" id="backmountain-wish-tags" aria-hidden="true"></div>
            <div class="backmountain-scene-caption"><small>后 山 · 心 灯 塔</small><b id="backmountain-scene-status">等你点亮第一盏心灯</b></div>
          </div>
          <div class="backmountain-content">
            <nav class="backmountain-tabs" aria-label="后山功能"><button type="button" class="is-on" data-back-tab="beacon">灯塔</button><button type="button" data-back-tab="prayer">祈福</button><button type="button" data-back-tab="memory">缅怀</button><button type="button" data-back-tab="guide">高僧解惑</button></nav>
            <section class="backmountain-panel is-on" data-back-panel="beacon"><small>HEART LIGHT</small><h3>灯照山径，也照见当下</h3><p>点亮一盏网页心灯，不对应线下寺院供灯。它可以为自己、家人或故人，不比较数量，不承诺宗教功效。</p><button type="button" class="sanctuary-primary" id="btn-back-light">点亮心灯</button><p class="backmountain-local-status" id="backmountain-light-count">本机已点亮 0 次</p></section>
            <section class="backmountain-panel" data-back-panel="prayer"><small>PRAYER TAG</small><h3>把心愿挂在后山松风间</h3><div class="backmountain-wish-types"><button type="button" class="is-on" data-back-wish-type="家人平安">家人平安</button><button type="button" data-back-wish-type="学业进步">学业进步</button><button type="button" data-back-wish-type="事业顺遂">事业顺遂</button><button type="button" data-back-wish-type="亲人祈福">亲人祈福</button></div><label for="back-prayer-text">愿文 · 只保存在本机</label><textarea id="back-prayer-text" maxlength="80" rows="2" placeholder="例：愿父母康健，也愿我懂得珍惜与陪伴"></textarea><button type="button" class="sanctuary-primary" id="btn-back-prayer-save">写好并挂上愿牌</button><div class="backmountain-prayer-list" id="backmountain-prayer-list"></div></section>
            <section class="backmountain-panel" data-back-panel="memory"><small>REMEMBRANCE</small><h3>思念不必匆匆放下</h3><p>可以在追思堂安放莲位，也可以经过安心引导进入西方极乐的艺术模拟场景。两者都不是通灵或逝者复现。</p><div class="backmountain-path-buttons"><button type="button" data-world-open="ancestors"><b>追思莲位</b><span>清供 · 礼拜 · 善行回向</span></button><button type="button" data-world-open="pureland"><b>西方极乐 · 怀念亲人</b><span>安心引导 · 数字纪念形象 · 模拟寄语</span></button></div><button type="button" class="sanctuary-text-button" id="btn-back-flower">在后山献一枝白莲</button><p class="backmountain-local-status" id="backmountain-memory-status"></p></section>
            <section class="backmountain-panel" data-back-panel="guide"><small>VIRTUAL GUIDE</small><h3>虚拟高僧 · 经文导览</h3><div class="backmountain-guide-intro"><i>僧</i><div><b>净远 · 虚拟导览者</b><span>虚构角色，不代表真实僧团。以经典常识和生活行动作答，不占卜、不消业、不治病。</span></div></div><div class="backmountain-guide-topics"><button type="button" data-back-guide-topic="心烦意乱">心烦意乱</button><button type="button" data-back-guide-topic="家人相处">家人相处</button><button type="button" data-back-guide-topic="求学事业">求学事业</button><button type="button" data-back-guide-topic="思念故人">思念故人</button></div><div class="backmountain-guide-log" id="backmountain-guide-log" aria-live="polite"><div><b>净远 · 虚拟回答</b><p>先选一件心事，或写下一句困惑。我会用经过核验的经典节选陪你理一理；这里不调用模型，不产生 AI 费用。</p></div></div><form id="back-guide-form"><input id="back-guide-input" maxlength="100" placeholder="写一句想问的话…" /><button type="submit">请教</button></form><button type="button" class="backmountain-ai-link" data-world-open="ai">开放问题可前往 AI 祈福（会调用模型）</button></section>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay world-overlay sanctuary-overlay" id="overlay-world-meditation" role="dialog" aria-modal="true" aria-label="个人冥想">
      <div class="meditation-fullscreen" id="meditation-fullscreen">
        <div class="meditation-image" aria-hidden="true"></div><div class="meditation-shade"></div><div class="meditation-breath" id="meditation-breath"><i></i><i></i><b>静心</b></div>
        <header class="meditation-head"><div><small>PERSONAL MEDITATION</small><h2>个人冥想</h2></div><button type="button" data-world-close>退出冥想</button></header>
        <div class="meditation-intro" id="meditation-intro"><p>万缘暂放 · 只留一声佛号</p><h3>在殿前，给自己一段安静</h3><span>选择佛音与时长，点击开始后聆听。冥想不是宗教功效或医疗承诺，如感不适请随时停止。</span><button type="button" class="sanctuary-primary" id="btn-meditation-open">选择本次冥想</button></div>
        <div class="meditation-player" id="meditation-player" hidden>
          <div class="meditation-track-options" id="meditation-track-options"><button type="button" class="is-on" data-meditation-track="diamond"><b>金刚经</b><span>设备语音 · 已核验节选</span></button><button type="button" data-meditation-track="heart"><b>心经</b><span>真实诵念录音</span></button><button type="button" data-meditation-track="compassion"><b>大悲咒</b><span>真实诵念录音</span></button><button type="button" data-meditation-track="six"><b>六字真言</b><span>真实诵念录音</span></button><button type="button" data-meditation-track="amitabha"><b>阿弥陀佛</b><span>设备语音 · 圣号</span></button></div>
          <div class="meditation-time-options" id="meditation-time-options"><button type="button" data-meditation-minutes="5">5 分钟</button><button type="button" class="is-on" data-meditation-minutes="10">10 分钟</button><button type="button" data-meditation-minutes="20">20 分钟</button><button type="button" data-meditation-minutes="0">不限时</button></div>
          <div class="meditation-status"><span id="meditation-now">金刚经 · 尚未开始</span><strong id="meditation-countdown">10:00</strong></div>
          <div class="meditation-controls"><button type="button" class="sanctuary-primary" id="btn-meditation-start">点击开始冥想</button><button type="button" id="btn-meditation-stop">停止</button></div><p id="meditation-hint">首次点击才会发声；刷新不会自动播放。</p>
        </div>
      </div>
    </div>

    <div class="overlay world-overlay sanctuary-overlay" id="overlay-world-culture" role="dialog" aria-modal="true" aria-label="朝山佛学文化网">
      <div class="culture-site">
        <header class="culture-site-head"><button type="button" class="culture-brand" data-culture-page="about"><i>见</i><span>见山 · 朝山<small>JIANSHAN · CHAOSHAN</small></span></button><nav aria-label="文化网站栏目"><button type="button" class="is-on" data-culture-page="about">关于</button><button type="button" data-culture-page="learn">佛学学习</button><button type="button" data-culture-page="objects">请佛物</button><button type="button" data-culture-page="books">佛书</button><button type="button" data-culture-page="events">最新活动</button></nav><button type="button" class="culture-exit" data-world-close>返回朝山</button></header>
        <main id="culture-main"></main>
        <footer class="culture-footer"><span>朝山文化 · 虚拟佛教文化体验</span><span>非实体寺院官网 · 无宗教功效承诺 · 个人资料仅存本机</span></footer>
      </div>
    </div>`;
  while (fragment.firstElementChild) app.insertBefore(fragment.firstElementChild, document.querySelector("#toast"));
})();
