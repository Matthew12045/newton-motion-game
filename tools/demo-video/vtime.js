/* Injected before the game loads (page.addInitScript). Replaces the page's clock with a virtual one so
   the recorder can step the game one video frame at a time: performance.now / Date, setTimeout /
   setInterval, requestAnimationFrame and every CSS animation or transition (via the Web Animations
   API) all follow window.__vt instead of the wall clock. The result is a perfectly smooth recording
   no matter how slowly the frames are captured. Also draws a fake mouse cursor for the video. */
(() => {
  let vt = 0;
  const EPOCH = Date.parse('2026-10-08T09:00:00+07:00');
  const RealDate = Date;
  class VDate extends RealDate {
    constructor(...a){ if (a.length === 0) super(EPOCH + vt); else super(...a); }
    static now(){ return EPOCH + vt; }
  }
  window.Date = VDate;
  performance.now = () => vt;

  // a real macrotask, to let every promise chain started by a callback settle before the next one
  const ch = new MessageChannel(), q = [];
  ch.port1.onmessage = () => { const r = q.shift(); r && r(); };
  const yieldTask = () => new Promise(r => { q.push(r); ch.port2.postMessage(0); });

  let nextId = 1;
  const timers = new Map();
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = nextId++;
    timers.set(id, { at: vt + Math.max(0, +ms || 0), seq: id, fn, args, every: 0 });
    return id;
  };
  window.setInterval = (fn, ms = 0, ...args) => {
    const id = nextId++, every = Math.max(1, +ms || 0);
    timers.set(id, { at: vt + every, seq: id, fn, args, every });
    return id;
  };
  window.clearTimeout = window.clearInterval = id => { timers.delete(id); };
  let rafs = new Map(), rafId = 1;
  window.requestAnimationFrame = fn => { const id = rafId++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = id => { rafs.delete(id); };

  const started = new WeakMap();           // animation -> virtual start time
  function syncAnims(){
    for (const a of document.getAnimations()){
      if (a.playState === 'finished') continue;
      let s = started.get(a);
      if (s == null){ s = vt; started.set(a, s); a.pause(); }
      const t = vt - s, end = a.effect && a.effect.getComputedTiming().endTime;
      if (isFinite(end) && t >= end){ a.currentTime = end; a.finish(); }
      else a.currentTime = Math.max(0, t);
    }
  }

  const call = (fn, args) => { try { typeof fn === 'function' ? fn(...args) : (0, eval)(fn); } catch (e){ console.error(e); } };
  async function advance(ms){
    const target = vt + ms;
    for (let guard = 0; guard < 5000; guard++){
      let best = null;
      for (const [id, t] of timers) if (t.at <= target && (!best || t.at < best[1].at || (t.at === best[1].at && t.seq < best[1].seq))) best = [id, t];
      if (!best) break;
      const [id, t] = best;
      vt = Math.max(vt, t.at);
      if (t.every){ t.at += t.every; t.seq = nextId++; } else timers.delete(id);
      call(t.fn, t.args);
      await yieldTask();
    }
    vt = target;
    const due = rafs; rafs = new Map();
    for (const fn of due.values()) call(fn, [vt]);
    await yieldTask();
    syncAnims();
    cursor.render();
  }

  /* ---- the fake cursor (headless Chrome draws none) ---- */
  const cursor = {
    x: 960, y: 640, shown: false, downAt: -1e9, el: null, ring: null,
    ensure(){
      if (this.el || !document.body) return;
      const st = document.createElement('style');
      st.textContent = `#__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:40px;height:40px;
          filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transform-origin:5px 3px}
        #__ring{position:fixed;z-index:2147483646;pointer-events:none;border-radius:50%;border:3px solid rgba(255,159,58,.95);
          background:rgba(255,213,79,.25);width:0;height:0}`;
      document.head.append(st);
      this.ring = document.createElement('div'); this.ring.id = '__ring';
      this.el = document.createElement('div'); this.el.id = '__cur';
      this.el.innerHTML = `<svg viewBox="0 0 24 24" width="40" height="40"><path d="M3 2 L3 19.5 L7.6 15.3 L10.6 22 L13.6 20.7 L10.7 14.1 L17 14.1 Z"
        fill="#fff" stroke="#15181c" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      document.body.append(this.ring, this.el);
    },
    render(){
      this.ensure();
      if (!this.el) return;
      this.el.style.display = this.ring.style.display = this.shown ? '' : 'none';
      const k = Math.min(1, (vt - this.downAt)/140), press = 1 - 0.18*Math.sin(Math.PI*Math.min(1, k));
      this.el.style.transform = `translate(${this.x - 5}px,${this.y - 3}px) scale(${press})`;
      const r = (vt - this.downAt)/450;
      if (r >= 0 && r < 1){
        const d = 20 + 66*r;
        Object.assign(this.ring.style, { display: this.shown ? '' : 'none', left: (this.x - d/2) + 'px', top: (this.y - d/2) + 'px',
          width: d + 'px', height: d + 'px', opacity: String(1 - r) });
      } else this.ring.style.display = 'none';
    }
  };

  window.__vt = {
    advance,
    now: () => vt,
    cursor(x, y, shown = true){ cursor.x = x; cursor.y = y; cursor.shown = shown; cursor.render(); },
    press(){ cursor.downAt = vt; cursor.render(); }
  };
})();
