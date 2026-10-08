/* Version 4: a vertical (9:16) short for Reels / TikTok / Shorts — a window onto the game that follows
   the action, a fixed title on top and one big caption per beat underneath. Everything stays out of
   the top ~220 px and bottom ~380 px, where the apps draw their own tabs, names and buttons. */
const { H } = require('./_lib.cjs');

const VIEW = { x: 0, y: 420, w: 1080, h: 900 };
const STAGE = (cx = 620) => ({ cx, cy: 540, z: 1 });    // the window shows 1296×1080 of the recording
const PANEL = { cx: 1380, cy: 540, z: 1 };

module.exports = (ctx, lang = 'en') => {
  const { m } = ctx;
  const T = lang === 'th';
  const shots = [];
  const beat = (a, b, sp, cap, cam, o = {}) => shots.push({ src: [[a, b, sp]], view: VIEW, cam, xin: o.xin ?? 0.25,
    overlays: cap ? [{ html: H.vcap(cap), x: 0, y: o.cy ?? 1350, at: 0.1, fade: 0.25, anim: 'pop' }] : [] });
  const c = T ? [
    'ผลักกล่องให้ไป<em>จอดหน้าธง</em>', 'เลิกผลักแล้ว… <em>ทำไมไม่หยุด?!</em>', '<em>ย้อนเวลา</em> ลองใหม่', 'ΣF = 0 ไม่ได้แปลว่าหยุด<br><em>แต่แปลว่าความเร็วคงที่</em>',
    'กราฟจาก<em>รอบที่เล่นเอง</em>', 'เพิ่ม<em>แรงเสียดทาน</em> → จอดได้แล้ว', 'ค้นพบเอง: <em>F = 5f</em>', 'แล้วส่ง<em>ริวกะลอยไปลงเบาะ</em>'] : [
    'Push the box. <em>Park it by the flag.</em>', 'You stopped pushing… <em>why won’t it stop?!</em>', '<em>Rewind time.</em> Try again.', 'ΣF = 0 doesn’t mean stop. <em>It means constant velocity.</em>',
    'Graphs of <em>your own push</em>.', 'Add <em>friction</em> → it finally parks.', 'Find the pattern: <em>F = 5f</em>.', 'Then launch Ryuka <em>onto the cushion</em>.'];
  // set the force, then the push itself under "Push the box"; "You stopped pushing" starts at the release
  beat(m('ch1-slide', -0.4), m('ch1-release1', 0), 1.3, c[0], [[0, PANEL], [0.4, PANEL], [0.6, STAGE(560)], [1, STAGE(560)]], { xin: 0 });
  beat(m('ch1-release1', 0), m('ch1-gone1', 1.0), 1.15, c[1], [[0, STAGE(560)], [0.5, STAGE(900)], [1, STAGE(1000)]], { xin: 0 });
  beat(m('ch1-rewind1', -0.1), m('ch1-rewind1', 1.8), 1.0, c[2], [[0, STAGE(900)], [1, STAGE(560)]]);
  beat(m('lesson-push', 0.4), m('lesson-push', 6.0), 1.3, c[3], [[0, { cx: 1400, cy: 470, z: 1.05 }], [1, { cx: 1400, cy: 470, z: 1.1 }]]);
  beat(m('lesson-tabs', 2.0), m('lesson-tabs', 9.6), 1.5, c[4], [[0, { cx: 1420, cy: 470, z: 1.1 }], [1, { cx: 1420, cy: 470, z: 1.14 }]]);
  beat(m('fric-rewind', 1.4), m('fric-success', 1.4), 1.2, c[5], [[0, STAGE(560)], [0.5, STAGE(760)], [1, STAGE(760)]]);
  beat(m('sandbox-5f', 0.2), m('sandbox-5f', 4.0), 1.0, c[6], [[0, { cx: 680, cy: 540, z: 1 }], [1, { cx: 680, cy: 540, z: 1 }]]);
  beat(m('bonus-try2', 1.8), m('bonus-success', 1.2), 1.0, c[7], [[0, STAGE(520)], [0.5, STAGE(600)], [1, STAGE(640)]]);
  shots.push({ freeze: 60, view: { x: 0, y: 0, w: 1080, h: 1920 }, filter: 'blur(10px) brightness(.32)', dur: 5.5, xin: 0.5,
    cam: [[0, { cx: 960, cy: 540, z: 1.0 }], [1, { cx: 960, cy: 540, z: 1.05 }]],
    overlays: [{ html: H.card({ w: 1080, h: 1920, kick: T ? 'เกมฟิสิกส์บนเบราว์เซอร์' : 'Free browser game',
      title: T ? 'ริวกะกับกล่อง<br>ที่ไม่ยอมหยุด' : 'Ryuka and the Box That Wouldn’t Stop',
      sub: T ? 'กฎการเคลื่อนที่ของนิวตัน<br>เรียนแบบเจ็บตัว' : 'Newton’s laws of motion,<br>learned the hard way' }), x: 0, y: 0, fade: 0.5, anim: 'pop' }] });
  const overlays = [{ html: H.vhead(T ? 'เกมฟิสิกส์' : 'Physics game', T ? 'ริวกะกับกล่องที่ไม่ยอมหยุด' : 'Ryuka & the box that wouldn’t stop'),
    x: 0, y: 230, t0: 0, t1: -5.3, fade: 0.4, anim: 'fade' }];
  return { w: 1080, h: 1920, shots, overlays, music: { file: 'music/bright.wav', volume: 0.85 }, cls: T ? 'th' : '' };
};
