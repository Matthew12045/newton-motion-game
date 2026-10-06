import { FONT, MATH, COL } from '../config.js';
import { ctx } from '../stage.js';

/* ---------- drawing helpers ---------- */
export function rr(x, y, w, h, r){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function arrow(x1, y1, x2, y2, color, w = 9, head = 22){
  const ang = Math.atan2(y2-y1, x2-x1), len = Math.hypot(x2-x1, y2-y1);
  if (len < 3) return;
  const hd = Math.min(head, len*0.6);
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.fillRect(0, -w/2, len-hd+1, w);
  ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len-hd, -hd*0.72); ctx.lineTo(len-hd, hd*0.72); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function gradArrow(x1, y, x2, w = 12){
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, '#FFD54F'); g.addColorStop(1, COL.amber);
  arrow(x1, y, x2, y, g, w, 26);
}
export function text(t, x, y, o = {}){
  ctx.font = o.math ? `${o.italic === false ? '' : 'italic '}${o.size || 22}px ${MATH}`
                    : `${o.weight || 400} ${o.size || 20}px ${FONT}`;
  // Position by measuring instead of relying on ctx.textAlign, which some viewers ignore.
  ctx.textAlign = 'left'; ctx.textBaseline = o.base || 'alphabetic';
  const w = ctx.measureText(t).width;
  const x0 = o.align === 'center' ? x - w/2 : o.align === 'right' ? x - w : x;
  ctx.fillStyle = o.color || COL.ink; ctx.fillText(t, x0, y);
  return w;
}
export const P = (v, x) => v.ox + x*v.s;
export const Y = (v, y) => v.gy - y*v.s;

export function dimLine(x1, y1, x2, y2, label, o = {}){
  ctx.strokeStyle = o.color || COL.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const vert = x1 === x2, k = 7;
  ctx.beginPath();
  if (vert){ ctx.moveTo(x1-k, y1); ctx.lineTo(x1+k, y1); ctx.moveTo(x2-k, y2); ctx.lineTo(x2+k, y2); }
  else { ctx.moveTo(x1, y1-k); ctx.lineTo(x1, y1+k); ctx.moveTo(x2, y2-k); ctx.lineTo(x2, y2+k); }
  ctx.stroke();
  if (label){
    if (vert) text(label, x1 + 10, (y1+y2)/2 + 6, { size:18, color:o.color, math:o.math });
    else text(label, (x1+x2)/2, y1 + 24, { size:17, align:'center', color:o.color, math:o.math });
  }
}
export function velArrow(x1, y1, x2, y2, color = COL.vel, w = 5, head = 15){
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(x1, y1, x2, y2, color, w, head);
}
export function subLabel(main, sub, x, y, o = {}){
  const w = text(main, x, y, { math:true, size:o.size || 20, color:o.color || COL.vel });
  if (sub) text(sub, x + w + 1, y + 5, { math:true, size:(o.size || 20)*0.65, color:o.color || COL.vel });
}
export function bubble(t, x, y, o = {}){ text(t, x, y, { size:o.size || 24, align:o.align || 'left', color:o.color }); }
