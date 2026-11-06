/* Aurora Strike — polar-night flight shooter. Module for Sky Arcade. */
(() => {
'use strict';
const GAMES = window.GAMES;

function buildPlayer(core) {
  const { GEO, M, E, part, mirror, wingGeo, finGeo } = core;
  const g = new THREE.Group();
  const metal = M(0xe2ecf8, { metalness: .7, roughness: .28 }), dark = M(0x1c2a44), accent = M(0x3dffb5, { emissive: 0x0f7a55 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b3b5c, emissive: 0x2aa8e0, emissiveIntensity: .55, metalness: .9, roughness: .1 });
  part(g, GEO.cyl, metal, [0, 0, 0], [.62, 6.2, .72], [Math.PI / 2, 0, 0]);
  part(g, GEO.cone, metal, [0, 0, -4.3], [.62, 2.4, .72], [-Math.PI / 2, 0, 0]);
  part(g, GEO.sph, glass, [0, .52, -1.8], [.46, .42, 1.35]);
  mirror(g, wingGeo([[.4, -1.3], [5.6, 1.5], [5.6, 2.3], [.4, 2.4]], .14), metal, [0, -.1, 0]);
  mirror(g, GEO.box, accent, [5.1, -.1, 1.9], [1, .2, .55]);
  mirror(g, wingGeo([[.3, 0], [2.5, 1.0], [2.5, 1.55], [.3, 1.45]], .1), metal, [0, 0, 2.0]);
  mirror(g, finGeo([[0, 0], [1.9, 0], [2.4, 1.8], [1.8, 1.8]], .1), dark, [.55, .35, 1.0], null, [0, 0, -.3]);
  mirror(g, GEO.cyl, dark, [.42, 0, 3.15], [.36, .7, .36], [Math.PI / 2, 0, 0]);
  mirror(g, GEO.sph, E(0x9ff6ff), [.42, 0, 3.5], [.27, .27, .12]);
  part(g, GEO.sph, E(0xff3355), [-5.6, -.1, 2.0], [.13, .13, .13]);
  part(g, GEO.sph, E(0x44ff99), [5.6, -.1, 2.0], [.13, .13, .13]);
  return g;
}

const TEMPLATE = `
<style>
#gameRoot #comboBar{width:96px;height:3px;background:rgba(255,255,255,.14);overflow:hidden}
#gameRoot #comboFill{height:100%;width:0;background:linear-gradient(90deg,var(--hot),var(--gold))}
#gameRoot #multRow{display:flex;align-items:center;gap:8px;height:18px}
#gameRoot #mult{font-size:15px;color:var(--gold);font-weight:700;min-width:34px}
#gameRoot #score{font-size:32px;line-height:1;font-weight:700}
#gameRoot #wpn{font-size:12px;color:var(--dim)}
#gameRoot #wpn i{font-style:normal;color:var(--ink)}
#gameRoot #shieldTag{color:var(--cyan)}
#gameRoot #retFar{width:34px;height:34px;margin:-17px 0 0 -17px}
#gameRoot #retNear{width:22px;height:22px;margin:-11px 0 0 -11px;opacity:.55}
@media (max-width:560px){#gameRoot #score{font-size:24px}}
</style>
<div class="ret" id="retNear" hidden><i></i><i></i><i></i><i></i></div>
<div class="ret" id="retFar" hidden><i></i><i></i><i></i><i></i></div>
<div class="hud tl" id="hudTL" hidden>
  <div class="lbl">SCORE</div>
  <div id="score" class="num">0</div>
  <div id="multRow"><span id="mult" class="num">×1</span><div id="comboBar"><div id="comboFill"></div></div></div>
</div>
<div class="hud tr" id="hudTR" hidden>
  <div class="row">
    <div class="stat"><span class="lbl">WAVE</span><b id="wave" class="num">1</b></div>
    <div class="stat"><span class="lbl">BEST</span><b id="best" class="num">0</b></div>
  </div>
  <div class="btns">
    <button class="mini" id="muteBtn" type="button">SOUND ON</button>
    <button class="mini" id="pauseBtn" type="button">PAUSE</button>
  </div>
</div>
<div class="hud bl" id="hudBL" hidden>
  <div class="lbl">HULL</div>
  <div class="pips" id="pips"><span></span><span></span><span></span><span></span><span></span></div>
  <div id="wpn">WEAPON <i id="wpnLv">Lv.1</i> <span id="shieldTag"></span></div>
</div>
<div class="hud br" id="hudBR" hidden>
  <button id="rollBtn" class="round" type="button" style="--tint:rgba(122,215,255,.3);--edge:rgba(122,215,255,.6);width:60px;height:60px"><span>ROLL</span></button>
  <button id="bombBtn" class="round" type="button" style="--tint:rgba(61,255,181,.32);--edge:rgba(61,255,181,.7);width:78px;height:78px"><span id="bombN" class="num">×2</span><small>BOMB</small></button>
</div>
<div class="bossbar" id="bossBar" hidden><span class="lbl">GLACIER FORTRESS “NIFLHEIM”</span><div class="bosstrack"><div class="bossfill" id="bossFill"></div></div></div>

<div class="screen bottom" id="titleScr">
  <div class="card">
    <div class="kicker">POLAR NIGHT WING · 북위 78°</div>
    <h1>AURORA<span>STRIKE</span></h1>
    <p class="sub">오로라가 흐르는 극야의 얼음 바다. 빙산 사이로 적 편대가 밀려옵니다. 마지막 요격기로 북쪽 하늘을 지키세요.</p>
    <button class="go" id="startBtn" type="button">출격하기</button>
    <div class="keys">
      <span><kbd>마우스</kbd> <kbd>드래그</kbd> <kbd>WASD</kbd></span><span>기체 이동 · 사격은 자동</span>
      <span><kbd>SHIFT</kbd> <kbd>E</kbd></span><span>배럴 롤 (잠시 무적 회피)</span>
      <span><kbd>SPACE</kbd> <kbd>B</kbd></span><span>폭탄 (탄막 전부 제거)</span>
      <span><kbd>P</kbd> <kbd>M</kbd></span><span>일시정지 · 소리</span>
    </div>
    <div class="legend"><span><b style="background:#ffb347"></b>무기 강화</span><span><b style="background:#7ad7ff"></b>실드</span><span><b style="background:#ff5f8a"></b>폭탄 +1</span></div>
    <button class="mini" data-exit type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="pauseScr" hidden>
  <div class="card">
    <div class="kicker">PAUSED</div>
    <p class="over-title" style="color:var(--ink);text-shadow:none">일시정지</p>
    <button class="go" id="resumeBtn" type="button">계속하기</button>
    <button class="mini" data-exit type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="overScr" hidden>
  <div class="card">
    <div class="kicker">MISSION FAILED</div>
    <p class="over-title">격추됨</p>
    <div class="result">
      <div><span class="lbl">SCORE</span><b id="finalScore">0</b></div>
      <div><span class="lbl">WAVE</span><b id="finalWave">1</b></div>
    </div>
    <div class="newbest" id="newBest" hidden>NEW BEST RECORD</div>
    <button class="go" id="againBtn" type="button">다시 출격</button>
    <button class="mini" data-exit type="button">◀ 게임 선택</button>
  </div>
</div>`;

GAMES.aurora = {
  id: 'aurora', title: 'Aurora Strike',
  model: buildPlayer,
  mount(root, core, api) {
const { $, TAU, rand, pick, clamp, lerp, damp, GEO, M, E, part, mirror, wingGeo, C, COL } = core;
const { tone, noise, boom } = core.audio;
root.innerHTML = TEMPLATE;
root.style.setProperty('--hot', '#3dffb5'); root.style.setProperty('--cyan', '#7ad7ff'); root.style.setProperty('--gold', '#ffe27a');
const ac = new AbortController(), sig = { signal: ac.signal };
const cv = $('c');
const S_WORLD = 160;
const w = core.createWorld({ fog: 0x0e2238, fogNear: 140, fogFar: 1050, fov: 66, drift: S_WORLD, bloom: [.85, .5, .78] });
const { scene, camera, fx } = w;
const { glowP, sparks, ring, explode } = w;
const FX = w.FX, SMOKE = w.SMOKE;
const shake = w.shake, flash = w.flash;
const SUN = new THREE.Vector3(-.5, .2, -1).normalize(); // moon

scene.add(new THREE.HemisphereLight(0x7fb4ff, 0x081428, .9));
const sunL = new THREE.DirectionalLight(0xcfe2ff, 1.6); sunL.position.copy(SUN).multiplyScalar(100); scene.add(sunL);
const fillL = new THREE.DirectionalLight(0x3dffb5, .55); fillL.position.set(.3, 1, 1); scene.add(fillL);

/* ---------- sky: polar night with moving aurora ---------- */
const skyU = { sunDir: { value: SUN }, time: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform vec3 sunDir; uniform float time; varying vec3 vD;
  float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x), f.y); }
  void main(){
    float h = vD.y;
    vec3 zen = vec3(.008,.015,.05), mid = vec3(.03,.08,.16), hor = vec3(.07,.16,.25);
    vec3 c = mix(hor, mid, smoothstep(.0,.14,h));
    c = mix(c, zen, smoothstep(.1,.6,h));
    c = mix(c, hor*.6, smoothstep(.0,-.08,h));
    float az = atan(vD.x, -vD.z);
    vec3 au = vec3(0.);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float band = .2 + fi*.09 + sin(az*2.3 + time*.17 + fi*1.7)*.05 + n2(vec2(az*3.+fi*5., time*.08))*.05;
      float d = h - band;
      float curtain = smoothstep(-.015, .0, d) * exp(-max(d,0.)*(9.+fi*3.));
      float rays = .45 + .55*n2(vec2(az*55. + fi*13., time*.6 + fi));
      float flick = .6 + .4*sin(az*7. - time*.9 + fi*2.);
      vec3 col = mix(vec3(.15,1.,.6), vec3(.45,.35,1.), smoothstep(.0,.16,max(d,0.)) + fi*.18);
      au += col * curtain * rays * flick * (.55 - fi*.12);
    }
    au *= smoothstep(.02, .14, h) * smoothstep(-.1, .5, -vD.z + .4);
    c += au * .62;
    float s = max(dot(vD, sunDir), 0.);
    c += vec3(.5,.7,1.)*pow(s,24.)*.25 + vec3(.7,.85,1.)*pow(s,400.)*.5;
    c += smoothstep(.99955,.9997,s)*vec3(1.25,1.3,1.35);
    float st = step(.997, hash(floor(vD*460.))) * smoothstep(.12,.5,h);
    st *= .55 + .45*sin(time*3. + hash(floor(vD*460.)+3.)*40.);
    c += st*.75;
    gl_FragColor = vec4(c,1.);
  }`
}));
scene.add(sky);

/* ---------- icy sea ---------- */
const oceanU = { time: { value: 0 }, scroll: { value: 0 }, sunDir: { value: SUN }, fogColor: { value: w.fogColor }, fogNear: { value: 160 }, fogFar: { value: 1150 } };
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.ShaderMaterial({
  uniforms: oceanU, fog: false,
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float time, scroll, fogNear, fogFar; uniform vec3 sunDir, fogColor; varying vec3 vW;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float H(vec2 p){ return noise(p+time*.12)*.55 + noise(p*2.3-time*.18)*.3 + noise(p*5.7+vec2(time*.35,0.))*.15; }
  void main(){
    vec2 p = vec2(vW.x, vW.z - scroll) * .045;
    float h0 = H(p), hx = H(p+vec2(.04,0.)), hz = H(p+vec2(0.,.04));
    vec3 N = normalize(vec3((h0-hx)*5., 1., (h0-hz)*5.));
    vec3 V = normalize(cameraPosition - vW);
    float fr = pow(1.-max(dot(N,V),0.), 4.);
    vec3 deep = vec3(.006,.025,.06);
    vec3 skyR = mix(vec3(.04,.12,.2), vec3(.12,.5,.42), clamp(fr*1.4,0.,1.));
    vec3 c = mix(deep, skyR, .1 + fr*.75);
    vec3 R = reflect(-V, N);
    float sp = pow(max(dot(R, sunDir),0.), 160.);
    c += vec3(.75,.88,1.)*sp*2.2;
    c += vec3(.4,.6,1.)*pow(max(dot(R,sunDir),0.),14.)*.12;
    vec2 q = vec2(vW.x, vW.z - scroll) * .011;
    float n = noise(q) * .7 + noise(q*3.1) * .3;
    float ice = smoothstep(.6, .64, n);
    float edge = ice - smoothstep(.64, .7, n);
    c = mix(c, vec3(.32,.45,.58) + N.x*.08, ice * .85);
    c += vec3(.4,.9,1.) * edge * .25;
    float d = length(vW.xz - cameraPosition.xz);
    c = mix(c, fogColor, smoothstep(fogNear, fogFar, d));
    gl_FragColor = vec4(c,1.);
  }`
}));
ocean.rotation.x = -Math.PI / 2; ocean.position.y = -22; scene.add(ocean);

