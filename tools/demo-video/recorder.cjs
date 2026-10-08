/* Frame-by-frame recorder for index.html.
   Opens the game in headless Chromium with a virtual clock (vtime.js), and for every video frame:
   advances the clock by 1/FPS s, reads a little state (dialogue line, title, board…), and grabs a
   screenshot that is piped straight into ffmpeg. Scenario scripts drive it through the helpers below
   (wait, until, move, click, drag, type…); everything that appears on screen is logged with its frame
   number to <out>.json so the editor can place captions exactly. */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const W = 1920, H = 1080;              // the game scales its 1280×720 frame up by 1.5 (crisp canvas)

// what the editor needs to know about each frame (runs in the page)
const STATE_FN = `() => {
  const $ = id => document.getElementById(id);
  const vis = el => el && !el.hidden && el.offsetParent !== null;
  const reading = !$('hist').hidden;
  const dl = reading ? $('hdialog') : $('dialog');
  const txt = reading ? $('htext') : $('dtext');
  const who = (reading ? $('hportrait') : $('portrait')).querySelector('img');
  const ov = $('overlay'), b = $('board');
  return {
    title: (reading ? $('htitle') : $('title')).textContent,
    line: vis(dl) || reading ? txt.innerText.trim() : '',
    who: who ? who.alt : '',
    choices: [...(reading ? $('hchoices') : $('choices')).querySelectorAll('button')].map(b => b.textContent),
    next: !$('next').hidden,
    overlay: ov.hidden ? '' : (ov.querySelector('h1,h2,.bigRed') || ov).textContent.trim().slice(0, 80),
    board: b.hidden ? '' : b.innerText.trim().replace(/\\s+/g, ' ').slice(0, 160),
    panel: !$('panel').hidden,
    rewind: !$('rewind').hidden,
    reading,
    thumb: !!$('thumb')
  };
}`;

class Recorder {
  constructor(o){
    this.fps = o.fps || 30;
    this.out = o.out;                       // e.g. raw/full  -> raw/full.mp4 + raw/full.json
    this.dry = !!o.dry;                     // run the scenario without screenshots (fast check)
    this.assets = o.assets;
    this.frame = 0;
    this.log = [];                          // [{f, k, v}]
    this.marks = [];
    this.prev = {};
    this.cur = { x: 960, y: 640 };
  }

