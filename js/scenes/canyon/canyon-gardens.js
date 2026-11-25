import {THREE as T,random,bake} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const palette={
 stone:'#f5dfb9',rim:'#fff0d3',sand:'#d6a77c',terracotta:'#c66c46',
 wood:'#8e694e',dark:'#315b4f',leaf:'#25834d',lime:'#80b854',
 blue:'#1d839d',rose:'#ed389e',pink:'#ff82b8',gold:'#f7c359',
 lavender:'#806cb5',sea:'#167baa',metal:'#d7bc80'
};
const cache=new Map();
const mat=color=>{
 if(!cache.has(color))cache.set(color,new T.MeshStandardMaterial({color,roughness:.78,metalness:.025,flatShading:true}));
 return cache.get(color);
};
const mesh=(group,geo,color,shadow=true)=>{
 const m=new T.Mesh(geo,typeof color==='string'?mat(color):color);
 m.castShadow=shadow;m.receiveShadow=shadow;m.raycast=()=>{};
 group.add(m);return m;
};
const cube=(group,w,h,d,x,y,z,color)=>{
 const m=mesh(group,new T.BoxGeometry(w,h,d),color);
 m.position.set(x,y,z);return m;
};
const pillar=(group,r1,r2,h,x,y,z,color,sides=9)=>{
 const m=mesh(group,new T.CylinderGeometry(r1,r2,h,sides),color);
 m.position.set(x,y,z);return m;
};
const stone=(group,r,x,y,z,color,subdiv=1)=>{
 const m=mesh(group,new T.IcosahedronGeometry(r,subdiv),color);
 m.position.set(x,y,z);return m;
};
function inst(root,geo,color,positions,shadow=true){
 if(!positions.length)return;
 const group=new T.InstancedMesh(geo,mat(color),positions.length),v=new T.Object3D();
 for(let i=0;i<positions.length;i++){
  const p=positions[i];
  v.position.set(p.x,p.y,p.z);
  v.rotation.set(p.rx||0,p.ry||0,p.rz||0);
  v.scale.set(p.sx||1,p.sy||1,p.sz||1);
  v.updateMatrix();group.setMatrixAt(i,v.matrix);
 }
 group.instanceMatrix.needsUpdate=true;group.castShadow=shadow;group.receiveShadow=shadow;group.raycast=()=>{};
 root.add(group);
}
function seal(root){root.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});}
function finish(group){
 const originals=new Set();
 group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry)originals.add(o.geometry);});
 bake(group,o=>o.isInstancedMesh);
 for(const geo of originals)geo.dispose();
 seal(group);
}
function safeDistance(x,z,points){let d=1e8;for(const p of points)d=Math.min(d,Math.hypot(p.x-x,p.z-z));return d;}
const route=()=>Array.from({length:350},(_,i)=>lane(i/350));

