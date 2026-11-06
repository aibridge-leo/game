/* Sky Arcade — shared engine (renderer, post FX, particles, explosions, audio, HUD helpers, main loop).
   Every game module receives this object as `core` in mount(root, core, api). */
window.GAMES = window.GAMES || {};
window.CORE = (() => {
'use strict';
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ok = !!window.THREE;

/* ================= shared renderer ================= */
let renderer = null, W = 1, H = 1;
function getRenderer() {
  if (renderer || !ok) return renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { renderer = null; }
  return renderer;
}

/* ================= particles ================= */
const PV = `attribute float size; attribute vec4 col; uniform float scale; varying vec4 vC;
void main(){ vC = col; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size*scale/max(.5,-mv.z); gl_Position = projectionMatrix*mv; }`;
const PFA = `varying vec4 vC; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; float a = smoothstep(.5,0.,d); a*=a;
  vec3 c = mix(vC.rgb, vec3(1.), smoothstep(.22,0.,d)*.75); gl_FragColor = vec4(c, vC.a*a); }`;
const PFS = `varying vec4 vC; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; float a = smoothstep(.5,.1,d); gl_FragColor = vec4(vC.rgb, vC.a*a*.9); }`;
class Pool {
  constructor(scene, n, additive) {
    this.n = n; this.i = 0;
    const F = k => new Float32Array(n * k);
    this.pos = F(3); this.col = F(4); this.size = F(1); this.v = F(3);
    this.life = F(1); this.max = F(1); this.s0 = F(1); this.s1 = F(1); this.a0 = F(1); this.drag = F(1); this.grav = F(1);
    const g = new THREE.BufferGeometry();
    const at = (arr, k) => new THREE.BufferAttribute(arr, k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', at(this.pos, 3)); g.setAttribute('col', at(this.col, 4)); g.setAttribute('size', at(this.size, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { scale: { value: 400 } }, vertexShader: PV, fragmentShader: additive ? PFA : PFS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 3 : 2;
    this.g = g; scene.add(this.pts);
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, r, gg, b, a, drag, grav) {
    const i = this.i; this.i = (i + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1;
    this.col[i * 4] = r; this.col[i * 4 + 1] = gg; this.col[i * 4 + 2] = b; this.a0[i] = a;
    this.drag[i] = drag || 1; this.grav[i] = grav || 0;
  }
  update(dt) {
    const { pos, v, life, max, size, col, s0, s1, a0, drag, grav } = this;
    for (let i = 0; i < this.n; i++) {
      if (life[i] <= 0) { if (size[i] !== 0) size[i] = 0; continue; }
      life[i] -= dt;
      if (life[i] <= 0) { size[i] = 0; continue; }
      const k = life[i] / max[i];
      if (drag[i] !== 1) { const f = Math.pow(drag[i], dt * 60); v[i * 3] *= f; v[i * 3 + 1] *= f; v[i * 3 + 2] *= f; }
      v[i * 3 + 1] -= grav[i] * dt;
      pos[i * 3] += v[i * 3] * dt; pos[i * 3 + 1] += v[i * 3 + 1] * dt; pos[i * 3 + 2] += v[i * 3 + 2] * dt;
      size[i] = s1[i] + (s0[i] - s1[i]) * k;
      col[i * 4 + 3] = a0[i] * Math.min(1, k * 1.6);
    }
    this.g.attributes.position.needsUpdate = true; this.g.attributes.size.needsUpdate = true; this.g.attributes.col.needsUpdate = true;
  }
  clear() { this.life.fill(0); this.size.fill(0); }
}
const C = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const COL = ok ? { orange: C(0xff7a2a), gold: C(0xffc861), red: C(0xff4d2e), cyan: C(0x4fe6ff), pink: C(0xff4f8b), purple: C(0xc77dff), white: [1, 1, 1], amber: C(0xffa04a), mint: C(0x3dffb5), magenta: C(0xff2bd6), ember: C(0xff5a1a) } : {};

/* ================= world (scene + camera + post + fx) ================= */
function createWorld(o) {
  o = Object.assign({ fog: 0x000000, fogNear: 140, fogFar: 1050, fov: 66, near: .5, far: 2600, drift: 0, bloom: [.85, .5, .78], glow: 6000, smoke: 1400, debrisColor: 0x2b2f44, debrisEmissive: 0xff5a1a, dmgTint: [1, .12, .28] }, o || {});
  const r = getRenderer();
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(o.fog);
  scene.fog = new THREE.Fog(fogColor, o.fogNear, o.fogFar);
  scene.background = fogColor.clone();
  const camera = new THREE.PerspectiveCamera(o.fov, 1, o.near, o.far);
  const composer = new THREE.EffectComposer(r);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), o.bloom[0], o.bloom[1], o.bloom[2]);
  composer.addPass(bloom);
  const finalPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, ca: { value: .0016 }, time: { value: 0 }, dmg: { value: 0 }, tint: { value: new THREE.Vector3().fromArray(o.dmgTint) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float ca, time, dmg; uniform vec3 tint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 d = vUv-.5; float r2 = dot(d,d);
      vec2 off = d*ca*(1.+r2*5.);
      vec3 c = vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
      c *= 1. - smoothstep(.16,.72,r2)*.6;
      c = mix(c, tint, dmg*smoothstep(.04,.45,r2));
      c += (h(vUv*vec2(1733.,977.)+fract(time))-.5)*.03;
      gl_FragColor = vec4(c,1.);
    }`
  });
  composer.addPass(finalPass);
  const FX = new Pool(scene, o.glow, true), SMOKE = new Pool(scene, o.smoke, false);
  const fx = { trauma: 0, hitStop: 0, slowT: 0, timeScale: 1, flashA: 0, dmgA: 0, fovKick: 0, caExtra: 0 };
  const w = { scene, camera, composer, bloom, finalPass, FX, SMOKE, fx, drift: o.drift, baseFov: o.fov, fogColor, opts: o };

  w.shake = v => { fx.trauma = Math.min(1, fx.trauma + (reduceMotion ? v * .25 : v)); };
  w.flash = a => { fx.flashA = Math.max(fx.flashA, a); };
  w.glowP = (x, y, z, vx, vy, vz, life, s0, s1, c, a, drag, grav) => FX.emit(x, y, z, vx, vy, vz, life, s0, s1, c[0], c[1], c[2], a == null ? 1 : a, drag, grav);
  w.smokeP = (x, y, z, vx, vy, vz, life, s0, s1, c, a, drag) => SMOKE.emit(x, y, z, vx, vy, vz, life, s0, s1, c[0], c[1], c[2], a == null ? .5 : a, drag);

  // shockwave rings
  const ringGeo = new THREE.RingGeometry(.86, 1, 64), rings = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.visible = false; m.renderOrder = 4; scene.add(m); rings.push({ m, life: 0 });
  }
  let ringI = 0;
  w.ring = (x, y, z, r0, r1, life, color, vz, flat) => {
    const rr = rings[ringI = (ringI + 1) % rings.length];
    Object.assign(rr, { x, y, z, r0, r1, life, max: life, vz: vz || 0, flat: !!flat });
    rr.m.material.color.set(color); rr.m.visible = true;
  };
  // flash lights
  const lights = [];
  for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffa060, 0, 140, 2); scene.add(l); lights.push(l); }
  let lightI = 0;
  w.lightFlash = (x, y, z, power, color) => { const l = lights[lightI = (lightI + 1) % lights.length]; l.position.set(x, y, z); l.intensity = power; l.color.set(color || 0xffa060); };
  // debris
  const debGeo = new THREE.TetrahedronGeometry(1);
  const debMat = new THREE.MeshStandardMaterial({ color: o.debrisColor, emissive: o.debrisEmissive, emissiveIntensity: .7, flatShading: true, metalness: .4, roughness: .6 });
  const debris = [];
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(debGeo, debMat); m.visible = false; scene.add(m); debris.push({ m, life: 0, v: new THREE.Vector3(), s: new THREE.Vector3() }); }
  let debI = 0;

  w.explode = (x, y, z, s, colr, vz) => {
    vz = vz || 0; colr = colr || COL.orange;
    const rs = Math.sqrt(s), glowP = w.glowP;
    glowP(x, y, z, 0, 0, vz, .22, 26 * s, 40 * s, [1, .95, .85], 1);
    w.ring(x, y, z, 1, 14 * s, .55 * rs, 0xffc070, vz * .6);
    if (s > 2) w.ring(x, y, z, 2, 28 * s, .9 * rs, 0xff7040, vz * .4);
    for (let i = 0; i < 26 * s; i++) {
      const th = rand(0, TAU), ph = Math.acos(rand(-1, 1)), sp = rand(25, 90) * rs;
      const dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
      glowP(x, y, z, dx * sp, dy * sp, dz * sp + vz, rand(.3, .7), rand(1.2, 2.4), .2, Math.random() < .5 ? COL.gold : colr, 1, .93);
    }
    for (let i = 0; i < 10 * s; i++) {
      const r = 2.5 * rs;
      glowP(x + rand(-r, r), y + rand(-r, r), z + rand(-r, r), rand(-12, 12), rand(-12, 12), vz + rand(-12, 12), rand(.35, .8), rand(5, 10) * Math.pow(s, .6), rand(12, 18) * Math.pow(s, .6), pick([COL.orange, COL.red, COL.gold]), .8, .95);
    }
    for (let i = 0; i < 6 * s; i++) {
      const r = 2 * rs;
      SMOKE.emit(x + rand(-r, r), y + rand(-r, r), z + rand(-r, r), rand(-5, 5), rand(2, 9), vz * .3 + w.drift * .6, rand(1, 1.8), rand(4, 7) * Math.pow(s, .6), rand(16, 26) * Math.pow(s, .6), .08, .07, .1, .55, .97);
    }
    for (let i = 0; i < 4 * s && i < 24; i++) {
      const d = debris[debI = (debI + 1) % debris.length];
      d.life = rand(1, 1.8); d.m.visible = true; d.m.position.set(x, y, z);
      const sz = rand(.3, .9) * rs; d.m.scale.set(sz, sz * rand(.5, 1.2), sz);
      d.v.set(rand(-1, 1), rand(-.4, 1.2), rand(-1, 1)).multiplyScalar(rand(18, 50) * rs); d.v.z += vz;
      d.s.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
    }
    w.lightFlash(x, y, z, 6 * s, 0xffa060);
    w.shake(.1 * s);
  };
  w.sparks = (x, y, z, c, n, sp, vz) => {
    for (let i = 0; i < n; i++) w.glowP(x, y, z, rand(-1, 1) * sp, rand(-1, 1) * sp, rand(-1, 1) * sp + (vz || 0), rand(.12, .3), rand(.8, 1.4), .1, c, 1, .9);
  };
  w.updateFx = dt => {
    for (const r of rings) {
      if (r.life <= 0) continue;
      r.life -= dt; if (r.life <= 0) { r.m.visible = false; continue; }
      const k = r.life / r.max, e = 1 - Math.pow(k, 3);
      r.z += r.vz * dt;
      r.m.position.set(r.x, r.y, r.z);
      if (r.flat) r.m.rotation.set(-Math.PI / 2, 0, 0); else r.m.lookAt(camera.position);
      const sc = r.r0 + (r.r1 - r.r0) * e; r.m.scale.set(sc, sc, sc);
      r.m.material.opacity = k * k;
    }
    for (const d of debris) {
      if (d.life <= 0) continue;
      d.life -= dt; if (d.life <= 0) { d.m.visible = false; continue; }
      d.v.y -= 30 * dt; d.v.multiplyScalar(Math.pow(.985, dt * 60));
      d.m.position.addScaledVector(d.v, dt);
      d.m.rotation.x += d.s.x * dt; d.m.rotation.y += d.s.y * dt; d.m.rotation.z += d.s.z * dt;
      if (Math.random() < .4) SMOKE.emit(d.m.position.x, d.m.position.y, d.m.position.z, 0, 1, w.drift * .5, .6, 1, 3, .1, .08, .1, .45, .97);
    }
    for (const l of lights) l.intensity *= Math.pow(.0005, dt);
    FX.update(dt); SMOKE.update(dt);
  };
  const _v = new THREE.Vector3();
  w.toScreen = (x, y, z) => { _v.set(x, y, z).project(camera); return [(_v.x * .5 + .5) * W, (-_v.y * .5 + .5) * H, _v.z < 1]; };
  w.resize = () => {
    W = innerWidth || 1; H = innerHeight || 1;
    const pr = Math.min(window.devicePixelRatio || 1, 1.6);
    r.setPixelRatio(pr); r.setSize(W, H, false);
    if (composer.setPixelRatio) composer.setPixelRatio(pr);
    composer.setSize(W, H);
    bloom.setSize(W * pr / 2, H * pr / 2);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const sc = H * pr / (2 * Math.tan(w.baseFov * Math.PI / 360));
    FX.mat.uniforms.scale.value = sc; SMOKE.mat.uniforms.scale.value = sc;
  };
  w.dispose = () => {
    const seen = new Set();
    scene.traverse(obj => {
      if (obj.geometry && !seen.has(obj.geometry)) { seen.add(obj.geometry); obj.geometry.dispose(); }
      const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
      for (const m of mats) { if (seen.has(m)) continue; seen.add(m); if (m.map) m.map.dispose(); m.dispose(); }
    });
    try { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); } catch (e) {}
    try { bloom.dispose && bloom.dispose(); } catch (e) {}
    try { r.setRenderTarget(null); r.renderLists.dispose(); } catch (e) {}
  };
  w.resize();
  return w;
}

/* ================= main loop ================= */
// h: { isPaused():bool, update(dt, rdt), camera(rdt), draw?(), hud?(), slowScale? }
function run(w, signal, h) {
  let last = performance.now();
  const fx = w.fx, cam = w.camera;
  function frame(now) {
    if (signal.aborted) return;
    requestAnimationFrame(frame);
    if (innerWidth && (innerWidth !== W || innerHeight !== H)) w.resize();
    const rdt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!h.isPaused()) {
      if (fx.hitStop > 0) { fx.hitStop -= rdt; fx.trauma = Math.max(0, fx.trauma - rdt); }
      else {
        const target = fx.slowT > 0 ? (h.slowScale || .28) : 1;
        fx.timeScale += (target - fx.timeScale) * Math.min(1, rdt * (target < 1 ? 12 : 2.5));
        const dt = rdt * fx.timeScale;
        h.update(dt, rdt);
        if (signal.aborted) return;
        w.updateFx(dt);
      }
      updatePops(rdt);
      fx.trauma = Math.max(0, fx.trauma - rdt * 1.4);
      fx.flashA = Math.max(0, fx.flashA - rdt * 2.4);
      fx.dmgA = Math.max(0, fx.dmgA - rdt * 1.6);
      fx.fovKick = Math.max(0, fx.fovKick - rdt * 20);
      if (fx.slowT > 0) fx.slowT -= rdt;
      h.camera(rdt);
      const tr = fx.trauma * fx.trauma * (reduceMotion ? .3 : 1);
      if (tr > 0) { cam.position.x += rand(-1, 1) * tr * 2.4; cam.position.y += rand(-1, 1) * tr * 2.4; cam.position.z += rand(-1, 1) * tr * 2.4; cam.rotateZ(rand(-1, 1) * tr * .04); }
      w.finalPass.uniforms.time.value = now / 1000;
    }
    if (h.draw) h.draw();
    $('flash').style.opacity = fx.flashA.toFixed(3);
    $('dmg').style.opacity = fx.dmgA.toFixed(3);
    w.finalPass.uniforms.dmg.value = fx.dmgA * .6;
    w.finalPass.uniforms.ca.value = .0016 + fx.trauma * .006 + fx.dmgA * .004 + fx.fovKick * .0002 + fx.caExtra;
    w.composer.render();
    if (h.hud) h.hud();
  }
  requestAnimationFrame(frame);
}

/* ================= DOM feedback: banner + score popups ================= */
function showBanner(text, sub, color, warn) {
  const b = $('banner'); const dur = warn ? 3.2 : 2.4;
  b.style.setProperty('--bc', color || '#4fe6ff'); b.style.setProperty('--dur', dur + 's');
  $('bnT').textContent = text; $('bnS').textContent = sub || '';
  b.classList.remove('show', 'warn'); void b.offsetWidth; b.classList.add('show'); if (warn) b.classList.add('warn');
}
function hideBanner() { $('banner').classList.remove('show', 'warn'); }
const pops = [];
function popText(w, x, y, z, text, color, size, vz) {
  if (pops.length > 24) { const o = pops.shift(); o.el.remove(); }
  const el = document.createElement('div'); el.className = 'pop'; el.textContent = text; el.style.color = color; el.style.fontSize = size + 'px';
  $('pops').appendChild(el); pops.push({ el, w, x, y, z, life: 1, vz: vz == null ? w.drift * .25 : vz });
}
function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const q = pops[i]; q.life -= dt; q.y += 6 * dt; q.z += q.vz * dt;
    if (q.life <= 0) { q.el.remove(); pops.splice(i, 1); continue; }
    const [sx, sy, vis] = q.w.toScreen(q.x, q.y, q.z);
    q.el.style.opacity = vis ? Math.min(1, q.life * 2.5) : 0;
    q.el.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${1 + (1 - q.life) * .2})`;
  }
}
function clearFeedback() {
  for (const q of pops) q.el.remove(); pops.length = 0;
  hideBanner(); $('flash').style.opacity = 0; $('dmg').style.opacity = 0;
}

/* ================= audio ================= */
let AC = null, master = null, noiseBuf = null, muted = false, lastBoom = 0, droneGain = null, droneLvl = 0;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .45;
    const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    droneGain = AC.createGain(); droneGain.gain.value = 0;
    s.connect(f); f.connect(droneGain); droneGain.connect(master); s.start();
  } catch (e) { AC = null; }
}
function tone(f, dur, type, vol, f2, delay) {
  if (!AC || muted) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol, f, type, f2) {
  if (!AC || muted) return;
  const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf;
  const fl = AC.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(f2 || 50, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t, rand(0, 1)); s.stop(t + dur);
}
function boom(dur, vol, f) { const now = performance.now(); if (now - lastBoom < 35) return; lastBoom = now; noise(dur, vol, f); }
function drone(level) { droneLvl = level; if (droneGain) droneGain.gain.value = muted ? 0 : level; }
// A continuous voice a game can steer every frame (engine hum, fire roar). Returns {set(freq, vol), stop()}.
function voice(type, filterType, filterFreq) {
  if (!AC) return { set() {}, stop() {} };
  let src, g = AC.createGain(), fl = AC.createBiquadFilter();
  fl.type = filterType || 'lowpass'; fl.frequency.value = filterFreq || 800; g.gain.value = 0;
  if (type === 'noise') { src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true; }
  else { src = AC.createOscillator(); src.type = type || 'sawtooth'; }
  src.connect(fl); fl.connect(g); g.connect(master); src.start();
  return {
    set(freq, vol, ff) {
      const t = AC.currentTime;
      if (src.frequency && freq) src.frequency.setTargetAtTime(freq, t, .05);
      if (ff) fl.frequency.setTargetAtTime(ff, t, .05);
      g.gain.setTargetAtTime(muted ? 0 : vol, t, .05);
    },
    stop() { try { g.gain.value = 0; src.stop(); src.disconnect(); g.disconnect(); } catch (e) {} }
  };
}
const audio = {
  init: initAudio, tone, noise, boom, drone, voice,
  get muted() { return muted; },
  setMuted(m) { muted = m; if (droneGain) droneGain.gain.value = muted ? 0 : droneLvl; },
  toggle() { audio.setMuted(!muted); return muted; },
};

