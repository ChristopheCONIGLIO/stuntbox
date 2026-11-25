import {policeRamps} from '../scenes/police/police-one.js';
import {assets,propMass,validPropMass} from './registry.js';
import {THREE as T} from './util.js';
import {raceMap} from './practice.js';
import {samples} from '../physics/arcade-drive.js';
import {heightAt} from '../world/terrain.js';
const copy=structuredClone;
export function layoutFor(track,doc={}){
 const stock=track.id==='police-one'?policeRamps:track.id==='canyon'?raceMap(track,track.gates).objects.filter(o=>o.asset.startsWith('jump-')):[];
 return {road:copy(doc.road||doc.gates||track.gates),gates:copy(doc.gates||track.gates),width:doc.width??(track.id==='canyon'?9.6:track.id==='marseille'?16:track.id==='speedway'?15:11.4),ramps:copy(doc.ramps??stock),obstacles:copy(doc.obstacles||[]),groups:copy(doc.groups||[])};
}
export function buildMap(track,layout){
 const {road,width,ramps}=layout,map=raceMap(track,road);
 map.objects=map.objects.filter(o=>!o.asset.startsWith('jump-'));
 const canyon=track.id==='canyon',marseille=track.id==='marseille';
 const stockRoad=JSON.stringify(road)===JSON.stringify(track.gates);
 const keep=canyon&&width===9.6&&stockRoad||marseille&&width===16&&stockRoad||track.id==='police-one'&&stockRoad;
 if(!keep){
  map.objects=map.objects.filter(o=>o.asset!=='practice-road'&&!o.asset.startsWith('canyon-track-'));
  map.objects.push({id:'surface',asset:'practice-road',behavior:'static',p:[0,0,0],r:[0,0,0],s:[1,1,1],gates:road,closed:track.closed,width,terrainId:track.id});
  if(canyon){const t=map.terrain;for(const p of samples(road,true,'canyon')){
   const cx=Math.round((p.x/t.w+.5)*t.nx),cz=Math.round((p.z/t.d+.5)*t.nz),r=Math.ceil(width/4)+1;
   for(let x=Math.max(0,cx-r);x<=Math.min(t.nx,cx+r);x++)for(let z=Math.max(0,cz-r);z<=Math.min(t.nz,cz+r);z++)if(Math.hypot(x-cx,z-cz)<=r)t.h[z*(t.nx+1)+x]=0;
  }}
 }
 if(track.id==='speedway'){
  const add=(asset,p,r,s,extra={})=>map.objects.push({id:'sw'+map.objects.length,asset,p,r,s,behavior:'static',...extra});
  add('speedway-wall',[0,0,0],[0,0,0],[1,1,1],{gates:road,width});
  const path=samples(road,true);
  for(const f of [.08,.16,.58,.65]){
   const i=Math.floor(f*(path.length-1)),p=path[i],d=path[i+1].clone().sub(p).normalize(),side=Math.sign((p.x*d.z-p.z*d.x))||1;
   add('canyon-pit',[p.x+d.z*side*(width/2+5),0,p.z-d.x*side*(width/2+5)],[0,Math.atan2(d.x,d.z)+Math.PI/2,0],[1.2,1.2,1.2]);
  }
 }
 for(const o of [...ramps,...(layout.obstacles||[])]){const a=copy(o);a.p[1]=heightAt(map.terrain,a.p[0],a.p[2])+.04+(a.height||0);map.objects.push(a);}
 for(const group of layout.groups||[]){
  const base=new T.Matrix4().compose(new T.Vector3(group.p[0],heightAt(map.terrain,group.p[0],group.p[2])+.04+(group.height||0),group.p[2]),new T.Quaternion().setFromEuler(new T.Euler(...group.r)),new T.Vector3(...group.s));
  const total=validPropMass(group.mass)?propMass({...group,mass:undefined}):0;
  for(const [i,member] of assets.get(group.asset).members.entries()){
   const local=new T.Matrix4().compose(new T.Vector3(...member.p),new T.Quaternion().setFromEuler(new T.Euler(...member.r)),new T.Vector3(...member.s));
   const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();base.clone().multiply(local).decompose(p,q,s);
   const e=new T.Euler().setFromQuaternion(q);map.objects.push({...copy(member),id:group.id+'-'+i,p:p.toArray(),r:[e.x,e.y,e.z],s:s.toArray(),behavior:group.behavior==='static'?'static':'dynamic',...(total?{mass:group.mass*propMass({...member,s:member.s.map((v,j)=>v*group.s[j])})/total}:{})});
  }
 }
 return map;
}
