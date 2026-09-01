/* =============================================================
   3D hero — a crystal bottle on a dark stage, lit like a still life.
   Cool key light, brand-blue accents, and the real logo printed
   onto the label at runtime.
   Built on three.js (vendored, no CDN needed at runtime).
   ============================================================= */
import * as THREE from '../vendor/three.module.js';
import { BRAND } from './config.js';

/* palette shared with the CSS theme */
const C = {
  void: 0x05070d,
  brand: 0x0289ca,     // the logo blue
  brandLt: 0x56bce8,
  brandDp: 0x015f8f,
  plat: 0xdfe7ef,
  ice: 0xa8ddf2,
  ink: 0x0b1220,
};

export function initScene(canvasHost) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.void, 0.058);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.3, 9.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;   // restrained, filmic
  canvasHost.appendChild(renderer.domElement);

  /* ---------------- lighting: cool key, warm-neutral fill ---------------- */
  scene.add(new THREE.HemisphereLight(0xa8c4dd, 0x05070d, 0.5));

  const key = new THREE.DirectionalLight(0xf2fbff, 2.2);    // clean white key
  key.position.set(4.5, 6.5, 4.5);
  scene.add(key);

  const rim = new THREE.PointLight(C.brandLt, 36, 20);      // blue edge on the glass
  rim.position.set(3.6, 0.8, -2.6);
  scene.add(rim);

  const coolFill = new THREE.PointLight(0x6f9ec4, 22, 22);  // separation
  coolFill.position.set(-4.4, -1.2, 2.2);
  scene.add(coolFill);

  const under = new THREE.PointLight(C.brand, 16, 14);      // water glow from below
  under.position.set(0, -3, 1.5);
  scene.add(under);

  /* ---------------- environment for the glass to reflect ---------------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(studioEnv(), 0.03);
  scene.environment = envRT.texture;

  /* ---------------- the bottle ---------------- */
  const bottle = new THREE.Group();
  scene.add(bottle);

  // crystal, near-colourless — reads as glass, not plastic
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f8ff,
    metalness: 0,
    roughness: 0.035,
    transmission: 1,
    thickness: 1.3,
    ior: 1.46,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transparent: true,
    envMapIntensity: 2.1,
    specularIntensity: 1,
  });

  // water: pale brand tint, still expensive-looking
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe4f5,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 2.8,
    ior: 1.333,
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 1.5,
  });

  // polished steel-blue closure
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x9fb6c6, metalness: 0.95, roughness: 0.26,
    envMapIntensity: 1.8,
  });

  // slender flute silhouette with a soft shoulder, revolved
  const profile = [
    [0.00, -2.42], [0.58, -2.42], [0.66, -2.34], [0.665, -2.0],
    [0.655, -1.5], [0.665, -1.0], [0.658, -0.5], [0.668, 0.0],
    [0.66, 0.5], [0.665, 0.95], [0.64, 1.28],
    [0.52, 1.62], [0.38, 1.88], [0.30, 2.06],
    [0.285, 2.24], [0.283, 2.42],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), glassMat);
  bottle.add(body);

  const waterProfile = profile
    .filter((p) => p.y <= 1.3)
    .map((p) => new THREE.Vector2(Math.max(p.x - 0.05, 0.001), p.y - 0.02));
  waterProfile.push(new THREE.Vector2(0.001, 1.28));
  const water = new THREE.Mesh(new THREE.LatheGeometry(waterProfile, 128), waterMat);
  bottle.add(water);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.4, 64, 1, false), capMat);
  cap.position.y = 2.58;
  bottle.add(cap);

  // fine knurling on the cap — vertical flutes, catches the key light
  const knurl = new THREE.Group();
  for (let i = 0; i < 28; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.34, 0.012), capMat);
    const a = (i / 28) * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.318, 2.58, Math.sin(a) * 0.318);
    f.rotation.y = -a;
    knurl.add(f);
  }
  bottle.add(knurl);

  // tamper ring below the closure
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.016, 10, 64), capMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.33;
  bottle.add(collar);

  /* ---- label: deep ink band carrying the real logo ---- */
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture(),
    color: 0xffffff,
    metalness: 0.2,
    roughness: 0.46,
    transparent: true,
    side: THREE.DoubleSide,
    envMapIntensity: 0.9,
  });
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.676, 0.676, 1.36, 128, 1, true),
    labelMat
  );
  label.position.y = -0.22;
  bottle.add(label);

  // the logo is loaded asynchronously, then painted into the same texture
  loadLogo().then((img) => {
    if (!img) return;
    labelMat.map = labelTexture(img);
    labelMat.needsUpdate = true;
  });

  // brand-blue hairlines framing the label
  const hairMat = new THREE.MeshStandardMaterial({
    color: C.brandLt, metalness: 1, roughness: 0.22,
    emissive: C.brand, emissiveIntensity: 0.35, envMapIntensity: 2,
  });
  const hairTop = new THREE.Mesh(new THREE.TorusGeometry(0.678, 0.0075, 8, 96), hairMat);
  hairTop.rotation.x = Math.PI / 2;
  hairTop.position.y = 0.47;
  bottle.add(hairTop);
  const hairBot = hairTop.clone();
  hairBot.position.y = -0.91;
  bottle.add(hairBot);

  bottle.rotation.z = 0.05;

  /* ---------------- bubbles: sparse, small, jewel-like ---------------- */
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff0f6, roughness: 0.015, metalness: 0,
    transmission: 0.98, thickness: 0.35, ior: 1.25,
    transparent: true, opacity: 0.42, envMapIntensity: 2.2,
  });
  const BUBBLES = reduced ? 14 : 34;
  const bubbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), bubbleMat, BUBBLES);
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(bubbles);

  const seeds = [];
  for (let i = 0; i < BUBBLES; i++) {
    seeds.push({
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 13,
      z: (Math.random() - 0.5) * 7 - 2,
      s: 0.028 + Math.random() * 0.1,       // noticeably finer than before
      sp: 0.07 + Math.random() * 0.22,      // slower rise
      ph: Math.random() * Math.PI * 2,
      sw: 0.18 + Math.random() * 0.5,
    });
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v3 = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const sc = new THREE.Vector3();

  /* ---------------- the stage: a whisper of a reflective floor ---------------- */
  const floorGeo = new THREE.PlaneGeometry(34, 24, 1, 1);
  const floor = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0a0f1a, metalness: 0.85, roughness: 0.34,
      envMapIntensity: 0.7, transparent: true, opacity: 0.55,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.46, 0);
  scene.add(floor);

  // faint pool of light under the bottle
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 64),
    new THREE.MeshBasicMaterial({ color: C.brand, transparent: true, opacity: 0.07 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, -2.44, 0);
  scene.add(pool);

  /* ---------------- interaction ---------------- */
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let drag = null;
  let spin = 0;
  let spinVel = 0;
  let scrollN = 0;

  function onMove(e) {
    const t = e.touches ? e.touches[0] : e;
    pointer.x = (t.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (t.clientY / window.innerHeight) * 2 - 1;
    if (drag !== null) {
      spinVel += (t.clientX - drag) * 0.0004;
      drag = t.clientX;
    }
  }
  const startDrag = (e) => { drag = (e.touches ? e.touches[0] : e).clientX; };
  const endDrag = () => { drag = null; };

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  canvasHost.addEventListener('mousedown', startDrag);
  canvasHost.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
  window.addEventListener('scroll', () => {
    scrollN = window.scrollY / Math.max(window.innerHeight, 1);
  }, { passive: true });

  let narrow = false;
  function resize() {
    const w = canvasHost.clientWidth || window.innerWidth;
    const h = canvasHost.clientHeight || window.innerHeight;
    narrow = w < 940;
    camera.aspect = w / h;
    camera.position.z = narrow ? 11.8 : 9.6;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener('resize', resize);

  const restX = () => (narrow ? 0.1 : 2.5);
  const restY = () => (narrow ? -0.55 : 0.05);

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); tick(); }
  });

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // slower, heavier easing — expensive things move calmly
    eased.x += (pointer.x - eased.x) * 0.028;
    eased.y += (pointer.y - eased.y) * 0.028;

    spinVel *= 0.955;
    spin += spinVel + (reduced ? 0.0007 : 0.00195);
    bottle.rotation.y = spin;
    bottle.rotation.x = eased.y * 0.1;
    bottle.rotation.z = 0.05 + eased.x * 0.045;
    bottle.position.x = restX();
    bottle.position.y = restY() + Math.sin(t * 0.55) * 0.07 + scrollN * 1.5;
    bottle.scale.setScalar(1 - Math.min(scrollN, 1) * 0.1);

    // the label hairlines breathe very slightly
    const glow = 0.28 + Math.sin(t * 1.1) * 0.14;
    hairMat.emissiveIntensity = glow;

    // floor and light pool follow the bottle
    floor.position.y = -2.46 + scrollN * 1.5;
    pool.position.set(bottle.position.x, floor.position.y + 0.02, 0);
    pool.material.opacity = 0.07 + Math.sin(t * 0.8) * 0.014;

    camera.position.x = eased.x * 0.55;
    camera.position.y = 0.3 - eased.y * 0.38;
    camera.lookAt(bottle.position.x * 0.34, bottle.position.y * 0.3, 0);

    for (let i = 0; i < BUBBLES; i++) {
      const b = seeds[i];
      b.y += b.sp * dt;
      if (b.y > 6.8) { b.y = -6.8; b.x = (Math.random() - 0.5) * 16; }
      v3.set(b.x + Math.sin(t * b.sw + b.ph) * 0.4, b.y, b.z);
      sc.setScalar(b.s * (1 + Math.sin(t * 1.4 + b.ph) * 0.05));
      axis.copy(v3).normalize();
      q.setFromAxisAngle(axis, t * 0.18);
      m4.compose(v3, q, sc);
      bubbles.setMatrixAt(i, m4);
    }
    bubbles.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  tick();

  return { renderer, scene, camera };
}

