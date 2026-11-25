import {clamp} from '../../core/util.js';
export function impactPair(a,b,first,second){
 const x=first.body?'body:'+first.body.handle:'collider:'+a,y=second.body?'body:'+second.body.handle:'collider:'+b;
 return x<y?x+'|'+y:y+'|'+x;
}
export function propImpulse(speed,carMass,propMass){
 const light=clamp((carMass/Math.max(1,propMass))*.22,.09,1);
 return {horizontal:Math.min(25,Math.max(4,speed*.72))*light,vertical:Math.min(7,1.2+speed*.16)*light,spin:Math.min(14,speed*.55)*light};
}