/* ---------- icebergs, clouds, speed lines, snow ---------- */
const rockGeos = [core.rockGeo(), core.rockGeo(), core.rockGeo(), core.rockGeo()];
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8fb6d8, emissive: 0x0c2236, roughness: .45, metalness: .15, flatShading: true });
const rockCap = new THREE.MeshStandardMaterial({ color: 0xdff0ff, emissive: 0x16334a, roughness: .35, metalness: .1, flatShading: true });
const rocks = [];
function placeRock(r, z) {
  const side = Math.random() < .5 ? -1 : 1, mid = Math.random() < .14;
  const sx = rand(14, 36), sy = mid ? rand(4, 9) : rand(30, 120), sz = rand(14, 36);
  r.m.scale.set(mid ? sx * .6 : sx, sy, mid ? sz * .6 : sz);
  r.m.position.set(mid ? rand(-50, 50) : side * rand(75, 280), -22, z);
  r.m.rotation.y = rand(0, TAU);
}
for (let i = 0; i < 46; i++) {
  const m = new THREE.Mesh(pick(rockGeos), Math.random() < .3 ? rockCap : rockMat);
  const r = { m }; placeRock(r, rand(-1200, 0)); scene.add(m); rocks.push(r);
}
const cloudTexes = [core.cloudTex(), core.cloudTex(), core.cloudTex()];
const clouds = [];
function placeCloud(c, z) {
  const near = Math.random() < .35;
  c.s.position.set(rand(-1, 1) * (near ? 60 : 420), near ? rand(-8, 34) : rand(-16, 70), z);
  const sc = near ? rand(40, 80) : rand(90, 220); c.s.scale.set(sc, sc * .55, 1);
  c.s.material.opacity = near ? rand(.25, .45) : rand(.35, .6);
}
for (let i = 0; i < 44; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pick(cloudTexes), color: pick([0x5f7fa8, 0x4a6a96, 0x6fa8a0, 0x7a86b8]), transparent: true, depthWrite: false, fog: true }));
  const c = { s }; placeCloud(c, rand(-1300, 40)); scene.add(s); clouds.push(c);
}
const SL = 90, slPos = new Float32Array(SL * 6), slData = [];
const slGeo = new THREE.BufferGeometry(); slGeo.setAttribute('position', new THREE.BufferAttribute(slPos, 3).setUsage(THREE.DynamicDrawUsage));
const slMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const speedLines = new THREE.LineSegments(slGeo, slMat); speedLines.frustumCulled = false; scene.add(speedLines);
for (let i = 0; i < SL; i++) slData.push({ x: 0, y: 0, z: rand(-300, 30), l: rand(6, 16) });
function placeSL(d) { const a = rand(0, TAU), r = rand(12, 55); d.x = Math.cos(a) * r; d.y = Math.sin(a) * r * .7 + 10; d.z = rand(-320, -200); }
slData.forEach(placeSL); slData.forEach(d => d.z = rand(-300, 30));
const SN = 1400, snPos = new Float32Array(SN * 3), snDrift = new Float32Array(SN);
for (let i = 0; i < SN; i++) { snPos[i * 3] = rand(-120, 120); snPos[i * 3 + 1] = rand(-20, 70); snPos[i * 3 + 2] = rand(-400, 40); snDrift[i] = rand(0, TAU); }
const snGeo = new THREE.BufferGeometry(); snGeo.setAttribute('position', new THREE.BufferAttribute(snPos, 3).setUsage(THREE.DynamicDrawUsage));
const snow = new THREE.Points(snGeo, new THREE.PointsMaterial({ color: 0xdff2ff, size: .32, transparent: true, opacity: .7, depthWrite: false, fog: true }));
snow.frustumCulled = false; scene.add(snow);
function updateSnow(dt) {
  const cx = camera.position.x;
  for (let i = 0; i < SN; i++) {
    const o = i * 3;
    snPos[o] += Math.sin(T * .8 + snDrift[i]) * 3 * dt; snPos[o + 1] -= 5 * dt; snPos[o + 2] += S_WORLD * 1.15 * dt;
    if (snPos[o + 2] > 40 || snPos[o + 1] < -22) { snPos[o] = cx + rand(-120, 120); snPos[o + 1] = rand(-15, 70); snPos[o + 2] = rand(-420, -300); }
  }
  snGeo.attributes.position.needsUpdate = true;
}

