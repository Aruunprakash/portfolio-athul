/* ==========================================================================
   Athul P · Line to Light
   Page-local behaviour. lib/scrollcraft.js drives pins, cues, the rail, the
   reveal and parallax; everything bespoke lives here and never edits it.
   ========================================================================== */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);

/* ----------------------------------------------------------- engine + scroll */
window.ScrollCraft && window.ScrollCraft.mount(document.body);

let lenis = null;
// automated browsers scroll programmatically; smoothing would fight them
if (window.Lenis && !reduce && !navigator.webdriver) {
  lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.__lenis = lenis;
}

function goTo(hash) {
  const el = hash === '#section' ? null : document.querySelector(hash);
  if (hash !== '#section' && !el) return;
  const behavior = reduce ? 'auto' : 'smooth';
  if (lenis) lenis.scrollTo(el || 0, { duration: 1.4 });
  else if (el) el.scrollIntoView({ behavior });
  else window.scrollTo({ top: 0, behavior });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  if (hash.length < 2) return;
  e.preventDefault();
  const menu = document.getElementById('menu');
  if (menu.open) menu.close();
  goTo(hash);
  history.replaceState(null, '', hash);
});

/* ----------------------------------------------------------- ground + nav */
const sections = [...document.querySelectorAll('main > section[data-ground]')];
const navLinks = [...document.querySelectorAll('.bar__nav a')];
const themeMeta = document.querySelector('meta[name="theme-color"]');
let currentId = '';
function groundFrame() {
  // whichever section sits under the bar owns the chrome
  const probe = 72;
  let hit = sections[0];
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= probe && r.bottom > probe) { hit = s; break; }
  }
  if (hit.id === currentId) return;
  currentId = hit.id;
  const g = hit.dataset.ground;
  document.documentElement.dataset.ground = g;
  themeMeta.content = g === 'dark' ? '#0E1113' : '#E8EBE8';
  const id = '#' + (hit.id === 'contact' ? 'practice' : hit.id);
  navLinks.forEach((l) => l.setAttribute('aria-current', l.getAttribute('href') === id ? 'true' : 'false'));
}

/* =================================================================== 1 · DRAW
   Every stroke of Section AA is a real SVG line. Each group carries the window
   of act progress it draws across; its children stagger inside that window. */
const act = document.getElementById('section');
const svg = document.getElementById('aa');
const pen = document.getElementById('pen');
const datumRect = document.getElementById('datumClipRect');

const strokes = [];   // { el, len, a, b }
const fades = [];     // { el, a, b }
svg.querySelectorAll('[data-draw]').forEach((g) => {
  const spec = g.dataset.draw;
  const kids = [...g.querySelectorAll('line, path, rect, polyline, circle')];
  const intro = spec === 'intro';
  const [A, B] = intro ? [0, 1] : spec.split(/\s+/).map(Number);
  const n = kids.length;
  kids.forEach((el, i) => {
    const len = el.getTotalLength ? el.getTotalLength() : 100;
    const span = B - A;
    const a = A + span * 0.55 * (n > 1 ? i / (n - 1) : 0);
    const b = a + span * 0.45;
    el.style.strokeDasharray = `${len} ${len + 6}`;
    el.style.strokeDashoffset = reduce ? 0 : len;
    strokes.push({ el, len, a, b, intro, last: -1 });
  });
});
svg.querySelectorAll('[data-fade]').forEach((g) => {
  const [a, b] = g.dataset.fade.split(/\s+/).map(Number);
  g.style.opacity = reduce ? 1 : 0;
  fades.push({ el: g, a, b, last: -1 });
});

// Phones: crop the sheet to the building so the lines read at thumb distance.
const narrowMQ = matchMedia('(max-width: 600px)');
const setBox = () => svg.setAttribute('viewBox', narrowMQ.matches ? '318 64 410 352' : '190 62 612 390');
setBox();
narrowMQ.addEventListener('change', setBox);

// Intro: the ground line and datums rule the paper on load.
let introT = reduce ? 1 : 0;
const introStart = performance.now() + 250;
const VBX = 190, VBW = 612;

let actP = 0;
function readAct() {
  const r = act.getBoundingClientRect();
  const travel = Math.max(r.height - innerHeight, 1);
  actP = clamp(-r.top / travel);
}

