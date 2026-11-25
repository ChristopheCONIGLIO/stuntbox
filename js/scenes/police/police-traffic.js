import {clamp} from '../../core/util.js';
const configs=[
 {id:'delivery',asset:'wagon',color:'#e7b95e',start:[-96,-101],end:[-96,-55],trigger:[-122,-84],cross:[-96,-84],speed:12,range:25},
 {id:'market',asset:'hatch',color:'#62a6a2',start:[-62,-42],end:[-13,-42],trigger:[-42,-70],cross:[-42,-42],speed:11,range:26},
 {id:'avenue',asset:'sedan',color:'#7392b6',start:[3,19],end:[3,-18],trigger:[-27,0],cross:[3,0],speed:12,range:29},
 {id:'industrial',asset:'truck',color:'#ded5bc',start:[68,39],end:[15,39],trigger:[48,9],cross:[48,39],speed:11,range:28},
 {id:'finale',asset:'hatch',color:'#a99dc6',start:[156,59],end:[156,104],trigger:[120,78],cross:[156,78],speed:13,range:34}
];
export function addPoliceTraffic(scenario){
 for(const c of configs){
  const yaw=Math.atan2(c.end[0]-c.start[0],c.end[1]-c.start[1]);
  const point=(p,i)=>({id:c.id+'-'+i,p:[p[0],.06,p[1]],radius:4,speed:c.speed*3.6,yaw,type:i?'finish':'waypoint'});
  scenario.vehicles.push({id:'traffic-'+c.id,asset:c.asset,color:c.color,p:[c.start[0],.14,c.start[1]],r:[0,yaw,0],s:[1,1,1],role:'civil',profile:'careful',initial:0,speed:c.speed*3.6,lane:0,points:[point(c.start,0),point(c.end,1)],policeTraffic:c});
 }
 return scenario;
}
export function crossingETA(car,quarry){
 const c=car.obj.policeTraffic,path=quarry.arcade;if(!path?.route?.length)return null;
 if(car.trafficCrossIndex===undefined){let best=Infinity;for(let i=0;i<=path.finishIndex;i++){const pt=path.route[i],d=Math.hypot(pt.x-c.cross[0],pt.z-c.cross[1]);if(d<best){best=d;car.trafficCrossIndex=i;}}}
 const distance=(car.trafficCrossIndex-path.index)*1.35;
 const qv=quarry.body.linvel(),speed=clamp(Math.hypot(qv.x,qv.z),12,29),civilDistance=Math.hypot(c.cross[0]-c.start[0],c.cross[1]-c.start[1]);
 return {distance,quarry:distance/speed,civil:civilDistance/c.speed+.35};
}
export function crossingRelease(c,eta,qdist){
 if(!eta)return qdist<c.range;
 const lead=c.id==='industrial'?2.45:c.id==='market'?.65:c.id==='avenue'?1.45:.75;
 return eta.distance>=-4&&eta.quarry<=eta.civil+lead;
}
export function trafficCommand(car,quarry,time){
 const c=car.obj.policeTraffic,p=car.body.translation(),q=quarry.body.translation();
 const qdist=Math.hypot(q.x-c.trigger[0],q.z-c.trigger[1]),eta=crossingETA(car,quarry);
 const release=crossingRelease(c,eta,qdist);
 if(!car.trafficReleased&&release){car.trafficReleased=true;car.trafficReleaseAt=time;car.parked=false;}
 if(!car.trafficReleased)return {target:{x:c.end[0],z:c.end[1]},speed:0};
 const dx=c.end[0]-c.start[0],dz=c.end[1]-c.start[1],len=Math.hypot(dx,dz);
 const remaining=((c.end[0]-p.x)*dx+(c.end[1]-p.z)*dz)/len;
 const speed=Math.min(c.speed,Math.sqrt(Math.max(0,remaining-1)*5));
 if(!car.trafficCrossed&&remaining<=Math.hypot(c.end[0]-c.cross[0],c.end[1]-c.cross[1])){car.trafficCrossed=true;car.trafficCrossAt=time;car.trafficSeparation=Math.hypot(q.x-c.cross[0],q.z-c.cross[1]);}
 if(remaining<1.8&&Math.hypot(car.body.linvel().x,car.body.linvel().z)<1.4)car.trafficDone=true;
 return {target:{x:c.end[0]+dx/len*4,z:c.end[1]+dz/len*4},speed:car.trafficDone?0:speed};
}
export function trafficAvoidance(car,cars){
 const p=car.body.translation(),f=Math.sin(car.yaw),g=Math.cos(car.yaw);
 let best=null;
 for(const other of cars){
  if(!other.obj.policeTraffic||!other.trafficReleased||other.trafficDone||other.disabled)continue;
  const q=other.body.translation(),v=other.body.linvel(),lead=.28;
  const dx=q.x+v.x*lead-p.x,dz=q.z+v.z*lead-p.z,along=dx*f+dz*g,side=dx*g-dz*f;
  if(along<3||along>19||Math.abs(side)>4.5)continue;
  if(!best||along<best.along)best={along,side};
 }
 if(!best)return {shift:0,factor:1};
 const weight=clamp((19-best.along)/13,.25,1);
 return {shift:(best.side>=0?-1:1)*1.5*weight,factor:1-.36*weight};
}
