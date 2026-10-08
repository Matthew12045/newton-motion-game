# Demo videos

Scripts that record a full playthrough of `index.html` and edit it into demo videos that show what
the game teaches and how. Nothing here is needed to play the game.

| Version | File | Length | What it is |
|---|---|---|---|
| Full playthrough | `walkthrough.mp4` / `walkthrough-th.mp4` | 9 min 40 s | Every chapter start to finish. English: subtitles for every line, English quiz cards, and a chip naming the teaching technique as it happens. Thai: the same with Thai chapter cards and chips, no subtitles. |
| How it teaches | `techniques.mp4` / `techniques-th.mp4` | 2 min 35 s | 13 teaching techniques, one to three short clips each, with a title, an explanation and a caption. For teachers, reviewers and presentations. |
| Trailer | `trailer.mp4` / `trailer-th.mp4` | 56 s | Fast cuts with big captions and upbeat music. |
| Vertical short | `vertical.mp4` / `vertical-th.mp4` | 37 s | 1080×1920 for Reels / TikTok / Shorts. |

All are 1920×1080 (the short is 1080×1920), 30 fps, H.264 + AAC. The music is synthesised by `music.py`
(no samples), so it is free to use.

## How it works

1. **Record** (`scenario.cjs`, `recorder.cjs`, `vtime.js`): Playwright opens the game in headless
   Chromium with a virtual clock. `vtime.js` takes over `performance.now`, `Date`, timers,
   `requestAnimationFrame` and every CSS animation, so the recorder can step the game exactly one
   video frame at a time and screenshot it. The video is perfectly smooth however slow the machine is.
   `scenario.cjs` plays the game like a student would (it gets things wrong first, rewinds, uses the
   back view, picks a wrong answer on quiz 1 and quiz 4 on purpose), draws a fake cursor, and logs what was on
   screen at every frame plus named marks (`raw/full.json`).
   The teacher's Google Sheet URL is blocked during recording, so no demo data is sent.
2. **Edit** (`compose.cjs`, `studio.html`, `edits/*.cjs`): each edit lists shots (ranges of the
   recording, with speed and camera zoom) and overlays (titles, captions, subtitles, highlight rings).
   Every output frame is laid out as HTML in `studio.html` and screenshotted into ffmpeg, then the
   music is mixed in. English subtitles come from `subs-en.cjs`, matched to the logged dialogue.
3. **Music** (`music.py`): two beds, `bright.wav` (trailer, short) and `calm.wav` / `calm_long.wav`.

## Regenerating

Needs Node with Playwright (and its Chromium), ffmpeg, and Python 3 with numpy. Use a scratch
directory outside the repo as the work directory, because the extracted frames take about 2.5 GB.

Run everything from the repo root.

```sh
W=/tmp/newton-demo
# Playwright and its Chromium, installed into the work dir (keeps node_modules out of the repo)
npm i --prefix $W playwright@1.56.1 && npx --prefix $W playwright install chromium
export NODE_PATH=$W/node_modules   # the scripts require('playwright'); this is where Node finds it
mkdir -p $W/assets/fonts $W/assets/mj
# fonts used by the game and the overlays (served to the browser from disk while recording)
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@300;400;600&family=STIX+Two+Text:ital@0;1&display=swap" -o $W/assets/game-fonts.css
curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&family=Inter:wght@400;500;600;700;800&family=Sarabun:wght@400;600;700&family=Kanit:wght@400;500;600&display=swap" -o $W/assets/overlay-fonts.css
grep -oh "https://fonts.gstatic.com[^)]*" $W/assets/*.css | sort -u | while read u; do
  curl -s "$u" -o "$W/assets/fonts/$(echo "${u#https://fonts.gstatic.com/}" | tr / _)"; done
# MathJax (the game loads it from a CDN; the recorder serves this copy instead)
(cd $W/assets/mj && npm pack mathjax@3.2.2 && tar xzf mathjax-3.2.2.tgz package/es5/tex-svg.js)

python3 tools/demo-video/music.py $W/music
node tools/demo-video/scenario.cjs $W            # ~10 min → $W/raw/full.mp4 + full.json
node tools/demo-video/compose.cjs $W techniques   # → $W/out/techniques.mp4
node tools/demo-video/compose.cjs $W techniques-th
# … trailer, vertical, walkthrough (each also with -th)
```

`node tools/demo-video/scenario.cjs $W --dry` runs the playthrough without screenshots (about a minute) to check
that the script still gets through the game. `compose.cjs … --still=12,40` renders single PNG
frames at those times instead of the whole video, and `--remix` only redoes the music of a
finished render (after changing an edit's `music.volume`). `--dump` writes `out/<name>.timeline.md`: every shot's source range and
every overlay's text with its start and end time, handy for checking captions against the footage.

If the game's dialogue changes, update the matching lines in `subs-en.cjs`. This playthrough's
numbers (120 N, 1.55 m, 260 N, 196 N, 490 N, 4.8 m/s, …) are written into the English subtitles in
`subs-en.cjs`, the captions and ring label in `edits/techniques.cjs` (English and Thai) and the 40 N chip
in `edits/walkthrough.cjs`, so update all of them when `scenario.cjs` pushes with different values.
`compose.cjs … walkthrough` warns about lines it can't subtitle and about subtitle lines whose numbers
differ from their English; the other edits are not checked. If the flow changes, adjust `scenario.cjs`;
the edits cut on its named marks
(`r.mark(...)`), so most timing follows automatically.
