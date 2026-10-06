import { W, G, COL } from '../config.js';
import { memo, pval } from '../state.js';
import { ctx } from '../stage.js';
import { emit } from '../events.js';
import { arrow, gradArrow, text, P, Y, dimLine, velArrow, bubble } from '../draw/primitives.js';
import { drawFloor, drawFlag, drawCart, drawRyuka, fbd, drawLegend } from '../draw/props.js';

/* =========================================================
   Scene: Level 1 — push the cart(?) to the flag, on ice (μ = 0) or a rough floor
   Motion is computed analytically per phase so the numbers match the lesson exactly.
   ========================================================= */
export function Level1(){
  const S = {
    view:{ ox:110, gy:470, s:110 }, m:40, mu:0, F:100, x0:0.6, pushEnd:1.4, targetX:4.6, flagX:5.9, tol:0.25,
    showMass:false, live:false, timeScale:1,
    f(){ return this.mu*this.m*G; },
    reset(){
      this.cart = { x:this.x0, v:0, a:0 };
      this.ry = { x:-0.25, y:0 };
      this.phase = 'ready'; this.t = 0; this.hist = [{ t:0, v:0 }]; this.bubble = null; this.flags = {};
      this.timeScale = 1; this.stop = null;
    },
    start(p){
      this.reset();
      this.F = p.F;
      if (p.m != null) this.m = p.m;
      if (p.mu != null) this.mu = p.mu;
      this.phase = 'hop'; this.hopT = 0;
      // Speed up very slow runs (push barely beats friction) so nobody waits 20 s.
      const f = this.f(), net = this.F - f;
      this.warp = 1;
      if (net > 0){
        const a1 = net/this.m, tp = Math.sqrt(2*(this.pushEnd - this.x0)/a1), v1 = a1*tp;
        const tc = f > 0 ? v1/(f/this.m) : 0;
        this.warp = Math.max(1, (tp + Math.min(tc, 12))/7);
      }
    },
    rewind(){ this.rw = { t:0, from:Math.min(this.cart.x, 9.5) }; this.phase = 'rewind'; this.timeScale = 1; },
    onParam(p){
      if (this.phase === 'stopped' || this.phase === 'idle') this.reset();
      if (this.live && this.phase === 'ready'){ this.m = p.m; this.mu = p.mu; }
    },
    update(dt){
      const c = this.cart, r = this.ry, f = this.f();
      if (this.phase === 'ready' && this.live){ this.m = pval.m; this.mu = pval.mu; }
      if (this.phase === 'rewind'){
        this.rw.t += dt; const k = Math.min(1, this.rw.t/1.1), e = 1 - (1-k)**3;
        c.x = this.rw.from + (this.x0 - this.rw.from)*e; r.x = c.x; r.y = 0.7;
        if (k >= 1){ this.reset(); emit('rewound'); }
        return;
      }
      if (this.phase === 'hop'){
        this.hopT += dt; const k = Math.min(1, this.hopT/0.5);
        r.x = -0.25 + (c.x + 0.25)*k; r.y = 0.7*k + Math.sin(k*Math.PI)*0.55;
        if (k >= 1){
          this.t = 0; this.idleT = 0;
          if (this.F > 0 && this.F > f){ this.phase = 'push'; this.timeScale = this.warp; }
          else this.phase = 'idle';            // static friction (or nothing) holds it: ΣF = 0
        }
        return;
      }
      if (this.phase === 'idle'){
        this.idleT += dt;
        if (this.idleT > 1.1 && !this.flags.nomove){ this.flags.nomove = 1; emit('nomove'); }
        return;
      }
      if (this.phase === 'push' || this.phase === 'coast'){
        this.t += dt;
        if (this.phase === 'push'){
          c.a = (this.F - f)/this.m;
          c.v = c.a*this.t; c.x = this.x0 + 0.5*c.a*this.t*this.t;
          if (c.x >= this.pushEnd){                       // exact hand-off: v² = 2ad
            const d = this.pushEnd - this.x0;
            c.x = this.pushEnd; c.v = Math.sqrt(2*c.a*d);
            this.v1 = c.v; this.tRel = this.t = Math.sqrt(2*d/c.a);
            if (this.mu === 0){ memo.F = this.F; memo.v1 = c.v; }
            this.phase = 'coast'; emit('pushEnd');
          }
        } else {
          const tc = this.t - this.tRel, dec = f/this.m;
          if (dec > 0 && tc >= this.v1/dec){              // friction brings it to rest: s = v²/2a
            c.v = 0; c.a = 0; c.x = this.pushEnd + this.v1*this.v1/(2*dec); this.t = this.tRel + this.v1/dec;
            this.phase = 'stopped'; this.timeScale = 1;
            this.hist.push({ t:this.tRel + this.v1/dec, v:0 });
            const err = c.x - this.targetX;
            this.stop = { x:c.x, err, ok:Math.abs(err) <= this.tol };
            emit('stopped', this.stop);
          } else {
            c.a = -dec; c.v = this.v1 - dec*tc; c.x = this.pushEnd + this.v1*tc - 0.5*dec*tc*tc;
          }
        }
        r.x = c.x; r.y = 0.7;
        if (this.mu === 0 && c.x > this.targetX + this.tol && !this.flags.over){ this.flags.over = 1; this.bubble = 'บ๊ายบาย~'; }   // sailing past the spot
        if (c.x - 0.4 > this.flagX && !this.flags.pass){ this.flags.pass = 1; emit('passFlag'); }
        if (c.x > 8.9 && this.phase !== 'stopped' && !this.flags.gone){ this.flags.gone = 1; emit('gone'); }
        if (this.phase !== 'stopped' && this.t - this.hist[this.hist.length-1].t > 0.05 && this.t < 60) this.hist.push({ t:this.t, v:c.v });
      }
    },
    readout(){
      const c = this.cart, f = this.f();
      let net = 0;
      if (this.phase === 'push') net = this.F - f;
      else if (this.phase === 'coast') net = -f;
      const moved = this.phase === 'push' || this.phase === 'coast' || this.phase === 'stopped';
      return [ net.toFixed(1), (net/this.m).toFixed(2), c.v.toFixed(2), moved ? (c.x - this.x0).toFixed(2) : '0.00', moved ? this.t.toFixed(2) : '0.00' ];
    },
    draw(){
      const v = this.view, c = this.cart, r = this.ry, s = v.s, f = this.f(), rough = this.mu > 0;
      drawFloor(v, { rough, label: rough ? `พื้นฝืด μ = ${this.mu.toFixed(2)}` : 'ลานน้ำแข็ง' });
      // the hand only pushes over this short stretch
      ctx.fillStyle = 'rgba(255,159,58,.28)';
      ctx.fillRect(P(v, this.x0), v.gy + 1, (this.pushEnd - this.x0)*s, 29);
      text('ช่วงผลัก', P(v, (this.x0 + this.pushEnd)/2), v.gy + 20, { size:13, align:'center', color:'#8a4d00' });
      // parking spot in front of the flag
      ctx.fillStyle = 'rgba(46,139,87,.25)';
      ctx.fillRect(P(v, this.targetX - this.tol), v.gy + 1, this.tol*2*s, 29);
      if (c.x < this.targetX - 0.05 && this.phase !== 'rewind')
        dimLine(P(v, c.x), v.gy + 40, P(v, this.targetX), v.gy + 40, `ระยะถึงจุดจอด ${(this.targetX - c.x).toFixed(1)} m`);
      drawFlag(P(v, this.flagX), v.gy, s);
      drawCart(P(v, c.x), v.gy, s, this.showMass ? `${this.m} kg` : null);
      drawRyuka(P(v, r.x), Y(v, r.y), s, { sad: this.mu === 0 && this.flags.over });
      if (this.phase === 'ready') fbd(P(v, c.x), 150, { f:rough });
      const back = P(v, c.x - 0.4);
      const pushing = this.phase === 'push' || (this.phase === 'idle' && this.F > 0);
      if (pushing){
        const len = 30 + Math.min(this.F, 160)*0.9;
        gradArrow(back - len - 6, Y(v, 0.35), back - 4);
        text(`F = ${this.F} N`, back - len/2 - 6, Y(v, 0.35) - 18, { size:18, align:'center', math:true, italic:false });
      }
      // friction acts along the floor, opposite to the sliding (static: just enough to cancel the push)
      const fNow = this.phase === 'push' || this.phase === 'coast' ? f
                 : this.phase === 'idle' && this.F > 0 ? Math.min(this.F, f) : 0;
      if (rough && fNow > 0){
        const len = 24 + Math.min(fNow, 160)*0.9, fx = P(v, c.x);
        arrow(fx, v.gy - 7, fx - len, v.gy - 7, COL.fric, 7, 16);
        text(`f = ${fNow.toFixed(1)} N`, P(v, c.x - 0.4) - 6, v.gy - 14, { size:16, align:'right', color:COL.fric, math:true, italic:false });
      }
      if (c.v > 0.005 && P(v, c.x) < 720){                 // velocity: thin blue arrow from the middle of the box (gone before its label reaches the panel)
        const fx = P(v, c.x), len = Math.min(220, c.v*40), vy = Y(v, 0.35);
        velArrow(fx, vy, fx + len, vy);
        text(`v = ${c.v.toFixed(2)} m/s`, Math.max(fx + len, P(v, c.x + 0.4)) + 6, vy + 5, { size:15, color:COL.vel, math:true, italic:false });
      }
      drawLegend();
      // the bubble travels with Ryuka: behind the panel, out the other side, until she leaves the stage
      if (this.bubble && P(v, r.x) - 50 < W) bubble(this.bubble, P(v, r.x) - 30, Y(v, r.y + 1.35), { size:26 });
      if (this.timeScale > 1) text(`เร่งเวลา ×${this.timeScale.toFixed(1)}`, 24, 108, { size:17, color:COL.muted });
    }
  };
  S.reset();
  return S;
}
