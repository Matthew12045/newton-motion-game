// State shared between the story, the scenes and the parameter panel.

// What the player did in level 1 feeds the lesson (their own numbers, not 123456 N).
export const memo = { F:100, m:40, d:0.8, v1:Math.sqrt(2*(100/40)*0.8), fric:null };

// Current slider values of the parameter panel.
export const pval = { F:40, m:40, mu:0.1, v:3 };

// The scene the main loop updates and draws.
export let scene = null;
export function setScene(s){ scene = s; return s; }
