import {clamp} from '../../core/util.js';
export function recoverRoute(car){
 const path=car.arcade,p=car.body.translation(),route=path.route,current=path.index;
 const at=route[current];if(!at)return current;
 if(Math.hypot(p.x-at.x,p.z-at.z)<4)return current;
 let best=current,dist=Math.hypot(p.x-at.x,p.z-at.z);
 for(let i=Math.max(0,current-18);i<Math.min(route.length,current+26);i++){
  const d=Math.hypot(p.x-route[i].x,p.z-route[i].z);
  if(d<dist){best=i;dist=d;}
 }
 if(best!==current&&dist+2<Math.hypot(p.x-at.x,p.z-at.z)){car.policeReacquired=(car.policeReacquired||0)+1;return best;}
 return current;
}
export function rightingImpulse(q,v,av,mass,dt){
 const up=1-2*(q.x*q.x+q.z*q.z);
 if(up>.55||Math.hypot(v.x,v.z)>5||Math.abs(v.y)>1.5)return null;
 const x=2*(q.x*q.y-q.w*q.z),z=2*(q.y*q.z+q.w*q.x);
 const tx=-z*18+(Math.abs(x)+Math.abs(z)<.12?8:0)-av.x*3,tz=x*18-av.z*3;
 return {x:clamp(tx,-22,22)*mass*dt,y:0,z:clamp(tz,-22,22)*mass*dt};
}
