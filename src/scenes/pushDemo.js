import { COL } from '../config.js';
import { $ } from '../dom.js';
import { arrow, text, P, velArrow } from '../draw/primitives.js';
import { drawFloor, drawCart, drawRyuka, drawLegend } from '../draw/props.js';

/* Lesson: push → let go, looping, with the board rows lit by phase */
export function PushDemo(F){
  const a = F/40;
  const tp = Math.sqrt(2*0.8/a), tc = Math.min(2.2, 3.2/(a*tp)), tw = 0.8;
  return {
    view:{ ox:120, gy:470, s:110 }, t:0, x:0, v:0, ph:'push',
    update(dt){
      this.t += dt;
      if (this.t < tp){ this.ph = 'push'; this.v = a*this.t; this.x = 0.5*a*this.t*this.t; }
      else if (this.t < tp + tc){ this.ph = 'coast'; this.v = a*tp; this.x = 0.5*a*tp*tp + this.v*(this.t - tp); }
      else if (this.t < tp + tc + tw){ this.ph = 'wait'; }
      else { this.t = 0; }
      const r1 = $('rowPush'), r2 = $('rowCoast');
      if (r1){ r1.classList.toggle('on', this.ph === 'push'); r2.classList.toggle('on', this.ph === 'coast'); }
    },
    draw(){
      const v = this.view, cx = P(v, 0.4 + this.x);
      drawFloor(v, {});
      drawCart(cx, v.gy, v.s);
      drawRyuka(cx, v.gy - 0.7*v.s, v.s, { sad:true });
      if (this.ph === 'push') arrow(cx - 0.4*v.s - 110, v.gy - 0.35*v.s, cx - 0.4*v.s - 6, v.gy - 0.35*v.s, COL.red, 12, 26);
      if (this.v > 0.005) velArrow(cx, v.gy - 0.35*v.s, cx + Math.min(220, this.v*40), v.gy - 0.35*v.s);
      drawLegend();
      text(this.ph === 'push' ? 'กำลังผลัก' : this.ph === 'coast' ? 'มือหลุดแล้ว' : '',
           70, 120, { size:24 });
      text(`v = ${this.v.toFixed(2)} m/s`, 70, 152, { size:20, color:COL.muted });
    }
  };
}