function drawFrame(now) {
  if (introT < 1) introT = easeOut((now - introStart) / 1500);
  readAct();
  const pd = reduce ? 1 : clamp((actP - 0.015) / 0.84);

  let tip = null;
  for (const s of strokes) {
    const t = s.intro ? clamp(introT * 1.15) : clamp((pd - s.a) / (s.b - s.a));
    if (t !== s.last) {
      s.el.style.strokeDashoffset = (s.len * (1 - t)).toFixed(2);
      // an undrawn stroke still paints its square cap as a dot: hide it
      s.el.style.visibility = t > 0 ? 'visible' : 'hidden';
      s.last = t;
    }
    if (t > 0 && t < 1 && !s.intro) tip = s;
  }
  datumRect.setAttribute('width', (VBW * clamp(introT * 1.05 - 0.05)).toFixed(1));
  for (const f of fades) {
    const t = smooth((pd - f.a) / (f.b - f.a));
    if (t !== f.last) { f.el.style.opacity = t.toFixed(3); f.last = t; }
  }

  // the pen rides the newest live stroke
  if (!reduce && tip) {
    const t = clamp((pd - tip.a) / (tip.b - tip.a));
    const pt = tip.el.getPointAtLength(tip.len * t);
    pen.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
    pen.style.opacity = 1;
  } else if (introT < 1 && !reduce) {
    pen.setAttribute('transform', `translate(${(196 + 598 * introT).toFixed(2)} 367.3)`);
    pen.style.opacity = 1;
  } else {
    pen.style.opacity = 0;
  }
}

/* hero depth: paper grid, drawing and name drift apart under the pointer */
const layers = {
  grid: document.querySelector('.draw-stage__grid'),
  sheet: document.querySelector('.draw-stage__sheet'),
  name: document.querySelector('.hero-name__in'),
};
let mx = 0, my = 0, cx = 0, cy = 0;
if (fine && !reduce) {
  addEventListener('pointermove', (e) => {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
  }, { passive: true });
}
function depthFrame() {
  if (reduce) return;
  cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
  // the name also lifts away a little as the section is drawn
  const lift = smooth(actP / 0.5);
  layers.grid.style.transform = `translate3d(${(-cx * 10).toFixed(2)}px, ${(-cy * 8).toFixed(2)}px, 0)`;
  layers.sheet.style.transform = `translate3d(${(cx * 16).toFixed(2)}px, ${(cy * 10).toFixed(2)}px, 0)`;
  layers.name.style.transform = `translate3d(${(-cx * 26).toFixed(2)}px, ${(-cy * 14 - lift * 18).toFixed(2)}px, 0)`;
  layers.name.style.opacity = (1 - lift * 0.82).toFixed(3);
}

/* ================================================================== 4 · ROOM
   The plan becomes the room: a wipe tied to the figure's own position, with
   the red pen riding its edge, so it lands while the reader is looking. */
const wipe = document.getElementById('roomWipe');
const edge = document.getElementById('roomEdge');
let wipeLast = -1;
function roomFrame() {
  if (reduce) return;
  const r = wipe.getBoundingClientRect();
  if (r.bottom < -50 || r.top > innerHeight + 50) return;
  const t = smooth((innerHeight * 0.82 - r.top) / (innerHeight * 0.5));
  if (t === wipeLast) return;
  wipeLast = t;
  wipe.style.clipPath = `inset(0 ${((1 - t) * 100).toFixed(2)}% 0 0)`;
  edge.style.height = r.height + 20 + 'px';
  edge.style.transform = `translate3d(${(r.width * t - 1).toFixed(1)}px, 0, 0)`;
  edge.style.opacity = t > 0.002 && t < 0.998 ? 1 : 0;
}

function loop(now) {
  groundFrame();
  drawFrame(now);
  depthFrame();
  roomFrame();
  closeFrame();
  requestAnimationFrame(loop);
}

/* ================================================================== 2 · MODEL
   Massing study: Section PQ gives the length (high block 10.1 m at +780, low
   block to 16 m at +700), Section AA gives the width (9 m, high part 5.1 m on
   the courtyard side). Openings come from the north elevation. */
const view = document.getElementById('modelView');
const canvas = document.getElementById('modelCanvas');
const tagEls = {};
document.querySelectorAll('#modelTags [data-tag]').forEach((s) => { tagEls[s.dataset.tag] = s; });

