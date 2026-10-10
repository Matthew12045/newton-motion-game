# กฎการเคลื่อนที่ของนิวตัน

A short interactive story game (in Thai) that teaches Newton's laws of motion and projectile motion. Ryuka's box (กล่อง) won't stop on the ice. Push it, watch it overshoot, learn why, then launch Ryuka onto the cushion at the flag. The cast: ริวกะ (Ryuka), ยูอัน (Yu-An, who explains) and เคย์ (Kay).

## Play

Open `index.html` in a browser. Everything is in that one file, including the sprites (the source drawings are in `assets/`; after changing one, run `python3 tools/embed_sprites.py` to cut it out and embed it again).

Press ◂ ย้อนกลับ in the dialogue bar (or ←, or scroll up over it) to go back and reread earlier lines and lesson boards; → or a click goes forward again. When you look back at a line from a level (even one you have finished), the panel stays adjustable: change a value (or press ผลัก/เล่น) to rewind time to that point and play on from there with the new value.

## What it covers

- **Level 1:** Newton's 1st law. Pushing on frictionless ice; ΣF = 0 means constant velocity, not "stop". The push can be negative (to the left).
- **Lesson:** free-body diagram, ΣF = ma while pushing, v–t / a–t / x–t graphs, inertia.
- **Friction:** retry on a rough floor (f = μmg) so the box slows down and parks; a lesson on ΣF = F − f, then −f, and v² = u² + 2as; then a sandbox where you set the mass and μ yourself.
- **Bonus:** projectile motion. Set the box's speed so Ryuka lands on the flag (x = vt, Δy = ½gt²), plus the 3rd-law force pair at the stopper.

See [NOTES.md](NOTES.md) for the storyboard mapping, the misconceptions that were corrected, the physics values used, and the list of student data the game records.

## Collecting student data (for the teacher)

Before playing, each student types their name and class (ชั้น). The game then records how far they got, how long they spent on each part, every try in the levels, their quiz answers, and a short feedback form at the end. These are sent to a Google Sheet that you own. Students don't see any of it. The game also remembers each student's place in that browser, so they can pick up where they left off (เล่นต่อ).

One-time setup (about 5 minutes):

1. Create a new Google Sheet, for example "Newton game – data".
2. In the sheet, open **Extensions → Apps Script**. Delete the sample code, paste in all of [`apps-script/Code.gs`](apps-script/Code.gs), and click **Save**.
3. Click **Deploy → New deployment**, choose type **Web app**, and set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and allow access when Google asks.
4. Copy the **Web app URL**. It ends in `/exec`.
5. In `index.html`, find `const LOG_URL = '';` near the top of the main `<script>` and paste the URL between the quotes. Then share or host that `index.html` as usual.
6. To test, open the URL in a browser. It should say `Newton game collector is running`. Then play a level and check that rows appear in the sheet.

The tabs (Sessions, Sections, Attempts, Quiz, Choices, Feedback) are created automatically as data arrives. To get a single overview with one row per student, use the **Newton → สร้างสรุป (Build summary)** menu in the sheet. (Reload the sheet once after step 2 if the menu doesn't show up.) It rebuilds the **Summary** tab with minutes per part as a heat map, the part each student spent the most time on, first-try quiz score, misconceptions, tries per level, and their feedback.

Notes:

- If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.
- **Newton → จัดรูปแบบชีต (Format sheets)** tidies how the data tabs look: a dark heading row that stays in view, banded rows, readable dates, wrapped free text, a filter on every heading, colour cues (how each try ended, the yes/no columns, the 1–5 answers) and the tabs in story order. The date, name and class stay in view when you scroll sideways. The ID columns (`eid`, `sessionId`, `deviceId`) are hidden because only the script needs them; select the columns around one and choose **Unhide** to see it. You can run it again at any time. It doesn't change the data, with one exception: a name or class that Sheets had read as a date or a number (a class typed as `6/7` used to become 7 June) is put back as the text the student typed. New tabs get the same look automatically, and the Summary tab is styled each time it is built, with one heading colour per group of columns.
- Names, classes and free-text answers are saved as plain text, so `6/7` stays `6/7` and `007` stays `007`.
- A Google Sheet shows times in its own time zone (**File → Settings**), and a sheet created on another time zone shows every time shifted (for example 14 hours behind). **Newton → ใช้เวลาประเทศไทย (Thai time)** switches the sheet to Thai time and rewrites the saved times so that each one still means the same moment. It checks the times before and after the change, stops without changing anything if they don't agree, and does nothing when run a second time. Build the summary again afterwards.
- After changing `Code.gs`, you can run `selfTest` from the Apps Script editor. It writes sample rows to two scratch tabs, checks them and removes the tabs; it doesn't touch the real data.
- The October update renamed the parts to the formal chapter names and the class heading to ชั้น. The sheet's columns are unchanged, so collecting keeps working without a new deployment. New rows use the new part names in Sections `part` and Feedback `hardest`; rows from before the update keep the old names. To get the new Summary headings (and old answers shown under the new names), paste the new `Code.gs` over the old one and save.
- The feedback form has a box for what students think of the game (คิดยังไงกับเกมนี้), saved in a new Feedback column `comment`. The sheet only saves it after you paste the new `Code.gs` and deploy a new version (the step above). Until then, everything else keeps working, but the comment is dropped. The new column heading is added to the existing Feedback tab automatically, and the Summary gets a matching column.
- If a student is offline or the page closes, the data waits in the browser and is sent the next time the game opens. Rows that were already received are not added twice.
- While `LOG_URL` is empty, nothing is sent anywhere.
- The sheet will hold students' names. Tell students their play is recorded for the class, and keep the sheet private.
