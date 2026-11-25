import {lane} from '../scenes/canyon/canyon-assets.js';
import {THREE as T,clamp} from '../core/util.js';
const policeRoutes=new WeakMap();
function routeCache(route,attack){
 let entry=policeRoutes.get(route);
 if(!entry){entry={segments:route.map((p,i)=>i?Math.hypot(p.x-route[i-1].x,p.z-route[i-1].z):0),attacks:new Map()};policeRoutes.set(route,entry);}
 let nodes=entry.attacks.get(attack);if(!nodes){nodes=[];entry.attacks.set(attack,nodes);}
 return {segments:entry.segments,nodes};
}
function routeGeometry(route,index,attack,cache){
 if(cache?.nodes[index])return cache.nodes[index];
 const a=route[index],b=route[Math.min(index+3,route.length-1)],c=route[Math.min(index+7,route.length-1)];
 const ab=Math.atan2(b.x-a.x,b.z-a.z),bc=Math.atan2(c.x-b.x,c.z-b.z),turn=Math.abs(Math.atan2(Math.sin(bc-ab),Math.cos(bc-ab)));
 let curveSpeed=Infinity,distance=0;
 for(let n=index;n<Math.min(route.length,index+18);n++){if(n>index)distance+=cache?cache.segments[n]:Math.hypot(route[n].x-route[n-1].x,route[n].z-route[n-1].z);curveSpeed=Math.min(curveSpeed,Math.sqrt((route[n].limit*attack)**2+2*(34*attack)*distance));}
 const result={cos:Math.cos(ab),sin:Math.sin(ab),turn,direction:Math.sign(Math.sin(bc-ab)),curveSpeed};
 if(cache)cache.nodes[index]=result;
 return result;
}
export function routeMotion(car,route,index,maxSpeed,variation=0){
 const p=car.body.translation();let best=index,bestDist=Infinity;
 for(let i=Math.max(0,index-2);i<Math.min(route.length,index+18);i++){const d=Math.hypot(route[i].x-p.x,route[i].z-p.z);if(d<bestDist){best=i;bestDist=d;}}
 index=Math.max(index,best);const attack=car.attack??1,cache=car.physics?.policeOne?routeCache(route,attack):null;
 let look=clamp(3.4+car.speed*.16,4.5,10),target=route[index],travel=0,k=index;
 while(k<route.length-1&&travel<look){travel+=cache?cache.segments[k+1]:Math.hypot(route[k+1].x-route[k].x,route[k+1].z-route[k].z);target=route[++k];}
 const g=routeGeometry(route,index,attack,cache),corner=clamp((g.turn-.09)/.48,0,1)*clamp((car.speed-6)/8,0,1);
 car.cornerLoad=corner;
 variation+=g.direction*corner*(car.apexOffset??1.3);
 return {index,target:{x:target.x+g.cos*variation,z:target.z-g.sin*variation},speed:Math.min(maxSpeed,g.curveSpeed)};
}
export function curveFrom(gates,closed){
 const vectors=gates.map(p=>new T.Vector3(...p));return new T.CatmullRomCurve3(vectors,closed,'centripetal');
}
export function samples(gates,closed,track){
 if(track==='canyon'&&closed){
  const base=Array.from({length:240},(_,i)=>lane(i/240));
  const anchors=gates.map(p=>{const v=new T.Vector3(...p);let idx=0;for(let i=1;i<base.length;i++)if(v.distanceToSquared(base[i])<v.distanceToSquared(base[idx]))idx=i;return {idx,offset:v.sub(base[idx])};});
  const spans=anchors.map((a,i)=>(anchors[(i+1)%anchors.length].idx-a.idx+240)%240);
  if(spans.every(n=>n>0)&&spans.reduce((a,b)=>a+b,0)===240){
   const path=[];anchors.forEach((a,i)=>{const n=spans[i],b=anchors[(i+1)%anchors.length];for(let j=0;j<n;j++){const u=j/n;path.push(base[(a.idx+j)%240].clone().add(a.offset.clone().lerp(b.offset,u*u*(3-2*u))));}});
   const curve=new T.CatmullRomCurve3(path,true);return curve.getSpacedPoints(Math.ceil(curve.getLength()/1.35));
  }
 }
 const curve=curveFrom(gates,closed),length=curve.getLength(),count=Math.max(12,Math.ceil(length/1.35));
 return curve.getSpacedPoints(count);
}
export function prepareRun(obj,settings){
 const gates=obj.points.map(p=>p.p),closed=settings.closed,points=samples(gates,closed,settings.track);
 const lap=points.length-1,coords=closed?points.slice(0,-1):points;
 const route=[];
 for(let k=0;k<(closed?settings.laps:1);k++)route.push(...coords);
 if(closed)route.push(points[0]);
 const finishIndex=route.length-1;
 if(closed)route.push(...points.slice(1,20));
 else {const last=route.at(-1),dir=last.clone().sub(route.at(-2)).normalize();const extension=settings.track==='police-one'&&['fugitive','pursuer'].includes(obj.role)?72:19;for(let i=1;i<=extension;i++)route.push(last.clone().addScaledVector(dir,i*1.35));}
 const center=route.map((v,i)=>{
  const a=route[Math.max(0,i-3)],b=route[Math.min(route.length-1,i+3)],c=route[Math.min(route.length-1,i+7)];
  const yaw=Math.atan2(b.x-a.x,b.z-a.z),turn=Math.abs(Math.atan2(Math.sin(Math.atan2(c.x-b.x,c.z-b.z)-yaw),Math.cos(Math.atan2(c.x-b.x,c.z-b.z)-yaw)));
  const bend=settings.track==='police-one'&&!closed&&b.distanceToSquared(c)<1e-8?0:turn/Math.max(1,b.distanceTo(c));
  const limit=Math.min(obj.speed/3.6,Math.sqrt((settings.track==='canyon'?24:50)/Math.max(.001,bend)));
  const offset=settings.offset||0;
  return {x:v.x+Math.cos(yaw)*offset,y:v.y,z:v.z-Math.sin(yaw)*offset,limit};
 });
 return {route:center,finishIndex,lap,index:0,done:false,shift:0};
}
function battleLine(car,field,dt){
 const path=car.arcade,p=car.body.translation(),f=Math.sin(car.yaw),g=Math.cos(car.yaw);
 let rival=null,nearest=18;
 for(const other of field){
  if(other===car||other.arcade?.done||other.arcade?.out||other.disabled)continue;
  const q=other.body.translation(),dx=q.x-p.x,dz=q.z-p.z,along=dx*f+dz*g,side=dx*g-dz*f;
  if(along>0&&along<nearest&&Math.abs(side)<3.8){nearest=along;rival={side,other};}
 }
 path.decision=Math.max(0,(path.decision||0)-dt);
 if(rival&&path.decision===0){
  const side=rival.side>.45?-1:rival.side<-.45?1:car.obj.lane>0?-1:1;
  path.aim=clamp(rival.other.arcade.shift+side*1.65+(rival.other.obj.lane-car.obj.lane),-2.6,2.6);
  path.decision=.65+car.phase*.08;
 }else if(!rival&&path.decision===0){path.aim=Math.sin(path.index*.025+car.phase)*.85-car.obj.lane*.53;}
 path.shift+=(clamp(path.aim||0,-3.1-car.obj.lane,3.1-car.obj.lane)-path.shift)*Math.min(1,dt*2.9);
 return rival?1.10:1;
}
export function pilotArcade(car,dt,drive,field){
 const path=car.arcade,p=car.body.translation(),finish=path.route[path.finishIndex];
 if(path.out)return;
 if(!path.done){path.idle=path.index===(path.lastIndex??-1)?(path.idle||0)+dt:0;path.lastIndex=path.index;
  if(car.disabled||path.idle>12){path.out=true;return;}}
 if(car.attack===undefined){
  const random=car.brain.rng;
  car.attack=.98+random()*.22;
  car.apexOffset=.6+random()*1.35;
 }
 const draft=battleLine(car,field,dt);
 const motion=routeMotion(car,path.route,path.index,car.obj.speed/3.6,path.shift);
 path.index=motion.index;
 if(path.done){drive(car,motion.target,dt,path.index<path.route.length-4?13:0);return;}
 if(path.index>=path.finishIndex-3){
  const before=path.route[path.finishIndex-3],dx=finish.x-before.x,dz=finish.z-before.z;
  if((p.x-finish.x)*dx+(p.z-finish.z)*dz>=0){path.done=true;car.index=car.path.length;}
 }
 if(!path.done)car.index=Math.min(car.path.length-1,Math.floor(path.index/path.finishIndex*car.path.length));
 drive(car,motion.target,dt,Math.min(car.obj.speed/3.6,motion.speed*car.pace*draft));
}