  async start(){
    this.browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-gpu-vsync'] });
    this.ctx = await this.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1,
      locale: 'th-TH', timezoneId: 'Asia/Bangkok', reducedMotion: 'no-preference' });
    const A = this.assets;
    const fontFile = u => path.join(A, 'fonts', u.replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'));
    await this.ctx.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith('file://')) return route.continue();
      if (u.startsWith('https://fonts.googleapis.com/css2')) return route.fulfill({ path: path.join(A, 'game-fonts.css'), contentType: 'text/css' });
      if (u.startsWith('https://fonts.gstatic.com/') && fs.existsSync(fontFile(u)))
        return route.fulfill({ path: fontFile(u), contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' } });
      if (u.includes('mathjax') && u.endsWith('tex-svg.min.js')) return route.fulfill({ path: path.join(A, 'mj/package/es5/tex-svg.js'), contentType: 'text/javascript' });
      // never send demo play to the teacher's Google Sheet
      return route.abort();
    });
    await this.ctx.addInitScript({ path: path.join(__dirname, 'vtime.js') });
    this.page = await this.ctx.newPage();
    this.page.on('pageerror', e => console.error('[pageerror]', e.message));
    this.page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
    await this.page.goto('file://' + path.join(ROOT, 'index.html'));
    await this.page.evaluate(() => document.fonts.ready);
    this.cdp = await this.ctx.newCDPSession(this.page);
    if (!this.dry){
      fs.mkdirSync(path.dirname(this.out), { recursive: true });
      this.ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(this.fps), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', String(this.fps), this.out + '.mp4'],
        { stdio: ['pipe', 'inherit', 'inherit'] });
      this.ffDone = new Promise(r => this.ff.on('close', r));
    }
    await this.page.evaluate(() => window.__vt.cursor(960, 640, false));
    await this.tick(1);
  }

  /* one video frame */
  async tick(n = 1){
    for (let i = 0; i < n; i++){
      const st = await this.page.evaluate(`(async () => { await window.__vt.advance(${1000/this.fps}); return (${STATE_FN})(); })()`);
      this.state = st;
      for (const k of Object.keys(st)){
        const v = JSON.stringify(st[k]);
        if (v !== this.prev[k]){ this.prev[k] = v; this.log.push({ f: this.frame, k, v: st[k] }); }
      }
      if (!this.dry){
        const { data } = await this.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
        const buf = Buffer.from(data, 'base64');
        if (!this.ff.stdin.write(buf)) await new Promise(r => this.ff.stdin.once('drain', r));
      }
      this.frame++;
      if (this.frame % 300 === 0) process.stdout.write(`  frame ${this.frame} (${(this.frame/this.fps).toFixed(0)} s) ${st.title} | ${st.line.slice(0, 50)}\n`);
    }
  }
  wait(sec){ return this.tick(Math.max(1, Math.round(sec*this.fps))); }
  mark(name, extra){ this.marks.push({ f: this.frame, name, ...extra }); }

  /* advance until pred(state) holds */
  async until(pred, timeout = 60, what = ''){
    const max = this.frame + timeout*this.fps;
    while (!pred(this.state || {})){
      if (this.frame > max) throw new Error(`timeout waiting for ${what || pred}; state=${JSON.stringify(this.state)}`);
      await this.tick();
    }
  }
  untilLine(re, timeout = 60){ return this.until(s => re.test(s.line), timeout, 'line ' + re); }
  async untilPage(js, timeout = 60){
    const max = this.frame + timeout*this.fps;
    while (!(await this.page.evaluate(js))){
      if (this.frame > max) throw new Error('timeout waiting for ' + js);
      await this.tick();
    }
  }

  /* fake cursor + real mouse */
  async showCursor(on = true){ await this.page.evaluate(([x, y, s]) => window.__vt.cursor(x, y, s), [this.cur.x, this.cur.y, on]); this.curOn = on; }
  async move(x, y, sec){
    const { x: x0, y: y0 } = this.cur;
    const d = Math.hypot(x - x0, y - y0);
    if (sec == null) sec = Math.min(0.9, Math.max(0.3, d/900));
    const n = Math.max(1, Math.round(sec*this.fps));
    if (!this.curOn) await this.showCursor(true);
    for (let i = 1; i <= n; i++){
      const t = i/n, e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
      const arc = Math.sin(Math.PI*t)*Math.min(40, d*0.08);       // a slight curve, like a hand
      const px = x0 + (x - x0)*e, py = y0 + (y - y0)*e - arc;
      await this.page.mouse.move(px, py);
      await this.page.evaluate(([a, b]) => window.__vt.cursor(a, b, true), [px, py]);
      this.cur = { x: px, y: py };
      await this.tick();
    }
    this.cur = { x, y };
  }
  async click(x, y, o = {}){
    if (x != null) await this.move(x, y, o.sec);
    await this.wait(o.pause ?? 0.12);
    await this.page.evaluate(() => window.__vt.press());
    await this.page.mouse.down();
    await this.tick(2);
    await this.page.mouse.up();
    await this.tick(o.after ?? 3);
  }
  async box(sel){
    const r = await this.page.evaluate(s => {
      const els = [...document.querySelectorAll(s)].filter(e => e.offsetParent !== null);
      const e = els[0]; if (!e) return null;
      const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height };
    }, sel);
    if (!r) throw new Error('no visible element ' + sel);
    return r;
  }
  async clickSel(sel, o = {}){
    const b = await this.box(sel);
    await this.click(b.x + b.w*(o.fx ?? 0.5), b.y + b.h*(o.fy ?? 0.5), o);
  }
  async clickText(sel, text, o = {}){
    const r = await this.page.evaluate(([s, t]) => {
      const e = [...document.querySelectorAll(s)].find(e => e.offsetParent !== null && e.textContent.includes(t));
      if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width/2, y: b.top + b.height/2 };
    }, [sel, text]);
    if (!r) throw new Error(`no ${sel} with text ${text}`);
    await this.click(r.x, r.y, o);
  }
  /* drag a range slider (#r_<k>) to a value, then nudge with the arrow keys until exact */
  async slide(k, value, sec = 0.9){
    const info = await this.page.evaluate(k => {
      const r = document.getElementById('r_' + k), b = r.getBoundingClientRect(), sc = b.width/r.offsetWidth;
      const th = r.closest('.panel').classList.contains('multi') ? 22 : 30;
      return { x: b.left, y: b.top + b.height/2, w: b.width, th: th*sc, min: +r.min, max: +r.max, step: +r.step, v: +r.value };
    }, k);
    const TH = info.th;
    const pos = v => info.x + TH/2 + (v - info.min)/(info.max - info.min)*(info.w - TH);
    await this.move(pos(info.v), info.y);
    await this.wait(0.1);
    await this.page.evaluate(() => window.__vt.press());
    await this.page.mouse.down();
    const n = Math.round(sec*this.fps), x0 = pos(info.v), x1 = pos(value);
    for (let i = 1; i <= n; i++){
      const t = i/n, e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2, px = x0 + (x1 - x0)*e;
      await this.page.mouse.move(px, info.y);
      await this.page.evaluate(([a, b]) => window.__vt.cursor(a, b, true), [px, info.y]);
      this.cur = { x: px, y: info.y };
      await this.tick();
    }
    await this.page.mouse.up();
    await this.tick(2);
    for (let i = 0; i < 40; i++){
      const v = await this.page.evaluate(k => +document.getElementById('r_' + k).value, k);
      if (Math.abs(v - value) < info.step/2) break;
      await this.page.keyboard.press(v < value ? 'ArrowRight' : 'ArrowLeft');
      await this.tick(2);
    }
  }
  /* type an exact number into the box next to a slider */
  async typeNum(k, text){
    await this.clickSel('#n_' + k);
    await this.page.keyboard.press('ControlOrMeta+A');   // select all: Ctrl on Linux, ⌘ on macOS
    await this.tick(3);
    for (const ch of String(text)){ await this.page.keyboard.type(ch); await this.tick(4); }
    await this.page.keyboard.press('Tab');
    await this.tick(3);
  }
  async type(text, perChar = 3){
    for (const ch of text){ await this.page.keyboard.type(ch); await this.tick(perChar); }
  }

  async finish(){
    fs.mkdirSync(path.dirname(this.out), { recursive: true });
    fs.writeFileSync(this.out + '.json', JSON.stringify({ fps: this.fps, frames: this.frame, marks: this.marks, log: this.log }, null, 1));
    if (this.ff){ this.ff.stdin.end(); await this.ffDone; }
    await this.browser.close();
  }
}

module.exports = { Recorder };