async function initModel() {
  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (err) { view.classList.add('no-webgl'); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) { view.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);

  const INK = 0x15191c, RED = 0xb92d1c;
  const L = 16.0, W = 9.0, XH = 10.1, ZH = 3.9;
  const LV = { gf: 0.45, gfs: 3.5, ffs: 7.0, top: 7.8 };

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dfdb, 2.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(-6, 14, 10);
  scene.add(sun);

  const house = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: INK });
  const faceMat = new THREE.MeshLambertMaterial({
    color: 0xf2f4f1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });

  function box(x0, y0, z0, x1, y1, z1) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    house.add(new THREE.Mesh(g, faceMat));
    house.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), lineMat));
  }
  box(-0.15, 0, -0.15, L + 0.15, LV.gf, W + 0.15);      // plinth
  box(0, LV.gf, 0, L, LV.ffs, W);                        // two storeys
  box(0, LV.ffs, ZH, XH, LV.top, W);                     // raised roof over the void

  // slab edge band at GF slab +350, around the whole volume
  const band = (y) => {
    const pts = [[0, y, 0], [L, y, 0], [L, y, W], [0, y, W], [0, y, 0]].map((p) => new THREE.Vector3(...p));
    house.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  };
  band(LV.gfs);

  // openings on the north face (z = W), measured off the north elevation
  const face = W + 0.012;
  const seg = [];
  const rectOn = (x0, y0, x1, y1, mullions = 0) => {
    seg.push([x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]);
    for (let i = 1; i <= mullions; i++) {
      const x = x0 + ((x1 - x0) * i) / (mullions + 1);
      seg.push([x, y0, x, y1]);
    }
  };
  rectOn(0.48, LV.gf, 4.74, 3.45, 3);
  rectOn(5.74, LV.gf, 10.0, 3.45, 3);
  rectOn(0.48, 4.3, 4.26, 6.5, 2);
  rectOn(6.25, 4.3, 10.0, 6.5, 2);
  rectOn(11.6, 0.95, 13.55, 2.65, 2);
  rectOn(11.6, 4.3, 13.55, 6.0, 2);
  rectOn(14.7, LV.gf, 15.3, 2.65);
  const op = [];
  seg.forEach(([a, b, c, d]) => op.push(a, b, face, c, d, face));
  const opGeo = new THREE.BufferGeometry();
  opGeo.setAttribute('position', new THREE.Float32BufferAttribute(op, 3));
  house.add(new THREE.LineSegments(opGeo, new THREE.LineBasicMaterial({ color: 0x4a5359 })));

  // ground: drafting grid
  const grid = new THREE.GridHelper(44, 44, 0xbfc6c2, 0xd3d8d5);
  grid.position.set(L / 2, -0.001, W / 2);
  scene.add(grid);
  scene.add(house);

  // the AA cut: a red plane through the stair, at 6.2 m along the length
  const XA = 6.2;
  const cut = new THREE.Group();
  const cw = W + 2.4, ch = 8.9;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(cw, ch),
    new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  );
  plane.rotation.y = Math.PI / 2;
  plane.position.set(XA, ch / 2 - 0.3, W / 2);
  cut.add(plane);
  const redMat = new THREE.LineBasicMaterial({ color: RED, transparent: true });
  const outline = [[XA, -0.3, -1.2], [XA, ch - 0.3, -1.2], [XA, ch - 0.3, W + 1.2], [XA, -0.3, W + 1.2], [XA, -0.3, -1.2]];
  cut.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline.map((p) => new THREE.Vector3(...p))), redMat));
  scene.add(cut);

  const tagPos = {
    780: new THREE.Vector3(XH, LV.top, W),
    700: new THREE.Vector3(L, LV.ffs, W),
    350: new THREE.Vector3(L, LV.gfs, W),
    45: new THREE.Vector3(L, LV.gf, W),
    a1: new THREE.Vector3(XA, -0.3, -1.2),
    a2: new THREE.Vector3(XA, -0.3, W + 1.2),
  };

  const target = new THREE.Vector3(L / 2, 3.4, W / 2);
  let w = 1, h = 1;
  function resize() {
    const r = view.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    const aspect = w / h;
    let halfW = 12.5, halfH = halfW / aspect;
    if (halfH < 7.6) { halfH = 7.6; halfW = halfH * aspect; }
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH;
    cam.updateProjectionMatrix();
    dirty = true;
  }

  // yaw: base + scroll + drag (with inertia)
  let yawDrag = 0, vel = 0, pitchDrag = 0, dragging = false, lastX = 0, lastY = 0, dirty = true;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; vel = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    vel = dx * 0.006;
    yawDrag += vel;
    pitchDrag = clamp(pitchDrag + dy * 0.003, -0.22, 0.32);
    dirty = true;
  }, { passive: true });
  addEventListener('pointerup', () => { dragging = false; });
  addEventListener('pointercancel', () => { dragging = false; });

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '10% 0px' }).observe(view);
  new ResizeObserver(resize).observe(view);
  resize();

  const sec = document.getElementById('model');
  const v3 = new THREE.Vector3();
  let lastKey = '';

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const r = sec.getBoundingClientRect();
    const p = clamp((innerHeight - r.top) / (r.height + innerHeight));
    const rise = reduce ? 1 : smooth((p - 0.06) / 0.32);
    const cutIn = reduce ? 1 : smooth((p - 0.3) / 0.14);

    if (!dragging && !reduce) { yawDrag += vel; vel *= 0.9; }
    const yaw = 0.62 + (reduce ? 0 : (p - 0.5) * 0.9) + yawDrag;
    const pitch = 0.5 + pitchDrag;

    const key = [rise.toFixed(4), cutIn.toFixed(3), yaw.toFixed(4), pitch.toFixed(4), w, h].join('|');
    if (key === lastKey && !dirty) return;
    lastKey = key; dirty = false;

    house.scale.y = Math.max(0.002, rise);
    plane.material.opacity = 0.11 * cutIn;
    redMat.opacity = cutIn;
    cut.visible = cutIn > 0.01;

    const R = 60;
    cam.position.set(
      target.x + R * Math.sin(yaw) * Math.cos(pitch),
      target.y + R * Math.sin(pitch),
      target.z + R * Math.cos(yaw) * Math.cos(pitch)
    );
    cam.lookAt(target);
    cam.updateMatrixWorld();
    renderer.render(scene, cam);

    for (const k in tagPos) {
      const el = tagEls[k];
      if (!el) continue;
      v3.copy(tagPos[k]);
      if (k !== 'a1' && k !== 'a2') v3.y *= house.scale.y;
      v3.project(cam);
      const x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
      const on = k.startsWith('a') ? cutIn : smooth((rise - 0.85) / 0.15);
      el.style.opacity = on.toFixed(2);
    }
  }
  requestAnimationFrame(frame);
}
initModel();

