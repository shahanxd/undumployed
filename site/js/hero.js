// The bay. The world was rendered ahead of time into a few pictures (see scripts/scene), so it's on screen at once.
// Only what moves runs live: the water, the wind in the clouds, the surf, the chimney smoke and the lighthouse's beam.
// It's one cheap shader that looks things up in the pictures instead of computing a world, so it stays smooth on integrated graphics.
import { getTheme, reducedMotion } from './state.js';

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uA,uB,uM;
uniform vec2 uRes; uniform vec4 uCrop,uGlass; uniform vec3 uBeam,uGlintDir,uGlintCol;
uniform float uMix,uT,uLod,uGain,uFace,uSea,uRain,uFlash,uDim,uGlassR;
uniform int uZ;
out vec4 O;
const float F=1.25,K=.1,AS=1.7777778;
const vec3 RO=vec3(-7.24,6.5,0.),L=vec3(150.,109.2,330.),LC=vec3(1.,.82,.56);
const vec2 LAMP=vec2(.8348,.788),CHIMNEY=vec2(.8066,.6838),HEARTH=vec2(.7926,.6583),SQ=vec2(AS,1.);

float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
vec3 plate(vec2 uv,float lod){ uv.y=1.-uv.y; vec3 a=textureLod(uA,uv,lod).rgb; return uMix>.002?mix(a,textureLod(uB,uv,lod).rgb,uMix):a; }
vec3 rayOf(vec2 p){ return normalize(vec3((p.x-.5)*AS,p.y-.5+K,F)); }
vec2 uvOf(vec3 d){ return vec2(d.x/d.z*F/AS+.5,d.y/d.z*F-K+.5); }

// The beam, solved in closed form: where the view ray passes nearest the beam's axis, how much of the cone it crosses there.
float beam(vec3 ro,vec3 rd,vec3 dir){
  vec3 w=ro-L; float b=dot(rd,dir),d=dot(rd,w),e=dot(dir,w),den=max(1.-b*b,.001);
  float t=(b*e-d)/den,s=(e-b*d)/den;
  if(s<0.){ s=0.; t=-d; }
  if(t<0.) return 0.;                                  // the fade in the air around the camera (below) makes this seamless
  vec3 p=ro+rd*t,v=p-(L+dir*s);
  float sig=.078*max(s,24.)+1.2,x2=dot(v,v)/(sig*sig);
  if(x2>9.) return 0.;
  vec3 lp=p-L; float r2=dot(lp,lp),r=sqrt(r2),mu=dot(lp/max(r,.001),-rd);
  float ph=.91/pow(1.09-.6*mu,1.5)*.0796+.03;
  float fog=.55+.9*vn(p.xz*.0085+vec2(uT*.05,uT*.03));
  fog*=.65+.75*vn(p.xy*.03+vec2(-uT*.09,uT*.04));
  return smoothstep(0.,90.,t)*smoothstep(-2.,46.,p.y)*(exp(-x2)+.45*exp(-x2*7.))*ph*fog*min(sig/sqrt(max(den,.05)),120.)/(r*420.+9000.)*exp(-r*.0017);
}
// A lobe heading behind the headland, or tipped down into it, doesn't show over the rock.
float clearOf(vec3 dir,float rock){ return 1.-rock*max(smoothstep(-.3,.3,dir.z),1.-smoothstep(-.3,-.08,dir.y))*.85; }
vec3 beams(vec3 ro,vec3 rd,float rock){ vec3 back=vec3(-uBeam.x,uBeam.y,-uBeam.z); return LC*(beam(ro,rd,uBeam)*clearOf(uBeam,rock)+.75*beam(ro,rd,back)*clearOf(back,rock))*60000.; }
float beamSoft(vec3 ro,vec3 rd){
  vec3 w=ro-L; float b=dot(rd,uBeam),d=dot(rd,w),e=dot(uBeam,w),den=max(1.-b*b,.0006),s=max((e-b*d)/den,24.);
  vec3 v=ro+rd*((b*e-d)/den)-(L+uBeam*s); float sig=.09*s+1.2;
  return exp(-dot(v,v)/(sig*sig))*sig/sqrt(den)/(s*s+500.);
}
vec3 glare(vec3 rd){
  float a2=2.*(1.-dot(rd,normalize(L-RO))),a=sqrt(a2);
  float g=.0000075/(a2+.000006)+.00022/(a+.014);
  return LC*g*(1.+2.5*uFace);
}

