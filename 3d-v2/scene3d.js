import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/**
 * 见山 · 朝山 3D（电影级 4K 混合三维圣境）
 * - 彻底弃用低模塑料几何体佛像与圆锥小人
 * - 采用：4K 弧形立体浮雕主殿（带亮度深度位移）+ UnrealBloom 电影泛光 + 镜面青石地面倒影
 *   + 多层 3D 实拍流动云雾 + 真实写实古风香客 3D 空间角色 + 3D 体积光柱与发光莲灯
 */

const canvas = document.getElementById("scene3d-canvas");
const peerLabelsEl = document.getElementById("peer-labels");
const loaderEl = document.getElementById("s3d-loader");
const toastEl = document.getElementById("s3d-toast");
const bgm = document.getElementById("s3d-bgm");

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("is-show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("is-show"), 2600);
}

/* ===== 1. 渲染器 + UnrealBloom 电影后期泛光 ===== */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070d10);
scene.fog = new THREE.FogExp2(0x091114, 0.022);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 2.8, 13.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 6.2;
controls.maxDistance = 17.5;
controls.minAzimuthAngle = -Math.PI * 0.24;
controls.maxAzimuthAngle = Math.PI * 0.24;
controls.minPolarAngle = Math.PI * 0.34;
controls.maxPolarAngle = Math.PI * 0.51;
controls.target.set(0, 3.0, -5.0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.42, // strength: 柔和圣光泛光，不过曝
  0.75, // radius
  0.72  // threshold: 只让暖金高光、莲灯、粒子发光
);
composer.addPass(bloomPass);

/* ===== 2. 柔和电影照明 ===== */
scene.add(new THREE.AmbientLight(0xd9ccb2, 0.95));
const keyLight = new THREE.SpotLight(0xffe1a0, 58, 36, Math.PI * 0.45, 0.75, 1.3);
keyLight.position.set(0, 12, 8);
keyLight.target.position.set(0, 3.2, -9);
scene.add(keyLight, keyLight.target);

const texLoader = new THREE.TextureLoader();

/* ===== 3. 4K 弧形立体浮雕主殿（支持五座 4K 圣殿实时切换） ===== */
const HALLS = {
  gate:   { name: "大雄宝殿 · 释迦牟尼佛", en: "Mahāvīra Hall · Shakyamuni Buddha", url: "./assets/scene-hall-4k.jpg?v=20261125-v2-11" },
  putuo:  { name: "普陀山 · 观世音菩萨",   en: "Mt. Putuo · Guanyin Bodhisattva",   url: "./assets/scene-putuo-4k.jpg?v=20261125-v2-11" },
  wutai:  { name: "五台山 · 文殊菩萨",     en: "Mt. Wutai · Mañjuśrī Bodhisattva",  url: "./assets/scene-wutai-4k.jpg?v=20261125-v2-11" },
  emei:   { name: "峨眉山 · 普贤菩萨",     en: "Mt. Emei · Samantabhadra",          url: "./assets/scene-emei-4k.jpg?v=20261125-v2-11" },
  jiuhua: { name: "九华山 · 地藏王菩萨",   en: "Mt. Jiuhua · Kṣitigarbha",          url: "./assets/scene-jiuhua-4k.jpg?v=20261125-v2-11" },
};
let currentHallKey = "gate";

// 弧形 3D 环幕（内凹曲面 + 细分网格支持 3D 深度浮雕凹凸，营造强包裹立体纵深！）
const domeGeo = new THREE.CylinderGeometry(18, 18, 13.8, 72, 36, true, Math.PI * 0.66, Math.PI * 0.68);
domeGeo.scale(-1, 1, 1); // 内表面朝向镜头
const domeMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.58,
  metalness: 0.08,
  displacementScale: 0.65,
  displacementBias: -0.25,
  side: THREE.FrontSide,
});
const hallDome = new THREE.Mesh(domeGeo, domeMat);
hallDome.position.set(0, 5.4, 5.2);
scene.add(hallDome);

function loadHallTexture(key, onReady) {
  const info = HALLS[key] || HALLS.gate;
  currentHallKey = key;
  texLoader.load(info.url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    domeMat.map = tex;
    domeMat.displacementMap = tex; // 亮部主尊金身与烛光自然凸出立体浮雕感
    domeMat.needsUpdate = true;
    const sub = document.getElementById("s3d-hall-sub");
    if (sub) sub.textContent = isEn ? info.en : `${info.name} · 4K 三维共修空间`;
    if (onReady) onReady();
  });
}