/* ================================================================= 7 · CLOSE
   The title block's rules draw themselves, echoing the first section. */
const tblock = document.getElementById('tblock');
const tLines = document.getElementById('tblockLines');
let tSegs = [];
function buildTitleLines() {
  const box = tblock.getBoundingClientRect();
  const W = box.width, H = box.height;
  const svgEl = tLines.ownerSVGElement;
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const seen = new Set();
  const segs = [];
  const add = (x1, y1, x2, y2, outer = false) => {
    const k = [x1, y1, x2, y2].map((v) => Math.round(v)).join(',');
    if (seen.has(k)) return; seen.add(k);
    segs.push({ x1, y1, x2, y2, outer });
  };
  add(0, 0, W, 0, true); add(0, 0, 0, H, true);
  tblock.querySelectorAll('.tblock__cell').forEach((c) => {
    const r = c.getBoundingClientRect();
    const x = r.left - box.left, y = r.top - box.top;
    if (y > 1) add(x, y, x + r.width, y);
    if (x > 1) add(x, y, x, y + r.height);
  });
  add(W, 0, W, H, true); add(0, H, W, H, true);
  segs.sort((a, b) => (a.outer === b.outer ? a.y1 - b.y1 || a.x1 - b.x1 : a.outer ? -1 : 1));
  tLines.innerHTML = '';
  tSegs = segs.map((s, i) => {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ['x1', 'y1', 'x2', 'y2'].forEach((k) => l.setAttribute(k, s[k].toFixed(1)));
    l.setAttribute('pathLength', '1');
    l.style.strokeDasharray = '1 1';
    l.style.strokeDashoffset = reduce ? 0 : 1;
    if (s.outer) l.classList.add('is-outer');
    tLines.appendChild(l);
    const n = segs.length;
    const a = 0.5 * (i / Math.max(n - 1, 1));
    return { el: l, a, b: a + 0.5, last: -1 };
  });
}
new ResizeObserver(() => buildTitleLines()).observe(tblock);
document.fonts && document.fonts.ready.then(buildTitleLines);

