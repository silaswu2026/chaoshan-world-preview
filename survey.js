"use strict";

const PUBLIC_CONFIG = {
  endpoint: "https://chaoshan-world.app.workbuddy.host",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "wbpk_B77kbxuGDWT3NgsauK6Mfl_Wa59x1AxJcfnLvTF4892SBJA9agOz00j",
};
const DRAFT_KEY = "chaoshan_product_discovery_v3_draft";
const REPORT_PATTERN = /^CS-DIR-[0-9]{6}-[A-Z0-9]{8}$/;
const SURVEY_ID = "chaoshan-product-direction-needs-v3";
const SHARE_URL = "https://chaoshan-world.app.workbuddy.host/survey.html?sharecode=2LM2XRGSQC";

const STRATEGY_QUESTIONS = [
  {
    name: "primaryOutcome", number: "S1", type: "single", required: true,
    title: "未来 12 个月，这个项目首先必须证明哪一种价值？",
    hint: "只能选一个“首要结果”，其他结果仍可作为次级目标。",
    options: [
      ["user", "真实用户价值", "证明目标用户会反复使用，并获得可描述的帮助或慰藉"],
      ["culture", "文化内容与专业可信度", "证明四大道场、经典与仪轨内容准确、易懂且持续有人学习"],
      ["experience", "沉浸体验与技术表现", "证明手机端也能形成独特、稳定、难忘的朝山体验"],
      ["business", "可持续商业模式", "验证付费或合作意愿，形成不依赖持续补贴的价值获取方式"],
      ["brand", "品牌与文化 IP", "建立可识别的东方数字文化品牌，为后续合作与线下场景铺路"],
      ["unknown", "暂无法判断", "缺少用户、成本或竞品证据，不能负责任地选首要结果"],
    ],
  },
  {
    name: "userNeed", number: "S3", type: "multi", max: 3, required: true,
    title: "以下哪些未满足需求，最值得优先验证？",
    hint: "请按您对真实用户的理解选择，最多 3 项；现有替代方式只是帮助判断，不代表用户一定不满意。",
    options: [
      ["access", "受时间、距离或身体条件限制，难以实地朝礼", "替代：短视频、线上图文、语音导览"],
      ["stillness", "工作生活压力大，需要短时、可信的静心仪式", "替代：冥想 App、白噪音、音乐、运动"],
      ["practice", "日常念佛、拨珠、抄经与回向缺少顺手工具", "替代：实体念珠、纸质经本、备忘录"],
      ["learn", "对佛学、菩萨、造像与仪轨有兴趣，但内容碎片难辨真伪", "替代：书籍、短视频、寺院开示、搜索"],
      ["memorial", "思念亲人时，需要一个克制、私密的表达空间", "替代：忌日祭拜、写信、与亲友倾诉"],
      ["aesthetic", "想体验东方建筑、艺术与声景，而非信息式浏览", "替代：游戏、纪录片、文旅内容"],
      ["belong", "缺少温和、有边界的同修交流与活动参与", "替代：微信群、寺院活动、线下共修"],
      ["noEvidence", "目前没有证据证明存在足够强的需求", "选择此项提示团队先做发现研究，而非直接扩大功能"],
    ],
  },
  {
    name: "evidenceBasis", number: "S4", type: "multi", required: true,
    title: "您对上述需求判断的主要依据是什么？",
    hint: "可多选。此题用于区分直接证据与经验判断，不评价答案对错。",
    options: [
      ["interviews", "与目标用户做过访谈或观察到真实行为"],
      ["data", "已有访问、留存、付费或同类产品数据"],
      ["expert", "佛学、文化、心理或行业专家意见"],
      ["operating", "相关产品、文旅、内容或商业化运营经验"],
      ["demo", "体验 Demo 后的个人判断"],
      ["preference", "主要基于个人偏好或对身边人的观察"],
      ["assumption", "目前主要是团队假设，尚缺外部证据"],
    ],
  },
  {
    name: "moat", number: "S5", type: "multi", max: 2,
    title: "若大厂或同类产品跟进，我们真正可持续的差异可能是什么？",
    hint: "最多 2 项。“AI 生成内容”和“漂亮图片”本身通常不构成壁垒。",
    options: [
      ["cultural", "权威内容、专家网络与长期审校机制"],
      ["resources", "实体名山、寺院、文旅或非遗合作资源"],
      ["experience", "难以复制的仪式交互、声景与情感体验"],
      ["memory", "用户长期积累的修行、愿文与纪念档案"],
      ["brand", "可信、克制且有辨识度的文化品牌"],
      ["cost", "在手机端实现高品质体验的技术与成本效率"],
      ["community", "高质量的内容创作者与同修社区"],
      ["none", "目前没有明确壁垒，需要先验证"],
    ],
  },
  {
    name: "positioningStatement", number: "S6", type: "text",
    title: "请写出您认可的一句话产品定位（选填）",
    hint: "格式建议：为【谁】，在【场景】，通过【关键能力】，实现【可验证结果】。写不出也是重要信号。",
    placeholder: "如：为无法经常实地朝礼的都市人，提供有文化依据、可日常完成的轻朝山体验",
  },
];

const MODULES = [
  ["immersive", "四山 2.5D 沉浸世界", "山门、四山、殿堂、云雾与光影动效"],
  ["free3d", "自由漫游实时 3D", "自由行走、360° 视角与完整三维场景"],
  ["ritual", "八项前景礼佛仪式", "拜佛、请香、上香、念佛、拨珠、木鱼、供灯、佛牌"],
  ["daily", "日常静心与微功课", "念佛、抄经、冥想、早晚课、回向与温和提醒"],
  ["learning", "系统化佛学学习", "经典、仪轨、菩萨文化、课程、测试与学习记录"],
  ["culture", "朝山文化网 / 佛书 / 活动", "独立图文门户、书籍节选、专题与线上活动"],
  ["ai", "AI 祈福与生活解惑", "经文推荐、经文 / 解心 / 一行、受限知识库回答"],
  ["memorial", "追思莲位与极乐胜境", "私密追思、清供、净土意象与模拟寄语"],
  ["social", "同行禅院与同修社交", "莲灯同行、服务器、聊天、共修与活动社区"],
  ["commerce", "文创纪念物与法物", "念珠、香品、祈福包、抄经本及虚拟纪念物"],
  ["archive", "个人修行与朝山档案", "足迹、香印、愿文、功课记录与年度回顾"],
  ["offline", "实体名山与线下联动", "真实导览、寺院合作、文旅路线与线下活动"],
];

