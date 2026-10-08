/* English subtitles for the game's Thai dialogue, matched by the start of each line
   (numbers are the ones the demo playthrough produces). Also the quiz questions shown on the board. */
const LINES = [
  ['นายลองผลักกล่องให้ไปจอด', 'Hey, push the box so it parks in the spot in front of the flag.'],
  ['แค่นี้น่าจะพอให้ไปจอด', 'That should be enough to park by the flag. You can stop pushing now!'],
  ['อะไรนะ หยุดผลักแล้วหรอ', 'Wait, you stopped pushing? Then why isn’t it stopping?! Aaah!'],
  ['จะลองผลักใหม่ด้วยแรง', 'Try again with a different force, or go and find out why?'],
  ['เดี๋ยวๆ ธงอยู่ทางขวา', 'Wait, wait! The flag is to the RIGHT! Why push to the left?'],
  ['แล้วก็ไม่หยุดอีก', 'And it won’t stop again — sliding left forever. Aaah!'],
  ['แรงมีทิศทาง', 'The sign gives the direction: F = −80 N pushes left (−x). The box speeds up to the left, then slides left at constant velocity — it doesn’t stop either.'],
  ['ย้อนเวลาให้ ลองผลัก', 'I’ll rewind time. Try a positive push, toward the flag.'],
  ['รอบนี้ผลัก', 'This time 40 N, the first time 120 N. Strong or gentle, once you stop pushing the box never stops by itself… Let’s find out why.'],
  ['เหมือนจะมีอะไรหายไป', 'Feels like something’s missing here…?'],
  ['คงจะจำว่าแค่', 'You probably remember it as “ΣF = 0” or “no more pushing” means the object stops, right?'],
  ['ถ้าจริงแบบนั้น', 'If that were true, the box would have stopped long ago. That’s the misconception. Let’s look at the forces one by one.'],
  ['จากสมการที่คุ้นเคย', 'Look closely at the familiar equation: ΣF is the sum of the external forces on the box. While pushing there are three.'],
  ['แรงในแนวแกน y', 'The y-forces cancel — always 0. Only the push along x is left.'],
  ['ตอนที่ผลักอยู่', 'While being pushed, the box feels a net force of 40 N — not 0 — so it accelerates and keeps speeding up (that’s the 2nd law: ΣF = ma).'],
  ['พอมือหลุดออกจากกล่อง', 'The moment the hand leaves the box, the push is gone. Only then does the net force drop back to 0.'],
  ['ในเมื่อไม่มีใครผลัก', 'But if nobody’s pushing it anymore, why does the box keep moving?!'],
  ['วัตถุไม่ต้องมีแรง', 'An object doesn’t need a force to keep moving — and the push isn’t stored in the box. When the hand lets go, the force ends right then.'],
  ['สิ่งที่แรงทิ้งไว้', 'What the force leaves behind is a changed velocity. With ΣF = 0 nothing changes it again, so the box carries on at constant velocity. That’s inertia.'],
  ['ลองกดปุ่ม a–t', 'Tap a–t and x–t on the board. After release a–t is 0 and x–t is a straight line, because the velocity is constant.'],
  ['แต่รถเข็นที่ซูเปอร์', 'But a supermarket trolley stops by itself when you let go!?'],
  ['นั่นเพราะพื้นมีแรงเสียดทาน', 'That’s because the floor resists with friction — another external force, so ΣF isn’t 0. But this is ice: almost no friction, so nothing stops the box.'],
  ['ตอบคำถามบนกระดาน', 'Answer the question on the board.'],
  ['แรงไม่ได้ติดอยู่ในกล่อง', 'The force isn’t stuck inside the box — it vanished the moment the hand let go. And with nothing resisting, the speed doesn’t drop. Try again!'],
  ['ถูกต้อง! แรงลัพธ์เป็น 0', 'Correct! Net force 0 → acceleration 0 → constant velocity, by the 1st law.'],
  ['งั้นมาลองกันเลย', 'Let’s test it. Rewind time, and swap the ice for a floor with friction.'],
  ['พื้นนี้มีสัมประสิทธิ์', 'This floor has μ = 0.10 and the box + Ryuka have a mass of 40 kg, so friction is f = μmg = 0.10 × 40 × 9.81 = 39.24 N.'],
  ['แรงเสียดทานชี้สวนทาง', 'Friction always points against the motion. Find the push that makes the box slow down and park right in the green spot by the flag.'],
  ['คราวนี้ต้องจอดหน้าธง', 'This time it has to park by the flag!'],
  ['จอดก่อนถึงจุดจอด', 'Stopped 1.55 m short of the spot — push harder.'],
  ['จอดเลยจุดจอดไป', 'Stopped 1.30 m past — push less. Hint: after release it slides 3.2 m, slowing at f/m = 0.981 m/s², so it needs v = √(2 × 0.981 × 3.2) ≈ 2.5 m/s at release. Watch v in the panel.'],
  ['เยี่ยม! ผลัก', 'Great! At 196 N the box slows down and parks 0.00 m from the mark.'],
  ['แรงเสียดทานเกิดจาก', 'Friction comes from the box rubbing on the floor: f = μN, and on level ground N = mg, so f = μmg.'],
  ['ตอนผลัก ต้องออกแรง', 'While pushing, you must beat friction for the net force to point forward — then the box speeds up.'],
  ['พอปล่อยมือ เหลือแค่', 'After release only friction is left, pointing backward. The net force opposes the motion, so the speed drops by 0.98 m/s every second until it reaches 0.'],
  ['พอกล่องหยุด', 'Once it stops, nothing slides, so kinetic friction is gone: ΣF = 0 and the box stays put — it doesn’t slide back.'],
  ['สรุปว่ากล่องหยุดเพราะ', 'So the box stops because of friction — not because you stopped pushing!'],
  ['ลองกดดูกราฟ x–t', 'Check the x–t graph too: while sliding, the curve flattens as the velocity (its slope) drops to 0, then it goes flat when the box stops.'],
  ['ใช้สูตร v²', 'Use v² = u² + 2as one phase at a time and you can work out where the box will park — no guessing.'],
  ['ถูกต้อง! แรงลัพธ์คือแรงเสียดทาน', 'Correct! The net force is friction pointing backward, so the acceleration opposes the velocity and the box slows down.'],
  ['คราวนี้ขนของใส่กล่อง', 'Let’s load more stuff into the box and make the floor rougher.'],
  ['ปรับมวล m', 'Set the mass m and the friction coefficient μ however you like, then find the push that parks the box by the flag again.'],
  ['ตั้งค่าเสร็จแล้ว', 'Set it up, then hit push!'],
  ['จอดได้!', 'Parked! m = 50 kg and μ = 0.20 give f = 98.1 N, and the 490 N push ≈ 4.99 × f.'],
  ['สังเกตมั้ย', 'Notice? The right push is always about 5 × f, because (F − f)/m × 0.8 = f/m × 3.2 — the m cancels, leaving F = 5f.'],
  ['มวลมากขึ้นหรือพื้นฝืด', 'More mass or a rougher floor means more friction (f = μmg), so you have to push harder too.'],
  ['จะลองค่าอื่นอีก', 'Try other values, or move on?'],
  ['กลับไปที่ลานน้ำแข็ง', 'Back to the ice — no friction to help this time… I know! Put a stopper in front of the box. Then it’ll definitely stop.'],
  ['ห๊ะ', 'Huh?!?! And what about the person standing ON the box!?'],
  ['งั้นจะย้อนเวลาให้', 'Let me rewind time first.'],
  ['คราวนี้เปลี่ยนจากตั้งแรงผลัก', 'This time you set the box’s speed instead of the push. The platform is icy too, so the box slides at constant speed until it hits the stopper.'],
  ['กล่องหยุดที่ที่กั้น', 'The box stops at the stopper, sure — but Ryuka isn’t attached to it… Find the speed that lands Ryuka on the cushion at the flag.'],
  ['เลือกความเร็วดีๆ', 'Choose the speed carefully… please.'],
  ['ตกก่อนถึงธง', 'Landed 0.82 m short of the flag — go faster… ouch.'],
  ['เยี่ยม! ใช้ความเร็ว', 'Great! At 4.8 m/s Ryuka lands just 0.01 m from the flag, right on the cushion.'],
  ['ตอนชน ที่กั้นออกแรง', 'At impact the stopper pushes the box, and the box pushes back on the stopper with an equal and opposite force — the 3rd law. The stopper’s push is what stops the box.'],
  ['แต่ที่กั้นไม่ได้แตะ', 'But the stopper never touches Ryuka, and the box top is slippery: no horizontal force acts on her, so she flies on at the same speed. The 1st law again!'],
  ['แปลว่าไม่มีใครผลัก', 'So nobody pushed me off at all… I just didn’t stop with the box.'],
  ['ดูจุดที่ถ่ายไว้', 'Look at the dots, one every 0.05 s: equal horizontal spacing (no force along x, so vₓ is constant) but growing vertical spacing (gravity speeds up the fall).'],
  ['ริวกะไม่ได้พุ่งตรง', 'Ryuka doesn’t fly straight and then drop like in cartoons, and she doesn’t rise either. Her vertical velocity starts at 0, so she falls at once — a parabola.'],
  ['คิดแบบนี้ก็ได้คำตอบ', 'Work it out like this and there’s no guessing: solve x and y separately, linked by the same time t.'],
  ['ถูกต้อง! เวลาตก', 'Correct! The fall time t = √(2h/g) depends only on the height, and the range D = vt doubles with v.'],
  ['สองแรงนี้กระทำกับวัตถุ', 'These two forces act on different objects (one on the box, one on the stopper), so they can’t be added together. Try again!'],
  ['ถูกต้อง! นี่คือกฎข้อ 3', 'Correct! That’s the 3rd law: the pair acts on different objects, so they don’t cancel. The force on the box is what stops it.'],
];
const WHO = { 'ริวกะ': 'Ryuka', 'ยูอัน': 'Yu-An', 'เคย์': 'Kay' };

