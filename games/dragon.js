/* Sky Arcade — EMBERWING: a 3D dragon-flight action game over a volcanic canyon at dusk.
   Hold to breathe fire (heat gauge / overheat), F or right-click for fireballs, SHIFT to barrel-roll.
   Uses the shared engine in core.js (world, particles, explosions, audio, popups, banner). */
(() => {
'use strict';
const GAMES = window.GAMES || (window.GAMES = {});
const TAU = Math.PI * 2;

/* ================= dragon model (shared by menu turntable and game) ================= */
function dragonGeos(core) {
  return {
    memIn: core.wingGeo([[0, -.35], [4.6, -.7], [4.6, 2.2], [3.3, 1.7], [2.0, 2.5], [0, 2.7]], .06),
    memOut: core.wingGeo([[0, 0], [4.8, .8], [3.6, 1.6], [2.4, 1.9], [1.2, 2.2], [0, 2.9]], .06),
    spade: core.wingGeo([[0, 0], [.7, .55], [0, 1.6], [-.7, .55]], .1),
    crest: core.finGeo([[0, 0], [.9, 0], [.5, .7]], .08),
  };
}
function buildDragon(core, G) {
  const { GEO, part, mirror, M, E } = core;
  const root = new THREE.Group(); root.scale.setScalar(.7);
  const scale = M(0x5c1416, { metalness: .62, roughness: .34 });
  const dark = M(0x1b0c0e, { metalness: .5, roughness: .45 });
  const mem = M(0x6e1a16, { metalness: .15, roughness: .75, emissive: 0x220400 });
  const belly = M(0xff8a2a, { metalness: .25, roughness: .5, emissive: 0xff4a0a, emissiveIntensity: .55 });
  const horn = M(0xcfc0a0, { metalness: .3, roughness: .5 });
  const eye = E(0xffe08a);
  const body = new THREE.Group(); root.add(body);
  part(body, GEO.sph, scale, [0, 0, 0], [1.45, 1.25, 3.0]);
  part(body, GEO.sph, belly, [0, -.5, -.3], [1.05, .85, 2.4]);
  part(body, GEO.sph, scale, [0, .25, -2.0], [1.15, 1.05, 1.3]);
  part(body, GEO.sph, belly, [0, -.25, -2.3], [.8, .7, .9]);
  for (let i = 0; i < 5; i++) part(body, G.crest, dark, [0, 1.12 - i * .05, -1.8 + i * 1.0], [1, 1 - i * .1, 1]);
  mirror(body, GEO.cone, dark, [.95, -.95, 1.3], [.3, 1.3, .3], [2.2, 0, 0]);
  mirror(body, GEO.cone, dark, [.8, -.9, -1.8], [.22, 1.0, .22], [2.5, 0, 0]);
  // neck chain
  const neck = []; let parent = body, off = [0, .45, -2.7];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Group(); s.position.set(off[0], off[1], off[2]); parent.add(s);
    part(s, GEO.sph, scale, [0, 0, -.4], [.72 - i * .08, .66 - i * .07, .85]);
    part(s, GEO.sph, belly, [0, -.32, -.4], [.45 - i * .05, .3, .7]);
    part(s, G.crest, dark, [0, .55 - i * .05, -.75], [1, .7, .7]);
    neck.push(s); parent = s; off = [0, .18, -.8];
  }
  // head
  const head = new THREE.Group(); head.position.set(0, .1, -.85); parent.add(head);
  part(head, GEO.oct, scale, [0, .1, -.5], [.75, .55, 1.1]);
  part(head, GEO.box, scale, [0, -.02, -1.45], [.62, .38, 1.1]);
  mirror(head, GEO.cone, horn, [.35, .45, .1], [.12, 1.0, .12], [1.15, 0, -.25]);
  mirror(head, GEO.cone, horn, [.5, .15, .2], [.08, .6, .08], [1.3, 0, -.6]);
  mirror(head, GEO.sph, eye, [.34, .24, -.85], [.13, .09, .16]);
  mirror(head, GEO.sph, E(0xff5a1a), [.18, .05, -2.0], [.06, .05, .06]);
  const jaw = new THREE.Group(); jaw.position.set(0, -.28, -.5); head.add(jaw);
  part(jaw, GEO.box, dark, [0, 0, -.85], [.55, .16, 1.3]);
  mirror(jaw, GEO.cone, horn, [.2, .12, -1.35], [.05, .2, .05]);
  const mouthGlow = part(head, GEO.sph, E(0xffb347), [0, -.3, -1.55], [.26, .12, .55]);
  mouthGlow.visible = false;
  const mouth = new THREE.Object3D(); mouth.position.set(0, -.28, -2.15); head.add(mouth);
  // tail chain
  const tail = []; parent = body; off = [0, .05, 2.7];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Group(); s.position.set(off[0], off[1], off[2]); parent.add(s);
    const k = 1 - i / 6;
    part(s, GEO.sph, scale, [0, 0, .45], [.62 * k + .12, .55 * k + .1, .75]);
    if (i % 2 === 0) part(s, G.crest, dark, [0, .4 * k + .12, .1], [1, .6 * k + .3, .6]);
    tail.push(s); parent = s; off = [0, 0, .82];
  }
  part(parent, G.spade, dark, [0, 0, .9]);
  // wings
  const wings = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 1.0, .7, -1.4); body.add(pivot);
    const inner = new THREE.Group(); inner.scale.x = s; pivot.add(inner);
    part(inner, GEO.cyl, dark, [2.3, 0, -.35], [.17, 4.7, .17], [0, .151, Math.PI / 2]);
    part(inner, G.memIn, mem);
    const elbow = new THREE.Group(); elbow.position.set(4.6, 0, -.7); inner.add(elbow);
    part(elbow, G.memOut, mem);
    part(elbow, GEO.cyl, dark, [2.4, 0, .4], [.12, 4.9, .12], [0, -.165, Math.PI / 2]);
    part(elbow, GEO.cyl, dark, [1.8, 0, 1.0], [.07, 3.9, .07], [0, -.55, Math.PI / 2]);
    part(elbow, GEO.cone, horn, [0, .25, -.1], [.12, .6, .12]);
    wings.push({ pivot, elbow, s });
  }
  return { root, body, neck, head, jaw, tail, wings, mouth, mouthGlow, bellyMat: belly, ph: 0, t: 0, cyc: 0 };
}
// procedural flight animation; returns true on each wing downstroke
function animDragon(rig, dt, o) {
  rig.t += dt; rig.ph += dt * o.rate;
  const f = Math.sin(rig.ph), a = f * o.amp + .12 + o.glide * .2;
  for (const wg of rig.wings) {
    wg.pivot.rotation.z = wg.s * a;
    wg.pivot.rotation.y = -wg.s * (.12 + o.glide * .38);
    wg.elbow.rotation.z = Math.sin(rig.ph - .7) * o.amp * .7 - .05 + o.glide * .12;
  }
  rig.body.position.y = -f * .28 * o.amp;
  for (let i = 0; i < rig.neck.length; i++) {
    rig.neck[i].rotation.x = Math.sin(rig.ph - .8 - i * .5) * .1 * o.amp + o.lookY * .1;
    rig.neck[i].rotation.y = o.lookX * .1;
  }
  rig.head.rotation.x = o.lookY * .12 - .04;
  rig.jaw.rotation.x = -(o.breath * .5 + .04 + Math.max(0, Math.sin(rig.t * .7)) * .03);
  for (let i = 0; i < rig.tail.length; i++) {
    rig.tail[i].rotation.y = Math.sin(rig.t * 1.6 - i * .55) * .09 + o.tailYaw * .12;
    rig.tail[i].rotation.x = Math.sin(rig.ph - 1.4 - i * .6) * .12 * o.amp;
  }
  rig.bellyMat.emissiveIntensity = .55 + o.breath * 1.8 + Math.sin(rig.t * 3) * .08;
  rig.mouthGlow.visible = o.breath > .1;
  const cyc = Math.floor((rig.ph - Math.PI) / TAU);
  if (cyc !== rig.cyc) { rig.cyc = cyc; return true; }
  return false;
}