const SCOPE_QUESTIONS = [
  {
    name: "productArchitecture", number: "P1", type: "single",
    title: "沉浸世界、佛学学习与文化网，最合适的产品关系是什么？",
    options: [
      ["one", "一个产品内的三个层级", "世界负责体验，学习负责理解，文化网负责公开内容与传播"],
      ["world", "以沉浸世界为主，其余轻量收纳", "学习与文化内容按场景嵌入，不做平行大入口"],
      ["learning", "以佛学学习为主，沉浸世界为特色体验", "课程、经典与进度是核心，朝山增强学习动机"],
      ["portal", "世界与独立文化网双入口", "共用品牌、账号与内容，但分别服务体验与浏览"],
      ["unknown", "暂无法判断", "需要先验证核心用户任务与内容生产成本"],
    ],
  },
  {
    name: "usageHabit", number: "P2", type: "single",
    title: "首版最应该适配哪一种使用节奏？",
    options: [
      ["daily", "每日 3–10 分钟", "静心、念佛、功课与回向"],
      ["weekly", "每周一次完整朝礼", "形成比碎片工具更完整的体验"],
      ["occasion", "节气、佛诞、忌日与人生节点", "不追求高频，但要求场景足够庄重"],
      ["learning", "按课程进度学习", "以周为单位形成持续学习计划"],
      ["unknown", "暂无法判断", "需要通过用户研究确定，而非团队拍脑袋"],
    ],
  },
];

const BUSINESS_QUESTIONS = [
  {
    name: "businessModel", number: "B1", type: "single", required: true,
    title: "中长期最值得优先验证的商业模式是什么？",
    hint: "这里只选验证方向，不代表立即上线收费。",
    options: [
      ["goods", "高品质实体文创与香品", "核心体验免费，以实物销售支持持续运营"],
      ["membership", "克制的内容与服务会员", "深度课程、多端同步等非宗教功效权益"],
      ["b2b", "文化、文旅与机构合作", "数字导览、内容授权、非遗数字化项目"],
      ["mixed", "组合模式", "需要先明确主次和验证顺序，而非同时全部上线"],
      ["nonprofit", "公益或 sponsored 模式", "以捐赠、赞助或机构资金支持"],
      ["later", "暂不商业化，先验证用户价值", "明确设定验证期限与停止条件"],
      ["unknown", "暂无法判断", "缺少支付意愿、成本或合作资源证据"],
    ],
  },
  {
    name: "budget", number: "B2", type: "single",
    title: "首期可接受的产品验证预算量级（人民币）",
    options: [["under20", "20 万以内"], ["20to50", "20–50 万"], ["50to100", "50–100 万"], ["100to300", "100–300 万"], ["over300", "300 万以上"], ["nodata", "尚无可决定预算 / 不便填写"]],
  },
  {
    name: "mvpDuration", number: "B3", type: "single",
    title: "从现在到可交给真实用户验证的首版，可接受时间",
    options: [["6w", "6 周以内"], ["2m", "约 2 个月"], ["3m", "约 3 个月"], ["6m", "约 6 个月"], ["over6m", "6 个月以上"], ["gate", "不设固定日期，按阶段门槛推进"]],
  },
  {
    name: "teamSize", number: "B4", type: "single",
    title: "首期最匹配的团队配置",
    options: [["solo", "1–2 人快速验证"], ["small", "3–5 人核心团队"], ["medium", "6–10 人跨职能团队"], ["large", "10 人以上完整团队"], ["parttime", "现有团队兼职，不新增人手"], ["unknown", "尚无法判断"]],
  },
  {
    name: "costConcern", number: "B5", type: "multi", max: 2,
    title: "您最担心的两类持续成本是什么？",
    options: [
      ["content", "专家审校与高质量内容持续生产"],
      ["art", "原画、音频、动效与多机型适配"],
      ["ai", "AI 调用、知识库维护与错误兜底"],
      ["moderation", "社区、隐私与敏感内容治理"],
      ["customer", "用户服务、履约与售后"],
      ["acquisition", "获客与持续运营"],
      ["evidence", "尚无成本数据，无法判断"],
    ],
  },
  {
    name: "commercialConcern", number: "B6", type: "text",
    title: "哪些收费或合作方式，即使短期赚钱也不应做？",
    placeholder: "例：贩卖焦虑、承诺宗教功效、功德攀比、把私密追思用于营销……",
  },
];

const DEMO_QUESTIONS = [
  {
    name: "demoOverall", number: "D0", type: "scale", min: 0, max: 10, required: true, demoOnly: true,
    title: "假设目标用户今天就能使用，您有多大信心把它推荐给适合的目标用户？",
    hint: "0＝完全没有信心，10＝非常有信心。不是评价“您个人是否喜欢”。",
  },
  {
    name: "artDirection", number: "D1", type: "single", demoOnly: true,
    title: "当前全站提亮后的暖金美术方向应如何处理？",
    options: [
      ["keep", "保留并继续精修", "核心问题是细节与一致性，而非换风格"],
      ["lighter", "进一步清雅、素净与留白", "减少金光和厚重装饰"],
      ["time", "按晨昏与节气形成不同光影", "增加变化，但需评估制作成本"],
      ["usertest", "需要目标用户测试后再决定", "避免团队内部审美投票替代用户研究"],
    ],
  },
  {
    name: "techRoute", number: "D2", type: "single", demoOnly: true,
    title: "首版最合适的技术表现路线是什么？",
    options: [
      ["2d", "精修原画 + 2.5D 分层视差", "优先加载、稳定与成本"],
      ["hybrid", "2.5D 场景 + 局部 3D 法物", "仅在核心仪式增加三维触感"],
      ["3d", "全面实时 3D 漫游", "以更高成本换取自由视角"],
      ["adaptive", "按设备自适应", "高端机增强、普通机保留完整核心体验"],
      ["unknown", "需要性能与用户测试数据", "目前证据不足"],
    ],
  },
  {
    name: "foregroundRitual", number: "D3", type: "single", demoOnly: true,
    title: "殿内前景双手与人物表现应如何取舍？",
    options: [
      ["hands", "保留合十手与第一人称动作", "强化代入感，但继续改善真实感"],
      ["props", "减少人物，聚焦器具与佛像特写", "让用户注意力回到场景与仪式"],
      ["choice", "提供表现模式选择", "兼顾不同用户，但增加交互与制作成本"],
      ["remove", "默认不出现人物或手部", "保持画面克制与清净"],
    ],
  },
  {
    name: "ritualPace", number: "D4", type: "single", demoOnly: true,
    title: "首次敬香与回访时，仪式节奏应如何设计？",
    options: [
      ["guided", "首次完整引导，回访可快速完成", "兼顾学习成本与仪式感"],
      ["free", "始终自由单步操作", "用户想做什么就做什么"],
      ["full", "始终完整仪轨", "不希望体验变成快捷点击工具"],
      ["skip", "默认极简，主动选择完整仪式", "降低首次使用负担"],
    ],
  },
];

const DEMO_RATINGS = [
  ["visual", "视觉美感与光影"],
  ["immersion", "场景沉浸与代入"],
  ["interaction", "操作反馈与手感"],
  ["navigation", "入口清晰与找路效率"],
  ["content", "内容可读与文化可信度"],
  ["sound", "佛音、语音与声音控制"],
  ["performance", "加载速度与手机流畅度"],
  ["trust", "隐私、伦理与虚实边界表达"],
].map(([name, title], index) => ({
  name: `demo-${name}`, number: `D${index + 5}`, type: "scale", min: 1, max: 5, unknownLabel: "无法评价", demoOnly: true,
  title: `${title}：是否帮助目标用户自然完成体验？`,
  hint: "1＝明显阻碍，3＝一般，5＝明显加分；未体验可跳过。",
}));

