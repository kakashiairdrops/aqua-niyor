/* =============================================================
   3D hero — a crystal bottle on a dark stage, lit like a still life.
   Champagne key light, cool fill, gold label type drawn at runtime.
   Built on three.js (vendored, no CDN needed at runtime).
   ============================================================= */
import * as THREE from '../vendor/three.module.js';

/* palette shared with the CSS theme */
const C = {
  void: 0x05070d,
  gold: 0xcbb083,
  goldLt: 0xe8d7b4,
  plat: 0xdfe7ef,
  aqua: 0x7fd4e8,
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

  /* ---------------- lighting: one warm key, one cool fill ---------------- */
  scene.add(new THREE.HemisphereLight(0xa8c4dd, 0x05070d, 0.5));

  const key = new THREE.DirectionalLight(0xfff4e0, 2.1);   // champagne key
  key.position.set(4.5, 6.5, 4.5);
  scene.add(key);

  const goldRim = new THREE.PointLight(C.goldLt, 34, 20);   // gold edge on the glass
  goldRim.position.set(3.6, 0.8, -2.6);
  scene.add(goldRim);

  const coolFill = new THREE.PointLight(0x6f9ec4, 22, 22);  // cool separation
  coolFill.position.set(-4.4, -1.2, 2.2);
  scene.add(coolFill);

  const under = new THREE.PointLight(C.aqua, 12, 14);       // faint water glow
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

  // water: pale, expensive-looking, not swimming-pool blue
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe8f2,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 2.8,
    ior: 1.333,
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 1.5,
  });

  // brushed champagne-gold closure
  const capMat = new THREE.MeshStandardMaterial({
    color: C.gold, metalness: 0.95, roughness: 0.28,
    envMapIntensity: 1.7,
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

  /* ---- label: deep ink band with gold type, drawn on a canvas ---- */
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

  // gold hairlines framing the label
  const hairMat = new THREE.MeshStandardMaterial({
    color: C.goldLt, metalness: 1, roughness: 0.22,
    emissive: C.gold, emissiveIntensity: 0.35, envMapIntensity: 2,
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
    new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.05 })
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

    // the gold hairlines breathe very slightly
    const glow = 0.28 + Math.sin(t * 1.1) * 0.14;
    hairMat.emissiveIntensity = glow;

    // floor and light pool follow the bottle
    floor.position.y = -2.46 + scrollN * 1.5;
    pool.position.set(bottle.position.x, floor.position.y + 0.02, 0);
    pool.material.opacity = 0.05 + Math.sin(t * 0.8) * 0.012;

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
   Label artwork, generated at runtime: deep ink ground, gold rules,
   and the brand name set wide. Repeats three times around the bottle.
   --------------------------------------------------------------- */
function labelTexture() {
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
    const x0 = i * P;
    g.save();
    g.translate(x0, 0);

    // gold rules
    g.strokeStyle = 'rgba(203,176,131,.55)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(P * 0.16, H * 0.3); g.lineTo(P * 0.84, H * 0.3); g.stroke();
    g.beginPath(); g.moveTo(P * 0.16, H * 0.72); g.lineTo(P * 0.84, H * 0.72); g.stroke();

    // brand name
    g.fillStyle = '#e8d7b4';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '300 76px Georgia, "Times New Roman", serif';
    g.fillText('AQUA NIYOR', P / 2, H * 0.5);

    // small caps line beneath
    g.fillStyle = 'rgba(223,231,239,.6)';
    g.font = '400 26px Helvetica, Arial, sans-serif';
    g.fillText('N  A  G  A  O  N   ·   A  S  S  A  M', P / 2, H * 0.615);

    // drop mark above
    g.fillStyle = 'rgba(127,212,232,.75)';
    g.beginPath();
    g.ellipse(P / 2, H * 0.185, 13, 20, 0, 0, Math.PI * 2);
    g.fill();

    g.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* A dark studio: two soft boxes (one warm, one cool) on near-black,
   which is what gives the glass its long specular streaks. */
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
        vec3 c = mix(vec3(0.006,0.010,0.020), vec3(0.045,0.062,0.095), pow(h, 1.4));

        // warm softbox, upper right
        float warm = smoothstep(0.55, 1.0, dot(d, normalize(vec3(0.6, 0.75, 0.3))));
        c += vec3(1.0, 0.88, 0.68) * warm * 1.5;

        // cool softbox, left
        float cool = smoothstep(0.68, 1.0, dot(d, normalize(vec3(-0.85, 0.2, 0.35))));
        c += vec3(0.62, 0.78, 0.95) * cool * 0.7;

        // thin horizon line, reads as a room edge in the reflections
        c += vec3(0.7,0.62,0.5) * smoothstep(0.02, 0.0, abs(d.y - 0.02)) * 0.35;

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
