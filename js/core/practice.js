import {THREE as T,box} from './util.js';
import {samples} from '../physics/arcade-drive.js';
import {blank} from '../world/terrain.js';
import {canyon} from '../scenes/canyon/canyon.js';
import {marseilleGates} from '../scenes/marseille/marseille-track.js';
import {marseilleMap} from '../scenes/marseille/marseille-map.js';
import {policeGates,policeMap,policeScenario} from '../scenes/police/police-one.js';
const P=(x,z)=>[x,.06,z];
export const tracks=[
 {id:'speedway',name:'Speedway · Stock-car',desc:'Stock-car oval',closed:true,gates:[P(-29,-24),P(35,-24),P(65,0),P(35,24),P(-35,24),P(-65,0)]},
 {id:'sprint',name:'Straight Line',desc:'Build up speed',color:'#42ac92',closed:false,gates:[P(-68,0),P(68,0)]},
 {id:'slalom',name:'S-bend',desc:'Link successive drifts',color:'#eebd58',closed:false,gates:[P(-68,12),P(-37,-10),P(-4,12),P(30,-12),P(68,0)]},
 {id:'oval',name:'Small Oval',desc:'Hold a curve',color:'#77a8dd',closed:true,gates:[P(-42,0),P(0,23),P(42,0),P(0,-23)]},
 {id:'canyon',name:'Sierra Cobre',desc:'Race through the canyon',color:'#e68e60',closed:true,gates:[P(-28,-25),P(-22,25),P(15,23),P(37,11),P(34,-21),P(-5,-24)]},
 {id:'marseille',name:'MARSEILLE · Rally & Police Chase',desc:'2.4 km · Coastal road, coves, city and mountains',color:'#26a6be',closed:true,gates:marseilleGates},
 {id:'police-one',name:'Police#1',desc:'Urban pursuit · 25 seconds',closed:false,gates:policeGates}
];
function road(gates,closed,width=11.4,terrainId){
 const line=samples(gates,closed,terrainId),pos=[],colors=[],lanes=[],g=new T.Group();
 const edge=(i,n,y)=>{const a=line[i],b=line[Math.min(line.length-1,i+1)],c=line[Math.max(0,i-1)],d=b.clone().sub(c).normalize();n*=width/11.4;return [a.x+n*d.z,a.y+y,a.z-n*d.x];};
 function band(i,min,max,y,paint){
  const col=new T.Color(paint),a=edge(i,min,y),b=edge(i,max,y),c=edge(i+1,min,y),d=edge(i+1,max,y);
  for(const [v,lane] of [[a,min],[c,min],[d,max],[a,min],[d,max],[b,max]]){pos.push(...v);colors.push(col.r,col.g,col.b);lanes.push(lane);}
 }
 for(let i=0;i<line.length-1;i++){
  const shade=.955+.029*Math.sin(i*.27)+.014*Math.sin(i*1.71);
  band(i,-5.7,5.7,-.025,new T.Color('#292d43').multiplyScalar(shade));
  for(const side of [-1,1]){
   band(i,side*5.18,side*5.65,-.008,i%4<2?'#fff6e9':'#ef3044');
   band(i,side*5.02,side*5.065,-.007,'#33364d');
  }
  if(i%12<5)band(i,-.075,.075,-.005,'#fffaef');
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('roadLane',new T.Float32BufferAttribute(lanes,1));geo.computeVertexNormals();
 const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.91,metalness:.015});
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float roadLane;\nvarying float vRoadLane;\nvarying vec3 vRoadPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRoadPosition=position;\nvRoadLane=roadLane;');
  shader.fragmentShader='varying float vRoadLane;\nvarying vec3 vRoadPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float roadGrain=fract(sin(dot(vRoadPosition.xz,vec2(127.1,311.7)))*43758.5453);
  float roadMottle=sin(vRoadPosition.x*.53+sin(vRoadPosition.z*.39))*.5+.5;
  float roadMask=step(.015,diffuseColor.b-diffuseColor.r);
  float laneA=abs(abs(vRoadLane)-2.18);
  float laneB=abs(abs(vRoadLane)-2.72);
  float rubber=(1.0-smoothstep(.03,.23,laneA))*.13+(1.0-smoothstep(.04,.32,laneB))*.095;
  float roadVariation=(roadGrain-.5)*.045+(roadMottle-.5)*.042-rubber;
  diffuseColor.rgb*=1.0+roadMask*roadVariation;`);
 };
 const m=new T.Mesh(geo,mat);m.receiveShadow=true;g.add(m);
 for(const end of [0,line.length-1]){if(closed&&end)continue;const v=line[end],dir=end?v.clone().sub(line[end-1]):line[1].clone().sub(v),flag=new T.Group();flag.position.copy(v);flag.rotation.y=Math.atan2(dir.x,dir.z);g.add(flag);
 for(let k=0;k<14;k++)for(let j=0;j<2;j++)box(flag,.7,.012,.7,(k-6.5)*.7,.012,j*.7,(j+k)%2?'#272c32':'#fff4dc');}
 return g;
}
export function trainingRoad(color,item){return road(item?.gates||tracks[1].gates,item?.closed||false,item?.width,item?.terrainId);}
export function raceMap(track,gates){
 if(track.id==='canyon')return canyon().map;
 if(track.id==='marseille')return marseilleMap();
 if(track.id==='police-one')return policeMap();
 const map=blank(200,144);map.name=track.name;map.terrain.mat.fill(2);
 const t=map.terrain;t.theme="training";
 for(const p of samples(gates,track.closed)){
  const cx=Math.round((p.x/t.w+.5)*t.nx),cz=Math.round((p.z/t.d+.5)*t.nz);
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dz*dz<6)t.mat[(cz+dz)*(t.nx+1)+cx+dx]=0;
 }
 const add=(asset,x,z,scale=1)=>map.objects.push({id:'p'+map.objects.length,asset,p:[x,0,z],r:[0,0,0],s:[scale,scale,scale],behavior:'static'});
 add('practice-road',0,0);Object.assign(map.objects[0],{gates:structuredClone(gates),closed:track.closed});
 for(const [x,z] of [[-71,-42],[-68,-40],[-31,46],[32,-45],[65,36],[68,38]])add('tree0',x,z,1.5);
 const path=samples(gates,track.closed);
 for(let i=10;i<path.length-5;i+=23){
  const p=path[i],b=path[i+1],d=b.clone().sub(p).normalize(),side=(i%2?1:-1);
  const x=p.x+side*d.z*15,z=p.z-side*d.x*15;
  if(path.every(v=>Math.hypot(x-v.x,z-v.z)>12))add('tree0',x,z,1+(i%3)*.18);
 }
 return map;
}
export function startingGrid(track,gates,count,speed,laps,roster=[]){
 const line=samples(gates,track.closed,track.id),a=line[0],direction=line[1].clone().sub(a).normalize(),yaw=Math.atan2(direction.x,direction.z);
 const colors=['#bc2634','#ffb823','#238cbd','#7bd7b0','#4a4f66','#ee773e','#e5d9c4','#ae62ae'];
 const vehicles=Array.from({length:count},(_,i)=>{
  const lane=count===1?0:(i%2?1:-1)*1.32,back=1+Math.floor(i/2)*5.35+(i%2)*.65;
  let p=a.clone().addScaledVector(direction,-back),heading=yaw;
  if(track.closed){const j=Math.max(1,line.length-1-Math.round(back/1.35));p=line[j];const d=line[(j+1)%line.length].clone().sub(p);heading=Math.atan2(d.x,d.z);}
  return {id:'car'+i,asset:roster[i]||(track.id==='marseille'?['mar-rally-gt','mar-rally-hatch','mar-rally-raid','mar-police-blue','mar-police-interceptor','mar-police-van'][i%6]:(i%3===2?'sport':'muscle')),color:colors[i%colors.length],p:[p.x+Math.cos(heading)*lane,a.y+.08,p.z-Math.sin(heading)*lane],r:[0,heading,0],s:[1,1,1],role:'racer',profile:'aggressive',target:'',lane,
   initial:Math.min(speed,track.id==='canyon'?54:86)+i*.8,speed,points:gates.map((g,j)=>({id:'g'+j,p:g.slice(),radius:5,speed,yaw:0,type:j===gates.length-1?'finish':'waypoint'}))};
 });
 return {version:1,name:track.name,seed:Math.floor(Math.random()*4294967295),mapRevision:1,mapId:'',arcade:{track:track.id,closed:track.closed,laps:track.closed?laps:1},vehicles};
}

export function pursuitGrid(track,gates,speed,laps,fugitive,pursuers){
 const lineup=startingGrid(track,gates,pursuers.length+1,speed,laps,[fugitive,...pursuers]);
 const path=samples(gates,track.closed,track.id),length=path.length-1;
 const rows=Math.ceil(pursuers.length/2),gap=30,rowSpace=8;
 const openLead=gap+(rows-1)*rowSpace+3;
 const position=(car,distance,lane)=>{
  const index=track.closed?((length-Math.round(distance/1.35))%length+length)%length:Math.max(0,Math.min(length-1,Math.round(distance/1.35)));
  const p=path[index],next=path[index+1]||path[1],dir=next.clone().sub(p).normalize(),yaw=Math.atan2(dir.x,dir.z);
  car.p=[p.x+Math.cos(yaw)*lane,p.y+.08,p.z-Math.sin(yaw)*lane];
  car.r=[0,yaw,0];car.lane=lane;
 };
 lineup.pursuit=true;
 const fug=lineup.vehicles[0];fug.role='fugitive';fug.profile='aggressive';
 if(!track.closed)position(fug,openLead,0);
 else position(fug,1,0);
 lineup.vehicles.slice(1).forEach((car,i)=>{
  const row=Math.floor(i/2),side=i%2?-1:1,lane=side*1.65;
  const behind=gap+row*rowSpace;
  position(car,track.closed?behind:openLead-behind,lane);
  car.role='pursuer';car.target='car0';car.speed=Math.min(260,speed*1.2);car.profile='aggressive';
 });
 return track.id==='police-one'?policeScenario(lineup,position):lineup;
}
