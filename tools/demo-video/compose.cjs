/* Edits the raw recording into a finished video.

     node compose.cjs <workdir> <edit-name> [--from=SEC --to=SEC] [--still=SEC,SEC…]

   An edit (edits/<name>.cjs) describes a list of shots — ranges of the raw recording, possibly sped
   up, framed and zoomed — plus overlays (titles, captions, subtitles, highlight rings). Every output
   frame is laid out in studio.html (footage frames as <img>, overlays as HTML) and screenshotted
   into ffmpeg, so the type and layout are real CSS. --still renders single PNGs for checking. */
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const WORK = path.resolve(process.argv[2]);
const NAME = process.argv[3];
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : null; };
const SRC_W = 1920, SRC_H = 1080;

const raw = JSON.parse(fs.readFileSync(path.join(WORK, 'raw/full.json'), 'utf8'));
const FPS = raw.fps;
const FRAMES = path.join(WORK, 'frames/full');
if (!fs.existsSync(path.join(FRAMES, '00001.jpg'))){
  fs.mkdirSync(FRAMES, { recursive: true });
  console.log('extracting frames…');
  execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(WORK, 'raw/full.mp4'), '-q:v', '2', path.join(FRAMES, '%05d.jpg')], { stdio: 'inherit' });
}
const nFrames = fs.readdirSync(FRAMES).length;
const framePath = f => 'file://' + path.join(FRAMES, String(Math.max(1, Math.min(nFrames, Math.round(f) + 1))).padStart(5, '0') + '.jpg');

/* ---------- what the edit modules get ---------- */
const marks = Object.fromEntries(raw.marks.map(m => [m.name, m.f]));
function m(name, plusSec = 0){
  if (!(name in marks)) throw new Error('no mark ' + name);
  return marks[name] + Math.round(plusSec*FPS);
}
// the dialogue as it was on screen: [{f0, f1, line, who, title, board}]
function timeline(){
  const st = {}, out = [];
  let cur = null;
  const flush = f => { if (cur){ cur.f1 = f; if (cur.line && cur.f1 - cur.f0 >= 10) out.push(cur); } };
  for (const e of raw.log){
    st[e.k] = e.v;
    if (e.k === 'line' || (e.k === 'who' && cur && cur.f0 === e.f)){
      if (e.k === 'line'){ flush(e.f); cur = { f0: e.f, line: e.v, who: st.who, title: st.title, board: st.board }; }
      else cur.who = e.v;
    }
    if (e.k === 'board' && cur) cur.board = cur.board || e.v;
  }
  flush(raw.frames);
  return out;
}
// periods where a key held a value: [{f0, f1, v}]
function periods(key){
  const out = []; let cur = null;
  for (const e of raw.log){
    if (e.k !== key) continue;
    if (cur){ cur.f1 = e.f; out.push(cur); }
    cur = { f0: e.f, v: e.v };
  }
  if (cur){ cur.f1 = raw.frames; out.push(cur); }
  return out;
}
const ctx = { m, fps: FPS, frames: raw.frames, timeline, periods, marks };

// edits/<name>.cjs, or <name>-th → edits/<name>.cjs in Thai
const [, BASE, LANG] = NAME.match(/^(.*?)(?:-(en|th))?$/);
const edit = require(path.join(__dirname, 'edits', BASE + '.cjs'))(ctx, LANG || 'en');
const OW = edit.w || 1920, OH = edit.h || 1080;

/* ---------- layout the shots ---------- */
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t*t*(3 - 2*t);
let t = 0;
for (const s of edit.shots){
  if (s.src){
    s.segs = s.src.map(([a, b, sp = 1]) => ({ a, b, sp, dur: (b - a)/FPS/sp }));
    s.dur = s.segs.reduce((x, g) => x + g.dur, 0);
  } else if (s.freeze != null) s.dur = s.dur || 2;
  s.xin = s.xin || 0;
  s.start = Math.max(0, t - s.xin);
  t = s.start + s.dur;
}
const TOTAL = t;
// groups: consecutive shots that share overlays (e.g. one explainer section = several clips)
const GROUPS = {};
for (const s of edit.shots) if (s.group){
  const g = GROUPS[s.group] = GROUPS[s.group] || { start: s.start, end: 0 };
  g.end = Math.max(g.end, s.start + s.dur);
}
console.log(`${NAME}: ${edit.shots.length} shots, ${TOTAL.toFixed(1)} s`);