const ARCHITECTURE_QUESTIONS = [
  {
    name: "homeEntry", number: "A1", type: "single",
    title: "首次打开产品时，主入口应优先服务什么任务？",
    options: [
      ["gate", "完整山门与朝山仪式", "先建立世界观与心理转换"],
      ["map", "世界地图总览", "让用户自主选择空间"],
      ["today", "今日静心与常用功课", "让回访用户尽快完成任务"],
      ["dual", "首次沉浸、回访直达", "两种状态使用不同首页逻辑"],
      ["unknown", "需要比较首次与回访数据"],
    ],
  },
  {
    name: "learningDepth", number: "A2", type: "single",
    title: "佛学学习首版应做到什么深度？",
    options: [
      ["intro", "场景化入门与短内容", "先懂眼前菩萨、殿堂与仪轨"],
      ["path", "系统课程与学习进度", "从入门到经典，形成持续路径"],
      ["classic", "经典原文与白话对照", "服务已有基础的深度学习者"],
      ["adaptive", "按基础与兴趣推荐", "体验更个人化，但内容成本更高"],
      ["unknown", "暂无法判断", "需要验证不同人群的学习意愿"],
    ],
  },
  {
    name: "contentSources", number: "A3", type: "multi", max: 2,
    title: "内容专业性与来源，最应建立哪两类保障？",
    options: [
      ["temple", "寺院或传统文化机构合作"],
      ["scholars", "佛学、艺术史与学术顾问审校"],
      ["canonical", "公开权威版本原文与逐条出处"],
      ["editors", "专业编辑、校对与版本更新流程"],
      ["creators", "邀请创作者并明确授权与审校"],
      ["unknown", "尚无可确认的资源"],
    ],
  },
  {
    name: "memorialStance", number: "A4", type: "single",
    title: "追思、极乐与模拟陪伴，首版应采用哪种边界？",
    options: [
      ["postpone", "首版暂缓，先做用户与伦理研究", "避免过早处理高敏感场景"],
      ["simple", "只做私密追思卡与单向清供", "不生成亲人回复，不使用人物形象"],
      ["imagery", "追思 + 克制的净土光影意象", "保留艺术慰藉，但明确非真实场景"],
      ["current", "保留现有 Demo 基本结构", "继续精修引导与隐私边界"],
      ["remove", "不适合本项目，建议不做"],
    ],
  },
  {
    name: "aiRole", number: "A5", type: "single",
    title: "AI 在产品中最适合承担什么角色？",
    options: [
      ["none", "首版不使用生成式 AI", "优先做好内容与仪式"],
      ["navigation", "仅做内容检索、导览与经文推荐", "回答限于已审核知识库"],
      ["reflection", "提供有出处的生活反思", "明确非真实法师，不替代专业帮助"],
      ["companion", "提供长期记忆的陪伴", "需承担更高隐私、依赖与内容风险"],
      ["unknown", "需要进一步评估价值与风险"],
    ],
  },
  {
    name: "socialModel", number: "A6", type: "single",
    title: "“同行同修”应采用哪种真实程度？",
    options: [
      ["solo", "纯单人体验", "不展示任何模拟他人"],
      ["virtual", "明确标注的艺术化虚拟同行", "只表现共同礼拜，不冒充真实在线"],
      ["light", "真实但轻量的莲灯与合十", "不开放公开聊天"],
      ["community", "真实账号、聊天与共修社区", "需要完整治理与隐私机制"],
      ["unknown", "需要验证孤独感或社交是否为真实需求"],
    ],
  },
  {
    name: "memorialAi", number: "A7", type: "single",
    title: "是否允许生成式 AI 模拟逝者语气、人格或与用户对话？",
    options: [
      ["never", "坚决不允许", "任何形式都不使用逝者人格模拟"],
      ["limited", "仅允许明确标注的艺术化寄语", "不得推断逝者想法，不使用声音或人格克隆"],
      ["research", "暂不能决定，需要伦理与专业评审", "首版先禁止"],
      ["allow", "可在充分授权和防护下探索", "需明确说明理由与边界"],
    ],
  },
  {
    name: "accessibility", number: "A8", type: "single",
    title: "适老化与无障碍在首版应占什么位置？",
    options: [
      ["p0", "P0：大字、高对比、减少动效与清晰语音"],
      ["basic", "基础无障碍必做，专门长辈模式后置"],
      ["later", "首版暂不专项投入，先验证核心人群"],
      ["unknown", "取决于目标用户年龄与能力研究"],
    ],
  },
];

const DETAIL_QUESTIONS = [
  {
    name: "nonNegotiables", number: "X1", type: "multi", max: 3,
    title: "以下体验细节，哪三项最不能妥协？",
    options: [
      ["accuracy", "造像、菩萨、经典与仪轨准确"],
      ["audio", "真实、优质且不自动播放的声音"],
      ["motion", "动效有助于专注，而非炫技"],
      ["simple", "减少弹窗、入口和打断"],
      ["speed", "普通手机加载与操作流畅"],
      ["large", "大字、高对比与易点按"],
      ["privacy", "私密内容默认不公开"],
      ["offline", "弱网或离线仍能完成核心功课"],
      ["reduced", "支持减少动态效果"],
      ["source", "学习内容有出处、作者与更新日期"],
    ],
  },
  {
    name: "contentLanguage", number: "X2", type: "single",
    title: "学习内容应优先采用哪种表达方式？",
    options: [
      ["both", "短原文 + 白话解释 + 场景应用"],
      ["plain", "以现代白话和故事为主"],
      ["classical", "保留经典原文与较完整注疏"],
      ["audio", "以音频、视频与动态导览为主"],
      ["unknown", "需要目标用户测试"],
    ],
  },
  {
    name: "updateCadence", number: "X3", type: "single",
    title: "首版内容更新，哪一种节奏最现实且有价值？",
    options: [
      ["stable", "少而精，先稳定核心内容"],
      ["weekly", "每周更新专题或法语"],
      ["seasonal", "按节气、佛诞与传统节点更新"],
      ["community", "专家与创作者持续供给"],
      ["unknown", "取决于内容团队与预算"],
    ],
  },
  {
    name: "removeFriction", number: "X4", type: "multi", max: 3,
    title: "当前类型产品中，哪些做法最容易让用户失去信任？",
    options: [
      ["fake", "虚拟人数、回复或场景冒充真实"],
      ["effect", "暗示开光、超度、治病或其他保证"],
      ["pressure", "充值逼单、功德排行与焦虑营销"],
      ["complex", "入口复杂、强制步骤和频繁弹窗"],
      ["wrong", "菩萨、道场、经文或仪轨错误"],
      ["clone", "AI 冒充逝者、师父或真实用户"],
      ["ads", "过度广告与商业化打断"],
      ["privacyRisk", "私密内容被公开或用于训练"],
    ],
  },
  {
    name: "detailWish", number: "X5", type: "text",
    title: "如果首版只能把一个细节做到行业级优秀，您选什么？",
    placeholder: "例：拨珠手感、真实佛音、入门学习路径、追思隐私、首屏加载……",
  },
];

