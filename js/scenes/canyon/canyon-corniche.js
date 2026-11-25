import {THREE as T,random} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const stone=['#f4d7ae','#e7bb8d','#fff0d0','#d29c78','#f0cda3'];
const petals=['#e92b93','#ff59ad','#ff9cca','#ffd359'];
const greens=['#276f4b','#379950','#63ae4b','#9ac64d'];
const materials=new Map();
const mat=(color,roughness=.88)=>{
 const key=color+':'+roughness;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness:0,side:T.DoubleSide,flatShading:true}));
 return materials.get(key);
};
function mesh(parent,geo,material,shadow=true){
 const m=new T.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=shadow;
 m.raycast=()=>{};parent.add(m);return m;
}
function batch(root,geometry,color,list,shadow=true){
 if(!list.length)return;
 const batch=new T.InstancedMesh(geometry,mat(color),list.length);
 const tmp=new T.Object3D();
 for(let i=0;i<list.length;i++){
  const p=list[i];tmp.position.set(p.x,p.y,p.z);
  tmp.rotation.set(p.rx||0,p.yaw||0,p.rz||0);
  tmp.scale.set(p.sx||1,p.sy||1,p.sz||1);
  tmp.updateMatrix();batch.setMatrixAt(i,tmp.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;batch.castShadow=shadow;batch.receiveShadow=shadow;batch.raycast=()=>{};
 root.add(batch);
}
function generateWalls(root,sections,ground){
 const coords=[],colors=[],palette=stone.map(c=>new T.Color(c)),cap=[],capColors=[];
 const tint=(p,c,to,co)=>{const v=c instanceof T.Color?c:new T.Color(c);for(const a of p){to.push(...a);co.push(v.r,v.g,v.b);}};
 const tri=(a,b,c,v,p,col)=>tint([a,b,c],v,p,col);
 let faces=0,capFaces=0;
 for(const sec of sections){
  const {points,side,level}=sec;
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1];
   const color=palette[(Math.floor(i/3)+level*2)%palette.length];
   const y1=2.0+.27*Math.sin(i*.52+level),y2=2.0+.27*Math.sin((i+1)*.52+level);
   const bands=[0,.28,.65,1];
   for(let k=0;k<3;k++){
    const c0=[a.x,a.h+bands[k]*y1,a.z],c1=[b.x,b.h+bands[k]*y2,b.z];
    const d0=[a.x,a.h+bands[k+1]*y1,a.z],d1=[b.x,b.h+bands[k+1]*y2,b.z];
    tri(c0,d0,c1,color,coords,colors);tri(c1,d0,d1,color,coords,colors);faces+=2;
   }
   const oa=lane(a.t,side*9.1),ob=lane(b.t,side*9.1);
   const c0=[a.x,a.h+y1+.035,a.z],c1=[b.x,b.h+y2+.035,b.z];
   const d0=[oa.x,ground(oa.x,oa.z)+2.07,oa.z],d1=[ob.x,ground(ob.x,ob.z)+2.07,ob.z];
   tri(c0,d0,c1,'#fff0d3',cap,capColors);tri(c1,d0,d1,'#fff0d3',cap,capColors);capFaces+=2;
  }
 }
 function build(positions,colors,roughness){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();
  mesh(root,geo,new T.MeshStandardMaterial({vertexColors:true,roughness,metalness:0,side:T.DoubleSide,flatShading:true}));
 }
 build(coords,colors,.96);build(cap,capColors,.81);
 return {wallFaces:faces,terraceFaces:capFaces};
}
export function addRoadsideCorniche(root,ground){
 const rng=random(221872),track=Array.from({length:550},(_,i)=>lane(i/550));
 const zones=[
  {first:.17,last:.292,side:-1},
  {first:.355,last:.485,side:1},
  {first:.575,last:.707,side:-1},
  {first:.78,last:.909,side:1}
 ];
 const segments=[],buttresses=[],ledges=[],planters=[],bushes=[[],[],[]],flowers=[[],[],[],[]];
 const trunks=[],crowns=[[],[],[]],cypruses=[];
 let totalSegments=0;
 const safe=(p,min=6.6)=>Math.abs(p.x)<64&&Math.abs(p.z)<58&&track.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>min);
 for(let k=0;k<zones.length;k++){
  const z=zones[k],n=46;
  let run=[];
  function flush(){if(run.length>1){segments.push({points:run,side:z.side,level:k});totalSegments+=run.length-1;}run=[];}
  for(let i=0;i<=n;i++){
   const t=z.first+(z.last-z.first)*i/n,p=lane(t,z.side*7.7);
   if(!safe(p)){flush();continue;}
   run.push({x:p.x,z:p.z,h:ground(p.x,p.z)+.05,t});
  }
  flush();
 }
 const wall=generateWalls(root,segments,ground);
 for(const sec of segments){
  for(let i=0;i<sec.points.length;i+=3){
   const p=sec.points[i],back=lane(p.t,sec.side*9.4),foot=lane(p.t,sec.side*10.5);
   const a=lane(p.t+.0007,sec.side*7.7),yaw=Math.atan2(a.x-p.x,a.z-p.z);
   if(!safe(back,7.2))continue;
   buttresses.push({x:p.x,y:p.h+1.10,z:p.z,sx:.5,sy:1.2,sz:.42,yaw});
   ledges.push({x:p.x,y:p.h+2.16,z:p.z,sx:1.7,sy:.12,sz:.55,yaw});
   if(i%6===0){
    planters.push({x:back.x,y:ground(back.x,back.z)+2.34,z:back.z,sx:1.2,sy:.85,sz:1.04,yaw});
   }
   if(!safe(foot,7.5))continue;
   const s=.9+rng()*.7,y=ground(foot.x,foot.z)+1.03*s;
   bushes[(i+sec.level)%3].push({x:foot.x,y,z:foot.z,sx:1.22*s,sy:.89*s,sz:1.17*s});
   for(let j=0;j<11;j++){
    const ang=j*2.399963+.13*i,r=.45+.8*rng(),kind=(j+i)%4;
    flowers[kind].push({
     x:foot.x+Math.cos(ang)*r*s,
     y:y+(.55+rng()*.38)*s,
     z:foot.z+Math.sin(ang)*r*s,
     sx:.20*s,sy:.16*s,sz:.19*s
    });
   }
  }
 }
 const pinePositions=[];
 for(let k=0;k<zones.length;k++){
  const z=zones[k];
  for(let i=0;i<15;i++){
   const t=z.first+(z.last-z.first)*(i+.25)/15,offset=z.side*(12.3+rng()*3.7),p=lane(t,offset);
   if(!safe(p,10.4))continue;
   const scale=.76+rng()*.78,y=ground(p.x,p.z);
   trunks.push({x:p.x,y:y+1.75*scale,z:p.z,sx:scale,sy:scale,sz:scale});
   for(let part=0;part<3;part++){
    const a=part*2.094+(i%3)*.35;
    crowns[(i+part)%3].push({
     x:p.x+Math.cos(a)*1.02*scale,y:y+(4.2+.24*Math.sin(part*1.5))*scale,
     z:p.z+Math.sin(a)*.90*scale,sx:1.9*scale,sy:.65*scale,sz:1.62*scale
    });
   }
   if(i%3===0){
    const q=lane(t,z.side*15.7);
    if(safe(q,10.6))cypruses.push({x:q.x,y:ground(q.x,q.z)+2.8*scale,z:q.z,sx:scale,sy:scale,sz:scale});
   }
  }
 }
 batch(root,new T.BoxGeometry(.53,2.15,.68),'#e8c79c',buttresses);
 batch(root,new T.BoxGeometry(1.75,.22,.77),'#fff1d5',ledges);
 batch(root,new T.CylinderGeometry(.55,.43,.95,9),'#ca7a58',planters);
 for(let i=0;i<3;i++){
  batch(root,new T.IcosahedronGeometry(1,1),greens[i],bushes[i]);
  batch(root,new T.IcosahedronGeometry(1,1),greens[i],crowns[i]);
 }
 for(let i=0;i<4;i++)batch(root,new T.IcosahedronGeometry(1,0),petals[i],flowers[i]);
 batch(root,new T.CylinderGeometry(.17,.28,3.45,8),'#927451',trunks);
 batch(root,new T.ConeGeometry(1.07,5.6,9),'#167949',cypruses);
 return {...wall,sections:segments.length,wallSegments:totalSegments,bushes:bushes.reduce((s,a)=>s+a.length,0),
  largeFlowers:flowers.reduce((s,a)=>s+a.length,0),umbrellaPines:trunks.length,extraCypresses:cypruses.length};
}
export function resetCornicheMaterials(){materials.clear();}
