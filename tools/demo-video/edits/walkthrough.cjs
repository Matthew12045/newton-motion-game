/* Version 1: the full playthrough, start to finish, with English subtitles for every line, a chapter
   card before each part, and a chip naming the teaching technique at the moment it is used.
   (walkthrough-th.cjs reuses this with Thai labels and no subtitles.) */
const { H, subtitles, quizCards } = require('./_lib.cjs');

const VIEW = { x: 192, y: 14, w: 1536, h: 864 };

module.exports = (ctx, lang = 'en') => {
  const { m, fps } = ctx;
  const T = lang === 'th';
  const shots = [];
  const card = (kick, title, sub, thai, dur = 3.2) => shots.push({ dur, overlays: [
    { html: H.card({ kick, title, sub, thai }), x: 0, y: 0, fade: 0.45, anim: 'pop' }] });
  const label = (text, dur) => ({ html: `<div style="width:${VIEW.w}px">${H.chap(text)}</div>`, x: VIEW.x + 6, y: 896, fade: 0.4, anim: 'fade' });
  const part = (a, b, name) => shots.push({ src: [[a, b, 1]], view: VIEW, framed: true, fadeOut: 0.25, fadeInBlack: 0.25, overlays: [label(name)] });

  const L = T ? {
    intro: ['เดโมเกม · เล่นครบทุกบท', 'ริวกะกับกล่องที่ไม่ยอมหยุด', 'เกมเนื้อเรื่องสั้นๆ ที่สอนกฎการเคลื่อนที่ของนิวตัน เล่นให้ดูตั้งแต่ต้นจนจบ พร้อมชื่อเทคนิคการสอนในแต่ละช่วง'],
  } : {
    intro: ['Game demo · full playthrough', 'Ryuka and the Box That Wouldn’t Stop', 'A short story game that teaches Newton’s laws of motion — played start to finish, with English subtitles.'],
  };
  card(L.intro[0], L.intro[1], L.intro[2], T ? null : 'ริวกะกับกล่องที่ไม่ยอมหยุด · กฎการเคลื่อนที่ของนิวตัน', 5);

  const C = T ? [
    ['เริ่มเกม', 'หน้าแรก', 'นักเรียนกรอกชื่อและชั้น หรือเลือกบทที่ต้องการ'],
    ['ด่านที่ 1', 'กฎข้อที่ 1 ของนิวตัน', 'ผลักกล่องบนลานน้ำแข็งให้ไปจอดหน้าธง'],
    ['บทเรียน', 'แรงลัพธ์และความเฉื่อย', 'ทำไมกล่องไม่หยุด ทั้งที่เลิกผลักแล้ว'],
    ['ด่านที่ 1 (รอบที่ 2)', 'แรงเสียดทาน', 'ด่านเดิม แต่พื้นมีแรงเสียดทาน f = μmg'],
    ['บทเรียน', 'แรงเสียดทาน', 'ΣF ทีละช่วง กราฟ และ v² = u² + 2as'],
    ['ด่านท้าทาย', 'มวลและ μ', 'ปรับค่าเอง แล้วค้นพบว่า F = 5f'],
    ['ด่านพิเศษ', 'การเคลื่อนที่แบบโพรเจกไทล์', 'กล่องหยุดที่ที่กั้น แต่ริวกะไม่หยุด'],
    ['บทเรียน (แถม)', 'กฎข้อ 3 และโพรเจกไทล์', 'แรงคู่กิริยา–ปฏิกิริยา และ x = vt, Δy = ½gt²'],
    ['สำหรับครู', 'แบบสอบถามและสรุป', 'ข้อมูลการเล่นส่งเข้า Google Sheet ของครู'],
  ] : [
    ['Start', 'Title screen', 'Students type their name and class — or jump to any chapter.'],
    ['Level 1', 'Newton’s 1st law', 'Push the box across frictionless ice so it parks by the flag.'],
    ['Lesson', 'Net force & inertia', 'Why didn’t the box stop when the pushing stopped?'],
    ['Level 1 · round 2', 'Friction', 'The same level, now on a rough floor: f = μmg.'],
    ['Lesson', 'Friction', 'ΣF phase by phase, graphs, and v² = u² + 2as.'],
    ['Challenge', 'Mass and μ', 'Set the values yourself — and discover that F = 5f.'],
    ['Bonus level', 'Projectile motion', 'The box stops at the stopper. Ryuka doesn’t.'],
    ['Bonus lesson', '3rd law & projectiles', 'Action–reaction at the impact; x = vt and Δy = ½gt².'],
    ['For the teacher', 'Feedback & summary', 'What the class sheet receives, and the closing summary.'],
  ];
  const cuts = [[0, m('ch1', -0.2)], [m('ch1', -0.2), m('lesson', -0.1)], [m('lesson', -0.1), m('fric', -0.1)], [m('fric', -0.1), m('fricLesson', -0.1)],
    [m('fricLesson', -0.1), m('sandbox', -0.1)], [m('sandbox', -0.1), m('bonus', -0.1)], [m('bonus', -0.1), m('projLesson', -0.1)],
    [m('projLesson', -0.1), m('feedback', -0.1)], [m('feedback', -0.1), m('end')]];
  cuts.forEach(([a, b], i) => {
    const [k, t, s] = C[i];
    card(k, t, s, null, i === 0 ? 2.6 : 3.0);
    part(a, b, `${k} · ${t}`);
  });

  const outro = T ? ['เปิด index.html ในเบราว์เซอร์ได้เลย', 'ไม่ต้องติดตั้งอะไร · ใช้ได้ทั้งคอมพิวเตอร์และแท็บเล็ต',
    'ทุกครั้งที่ลอง คำตอบควิซ และเวลาที่ใช้ในแต่ละบท ถูกส่งเข้า Google Sheet ของครู'] :
    ['Open index.html in any browser', 'No install, no account — works on computers and tablets.',
      'Every try, quiz answer and minute spent per part goes to the teacher’s Google Sheet.'];
  shots.push({ dur: 6, overlays: [{ html: H.card({ kick: T ? 'เล่นได้ทันที' : 'Try it', title: outro[0], sub: outro[1] + '<br>' + outro[2] }), x: 0, y: 0, fade: 0.5, anim: 'pop' }] });

  // technique chips, anchored to the moment in the recording
  const tech = T ? [
    ['ch1-push1', 0.3, 'ทำนายก่อน', 'ลงมือผลักก่อนเรียนทฤษฎี'],
    ['ch1-gone1', -1.5, 'ผิดก่อนแล้วค่อยเรียน', 'กล่องไม่หยุด ความเชื่อเดิมพังต่อหน้า'],
    ['ch1-rewind1', -0.2, 'ย้อนเวลา', 'ลองใหม่ได้ทันที ไม่มีบทลงโทษ'],
    ['ch1-sign', 0, 'เวกเตอร์', 'แรงติดลบ = ทิศไปทางซ้าย'],
    ['lesson-misconception', 0, 'เรียกชื่อความเข้าใจผิด', '“ΣF = 0 แปลว่าหยุด” ถูกพูดออกมาแล้วพิสูจน์'],
    ['lesson-fbd', 0, 'แผนภาพแรง', 'ดูทีละแรง แกน y หักล้างกัน'],
    ['lesson-push', 0, 'ใช้ตัวเลขของผู้เล่นเอง', 'บทเรียนใช้แรง 40 N ที่นักเรียนผลักจริง'],
    ['lesson-graph', 0, 'หลายรูปแบบการแทน', 'กราฟ v–t, a–t, x–t ของรอบที่เล่นเอง'],
    ['quiz1', 1, 'ควิซวินิจฉัย', 'ตัวเลือกผิดแต่ละข้อผูกกับความเข้าใจผิด'],
    ['fric-intro', 0, 'เปลี่ยนทีละอย่าง', 'ด่านเดิม เพิ่มแรงเสียดทาน'],
    ['fric-hint', 0, 'คำใบ้แบบขั้นบันได', 'ใบ้เมื่อพลาดครั้งที่ 2 และ 3'],
    ['fric-back', 0, 'ย้อนอ่าน + ย้อนเวลา', 'กลับไปบรรทัดไหนก็ได้ แล้วลองใหม่จากตรงนั้น'],
    ['fricLesson-phases', 0, 'คิดทีละช่วง', 'ΣF = F − f แล้ว −f แล้ว 0'],
    ['fricLesson-v2', 0, 'คำนวณแทนการเดา', 'v² = u² + 2as ทีละช่วง'],
    ['sandbox-set', 0, 'สนามทดลอง', 'ตั้ง m, μ และ F เอง'],
    ['sandbox-5f', 0, 'ค้นพบรูปแบบ', 'F = 5f เพราะมวลตัดกันหมด'],
    ['bonus-stopper', 0, 'ถ่ายโอนความรู้', 'กฎข้อ 1 ในสถานการณ์ใหม่'],
    ['bonus-try1', 0, 'ทำนายแบบสด', 'ค่าในแผงเปลี่ยนตามสไลเดอร์'],
    ['projLesson', 0.5, 'กฎข้อ 3', 'ขนาดเท่ากัน ทิศตรงข้าม คนละวัตถุ'],
    ['projLesson-dots', 0, 'ภาพแบบสโตรบ', 'แนวราบห่างเท่ากัน แนวดิ่งห่างขึ้น'],
    ['feedback', 0.5, 'ข้อมูลสำหรับครู', 'ทุกการลองและคำตอบส่งเข้า Google Sheet'],
  ] : [
    ['ch1-push1', 0.3, 'Predict first', 'students act before any theory'],
    ['ch1-gone1', -1.5, 'Productive failure', 'the box never stops — the misconception breaks on screen'],
    ['ch1-rewind1', -0.2, 'Rewind time', 'retry instantly, no penalty'],
    ['ch1-sign', 0, 'Vectors', 'a negative push = a push to the left'],
    ['lesson-misconception', 0, 'Name the misconception', '“ΣF = 0 means it stops”'],
    ['lesson-fbd', 0, 'Free-body diagram', 'one force at a time; y cancels'],
    ['lesson-push', 0, 'Their own numbers', 'the lesson uses the student’s 40 N push'],
    ['lesson-graph', 0, 'Multiple representations', 'v–t, a–t, x–t of their own run'],
    ['quiz1', 1, 'Diagnostic quiz', 'each wrong option = a misconception'],
    ['fric-intro', 0, 'Change one thing', 'same level, add friction'],
    ['fric-hint', 0, 'Graduated hints', 'only after the 2nd and 3rd miss'],
    ['fric-back', 0, 'Back view', 'reread any line, rewind time from it'],
    ['fricLesson-phases', 0, 'Phase by phase', 'ΣF = F − f, then −f, then 0'],
    ['fricLesson-v2', 0, 'Calculate, don’t guess', 'v² = u² + 2as per phase'],
    ['sandbox-set', 0, 'Sandbox', 'set m, μ and F yourself'],
    ['sandbox-5f', 0, 'Discover a pattern', 'F = 5f — the mass cancels'],
    ['bonus-stopper', 0, 'Transfer', 'the 1st law in a new situation'],
    ['bonus-try1', 0, 'Live prediction', 'readouts follow the slider'],
    ['projLesson', 0.5, '3rd-law pair', 'equal, opposite, different objects'],
    ['projLesson-dots', 0, 'Strobe view', 'equal x-steps, growing y-steps'],
    ['feedback', 0.5, 'Teacher data', 'every try and answer → Google Sheet'],
  ];
  const srcOverlays = tech.map(([mk, off, a, b]) => {
    const f0 = m(mk, off);
    return { f0, f1: f0 + Math.round(6.5*fps), html: `<div style="width:${VIEW.w}px;display:flex;justify-content:flex-end">${H.chip(a, b)}</div>`,
      x: VIEW.x - 4, y: 886, fade: 0.4, anim: 'up', rise: 14, z: 3 };
  });
  if (!T){
    srcOverlays.push(...subtitles(ctx, { y: 930, h: 140 }));
    srcOverlays.push(...quizCards(ctx, { x: VIEW.x + 24, y: 110 }));
  }
  return { w: 1920, h: 1080, shots, srcOverlays, music: { file: 'music/calm_long.wav', volume: 0.32 }, cls: T ? 'th' : '' };
};