const QUIZ = [
  ['หลังจากมือหลุด', 'Quiz: after the hand leaves the box on frictionless ice, which is correct?'],
  ['ขณะที่กล่องกำลังไถล', 'Quiz: while the box slides and slows down after release, which way does the net force point?'],
  ['ถ้าเพิ่มความเร็วกล่อง', 'Quiz: if the box’s speed doubles, how long is Ryuka in the air, and how far does she land?'],
  ['ตอนกล่องชนที่กั้น แรงที่', 'Quiz: at impact, how does the box’s push on the stopper compare with the stopper’s push on the box?'],
];

const norm = s => s.replace(/^[“"\s]+/, '').trim();
// the numbers are those of the scripted playthrough: warn when a line's numbers differ from its English
// (a changed scenario value, or a key that matched a different variant of the line)
const nums = s => (s.replace(/<[^>]+>/g, '').match(/\d+(?:\.\d+)?/g) || []).sort().join(',');
const NUM_OK = ['จากสมการที่คุ้นเคย', 'ถ้าเพิ่มความเร็วกล่อง', 'ถูกต้อง! เวลาตก', 'สังเกตมั้ย'];
const warned = new Set();
function en(line){
  const s = norm(line);
  const hit = LINES.find(([k]) => s.startsWith(k));
  if (hit && !NUM_OK.includes(hit[0]) && nums(s) !== nums(hit[1]) && !warned.has(hit[0])){
    warned.add(hit[0]);
    console.warn(`subtitle numbers differ for "${s.slice(0, 40)}": ${nums(s)} vs ${nums(hit[1])}`);
  }
  return hit ? hit[1] : null;
}
function quiz(board){
  const hit = QUIZ.find(([k]) => board.startsWith(k));
  return hit ? hit[1] : null;
}
module.exports = { en, quiz, WHO };
