import { FONT, MATH } from '../config.js';
import { memo, setScene } from '../state.js';
import { say } from '../ui/dialog.js';
import { board, setTitle, SF } from '../ui/board.js';
import { showPanel } from '../ui/panel.js';
import { Moving } from '../scenes/moving.js';
import { Diagram } from '../scenes/diagram.js';
import { PushDemo } from '../scenes/pushDemo.js';
import { quiz } from './common.js';

export async function lesson(){
  setTitle('พาร์ทสอน');
  showPanel(null); board(null);
  const F = memo.F, a = F/40, v1 = memo.v1;
  let M = setScene(Moving(v1));
  await say('you', '“เหมือนจะมีอะไรหายไปสักอย่างนะ ?”');
  M.bubble = '“ช่วยกูก่อน”';
  await say('dad', 'คงจะจำว่าแค่ <b>ซิกม่าเอฟ เท่ากับ 0</b> หรือ <b>ไม่ได้ผลักแล้ว</b> = วัตถุ<b>หยุดนิ่ง</b> ใช่มั้ย');
  await say('dad', 'ถ้าจริงแบบนั้น รถ(?)คงหยุดไปตั้งนานแล้ว นี่แหละ<b>จุดที่เข้าใจผิด</b> มาแยกดูทีละแรงกัน');

  const D = setScene(Diagram());
  board(`<div class="eqBig">${SF()} = ?</div>
         <div class="cap">${SF()} = <b>ผลรวมแรงภายนอก</b>ทั้งหมด<br>ที่กระทำต่อรถ(?) (รวมริวกะ)</div>`);
  await say('dad', '“จากสมการที่คุ้นเคย พอมาลองแยกดูดีๆ แล้ว ΣF คือแรงภายนอกที่มากระทำต่อรถใช่มั้ยล่ะ ? ตอนผลักมีอยู่ 3 แรง”');
  D.hiY = true;
  board(`<div class="eqMid">${SF('y')} = <i>N</i> − <i>mg</i> = 0</div>
         <div class="cap">พื้นดันขึ้น (<i class="math">N</i>) กับน้ำหนัก (<i class="math">mg</i>)<br>หักล้างกันพอดี</div>
         <div class="small">รถเลยไม่จมพื้นและไม่ลอยขึ้น</div>`);
  await say('dad', '“แรงในแนวแกน y หักล้างกันหมด เป็น 0 อยู่ตลอดเวลา เหลือแต่แรงผลักในแนวแกน x”');

  setScene(PushDemo(F));
  board(`<div class="eqMid">แกน x : ${SF('x')} = ?</div>
         <div class="row" id="rowPush">ระหว่างผลัก: ${SF('x')} = <i class="math">F</i><sub>ผลัก</sub> = <b>${F} N ≠ 0</b><br>
           <span class="math">a</span> = ${SF('x')}/<i class="math">m</i> = ${F}/40 = <b>${a.toFixed(2)} m/s²</b> → ความเร็วเพิ่มขึ้น</div>
         <div class="row" id="rowCoast">มือหลุดแล้ว: <i class="math">F</i><sub>ผลัก</sub> = 0 → ${SF('x')} = <b>0</b><br>
           <span class="math">a</span> = 0 → ความเร็ว<b>คงที่</b></div>`);
  await say('dad', `“ตอนที่ผลักอยู่ รถรับแรงลัพธ์ ${F} N ซึ่ง<b>ไม่ใช่ 0</b> มันเลยมีความเร่ง ความเร็วเพิ่มขึ้นเรื่อยๆ (นี่คือกฎข้อ 2: ΣF = ma)”`);
  await say('dad', '“พอมือหลุดออกจากรถ แรงผลักก็หายไปทันที แรงลัพธ์ถึงจะกลับมาเป็น 0”');

  M = setScene(Moving(v1));
  M.cx = 330;
  board(null);
  await say('you', '“ในเมื่อไม่มีใครผลักมันแล้ว ทำไมรถยังเคลื่อนที่ต่อไปได้ล่ะ!?”');
  const tp = Math.sqrt(2*memo.d/a), tMax = tp*4, vMax = v1*1.35;
  const gx = t => 60 + t/tMax*430, gy = vv => 180 - vv/vMax*150;
  board(`<svg viewBox="0 0 520 215" width="500" role="img" aria-label="กราฟความเร็วกับเวลา ความเร็วเพิ่มขึ้นตอนผลักแล้วคงที่หลังปล่อยมือ">
      <rect x="60" y="25" width="${gx(tp)-60}" height="155" fill="#FFF1E0"/>
      <line x1="60" y1="180" x2="500" y2="180" stroke="#15181c" stroke-width="1.5"/>
      <line x1="60" y1="20" x2="60" y2="180" stroke="#15181c" stroke-width="1.5"/>
      <polyline points="60,180 ${gx(tp)},${gy(v1)} ${gx(tMax)},${gy(v1)}" fill="none" stroke="#3D7B74" stroke-width="4" stroke-linejoin="round"/>
      <line x1="${gx(tp)}" y1="${gy(v1)}" x2="${gx(tp)}" y2="180" stroke="#9aa3ae" stroke-dasharray="4 4"/>
      <text x="${gx(tp)}" y="200" text-anchor="middle" font-size="14" fill="#56606e" font-family="${MATH}">${tp.toFixed(1)} s</text>
      <text x="52" y="${gy(v1)+5}" text-anchor="end" font-size="14" fill="#56606e" font-family="${MATH}">${v1.toFixed(2)}</text>
      <text x="505" y="196" font-size="16" font-style="italic" fill="#15181c" font-family="${MATH}">t</text>
      <text x="44" y="22" font-size="16" font-style="italic" fill="#15181c" font-family="${MATH}">v</text>
      <text x="${(60+gx(tp))/2}" y="48" text-anchor="middle" font-size="14" fill="#8a4d00" font-family="${FONT}">ผลัก: ΣF ≠ 0</text>
      <text x="${(60+gx(tp))/2}" y="66" text-anchor="middle" font-size="14" fill="#8a4d00" font-family="${FONT}">v เพิ่มขึ้น</text>
      <text x="${(gx(tp)+gx(tMax))/2}" y="${gy(v1)-14}" text-anchor="middle" font-size="14" fill="#2b5c56" font-family="${FONT}">ปล่อยมือ: ΣF = 0 → v คงที่</text>
    </svg>
    <div class="small">กราฟ v–t ของรอบที่นายผลักด้วยแรง ${F} N</div>`);
  await say('dad', '“วัตถุ<b>ไม่ต้องมีแรงมาคอยดัน</b>ถึงจะเคลื่อนที่ต่อได้ และแรงผลักก็ไม่ได้ถูกเก็บไว้ในรถด้วย มือหลุดเมื่อไหร่ แรงก็หมดเมื่อนั้น”');
  await say('dad', '“สิ่งที่แรงทิ้งไว้คือ<b>ความเร็วที่เปลี่ยนไปแล้ว</b> พอ ΣF = 0 ก็ไม่มีอะไรมาเปลี่ยนความเร็วนั้นอีก รถเลยไปต่อด้วยความเร็วคงที่ นี่แหละ<b>ความเฉื่อย</b>”');
  board(`<span class="tag">กฎการเคลื่อนที่ข้อที่ 1 ของนิวตัน</span>
    <div class="law">ถ้า <b>${SF()} = 0</b><br>• วัตถุที่<b>นิ่ง</b>อยู่ จะนิ่งต่อไป<br>• วัตถุที่<b>เคลื่อนที่</b>อยู่ จะเคลื่อนที่ด้วย<b>ความเร็วคงที่</b>ในแนวเส้นตรง</div>
    <div class="small">ΣF = 0 แปลว่า “ความเร็วไม่เปลี่ยน” ไม่ได้แปลว่า “หยุด”</div>`);
  M.bubble = '“เข้าใจแล้ว แต่ช่วยกูก่อน!!”';
  await say('ryuka', '“แต่รถเข็นที่ซูเปอร์ฯ ปล่อยมือแล้วมันก็หยุดเองนี่นา !?”', { sad:true });
  await say('dad', '“นั่นเพราะพื้นมี<b>แรงเสียดทาน</b>มาต้าน ซึ่งก็เป็นแรงภายนอกเหมือนกัน ΣF เลยไม่เป็น 0 แต่ลานนี้เป็นน้ำแข็ง แรงเสียดทานแทบเป็นศูนย์ เลยไม่มีอะไรมาหยุดรถ(?)เลย”');

  await quiz(
    'หลังจากมือหลุดจากรถ(?) บนลานน้ำแข็ง (ไม่มีแรงเสียดทาน) ข้อใดถูกต้อง ?',
    ['รถค่อยๆ ช้าลง เพราะแรงผลักที่ติดอยู่ในรถค่อยๆ หมดไป',
     'รถเคลื่อนที่ด้วยความเร็วคงที่ เพราะแรงลัพธ์เป็นศูนย์',
     'รถหยุดทันที เพราะไม่มีแรงผลักแล้ว',
     'รถเร็วขึ้นเรื่อยๆ เพราะยังมีความเร่งเหลืออยู่'],
    1,
    'แรงลัพธ์เป็น 0 ความเร่งก็เป็น 0 ความเร็วจึงคงที่ตามกฎข้อ 1',
    ['แรงไม่ได้ติดอยู่ในรถ มันหายไปทันทีที่มือหลุด และถ้าไม่มีแรงต้าน ความเร็วก็ไม่ลดลง ลองใหม่นะ',
     '',
     'ไม่มีแรงผลักแปลว่าความเร็ว “ไม่เปลี่ยน” ไม่ได้แปลว่าหยุด ถ้าจะหยุดต้องมีแรงมาต้าน ลองใหม่นะ',
     'ความเร่งมีได้เฉพาะตอนที่มีแรงลัพธ์ (a = ΣF/m) พอ ΣF = 0 ความเร่งก็เป็น 0 ทันที ลองใหม่นะ']
  );
  board(null);
}