/* ---------- models ---------- */
const WG = {
  fWing: wingGeo([[.3, .7], [4.4, -.9], [4.6, -1.8], [.3, -.8]], .14),
  dWing: wingGeo([[.2, 2.2], [4.8, -1.6], [4.8, -2.4], [.2, -2.6]], .12),
  gWing: wingGeo([[2, 3], [9, 0], [9, -2.5], [2, -2]], .4),
  bWing: wingGeo([[4, 8], [30, -2], [34, -9], [30, -11], [4, -6]], .9),
  pFin: core.finGeo([[0, 0], [1.9, 0], [2.4, 1.8], [1.8, 1.8]], .1),
};
function buildFighter() {
  const g = new THREE.Group();
  const hull = M(0x5a1530, { metalness: .6, roughness: .35 }), dark = M(0x1d0d1a);
  part(g, GEO.oct, hull, null, [1.1, .7, 2.7]);
  mirror(g, WG.fWing, dark, [0, 0, -.2]);
  mirror(g, GEO.box, E(0xff3d7f), [3.2, .1, -.5], [2.2, .08, .18], [0, .35, 0]);
  part(g, GEO.sph, E(0xffc6dc), [0, .15, 2.2], [.34, .25, .34]);
  part(g, GEO.sph, E(0xff3d7f), [0, 0, -2.5], [.5, .5, .3]);
  return g;
}
function buildDart() {
  const g = new THREE.Group();
  const hull = M(0x3b1d6e, { metalness: .65, roughness: .3 }), dark = M(0x150a28);
  part(g, GEO.cone, hull, [0, 0, .8], [.7, 6, .55], [Math.PI / 2, 0, 0]);
  mirror(g, WG.dWing, dark, [0, -.1, -.4]);
  mirror(g, GEO.box, E(0xc77dff), [3.0, 0, -1.6], [3.4, .08, .14], [0, -.62, 0]);
  mirror(g, WG.pFin, hull, [.3, .2, -2.2], [1, .8, 1], [0, Math.PI, .25]);
  part(g, GEO.sph, E(0xd99bff), [0, 0, -2.4], [.55, .55, .3]);
  return g;
}
function buildGun() {
  const g = new THREE.Group();
  const steel = M(0x3a4566, { metalness: .7, roughness: .35 }), dark = M(0x141a2c), orange = M(0xff9a4a, { emissive: 0x8a3a00 });
  part(g, GEO.box, steel, [0, 0, 0], [4.6, 2.2, 10]);
  part(g, GEO.box, dark, [0, 1.2, -1], [2.6, 1, 5.5]);
  part(g, GEO.cone, steel, [0, 0, 6.2], [2.3, 2.6, 1.1], [Math.PI / 2, 0, 0]);
  mirror(g, WG.gWing, dark, [0, 0, 0]);
  mirror(g, GEO.cyl, steel, [7.6, 0, 0], [1.2, 7, 1.2], [Math.PI / 2, 0, 0]);
  mirror(g, GEO.sph, E(0xffa04a), [7.6, 0, -3.6], [.9, .9, .4]);
  mirror(g, GEO.box, E(0xffb060), [2.35, .2, 2], [.1, .2, 5]);
  mirror(g, GEO.sph, orange, [1.6, 1.6, 2.5], [.7, .7, .7]);
  part(g, GEO.sph, E(0xffd29a), [0, 0, 6.8], [.5, .5, .5]);
  return g;
}
function buildBoss() {
  const g = new THREE.Group();
  const armor = M(0x2b3550, { metalness: .75, roughness: .32 }), dark = M(0x0f1424), plate = M(0x8fb0cc, { metalness: .4, roughness: .3 }), orange = M(0xff5e3a, { emissive: 0x8a1e00 });
  part(g, GEO.cyl, armor, [0, 0, 0], [5.2, 34, 4.4], [Math.PI / 2, 0, 0]);
  part(g, GEO.cone, armor, [0, 0, 20.5], [5.2, 7, 4.4], [Math.PI / 2, 0, 0]);
  part(g, GEO.box, plate, [0, 4, -2], [6, 3, 18]);
  part(g, GEO.box, dark, [0, 5.6, -6], [3, 2.4, 6]);
  mirror(g, WG.bWing, dark, [0, -.5, 0]);
  mirror(g, WG.gWing, plate, [3, 1.5, -12], [1.4, 1, 1.2]);
  for (const x of [12, 22]) {
    mirror(g, GEO.cyl, armor, [x, -1.5, -3], [2, 12, 2], [Math.PI / 2, 0, 0]);
    mirror(g, GEO.sph, E(0xff7a3a), [x, -1.5, -9.2], [1.7, 1.7, .6]);
  }
  for (let i = 0; i < 6; i++) mirror(g, GEO.box, E(0x9ff6ff), [6 + i * 4, .1, 3.5 - i * 1.3], [1.6, .25, .35]);
  mirror(g, GEO.sph, orange, [4, 3.2, 8], [1.6, 1.6, 1.6]);
  mirror(g, GEO.sph, orange, [17, .8, -1], [1.3, 1.3, 1.3]);
  const core_ = part(g, GEO.sph, E(0xff8a4a), [0, -1.4, 15], [2.8, 2.8, 2.8]);
  const shell = part(g, GEO.ico, new THREE.MeshBasicMaterial({ color: 0xff3d6e, wireframe: true, transparent: true, opacity: .6 }), [0, -1.4, 15], [4.2, 4.2, 4.2]);
  g.userData.core = core_; g.userData.shell = shell;
  return g;
}
const BUILD = { fighter: buildFighter, dart: buildDart, gun: buildGun, boss: buildBoss };
const player = buildPlayer(core); scene.add(player);

/* ---------- bullets ---------- */
const PB_MAX = 500, EB_MAX = 800;
const pbMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.22, .22, 5.5), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), PB_MAX);
const ebMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.85, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), EB_MAX);
pbMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ebMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pbMesh.frustumCulled = ebMesh.frustumCulled = false;
const _c = new THREE.Color(1, 1, 1);
for (let i = 0; i < PB_MAX; i++) pbMesh.setColorAt(i, _c);
for (let i = 0; i < EB_MAX; i++) ebMesh.setColorAt(i, _c);
scene.add(pbMesh, ebMesh);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

/* ---------- sfx ---------- */
const sfx = {
  shoot: () => tone(rand(780, 860), .05, 'triangle', .028, 380),
  hit: () => tone(1500, .03, 'square', .018, 900),
  pop: () => { boom(.45, .38, 2400); tone(170, .22, 'sawtooth', .05, 55); },
  big: () => { boom(1.2, .75, 1600); tone(80, .7, 'sawtooth', .12, 28); },
  hurt: () => { boom(.45, .55, 700); tone(280, .3, 'square', .08, 70); },
  power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .12, 'square', .045, 0, i * .06)),
  bomb: () => { boom(1.8, .9, 3200); tone(55, 1.4, 'sine', .32, 22); },
  warn: () => [0, .4, .8, 1.2].forEach(d => tone(440, .28, 'sawtooth', .07, 330, d)),
  whoosh: () => noise(.7, .25, 300, 'bandpass', 3000),
  roll: () => noise(.45, .18, 2400, 'bandpass', 400),
  enemyShot: () => tone(rand(300, 340), .08, 'sawtooth', .02, 160),
};

/* ---------- state ---------- */
const p = { x: 0, y: 10, z: 0, tx: 0, ty: 10, vx: 0, vy: 0, roll: 0, pitch: 0, hp: 5, inv: 0, shield: 0, level: 1, bombs: 2, fireT: 0, misT: 0, alive: true, rollT: 0, rollCd: 0, rollDir: 1 };
const BX = 27, BY0 = -1, BY1 = 25;
let state = 'title', paused = false, T = 0, camBlend = 0;
let enemies = [], pBullets = [], eBullets = [], missiles = [], pickups = [];
let score = 0, best = core.best('aurora'), combo = 0, comboT = 0, mult = 1;
let wave = 1, waveT = 0, spawnT = 2, bossActive = false, deadT = 0, scroll = 0;
const timers = [];
const later = (fn, ms) => timers.push(setTimeout(() => { if (!ac.signal.aborted) fn(); }, ms));

