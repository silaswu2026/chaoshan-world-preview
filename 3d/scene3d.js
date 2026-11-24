import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * 见山 · 朝山 3D 分支版（真三维 WebGL 大雄宝殿 + 可见 3D 同修角色共修空间）
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

/* ===== 1. 场景、渲染器与大气雾 ===== */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1417);
scene.fog = new THREE.FogExp2(0x0d181c, 0.024);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(0, 5.2, 22.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.14;
controls.minDistance = 4.2;
controls.maxDistance = 30;
controls.target.set(0, 3.2, -4.5);

/* ===== 2. 电影级三点灯光体系 ===== */
scene.add(new THREE.HemisphereLight(0x52737c, 0x16120c, 0.85));

// 主尊暖金圣光聚光灯
const mainSpot = new THREE.SpotLight(0xffe19c, 95, 45, Math.PI * 0.34, 0.65, 1.4);
mainSpot.position.set(0, 14.5, 4.5);
mainSpot.target.position.set(0, 3.8, -8.5);
mainSpot.castShadow = true;
mainSpot.shadow.mapSize.set(1024, 1024);
scene.add(mainSpot, mainSpot.target);

// 主尊背后暖金背光点源
const haloLight = new THREE.PointLight(0xffcb66, 26, 22, 1.6);
haloLight.position.set(0, 4.8, -10.2);
scene.add(haloLight);

// 香炉暖橘炭火光
const censerLight = new THREE.PointLight(0xff8e3c, 9, 10, 1.8);
censerLight.position.set(0, 1.9, 1.8);
scene.add(censerLight);

/* ===== 3. 庄严大雄宝殿空间与青石香道 ===== */
// 程序化青石纹理
function makeStoneTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#1a2326";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 64) {
      const shade = 26 + Math.floor(Math.random() * 14);
      g.fillStyle = `rgb(${shade},${shade + 7},${shade + 9})`;
      g.fillRect(x + ((y / 32) % 2) * 32 + 1, y + 1, 62, 30);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}

const stoneMat = new THREE.MeshStandardMaterial({
  map: makeStoneTexture(),
  roughness: 0.72,
  metalness: 0.12,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), stoneMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 中轴汉白玉香道与三级高台
const marbleMat = new THREE.MeshStandardMaterial({ color: 0xc8c2b4, roughness: 0.58, metalness: 0.08 });
const walkway = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 24), marbleMat);
walkway.position.set(0, 0.07, 4);
walkway.receiveShadow = true;
scene.add(walkway);

// 大殿三级须弥石台
for (let i = 0; i < 3; i++) {
  const step = new THREE.Mesh(new THREE.BoxGeometry(16 - i * 1.4, 0.42, 11 - i * 1.1), marbleMat);
  step.position.set(0, 0.21 + i * 0.42, -8.5);
  step.receiveShadow = true;
  scene.add(step);
}

// 8 根朱红漆木巨柱 + 鎏金柱础
const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5c1916, roughness: 0.42, metalness: 0.15 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6bc62, roughness: 0.26, metalness: 0.84, emissive: 0x3b2606, emissiveIntensity: 0.32 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x1d1612, roughness: 0.65, metalness: 0.1 });

const pillarCoords = [
  [-6.4, -4.6], [-2.8, -4.6], [2.8, -4.6], [6.4, -4.6],
  [-6.4, -12.2], [-2.8, -12.2], [2.8, -12.2], [6.4, -12.2],
];
pillarCoords.forEach(([x, z]) => {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.45, 16), marbleMat);
  base.position.set(x, 1.45, z);
  scene.add(base);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 7.6, 20), pillarMat);
  col.position.set(x, 5.4, z);
  col.castShadow = true;
  scene.add(col);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 10, 24), goldMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, 8.6, z);
  scene.add(ring);
});

