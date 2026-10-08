/* Version 5: a 30-second intro for opening a presentation — clean and light, in the white-paper look the
   game shares with the Phase II slides (ink type, a red accent, the slides' grey heading bar and thin rule;
   the game's ice, teal box and velocity arrow). One short line per beat; every cut is on a beat of
   bright.wav (112 BPM), and the 56 beats come to exactly 30 s.

     0–6.4     card: Ryuka rides the box across the ice at constant speed — "what if you stop pushing?"
     6.0–10.2  the first push, from the hop: it sails past the flag and won't stop
     10.2–11.3 the game's VHS rewind
     11.3–16.1 friction: the box finally parks
     16.1–20.9 Ryuka launched onto the cushion (no caption)
     20.3–30   end card: title, red subtitle, rule, the cast on the ice (holds to the last frame) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const BEAT = 60/112;                                   // one beat of bright.wav, in seconds
const FULL = { x: 0, y: 0, w: 1920, h: 1080 };
// the stage only (no panel, title, legend or dialogue bar), wide enough for both the VHS label on the left
// and the floor labels on the right; floor at output y 900
const Z = 1.47;
const C = { cx: 680, cy: 460, z: Z };
const C5 = { cx: 640, cy: 460, z: 1.5 };               // the projectile scene (the box starts further left)
const FLOOR = 900;

// the game's transparent full-body sprites (const ART in index.html)
function gameArt(){
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const i = src.indexOf('const ART = {'), j = src.indexOf('\n};', i);
  if (i < 0 || j < 0) throw new Error('const ART not found in index.html');
  const art = {};
  for (const [, k, uri] of src.slice(i, j).matchAll(/(\w+)\s*:\s*'(data:image\/webp;base64,[A-Za-z0-9+/=]+)'/g)) art[k] = uri;
  for (const k of ['ryuka', 'yuan', 'kay']) if (!art[k]) throw new Error('ART.' + k + ' missing from index.html');
  return art;
}

module.exports = (ctx, lang = 'en') => {
  const { m, fps } = ctx;
  const T = lang === 'th';
  const art = gameArt();
  const sec = s => Math.round(s*fps);
  // a source range played over exactly `dur` seconds (so the cut lands on its beat)
  const fit = (a, b, dur, what, lo = 0.9, hi = 1.2) => {
    const sp = (b - a)/fps/dur;
    if (sp < lo || sp > hi) console.warn(`intro: ${what} plays at ×${sp.toFixed(2)} to fit ${dur.toFixed(2)} s`);
    return [[a, b, sp]];
  };
  const at = (src, t0) => f => t0 + (f - src[0][0])/fps/src[0][2];   // output time of a source frame in a shot

  const t = T ? {
    q: 'เลิกผลักแล้ว กล่องจะ<em>หยุดไหม</em>?',
    a: 'มัน<em>ไม่ยอมหยุด</em>!',
    b: 'ผิดได้ <em>ลองใหม่</em>ได้',
    c: 'หา<em>แรงที่พอดี</em>ด้วยตัวเอง',
    title: 'ริวกะกับกล่องที่ไม่ยอมหยุด', red: 'กฎการเคลื่อนที่ของนิวตัน', small: 'Ryuka and the Box That Wouldn’t Stop',
    y: { title: 172, red: 300, rule: 386, small: 412 }, rule: 1080,
  } : {
    q: 'What happens when you <em>stop pushing</em>?',
    a: 'It <em>won’t stop</em>!',
    b: 'Rewind. <em>Try again.</em>',
    c: 'Find the <em>right force</em>.',
    title: 'Ryuka and the Box<br>That Wouldn’t Stop', red: 'Newton’s laws of motion', small: 'ริวกะกับกล่องที่ไม่ยอมหยุด',
    y: { title: 118, red: 334, rule: 420, small: 444 }, rule: 840,
  };

  const shots = [];

  // 1 · card: the ice and the rider at exactly the footage's scale under camera C, so the card's ice turns
  // into the game's ice in the crossfade. Ryuka rides the box across at one steady speed, the velocity arrow
  // riding along; she is already in frame on frame 0 (what a slide shows before the video plays).
  const CARD1 = 12*BEAT, X2 = 0.4;
  const rider = `<div class="rider" style="zoom:${Z}"><img src="${art.ryuka}" alt=""><div class="tbox">กล่อง</div><div class="vel"><i></i>v = 2.19 m/s</div></div>`;
  shots.push({ dur: CARD1, fadeOut: X2, overlays: [
    { html: `<div class="iceS" style="width:${Math.ceil(1920/Z)}px;zoom:${Z}"></div>`, x: 0, y: FLOOR, fadeIn: 0, fadeOut: 0, anim: 'fade' },
    { html: rider, x: 140, y: FLOOR - Z*313, fadeIn: 0, fadeOut: 0, anim: 'fade', move: [[0, { x: 140 }], [6.0, { x: 1930 }]] },
    // on from frame 0, fading out with the card (the stage behind it is empty sky by then)
    { html: `<div class="hd q1">${t.q}</div>`, x: 160, y: 200, fadeIn: 0, fadeOut: 0, rise: 18 },
  ] });

  // 2 · the first push, on the stage only, from the moment Play is clicked (the free-body diagram has just
  // gone): Ryuka hops on, pushes, lets go — and it sails past the flag. Cut once the box has left the frame.
  const R = m('ch1-release1');
  const T2 = CARD1 - X2, src2 = fit(R - sec(1.2), R + sec(2.95), 19*BEAT - T2, 'the first push');
  shots.push({ src: src2, view: FULL, xin: X2, cam: C });

  // 3 · the game's own VHS rewind, cut in on its first frame (so the hit is on the beat) and out before the
  // free-body diagram comes back
  const rw = ctx.periods('rewind').find(p => p.v && p.f1 >= m('ch1-rewind1'));
  if (!rw) throw new Error('intro: no rewind period around ch1-rewind1');
  shots.push({ src: fit(rw.f0, rw.f1 - 2, 2*BEAT, 'the rewind'), view: FULL, cam: C });

  // 4 · friction: hop on, push, it parks by the flag, thumbs up (cut on the hop — a match on action)
  const S = m('fric-success');
  const src4 = fit(S - sec(3.58), S + sec(1.24), 9*BEAT, 'the friction try');
  shots.push({ src: src4, view: FULL, cam: C, steady: [520, 700, 1100, 1320] });   // steadied on the flag

  // 5 · launch: Ryuka onto the cushion in the game's slow motion, opening just before Play and holding the
  // landing (busy everywhere, so no caption)
  const S5 = m('bonus-success');
  shots.push({ src: fit(S5 - sec(2.80), S5 + sec(2.02), 9*BEAT, 'the launch'), view: FULL, cam: C5, steady: [408, 450, 800, 860] });   // steadied on the top of the flag pole

  // 6 · end card, in the slides' title layout over the game's title-screen cast row. The ice comes in with
  // the cast (never under the footage's own floor in the dissolve). Nothing fades out, so the last frame
  // (what a slideshow keeps showing) is the whole card.
  const cast = (html, cx, t0) => ({ html: `<div class="cast1">${html}</div>`, x: cx - 150, y: 900 - 400, at: t0, fade: 0.4, fadeOut: 0, anim: 'pop', origin: '50% 100%' });
  const X6 = 0.6, BAR = 4*BEAT;
  shots.push({ dur: 56*BEAT - (39*BEAT - X6), xin: X6, overlays: [
    { html: '<div class="paper"></div>', x: 0, y: 0, fadeIn: 0, fadeOut: 0, anim: 'fade', z: -2 },
    { html: `<div class="endT">${t.title}</div>`, x: 0, y: t.y.title, at: 0.6, fadeIn: 0.5, fadeOut: 0, rise: 18 },
    { html: `<div class="endR">${t.red}</div>`, x: 0, y: t.y.red, at: 0.6 + BAR/4, fadeIn: 0.45, fadeOut: 0, rise: 14 },
    { html: `<div class="endRule" style="width:${t.rule}px"></div>`, x: 960 - t.rule/2, y: t.y.rule, at: 0.6 + BAR*3/8, fadeIn: 0.45, fadeOut: 0, anim: 'fade' },
    { html: `<div class="endS">${t.small}</div>`, x: 0, y: t.y.small, at: 0.6 + BAR/2, fadeIn: 0.45, fadeOut: 0, rise: 10 },
    { html: `<div class="iceS" style="width:1160px"></div>`, x: 380, y: 900, at: 0.6 + BAR, fade: 0.4, fadeOut: 0, anim: 'fade', z: -1 },
    cast(`<img src="${art.yuan}" alt="" style="height:276px">`, 617, 0.6 + BAR),
    cast(`<img src="${art.ryuka}" alt="" style="height:206px"><div class="cbox">กล่อง</div>`, 960, 0.6 + BAR*5/4),
    cast(`<img src="${art.kay}" alt="" style="height:256px">`, 1283, 0.6 + BAR*3/2),
  ] });

  // captions: one short line each, centred in the empty sky of the stage (clear of the VHS label and the
  // thumbs up), each gone before the next cut or caption
  const cap = (html, t0, t1) => ({ html: `<div style="width:1920px;display:flex;justify-content:center"><div class="cap2">${html}</div></div>`, x: 0, y: 150, t0, t1, fade: 0.3, rise: 18 });
  // the game's level title sits just above camera C's top edge; a white hairline keeps its lowest pixels out
  const mask = (t0, t1) => ({ html: '<div style="width:1920px;height:4px;background:#fff"></div>', x: 0, y: 0, t0, t1, fade: 0, anim: 'fade', z: 5 });
  const overlays = [
    mask(T2, 19*BEAT), mask(21*BEAT, 30*BEAT),
    cap(t.a, at(src2, T2)(R + sec(0.9)), 19*BEAT - 0.15),
    cap(t.b, 19*BEAT + 0.05, 21*BEAT + 0.65),            // the rewind, then the first moment of the new try
    cap(t.c, 21*BEAT + 1.15, at(src4, 21*BEAT)(S - sec(0.15))),   // gone just before the thumbs up
  ];

  return { w: 1920, h: 1080, shots, overlays, music: { file: 'music/bright.wav', volume: 0.8 }, cls: T ? 'light th' : 'light' };
};