/* ---------- enemies ---------- */
const DEFS = {
  fighter: { hp: 3, r: 3.0, score: 100, ex: 1.2, col: COL.pink },
  dart: { hp: 5, r: 3.2, score: 250, ex: 1.4, col: COL.purple },
  gun: { hp: 46, r: 7.5, score: 1800, ex: 3, col: COL.amber },
  boss: { hp: 1600, r: 17, score: 40000, ex: 6, col: COL.red },
};
function diff() { return 1 + (wave - 1) * .14; }
function addEnemy(kind, o) {
  const d = DEFS[kind], scale = kind === 'boss' ? 1 + (wave / 5 - 1) * .5 : 1 + (wave - 1) * .1;
  const mesh = BUILD[kind]();
  const e = Object.assign({ kind, x: 0, y: 10, z: -700, x0: 0, y0: 0, vx: 0, vy: 0, vz: 0, t: 0, d: 0, flash: 0, amp: 0, f: 0, ph: rand(0, TAU), fireT: rand(1.2, 2.6), hp: d.hp * scale, r: d.r, score: d.score, mode: 'run', mesh, mats: core.enemyMats(mesh), yaw: 0 }, o || {});
  e.x0 = e.x; e.y0 = e.y; e.maxHp = e.hp;
  mesh.position.set(e.x, e.y, e.z); mesh.visible = e.d <= 0;
  scene.add(mesh); enemies.push(e); return e;
}
function removeEnemy(e) { scene.remove(e.mesh); core.disposeObject(e.mesh); }
function eShot(x, y, z, vx, vy, vz, col, r) { if (eBullets.length < EB_MAX) eBullets.push({ x, y, z, vx, vy, vz, c: col || COL.pink, r: r || 1, t: 0 }); }
function aimShot(e, sp, n, spread, col) {
  n = n || 1; spread = spread || 0;
  const dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z, L = Math.hypot(dx, dy, dz) || 1;
  const yaw = Math.atan2(dx, dz), pit = Math.asin(dy / L);
  for (let i = 0; i < n; i++) {
    const a = yaw + (i - (n - 1) / 2) * spread;
    eShot(e.x, e.y, e.z + e.r * .6, Math.sin(a) * Math.cos(pit) * sp, Math.sin(pit) * sp, Math.cos(a) * Math.cos(pit) * sp, col);
  }
  glowP(e.x, e.y, e.z + e.r * .6, 0, 0, e.vz, .12, 5, 8, col || COL.pink, 1);
  sfx.enemyShot();
}
function ringShot(e, n, sp, radial, off, col) {
  const dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z, L = Math.hypot(dx, dy, dz) || 1;
  for (let i = 0; i < n; i++) { const a = off + i / n * TAU; eShot(e.x, e.y, e.z, dx / L * sp + Math.cos(a) * radial, dy / L * sp + Math.sin(a) * radial, dz / L * sp, col); }
  ring(e.x, e.y, e.z, 1, 10, .4, 0xffa04a, 0);
}
function spawnFormation() {
  const opts = ['line', 'v', 'weave', 'hover'];
  if (wave >= 2) opts.push('swoop', 'gun');
  if (wave >= 3) opts.push('swoop', 'hover', 'v');
  if (wave >= 4) opts.push('gun', 'weave');
  const f = pick(opts), vz = 95 * (1 + wave * .03);
  if (f === 'line') {
    const y = rand(3, 21);
    for (let i = 0; i < 5; i++) addEnemy('fighter', { x: (i - 2) * 8, y, z: -760, vz, d: i * .1, amp: 3, f: 2 });
  } else if (f === 'v') {
    const cx = rand(-12, 12), cy = rand(5, 19);
    for (let i = 0; i < 7; i++) { const k = i - 3; addEnemy('fighter', { x: cx + k * 5.5, y: cy + Math.abs(k) * 1.2, z: -760 - Math.abs(k) * 20, vz: vz * 1.1 }); }
  } else if (f === 'weave') {
    const x = rand(-10, 10), y = rand(6, 18);
    for (let i = 0; i < 8; i++) addEnemy('fighter', { x, y, z: -760, vz: vz * 1.15, d: i * .2, amp: 15, f: 1.5, ph: 0 });
  } else if (f === 'hover') {
    const n = 2 + Math.min(2, wave >> 1);
    for (let i = 0; i < n; i++) addEnemy('fighter', { mode: 'hover', x: rand(-22, 22), y: rand(2, 22), z: -760, d: i * .35, holdZ: rand(-190, -130) });
  } else if (f === 'swoop') {
    const side = Math.random() < .5 ? -1 : 1, n = 3 + Math.min(2, wave >> 2);
    for (let i = 0; i < n; i++) addEnemy('dart', { mode: 'overtake', x: side * rand(26, 34), y: rand(0, 22), z: 45, vz: -190, d: i * .32, tx: rand(-18, 18), ty: rand(2, 22), holdZ: rand(-200, -140), yaw: Math.PI });
    later(() => sfx.whoosh(), 100);
  } else {
    addEnemy('gun', { mode: 'hold', x: rand(-14, 14), y: rand(8, 18), z: -900, holdZ: rand(-300, -250) });
  }
}
function startBoss() {
  bossActive = true;
  core.showBanner('WARNING', '빙하요새 니플헤임 부상 중', '#ff3d6e', true);
  sfx.warn();
  addEnemy('boss', { mode: 'boss', x: 0, y: 14, z: -1100, holdZ: -250, d: 1.5, spinA: 0, burstT: 3, ringT: 4 });
}
function updateEnemy(e, dt) {
  if (e.d > 0) { e.d -= dt; if (e.d <= 0) e.mesh.visible = true; return; }
  e.t += dt; if (e.flash > 0) e.flash -= dt;
  const px = e.x, py = e.y, pz = e.z, dif = diff();
  const canShoot = p.alive && state === 'play' && e.z < -40 && e.z > -560;
  if (e.kind === 'fighter' && e.mode === 'run') {
    e.z += e.vz * dt; e.x = e.x0 + Math.sin(e.t * e.f + e.ph) * e.amp; e.y = e.y0 + Math.cos(e.t * e.f * .7 + e.ph) * e.amp * .35;
    if (!e.s1 && e.z > -330) { e.s1 = 1; if (canShoot && Math.random() < .35 + wave * .08) aimShot(e, 90 * Math.sqrt(dif)); }
    if (!e.s2 && e.z > -170 && wave >= 3) { e.s2 = 1; if (canShoot && Math.random() < .4) aimShot(e, 100 * Math.sqrt(dif)); }
  } else if (e.mode === 'hover') {
    e.z += (e.holdZ - e.z) * damp(1.1, dt);
    e.x = e.x0 + Math.sin(e.t * .8 + e.ph) * 9; e.y = clamp(e.y0 + Math.sin(e.t * 1.1 + e.ph) * 4, 0, 26);
    e.fireT -= dt;
    if (e.fireT <= 0 && e.t > 1.2) { e.fireT = rand(1.4, 2.4) / dif; if (canShoot) aimShot(e, 95 * Math.sqrt(dif), wave >= 4 ? 3 : 1, .06, e.kind === 'dart' ? COL.purple : COL.pink); }
    if (e.t > 8) { e.y0 += 40 * dt * (e.t - 8) * 2; e.z -= 50 * dt; }
    e.yaw += (0 - e.yaw) * damp(3, dt);
  } else if (e.mode === 'overtake') {
    e.z += e.vz * dt; e.vz += 70 * dt;
    e.x += (e.tx - e.x) * damp(1.4, dt); e.y += (e.ty - e.y) * damp(1.4, dt);
    if (e.z < e.holdZ || e.vz > -30) { e.mode = 'hover'; e.t = 0; e.x0 = e.x; e.y0 = e.y; e.holdZ = e.z; e.ph = -Math.PI / 2; }
  } else if (e.mode === 'hold') {
    e.z += (e.holdZ - e.z) * damp(.7, dt);
    e.x = e.x0 + Math.sin(e.t * .4) * 12; e.y = e.y0 + Math.sin(e.t * .6) * 3;
    e.fireT -= dt;
    if (e.fireT <= 0 && e.t > 2.5) {
      e.fireT = 2.7 / Math.sqrt(dif);
      if (canShoot) { ringShot(e, 14 + Math.min(10, wave), 78, 5.5, e.t, COL.amber); noise(.3, .12, 1800); }
      if (canShoot && wave >= 3) later(() => { if (!e.dead) aimShot(e, 100, 3, .08, COL.amber); }, 700);
    }
    if (e.t > 18) e.holdZ = -1000;
    if (e.t > 19 && e.z < -900) e.gone = true;
  } else if (e.mode === 'boss') updateBoss(e, dt);
  e.vx = (e.x - px) / Math.max(dt, 1e-4); e.vy = (e.y - py) / Math.max(dt, 1e-4); e.cvz = (e.z - pz) / Math.max(dt, 1e-4);
  const m = e.mesh; m.position.set(e.x, e.y, e.z);
  if (e.kind !== 'boss') m.rotation.set(clamp(-e.vy * .02, -.5, .5), e.yaw + clamp(e.vx * .006, -.4, .4), clamp(-e.vx * .03, -1, 1));
  if (e.kind !== 'boss' && Math.random() < .6) {
    const back = e.mode === 'overtake' ? 1 : -1;
    glowP(e.x, e.y, e.z + back * e.r * .9, rand(-.5, .5), rand(-.5, .5), e.cvz * .5 + back * 10, .25, e.kind === 'gun' ? 3 : 1.6, .3, DEFS[e.kind].col, .8);
  }
  if (e.flash > 0 || e.flashOn) {
    const k = Math.max(0, e.flash) * 16; e.flashOn = e.flash > 0;
    for (const mt of e.mats) mt.emissive.setRGB(k, k, k);
  }
  if (e.z > 70 || e.y > 95 || e.z < -1200) e.gone = true;
}
function updateBoss(e, dt) {
  const m = e.mesh;
  if (e.dying > 0) {
    e.dying -= dt; e.chainT = (e.chainT || 0) - dt; e.z += 6 * dt; e.y -= 4 * dt;
    m.rotation.z += dt * .25; m.position.set(e.x + rand(-.4, .4), e.y, e.z);
    if (e.chainT <= 0) { e.chainT = .1; explode(e.x + rand(-28, 28), e.y + rand(-4, 6), e.z + rand(-14, 16), rand(1.4, 2.4), COL.red); sfx.pop(); }
    if (e.dying <= 0) finishBoss(e);
    return;
  }
  e.z += (e.holdZ - e.z) * damp(.55, dt);
  e.x = Math.sin(e.t * .32) * 16; e.y = 14 + Math.sin(e.t * .5) * 4;
  m.rotation.set(Math.sin(e.t * .4) * .04, 0, -Math.cos(e.t * .32) * .12);
  const cr = m.userData.core, shell = m.userData.shell, rage = e.hp / e.maxHp < .5;
  const pulse = 1 + Math.sin(T * (rage ? 14 : 6)) * .12;
  cr.scale.setScalar(2.8 * pulse); cr.material.color.setHex(rage ? 0xff3d6e : 0xff8a4a);
  shell.rotation.x += dt; shell.rotation.y += dt * 1.4;
  if (e.t < 5 || !p.alive) { if (e.t < 5) shake(.012); return; }
  const cz = e.z + 15;
  e.spinA += dt * (rage ? 2.6 : 1.7);
  e.fireT -= dt;
  if (e.fireT <= 0) {
    e.fireT = rage ? .085 : .12;
    const arms = rage ? 4 : 3, rr = 4 + 7 * Math.abs(Math.sin(T * .7));
    for (let k = 0; k < arms; k++) { const a = e.spinA + k / arms * TAU; eShot(e.x, e.y - 1.4, cz, Math.cos(a) * rr, Math.sin(a) * rr, 72, COL.gold, 1.05); }
  }
  e.burstT -= dt;
  if (e.burstT <= 0) { e.burstT = rage ? 1.6 : 2.4; aimShot({ x: e.x, y: e.y - 1.4, z: cz, r: 0, vz: 0 }, 115, rage ? 7 : 5, .05, COL.pink); }
  if (rage) {
    e.ringT -= dt;
    if (e.ringT <= 0) { e.ringT = 3; ringShot({ x: e.x, y: e.y, z: cz }, 26, 70, 9, e.t, COL.red); noise(.5, .25, 1200); }
  }
}
function damage(e, dmg) {
  if (e.dying > 0 || e.dead || e.d > 0) return;
  e.hp -= dmg; e.flash = .06;
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  if (e.kind === 'boss') {
    e.dying = 2.6; e.hp = 0;
    for (const b of eBullets) sparks(b.x, b.y, b.z, b.c, 2, 10);
    eBullets.length = 0; flash(.4); shake(.6);
    return;
  }
  e.dead = true;
  explode(e.x, e.y, e.z, DEFS[e.kind].ex, DEFS[e.kind].col, e.cvz || 0);
  if (e.kind === 'gun') { sfx.big(); fx.hitStop = Math.max(fx.hitStop, .06); flash(.18); } else sfx.pop();
  addScore(e.score, e.x, e.y, e.z);
  const ch = e.kind === 'gun' ? 1 : e.kind === 'dart' ? .08 : .04;
  if (Math.random() < ch) dropPickup(e.x, e.y, e.z);
}
function finishBoss(e) {
  e.dead = true;
  explode(e.x, e.y, e.z, 7, COL.red); explode(e.x - 18, e.y, e.z - 4, 3.5); explode(e.x + 18, e.y, e.z - 4, 3.5);
  sfx.big(); sfx.bomb();
  flash(1); fx.hitStop = .14; fx.slowT = 1.6; shake(1); fx.fovKick = 14;
  addScore(e.score, e.x, e.y, e.z);
  for (let i = 0; i < 3; i++) dropPickup(e.x + (i - 1) * 8, e.y, e.z + 20, i === 1 ? 'P' : null);
  bossActive = false; waveT = 0; spawnT = 3.5;
  later(() => { if (state === 'play') { wave++; core.showBanner('WAVE ' + wave, '빙하요새 붕괴 · 다음 편대 진입', '#ffe27a'); } }, 1700);
}
function addScore(base, x, y, z) {
  combo++; comboT = 2.6; mult = Math.min(8, 1 + Math.floor(combo / 6));
  const pts = base * mult; score += pts;
  core.popText(w, x, y + 2, z, '+' + pts.toLocaleString(), mult > 1 ? '#ffe27a' : '#eaf6ff', mult > 1 ? 17 : 14);
}

