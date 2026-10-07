# กฏการเคลื่อนที่ของนิวตัน — prototype notes

Open `index.html` in any browser (sprites are embedded, no server needed).

## Story flow (follows storyboard 48–57)

| Storyboard | In the game |
|---|---|
| 48 ด่านที่ 1 | Ryuka asks you to push the cart(?) into the green parking spot in front of the flag. Slider = push force (N), button = ผลัก/เล่น. Free-body diagram shows N, mg, F. |
| 49 | The push only lasts for the first 0.8 m (a short shove, well under a second at typical forces). Ryuka calls "แค่นี้น่าจะพอให้ไปจอดหน้าธงแล้ว หยุดผลักได้เลย" right after. |
| 50 | On ice (no friction) the cart keeps going past the flag at constant speed ("บ๊ายบาย~"), disappears behind the panel, and the panic heart bar drains. Player can rewind and retry with a different force or go to the lesson. |
| 51–52 พาร์ทสอน | "เหมือนจะมีอะไรหายไป?" / "ช่วยเค้าก่อน👉👈" / พ่อมัน names the misconception. |
| 53–54 | ΣF = sum of **external** forces; y-forces (N, mg) cancel. |
| 55 | **Corrected**: shows ΣF = F_push ≠ 0 *while pushing* (a = F/m), then ΣF = 0 after release. Uses the player's own force, not 123456 N. |
| 56 | **Corrected**: the question is now "ในเมื่อไม่มีใครผลักมันแล้ว ทำไมรถยังเคลื่อนที่ต่อไปได้ล่ะ!?" (no longer "where did the force go?"). Answer: motion doesn't need a force to keep going, and force isn't stored in the cart → v–t graph, inertia, the 1st law, and why real carts stop (friction). Quiz. |
| *new* ด่านที่ 1 ลองใหม่ : มีแรงเสียดทาน | Same level, but the ice becomes a rough floor (μ = 0.10, f = μmg = 39.2 N). The player retries until the cart slows down and parks in the green spot (answer = 196 N, range about 184–208 N). Pushing with F ≤ f doesn't move the cart (static friction cancels the push). Hints after the 2nd and 3rd miss. |
| *new* พาร์ทสอน : แรงเสียดทาน | f = μN = μmg; ΣF in each phase (F − f, then −f, then 0 once stopped); v–t graph of the player's own run (up, then down to 0); v² = u² + 2as used for both phases. Quiz on the direction of the net force while slowing down. |
| *new* ด่านที่ 1 ท้าทาย | Sandbox: the player sets push force F, total mass m (20–80 kg) and μ (0–0.30) and tries again. Starts at m = 60 kg, μ = 0.15 (μ goes up to 0.25). After the first success, พ่อมัน points out that the right push is always 5 × f, because the mass cancels. μ = 0 brings back the "never stops" ice behaviour. |
| 57 แถม | **Changed to projectile motion**: back on ice, a stopper halts the cart, Ryuka keeps going (1st law) and flies off the ice platform. Slider = cart speed (m/s); land on the cushion at the flag. Then a lesson on the 3rd law at the impact, x = vt / Δy = ½gt², and two quizzes. |

## Velocity and force arrows

Forces are thick arrows (red/amber for pushes and weight, purple for friction); velocity is a thin blue arrow (legend at the top-left of every scene). With friction, the blue velocity arrow keeps pointing forward while the net force points backward, so the cart slows down. In section 1 the velocity arrow starts at the middle of the box; in the projectile bonus it starts at the middle of Ryuka's body. There the slider updates the readouts and Ryuka's velocity arrow live before launch, before launch the readout shows the predicted values at touchdown, and once the cart moves everything counts up in real time. x and the floor scale are measured from the platform edge (x = 0 where the flight starts, so the flag is at x = D = 3.0 m; x is negative while the cart is still on the platform). t counts from the release of the cart and changes with the slider; t_ลอย is the time in the air and stays at 0.62 s whatever the speed, like Δy and v_y; in flight the arrow splits into vₓ (constant) and v_y (growing), and the previous try stays on screen as faint dots for comparison.

## Misconceptions in the storyboard and how they were fixed

1. **Frame 55 showed ΣF = 0 while the cart was being pushed (with "แรงผลัก = 123456").**
   While the hand is pushing, ΣF_x = F_push ≠ 0, so the cart accelerates. ΣF becomes 0 only after the hand lets go. The 123456 N value (unrealistic for a hand push) is replaced by the player's own slider value.
2. **Frame 56 said the force "is still there as the cart's velocity" (แรงนั้น…ยังคงเป็นความเร็วของรถ), and asked "แรงนั้นหายไปไหนล่ะ".**
   Force is not stored in an object and does not turn into velocity. Force is an interaction that ends when contact ends. It *changed* the velocity (2nd law); with ΣF = 0 nothing changes it back (1st law, inertia). The question line was rewritten so it no longer suggests the force went somewhere.
