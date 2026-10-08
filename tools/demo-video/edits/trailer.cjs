/* Version 3: a ~1-minute trailer — full-frame footage, fast cuts, big captions, upbeat music. */
const { H } = require('./_lib.cjs');

const FULL = { x: 0, y: 0, w: 1920, h: 1080 };

module.exports = (ctx, lang = 'en') => {
  const { m } = ctx;
  const T = lang === 'th';
  const shots = [];
  // a clip with a caption; text: [big|mid, html]
  const clip = (a, b, sp, text, o = {}) => {
    const ov = [];
    if (text){
      const [kind, html] = text;
      ov.push({ html: `<div style="width:1920px;display:flex;justify-content:center;padding:0 140px">${H[kind](html)}</div>`,
        x: 0, y: o.ty ?? (kind === 'big' ? 790 : 840), at: o.at ?? 0.15, fade: 0.28, anim: 'pop', rise: 0 });
    }
    shots.push({ src: [[a, b, sp]], view: FULL, cam: o.cam, xin: o.xin ?? 0.25, overlays: ov.concat(o.extra || []) });
  };
  const t = T ? {
    a: ['mid', 'ริวกะอยากให้กล่อง<em>จอดหน้าธง</em>'], b: ['big', 'ผลักเลย!'], c: ['big', 'แต่มัน<em>ไม่หยุด</em>'], d: ['big', 'ย้อนเวลา'],
    e: ['mid', 'ทำไมเลิกผลักแล้ว<em>ยังไม่หยุด?</em>'], f: ['mid', 'บทเรียนจาก<em>ตัวเลขของเราเอง</em>'], g: ['mid', 'ตอบผิด<em>ก็ได้เรียน</em>'],
    h: ['mid', 'เพิ่มแรงเสียดทาน → <em>จอดได้แล้ว</em>'], i: ['mid', 'ย้อนกลับไป<em>บรรทัดไหนก็ได้</em>'], j: ['mid', 'ค้นพบกฎเอง: <em>F = 5f</em>'],
    k: ['mid', 'แล้วก็… <em>ส่งริวกะลอยไปลงเบาะ</em>'], s: ['mid', 'เคย์แก้ปัญหาด้วย<em>ที่กั้น</em>…'], l: ['mid', 'กฎข้อ 3 · <em>โพรเจกไทล์</em>'], n: ['mid', 'กฎของนิวตัน <em>เรียนแบบเจ็บตัว</em>'],
    end: ['เกมฟิสิกส์บนเบราว์เซอร์', 'ริวกะกับกล่อง<br>ที่ไม่ยอมหยุด', 'เปิด index.html แล้วเล่นได้เลย · กฎการเคลื่อนที่ของนิวตัน'],
  } : {
    a: ['mid', 'Ryuka needs her box <em>parked by the flag</em>.'], b: ['big', 'Push it.'], c: ['big', 'It <em>never stops</em>.'], d: ['big', 'Rewind time.'],
    e: ['mid', 'Why didn’t it stop <em>when you stopped pushing?</em>'], f: ['mid', 'A lesson built from <em>your own push</em>.'], g: ['mid', 'Wrong answers <em>teach too</em>.'],
    h: ['mid', 'Add friction → <em>it finally parks</em>.'], i: ['mid', 'Rewind from <em>any line</em>.'], j: ['mid', 'Discover the rule: <em>F = 5f</em>.'],
    k: ['mid', 'Then… <em>launch Ryuka</em>.'], s: ['mid', 'Kay’s fix: <em>a stopper</em>…'], l: ['mid', '3rd law · <em>projectile motion</em>'], n: ['mid', 'Newton’s laws, <em>learned the hard way</em>.'],
    end: ['A browser game about Newton’s laws', 'Ryuka and the Box<br>That Wouldn’t Stop', 'Open index.html and play — no install · story in Thai'],
  };
  clip(m('ch1', 0.6), m('ch1', 3.4), 1.0, t.a, { cam: [[0, { cx: 600, cy: 560, z: 1.6 }], [1, { cx: 660, cy: 540, z: 1.45 }]], xin: 0, ty: 880 });
  clip(m('ch1-slide', 0.2), m('ch1-push1', 0.9), 1.5, t.b, { cam: [[0, { cx: 1300, cy: 420, z: 1.2 }], [1, { cx: 1000, cy: 520, z: 1.05 }]] });
  clip(m('ch1-release1', -0.2), m('ch1-gone1', 1.6), 1.1, t.c, { at: 1.0 });
  clip(m('ch1-rewind1', -0.1), m('ch1-rewind1', 1.6), 1.0, t.d);
  clip(m('lesson-misconception', 0.2), m('lesson-misconception', 3.0), 1.0, t.e, { cam: [[0, { cx: 960, cy: 540, z: 1 }], [1, { cx: 900, cy: 600, z: 1.08 }]] });
  clip(m('lesson-tabs', 2.0), m('lesson-tabs', 9.0), 1.6, t.f, { cam: [[0, { cx: 1438, cy: 470, z: 1.5 }], [1, { cx: 1438, cy: 470, z: 1.6 }]], ty: 870 });
  clip(m('quiz1', 3.6), m('quiz1-wrong', 2.4), 1.4, t.g, { cam: [[0, { cx: 1438, cy: 470, z: 1.45 }], [1, { cx: 1438, cy: 470, z: 1.55 }]], ty: 870 });
  clip(m('fric-rewind', 1.4), m('fric-success', 1.2), 1.15, t.h, { cam: [[0, { cx: 640, cy: 520, z: 1.5 }], [1, { cx: 660, cy: 520, z: 1.45 }]], ty: 120 });
  clip(m('fric-back', -0.1), m('fric-type', 2.2), 1.9, t.i);
  clip(m('sandbox-5f', 0.2), m('sandbox-5f', 3.4), 1.0, t.j, { cam: [[0, { cx: 900, cy: 760, z: 1.2 }], [1, { cx: 880, cy: 780, z: 1.3 }]], ty: 140 });
  clip(m('bonus-stopper', 2.4), m('bonus-oops', 1.2), 1.4, t.s, { ty: 120, cam: [[0, { cx: 640, cy: 500, z: 1.45 }], [1, { cx: 660, cy: 500, z: 1.5 }]] });
  clip(m('bonus-try2', 1.6), m('bonus-success', 1.0), 1.0, t.k, { cam: [[0, { cx: 640, cy: 480, z: 1.45 }], [1, { cx: 640, cy: 500, z: 1.45 }]], at: 0.2, ty: 120 });
  clip(m('projLesson-dots', 0.3), m('projLesson-dots', 3.8), 1.0, t.l, { cam: [[0, { cx: 660, cy: 520, z: 1.45 }], [1, { cx: 640, cy: 540, z: 1.55 }]] });
  clip(m('summary', 0.3), m('summary', 4.2), 1.0, t.n, { cam: [[0, { cx: 960, cy: 520, z: 1.12 }], [1, { cx: 960, cy: 540, z: 1.0 }]] });
  shots.push({ freeze: 60, view: FULL, filter: 'blur(8px) brightness(.32) saturate(.8)', dur: 6.5, xin: 0.5,
    cam: [[0, { cx: 960, cy: 540, z: 1.0 }], [1, { cx: 960, cy: 540, z: 1.06 }]],
    overlays: [{ html: H.card({ kick: t.end[0], title: t.end[1], sub: t.end[2] }), x: 0, y: 0, fade: 0.5, anim: 'pop' }] });
  return { w: 1920, h: 1080, shots, music: { file: 'music/bright.wav', volume: 0.85 }, cls: T ? 'th' : '' };
};