void main(){
  vec2 suv=gl_FragCoord.xy/uRes;
  vec2 uv=uCrop.xy+suv*uCrop.zw;
  vec3 m=textureLod(uM,vec2(uv.x,1.-uv.y),0.).rgb;
  vec3 rd=rayOf(uv);
  vec3 c,light=vec3(0.);

  if(m.r>.02&&rd.y<-.0005){
    // Water: real wave directions and speeds tilt each pixel's mirror, and it looks up its reflection in the picture.
    float t=RO.y/-rd.y; vec2 p=RO.xz+rd.xz*t;
    vec2 g=vec2(0.); float fr=.16,a=1.,an=.7;
    for(int i=0;i<6+uZ;i++){
      vec2 d=vec2(sin(an),cos(an));
      float ph=dot(d,p)*fr+uT*sqrt(9.81*fr),sn=sin(ph);
      g+=d*cos(ph)*exp(sn-1.)*a*fr/(1.+t*fr*.055);
      a*=.76; fr*=1.5; an+=1.2354;
    }
    g*=uSea;
    vec3 n=normalize(vec3(-g.x,1.,-g.y));
    vec3 R=reflect(rd,n); R.y=max(R.y,.0008);
    vec2 w=uvOf(vec3(R.x,-R.y,R.z)); w.y=abs(w.y);
    vec3 mt=textureLod(uM,vec2(w.x,1.-w.y),0.).rgb;
    vec3 wc=plate(mt.r>.5?w:uv,uLod+1.1);
    // Where the swell meets the rock it breaks: it rolls in, lingers, and drains away.
    float rock=textureLod(uM,vec2(uv.x,1.-uv.y),3.2).b;
    if(rock>.015){
      float sh=clamp(rock*2.,0.,1.);
      float roll=.5+.5*sin(uT*.7+uv.x*40.+3.*vn(vec2(uv.x*60.,uT*.06)));
      float fm=.55*vn(vec2(uv.x*520.+uT*.16,uv.y*1400.-uT*.5))+.45*vn(vec2(uv.x*1300.-uT*.2,uv.y*3000.+uT*.3));
      float edge=1.-sh*(.3+.4*roll);
      wc=mix(wc,plate(vec2(uv.x,.6),5.)*1.3+.05,smoothstep(edge,edge+.09,fm)*.7);
    }
    float fres=.02+.98*pow(1.-max(dot(n,-rd),0.),5.);
    wc+=uGlintCol*pow(max(dot(R,uGlintDir),0.),760.)*2.2;
    light=(glare(R)*1.2+LC*beamSoft(RO+rd*t,R)*90.)*min(fres*2.4+.12,1.)*uGain;
    vec3 hit=RO+rd*t,lv=hit-L; float lr=length(lv); lv/=lr;
    float pool=exp(-(1.-dot(lv,uBeam))*2./(.078*.078))+.75*exp(-(1.-dot(lv,vec3(-uBeam.x,uBeam.y,-uBeam.z)))*2./(.078*.078));
    light+=LC*pool*uGain*(.85+1.6*dot(g,g)*40.)*5200./(lr*lr+900.)*.9;
    c=mix(plate(uv,uLod),wc,m.r);
  } else {
    // Sky: the wind carries the clouds. Two copies of the picture slide along it in turn, each taking over as the other has gone too far.
    float clear=m.g>.7?smoothstep(.96,1.,textureLod(uM,vec2(uv.x,1.-uv.y),5.5).g):0.;
    clear*=smoothstep(.035,.12,length((uv-uvOf(uGlintDir))*SQ))*smoothstep(.05,.15,length((uv-LAMP)*SQ));
    if(clear>.001){
      vec2 fl=vec2(-1.,.05)+.8*vec2(vn(uv*vec2(3.,6.)+uT*.011)-.5,vn(uv*vec2(4.,5.)-uT*.009+9.)-.5);
      fl*=clear*(.22+1.1*clamp((uv.y-.4)/.6,0.,1.))*.036;   // the nearer overhead, the faster it crosses
      float p0=fract(uT/16.+1.4*vn(uv*vec2(2.5,4.))),p1=fract(p0+.5);   // each patch of sky hands over at its own moment, so nothing pulses as one
      c=mix(plate(uv-fl*(p0-.5),uLod),plate(uv-fl*(p1-.5),uLod),abs(2.*p0-1.));
    } else c=plate(uv,uLod);
  }

  // The cottage: a thread of smoke from the chimney, and a fire that isn't quite steady.
  vec2 sm=(uv-CHIMNEY)*SQ;
  if(sm.y>-.001&&sm.y<.13&&sm.x>-.17&&sm.x<.03){
    float hh=sm.y/.13,wd=.0022+.024*hh,cx=-.11*hh*hh-.012*hh+.004*sin(sm.y*46.-uT*.9)*(.25+hh);
    float den=exp(-pow((sm.x-cx)/wd,2.))*smoothstep(0.,.04,hh)*pow(1.-hh,1.6)*(.15+1.35*vn(vec2(sm.x*110.+uT*.12,sm.y*70.-uT*.7)));
    vec3 sky=plate(uv,uLod+3.);
    c=mix(c,mix(sky,vec3(dot(sky,vec3(.33))),.65)*1.45+.05,clamp(den*.55,0.,.55));
  }
  vec2 hr=(uv-HEARTH)*SQ;
  c+=vec3(1.,.62,.3)*exp(-dot(hr,hr)/.00006)*(.1+.24*vn(vec2(uT*2.7,1.)));

  // frosted glass behind the search box: a wider mip of the same picture, so it costs one texture read and no compositing
  if(uGlassR>0.){
    vec2 px=gl_FragCoord.xy,ctr=.5*(uGlass.xy+uGlass.zw),hs=.5*(uGlass.zw-uGlass.xy);
    vec2 dq=abs(px-ctr)-hs+uGlassR;
    float sd=length(max(dq,0.))+min(max(dq.x,dq.y),0.)-uGlassR;
    if(sd<1.) c=mix(c,plate(uv,uLod+4.4),clamp(1.-sd,0.,1.));
  }

  light+=beams(RO,rd,m.b)*uGain;
  if(m.r<.5) light+=glare(rd)*uGain;
  c=1.-(1.-c)*exp(-light/(1.+.62*light));               // light adds like light: it can never clip to a flat white shape

  if(uRain>.01){
    vec2 ra=vec2(suv.x*uRes.x/uRes.y+suv.y*.17,suv.y*.08)*vec2(80.,80.); ra.y+=uT*1.7;
    vec2 id=floor(ra),f=fract(ra);
    float r=h21(id),s=r>.78?(1.-smoothstep(0.,.08,abs(f.x-.2-.6*h21(id+3.))))*smoothstep(0.,.3,f.y)*(1.-smoothstep(.6,1.,f.y)):0.;
    c+=vec3(.55,.62,.75)*s*uRain*(.07+dot(light,vec3(.25)));
  }
  c+=vec3(.55,.62,.8)*uFlash*(.03+.35*dot(c,vec3(.33)));
  c*=uDim;
  c+=(h21(gl_FragCoord.xy+fract(uT)*91.)-.5)*.0085;   // dither, so dark gradients never band
  O=vec4(c,1.);
}
`;
const VERTEX = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}';

const scene = document.getElementById('scene');
const plate = document.getElementById('scene-plate');
const canvas = document.getElementById('scene-gl');

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };

/* The three moods sit on one line, dusk to night to storm. Theme and scroll each name a place on it and the scene glides there, so nothing ever cuts. */
const MOODS = [
  { file: 'dusk', dir: norm([-.055, .03, 1]), col: [1, .55, .3], gain: .8, sea: 1, rain: 0 },
  { file: 'night', dir: norm([-.11, .36, 1]), col: [.8, .86, 1], gain: 1, sea: .8, rain: 0 },
  { file: 'storm', dir: norm([.2, .3, 1]), col: [.3, .32, .4], gain: .85, sea: 2.3, rain: 1 },
];
const homeMood = () => (getTheme() === 'storm' ? 1 : 0);

/* The camera the pictures were rendered with. */
const F = 1.25, K = .1, AS = 16 / 9, RO = [-7.24, 6.5, 0], L = [150, 109.2, 330];
const SPIN = .42;   // a turn every 15 seconds, with a beam passing every 7 or so

const S = { yaw: 2.55, pitch: -.018, vy: SPIN, vp: 0, lastMove: -1e9, ptr: null, focus: false, aimAt: -1e9, gain: 0, flash: 0, nextBolt: 5, tod: -1, dim: 1 };
let beamDir = [0, 0, 1];
let page = null, crop = [0, 0, 1, 1], W = 0, H = 0, vw = 1, vh = 1, scale = 1;
let gl = null, prog = null, parallel = null, u = null, gen = 0, M = null, P = [null, null, null];
const pending = new Set();
let raf = 0, running = false, shown = false, shownAt = 0, gaveUp = false, last = 0, ema = 16, slowFor = 0;
let letterAt = [];

const rayAt = (cx, cy) => {
  const a = crop[0] + (cx / vw) * crop[2], b = crop[1] + (1 - cy / vh) * crop[3];
  return norm([(a - .5) * AS, b - .5 + K, F]);
};

// the title catches the same light the shader draws
const litAt = (rd) => {
  const one = (dir) => {
    const w = [RO[0] - L[0], RO[1] - L[1], RO[2] - L[2]];
    const b = rd[0] * dir[0] + rd[1] * dir[1] + rd[2] * dir[2];
    const d = rd[0] * w[0] + rd[1] * w[1] + rd[2] * w[2], e = dir[0] * w[0] + dir[1] * w[1] + dir[2] * w[2];
    const den = Math.max(1 - b * b, .001); let t = (b * e - d) / den, s = (e - b * d) / den;
    if (s < 0) { s = 0; t = -d; }
    if (t < 0) return 0;
    const v = [RO[0] + rd[0] * t - L[0] - dir[0] * s, RO[1] + rd[1] * t - L[1] - dir[1] * s, RO[2] + rd[2] * t - L[2] - dir[2] * s];
    const sig = .078 * Math.max(s, 24) + 1.2;
    return Math.exp(-(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) / (sig * sig));
  };
  return Math.max(one(beamDir), .75 * one([-beamDir[0], beamDir[1], -beamDir[2]]));
};

const measureLetters = () => {
  if (page) letterAt = page.letters.map((el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + window.scrollY]; });
};

/* ---------- pictures: decoded off the main thread, at no more than the screen needs, and only when a mood calls for them ---------- */
const upload = async (file, mine) => {
  const blob = await (await fetch(`assets/scene/${file}.webp`)).blob();
  const opts = file === 'mask' ? {} : { resizeWidth: Math.min(2560, Math.ceil(vw * Math.min(devicePixelRatio || 1, 1.5) / crop[2])), resizeQuality: 'high' };
  const bmp = await createImageBitmap(blob, opts);
  if (mine !== gen) { bmp.close(); return null; }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const w = bmp.width; bmp.close();
  return { tex, w };
};
// A picture that fails to arrive gets asked for again in a few seconds. Until then the scene holds the mood it has.
const need = (i) => {
  if (P[i] || pending.has(i)) return;
  pending.add(i);
  const mine = gen;
  upload(MOODS[i].file, mine).then((p) => { if (mine === gen) { P[i] = p; pending.delete(i); } }, () => setTimeout(() => pending.delete(i), 4000));
};
const needMask = (mine) => upload('mask', mine).then((m) => { if (mine === gen) M = m; }, () => setTimeout(() => { if (mine === gen) needMask(mine); }, 4000));

/* ---------- the program: all of it can be rebuilt if the graphics context is lost ---------- */
const build = () => {
  gen++;
  u = null; M = null; P = [null, null, null]; pending.clear();
  parallel = gl.getExtension('KHR_parallel_shader_compile');   // extensions don't survive a lost context
  prog = gl.createProgram();
  for (const [type, code] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
    const o = gl.createShader(type); gl.shaderSource(o, code); gl.compileShader(o); gl.attachShader(prog, o);
  }
  gl.linkProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());
  const mine = gen;
  needMask(mine);
  need(homeMood());
  (function wait() {
    if (mine !== gen) return;
    if (parallel && gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR) === false) { setTimeout(wait, 16); return; }
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
    const uniforms = {};
    for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(prog, i); uniforms[a.name] = gl.getUniformLocation(prog, a.name); }
    u = uniforms;
  })();
};

const sleep = () => { shown = false; scene.classList.remove('is-live'); };

const startGl = () => {
  gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'default' });
  if (!gl) { gaveUp = true; return; }
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  if (info && /swiftshader|llvmpipe|software|basic render/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))) { gaveUp = true; return; }   // no real GPU: the still picture is the better page
  /* Drivers can drop the context (a GPU reset, a laptop switching graphics). The picture shows through until it's back. */
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gen++; u = null; sleep(); });
  canvas.addEventListener('webglcontextrestored', build);
  build();
};

const size = () => {
  vw = scene.clientWidth; vh = scene.clientHeight;
  if (!vw || !vh) return;
  crop = window.__frameScene();
  measureLetters();
  if (!gl) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5), cap = Math.min(1, 2200 / (vw * dpr));
  W = Math.max(2, Math.round(vw * dpr * cap * scale)); H = Math.max(2, Math.round(vh * dpr * cap * scale));
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
};
const resizes = new ResizeObserver(size);

/* ---------- each frame ---------- */
function draw() {
  const now = performance.now() / 1000, dt = Math.min(.05, now - last); last = now;
  const sheet = page.sheet.getBoundingClientRect();
  if (shown && sheet.top <= 0 && sheet.bottom >= window.innerHeight) return;   // the sheet hides the scene entirely: spend nothing
  if (!u || !M) return;
  if (S.tod < 0) { need(homeMood()); if (!P[homeMood()]) return; S.tod = homeMood(); }

  const T = now + 40, y = window.scrollY;
  const inCoda = !page.coda.hidden && page.coda.getBoundingClientRect().top < window.innerHeight;
  let want = inCoda ? 1 : homeMood() + smooth(.02, .5, y / window.innerHeight);      // the page always ends on the calm night sea
  let ready = true;
  for (let i = Math.floor(Math.min(want, S.tod)); i <= Math.ceil(Math.max(want, S.tod)); i++) { need(i); ready = ready && !!P[i]; }
  if (!ready) want = S.tod;                                                          // a picture still on its way: wait for it, then go
  const glide = 1 - Math.exp(-dt * 3.2);
  S.tod += (want - S.tod) * glide;
  S.dim += ((inCoda ? .62 : 1) - S.dim) * glide;
  const iA = Math.min(Math.floor(S.tod), 1), m = S.tod - iA;
  const aTex = P[iA], bTex = P[iA + 1], cA = MOODS[iA], cB = MOODS[iA + 1];
  if (!aTex) return;

  /* The lens has weight: on its own it glides round; when you move, a damped spring swings it toward you. */
  S.gain = Math.min(1, S.gain + dt / 1.5);
  const toBox = S.focus && now - S.aimAt < 2.6;
  if (toBox || (now - S.lastMove < 1.5 && S.ptr)) {
    let cx, cy;
    if (toBox) { const r = page.search.getBoundingClientRect(); cx = r.left + r.width * .5; cy = r.top + r.height / 2; }
    else { cx = S.ptr[0]; cy = S.ptr[1]; }
    const rd = rayAt(cx, cy);
    const T0 = (L[2] - RO[2] - 1) / Math.max(rd[2], .2);
    const v = norm([RO[0] + rd[0] * T0 - L[0], RO[1] + rd[1] * T0 - L[1], -.02]);
    let dy = Math.atan2(v[2], v[0]) - S.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    S.vy += (dy * 16 - S.vy * 6.5) * dt;
    // A lens tips only so far: following the cursor it stays above the water. Only the search box, out over open sea, draws it lower.
    S.vp += ((Math.max(Math.asin(v[1]), toBox ? -.36 : -.17) - S.pitch) * 16 - S.vp * 6.5) * dt;
  } else {
    S.vy += (SPIN - S.vy) * dt * 1.1;
    S.vp += ((-.018 - S.pitch) * 3 - S.vp * 3) * dt;
  }
  S.yaw += S.vy * dt; S.pitch += S.vp * dt;
  beamDir = norm([Math.cos(S.yaw) * Math.cos(S.pitch), Math.sin(S.pitch), Math.sin(S.yaw) * Math.cos(S.pitch)]);

  const toCam = norm([RO[0] - L[0], 0, RO[2] - L[2]]);
  let az = Math.abs(Math.atan2(beamDir[0] * toCam[2] - beamDir[2] * toCam[0], beamDir[0] * toCam[0] + beamDir[2] * toCam[2]));
  az = Math.min(az, Math.PI - az);

  /* lightning */
  const raining = mix(cA.rain, cB.rain, m);
  S.flash *= Math.exp(-dt * 7);
  if (raining > .6 && T > S.nextBolt) { S.flash = 1; S.nextBolt = T + 5 + Math.random() * 9; }

  gl.useProgram(prog);
  gl.uniform2f(u.uRes, W, H);
  gl.uniform4f(u.uCrop, crop[0], crop[1], crop[2], crop[3]);
  gl.uniform3fv(u.uBeam, beamDir);
  gl.uniform1f(u.uT, T % 4000);
  gl.uniform1f(u.uMix, bTex ? m : 0);
  gl.uniform1f(u.uGain, S.gain * mix(cA.gain, cB.gain, m));
  gl.uniform1f(u.uFace, Math.exp(-az * az / .03));
  gl.uniform1f(u.uSea, mix(cA.sea, cB.sea, m));
  gl.uniform1f(u.uRain, raining);
  gl.uniform1f(u.uFlash, S.flash);
  gl.uniform1f(u.uDim, S.dim);
  gl.uniform3fv(u.uGlintDir, norm([mix(cA.dir[0], cB.dir[0], m), mix(cA.dir[1], cB.dir[1], m), mix(cA.dir[2], cB.dir[2], m)]));
  gl.uniform3f(u.uGlintCol, mix(cA.col[0], cB.col[0], m), mix(cA.col[1], cB.col[1], m), mix(cA.col[2], cB.col[2], m));
  gl.uniform1f(u.uLod, Math.max(0, Math.log2(aTex.w * crop[2] / W)));
  const r = page.search.getBoundingClientRect(), sx = W / vw, sy = H / vh;
  gl.uniform4f(u.uGlass, r.left * sx, H - r.bottom * sy, r.right * sx, H - r.top * sy);
  gl.uniform1f(u.uGlassR, r.bottom > 0 ? 16 * sx : 0); gl.uniform1i(u.uZ, 0);
  const bind = (i, name, tex) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u[name], i); };
  bind(0, 'uA', aTex.tex); bind(1, 'uB', (bTex || aTex).tex); bind(2, 'uM', M.tex);
  gl.viewport(0, 0, W, H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  if (!shown) { shown = true; shownAt = now; scene.classList.add('is-live'); }
  if (now - shownAt > 1.4) need(homeMood() + 1);                                     // once the fade-in is over, get scrolling's mood ready

  /* the title catches the light */
  if (y < vh * 1.1 && letterAt.length) {
    page.letters.forEach((el, i) => {
      const v = Math.round(clamp(litAt(rayAt(letterAt[i][0], letterAt[i][1] - y)) * S.gain * 1.25) * 40) / 40;
      if (v !== el._l) { el._l = v; el.style.setProperty('--l', v); }
    });
  }

  /* If the machine can't keep up, drop resolution once and stay there: it never climbs back, so it can't oscillate.
     If even half resolution is too much, the still picture is the better page. */
  ema = ema * .94 + dt * 1000 * .06;
  slowFor = ema > 24 && document.hasFocus() ? slowFor + 1 : 0;   // a window in the background is throttled, not slow
  if (slowFor > 40 && scale > .5) { scale = Math.max(.5, scale * .78); size(); slowFor = 0; ema = 16; }
  else if (slowFor > 90 && ema > 40) { gaveUp = true; running = false; sleep(); }
}

/* On a fast screen, draw every other refresh. An even 72 looks smoother than an uneven 85, and uses half the power. */
let rafLast = 0, every = 1, tick = 0; const gaps = [];
function loop(ts) {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  if (gaps.length < 16) {
    if (rafLast) gaps.push(ts - rafLast);
    rafLast = ts;
    if (gaps.length === 16 && gaps.sort((a, b) => a - b)[8] < 9) every = 2;
  }
  if (++tick % every === 0) draw();
}

/* ---------- the page ---------- */
const onPointer = (e) => { if (e.pointerType !== 'touch') { S.ptr = [e.clientX, e.clientY]; S.lastMove = performance.now() / 1000; } };
const showPlate = () => { plate.src = `assets/scene/${MOODS[homeMood()].file}.webp`; };

let mounts = 0;

/** Brings the scene up behind the home page. Returns a teardown function; the pictures stay in memory for the next visit. */
export function mountHero({ title, search, input, sheet, coda }) {
  const mount = ++mounts;
  page = { letters: [...title.children], search, sheet, coda };
  scene.hidden = false;
  showPlate();
  resizes.observe(scene);
  size();
  window.addEventListener('themechange', showPlate);

  const aim = () => { S.focus = true; S.aimAt = performance.now() / 1000; };
  input.addEventListener('focus', aim);
  input.addEventListener('input', aim);
  input.addEventListener('blur', () => { S.focus = false; });

  if (document.fonts?.load) {
    title.classList.add('is-loading');
    const show = () => { title.classList.remove('is-loading'); measureLetters(); };
    Promise.race([document.fonts.load('italic 500 100px Newsreader'), new Promise((r) => setTimeout(r, 600))]).then(show, show);
  }

  if (!reducedMotion()) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    // starts after first paint, and never blocks it
    requestAnimationFrame(() => setTimeout(() => {
      if (mount !== mounts) return;
      if (!gl && !gaveUp) { startGl(); size(); }
      if (gaveUp) return;
      S.tod = -1; S.gain = 0; S.dim = 1; last = performance.now() / 1000;
      running = true;
      raf = requestAnimationFrame(loop);
    }, 0));
  }

  return () => {
    mounts++;
    running = false;
    cancelAnimationFrame(raf);
    page = null; letterAt = [];
    sleep();
    resizes.disconnect();
    window.removeEventListener('themechange', showPlate);
    window.removeEventListener('pointermove', onPointer);
    scene.hidden = true;
  };
}
