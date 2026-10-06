import { W, H } from './config.js';
import { $ } from './dom.js';

export let stage, cv, ctx;

/* ---------- fit the 1280×720 frame to the window ---------- */
function fit(){
  const vw = innerWidth, vh = innerHeight;
  const s = Math.min(vw/W, vh/H);
  stage.style.transform = `translate(${(vw-W*s)/2}px,${(vh-H*s)/2}px) scale(${s})`;
  const k = Math.min(3, s*(devicePixelRatio||1));
  cv.width = Math.round(W*k); cv.height = Math.round(H*k);
  ctx.setTransform(k,0,0,k,0,0);
  $('rotate').hidden = !(vh > vw && vw < 700);
}

export function initStage(){
  stage = $('stage'); cv = $('cv'); ctx = cv.getContext('2d');
  addEventListener('resize', fit); fit();
}
