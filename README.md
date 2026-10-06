# กฏการเคลื่อนที่ของนิวตัน

A short interactive story game (in Thai) that teaches Newton's laws of motion and projectile motion. Ryuka's cart(?) won't stop on the ice. Push it, watch it overshoot, learn why, then launch Ryuka onto the cushion at the flag.

## Play

Build the game once, then open `dist/index.html` in a browser. The build is a single self-contained file (code, styles and sprites inlined), so it can be shared or opened straight from disk with no server.

```sh
npm install
npm run build     # → dist/index.html
```

The `index.html` at the repo root is only the page shell for development; it won't run if you open it directly.

## Develop

```sh
npm run dev       # dev server with hot reload at http://localhost:5173
npm test          # physics tests (Vitest)
npm run lint      # ESLint; catches a missing import as an undefined name
npm run check     # lint + test + build, before you push
```

Requires Node 22.13 or newer.

## Project layout

```
index.html            page shell: the stage, panel, board and dialogue markup
assets/               Ryuka's sprites
src/
  main.js             startup
  config.js           stage size, g, fonts, colours
  state.js            state shared across files (the current scene, panel values, the player's level-1 result)
  stage.js            canvas setup and scaling the 1280×720 frame to the window
  loop.js             the animation loop: update + draw the current scene
  events.js           tiny event bus (emit / waitEvent) the story awaits on
  ui/                 dialogue bar, lesson board and overlays, parameter panel
  draw/               canvas helpers (arrows, text) and props (floor, flag, cart, Ryuka, free-body diagram)
  scenes/             one file per animated scene; physics lives in update(), drawing in draw()
  story/              one file per chapter; story/index.js lists them in playing order
  styles/             CSS, one file per part of the screen
tests/                headless runs of the scenes that check the numbers the lessons quote
```

To add a chapter, write an `async function` in `src/story/`, and add it to `STEPS` in `src/story/index.js`.

## What it covers

- **Level 1:** Newton's 1st law. Pushing on frictionless ice; ΣF = 0 means constant velocity, not "stop".
- **Lesson:** free-body diagram, ΣF = ma while pushing, v–t graph, inertia.
- **Friction:** retry on a rough floor (f = μmg) so the cart slows down and parks; a lesson on ΣF = F − f, then −f, and v² = u² + 2as; then a sandbox where you set the mass and μ yourself.
- **Bonus:** projectile motion. Set the cart's speed so Ryuka lands on the flag (x = vt, Δy = ½gt²), plus the 3rd-law force pair at the stopper.

See [NOTES.md](NOTES.md) for the storyboard mapping, the misconceptions that were corrected, and the physics values used.