// 大殿重檐屋顶结构
const roofLower = new THREE.Mesh(new THREE.ConeGeometry(12.2, 3.0, 4), darkWoodMat);
roofLower.rotation.y = Math.PI / 4;
roofLower.position.set(0, 10.6, -8.4);
scene.add(roofLower);

const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(8.6, 2.4, 4), darkWoodMat);
roofUpper.rotation.y = Math.PI / 4;
roofUpper.position.set(0, 12.6, -8.4);
scene.add(roofUpper);

/* ===== 4. 巍峨鎏金主尊佛像 + 双层立体莲台 + 三层旋转曼陀罗背光 ===== */
const buddhaGroup = new THREE.Group();
buddhaGroup.position.set(0, 1.32, -8.8);
scene.add(buddhaGroup);

// 立体双层莲花宝座
const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.35, 0.85, 24), goldMat);
lotusBase.position.y = 0.42;
buddhaGroup.add(lotusBase);

for (let i = 0; i < 16; i++) {
  const angle = (i / 16) * Math.PI * 2;
  const petal = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 6), goldMat);
  petal.position.set(Math.cos(angle) * 1.85, 0.85, Math.sin(angle) * 1.85);
  petal.rotation.z = -Math.cos(angle) * 0.45;
  petal.rotation.x = Math.sin(angle) * 0.45;
  buddhaGroup.add(petal);
}

// 鎏金结跏趺坐主尊法相（庄严雕塑比例）
const legs = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.46, 16, 32), goldMat);
legs.rotation.x = Math.PI / 2;
legs.scale.set(1.12, 0.92, 0.82);
legs.position.y = 1.36;
buddhaGroup.add(legs);

const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.92, 1.95, 24), goldMat);
torso.position.y = 2.45;
torso.castShadow = true;
buddhaGroup.add(torso);

const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.86, 24, 16), goldMat);
shoulders.scale.set(1.22, 0.56, 0.72);
shoulders.position.y = 3.25;
buddhaGroup.add(shoulders);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 24), goldMat);
head.position.y = 4.05;
buddhaGroup.add(head);

const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), goldMat);
ushnisha.position.y = 4.62;
buddhaGroup.add(ushnisha);

// 三层动态金色背光曼陀罗
const haloRing1 = new THREE.Mesh(
  new THREE.RingGeometry(1.75, 1.95, 48),
  new THREE.MeshBasicMaterial({ color: 0xffe49c, side: THREE.DoubleSide, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
);
haloRing1.position.set(0, 3.65, -0.95);
buddhaGroup.add(haloRing1);

const haloRing2 = new THREE.Mesh(
  new THREE.RingGeometry(2.6, 2.74, 64),
  new THREE.MeshBasicMaterial({ color: 0xf4c35e, side: THREE.DoubleSide, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending })
);
haloRing2.position.set(0, 3.65, -1.05);
buddhaGroup.add(haloRing2);

const haloDisc = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 48),
  new THREE.MeshBasicMaterial({ color: 0xffd274, side: THREE.DoubleSide, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
);
haloDisc.position.set(0, 3.65, -1.12);
buddhaGroup.add(haloDisc);

// 4 束体积丁达尔光柱
const rayMat = new THREE.MeshBasicMaterial({
  color: 0xffe29c,
  transparent: true,
  opacity: 0.065,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
[-3.2, -1.1, 1.1, 3.2].forEach((rx, idx) => {
  const ray = new THREE.Mesh(new THREE.ConeGeometry(2.1, 16, 16, 1, true), rayMat);
  ray.position.set(rx, 8.2, -5.8 - idx * 0.4);
  ray.rotation.z = (idx - 1.5) * 0.12;
  scene.add(ray);
});

/* ===== 5. 香道两侧 8 盏发光石灯笼 ===== */
const lanternFlames = [];
[-3.4, 3.4].forEach((lx) => {
  [12, 7.5, 3, -1.5].forEach((lz) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.7, 10), marbleMat);
    post.position.set(lx, 0.85, lz);
    scene.add(post);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.34, 6), darkWoodMat);
    cap.position.set(lx, 2.15, lz);
    scene.add(cap);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd27a })
    );
    flame.position.set(lx, 1.82, lz);
    scene.add(flame);
    lanternFlames.push(flame);
  });
});