/* ---------- pickups ---------- */
const PK = { P: { c: 0xffb347 }, S: { c: 0x7ad7ff }, B: { c: 0xff5f8a } };
function dropPickup(x, y, z, type) {
  if (!type) { const r = Math.random(); type = r < .55 ? 'P' : r < .8 ? 'S' : 'B'; }
  const g = new THREE.Group();
  part(g, GEO.oct, E(PK[type].c), null, [1.3, 1.8, 1.3]);
  part(g, GEO.ico, new THREE.MeshBasicMaterial({ color: PK[type].c, wireframe: true, transparent: true, opacity: .7 }), null, [2.6, 2.6, 2.6]);
  g.position.set(x, y, z); scene.add(g);
  pickups.push({ x, y: clamp(y, 1, 24), z, type, t: 0, mesh: g });
}
function collect(k) {
  const c = C(PK[k.type].c);
  ring(k.x, k.y, k.z, 1, 12, .45, PK[k.type].c, 0); sparks(k.x, k.y, k.z, c, 24, 22);
  sfx.power();
  if (k.type === 'P') {
    if (p.level < 5) { p.level++; core.popText(w, p.x, p.y + 4, p.z, 'POWER UP Lv.' + p.level, '#ffb347', 17); }
    else { score += 5000; core.popText(w, p.x, p.y + 4, p.z, '+5,000', '#ffb347', 17); }
  } else if (k.type === 'S') { p.shield = 1; core.popText(w, p.x, p.y + 4, p.z, 'SHIELD', '#7ad7ff', 17); }
  else { p.bombs = Math.min(5, p.bombs + 1); core.popText(w, p.x, p.y + 4, p.z, 'BOMB +1', '#ff5f8a', 17); }
}

