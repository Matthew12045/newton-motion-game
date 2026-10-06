import { memo, setScene } from '../state.js';
import { waitEvent, waitAny } from '../events.js';
import { say } from '../ui/dialog.js';
import { board, setTitle, rewindFx } from '../ui/board.js';
import { showPanel, lockPanel } from '../ui/panel.js';
import { Level1 } from '../scenes/level1.js';
import { celebrate } from './common.js';

export async function frictionLevel(){
  setTitle('ด่านที่ 1 ลองใหม่ : มีแรงเสียดทาน');
  board(null); showPanel(null);
  const L = setScene(Level1());
  L.cart.x = 9.5; L.ry.x = 9.5; L.ry.y = 0.7;
  await say('dad', '“งั้นมาลองกันเลย ย้อนเวลากลับไป แล้วเปลี่ยนลานน้ำแข็งเป็นพื้นที่มีแรงเสียดทาน”');
  L.mu = 0.1;
  await rewindFx(L);
  showPanel('fric', { F:150 });
  await say('dad', '“พื้นนี้มีสัมประสิทธิ์ความเสียดทาน μ = 0.10 รถ(?)กับริวกะหนัก 40 kg แรงเสียดทานจึงเป็น f = μmg = 0.10 × 40 × 9.81 = 39.24 N”');
  await say('dad', '“แรงเสียดทานชี้<b>สวนทางการเคลื่อนที่</b>เสมอ ลองหาแรงผลักที่ทำให้รถค่อยๆ ช้าลงแล้วจอดใน<b>ช่องสีเขียวหน้าธง</b>พอดีสิ”');
  let fails = 0;
  while (true){
    lockPanel(false);
    say('ryuka', '“คราวนี้ต้องจอดหน้าธงให้ได้นะ”', { wait:false });
    const { F } = await waitEvent('play');
    lockPanel(true);
    L.start({ F, m:40, mu:0.1 });
    if (F <= L.f()){
      await waitEvent('nomove');
      if (F === 0) await say('ryuka', '“ไม่ผลักเลย ก็ไม่ขยับสิ”');
      else {
        await say('ryuka', `“ผลักตั้ง ${F} N แต่รถไม่ขยับเลย!”`, { sad:true });
        await say('dad', `“แรงผลัก ${F} N ยังไม่มากกว่าแรงเสียดทาน 39.24 N พื้นเลยออกแรงเสียดทานต้านเท่ากับแรงผลักพอดี ΣF = 0 รถจึงนิ่งอยู่”`);
      }
      L.reset(); continue;
    }
    const r = await waitAny(['stopped', 'gone']);
    if (r.name === 'stopped' && r.data.ok){
      memo.fric = { F };
      await celebrate(`“เยี่ยม! ผลัก ${F} N รถค่อยๆ ช้าลงแล้วจอดคลาดจากจุดจอดแค่ ${Math.abs(r.data.err).toFixed(2)} m”`);
      break;
    }
    fails++;
    const msg = r.name === 'gone' ? 'ไถลเลยธงไปไกลมาก ลองลดแรงผลัก'
      : r.data.err < 0 ? `จอดก่อนถึงจุดจอด ${(-r.data.err).toFixed(2)} m ลองเพิ่มแรงผลัก`
      : `จอดเลยจุดจอดไป ${r.data.err.toFixed(2)} m ลองลดแรงผลัก`;
    if (fails === 2) await say('dad', `“${msg} ใบ้ให้: หลังปล่อยมือ รถต้องไถลต่ออีก 3.2 m และช้าลงด้วย a = f/m = 0.981 m/s² ตอนปล่อยมือจึงควรมีความเร็ว v = √(2 × 0.981 × 3.2) ≈ 2.5 m/s ลองดูค่า v ในแผงด้านขวา”`);
    else if (fails >= 3) await say('dad', `“${msg} ช่วงผลัก (F − f)/m × 0.8 ต้องเท่ากับช่วงไถล f/m × 3.2 จึงได้ F = 5 × 39.24 ≈ 196 N”`);
    else await say('ryuka', `“${msg}”`, { sad:true });
  }
  showPanel(null);
}