export function addTerracedVineyards(root,ground){
 const rng=random(318122),track=route(),spots=[
  [.055,1,23],[.185,1,24],[.30,-1,23],[.41,1,23],
  [.54,-1,22],[.63,1,23],[.74,-1,22],[.845,1,24],[.94,-1,23]
 ];
 const leaves=[[],[],[]],grapes=[[],[]],trunks=[],vineCount=[];
 let vineyards=0,terraces=0;
 for(let index=0;index<spots.length;index++){
  const [t,side,offset]=spots[index],p=lane(t,side*offset);
  if(Math.abs(p.x)>61||Math.abs(p.z)>54||safeDistance(p.x,p.z,track)<17.5)continue;
  const q=lane(t+.003,side*offset),g=new T.Group();
  g.position.set(p.x,ground(p.x,p.z)+.15,p.z);
  g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);
  root.add(g);vineyards++;
  const w=12.5;
  for(let level=0;level<3;level++){
   const x=(level-1)*3.85,h=level*.54;
   cube(g,3.5,.28,w,x,h+.10,0,level===1?palette.stone:palette.rim);
   cube(g,.38,1.1,w+.2,x-1.57,h-.17,0,level%2?palette.sand:palette.stone);
   cube(g,.29,.12,w+.42,x-1.57,h+.39,0,palette.rim);
   for(let k=0;k<13;k++){
    const z=-5.65+k*.94,px=x+.33,pz=z;
    const height=1.25+.16*rng();
    const yaw=g.rotation.y,c=Math.cos(yaw),sn=Math.sin(yaw);
    trunks.push({x:p.x+px*c+pz*sn,y:g.position.y+h+.36+height*.47,z:p.z-px*sn+pz*c,sx:.85,sy:height/1.9,sz:.85});
    for(let b=0;b<3;b++){
     const a=b*2.399963+(k%3)*.33;
     const dx=Math.cos(a)*.48,dy=.07*Math.sin(k+b),dz=Math.sin(a)*.38;
     const pos=new T.Vector3(px+dx,h+height+dy+.24,pz+dz);
     pos.applyAxisAngle(new T.Vector3(0,1,0),g.rotation.y);
     const world={x:p.x+pos.x,y:g.position.y+pos.y,z:p.z+pos.z,sx:.61,sy:.44,sz:.58,ry:rng()*6.28};
     leaves[(k+b)%3].push(world);
     if(k%3===0){
      grapes[(k+b)%2].push({x:world.x+.13,y:world.y-.4,z:world.z+.13,sx:.17,sy:.21,sz:.15});
     }
    }
   }
   terraces++;
  }
  for(const side of [-1,1]){
   cube(g,.38,.28,14,side*6.15,-.12,0,palette.sand);
  }
  for(let j=0;j<4;j++){
   const x=(j%2?-1:1)*6.2,z=j<2?-5.3:5.3;
   pillar(g,.41,.48,.86,x,.42,z,palette.terracotta);
   stone(g,.58,x,1.12,z,j%2?palette.lime:palette.leaf);
  }
  finish(g);
 }
 inst(root,new T.CylinderGeometry(.11,.16,1.9,7),palette.wood,trunks);
 inst(root,new T.IcosahedronGeometry(.85,1),'#378f4c',leaves[0]);
 inst(root,new T.IcosahedronGeometry(.85,1),'#61ad54',leaves[1]);
 inst(root,new T.IcosahedronGeometry(.85,1),'#8fbb58',leaves[2]);
 inst(root,new T.IcosahedronGeometry(1,0),'#b06ab0',grapes[0]);
 inst(root,new T.IcosahedronGeometry(1,0),'#e7b66a',grapes[1]);
 return {vineyards,terraces,foliageClumps:leaves.reduce((n,l)=>n+l.length,0)};
}

export function addFlowerPergolas(root,ground){
 const track=route(),sites=[[.26,1,15.6],[.46,-1,16.4],[.82,1,15.8]],canopy=[[],[],[]];
 let pergolas=0;
 for(let index=0;index<sites.length;index++){
  const [t,side,offset]=sites[index],p=lane(t,side*offset);
  if(safeDistance(p.x,p.z,track)<12.6)continue;
  const next=lane(t+.002,side*offset),g=new T.Group();
  g.position.set(p.x,ground(p.x,p.z)+.16,p.z);g.rotation.y=Math.atan2(next.x-p.x,next.z-p.z);
  root.add(g);
  const frame=palette.wood,w=5.8,d=11.6,h=3.45;
  for(const x of [-w/2,w/2]){
   for(const z of [-d/2+1,0,d/2-1])pillar(g,.14,.17,h,x,h/2,z,frame,8);
   cube(g,.18,.25,d+.2,x,h,0,frame);
  }
  for(let z=-d/2;z<d/2;z+=1.2)cube(g,w+.45,.13,.23,0,h+.18,z,frame);
  cube(g,w+.6,.18,.31,0,h+1.05,-d/2+.5,palette.terracotta);
  for(let k=0;k<35;k++){
   const rz=-d/2+(k%12)*.95,rx=(Math.floor(k/12)-1)*2.2;
   const flower=stone(g,.37,rx,h+.35+Math.sin(k)*.1,rz,k%3===0?palette.pink:k%3===1?palette.rose:palette.lime,1);
   flower.scale.set(.88,.54,.86);
  }
  for(let side of [-1,1]){
   for(let z of [-3.5,0,3.5]){
    cube(g,1.6,.20,.68,side*4.15,.74,z,palette.sand);
    cube(g,1.35,.86,.16,side*4.25,1.12,z-.34,palette.wood);
   }
  }
  finish(g);
  pergolas++;
 }
 return {pergolas};
}

