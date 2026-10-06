import { G, FONT, MATH } from '../config.js';
import { memo, setScene } from '../state.js';
import { say } from '../ui/dialog.js';
import { board, setTitle, SF } from '../ui/board.js';
import { showPanel } from '../ui/panel.js';
import { Diagram } from '../scenes/diagram.js';
import { quiz } from './common.js';

export async function frictionLesson(){
  setTitle('พาร์ทสอน : แรงเสียดทาน');
  showPanel(null);
  const F = (memo.fric && memo.fric.F) || 196, m = 40, f = 0.1*m*G;
  const a1 = (F - f)/m, v1 = Math.sqrt(2*a1*0.8), a2 = f/m, s2 = v1*v1/(2*a2), tp = v1/a1, tc = v1/a2;
  const D = setScene(Diagram()); D.fric = true; D.sad = false;
  board(`<div class="eqMid"><i>f</i> = <i>μN</i> = <i>μmg</i></div>
    <div class="cap">= 0.10 × 40 × 9.81 = <b>39.24 N</b></div>
    <div class="small">เกิดจากผิวรถ(?)ไถลถูกับพื้น<br>มีทิศ<b>สวนทางการเคลื่อนที่</b>เสมอ</div>`);
  await say('dad', '“แรงเสียดทานเกิดจากผิวรถ(?)ไถลถูกับพื้น ขนาด f = μN และบนพื้นราบ N = mg จึงได้ f = μmg”');
  board(`<div class="eqMid">แกน x : ${SF('x')} = ?</div>
    <div class="row on">ช่วงผลัก: ${SF('x')} = <i class="math">F</i> − <i class="math">f</i> = ${F} − 39.24 = <b>${(F - f).toFixed(2)} N</b><br>
      <span class="math">a</span> = <b>+${a1.toFixed(2)} m/s²</b> → เร็วขึ้น</div>
    <div class="row on">ปล่อยมือ: ${SF('x')} = −<i class="math">f</i> = <b>−39.24 N</b><br>
      <span class="math">a</span> = <b>−${a2.toFixed(2)} m/s²</b> → ช้าลง</div>
    <div class="row on">หยุดแล้ว: ไม่ไถลแล้ว แรงเสียดทานจลน์หายไป<br>${SF('x')} = 0 → นิ่งอยู่กับที่</div>`);
  await say('dad', '“ตอนผลัก ต้องออกแรงมากกว่าแรงเสียดทาน แรงลัพธ์ถึงจะชี้ไปข้างหน้า รถจึงเร็วขึ้น”');
  D.showF = false; D.label = 'หลังปล่อยมือ';
  await say('dad', `“พอปล่อยมือ เหลือแค่แรงเสียดทานที่ชี้ถอยหลัง แรงลัพธ์จึงสวนทางการเคลื่อนที่ ความเร็วลดลงวินาทีละ ${a2.toFixed(2)} m/s จนเหลือ 0”`);
  await say('dad', '“พอรถหยุด ผิวไม่ได้ไถลกันแล้ว แรงเสียดทานจลน์ก็หมดไป ΣF = 0 รถจึงนิ่งอยู่ตรงนั้น ไม่ได้ถอยหลังกลับ”');
  const tMax = (tp + tc)*1.12, vMax = v1*1.6;
  const gx = t => 60 + t/tMax*430, gy = vv => 180 - vv/vMax*150;
  board(`<svg viewBox="0 0 520 215" width="500" role="img" aria-label="กราฟความเร็วกับเวลา ความเร็วเพิ่มขึ้นตอนผลัก แล้วลดลงจนเป็นศูนย์เพราะแรงเสียดทาน">
      <rect x="60" y="25" width="${gx(tp) - 60}" height="155" fill="#FFF1E0"/>
      <rect x="${gx(tp)}" y="25" width="${gx(tp + tc) - gx(tp)}" height="155" fill="#F3EAF7"/>
      <line x1="60" y1="180" x2="500" y2="180" stroke="#15181c" stroke-width="1.5"/>
      <line x1="60" y1="20" x2="60" y2="180" stroke="#15181c" stroke-width="1.5"/>
      <polygon points="60,180 ${gx(tp)},${gy(v1)} ${gx(tp + tc)},180" fill="rgba(61,123,116,.12)"/>
      <polyline points="60,180 ${gx(tp)},${gy(v1)} ${gx(tp + tc)},180 ${gx(tMax)},180" fill="none" stroke="#3D7B74" stroke-width="4" stroke-linejoin="round"/>
      <line x1="${gx(tp)}" y1="${gy(v1)}" x2="${gx(tp)}" y2="180" stroke="#9aa3ae" stroke-dasharray="4 4"/>
      <text x="${gx(tp)}" y="200" text-anchor="middle" font-size="14" fill="#56606e" font-family="${MATH}">${tp.toFixed(1)} s</text>
      <text x="${gx(tp + tc)}" y="200" text-anchor="middle" font-size="14" fill="#56606e" font-family="${MATH}">${(tp + tc).toFixed(1)} s</text>
      <text x="52" y="${gy(v1) + 5}" text-anchor="end" font-size="14" fill="#56606e" font-family="${MATH}">${v1.toFixed(2)}</text>
      <text x="505" y="196" font-size="16" font-style="italic" fill="#15181c" font-family="${MATH}">t</text>
      <text x="44" y="22" font-size="16" font-style="italic" fill="#15181c" font-family="${MATH}">v</text>
      <g text-anchor="middle" font-size="12" fill="#8a4d00" font-family="${FONT}">
        <text x="${(60 + gx(tp))/2}" y="39" font-size="13" font-weight="700">ผลัก</text>
        <text x="${(60 + gx(tp))/2}" y="53">ΣF = F − f</text>
        <text x="${(60 + gx(tp))/2}" y="67">> 0</text>
        <text x="${(60 + gx(tp))/2}" y="81">v เพิ่มขึ้น</text>
      </g>
      <g text-anchor="middle" font-size="12" fill="#6c3483" font-family="${FONT}">
        <text x="${(gx(tp) + gx(tp + tc))/2}" y="39" font-size="13" font-weight="700">ไถล</text>
        <text x="${(gx(tp) + gx(tp + tc))/2}" y="53">ΣF = −f < 0</text>
        <text x="${(gx(tp) + gx(tp + tc))/2}" y="67">v ลดลงจนเป็น 0</text>
      </g>
    </svg>
    <div class="small">กราฟ v–t ของรอบที่นายผลักด้วยแรง ${F} N · พื้นที่ใต้กราฟ = ระยะทาง ≈ ${(0.8 + s2).toFixed(1)} m</div>`);
  await say('ryuka', '“สรุปว่ารถหยุดเพราะแรงเสียดทาน ไม่ใช่เพราะเลิกผลัก!”');
  board(`<div class="cap">ใช้ <span class="math">v² = u² + 2as</span> ทีละช่วง</div>
    <div class="row on">ช่วงผลัก: <span class="math">v² = 0 + 2(${a1.toFixed(2)})(0.8)</span><br>→ <span class="math">v</span> = <b>${v1.toFixed(2)} m/s</b> ตอนปล่อยมือ</div>
    <div class="row on">ช่วงไถล: <span class="math">0 = v² − 2(${a2.toFixed(2)})s</span><br>→ <span class="math">s</span> = <b>${s2.toFixed(2)} m</b></div>
    <div class="cap">รวม 0.8 + ${s2.toFixed(2)} = <b>${(0.8 + s2).toFixed(2)} m</b><br><span class="small">(จุดจอดอยู่ห่างจุดเริ่ม 4.0 m)</span></div>`);
  await say('dad', '“ใช้สูตร v² = u² + 2as ทีละช่วง ก็คำนวณได้ก่อนเลยว่ารถจะไปจอดตรงไหน ไม่ต้องเดา”');
  await quiz(
    'ขณะที่รถกำลังไถลช้าลงหลังปล่อยมือ แรงลัพธ์ที่กระทำต่อรถมีทิศทางใด ?',
    ['ไปข้างหน้า ทิศเดียวกับที่รถเคลื่อนที่',
     'ถอยหลัง สวนทางกับที่รถเคลื่อนที่',
     'เป็นศูนย์ เพราะไม่มีใครผลักแล้ว',
     'เปลี่ยนไปเรื่อยๆ ตามความเร็วของรถ'],
    1,
    'แรงลัพธ์คือแรงเสียดทานที่ชี้ถอยหลัง ความเร่งจึงสวนทางกับความเร็ว รถเลยช้าลง',
    ['รถกำลังเคลื่อนที่ไปข้างหน้าก็จริง แต่ไม่มีแรงไหนดันไปข้างหน้าแล้ว การเคลื่อนที่ไม่จำเป็นต้องมีแรงในทิศนั้น ลองใหม่นะ',
     '',
     'ถ้าแรงลัพธ์เป็นศูนย์ ความเร็วจะคงที่ แต่รถกำลังช้าลง แปลว่ายังมีแรงลัพธ์อยู่ ลองใหม่นะ',
     'แรงเสียดทานจลน์ f = μmg มีขนาดคงที่ ไม่ขึ้นกับความเร็ว และชี้สวนทางการเคลื่อนที่เสมอ ลองใหม่นะ']
  );
  board(null);
}