const MVP_OPTIONS = MODULES.map(([value, label, description]) => [value, label, description]);
const MVP_QUESTIONS = [
  {
    name: "mustHave", number: "M1", type: "multi", max: 3, required: true,
    title: "如果首版只能保留三个模块，您会保留哪三个？",
    hint: "这是强制取舍题。请以用户任务为依据，不代表其他模块永久取消。",
    options: MVP_OPTIONS,
  },
  {
    name: "notFirst", number: "M2", type: "text",
    title: "哪些内容即使很喜欢，也应明确排除在首版之外？",
    placeholder: "请尽量写清原因，例如：自由 3D——当前价值证据不足且会拖慢核心体验",
  },
  {
    name: "northStar", number: "M3", type: "single", required: true,
    title: "首版最应观察的单一结果指标是什么？",
    hint: "访问量只是活动量，不应自动等同于产品价值。",
    options: [
      ["retention", "目标用户在 4 周后仍主动回来完成核心任务"],
      ["completion", "新用户能独立完成首次朝礼或学习任务"],
      ["learning", "用户持续完成学习并理解关键内容"],
      ["peace", "用户自述压力或情绪得到可测量改善", "需要谨慎设计自我报告与专业边界"],
      ["revenue", "真实付费或机构合作验证", "不得以诱导性收入作为成功"],
      ["quality", "专家内容审校与核心体验质量达标"],
      ["unknown", "暂无法确定", "需要先明确首要用户价值"],
    ],
  },
  {
    name: "validationPlan", number: "M4", type: "multi", max: 3, required: true,
    title: "正式投入完整开发前，最应优先完成哪些验证？",
    options: [
      ["interviews", "6–10 位目标用户的行为访谈"],
      ["usability", "可交互原型的任务测试", "观察用户能否独立完成核心任务"],
      ["landing", "价值主张与入口页测试", "验证不同表达是否吸引正确人群"],
      ["pricing", "价格接受度与合作访谈", "不进行虚假收费或预售"],
      ["expert", "佛学、文化与心理伦理评审"],
      ["technical", "普通手机性能与技术 PoC"],
      ["retention", "小范围 2–4 周留存研究"],
      ["audit", "隐私、版权与商业合规审查"],
    ],
  },
  {
    name: "evidenceGap", number: "M5", type: "text",
    title: "目前团队最缺乏、却又最可能改变立项判断的一项证据是什么？",
    placeholder: "请写成一个可验证问题，而不是“再多了解用户”。",
  },
];

const DECISION_QUESTIONS = [
  {
    name: "riskConcern", number: "R1", type: "multi", max: 3, required: true,
    title: "您最担心的三类项目风险是什么？",
    options: [
      ["need", "没有足够强的真实需求"],
      ["culture", "文化、宗教或仪轨表达错误"],
      ["memorial", "追思、AI 陪伴与心理依赖"],
      ["privacy", "隐私、照片与敏感数据"],
      ["business", "商业化损害信任或无法持续"],
      ["minor", "未成年人保护与消费边界"],
      ["content", "内容版权、AI 错误或专家资源不足"],
      ["cost", "技术、美术与运营成本失控"],
      ["access", "目标用户不会用或不愿用"],
      ["platform", "平台、账号与数据持续性"],
    ],
  },
  {
    name: "reviewDecision", number: "R2", type: "single", required: true,
    title: "基于当前信息，您的立项判断是什么？",
    options: [
      ["approve", "同意进入完整产品与研发阶段", "方向和主要边界已足够清晰"],
      ["conditional", "有条件同意", "完成指定验证、删减或合规整改后推进"],
      ["hold", "暂缓完整立项，先做发现与验证", "当前证据不足以支持较大投入"],
      ["reject", "不同意当前方向", "需要重做定位、核心用户或产品组合"],
      ["abstain", "暂不表态", "需要补充资料或超出本人决策范围"],
    ],
  },
  {
    name: "champion", number: "R3", type: "single", required: true,
    title: "您个人愿意以何种方式支持下一步？",
    options: [
      ["sponsor", "愿意作为项目发起人或持续责任人"],
      ["support", "愿意提供明确资源或专业支持"],
      ["review", "愿意参加下一次评审"],
      ["neutral", "保持观察，暂不承诺资源"],
      ["oppose", "不赞成继续投入"],
      ["notrole", "这不是我的角色范围"],
    ],
  },
  {
    name: "nextStep", number: "R4", type: "single", required: true,
    title: "下一步最合理的动作是什么？",
    options: [
      ["discovery", "先做目标用户研究与需求验证"],
      ["content", "先做佛学内容与伦理专业评审"],
      ["prototype", "先做可交互原型和可用性测试"],
      ["technical", "先做手机性能与关键技术验证"],
      ["mvp", "范围与证据已足够，直接进入 MVP 排期"],
      ["stop", "暂停项目，释放资源"],
    ],
  },
];

const QUESTION_GROUPS = [
  ...STRATEGY_QUESTIONS, ...SCOPE_QUESTIONS, ...BUSINESS_QUESTIONS,
  ...DEMO_QUESTIONS, ...DEMO_RATINGS, ...ARCHITECTURE_QUESTIONS,
  ...DETAIL_QUESTIONS, ...MVP_QUESTIONS, ...DECISION_QUESTIONS,
];
const QUESTION_MAP = new Map(QUESTION_GROUPS.map((question) => [question.name, question]));

