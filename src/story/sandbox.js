import { setScene } from '../state.js';
import { waitEvent, waitAny } from '../events.js';
import { say } from '../ui/dialog.js';
import { board, setTitle } from '../ui/board.js';
import { showPanel, lockPanel } from '../ui/panel.js';
import { Level1 } from '../scenes/level1.js';
import { celebrate } from './common.js';

export async function sandbox(){
  setTitle('ด่านที่ 1 ท้าทาย : ปรับมวลและ μ เอง');
  board(null);
  const L = setScene(Level1());
  L.showMass = true; L.live = true; L.m = 60; L.mu = 0.15; L.reset();
  showPanel('sandbox', { m:60, mu:0.15 });
  await say('you', '“คราวนี้ขนของขึ้นรถเพิ่ม แล้วเปลี่ยนเป็นพื้นที่ฝืดกว่าเดิมดีกว่า”');
  await say('dad', '“ปรับ<b>มวล m</b> กับ<b>สัมประสิทธิ์ความเสียดทาน μ</b> ได้ตามใจเลย แล้วหาแรงผลักที่ทำให้รถจอดในช่องหน้าธงอีกครั้ง”');
  let fails = 0, wins = 0;
  while (true){
    lockPanel(false);
    say('ryuka', '“ตั้งค่าเสร็จแล้วกดผลักได้เลย”', { wait:false });
    const p = await waitEvent('play');
    lockPanel(true);
    L.start(p);
    const f = L.f();
    if (p.F <= f){
      await waitEvent('nomove');
      await say('ryuka', p.F === 0 ? '“ไม่ผลักเลย ก็ไม่ขยับสิ”'
        : `“ไม่ขยับเลย! แรงผลัก ${p.F} N ยังไม่มากกว่าแรงเสียดทาน ${f.toFixed(1)} N”`, { sad:p.F > 0 });
      L.reset(); continue;
    }
    const r = await waitAny(['stopped', 'gone']);
    if (r.name === 'stopped' && r.data.ok){
      wins++; fails = 0;
      await celebrate(`“จอดได้! m = ${p.m} kg, μ = ${p.mu.toFixed(2)} ได้ f = ${f.toFixed(1)} N ส่วนแรงผลัก ${p.F} N ≈ ${(p.F/f).toFixed(2)} เท่าของ f”`);
      if (wins === 1){
        await say('dad', '“สังเกตมั้ย แรงผลักที่พอดีจะประมาณ <b>5 เท่าของ \\(f\\)</b> เสมอ เพราะ \\(\\frac{F-f}{m}\\times 0.8=\\frac{f}{m}\\times 3.2\\) ตัด \\(m\\) ออกได้ เหลือ \\(F=5f\\)&thinsp;”');
        await say('dad', '“มวลมากขึ้นหรือพื้นฝืดขึ้น แรงเสียดทาน f = μmg ก็มากขึ้น เลยต้องผลักแรงขึ้นตามไปด้วย”');
      }
      const pick = await say('dad', 'จะลองค่าอื่นอีก หรือไปต่อ?', { choices:['ลองค่าอื่นอีก', 'ไปด่านแถม'] });
      if (pick === 1) break;
      L.reset();
      continue;
    }
    fails++;
    let msg;
    if (r.name === 'gone') msg = p.mu === 0 ? 'μ = 0 ก็คือลานน้ำแข็งแบบแรก ไม่มีแรงเสียดทาน รถเลยไม่หยุด' : 'ไถลเลยธงไปไกลมาก ลองลดแรงผลัก';
    else msg = r.data.err < 0 ? `จอดก่อนถึงจุดจอด ${(-r.data.err).toFixed(2)} m ลองเพิ่มแรงผลัก` : `จอดเลยจุดจอดไป ${r.data.err.toFixed(2)} m ลองลดแรงผลัก`;
    if (fails >= 3 && p.mu > 0) await say('dad', `“${msg} ใบ้ให้: ตอนนี้ f = μmg = ${f.toFixed(1)} N ลองใช้สูตรจากพาร์ทสอน (F − f) × 0.8 = f × 3.2”`);
    else await say('ryuka', `“${msg}”`, { sad:true });
  }
  showPanel(null);
}