function srcFrame(s, u){
  if (s.freeze != null) return s.freeze;
  let acc = 0;
  for (const g of s.segs){
    if (u < acc + g.dur || g === s.segs[s.segs.length - 1]) return Math.min(g.b, g.a + (u - acc)*g.sp*FPS);
    acc += g.dur;
  }
}
function camAt(s, u){
  const view = s.view || { x: 0, y: 0, w: OW, h: OH };
  const fit = Math.max(view.w/SRC_W, view.h/SRC_H);
  let c = s.cam || {};
  if (Array.isArray(c)){
    const k = u/s.dur;
    let i = 0;
    while (i < c.length - 1 && c[i + 1][0] <= k) i++;
    const [k0, c0] = c[i], [k1, c1] = c[Math.min(i + 1, c.length - 1)];
    const e = k1 > k0 ? ease((k - k0)/(k1 - k0)) : 0;
    const lerp = (p, q) => p + (q - p)*e;
    const g = (o, key, d) => o[key] ?? d;
    c = { cx: lerp(g(c0, 'cx', 960), g(c1, 'cx', 960)), cy: lerp(g(c0, 'cy', 540), g(c1, 'cy', 540)), z: lerp(g(c0, 'z', 1), g(c1, 'z', 1)) };
  }
  const sc = fit*(c.z ?? 1);
  const hw = view.w/(2*sc), hh = view.h/(2*sc);
  const cx = SRC_W*sc >= view.w ? Math.min(SRC_W - hw, Math.max(hw, c.cx ?? 960)) : SRC_W/2;
  const cy = SRC_H*sc >= view.h ? Math.min(SRC_H - hh, Math.max(hh, c.cy ?? 540)) : SRC_H/2;
  return { view, s: sc, cx, cy, tx: view.w/2 - cx*sc, ty: view.h/2 - cy*sc };
}
function alphaOf(o, u, dur){
  const fi = o.fadeIn ?? o.fade ?? 0.35, fo = o.fadeOut ?? o.fade ?? 0.35;
  return Math.min(fi ? ease(u/fi) : 1, fo ? ease((dur - u)/fo) : 1);
}
function placeOverlay(o, a, cam){
  const r = { id: o.id, html: o.html, opacity: +(a*(o.opacity ?? 1)).toFixed(3), x: o.x, y: o.y, w: o.w, h: o.h, z: o.z, origin: o.origin };
  const kind = o.anim || 'up';
  if (kind === 'up') r.dy = (1 - a)*(o.rise ?? 26);
  if (kind === 'pop') r.scale = 0.86 + 0.14*a;
  if (kind === 'left') r.x = (o.x || 0) - (1 - a)*40;
  if (o.srcRect && cam){                       // a ring around something in the footage
    const [sx, sy, sw, sh] = o.srcRect;
    r.x = cam.view.x + cam.tx + sx*cam.s; r.y = cam.view.y + cam.ty + sy*cam.s; r.w = sw*cam.s; r.h = sh*cam.s;
    if (o.html.includes('{w}')) r.html = o.html.replace(/\{w\}/g, r.w.toFixed(0)).replace(/\{h\}/g, r.h.toFixed(0));
  }
  return r;
}

let uid = 0;
for (const s of edit.shots) (s.overlays || []).forEach(o => o.id = o.id || 'o' + (uid++));
(edit.overlays || []).forEach(o => o.id = o.id || 'g' + (uid++));
(edit.srcOverlays || []).forEach(o => o.id = o.id || 's' + (uid++));
for (const [g, list] of Object.entries(edit.groupOverlays || {})) list.forEach(o => o.id = o.id || 'G' + g + (uid++));

