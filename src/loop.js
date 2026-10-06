import { W, H } from './config.js';
import { ctx } from './stage.js';
import { scene } from './state.js';
import { panelMode, updateReadout } from './ui/panel.js';

/* ---------- main loop ---------- */
let last = 0;
function loop(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now;
  ctx.clearRect(0, 0, W, H);
  if (scene){
    scene.update && scene.update(dt*(scene.timeScale || 1));
    scene.draw();
  }
  if (panelMode) updateReadout();
  requestAnimationFrame(loop);
}
export function startLoop(){ last = performance.now(); requestAnimationFrame(loop); }