/* ===== 6. 殿前巨型古铜香炉 + 实时 3D 香烟 ===== */
const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x3b2b1a, roughness: 0.38, metalness: 0.78 });
const censerGroup = new THREE.Group();
censerGroup.position.set(0, 0, 1.8);
scene.add(censerGroup);

const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 0.88, 1.15, 24), bronzeMat);
censerBody.position.y = 1.05;
censerBody.castShadow = true;
censerGroup.add(censerBody);

const censerRim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 12, 32), goldMat);
censerRim.rotation.x = Math.PI / 2;
censerRim.position.y = 1.62;
censerGroup.add(censerRim);

for (let i = 0; i < 3; i++) {
  const a = (i / 3) * Math.PI * 2;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.65, 10), bronzeMat);
  leg.position.set(Math.cos(a) * 0.68, 0.32, Math.sin(a) * 0.68);
  censerGroup.add(leg);
}

// 炉中常驻香炷
const offeredSticksGroup = new THREE.Group();
censerGroup.add(offeredSticksGroup);
function addIncenseSticksToCenser(spread = 0.2) {
  [-0.14, 0, 0.14].forEach((offset) => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x7c542c }));
    stick.position.set(offset + (Math.random() - 0.5) * spread, 1.92, (Math.random() - 0.5) * spread);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff6e2b }));
    ember.position.y = 0.45;
    stick.add(ember);
    offeredSticksGroup.add(stick);
  });
}
addIncenseSticksToCenser(0.05);

// 柔和圆形光晕贴图（避免近景粒子呈方形）
function makeSoftCircleTexture(innerColor, outerColor) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.45, outerColor);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const smokeTex = makeSoftCircleTexture("rgba(240,234,218,0.55)", "rgba(220,224,220,0.18)");
const dustTex = makeSoftCircleTexture("rgba(255,238,184,0.95)", "rgba(244,196,92,0.35)");

// 3D 香烟粒子
const smokeGeo = new THREE.BufferGeometry();
const smokeCount = 55;
const smokePos = new Float32Array(smokeCount * 3);
for (let i = 0; i < smokeCount; i++) {
  smokePos[i * 3] = (Math.random() - 0.5) * 0.6;
  smokePos[i * 3 + 1] = 2.1 + Math.random() * 5.2;
  smokePos[i * 3 + 2] = 1.8 + (Math.random() - 0.5) * 0.6;
}
smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
const smokePoints = new THREE.Points(
  smokeGeo,
  new THREE.PointsMaterial({ map: smokeTex, size: 0.95, transparent: true, opacity: 0.42, depthWrite: false })
);
scene.add(smokePoints);