3. **"ΣF = 0 means the object stops" (frame 52).** The storyboard sets this up as the misconception. The game states the correct version explicitly: ΣF = 0 means the velocity doesn't change.
4. **Missing context: why do everyday objects stop?** The new friction level answers it by play: on a rough floor the cart slows down and stops because friction acts against the motion, not because the pushing ended.
5. **"Something moving forward must have a force pushing it forward."** The friction quiz targets this: while the cart slides forward and slows down, the net force points backward.
6. **Bonus frame: Ryuka "launched" upward/tumbling.** In the projectile version Ryuka leaves horizontally (v_y = 0 at release), starts falling immediately (no cartoon "run then drop"), and only gravity acts during flight. The strobe dots show equal horizontal spacing and growing vertical spacing.
7. **3rd-law pair at the impact.** Shown as equal and opposite forces on *different* objects (cart and stopper). This is why they don't cancel, and why the force from the stopper is what stops the cart.

## Physics values used

- Level 1 (ice): m = 40 kg (cart + Ryuka), push applied only over the first 0.8 m, v_release = √(2·(F/m)·0.8). μ = 0.
- Friction levels: kinetic friction f = μmg (g = 9.81 m/s²). Push phase a₁ = (F − f)/m over 0.8 m; slide phase a₂ = −f/m until v = 0. The parking spot is 4.0 m from the start (3.2 m after the hand-off), so the exact answer is F = 5 f for any m and μ (196 N on the first friction floor, f = 39.24 N); success window ±0.25 m. Simplification: maximum static friction is taken to equal kinetic friction, so the cart moves only when F > f. Very slow runs are sped up on screen (labelled "เร่งเวลา ×n"); the numbers are unchanged.
- Bonus: launch height h = 1.9 m (1.2 m platform + 0.7 m cart), D = 3.0 m, t = √(2h/g) ≈ 0.62 s, target v ≈ 4.8 m/s (±0.25 m landing tolerance → about 4.4–5.2 m/s). Air resistance ignored; cart seat assumed slippery.

## Student data (Google Sheet)

Set up as described in the README. Every row carries `eid` (unique id; duplicates are dropped), `ts` (time), `name` and `room` (as typed on the title screen), and `sessionId` (one page load). Active time counts only while the tab is visible and the student has clicked, typed or touched something in the last 60 s. Anything longer counts as idle.

| Tab | One row per | Columns |
|---|---|---|
| **Sessions** | page load where the student started playing (updated in place) | `startedAt`, `entry` (`start`, `skip:<part>`, `resume:<part>`), `runs` (1 + replays from the ending), `lastStep`, `furthest`, `reachedEnd`, `activeMin`, `device` (touch/mouse + screen size), `deviceId` (random, per browser) |
| **Sections** | visit to one part | `section` / `part` (key / Thai name: ch1, lesson, fric, fricLesson, sandbox, bonus, projLesson, end), `enteredAt`, `activeSec`, `idleSec`, `completed`, `partial` (tab closed mid-part), `lines` (dialogue lines read), `slowLines` (the 3 lines that stayed up longest, with seconds; points to explanations students get stuck on) |
| **Attempts** | press of ผลัก/เล่น in a level | `section`, `attemptNo`, the inputs `F` `m` `mu` (or `v` in the bonus), `outcome` (`nomove`, `gone`, `short`, `long`, `success`), `errM` (distance from the target, − = short), `thinkSec` (panel unlocked → play), `sliderMoves` (drags/key presses on the sliders plus typed edits), `typedExact` (typed a number in the box), `change` (vs. the previous try, e.g. `F +46`), `hintsBefore` (hints พ่อมัน had already given in this visit) |
| **Quiz** | quiz answered | `quizId`, `firstTryCorrect`, `tries`, `picks` (e.g. `ค → ข`), `wrongTags` (misconceptions behind the wrong picks, below), `secToFirstPick`, `secTotal` |
| **Choices** | button choice in the dialogue | `section`, `question`, `pick`, `afterAttempts` (e.g. rewind vs. go to the lesson after the 1st miss) |
| **Feedback** | end-of-game form (once per session) | `difficulty` 1–5, `enjoyment` 1–5, `hardest` (part), `question` (free text "ยังสงสัยอะไรอยู่"), `skipped` |
| **Summary** | student (name + class), rebuilt by the Newton menu | minutes per part (heat map) and in total, the part with the most time, furthest part, finished, first-try quiz score /4, misconceptions seen, tries until the first success per level, average slider moves per try, % typed values, rough strategy (`พิมพ์ค่า (น่าจะคำนวณ)` when ≥ 50% of tries were typed values; `ลองผิดลองถูก` when ≥ 3 slider moves per try on average; otherwise `ผสม`), and the latest feedback. The last row is the class average. |

Misconception tags in `wrongTags`:

| Quiz | Wrong options → tag |
|---|---|
| `q1-inertia` | ก `force-stored-in-object` · ค `no-force-means-stop` · ง `acceleration-lingers` |
| `q2-friction-direction` | ก `motion-needs-forward-force` · ค `slowing-means-zero-net-force` · ง `friction-depends-on-speed` |
| `q3-flight-time` | ก `flight-time-depends-on-speed` · ค `faster-falls-sooner` · ง `range-ignores-speed` |
| `q4-third-law` | ก `mover-pushes-harder` · ข `stopper-pushes-harder` · ง `action-reaction-cancel` |

In the browser, the game keeps `nmg.student` (last name + class), `nmg.progress` (where each student can continue, plus their own numbers that the lessons reuse), and `nmg.outbox` (events not sent yet). They all live in `localStorage`, and the game still works if storage is blocked.

## Note on spelling

The title uses "กฏ" as requested. The Royal Institute spelling is "กฎ" (used in the rest of the game's text). Change one or the other if you want them consistent.
