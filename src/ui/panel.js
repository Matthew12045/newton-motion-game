import { G, MATH, FONT, COL } from '../config.js';
import { $ } from '../dom.js';
import { emit } from '../events.js';
import { pval, scene } from '../state.js';

/* ---------- parameter panel ---------- */
const PDEF = {
  F:  { label:'แรงผลัก', sym:'F', unit:'N' },
  m:  { label:'มวลรวม', sym:'m', unit:'kg' },
  mu: { label:'สัมประสิทธิ์ความเสียดทาน', sym:'μ', unit:'' },
  v:  { label:'ความเร็วรถ', sym:'v', unit:'m/s' }
};
const MOTION_ROWS = [['ΣF<sub>x</sub>','N'],['a','m/s²'],['v','m/s'],['x','m'],['t','s']];
const MODES = {
  push:    { params:[['F',0,300,10]], btn:'ผลัก/เล่น', graph:true, rows:MOTION_ROWS,
             info:() => 'มวลรถ(?) + ริวกะ = 40 kg<br>ผลักแค่ช่วง 0.8 m แรก' },
  fric:    { params:[['F',0,300,1]], btn:'ผลัก/เล่น', graph:true, rows:MOTION_ROWS,
             info:() => 'm = 40 kg · μ = 0.10 · f = μmg = 39.24 N<br>ผลักแค่ช่วง 0.8 m แรก' },
  sandbox: { params:[['F',0,1000,1],['m',20,80,1],['mu',0,0.25,0.01]], btn:'ผลัก/เล่น', graph:true, rows:MOTION_ROWS,
             info:p => `แรงเสียดทาน f = μmg = ${(p.mu*p.m*G).toFixed(2)} N` },
  speed:   { params:[['v',0,8,0.1]], btn:'ปล่อยรถ/เล่น', graph:false,
             rows:[['t','s'],['t<sub>ลอย</sub>','s'],['x','m'],['Δy','m'],['v<sub>x</sub>','m/s'],['v<sub>y</sub>','m/s']],
             info:() => 'x = 0 ที่ขอบแท่น · t นับจากจุดปล่อยรถ<br>h = 1.9 m · D = 3.0 m · g = 9.81 m/s²' }
};
export let panelMode = null;
let readRows = [];
export function showPanel(mode, init = {}){
  panelMode = mode;
  const p = $('panel');
  if (!mode){ p.hidden = true; return; }
  const M = MODES[mode];
  Object.assign(pval, init);
  p.hidden = false;
  p.classList.toggle('multi', M.params.length > 1);
  $('params').innerHTML = M.params.map(([k, min, max, step]) => {
    const d = PDEF[k];
    return `<div class="prow"><label for="r_${k}">${d.label} <i>${d.sym}</i></label>
      <span class="num"><input type="number" id="n_${k}" min="${min}" max="${max}" step="${step}" aria-label="${d.label}">${d.unit ? `<span>${d.unit}</span>` : ''}</span></div>
      <input type="range" class="rng" id="r_${k}" min="${min}" max="${max}" step="${step}">`;
  }).join('');
  M.params.forEach(([k, min, max, step]) => {
    const r = $('r_'+k), n = $('n_'+k), dec = (String(step).split('.')[1] || '').length;
    const set = (val, from) => {
      if (!isFinite(val)) val = pval[k];
      val = +Math.min(max, Math.max(min, Math.round(val/step)*step)).toFixed(dec);
      pval[k] = val;
      if (from !== 'r') r.value = val;
      if (from !== 'n') n.value = val.toFixed(dec);
      $('info').innerHTML = M.info(pval);
      if (scene && scene.onParam) scene.onParam(pval);
    };
    r.addEventListener('input', () => set(+r.value, 'r'));
    n.addEventListener('change', () => set(parseFloat(n.value)));
    n.addEventListener('input', () => {                    // live while typing, without rewriting the box
      const val = parseFloat(n.value);
      if (isFinite(val) && val >= min && val <= max){
        pval[k] = val; r.value = val;
        $('info').innerHTML = M.info(pval);
        if (scene && scene.onParam) scene.onParam(pval);
      }
    });
    set(pval[k]);
  });
  $('playBtn').textContent = M.btn;
  $('graph').hidden = !M.graph;
  readRows = M.rows;
  $('readout').innerHTML = readRows.map((r, i) => `<dt>${r[0]}</dt><dd id="ro${i}">–</dd>`).join('');
}
export function lockPanel(on){ $('panel').querySelectorAll('input,button').forEach(el => el.disabled = on); }
export function initPanel(){ $('playBtn').addEventListener('click', () => emit('play', { ...pval })); }
export function updateReadout(){
  if (!scene || !scene.readout) return;
  const vals = scene.readout();
  vals.forEach((v, i) => { const el = $('ro'+i); if (el) el.textContent = v == null ? '–' : `${v} ${readRows[i][1]}`.trim(); });
  const note = scene.readoutNote ? scene.readoutNote() : null, cap = $('roCap');
  cap.hidden = !note; if (note) cap.textContent = note;
  if (MODES[panelMode] && MODES[panelMode].graph && scene.hist) drawGraph(scene.hist);
}
function drawGraph(hist){
  const g = $('graph'), c = g.getContext('2d');
  c.setTransform(2,0,0,2,0,0);
  c.clearRect(0,0,300,90);
  const x0 = 34, y0 = 76, w = 252, h = 56;
  const tMax = Math.max(4, hist.length ? hist[hist.length-1].t * 1.1 : 4);
  const vMax = Math.max(1, ...hist.map(p => p.v)) * 1.25;
  c.strokeStyle = '#9aa3ae'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x0, y0-h-6); c.lineTo(x0, y0); c.lineTo(x0+w, y0); c.stroke();
  c.fillStyle = '#56606e'; c.font = `italic 12px ${MATH}`;
  c.fillText('v', x0-14, y0-h+6); c.fillText('t', x0+w+5, y0+4);
  c.font = `11px ${FONT}`; c.fillText('กราฟ v–t', x0+6, 12);
  if (hist.length < 2) return;
  c.strokeStyle = COL.teal; c.lineWidth = 2.2; c.beginPath();
  hist.forEach((p, i) => { const X = x0 + p.t/tMax*w, Y = y0 - p.v/vMax*h; i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
  c.stroke();
}
