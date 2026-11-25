(() => {
  "use strict";

  /**
   * 见山 · 朝山 路线 B：4K 电影原画 + WebGL GLSL 像素级深度图真 3D 视差引擎
   * - 采用多步视差迭代采样 (Relief Parallax Mapping) 结合空间透视深度场与主尊浮雕深度
   * - 100% 保留 4K 电影原画清晰度，实现前景石阶/梁柱与远景大殿/主尊的真实 3D 立体错位
   * - 桌面支持平滑阻尼鼠标 3D 视角；手机支持陀螺仪倾斜 (DeviceOrientation) 与触控轻滑
   */

  const VERT = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_texRes;
    uniform vec2 u_offset;   // 归一化 3D 视差偏移 (-1..1)
    uniform float u_mode;    // 0.0 = 山门纵深透视; 1.0 = 大殿主尊立体浮雕
    uniform float u_zoom;    // 轻微推进比例

    // 模拟 object-fit: cover 的精确 UV 映射
    vec2 coverUV(vec2 uv) {
      float canvasAspect = u_res.x / max(1.0, u_res.y);
      float texAspect = u_texRes.x / max(1.0, u_texRes.y);
      vec2 scale = vec2(1.0);
      if (canvasAspect > texAspect) {
        scale.y = texAspect / canvasAspect;
      } else {
        scale.x = canvasAspect / texAspect;
      }
      vec2 centered = (uv - 0.5) * scale / u_zoom + 0.5;
      return centered;
    }

    // 结合空间几何透视 + 画面明暗浮雕计算像素级 3D 深度 (0.0 = 极远, 1.0 = 近景前景)
    float computeDepth(vec2 uv, vec3 col) {
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float dx = abs(uv.x - 0.5) * 2.0; // 0 = 中轴, 1 = 左右边缘
      float dy = uv.y;                   // 0 = 顶部天空/殿顶, 1 = 底部石阶/香案

      if (u_mode < 0.5) {
        // 山门模式：左右古松/石栏(近) + 底部石阶(近) + 中轴远殿拱门(远) + 亮金主尊微浮雕
        float sideWalls = smoothstep(0.32, 0.95, dx) * 0.68;
        float groundSteps = smoothstep(0.56, 1.0, dy) * 0.62;
        float centerGateFar = (1.0 - smoothstep(0.0, 0.48, length(uv - vec2(0.5, 0.44)))) * 0.38;
        float relief = lum * 0.16;
        return clamp(0.24 + sideWalls + groundSteps - centerGateFar + relief, 0.0, 1.0);
      } else {
        // 大殿主尊模式：正中主尊菩萨像立体凸出 + 左右殿柱/前景香炉近景 + 背后光环与壁画远景
        float deityDist = length((uv - vec2(0.5, 0.42)) * vec2(1.45, 1.0));
        float deitySculpt = (1.0 - smoothstep(0.14, 0.54, deityDist)) * (0.48 + lum * 0.36);
        float frontAltar = smoothstep(0.68, 1.0, dy) * 0.52;
        float sidePillars = smoothstep(0.55, 0.98, dx) * 0.42;
        return clamp(0.14 + max(deitySculpt, max(frontAltar, sidePillars)), 0.0, 1.0);
      }
    }

    void main() {
      vec2 baseUV = coverUV(v_uv);
      // 6 步迭代视差浮雕映射 (Iterative Relief Parallax)，产生真实的前后景立体错位
      vec2 parallaxStrength = u_offset * vec2(0.036, 0.022);
      vec2 sampleUV = baseUV;
      float d = 0.5;
      for (int i = 0; i < 6; i++) {
        vec3 probe = texture2D(u_tex, clamp(sampleUV, 0.002, 0.998)).rgb;
        d = computeDepth(v_uv, probe);
        // 近景 (d -> 1) 顺镜头反方向大幅位移，远景 (d -> 0) 几乎不动
        sampleUV = baseUV - parallaxStrength * (d - 0.36);
      }
      vec3 finalCol = texture2D(u_tex, clamp(sampleUV, 0.002, 0.998)).rgb;

      // 轻微电影级立体受光高光（随视角微动，增强真 3D 质感）
      float rim = (d - 0.4) * (u_offset.x * 0.035 - u_offset.y * 0.025);
      finalCol += vec3(0.95, 0.84, 0.58) * max(0.0, rim);
      gl_FragColor = vec4(finalCol, 1.0);
    }
  `;

  function createDepthRenderer(container, mode) {
    const canvas = document.createElement("canvas");
    canvas.className = "v2-depth3d-canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.insertBefore(canvas, container.firstChild);

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) {
      canvas.remove();
      return null;
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); return null; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return null; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTexRes = gl.getUniformLocation(prog, "u_texRes");
    const uOffset = gl.getUniformLocation(prog, "u_offset");
    const uMode = gl.getUniformLocation(prog, "u_mode");
    const uZoom = gl.getUniformLocation(prog, "u_zoom");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let texW = 1920;
    let texH = 1080;
    let ready = false;
    let currentUrl = "";

    function loadImage(url) {
      if (!url || url === currentUrl) return;
      currentUrl = url;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        texW = img.naturalWidth || 1920;
        texH = img.naturalHeight || 1080;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        ready = true;
        canvas.classList.add("is-ready");
      };
      img.src = url;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.round(container.clientWidth * dpr));
      const h = Math.max(480, Math.round(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function draw(ox, oy, zoom) {
      if (!ready) return;
      resize();
      gl.useProgram(prog);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uTexRes, texW, texH);
      gl.uniform2f(uOffset, ox, oy);
      gl.uniform1f(uMode, mode);
      gl.uniform1f(uZoom, zoom);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { loadImage, draw, canvas };
  }

  /* ===== 1. 挂载到首页 4K 山门 & 五座 4K 大殿 ===== */
  const landing = document.querySelector("#screen-landing");
  const landingAtmo = landing?.querySelector(".hero-atmosphere");
  const temple = document.querySelector("#screen-temple");
  const templeScene = document.querySelector("#temple-scene");

  const gateRenderer = landingAtmo ? createDepthRenderer(landingAtmo, 0.0) : null;
  const hallRenderer = templeScene ? createDepthRenderer(templeScene, 1.0) : null;

  function syncGateTexture() {
    if (!gateRenderer || !landing) return;
    const isPortrait = window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
    const theme = landing.dataset.gateTheme || "cinema";
    const url = theme === "classic"
      ? "./assets/scene-gate-4k-classic.jpg?v=20261125-v2-20"
      : isPortrait
        ? "./assets/scene-gate-4k-cinema-mobile.jpg?v=20261125-v2-20"
        : "./assets/scene-gate-4k-cinema.jpg?v=20261125-v2-20";
    gateRenderer.loadImage(url);
  }

  function syncHallTexture() {
    if (!hallRenderer || !templeScene) return;
    const m = templeScene.dataset.mountain || "gate";
    const map = {
      gate:   "./assets/scene-hall-4k.jpg?v=20261125-v2-20",
      putuo:  "./assets/scene-putuo-4k.jpg?v=20261125-v2-20",
      wutai:  "./assets/scene-wutai-4k.jpg?v=20261125-v2-20",
      emei:   "./assets/scene-emei-4k.jpg?v=20261125-v2-20",
      jiuhua: "./assets/scene-jiuhua-4k.jpg?v=20261125-v2-20",
    };
    hallRenderer.loadImage(map[m] || map.gate);
  }

  if (landing) {
    new MutationObserver(syncGateTexture).observe(landing, { attributes: true, attributeFilter: ["data-gate-theme"] });
    syncGateTexture();
  }
  if (templeScene) {
    new MutationObserver(syncHallTexture).observe(templeScene, { attributes: true, attributeFilter: ["data-mountain"] });
    syncHallTexture();
  }
  window.addEventListener("resize", syncGateTexture);

  /* ===== 2. 桌面鼠标 + 手机陀螺仪 + 触控滑移三维视角输入 ===== */
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    targetX = Math.max(-1, Math.min(1, (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2));
  });

  // 手机陀螺仪 3D 倾斜视差（Android 自动生效，iOS 首次点击后静默请求）
  function bindGyro() {
    window.addEventListener("deviceorientation", (e) => {
      if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
      targetX = Math.max(-1, Math.min(1, e.gamma / 28));
      targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 28));
    });
  }
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    const askOnce = () => {
      DeviceOrientationEvent.requestPermission().then((res) => {
        if (res === "granted") bindGyro();
      }).catch(() => {});
      window.removeEventListener("pointerdown", askOnce);
    };
    window.addEventListener("pointerdown", askOnce, { once: true });
  } else if (typeof DeviceOrientationEvent !== "undefined") {
    bindGyro();
  }

  /* ===== 3. 60fps 渲染循环（仅渲染当前激活页面，省电不发热） ===== */
  const reduceQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || document.body.classList.contains("reduce-motion") || reduceQ.matches) return;

    const t = now * 0.001;
    // 温和自然呼吸摆动 + 阻尼随动
    const autoX = Math.sin(t * 0.42) * 0.24;
    const autoY = Math.cos(t * 0.34) * 0.16;
    curX += (targetX * 0.85 + autoX - curX) * 0.06;
    curY += (targetY * 0.85 + autoY - curY) * 0.06;

    if (gateRenderer && landing?.classList.contains("is-active")) {
      const hoverBoost = landing.classList.contains("v2-gate-hover") ? 0.035 : 0;
      const enterBoost = landing.classList.contains("is-entering-3d") ? 0.28 : 0;
      const zoom = 1.08 + Math.sin(t * 0.18) * 0.02 + hoverBoost + enterBoost;
      gateRenderer.draw(curX, curY, zoom);
    }

    if (hallRenderer && temple?.classList.contains("is-active")) {
      const zoom = 1.07 + Math.sin(t * 0.2) * 0.015;
      hallRenderer.draw(curX * 0.9, curY * 0.85, zoom);
    }
  }

  requestAnimationFrame(tick);
})();
