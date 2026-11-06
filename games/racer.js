/* Sky Arcade — Neon Overdrive: synthwave hover-car runner.
   Player stays near z=0, the world scrolls toward +Z at `speed`. Uses the shared engine passed in as `core`. */
(() => {
'use strict';
const GAMES = window.GAMES = window.GAMES || {};

const LANE_W = 6, PX_MAX = 12.4, CAR_HW = 1.5, CAR_HL = 3.9, SPAWN_Z = -720, HOVER = .95, GRAV = 42, JUMP_V = 21;
const laneX = i => -12 + i * LANE_W;
const randInt = (a, b) => a + (Math.random() * (b - a + 1) | 0);
const PALS = [
  { line: 0xff2bd6, glow: 0xff3fd0, hor: 0xff3d7a, fog: 0x1a0729, css: '#ff2bd6', name: 'MAGENTA DISTRICT' },
  { line: 0x2de2ff, glow: 0x35d8ff, hor: 0x3a6bff, fog: 0x05142b, css: '#2de2ff', name: 'CYAN HARBOR' },
  { line: 0xffd23f, glow: 0xffa83a, hor: 0xff6a2a, fog: 0x200b0a, css: '#ffd23f', name: 'GOLDEN STRIP' },
];

/* player hover car: ~8 units long, nose toward -Z */
function buildCar(core) {
  const { GEO, M, E, part, mirror, finGeo, wingGeo } = core;
  const g = new THREE.Group();
  const body = M(0x221548, { metalness: .8, roughness: .26 });
  const trim = M(0x3a2a6e, { metalness: .6, roughness: .38 });
  const dark = M(0x0c0918, { metalness: .4, roughness: .6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x12052a, emissive: 0x8a2cff, emissiveIntensity: .5, metalness: .9, roughness: .08 });
  const cyan = E(0x2de2ff), pink = E(0xff2bd6), tail = E(0xff1f4f), head = E(0xeafcff), exh = E(0x8fe8ff);
  part(g, finGeo([[-4.1, .2], [-1.7, .74], [.3, 1.0], [3.7, .96], [3.98, .34], [3.55, -.06], [-3.75, -.06]], 2.6), body);
  part(g, GEO.box, trim, [0, .06, -3.55], [3.7, .1, 1.3]);
  mirror(g, GEO.box, trim, [1.75, .36, .55], [.95, .62, 5.7]);
  mirror(g, GEO.box, dark, [1.75, .36, -2.32], [.72, .4, .08]);
  mirror(g, GEO.box, cyan, [2.23, .4, .55], [.04, .08, 5.4]);
  part(g, GEO.sph, glass, [0, .98, -.35], [.84, .5, 1.75]);
  part(g, GEO.box, dark, [0, .72, 3.45], [2.1, .46, .6]);
  mirror(g, GEO.cyl, dark, [.62, .62, 3.86], [.3, .36, .3], [Math.PI / 2, 0, 0]);
  mirror(g, GEO.sph, exh, [.62, .62, 4.06], [.22, .22, .07]);
  mirror(g, wingGeo([[0, 0], [2.15, .3], [2.15, 1.1], [0, 1.0]], .12), body, [0, 1.78, 2.75]);
  mirror(g, GEO.box, dark, [.85, 1.36, 3.2], [.12, .78, .5]);
  mirror(g, GEO.box, pink, [2.17, 1.68, 3.4], [.07, .42, 1.0]);
  mirror(g, GEO.box, tail, [1.75, .46, 3.43], [.82, .16, .06]);
  part(g, GEO.box, tail, [0, .86, 3.77], [1.7, .07, .05]);
  mirror(g, GEO.box, head, [1.75, .42, -2.37], [.6, .1, .05]);
  const under = part(g, new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [0, -.3, .3], [4.4, 8.4, 1], [-Math.PI / 2, 0, 0]);
  for (const z of [-1.7, 2.5]) mirror(g, GEO.cyl, cyan, [1.75, -.07, z], [.42, .06, .42]);
  return { group: g, under };
}

const TEMPLATE = `<style>
#nrTL .nr-score{font-size:34px;line-height:1;font-weight:700}
.nr-mult{display:flex;align-items:center;gap:8px;height:18px}
#nrMult{font-size:15px;color:var(--gold);font-weight:700;min-width:34px}
.nr-combo{width:96px;height:3px;background:rgba(255,255,255,.14);overflow:hidden}
.nr-combo i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--hot),var(--gold))}
.nr-spd{display:flex;align-items:baseline;gap:6px}
.nr-spd b{font-family:var(--display);font-weight:400;font-size:46px;line-height:.9;color:#fff;text-shadow:0 0 18px rgba(255,43,214,.75)}
.nr-sbar{width:150px;height:4px;background:rgba(255,255,255,.12);transform:skewX(-20deg);overflow:hidden;margin-bottom:4px}
.nr-sbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--cyan),var(--hot));box-shadow:0 0 10px var(--hot)}
.nr-sbar.boost i{background:linear-gradient(90deg,#9fe9ff,#fff)}
#nrCp{color:var(--cyan)}
.nr-nitro{width:150px;height:9px;background:rgba(255,255,255,.1);transform:skewX(-20deg);overflow:hidden;outline:1px solid rgba(45,226,255,.35)}
.nr-nitro i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2d7bff,var(--cyan));box-shadow:0 0 12px var(--cyan)}
.nr-nitro.on i{background:linear-gradient(90deg,var(--cyan),#fff)}
#nrNitroBtn.empty{opacity:.45}
#nrBoss{position:fixed;left:50%;top:calc(78px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(56vw,480px);z-index:5;pointer-events:none;display:flex;flex-direction:column;gap:5px}
#nrBoss .lbl{color:var(--ink)}
.nr-btrack{height:6px;background:rgba(8,6,24,.7);outline:1px solid rgba(255,61,110,.5)}
.nr-btrack i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--warn),var(--hot));box-shadow:0 0 12px rgba(255,43,214,.8);transition:width .15s}
#nrNewBest{color:var(--gold);letter-spacing:.3em;font-size:13px}
@media (max-width:560px){.nr-spd b{font-size:34px}#nrTL .nr-score{font-size:24px}.nr-sbar,.nr-nitro{width:110px}#nrNitroBtn{width:68px!important;height:68px!important}#nrJumpBtn{width:56px!important;height:56px!important}}
</style>
<div class="hud tl" id="nrTL" hidden>
  <div class="lbl">SCORE</div>
  <div id="nrScore" class="num nr-score">0</div>
  <div class="nr-mult"><span id="nrMult" class="num">×1</span><div class="nr-combo"><i id="nrCombo"></i></div></div>
</div>
<div class="hud tr" id="nrTR" hidden>
  <div class="nr-spd"><b id="nrSpeed" class="num">0</b><span class="lbl">KM/H</span></div>
  <div class="nr-sbar" id="nrSpeedBar"><i id="nrSpeedFill"></i></div>
  <div class="row">
    <div class="stat"><span class="lbl">DIST</span><b id="nrDist" class="num">0m</b></div>
    <div class="stat"><span class="lbl">BEST</span><b id="nrBest" class="num">0</b></div>
  </div>
  <div id="nrCp" class="lbl">NEXT CP 1,000m</div>
  <div class="btns"><button class="mini" id="nrMute" type="button">SOUND ON</button><button class="mini" id="nrPause" type="button">PAUSE</button></div>
</div>
<div class="hud bl" id="nrBL" hidden>
  <div class="lbl">HULL</div>
  <div class="pips" id="nrPips"><span></span><span></span><span></span></div>
  <div class="lbl" style="margin-top:6px">NITRO</div>
  <div class="nr-nitro" id="nrNitroBox"><i id="nrNitro"></i></div>
</div>
<div class="hud br" id="nrBR" hidden>
  <button class="round" id="nrJumpBtn" type="button" style="--tint:rgba(45,226,255,.3);--edge:rgba(45,226,255,.65);width:62px;height:62px"><span>JUMP</span></button>
  <button class="round" id="nrNitroBtn" type="button" style="--tint:rgba(255,43,214,.38);--edge:rgba(255,43,214,.75);width:80px;height:80px"><span>NITRO</span><small id="nrNitroPct" class="num">60%</small></button>
</div>
<div id="nrBoss" hidden><span class="lbl">PURSUIT DRONE “HUNTER-9”</span><div class="nr-btrack"><i id="nrBossFill"></i></div></div>
<div class="screen bottom" id="nrTitle">
  <div class="card">
    <div class="kicker">NIGHT CITY · ROUTE 88</div>
    <h1>NEON<span>OVERDRIVE</span></h1>
    <p class="sub">네온이 흐르는 한밤의 고속도로. 차량 사이를 아슬아슬하게 빠져나가고, 니트로로 한계 속도를 넘어서세요.</p>
    <button class="go" id="nrStart" type="button">출발하기</button>
    <div class="keys">
      <span><kbd>마우스</kbd> <kbd>드래그</kbd> <kbd>A</kbd> <kbd>D</kbd></span><span>차선 이동</span>
      <span><kbd>W</kbd> <kbd>↑</kbd> <kbd>위로 스와이프</kbd></span><span>점프 (낮은 장애물 넘기)</span>
      <span><kbd>SPACE</kbd> <kbd>SHIFT</kbd></span><span>니트로 (누르는 동안 가속)</span>
      <span><kbd>P</kbd> <kbd>M</kbd></span><span>일시정지 · 소리</span>
    </div>
    <div class="legend"><span><b style="background:#ffd23f"></b>에너지 (니트로 충전)</span><span><b style="background:#6fd8ff"></b>EMP (드론 반격)</span><span><b style="background:#ff2050"></b>레이저 · 장애물</span></div>
    <button class="mini" id="nrBack1" type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="nrPauseScr" hidden>
  <div class="card">
    <div class="kicker">PAUSED</div>
    <p class="over-title" style="color:var(--ink);text-shadow:none">일시정지</p>
    <button class="go" id="nrResume" type="button">계속하기</button>
    <button class="mini" id="nrBack2" type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="nrOver" hidden>
  <div class="card">
    <div class="kicker">WRECKED · ROUTE 88</div>
    <p class="over-title">대파됨</p>
    <div class="result">
      <div><span class="lbl">SCORE</span><b id="nrFinalScore">0</b></div>
      <div><span class="lbl">DIST</span><b id="nrFinalDist">0m</b></div>
    </div>
    <div id="nrNewBest" hidden>NEW BEST RECORD</div>
    <button class="go" id="nrAgain" type="button">다시 달리기</button>
    <button class="mini" id="nrBack3" type="button">◀ 게임 선택</button>
  </div>
</div>`;

GAMES.racer = {
  id: 'racer', title: 'Neon Overdrive',
  model(core) { return window.THREE ? buildCar(core).group : null; },

  mount(root, core, api) {
    const { rand, pick, clamp, damp, TAU, GEO, M, E, part, mirror, finGeo, COL, audio } = core;
    const $ = core.$;
    root.style.setProperty('--hot', '#ff2bd6'); root.style.setProperty('--cyan', '#2de2ff'); root.style.setProperty('--gold', '#ffd23f');
    const ac = new AbortController(), sig = { signal: ac.signal };

    if (!core.ok || !core.getRenderer()) {
      root.innerHTML = `<div class="screen"><div class="card"><p class="sub">3D 그래픽(WebGL)을 불러오지 못했습니다. 다른 브라우저에서 열어 주세요.</p><button class="mini" id="nrBackE" type="button">◀ 게임 선택</button></div></div>`;
      $('nrBackE').addEventListener('click', () => api.exit(), sig);
      return { dispose() { ac.abort(); root.innerHTML = ''; root.removeAttribute('style'); } };
    }
    root.innerHTML = TEMPLATE;

    const w = core.createWorld({ fog: PALS[0].fog, fogNear: 90, fogFar: 820, fov: 70, drift: 90, bloom: [.9, .5, .75] });
    const scene = w.scene, cam = w.camera, texes = [];
    const SUN = new THREE.Vector3(-.45, .12, -1).normalize();
    const BLUE = [.45, .8, 1], TAILC = core.C(0xff1f4f), PINK = COL.magenta, ORB = core.C(0xffd23f);

    /* ---------- palette ---------- */
    const pal = { line: new THREE.Color(PALS[0].line), glow: new THREE.Color(PALS[0].glow), hor: new THREE.Color(PALS[0].hor) };
    const palT = { line: new THREE.Color(), glow: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color() };
    let palIdx = 0;
    const WHITE = new THREE.Color(1, 1, 1);

    /* ---------- lights ---------- */
    scene.add(new THREE.HemisphereLight(0x8a6aff, 0x2a0830, .75));
    const sunL = new THREE.DirectionalLight(0xff7ad0, 1.1); sunL.position.copy(SUN).multiplyScalar(100); scene.add(sunL);
    const fillL = new THREE.DirectionalLight(0x5ad8ff, .6); fillL.position.set(.4, 1, 1); scene.add(fillL);

    /* ---------- sky ---------- */
    const skyU = { sunDir: { value: SUN }, horC: { value: pal.hor }, fogC: { value: scene.fog.color }, time: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 40, 20), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 sunDir, horC, fogC; uniform float time; varying vec3 vD;
      float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){
        vec3 d = normalize(vD); float h = d.y;
        vec3 zen = vec3(.015,.008,.06), mid = vec3(.13,.03,.22);
        vec3 c = mix(horC*.85, mid, smoothstep(.0,.2,h));
        c = mix(c, zen, smoothstep(.16,.62,h));
        c = mix(c, fogC, smoothstep(.035,-.015,h));
        vec3 rt = normalize(cross(sunDir, vec3(0.,1.,0.))), up = cross(rt, sunDir);
        vec2 uv = vec2(dot(d - sunDir, rt), dot(d - sunDir, up)) / .16;
        float r = length(uv), fwd = step(0., dot(d, sunDir));
        float stripe = 1.;
        if (uv.y < .15) { float sy = .15 - uv.y; stripe = step(.12 + sy*.32, fract(sy*5.)); }
        vec3 sc = mix(vec3(1.,.12,.55), vec3(1.,.82,.32), smoothstep(-.9,.9,uv.y));
        c = mix(c, sc*1.05, stripe*(1. - smoothstep(.97,1.,r))*fwd*smoothstep(-.02,.01,h));
        c += mix(horC, vec3(1.,.35,.6), .5) * exp(-r*1.3) * .32 * fwd;
        float st = step(.9972, hash(floor(d*430.))) * smoothstep(.12,.45,h);
        c += st * (.5 + .4*sin(time*3. + hash(floor(d*430.)+2.)*40.));
        gl_FragColor = vec4(c,1.);
      }`
    }));
    sky.renderOrder = -2; scene.add(sky);

    /* ---------- mountain ridges (fill + glowing wire) ---------- */
    const mtn = new THREE.Group(); scene.add(mtn);
    const mtnLineMats = [];
    function ridge(R, hMin, hMax, seed, fillHex, lineOp) {
      const N = 110, pos = [], idx = [], lp = [], lc = [], hs = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, n = Math.abs(Math.sin(t * 7.3 + seed) * .6 + Math.sin(t * 17.1 + seed * 2) * .3 + Math.sin(t * 43 + seed * 3) * .1);
        hs.push(hMin + (hMax - hMin) * Math.pow(n, 1.3) + rand(-5, 5));
      }
      const P = i => { const a = -1.5 + 3 * i / N; return [Math.sin(a) * R, -Math.cos(a) * R]; };
      for (let i = 0; i <= N; i++) { const [x, z] = P(i); pos.push(x, -30, z, x, hs[i], z); }
      for (let i = 0; i < N; i++) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex(idx);
      mtn.add(new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: fillHex, fog: false, side: THREE.DoubleSide })));
      const k = (R - 3) / R;
      for (let i = 0; i < N; i++) {
        const [x0, z0] = P(i), [x1, z1] = P(i + 1);
        lp.push(x0 * k, hs[i], z0 * k, x1 * k, hs[i + 1], z1 * k); lc.push(1, 1, 1, 1, 1, 1);
        lp.push(x0 * k, hs[i], z0 * k, x1 * k, hs[i + 1] * .25, z1 * k); lc.push(.8, .8, .8, 0, 0, 0);
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
      const lm = new THREE.LineBasicMaterial({ color: pal.line, vertexColors: true, transparent: true, opacity: lineOp, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      mtnLineMats.push(lm); mtn.add(new THREE.LineSegments(lg, lm));
    }
    ridge(1550, 40, 210, 1.3, 0x0a0316, .85);
    ridge(1300, 15, 95, 4.1, 0x07020f, .45);

    /* ---------- ground: wet road + neon grid ---------- */
    const groundU = { scroll: { value: 0 }, time: { value: 0 }, lineC: { value: pal.line }, horC: { value: pal.hor }, fogC: { value: scene.fog.color }, sunDir: { value: SUN }, fogNear: { value: 90 }, fogFar: { value: 820 }, warn: { value: [0, 0, 0, 0, 0] } };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200, 1, 1), new THREE.ShaderMaterial({
      uniforms: groundU, fog: false, extensions: { derivatives: true },
      vertexShader: `varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: `uniform float scroll, time, fogNear, fogFar; uniform vec3 lineC, horC, fogC, sunDir; uniform float warn[5]; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float band(float d, float w){ float f = fwidth(d)*1.3 + 1e-4; return 1. - smoothstep(w, w + f, d); }
      void main(){
        float x = vW.x, z = vW.z - scroll, ax = abs(x);
        float dist = length(vW.xz - cameraPosition.xz);
        vec3 V = normalize(cameraPosition - vW);
        // road
        vec3 rc = vec3(.032,.025,.052) + hash(floor(vec2(x*5., z*5.)))*.014;
        float fr = pow(1. - max(V.y, 0.), 5.);
        rc += horC * fr * .2;
        vec3 R = reflect(-V, normalize(vec3((hash(floor(vec2(x*.6, z*.2)))-.5)*.06, 1., 0.)));
        rc += mix(horC, vec3(1.,.75,.6), .4) * pow(max(dot(R, sunDir), 0.), 22.) * .45;
        float q = x - 3., dd = abs(q - 6.*floor(q/6. + .5));
        float dash = step(.42, fract(z/16.)), inner = step(ax, 13.);
        rc += lineC * band(dd, .14) * dash * inner * 1.3;
        rc += lineC * exp(-dd*2.) * dash * inner * .05;
        float ed = abs(ax - 14.6);
        rc += lineC * band(ed, .22) * 1.6 + lineC * exp(-ed*1.1) * .14;
        float wv = 0.;
        for (int i = 0; i < 5; i++) { float cx = -12. + float(i)*6.; wv += warn[i] * (1. - smoothstep(2.4, 2.9, abs(x - cx))); }
        float chev = step(.5, fract((z + abs(mod(x,6.)-3.)*1.5)/6. + time*2.));
        rc += vec3(1.,.08,.22) * wv * (.22 + .2*chev + .12*sin(time*20.));
        // off-road neon grid
        vec3 gc = vec3(.012,.008,.03);
        vec2 gd = abs(fract(vec2(x, z)/10. - .5) - .5) * 10.;
        float gl = max(band(gd.x, .07), band(gd.y, .07));
        gc += lineC * gl * .5 * exp(-(ax-15.)*.01) * (1. - smoothstep(200., 650., dist));
        vec3 c = mix(gc, rc, step(ax, 15.6));
        c = mix(c, fogC, smoothstep(fogNear, fogFar, dist));
        gl_FragColor = vec4(c, 1.);
      }`
    }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    /* ---------- textures ---------- */
    function canvasTex(wd, ht, draw) { const c = document.createElement('canvas'); c.width = wd; c.height = ht; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); texes.push(t); return t; }
    const winTex = () => canvasTex(64, 128, g => {
      g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128);
      for (let y = 6; y < 124; y += 6) for (let x = 4; x < 60; x += 8) if (Math.random() < .36) { const v = rand(.3, 1); g.fillStyle = Math.random() < .2 ? `rgba(120,230,255,${v})` : `rgba(255,255,255,${v})`; g.fillRect(x, y, 5, 3); }
      g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 2);
    });
    const stripeTex = canvasTex(128, 32, g => {
      g.fillStyle = '#14001c'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#ffd23f';
      for (let x = -32; x < 160; x += 22) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 11, 32); g.lineTo(x + 27, 0); g.lineTo(x + 16, 0); g.fill(); }
      g.fillStyle = '#ff2bd6'; g.fillRect(0, 0, 128, 3); g.fillRect(0, 29, 128, 3);
    });
    function signTex(text, color) {
      const sq = text.length <= 2, wd = sq ? 256 : 512, ht = sq ? 256 : 160;
      return canvasTex(wd, ht, g => {
        g.strokeStyle = color; g.lineWidth = 6; g.shadowColor = color; g.shadowBlur = 18; g.strokeRect(10, 10, wd - 20, ht - 20);
        g.font = `${sq ? 150 : 88}px "Russo One", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = color; g.shadowBlur = 26; g.fillText(text, wd / 2, ht / 2 + 4); g.fillText(text, wd / 2, ht / 2 + 4);
        g.shadowBlur = 0; g.globalAlpha = .75; g.fillStyle = '#fff'; g.fillText(text, wd / 2, ht / 2 + 4);
      });
    }

    /* ---------- shared scenery materials ---------- */
    const glowMat = new THREE.MeshBasicMaterial({ color: pal.glow });
    const edgeMat = new THREE.LineBasicMaterial({ color: pal.glow, transparent: true, opacity: .9 });
    const wireMat = new THREE.MeshBasicMaterial({ color: pal.glow, wireframe: true, transparent: true, opacity: .6 });
    const bldMats = [winTex(), winTex(), winTex()].map(t => new THREE.MeshStandardMaterial({ color: 0x0c0918, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .9, roughness: .7, metalness: .3 }));
    const archMat = M(0x150f26, { metalness: .7, roughness: .35 });

    /* ---------- buildings ---------- */
    const unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.translate(0, .5, 0);
    const unitEdges = new THREE.EdgesGeometry(unitBox);
    const buildings = [], farZ = {};
    function placeBuilding(b) {
      const k = b.s + ':' + b.row, far = b.row === 1;
      const wd = far ? rand(24, 50) : rand(10, 24), dp = far ? rand(20, 50) : rand(10, 28), ht = far ? rand(70, 210) : rand(16, 95);
      const z = (farZ[k] == null ? 60 : farZ[k]) - dp / 2 - (far ? rand(10, 50) : rand(6, 30));
      farZ[k] = z - dp / 2;
      b.m.scale.set(wd, ht, dp); b.m.position.set(b.s * ((far ? rand(70, 130) : rand(27, 42)) + wd / 2), 0, z);
      b.m.material = pick(bldMats);
    }
    for (const s of [-1, 1]) for (let row = 0; row < 2; row++) for (let i = 0; i < (row ? 10 : 18); i++) {
      const m = new THREE.Mesh(unitBox, bldMats[0]); m.add(new THREE.LineSegments(unitEdges, edgeMat));
      scene.add(m); const b = { m, s, row }; placeBuilding(b); buildings.push(b);
    }

    /* ---------- light arches ---------- */
    const arches = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      mirror(g, GEO.box, archMat, [18.6, 8, 0], [1.6, 16, 1.6]);
      part(g, GEO.box, archMat, [0, 16.6, 0], [38.8, 1.4, 1.8]);
      part(g, GEO.box, glowMat, [0, 15.8, .95], [35.6, .22, .1]);
      mirror(g, GEO.box, glowMat, [17.7, 8, .95], [.12, 15.4, .1]);
      for (let j = 0; j < 7; j++) part(g, GEO.box, glowMat, [(j - 3) * 4.4, 16.6, .95], [1.6, .5, .1]);
      g.position.z = -60 - i * 150; scene.add(g); arches.push(g);
    }

    /* ---------- holo signs ---------- */
    const SIGN_TXT = [['OVERDRIVE', '#ff2bd6'], ['NEON 88', '#2de2ff'], ['夜', '#ff4f8b'], ['ROUTE 88', '#ffd23f'], ['東京', '#2de2ff'], ['TURBO', '#ff2bd6'], ['ネオン', '#ffd23f']];
    const signMats = SIGN_TXT.map(([t, c]) => { const mt = new THREE.MeshBasicMaterial({ map: signTex(t, c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); mt.userData.sq = t.length <= 2; return mt; });
    const signGeo = new THREE.PlaneGeometry(1, 1), signs = [];
    function placeSign(m, z) {
      const s = Math.random() < .5 ? -1 : 1; m.material = pick(signMats);
      const sz = rand(7, 11); m.scale.set(m.material.userData.sq ? sz : sz * 3.2, sz, 1);
      m.position.set(s * rand(20, 27), rand(9, 24), z); m.rotation.y = -s * rand(.35, .7);
    }
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(signGeo, signMats[0]); placeSign(m, -40 - i * 90); scene.add(m); signs.push(m); }

    /* ---------- speed lines + glow dust ---------- */
    const SL = 80, slPos = new Float32Array(SL * 6), slData = [];
    const slGeo = new THREE.BufferGeometry(); slGeo.setAttribute('position', new THREE.BufferAttribute(slPos, 3).setUsage(THREE.DynamicDrawUsage));
    const slMat = new THREE.LineBasicMaterial({ color: 0xffe6ff, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const speedLines = new THREE.LineSegments(slGeo, slMat); speedLines.frustumCulled = false; scene.add(speedLines);
    const placeSL = (d, z) => { const a = rand(0, TAU), r = rand(7, 30); d.x = Math.cos(a) * r; d.y = Math.max(.4, Math.sin(a) * r * .6 + 5); d.z = z; d.l = rand(4, 10); };
    for (let i = 0; i < SL; i++) { const d = {}; placeSL(d, rand(-260, 15)); slData.push(d); }
    const DN = 260, dnPos = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dnPos[i * 3] = rand(-45, 45); dnPos[i * 3 + 1] = rand(.4, 20); dnPos[i * 3 + 2] = rand(-320, 20); }
    const dnGeo = new THREE.BufferGeometry(); dnGeo.setAttribute('position', new THREE.BufferAttribute(dnPos, 3).setUsage(THREE.DynamicDrawUsage));
    const dust = new THREE.Points(dnGeo, new THREE.PointsMaterial({ color: 0xff9ae6, size: .3, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
    dust.frustumCulled = false; scene.add(dust);

    /* ---------- player ---------- */
    const carB = buildCar(core), car = carB.group; scene.add(car);
    const p = { x: 0, tx: 0, y: 0, vy: 0, vx: 0, air: false, roll: 0, yaw: 0, pitch: 0, hull: 3, inv: 0, nitro: .6, alive: true };

    /* ---------- pools ---------- */
    function makePool(n, build) { const a = []; for (let i = 0; i < n; i++) { const m = build(i); m.visible = false; scene.add(m); a.push({ mesh: m, used: false }); } return a; }
    function take(pool) { for (const it of pool) if (!it.used) { it.used = true; it.mesh.visible = true; return it; } return null; }
    function give(it) { if (it) { it.used = false; it.mesh.visible = false; } }

    const trafMats = [0x2a3260, 0x4a1a52, 0x16404c, 0x4a3418].map(c => M(c, { metalness: .7, roughness: .35 }));
    const trafDark = M(0x0a0814), tailMat = E(0xff1f4f), blinkMat = E(0xffb020);
    const trafGlow = [E(0x2de2ff), E(0xff2bd6), E(0x3dffb5)];
    const trafPool = makePool(14, i => {
      const g = new THREE.Group();
      part(g, GEO.box, trafMats[i % 4], [0, .95, 0], [3.0, 1.1, 6]);
      part(g, GEO.box, trafDark, [0, 1.8, .4], [2.4, .7, 3.2]);
      mirror(g, GEO.box, tailMat, [1.05, 1.05, 3.02], [.7, .22, .06]);
      part(g, GEO.box, trafGlow[i % 3], [0, .36, 0], [3.1, .08, 6.1]);
      const [bl, br] = mirror(g, GEO.sph, blinkMat, [1.45, 1.05, 3.0], [.24, .24, .24]);
      g.userData.blink = { l: br, r: bl }; bl.visible = br.visible = false;
      return g;
    });
    const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTex });
    const barPool = makePool(6, () => {
      const g = new THREE.Group(), segs = [];
      for (let j = 0; j < 5; j++) {
        const s = new THREE.Group();
        part(s, GEO.box, stripeMat, [0, 1.05, 0], [5.6, 1.0, .7]);
        mirror(s, GEO.box, archMat, [2.2, .3, 0], [.3, .6, .5]);
        g.add(s); segs.push(s);
      }
      g.userData.segs = segs; return g;
    });
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xff2050, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
    const markMat = new THREE.MeshBasicMaterial({ color: 0x3dffb5, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const markGeo = new THREE.PlaneGeometry(4.4, 9);
    const laserPool = makePool(4, () => {
      const g = new THREE.Group();
      const pl = new THREE.Group(), pr = new THREE.Group();
      for (const pg of [pl, pr]) { part(pg, GEO.box, archMat, [0, 3.4, 0], [1.1, 6.8, 1.1]); part(pg, GEO.sph, E(0xff2050), [0, 7.1, 0], [.6, .6, .6]); g.add(pg); }
      const beams = [1.3, 3.2, 5.1].map(y => part(g, GEO.box, beamMat, [0, y, 0], [1, .32, .32]));
      const marks = [0, 1].map(() => part(g, markGeo, markMat, [0, .06, 0], null, [-Math.PI / 2, 0, 0]));
      g.userData = { pl, pr, beams, marks }; return g;
    });
    const rockGeo = core.rockGeo(1), debMat = M(0x2a1830, { emissive: 0xff2bd6, emissiveIntensity: .25 });
    const debPool = makePool(6, () => { const g = new THREE.Group(); part(g, rockGeo, debMat, null, [1.8, 1.8, 1.8]); part(g, GEO.ico, wireMat, null, [2.3, 2.3, 2.3]); return g; });
    const rampGeo = finGeo([[5, 0], [-5, 2.4], [-5, 0]], 5.2);
    const rampPool = makePool(3, () => {
      const g = new THREE.Group(); part(g, rampGeo, archMat);
      for (let j = 0; j < 4; j++) { const zz = 3.4 - j * 2.4; part(g, GEO.box, glowMat, [0, (5 - zz) / 10 * 2.4 + .06, zz], [4.4, .06, .4], [Math.atan2(2.4, 10), 0, 0]); }
      mirror(g, GEO.box, glowMat, [2.62, .9, -1.5], [.08, .08, 7]);
      return g;
    });
    const empPool = makePool(4, () => {
      const g = new THREE.Group();
      part(g, GEO.sph, E(0x9fe9ff), null, [1.1, 1.1, 1.1]);
      part(g, GEO.ico, new THREE.MeshBasicMaterial({ color: 0x2d7bff, wireframe: true, transparent: true, opacity: .8 }), null, [2.4, 2.4, 2.4]);
      part(g, new THREE.TorusGeometry(2.0, .1, 6, 32), E(0x6fd8ff), null, null, [Math.PI / 2, 0, 0]);
      return g;
    });
    const boltPool = makePool(6, () => { const g = new THREE.Group(); part(g, GEO.sph, E(0xdff8ff), null, [.9, .9, .9]); return g; });

    /* ---------- orbs (instanced) ---------- */
    const ORB_MAX = 96;
    const orbCore = new THREE.InstancedMesh(GEO.oct, new THREE.MeshBasicMaterial({ color: 0xffd23f }), ORB_MAX);
    const orbShell = new THREE.InstancedMesh(GEO.ico, new THREE.MeshBasicMaterial({ color: 0xffe9a0, wireframe: true, transparent: true, opacity: .55 }), ORB_MAX);
    for (const im of [orbCore, orbShell]) { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; scene.add(im); }
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

    /* ---------- boss: HUNTER-9 ---------- */
    const bossMesh = (() => {
      const g = new THREE.Group();
      const armor = M(0x1d1430, { metalness: .8, roughness: .3 }), dark = M(0x0a0812), plate = M(0x34224f);
      part(g, GEO.oct, armor, null, [4.4, 2.6, 4.8]);
      part(g, GEO.box, plate, [0, 1.6, 0], [3.4, 1.2, 4]);
      part(g, finGeo([[-2, 0], [2, 0], [2.6, 2.2], [.6, 2.2]], .3), plate, [0, 2.1, 0]);
      const ring = part(g, new THREE.TorusGeometry(6.4, .28, 8, 48), E(0xff2050), null, null, [Math.PI / 2, 0, 0]);
      const eye = part(g, GEO.sph, E(0xff2050), [0, -.4, 4.2], [1.3, 1.3, .7]);
      const rotors = [];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + i * Math.PI / 2, cx = Math.cos(a) * 7.4, cz = Math.sin(a) * 7.4;
        part(g, GEO.box, dark, [Math.cos(a) * 3.8, .2, Math.sin(a) * 3.8], [6.6, .4, .7], [0, -a, 0]);
        part(g, GEO.cyl, armor, [cx, .4, cz], [.8, .7, .8]);
        const r = new THREE.Group(); r.position.set(cx, .9, cz); g.add(r);
        part(r, GEO.box, E(0xff6ad5), null, [4.6, .06, .3]); part(r, GEO.box, E(0xff6ad5), null, [.3, .06, 4.6]);
        rotors.push(r);
      }
      for (const x of [-2.2, 0, 2.2]) part(g, GEO.sph, E(0xff4060), [x, -2.1, 2.6], [.5, .5, .5]);
      mirror(g, GEO.box, E(0xff2bd6), [3.0, 0, 2.3], [.1, .22, 2.6], [0, .6, 0]);
      g.scale.setScalar(1.25); g.visible = false;
      g.userData = { ring, eye, rotors, mats: core.enemyMats(g) };
      scene.add(g); return g;
    })();
    const beamGeo = new THREE.BoxGeometry(1, 1, 1); beamGeo.translate(0, 0, .5);
    const beamSets = [0, 1, 2].map(() => {
      const a = new THREE.Mesh(beamGeo, beamMat), b = new THREE.Mesh(beamGeo, beamMat);
      a.visible = b.visible = false; scene.add(a, b); return { slant: a, ground: b };
    });
    const B = { active: false, mode: '', x: 0, y: 20, z: -900, t: 0, hp: 5, maxHp: 5, attackT: 3, phase: 0, phaseT: 0, lanes: [], level: 1, empT: 2, dyingT: 0, chainT: 0, flash: 0, flashOn: false };

    /* ---------- state ---------- */
    let state = 'title', paused = false, T = 0, speed = 34, scroll = 0, sf = 0, nitroOn = false, nitroHeld = false;
    let scoreF = 0, combo = 0, comboT = 0, mult = 1, runT = 0, distU = 0, distM = 0, cp = 0, nextSpawn = 300;
    let deadT = 0, countT = 0, countN = 0, camBlend = 0, camBump = 0, bossDelay = 0, orbChain = 0, orbChainT = 0, dispSpeed = 0;
    let best = core.best('racer');
    let obs = [], orbs = [], emps = [], bolts = [];
    const keys = { l: false, r: false };

    /* ---------- audio ---------- */
    let engineVoice = { set() {}, stop() {} }, windVoice = { set() {}, stop() {} }, voicesMade = false;
    function ensureAudio() {
      audio.init();
      if (!voicesMade) { voicesMade = true; engineVoice = audio.voice('sawtooth', 'lowpass', 900); windVoice = audio.voice('noise', 'bandpass', 800); }
    }
    const sfx = {
      orb: () => audio.tone(880 + Math.min(12, orbChain) * 45, .09, 'triangle', .05, 1500),
      near: () => { audio.tone(1300, .12, 'sine', .05, 2400); audio.noise(.3, .12, 4000, 'highpass', 900); },
      crash: () => { audio.boom(.6, .6, 1400); audio.tone(170, .4, 'sawtooth', .1, 40); },
      big: () => { audio.boom(1.3, .8, 1200); audio.tone(70, .9, 'sawtooth', .14, 25); },
      jump: () => audio.tone(260, .22, 'square', .04, 720),
      land: () => audio.noise(.22, .2, 700),
      nitro: () => { audio.noise(.7, .22, 1200, 'bandpass', 5000); audio.tone(120, .5, 'sawtooth', .05, 320); },
      warn: () => { audio.tone(660, .16, 'square', .06); audio.tone(660, .16, 'square', .06, 0, .22); },
      laser: () => { audio.noise(.55, .25, 3000, 'bandpass', 400); audio.tone(240, .5, 'sawtooth', .07, 80); },
      emp: () => audio.tone(420, .35, 'sine', .09, 1700),
      bossHit: () => { audio.boom(.5, .5, 2200); audio.tone(320, .3, 'square', .07, 80); },
      cp: () => [523, 659, 784, 1046].forEach((f, i) => audio.tone(f, .2, 'triangle', .06, 0, i * .09)),
      count: () => audio.tone(440, .16, 'square', .05),
      go: () => { audio.tone(880, .45, 'square', .06); audio.noise(.8, .25, 900, 'bandpass', 4000); },
    };

    /* ---------- helpers ---------- */
    const diffLevel = () => Math.min(5, runT / 22 + cp * .35);
    function shuffledLanes() { const a = [0, 1, 2, 3, 4]; for (let i = 4; i > 0; i--) { const j = Math.random() * (i + 1) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function addObs(type, item, o) {
      const ob = Object.assign({ type, item, x: 0, z: SPAWN_Z, hw: 1, hl: 1, h: 2, cs: 0, vx: 0, t: 0, minGap: 99, hit: false, passed: false, dead: false, ghost: false }, o);
      obs.push(ob); return ob;
    }
    function addOrb(x, y, z) { if (orbs.length < ORB_MAX) orbs.push({ x, y, z, t: rand(0, 6) }); }
    function orbLine(lane, z, n) { for (let i = 0; i < (n || 7); i++) addOrb(laneX(lane), 1.7, z - i * 10); }
    function bumpCombo() { combo++; comboT = 3; mult = Math.min(8, 1 + Math.floor(combo / 3)); }

    /* ---------- director ---------- */
    function spawnTraffic(z, n, d, lanes) {
      lanes = lanes || shuffledLanes();
      for (let i = 0; i < n; i++) {
        const it = take(trafPool); if (!it) return lanes;
        const ln = lanes[i];
        const o = addObs('traffic', it, { x: laneX(ln), z: z - rand(0, 30), hw: 1.5, hl: 3, h: 3.2, cs: rand(40, 78) });
        if (n <= 2 && d > 1 && Math.random() < .35) {
          const dir = ln === 0 ? 1 : ln === 4 ? -1 : (Math.random() < .5 ? -1 : 1);
          o.sw = { at: rand(-330, -200), tx: laneX(ln + dir), dir, on: false, t: 0 };
        }
      }
      return lanes;
    }
    function spawnRow() {
      const d = diffLevel(), z = SPAWN_Z;
      if (B.active) { if (Math.random() < .5) spawnTraffic(z, 1, 0); else orbLine(randInt(0, 4), z, 5); return; }
      const opts = [['traffic', 4], ['orbs', 2]];
      if (d > .4) opts.push(['barrier', 2]);
      if (d > .9) opts.push(['laser', 1.8]);
      if (d > 1.4) opts.push(['debris', 1.4]);
      opts.push(['ramp', .7]);
      let tot = 0; for (const o of opts) tot += o[1];
      let r = Math.random() * tot, kind = opts[0][0];
      for (const o of opts) { r -= o[1]; if (r <= 0) { kind = o[0]; break; } }
      if (kind === 'traffic') {
        const n = Math.min(3, 1 + (Math.random() < .25 + d * .1 ? 1 : 0) + (d > 2.5 && Math.random() < .35 ? 1 : 0));
        const lanes = spawnTraffic(z, n, d);
        if (Math.random() < .5) orbLine(lanes[4], z - 20, 6);
      } else if (kind === 'orbs') {
        if (Math.random() < .5) orbLine(randInt(0, 4), z, 8);
        else { const ph = rand(0, TAU); for (let i = 0; i < 12; i++) addOrb(Math.sin(ph + i * .45) * 10, 1.7, z - i * 9); }
      } else if (kind === 'barrier') {
        const it = take(barPool); if (!it) return;
        const n = d > 2 && Math.random() < .35 ? 5 : randInt(2, 4), s0 = randInt(0, 5 - n);
        it.mesh.userData.segs.forEach((sg, j) => { sg.visible = j < n; sg.position.x = (j - (n - 1) / 2) * LANE_W; });
        const cx = laneX(s0) + (n - 1) * LANE_W / 2;
        addObs('barrier', it, { x: cx, z, hw: n * 3 - .3, hl: .5, h: 1.6 });
        if (n === 5) { const ln = randInt(0, 4); for (let i = -3; i <= 3; i++) addOrb(laneX(ln), 1.7 + 4.6 * Math.cos(i / 3.6 * Math.PI / 2), z - i * 9); }
        else if (Math.random() < .5) orbLine(s0 + n <= 4 ? s0 + n : s0 - 1, z - 10, 5);
      } else if (kind === 'laser') {
        const it = take(laserPool); if (!it) return;
        const n = d > 2.2 && Math.random() < .6 ? 4 : 3, s0 = randInt(0, 5 - n);
        const cx = laneX(s0) + (n - 1) * LANE_W / 2, hw = n * 3 - .2, u = it.mesh.userData;
        u.pl.position.x = -hw; u.pr.position.x = hw; u.beams.forEach(b => { b.scale.x = hw * 2; });
        const free = [0, 1, 2, 3, 4].filter(l => l < s0 || l >= s0 + n);
        u.marks.forEach((mk, j) => { mk.visible = j < free.length; if (mk.visible) mk.position.x = laneX(free[j]) - cx; });
        addObs('laser', it, { x: cx, z, hw, hl: .4, h: 99 });
      } else if (kind === 'debris') {
        const n = d > 3 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const it = take(debPool); if (!it) return;
          addObs('debris', it, { x: rand(-11, 11), z: z - i * 40, hw: 1.8, hl: 1.8, h: 3.6, vx: (Math.random() < .5 ? -1 : 1) * rand(6, 12) });
        }
      } else if (kind === 'ramp') {
        const it = take(rampPool); if (!it) return;
        const ln = randInt(0, 4);
        addObs('ramp', it, { x: laneX(ln), z, hw: 2.6, hl: 5, h: 0 });
        const sp = Math.max(speed, 90);
        for (let i = 1; i <= 7; i++) { const t = i * .18; addOrb(laneX(ln), HOVER + .4 + 30 * t - .5 * GRAV * t * t, z - 5 - sp * t); }
        const bt = take(barPool);
        if (bt) {
          bt.mesh.userData.segs.forEach((sg, j) => { sg.visible = true; sg.position.x = (j - 2) * LANE_W; });
          addObs('barrier', bt, { x: 0, z: z - 5 - sp * .7, hw: 14.7, hl: .5, h: 1.6 });
        }
      }
    }

    /* ---------- player actions ---------- */
    function jump(v) {
      if (p.air || !p.alive || paused || (state !== 'play' && state !== 'count')) return;
      p.vy = v || JUMP_V; p.air = true; sfx.jump();
      for (let i = 0; i < 8; i++) w.glowP(p.x + rand(-1.6, 1.6), .3, rand(-2, 3), rand(-4, 4), rand(1, 4), speed * .8, .3, 1.2, .2, PINK, .8);
    }
    function land() {
      w.ring(p.x, .15, 0, 1, 9, .45, pal.glow.getHex(), speed * .6, true);
      for (let i = 0; i < 10; i++) w.smokeP(p.x + rand(-2, 2), .4, rand(-2, 3), rand(-6, 6), rand(1, 3), speed * .8, .6, 1.5, 4, [.35, .2, .45], .4, .95);
      camBump = .7; w.shake(.12); sfx.land();
    }
    function setNitro(on) {
      if (on && !nitroHeld && state === 'play' && p.nitro > .05 && !paused) sfx.nitro();
      nitroHeld = on;
    }
    function crash(o) {
      p.hull--; p.inv = 1.7; speed *= .6; nitroHeld = false;
      w.explode(o ? (o.x + p.x) / 2 : p.x, 1.6 + p.y, -3, 1.3, PINK, speed * .5);
      if (o && o.type !== 'laser') { o.dead = true; w.explode(o.x, 1.5, o.z, 1.2, COL.orange, speed); }
      w.fx.hitStop = .1; w.shake(.7); w.fx.dmgA = 1;
      combo = 0; mult = 1; comboT = 0; sfx.crash();
      if (p.hull <= 0) die();
      else core.popText(w, p.x, 3.5, -3, 'HULL -1', '#ff3d6e', 18, 0);
    }
    function die() {
      p.alive = false; car.visible = false; state = 'dead'; deadT = 2.2;
      w.explode(p.x, 1.5 + p.y, 0, 4, PINK, speed * .3); w.explode(p.x, 1.5, -2, 2.4, COL.cyan, 0);
      sfx.big(); w.flash(.8); w.fx.slowT = 1.6; w.shake(1); w.fx.fovKick = 14;
      beamsOff();
    }
    function nearMiss(o) {
      bumpCombo();
      const pts = 150 * mult; scoreF += pts;
      const sx = o.x > p.x ? 1 : -1;
      core.popText(w, p.x + sx * 2, 3.6 + p.y, -4, 'NEAR MISS +' + pts.toLocaleString(), '#bff8ff', 17, 0);
      w.sparks(p.x + sx * CAR_HW, 1.4 + p.y, 0, [.8, 1, 1], 18, 18, speed * .4);
      w.fx.slowT = Math.max(w.fx.slowT, .25); p.nitro = Math.min(1, p.nitro + .04);
      sfx.near();
    }
    function collectOrb(b) {
      bumpCombo(); orbChain++; orbChainT = .8;
      const pts = 40 * mult; scoreF += pts; p.nitro = Math.min(1, p.nitro + .07);
      w.sparks(b.x, b.y, b.z, ORB, 10, 14, speed * .3);
      w.glowP(b.x, b.y, b.z, 0, 0, speed * .3, .18, 6, 10, ORB, .8);
      core.popText(w, b.x, b.y + 1.5, b.z, '+' + pts, '#ffd23f', 13);
      sfx.orb();
    }

    /* ---------- boss ---------- */
    function startBoss() {
      Object.assign(B, { active: true, mode: 'enter', x: 0, y: 24, z: -900, t: 0, maxHp: B.level > 1 ? 6 : 5, attackT: 3.5, phase: 0, empT: 1.5, flash: 0 });
      B.hp = B.maxHp; bossMesh.visible = true; bossMesh.rotation.set(0, 0, 0);
      core.showBanner('WARNING', '추격 드론 HUNTER-9 접근 · EMP 오브로 반격하라', '#ff3d6e', true); sfx.warn();
    }
    function beamsOff() { for (const bs of beamSets) bs.slant.visible = bs.ground.visible = false; groundU.warn.value.fill(0); if (B.phase) B.phase = 0; }
    function fireBolt() {
      const it = take(boltPool); if (!it) return;
      bolts.push({ item: it, x: p.x, y: HOVER + p.y + 1, z: -4 });
      w.ring(p.x, HOVER + p.y + 1, -4, 1, 8, .35, 0x6fd8ff, 0); sfx.emp();
    }
    function bossHit() {
      if (!B.active || B.mode !== 'fight') return;
      B.hp--; B.flash = .14;
      w.ring(B.x, B.y, B.z, 2, 18, .5, 0x6fd8ff, 0); w.sparks(B.x, B.y, B.z + 4, [.6, .9, 1], 34, 34, 0);
      w.lightFlash(B.x, B.y, B.z + 6, 8, 0x6fd8ff);
      w.fx.hitStop = Math.max(w.fx.hitStop, .06); w.shake(.3); sfx.bossHit();
      const pts = 500 * mult; scoreF += pts; core.popText(w, B.x, B.y + 6, B.z, 'EMP HIT +' + pts.toLocaleString(), '#9fe9ff', 18, 0);
      if (B.hp <= 0) {
        B.mode = 'dying'; B.dyingT = 2.4; B.chainT = 0; w.fx.slowT = 1.2; w.flash(.5); beamsOff();
        for (const e of emps) give(e.item); emps = [];
      }
    }
    function finishBoss() {
      w.explode(B.x, B.y, B.z, 6, PINK, 0); w.explode(B.x - 6, B.y, B.z, 3, COL.cyan, 0); w.explode(B.x + 6, B.y, B.z, 3, COL.gold, 0);
      sfx.big(); w.flash(1); w.fx.hitStop = .12; w.fx.slowT = 1.0; w.shake(1); w.fx.fovKick = 16;
      bumpCombo(); const pts = 5000 * B.level * mult; scoreF += pts;
      core.popText(w, B.x, B.y + 4, B.z, '+' + pts.toLocaleString(), '#ffd23f', 26, 0);
      core.showBanner('HUNTER-9 DOWN', '+' + pts.toLocaleString() + ' · 추격 드론 격파', '#ffd23f');
      B.active = false; B.level++; bossMesh.visible = false; p.nitro = 1;
    }
    function updateBoss(dt) {
      if (!B.active) return;
      B.t += dt;
      const u = bossMesh.userData;
      if (B.mode === 'enter') {
        B.z += (-120 - B.z) * damp(.9, dt); B.y += (13 - B.y) * damp(1, dt); B.x = Math.sin(B.t * .45) * 7;
        if (B.z > -136) B.mode = 'fight';
      } else if (B.mode === 'fight') {
        B.z += (-120 + Math.sin(B.t * .7) * 12 - B.z) * damp(1.5, dt);
        B.x = Math.sin(B.t * .45) * 7; B.y = 13 + Math.sin(B.t * 1.3) * 1.5;
        if (state === 'play' && p.alive) {
          B.empT -= dt;
          if (B.empT <= 0 && emps.length < 2) { const it = take(empPool); if (it) emps.push({ item: it, x: laneX(randInt(0, 4)), y: 2.2, z: -520, t: 0 }); B.empT = rand(2.8, 3.8); }
          if (B.phase === 0) {
            B.attackT -= dt;
            if (B.attackT <= 0) {
              const n = Math.min(3, 1 + (B.hp <= B.maxHp / 2 ? 1 : 0) + (B.level > 1 ? 1 : 0));
              const mine = clamp(Math.round((p.x + 12) / LANE_W), 0, 4), rest = shuffledLanes().filter(l => l !== mine);
              B.lanes = [mine].concat(rest.slice(0, n - 1));
              B.phase = 1; B.phaseT = 1.0; sfx.warn();
            }
          } else if (B.phase === 1) {
            B.phaseT -= dt;
            for (const l of B.lanes) groundU.warn.value[l] = .6 + .4 * Math.sin(T * 30);
            if (B.phaseT <= 0) { B.phase = 2; B.phaseT = .6; sfx.laser(); w.shake(.25); }
          } else if (B.phase === 2) {
            B.phaseT -= dt;
            B.lanes.forEach((l, j) => {
              const lx = laneX(l), bs = beamSets[j], fl = 1 + Math.sin(T * 70 + j) * .18;
              groundU.warn.value[l] = 1.6;
              bs.slant.visible = bs.ground.visible = true;
              bs.slant.position.set(B.x, B.y - 2.4, B.z + 4); bs.slant.lookAt(lx, .4, -25);
              bs.slant.scale.set(1.5 * fl, 1.5 * fl, bs.slant.position.distanceTo(_p.set(lx, .4, -25)));
              bs.ground.position.set(lx, .45, -25); bs.ground.rotation.set(0, 0, 0); bs.ground.scale.set(4.2 * fl, .9, 65);
              if (Math.random() < .6) w.glowP(lx + rand(-2, 2), .5, rand(-25, 30), rand(-4, 4), rand(4, 12), speed * .5, .25, 1.6, .2, COL.red, 1);
              if (p.inv <= 0 && p.alive && Math.abs(p.x - lx) < 2.1 + CAR_HW * .6 && p.y < 2) crash(null);
            });
            if (B.phaseT <= 0 || !p.alive) { beamsOff(); B.attackT = rand(1.4, 2.4) * (B.hp <= 2 ? .75 : 1); }
          }
        } else if (B.phase) beamsOff();
      } else if (B.mode === 'dying') {
        B.dyingT -= dt; B.chainT -= dt; B.y -= 3 * dt; B.z -= 6 * dt;
        bossMesh.rotation.z += dt * .9; bossMesh.rotation.x += dt * .3;
        if (B.chainT <= 0) { B.chainT = .13; w.explode(B.x + rand(-6, 6), B.y + rand(-3, 3), B.z + rand(-4, 4), rand(1, 1.8), Math.random() < .5 ? PINK : COL.orange, 0); audio.boom(.4, .4, 2000); }
        if (B.dyingT <= 0) { finishBoss(); return; }
      }
      bossMesh.position.set(B.x, B.y + Math.sin(T * 2.2) * .5, B.z);
      if (B.mode !== 'dying') bossMesh.rotation.set(Math.sin(B.t * .8) * .05, Math.sin(B.t * .6) * .15, -Math.cos(B.t * .45) * .12);
      for (const r of u.rotors) r.rotation.y += dt * 22;
      u.ring.rotation.z += dt * 1.5;
      const charge = B.phase === 1 ? 1.5 + Math.sin(T * 40) * .5 : 1;
      u.eye.scale.set(1.3 * charge, 1.3 * charge, .7);
      if (B.flash > 0 || B.flashOn) { B.flash -= dt; const k = Math.max(0, B.flash) * 12; B.flashOn = B.flash > 0; for (const mt of u.mats) mt.emissive.setRGB(k * .6, k * .9, k); }
    }

    /* ---------- flow ---------- */
    function setHud(on) { for (const id of ['nrTL', 'nrTR', 'nrBL', 'nrBR']) $(id).hidden = !on; if (!on) $('nrBoss').hidden = true; }
    function reset() {
      for (const o of obs) give(o.item); for (const e of emps) give(e.item); for (const b of bolts) give(b.item);
      obs = []; orbs = []; emps = []; bolts = [];
      B.active = false; B.level = 1; bossMesh.visible = false; beamsOff();
      Object.assign(p, { x: 0, tx: 0, y: 0, vy: 0, vx: 0, air: false, roll: 0, yaw: 0, pitch: 0, hull: 3, inv: 0, nitro: .6, alive: true });
      car.visible = true;
      scoreF = 0; combo = 0; comboT = 0; mult = 1; runT = 0; distU = 0; distM = 0; cp = 0; nextSpawn = 300; bossDelay = 0;
      orbChain = 0; nitroHeld = false; nitroOn = false; paused = false;
      palIdx = 0; w.fx.slowT = 0; w.fx.timeScale = 1;
    }
    function startGame() {
      if (state !== 'title' && state !== 'over') return;
      ensureAudio(); reset();
      state = 'count'; countT = 3; countN = 3;
      $('nrTitle').hidden = true; $('nrOver').hidden = true; $('nrPauseScr').hidden = true; setHud(true);
      core.showBanner('3', '엔진 예열 중', '#2de2ff'); sfx.count(); audio.drone(.035);
    }
    function launch() {
      state = 'play'; speed = Math.max(speed, 130);
      core.showBanner('GO!', 'NIGHT CITY · ROUTE 88', '#ffd23f');
      w.fx.fovKick = 20; w.flash(.45); w.shake(.2); sfx.go();
    }
    function gameOver() {
      state = 'over'; beamsOff();
      const final = Math.floor(scoreF), nb = final > best;
      if (nb) { best = final; core.saveBest('racer', best); }
      $('nrFinalScore').textContent = final.toLocaleString(); $('nrFinalDist').textContent = Math.floor(distM).toLocaleString() + 'm';
      $('nrNewBest').hidden = !nb; $('nrOver').hidden = false; setHud(false); $('nrAgain').focus();
      audio.drone(0);
    }
    function togglePause() {
      if (state !== 'play' && state !== 'count' && state !== 'dead') return;
      paused = !paused; $('nrPauseScr').hidden = !paused; $('nrPause').textContent = paused ? 'RESUME' : 'PAUSE';
      if (paused) { nitroHeld = false; keys.l = keys.r = false; $('nrResume').focus(); }
    }
    function toggleMute() { const m = audio.toggle(); $('nrMute').textContent = m ? 'SOUND OFF' : 'SOUND ON'; }
    function onCheckpoint() {
      palIdx = cp % 3;
      const bonus = 500 * cp; scoreF += bonus;
      core.showBanner('CHECKPOINT', (cp * 1000).toLocaleString() + 'm · ' + PALS[palIdx].name, PALS[palIdx].css);
      core.popText(w, p.x, 5, -10, 'CHECKPOINT +' + bonus.toLocaleString(), '#ffd23f', 20, 0);
      w.flash(.2); sfx.cp(); p.nitro = Math.min(1, p.nitro + .2);
      if (cp % 2 === 0 && !B.active) bossDelay = 2.6;
    }

    /* ---------- update ---------- */
    function update(dt, rdt) {
      T += dt;
      // speed
      nitroOn = state === 'play' && nitroHeld && p.nitro > .01 && p.alive;
      let target;
      if (state === 'play') target = Math.min(260, 90 + runT * 1.4) * (nitroOn ? 1.6 : 1);
      else if (state === 'dead') target = 0;
      else if (state === 'count') target = 26;
      else target = 34;
      speed += (target - speed) * damp(state === 'dead' ? 1.2 : nitroOn ? 2.2 : 1.1, dt);
      scroll += speed * dt; w.drift = speed;
      sf = clamp((speed - 90) / 326, 0, 1);
      groundU.scroll.value = scroll; groundU.time.value = T; skyU.time.value = T;
      w.fx.caExtra = sf * .003 + (nitroOn ? .002 : 0);
      if (nitroOn) { p.nitro = Math.max(0, p.nitro - .28 * dt); w.fx.fovKick = Math.max(w.fx.fovKick, 12); }

      if (state === 'count') {
        countT -= dt; const n = Math.ceil(countT);
        if (n !== countN && n > 0) { countN = n; core.showBanner(String(n), n === 1 ? '출발 준비' : '엔진 예열 중', '#2de2ff'); sfx.count(); }
        if (countT <= 0) launch();
      }
      if (state === 'play') {
        runT += dt; distU += speed * dt; distM = distU * .3; scoreF += speed * dt * .3;
        const c = Math.floor(distM / 1000); if (c > cp) { cp = c; onCheckpoint(); }
        if (bossDelay > 0) { bossDelay -= dt; if (bossDelay <= 0 && !B.active) startBoss(); }
        nextSpawn -= speed * dt;
        if (nextSpawn <= 0) { spawnRow(); const d = diffLevel(); nextSpawn = Math.max(95, (rand(150, 210) - d * 12) * clamp(speed / 170, .8, 1.5)) * (B.active ? 1.35 : 1); }
        comboT -= dt; if (comboT <= 0 && combo) { combo = 0; mult = 1; }
      }
      if (orbChainT > 0) { orbChainT -= dt; if (orbChainT <= 0) orbChain = 0; }
      if (state === 'dead') { deadT -= rdt; if (deadT <= 0) gameOver(); }

      // palette
      const P = PALS[palIdx], kp = damp(1.3, dt);
      palT.line.setHex(P.line); palT.glow.setHex(P.glow); palT.hor.setHex(P.hor); palT.fog.setHex(P.fog);
      pal.line.lerp(palT.line, kp); pal.glow.lerp(palT.glow, kp); pal.hor.lerp(palT.hor, kp);
      scene.fog.color.lerp(palT.fog, kp); scene.background.copy(scene.fog.color);
      glowMat.color.copy(pal.glow); edgeMat.color.copy(pal.glow); wireMat.color.copy(pal.glow);
      for (const lm of mtnLineMats) lm.color.copy(pal.line);
      for (const bm of bldMats) bm.emissive.copy(pal.glow).lerp(WHITE, .45);

      // scenery
      const mv = speed * dt;
      for (const k in farZ) farZ[k] += mv;
      for (const b of buildings) { b.m.position.z += mv; if (b.m.position.z > 80 + b.m.scale.z / 2) placeBuilding(b); }
      for (const a of arches) { a.position.z += mv; if (a.position.z > 50) a.position.z -= 900; }
      for (const s of signs) { s.position.z += mv; if (s.position.z > 50) placeSign(s, s.position.z - 900); }
      for (const d of slData) { d.z += (speed * 2.2 + 40) * dt; if (d.z > 15) placeSL(d, rand(-280, -200)); }
      const cx = cam.position.x;
      for (let i = 0; i < DN; i++) {
        const o = i * 3; dnPos[o + 2] += mv + 3 * dt; dnPos[o + 1] += Math.sin(T + i) * .5 * dt;
        if (dnPos[o + 2] > 20) { dnPos[o] = cx + rand(-45, 45); dnPos[o + 1] = rand(.4, 20); dnPos[o + 2] = rand(-330, -260); }
      }
      dnGeo.attributes.position.needsUpdate = true;

      // player
      if (state === 'title' || state === 'over') p.tx = Math.sin(T * .35) * 5;
      else if ((state === 'play' || state === 'count') && (keys.l || keys.r)) p.tx = clamp(p.x + ((keys.r ? 1 : 0) - (keys.l ? 1 : 0)) * 9, -PX_MAX, PX_MAX);
      const ox = p.x;
      p.x += (p.tx - p.x) * damp(state === 'play' || state === 'count' ? 7.5 : 2.5, dt);
      p.vx = (p.x - ox) / Math.max(dt, 1e-4);
      p.roll += (clamp(-p.vx * .035, -.55, .55) - p.roll) * damp(9, dt);
      p.yaw += (clamp(-p.vx * .012, -.25, .25) - p.yaw) * damp(9, dt);
      if (p.air) { p.vy -= GRAV * dt; p.y += p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; p.air = false; if (p.alive) land(); } }
      p.pitch += ((p.air ? clamp(p.vy * .012, -.25, .25) : 0) - p.pitch) * damp(6, dt);
      if (p.inv > 0) p.inv -= dt;
      const cy = HOVER + p.y + Math.sin(T * 6) * .06 + Math.sin(T * 13.7) * .02 * sf;
      car.position.set(p.x, cy, 0);
      car.rotation.set(p.pitch, p.yaw + Math.sin(T * 9) * .012 * sf, p.roll + Math.sin(T * 7.3) * .015);
      car.visible = p.alive && !(p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0);
      carB.under.material.opacity = (.5 + Math.sin(T * 12) * .08) / (1 + p.y * .35);
      if (p.alive) {
        const sr = Math.sin(p.roll);
        for (const s of [-1, 1]) {
          const tx = p.x + s * 1.75, ty = cy + .46 + s * 1.75 * sr;
          w.glowP(tx, ty, 3.5, 0, 0, speed * .92, .2 + sf * .12, 1.1, .25, TAILC, .85);
          w.glowP(tx, ty, 3.5 + speed * dt * .5, 0, 0, speed * .92, .2 + sf * .12, 1.0, .25, TAILC, .7);
          if (nitroOn) for (let k = 0; k < 2; k++) w.glowP(p.x + s * .62, cy + .62 + s * .62 * sr, 4.1, rand(-.6, .6), rand(-.6, .6), 50 + speed * .5, rand(.1, .18), rand(2.2, 3), .5, Math.random() < .6 ? BLUE : COL.white, 1);
          else if (Math.random() < .5) w.glowP(p.x + s * .62, cy + .62, 4.1, 0, 0, 30 + speed * .5, .08, 1.3, .3, BLUE, .8);
        }
        if (Math.random() < .55) w.glowP(p.x + rand(-1.8, 1.8), cy - .45, rand(-3, 3), rand(-1, 1), -1.5, speed * .95, .3, .55, .1, PINK, .9);
      }

      // obstacles
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i], z0 = o.z, m = o.item.mesh;
        o.z += (speed - o.cs) * dt; o.t += dt;
        if (o.type === 'traffic') {
          const bl = m.userData.blink;
          if (o.sw) {
            if (!o.sw.on && o.z > o.sw.at) { o.sw.on = true; o.sw.t = 0; }
            if (o.sw.on && o.sw.t < 3) {
              o.sw.t += dt; const on = Math.floor(o.sw.t * 6) % 2 === 0 && o.sw.t < 2.6;
              bl.l.visible = on && o.sw.dir < 0; bl.r.visible = on && o.sw.dir > 0;
              if (o.sw.t > .9) o.x += (o.sw.tx - o.x) * damp(2.6, dt);
            }
          }
          m.position.set(o.x, 0, o.z); m.rotation.y = o.sw && o.sw.on && o.sw.t > .9 && o.sw.t < 2.4 ? -o.sw.dir * .08 : 0;
        } else if (o.type === 'debris') {
          o.x += o.vx * dt; if (Math.abs(o.x) > 12.5) { o.x = clamp(o.x, -12.5, 12.5); o.vx = -o.vx; }
          m.position.set(o.x, 1.8, o.z); m.children[0].rotation.x += speed * dt / 1.8; m.children[0].rotation.z -= o.vx * dt / 1.8;
          m.children[1].rotation.y += dt * 1.5;
        } else {
          m.position.set(o.x, 0, o.z);
          if (o.type === 'laser') for (const b of m.userData.beams) b.scale.y = b.scale.z = .32 * (1 + Math.sin(T * 40 + b.position.y) * .25);
        }
        if (state === 'play' && p.alive && !o.hit && !o.dead) {
          const zOver = Math.min(z0, o.z) - o.hl < CAR_HL && Math.max(z0, o.z) + o.hl > -CAR_HL;
          if (zOver) {
            const lat = Math.abs(o.x - p.x) - (o.hw + CAR_HW);
            if (o.type === 'ramp') { if (lat < -.6 && !p.air) { jump(30); scoreF += 100 * mult; core.popText(w, p.x, 4, -4, 'AIR +' + 100 * mult, '#2de2ff', 16, 0); w.fx.fovKick = Math.max(w.fx.fovKick, 10); } }
            else {
              const clearY = p.y - (o.h - .35);
              if (lat < 0 && clearY < 0) { if (p.inv <= 0) { o.hit = true; crash(o); } else o.ghost = true; }
              else { const gap = lat >= 0 ? lat : clearY; if (gap < o.minGap) o.minGap = gap; }
            }
          }
        }
        if (!o.passed && o.z - o.hl > CAR_HL + .5) {
          o.passed = true;
          if (state === 'play' && p.alive && !o.hit && !o.ghost && o.type !== 'ramp' && o.minGap < 1.6) nearMiss(o);
        }
        if (o.z > 60 || o.dead) {
          if (o.type === 'traffic') { const bl = m.userData.blink; bl.l.visible = bl.r.visible = false; }
          give(o.item); obs.splice(i, 1);
        }
      }

      // orbs
      const pyc = HOVER + p.y + .4;
      for (let i = orbs.length - 1; i >= 0; i--) {
        const b = orbs[i]; b.z += mv; b.t += dt;
        if (state === 'play' && p.alive && Math.abs(b.x - p.x) < 2.5 && Math.abs(b.y - pyc) < 2.6 && b.z - mv < CAR_HL + 1 && b.z > -CAR_HL - 1) { collectOrb(b); orbs.splice(i, 1); continue; }
        if (b.z > 40) orbs.splice(i, 1);
      }
      // EMP orbs
      for (let i = emps.length - 1; i >= 0; i--) {
        const e = emps[i], m = e.item.mesh; e.z += mv; e.t += dt;
        m.position.set(e.x, e.y + Math.sin(e.t * 3) * .4, e.z); m.rotation.y += dt * 2; m.children[1].rotation.x += dt * 1.7;
        if (Math.random() < .5) w.glowP(e.x + rand(-1.5, 1.5), e.y + rand(-1.5, 1.5), e.z, 0, 0, speed * .3, .3, 1.4, .2, BLUE, .9);
        if (state === 'play' && p.alive && Math.abs(e.x - p.x) < 2.9 && e.z - mv < CAR_HL + 1.5 && e.z > -CAR_HL - 1.5 && p.y < 4) {
          w.sparks(e.x, e.y, 0, BLUE, 24, 22, speed * .3); w.ring(e.x, e.y, 0, 1, 10, .4, 0x6fd8ff, 0);
          give(e.item); emps.splice(i, 1);
          if (B.active && B.mode === 'fight') fireBolt(); else { scoreF += 300 * mult; sfx.orb(); }
          continue;
        }
        if (e.z > 40) { give(e.item); emps.splice(i, 1); }
      }
      // EMP bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i], m = b.item.mesh;
        if (!B.active || B.mode !== 'fight') { give(b.item); bolts.splice(i, 1); continue; }
        const dx = B.x - b.x, dy = B.y - b.y, dz = B.z - b.z, L = Math.hypot(dx, dy, dz) || 1, st = 320 * dt;
        if (L < st + 4) { give(b.item); bolts.splice(i, 1); bossHit(); continue; }
        b.x += dx / L * st; b.y += dy / L * st; b.z += dz / L * st;
        m.position.set(b.x, b.y, b.z);
        w.glowP(b.x, b.y, b.z, rand(-2, 2), rand(-2, 2), 30, .25, 2.4, .3, BLUE, 1);
      }
      updateBoss(dt);
      camBump *= Math.exp(-7 * dt);
    }

    /* ---------- camera ---------- */
    const camPos = new THREE.Vector3(0, 5, 14), look = new THREE.Vector3(0, 1, -20);
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
    function camera(rdt) {
      if (state !== 'title') camBlend = Math.min(1, camBlend + rdt * .7);
      const k = camBlend * camBlend * (3 - 2 * camBlend);
      _a.set(p.x * .72, 4.3 + p.y * .55 - camBump, 12.5 - sf * 1.6);
      _b.set(p.x * .88, 1.4 + p.y * .45, -34);
      const ang = Math.sin(T * .16) * 1.25;
      _c.set(p.x + Math.sin(ang) * 14, 3.2 + Math.sin(T * .4) * 1.2, Math.cos(ang) * 14 - 1);
      _d.set(p.x, 1.3, -1);
      _c.lerp(_a, k); _d.lerp(_b, k);
      camPos.lerp(_c, damp(k < 1 ? 4 : 6, rdt)); look.lerp(_d, damp(9, rdt));
      cam.position.copy(camPos); cam.lookAt(look); cam.rotateZ(p.roll * .22 * k);
      const fov = w.baseFov + w.fx.fovKick + sf * 8 + (w.fx.slowT > 0 ? -4 : 0);
      if (Math.abs(cam.fov - fov) > .05) { cam.fov += (fov - cam.fov) * damp(6, rdt); cam.updateProjectionMatrix(); }
      sky.position.copy(cam.position);
      mtn.position.set(cam.position.x, 0, cam.position.z);
      ground.position.set(cam.position.x, 0, cam.position.z - 1200);
    }

    /* ---------- draw ---------- */
    function draw() {
      let n = 0;
      for (const b of orbs) {
        if (n >= ORB_MAX) break;
        _p.set(b.x, b.y + Math.sin(b.t * 3) * .25, b.z);
        _e.set(0, b.t * 2.5, 0); _q.setFromEuler(_e); _s.set(.75, 1.05, .75); _m.compose(_p, _q, _s); orbCore.setMatrixAt(n, _m);
        _e.set(b.t * 1.3, -b.t * 1.7, 0); _q.setFromEuler(_e); _s.set(1.5, 1.5, 1.5); _m.compose(_p, _q, _s); orbShell.setMatrixAt(n, _m);
        n++;
      }
      orbCore.count = orbShell.count = n;
      orbCore.instanceMatrix.needsUpdate = orbShell.instanceMatrix.needsUpdate = true;
      const len = 4 + sf * 12 + (nitroOn ? 10 : 0), cx = cam.position.x;
      for (let i = 0; i < SL; i++) {
        const d = slData[i], o = i * 6;
        slPos[o] = cx + d.x; slPos[o + 1] = d.y; slPos[o + 2] = d.z;
        slPos[o + 3] = cx + d.x; slPos[o + 4] = d.y; slPos[o + 5] = d.z - d.l * len * .25;
      }
      slGeo.attributes.position.needsUpdate = true;
      slMat.opacity = state === 'title' ? .03 : .04 + sf * .18 + (nitroOn ? .2 : 0);
    }

    /* ---------- HUD ---------- */
    const hudCache = {};
    const setText = (id, v) => { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } };
    const pipEls = [...root.querySelectorAll('#nrPips span')];
    function hud() {
      const live = (state === 'play' || state === 'count') && !paused;
      engineVoice.set(55 + speed * .5 + (nitroOn ? 35 : 0), live ? .05 : 0, 300 + speed * 5);
      windVoice.set(0, live ? .01 + sf * .03 + (nitroOn ? .04 : 0) : 0, 500 + speed * 6);
      if (state !== 'play' && state !== 'dead' && state !== 'count') return;
      const sc = Math.floor(scoreF);
      setText('nrScore', sc.toLocaleString()); setText('nrMult', '×' + mult);
      dispSpeed += (speed * 1.6 - dispSpeed) * .25; setText('nrSpeed', String(Math.round(dispSpeed)));
      $('nrSpeedFill').style.width = (clamp(speed / 416, 0, 1) * 100).toFixed(1) + '%';
      $('nrSpeedBar').classList.toggle('boost', nitroOn);
      setText('nrDist', Math.floor(distM).toLocaleString() + 'm');
      setText('nrBest', Math.max(best, sc).toLocaleString());
      setText('nrCp', B.active ? 'BOSS · HUNTER-9' : 'NEXT CP ' + Math.ceil(1000 - distM % 1000).toLocaleString() + 'm');
      $('nrCombo').style.width = (combo ? Math.max(0, comboT / 3) * 100 : 0).toFixed(1) + '%';
      pipEls.forEach((el, i) => el.classList.toggle('on', i < p.hull));
      $('nrPips').classList.toggle('low', p.hull <= 1);
      $('nrNitro').style.width = (p.nitro * 100).toFixed(1) + '%';
      $('nrNitroBox').classList.toggle('on', nitroOn);
      setText('nrNitroPct', Math.round(p.nitro * 100) + '%');
      $('nrNitroBtn').classList.toggle('empty', p.nitro < .05);
      const showBoss = B.active && state !== 'over';
      $('nrBoss').hidden = !showBoss;
      if (showBoss) $('nrBossFill').style.width = (Math.max(0, B.hp / B.maxHp) * 100).toFixed(1) + '%';
    }

    /* ---------- input ---------- */
    const cv = $('c');
    let drag = null;
    function steerTo(clientX) {
      const W = core.W;
      if (!W || !isFinite(clientX) || (state !== 'play' && state !== 'count')) return;
      p.tx = clamp((clientX / W * 2 - 1) * PX_MAX * 1.25, -PX_MAX, PX_MAX);
    }
    window.addEventListener('keydown', e => {
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'KeyA') keys.l = true;
      else if (k === 'ArrowRight' || k === 'KeyD') keys.r = true;
      else if (k === 'ArrowUp' || k === 'KeyW') { e.preventDefault(); jump(); }
      else if (k === 'Space' || k === 'ShiftLeft' || k === 'ShiftRight') { e.preventDefault(); if (!e.repeat) setNitro(true); }
      else if (k === 'KeyM') toggleMute();
      else if (k === 'KeyP' || k === 'Escape') togglePause();
      else if (k === 'Enter' && (state === 'title' || state === 'over')) { e.preventDefault(); startGame(); }
    }, sig);
    window.addEventListener('keyup', e => {
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'KeyA') keys.l = false;
      else if (k === 'ArrowRight' || k === 'KeyD') keys.r = false;
      else if (k === 'Space' || k === 'ShiftLeft' || k === 'ShiftRight') { e.preventDefault(); setNitro(false); }
    }, sig);
    window.addEventListener('blur', () => { keys.l = keys.r = false; nitroHeld = false; }, sig);
    cv.addEventListener('pointerdown', e => {
      ensureAudio();
      if (e.pointerType === 'mouse') steerTo(e.clientX);
      else drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: p.tx, t: performance.now(), jumped: false };
    }, sig);
    cv.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') { steerTo(e.clientX); return; }
      if (!drag || drag.id !== e.pointerId || (state !== 'play' && state !== 'count')) return;
      const W = core.W || 1;
      if (isFinite(e.clientX)) p.tx = clamp(drag.px + (e.clientX - drag.sx) / W * 50, -PX_MAX, PX_MAX);
      if (!drag.jumped && drag.sy - e.clientY > 60 && performance.now() - drag.t < 400) { drag.jumped = true; jump(); }
    }, sig);
    const endDrag = e => { if (drag && drag.id === e.pointerId) drag = null; };
    cv.addEventListener('pointerup', endDrag, sig); cv.addEventListener('pointercancel', endDrag, sig);
    const nb = $('nrNitroBtn'), jb = $('nrJumpBtn');
    nb.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); setNitro(true); }, sig);
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) nb.addEventListener(ev, () => setNitro(false), sig);
    jb.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); jump(); }, sig);
    jb.addEventListener('click', e => { if (e.detail === 0) jump(); }, sig);
    $('nrMute').addEventListener('click', toggleMute, sig);
    $('nrPause').addEventListener('click', togglePause, sig);
    $('nrResume').addEventListener('click', togglePause, sig);
    $('nrStart').addEventListener('click', startGame, sig);
    $('nrAgain').addEventListener('click', startGame, sig);
    for (const id of ['nrBack1', 'nrBack2', 'nrBack3']) $(id).addEventListener('click', () => api.exit(), sig);
    document.addEventListener('visibilitychange', () => { if (document.hidden && !paused && (state === 'play' || state === 'count' || state === 'dead')) togglePause(); }, sig);

    $('nrMute').textContent = audio.muted ? 'SOUND OFF' : 'SOUND ON';
    $('nrBest').textContent = best.toLocaleString();
    $('nrStart').focus();

    core.run(w, ac.signal, { isPaused: () => paused, update, camera, draw, hud, slowScale: .3 });

    return {
      dispose() {
        ac.abort(); engineVoice.stop(); windVoice.stop(); audio.drone(0); core.clearFeedback();
        for (const t of texes) t.dispose();
        w.dispose(); root.innerHTML = ''; root.removeAttribute('style');
      }
    };
  }
};
})();