/* ===== 7. 260 颗 3D 空间金光浮尘 ===== */
const dustCount = 260;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 26;
  dustPos[i * 3 + 1] = 0.4 + Math.random() * 14;
  dustPos[i * 3 + 2] = -14 + Math.random() * 32;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({ map: dustTex, size: 0.24, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
);
scene.add(dustPoints);

/* ===== 8. 核心亮点：8 位可见的 3D 同修角色（礼拜 / 敬香 / 绕行 + 头顶实时标签） ===== */
const peersGroup = new THREE.Group();
scene.add(peersGroup);

const PEER_CONFIGS = [
  { name: "清和", wish: "愿父母岁岁安康", mode: "kneel", robe: 0x263d42, x: -3.1, z: -2.4, rotY: 0.2 },
  { name: "Maya", wish: "Peace & Clarity", mode: "kneel", robe: 0x4c3a2d, x: 3.1, z: -2.4, rotY: -0.2 },
  { name: "林安", wish: "静坐共修 08:42", mode: "sit", robe: 0x2a3b34, x: -4.8, z: 0.6, rotY: 0.4 },
  { name: "David", wish: "Mindful Breath", mode: "sit", robe: 0x3a3444, x: 4.8, z: 0.6, rotY: -0.4 },
  { name: "静远", wish: "敬香一炷 · 祈福", mode: "stand", robe: 0x5c2e28, x: -1.8, z: 3.3, rotY: 0.45 },
  { name: "Grace", wish: "Blessings for Family", mode: "stand", robe: 0x2f434a, x: 1.8, z: 3.3, rotY: -0.45 },
  { name: "慧心", wish: "朝山行愿中", mode: "walk", robe: 0x463a2a, x: -2.4, z: 9.2, rotY: Math.PI, dir: -1 },
  { name: "Alex", wish: "Walking in Peace", mode: "walk", robe: 0x2d3f44, x: 2.4, z: 6.4, rotY: Math.PI, dir: -1 },
];

const peerEntities = [];

function create3DPilgrim(cfg, isSelf = false) {
  const g = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: cfg.robe, roughness: 0.68, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2c3a4, roughness: 0.55 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0x7b5626, roughness: 0.72 });

  // 脚下暖金莲光环
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.62, 24),
    new THREE.MeshBasicMaterial({ color: isSelf ? 0xffe49c : 0xe4be6c, side: THREE.DoubleSide, transparent: true, opacity: isSelf ? 0.85 : 0.42, blending: THREE.AdditiveBlending })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.06;
  g.add(aura);

  const bodyWrap = new THREE.Group();
  g.add(bodyWrap);

  if (cfg.mode === "kneel" || cfg.mode === "sit") {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.14, 18), padMat);
    pad.position.y = 0.08;
    g.add(pad);

    const lower = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.78, 14), robeMat);
    lower.position.y = 0.52;
    lower.castShadow = true;
    bodyWrap.add(lower);

    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), skinMat);
    pHead.position.y = 1.06;
    bodyWrap.add(pHead);
  } else {
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.48, 14), robeMat);
    robe.position.y = 0.78;
    robe.castShadow = true;
    bodyWrap.add(robe);

    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), skinMat);
    pHead.position.y = 1.66;
    bodyWrap.add(pHead);
  }

  g.position.set(cfg.x, 0.12, cfg.z);
  g.rotation.y = cfg.rotY || 0;
  peersGroup.add(g);

  // DOM 实时投影标签
  const label = document.createElement("button");
  label.type = "button";
  label.className = `peer-tag ${isSelf ? "is-self" : ""}`;
  label.innerHTML = `<b>${cfg.name}</b><span>${cfg.wish}</span>`;
  label.addEventListener("click", () => {
    aura.material.opacity = 1.0;
    aura.scale.set(1.5, 1.5, 1);
    setTimeout(() => { aura.scale.set(1, 1, 1); aura.material.opacity = isSelf ? 0.85 : 0.42; }, 700);
    showToast(`已向同修「${cfg.name}」随喜共愿 · 莲光相应`);
  });
  peerLabelsEl.appendChild(label);

  const entity = { group: g, bodyWrap, aura, label, cfg, phase: Math.random() * Math.PI * 2 };
  peerEntities.push(entity);
  return entity;
}

PEER_CONFIGS.forEach((cfg) => create3DPilgrim(cfg, false));

/* ===== 9. 殿前 3D 供灯（用户点击「殿前供灯」时真实新增一盏发光莲灯） ===== */
const userLampsGroup = new THREE.Group();
scene.add(userLampsGroup);
let userLampCount = 0;

