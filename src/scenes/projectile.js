import { G, COL } from '../config.js';
import { ctx } from '../stage.js';
import { emit } from '../events.js';
import { rr, arrow, text, P, Y, dimLine, velArrow, subLabel, bubble } from '../draw/primitives.js';
import { drawFloor, drawFlag, drawCart, drawRyuka, drawLegend } from '../draw/props.js';

/* =========================================================
   Scene: Bonus — the cart(?) is stopped, Ryuka isn't → projectile
   ========================================================= */
export function Projectile(){
  const S = {
    view:{ ox:40, gy:450, s:110 }, edge:1.8, hLaunch:1.9, flagX:4.8, tol:0.25, v:3,
    stopper:false, stopperDrop:1, showGuides:false, showPair:false, timeScale:1,
    reset(){
      this.phase = 'ready'; this.cart = { x:0.2 }; this.ry = { x:0.2, y:1.9, rot:0 };
      this.dots = []; this.ft = 0; this.land = null; this.bubble = null; this.pairT = 9; this.flags = {}; this.timeScale = 1;
    },
    tFlight(){ return Math.sqrt(2*this.hLaunch/G); },
    readoutNote(){ return this.phase === 'ready' && this.v > 0 ? 'ค่าที่คาดว่าจะได้ตอนตกถึงพื้น' : null; },
    start(v){
      const prev = this.dots.length ? this.dots : this.ghost;
      this.reset(); this.ghost = prev;
      this.v = v; this.phase = v > 0 ? 'roll' : 'still'; this.stillT = 0;
    },
    onParam(p){
      if (this.phase === 'landed' || this.phase === 'still'){ if (this.dots.length) this.ghost = this.dots; this.reset(); }
      if (this.phase === 'ready') this.v = p.v;
    },
    dropStopper(){ this.stopper = true; this.stopperDrop = 0; },
    rewind(){ this.reset(); this.phase = 'rewind'; this.rwT = 0; this.rwFrom = 9.5; },
    pos(t){ return { x:this.edge + this.v*t, y:this.hLaunch - 0.5*G*t*t }; },
    update(dt){
      if (this.stopperDrop < 1) this.stopperDrop = Math.min(1, this.stopperDrop + dt/0.45);
      const c = this.cart, r = this.ry;
      switch (this.phase){
        case 'rewind': {
          this.rwT += dt; const k = Math.min(1, this.rwT/1.2), e = 1 - (1-k)**3;
          c.x = this.rwFrom + (0.2 - this.rwFrom)*e; r.x = c.x; r.y = 1.9;
          if (k >= 1){ this.phase = 'ready'; emit('rewound'); }
          break;
        }
        case 'still':
          this.stillT += dt;
          if (this.stillT > 0.9 && !this.flags.still){ this.flags.still = 1; emit('still'); }
          break;
        case 'roll':
          c.x += this.v*dt; r.x = c.x;
          if (c.x + 0.4 >= this.edge){
            const over = c.x + 0.4 - this.edge;
            c.x = this.edge - 0.4; r.x = c.x + over;
            this.phase = 'slide'; this.pairT = 0; this.timeScale = 0.35; emit('impact');
          }
          break;
        case 'slide':                              // cart stopped; Ryuka keeps going (inertia, slippery seat)
          this.pairT += dt; r.x += this.v*dt;
          if (r.x >= this.edge){ this.phase = 'fly'; this.ft = (r.x - this.edge)/this.v; this.nextDot = 0; }
          break;
        case 'fly': {
          this.pairT += dt; this.ft += dt;
          const tl = this.tFlight();
          while (this.nextDot <= Math.min(this.ft, tl) + 1e-9){ this.dots.push(this.pos(this.nextDot)); this.nextDot += 0.05; }
          const t = Math.min(this.ft, tl), p = this.pos(t);
          r.x = p.x; r.y = p.y; r.rot = Math.min(0.55, t*1.3);
          if (this.ft >= tl){
            this.ft = tl;
            const err = p.x - this.flagX, ok = Math.abs(err) <= this.tol;
            this.land = { x:p.x, err, ok };
            r.y = ok ? 0.16 : 0; r.rot = ok ? 0 : Math.PI/2;
            this.bubble = ok ? 'รอดแล้ว~' : 'โอ๊ย…';
            this.phase = 'landed'; this.timeScale = 1;
            emit('landed', this.land);
          }
          break;
        }
      }
    },
    readout(){
      // t: since the cart is released · t_air: since Ryuka leaves the edge
      // x: measured from the platform edge (x = 0 where the flight starts, flag at x = D); negative on the platform
      if (this.phase === 'rewind') return [null, null, null, null, null, null];
      const x0 = 0.2, roll = this.edge - x0;
      if (this.phase === 'ready' && this.v > 0){            // while the slider moves: predicted values at touchdown
        const tl = this.tFlight();
        return [ (roll/this.v + tl).toFixed(2), tl.toFixed(2), (this.v*tl).toFixed(2),
                 this.hLaunch.toFixed(2), this.v.toFixed(2), (-G*tl).toFixed(2) ];
      }
      const inAir = this.phase === 'fly' || this.phase === 'landed';
      const ft = inAir ? this.ft : 0;
      const moving = this.phase !== 'ready' && this.phase !== 'still';
      const T = !moving ? 0 : inAir ? roll/this.v + ft : (this.ry.x - x0)/this.v;
      const X = (moving ? this.ry.x : x0) - this.edge;
      const vx = this.phase === 'still' ? 0 : this.v;
      return [ T.toFixed(2), ft.toFixed(2), X.toFixed(2), (0.5*G*ft*ft).toFixed(2), vx.toFixed(2), (ft ? -G*ft : 0).toFixed(2) ];
    },
    draw(){
      const v = this.view, s = v.s, c = this.cart, r = this.ry;
      drawFloor(v, { ticks:{ from:-1, to:this.ticksTo || 5, zero:this.edge } });
      // ice platform
      const px0 = P(v, -0.8), px1 = P(v, this.edge + 0.12), top = Y(v, 1.2);
      ctx.fillStyle = '#D6E8EE'; ctx.fillRect(px0, top, px1 - px0, v.gy - top);
      ctx.strokeStyle = COL.iceLine; ctx.lineWidth = 2; ctx.strokeRect(px0, top, px1 - px0, v.gy - top);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px0 + 20, top + 10); ctx.lineTo(px1 - 30, top + 10); ctx.stroke();
      text('แท่นน้ำแข็ง สูง 1.2 m', (px0 + px1)/2 - 10, top + 70, { size:16, align:'center', color:COL.muted });
      // stopper
      if (this.stopper){
        const drop = (1 - this.stopperDrop)*3.2;
        const sx = P(v, this.edge), sy = Y(v, 1.2 + 0.45 + drop);
        ctx.fillStyle = '#2b2f36'; rr(sx, sy, 0.12*s, 0.45*s, 4); ctx.fill();
        if (this.stopperDrop >= 1 && this.phase === 'ready') text('ที่กั้น', sx + 0.06*s, sy - 8, { size:15, align:'center', color:COL.muted });
      }
      // dimensions h and D
      const hx = P(v, this.edge + 0.32);
      if (!this.showPair){                                   // hidden while the impact-force pair is explained
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#b5bcc6'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(P(v, this.edge), Y(v, this.hLaunch)); ctx.lineTo(hx + 8, Y(v, this.hLaunch)); ctx.stroke();
      ctx.setLineDash([]);
      dimLine(hx, v.gy, hx, Y(v, this.hLaunch), '', { color:COL.muted });
      if (!this.showGuides && !['fly', 'landed'].includes(this.phase)) text('h = 1.9 m', hx + 10, Y(v, 0.55), { size:18, math:true, italic:false, color:COL.muted });
      }
      dimLine(P(v, this.edge), v.gy + 42, P(v, this.flagX), v.gy + 42, 'D = 3.0 m', { color:COL.muted });
      // flag + cushion
      drawFlag(P(v, this.flagX), v.gy, s);
      ctx.fillStyle = '#F6C76A'; rr(P(v, this.flagX - 0.3), v.gy - 0.16*s, 0.6*s, 0.16*s, 8); ctx.fill();
      // strobe dots (every 0.05 s)
      if (this.showGuides && this.dots.length){
        ctx.setLineDash([4, 5]); ctx.strokeStyle = '#b5bcc6'; ctx.lineWidth = 1.2;
        this.dots.forEach(d => {
          ctx.beginPath(); ctx.moveTo(P(v, d.x), Y(v, d.y)); ctx.lineTo(P(v, d.x), v.gy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(P(v, d.x), Y(v, d.y)); ctx.lineTo(P(v, this.edge), Y(v, d.y)); ctx.stroke();
        });
        ctx.setLineDash([]);
      }
      if (this.ghost && this.ghost.length){                  // previous try, for comparison
        ctx.fillStyle = '#C9D1DC';
        this.ghost.forEach(d => { ctx.beginPath(); ctx.arc(P(v, d.x), Y(v, d.y), 3, 0, 7); ctx.fill(); });
      }
      ctx.fillStyle = COL.dot;
      this.dots.forEach(d => { ctx.beginPath(); ctx.arc(P(v, d.x), Y(v, d.y), 4, 0, 7); ctx.fill(); });
      // cart + Ryuka
      drawCart(P(v, c.x), Y(v, 1.2), s);
      drawRyuka(P(v, r.x), Y(v, r.y), s, { rot:r.rot, lie:this.land && !this.land.ok, sad:this.phase === 'fly' || (this.land && !this.land.ok) });
      // 3rd-law pair at the impact
      if ((this.pairT < 0.22 && (this.phase === 'slide' || this.phase === 'fly')) || this.showPair){
        const ix = P(v, this.edge), iy = Y(v, 1.2 + 0.2);
        arrow(ix + 4, iy - 10, ix + 70, iy - 10, COL.red, 7, 16);
        arrow(ix - 4, iy + 12, ix - 70, iy + 12, COL.red, 7, 16);
        text('รถดันที่กั้น', ix + 22, iy + 16, { size:14 });
        text('ที่กั้นดันรถ', ix - 40, iy + 50, { size:14, align:'center' });
      }
      // velocity of Ryuka (14 px per m/s); in flight split into vx (constant) and vy (growing)
      // arrows start at Ryuka's belt (0.46 m above the feet), following the sprite's tilt in flight
      const K = 10, belt = 0.14*s, rot = r.rot || 0;
      const cx = P(v, r.x) - belt*Math.sin(rot), cy = Y(v, r.y) - 0.6*s + belt*Math.cos(rot);
      if (this.phase === 'ready' || this.phase === 'roll' || this.phase === 'slide'){
        if (this.v > 0){
          velArrow(cx, cy, cx + this.v*K, cy);
          text(`v = ${this.v.toFixed(1)} m/s`, Math.max(cx + this.v*K, cx + 46) + 8, cy + 6, { size:17, color:COL.vel, math:true, italic:false });
        }
      }
      if (this.phase === 'fly'){
        const vy = G*Math.min(this.ft, this.tFlight());
        arrow(cx - 26, cy, cx - 26, cy + 70, COL.red, 7, 16);
        if (cx - 60 > P(v, this.edge) + 16 && cy + 92 < v.gy - 6) text('mg', cx - 26, cy + 92, { math:true, size:20, align:'center' });   // under its arrow, not over the cart
        velArrow(cx, cy, cx + this.v*K, cy, COL.velLight, 3, 11);
        velArrow(cx, cy, cx, cy + vy*K, COL.velLight, 3, 11);
        velArrow(cx, cy, cx + this.v*K, cy + vy*K);
        const lx = Math.max(cx + this.v*K, cx + 46) + 6, floorY = v.gy - 6;
        if (vy*K > 14) subLabel('v', 'x', lx, cy - 6, { size:18, color:'#5B7FD0' });   // once it splits from v
        if (vy*K > 40 && cy + vy*K + 4 < floorY) subLabel('v', 'y', cx + 6, cy + vy*K + 4, { size:18, color:'#5B7FD0' });
        const ry = cy + Math.max(vy*K, 20) + 20;
        if (ry < floorY) subLabel('v', '', lx + 2, ry, { size:20 });
      }
      drawLegend();
      if (this.land){
        const lx = P(v, this.land.x);
        ctx.fillStyle = this.land.ok ? '#2E8B57' : COL.red;
        ctx.beginPath(); ctx.moveTo(lx, v.gy + 4); ctx.lineTo(lx - 8, v.gy + 18); ctx.lineTo(lx + 8, v.gy + 18); ctx.fill();
      }
      if (this.bubble){
        if (this.land && !this.land.ok){
          if (this.land.x > this.flagX) bubble(this.bubble, P(v, r.x + 0.7), Y(v, 0.45));
          else bubble(this.bubble, P(v, r.x), Y(v, 1.15), { align:'center' });
        } else bubble(this.bubble, P(v, r.x), Y(v, 2.05), { align:'center' });
      }
      if (this.timeScale < 1) text('สโลว์โมชัน ×0.35', 24, 108, { size:17, color:COL.muted });
    }
  };
  S.reset();
  return S;
}