/* ---------- player actions ---------- */
const shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(7, 2), new THREE.MeshBasicMaterial({ color: 0x7ad7ff, wireframe: true, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
shieldMesh.visible = false; scene.add(shieldMesh);
const bombSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0x9fffe0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, wireframe: true }));
scene.add(bombSphere); let bombT = 0;

function shot(x, y, z, vx, vy, vz, dmg, col) { if (pBullets.length < PB_MAX) pBullets.push({ x, y, z, px: x, py: y, pz: z, vx, vy, vz, dmg: dmg || 1, c: col || COL.cyan }); }
function fire() {
  const L = p.level, x = p.x, y = p.y - .1, z = p.z - 3, sp = -460;
  shot(x - .9, y, z, 0, 0, sp); shot(x + .9, y, z, 0, 0, sp);
  if (L >= 2) { shot(x - 2.4, y - .1, z + 1, -12, 0, sp); shot(x + 2.4, y - .1, z + 1, 12, 0, sp); }
  if (L >= 3) { shot(x - 4.6, y - .1, z + 2, -30, 0, sp * .97); shot(x + 4.6, y - .1, z + 2, 30, 0, sp * .97); shot(x, y + .8, z, 0, 9, sp); shot(x, y - .9, z, 0, -9, sp); }
  if (L >= 5) shot(x, y, z - 2, 0, 0, sp * 1.15, 3, COL.gold);
  glowP(x - .9, y, z - 1, 0, 0, -20, .05, 3.5, 1, COL.cyan, 1);
  glowP(x + .9, y, z - 1, 0, 0, -20, .05, 3.5, 1, COL.cyan, 1);
  sfx.shoot();
}
function fireMissiles() { for (const s of [-1, 1]) missiles.push({ x: p.x + s * 4.5, y: p.y - .4, z: p.z + 1, vx: s * 40, vy: 10, vz: -40, t: 0 }); }
function bomb() {
  if (p.bombs <= 0 || !p.alive || state !== 'play' || paused) return;
  p.bombs--; bombT = 1;
  bombSphere.position.set(p.x, p.y, p.z - 10);
  for (let i = 0; i < 3; i++) { const bx = p.x, by = p.y, bz = p.z; later(() => ring(bx, by, bz - 6 - i * 10, 2, 90 + i * 40, 1, i === 1 ? 0xffffff : 0x3dffb5, -40), i * 90); }
  for (const b of eBullets) sparks(b.x, b.y, b.z, b.c, 3, 14);
  eBullets.length = 0;
  for (const e of enemies) if (e.d <= 0) damage(e, e.kind === 'boss' ? 90 : 120);
  flash(.85); shake(.9); fx.hitStop = .08; fx.fovKick = 18;
  sfx.bomb();
}
function barrelRoll() {
  if (!p.alive || state !== 'play' || paused || p.rollCd > 0) return;
  p.rollT = .6; p.rollCd = 1.1; p.rollDir = p.vx < -2 ? 1 : p.vx > 2 ? -1 : (Math.random() < .5 ? 1 : -1);
  p.tx = clamp(p.x - p.rollDir * 9, -BX, BX);
  sfx.roll();
}
function clearNear(r) { eBullets = eBullets.filter(b => { const k = Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z) > r; if (!k) sparks(b.x, b.y, b.z, b.c, 2, 10); return k; }); }
function hurt() {
  if (p.inv > 0 || !p.alive || p.rollT > 0) return;
  if (p.shield) {
    p.shield = 0; p.inv = 1;
    ring(p.x, p.y, p.z, 4, 22, .5, 0x7ad7ff, 0); sparks(p.x, p.y, p.z, COL.cyan, 40, 30);
    shake(.35); sfx.hurt(); clearNear(18); return;
  }
  p.hp--; p.inv = 1.8; p.level = Math.max(1, p.level - 1);
  explode(p.x, p.y, p.z, 1.1, COL.cyan); fx.dmgA = 1; shake(.7); fx.hitStop = .1; sfx.hurt();
  clearNear(20); combo = 0; mult = 1;
  if (p.hp <= 0) die();
}
function die() {
  p.alive = false; player.visible = false;
  explode(p.x, p.y, p.z, 4, COL.cyan); explode(p.x, p.y, p.z, 2.5);
  sfx.big(); flash(.8); fx.slowT = 1.8; shake(1);
  state = 'dead'; deadT = 2.4;
  $('retFar').hidden = $('retNear').hidden = true;
}

/* ---------- input ---------- */
const keys = {};
let drag = null, lastTap = 0;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'KeyB') { e.preventDefault(); bomb(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE' || e.code === 'KeyQ') barrelRoll();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'Enter' && (state === 'title' || state === 'over')) startGame();
}, sig);
addEventListener('keyup', e => { keys[e.code] = false; }, sig);
function pointerTarget(cx, cy) {
  const W = core.W, H = core.H;
  if (!W || !H || !isFinite(cx + cy)) return;
  p.tx = clamp((cx / W * 2 - 1) * BX * 1.15, -BX, BX); p.ty = clamp(lerp(BY1, BY0, cy / H) * 1.1 - 1, BY0, BY1);
}
cv.addEventListener('pointerdown', e => {
  core.audio.init();
  if (e.pointerType === 'mouse') pointerTarget(e.clientX, e.clientY);
  else {
    drag = { sx: e.clientX, sy: e.clientY, px: p.tx, py: p.ty, id: e.pointerId };
    const now = performance.now(); if (now - lastTap < 280) barrelRoll(); lastTap = now;
  }
}, sig);
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') pointerTarget(e.clientX, e.clientY);
  else if (drag && drag.id === e.pointerId) {
    p.tx = clamp(drag.px + (e.clientX - drag.sx) / core.W * BX * 3, -BX, BX);
    p.ty = clamp(drag.py - (e.clientY - drag.sy) / core.H * (BY1 - BY0) * 2, BY0, BY1);
  }
}, sig);
const endDrag = e => { if (drag && drag.id === e.pointerId) drag = null; };
cv.addEventListener('pointerup', endDrag, sig); cv.addEventListener('pointercancel', endDrag, sig);
for (const id of ['bombBtn', 'rollBtn']) $(id).addEventListener('pointerdown', e => e.stopPropagation());
$('bombBtn').addEventListener('click', bomb);
$('rollBtn').addEventListener('click', barrelRoll);
$('muteBtn').addEventListener('click', toggleMute);
$('pauseBtn').addEventListener('click', togglePause);
$('resumeBtn').addEventListener('click', togglePause);
$('startBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
root.querySelectorAll('[data-exit]').forEach(b => b.addEventListener('click', () => api.exit()));
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !paused) togglePause(); }, sig);
function syncMute() { $('muteBtn').textContent = core.audio.muted ? 'SOUND OFF' : 'SOUND ON'; }
function toggleMute() { core.audio.toggle(); syncMute(); }
syncMute();
function togglePause() {
  if (state !== 'play' && state !== 'dead') return;
  paused = !paused; $('pauseScr').hidden = !paused;
  $('pauseBtn').textContent = paused ? 'RESUME' : 'PAUSE';
  if (paused) $('resumeBtn').focus();
}
function setHud(on) { for (const id of ['hudTL', 'hudTR', 'hudBL', 'hudBR', 'retFar', 'retNear']) $(id).hidden = !on; if (!on) $('bossBar').hidden = true; }

function startGame() {
  core.audio.init();
  for (const e of enemies) removeEnemy(e);
  for (const k of pickups) { scene.remove(k.mesh); core.disposeObject(k.mesh); }
  enemies = []; pBullets = []; eBullets = []; missiles = []; pickups = [];
  Object.assign(p, { tx: 0, ty: 9, hp: 5, inv: 2.2, shield: 0, level: 1, bombs: 2, fireT: .4, misT: 0, alive: true, rollT: 0, rollCd: 0 });
  player.visible = true;
  score = 0; combo = 0; comboT = 0; mult = 1; wave = 1; waveT = 0; spawnT = 2.2; bossActive = false;
  fx.slowT = 0; fx.timeScale = 1; paused = false;
  if (state === 'over') camBlend = 1;
  state = 'play';
  $('titleScr').hidden = true; $('overScr').hidden = true; $('pauseScr').hidden = true;
  setHud(true);
  core.showBanner('WAVE 1', '출격 개시 · 오로라 아래 적 편대를 요격하라', '#7ad7ff');
  tone(330, .25, 'sawtooth', .06, 660); sfx.whoosh(); fx.fovKick = 16; flash(.35); shake(.25);
}
function gameOver() {
  state = 'over';
  const nb = score > best;
  if (nb) { best = score; core.saveBest('aurora', best); }
  $('finalScore').textContent = score.toLocaleString(); $('finalWave').textContent = wave;
  $('newBest').hidden = !nb; $('overScr').hidden = false; setHud(false); $('againBtn').focus();
}