function spawn3DLamp() {
  const idx = userLampCount++;
  const side = idx % 2 === 0 ? -1 : 1;
  const row = Math.floor(idx / 2);
  const lx = side * (1.55 + (row % 3) * 0.72);
  const lz = 4.6 - Math.floor(row / 3) * 1.1;

  const lamp = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.24, 0.24, 16), goldMat);
  cup.position.y = 0.12;
  lamp.add(cup);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.65, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe296, side: THREE.DoubleSide, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  lamp.add(halo);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff0b2 }));
  flame.position.y = 0.38;
  lamp.add(flame);
  const pt = new THREE.PointLight(0xffcb66, 6.5, 7, 1.8);
  pt.position.y = 0.45;
  lamp.add(pt);

  lamp.position.set(lx, 0.14, lz);
  userLampsGroup.add(lamp);
  showToast(`已于大殿前点亮第 ${userLampCount} 盏三维莲花心灯`);
}

/* ===== 10. 电影机位平滑飞镜 ===== */
const CAM_PRESETS = {
  overview: { pos: new THREE.Vector3(0, 4.8, 14.5), target: new THREE.Vector3(0, 3.2, -6.5) },
  buddha:   { pos: new THREE.Vector3(0, 4.6, -2.4), target: new THREE.Vector3(0, 4.4, -8.8) },
  censer:   { pos: new THREE.Vector3(2.8, 2.8, 5.4), target: new THREE.Vector3(0, 1.8, 1.6) },
  cushion:  { pos: new THREE.Vector3(0, 1.9, 0.4), target: new THREE.Vector3(0, 4.0, -8.8) },
};
let flyGoal = { pos: CAM_PRESETS.overview.pos.clone(), target: CAM_PRESETS.overview.target.clone(), active: true };

function flyToCamera(key) {
  const p = CAM_PRESETS[key];
  if (!p) return;
  flyGoal = { pos: p.pos.clone(), target: p.target.clone(), active: true };
  document.querySelectorAll("[data-cam]").forEach((b) => b.classList.toggle("is-on", b.dataset.cam === key));
}

controls.addEventListener("start", () => { flyGoal.active = false; });

document.querySelectorAll("[data-cam]").forEach((btn) => {
  btn.addEventListener("click", () => flyToCamera(btn.dataset.cam));
});

/* ===== 11. 按钮交互（敬香 / 第一人称礼拜 / 供灯 / 发愿 / 同修开关 / 佛音 / 双语） ===== */
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

document.getElementById("btn-3d-incense")?.addEventListener("click", () => {
  playBell();
  flyToCamera("censer");
  addIncenseSticksToCenser(0.45);
  showToast("清香三炷已敬入三维青铜香炉 · 香云供养");
});

document.getElementById("btn-3d-bow")?.addEventListener("click", () => {
  flyToCamera("cushion");
  const bowEl = document.getElementById("s3d-bow-overlay");
  bowEl?.classList.add("is-show");
  setTimeout(() => bowEl?.classList.remove("is-show"), 2600);
  showToast("一心顶礼 · 愿心无散乱");
});

document.getElementById("btn-3d-lamp")?.addEventListener("click", () => {
  spawn3DLamp();
});

const wishModal = document.getElementById("s3d-wish-modal");
document.getElementById("btn-3d-wish")?.addEventListener("click", () => wishModal?.classList.add("is-open"));
document.getElementById("btn-3d-wish-close")?.addEventListener("click", () => wishModal?.classList.remove("is-open"));
document.getElementById("btn-3d-wish-submit")?.addEventListener("click", () => {
  const name = (document.getElementById("s3d-wish-name")?.value || "清风").trim().slice(0, 8) || "清风";
  const text = (document.getElementById("s3d-wish-text")?.value || "愿家人平安顺遂").trim().slice(0, 36) || "愿家人平安顺遂";
  create3DPilgrim({ name, wish: text, mode: "kneel", robe: 0x6a4b1f, x: (Math.random() - 0.5) * 3.2, z: -0.2 + Math.random() * 1.4, rotY: 0 }, true);
  const numEl = document.getElementById("s3d-peer-num");
  if (numEl) numEl.textContent = String(peerEntities.length);
  wishModal?.classList.remove("is-open");
  showToast(`你的 3D 行者与心愿「${text}」已入驻大雄宝殿`);
});

