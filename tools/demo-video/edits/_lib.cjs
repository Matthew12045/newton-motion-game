/* Shared pieces for the edit scripts: HTML snippets for the overlays (styled in studio.html) and
   helpers to turn the recording's dialogue log into subtitles. */
const { en, quiz, WHO } = require('../subs-en.cjs');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const WHO_CLS = { 'ริวกะ': 'ryuka', 'ยูอัน': 'yuan', 'เคย์': 'kay' };

const H = {
  sub(who, text, w = 1920, h = 170){
    const long = text.length > 150 ? ' long' : '';
    const chip = who ? `<span class="who ${WHO_CLS[who] || ''}">${esc(WHO[who] || who)}</span>` : '';
    return `<div class="band" style="width:${w}px;height:${h}px"><div class="sub${long}">${chip}${esc(text)}</div></div>`;
  },
  chip(label, sub){ return `<span class="chip">${esc(label)}${sub ? ` <i>· ${esc(sub)}</i>` : ''}</span>`; },
  // the label is upper-cased by CSS, which would turn μ into a capital Mu that reads as M
  chap(text){ return `<span class="chap">${esc(text).replace(/μ/g, '<span style="text-transform:none">μ</span>')}</span>`; },
  card({ kick, title, sub, thai, w = 1920, h = 1080 }){
    return `<div class="card" style="width:${w}px;height:${h}px">${kick ? `<div class="kick">${esc(kick)}</div>` : ''}
      <h1>${title}</h1><div class="rule"></div>${sub ? `<h2>${sub}</h2>` : ''}${thai ? `<div class="thai">${esc(thai)}</div>` : ''}</div>`;
  },
  col({ num, tag, title, body, bullets, law, w = 470 }){
    return `<div class="col" style="width:${w}px">${num ? `<div class="num">${num}</div>` : ''}${tag ? `<div class="tag">${esc(tag)}</div>` : ''}
      <h3>${title}</h3>${body ? `<p>${body}</p>` : ''}${law ? `<div class="law">${law}</div>` : ''}
      ${bullets ? `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}</div>`;
  },
  caption(html){ return `<div class="caption">${html}</div>`; },
  ring(label, side = 'top'){
    const lab = label ? `<div class="ringLabel" style="${side === 'top' ? 'left:0;top:-52px' : side === 'bottom' ? 'left:0;bottom:-52px' : side === 'left' ? 'right:calc(100% + 16px);top:0' : 'left:calc(100% + 16px);top:0'}">${esc(label)}</div>` : '';
    return `<div class="ring" style="left:-10px;top:-10px;width:calc({w}px + 20px);height:calc({h}px + 20px)"></div>${lab}`;
  },
  big(html){ return `<div class="big">${html}</div>`; },
  mid(html){ return `<div class="mid">${html}</div>`; },
  pill(t){ return `<span class="pill">${esc(t)}</span>`; },
  prog(n, i){ return `<div class="prog">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>`; },
  brand(lang){
    return lang === 'th' ? `<div class="brand"><b>ริวกะกับกล่องที่ไม่ยอมหยุด</b> · เกมสอนกฎการเคลื่อนที่ของนิวตัน</div>`
      : `<div class="brand"><b>Ryuka and the Box That Wouldn’t Stop</b> · a game about Newton’s laws</div>`;
  },
  quiz(q, opts, lang = 'en', wide = false){
    return `<div class="quiz${wide ? ' wide' : ''}"><div class="qh">${lang === 'th' ? 'คำถาม' : 'On the board'}</div><div class="qq">${esc(q)}</div>
      ${opts.map((o, i) => `<div class="qo"><b>${'ABCD'[i]}</b>${esc(o)}</div>`).join('')}</div>`;
  },
  // the game's closing summary in English: six [title, text] tiles in the game's 3×2 order
  sumCard(head, tiles){
    return `<div class="quiz sumEN"><div class="qh">${esc(head)}</div><div class="sg">${tiles.map(([t, x]) => `<div><b>${esc(t)}</b> ${esc(x)}</div>`).join('')}</div></div>`;
  },
  vhead(kick, title){ return `<div class="vhead">${kick ? `<div class="kick">${esc(kick)}</div>` : ''}<h1>${title}</h1></div>`; },
  vcap(html){ return `<div class="vcap"><div>${html}</div></div>`; },
};

const QUIZ_OPTS = {
  'หลังจากมือหลุด': ['It slows down as the push stored in the box runs out', 'It moves at constant velocity, because the net force is zero',
    'It stops at once, because nobody is pushing', 'It keeps speeding up, because some acceleration is left'],
  'ขณะที่กล่องกำลังไถล': ['Forward, the way the box is moving', 'Backward, against the motion', 'Zero, since nobody pushes any more', 'It keeps changing with the speed'],
  'ถ้าเพิ่มความเร็วกล่อง': ['2× longer in the air, lands 4× farther', 'Same time in the air, lands 2× farther', 'Half the time, because she’s faster', 'Same time, lands on the same spot'],
  'ตอนกล่องชนที่กั้น แรงที่': ['The box pushes harder — it rammed the stopper', 'The stopper pushes harder, because the box stops', 'Equal size, opposite directions, on different objects', 'They cancel to zero, so nothing happens'],
};

/* subtitles for every dialogue line in [f0, f1] of the recording (source-anchored overlays). A line the
   game replaces within 1.5 s by the same speaker is merged with the next one, so it stays readable. */
function subtitles(ctx, o = {}){
  const out = [], tl = ctx.timeline();
  for (let i = 0; i < tl.length; i++){
    const L = tl[i];
    let text = en(L.line), f1 = L.f1;
    if (!text) { console.warn('no subtitle for', L.line.slice(0, 40)); continue; }
    const N = tl[i + 1];
    if (f1 - L.f0 < 1.5*ctx.fps && N && N.who === L.who && N.f0 === f1 && en(N.line)){ text += ' ' + en(N.line); f1 = N.f1; i++; }
    out.push({ f0: L.f0, f1, sub: true, html: H.sub(L.who, text, o.w, o.h), x: o.x || 0, y: o.y ?? 905, fade: 0.18, anim: 'fade' });
  }
  return out;
}
/* the English quiz next to the board, while each quiz is up */
function quizCards(ctx, o = {}){
  const out = [];
  for (const p of ctx.periods('board')){
    const k = Object.keys(QUIZ_OPTS).find(k => (p.v || '').startsWith(k));
    if (!k) continue;
    const q = quiz(p.v).replace(/^Quiz: (.)/, (_, c) => c.toUpperCase());
    out.push({ f0: p.f0, f1: p.f1, html: H.quiz(q, QUIZ_OPTS[k], 'en', !!o.wide), x: o.x ?? 40, y: o.y ?? 120, fade: 0.3, anim: o.wide ? 'up' : 'left', z: 5 });
  }
  return out;
}

module.exports = { H, esc, subtitles, quizCards, QUIZ_OPTS };
