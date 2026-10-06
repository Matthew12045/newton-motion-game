import { COL } from '../config.js';
import { text } from '../draw/primitives.js';
import { drawFloor, drawCart, drawRyuka, fbd } from '../draw/props.js';

/* Lesson: free-body diagram beside the cart(?) */
export function Diagram(){
  return {
    view:{ gy:470, s:110 }, hiY:false, sad:true, showF:true, fric:false, label:'ตอนกำลังผลัก',
    update(){},
    draw(){
      const v = this.view, cx = 330;
      drawFloor(v, { rough:this.fric });
      drawCart(cx, v.gy, v.s);
      drawRyuka(cx, v.gy - 0.7*v.s, v.s, { sad:this.sad });
      fbd(cx, 150, { hiY:this.hiY, showF:this.showF, f:this.fric });
      text(this.label, cx, 52, { size:16, align:'center', color:COL.muted });
    }
  };
}
