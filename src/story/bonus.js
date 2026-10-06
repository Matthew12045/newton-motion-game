import { $ } from '../dom.js';
import { setScene } from '../state.js';
import { stage } from '../stage.js';
import { waitEvent, sleep } from '../events.js';
import { say } from '../ui/dialog.js';
import { board, overlay, setTitle, rewindFx } from '../ui/board.js';
import { showPanel, lockPanel } from '../ui/panel.js';
import { Projectile } from '../scenes/projectile.js';
import { quiz } from './common.js';

export async function bonus(){
  showPanel(null); board(null); $('dialog').hidden = true;
  overlay(`<div class="bigRed">แถม</div><h2>ด่านที่ 1 ลองใหม่</h2><button class="btnDark" id="goBonus">ไปต่อ</button>`);
  $('goBonus').focus();
  await new Promise(r => $('goBonus').onclick = r);
  overlay(null);
  setTitle('ด่านที่ 1 ลองใหม่ (แถม)');
  const S = setScene(Projectile());
  S.cart.x = 20; S.ry.x = 20;                 // still off somewhere to the right…
  await say('you', '“กลับไปที่ลานน้ำแข็งกันอีกที คราวนี้ไม่มีแรงเสียดทานช่วย… ผมรู้ละ ก็เอาที่กั้นไปวางขวางหน้ารถไว้เลยละกัน รถจะได้หยุดแน่ๆ”');
  S.dropStopper();
  await sleep(450);
  await say('ryuka', '“ห๊ะ???????????? แล้วคนที่นั่งอยู่บนรถล่ะ !?”', { sad:true });
  await say('dad', '“งั้นจะย้อนเวลาให้ก่อนละกัน”');
  await rewindFx(S);
  await say('dad', '“คราวนี้เปลี่ยนจากตั้งแรงผลัก มาตั้ง<b>ความเร็ว</b>ของรถตอนวิ่งเข้าหาที่กั้นแทน บนแท่นก็เป็นน้ำแข็ง รถเลยวิ่งด้วยความเร็วคงที่จนชนที่กั้น”');
  await say('dad', '“รถหยุดที่ที่กั้นก็จริง แต่ริวกะไม่ได้ติดกับรถ… หาความเร็วที่ทำให้ริวกะลอยไปลงเบาะที่ธงพอดีสิ”');
  showPanel('speed', { v:3 });
  let fails = 0;
  while (true){
    lockPanel(false);
    say('ryuka', '“เลือกความเร็วดีๆ นะ… ขอร้อง”', { wait:false, sad:true });
    const { v } = await waitEvent('play');
    lockPanel(true);
    S.start(v);
    if (v === 0){
      await waitEvent('still');
      await say('ryuka', '“รถไม่ขยับ เค้าก็ไม่ไปไหน (ΣF = 0 และนิ่งอยู่ ก็นิ่งต่อไป) ตั้งความเร็วหน่อยสิ”');
      S.reset(); continue;
    }
    const land = await waitEvent('landed');
    if (land.ok){
      const th = document.createElement('div'); th.id = 'thumb'; th.textContent = '👍'; stage.append(th);
      await say('dad', `“เยี่ยม! ใช้ความเร็ว ${v.toFixed(1)} m/s ริวกะตกห่างธงแค่ ${Math.abs(land.err).toFixed(2)} m ลงเบาะพอดี”`);
      th.remove();
      break;
    }
    fails++;
    const msg = land.err < 0 ? `ตกก่อนถึงธง ${(-land.err).toFixed(2)} m ลองเพิ่มความเร็ว` : `เลยธงไป ${land.err.toFixed(2)} m ลองลดความเร็ว`;
    if (fails >= 2){
      await say('dad', `${msg} ใบ้ให้: เวลาที่ลอยอยู่กลางอากาศขึ้นกับความสูงอย่างเดียว t = √(2h/g) = √(2×1.9/9.81) ≈ 0.62 s แล้ว D = v·t`);
    } else {
      await say('ryuka', `“${msg}… โอ๊ย”`, { sad:true });
    }
  }
  showPanel(null);
  await projectileLesson(S);
}

