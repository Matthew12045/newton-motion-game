import { $ } from '../dom.js';
import { IMG } from '../assets.js';

/* ---------- dialogue ---------- */
let advance = null;
function renderSpeaker(who, o){
  const p = $('portrait');
  if (who === 'ryuka'){
    p.innerHTML = `<img src="${(o.sad ? IMG.sad : IMG.n).src}" alt="ริวกะ"><span class="nm">ริวกะ</span>` + (o.panic ? '<div class="hp"><i></i></div>' : '');
  } else if (who === 'you'){
    p.innerHTML = `<div class="q4">????</div><div class="sub">ผัวริวกะ</div>`;
  } else {
    p.innerHTML = `<div class="name">พ่อมัน</div>`;
  }
}
export function say(who, html, o = {}){
  $('dialog').hidden = false;
  renderSpeaker(who, o);
  const t = $('dtext');
  t.innerHTML = html;
  t.style.fontSize = '';
  if (t.scrollHeight > 70) t.style.fontSize = '19px';
  if (html.includes('\\(') && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([t]).catch(() => {});
  t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
  const ch = $('choices'); ch.innerHTML = '';
  $('next').hidden = true; advance = null;
  if (o.choices){
    return new Promise(res => o.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice'; b.textContent = c;
      b.onclick = e => { e.stopPropagation(); ch.innerHTML = ''; res(i); };
      ch.append(b);
    }));
  }
  if (o.wait === false) return Promise.resolve();
  $('next').hidden = false;
  return new Promise(res => { advance = () => { advance = null; $('next').hidden = true; res(); }; });
}
export function initDialog(){
  $('dialog').addEventListener('click', () => advance && advance());
  addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && advance){
      const a = document.activeElement;
      if (a && (a.tagName === 'BUTTON' || a.tagName === 'INPUT') && a.id !== 'next') return;
      e.preventDefault(); advance();
    }
  });
}
