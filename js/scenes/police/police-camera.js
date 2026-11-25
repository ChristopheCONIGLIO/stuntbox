import {THREE as T,clamp} from '../../core/util.js';
let framingCamera;
export function frameChase(focus,offset,subjects,aspect,baseFov){
 const camera=framingCamera??=new T.PerspectiveCamera(38,1,.08,1800);camera.fov=baseFov;camera.aspect=aspect;
 camera.position.copy(focus).add(offset);camera.lookAt(focus);camera.updateMatrixWorld(true);
 let scale=1;
 for(const subject of subjects){
  const point=subject.clone().applyMatrix4(camera.matrixWorldInverse),depth=-point.z;
  if(depth<1)continue;
  const half=depth*Math.tan(baseFov*Math.PI/360);
  scale=Math.max(scale,(Math.abs(point.x)+2.6)/(half*aspect*.84),(Math.abs(point.y)+2.8)/(half*.82));
 }
 return clamp(2*Math.atan(Math.tan(baseFov*Math.PI/360)*scale)*180/Math.PI,baseFov,60);
}
export function stuntShot(position,velocity){
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const gate=smooth((position.x-94)/16)*smooth((146-position.x)/15)*smooth((position.z-69)/5);
 const air=smooth((position.y-.3)/2.1),landing=gate*smooth((position.x-123)/9);
 return {weight:gate,air,lateral:gate*(.78+air*.48),height:gate*(7+air*6),lead:gate*clamp(Math.hypot(velocity.x,velocity.z)*.16,0,4),distance:-2*gate,fov:-2*gate,groundFocus:gate*air*.38,landing};
}
export function escapeReveal(time,exitTime){
 if(!Number.isFinite(exitTime)||time<=exitTime)return 0;
 const t=clamp((time-exitTime)/2.4,0,1);
 return t*t*(3-2*t);
}
export function chaseHeading(route,index,fallback){
 const a=route[Math.max(0,index-4)],b=route[Math.min(route.length-1,index+8)];
 const dir=new T.Vector3((b?.x??0)-(a?.x??0),0,(b?.z??0)-(a?.z??0));
 return dir.lengthSq()>.001?dir.normalize():new T.Vector3(Math.sin(fallback),0,Math.cos(fallback));
}

export function actionCamera(speed,slip,steer,impact,stunt,reveal){
 const drift=clamp((Math.abs(slip)-1.5)/5,0,1)*clamp((speed-8)/9,0,1);
 const pace=clamp((speed-12)/15,0,1);
 const available=(1-clamp(stunt,0,1))*(1-clamp(reveal,0,1));
 const close=available*(.25+.75*Math.max(drift,pace))*(1-.55*clamp(impact,0,1));
 return {drift,lower:5.5*close,side:available*drift*Math.sign(steer||1)*.38,lead:available*pace*2.2,fov:3*close};
}
export function visualTick(ticks,police,offset=0){return !police||((ticks+offset)&1)===0;}

export function impactShot(hit,focus,time){
 if(!hit)return 0;
 const age=time-hit.time;
 if(age<0||age>=1.25)return 0;
 const distance=Math.hypot(hit.x-focus.x,hit.z-focus.z);
 const proximity=clamp(1-distance/26,0,1);
 const strength=clamp((hit.speed-5)/17,0,1);
 return proximity*strength*(1-age/1.25)**2;
}
export function chooseImpact(previous,hit,focus,time){
 const candidate={x:hit.x,y:hit.y,z:hit.z,speed:hit.speed,time};
 const score=impactShot(candidate,focus,time);
 return score>.035&&score>=impactShot(previous,focus,time)?candidate:previous;
}

export function escapeShot(reveal,speed){
 const r=clamp(reveal,0,1),pace=clamp(speed/22,0,1);
 return {lead:r*(2+pace*2),height:-r*(5+pace*3),side:r*.32,distance:r*2,fov:-r*(3+pace)};
}

export function openingShot(time,impact=0){
 const u=clamp((time-.55)/2.2,0,1),weight=1-u*u*(3-2*u),w=weight*(1-.4*clamp(impact,0,1));
 return {weight:w,height:-8*w,distance:5*w,side:.63*w,fov:-4*w,lead:-2.1*w,peerFocus:.30+.18*w};
}

export function blockadeShot(p,impact=0){
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const w=smooth((p.x+23)/15)*smooth((27-p.x)/13)*smooth((10-Math.abs(p.z))/5);
 const anticipation=w*smooth((8-p.x)/14);
 return {weight:w,lead:6*anticipation,height:3*w,side:.85*w,distance:-2*w,fov:2*w,subject:anticipation>.35,impact:w*clamp(impact,0,1)};
}