/* ================= shaders ================= */
const SKY_V = `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const SKY_F = `uniform float time, flash; uniform vec3 sunDir, lDir, fogC; varying vec3 vD;
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x), mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*n2(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
void main(){
  vec3 d = normalize(vD); float h = d.y;
  vec3 zen = vec3(.06,.02,.11), mid = vec3(.36,.09,.13), hor = fogC*1.3;
  vec3 c = mix(hor, mid, smoothstep(.0,.2,h));
  c = mix(c, zen, smoothstep(.16,.62,h));
  c = mix(c, fogC, smoothstep(.0,-.08,h));
  float s = max(dot(d,sunDir),0.);
  c += vec3(1.,.32,.12)*pow(s,6.)*.55 + vec3(1.,.42,.2)*pow(s,70.)*.7;
  c += smoothstep(.9965,.998,s)*vec3(1.3,.45,.22);
  float az = atan(d.x,-d.z);
  float b = fbm(vec2(az*4.+time*.02, h*16.-time*.05));
  float ash = smoothstep(.42,.8,b)*smoothstep(.5,.02,h)*smoothstep(-.04,.06,h);
  c = mix(c, vec3(.13,.06,.06), ash*.6);
  float b2 = fbm(vec2(az*9.-time*.04, h*40.));
  c += vec3(.5,.14,.05)*smoothstep(.55,.9,b2)*smoothstep(.25,.0,h)*.25;
  float st = step(.9972, h3(floor(d*380.)))*smoothstep(.3,.65,h);
  c += st*vec3(1.,.85,.8)*.8;
  float lf = max(dot(d,lDir),0.);
  c += flash*(vec3(.85,.65,1.)*pow(lf,10.)*1.6 + vec3(.25,.15,.3)*smoothstep(.4,0.,h)*.6);
  gl_FragColor = vec4(c,1.);
}`;
const LAVA_V = `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const LAVA_F = `uniform float time, scroll, fogNear, fogFar; uniform vec3 fogC; varying vec3 vW;
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec2 h22(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x), mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x), f.y); }
float vor(vec2 p, out float f1){
  vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y)); vec2 o=h22(i+g); o=.5+.4*sin(time*.4+6.2831*o);
    vec2 r=g+o-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d;
  }
  f1=sqrt(d1); return sqrt(d2)-sqrt(d1);
}
void main(){
  vec2 p = vec2(vW.x, vW.z - scroll);
  vec2 sh = vec2(sin(p.y*.05+time*2.)*.7, cos(p.x*.04+time*1.7)*.5);
  float f1; float e = vor((p+sh)*.035, f1);
  float flow = n2(p*.02 + vec2(0., time*.25));
  float crack = 1. - smoothstep(.0, .08 + flow*.09, e);
  float river = 1. - smoothstep(22., 64., abs(vW.x));
  float hot = crack*(.55+.45*flow) + river*smoothstep(.5,.85,n2(p*.04+vec2(time*.3,-time*.6)))*.9;
  vec3 crust = mix(vec3(.05,.022,.022), vec3(.13,.05,.04), f1);
  vec3 lava = mix(vec3(1.,.24,.03), vec3(1.7,.95,.32), clamp(hot*1.2-.25,0.,1.));
  vec3 c = mix(crust, lava*1.3, clamp(hot,0.,1.));
  c += vec3(.28,.06,0.)*river*.35;
  float d = length(vW.xz - cameraPosition.xz);
  c = mix(c, fogC, smoothstep(fogNear, fogFar, d));
  gl_FragColor = vec4(c,1.);
}`;

const TEMPLATE = `<style>
#score{font-size:32px;line-height:1;font-weight:700}
#multRow{display:flex;align-items:center;gap:8px;height:18px}
#mult{font-size:15px;color:var(--gold);font-weight:700;min-width:34px}
#comboBar{width:96px;height:3px;background:rgba(255,255,255,.14);overflow:hidden}
#comboFill{height:100%;width:0;background:linear-gradient(90deg,var(--hot),var(--gold))}
#hudTR{align-items:flex-end}
#hudBR{flex-direction:row;align-items:flex-end;gap:10px}
#heatRow{display:flex;align-items:center;gap:8px;margin-top:4px}
#heatTag{min-width:64px}
#heatTag.over{color:var(--warn)}
#heatBar{width:140px;height:8px;background:rgba(255,255,255,.12);transform:skewX(-20deg);overflow:hidden}
#heatFill{height:100%;width:0;background:linear-gradient(90deg,#ffd166,#ff7a1a 60%,#ff2a1a);box-shadow:0 0 10px rgba(255,122,26,.7)}
#heatBar.over{outline:1px solid var(--warn);animation:ewOver .3s steps(2) infinite}
@keyframes ewOver{50%{opacity:.3}}
#runeTag{font-size:12px;color:#d9a6ff;min-height:15px;letter-spacing:.12em}
#fireBtn{--tint:rgba(255,122,26,.5);--edge:rgba(255,170,70,.85);width:84px;height:84px;touch-action:none}
#fireBtn.on{filter:brightness(1.45)}
#fbBtn{--tint:rgba(255,209,102,.35);--edge:rgba(255,209,102,.7);width:64px;height:64px}
#rollBtn{--tint:rgba(255,224,138,.2);--edge:rgba(255,224,138,.55);width:54px;height:54px}
#retAim{width:36px;height:36px;margin:-18px 0 0 -18px}
#retAim i{border-color:var(--gold);filter:drop-shadow(0 0 4px var(--hot))}
#retAim.lock i{border-color:var(--warn);filter:drop-shadow(0 0 6px var(--warn))}
#ewTitle .sub{max-width:44ch}
@media (max-width:560px){#score{font-size:24px}#fireBtn{width:72px;height:72px}#fbBtn{width:58px;height:58px}#rollBtn{width:50px;height:50px}#heatBar{width:110px}}
</style>
<div class="ret" id="retAim" hidden><i></i><i></i><i></i><i></i></div>
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
  <div class="lbl">VITALITY</div>
  <div class="pips" id="pips"><span></span><span></span><span></span><span></span><span></span></div>
  <div id="heatRow"><span class="lbl" id="heatTag">HEAT</span><div id="heatBar"><div id="heatFill"></div></div></div>
  <div id="runeTag"></div>
</div>
<div class="hud br" id="hudBR" hidden>
  <button id="rollBtn" class="round" type="button"><span>ROLL</span></button>
  <button id="fbBtn" class="round" type="button"><span>BALL</span><small>FIRE</small></button>
  <button id="fireBtn" class="round" type="button"><span>FIRE</span><small>HOLD</small></button>
</div>
<div class="bossbar" id="bossBar" hidden><span class="lbl">WAR AIRSHIP “IRONCLAD DREAD”</span><div class="bosstrack"><div class="bossfill" id="bossFill"></div></div></div>
<div class="screen bottom" id="ewTitle">
  <div class="card">
    <div class="kicker">ASHEN CANYON · 화산 협곡</div>
    <h1>EMBER<span>WING</span></h1>
    <p class="sub">용암이 흐르는 협곡 위로 날아올라, 비행기사단과 철갑 전함을 불길로 집어삼키세요.</p>
    <button class="go" id="startBtn" type="button">비상하기</button>
    <div class="keys">
      <span><kbd>마우스</kbd> <kbd>드래그</kbd> <kbd>WASD</kbd></span><span>이동</span>
      <span><kbd>클릭</kbd> <kbd>SPACE</kbd> 꾹</span><span>불 뿜기 (과열 주의)</span>
      <span><kbd>F</kbd> <kbd>우클릭</kbd></span><span>화염구</span>
      <span><kbd>SHIFT</kbd> <kbd>E</kbd></span><span>회피 롤 (잠시 무적)</span>
      <span><kbd>P</kbd> <kbd>M</kbd></span><span>일시정지 · 소리</span>
    </div>
    <div class="legend"><span><b style="background:#3dffb5"></b>용의 보석</span><span><b style="background:#ff4f6b"></b>생명 +1</span><span><b style="background:#c77dff"></b>룬 · 화염구 ×3</span></div>
    <button class="mini" id="menuBtn1" type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="ewPause" hidden>
  <div class="card">
    <div class="kicker">PAUSED</div>
    <p class="over-title" style="color:var(--ink);text-shadow:none">일시정지</p>
    <button class="go" id="resumeBtn" type="button">계속하기</button>
    <button class="mini" id="menuBtn2" type="button">◀ 게임 선택</button>
  </div>
</div>
<div class="screen" id="ewOver" hidden>
  <div class="card">
    <div class="kicker">THE FLAME FADES</div>
    <p class="over-title">추락</p>
    <div class="result">
      <div><span class="lbl">SCORE</span><b id="finalScore">0</b></div>
      <div><span class="lbl">WAVE</span><b id="finalWave">1</b></div>
    </div>
    <div class="newbest" id="newBest" hidden>NEW BEST RECORD</div>
    <button class="go" id="againBtn" type="button">다시 날기</button>
    <button class="mini" id="menuBtn3" type="button">◀ 게임 선택</button>
  </div>
</div>`;

GAMES.dragon = {
  id: 'dragon', title: 'Emberwing',
  model(core) {
    const rig = buildDragon(core, dragonGeos(core));
    rig.ph = Math.PI * .5;
    animDragon(rig, 0, { rate: 0, amp: .25, glide: 0, breath: 0, lookX: 0, lookY: 0, tailYaw: 0 });
    rig.root.position.z = -.75;
    const g = new THREE.Group(); g.add(rig.root); return g;
  },

  mount(root, core, api) {
    const { rand, pick, clamp, lerp, damp, GEO, part, mirror, M, E, COL, C } = core;
    const $ = core.$, A = core.audio;
    root.style.setProperty('--hot', '#ff7a1a'); root.style.setProperty('--cyan', '#ffd166'); root.style.setProperty('--gold', '#ffe08a');
    root.innerHTML = TEMPLATE;
    const ac = new AbortController(), sig = { signal: ac.signal };
    const S = 150; // forward world speed
    const w = core.createWorld({ fog: 0x6e2618, fogNear: 120, fogFar: 900, fov: 66, drift: S, bloom: [.85, .5, .78], debrisColor: 0x3a2a22 });
    const scene = w.scene, camera = w.camera;
    const ownGeos = [];
    const keepG = g => { ownGeos.push(g); return g; };
    const glowP = w.glowP, smokeP = w.smokeP;
    let fireVoice = { set() {}, stop() {} }, voiceMade = false;
    function audioInit() { A.init(); if (!voiceMade) { voiceMade = true; fireVoice = A.voice('noise', 'bandpass', 700); } }

    /* ---------- lights, sky, lava ---------- */
    const SUN = new THREE.Vector3(-.45, .2, -1).normalize();
    scene.add(new THREE.HemisphereLight(0xff9a70, 0x2a0806, .65));
    const sunL = new THREE.DirectionalLight(0xff9a5a, 1.7); sunL.position.copy(SUN).multiplyScalar(100); scene.add(sunL);
    const lavaL = new THREE.DirectionalLight(0xff5a1a, 1.1); lavaL.position.set(0, -1, .25); scene.add(lavaL);
    const skyU = { time: { value: 0 }, flash: { value: 0 }, sunDir: { value: SUN }, lDir: { value: new THREE.Vector3(0, .1, -1).normalize() }, fogC: { value: w.fogColor } };
    const sky = new THREE.Mesh(keepG(new THREE.SphereGeometry(2000, 32, 16)), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU, vertexShader: SKY_V, fragmentShader: SKY_F }));
    scene.add(sky);
    const lavaU = { time: { value: 0 }, scroll: { value: 0 }, fogC: { value: w.fogColor }, fogNear: { value: 140 }, fogFar: { value: 950 } };
    const lava = new THREE.Mesh(keepG(new THREE.PlaneGeometry(2400, 2400)), new THREE.ShaderMaterial({ uniforms: lavaU, fog: false, vertexShader: LAVA_V, fragmentShader: LAVA_F }));
    lava.rotation.x = -Math.PI / 2; lava.position.y = -22; scene.add(lava);

    /* ---------- canyon ---------- */
    const rockGeos = [core.rockGeo(1), core.rockGeo(1), core.rockGeo(1)].map(keepG);
    const basalt = new THREE.MeshStandardMaterial({ color: 0x2b1d1c, roughness: .92, metalness: .12, flatShading: true, emissive: 0x2a0800, emissiveIntensity: .6 });
    const basalt2 = new THREE.MeshStandardMaterial({ color: 0x3a2622, roughness: .9, metalness: .1, flatShading: true, emissive: 0x3a0c00, emissiveIntensity: .45 });
    const walls = [], WALL_N = 22, WALL_SP = 62;
    function placeWall(r, z) {
      const sx = rand(28, 48), sy = rand(55, 130), sz = rand(34, 50);
      r.m.scale.set(sx, sy, sz);
      r.m.position.set(r.side * (rand(78, 96) + sx * .35), -22 + sy * .25, z);
      r.m.rotation.set(rand(-.15, .15), rand(0, TAU), rand(-.1, .1));
    }
    for (const side of [-1, 1]) for (let i = 0; i < WALL_N; i++) {
      const m = new THREE.Mesh(pick(rockGeos), Math.random() < .5 ? basalt : basalt2);
      const r = { m, side }; placeWall(r, 60 - i * WALL_SP + rand(-10, 10)); scene.add(m); walls.push(r);
    }
    const pillarGeo = keepG(new THREE.CylinderGeometry(1, 1.25, 1, 6));
    const pillars = [];
    function placePillar(r, z) {
      const side = Math.random() < .5 ? -1 : 1, s = rand(3, 7), h = rand(25, 80);
      r.m.scale.set(s, h, s); r.m.position.set(side * rand(36, 62), -22 + h / 2, z); r.m.rotation.y = rand(0, TAU);
    }
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(pillarGeo, basalt2); const r = { m }; placePillar(r, rand(-1300, 40)); scene.add(m); pillars.push(r); }
    const archGeo = keepG(new THREE.TorusGeometry(84, 8, 5, 16, Math.PI));
    const arches = [];
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(archGeo, basalt); m.position.set(rand(-8, 8), -22, -700 - i * 1200); m.scale.set(1, rand(.88, 1.1), 1.6);
      scene.add(m); arches.push(m);
    }
    const vents = [];
    for (let i = 0; i < 5; i++) vents.push({ x: rand(-70, 70), z: rand(-900, -100), t: 0 });

    /* ---------- player dragon ---------- */
    const DG = dragonGeos(core); Object.values(DG).forEach(keepG);
    const rig = buildDragon(core, DG); scene.add(rig.root);
    const dragon = rig.root;

    /* ---------- enemy models ---------- */
    const KG = {
      wing: keepG(core.wingGeo([[0, -.4], [3.4, .2], [3.0, 1.2], [1.4, 1.0], [0, 1.2]], .06)),
      sail: keepG((() => { const g = new THREE.PlaneGeometry(1, 1, 4, 3), ps = g.attributes.position; for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i); ps.setZ(i, (1 - 4 * x * x) * (1 - 2 * Math.abs(y) * .5) * .16); } g.computeVertexNormals(); return g; })()),
    };
    function buildKnight() {
      const g = new THREE.Group();
      const hide = M(0x46523e, { metalness: .3, roughness: .6 }), dark = M(0x1c1a18, { metalness: .3, roughness: .7 }), armor = M(0x9aa0aa, { metalness: .85, roughness: .25 }), cloth = M(0xa01818, { metalness: .1, roughness: .8 });
      part(g, GEO.oct, hide, null, [1.1, .8, 2.4]);
      part(g, GEO.sph, hide, [0, .3, 1.9], [.45, .45, .8]);
      part(g, GEO.cone, dark, [0, .35, 2.8], [.3, .8, .3], [Math.PI / 2, 0, 0]);
      part(g, GEO.cone, hide, [0, 0, -2.8], [.35, 2.4, .35], [-Math.PI / 2, 0, 0]);
      mirror(g, GEO.sph, E(0xff5a1a), [.22, .45, 2.4], [.08, .08, .08]);
      const wings = [];
      for (const s of [1, -1]) {
        const pv = new THREE.Group(); pv.position.set(s * .6, .3, .2); g.add(pv);
        const inn = new THREE.Group(); inn.scale.x = s; pv.add(inn); part(inn, KG.wing, dark);
        wings.push({ pv, s });
      }
      part(g, GEO.box, armor, [0, 1.1, -.2], [.7, 1.0, .55]);
      part(g, GEO.sph, armor, [0, 1.85, -.15], [.32, .34, .32]);
      part(g, GEO.box, cloth, [0, 1.0, -.6], [.75, 1.1, .1]);
      part(g, GEO.cone, armor, [.55, 1.1, 1.4], [.12, 3.6, .12], [Math.PI / 2, 0, 0]);
      part(g, GEO.sph, E(0xfff0c0), [.55, 1.1, 3.2], [.2, .2, .2]);
      g.userData.wings = wings;
      return g;
    }
    function buildBalloon() {
      const g = new THREE.Group();
      const env = M(0x8c3a22, { metalness: .1, roughness: .75 }), band = M(0x2a1a14, { metalness: .4, roughness: .6 }), wood = M(0x4a3020, { metalness: .1, roughness: .9 }), armor = M(0x8a8f99, { metalness: .8, roughness: .3 });
      part(g, GEO.sph, env, [0, 3, 0], [4.6, 5.4, 4.6]);
      part(g, GEO.cyl, band, [0, 3, 0], [4.72, .5, 4.72]);
      part(g, GEO.cyl, band, [0, 6.4, 0], [3.3, .4, 3.3]);
      for (const [x, z] of [[1.3, 1.3], [-1.3, 1.3], [1.3, -1.3], [-1.3, -1.3]]) part(g, GEO.cyl, band, [x, -1.9, z], [.06, 3.4, .06]);
      part(g, GEO.box, wood, [0, -4.4, 0], [3, 1.8, 3]);
      part(g, GEO.sph, E(0xffa040), [0, -2.4, 0], [.5, .5, .5]);
      for (const [x, z] of [[-.9, .9], [.9, .9], [0, -.9]]) {
        part(g, GEO.box, armor, [x, -3.1, z], [.45, .8, .4]);
        part(g, GEO.box, wood, [x, -3.0, z + .5], [.9, .12, .12]);
      }
      g.userData.envMat = env;
      return g;
    }
    function buildTower() {
      const g = new THREE.Group();
      const stone = M(0x3a2a24, { metalness: .1, roughness: .9 }), wood = M(0x5a3a22, { metalness: .1, roughness: .85 }), iron = M(0x50555e, { metalness: .8, roughness: .3 });
      part(g, rockGeos[0], stone, [0, -17, 0], [6, 18, 6]);
      part(g, GEO.cyl, stone, [0, -.5, 0], [4.2, 2.4, 4.2]);
      part(g, GEO.box, wood, [0, 1.4, 0], [3, 1.6, 3]);
      const tur = new THREE.Group(); tur.position.set(0, 2.8, 0); tur.rotation.order = 'YXZ'; g.add(tur);
      part(tur, GEO.box, wood, [0, 0, .4], [1, .6, 5]);
      part(tur, GEO.box, iron, [0, .1, 1.8], [6, .25, .35]);
      part(tur, GEO.cone, iron, [0, .35, 3.0], [.15, 1.4, .15], [Math.PI / 2, 0, 0]);
      const eye = part(tur, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: .15, blending: THREE.AdditiveBlending, depthWrite: false }), [0, .35, 3.6], [.7, .7, .7]);
      g.userData.tur = tur; g.userData.eye = eye;
      return g;
    }
    function buildBoss() {
      const g = new THREE.Group();
      const iron = M(0x2c2826, { metalness: .8, roughness: .35 }), dark = M(0x14100f, { metalness: .6, roughness: .5 }), wood = M(0x5a3b26, { metalness: .1, roughness: .85 }), brass = M(0xb08a3a, { metalness: .9, roughness: .3 });
      part(g, GEO.box, iron, [0, 0, 0], [14, 7, 52]);
      part(g, GEO.box, dark, [0, -5, 0], [7, 4, 46]);
      part(g, GEO.cone, iron, [0, -.5, 31], [7.2, 10, 3.6], [Math.PI / 2, 0, 0]);
      part(g, GEO.box, dark, [0, 1.5, -27], [12, 9, 6]);
      part(g, GEO.box, wood, [0, 3.75, 0], [13, .5, 50]);
      part(g, GEO.box, iron, [0, 6, -18], [8, 4, 9]);
      mirror(g, GEO.box, brass, [7.05, 1, 0], [.2, .5, 50]);
      mirror(g, GEO.cyl, dark, [2.6, 9.5, -21], [1, 7, 1]);
      mirror(g, GEO.sph, E(0xff7a2a), [2.6, 13.1, -21], [.8, .3, .8]);
      for (let i = 0; i < 6; i++) {
        const z = -18 + i * 7.5;
        mirror(g, GEO.cyl, dark, [7.6, 1.5, z], [.7, 3.2, .7], [Math.PI / 2, 0, 0]);
        mirror(g, GEO.sph, E(0xff7a2a), [7.6, 1.5, z + 1.7], [.55, .55, .25]);
      }
      mirror(g, GEO.cyl, dark, [2.5, 2, 35], [.9, 4, .9], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 7; i++) mirror(g, GEO.sph, E(0xffc070), [6.6, 4.4, -21 + i * 7], [.3, .3, .3]);
      const sails = [];
      for (const z of [16, 2, -12]) {
        part(g, GEO.cyl, wood, [0, 14, z], [.45, 21, .45]);
        part(g, GEO.box, wood, [0, 17, z + .3], [13, .35, .35]);
        part(g, GEO.box, wood, [0, 23.2, z + .3], [9.5, .3, .3]);
        part(g, GEO.box, E(0xc81e1e), [0, 25.2, z], [.1, .9, 1.6]);
        for (const big of [true, false]) {
          const mat = new THREE.MeshStandardMaterial({ color: 0xcdb58a, roughness: .9, metalness: 0, side: THREE.DoubleSide, flatShading: true });
          mat.userData.sail = true;
          const m = part(g, KG.sail, mat, [0, big ? 12.7 : 20.2, z + .6], big ? [12, 8.4, 12] : [8.6, 5.2, 8.6]);
          sails.push({ m, mat, big, hp: big ? 90 : 60, max: big ? 90 : 60, burn: 0, down: false, wp: new THREE.Vector3(0, 0, -2000) });
        }
      }
      const props = [];
      for (const s of [-1, 1]) {
        const pg = new THREE.Group(); pg.position.set(s * 5, -2, -30.5); g.add(pg);
        part(pg, GEO.cyl, brass, null, [.6, 1.2, .6], [Math.PI / 2, 0, 0]);
        for (let k = 0; k < 4; k++) part(pg, GEO.box, dark, null, [.7, 7, .15], [0, 0, k * Math.PI / 4 * 2 + .3]);
        props.push(pg);
      }
      for (const s of [-1, 1]) {
        const pg = new THREE.Group(); pg.position.set(s * 9.5, -1, 8); g.add(pg);
        part(pg, GEO.cyl, iron, [0, 0, 0], [.4, 3, .4], [0, 0, Math.PI / 2]);
        for (let k = 0; k < 3; k++) part(pg, GEO.box, dark, [s * 1.5, 0, 0], [.12, 4.5, .5], [k * TAU / 3, 0, 0]);
        props.push(pg);
      }
      g.userData.sails = sails; g.userData.props = props;
      return g;
    }
    const BUILD = { knight: buildKnight, balloon: buildBalloon, tower: buildTower, boss: buildBoss };
    const DEFS = {
      knight: { hp: 5, r: 3, score: 150, ex: 1.2, col: COL.ember },
      balloon: { hp: 16, r: 6, score: 450, ex: 2.2, col: COL.orange },
      tower: { hp: 20, r: 5, score: 650, ex: 2.2, col: COL.red },
      boss: { hp: 1150, r: 20, score: 40000, ex: 6, col: COL.red },
    };
    const HULL = [[0, 0, -20], [0, 0, 0], [0, 0, 20]];

    /* ---------- projectiles (instanced) ---------- */
    const SP_MAX = 360, ORB_MAX = 600, FB_MAX = 40;
    const spearMesh = new THREE.InstancedMesh(keepG(new THREE.BoxGeometry(.28, .28, 4.2)), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), SP_MAX);
    const orbMesh = new THREE.InstancedMesh(keepG(new THREE.SphereGeometry(1, 12, 8)), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), ORB_MAX);
    const fbMesh = new THREE.InstancedMesh(keepG(new THREE.IcosahedronGeometry(1.2, 1)), new THREE.MeshBasicMaterial({ color: 0xffe2a0, fog: false }), FB_MAX);
    const _c = new THREE.Color(1, 1, 1);
    for (const [mesh, n] of [[spearMesh, SP_MAX], [orbMesh, ORB_MAX], [fbMesh, FB_MAX]]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0;
      for (let i = 0; i < n; i++) mesh.setColorAt(i, _c);
      scene.add(mesh);
    }
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _Z = new THREE.Vector3(0, 0, 1);
    const _mw = new THREE.Vector3(0, 10, -5), aim = new THREE.Vector3(0, 0, -1), _v = new THREE.Vector3();

    /* ---------- audio ---------- */
    const sfx = {
      hit: () => A.tone(1300, .03, 'square', .016, 800),
      pop: () => { A.boom(.45, .38, 2200); A.tone(160, .22, 'sawtooth', .05, 55); },
      big: () => { A.boom(1.2, .75, 1600); A.tone(80, .7, 'sawtooth', .12, 28); },
      hurt: () => { A.boom(.45, .55, 700); A.tone(260, .3, 'square', .08, 70); },
      power: () => [523, 659, 784, 1047].forEach((f, i) => A.tone(f, .12, 'triangle', .05, 0, i * .06)),
      warn: () => [0, .4, .8, 1.2].forEach(d => A.tone(440, .28, 'sawtooth', .07, 330, d)),
      fireball: () => { A.noise(.55, .3, 500, 'bandpass', 2600); A.tone(150, .35, 'sawtooth', .07, 55); },
      roll: () => A.noise(.45, .18, 2400, 'bandpass', 400),
      shot: () => A.tone(rand(300, 340), .08, 'sawtooth', .02, 160),
      thump: v => A.tone(72, .2, 'sine', v, 38),
      sizzle: () => { A.noise(.9, .28, 5000, 'highpass', 1800); A.tone(900, .35, 'square', .025, 180); },
      cannon: () => { A.boom(.6, .5, 900); A.tone(90, .4, 'sine', .15, 40); },
      thunder: () => A.noise(1.8, .35, 420, 'lowpass', 60),
      roar: () => { A.tone(210, 1.0, 'sawtooth', .11, 62); A.tone(140, 1.1, 'sawtooth', .08, 45, .05); A.noise(1.1, .32, 1400, 'bandpass', 220); },
    };

    /* ---------- state ---------- */
    const p = { x: 0, y: 10, z: 0, tx: 0, ty: 10, vx: 0, vy: 0, roll: 0, pitch: 0, hp: 5, inv: 0, alive: true, rollT: 0, rollCd: 0, rollDir: 1, heat: 0, overT: 0, coolD: 0, fbCd: 0, runeT: 0, breathK: 0 };
    const BX = 26, BY0 = -4, BY1 = 24, RANGE = 95, BREATH_DPS = 30;
    let state = 'title', paused = false, T = 0, camBlend = 0, scroll = 0;
    let enemies = [], eB = [], fbs = [], pickups = [], fallers = [];
    const timers = [];
    let score = 0, best = core.best('dragon'), combo = 0, comboT = 0, mult = 1;
    let wave = 1, waveT = 0, spawnT = 2, bossActive = false, deadT = 0, lightT = 4;
    let breathing = false, lockOn = false, mouseHeld = false, btnFire = false;
    const after = (t, fn) => timers.push({ t, fn });
    let dtNow = .016;
    const chance = k => Math.random() < k * dtNow * 60;

    /* ---------- enemies ---------- */
    function diff() { return 1 + (wave - 1) * .12; }
    function targetable(e) { return e.d <= 0 && !e.dead && !(e.dying > 0); }
    function addEnemy(kind, o) {
      const d = DEFS[kind], sc = kind === 'boss' ? 1 + (wave / 4 - 1) * .45 : 1 + (wave - 1) * .1;
      const mesh = BUILD[kind]();
      const mats = core.enemyMats(mesh).filter(m => !m.userData.sail);
      const e = Object.assign({ kind, x: 0, y: 10, z: -700, x0: 0, y0: 0, vx: 0, vy: 0, vz: 0, cvz: 0, t: 0, d: 0, flash: 0, burnFx: 0, amp: 0, f: 0, ph: rand(0, TAU), fireT: rand(1.2, 2.6), hp: d.hp * sc, r: d.r, score: d.score, mode: 'run', mesh, mats, e0: mats.map(m => m.emissive.clone()), yaw: 0 }, o || {});
      e.x0 = e.x; e.y0 = e.y; e.maxHp = e.hp;
      mesh.position.set(e.x, e.y, e.z); mesh.visible = e.d <= 0;
      if (kind === 'tower') {
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        e.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        e.line.frustumCulled = false; e.line.visible = false; scene.add(e.line);
      }
      scene.add(mesh); enemies.push(e); return e;
    }
    function removeEnemy(e) {
      scene.remove(e.mesh); core.disposeObject(e.mesh);
      if (e.line) { scene.remove(e.line); e.line.geometry.dispose(); e.line.material.dispose(); e.line = null; }
    }
    function eShot(x, y, z, vx, vy, vz, c, r, kind) { if (eB.length < 900) eB.push({ x, y, z, px: x, py: y, pz: z, vx, vy, vz, c: c || COL.gold, r: r || 1, kind: kind || 'orb', t: 0 }); }
    function aimAt(x, y, z, sp, n, spread, c, r, kind) {
      const dx = p.x - x, dy = p.y - y, dz = p.z - z, L = Math.hypot(dx, dy, dz) || 1;
      const yaw = Math.atan2(dx, dz), pit = Math.asin(clamp(dy / L, -1, 1));
      for (let i = 0; i < n; i++) {
        const a = yaw + (i - (n - 1) / 2) * spread;
        eShot(x, y, z, Math.sin(a) * Math.cos(pit) * sp, Math.sin(pit) * sp, Math.cos(a) * Math.cos(pit) * sp, c, r, kind);
      }
      glowP(x, y, z, 0, 0, 0, .12, 5, 8, c || COL.gold, 1);
      sfx.shot();
    }

    function spawnFormation() {
      const opts = ['line', 'v', 'weave', 'hover'];
      if (wave >= 2) opts.push('balloon', 'tower', 'swoop');
      if (wave >= 3) opts.push('hover', 'tower', 'v');
      if (wave >= 5) opts.push('balloon', 'swoop', 'weave');
      const f = pick(opts), vz = 100 * (1 + wave * .03);
      if (f === 'line') {
        const y = rand(2, 20);
        for (let i = 0; i < 5; i++) addEnemy('knight', { x: (i - 2) * 8, y, z: -760, vz, d: i * .1, amp: 3, f: 2 });
      } else if (f === 'v') {
        const cx = rand(-12, 12), cy = rand(4, 18);
        for (let i = 0; i < 7; i++) { const k = i - 3; addEnemy('knight', { x: cx + k * 5.5, y: cy + Math.abs(k) * 1.2, z: -760 - Math.abs(k) * 20, vz: vz * 1.1 }); }
      } else if (f === 'weave') {
        const x = rand(-10, 10), y = rand(5, 17);
        for (let i = 0; i < 6; i++) addEnemy('knight', { x, y, z: -760, vz: vz * 1.15, d: i * .22, amp: 15, f: 1.5, ph: 0 });
      } else if (f === 'hover') {
        const n = 2 + Math.min(2, wave >> 1);
        for (let i = 0; i < n; i++) addEnemy('knight', { mode: 'hover', x: rand(-22, 22), y: rand(0, 21), z: -760, d: i * .35, holdZ: rand(-190, -130) });
      } else if (f === 'swoop') {
        const side = Math.random() < .5 ? -1 : 1, n = 3 + Math.min(2, wave >> 2);
        for (let i = 0; i < n; i++) addEnemy('knight', { mode: 'overtake', x: side * rand(26, 34), y: rand(0, 22), z: 45, vz: -190, d: i * .32, tx: rand(-18, 18), ty: rand(2, 22), holdZ: rand(-200, -140), yaw: Math.PI });
        after(.1, () => A.noise(.7, .25, 300, 'bandpass', 3000));
      } else if (f === 'balloon') {
        const n = wave >= 4 ? 2 : 1;
        for (let i = 0; i < n; i++) addEnemy('balloon', { mode: 'drift', x: n === 1 ? rand(-14, 14) : (i ? 1 : -1) * rand(10, 20), y: rand(6, 18), z: -950, d: i * .6, holdZ: rand(-300, -230), spin: Math.random() < .5 ? -1 : 1 });
      } else {
        const both = wave >= 4 && Math.random() < .5, side = Math.random() < .5 ? -1 : 1;
        addEnemy('tower', { mode: 'tower', x: side * rand(40, 45), y: rand(-2, 9), z: -1050, fireT: rand(.2, .8) });
        if (both) addEnemy('tower', { mode: 'tower', x: -side * rand(40, 45), y: rand(-2, 9), z: -1150, fireT: rand(.6, 1.2) });
      }
    }
    function startBoss() {
      bossActive = true;
      core.showBanner('WARNING', '철갑 비행전함 “아이언클래드 드레드” 접근', '#ff3d3d', true);
      sfx.warn();
      addEnemy('boss', { mode: 'boss', x: 0, y: 6, z: -1000, d: 1.5, bsT: 2.5, avT: 3.5, rgT: 4, chainT: 0, vy: 0 });
      after(2.2, () => { if (state === 'play') { sfx.roar(); w.fx.fovKick = Math.max(w.fx.fovKick, 10); w.shake(.35); } });
    }

    function updateEnemy(e, dt) {
      if (e.d > 0) { e.d -= dt; if (e.d <= 0) e.mesh.visible = true; return; }
      e.t += dt; if (e.flash > 0) e.flash -= dt; if (e.burnFx > 0) e.burnFx -= dt;
      const px = e.x, py = e.y, pz = e.z, dif = diff();
      const canShoot = p.alive && state === 'play' && e.z < -45 && e.z > -560;
      if (e.dying > 0) { if (e.kind === 'boss') bossDeath(e, dt); else balloonBurn(e, dt); }
      else if (e.kind === 'knight') {
        if (e.mode === 'run') {
          e.z += e.vz * dt; e.x = e.x0 + Math.sin(e.t * e.f + e.ph) * e.amp; e.y = e.y0 + Math.cos(e.t * e.f * .7 + e.ph) * e.amp * .35;
          if (!e.s1 && e.z > -330) { e.s1 = 1; if (canShoot && Math.random() < .3 + wave * .07) aimAt(e.x, e.y + 1, e.z + 2, 90 * Math.sqrt(dif), 1, 0, COL.gold, 1, 'spear'); }
          if (!e.s2 && e.z > -170 && wave >= 3) { e.s2 = 1; if (canShoot && Math.random() < .4) aimAt(e.x, e.y + 1, e.z + 2, 100 * Math.sqrt(dif), 1, 0, COL.gold, 1, 'spear'); }
        } else if (e.mode === 'hover') {
          e.z += (e.holdZ - e.z) * damp(1.1, dt);
          e.x = e.x0 + Math.sin(e.t * .8 + e.ph) * 9; e.y = clamp(e.y0 + Math.sin(e.t * 1.1 + e.ph) * 4, -2, 24);
          e.fireT -= dt;
          if (e.fireT <= 0 && e.t > 1.2) { e.fireT = rand(1.5, 2.5) / dif; if (canShoot) aimAt(e.x, e.y + 1, e.z + 2, 95 * Math.sqrt(dif), wave >= 4 ? 3 : 1, .06, COL.gold, 1, 'spear'); }
          if (e.t > 8) { e.y0 += 80 * dt * (e.t - 8); e.z -= 50 * dt; }
          e.yaw += (0 - e.yaw) * damp(3, dt);
        } else if (e.mode === 'overtake') {
          e.z += e.vz * dt; e.vz += 70 * dt;
          e.x += (e.tx - e.x) * damp(1.4, dt); e.y += (e.ty - e.y) * damp(1.4, dt);
          if (e.z < e.holdZ || e.vz > -30) { e.mode = 'hover'; e.t = 0; e.x0 = e.x; e.y0 = e.y; e.holdZ = e.z; e.ph = -Math.PI / 2; }
        }
        const wg = e.mesh.userData.wings, fl = Math.sin(e.t * 11 + e.ph) * .55;
        for (const q of wg) q.pv.rotation.z = q.s * fl;
      } else if (e.kind === 'balloon') {
        if (e.t < 15) e.z += (e.holdZ - e.z) * damp(.55, dt); else e.z += (S * .25 + (e.t - 15) * 30) * dt;
        e.x = e.x0 + Math.sin(e.t * .35 + e.ph) * 7; e.y = e.y0 + Math.sin(e.t * .6 + e.ph) * 2;
        e.mesh.rotation.y += dt * .3;
        e.fireT -= dt;
        if (e.fireT <= 0 && e.t > 2) {
          e.fireT = rand(2.4, 3.2) / Math.sqrt(dif);
          if (canShoot) aimAt(e.x, e.y - 3, e.z + 2, 85 * Math.sqrt(dif), wave >= 3 ? 5 : 3, .07, COL.amber, .9, 'spear');
        }
      } else if (e.kind === 'tower') updateTower(e, dt, dif);
      else if (e.kind === 'boss') updateBoss(e, dt);
      e.vx = (e.x - px) / Math.max(dt, 1e-4); e.vy = (e.y - py) / Math.max(dt, 1e-4); e.cvz = (e.z - pz) / Math.max(dt, 1e-4);
      const m = e.mesh;
      if (e.kind !== 'boss') m.position.set(e.x, e.y, e.z);
      if (e.kind === 'knight') {
        m.rotation.set(clamp(-e.vy * .02, -.5, .5), e.yaw + clamp(e.vx * .006, -.4, .4), clamp(-e.vx * .03, -1, 1));
        if (chance(.5)) glowP(e.x, e.y, e.z + (e.mode === 'overtake' ? 3 : -3), rand(-.5, .5), rand(-.5, .5), e.cvz * .5, .25, 1.4, .3, COL.ember, .7);
      }
      // hit flash (white) / scorch (orange)
      if (!(e.dying > 0) && (e.flash > 0 || e.burnFx > 0 || e.fxOn)) {
        const k = Math.max(0, e.flash) * 16, b = Math.max(0, e.burnFx) * 5;
        e.fxOn = e.flash > 0 || e.burnFx > 0;
        for (let i = 0; i < e.mats.length; i++) {
          const mt = e.mats[i], b0 = e.e0[i];
          if (e.fxOn) mt.emissive.setRGB(b0.r + k + b, b0.g + k + b * .35, b0.b + k); else mt.emissive.copy(b0);
        }
      }
      if (e.z > 70 || e.y > 95 || e.z < -1300 || e.y < -40) e.gone = true;
    }
    function updateTower(e, dt, dif) {
      e.z += S * dt;
      const tur = e.mesh.userData.tur, eye = e.mesh.userData.eye;
      const mx = e.x, my = e.y + 3.2, mz = e.z;
      const dx = p.x - mx, dy = p.y - my, dz = p.z - mz, L = Math.hypot(dx, dy, dz) || 1;
      tur.rotation.y = Math.atan2(dx, dz); tur.rotation.x = -Math.asin(clamp(dy / L, -1, 1));
      const inZone = p.alive && state === 'play' && e.z > -480 && e.z < -60;
      if (e.tele > 0) {
        e.tele -= dt;
        const k = 1 - e.tele / e.teleMax;
        eye.material.opacity = .3 + k * .7 * (.7 + .3 * Math.sin(T * 40));
        eye.scale.setScalar(.7 + k * .8);
        const pos = e.line.geometry.attributes.position.array;
        const ux = dx / L, uy = dy / L, uz = dz / L, sx = mx + ux * 3.6, sy = my + uy * 3.6, sz = mz + uz * 3.6;
        pos[0] = sx; pos[1] = sy; pos[2] = sz; pos[3] = p.x; pos[4] = p.y; pos[5] = p.z;
        e.line.geometry.attributes.position.needsUpdate = true;
        e.line.visible = true; e.line.material.opacity = (.25 + k * .65) * (Math.sin(T * 30) > -.3 ? 1 : .3);
        if (chance(.5)) glowP(sx, sy, sz, rand(-2, 2), rand(-2, 2), rand(-2, 2), .2, 2, .4, COL.red, 1);
        if (e.tele <= 0) {
          e.line.visible = false; eye.material.opacity = .15; eye.scale.setScalar(.7);
          if (inZone) {
            eShot(sx, sy, sz, ux * 240, uy * 240, uz * 240, COL.red, 1.25, 'spear');
            glowP(sx, sy, sz, 0, 0, 0, .15, 9, 14, COL.red, 1); w.ring(sx, sy, sz, 1, 7, .3, 0xff5030);
            A.tone(220, .25, 'sawtooth', .07, 90); A.noise(.3, .2, 2500, 'bandpass', 600);
          }
          e.fireT = rand(1.4, 2.2) / Math.sqrt(dif);
        }
      } else if (inZone) {
        e.fireT -= dt;
        if (e.fireT <= 0) { e.tele = e.teleMax = Math.max(.65, 1.05 - wave * .03); A.tone(880, .12, 'square', .03, 660); }
      }
      if (!inZone && !(e.tele > 0)) e.line.visible = false;
    }
    function updateBoss(e, dt) {
      const m = e.mesh, ud = m.userData, hpF = e.hp / e.maxHp, rage = hpF < .5;
      if (rage && !e.rage) {
        e.rage = true; core.showBanner('RAGE', '갑판에 불길이 번진다 · 포격 강화', '#ff3d3d', true);
        sfx.warn(); w.shake(.4);
      }
      const tz = -112 + (e.t > 7 ? Math.sin((e.t - 7) * .33) * 36 : 0);
      e.z += (tz - e.z) * damp(e.t < 7 ? .55 : 1.2, dt);
      e.x = Math.sin(e.t * .27) * 14; e.y = 6 + Math.sin(e.t * .5) * 3;
      m.position.set(e.x, e.y, e.z);
      m.rotation.set(Math.sin(e.t * .4) * .03, -Math.cos(e.t * .27) * .07, -Math.cos(e.t * .27) * .06);
      for (const pr of ud.props) pr.rotation[pr.position.z < 0 ? 'z' : 'x'] += dt * 18;
      m.updateMatrixWorld(true);
      for (let i = 0; i < ud.sails.length; i++) {
        const s = ud.sails[i];
        if (s.down) continue;
        s.m.getWorldPosition(s.wp);
        const dk = 1 - s.hp / s.max;
        if (s.burn > 0) {
          s.burn = Math.max(0, s.burn - dt * .12);
          sailDamage(e, s, 3 * dt);
          if (chance(.9 * s.burn + .2)) glowP(s.wp.x + rand(-4, 4) * (s.big ? 1.3 : .9), s.wp.y + rand(-3, 3), s.wp.z + rand(-.5, .5), rand(-2, 2), rand(8, 16), rand(15, 35), rand(.35, .6), rand(2.5, 4), rand(6, 9), pick([COL.orange, COL.gold, COL.red]), .65, .97);
          if (chance(.25)) smokeP(s.wp.x + rand(-3, 3), s.wp.y + rand(0, 4), s.wp.z, rand(-1, 1), rand(4, 8), rand(20, 30), rand(1.4, 2.2), 4, 14, [.12, .08, .07], .4, .99);
        }
        const fl = .8 + .2 * Math.sin(T * 20 + i * 1.7);
        s.mat.emissive.setRGB((dk * .7 + s.burn * .7) * fl, (dk * .2 + s.burn * .22) * fl, .02);
        const cc = 1 - dk * .75; s.mat.color.setRGB(.8 * cc, .71 * cc, .54 * cc);
      }
      if (rage && chance(.7)) {
        const lx = e.x + rand(-6, 6), ly = e.y + 4.4, lz = e.z + rand(-22, 22);
        glowP(lx, ly, lz, rand(-2, 2), rand(6, 14), rand(10, 25), rand(.3, .55), rand(2, 3.5), rand(5, 8), pick([COL.orange, COL.red, COL.gold]), .7, .97);
        if (chance(.3)) smokeP(lx, ly + 2, lz, rand(-1, 1), rand(4, 8), rand(15, 25), 1.6, 3, 12, [.1, .07, .06], .45, .99);
      }
      if (e.t < 6 || !p.alive || state !== 'play') { if (e.t < 6) w.shake(.01); return; }
      e.bsT -= dt;
      if (e.bsT <= 0) { e.bsT = rage ? 2.4 : 3.4; broadside(e, rage); }
      e.avT -= dt;
      if (e.avT <= 0) { e.avT = rage ? 1.5 : 2.3; aimAt(e.x, e.y + 1, e.z + 37, 105, rage ? 7 : 5, .06, COL.red, 1.1, 'orb'); }
      if (rage) {
        e.rgT -= dt;
        if (e.rgT <= 0) {
          e.rgT = 3.6;
          for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + e.t; eShot(e.x, e.y + 2, e.z + 20, Math.cos(a) * 14, Math.sin(a) * 10, 66, COL.ember, 1.3, 'orb'); }
          w.ring(e.x, e.y + 2, e.z + 20, 2, 16, .5, 0xff7a2a); sfx.cannon();
        }
      }
    }
    function broadside(e, rage) {
      const n = rage ? 11 : 9, rows = rage ? 2 : 1, sp = 62;
      for (let r = 0; r < rows; r++) {
        const y = p.y + rand(-1.5, 1.5) + (rows > 1 ? (r ? 5 : -5) : 0);
        for (let i = 0; i < n; i++) {
          const x = e.x + (i - (n - 1) / 2) * (54 / (n - 1)) + (r ? 3 : 0), sy = e.y + 1.5, sz = e.z + 12;
          const tt = Math.max(.6, (p.z - sz) / sp);
          eShot(x, sy, sz, 0, (y - sy) / tt, sp, i % 2 ? COL.gold : COL.orange, 1.6, 'orb');
          if (r === 0 && i % 2 === 0) glowP(x, sy, sz, 0, 0, 20, .2, 8, 12, COL.gold, .9);
        }
      }
      sfx.cannon(); w.shake(.08);
    }
    function balloonBurn(e, dt) {
      e.dying -= dt; e.vy -= 12 * dt; e.y += e.vy * dt; e.z += S * .2 * dt;
      const k = 1 - Math.max(0, e.dying) / 1.5, env = e.mesh.userData.envMat;
      env.emissive.setRGB(1.3 * k + .3, .38 * k + .08, .02);
      e.mesh.rotation.z += dt * .7 * (e.spin || 1); e.mesh.rotation.x += dt * .3;
      for (let i = 0; i < 3; i++) glowP(e.x + rand(-4, 4), e.y + 3 + rand(-3, 4), e.z + rand(-4, 4), rand(-3, 3), rand(8, 18), rand(10, 30), rand(.3, .6), rand(3, 5), rand(7, 11), pick([COL.orange, COL.gold, COL.red]), .7, .97);
      if (chance(.5)) smokeP(e.x + rand(-3, 3), e.y + 6, e.z, rand(-1, 1), rand(4, 9), rand(10, 25), 1.6, 4, 14, [.1, .07, .06], .5, .99);
      if (e.dying <= 0) {
        e.dead = true;
        w.explode(e.x, e.y + 3, e.z, DEFS.balloon.ex, COL.orange, 0); w.ring(e.x, e.y + 3, e.z, 2, 26, .6, 0xffb347);
        sfx.big();
        if (Math.random() < .55) dropPickup(e.x, e.y, e.z);
      }
    }
    function bossDeath(e, dt) {
      e.dying -= dt; e.chainT -= dt; e.vy -= 7 * dt; e.y += e.vy * dt;
      const m = e.mesh;
      m.rotation.x += dt * .1; m.rotation.z += dt * .16;
      m.position.set(e.x + rand(-.4, .4), e.y, e.z);
      if (e.chainT <= 0) { e.chainT = .11; w.explode(e.x + rand(-10, 10), e.y + rand(-3, 10), e.z + rand(-26, 26), rand(1.3, 2.4), COL.red, 0); sfx.pop(); }
      for (let i = 0; i < 3; i++) glowP(e.x + rand(-7, 7), e.y + rand(0, 8), e.z + rand(-25, 25), rand(-3, 3), rand(8, 20), rand(10, 30), rand(.4, .7), rand(3, 5), rand(8, 12), pick([COL.orange, COL.red, COL.gold]), .7, .97);
      if (!e.splashed && e.y < -18) { e.splashed = true; lavaSplash(e.x, e.z); }
      if (e.dying <= 0) finishBoss(e);
    }
    function lavaSplash(x, z) {
      w.ring(x, -21, z, 4, 95, 1.6, 0xff7a1a, 0, true); w.ring(x, -21, z, 2, 55, 1.1, 0xffd070, 0, true);
      for (let i = 0; i < 70; i++) glowP(x + rand(-20, 20), -20, z + rand(-25, 25), rand(-14, 14), rand(30, 75), rand(-10, 10), rand(.9, 1.6), rand(2, 4), .4, pick([COL.orange, COL.gold, COL.red]), 1, .985, 45);
      for (let i = 0; i < 18; i++) smokeP(x + rand(-18, 18), -18, z + rand(-20, 20), rand(-4, 4), rand(8, 18), rand(0, 20), rand(2, 3.2), 8, 30, [.12, .08, .07], .55, .98);
      w.lightFlash(x, -10, z, 30, 0xff7a2a); A.noise(1.6, .5, 900, 'lowpass', 80);
    }
    function sailDamage(e, s, dmg) {
      if (s.down || e.dying > 0 || e.dead) return;
      s.hp -= dmg; damage(e, dmg * .5);
      if (s.hp <= 0 && !s.down && !e.dead) dropSail(e, s);
    }
    function dropSail(e, s) {
      s.down = true;
      e.mesh.updateMatrixWorld(true);
      scene.attach(s.m);
      fallers.push({ m: s.m, mat: s.mat, vy: 2, rx: rand(-1.2, 1.2), rz: rand(-1, 1), t: 0 });
      w.explode(s.wp.x, s.wp.y, s.wp.z, 1.3, COL.orange, 0);
      damage(e, 45);
      addScore(1500, s.wp.x, s.wp.y, s.wp.z);
      core.popText(w, s.wp.x, s.wp.y + 5, s.wp.z, 'SAIL DOWN', '#ffb347', 18, 0);
      sfx.pop();
    }
    function updateFallers(dt) {
      for (const f of fallers) {
        f.t += dt; f.vy -= 18 * dt;
        f.m.position.y += f.vy * dt; f.m.position.z += 12 * dt;
        f.m.rotation.x += f.rx * dt; f.m.rotation.z += f.rz * dt;
        f.mat.emissive.setRGB(.9, .3, .02); f.mat.color.setRGB(.15, .1, .08);
        if (chance(.8)) glowP(f.m.position.x + rand(-4, 4), f.m.position.y + rand(-3, 3), f.m.position.z, rand(-2, 2), rand(4, 12), rand(10, 25), rand(.3, .5), rand(2.5, 4), rand(6, 9), pick([COL.orange, COL.gold]), .7, .97);
        if (f.m.position.y < -22 || f.t > 4) {
          f.dead = true; scene.remove(f.m); f.mat.dispose();
          w.ring(f.m.position.x, -21, f.m.position.z, 2, 22, .7, 0xff7a1a, 0, true);
        }
      }
      fallers = fallers.filter(f => !f.dead);
    }
    function clearFallers() { for (const f of fallers) { scene.remove(f.m); f.mat.dispose(); } fallers = []; }

    function damage(e, dmg) {
      if (e.dying > 0 || e.dead || e.d > 0) return;
      e.hp -= dmg;
      if (e.hp <= 0) kill(e);
    }
    function kill(e) {
      if (e.kind === 'boss') {
        e.dying = 3.6; e.hp = 0; e.vy = 0; e.chainT = 0;
        for (const b of eB) w.sparks(b.x, b.y, b.z, b.c, 2, 10);
        eB.length = 0; w.flash(.4); w.shake(.6); sfx.big();
        $('bossBar').hidden = true;
        return;
      }
      addScore(e.score, e.x, e.y, e.z);
      if (e.kind === 'balloon') {
        e.dying = 1.5; e.vy = 0; sfx.pop();
        w.ring(e.x, e.y + 3, e.z, 1, 14, .4, 0xffa040);
        if (e.line) e.line.visible = false;
        return;
      }
      e.dead = true;
      w.explode(e.x, e.y, e.z, DEFS[e.kind].ex, DEFS[e.kind].col, e.kind === 'tower' ? S : e.cvz || 0);
      if (e.kind === 'tower') { sfx.big(); w.fx.hitStop = Math.max(w.fx.hitStop, .05); w.flash(.15); } else sfx.pop();
      const ch = e.kind === 'tower' ? .7 : .07;
      if (Math.random() < ch) dropPickup(e.x, clamp(e.y, BY0 + 1, BY1 - 1), e.z, e.kind === 'tower' && Math.random() < .5 ? 'G' : null);
    }
    function finishBoss(e) {
      if (e.dead) return;
      e.dead = true;
      if (!e.splashed) lavaSplash(e.x, e.z);
      w.explode(e.x, Math.max(e.y, -16), e.z, 6, COL.red, 0); w.explode(e.x - 14, Math.max(e.y, -16), e.z - 10, 3.2, COL.orange, 0); w.explode(e.x + 14, Math.max(e.y, -16), e.z + 10, 3.2, COL.orange, 0);
      sfx.big(); A.boom(1.8, .9, 3200); A.tone(55, 1.4, 'sine', .32, 22);
      w.flash(1); w.fx.hitStop = .14; w.fx.slowT = 1.6; w.shake(1); w.fx.fovKick = 14;
      addScore(e.score, e.x, 10, e.z + 30);
      dropPickup(e.x - 8, 10, -60, 'H'); dropPickup(e.x, 12, -60, 'R'); dropPickup(e.x + 8, 10, -60, 'G');
      bossActive = false; waveT = 0; spawnT = 3.5;
      after(1.7, () => { if (state === 'play') { wave++; core.showBanner('WAVE ' + wave, '전함 격침 · 협곡 더 깊이', '#ffd166'); } });
    }
    function addScore(base, x, y, z) {
      combo++; comboT = 2.6; mult = Math.min(8, 1 + Math.floor(combo / 6));
      const pts = Math.round(base * mult); score += pts;
      core.popText(w, x, y + 2, z, '+' + pts.toLocaleString(), mult > 1 ? '#ffe08a' : '#fff4e6', mult > 1 ? 17 : 14);
    }

    /* ---------- pickups ---------- */
    const PK = { G: { c: 0x3dffb5 }, H: { c: 0xff4f6b }, R: { c: 0xc77dff } };
    function dropPickup(x, y, z, type) {
      if (!type) { const r = Math.random(); type = r < .55 ? 'G' : r < .8 ? 'H' : 'R'; }
      const g = new THREE.Group();
      part(g, GEO.oct, E(PK[type].c), null, [1.3, 1.8, 1.3]);
      part(g, GEO.ico, new THREE.MeshBasicMaterial({ color: PK[type].c, wireframe: true, transparent: true, opacity: .7 }), null, [2.6, 2.6, 2.6]);
      g.position.set(x, y, z); scene.add(g);
      pickups.push({ x, y: clamp(y, BY0 + 1, BY1), z, type, t: 0, mesh: g, col: C(PK[type].c) });
    }
    function collect(k) {
      w.ring(k.x, k.y, k.z, 1, 12, .45, PK[k.type].c, 0); w.sparks(k.x, k.y, k.z, k.col, 24, 22);
      sfx.power();
      if (k.type === 'G') { score += 500 * mult; core.popText(w, p.x, p.y + 4, p.z, '+' + (500 * mult).toLocaleString() + ' GEM', '#3dffb5', 17); }
      else if (k.type === 'H') {
        if (p.hp < 5) { p.hp++; core.popText(w, p.x, p.y + 4, p.z, 'HP +1', '#ff4f6b', 17); }
        else { score += 1000; core.popText(w, p.x, p.y + 4, p.z, '+1,000', '#ff4f6b', 17); }
      } else { p.runeT = 12; core.popText(w, p.x, p.y + 4, p.z, 'RUNE · 화염구 ×3', '#c77dff', 17); }
    }

    /* ---------- player actions ---------- */
    function inCone(x, y, z, r, maxT) {
      const vx = x - _mw.x, vy = y - _mw.y, vz = z - _mw.z;
      const t = vx * aim.x + vy * aim.y + vz * aim.z, lim = maxT || RANGE;
      if (t < -r || t > lim + r) return false;
      const tt = Math.max(0, t), cr = 1.6 + tt * .19 + r;
      return vx * vx + vy * vy + vz * vz - t * t < cr * cr;
    }
    function bossCone(e, dt, apply) {
      let hit = false;
      for (const s of e.mesh.userData.sails) {
        if (s.down || !inCone(s.wp.x, s.wp.y, s.wp.z, s.big ? 5 : 3.5)) continue;
        hit = true;
        if (apply) { sailDamage(e, s, BREATH_DPS * dt); s.burn = Math.min(1, s.burn + dt * 2); if (e.dead || e.dying > 0) return hit; }
      }
      for (const o of HULL) {
        if (!inCone(e.x + o[0], e.y + o[1], e.z + o[2], 9)) continue;
        hit = true;
        if (apply) { damage(e, BREATH_DPS * .6 * dt); e.burnFx = .15; if (chance(.3)) w.sparks(e.x + rand(-6, 6), e.y + rand(0, 4), e.z + o[2] + 10, COL.gold, 2, 16); }
        break;
      }
      return hit;
    }
    function breathFx(dt) {
      const mx = _mw.x, my = _mw.y, mz = _mw.z, dx = aim.x, dy = aim.y, dz = aim.z;
      const k = Math.min(2, dt * 60), pvx = p.vx * .4, pvy = p.vy * .4;
      for (let i = 0; i < 8 * k; i++) { const sp = rand(200, 250); glowP(mx, my, mz, dx * sp + rand(-14, 14) + pvx, dy * sp + rand(-14, 14) + pvy, dz * sp, rand(.25, .4), rand(.9, 1.4), rand(2.5, 3.8), COL.gold, .42, .965); }
      for (let i = 0; i < 11 * k; i++) { const sp = rand(170, 240); glowP(mx, my, mz, dx * sp + rand(-32, 32) + pvx, dy * sp + rand(-32, 32) + pvy, dz * sp, rand(.4, .6), 1.5, rand(5, 8), COL.orange, .2, .965, -14); }
      for (let i = 0; i < 6 * k; i++) { const sp = rand(150, 220); glowP(mx, my, mz, dx * sp + rand(-40, 40) + pvx, dy * sp + rand(-40, 40) + pvy, dz * sp, rand(.5, .7), 2.2, rand(7, 10), COL.red, .15, .96, -18); }
      for (let i = 0; i < 2 * k; i++) { const d = rand(30, 80); smokeP(mx + dx * d + rand(-5, 5), my + dy * d + rand(-3, 5), mz + dz * d, rand(-3, 3), rand(3, 9), S * .5, rand(.8, 1.3), 4, 16, [.12, .08, .08], .3, .98); }
    }
    function overheat() {
      p.overT = 2; p.heat = 100; breathing = false;
      core.popText(w, p.x, p.y + 5, p.z, 'OVERHEAT!', '#ff3d3d', 19, 0);
      sfx.sizzle();
      for (let i = 0; i < 16; i++) smokeP(_mw.x, _mw.y, _mw.z, rand(-8, 8), rand(4, 14), rand(-6, 10), rand(.8, 1.4), 2, 11, [.78, .74, .72], .5, .95);
    }
    function fireball() {
      if (state !== 'play' || paused || !p.alive || p.fbCd > 0) return;
      p.fbCd = 1.15;
      const n = p.runeT > 0 ? 3 : 1, sp = 260;
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * .16;
        const vx = (aim.x + Math.sin(a)) * sp, vy = aim.y * sp, vz = aim.z * Math.cos(a) * sp;
        fbs.push({ x: _mw.x, y: _mw.y, z: _mw.z, px: _mw.x, py: _mw.y, pz: _mw.z, vx, vy, vz, t: 0 });
      }
      glowP(_mw.x, _mw.y, _mw.z, 0, 0, -20, .15, 9, 14, COL.gold, 1);
      w.fx.fovKick = Math.max(w.fx.fovKick, 3);
      sfx.fireball();
    }
    function fbExplode(f) {
      f.dead = true;
      w.explode(f.x, f.y, f.z, 1.3, COL.orange, 0); w.ring(f.x, f.y, f.z, 1, 18, .45, 0xffb347);
      sfx.pop();
      const R = 16;
      for (const e of enemies) {
        if (!targetable(e)) continue;
        if (e.kind === 'boss') {
          for (const s of e.mesh.userData.sails) if (!s.down && Math.hypot(s.wp.x - f.x, s.wp.y - f.y, s.wp.z - f.z) < R + 5) { sailDamage(e, s, 22); s.burn = Math.min(1, s.burn + .5); }
          if (e.dead || e.dying > 0) continue;
          for (const o of HULL) if (Math.hypot(e.x + o[0] - f.x, e.y + o[1] - f.y, e.z + o[2] - f.z) < R + 9) { damage(e, 16); e.flash = .06; break; }
        } else if (Math.hypot(e.x - f.x, e.y - f.y, e.z - f.z) < R + e.r) { damage(e, 14); e.flash = .06; }
      }
    }
    function barrelRoll() {
      if (!p.alive || state !== 'play' || paused || p.rollCd > 0) return;
      p.rollT = .6; p.rollCd = 1.1; p.rollDir = p.vx < -2 ? 1 : p.vx > 2 ? -1 : (Math.random() < .5 ? 1 : -1);
      p.tx = clamp(p.x - p.rollDir * 9, -BX, BX); p.ty = clamp(p.y - 2.5, BY0, BY1);
      sfx.roll();
    }
    function clearNear(r) { eB = eB.filter(b => { const k = Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z) > r; if (!k) w.sparks(b.x, b.y, b.z, b.c, 2, 10); return k; }); }
    function hurt() {
      if (p.inv > 0 || !p.alive || p.rollT > 0) return;
      p.hp--; p.inv = 1.7;
      w.explode(p.x, p.y, p.z, 1.1, COL.ember, 0); w.fx.dmgA = 1; w.shake(.7); w.fx.hitStop = .1; sfx.hurt();
      clearNear(20); combo = 0; mult = 1;
      if (p.hp <= 0) die();
    }
    function die() {
      p.alive = false; dragon.visible = false; breathing = false; fireVoice.set(0, 0);
      w.explode(p.x, p.y, p.z, 4, COL.ember, 0); w.explode(p.x, p.y, p.z, 2.5, COL.gold, 0);
      sfx.big(); w.flash(.8); w.fx.slowT = 1.8; w.shake(1);
      state = 'dead'; deadT = 2.4;
      $('retAim').hidden = true;
    }
    function wingThump() {
      const v = state === 'play' ? .14 : .06;
      sfx.thump(v);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) glowP(p.x + s * rand(4, 7), p.y - rand(0, 1.5), p.z + rand(0, 2), s * rand(3, 9), -rand(4, 12), S * .4, rand(.4, .7), rand(.8, 1.4), .2, COL.ember, .7, .97);
      smokeP(p.x + rand(-6, 6), p.y - 1.5, p.z + 1, rand(-3, 3), -rand(3, 8), S * .6, .7, 1.5, 5, [.3, .26, .24], .25, .97);
    }

    /* ---------- input ---------- */
    const keys = {};
    let drag = null, lastTap = 0;
    const cv = $('c');
    function pointerTarget(cx, cy) {
      const W = core.W || innerWidth || 1, H = core.H || innerHeight || 1;
      if (!isFinite(cx) || !isFinite(cy)) return;
      p.tx = clamp((cx / W * 2 - 1) * BX * 1.15, -BX, BX); p.ty = clamp(lerp(BY1, BY0, cy / H) * 1.1 - 1, BY0, BY1);
    }
    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space' && state === 'play') e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'KeyF') fireball();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') barrelRoll();
      if (e.code === 'KeyM') toggleMute();
      if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      if (e.code === 'Enter' && (state === 'title' || state === 'over') && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) startGame();
    }, sig);
    window.addEventListener('keyup', e => { keys[e.code] = false; }, sig);
    window.addEventListener('blur', () => { mouseHeld = false; btnFire = false; for (const k in keys) keys[k] = false; }, sig);
    cv.addEventListener('contextmenu', e => e.preventDefault(), sig);
    cv.addEventListener('pointerdown', e => {
      audioInit();
      if (e.pointerType === 'mouse') {
        pointerTarget(e.clientX, e.clientY);
        if (e.button === 0) mouseHeld = true; else if (e.button === 2) { e.preventDefault(); fireball(); }
      } else {
        drag = { sx: e.clientX, sy: e.clientY, px: p.tx, py: p.ty, id: e.pointerId };
        const now = performance.now(); if (now - lastTap < 280) barrelRoll(); lastTap = now;
      }
    }, sig);
    cv.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') pointerTarget(e.clientX, e.clientY);
      else if (drag && drag.id === e.pointerId) {
        const W = core.W || innerWidth || 1, H = core.H || innerHeight || 1;
        p.tx = clamp(drag.px + (e.clientX - drag.sx) / W * BX * 3, -BX, BX);
        p.ty = clamp(drag.py - (e.clientY - drag.sy) / H * (BY1 - BY0) * 2, BY0, BY1);
      }
    }, sig);
    const endDrag = e => { if (drag && drag.id === e.pointerId) drag = null; };
    window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) mouseHeld = false; endDrag(e); }, sig);
    window.addEventListener('pointercancel', e => { if (e.pointerType === 'mouse') mouseHeld = false; endDrag(e); }, sig);
    const on = (id, ev, fn) => $(id).addEventListener(ev, fn, sig);
    on('startBtn', 'click', startGame); on('againBtn', 'click', startGame);
    on('resumeBtn', 'click', togglePause); on('pauseBtn', 'click', togglePause); on('muteBtn', 'click', toggleMute);
    for (const id of ['menuBtn1', 'menuBtn2', 'menuBtn3']) on(id, 'click', () => api.exit());
    on('fbBtn', 'click', fireball); on('rollBtn', 'click', barrelRoll);
    for (const id of ['fbBtn', 'rollBtn', 'fireBtn']) on(id, 'contextmenu', e => e.preventDefault());
    const fireBtn = $('fireBtn');
    on('fireBtn', 'pointerdown', e => { e.preventDefault(); audioInit(); btnFire = true; fireBtn.classList.add('on'); try { fireBtn.setPointerCapture(e.pointerId); } catch (_) {} });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) on('fireBtn', ev, () => { btnFire = false; fireBtn.classList.remove('on'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !paused) togglePause(); }, sig);

    function toggleMute() { const m = A.toggle(); $('muteBtn').textContent = m ? 'SOUND OFF' : 'SOUND ON'; }
    function togglePause() {
      if (state !== 'play' && state !== 'dead') return;
      paused = !paused; $('ewPause').hidden = !paused;
      $('pauseBtn').textContent = paused ? 'RESUME' : 'PAUSE';
      fireVoice.set(0, 0); mouseHeld = false; btnFire = false;
      A.drone(paused ? .03 : .08);
      if (paused) $('resumeBtn').focus();
    }
    function setHud(on) { for (const id of ['hudTL', 'hudTR', 'hudBL', 'hudBR', 'retAim']) $(id).hidden = !on; if (!on) $('bossBar').hidden = true; }

    function startGame() {
      audioInit();
      for (const e of enemies) removeEnemy(e);
      for (const k of pickups) { scene.remove(k.mesh); core.disposeObject(k.mesh); }
      enemies = []; eB = []; fbs = []; pickups = []; clearFallers(); timers.length = 0;
      Object.assign(p, { tx: 0, ty: 9, hp: 5, inv: 2.2, alive: true, rollT: 0, rollCd: 0, heat: 0, overT: 0, coolD: 0, fbCd: 0, runeT: 0, breathK: 0 });
      dragon.visible = true;
      score = 0; combo = 0; comboT = 0; mult = 1; wave = 1; waveT = 0; spawnT = 2.2; bossActive = false;
      w.fx.slowT = 0; paused = false; mouseHeld = false;
      if (state === 'over') camBlend = 1;
      state = 'play';
      $('ewTitle').hidden = true; $('ewOver').hidden = true; $('ewPause').hidden = true; $('pauseBtn').textContent = 'PAUSE';
      setHud(true);
      core.showBanner('WAVE 1', '화산 협곡 진입 · 적 기사단을 불태워라', '#ff7a1a');
      sfx.roar(); w.fx.fovKick = 12; w.shake(.3);
      A.drone(.08);
    }
    function gameOver() {
      state = 'over';
      const nb = score > best;
      if (nb) { best = score; core.saveBest('dragon', best); }
      $('finalScore').textContent = score.toLocaleString(); $('finalWave').textContent = wave;
      $('newBest').hidden = !nb; $('ewOver').hidden = false; setHud(false);
      A.drone(.04);
      $('againBtn').focus();
    }

    /* ---------- update ---------- */
    function segHit(b, x, y, z, r) {
      const ax = b.px, ay = b.py, az = b.pz, dx = b.x - ax, dy = b.y - ay, dz = b.z - az;
      const L2 = dx * dx + dy * dy + dz * dz || 1;
      const t = clamp(((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / L2, 0, 1);
      const cx = ax + dx * t - x, cy = ay + dy * t - y, cz = az + dz * t - z;
      return cx * cx + cy * cy + cz * cz < r * r;
    }
    function updateWorld(dt) {
      skyU.time.value = T; lavaU.time.value = T; lavaU.scroll.value = scroll;
      for (const r of walls) { r.m.position.z += S * dt; if (r.m.position.z > 140) placeWall(r, r.m.position.z - WALL_N * WALL_SP); }
      for (const r of pillars) { r.m.position.z += S * dt; if (r.m.position.z > 100) placePillar(r, rand(-1350, -1150)); }
      for (const a of arches) { a.position.z += S * dt; if (a.position.z > 160) { a.position.z -= rand(1700, 2600); a.position.x = rand(-8, 8); a.scale.y = rand(.88, 1.1); } }
      const cx = camera.position.x;
      for (const v of vents) {
        v.z += S * dt; v.t -= dt;
        if (v.z > 60) { v.z = rand(-950, -700); v.x = rand(-70, 70); }
        if (v.t <= 0) {
          v.t = .1;
          smokeP(v.x + rand(-3, 3), -20, v.z, rand(-1, 1), rand(8, 14), S, rand(2.4, 3.2), 6, 26, [.2, .1, .09], .3, .99);
          if (Math.random() < .5) glowP(v.x + rand(-2, 2), -21, v.z, 0, rand(2, 6), S, .5, 8, 13, COL.ember, .3);
        }
      }
      if (chance(2)) glowP(cx + rand(-80, 80), -20, rand(-600, 20), rand(-2, 2), rand(8, 20), S + rand(-5, 5), rand(2, 3.5), rand(.7, 1.3), .2, pick([COL.ember, COL.orange, COL.gold]), .9, .995, -3);
      if (chance(.7)) smokeP(cx + rand(-90, 90), rand(30, 70), rand(-400, 10), rand(-2, 2), rand(-7, -4), S, 4, .7, .7, [.42, .38, .36], .5, 1);
      // volcanic lightning
      lightT -= dt;
      if (lightT <= 0) {
        lightT = rand(5, 11);
        const lx = rand(-1, 1);
        skyU.lDir.value.set(lx, rand(.05, .25), -1).normalize(); skyU.flash.value = 1;
        w.lightFlash(lx * 130, 70, -150, 9, 0xd0a0ff);
        after(.12, () => { skyU.flash.value = Math.max(skyU.flash.value, .8); });
        after(rand(.4, 1), () => sfx.thunder());
      }
      skyU.flash.value *= Math.exp(-6 * dt);
    }
    function updatePlayer(dt) {
      if (state === 'title') { p.tx = Math.sin(T * .5) * 6; p.ty = 10 + Math.sin(T * .8) * 2.5; }
      else if (state === 'play') {
        let kx = 0, ky = 0;
        if (keys.ArrowLeft || keys.KeyA) kx--; if (keys.ArrowRight || keys.KeyD) kx++;
        if (keys.ArrowUp || keys.KeyW) ky++; if (keys.ArrowDown || keys.KeyS) ky--;
        if (kx || ky) { const l = Math.hypot(kx, ky); p.tx = clamp(p.x + kx / l * 9, -BX, BX); p.ty = clamp(p.y + ky / l * 9, BY0, BY1); }
      }
      if (!p.alive) { breathing = false; return; }
      const ox = p.x, oy = p.y;
      p.x += (p.tx - p.x) * damp(p.rollT > 0 ? 9 : 6, dt); p.y += (p.ty - p.y) * damp(6, dt);
      p.vx = (p.x - ox) / Math.max(dt, 1e-4); p.vy = (p.y - oy) / Math.max(dt, 1e-4);
      p.roll += (clamp(-p.vx * .045, -1.1, 1.1) - p.roll) * damp(8, dt);
      p.pitch += (clamp(p.vy * .025, -.45, .45) - p.pitch) * damp(8, dt);
      if (p.inv > 0) p.inv -= dt;
      if (p.rollCd > 0) p.rollCd -= dt;
      if (p.fbCd > 0) p.fbCd -= dt;
      if (p.runeT > 0) p.runeT -= dt;
      let extraRoll = 0;
      if (p.rollT > 0) { p.rollT -= dt; const k = 1 - Math.max(0, p.rollT) / .6; extraRoll = p.rollDir * TAU * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2); }
      dragon.position.set(p.x, p.y, p.z);
      dragon.rotation.set(p.pitch, -p.vx * .006, p.roll + extraRoll);
      dragon.visible = !(p.inv > 0 && state === 'play' && Math.floor(p.inv * 16) % 2 === 0);
      // breath & heat
      const want = state === 'play' && (mouseHeld || keys.Space || btnFire);
      if (p.overT > 0) {
        p.overT -= dt; p.heat = Math.max(0, p.heat - 45 * dt);
        if (chance(.5)) smokeP(_mw.x + rand(-1, 1), _mw.y + .5, _mw.z + 1, rand(-2, 2), rand(5, 11), rand(5, 15), rand(.6, 1), 1.5, 7, [.75, .72, .7], .4, .96);
        if (p.overT <= 0) p.heat = Math.min(p.heat, 25);
      }
      breathing = want && p.overT <= 0;
      if (breathing) { p.heat += 32 * dt; p.coolD = .45; if (p.heat >= 100) overheat(); }
      else if (p.overT <= 0) { p.coolD -= dt; if (p.coolD <= 0) p.heat = Math.max(0, p.heat - 30 * dt); }
      p.breathK += ((breathing ? 1 : 0) - p.breathK) * damp(12, dt);
      const climb = clamp(p.vy / 18, -1, 1), up = Math.max(0, climb), down = Math.max(0, -climb);
      const thump = animDragon(rig, dt, { rate: 6.5 + up * 4.5 - down * 3.5, amp: .5 + up * .22 - down * .32, glide: down, breath: p.breathK, lookX: clamp(p.vx / 40, -1, 1), lookY: clamp(p.vy / 40, -1, 1), tailYaw: clamp(p.vx / 30, -1, 1) });
      if (thump && state !== 'over') wingThump();
      dragon.updateMatrixWorld(true);
      rig.mouth.getWorldPosition(_mw);
      aim.set(clamp(p.vx * .002, -.12, .12), clamp(p.vy * .002, -.1, .1) - .02, -1).normalize();
      if (breathing) breathFx(dt);
    }
    function updateFireballs(dt) {
      for (const f of fbs) {
        f.t += dt; f.px = f.x; f.py = f.y; f.pz = f.z;
        // mild homing toward the nearest target ahead
        let tg = null, bd = 900;
        for (const e of enemies) {
          if (!targetable(e) || e.z > f.z - 10) continue;
          const d2 = (e.x - f.x) ** 2 + (e.y - f.y) ** 2;
          if (d2 < bd) { bd = d2; tg = e; }
        }
        if (tg) {
          const sp = Math.hypot(f.vx, f.vy, f.vz) || 1, ty = tg.kind === 'boss' ? tg.y + 2 : tg.y;
          _d.set(tg.x - f.x, ty - f.y, tg.z - f.z).normalize().multiplyScalar(sp);
          const k = Math.min(1, dt * 2.2); f.vx += (_d.x - f.vx) * k; f.vy += (_d.y - f.vy) * k; f.vz += (_d.z - f.vz) * k;
        }
        f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
        for (let i = 0; i < 3; i++) glowP(f.x + rand(-.6, .6), f.y + rand(-.6, .6), f.z + rand(-.6, .6), rand(-4, 4), rand(-2, 6), rand(10, 40), rand(.2, .4), rand(2.5, 4), rand(.5, 1), pick([COL.gold, COL.orange, COL.red]), .8, .95);
        if (chance(.4)) smokeP(f.x, f.y, f.z, rand(-1, 1), rand(1, 3), S * .4, .6, 1.5, 5, [.15, .1, .09], .3, .97);
        if (f.t > 1.25 || f.y < -21) { fbExplode(f); continue; }
        for (const e of enemies) {
          if (!targetable(e)) continue;
          let hit = false;
          if (e.kind === 'boss') {
            for (const s of e.mesh.userData.sails) if (!s.down && segHit(f, s.wp.x, s.wp.y, s.wp.z, s.big ? 6 : 4.5)) { hit = true; break; }
            if (!hit) for (const o of HULL) if (segHit(f, e.x + o[0], e.y + o[1], e.z + o[2], 10)) { hit = true; break; }
          } else hit = segHit(f, e.x, e.y, e.z, e.r + 1);
          if (hit) { fbExplode(f); break; }
        }
      }
      fbs = fbs.filter(f => !f.dead);
    }
    function updateEnemies(dt) {
      lockOn = false;
      for (const e of enemies) {
        updateEnemy(e, dt);
        if (!targetable(e)) continue;
        if (e.kind === 'boss') { if (p.alive && bossCone(e, dt, breathing)) lockOn = true; continue; }
        if (p.alive && inCone(e.x, e.y, e.z, e.r)) {
          lockOn = true;
          if (breathing) {
            e.burnFx = .15;
            if (chance(.35)) w.sparks(e.x, e.y, e.z, COL.gold, 2, 14, e.cvz);
            damage(e, BREATH_DPS * dt);
            if (!targetable(e)) continue;
          }
        }
        if (p.alive && state === 'play') {
          const rr = e.r * .75 + 2;
          if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 + (e.z - p.z) ** 2 < rr * rr) { hurt(); damage(e, 30); }
        }
      }
      for (const e of enemies) if (e.dead || e.gone) removeEnemy(e);
      enemies = enemies.filter(e => !e.dead && !e.gone);
    }
    function updateShots(dt) {
      for (const b of eB) {
        b.px = b.x; b.py = b.y; b.pz = b.z;
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.t += dt;
        if (b.z > 40 || b.t > 9 || b.y < -24) { b.dead = true; continue; }
        if (breathing && b.kind === 'spear' && inCone(b.x, b.y, b.z, 1, 55)) {
          b.dead = true; w.sparks(b.x, b.y, b.z, COL.gold, 5, 18); glowP(b.x, b.y, b.z, 0, 0, 0, .15, 4, 7, COL.orange, 1);
          continue;
        }
        if (chance(.35)) glowP(b.x, b.y, b.z, 0, 0, 0, .14, 3 * b.r, 1, b.c, .7);
        if (p.alive && state === 'play' && Math.abs(b.z - p.z) < 12) {
          const rr = b.r * .6 + 1.5;
          if (segHit(b, p.x, p.y, p.z, rr * (p.rollT > 0 ? 1.8 : 1))) {
            if (p.rollT > 0) {
              if (!b.grazed) { b.grazed = 1; score += 50; w.sparks(b.x, b.y, b.z, COL.white, 4, 8); if (Math.random() < .5) core.popText(w, b.x, b.y + 1, b.z, 'GRAZE +50', '#ffe08a', 13, 0); }
            } else if (segHit(b, p.x, p.y, p.z, rr)) { b.dead = true; hurt(); }
          }
        }
      }
      eB = eB.filter(b => !b.dead);
    }
    function updatePickups(dt) {
      for (const k of pickups) {
        k.t += dt;
        const dx = p.x - k.x, dy = p.y - k.y, dz = p.z - k.z, d = Math.hypot(dx, dy, dz) || 1;
        if (p.alive && state === 'play' && d < 30 && k.z > -60) { const pull = 140 * dt; k.x += dx / d * pull; k.y += dy / d * pull; k.z += dz / d * pull; }
        else k.z += S * .5 * dt;
        k.mesh.position.set(k.x, k.y + Math.sin(k.t * 3) * .5, k.z);
        k.mesh.rotation.y += dt * 2.4; k.mesh.children[1].rotation.x += dt * 1.6;
        if (chance(.5)) glowP(k.x, k.y, k.z, rand(-3, 3), rand(-3, 3), rand(-3, 3), .3, 1.4, .2, k.col, .9);
        if (p.alive && state === 'play' && d < 4.5) { k.dead = true; collect(k); }
        if (k.z > 40) k.dead = true;
        if (k.dead) { scene.remove(k.mesh); core.disposeObject(k.mesh); }
      }
      pickups = pickups.filter(k => !k.dead);
    }
    function director(dt, rdt) {
      if (state === 'play' && p.alive) {
        if (!bossActive) {
          waveT += dt; spawnT -= dt;
          if (spawnT <= 0) { spawnFormation(); spawnT = rand(2.1, 3.3) / (1 + wave * .06); }
          if (waveT > 25) {
            waveT = 0; wave++;
            if (wave % 4 === 0) startBoss();
            else core.showBanner('WAVE ' + wave, wave % 4 === 3 ? '거대한 그림자가 다가온다 · 경계하라' : '적 증원 · 협곡 깊숙이', '#ff7a1a');
          }
        }
        comboT -= dt; if (comboT <= 0 && combo) { combo = 0; mult = 1; }
      }
      if (state === 'dead') { deadT -= rdt; if (deadT <= 0) gameOver(); }
    }
    function update(dt, rdt) {
      dtNow = dt; T += dt; scroll += S * dt;
      for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; tm.t -= dt; if (tm.t <= 0) { timers.splice(i, 1); tm.fn(); } }
      updateWorld(dt);
      updatePlayer(dt);
      director(dt, rdt);
      updateFireballs(dt);
      updateEnemies(dt);
      updateShots(dt);
      updatePickups(dt);
      updateFallers(dt);
      fireVoice.set(0, breathing ? .22 : 0, 500 + rand(0, 400));
    }

    /* ---------- camera ---------- */
    const camPos = new THREE.Vector3(0, 14, 30), look = new THREE.Vector3(0, 10, -10);
    const _ch = new THREE.Vector3(), _cl = new THREE.Vector3(), _ob = new THREE.Vector3(), _ol = new THREE.Vector3();
    function updateCamera(rdt) {
      _ch.set(p.x * .55, p.y * .62 + 6, p.z + 24);
      _cl.set(p.x * .78, p.y * .82 + 1.5, p.z - 60);
      const a = T * .22;
      _ob.set(p.x + Math.sin(a) * 20, p.y + 3 + Math.sin(T * .3) * 3, p.z + Math.cos(a) * 20 - 3);
      _ol.set(p.x, p.y + .5, p.z - 2);
      if (state !== 'title') camBlend = Math.min(1, camBlend + rdt * .7);
      const k = camBlend * camBlend * (3 - 2 * camBlend);
      _ob.lerp(_ch, k); _ol.lerp(_cl, k);
      camPos.lerp(_ob, damp(k < 1 ? 4 : 5, rdt)); look.lerp(_ol, damp(8, rdt));
      camera.position.copy(camPos);
      camera.lookAt(look);
      camera.rotateZ(p.roll * .1 * k);
      const fov = w.baseFov + w.fx.fovKick + (w.fx.slowT > 0 ? -6 : 0);
      if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov) * damp(6, rdt); camera.updateProjectionMatrix(); }
      sky.position.copy(camera.position);
      lava.position.x = camera.position.x; lava.position.z = camera.position.z - 900;
    }

    /* ---------- draw instanced projectiles ---------- */
    function draw() {
      let ns = 0, no = 0;
      for (const b of eB) {
        _p.set(b.x, b.y, b.z);
        _c.setRGB(b.c[0] * .55 + .45, b.c[1] * .55 + .45, b.c[2] * .55 + .45);
        if (b.kind === 'spear') {
          if (ns >= SP_MAX) continue;
          _d.set(b.vx, b.vy, b.vz).normalize(); _q.setFromUnitVectors(_Z, _d); _s.set(b.r, b.r, b.r);
          _m.compose(_p, _q, _s); spearMesh.setMatrixAt(ns, _m); spearMesh.setColorAt(ns, _c); ns++;
        } else {
          if (no >= ORB_MAX) continue;
          const pr = b.r * (1 + Math.sin(b.t * 18) * .12); _q.identity(); _s.set(pr, pr, pr);
          _m.compose(_p, _q, _s); orbMesh.setMatrixAt(no, _m); orbMesh.setColorAt(no, _c); no++;
        }
      }
      spearMesh.count = ns; orbMesh.count = no;
      let nf = 0; _q.identity();
      for (const f of fbs) {
        if (nf >= FB_MAX) break;
        const pr = 1 + Math.sin(f.t * 30) * .15;
        _p.set(f.x, f.y, f.z); _s.set(pr, pr, pr); _m.compose(_p, _q, _s); fbMesh.setMatrixAt(nf++, _m);
      }
      fbMesh.count = nf;
      for (const mesh of [spearMesh, orbMesh, fbMesh]) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
    }

    /* ---------- HUD ---------- */
    const hudCache = {};
    function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
    const pipEls = Array.from(root.querySelectorAll('#pips span'));
    const retEl = $('retAim'), heatBar = $('heatBar'), heatFill = $('heatFill'), heatTag = $('heatTag');
    function hud() {
      if (state !== 'play' && state !== 'dead') return;
      setText('score', score.toLocaleString()); setText('mult', '×' + mult); setText('wave', String(wave));
      setText('best', Math.max(best, score).toLocaleString());
      $('comboFill').style.width = (combo ? Math.max(0, comboT / 2.6) * 100 : 0).toFixed(1) + '%';
      pipEls.forEach((el, i) => el.classList.toggle('on', i < p.hp));
      $('pips').classList.toggle('low', p.hp <= 2);
      heatFill.style.width = clamp(p.heat, 0, 100).toFixed(1) + '%';
      const over = p.overT > 0;
      heatBar.classList.toggle('over', over); heatTag.classList.toggle('over', over);
      setText('heatTag', over ? 'OVERHEAT' : 'HEAT');
      setText('runeTag', p.runeT > 0 ? 'RUNE ×3 · ' + Math.ceil(p.runeT) + 's' : '');
      $('fbBtn').disabled = p.fbCd > 0; $('rollBtn').disabled = p.rollCd > 0;
      if (p.alive && state === 'play') {
        const [sx, sy, vis] = w.toScreen(_mw.x + aim.x * 60, _mw.y + aim.y * 60, _mw.z + aim.z * 60);
        retEl.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
        retEl.style.opacity = vis ? 1 : 0;
        retEl.classList.toggle('lock', lockOn);
      }
      const boss = enemies.find(e => e.kind === 'boss' && e.d <= 0 && !(e.dying > 0));
      $('bossBar').hidden = !boss;
      if (boss) $('bossFill').style.width = (Math.max(0, boss.hp / boss.maxHp) * 100).toFixed(1) + '%';
    }

    /* ---------- go ---------- */
    $('best').textContent = best.toLocaleString();
    $('muteBtn').textContent = A.muted ? 'SOUND OFF' : 'SOUND ON';
    A.drone(.04);
    core.run(w, ac.signal, { isPaused: () => paused, update, camera: updateCamera, draw, hud });

    return {
      dispose() {
        ac.abort();
        fireVoice.stop();
        A.drone(0);
        core.clearFeedback();
        w.dispose();
        for (const g of ownGeos) g.dispose();
        root.innerHTML = '';
        root.removeAttribute('style');
      }
    };
  }
};
})();
