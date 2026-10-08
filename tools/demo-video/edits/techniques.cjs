/* Version 2: "How the game teaches" — 13 teaching techniques, each with one to three short clips of the
   moment it happens, a title + explanation on the left and a caption under the footage. English by
   default; `compose.cjs <dir> techniques-th` runs it with lang = 'th'. */
const { H } = require('./_lib.cjs');

const VIEW = { x: 580, y: 134, w: 1280, h: 720 };
// regions of the game screen, in recording pixels (the 1280×720 game frame × 1.5)
const R = {
  slider: [1372, 120, 462, 104], readout: [1374, 334, 460, 190], readoutBonus: [1374, 332, 460, 276], graph: [1372, 536, 462, 142], play: [1474, 694, 256, 90],
  board: [1012, 148, 852, 660], dialog: [78, 828, 1782, 226], back: [146, 994, 150, 46], panel: [1344, 24, 516, 786],
};

const TEXT = {
  en: {
    intro: ['How the game teaches', 'Ryuka and the Box<br>That Wouldn’t Stop', '13 teaching techniques from a short story game about Newton’s laws of motion'],
    outro: ['Ryuka and the Box That Wouldn’t Stop', 'Open <b>index.html</b> in any browser — no install, no account.', 'Newton’s 1st, 2nd & 3rd laws · friction · equations of motion · projectile motion'],
    caps: {
      2: [[0, 'Yu-An names the belief: “ΣF = 0, or no more pushing, means the object <b>stops</b> — right?”'],
          [1, 'Free-body diagram: <b>N</b> and <b>mg</b> cancel along y, so only the push acts along x.']],
      6: [[0, 'Rewind to the same level — but the ice is now a rough floor with <b>μ = 0.10</b>.'],
          [1, '<b>120 N</b> stops 1.55 m short; <b>260 N</b> overshoots by 1.30 m — and a hint appears.']],
      9: [[0, 'm = 50 kg, μ = 0.20 → f = 98.1 N. A 300 N push falls short; <b>490 N</b> parks it.'],
          [2, '“The right push is always about <b>5 × f</b>: (F − f)/m × 0.8 = f/m × 3.2 — the m cancels.”']],
      8: [[0, 'ΣF = F − f, then −f, then 0: the box stops because of <b>friction</b>, not because the pushing ended.'],
          [2, 'v² = u² + 2as per phase: <b>2.50 m/s</b> at release, then 3.20 m of sliding → parks at <b>0.8 + 3.20 = 4.00 m</b>.']],
      10: [[0, 'Kay’s fix: a stopper in front of the box. Ryuka: “And the person standing <b>on</b> the box?!”'],
          [1, 'The readouts predict the landing live as the slider moves: <b>4.8 m/s</b> should land on the flag.']],
      11: [[0, 'Slow motion (×0.35): the stopper stops the box, but no horizontal force acts on Ryuka — she flies on and lands on the flag.'],
          [1, 'At the impact: equal and opposite forces on <b>different</b> objects — the stopper’s push stops the box.'],
          [2, 'Dots every 0.05 s: equal x-steps (vₓ constant), growing y-steps (gravity). <b>x = vt</b>, <b>Δy = ½gt²</b>.']],
    },
    s: [
      ['Productive failure', 'Let them get it wrong first', 'Before any theory, students push the box on their intuition. Most expect it to stop when the pushing stops — on ice, it never does.',
        'The student pushes with <b>120 N</b>. “You can stop pushing now!” … and the box sails past the flag.'],
      ['Rewind, no penalty', 'Mistakes are free: rewind time', 'A VHS-style rewind puts everything back so students can test another idea at once. Even a wrong-way push teaches something: the sign of F is its direction.',
        'Rewind, then push <b>−80 N</b>: the box slides left forever too. “The sign tells you the direction.”'],
      ['Confront the misconception', 'Say the misconception out loud', 'The lesson opens with the belief students already hold — “ΣF = 0 means the object stops” — and then takes it apart, force by force.',
        'Free-body diagram: <b>N</b> and <b>mg</b> cancel along y, so only the push acts along x.'],
      ['Personalised numbers', 'Their own push becomes the lesson', 'The board is built from the student’s own run: 40 N on 40 kg gives <span style="white-space:nowrap">a = 1.00 m/s²</span> while pushing, and ΣF = 0 the moment the hand lets go.',
        'Pushing: ΣF ≠ 0, the speed rises (<b>2nd law</b>). Released: ΣF = 0, the speed stays constant (<b>1st law</b>).'],
      ['Multiple representations', 'One run, three graphs', 'v–t, a–t and x–t of the same push, each with a reading tip: the area under v–t is the displacement, the slope of x–t is the velocity.',
        'Students switch graphs themselves. After release, <b>a = 0</b> and x–t becomes a straight line.'],
      ['Diagnostic quiz', 'Wrong answers that teach', 'Every wrong option stands for a known misconception, and its feedback answers exactly that idea. Each pick is logged with a misconception tag for the teacher.',
        'Pick A — “the push is stored in the box” — and Yu-An explains why force isn’t stored. Then B: correct.'],
      ['Vary one thing', 'Same level, now with friction', '“Why do trolleys stop by themselves?” is answered by play: a rough floor with f = μmg = 39.24 N. Misses report the distance; hints come only after the 2nd and 3rd miss.',
        '<b>120 N</b> stops 1.55 m short; <b>260 N</b> overshoots by 1.30 m — and a hint appears.'],
      ['Back view', 'Reread, then rewind from that line', 'Students can step back through every line and board. On a line from a level the panel stays live: change a value there and time rewinds to that try.',
        'Back to the 260 N try, type <b>196</b> → rewind → parked, 0.00 m from the mark.'],
      ['Phase-by-phase reasoning', 'Calculate instead of guessing', 'The friction lesson splits the run into push, slide and stop — ΣF, a and the graph for each — then uses <span style="white-space:nowrap">v² = u² + 2as</span> to predict where the box parks.',
        'ΣF = F − f, then −f, then 0: the box stops because of <b>friction</b>, not because the pushing ended.'],
      ['Open sandbox', 'Discover the pattern: F = 5f', 'Students choose the mass and μ, then find the push. After a success the pattern is revealed: in this level the right push is always 5 × f, because the mass cancels.',
        'm = 50 kg, μ = 0.20 → f = 98.1 N. 300 N falls short; <b>490 N ≈ 5f</b> parks it.'],
      ['Transfer', 'A new situation, the same law', 'A stopper halts the box — but nothing stops Ryuka. Students set the speed so she lands on the cushion: projectile motion and the 3rd law, from the same story.',
        'The readouts predict the landing live as the slider moves. 3.5 m/s lands short; <b>4.8 m/s</b> lands on the flag.'],
      ['Make the invisible visible', 'Slow motion, force pairs, strobe dots', 'The impact plays in slow motion with the action–reaction pair drawn on two different objects. Dots every 0.05 s show a constant vₓ and a growing fall.',
        '<b>x = vt</b> and <b>Δy = ½gt²</b>, linked by the same t: the fall time depends only on the height.'],
      ['Data for the teacher', 'Every try becomes evidence', 'Tries, inputs, miss distances, think time, quiz picks with misconception tags, minutes per part and the end-of-game feedback go to the teacher’s Google Sheet, with a summary per student.',
        'A short feedback form, then a one-page summary of everything Ryuka learned (the hard way).'],
    ],
  },
  th: {
    intro: ['เกมนี้สอนอย่างไร', 'ริวกะกับกล่อง<br>ที่ไม่ยอมหยุด', 'เทคนิคการสอน 13 อย่าง จากเกมเนื้อเรื่องสั้นๆ เรื่องกฎการเคลื่อนที่ของนิวตัน'],
    outro: ['ริวกะกับกล่องที่ไม่ยอมหยุด', 'เปิด <b>index.html</b> ในเบราว์เซอร์ได้ทันที ไม่ต้องติดตั้ง ไม่ต้องสมัครบัญชี', 'กฎข้อ 1, 2, 3 ของนิวตัน · แรงเสียดทาน · สมการการเคลื่อนที่ · การเคลื่อนที่แบบโพรเจกไทล์'],
    caps: {
      2: [[0, 'ยูอันพูดถึงความเชื่อเดิม: “ΣF = 0 หรือไม่ได้ผลักแล้ว แปลว่าวัตถุ<b>หยุดนิ่ง</b> ใช่มั้ย”'],
          [1, 'แผนภาพวัตถุอิสระ: <b>N</b> กับ <b>mg</b> หักล้างกันในแกน y เหลือแค่แรงผลักในแกน x']],
      6: [[0, 'ย้อนกลับไปด่านเดิม แต่เปลี่ยนลานน้ำแข็งเป็นพื้นที่มี <b>μ = 0.10</b>'],
          [1, '<b>120 N</b> จอดก่อนถึงจุดจอด 1.55 m, <b>260 N</b> เลยจุดจอดไป 1.30 m แล้วคำใบ้จึงปรากฏ']],
      8: [[0, 'ΣF = F − f แล้ว −f แล้ว 0 กล่องหยุดเพราะ<b>แรงเสียดทาน</b> ไม่ใช่เพราะเลิกผลัก'],
          [2, 'ใช้ v² = u² + 2as ทีละช่วง: ปล่อยมือที่ <b>2.50 m/s</b> ไถลต่อ 3.20 m → จอดที่ <b>0.8 + 3.20 = 4.00 m</b>']],
      9: [[0, 'm = 50 kg, μ = 0.20 → f = 98.1 N ผลัก 300 N ไม่ถึง ผลัก <b>490 N</b> จอดพอดี'],
          [2, '“แรงผลักที่พอดีจะประมาณ <b>5 เท่าของ f</b> เสมอ เพราะ (F − f)/m × 0.8 = f/m × 3.2 ตัด m ออกได้”']],
      10: [[0, 'เคย์เอาที่กั้นมาวางหน้ากล่อง ริวกะ: “แล้วคนที่ยืนอยู่<b>บน</b>กล่องล่ะ!?”'],
          [1, 'ค่าในแผงทำนายจุดตกทันทีที่เลื่อนสไลเดอร์ ที่ <b>4.8 m/s</b> ริวกะน่าจะลงเบาะที่ธงพอดี']],
      11: [[0, 'สโลว์โมชัน (×0.35): ที่กั้นหยุดกล่องได้ แต่ไม่มีแรงในแนวนอนกระทำกับริวกะ เธอจึงพุ่งต่อไปลงที่ธง'],
          [1, 'ตอนชน: แรงขนาดเท่ากัน ทิศตรงข้าม กระทำกับวัตถุ<b>คนละก้อน</b> แรงจากที่กั้นทำให้กล่องหยุด'],
          [2, 'จุดทุก 0.05 s: แนวราบห่างเท่ากัน (vₓ คงที่) แนวดิ่งห่างขึ้น (แรงโน้มถ่วง) <b>x = vt</b>, <b>Δy = ½gt²</b>']],
    },
    s: [
      ['ผิดก่อนแล้วค่อยเรียน', 'ให้ลองผิดก่อน', 'ก่อนเรียนทฤษฎี นักเรียนได้ผลักกล่องตามความเข้าใจเดิม ส่วนใหญ่คิดว่าเลิกผลักแล้วกล่องจะหยุด แต่บนลานน้ำแข็ง กล่องไม่หยุดเลย',
        'นักเรียนผลัก <b>120 N</b> ริวกะบอกว่า “หยุดผลักได้เลย” …แต่กล่องไถลเลยธงไปไม่หยุด'],
      ['ย้อนเวลา ไม่มีบทลงโทษ', 'พลาดได้ ย้อนเวลาได้', 'ย้อนเวลาแบบเทป VHS ให้ลองความคิดใหม่ได้ทันที แม้แต่การผลักผิดทางก็กลายเป็นบทเรียน: เครื่องหมายของ F บอกทิศทาง',
        'ย้อนเวลา แล้วลองผลัก <b>−80 N</b> กล่องไถลไปทางซ้ายไม่หยุดเหมือนกัน “เครื่องหมายบอกทิศ”'],
      ['เผชิญหน้ากับความเข้าใจผิด', 'พูดความเข้าใจผิด<br>ออกมาตรงๆ', 'บทเรียนเปิดด้วยความเชื่อที่นักเรียนมีอยู่แล้ว “ΣF = 0 แปลว่าวัตถุหยุด” แล้วค่อยๆ แยกดูทีละแรง',
        'แผนภาพวัตถุอิสระ: <b>N</b> กับ <b>mg</b> หักล้างกันในแกน y เหลือแค่แรงผลักในแกน x'],
      ['ใช้ตัวเลขของผู้เรียนเอง', 'แรงที่ผลักเอง กลายเป็นบทเรียน', 'กระดานใช้ค่าจากรอบที่นักเรียนเล่นจริง: แรง 40 N กับมวล 40 kg ได้ <span style="white-space:nowrap">a = 1.00 m/s²</span> ระหว่างผลัก และ ΣF = 0 ทันทีที่ปล่อยมือ',
        'ระหว่างผลัก ΣF ≠ 0 ความเร็วเพิ่มขึ้น (<b>กฎข้อ 2</b>) ปล่อยมือแล้ว ΣF = 0 ความเร็วคงที่ (<b>กฎข้อ 1</b>)'],
      ['การแทนหลายรูปแบบ', 'รอบเดียว สามกราฟ', 'กราฟ <span style="white-space:nowrap">v–t</span>, <span style="white-space:nowrap">a–t</span> และ <span style="white-space:nowrap">x–t</span> ของการผลักรอบเดียวกัน พร้อมวิธีอ่าน: พื้นที่ใต้กราฟ <span style="white-space:nowrap">v–t</span> คือการกระจัด ความชันของกราฟ <span style="white-space:nowrap">x–t</span> คือความเร็ว',
        'นักเรียนกดสลับกราฟเองได้ หลังปล่อยมือ <b>a = 0</b> และกราฟ x–t เป็นเส้นตรง'],
      ['ควิซวินิจฉัย', 'ตอบผิดก็ได้เรียน', 'ตัวเลือกผิดแต่ละข้อแทนความเข้าใจผิดที่พบบ่อย คำอธิบายตอบตรงจุดนั้น และทุกคำตอบถูกบันทึกพร้อมแท็กความเข้าใจผิดให้ครู',
        'เลือกข้อ ก “แรงผลักติดอยู่ในกล่อง” ยูอันอธิบายว่าแรงไม่ได้ถูกเก็บไว้ แล้วจึงตอบข้อ ข ถูก'],
      ['เปลี่ยนทีละอย่าง', 'ด่านเดิม<br>เพิ่มแรงเสียดทาน', 'ตอบคำถาม “ทำไมรถเข็นถึงหยุดเอง” ด้วยการลงมือเล่น: พื้นฝืด f = μmg = 39.24 N ถ้าพลาด เกมจะบอกว่าคลาดไปกี่เมตร และให้คำใบ้หลังพลาดครั้งที่ 2 และ 3',
        '<b>120 N</b> จอดก่อนถึงจุดจอด 1.55 m, <b>260 N</b> เลยจุดจอดไป 1.30 m แล้วคำใบ้จึงปรากฏ'],
      ['ย้อนอ่าน', 'ย้อนอ่าน<br>แล้วย้อนเวลา<br>จากบรรทัดนั้น', 'นักเรียนย้อนอ่านได้ทุกบรรทัดและทุกกระดาน ถ้าเป็นบรรทัดในด่าน แผงค่ายัง<span style="white-space:nowrap">ใช้งานได้</span> เปลี่ยนค่าตรงนั้นแล้วเวลาจะย้อนกลับไปที่รอบนั้น',
        'ย้อนไปที่รอบ 260 N พิมพ์ <b>196</b> → ย้อนเวลา → จอดพอดี คลาด 0.00 m'],
      ['คิดทีละช่วง', 'คำนวณแทนการเดา', 'บทเรียนแรงเสียดทานแบ่งการเคลื่อนที่เป็นช่วงผลัก ไถล และหยุด พร้อม ΣF, a และกราฟของแต่ละช่วง แล้วใช้ <span style="white-space:nowrap">v² = u² + 2as</span> ทำนายจุดจอด',
        'ΣF = F − f แล้ว −f แล้ว 0 กล่องหยุดเพราะ<b>แรงเสียดทาน</b> ไม่ใช่เพราะเลิกผลัก'],
      ['สนามทดลอง', 'ค้นพบรูปแบบเอง:<br>F = 5f', 'นักเรียนเลือกมวลและ μ เอง แล้วหาแรงผลัก เมื่อทำได้ ยูอันชี้ให้เห็นรูปแบบ: ในด่านนี้ แรงที่พอดีเท่ากับ 5 × f เสมอ เพราะมวลตัดกันหมด',
        'm = 50 kg, μ = 0.20 → f = 98.1 N ผลัก 300 N ไม่ถึง ผลัก <b>490 N ≈ 5f</b> จอดพอดี'],
      ['ถ่ายโอนความรู้', 'สถานการณ์ใหม่<br>กฎเดิม', 'ที่กั้นหยุดกล่องได้ แต่ไม่มีอะไรหยุดริวกะ นักเรียนตั้งความเร็วให้เธอลงเบาะพอดี: การเคลื่อนที่แบบโพรเจกไทล์และกฎข้อ 3 ต่อจากเรื่องเดิม',
        'ค่าในแผงทำนายจุดตกทันทีที่เลื่อนสไลเดอร์ 3.5 m/s ตกก่อนถึง ที่ <b>4.8 m/s</b> ริวกะลงเบาะที่ธงพอดี'],
      ['ทำสิ่งที่มองไม่เห็นให้เห็น', 'สโลว์โมชัน<br>แรงคู่ และจุดสโตรบ', 'จังหวะชนเล่นแบบสโลว์โมชัน แสดงแรงกิริยา–ปฏิกิริยาบนวัตถุคนละก้อน จุดทุก 0.05 s แสดงว่า vₓ คงที่ แต่ระยะตกเพิ่มขึ้นเรื่อยๆ',
        '<b>x = vt</b> และ <b>Δy = ½gt²</b> ผูกกันด้วย t ตัวเดียวกัน เวลาตกขึ้นกับความสูงอย่างเดียว'],
      ['ข้อมูลสำหรับครู', 'ทุกการลองคือ<br>หลักฐานการเรียนรู้', 'ทุกการลอง ค่าที่ใช้ ระยะที่พลาด เวลาคิด คำตอบควิซพร้อมแท็กความเข้าใจผิด เวลาต่อบท และแบบสอบถามท้ายเกม ถูกส่งเข้า Google Sheet ของครู พร้อมสรุปรายคน',
        'แบบสอบถามสั้นๆ แล้วตามด้วยหน้าสรุปสิ่งที่ริวกะได้เรียนรู้ (แบบเจ็บตัว)'],
    ],
  },
};