function stateAt(T){
  const active = edit.shots.filter(s => T >= s.start && T < s.start + s.dur + 1e-9);
  const layers = [], overlays = [];
  let topCam = null, topSrc = null;
  active.forEach((s, i) => {
    const u = T - s.start;
    const inA = s.xin ? ease(u/s.xin) : 1;
    const op = (i === 0 ? 1 : inA)*(s.fadeOut ? Math.min(1, ease((s.dur - u)/s.fadeOut)) : 1)*(s.fadeInBlack ? ease(u/s.fadeInBlack) : 1);
    let cam = null;
    if (s.src || s.freeze != null){
      cam = camAt(s, u);
      const f = srcFrame(s, u);
      layers.push({ src: framePath(f), view: cam.view, framed: !!s.framed, s: cam.s, tx: cam.tx, ty: cam.ty, opacity: +op.toFixed(3), filter: s.filter });
      topCam = cam; topSrc = f;
    }
    for (const o of s.overlays || []){
      const d = o.dur ?? (s.dur - (o.at || 0));
      const v = u - (o.at || 0);
      if (v < 0 || v > d) continue;
      overlays.push(placeOverlay(o, alphaOf(o, v, d)*(o.withShot === false ? 1 : op), cam));
    }
  });
  for (const [g, list] of Object.entries(edit.groupOverlays || {})){
    const G = GROUPS[g];
    if (!G || T < G.start || T >= G.end) continue;
    for (const o of list){
      const d = o.dur ?? (G.end - G.start - (o.at || 0)), v = T - G.start - (o.at || 0);
      if (v < 0 || v > d) continue;
      overlays.push(placeOverlay(o, alphaOf(o, v, d), topCam));
    }
  }
  for (const o of edit.overlays || []){
    const t1 = o.t1 < 0 ? TOTAL + o.t1 : o.t1, v = T - o.t0, d = t1 - o.t0;
    if (v < 0 || v > d) continue;
    overlays.push(placeOverlay(o, alphaOf(o, v, d), topCam));
  }
  if (topSrc != null && edit.srcOverlays){
    const shot = active[active.length - 1];
    for (const o of edit.srcOverlays){
      if (shot.noSubs && o.sub) continue;
      if (topSrc < o.f0 || topSrc > o.f1) continue;
      const a = alphaOf(o, (topSrc - o.f0)/FPS, (o.f1 - o.f0)/FPS);
      overlays.push(placeOverlay(o, a, topCam));
    }
  }
  return { layers, overlays };
}