/* ---------- update ---------- */
function segHit(b, e, r) {
  const ax = b.px, ay = b.py, az = b.pz, dx = b.x - ax, dy = b.y - ay, dz = b.z - az;
  const L2 = dx * dx + dy * dy + dz * dz || 1;
  const t = clamp(((e.x - ax) * dx + (e.y - ay) * dy + (e.z - az) * dz) / L2, 0, 1);
  const cx = ax + dx * t - e.x, cy = ay + dy * t - e.y, cz = az + dz * t - e.z;
  return cx * cx + cy * cy + cz * cz < r * r;
}
const _want = new THREE.Vector3(), _cur = new THREE.Vector3();
function update(dt, rdt) {
  T += dt; scroll += S_WORLD * dt;
  oceanU.time.value = T; oceanU.scroll.value = scroll; skyU.time.value = T;
  updateSnow(dt);
  for (const r of rocks) { r.m.position.z += S_WORLD * dt; if (r.m.position.z > 120) placeRock(r, rand(-1300, -1100)); }
  for (const c of clouds) { c.s.position.z += S_WORLD * dt; if (c.s.position.z > 60) placeCloud(c, rand(-1300, -1150)); }
  for (const d of slData) { d.z += (S_WORLD * 2.6 + fx.fovKick * 20) * dt; if (d.z > 40) placeSL(d); }

  if (state === 'title') { p.tx = Math.sin(T * .5) * 6; p.ty = 10 + Math.sin(T * .8) * 2; }
  else if (state === 'play') {
    let kx = 0, ky = 0;
    if (keys.ArrowLeft || keys.KeyA) kx--; if (keys.ArrowRight || keys.KeyD) kx++;
    if (keys.ArrowUp || keys.KeyW) ky++; if (keys.ArrowDown || keys.KeyS) ky--;
    if (kx || ky) { const l = Math.hypot(kx, ky); p.tx = clamp(p.x + kx / l * 9, -BX, BX); p.ty = clamp(p.y + ky / l * 9, BY0, BY1); }
  }
  if (p.alive) {
    const ox = p.x, oy = p.y;
    p.x += (p.tx - p.x) * damp(p.rollT > 0 ? 9 : 6, dt); p.y += (p.ty - p.y) * damp(6, dt);
    p.vx = (p.x - ox) / Math.max(dt, 1e-4); p.vy = (p.y - oy) / Math.max(dt, 1e-4);
    p.roll += (clamp(-p.vx * .045, -1.2, 1.2) - p.roll) * damp(8, dt);
    p.pitch += (clamp(p.vy * .03, -.5, .5) - p.pitch) * damp(8, dt);
    if (p.inv > 0) p.inv -= dt;
    if (p.rollCd > 0) p.rollCd -= dt;
    let extraRoll = 0;
    if (p.rollT > 0) { p.rollT -= dt; const k = 1 - Math.max(0, p.rollT) / .6; extraRoll = p.rollDir * TAU * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2); }
    player.position.set(p.x, p.y, p.z);
    player.rotation.set(p.pitch, -p.vx * .006, p.roll + extraRoll);
    player.visible = !(p.inv > 0 && state === 'play' && Math.floor(p.inv * 16) % 2 === 0);
    const cr = Math.cos(p.roll + extraRoll), sr = Math.sin(p.roll + extraRoll);
    for (const s of [-1, 1]) {
      const ex = p.x + s * .42 * cr, ey = p.y + s * .42 * sr;
      glowP(ex, ey, p.z + 3.6, rand(-.6, .6), rand(-.6, .6), 70 + rand(0, 30), rand(.12, .22), rand(2, 2.8), .4, Math.random() < .5 ? COL.cyan : COL.mint, .9);
      const wx = p.x + s * 5.6 * cr, wy = p.y + s * 5.6 * sr - .1;
      FX.emit(wx, wy, p.z + 2, 0, 0, S_WORLD, .5, .35, .08, .85, .92, 1, .45, 1);
    }
  }
  shieldMesh.visible = p.alive && !!p.shield && state !== 'title';
  if (shieldMesh.visible) { shieldMesh.position.set(p.x, p.y, p.z); shieldMesh.rotation.y += dt; shieldMesh.rotation.x += dt * .6; shieldMesh.material.opacity = .18 + Math.sin(T * 6) * .06; }

  if (state === 'play' && p.alive) {
    p.fireT -= dt; if (p.fireT <= 0) { p.fireT = .085; fire(); }
    if (p.level >= 4) { p.misT -= dt; if (p.misT <= 0) { p.misT = .55; fireMissiles(); } }
    if (!bossActive) {
      waveT += dt; spawnT -= dt;
      if (spawnT <= 0) { spawnFormation(); spawnT = rand(1.9, 3.1) / (1 + wave * .07); }
      if (waveT > 25) {
        waveT = 0; wave++;
        if (wave % 5 === 0) startBoss();
        else core.showBanner('WAVE ' + wave, wave % 5 === 4 ? '대형 반응 감지 · 경계하라' : '적 편대 증원', '#7ad7ff');
      }
    }
    comboT -= dt; if (comboT <= 0 && combo) { combo = 0; mult = 1; }
  }
  if (state === 'dead') { deadT -= rdt; if (deadT <= 0) gameOver(); }

  for (const b of pBullets) {
    b.px = b.x; b.py = b.y; b.pz = b.z;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.z < -900) { b.dead = true; continue; }
    for (const e of enemies) {
      if (e.d > 0 || e.dead || e.dying > 0) continue;
      if (Math.abs(e.x - b.x) > e.r + 3 || Math.abs(e.y - b.y) > e.r + 3) continue;
      if (segHit(b, e, e.r)) {
        b.dead = true; damage(e, b.dmg);
        sparks(b.x, b.y, e.z + e.r * .6, [.75, .97, 1], 3, 14, e.cvz || 0);
        if (Math.random() < .2) sfx.hit();
        break;
      }
    }
  }
  pBullets = pBullets.filter(b => !b.dead);

  for (const m of missiles) {
    m.t += dt;
    let tgt = null, bd = 1e12;
    for (const e of enemies) { if (e.d > 0 || e.dead || e.dying > 0 || e.z > p.z - 10) continue; const d = (e.x - m.x) ** 2 + (e.y - m.y) ** 2 + ((e.z - m.z) * .3) ** 2; if (d < bd) { bd = d; tgt = e; } }
    const sp = Math.min(380, 60 + m.t * 900);
    if (tgt) _want.set(tgt.x - m.x, tgt.y - m.y, tgt.z - m.z).normalize(); else _want.set(0, 0, -1);
    _cur.set(m.vx, m.vy, m.vz).normalize().lerp(_want, Math.min(1, dt * 6)).normalize();
    m.vx = _cur.x * sp; m.vy = _cur.y * sp; m.vz = _cur.z * sp;
    m.px = m.x; m.py = m.y; m.pz = m.z;
    m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
    glowP(m.x, m.y, m.z, 0, 0, 0, .1, 2.2, .5, COL.gold, 1);
    SMOKE.emit(m.x, m.y, m.z, rand(-1, 1), rand(-1, 1), S_WORLD * .8, .7, .8, 3, .75, .72, .8, .35, .97);
    if (m.z < -900 || m.t > 3.5 || Math.abs(m.x) > 200) { m.dead = true; continue; }
    for (const e of enemies) {
      if (e.d > 0 || e.dead || e.dying > 0) continue;
      if (segHit(m, e, e.r + .5)) { m.dead = true; damage(e, 4); explode(m.x, m.y, m.z, .45, COL.gold, e.cvz || 0); break; }
    }
  }
  missiles = missiles.filter(m => !m.dead);

  for (const e of enemies) {
    updateEnemy(e, dt);
    if (e.d <= 0 && !e.dead && !(e.dying > 0) && p.alive && state === 'play') {
      const rr = e.r * .75 + 1.6;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 + (e.z - p.z) ** 2 < rr * rr) { hurt(); if (e.kind !== 'boss') damage(e, 20); }
    }
  }
  for (const e of enemies) if (e.dead || e.gone) removeEnemy(e);
  enemies = enemies.filter(e => !e.dead && !e.gone);

  for (const b of eBullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.t += dt;
    if (b.z > 40 || b.t > 9) { b.dead = true; continue; }
    if (p.alive && state === 'play' && Math.abs(b.z - p.z) < 3) {
      const rr = b.r * .85 + 1.2;
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 + (b.z - p.z) ** 2 < rr * rr) {
        if (p.rollT > 0) { if (!b.grazed) { b.grazed = 1; score += 50; sparks(b.x, b.y, b.z, COL.white, 4, 8); } }
        else { b.dead = true; hurt(); }
      }
    }
  }
  eBullets = eBullets.filter(b => !b.dead);

  for (const k of pickups) {
    k.t += dt;
    const dx = p.x - k.x, dy = p.y - k.y, dz = p.z - k.z, d = Math.hypot(dx, dy, dz);
    if (p.alive && state === 'play' && d < 30 && k.z > -60) { const pull = 140 * dt; k.x += dx / d * pull; k.y += dy / d * pull; k.z += dz / d * pull; }
    else k.z += S_WORLD * .5 * dt;
    k.mesh.position.set(k.x, k.y + Math.sin(k.t * 3) * .5, k.z);
    k.mesh.rotation.y += dt * 2.4; k.mesh.children[1].rotation.x += dt * 1.6;
    if (Math.random() < .5) glowP(k.x, k.y, k.z, rand(-3, 3), rand(-3, 3), rand(-3, 3), .3, 1.4, .2, C(PK[k.type].c), .9);
    if (p.alive && state === 'play' && d < 4) { k.dead = true; collect(k); }
    if (k.z > 40) k.dead = true;
    if (k.dead) { scene.remove(k.mesh); core.disposeObject(k.mesh); }
  }
  pickups = pickups.filter(k => !k.dead);

  if (bombT > 0) {
    bombT -= dt * .9; const k = 1 - bombT;
    bombSphere.scale.setScalar(5 + k * 160); bombSphere.material.opacity = Math.max(0, bombT) * .6;
    bombSphere.rotation.y += dt;
  } else bombSphere.material.opacity = 0;
  core.audio.drone(state === 'play' ? .1 : .05);
}

