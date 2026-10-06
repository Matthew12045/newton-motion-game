import { stage } from '../stage.js';
import { say } from '../ui/dialog.js';
import { board } from '../ui/board.js';

export async function celebrate(line){
  const th = document.createElement('div'); th.id = 'thumb'; th.textContent = '👍'; stage.append(th);
  await say('dad', line);
  th.remove();
}

export async function quiz(q, opts, correct, why, wrong){
  const b = board(`<div class="q">${q}</div><div class="opts">${opts.map((o, i) =>
      `<button class="opt" data-i="${i}">${'กขคง'[i]}. ${o}</button>`).join('')}</div>`, true);
  const btns = [...b.querySelectorAll('.opt')];
  while (true){
    say('dad', 'ตอบคำถามบนกระดานหน่อย', { wait:false });
    const pick = await new Promise(res => btns.forEach(x => x.onclick = () => res(+x.dataset.i)));
    if (pick === correct){
      btns[pick].classList.add('right'); btns.forEach(x => x.disabled = true);
      await say('dad', `ถูกต้อง! ${why}`);
      return;
    }
    btns[pick].classList.add('wrong'); btns[pick].disabled = true;
    await say('dad', wrong[pick]);
  }
}