function lighthouse(root,ground,track){
 const anchors=[[-61,36],[-62,26],[-59,42],[-64,-14]];
 const selected=anchors.find(([x,z])=>safeDistance(x,z,track)>18);
 if(!selected)return null;
 const [x,z]=selected,g=new T.Group();g.position.set(x,ground(x,z)+.1,z);root.add(g);
 pillar(g,5.1,5.3,.8,0,.40,0,palette.stone,12);
 for(let i=0;i<5;i++){
  pillar(g,3.05-i*.16,3.3-i*.16,4.0,0,2.8+i*3.6,0,i%2?palette.rim:palette.terracotta,12);
 }
 pillar(g,3.48,3.5,.50,0,19.3,0,palette.sand,14);
 pillar(g,2.62,2.62,3.0,0,21.0,0,palette.blue,12);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  pillar(g,.08,.08,2.8,2.82*Math.sin(a),21.0,2.82*Math.cos(a),palette.metal,6);
  pillar(g,.045,.045,1.25,3.4*Math.sin(a),20.25,3.4*Math.cos(a),palette.stone,6);
 }
 for(const yy of [19.5,21.0]){
  const ring=mesh(g,new T.TorusGeometry(3.43,.11,8,32),palette.metal);
  ring.rotation.x=Math.PI/2;ring.position.y=yy;
 }
 pillar(g,3.15,3.15,.28,0,22.65,0,palette.rim,14);
 const cap=mesh(g,new T.ConeGeometry(3.6,2.65,12),palette.terracotta);
 cap.position.y=24.07;
 pillar(g,.08,.09,1.45,0,25.98,0,palette.stone,8);
 stone(g,.34,0,26.85,0,palette.gold);
 for(const yy of [6.4,10.6,14.4]){
  const win=cube(g,1.20,1.64,.14,0,yy,2.76,palette.dark);
  cube(g,1.43,.14,.26,0,yy-1,2.86,palette.stone);
  cube(g,.12,1.6,.20,0,yy,2.88,palette.rim);
 }
 cube(g,1.49,2.8,.16,0,1.78,3.13,palette.wood);
 cube(g,.12,.26,.1,.48,1.63,3.24,palette.gold);
 finish(g);
 return {x,z};
}
function harbor(root){
 const g=new T.Group();g.position.set(-90,-4.39,26);root.add(g);
 cube(g,33,.35,3.4,0,.2,0,palette.wood);
 cube(g,5.2,.34,20,-13.75,.2,0,palette.wood);
 const posts=[];
 for(let i=0;i<17;i++){
  const x=-16+i*2;
  for(const z of [-1.35,1.35])posts.push({x,y:-.82,z,sx:1,sy:1,sz:1});
 }
 for(let i=0;i<11;i++)posts.push({x:-13.75,y:-.82,z:-9+i*1.8});
 inst(g,new T.CylinderGeometry(.13,.19,2.5,7),palette.sand,posts);
 for(const x of [-10,-5,0,5,10]){
  const canopy=mesh(g,new T.ConeGeometry(2.1,1.15,8),x%3===0?palette.gold:palette.rose);
  canopy.position.set(x,2.74,0);canopy.rotation.y=Math.PI/8;
  pillar(g,.07,.08,2.15,x,1.36,0,palette.stone,8);
 }
 for(let side of [-1,1]){
  for(let i=0;i<5;i++){
   const x=-10+i*5;
   cube(g,1.25,.16,.55,x,.60,side*3.25,palette.sand);
   cube(g,1.18,.74,.12,x,.90,side*3.68,palette.wood);
   cube(g,.10,.52,.12,x-.44,.3,side*3.3,palette.wood);
   cube(g,.10,.52,.12,x+.44,.3,side*3.3,palette.wood);
  }
 }
 finish(g);
 return {pierLength:33,umbrellas:5};
}
export function addRivieraLandmarks(root,ground){
 const lighthousePosition=lighthouse(root,ground,route());
 const marina=harbor(root);
 return {lighthouse:lighthousePosition,marina};
}
export function resetGardenMaterials(){cache.clear();}