const BEHAVIOR_PHASES = [
  ["一、行前准备与入山", [["1.1", "选定道场与寺院", "选择四大名山或某座特色古刹"], ["1.2", "看佛历与节气吉日", "查看初一十五、佛诞、清明中元与二十四节气"], ["1.3", "行前净心与仪容准备", "调整心念、选择素雅衣着、手持念珠或香客号"], ["1.4", "登山朝山（上山路）", "沿石阶拾级而上，看山雾、古松、石刻"], ["1.5", "过山门（入清净界）", "推开门、绕三门不踩门槛，感受尘世切换"], ["1.6", "净手洗心", "掬水净手，象征洗去尘劳、收摄身心"]]],
  ["二、礼佛与敬香", [["2.1", "请香", "在请香处请三支清香或选择不同香品"], ["2.2", "点香与上香", "烛火引燃、举香过眉默念、三拜后插入香炉"], ["2.3", "逐殿巡礼拜佛", "依次巡礼天王殿、大雄宝殿与菩萨殿堂"], ["2.4", "礼拜佛菩萨（合十跪拜）", "合掌问讯、俯身顶礼三拜，表达恭敬谦卑"], ["2.5", "供灯（长明灯 / 莲花灯）", "点亮心灯，象征破暗生明、祈愿光明"], ["2.6", "供花 / 供果 / 供水 / 供茶", "敬献清净白莲、净果、清水或清茶"], ["2.7", "绕佛 / 绕塔", "顺时针右绕佛像或古塔三圈，默念佛号"], ["2.8", "瞻仰佛像与殿堂法相", "静观主尊法相、背光、法器与殿堂光影"]]],
  ["三、祈愿、求签与解惑", [["3.1", "佛前祈福许愿", "为自己与家人祈愿平安、健康、学业与事业"], ["3.2", "写祈福牌 / 挂红丝带", "将心愿写在木质愿牌或红丝带并悬挂"], ["3.3", "求签 / 抽法语签", "摇签筒求签，或每日抽一句安心法语"], ["3.4", "解签与问惑", "带着生活困惑请教师父、智者或 AI"], ["3.5", "立延生消灾祈福牌位", "为在世亲人长辈设立数字祈福牌位"], ["3.6", "还愿", "心愿达成或心境平复后，重回道场感恩"]]],
  ["四、修行与静心", [["4.1", "拨佛珠念佛", "逐粒拨动念珠，持诵佛号并记录功课遍数"], ["4.2", "敲木鱼", "跟随沉稳节奏敲击木鱼，收摄散乱心念"], ["4.3", "抄经", "净手焚香，一笔一画临摹经典"], ["4.4", "禅修 / 打坐 / 冥想", "跟随呼吸引导与钟磬佛音静坐冥想"], ["4.5", "诵经 / 听经", "聆听高品质经文唱诵或对照经卷跟读"], ["4.6", "参加早晚课共修", "定时随众参加早课晚课，体验梵呗唱诵"], ["4.7", "叩钟（撞钟祈福）", "撞响古钟，感受浑厚悠远的钟声"], ["4.8", "发愿与回向", "将清净心意回向亲友及一切众生"]]],
  ["五、追思、缅怀与生死关怀", [["5.1", "追思堂清供祭拜", "为已故亲人献白莲、清香、心灯、净水净果"], ["5.2", "立往生追思莲位", "写下故人称谓与追思卡片，随时探望"], ["5.3", "给故人写信 / 寄语", "单向倾诉思念，不冒充逝者回复"], ["5.4", "净土意象观想（极乐胜境）", "在庄严温和的艺术意象中祝祷与安放思念"], ["5.5", "为故人诵经抄经回向", "通过抄经或念佛，将心意回向给亲人"]]],
  ["六、游历、赏景与文化探索", [["6.1", "赏建筑、匾额与楹联", "品读斗拱飞檐、匾额、对联与典故"], ["6.2", "佛像手印、法器与典故", "学习菩萨愿力、手印含义与法器象征"], ["6.3", "逛藏经阁 / 佛学图书馆", "检索权威校对的经典与白话解读"], ["6.4", "游后山园林、竹林亭台", "在竹林、古树和亭台间吹风散步"], ["6.5", "观游鱼 / 遇寺猫等生灵", "看锦鲤、银杏落叶，偶遇寺猫"], ["6.6", "集章打卡 / 通关文牒", "收集香印法印，生成朝山纪念卡"]]],
  ["七、斋饭、茶禅与清修生活", [["7.1", "吃斋饭 / 体验过堂", "体验素面或过堂仪轨，感悟惜福"], ["7.2", "喝禅茶 / 吃素点", "泡茶、配素饼，听雨看书或发呆"], ["7.3", "挂单 / 一日清修营", "按晨钟、早课、禅坐、过堂等作息体验清修"]]],
  ["八、随喜、布施与善行", [["8.1", "随喜功德（投功德箱）", "随喜修缮、印经、助学，需审慎评估合规边界"], ["8.2", "做寺院义工（发心护持）", "以扫落叶、擦莲灯、整理经书等数字行为表达"], ["8.3", "护生与日行一善记录", "记录吃素、善言鼓励、环保等现实善举"]]],
  ["九、法物流通与结缘带走", [["9.1", "请实物文创 / 法物纪念品", "佛珠手串、线香、祈福包、抄经本等"], ["9.2", "请虚拟法物 / 数字纪念物", "数字佛牌、专属念珠与节气纪念画作"], ["9.3", "免费结缘品带走", "电子经折、手机壁纸、法语书签等"]]],
  ["十、同修结缘与离寺回响", [["10.1", "偶遇同修 / 合十随喜", "以一盏莲灯感知同修，互相点亮祝福"], ["10.2", "同行禅院交流 / 共修讨论", "在受控空间交流心得、参与共修"], ["10.3", "离寺回望与带走一句话", "带走今日禅语与本次朝山足迹卡"], ["10.4", "个人朝山志 / 终身修行档案", "沉淀道场、清香、经典、愿文与年度回顾"], ["10.5", "日常微功课温和提醒", "将山中宁静延续到日常工作与生活"], ["10.6", "实体名山联动打卡", "提供真实道场文化导览与线下联动"]]],
];

const PRIORITIES = [["", "未评估"], ["P0", "P0 核心必做"], ["P1", "P1 建议保留"], ["P2", "P2 远期探索"], ["X", "X 坚决不做"]];
const MODES = [["", "未评估"], ["M1", "M1 沉浸仪式"], ["M2", "M2 轻量卡片"], ["M3", "M3 视听氛围"], ["M4", "M4 AI 交互"], ["M5", "M5 图文科普"], ["M6", "M6 轻社交"], ["M7", "M7 个人档案"], ["M8", "M8 实体文创"], ["M9", "M9 场景彩蛋"]];
const ROLE_LABELS = { owner: "老板 / 创始人 / 最终决策者", shareholder: "股东 / 投资方", business: "业务 / 运营 / 商业化", product: "产品 / 策划", design: "美术 / 视觉 / 音频", dev: "技术 / 研发", expert: "佛学 / 文化 / 合规顾问", seed: "种子用户 / 外部体验者" };
const DEMO_LABELS = { deep: "深度体验过多个场景与操作", light: "浏览过首页与部分场景", none: "尚未体验，仅了解概念" };
const DECISION_LABELS = { approve: "同意进入完整产品与研发阶段", conditional: "有条件同意", hold: "暂缓完整立项，先做发现与验证", reject: "不同意当前方向", abstain: "暂不表态" };

const form = document.getElementById("survey-form");
const submitButton = document.getElementById("submitButton");
const cloudStatus = document.getElementById("cloudStatus");
const resultModal = document.getElementById("resultModal");
let currentReportId = createReportId();
let lastResultJson = null;
let cloud = null;
let submitted = false;
let saveTimer = 0;
let toastTimer = 0;

function createReportId() {
  const now = new Date();
  const date = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (value) => (value % 36).toString(36)).join("").toUpperCase();
  return `CS-DIR-${date}-${suffix}`;
}

function optionMarkup(option) {
  return `<strong>${option[0]}. ${option[1]}</strong>${option[2] ? `<small>${option[2]}</small>` : ""}`;
}