export function escapeDriftShot(reveal,slip,speed,x){
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const w=smooth(reveal)*smooth((x-166)/18),drift=smooth((Math.abs(slip)-.8)/3.5)*smooth((speed-8)/10);
 return {weight:w,side:w*(.86+.16*drift),height:-5*w,distance:-1*w,lead:-2.3*w,fov:-3*w,peerFocus:1-.75*w};
}

export function industrialShot(p,speed,slip,impact){
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const w=smooth((p.z-10)/12)*smooth((66-p.z)/12)*smooth((10-Math.abs(p.x-48))/4);
 const drift=smooth((Math.abs(slip)-1)/4)*smooth((speed-8)/9);
 const close=w*(1-.55*clamp(impact,0,1));
 return {weight:w,height:-6*close,side:-w*(.72+.18*drift),distance:3*close,lead:-1.8*w,fov:-2*close,peerFocus:.30+.13*w};
}

export function marketCrossingShot(p,civil,impact=0){
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const w=smooth((p.z+72)/14)*smooth((-19-p.z)/13)*smooth((10-Math.abs(p.x+42))/4);
 const proximity=civil?smooth((30-Math.hypot(civil.x-p.x,civil.z-p.z))/14):0;
 const crossing=w*proximity;
 const close=w*(1-.5*clamp(impact,0,1));
 return {weight:w,side:.92*close,height:-4*close+2*crossing,distance:2.5*close,lead:3.4*w,fov:2*crossing-2*close,trafficFocus:.22*crossing,subject:crossing>.32};
}

export function escapePeerFraming(weight,distance,rank=0){
 const w=clamp(weight,0,1),smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const radius=23-w*(rank===0?5:12);
 const visibility=1-smooth((distance-radius+3)/3);
 return {radius,visibility,focus:(1-.75*w)*visibility+w*(rank===0?.65:0)*visibility};
}

export function openingComposition(focus,heading,subjects,aspect,height,back,baseFov,nominalSide,lift=()=>0){
 if(subjects.length<2||aspect<=0)return {delta:0,extra:0,up:0,baseline:null,selected:null};
 const tan=Math.tan(baseFov*Math.PI/360);
 const score=(delta,extra,up)=>{
  const a=nominalSide+delta,c=Math.cos(a),s=Math.sin(a),x=(heading.x*c+heading.z*s)*(back-extra),z=(heading.z*c-heading.x*s)*(back-extra),y0=height+up,y=y0+Math.max(0,lift({x,y:y0,z}));
  const flat=Math.hypot(x,z),dist=Math.hypot(flat,y);if(flat<.001||dist<1)return null;
  const points=subjects.map(p=>{const dx=p.x-focus.x,dy=p.y-focus.y,dz=p.z-focus.z;return {x:(z*dx-x*dz)/flat,y:(-x*y*dx+flat*flat*dy-z*y*dz)/(flat*dist),depth:dist-(x*dx+y*dy+z*dz)/dist};});
  if(points.some(p=>p.depth<1))return null;
  let scale=1;for(const p of points)scale=Math.max(scale,(Math.abs(p.x)+2.6)/(p.depth*tan*aspect*.84),(Math.abs(p.y)+2.8)/(p.depth*tan*.82));
  const fov=Math.min(60,2*Math.atan(tan*scale)*180/Math.PI),f=Math.tan(fov*Math.PI/360);
  const projected=points.map(p=>({x:p.x/(p.depth*f*aspect),y:p.y/(p.depth*f),size:2.6/(p.depth*f)}));
  let sep=2;for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++){const a=projected[i],b=projected[j];sep=Math.min(sep,Math.hypot((a.x-b.x)*aspect,a.y-b.y)/(a.size+b.size));}
  const overflow=Math.max(0,...projected.map((p,i)=>Math.max((Math.abs(p.x)+2.6/(points[i].depth*f*aspect))/.84-1,(Math.abs(p.y)+2.8/(points[i].depth*f))/.82-1)));
  return {delta,extra,up,score:-8*overflow+Math.min(sep,2)*.65+projected[0].size*4-(y-y0)*.045-Math.abs(delta)*.05-extra*.012-up*.025,fov,separation:sep,overflow,subjectScale:projected[0].size};
 };
 const baseline=score(0,0,0);if(!baseline)return {delta:0,extra:0,up:0,baseline:null,selected:null};
 let best=baseline;
 for(const d of [0,-.35,.35,-.7,.7,-1.05,1.05])for(const e of [0,3,6,9])for(const u of [0,3,6]){
  if(d===0&&e===0&&u===0)continue;
  const a=score(d,e,u);if(a&&a.overflow<=baseline.overflow+1e-8&&a.score>best.score)best=a;
 }
 if(best.score<baseline.score+.035)best=baseline;
 return {delta:best.delta,extra:best.extra,up:best.up,baseline,selected:best};
}
