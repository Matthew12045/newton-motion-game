import { $ } from '../dom.js';
import { IMG } from '../assets.js';
import { resetEvents } from '../events.js';
import { setScene } from '../state.js';
import { board, overlay, setTitle } from '../ui/board.js';
import { showPanel } from '../ui/panel.js';
import { chapter1 } from './chapter1.js';
import { lesson } from './lesson.js';
import { frictionLevel } from './friction.js';
import { frictionLesson } from './frictionLesson.js';
import { sandbox } from './sandbox.js';
import { bonus } from './bonus.js';
import { ending } from './ending.js';

// The game in playing order. To add a chapter, write it in its own file and list it here.
const STEPS = [
  ['ch1', chapter1],
  ['lesson', lesson],
  ['fric', frictionLevel],
  ['fricLesson', frictionLesson],
  ['sandbox', sandbox],
  ['bonus', bonus],
  ['end', ending],
];

// Play from the given step to the end of the game.
export async function runFrom(key){
  overlay(null); resetEvents();
  for (const [, step] of STEPS.slice(STEPS.findIndex(([k]) => k === key))) await step();
}

export function titleScreen(){
  showPanel(null); board(null); $('dialog').hidden = true; setTitle('');
  setScene(null);
  overlay(`<div class="heroRow"><img src="${IMG.n.src}" alt="ริวกะ"><div class="heroCart"></div></div>
    <h1>กฏการเคลื่อนที่ของนิวตัน</h1>
    <h2>ริวกะกับรถ(?)ที่ไม่ยอมหยุด · แรงเสียดทาน · แถมท้ายด้วยการเคลื่อนที่แบบโพรเจกไทล์</h2>
    <button class="btnDark" id="start">เริ่มเล่น</button>
    <div class="links">ข้ามไป: <button id="skipL">พาร์ทสอน</button><button id="skipF">ด่านแรงเสียดทาน</button><button id="skipS">ปรับมวลและ μ เอง</button><button id="skipB">ด่านแถม (โพรเจกไทล์)</button></div>`);
  $('start').onclick = () => runFrom('ch1');
  $('skipL').onclick = () => runFrom('lesson');
  $('skipF').onclick = () => runFrom('fric');
  $('skipS').onclick = () => runFrom('sandbox');
  $('skipB').onclick = () => runFrom('bonus');
  $('start').focus();
}