function selectOptions(options) {
  return options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function renderQuestion(question, target) {
  const wrapper = document.createElement("div");
  wrapper.className = `q-box question-${question.type}`;
  wrapper.dataset.question = question.name;
  const typeLabel = question.type === "multi" ? `多选${question.max ? ` · 最多 ${question.max} 项` : ""}` : question.type === "scale" ? "量表" : question.type === "text" ? "开放题" : "单选";
  let field = "";
  if (question.type === "single" || question.type === "multi") {
    const options = question.options.map((option) => `<label class="opt-item"><input type="${question.type === "multi" ? "checkbox" : "radio"}" name="${question.name}" value="${option[0]}"><span>${optionMarkup(option)}</span></label>`).join("");
    field = `<div class="opt-list ${question.options.length > 5 ? "two-column-options" : ""}">${options}</div>`;
  } else if (question.type === "scale") {
    const values = Array.from({ length: question.max - question.min + 1 }, (_, index) => question.min + index);
    const options = values.map((value) => `<label class="scale-option"><input type="radio" name="${question.name}" value="${value}"><span>${value}</span></label>`).join("");
    const unknown = question.unknownLabel ? `<label class="scale-option scale-unknown"><input type="radio" name="${question.name}" value="unknown"><span>${question.unknownLabel}</span></label>` : "";
    field = `<div class="scale-options" aria-label="评分选项">${options}${unknown}</div><div class="scale-caption"><span>${question.min === 0 ? "没有信心" : "明显阻碍"}</span><span>${question.max === 10 ? "非常有信心" : "明显加分"}</span></div>`;
  } else {
    field = `<textarea id="${question.name}" name="${question.name}" rows="3" maxlength="1200" placeholder="${question.placeholder || "选填，请写下您的判断与依据"}"></textarea>`;
  }
  wrapper.innerHTML = `<div class="q-title">${question.number}. ${question.title}${question.required ? `<span class="req"> *</span>` : ""}<span class="q-type">${typeLabel}</span></div>${question.hint ? `<p class="q-hint">${question.hint}</p>` : ""}${field}`;
  target.appendChild(wrapper);
}

const TARGET_OPTIONS = [
  ["urban", "高压都市职场人", "以碎片静心、情绪安放与文化体验为主"],
  ["practitioner", "佛教信众 / 居士", "以日常功课、经典、仪轨与回向为主"],
  ["memorial", "生命关怀与追思人群", "以私密缅怀与情感表达为主"],
  ["culture", "传统文化与东方美学爱好者", "以建筑、造像、艺术和声景为主"],
  ["learner", "佛学与人文知识学习者", "以系统课程、经典与学习进度为主"],
  ["elder", "银发退休群体", "以大字、易操作、晨昏功课为主"],
  ["family", "家庭共同体验人群", "以代际共同文化和节点活动为主"],
];

function renderTargetRank() {
  const options = TARGET_OPTIONS;
  const selects = ["Primary", "Secondary"].map((level, index) => `<div class="form-group"><label for="target${level}">第 ${index + 1} 核心人群 <span class="req">*</span></label><select id="target${level}" name="target${level}"><option value="">请选择</option>${options.map((option) => `<option value="${option[0]}">${option[1]}</option>`).join("")}</select></div>`).join("");
  const details = options.map((option) => `<div class="persona-hint"><strong>${option[1]}</strong><span>${option[2]}</span></div>`).join("");
  document.getElementById("targetRank").insertAdjacentHTML("beforeend", `<div class="q-box" data-question="targetRank"><div class="q-title">S2. 首版最优先服务哪两类核心人群？<span class="req"> *</span><span class="q-type">排序</span></div><p class="q-hint">不要按“可能都喜欢”选择，而按首版最能服务、最容易触达、商业或使命价值最匹配的人群。</p><div class="rank-grid">${selects}</div><details class="persona-details"><summary>查看人群说明</summary>${details}</details></div>`);
}

function renderModules() {
  const target = document.getElementById("moduleReview");
  MODULES.forEach(([id, name, description]) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.dataset.module = id;
    card.innerHTML = `<div class="module-copy"><h3>${name}</h3><p>${description}</p></div><div class="module-field"><label for="module-${id}-value">用户价值</label><select id="module-${id}-value" name="module-${id}-value" data-module-id="${id}"><option value="">不确定</option>${[1, 2, 3, 4, 5].map((value) => `<option value="${value}">${value}${value === 1 ? " · 低" : value === 3 ? " · 中" : value === 5 ? " · 高" : ""}</option>`).join("")}</select></div><div class="module-field"><label for="module-${id}-priority">MVP 范围</label><select id="module-${id}-priority" name="module-${id}-priority" data-module-id="${id}"><option value="?">暂无法判断</option>${selectOptions(PRIORITIES.slice(1))}</select></div>`;
    target.appendChild(card);
  });
}

function renderBehaviors() {
  const target = document.getElementById("behaviorGroups");
  BEHAVIOR_PHASES.forEach(([phase, items], phaseIndex) => {
    const details = document.createElement("details");
    details.className = "behavior-phase";
    if (phaseIndex === 0) details.open = true;
    const rows = items.map(([id, name, desc]) => `<div class="behavior-row" data-behavior-row="${id}"><div><div class="behavior-name"><code>${id}</code>${name}</div><p class="behavior-desc">${desc}</p></div><div class="behavior-field"><label for="behavior-${id}-priority">决策优先级</label><select id="behavior-${id}-priority" name="behavior-${id}-priority" data-behavior-id="${id}">${selectOptions(PRIORITIES)}</select></div><div class="behavior-field"><label for="behavior-${id}-mode">线上表现形式</label><select id="behavior-${id}-mode" name="behavior-${id}-mode" data-behavior-id="${id}">${selectOptions(MODES)}</select></div><div class="behavior-field"><label for="behavior-${id}-note">具体想法 / 备注</label><input type="text" id="behavior-${id}-note" name="behavior-${id}-note" maxlength="200" placeholder="选填"></div></div>`).join("");
    details.innerHTML = `<summary><span>${phase}</span><span class="phase-count" data-phase-count="${phaseIndex}">0 / ${items.length} 已评估</span></summary><div class="behavior-list">${rows}</div>`;
    target.appendChild(details);
  });
}

function allBehaviors() {
  return BEHAVIOR_PHASES.flatMap(([phase, items]) => items.map(([id, name, desc]) => ({ phase, id, name, desc })));
}

function selectedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`), (input) => input.value);
}
function selectedValue(name) { return form.querySelector(`input[name="${name}"]:checked`)?.value || ""; }
function fieldValue(name) { return form.elements.namedItem(name)?.value?.trim() || ""; }
function labelFor(questionName, value) {
  if (questionName === "targetRank") return TARGET_OPTIONS.find((option) => option[0] === value)?.[1] || value || "";
  const question = QUESTION_MAP.get(questionName);
  return question?.options?.find((option) => option[0] === value)?.[1] || value || "";
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}
function focusField(element, message) {
  showToast(message, true);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => element?.focus(), 250);
}

function visibleRequiredQuestions() {
  return QUESTION_GROUPS.filter((question) => question.required && (!question.demoOnly || fieldValue("demoExp") !== "none"));
}
function updateConditional() {
  document.getElementById("section-experience").hidden = fieldValue("demoExp") === "none";
}
function updateProgress() {
  const required = visibleRequiredQuestions();
  const basicChecks = ["userName", "userRole", "decisionScope", "demoExp", "targetPrimary", "targetSecondary"].map((name) => Boolean(fieldValue(name)));
  const questionChecks = required.map((question) => question.type === "multi" ? selectedValues(question.name).length > 0 : question.type === "text" ? Boolean(fieldValue(question.name)) : Boolean(selectedValue(question.name)));
  const completed = [...basicChecks, ...questionChecks].filter(Boolean).length;
  document.getElementById("progressText").textContent = `核心题已完成 ${completed} / ${basicChecks.length + questionChecks.length} 项 · 行为深评 ${allBehaviors().filter((item) => fieldValue(`behavior-${item.id}-priority`)).length} / 54 项`;
  document.getElementById("progressBar").style.width = `${Math.round((completed / (basicChecks.length + questionChecks.length)) * 100)}%`;
  BEHAVIOR_PHASES.forEach(([, items], index) => {
    const count = items.filter(([id]) => Boolean(fieldValue(`behavior-${id}-priority`))).length;
    document.querySelector(`[data-phase-count="${index}"]`).textContent = `${count} / ${items.length} 已评估`;
  });
}

function draftFields() {
  const fields = {};
  for (const [name, value] of new FormData(form).entries()) {
    if (name === "surveyConsent") continue;
    if (!fields[name]) fields[name] = [];
    fields[name].push(value);
  }
  return fields;
}
function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ reportId: currentReportId, savedAt: new Date().toISOString(), fields: draftFields() }));
      document.getElementById("draftStatus").textContent = `草稿已保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    } catch (_) { document.getElementById("draftStatus").textContent = "当前浏览器无法保存草稿"; }
  }, 350);
}
function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!draft?.fields || !REPORT_PATTERN.test(draft.reportId || "")) return;
    currentReportId = draft.reportId;
    for (const element of Array.from(form.elements)) {
      if (!element.name || element.name === "surveyConsent") continue;
      const values = draft.fields[element.name];
      if (!values) continue;
      if (element.type === "radio" || element.type === "checkbox") element.checked = values.includes(element.value);
      else element.value = values[0] || "";
    }
    document.getElementById("draftStatus").textContent = "已恢复上次未提交草稿";
  } catch (_) { document.getElementById("draftStatus").textContent = "草稿不可用，可正常在线提交"; }
}

function collectQuestionAnswer(question) {
  if (question.type === "multi") {
    const values = selectedValues(question.name);
    return { values, labels: values.map((value) => labelFor(question.name, value)) };
  }
  if (question.type === "single") {
    const value = selectedValue(question.name);
    return { value, label: labelFor(question.name, value) };
  }
  if (question.type === "scale") return { value: selectedValue(question.name) };
  return { value: fieldValue(question.name) };
}

function collectFormData() {
  return {
    reportId: currentReportId,
    surveyId: SURVEY_ID,
    schemaVersion: "3.0",
    submittedAt: new Date().toISOString(),
    respondent: {
      name: fieldValue("userName"), role: fieldValue("userRole"), roleLabel: ROLE_LABELS[fieldValue("userRole")] || fieldValue("userRole"),
      decisionScope: fieldValue("decisionScope"), demoExperience: fieldValue("demoExp"),
      projectKnowledge: fieldValue("projectKnowledge"), department: fieldValue("department"),
    },
    targetUsers: {
      primary: fieldValue("targetPrimary"), secondary: fieldValue("targetSecondary"),
      primaryLabel: labelFor("targetRank", fieldValue("targetPrimary")) || fieldValue("targetPrimary"),
      secondaryLabel: labelFor("targetRank", fieldValue("targetSecondary")) || fieldValue("targetSecondary"),
    },
    questionAnswers: Object.fromEntries(QUESTION_GROUPS.map((question) => [question.name, collectQuestionAnswer(question)])),
    moduleReview: MODULES.map(([id, name]) => ({
      id, name,
      value: fieldValue(`module-${id}-value`) ? Number(fieldValue(`module-${id}-value`)) : null,
      priority: fieldValue(`module-${id}-priority`) || "?",
    })),
    demoOpen: { best: fieldValue("demoBest"), worst: fieldValue("demoWorst"), surprise: fieldValue("demoSurprise"), nonTarget: fieldValue("demoNonTarget") },
    behaviorReview: allBehaviors().map((item) => ({
      id: item.id, phase: item.phase, name: item.name,
      priority: fieldValue(`behavior-${item.id}-priority`) || "未评估",
      mode: fieldValue(`behavior-${item.id}-mode`) || "未评估",
      note: fieldValue(`behavior-${item.id}-note`),
    })),
    decision: {
      decision: selectedValue("reviewDecision"), decisionLabel: DECISION_LABELS[selectedValue("reviewDecision")] || "",
      champion: selectedValue("champion"), nextStep: selectedValue("nextStep"),
      managementNote: fieldValue("managementNote"), resourceApproval: fieldValue("resourceApproval"),
      projectSentence: fieldValue("projectSentence"), reviewer: fieldValue("reviewSignature"),
    },
  };
}

function validateForm() {
  for (const [name, label] of [["userName", "您的称呼"], ["userRole", "核心角色"], ["decisionScope", "意见的决策性质"], ["demoExp", "Demo 体验程度"]]) {
    if (!fieldValue(name)) { focusField(document.getElementById(name), `请先填写${label}`); return false; }
  }
  if (!fieldValue("targetPrimary") || !fieldValue("targetSecondary")) { focusField(document.getElementById("targetPrimary"), "请选择两类核心人群"); return false; }
  if (fieldValue("targetPrimary") === fieldValue("targetSecondary")) { focusField(document.getElementById("targetSecondary"), "两类核心人群不能相同"); return false; }
  for (const question of QUESTION_GROUPS.filter((item) => item.max && (!item.demoOnly || fieldValue("demoExp") !== "none"))) {
    if (selectedValues(question.name).length > question.max) { focusField(form.querySelector(`input[name="${question.name}"]`), `${question.number} 最多选择 ${question.max} 项`); return false; }
  }
  for (const question of visibleRequiredQuestions()) {
    const valid = question.type === "multi" ? selectedValues(question.name).length > 0 : question.type === "text" ? Boolean(fieldValue(question.name)) : Boolean(selectedValue(question.name));
    if (!valid) {
      const element = question.type === "scale" ? form.querySelector(`input[name="${question.name}"]`) : document.getElementById(question.name);
      focusField(element, `请完成必答题 ${question.number}；若没有依据，可选择暂不确定 / 无法判断`);
      return false;
    }
  }
  if (!document.getElementById("surveyConsent").checked) { focusField(document.getElementById("surveyConsent"), "请阅读并同意答卷提交与数据使用说明"); return false; }
  return true;
}

function answerText(data, name) {
  const answer = data.questionAnswers[name];
  if (answer?.labels?.length) return answer.labels.join("、");
  if (answer?.value && QUESTION_MAP.get(name)?.type === "single") return labelFor(name, answer.value);
  return answer?.value || "未填写";
}

