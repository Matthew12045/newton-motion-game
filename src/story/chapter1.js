import { memo, setScene } from '../state.js';
import { waitEvent } from '../events.js';
import { say } from '../ui/dialog.js';
import { board, setTitle, rewindFx } from '../ui/board.js';
import { showPanel, lockPanel } from '../ui/panel.js';
import { Level1 } from '../scenes/level1.js';

export async function chapter1(){
  setTitle('ด่านที่ 1 : กฏข้อที่ 1 ของนิวตัน');
  board(null);
  const L = setScene(Level1());
  showPanel('push', { F:memo.F });
  let tries = 0, lastF = null;
  while (true){
    lockPanel(false);
    say('ryuka', '“นายลองผลักรถ(?)ให้ไปจอดตรงช่องหน้าธงหน่อย”', { wait:false });
    const { F } = await waitEvent('play');
    lockPanel(true);
    L.start({ F, m:40, mu:0 });
    if (F === 0){
      await waitEvent('nomove');
      await say('ryuka', '“ไม่ผลักเลยมันก็นิ่งอยู่อย่างนั้นแหละ ออกแรงหน่อยสิ”');
      L.reset(); continue;
    }
    await waitEvent('pushEnd');
    say('ryuka', '“แค่นี้น่าจะพอให้ไปจอดหน้าธงแล้ว หยุดผลักได้เลย”', { wait:false });
    await waitEvent('passFlag');
    await waitEvent('gone');
    tries++;
    await say('ryuka', '“อะไรนะ หยุดผลักแล้วหรอ แต่ทำไมมันไม่หยุดอ่ะ อ้ากกก”', { panic:true, sad:true });
    if (tries >= 2){
      const note = lastF != null && lastF !== F ? `รอบนี้ผลัก ${F} N รอบก่อน ${lastF} N ` : '';
      await say('dad', `${note}ผลักแรงหรือเบาแค่ไหน พอเลิกผลักแล้วรถ(?)ก็ไม่หยุดเองสักที… ไปดูกันว่าเพราะอะไร`);
      break;
    }
    lastF = F;
    const pick = await say('dad', 'จะลองผลักใหม่ด้วยแรงที่ต่างไป หรือไปหาคำตอบเลย?', { choices:['ย้อนเวลา ลองผลักใหม่', 'ไปพาร์ทสอน'] });
    if (pick === 1) break;
    await rewindFx(L);
  }
  showPanel(null);
}
