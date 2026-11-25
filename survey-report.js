"use strict";

const REPORT_QUESTIONS = [
  ["primaryOutcome", "12 个月首要价值", "single"], ["userNeed", "优先验证的真实需求", "multi"],
  ["moat", "可持续差异", "multi"], ["productArchitecture", "世界、学习与文化网关系", "single"],
  ["usageHabit", "首版使用节奏", "single"], ["businessModel", "商业模式验证方向", "single"],
  ["budget", "首期验证预算", "single"], ["mvpDuration", "首版可接受时间", "single"], ["teamSize", "首期团队配置", "single"],
  ["artDirection", "Demo 美术方向", "single"], ["techRoute", "技术表现路线", "single"],
  ["foregroundRitual", "前景人物与双手", "single"], ["ritualPace", "仪式节奏", "single"],
  ["homeEntry", "产品主入口", "single"], ["learningDepth", "佛学学习深度", "single"],
  ["memorialStance", "追思与极乐边界", "single"], ["aiRole", "AI 角色", "single"],
  ["socialModel", "同行真实程度", "single"], ["memorialAi", "逝者 AI 模拟边界", "single"],
  ["accessibility", "适老化优先级", "single"], ["contentLanguage", "学习内容表达", "single"],
  ["updateCadence", "内容更新节奏", "single"], ["mustHave", "首版只保留三个模块", "multi"],
  ["northStar", "单一结果指标", "single"], ["validationPlan", "优先验证计划", "multi"],
  ["riskConcern", "最担心的风险", "multi"], ["reviewDecision", "立项判断", "single"],
  ["champion", "个人支持方式", "single"], ["nextStep", "下一步动作", "single"],
];
const DEMO_RATING_LABELS = {
  "demo-visual": "视觉与光影", "demo-immersion": "沉浸与代入", "demo-interaction": "操作反馈", "demo-navigation": "入口与找路",
  "demo-content": "内容可读与可信度", "demo-sound": "声音", "demo-performance": "加载与流畅度", "demo-trust": "隐私与边界",
};
let records = [];
let currentAnalysis = null;
let toastTimer = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function answerFor(record, name) { return record.questionAnswers?.[name] || {}; }
function singleFor(record, name) { return answerFor(record, name).label || answerFor(record, name).value || ""; }
function numericAverage(values) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function countBy(items, getter) {
  const counts = new Map();
  items.forEach((item) => {
    const value = getter(item);
    if (!value) return;
    const key = String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts, ([label, count]) => ({ label, count, share: items.length ? count / items.length : 0 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}
function topFor(records, name) { return countBy(records, (record) => singleFor(record, name))[0] || null; }
function multiCounts(items, getName) {
  const counts = new Map();
  items.forEach((item) => {
    Array.from(new Set(getName(item) || [])).forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
  });
  return Array.from(counts, ([label, count]) => ({ label, count, share: items.length ? count / items.length : 0 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}

function analyzeSurveys(input, filters = {}) {
  const all = (Array.isArray(input) ? input : [input]).flatMap((item) => Array.isArray(item) ? item : [item]);
  const unique = new Map();
  all.filter((item) => item?.surveyId === "chaoshan-product-direction-needs-v3").forEach((item) => { if (item.reportId && !unique.has(item.reportId)) unique.set(item.reportId, item); });
  records = Array.from(unique.values());
  const filtered = records.filter((record) => (!filters.role || record.respondent?.role === filters.role) && (!filters.demo || record.respondent?.demoExperience === filters.demo));
  const decisions = countBy(filtered, (record) => record.decision?.decisionLabel || "未填写");
  const roles = countBy(filtered, (record) => record.respondent?.roleLabel || "未知角色");
  const moduleTemplate = filtered.find((record) => record.moduleReview?.length)?.moduleReview || [];
  const modules = moduleTemplate.map((template) => {
    const values = filtered.map((record) => record.moduleReview?.find((item) => item.id === template.id)).filter(Boolean);
    return {
      id: template.id, name: template.name,
      average: numericAverage(values.map((item) => item.value)),
      p0: values.filter((item) => item.priority === "P0").length,
      x: values.filter((item) => item.priority === "X").length,
      unknown: values.filter((item) => item.priority === "?").length,
    };
  });
  const behaviorTemplate = filtered.find((record) => record.behaviorReview?.length)?.behaviorReview || [];
  const behaviors = behaviorTemplate.map((template) => {
    const values = filtered.map((record) => record.behaviorReview?.find((item) => item.id === template.id)).filter(Boolean);
    return { id: template.id, name: template.name, p0: values.filter((item) => item.priority === "P0").length, x: values.filter((item) => item.priority === "X").length };
  });
  const distributions = REPORT_QUESTIONS.map(([name, title, type]) => ({
    name, title, type,
    rows: type === "multi" ? multiCounts(filtered, (record) => answerFor(record, name).labels || []) : countBy(filtered, (record) => singleFor(record, name)),
  })).filter((item) => item.rows.length);
  const demoOverall = numericAverage(filtered.map((record) => answerFor(record, "demoOverall").value).filter((value) => value !== "unknown"));
  const demoRatings = Object.entries(DEMO_RATING_LABELS).map(([name, title]) => ({
    name, title, average: numericAverage(filtered.map((record) => answerFor(record, name).value).filter((value) => value !== "unknown")),
  })).filter((item) => item.average !== null);
  const byRole = roles.map((role) => {
    const group = filtered.filter((record) => (record.respondent?.roleLabel || "未知角色") === role.label);
    return { role: role.label, count: group.length, outcome: topFor(group, "primaryOutcome"), must: multiCounts(group, (record) => answerFor(record, "mustHave").labels || [])[0], next: topFor(group, "nextStep") };
  });
  const openAnswers = [];
  filtered.forEach((record, index) => {
    const person = `填写人 ${index + 1} · ${record.respondent?.roleLabel || "未标注角色"}`;
    const add = (category, value) => { if (value?.trim()) openAnswers.push({ person, category, value: value.trim() }); };
    add("项目方向一句话", record.decision?.projectSentence);
    add("产品定位", answerFor(record, "positioningStatement").value);
    add("最需补充的证据", answerFor(record, "evidenceGap").value);
    add("商业伦理边界", answerFor(record, "commercialConcern").value);
    add("首版明确不做", answerFor(record, "notFirst").value);
    add("最应做到优秀的细节", answerFor(record, "detailWish").value);
    add("Demo 最值得保留", record.demoOpen?.best);
    add("Demo 最需推翻", record.demoOpen?.worst);
    add("给项目负责人的叮嘱", record.decision?.managementNote);
  });
  return {
    total: records.length, count: filtered.length, decisions, roles, byRole, modules, behaviors, distributions,
    demoOverall, demoRatings, openAnswers,
    highlights: {
      outcome: topFor(filtered, "primaryOutcome"), target: countBy(filtered, (record) => record.targetUsers?.primaryLabel)[0],
      must: multiCounts(filtered, (record) => answerFor(record, "mustHave").labels || [])[0],
      decision: decisions[0], next: topFor(filtered, "nextStep"),
    },
  };
}

function pct(value) { return `${Math.round(value * 100)}%`; }
function barRows(rows) {
  return rows.map((row) => `<div class="bar-row"><div class="bar-label">${escapeHtml(row.label)}</div><div>${row.count} · ${pct(row.share)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, row.share * 100)}%"></div></div></div>`).join("");
}
function render() {
  if (!records.length) { currentAnalysis = null; document.getElementById("reportEmpty").hidden = false; document.getElementById("reportContent").hidden = true; return; }
  const filters = { role: document.getElementById("roleFilter").value, demo: document.getElementById("demoFilter").value };
  currentAnalysis = analyzeSurveys(records, filters);
  const data = currentAnalysis;
  document.getElementById("reportEmpty").hidden = true;
  document.getElementById("reportContent").hidden = false;
  document.getElementById("reportSummary").innerHTML = [
    ["有效答卷", data.count, `已去除重复，共导入 ${data.total} 份`],
    ["角色视角", data.roles.length, "最终决策与执行意见分别保留"],
    ["首要结果倾向", data.highlights.outcome ? pct(data.highlights.outcome.share) : "—", data.highlights.outcome?.label || "尚未形成"],
    ["Demo 推荐信心", data.demoOverall === null ? "—" : data.demoOverall.toFixed(1), "0–10 分，仅统计有效评分者"],
  ].map(([label, value, note]) => `<div class="summary-item"><span>${label}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`).join("");

  const highlightRows = [
    ["12 个月首要结果", data.highlights.outcome], ["第一核心人群", data.highlights.target],
    ["最常入选的 MVP 模块", data.highlights.must], ["立项判断", data.highlights.decision], ["下一步动作", data.highlights.next],
  ];
  document.getElementById("consensusHighlights").innerHTML = `<div class="consensus-list">${highlightRows.map(([title, row]) => `<div class="consensus-item"><strong>${title}</strong><p>${escapeHtml(row?.label || "尚未填写")}</p><small>${row ? `${row.count} / ${data.count} · ${pct(row.share)}` : ""}</small></div>`).join("")}</div>`;

  document.getElementById("rolePerspectives").innerHTML = `<table><thead><tr><th>角色</th><th>人数</th><th>最集中首要结果</th><th>MVP 首选首项</th><th>下一步倾向</th></tr></thead><tbody>${data.byRole.map((row) => `<tr><td><strong>${escapeHtml(row.role)}</strong></td><td>${row.count}</td><td>${escapeHtml(row.outcome?.label || "—")}</td><td>${escapeHtml(row.must?.label || "—")}</td><td>${escapeHtml(row.next?.label || "—")}</td></tr>`).join("")}</tbody></table>`;
  document.getElementById("questionDistributions").innerHTML = `<div class="distribution-list">${data.distributions.map((item) => `<div class="distribution-card"><h3>${escapeHtml(item.title)}</h3>${barRows(item.rows)}</div>`).join("")}</div>`;
  document.getElementById("moduleConsensus").innerHTML = `<table><thead><tr><th>模块</th><th>用户价值均分</th><th>P0 首版</th><th>X 坚决不做</th><th>暂无法判断</th></tr></thead><tbody>${data.modules.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${item.average === null ? "—" : item.average.toFixed(2)}</td><td>${item.p0} / ${data.count}</td><td>${item.x} / ${data.count}</td><td>${item.unknown} / ${data.count}</td></tr>`).join("")}</tbody></table>`;
  document.getElementById("demoConsensus").innerHTML = `<div class="distribution-list"><div class="distribution-card"><h3>目标用户推荐信心（0–10）</h3><p class="demo-average">${data.demoOverall === null ? "暂无有效评分" : `均分 ${data.demoOverall.toFixed(2)}`}</p></div>${data.demoRatings.map((item) => `<div class="distribution-card"><h3>${escapeHtml(item.title)}</h3><div class="bar-row"><div class="bar-label">${item.average.toFixed(2)} / 5</div><div>${Math.round(item.average * 20)}%</div><div class="bar-track"><div class="bar-fill" style="width:${item.average * 20}%"></div></div></div></div>`).join("")}</div>`;
  const behaviorRows = (key) => data.behaviors.filter((item) => item[key] > 0).sort((a, b) => b[key] - a[key]).map((item) => ({ label: item.name, count: item[key], share: item[key] / data.count }));
  document.getElementById("behaviorConsensus").innerHTML = `<div class="distribution-list"><div class="distribution-card"><h3>P0 核心必做</h3>${behaviorRows("p0").length ? barRows(behaviorRows("p0")) : "<p>暂无 P0 选择</p>"}</div><div class="distribution-card"><h3>X 坚决不做</h3>${behaviorRows("x").length ? barRows(behaviorRows("x")) : "<p>暂无坚决不做选择</p>"}</div></div>`;

  const categories = Array.from(new Set(data.openAnswers.map((item) => item.category)));
  document.getElementById("openAnswers").innerHTML = categories.map((category) => `<h3 class="subsection-title">${escapeHtml(category)}</h3><div class="open-list">${data.openAnswers.filter((item) => item.category === category).map((item) => `<div class="open-card"><strong>${escapeHtml(item.person)}</strong><p>${escapeHtml(item.value)}</p></div>`).join("")}</div>`).join("");
}

function markdownReport(data) {
  const lines = ["# 朝山产品方向与需求调研报告", "", `> 本报告仅代表 ${data.count} 份核心人员答卷，不替代目标用户研究。开放意见已匿名处理。`, "", "## 一、当前样本方向", ""];
  [["12 个月首要结果", data.highlights.outcome], ["第一核心人群", data.highlights.target], ["最常入选的 MVP 模块", data.highlights.must], ["立项判断", data.highlights.decision], ["下一步动作", data.highlights.next]].forEach(([title, row]) => lines.push(`- **${title}**：${row?.label || "尚未填写"}${row ? `（${row.count}/${data.count}，${pct(row.share)}）` : ""}`));
  lines.push("", "## 二、角色差异", "", "| 角色 | 人数 | 首要结果 | MVP 首选首项 | 下一步 |", "|---|---:|---|---|---|");
  data.byRole.forEach((row) => lines.push(`| ${row.role} | ${row.count} | ${row.outcome?.label || "—"} | ${row.must?.label || "—"} | ${row.next?.label || "—"} |`));
  lines.push("", "## 三、选项分布", "");
  data.distributions.forEach((item) => { lines.push(`### ${item.title}`, ""); item.rows.forEach((row) => lines.push(`- ${row.label}：${row.count} / ${data.count}（${pct(row.share)}）`)); lines.push(""); });
  lines.push("## 四、产品模块", "", "| 模块 | 用户价值均分 | P0 | 坚决不做 | 暂无法判断 |", "|---|---:|---:|---:|---:|");
  data.modules.forEach((item) => lines.push(`| ${item.name} | ${item.average === null ? "—" : item.average.toFixed(2)} | ${item.p0} | ${item.x} | ${item.unknown} |`));
  lines.push("", "## 五、Demo 体验", "", `- 目标用户推荐信心均分：${data.demoOverall === null ? "无有效评分" : `${data.demoOverall.toFixed(2)} / 10`}`);
  data.demoRatings.forEach((item) => lines.push(`- ${item.title}：${item.average.toFixed(2)} / 5`));
  lines.push("", "## 六、匿名开放意见", "");
  data.openAnswers.forEach((item) => lines.push(`### ${item.category} · ${item.person}`, "", item.value, ""));
  lines.push("## 七、解读边界", "", "样本较少时只用于识别分歧，不形成市场结论。正式立项前仍需目标用户访谈、可用性测试、专业内容评审和技术验证。");
  return lines.join("\n");
}
function exportMarkdown() {
  if (!currentAnalysis) return;
  const blob = new Blob([markdownReport(currentAnalysis)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `朝山核心调研汇总-${currentAnalysis.count}人-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer); toast.textContent = message; toast.classList.toggle("is-error", isError); toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}
function updateRoleFilter() {
  const select = document.getElementById("roleFilter");
  const current = select.value;
  const roles = Array.from(new Set(records.map((record) => record.respondent?.role).filter(Boolean)));
  const labels = { owner: "老板 / 创始人 / 最终决策者", shareholder: "股东 / 投资方", business: "业务 / 运营 / 商业化", product: "产品 / 策划", design: "美术 / 视觉 / 音频", dev: "技术 / 研发", expert: "佛学 / 文化 / 合规顾问", seed: "种子用户 / 外部体验者" };
  select.innerHTML = '<option value="">全部角色</option>' + roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(labels[role] || role)}</option>`).join("");
  select.value = roles.includes(current) ? current : "";
}
async function loadFiles(files) {
  const invalid = [];
  const parsed = [];
  for (const file of Array.from(files || [])) {
    try { parsed.push(JSON.parse(await file.text())); } catch (_) { invalid.push(file.name); }
  }
  if (parsed.length) {
    const before = new Set(records.map((record) => record.reportId));
    parsed.filter((record) => record?.surveyId === "chaoshan-product-direction-needs-v3" && !before.has(record.reportId)).forEach((record) => records.push(record));
    updateRoleFilter(); render();
  }
  const status = document.getElementById("fileStatus");
  status.classList.toggle("is-error", invalid.length > 0);
  status.textContent = `已载入 ${records.length} 份有效答卷${invalid.length ? `；以下文件无法读取：${invalid.join("、")}` : ""}`;
  if (invalid.length) showToast("部分文件不是有效的调研 JSON，请确认是否从本问卷导出。", true);
}
function initializeReport() {
  const input = document.getElementById("surveyFiles");
  const drop = document.getElementById("fileDrop");
  input.addEventListener("change", () => loadFiles(input.files));
  ["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("dragover"); }));
  drop.addEventListener("drop", (event) => loadFiles(event.dataTransfer.files));
  document.getElementById("roleFilter").addEventListener("change", render);
  document.getElementById("demoFilter").addEventListener("change", render);
  document.getElementById("clearButton").addEventListener("click", () => { records = []; input.value = ""; document.getElementById("demoFilter").value = ""; updateRoleFilter(); render(); document.getElementById("fileStatus").textContent = "已清空，文件未上传"; });
  document.getElementById("exportButton").addEventListener("click", exportMarkdown);
  document.getElementById("printButton").addEventListener("click", () => window.print());
}
window.chaoshanSurveyReport = { analyzeSurveys, markdownReport, render };
initializeReport();