function buildSummary(data) {
  const p0 = data.behaviorReview.filter((item) => item.priority === "P0").length;
  const x = data.behaviorReview.filter((item) => item.priority === "X").length;
  return [
    `【朝山产品方向与需求调研 · ${data.reportId}】`,
    `填写人：${data.respondent.name}（${data.respondent.roleLabel}）`,
    `Demo 体验：${DEMO_LABELS[data.respondent.demoExperience] || data.respondent.demoExperience}`,
    `首要结果：${answerText(data, "primaryOutcome")}`,
    `核心人群：${data.targetUsers.primaryLabel || "未选"} / ${data.targetUsers.secondaryLabel || "未选"}`,
    `优先验证需求：${answerText(data, "userNeed")}`,
    `MVP 三模块：${answerText(data, "mustHave")}`,
    `单一结果指标：${answerText(data, "northStar")}`,
    `行为深评：P0 ${p0} 项；坚决不做 ${x} 项`,
    `立项判断：${data.decision.decisionLabel || "未填写"}`,
    `项目方向一句话：${data.decision.projectSentence || "未填写"}`,
    `提交时间：${data.submittedAt}`,
  ].join("\n");
}

function friendlySubmitError(error) {
  const code = error?.code || error?.status || "";
  const message = String(error?.message || "");
  if (code === "23505") return "报告编号发生冲突，请刷新页面后重新提交。";
  if (code === "42501" || code === 401 || code === 403) return "云端拒绝了本次提交。请确认使用正式在线地址，并联系发起人检查访问权限。";
  if (code === "42P01") return "云端调研表尚未配置，请联系项目发起人处理。";
  if (/fetch|network|timeout|failed/i.test(message)) return "网络连接失败，答卷尚未提交。请检查网络后重试，草稿仍保留在本机。";
  return "云端提交未完成，请稍后重试。草稿仍保留在本机；持续失败请联系发起人。";
}

async function submitSurvey(event) {
  event.preventDefault();
  if (submitted || !validateForm()) return;
  if (!cloud) { cloudStatus.textContent = "云服务组件未加载"; cloudStatus.classList.add("is-error"); showToast("云服务组件未加载，答卷尚未提交，请刷新后重试。", true); return; }
  const data = collectFormData();
  submitButton.disabled = true;
  submitButton.textContent = "正在安全提交…";
  cloudStatus.classList.remove("is-error");
  cloudStatus.textContent = "正在写入云数据库";
  try {
    const { error } = await cloud.database.from("product_discovery_submissions").insert({
      report_id: data.reportId,
      respondent_name: data.respondent.name,
      respondent_role: data.respondent.role,
      decision_scope: data.respondent.decisionScope,
      demo_experience: DEMO_LABELS[data.respondent.demoExperience] || data.respondent.demoExperience,
      schema_version: "3.0",
      payload: data,
    });
    if (error) throw error;
    submitted = true;
    lastResultJson = data;
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* submission succeeded */ }
    document.getElementById("draftStatus").textContent = "答卷已提交至云端";
    cloudStatus.textContent = "已写入云数据库";
    submitButton.textContent = "已提交至云端";
    document.getElementById("finalReportId").textContent = data.reportId;
    document.getElementById("resultDataBox").textContent = buildSummary(data);
    resultModal.hidden = false;
    document.getElementById("closeModalButton").focus();
  } catch (error) {
    cloudStatus.textContent = "提交失败，草稿未丢失";
    cloudStatus.classList.add("is-error");
    submitButton.disabled = false;
    submitButton.textContent = "重新提交至云端";
    showToast(friendlySubmitError(error), true);
  }
}

async function copyText(text, successMessage) {
  try { await navigator.clipboard.writeText(text); showToast(successMessage); } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = text; textarea.style.position = "fixed"; textarea.style.opacity = "0";
    document.body.appendChild(textarea); textarea.select();
    const copied = document.execCommand("copy"); textarea.remove();
    showToast(copied ? successMessage : "复制失败，请手动选择文字复制", !copied);
  }
}
function copyReport() { copyText(document.getElementById("resultDataBox").textContent, "报告摘要已复制"); }
function copyInvite() {
  copyText(`各位好，这是一份朝山产品方向与真实需求调研，请独立填写，不必先讨论统一答案。\n${SHARE_URL}\n\n建议：先体验 Demo（未体验也可填写），核心题约 20–25 分钟，54 项寺院行为深评为选填。没有依据可选“暂不确定”。提交后请导出 JSON，并交回发起人汇总。请不要在答卷中填写证件、银行卡、逝者照片等敏感信息。`, "转发说明已复制");
}
function downloadJson() {
  if (!lastResultJson) return;
  const blob = new Blob([JSON.stringify(lastResultJson, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `${lastResultJson.reportId}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initializeCloud() {
  if (!window.WorkBuddyCloud?.createWorkBuddyCloud) { cloudStatus.textContent = "云服务组件加载失败"; cloudStatus.classList.add("is-error"); return; }
  cloud = window.WorkBuddyCloud.createWorkBuddyCloud(PUBLIC_CONFIG);
  cloudStatus.textContent = "云数据库已配置，提交时验证连接";
}

function initialize() {
  STRATEGY_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("strategyQuestions")));
  renderTargetRank();
  renderModules();
  SCOPE_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("scopeQuestions")));
  BUSINESS_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("businessQuestions")));
  [...DEMO_QUESTIONS, ...DEMO_RATINGS].forEach((question) => renderQuestion(question, document.getElementById("demoQuestions")));
  ARCHITECTURE_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("architectureQuestions")));
  renderBehaviors();
  DETAIL_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("detailQuestions")));
  MVP_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("mvpQuestions")));
  DECISION_QUESTIONS.forEach((question) => renderQuestion(question, document.getElementById("decisionQuestions")));
  restoreDraft();
  document.getElementById("reportIdDisplay").textContent = currentReportId;
  updateConditional(); updateProgress(); initializeCloud();

  form.addEventListener("submit", submitSurvey);
  form.addEventListener("input", () => { updateConditional(); updateProgress(); saveDraft(); });
  form.addEventListener("change", (event) => {
    const input = event.target;
    if (input.type === "checkbox") {
      const question = QUESTION_GROUPS.find((item) => item.name === input.name && item.max);
      if (question && selectedValues(question.name).length > question.max) { input.checked = false; showToast(`${question.number} 最多选择 ${question.max} 项`); }
    }
    updateConditional(); updateProgress(); saveDraft();
  });
  document.getElementById("toggleBehaviors").addEventListener("click", (event) => {
    const groups = Array.from(document.querySelectorAll(".behavior-phase"));
    const shouldOpen = groups.some((group) => !group.open);
    groups.forEach((group) => { group.open = shouldOpen; });
    event.currentTarget.textContent = shouldOpen ? "全部收起" : "全部展开";
  });
  document.getElementById("copyInviteButton").addEventListener("click", copyInvite);
  document.getElementById("copyReportButton").addEventListener("click", copyReport);
  document.getElementById("downloadButton").addEventListener("click", downloadJson);
  document.getElementById("closeModalButton").addEventListener("click", () => { resultModal.hidden = true; });
  resultModal.addEventListener("click", (event) => { if (event.target === resultModal) resultModal.hidden = true; });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !resultModal.hidden) resultModal.hidden = true; });
}

initialize();
