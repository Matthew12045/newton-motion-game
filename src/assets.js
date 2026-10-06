import ryuka from '../assets/ryuka.png';
import ryukaSad from '../assets/ryuka_sad.png';

// Filled by loadSprites() at startup, so importing this module needs no DOM (tests run in Node).
export const IMG = {};
export function loadSprites(){
  IMG.n = new Image(); IMG.n.src = ryuka;
  IMG.sad = new Image(); IMG.sad.src = ryukaSad;
}