const togglePeersBtn = document.getElementById("btn-toggle-peers");
togglePeersBtn?.addEventListener("click", () => {
  const hidden = document.body.classList.toggle("peers-hidden");
  peersGroup.visible = !hidden;
  togglePeersBtn.textContent = hidden ? "显示同修" : "隐藏同修";
  togglePeersBtn.classList.toggle("is-on", hidden);
  showToast(hidden ? "已隐藏殿内同修 · 独享清净" : "已恢复殿内 3D 同修共修");
});

const audioBtn = document.getElementById("btn-s3d-audio");
audioBtn?.addEventListener("click", () => {
  if (!bgm) return;
  if (bgm.paused) {
    bgm.volume = 0.36;
    bgm.play().then(() => {
      audioBtn.textContent = "清音 · 开";
      audioBtn.classList.add("is-on");
    }).catch(() => showToast("请再次点击开启清净梵呗"));
  } else {
    bgm.pause();
    audioBtn.textContent = "清音 · 关";
    audioBtn.classList.remove("is-on");
  }
});

let isEn = false;
document.getElementById("btn-s3d-lang")?.addEventListener("click", (e) => {
  isEn = !isEn;
  e.target.textContent = isEn ? "中文" : "EN";
  document.querySelector(".s3d-brand strong").textContent = isEn ? "Jianshan · Chaoshan 3D" : "见山 · 朝山 3D";
  document.querySelector(".s3d-brand small").textContent = isEn ? "Mahāvīra Hall · Live 3D Sanctuary" : "大雄宝殿 · 真三维共修空间";
  document.getElementById("s3d-hint").textContent = isEn
    ? "Drag to orbit · Pinch to zoom · Tap any 3D pilgrim to share blessings"
    : "单指拖动环绕 · 双指缩放 · 点击殿内 3D 同修可随喜共愿";
  const badge = document.getElementById("s3d-online-badge");
  if (badge) badge.innerHTML = isEn
    ? `<i></i><b id="s3d-peer-num">${peerEntities.length}</b> 3D Pilgrims Inside`
    : `<i></i><b id="s3d-peer-num">${peerEntities.length}</b> 位 3D 同修正在殿内`;
  if (togglePeersBtn) {
    const hidden = document.body.classList.contains("peers-hidden");
    togglePeersBtn.textContent = isEn ? (hidden ? "Show Peers" : "Hide Peers") : (hidden ? "显示同修" : "隐藏同修");
  }
  if (audioBtn) {
    const on = !bgm?.paused;
    audioBtn.textContent = isEn ? (on ? "Chant · On" : "Chant · Off") : (on ? "清音 · 开" : "清音 · 关");
  }
  const camLabels = isEn
    ? { overview: "Overview", buddha: "Main Buddha", censer: "Censer", cushion: "Seated View" }
    : { overview: "全景漫游", buddha: "瞻仰主尊", censer: "香炉敬香", cushion: "蒲团静坐" };
  document.querySelectorAll("[data-cam]").forEach((b) => { if (camLabels[b.dataset.cam]) b.textContent = camLabels[b.dataset.cam]; });
  document.querySelector("#btn-3d-incense span").textContent = isEn ? "Offer Incense" : "敬香入炉";
  document.querySelector("#btn-3d-bow span").textContent = isEn ? "Bow in Prayer" : "第一人称礼拜";
  document.querySelector("#btn-3d-lamp span").textContent = isEn ? "Light a Lamp" : "殿前供灯";
  document.querySelector("#btn-3d-wish span").textContent = isEn ? "Make a Vow" : "发愿飘屏";
});