export async function projectileLesson(S){
  setTitle('พาร์ทสอน (แถม)');
  S.ticksTo = 3; S.ghost = null;
  S.showPair = true;
  board(`<span class="tag">ตอนรถชนที่กั้น</span>
    <div class="cap">ที่กั้นดันรถ ←&nbsp;&nbsp;&nbsp;→ รถดันที่กั้น</div>
    <div class="eqMid"><span class="vec">F</span><sub class="math">ที่กั้น→รถ</sub> = −<span class="vec">F</span><sub class="math">รถ→ที่กั้น</sub></div>
    <div class="small">กฎข้อ 3: ขนาดเท่ากัน ทิศตรงข้าม<br>และกระทำกับวัตถุ<b>คนละก้อน</b> จึงไม่หักล้างกันเอง</div>`);
  await say('dad', '“ตอนชน ที่กั้นออกแรงดันรถ และรถก็ดันที่กั้นกลับด้วยแรงขนาดเท่ากัน ทิศตรงข้าม นี่คือกฎข้อ 3 แรงที่ที่กั้นดันรถคือแรงที่ทำให้รถหยุด”');
  await say('dad', '“แต่ที่กั้นไม่ได้แตะริวกะเลย และเบาะรถก็ลื่น ไม่มีแรงในแนวนอนมากระทำกับริวกะ ริวกะเลยพุ่งต่อด้วยความเร็วเดิม กฎข้อ 1 อีกแล้ว!”');
  await say('ryuka', '“แปลว่าไม่มีใครผลักเค้าออกไปเลยหรอ… เค้าแค่ไม่ได้หยุดตามรถ”', { sad:true });
  S.showPair = false; S.showGuides = true; S.ghost = null;
  board(`<div class="cap">ระหว่างลอย มีแรงเดียวคือ <b>น้ำหนัก <i class="math">mg</i></b> ลงล่าง</div>
    <table class="tbl">
      <tr><th></th><th>แรง</th><th>ความเร่ง</th><th>ตำแหน่ง</th></tr>
      <tr><td class="up">แกน x</td><td>ΣF<sub>x</sub> = 0</td><td>a<sub>x</sub> = 0</td><td>x = v t</td></tr>
      <tr><td class="up">แกน y</td><td>ΣF<sub>y</sub> = mg</td><td>a<sub>y</sub> = g</td><td>Δy = ½ g t²</td></tr>
    </table>
    <div class="small">(ไม่คิดแรงต้านอากาศ) จุดบนฉากถ่ายทุก 0.05 s<br>t ในตาราง = เวลาลอย (นับจากตอนหลุดจากขอบแท่น) · x = 0 ที่ขอบแท่น</div>`);
  await say('dad', '“ดูจุดที่ถ่ายไว้ทุก 0.05 วินาที ระยะห่างแนวนอนเท่ากันทุกช่วง เพราะแกน x ไม่มีแรง v<sub>x</sub> เลยคงที่ แต่ระยะแนวดิ่งห่างขึ้นเรื่อยๆ เพราะแรงโน้มถ่วงเร่งให้ตกเร็วขึ้น”');
  await say('dad', '“ริวกะไม่ได้พุ่งตรงไปก่อนแล้วค่อยร่วงแบบในการ์ตูน และก็ไม่ได้ลอยขึ้นด้วย ตอนหลุดจากรถความเร็วแนวดิ่งเป็น 0 จึงเริ่มตกทันที เส้นทางเลยเป็นพาราโบลา”');
  board(`<div class="eqMid">h = ½ g t² &nbsp;→&nbsp; t = √(2h/g)</div>
    <div class="cap">t = √(2 × 1.9 / 9.81) ≈ <b>0.62 s</b></div>
    <div class="eqMid">D = v t &nbsp;→&nbsp; v = D / t</div>
    <div class="cap">v = 3.0 / 0.62 ≈ <b>4.8 m/s</b></div>
    <div class="small">เวลาลอยขึ้นกับความสูงเท่านั้น ไม่ขึ้นกับความเร็ว</div>`);
  await say('dad', '“คิดแบบนี้ก็ได้คำตอบโดยไม่ต้องเดาเลย แกน x กับแกน y แยกกันคิดได้ ผูกกันด้วยเวลา t ตัวเดียวกัน”');
  await quiz(
    'ถ้าเพิ่มความเร็วรถเป็น 2 เท่า ริวกะจะลอยอยู่กลางอากาศนานเท่าไร และตกไกลแค่ไหน ?',
    ['ลอยนานขึ้น 2 เท่า และตกไกลขึ้น 4 เท่า',
     'ลอยนานเท่าเดิม แต่ตกไกลขึ้น 2 เท่า',
     'ลอยสั้นลงครึ่งหนึ่ง เพราะพุ่งเร็วกว่า',
     'ลอยนานเท่าเดิม และตกที่เดิม'],
    1,
    'เวลาตก t = √(2h/g) ขึ้นกับความสูงอย่างเดียว ส่วนระยะ D = v t จึงเพิ่มเป็น 2 เท่าตาม v',
    ['เวลาตกไม่ขึ้นกับความเร็วแนวนอน เพราะแกน y มีแค่แรงโน้มถ่วงเหมือนเดิม ลองใหม่นะ',
     '',
     'ความเร็วแนวนอนไม่ช่วยให้ตกเร็วขึ้นหรือช้าลง แกน y ยังตกด้วย g เท่าเดิม ลองใหม่นะ',
     'เวลาตกเท่าเดิมถูกแล้ว แต่ระหว่างนั้นริวกะเคลื่อนที่แนวนอนเร็วขึ้น 2 เท่า (x = v t) ลองใหม่นะ']
  );
  await quiz(
    'ตอนรถชนที่กั้น แรงที่รถดันที่กั้น เทียบกับแรงที่ที่กั้นดันรถ เป็นอย่างไร ?',
    ['รถดันแรงกว่า เพราะรถเป็นฝ่ายวิ่งเข้าไปชน',
     'ที่กั้นดันแรงกว่า เพราะรถเป็นฝ่ายหยุด',
     'ขนาดเท่ากัน ทิศตรงข้าม และกระทำต่อวัตถุคนละก้อน',
     'สองแรงหักล้างกันเป็นศูนย์ จึงไม่มีอะไรเกิดขึ้น'],
    2,
    'นี่คือกฎข้อ 3 แรงคู่นี้อยู่บนวัตถุคนละก้อน จึงไม่หักล้างกัน แรงบนรถทำให้รถหยุด',
    ['ใครวิ่งเข้าใส่ก็ไม่สำคัญ แรงกิริยาและปฏิกิริยามีขนาดเท่ากันเสมอ ลองใหม่นะ',
     'ขนาดเท่ากันเสมอตามกฎข้อ 3 รถหยุดเพราะมีแรงจากที่กั้นมากระทำ ไม่ใช่เพราะแรงนั้นใหญ่กว่า ลองใหม่นะ',
     '',
     'สองแรงนี้กระทำกับวัตถุคนละก้อน (อันหนึ่งบนรถ อีกอันบนที่กั้น) จึงเอามารวมกันไม่ได้ ลองใหม่นะ']
  );
  board(null);
}
