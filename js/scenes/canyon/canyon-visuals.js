import {THREE as T,random,bake} from '../../core/util.js';
import {lane} from './canyon-assets.js';
import {addCoastalPromenade,addSailboats,addHillsideVillage,addDistantHorizon,resetRivieraMaterials} from './canyon-riviera-details.js';
import {addRaceSurfaceArt,addLandmark,addFloweringOlives,resetShowcaseMaterials} from './canyon-showcase.js';
import {addTerracedVineyards,addFlowerPergolas,addRivieraLandmarks,resetGardenMaterials} from './canyon-gardens.js';
import {addScenicCoastline,resetCoastMaterials} from './canyon-coastline.js';
import {addRoadsideCorniche,resetCornicheMaterials} from './canyon-corniche.js';
import {addIllustratedRaceway} from './canyon-pavement.js';
import {addSignatureCafe,resetSignatureCafeMaterials} from './canyon-overlook.js';

const walls=['#fff0cf','#f9d9ae','#f8e6cc','#e8c8a4','#ffebd2'];
const roofs=['#d16e47','#d98a59','#c56f4c','#e4a06a'];
const foliage=['#176b42','#249349','#43aa4d','#79b742','#d0cb42'];
const flowers=['#f72b9b','#ff61b4','#ffa6d4','#f7c23c'];
const materials=new Map();
const mat=(c,rough=.87)=>{
 const key=c+'-'+rough;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:rough,metalness:0,flatShading:true}));
 return materials.get(key);
};
function add(parent,geo,color,shadow=true){
 const m=new T.Mesh(geo,typeof color==='string'?mat(color):color);
 m.castShadow=shadow;m.receiveShadow=shadow;m.raycast=()=>{};
 parent.add(m);return m;
}
function block(g,w,h,d,x,y,z,color){
 const m=add(g,new T.BoxGeometry(w,h,d),color);
 m.position.set(x,y,z);return m;
}
function round(g,r,x,y,z,color,detail=0){
 const m=add(g,new T.IcosahedronGeometry(r,detail),color);
 m.position.set(x,y,z);return m;
}
function roof(g,w,d,h,color){
 const p=[-w/2,h,-d/2,0,h+1.18,-d/2,w/2,h,-d/2,
          -w/2,h,d/2,w/2,h,d/2,0,h+1.18,d/2];
 const triangles=[0,1,2,3,4,5,0,3,5,0,5,1,1,5,4,1,4,2,0,2,4,0,4,3];
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(p,3));
 geo.setIndex(triangles);geo.computeVertexNormals();
 add(g,geo,new T.MeshStandardMaterial({color,roughness:.83,side:T.DoubleSide,flatShading:true}));
 block(g,w+.20,.18,d+.24,0,h-.08,0,'#b76649');
 block(g,.12,.10,d+.15,0,h+1.17,0,'#f1b17d');
}
function villa(root,x,z,yaw,variant,ground){
 const g=new T.Group();g.position.set(x,ground(x,z)+.08,z);g.rotation.y=yaw;
 root.add(g);
 const w=5.8+(variant%3)*.65,d=5.2+(variant%2)*.5,h=4.75+(variant%3)*.55;
 const plaster=walls[variant%walls.length],terracotta=roofs[variant%roofs.length];
 block(g,w,h,d,0,h/2,0,plaster);
 block(g,w+.15,.18,d+.15,0,.17,0,'#dfb589');
 block(g,w+.3,.23,d+.3,0,h-.28,0,'#ffefcc');
 roof(g,w+.28,d+.35,h,terracotta);
 for(const side of [-1,1]){
  for(let i=-1;i<=1;i++){
   const px=i*1.72,py=h*.56,face=side*(d/2+.015);
   block(g,1.09,1.50,.10,px,py,face,'#fff7de');
   block(g,.88,1.29,.115,px,py,face+side*.072,'#195e83');
   block(g,.045,1.28,.14,px,py,face+side*.145,'#dce9dd');
   block(g,.19,1.47,.16,px-.59,py,face+side*.14,'#2d855f');
   block(g,.19,1.47,.16,px+.59,py,face+side*.14,'#2d855f');
   block(g,1.32,.14,.25,px,py-.82,face+side*.13,'#e6bd93');
  }
 }
 for(const side of [-1,1])for(const i of [-1,1]){
  block(g,.1,1.45,1.20,side*(w/2+.02),h*.57,i*1.55,'#fff4da');
 }
 const front=d/2+.07;
 block(g,1.43,2.12,.14,0,1.16,front,'#fff1d0');
 block(g,1.19,1.89,.15,0,1.13,front+.09,'#48765a');
 block(g,.055,.24,.08,.37,1.04,front+.19,'#eac27c');
 for(const side of [-1,1]){
  const cx=side*(w*.27);
  block(g,1.40,1.42,.13,cx,1.84,front,'#fff4d9');
  block(g,1.19,1.20,.15,cx,1.85,front+.10,'#267ba0');
  block(g,.055,1.23,.16,cx,1.85,front+.2,'#e7e8c7');
  block(g,1.62,.13,.38,cx,1.13,front+.14,'#efd1aa');
 }
 if(variant%3!==1){
  block(g,w-.45,.16,1.86,0,3.2,front+1.03,'#f5f0dd');
  for(let i=0;i<9;i++)block(g,(w-.5)/9,.045,1.83,-w*.45+i*(w-.5)/9,3.31,front+1.04,i%2?'#fff8e1':'#f2a24d').rotation.x=-.16;
  block(g,w-.42,.15,.13,0,3.01,front+1.95,'#b95c41');
 }
 for(const side of [-1,1]){
  const px=side*(w*.44);
  block(g,.72,.72,.72,px,.40,front+1.25,'#c78155');
  round(g,.55,px,1.03,front+1.25,foliage[(variant+2)%foliage.length],1);
  for(let k=0;k<5;k++){
   const a=k*Math.PI*2/5;
   round(g,.19,px+Math.sin(a)*.38,1.27+Math.cos(a)*.10,front+1.25+Math.cos(a)*.35,flowers[(variant+k)%flowers.length]);
  }
 }
 if(variant%2===0){
  const tx=w*.22,tz=front+3;
  block(g,.98,.09,.94,tx,1.02,tz,'#ddaf73');
  block(g,.11,.98,.11,tx,.56,tz,'#805e40');
  for(const side of [-1,1]){
   block(g,.68,.11,.58,tx+side*1.08,.72,tz,'#ad784b');
   block(g,.08,.8,.08,tx+side*1.08,.4,tz,'#765845');
  }
 }
 bake(g);
 for(const part of g.children)if(part.isMesh)part.raycast=()=>{};
 return g;
}
function instanced(root,geometry,color,placements){
 if(!placements.length)return;
 const m=new T.InstancedMesh(geometry,mat(color),placements.length);
 const tmp=new T.Object3D();
 placements.forEach((p,i)=>{
  tmp.position.set(p.x,p.y,p.z);
  tmp.rotation.set(p.pitch||0,p.yaw||0,p.tilt||0);
  tmp.scale.set(p.sx||1,p.sy||1,p.sz||1);
  tmp.updateMatrix();m.setMatrixAt(i,tmp.matrix);
 });
 m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;m.raycast=()=>{};
 root.add(m);
}
function planting(root,ground){
 const rng=random(250783),trees=[],trunks=[],canopies=[],blooms=[[],[],[],[]];
 for(let i=0;i<67;i++){
  const t=(i+.17+rng()*.6)/67,side=i%2?-1:1,offset=11.5+rng()*15;
  const p=lane(t,side*offset),scale=.73+rng()*1.1;
  trees.push({x:p.x,y:ground(p.x,p.z)+2.7*scale,z:p.z,sx:.92*scale,sy:scale,sz:.92*scale,yaw:rng()*6});
  trunks.push({x:p.x,y:ground(p.x,p.z)+1.10*scale,z:p.z,sx:scale,sy:scale,sz:scale});
 }
 instanced(root,new T.CylinderGeometry(.19,.26,2.2,7),'#9d7352',trunks);
 instanced(root,new T.ConeGeometry(1.08,5.3,9),'#19774a',trees);
 for(let i=0;i<205;i++){
  const t=rng(),side=rng()<.5?-1:1,p=lane(t,side*(9.3+rng()*16));
  const y=ground(p.x,p.z)+.47,scale=.72+rng()*.7;
  canopies.push({x:p.x,y,z:p.z,sx:scale,sy:.65*scale,sz:scale});
  for(let j=0;j<4;j++){
   const a=rng()*Math.PI*2,r=.22+rng()*.43,kind=Math.floor(rng()*4);
   blooms[kind].push({x:p.x+Math.cos(a)*r*scale,y:y+.27*scale+rng()*.28,z:p.z+Math.sin(a)*r*scale,sx:.18*scale,sy:.16*scale,sz:.18*scale});
  }
 }
 instanced(root,new T.IcosahedronGeometry(1,1),'#3d9f4b',canopies);
 blooms.forEach((items,i)=>instanced(root,new T.IcosahedronGeometry(1,0),flowers[i],items));
}
function waterAndCliffs(root,ground){
 const ocean=add(root,new T.PlaneGeometry(200,190),new T.MeshStandardMaterial({color:'#087fbe',roughness:.36,metalness:.05}),false);
 ocean.rotation.x=-Math.PI/2;ocean.position.set(-164,-4.7,0);ocean.receiveShadow=false;
 const seaShallower=add(root,new T.PlaneGeometry(20,128),new T.MeshBasicMaterial({color:'#1bc8dc',transparent:true,opacity:.36,depthWrite:false}),false);
 seaShallower.rotation.x=-Math.PI/2;seaShallower.position.set(-72.3,-4.64,0);
 const rng=random(75131);
 const foam=[];
 for(let i=0;i<38;i++){
  const z=-58+i*3.1,offset=Math.sin(i*.65)*.36;
  foam.push({x:-70.5+offset,y:-4.59,z,pitch:-Math.PI/2,sx:.15,sy:1.65+rng()*.5,sz:1});
 }
 instanced(root,new T.PlaneGeometry(2,1),'#b8fcfa',foam);
 for(let i=0;i<28;i++){
  const x=-86-rng()*70,z=-56+rng()*112;
  const wave=add(root,new T.PlaneGeometry(1.8+rng()*3.6,.07+rng()*.08),new T.MeshBasicMaterial({color:i%3?'#78e6f4':'#eafaff',transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false}),false);
  wave.rotation.x=-Math.PI/2;wave.rotation.z=rng()*.2;wave.position.set(x,-4.59,z);
 }
 for(const [x,z,s] of [[-179,-35,1],[-201,25,.82],[-154,64,.72]]){
  const island=add(root,new T.IcosahedronGeometry(13,1),'#6a9b9c');
  island.position.set(x,-3,z);island.scale.set(1.35*s,.62*s,.83*s);
 }
}
export function decorateCanyonTerrain(data,ground){
 materials.clear();
 resetRivieraMaterials();
 resetShowcaseMaterials();
 resetGardenMaterials();
 resetCoastMaterials();
 resetCornicheMaterials();
 resetSignatureCafeMaterials();
 const root=new T.Group();root.name='Sierra Cobre · Riviera scenery';
 waterAndCliffs(root,ground);
 addScenicCoastline(root,ground);
 addDistantHorizon(root);
 addSailboats(root);
 const houses=[
  [.045,-22,.05,0],[.132,21,.30,1],[.245,-21,-.15,2],
  [.362,22,.2,3],[.505,-21,.12,4],[.645,20,-.22,5],[.768,-21,.18,6],[.889,22,-.1,7]
 ];
 for(const [t,offset,turn,i] of houses){
  const p=lane(t,offset),q=lane(t+.001,offset);
  villa(root,p.x,p.z,Math.atan2(q.x-p.x,q.z-p.z)+turn,i,ground);
 }
 addHillsideVillage(root,ground,villa);
 addSignatureCafe(root,ground);
 planting(root,ground);
 addFloweringOlives(root,ground);
 addTerracedVineyards(root,ground);
 addFlowerPergolas(root,ground);
 addRivieraLandmarks(root,ground);
 addLandmark(root,ground);
 addCoastalPromenade(root,ground);
 addRoadsideCorniche(root,ground);
 addIllustratedRaceway(root);
 addRaceSurfaceArt(root);
 return root;
}
