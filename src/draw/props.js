import { W, COL } from '../config.js';
import { IMG } from '../assets.js';
import { ctx } from '../stage.js';
import { rr, arrow, text, P, velArrow } from './primitives.js';

export function drawFloor(v, o = {}){
  const gy = v.gy;
  const sc = (o.scroll || 0) * v.s;
  if (o.rough){
    ctx.fillStyle = COL.rough; ctx.fillRect(0, gy, W, 30);
    ctx.strokeStyle = COL.roughLine; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    ctx.fillStyle = COL.roughLine;
    for (let i = 0; i < 240; i++){
      const x = ((i*61.3 - sc) % W + W) % W, y = gy + 4 + (i*37 % 23);
      ctx.fillRect(x, y, 2.4, 2.4);
    }
  } else {
    ctx.fillStyle = COL.ice; ctx.fillRect(0, gy, W, 30);
    ctx.strokeStyle = COL.iceLine; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    // glints on the ice
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
    for (let i = -1; i < 16; i++){
      const x = ((i*97 - sc) % (16*97) + 16*97) % (16*97) - 60;
      ctx.beginPath(); ctx.moveTo(x, gy+9); ctx.lineTo(x+26, gy+9); ctx.moveTo(x+38, gy+19); ctx.lineTo(x+50, gy+19); ctx.stroke();
    }
  }
  if (o.ticks){
    const { from, to, zero = 0 } = o.ticks;
    ctx.strokeStyle = COL.iceLine; ctx.lineWidth = 1.5;
    for (let m = from; m <= to; m++){
      const x = P(v, zero + m) - sc % v.s * (o.scroll ? 1 : 0);
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy+8); ctx.stroke();
      if (!o.scroll) text(`${m < 0 ? '−' + (-m) : m} m`, x, gy+26, { size:13, align:'center', color:COL.muted });
    }
  }
  if (o.label) text(o.label, 14, gy+24, { size:14, color:COL.muted });
}
export function drawFlag(x, gy, s){
  const top = gy - 1.55*s;
  ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
  ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x+5, gy-2); ctx.lineTo(x-4, top); ctx.stroke();
  ctx.beginPath(); ctx.arc(x-4, top-4, 9, 0, 7); ctx.fill();
  const fx = x, fy = top + 10, fw = 0.72*s, fh = 0.46*s;
  ctx.beginPath();
  ctx.moveTo(fx, fy+6);
  ctx.bezierCurveTo(fx+fw*0.3, fy-8, fx+fw*0.55, fy+16, fx+fw, fy);
  ctx.lineTo(fx+fw, fy+fh);
  ctx.bezierCurveTo(fx+fw*0.6, fy+fh+16, fx+fw*0.35, fy+fh-12, fx+6, fy+fh+6);
  ctx.closePath(); ctx.fill();
}
export function drawCart(cx, baseY, s, sub){
  const w = 0.8*s, h = 0.7*s;
  rr(cx - w/2, baseY - h, w, h, 0.24*s); ctx.fillStyle = COL.teal; ctx.fill();
  text('รถ(?)', cx, baseY - h + 22, { size:16, align:'center', color:'rgba(255,255,255,.85)' });
  if (sub) text(sub, cx, baseY - 15, { size:15, align:'center', color:'rgba(255,255,255,.9)', math:true, italic:false });
}
export function drawRyuka(x, feetY, s, o = {}){
  const img = o.sad ? IMG.sad : IMG.n;
  if (!img.complete || !img.naturalWidth) return;
  const h = 1.2*s, w = h * img.naturalWidth / img.naturalHeight;
  ctx.save();
  ctx.translate(x, o.lie ? feetY - w/2 + 4 : feetY - h/2);
  if (o.rot) ctx.rotate(o.rot);
  ctx.drawImage(img, -w/2, -h/2, w, h);
  ctx.restore();
}
export function fbd(cx, cy, o = {}){
  const L = 62;
  const cy2 = o.hiY ? COL.amber : COL.red;
  arrow(cx, cy, cx, cy - L, cy2, 9, 20);
  arrow(cx, cy, cx, cy + L, cy2, 9, 20);
  text('N', cx - 20, cy - L + 10, { math:true, size:24, align:'right', color:cy2 === COL.amber ? '#c46a00' : COL.ink });
  text('mg', cx - 18, cy + L - 2, { math:true, size:24, align:'right', color:cy2 === COL.amber ? '#c46a00' : COL.ink });
  if (o.showF !== false){
    arrow(cx, cy, cx + L*1.15, cy, COL.red, 9, 20);
    text('F', cx + L*1.15 + 8, cy + 8, { math:true, size:24 });
    text('ผลัก', cx + L*1.15 + 24, cy + 14, { size:13, color:COL.muted });
  }
  if (o.f){
    arrow(cx, cy, cx - L*0.95, cy, COL.fric, 9, 20);
    text('f', cx - L*0.95 - 10, cy + 8, { math:true, size:24, align:'right', color:COL.fric });
  }
  ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
}
export function drawLegend(){
  arrow(24, 34, 60, 34, COL.red, 8, 16);
  text('แรง', 68, 40, { size:15, color:COL.muted });
  velArrow(118, 34, 154, 34);
  text('ความเร็ว', 162, 40, { size:15, color:COL.muted });
}