module.exports = (ctx, lang = 'en') => {
  const { m } = ctx;
  const X = TEXT[lang];
  const sec = (mk, a) => m(mk, a);
  // each section: list of clips [fromFrame, toFrame, speed, cam?, rings?]
  const C = (a, b, sp = 1, cam, rings) => ({ a, b, sp, cam, rings });
  const zBoard = { cx: 1400, cy: 432, z: 1.25 };   // the whole board, the dialogue cut cleanly below it
  const zPanel = { cx: 1520, cy: 400, z: 1.25 };
  const SECTIONS = [
    [C(sec('ch1-slide', -0.6), sec('ch1-push1', 0.1), 1.4, null, [[R.slider, 'F = 120 N', 1.45, 1.0, 'left']]),
     C(sec('ch1-push1', 0.1), sec('ch1-gone1', 2.4), 1.0)],
    [C(sec('ch1-choice', -0.4), sec('ch1-rewind1', 2.0), 1.0),
     C(sec('ch1-neg', 0), sec('ch1-sign', 0.4), 1.5),
     C(sec('ch1-sign', 0.4), sec('ch1-sign', 4.6), 1.0, [[0, { cx: 960, cy: 700, z: 1 }], [1, { cx: 1010, cy: 760, z: 1.1 }]])],
    [C(sec('lesson-misconception', 0), sec('lesson-misconception', 4.2), 1.0),
     C(sec('lesson-fbd', 0.3), sec('lesson-push', -0.3), 1.6, [[0, { cx: 960, cy: 540, z: 1 }], [1, { cx: 1100, cy: 432, z: 1.25 }]])],
    [C(sec('lesson-push', 0), sec('lesson-question', -0.2), 1.25, [[0, { cx: 1100, cy: 432, z: 1.25 }], [1, zBoard]])],
    [C(sec('lesson-tabs', 2.0), sec('lesson-tabs', 13.0), 1.0, [[0, zBoard], [1, zBoard]])],
    [C(sec('quiz1', 1.0), sec('quiz1-wrong', 4.0), 1.3, [[0, zBoard], [1, zBoard]]),
     C(sec('quiz1-right', -0.6), sec('quiz1-right', 2.6), 1.0, [[0, zBoard], [1, zBoard]])],
    [C(sec('fric', 0), sec('fric-intro', 1.0), 1.6),
     C(sec('fric-try1', 0.2), sec('fric-miss1', 1.5), 1.5),
     C(sec('fric-try2', 0.4), sec('fric-hint', 3.6), 1.5)],
    [C(sec('fric-back', -0.2), sec('fric-type', 1.6), 1.6, null, [[R.back, null, 0.0, 1.2]]),
     C(sec('fric-type', 1.6), sec('fric-success', 3.2), 1.15)],
    [C(sec('fricLesson-phases', 0.2), sec('fricLesson-phases', 5.2), 1.0, [[0, zBoard], [1, zBoard]]),
     C(sec('fricLesson-graph', 0.4), sec('fricLesson-graph', 4.4), 1.0, [[0, zBoard], [1, zBoard]]),
     C(sec('fricLesson-v2', 0.3), sec('fricLesson-v2', 4.3), 1.0, [[0, zBoard], [1, zBoard]])],
    [C(sec('sandbox-set', 0), sec('sandbox-miss', 0.6), 1.9, [[0, zPanel], [0.7, zPanel], [1, { cx: 960, cy: 540, z: 1 }]]),
     C(sec('sandbox-exact', 0), sec('sandbox-success', 1.4), 1.6),
     C(sec('sandbox-5f', 0.2), sec('sandbox-5f', 4.8), 1.0, [[0, { cx: 960, cy: 540, z: 1 }], [1, { cx: 1010, cy: 760, z: 1.1 }]])],
    [C(sec('bonus-stopper', 1.5), sec('bonus-oops', 1.4), 1.6),
     C(sec('bonus-try2', 0), sec('bonus-success', -2.25), 1.0, null, [[R.readoutBonus, null, 0.0, 1.6]])],   // up to the release
    [C(sec('bonus-success', -2.25), sec('bonus-success', 0.6), 1.0),                                          // the slow-motion impact and flight
     C(sec('projLesson', 0.2), sec('projLesson', 4.4), 1.0),
     C(sec('projLesson-dots', 0.2), sec('projLesson-dots', 5.0), 1.0, [[0, { cx: 960, cy: 520, z: 1.0 }], [1, { cx: 1047, cy: 500, z: 1.1 }]])],
    [C(sec('feedback', 0.4), sec('summary', 0.2), 2.2),
     C(sec('summary', 0.2), sec('summary', 4.0), 1.0, [[0, { cx: 960, cy: 540, z: 1 }], [1, { cx: 960, cy: 560, z: 1.08 }]])],
  ];

  const shots = [], groupOverlays = {};
  const N = SECTIONS.length;
  // intro over the title screen
  shots.push({ freeze: 60, view: { x: 0, y: 0, w: 1920, h: 1080 }, cam: [[0, { cx: 960, cy: 520, z: 1.06 }], [1, { cx: 960, cy: 540, z: 1.0 }]],
    filter: 'blur(7px) brightness(.36) saturate(.8)', dur: 5.5, overlays: [
      { html: H.card({ kick: X.intro[0], title: X.intro[1], sub: X.intro[2] }), x: 0, y: 0, fade: 0.6, anim: 'pop' }] });
  SECTIONS.forEach((clips, i) => {
    const g = 's' + i;
    clips.forEach((c, k) => {
      const shot = { group: g, src: [[c.a, c.b, c.sp]], view: VIEW, framed: true, cam: c.cam || undefined, xin: k ? 0.35 : 0.5, overlays: [] };
      for (const [rect, label, at, dur, side] of c.rings || [])
        shot.overlays.push({ html: H.ring(label, side), srcRect: rect, at, dur, fade: 0.25, anim: 'pop', z: 4 });
      shots.push(shot);
    });
    const [tag, title, body, cap] = X.s[i];
    // captions: the section's own, or one per clip (cap: [clipIndex, html] pairs from X.caps)
    const caps = (X.caps && X.caps[i]) || [[0, cap]];
    const starts = [];
    clips.reduce((t, c, k) => { starts[k] = t - (k ? 0.35 : 0); return starts[k] + (c.b - c.a)/ctx.fps/c.sp; }, 0);
    const end = starts[clips.length - 1] + (clips[clips.length - 1].b - clips[clips.length - 1].a)/ctx.fps/clips[clips.length - 1].sp;
    groupOverlays[g] = [
      { html: H.col({ num: String(i + 1).padStart(2, '0'), tag, title, body, w: 450 }), x: 70, y: 166, at: i ? 0.5 : 0, fade: 0.45, anim: 'left' },
      ...caps.map(([k, html], j) => {
        const at = starts[k] + (k ? 0.1 : 0.5), until = j + 1 < caps.length ? starts[caps[j + 1][0]] + 0.1 : end;
        return { html: `<div style="width:${VIEW.w}px">${H.caption(html)}</div>`, x: VIEW.x, y: 886, at, dur: until - at, fade: 0.3, anim: 'up' };
      }),
      { html: H.prog(N, i), x: 1860 - N*44 + 10, y: 58, at: i ? 0.5 : 0, fade: 0, anim: 'fade' },
    ];
  });
  shots.push({ dur: 7, xin: 0.6, overlays: [{ html: H.card({ kick: lang === 'th' ? 'ลองเล่นได้เลย' : 'Play it', title: X.outro[0], sub: X.outro[1] + '<br><span style="font-size:26px;color:#9fb0bd">' + X.outro[2] + '</span>' }), x: 0, y: 0, fade: 0.6, anim: 'pop' }] });
  const overlays = [{ html: H.brand(lang), x: 70, y: 52, t0: 5.2, t1: -6.6, fade: 0.5, anim: 'fade' }];
  return { w: 1920, h: 1080, shots, groupOverlays, overlays, music: { file: 'music/calm.wav', volume: 0.85 }, cls: lang === 'th' ? 'th' : '' };
};