/* ===== 12. 60fps 主循环与 3D 标签投影 ===== */
const projVec = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 平滑飞镜
  if (flyGoal.active) {
    camera.position.lerp(flyGoal.pos, 0.045);
    controls.target.lerp(flyGoal.target, 0.045);
    if (camera.position.distanceTo(flyGoal.pos) < 0.08) flyGoal.active = false;
  }
  controls.update();

  // 主尊背光缓慢旋转与呼吸
  haloRing1.rotation.z = t * 0.14;
  haloRing2.rotation.z = -t * 0.09;
  haloLight.intensity = 24 + Math.sin(t * 1.4) * 4;
  censerLight.intensity = 8.5 + Math.sin(t * 3.2) * 1.6;

  // 石灯微焰
  lanternFlames.forEach((f, idx) => {
    const s = 0.9 + Math.sin(t * 4.2 + idx) * 0.12;
    f.scale.set(s, s * 1.15, s);
  });

  // 3D 香烟袅袅上升
  const sArr = smokeGeo.attributes.position.array;
  for (let i = 0; i < smokeCount; i++) {
    sArr[i * 3 + 1] += dt * 0.65;
    sArr[i * 3] += Math.sin(t + i) * dt * 0.12;
    if (sArr[i * 3 + 1] > 7.4) {
      sArr[i * 3] = (Math.random() - 0.5) * 0.55;
      sArr[i * 3 + 1] = 2.05;
      sArr[i * 3 + 2] = 1.8 + (Math.random() - 0.5) * 0.55;
    }
  }
  smokeGeo.attributes.position.needsUpdate = true;

  // 3D 金光浮尘上升
  const dArr = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dArr[i * 3 + 1] += dt * 0.24;
    if (dArr[i * 3 + 1] > 14.2) dArr[i * 3 + 1] = 0.5;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // 3D 同修角色呼吸、礼拜、缓慢绕行 + 实时投影标签
  const w = window.innerWidth;
  const h = window.innerHeight;
  peerEntities.forEach((p) => {
    if (p.cfg.mode === "kneel") {
      p.bodyWrap.rotation.x = Math.max(0, Math.sin(t * 0.7 + p.phase)) * 0.36;
    } else if (p.cfg.mode === "sit") {
      p.bodyWrap.scale.y = 1 + Math.sin(t * 1.3 + p.phase) * 0.025;
    } else if (p.cfg.mode === "walk") {
      p.group.position.z += dt * 0.48 * p.cfg.dir;
      p.bodyWrap.position.y = Math.abs(Math.sin(t * 3.8 + p.phase)) * 0.04;
      if (p.group.position.z < 3.6) { p.cfg.dir = 1; p.group.rotation.y = 0; }
      if (p.group.position.z > 13.0) { p.cfg.dir = -1; p.group.rotation.y = Math.PI; }
    }

    if (peersGroup.visible) {
      projVec.set(p.group.position.x, p.group.position.y + (p.cfg.mode === "walk" || p.cfg.mode === "stand" ? 2.15 : 1.5), p.group.position.z);
      projVec.project(camera);
      const visible = projVec.z > -1 && projVec.z < 1;
      if (visible) {
        const rawX = (projVec.x * 0.5 + 0.5) * w;
        const rawY = (-projVec.y * 0.5 + 0.5) * h;
        const sx = Math.max(66, Math.min(w - 66, rawX));
        const sy = Math.max(96, Math.min(h - 110, rawY));
        p.label.style.display = "inline-flex";
        p.label.style.left = `${sx.toFixed(1)}px`;
        p.label.style.top = `${sy.toFixed(1)}px`;
        p.label.style.zIndex = String(Math.round((1 - projVec.z) * 100));
      } else {
        p.label.style.display = "none";
      }
    }
  });

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
setTimeout(() => loaderEl?.classList.add("is-done"), 900);
