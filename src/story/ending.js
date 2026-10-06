import { $ } from '../dom.js';
import { board, overlay, setTitle } from '../ui/board.js';
import { showPanel } from '../ui/panel.js';
import { runFrom } from './index.js';

export async function ending(){
  showPanel(null); board(null); $('dialog').hidden = true; setTitle('');
  overlay(`<h2>สรุปสิ่งที่ริวกะได้เรียนรู้ (แบบเจ็บตัว)</h2>
    <div class="sumGrid">
      <div class="law"><b>กฎข้อ 1</b> ถ้า ΣF = 0 ความเร็วไม่เปลี่ยน นิ่งก็นิ่งต่อ วิ่งก็วิ่งต่อด้วยความเร็วคงที่ รถ(?)บนน้ำแข็งเลยไม่หยุดเอง</div>
      <div class="law"><b>แรงเสียดทาน</b> f = μmg ชี้สวนทางการเคลื่อนที่ ทำให้รถช้าลงจนหยุด รถหยุดเพราะแรงเสียดทาน ไม่ใช่เพราะเลิกผลัก</div>
      <div class="law"><b>กฎข้อ 2</b> ΣF = ma แรงลัพธ์ทำให้ความเร็ว<i>เปลี่ยน</i> ไม่ได้ถูกเก็บไว้ในวัตถุ หมดแรงลัพธ์เมื่อไหร่ ความเร่งก็เป็น 0</div>
      <div class="law"><b>สมการการเคลื่อนที่</b> เมื่อความเร่งคงที่: v = u + at · s = ut + ½at² · v² = u² + 2as ใช้ทีละช่วงที่แรงลัพธ์คงที่</div>
      <div class="law"><b>กฎข้อ 3</b> รถดันที่กั้น = ที่กั้นดันรถ (ขนาดเท่ากัน ทิศตรงข้าม) กระทำต่อวัตถุคนละก้อน จึงไม่หักล้างกัน</div>
      <div class="law"><b>โพรเจกไทล์</b> แกน x: x = v t (ไม่มีแรง) · แกน y: Δy = ½ g t² · เวลาลอย t = √(2h/g) ขึ้นกับความสูงอย่างเดียว</div>
    </div>
    <div class="links"><button id="again">เล่นใหม่ตั้งแต่ต้น</button><button id="againBonus">เล่นด่านแถมอีกรอบ</button></div>`);
  $('again').onclick = () => runFrom('ch1');
  $('againBonus').onclick = () => runFrom('bonus');
}
