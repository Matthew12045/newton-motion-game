import { $ } from '../dom.js';
import { cv } from '../stage.js';
import { waitEvent, sleep } from '../events.js';

/* ---------- board / overlay ---------- */
export function board(html, top = false){
  const b = $('board');
  if (html == null){ b.hidden = true; return b; }
  b.hidden = false; b.classList.toggle('top', top);
  b.innerHTML = html;
  b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
  return b;
}
export function overlay(html){
  const o = $('overlay');
  if (html == null){ o.hidden = true; return o; }
  o.hidden = false; o.innerHTML = html;
  return o;
}
export function setTitle(t){ $('title').textContent = t; }
export const SF = (sub = '') => `<span class="sig">Σ</span><span class="vec">F</span>${sub ? `<sub class="math">${sub}</sub>` : ''}`;

export async function rewindFx(sc){
  $('rewind').hidden = false;
  cv.style.filter = 'sepia(.7) contrast(.9)';
  if (sc && sc.rewind){ sc.rewind(); await waitEvent('rewound'); } else await sleep(1100);
  cv.style.filter = '';
  $('rewind').hidden = true;
}