function closeFrame() {
  if (!tSegs.length) return;
  const r = tblock.getBoundingClientRect();
  const p = reduce ? 1 : clamp((innerHeight - r.top) / (innerHeight * 0.75));
  for (const s of tSegs) {
    const t = easeOut((p - s.a) / (s.b - s.a));
    if (t !== s.last) { s.el.style.strokeDashoffset = (1 - t).toFixed(4); s.last = t; }
  }
}

requestAnimationFrame(loop);

/* keyboard focus inside the sideways rail scrolls the page to that sheet */
const sheetsAct = document.getElementById('drawings');
const rail = document.querySelector('.rail');
rail.addEventListener('focusin', (e) => {
  if (reduce) return;
  const item = e.target.closest('.rail > *');
  if (!item) return;
  const travel = Math.max(rail.scrollWidth - innerWidth, 1);
  const want = clamp((item.offsetLeft - innerWidth * 0.2) / travel);
  const y = sheetsAct.offsetTop + want * (sheetsAct.offsetHeight - innerHeight);
  if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
});

/* ================================================================= dialogs */
function openDialog(d) {
  d.showModal();
  lenis && lenis.stop();
}
document.querySelectorAll('dialog').forEach((d) => {
  d.addEventListener('close', () => { lenis && lenis.start(); });
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) d.close();
  });
});

// index menu
const menu = document.getElementById('menu');
document.querySelector('.bar__menu').addEventListener('click', () => openDialog(menu));

// CV
const cv = document.getElementById('cv');
const cvFrame = cv.querySelector('iframe');
document.querySelectorAll('[data-cv]').forEach((b) => b.addEventListener('click', () => {
  if (!cvFrame.src) cvFrame.src = cvFrame.dataset.src;
  openDialog(cv);
}));

// drawing viewer: zoom 0.5x to 4x, drag to pan
const viewer = document.getElementById('viewer');
const vImg = document.getElementById('viewerImg');
const vStage = document.getElementById('viewerStage');
const vPct = document.getElementById('viewerPct');
const vTitle = document.getElementById('viewerTitle');
let zs = 1, zx = 0, zy = 0;
function applyZoom() {
  vImg.style.transform = `translate(calc(-50% + ${zx}px), calc(-50% + ${zy}px)) scale(${zs})`;
  vPct.textContent = Math.round(zs * 100) + '%';
}
function setZoom(next) {
  zs = clamp(next, 0.5, 4);
  if (zs <= 1) { zx = 0; zy = 0; }
  applyZoom();
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-view]');
  if (!t) return;
  vImg.src = t.dataset.view;
  vImg.alt = t.dataset.title || '';
  vTitle.textContent = t.dataset.title || 'Drawing';
  zs = 1; zx = 0; zy = 0; applyZoom();
  openDialog(viewer);
});
viewer.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
  const d = Number(b.dataset.zoom);
  if (d === 0) { zs = 1; zx = 0; zy = 0; applyZoom(); } else setZoom(zs * (d > 0 ? 1.25 : 0.8));
}));
vStage.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(zs * (e.deltaY < 0 ? 1.12 : 0.89)); }, { passive: false });
let panning = false, px0 = 0, py0 = 0;
vStage.addEventListener('pointerdown', (e) => { panning = true; px0 = e.clientX - zx; py0 = e.clientY - zy; });
vStage.addEventListener('pointermove', (e) => {
  if (!panning) return;
  zx = e.clientX - px0; zy = e.clientY - py0; applyZoom();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => vStage.addEventListener(ev, () => { panning = false; }));
viewer.addEventListener('keydown', (e) => {
  if (e.key === '+' || e.key === '=') setZoom(zs * 1.25);
  if (e.key === '-') setZoom(zs * 0.8);
  if (e.key === '0') { zs = 1; zx = 0; zy = 0; applyZoom(); }
});

/* ================================================================= contact
   Without JS the form posts to mailto (text/plain), never a GET. With JS it
   builds a tidy email. Nothing here claims the message was sent. */
const form = document.getElementById('contactForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const f = new FormData(form);
  const subject = `Project: ${f.get('subject')}`;
  const body = `${f.get('message')}\n\n${f.get('name')}\n${f.get('email')}`;
  location.href = `mailto:athulpsajeev1816@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