/* ---------- camera & draw ---------- */
const camPos = new THREE.Vector3(0, 14, 24), look = new THREE.Vector3();
const chase = new THREE.Vector3(), chaseLook = new THREE.Vector3(), orbit = new THREE.Vector3(), orbitLook = new THREE.Vector3();
function updateCamera(rdt) {
  chase.set(p.x * .55, p.y * .62 + 5.2, p.z + 21);
  chaseLook.set(p.x * .78, p.y * .82 + 1.5, p.z - 60);
  const a = T * .22;
  orbit.set(p.x + Math.sin(a) * 17, p.y + 3 + Math.sin(T * .3) * 2.5, p.z + Math.cos(a) * 17 - 4);
  orbitLook.set(p.x, p.y + 1, p.z - 2);
  if (state !== 'title') camBlend = Math.min(1, camBlend + rdt * .7);
  const k = camBlend * camBlend * (3 - 2 * camBlend);
  orbit.lerp(chase, k); orbitLook.lerp(chaseLook, k);
  camPos.lerp(orbit, damp(k < 1 ? 4 : 5, rdt)); look.lerp(orbitLook, damp(8, rdt));
  camera.position.copy(camPos);
  camera.lookAt(look);
  camera.rotateZ(p.roll * .1 * k);
  const fov = 66 + fx.fovKick + (fx.slowT > 0 ? -6 : 0);
  if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov) * damp(6, rdt); camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
  ocean.position.x = camera.position.x; ocean.position.z = camera.position.z - 1200;
}
function drawInstances() {
  let n = 0;
  for (const b of pBullets) {
    _p.set(b.x, b.y, b.z); _e.set(0, Math.atan2(b.vx, b.vz) + Math.PI, 0); _q.setFromEuler(_e);
    _s.set(b.dmg > 1 ? 2 : 1, b.dmg > 1 ? 2 : 1, 1);
    _m.compose(_p, _q, _s); pbMesh.setMatrixAt(n, _m);
    _c.setRGB(b.c[0] * .7 + .3, b.c[1] * .7 + .3, b.c[2] * .7 + .3); pbMesh.setColorAt(n, _c); n++;
  }
  pbMesh.count = n; pbMesh.instanceMatrix.needsUpdate = true; if (pbMesh.instanceColor) pbMesh.instanceColor.needsUpdate = true;
  n = 0; _q.identity();
  for (const b of eBullets) {
    const pulse = b.r * (1 + Math.sin(b.t * 18) * .12);
    _p.set(b.x, b.y, b.z); _s.set(pulse, pulse, pulse); _m.compose(_p, _q, _s); ebMesh.setMatrixAt(n, _m);
    _c.setRGB(b.c[0] * .55 + .45, b.c[1] * .55 + .45, b.c[2] * .55 + .45); ebMesh.setColorAt(n, _c); n++;
    if (Math.random() < .35) FX.emit(b.x, b.y, b.z, 0, 0, 0, .14, 3.4 * b.r, 1, b.c[0], b.c[1], b.c[2], .7, 1);
  }
  ebMesh.count = n; ebMesh.instanceMatrix.needsUpdate = true; if (ebMesh.instanceColor) ebMesh.instanceColor.needsUpdate = true;
  for (let i = 0; i < SL; i++) {
    const d = slData[i], o = i * 6, len = d.l * (1 + fx.fovKick * .08);
    slPos[o] = camera.position.x + d.x; slPos[o + 1] = d.y; slPos[o + 2] = d.z;
    slPos[o + 3] = camera.position.x + d.x; slPos[o + 4] = d.y; slPos[o + 5] = d.z - len;
  }
  slGeo.attributes.position.needsUpdate = true;
  slMat.opacity = .14 + fx.fovKick * .02;
}

/* ---------- HUD ---------- */
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
const pipEls = [...root.querySelectorAll('#pips span')];
function updateHud() {
  if (state !== 'play' && state !== 'dead') return;
  setText('score', score.toLocaleString()); setText('mult', '×' + mult); setText('wave', String(wave));
  setText('best', Math.max(best, score).toLocaleString()); setText('wpnLv', 'Lv.' + p.level);
  setText('shieldTag', p.shield ? '· SHIELD' : ''); setText('bombN', '×' + p.bombs);
  $('comboFill').style.width = (combo ? Math.max(0, comboT / 2.6) * 100 : 0) + '%';
  pipEls.forEach((el, i) => el.classList.toggle('on', i < p.hp));
  $('pips').classList.toggle('low', p.hp <= 2);
  $('bombBtn').disabled = p.bombs <= 0; $('rollBtn').disabled = p.rollCd > 0;
  if (p.alive && state === 'play') {
    const [nx, ny] = w.toScreen(p.x, p.y, p.z - 45), [fx_, fy] = w.toScreen(p.x, p.y, p.z - 120);
    $('retNear').style.transform = `translate(${nx}px,${ny}px)`; $('retFar').style.transform = `translate(${fx_}px,${fy}px)`;
    let lock = false;
    for (const e of enemies) { if (e.d > 0 || e.dead || e.z > p.z - 20) continue; if (Math.abs(e.x - p.x) < e.r + 1.5 && Math.abs(e.y - p.y) < e.r + 1.5) { lock = true; break; } }
    $('retFar').classList.toggle('lock', lock);
  }
  const boss = enemies.find(e => e.kind === 'boss' && e.d <= 0);
  $('bossBar').hidden = !boss;
  if (boss) $('bossFill').style.width = (Math.max(0, boss.hp / boss.maxHp) * 100).toFixed(1) + '%';
}

p.x = p.tx = 0; p.y = p.ty = 10;
$('best').textContent = best.toLocaleString();
core.run(w, ac.signal, { isPaused: () => paused, update, camera: updateCamera, draw: drawInstances, hud: updateHud });
$('startBtn').focus({ preventScroll: true });

return {
  dispose() {
    ac.abort(); timers.forEach(clearTimeout);
    core.audio.drone(0); core.clearFeedback();
    w.dispose(); root.innerHTML = ''; root.removeAttribute('style');
  }
};
  }
};
})();
