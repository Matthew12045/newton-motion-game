/* The demo playthrough: every chapter of the game, played the way the game wants to be played —
   get it wrong first, rewind, read the lesson built from your own numbers, answer the quizzes (a
   wrong pick on quiz 1 and quiz 4 on purpose to show the targeted feedback), use the back view to rewind a try, and finish
   with the feedback form and the summary.

     node tools/demo-video/scenario.cjs <workdir> [--dry]

   writes <workdir>/raw/full.mp4 (1920×1080, 30 fps) and <workdir>/raw/full.json (what was on screen
   at every frame + named marks the editor cuts on). */
const path = require('path');
const { Recorder } = require('./recorder.cjs');

const WORK = path.resolve(process.argv[2] || '.');
const DRY = process.argv.includes('--dry');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

(async () => {
  const r = new Recorder({ out: path.join(WORK, 'raw', DRY ? 'dry' : 'full'), assets: path.join(WORK, 'assets'), dry: DRY });
  await r.start();

  // read the current line for as long as a viewer needs, then click on to the next one
  const readTime = s => clamp(1.7 + s.line.length*0.038, 2.6, 6.8);
  async function next(o = {}){
    await r.until(s => s.next, 60, 'next button');
    await r.wait(o.sec ?? readTime(r.state) + (o.extra || 0));
    if (o.before) await o.before();
    await r.clickSel('#next', { sec: 0.45 });
  }
  // keep reading until a line matching re is up (not clicked); hooks: { regex-source: async () => {} }
  async function talkUntil(re, hooks = {}, timeout = 240){
    const end = r.frame + timeout*r.fps;
    while (true){
      await r.until(s => s.next || s.choices.length || re.test(s.line), 90, 'a line');
      if (re.test(r.state.line)) return;
      if (r.frame > end) throw new Error('talkUntil timeout ' + re);
      const h = Object.keys(hooks).find(k => new RegExp(k).test(r.state.line));
      const line = r.state.line;
      if (h){ const fn = hooks[h]; delete hooks[h]; await fn(); }
      else if (!r.state.next && r.state.choices.length)    // a choice nobody handles would spin here forever
        throw new Error(`talkUntil ${re}: unexpected choice "${r.state.line.slice(0, 60)}" (${r.state.choices.join(' / ')})`);
      if (r.state.line === line && r.state.next) await next();
    }
  }
  const prompt = re => r.untilLine(re, 90);
  const settle = (s = 0.6) => r.wait(s);

  /* ---------------- title ---------------- */
  r.mark('title');
  await r.wait(3.2);
  await r.clickSel('#whoName');
  await r.type('เดโม', 4);
  await r.clickSel('#whoRoom');
  await r.type('ม.4/1', 4);
  await r.wait(0.7);
  r.mark('start');
  await r.clickSel('#start');

  /* ---------------- level 1: ice ---------------- */
  r.mark('ch1');
  await prompt(/ผลักกล่องให้ไปจอด/);
  await r.wait(2.2);
  r.mark('ch1-slide');
  await r.slide('F', 120);
  await settle(0.8);
  r.mark('ch1-push1');
  await r.clickSel('#playBtn');
  await prompt(/หยุดผลักได้เลย/);
  r.mark('ch1-release1');
  await prompt(/ทำไมมันไม่หยุด/);
  r.mark('ch1-gone1');
  await next({ extra: 0.6 });
  await prompt(/จะลองผลักใหม่/);
  await r.wait(2.6);
  r.mark('ch1-choice');
  await r.clickText('.choice', 'ย้อนเวลา');
  r.mark('ch1-rewind1');
  await r.until(s => !s.rewind && /ผลักกล่องให้ไปจอด/.test(s.line), 30, 'rewind done');
  await r.wait(1.2);
  r.mark('ch1-neg');
  await r.slide('F', -80, 1.1);
  await settle(0.8);
  await r.clickSel('#playBtn');
  await prompt(/ทำไมผลักไปทางซ้าย/);
  await talkUntil(/ผลักกล่องให้ไปจอด/, {
    'แรงมีทิศทาง': async () => { r.mark('ch1-sign'); },
    'ย้อนเวลาให้': async () => { await next(); r.mark('ch1-rewind2'); }
  });
  await r.wait(1.2);
  r.mark('ch1-push2');
  await r.slide('F', 40, 1.1);
  await settle(0.8);
  await r.clickSel('#playBtn');
  await prompt(/ทำไมมันไม่หยุด/);
  r.mark('ch1-gone2');
  await next();
  await prompt(/ไปดูกันว่าเพราะอะไร/);
  r.mark('ch1-why');
  await next({ extra: 0.5 });

  /* ---------------- lesson: net force & inertia ---------------- */
  await prompt(/เหมือนจะมีอะไรหายไป/);
  r.mark('lesson');
  await talkUntil(/ตอบคำถามบนกระดาน/, {
    'คงจะจำว่าแค่': async () => r.mark('lesson-misconception'),
    'จากสมการที่คุ้นเคย': async () => r.mark('lesson-fbd'),
    'ตอนที่ผลักอยู่': async () => r.mark('lesson-push'),
    'ในเมื่อไม่มีใครผลัก': async () => r.mark('lesson-question'),
    'ไม่ต้องมีแรงมาคอยดัน': async () => r.mark('lesson-graph'),
    'ลองกดปุ่ม': async () => {
      r.mark('lesson-tabs');
      await r.wait(2.4);
      await r.clickSel('#board .gtabs button[data-k="a"]');
      await r.wait(3.2);
      await r.clickSel('#board .gtabs button[data-k="x"]');
      await r.wait(3.4);
      await r.clickSel('#board .gtabs button[data-k="v"]');
      await r.wait(1.0);
    },
    'รถเข็นที่ซูเปอร์': async () => r.mark('lesson-law'),
  });
  r.mark('quiz1');
  await r.wait(4.5);
  await r.clickSel('#board .opt[data-i="0"]');
  r.mark('quiz1-wrong');
  await r.wait(0.4);
  await next({ extra: 0.8 });
  await prompt(/ตอบคำถามบนกระดาน/);
  await r.wait(1.6);
  await r.clickSel('#board .opt[data-i="1"]');
  r.mark('quiz1-right');
  await next();

  /* ---------------- level 1 again: friction ---------------- */
  await prompt(/งั้นมาลองกันเลย/);
  r.mark('fric');
  await next();
  await r.until(s => !s.rewind && /μ = 0.10/.test(s.line), 30, 'friction intro');
  r.mark('fric-intro');
  await talkUntil(/คราวนี้ต้องจอดหน้าธง/);
  await r.wait(1.2);
  r.mark('fric-try1');
  await r.slide('F', 120);
  await settle(0.6);
  await r.clickSel('#playBtn');
  await prompt(/จอดก่อนถึงจุดจอด|เลยจุดจอด|ไถลเลยธง/);
  r.mark('fric-miss1');
  await next();
  await prompt(/คราวนี้ต้องจอดหน้าธง/);
  await r.wait(1.0);
  r.mark('fric-try2');
  await r.slide('F', 260, 1.0);
  await settle(0.6);
  await r.clickSel('#playBtn');
  await prompt(/ใบ้ให้/);
  r.mark('fric-hint');
  await next({ extra: 1.0 });
  await prompt(/คราวนี้ต้องจอดหน้าธง/);
  await r.wait(1.4);
  // the back view: reread the hint, then change the value there to rewind time and retry from that line
  r.mark('fric-back');
  await r.clickSel('#backBtn');            // the hint again
  await r.wait(4.2);
  await r.clickSel('#hprev');               // the line the 260 N try was pushed from: its panel is live
  await r.wait(2.8);
  r.mark('fric-type');
  await r.typeNum('F', 196);
  r.mark('fric-rewind');
  await r.wait(0.4);
  await r.clickSel('#playBtn');
  await r.until(s => s.thumb, 40, 'friction success');
  r.mark('fric-success');
  await next({ extra: 0.6 });

  /* ---------------- lesson: friction ---------------- */
  await r.until(s => /พาร์ทสอน : แรงเสียดทาน/.test(s.title), 20, 'friction lesson');
  r.mark('fricLesson');
  await talkUntil(/ตอบคำถามบนกระดาน/, {
    'ตอนผลัก ต้องออกแรงมากกว่า': async () => r.mark('fricLesson-phases'),
    'สรุปว่ากล่องหยุดเพราะ': async () => r.mark('fricLesson-graph'),
    'ลองกดดูกราฟ x–t': async () => {
      await r.wait(2.2);
      await r.clickSel('#board .gtabs button[data-k="x"]');
      await r.wait(3.6);
    },
    'ใช้สูตร v²': async () => r.mark('fricLesson-v2'),
  });
  r.mark('quiz2');
  await r.wait(4.2);
  await r.clickSel('#board .opt[data-i="1"]');
  r.mark('quiz2-right');
  await next();

  /* ---------------- sandbox: mass and μ ---------------- */
  await r.until(s => /ท้าทาย/.test(s.title), 20, 'sandbox');
  r.mark('sandbox');
  await talkUntil(/ตั้งค่าเสร็จแล้ว/);
  await r.wait(1.0);
  r.mark('sandbox-set');
  await r.slide('m', 50, 0.8);
  await settle(0.4);
  await r.slide('mu', 0.2, 0.8);
  await settle(0.8);
  await r.typeNum('F', 300);
  await settle(0.5);
  await r.clickSel('#playBtn');
  await prompt(/จอดก่อนถึงจุดจอด|เลยจุดจอด|ไถลเลยธง/);
  r.mark('sandbox-miss');
  await next();
  await prompt(/ตั้งค่าเสร็จแล้ว/);
  await r.wait(1.2);
  r.mark('sandbox-exact');
  await r.typeNum('F', 490);
  await settle(0.5);
  await r.clickSel('#playBtn');
  await r.until(s => s.thumb, 40, 'sandbox success');
  r.mark('sandbox-success');
  await next();
  await prompt(/5 เท่าของ/);
  r.mark('sandbox-5f');
  await next({ extra: 1.2 });
  await talkUntil(/จะลองค่าอื่นอีก/);
  await r.wait(2.0);
  await r.clickText('.choice', 'ไปด่านแถม');

  /* ---------------- bonus: projectile ---------------- */
  await r.until(s => s.overlay.includes('แถม'), 20, 'bonus card');
  r.mark('bonus');
  await r.wait(2.2);
  await r.clickSel('#goBonus');
  await talkUntil(/เลือกความเร็วดีๆ/, {
    'เอาที่กั้นไปวาง': async () => r.mark('bonus-stopper'),
    'ห๊ะ': async () => r.mark('bonus-oops'),
    'คราวนี้เปลี่ยนจากตั้งแรงผลัก': async () => r.mark('bonus-speed'),
  });
  await r.wait(1.0);
  r.mark('bonus-try1');
  await r.slide('v', 3.5, 1.0);
  await settle(1.0);
  await r.clickSel('#playBtn');
  await prompt(/ตกก่อนถึงธง|เลยธงไป/);
  r.mark('bonus-miss');
  await next();
  await prompt(/เลือกความเร็วดีๆ/);
  await r.wait(0.8);
  r.mark('bonus-try2');
  await r.slide('v', 4.8, 1.2);
  await settle(1.4);
  await r.clickSel('#playBtn');
  await r.until(s => s.thumb, 40, 'bonus success');
  r.mark('bonus-success');
  await next();

  /* ---------------- lesson: projectile + 3rd law ---------------- */
  await r.until(s => /พาร์ทสอน \(แถม\)/.test(s.title), 20, 'projectile lesson');
  r.mark('projLesson');
  await talkUntil(/ตอบคำถามบนกระดาน/, {
    'ดูจุดที่ถ่ายไว้': async () => r.mark('projLesson-dots'),
    'คิดแบบนี้ก็ได้คำตอบ': async () => r.mark('projLesson-eq'),
  });
  r.mark('quiz3');
  await r.wait(4.5);
  await r.clickSel('#board .opt[data-i="1"]');
  r.mark('quiz3-right');
  await next();
  await prompt(/ตอบคำถามบนกระดาน/);
  r.mark('quiz4');
  await r.wait(4.2);
  await r.clickSel('#board .opt[data-i="3"]');
  r.mark('quiz4-wrong');
  await next({ extra: 0.8 });
  await prompt(/ตอบคำถามบนกระดาน/);
  await r.wait(1.4);
  await r.clickSel('#board .opt[data-i="2"]');
  r.mark('quiz4-right');
  await next();

  /* ---------------- feedback + summary ---------------- */
  await r.until(s => s.overlay.includes('ช่วยตอบสั้นๆ'), 20, 'feedback form');
  r.mark('feedback');
  await r.wait(2.0);
  await r.clickSel('.scale[data-k="difficulty"] button[data-v="3"]');
  await r.wait(0.5);
  await r.clickSel('.scale[data-k="enjoyment"] button[data-v="5"]');
  await r.wait(0.5);
  await r.clickSel('.scale[data-k="hardest"] button[data-v="fricLesson"]');
  await r.wait(0.6);
  await r.clickSel('#fbQ');
  await r.type('ถ้ามีแรงต้านอากาศจะเป็นยังไง', 2);
  await r.wait(1.0);
  await r.clickSel('#fbSend');
  await r.until(s => s.overlay.includes('สรุปสิ่งที่'), 20, 'summary');
  r.mark('summary');
  await r.move(1700, 1000, 0.8);
  await r.showCursor(false);
  await r.wait(9);
  r.mark('end');
  await r.finish();
  console.log(`done: ${r.frame} frames (${(r.frame/r.fps/60).toFixed(1)} min)`);
})().catch(e => { console.error(e); process.exit(1); });