/* ================= storage ================= */
function best(id) { try { return +localStorage.getItem('sky-arcade-' + id) || 0; } catch (e) { return 0; } }
function saveBest(id, v) { try { localStorage.setItem('sky-arcade-' + id, String(v)); } catch (e) {} }

/* ================= model helpers ================= */
const GEO = ok ? {
  oct: new THREE.OctahedronGeometry(1, 0), box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 8), sph: new THREE.SphereGeometry(1, 16, 12), ico: new THREE.IcosahedronGeometry(1, 0),
  tet: new THREE.TetrahedronGeometry(1, 0),
} : {};
// flat shape in XZ plane (pts are [x, z]), extruded `depth` along Y
function wingGeo(pts, depth) {
  const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); g.rotateX(Math.PI / 2); return g;
}
// flat shape in ZY plane (pts are [z, y]), extruded along X
function finGeo(pts, depth) {
  const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); return g;
}
const M = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, metalness: .55, roughness: .42, flatShading: true, side: THREE.DoubleSide }, o || {}));
const E = color => new THREE.MeshBasicMaterial({ color });
function part(g, geo, mat, p, s, r) {
  const m = new THREE.Mesh(geo, mat);
  if (p) m.position.set(p[0], p[1], p[2]); if (s) m.scale.set(s[0], s[1], s[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
  g.add(m); return m;
}
const mirror = (g, geo, mat, p, s, r) => { const a = part(g, geo, mat, p, s, r); const q = p ? [-p[0], p[1], p[2]] : null, ss = s ? [-s[0], s[1], s[2]] : [-1, 1, 1], rr = r ? [r[0], -r[1], -r[2]] : null; const b = part(g, geo, mat, q, ss, rr); return [a, b]; };
function rockGeo(detail) {
  const g = new THREE.IcosahedronGeometry(1, detail == null ? 1 : detail), pos = g.attributes.position, map = {};
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = x.toFixed(3) + ',' + y.toFixed(3) + ',' + z.toFixed(3);
    const o = map[k] || (map[k] = [rand(-.28, .28), rand(-.2, .2), rand(-.28, .28)]);
    pos.setXYZ(i, x + o[0], y + o[1], z + o[2]);
  }
  g.computeVertexNormals(); return g;
}
function cloudTex() {
  const s = document.createElement('canvas'); s.width = s.height = 256; const g = s.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const a = rand(0, TAU), d = Math.sqrt(Math.random()) * 70, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * .55, r = rand(30, 58);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.42)'); gr.addColorStop(.6, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  return new THREE.CanvasTexture(s);
}
function enemyMats(g) { const list = []; g.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial && !list.includes(o.material)) list.push(o.material); }); return list; }
function disposeObject(obj) {
  obj.traverse(o => {
    if (o.isMesh && o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.dispose()); }
  });
}

return {
  ok, $, TAU, rand, pick, clamp, lerp, damp, reduceMotion,
  get W() { return W; }, get H() { return H; },
  getRenderer, createWorld, run, Pool, C, COL,
  showBanner, hideBanner, popText, clearFeedback,
  audio, best, saveBest,
  GEO, wingGeo, finGeo, M, E, part, mirror, rockGeo, cloudTex, enemyMats, disposeObject,
};
})();
