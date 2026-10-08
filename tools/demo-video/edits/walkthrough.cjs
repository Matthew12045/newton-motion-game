/* Version 1: the full playthrough, start to finish, with English subtitles for every line, a chapter
   card before each part, and a chip naming the teaching technique at the moment it is used.
   (`compose.cjs <dir> walkthrough-th` runs this with Thai labels and no subtitles.) */
const { H, subtitles, quizCards } = require('./_lib.cjs');

module.exports = (ctx, lang = 'en') => {
  const { m, fps } = ctx;
  const T = lang === 'th';
  // English leaves room under the footage for subtitles; Thai has none, so its footage is larger
  const VIEW = T ? { x: 144, y: 48, w: 1632, h: 918 } : { x: 192, y: 14, w: 1536, h: 864 };
  const shots = [];
  const card = (kick, title, sub, thai, dur = 3.2) => shots.push({ dur, overlays: [
    { html: H.card({ kick, title, sub, thai }), x: 0, y: 0, fade: 0.45, anim: 'pop' }] });
  const label = (text, dur) => ({ html: `<div style="width:${VIEW.w}px">${H.chap(text)}</div>`, x: VIEW.x + 6, y: VIEW.y + VIEW.h + 18, fade: 0.4, anim: 'fade' });
  const part = (a, b, name, src = [[a, b, 1]]) => shots.push({ src, view: VIEW, framed: true, fadeOut: 0.25, fadeInBlack: 0.25, overlays: [label(name)] });

  const L = T ? {
    intro: ['เดโมเกม · เล่นครบทุกบท', 'ริวกะกับกล่องที่ไม่ยอมหยุด', 'เกมเนื้อเรื่องสั้นๆ ที่สอนกฎการเคลื่อนที่ของนิวตัน<br>เล่นให้ดูตั้งแต่ต้นจนจบ พร้อมชื่อเทคนิคการสอนในแต่ละช่วง'],
  } : {
    intro: ['Game demo · full playthrough', 'Ryuka and the Box That Wouldn’t Stop', 'A short story game that teaches Newton’s laws of motion — played start to finish, with English subtitles.'],
  };
  card(L.intro[0], L.intro[1], L.intro[2], T ? null : 'ริวกะกับกล่องที่ไม่ยอมหยุด · กฎการเคลื่อนที่ของนิวตัน', 5);

  const C = T ? [
    ['เริ่มเกม', 'หน้าแรก', 'นักเรียนกรอกชื่อและชั้น แล้วเริ่มเล่นหรือเลือกบทที่ต้องการ'],
    ['ด่านที่ 1', 'กฎข้อที่ 1 ของนิวตัน', 'ผลักกล่องบนลานน้ำแข็งให้ไปจอดหน้าธง'],
    ['บทเรียน', 'แรงลัพธ์และความเฉื่อย', 'ทำไมกล่องไม่หยุด ทั้งที่เลิกผลักแล้ว'],
    ['ด่านที่ 1 (รอบที่ 2)', 'แรงเสียดทาน', 'ด่านเดิม แต่พื้นมีแรงเสียดทาน f = μmg'],
    ['บทเรียน', 'แรงเสียดทาน', 'ΣF ทีละช่วง กราฟ และ v² = u² + 2as'],
    ['ด่านท้าทาย', 'มวลและ μ', 'ปรับค่าเอง แล้วค้นพบว่า F = 5f'],
    ['ด่านพิเศษ', 'การเคลื่อนที่แบบโพรเจกไทล์', 'กล่องหยุดที่ที่กั้น แต่ริวกะไม่หยุด'],
    ['บทเรียน (แถม)', 'กฎข้อ 3 และโพรเจกไทล์', 'แรงคู่กิริยา–ปฏิกิริยา และ x = vt, Δy = ½gt²'],
    ['สำหรับครู', 'แบบสอบถามและสรุป', 'แบบสอบถามท้ายเกม (ส่งเข้า Google Sheet ของครู) แล้วตามด้วยหน้าสรุป'],
  ] : [
    ['Start', 'Title screen', 'Students type their name and class, then start — or jump straight to any chapter.'],
    ['Level 1', 'Newton’s 1st law', 'Push the box across frictionless ice so it parks by the flag.'],
    ['Lesson', 'Net force & inertia', 'Why didn’t the box stop when the pushing stopped?'],
    ['Level 1 · round 2', 'Friction', 'The same level, now on a rough floor: f = μmg.'],
    ['Lesson', 'Friction', 'ΣF phase by phase, graphs, and v² = u² + 2as.'],
    ['Challenge', 'Mass and μ', 'Set the values yourself — and discover that F = 5f.'],
    ['Bonus level', 'Projectile motion', 'The box stops at the stopper. Ryuka doesn’t.'],
    ['Bonus lesson', '3rd law & projectiles', 'Action–reaction at the impact; x = vt and Δy = ½gt².'],
    ['For the teacher', 'Feedback & summary', 'The end-of-game feedback form (sent to the teacher’s sheet), then the closing summary.'],
  ];
  const cuts = [[0, m('ch1', -0.1)], [m('ch1', -0.1), m('lesson', -0.1)], [m('lesson', -0.1), m('fric', -0.1)], [m('fric', -0.1), m('fricLesson', -0.1)],
    [m('fricLesson', -0.1), m('sandbox', -0.1)], [m('sandbox', -0.1), m('bonus', -0.1)], [m('bonus', -0.1), m('projLesson', -0.1)],
    [m('projLesson', -0.1), m('feedback', -0.1)], [m('feedback', -0.1), m('end')]];
  cuts.forEach(([a, b], i) => {
    const [k, t, s] = C[i];
    card(k, t, s, null, i === 0 ? 2.6 : 3.0);
    // the closing summary is a still screen full of text: hold it about 3× longer so it can be read
    part(a, b, `${k} · ${t}`, i === cuts.length - 1 ? [[a, m('summary', 1), 1], [m('summary', 1), b, 0.3]] : undefined);
  });

  const outro = T ? ['เปิด index.html ในเบราว์เซอร์ได้เลย', 'ไม่ต้องติดตั้ง ไม่ต้องสมัครบัญชี · ใช้ได้ทั้งคอมพิวเตอร์และแท็บเล็ต',
    'ผลการลองทุกครั้ง คำตอบควิซ และเวลาที่ใช้ในแต่ละบท จะถูกส่งเข้า Google Sheet ของครู'] :
    ['Open index.html in any browser', 'No install, no account — works on computers and tablets.',
      'Every try, quiz answer and minute spent per part goes to the teacher’s Google Sheet.'];
  shots.push({ dur: 6, overlays: [{ html: H.card({ kick: T ? 'เล่นได้ทันที' : 'Try it', title: outro[0], sub: outro.slice(1).map(x => `<div>${x}</div>`).join('') }), x: 0, y: 0, fade: 0.5, anim: 'pop' }] });

  // technique chips, anchored to the moment in the recording
  const tech = T ? [
    ['ch1-slide', 0.3, 'ทำนายก่อน', 'ลงมือผลักก่อนเรียนทฤษฎี'],
    ['ch1-gone1', 0, 'ผิดก่อนแล้วค่อยเรียน', 'กล่องไม่หยุด ความเชื่อเดิมพังต่อหน้าต่อตา'],
    ['ch1-rewind1', -0.2, 'ย้อนเวลา', 'ลองใหม่ได้ทันที ไม่มีบทลงโทษ'],
    ['ch1-sign', 0, 'เวกเตอร์', 'แรงติดลบ = ทิศไปทางซ้าย'],
    ['lesson-misconception', 0, 'เผชิญหน้ากับความเข้าใจผิด', '“ΣF = 0 แปลว่าหยุด” พูดออกมาตรงๆ แล้วพิสูจน์ว่าผิด'],
    ['lesson-fbd', 5, 'แผนภาพวัตถุอิสระ', 'ดูทีละแรง แรงในแกน y หักล้างกัน'],
    ['lesson-push', 0, 'ใช้ตัวเลขของผู้เล่นเอง', 'บทเรียนใช้แรง 40 N ที่นักเรียนผลักจริง'],
    ['lesson-tabs', 2.5, 'การแทนหลายรูปแบบ', 'กราฟ v–t, a–t, x–t ของรอบที่เล่นเอง'],
    ['quiz1', 1, 'ควิซวินิจฉัย', 'ตัวเลือกผิดแต่ละข้อผูกกับความเข้าใจผิด'],
    ['fric-intro', 0, 'เปลี่ยนทีละอย่าง', 'ด่านเดิม เพิ่มแรงเสียดทาน'],
    ['fric-hint', 0, 'คำใบ้แบบขั้นบันได', 'ใบ้เมื่อพลาดครั้งที่ 2 และ 3'],
    ['fric-back', 0, 'ย้อนอ่าน + ย้อนเวลา', 'ย้อนอ่านได้ทุกบรรทัด และย้อนเวลาจากบรรทัดในด่าน'],
    ['fricLesson-phases', 0, 'คิดทีละช่วง', 'ΣF = F − f แล้ว −f แล้ว 0'],
    ['fricLesson-v2', 0, 'คำนวณแทนการเดา', 'v² = u² + 2as ทีละช่วง'],
    ['sandbox-set', 0, 'สนามทดลอง', 'ตั้ง m, μ และ F เอง'],
    ['sandbox-5f', 0, 'ค้นพบรูปแบบ', 'F = 5f เพราะมวลตัดกันหมด'],
    ['bonus-stopper', 0, 'ถ่ายโอนความรู้', 'กฎข้อ 1 ในสถานการณ์ใหม่'],
    ['bonus-try1', 0, 'ทำนายผลทันที', 'ค่าในแผงเปลี่ยนตามสไลเดอร์'],
    ['projLesson', 0.5, 'กฎข้อ 3', 'ขนาดเท่ากัน ทิศตรงข้าม กระทำกับวัตถุคนละก้อน'],
    ['projLesson-dots', 0, 'ภาพแบบสโตรบ', 'แนวราบห่างเท่ากัน แนวดิ่งห่างขึ้น'],
    ['feedback', 0.5, 'ข้อมูลสำหรับครู', 'ทุกการลองและคำตอบส่งเข้า Google Sheet'],
  ] : [
    ['ch1-slide', 0.3, 'Predict first', 'students act before any theory'],
    ['ch1-gone1', 0, 'Productive failure', 'the box never stops — the misconception breaks on screen'],
    ['ch1-rewind1', -0.2, 'Rewind time', 'retry instantly, no penalty'],
    ['ch1-sign', 0, 'Vectors', 'a negative push = a push to the left'],
    ['lesson-misconception', 0, 'Name the misconception', '“ΣF = 0 means it stops”'],
    ['lesson-fbd', 5, 'Free-body diagram', 'one force at a time; y cancels'],
    ['lesson-push', 0, 'Their own numbers', 'the lesson uses the student’s 40 N push'],
    ['lesson-tabs', 2.5, 'Multiple representations', 'v–t, a–t, x–t of their own run'],
    ['quiz1', 1, 'Diagnostic quiz', 'each wrong option = a misconception'],
    ['fric-intro', 0, 'Change one thing', 'same level, add friction'],
    ['fric-hint', 0, 'Graduated hints', 'only after the 2nd and 3rd miss'],
    ['fric-back', 0, 'Back view', 'reread any line; rewind a try from its line'],
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
  // each chip stays 6.5 s, or until just before the next one
  const starts = tech.map(([mk, off]) => m(mk, off));
  const srcOverlays = tech.map(([mk, off, a, b], i) => {
    const f0 = starts[i], next = Math.min(Infinity, ...starts.filter(f => f > f0));
    return { f0, f1: Math.min(f0 + Math.round(6.5*fps), next - Math.round(0.45*fps)), html: `<div style="width:${VIEW.w}px;display:flex;justify-content:flex-end">${H.chip(a, b)}</div>`,
      x: VIEW.x - 4, y: VIEW.y + VIEW.h + 8, fade: 0.4, anim: 'up', rise: 14, z: 3 };
  });
  if (!T){
    srcOverlays.push(...subtitles(ctx, { y: 930, h: 140 }));
    // the English quiz as a 2×2 card over the game's dialogue bar (the subtitles carry that line), clear of the stage
    srcOverlays.push(...quizCards(ctx, { x: 262, y: 684, wide: true }));
    // the closing screens, which the game shows in Thai only
    srcOverlays.push({ f0: m('feedback', 0.5), f1: m('summary'), x: 0, y: 940, fade: 0.3, anim: 'fade',
      html: `<div style="width:1920px;text-align:center">${H.caption('<b>Feedback form</b> — How hard was it? (1–5) · How fun? (1–5) · Which part was hardest? · Anything still unclear? The answers go to the teacher’s sheet.')}</div>` });
    srcOverlays.push({ f0: m('summary', 0.3), f1: m('end'), x: 60, y: 650, fadeIn: 0.3, fadeOut: 0, anim: 'up', z: 5, html: H.sumCard('In English: what Ryuka learned (the hard way)', [
      ['1st law', 'If ΣF = 0 the velocity doesn’t change: an object at rest stays at rest, a moving one keeps moving at constant velocity. So the box on ice never stops by itself.'],
      ['Friction', 'f = μmg points against the motion and slows the box until it stops. It stops because of friction, not because the pushing ended.'],
      ['2nd law', 'ΣF = ma. The net force changes the velocity; it isn’t stored in the object. When the net force ends, the acceleration is 0.'],
      ['Equations of motion', 'For constant a: v = u + at; s = ut + ½at²; v² = u² + 2as — one phase of constant net force at a time.'],
      ['3rd law', 'Box on stopper = stopper on box (equal size, opposite direction), acting on different objects, so they don’t cancel.'],
      ['Projectile', 'x-axis: x = vt (no force); y-axis: Δy = ½gt²; flight time t = √(2h/g) depends only on the height.'],
    ]) });
  }
  return { w: 1920, h: 1080, shots, srcOverlays, music: { file: 'music/calm_long.wav', volume: 0.6 }, cls: T ? 'th' : '' };
};