/* ===== 4. 镜面微反光暗青玉青石地面（倒映 4K 金光与莲灯） ===== */
function makeReflectiveFloorTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#0e171a";
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; x += 128) {
      const v = 14 + Math.floor(Math.random() * 10);
      g.fillStyle = `rgb(${v},${v + 7},${v + 9})`;
      g.fillRect(x + ((y / 64) % 2) * 64 + 2, y + 2, 124, 60);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}

const floorMat = new THREE.MeshStandardMaterial({
  map: makeReflectiveFloorTexture(),
  roughness: 0.22,
  metalness: 0.62,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(24, 64), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// 地面柔和暖金倒影光晕
function makeRadialTex(c0, c1) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, c0);
  grad.addColorStop(0.45, c1);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const floorGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.MeshBasicMaterial({
    map: makeRadialTex("rgba(255,220,136,0.32)", "rgba(220,164,68,0.09)"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.set(0, 0.02, -3.2);
scene.add(floorGlow);

/* ===== 5. 多层 3D 空间实拍流动云雾 + 体积丁达尔光柱 + 320 颗金光浮尘 ===== */
const cloudTex = texLoader.load("./assets/vfx-cloud-wisp.jpg?v=20261125-v2-9");
cloudTex.colorSpace = THREE.SRGBColorSpace;

const mistPlanes = [];
[
  { z: -6.5, y: 1.4, w: 26, h: 7.5, op: 0.22, speed: 0.14 },
  { z: -1.5, y: 0.9, w: 22, h: 5.5, op: 0.18, speed: -0.11 },
  { z:  3.8, y: 0.6, w: 20, h: 4.8, op: 0.14, speed: 0.09 },
].forEach((cfg) => {
  const mat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: cfg.op,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.h), mat);
  mesh.position.set(0, cfg.y, cfg.z);
  scene.add(mesh);
  mistPlanes.push({ mesh, cfg });
});

// 4 束 3D 体积光柱
const rayMat = new THREE.MeshBasicMaterial({
  color: 0xffe4a0,
  transparent: true,
  opacity: 0.048,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
[-3.5, -1.2, 1.2, 3.5].forEach((rx, i) => {
  const ray = new THREE.Mesh(new THREE.ConeGeometry(2.4, 15, 16, 1, true), rayMat);
  ray.position.set(rx, 7.6, -5.8);
  ray.rotation.z = (i - 1.5) * 0.14;
  scene.add(ray);
});

// 320 颗柔和 3D 金光浮尘
const dustCount = 320;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 20;
  dustPos[i * 3 + 1] = 0.2 + Math.random() * 11;
  dustPos[i * 3 + 2] = -9 + Math.random() * 18;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dustTex = makeRadialTex("rgba(255,242,196,0.95)", "rgba(245,196,88,0.36)");
const dustPoints = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({ map: dustTex, size: 0.22, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
);
scene.add(dustPoints);

// 实时 3D 香烟粒子（敬香时加浓）
const smokeCount = 48;
const smokePos = new Float32Array(smokeCount * 3);
for (let i = 0; i < smokeCount; i++) {
  smokePos[i * 3] = (Math.random() - 0.5) * 0.7;
  smokePos[i * 3 + 1] = 0.6 + Math.random() * 6.5;
  smokePos[i * 3 + 2] = -2.2 + (Math.random() - 0.5) * 0.7;
}
const smokeGeo = new THREE.BufferGeometry();
smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
const smokeTex = makeRadialTex("rgba(238,232,218,0.42)", "rgba(208,218,216,0.12)");
const smokeMat = new THREE.PointsMaterial({ map: smokeTex, size: 1.1, transparent: true, opacity: 0.34, depthWrite: false });
const smokePoints = new THREE.Points(smokeGeo, smokeMat);
scene.add(smokePoints);

/* ===== 6. 核心升级：8 位真正写实的古风 3D 同修角色（告别塑料圆锥人！） ===== */
const peersGroup = new THREE.Group();
scene.add(peersGroup);

const avatarKeys = ["qing", "shao", "zhong", "lao"];
const avatarTextures = {};
const alphaMaskCanvas = document.createElement("canvas");
alphaMaskCanvas.width = 256; alphaMaskCanvas.height = 384;
const amg = alphaMaskCanvas.getContext("2d");
const amGrad = amg.createRadialGradient(128, 178, 36, 128, 186, 150);
amGrad.addColorStop(0, "#ffffff");
amGrad.addColorStop(0.68, "#ffffff");
amGrad.addColorStop(1, "#000000");
amg.fillStyle = amGrad;
amg.fillRect(0, 0, 256, 384);
const softPortraitAlpha = new THREE.CanvasTexture(alphaMaskCanvas);

avatarKeys.forEach((k) => {
  const t = texLoader.load(`./assets/avatar-${k}.webp?v=20261124-7`);
  t.colorSpace = THREE.SRGBColorSpace;
  avatarTextures[k] = t;
});

const PEER_CONFIGS = [
  { name: "清和",  wish: "愿父母岁岁安康",       avatar: "qing",  mode: "pray", x: -3.2, z: -2.4 },
  { name: "Maya",  wish: "Peace & Clarity",       avatar: "shao",  mode: "pray", x:  3.2, z: -2.4 },
  { name: "林安",  wish: "静坐共修 · 08:42",      avatar: "zhong", mode: "pray", x: -5.2, z:  0.6 },
  { name: "David", wish: "Mindful Breath",        avatar: "lao",   mode: "pray", x:  5.2, z:  0.6 },
  { name: "静远",  wish: "敬香一炷 · 祈福",       avatar: "lao",   mode: "pray", x: -2.0, z:  2.2 },
  { name: "Grace", wish: "Blessings for Family",  avatar: "qing",  mode: "pray", x:  2.0, z:  2.2 },
  { name: "慧心",  wish: "朝山行愿中",            avatar: "shao",  mode: "walk", x: -3.4, z:  5.8, dir: -1 },
  { name: "Alex",  wish: "Walking in Peace",      avatar: "zhong", mode: "walk", x:  3.4, z:  4.2, dir: -1 },
];

const peerEntities = [];
const lotusRingTex = makeRadialTex("rgba(255,228,150,0.75)", "rgba(232,178,74,0.22)");

function createPhotoreal3DPilgrim(cfg, isSelf = false) {
  const g = new THREE.Group();

  // 地面发光暖金莲环（真实倒映在青石地面上）
  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(isSelf ? 2.1 : 1.65, isSelf ? 2.1 : 1.65),
    new THREE.MeshBasicMaterial({
      map: lotusRingTex,
      transparent: true,
      opacity: isSelf ? 0.92 : 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.03;
  g.add(aura);

  // 真实写实古风香客 3D 精灵（带柔边羽化遮罩，自然融入殿内光影，绝无硬方框）
  const spriteMat = new THREE.SpriteMaterial({
    map: avatarTextures[cfg.avatar] || avatarTextures.qing,
    alphaMap: softPortraitAlpha,
    transparent: true,
    opacity: isSelf ? 0.96 : 0.86,
    color: isSelf ? 0xfff6df : 0xe9ddc4,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.55, 2.32, 1);
  sprite.position.y = 1.18;
  g.add(sprite);

  g.position.set(cfg.x, 0, cfg.z);
  peersGroup.add(g);

  // 实时 3D 投影姓名 + 心愿气泡
  const label = document.createElement("button");
  label.type = "button";
  label.className = `peer-tag ${isSelf ? "is-self" : ""}`;
  label.innerHTML = `<b>${cfg.name}</b><span>${cfg.wish}</span>`;
  label.addEventListener("click", () => {
    aura.material.opacity = 1.0;
    aura.scale.set(1.5, 1.5, 1);
    setTimeout(() => { aura.scale.set(1, 1, 1); aura.material.opacity = isSelf ? 0.92 : 0.52; }, 750);
    showToast(`已向同修「${cfg.name}」随喜共愿 · 莲光相应`);
  });
  peerLabelsEl.appendChild(label);

  const entity = { group: g, sprite, aura, label, cfg, phase: Math.random() * Math.PI * 2 };
  peerEntities.push(entity);
  return entity;
}

PEER_CONFIGS.forEach((c) => createPhotoreal3DPilgrim(c, false));

/* ===== 7. 殿前 3D 发光莲花心灯 ===== */
const lampsGroup = new THREE.Group();
scene.add(lampsGroup);
let lampCount = 0;

function spawnGlowing3DLamp() {
  const idx = lampCount++;
  const side = idx % 2 === 0 ? -1 : 1;
  const row = Math.floor(idx / 2);
  const lx = side * (1.2 + (row % 4) * 0.95);
  const lz = 3.2 - Math.floor(row / 4) * 1.1;

  const lamp = new THREE.Group();
  const baseGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({ map: lotusRingTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  baseGlow.rotation.x = -Math.PI / 2;
  baseGlow.position.y = 0.04;
  lamp.add(baseGlow);

  const flame = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: dustTex, color: 0xffe08a, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flame.scale.set(0.62, 0.78, 1);
  flame.position.y = 0.28;
  lamp.add(flame);

  const pt = new THREE.PointLight(0xffcb66, 4.5, 5.5, 1.8);
  pt.position.y = 0.35;
  lamp.add(pt);

  lamp.position.set(lx, 0, lz);
  lampsGroup.add(lamp);
  showToast(`已于殿前点亮第 ${lampCount} 盏三维莲花心灯`);
}

// 预置 4 盏初始殿前长明莲灯，开场即有温暖星火氛围
for (let i = 0; i < 4; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const lx = side * (1.6 + Math.floor(i / 2) * 2.2);
  const lz = -3.8 + Math.floor(i / 2) * 1.6;
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: 0xffd778, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.scale.set(0.55, 0.7, 1);
  flame.position.set(lx, 0.24, lz);
  lampsGroup.add(flame);
}

/* ===== 8. 按钮交互 ===== */
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
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4 - i * 0.6);
      o.connect(g).connect(bellCtx.destination);
      o.start(now); o.stop(now + 3.6);
    });
  } catch (_) {}
}

document.querySelectorAll("[data-hall]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.hall;
    document.querySelectorAll("[data-hall]").forEach((b) => b.classList.toggle("is-on", b.dataset.hall === key));
    playBell();
    loadHallTexture(key, () => showToast(`已步入 4K 三维圣殿 · ${HALLS[key].name}`));
  });
});

document.getElementById("btn-3d-incense")?.addEventListener("click", () => {
  playBell();
  smokeMat.opacity = 0.62;
  setTimeout(() => { smokeMat.opacity = 0.34; }, 4200);
  showToast("清香三炷已敬上 · 殿内香云袅袅供养");
});

document.getElementById("btn-3d-bow")?.addEventListener("click", () => {
  const bowEl = document.getElementById("s3d-bow-overlay");
  bowEl?.classList.add("is-show");
  setTimeout(() => bowEl?.classList.remove("is-show"), 2600);
  showToast("一心顶礼 · 愿心无散乱");
});

document.getElementById("btn-3d-lamp")?.addEventListener("click", spawnGlowing3DLamp);

const wishModal = document.getElementById("s3d-wish-modal");
document.getElementById("btn-3d-wish")?.addEventListener("click", () => wishModal?.classList.add("is-open"));
document.getElementById("btn-3d-wish-close")?.addEventListener("click", () => wishModal?.classList.remove("is-open"));
document.getElementById("btn-3d-wish-submit")?.addEventListener("click", () => {
  const name = (document.getElementById("s3d-wish-name")?.value || "清风").trim().slice(0, 8) || "清风";
  const text = (document.getElementById("s3d-wish-text")?.value || "愿家人平安顺遂").trim().slice(0, 36) || "愿家人平安顺遂";
  createPhotoreal3DPilgrim({ name, wish: text, avatar: "qing", mode: "pray", x: (Math.random() - 0.5) * 3.4, z: 0.6 + Math.random() * 1.4 }, true);
  const numEl = document.getElementById("s3d-peer-num");
  if (numEl) numEl.textContent = String(peerEntities.length);
  wishModal?.classList.remove("is-open");
  showToast(`你的香客形象与心愿「${text}」已入驻三维圣殿`);
});

const togglePeersBtn = document.getElementById("btn-toggle-peers");
togglePeersBtn?.addEventListener("click", () => {
  const hidden = document.body.classList.toggle("peers-hidden");
  peersGroup.visible = !hidden;
  togglePeersBtn.textContent = isEn ? (hidden ? "Show Peers" : "Hide Peers") : (hidden ? "显示同修" : "隐藏同修");
  togglePeersBtn.classList.toggle("is-on", hidden);
  showToast(hidden ? "已隐藏殿内同修 · 独享清净" : "已恢复殿内同修共修");
});

const audioBtn = document.getElementById("btn-s3d-audio");
audioBtn?.addEventListener("click", () => {
  if (!bgm) return;
  if (bgm.paused) {
    bgm.volume = 0.36;
    bgm.play().then(() => {
      audioBtn.textContent = isEn ? "Chant · On" : "清音 · 开";
      audioBtn.classList.add("is-on");
    }).catch(() => showToast("请再次点击开启清净梵呗"));
  } else {
    bgm.pause();
    audioBtn.textContent = isEn ? "Chant · Off" : "清音 · 关";
    audioBtn.classList.remove("is-on");
  }
});

let isEn = false;
document.getElementById("btn-s3d-lang")?.addEventListener("click", (e) => {
  isEn = !isEn;
  e.target.textContent = isEn ? "中文" : "EN";
  document.querySelector(".s3d-brand strong").textContent = isEn ? "Jianshan · Chaoshan 3D" : "见山 · 朝山 3D";
  document.getElementById("s3d-hall-sub").textContent = isEn ? HALLS[currentHallKey].en : `${HALLS[currentHallKey].name} · 4K 三维共修空间`;
  document.getElementById("s3d-hint").textContent = isEn
    ? "Drag to orbit 3D sanctuary · Pinch to zoom · Tap any pilgrim to share blessings"
    : "单指拖动环绕 3D 空间 · 双指推近瞻仰 4K 主尊 · 点击同修随喜共愿";
  const badge = document.getElementById("s3d-online-badge");
  if (badge) badge.innerHTML = isEn
    ? `<i></i><b id="s3d-peer-num">${peerEntities.length}</b> Pilgrims Inside`
    : `<i></i><b id="s3d-peer-num">${peerEntities.length}</b> 位同修正在殿内`;
  if (togglePeersBtn) togglePeersBtn.textContent = isEn ? (document.body.classList.contains("peers-hidden") ? "Show Peers" : "Hide Peers") : (document.body.classList.contains("peers-hidden") ? "显示同修" : "隐藏同修");
  if (audioBtn) audioBtn.textContent = isEn ? (bgm?.paused ? "Chant · Off" : "Chant · On") : (bgm?.paused ? "清音 · 关" : "清音 · 开");
  document.querySelector("#btn-3d-incense span").textContent = isEn ? "Offer Incense" : "敬香生烟";
  document.querySelector("#btn-3d-bow span").textContent = isEn ? "Bow in Prayer" : "第一人称礼拜";
  document.querySelector("#btn-3d-lamp span").textContent = isEn ? "Light Lotus Lamp" : "殿前供莲灯";
  document.querySelector("#btn-3d-wish span").textContent = isEn ? "Enter with Vow" : "发愿入殿";
});

/* ===== 9. 60fps 电影渲染循环 ===== */
const projVec = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  controls.update();

  // 多层 3D 实拍云雾在空间中缓缓横漂
  mistPlanes.forEach(({ mesh, cfg }) => {
    mesh.position.x = Math.sin(t * cfg.speed) * 2.2;
  });

  // 3D 香烟与金光浮尘上升
  const sArr = smokeGeo.attributes.position.array;
  for (let i = 0; i < smokeCount; i++) {
    sArr[i * 3 + 1] += dt * 0.55;
    sArr[i * 3] += Math.sin(t + i) * dt * 0.12;
    if (sArr[i * 3 + 1] > 7.2) {
      sArr[i * 3] = (Math.random() - 0.5) * 0.7;
      sArr[i * 3 + 1] = 0.6;
    }
  }
  smokeGeo.attributes.position.needsUpdate = true;

  const dArr = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dArr[i * 3 + 1] += dt * 0.22;
    if (dArr[i * 3 + 1] > 11.2) dArr[i * 3 + 1] = 0.25;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // 写实古风同修角色呼吸、沿香道缓步漫行 + 实时标签投影
  const w = window.innerWidth;
  const h = window.innerHeight;
  peerEntities.forEach((p) => {
    if (p.cfg.mode === "walk") {
      p.group.position.z += dt * 0.35 * p.cfg.dir;
      p.sprite.position.y = 1.18 + Math.abs(Math.sin(t * 3.4 + p.phase)) * 0.04;
      if (p.group.position.z < 1.2) p.cfg.dir = 1;
      if (p.group.position.z > 6.8) p.cfg.dir = -1;
    } else {
      p.sprite.position.y = 1.18 + Math.sin(t * 1.4 + p.phase) * 0.025;
    }

    if (peersGroup.visible) {
      projVec.set(p.group.position.x, p.group.position.y + 2.45, p.group.position.z);
      projVec.project(camera);
      if (projVec.z > -1 && projVec.z < 1) {
        const sx = Math.max(66, Math.min(w - 66, (projVec.x * 0.5 + 0.5) * w));
        const sy = Math.max(96, Math.min(h - 110, (-projVec.y * 0.5 + 0.5) * h));
        p.label.style.display = "inline-flex";
        p.label.style.left = `${sx.toFixed(1)}px`;
        p.label.style.top = `${sy.toFixed(1)}px`;
        p.label.style.zIndex = String(Math.round((1 - projVec.z) * 100));
      } else {
        p.label.style.display = "none";
      }
    }
  });

  composer.render();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

loadHallTexture("gate", () => {
  setTimeout(() => loaderEl?.classList.add("is-done"), 400);
});
animate();