/* ---------- render ---------- */
(async () => {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: OW, height: OH }, deviceScaleFactor: 1 });
  const A = path.join(WORK, 'assets');
  const fontFile = u => path.join(A, 'fonts', u.replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'));
  await page.route('https://**/*', route => {
    const u = route.request().url();
    if (u.startsWith('https://fonts.googleapis.com/css2')) return route.fulfill({ path: path.join(A, u.includes('Looped') ? 'game-fonts.css' : 'overlay-fonts.css'), contentType: 'text/css' });
    if (u.startsWith('https://fonts.gstatic.com/') && fs.existsSync(fontFile(u))) return route.fulfill({ path: fontFile(u), contentType: 'font/woff2' });
    return route.abort();
  });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.join(__dirname, 'studio.html'));
  await page.evaluate(([w, h, c]) => window.setup(w, h, c), [OW, OH, edit.cls || '']);
  await page.evaluate(async () => {        // make sure every face is loaded before the first frame
    const fams = ['Inter', 'IBM Plex Sans Thai', 'IBM Plex Sans Thai Looped', 'STIX Two Text', 'Kanit', 'Sarabun'];
    await Promise.all(fams.flatMap(f => ['400', '500', '600', '700', '800'].map(w => document.fonts.load(`${w} 20px "${f}"`, 'Aaกขฟ'))));
    await Promise.all(['italic 400 20px "STIX Two Text"', 'italic 400 20px "Inter"'].map(f => document.fonts.load(f)));
    await document.fonts.ready;
  });
  const cdp = await page.context().newCDPSession(page);
  const OUT = path.join(WORK, 'out');
  fs.mkdirSync(OUT, { recursive: true });

  // --dump: what is on screen when, as text (for reviewing captions against the footage)
  if (process.argv.includes('--dump')){
    const text = h => h.replace(/<br\s*\/?>/g, ' / ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
    const near = f => { let best = null; for (const [k, v] of Object.entries(marks)) if (v <= f && (!best || v > best[1])) best = [k, v]; return best ? `${best[0]}+${((f - best[1])/FPS).toFixed(1)}s` : 'start'; };
    const lines = [`# ${NAME} — ${TOTAL.toFixed(1)} s`, '', '## Shots', ''];
    edit.shots.forEach((s, i) => lines.push(`- #${i} ${s.start.toFixed(1)}–${(s.start + s.dur).toFixed(1)} s: ` +
      (s.segs ? s.segs.map(g => `src ${g.a}–${g.b} (${near(g.a)} → ${near(g.b)}) ×${g.sp}`).join(', ') : s.freeze != null ? `freeze ${s.freeze}` : 'card')));
    const open = new Map(), spans = [];
    for (let T = 0; T <= TOTAL + 0.05; T += 0.1){
      const now = new Map(stateAt(Math.min(T, TOTAL - 1e-6)).overlays.filter(o => o.opacity > 0.05).map(o => [o.id + '|' + o.html, o]));
      for (const [k, o] of now) if (!open.has(k)) open.set(k, { t0: T, html: o.html });
      for (const [k, v] of open) if (!now.has(k)){ spans.push({ ...v, t1: T }); open.delete(k); }
    }
    for (const v of open.values()) spans.push({ ...v, t1: TOTAL });
    lines.push('', '## On-screen text', '');
    spans.sort((a, b) => a.t0 - b.t0).forEach(v => { const t = text(v.html); if (t) lines.push(`- ${v.t0.toFixed(1)}–${v.t1.toFixed(1)} s: ${t}`); });
    fs.writeFileSync(path.join(OUT, NAME + '.timeline.md'), lines.join('\n') + '\n');
    console.log('wrote ' + path.join(OUT, NAME + '.timeline.md'));
    await browser.close();
    return;
  }
  const stills = arg('still');
  if (stills){
    for (const sec of stills.split(',').map(Number)){
      await page.evaluate(s => window.apply(s), stateAt(sec));
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const f = path.join(OUT, `${NAME}@${sec}.png`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      console.log(f);
    }
    await browser.close();
    return;
  }

  const from = +(arg('from') || 0), to = Math.min(TOTAL, +(arg('to') || TOTAL));
  const silent = path.join(OUT, NAME + '.video.mp4');
  const final = path.join(OUT, NAME + '.mp4');
  if (process.argv.includes('--remix')){        // only redo the sound of an existing render
    await browser.close();
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', final, '-map', '0:v', '-c:v', 'copy', silent]);
    mixMusic(silent, final, TOTAL);
    console.log('remixed ' + final);
    return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(edit.crf || 19), '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', silent],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  const n0 = Math.round(from*FPS), n1 = Math.round(to*FPS);
  const t0 = Date.now();
  for (let i = n0; i < n1; i++){
    await page.evaluate(s => window.apply(s), stateAt(i/FPS));
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - n0) % 450 === 0) process.stdout.write(`  ${NAME} ${(i/FPS).toFixed(0)}/${TOTAL.toFixed(0)} s  (${((Date.now() - t0)/Math.max(1, i - n0)).toFixed(0)} ms/frame)\n`);
  }
  ff.stdin.end(); await done;
  await browser.close();

  mixMusic(silent, final, (n1 - n0)/FPS);
  console.log(`wrote ${final} in ${((Date.now() - t0)/1000).toFixed(0)} s`);
})().catch(e => { console.error(e); process.exit(1); });

// sound: an optional music bed, faded at both ends
function mixMusic(silent, final, dur){
  if (!edit.music){ fs.renameSync(silent, final); return; }
  const mus = path.join(WORK, edit.music.file), vol = edit.music.volume ?? 0.6;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', silent, '-stream_loop', '-1', '-i', mus,
    '-filter_complex', `[1:a]atrim=0:${dur.toFixed(3)},volume=${vol},afade=t=in:d=1.2,afade=t=out:st=${Math.max(0, dur - 2.5).toFixed(3)}:d=2.5[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' });
  fs.unlinkSync(silent);
}
