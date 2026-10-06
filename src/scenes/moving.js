import { COL } from '../config.js';
import { ctx } from '../stage.js';
import { text, velArrow, bubble } from '../draw/primitives.js';
import { drawFloor, drawCart, drawRyuka, drawLegend } from '../draw/props.js';

/* Lesson: cart(?) still sliding — the floor scrolls so the motion is visible */
export function Moving(vel){
  return {
    view:{ ox:0, gy:470, s:110 }, v:vel, scroll:0, bubble:null, sad:false, cx:640,
    update(dt){ this.scroll += this.v*dt; },
    draw(){
      const v = this.view;
      drawFloor(v, { scroll:this.scroll });
      // speed streaks
      ctx.strokeStyle = 'rgba(61,123,116,.35)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++){
        const y = v.gy - 20 - i*24, off = (this.scroll*110*1.7 + i*40) % 60;
        ctx.beginPath(); ctx.moveTo(this.cx - 70 - off, y); ctx.lineTo(this.cx - 120 - off, y); ctx.stroke();
      }
      drawCart(this.cx, v.gy, v.s);
      drawRyuka(this.cx, v.gy - 0.7*v.s, v.s, { sad:this.sad });
      const len = Math.min(220, this.v*40), vy = v.gy - 0.35*v.s;
      velArrow(this.cx, vy, this.cx + len, vy);
      drawLegend();
      text('ยังขยับอยู่ >>', this.cx - 75, v.gy - 0.7*v.s - 70, { size:26, align:'right' });
      text(`v = ${this.v.toFixed(2)} m/s (คงที่)`, this.cx, v.gy + 56, { size:19, align:'center', color:COL.muted });
      if (this.bubble) bubble(this.bubble, this.cx + 40, v.gy - 0.7*v.s - 145, { size:26, align:'center' });
    }
  };
}