/* ---------------------------------------------------------------
   Load the logo for the bottle label. The full lockup is preferred
   here — a real label carries the name, not just the emblem.
   Resolves to null on failure so the label falls back to type.
   --------------------------------------------------------------- */
function loadLogo() {
  return new Promise((resolve) => {
    const src = BRAND.logo || BRAND.logoMark;
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ---------------------------------------------------------------
   Label artwork, generated at runtime: deep ink ground, brand rules,
   the logo where available. Repeats three times around the bottle.
   --------------------------------------------------------------- */
function labelTexture(logo) {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // ground
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1526');
  bg.addColorStop(0.5, '#070c17');
  bg.addColorStop(1, '#0d1526');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // three identical panels around the circumference
  const P = W / 3;
  for (let i = 0; i < 3; i++) {
    g.save();
    g.translate(i * P, 0);

    // brand rules
    g.strokeStyle = 'rgba(86,188,232,.5)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(P * 0.16, H * 0.26); g.lineTo(P * 0.84, H * 0.26); g.stroke();
    g.beginPath(); g.moveTo(P * 0.16, H * 0.76); g.lineTo(P * 0.84, H * 0.76); g.stroke();

    if (logo) {
      // the real lockup, fitted inside the rules and given a little
      // brightness so it holds up against the dark label ground
      const maxW = P * 0.70, maxH = H * 0.40;
      const s = Math.min(maxW / logo.width, maxH / logo.height);
      const w = logo.width * s, h = logo.height * s;
      g.save();
      g.filter = 'brightness(1.35) saturate(1.15)';
      g.drawImage(logo, (P - w) / 2, H * 0.47 - h / 2, w, h);
      g.restore();
    } else {
      // fallback: set the name in type
      g.fillStyle = '#d8ecf7';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = '300 74px Georgia, "Times New Roman", serif';
      g.fillText('AQUA NIYOR', P / 2, H * 0.47);
    }

    // origin line beneath
    g.fillStyle = 'rgba(223,231,239,.58)';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '400 24px Helvetica, Arial, sans-serif';
    g.fillText('N  A  G  A  O  N   ·   A  S  S  A  M', P / 2, H * 0.665);

    g.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* A dark studio: two soft boxes on near-black, which is what gives
   the glass its long specular streaks. */
function studioEnv() {
  const s = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float h = d.y * 0.5 + 0.5;

        // near-black gradient ground
        vec3 c = mix(vec3(0.006,0.010,0.020), vec3(0.042,0.060,0.095), pow(h, 1.4));

        // main softbox, upper right — neutral white
        float mainL = smoothstep(0.55, 1.0, dot(d, normalize(vec3(0.6, 0.75, 0.3))));
        c += vec3(0.95, 0.98, 1.0) * mainL * 1.45;

        // brand-blue softbox, left
        float blue = smoothstep(0.68, 1.0, dot(d, normalize(vec3(-0.85, 0.2, 0.35))));
        c += vec3(0.15, 0.55, 0.82) * blue * 0.9;

        // thin horizon line, reads as a room edge in the reflections
        c += vec3(0.55,0.70,0.82) * smoothstep(0.02, 0.0, abs(d.y - 0.02)) * 0.35;

        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 40, 28), mat));
  return s;
}

/** WebGL support probe so we can fall back gracefully. */
export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
