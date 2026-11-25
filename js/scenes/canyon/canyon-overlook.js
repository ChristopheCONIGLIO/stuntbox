import {THREE as T,random,bake} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const tones={
 plaster:'#fff0d5',cream:'#f5dab0',trim:'#e1b58b',stone:'#fae5bd',
 mortar:'#c99a70',terracotta:'#cf704c',roof:'#b95439',sand:'#eec79e',
 glass:'#1c7294',glassLight:'#4aafc3',shutter:'#237655',wood:'#78573e',
 awning:'#f59c39',awningLight:'#fff7e3',leaf:'#27864d',
 leafLight:'#58af55',petal:'#fa3d9b',pink:'#ff8dc4',gold:'#f3ca48'
};
const cache=new Map();
const m=color=>{
 if(!cache.has(color))cache.set(color,new T.MeshStandardMaterial({color,roughness:.82,metalness:0,flatShading:true,side:T.DoubleSide}));
 return cache.get(color);
};
function add(g,geo,color,cast=true){
 const mesh=new T.Mesh(geo,m(color));mesh.castShadow=cast;mesh.receiveShadow=cast;mesh.raycast=()=>{};
 g.add(mesh);return mesh;
}
function box(g,w,h,d,x,y,z,color){
 const o=add(g,new T.BoxGeometry(w,h,d),color);o.position.set(x,y,z);return o;
}
function cyl(g,r,h,x,y,z,color,sides=9){
 const o=add(g,new T.CylinderGeometry(r,r*.85,h,sides),color);o.position.set(x,y,z);return o;
}
function orb(g,r,x,y,z,color,detail=1){
 const o=add(g,new T.IcosahedronGeometry(r,detail),color);o.position.set(x,y,z);return o;
}
function batch(root,geo,color,arr){
 if(!arr.length)return;
 const inst=new T.InstancedMesh(geo,m(color),arr.length),tmp=new T.Object3D();
 for(let i=0;i<arr.length;i++){
  const p=arr[i];
  tmp.position.set(p.x,p.y,p.z);tmp.rotation.set(p.rx||0,p.ry||0,p.rz||0);
  tmp.scale.set(p.sx||1,p.sy||1,p.sz||1);tmp.updateMatrix();inst.setMatrixAt(i,tmp.matrix);
 }
 inst.instanceMatrix.needsUpdate=true;inst.castShadow=true;inst.receiveShadow=true;inst.raycast=()=>{};
 root.add(inst);
}
function bakeVisuals(group){
 const original=new Set();
 group.traverse(o=>{if(o.isMesh&&o.geometry&&!o.isInstancedMesh)original.add(o.geometry);});
 bake(group,o=>o.isInstancedMesh);
 for(const geometry of original)geometry.dispose();
 group.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});
}
function stoneArch(g,width,height,depth,x,y,z){
 const shape=new T.Shape(),half=width/2;
 shape.moveTo(-half,0);shape.lineTo(half,0);
 shape.lineTo(half,height);shape.lineTo(-half,height);shape.closePath();
 const hole=new T.Path(),radius=width*.33;
 hole.moveTo(-radius,-.15);hole.lineTo(radius,-.15);
 hole.lineTo(radius,height*.39);
 hole.absarc(0,height*.39,radius,0,Math.PI,false);hole.closePath();
 shape.holes.push(hole);
 const geo=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:14});
 const arch=add(g,geo,tones.stone);arch.position.set(x,y,z);
 box(g,width+.16,.18,depth+.16,x,y+height+.1,z+depth*.5,tones.trim);
}
function villa(g){
 const a=new T.Group();g.add(a);
 box(a,11.2,7.3,6.5,0,3.70,-3.7,tones.plaster);
 box(a,11.65,.28,6.90,0,.26,-3.7,tones.mortar);
 box(a,11.60,.24,6.98,0,3.68,-3.7,tones.cream);
 for(const x of [-5.65,5.65]){
  box(a,.33,7.5,.35,x,3.65,-.30,tones.stone);
  box(a,.33,7.5,.35,x,3.65,-7.10,tones.stone);
 }
 for(let i=0;i<2;i++){
  const x=i===0?-3:3;
  const z=-.355;
  box(a,1.92,2.19,.18,x,5.48,z,tones.stone);
  box(a,1.63,1.93,.20,x,5.52,z+.12,tones.glass);
  box(a,.07,1.96,.23,x,5.52,z+.22,tones.awningLight);
  box(a,2.18,.20,.43,x,4.37,z+.22,tones.trim);
  for(const side of [-1,1]){
   const shutter=box(a,.47,1.95,.12,x+side*1.20,5.50,z+.19,tones.shutter);
   shutter.rotation.y=side*.18;
   box(a,.08,1.78,.16,x+side*1.24,5.50,z+.28,tones.wood);
  }
 }
 box(a,2.25,3.30,.22,0,1.85,-.34,tones.stone);
 box(a,1.98,3.10,.24,0,1.83,-.19,tones.glass);
 for(let side of [-1,1])box(a,.10,3.16,.25,side*.55,1.83,-.02,tones.awningLight);
 box(a,2.44,.25,.46,0,3.55,-.03,tones.trim);
 for(const side of [-1,1]){
  const x=side*3.27;
  box(a,1.72,1.68,.20,x,1.93,-.32,tones.stone);
  box(a,1.54,1.46,.22,x,1.94,-.18,tones.glassLight);
  box(a,.09,1.46,.25,x,1.94,-.04,tones.awningLight);
  box(a,1.94,.17,.36,x,1.04,-.04,tones.sand);
 }
 for(const side of [-1,1]){
  const roof=box(a,6.03,.25,7.31,side*2.70,7.84,-3.63,tones.terracotta);
  roof.rotation.z=side*.28;
  for(let k=0;k<10;k++){
   const x=side*(.18+k*.55);
   const tile=box(a,.080,.09,7.45,x,8.02-.28*(Math.abs(x)-.17),-3.63,k%2?tones.roof:tones.cream);
   tile.rotation.z=side*.28;
  }
 }
 box(a,.31,.23,7.37,0,8.72,-3.63,tones.roof);
 box(a,.70,1.10,.75,3.18,8.50,-5.28,tones.cream);
 box(a,.92,.16,.93,3.18,9.07,-5.28,tones.terracotta);
 const canopy=new T.Group();a.add(canopy);
 for(let k=0;k<12;k++){
  const strip=box(canopy,.81,.09,3.04,-4.65+k*.845,4.52,1.18,k%2?tones.awningLight:tones.awning);
  strip.rotation.x=-.18;
  const valance=box(canopy,.82,.28,.08,-4.65+k*.845,4.21,2.70,k%2?tones.awningLight:tones.awning);
  valance.rotation.x=-.10;
 }
 for(let i of [-1,1]){
  cyl(a,.105,4.11,i*4.62,2.20,2.68,tones.wood,8);
  box(a,.25,.16,3.4,i*4.62,4.48,1.28,tones.wood);
 }
 box(a,10.58,.15,.35,0,4.59,2.65,tones.wood);
 bakeVisuals(a);
}
function terrace(g){
 const patio=new T.Group();g.add(patio);
 box(patio,12.6,.34,7.50,0,.18,3.43,tones.stone);
 box(patio,12.64,.18,7.54,0,.39,3.43,tones.trim);
 for(let i=-4;i<=4;i++)box(patio,.025,.025,7.5,i*1.38,.49,3.43,tones.mortar);
 for(let i=0;i<6;i++)box(patio,12.65,.026,.035,0,.49,.13+i*1.25,tones.mortar);
 for(let i=-2;i<=2;i++){
  stoneArch(patio,2.48,1.38,.26,i*2.50,.49,6.87);
  box(patio,.37,1.83,.42,i*2.51+1.2,1.20,6.75,tones.cream);
  box(patio,.72,.18,.70,i*2.51+1.2,2.05,6.75,tones.stone);
 }
 for(const x of [-5.5,5.5]){
  box(patio,.40,1.98,6.95,x,1.42,3.28,tones.stone);
  box(patio,.65,.18,7.00,x,2.42,3.28,tones.trim);
 }
 const tables=[[-2.65,2.43],[2.55,2.45]];
 for(const [x,z] of tables){
  cyl(patio,.67,.14,x,1.22,z,tones.wood,16);
  cyl(patio,.09,1.05,x,.70,z,tones.wood,8);
  for(let i=0;i<4;i++){
   const ang=i*Math.PI/2,dx=Math.cos(ang)*1.22,dz=Math.sin(ang)*1.22;
   box(patio,.63,.13,.62,x+dx,.80,z+dz,tones.terracotta);
   box(patio,.64,.83,.12,x+dx,.99,z+dz+(dz>=0?.31:-.31),tones.wood);
   for(let s of [-1,1])box(patio,.075,.67,.08,x+dx+s*.23,.42,z+dz,tones.wood);
  }
  cyl(patio,.10,.42,x,1.48,z,tones.wood,8);
  orb(patio,.30,x,1.79,z,tones.petal,0);
 }
 for(const x of [-5.6,5.6]){
  for(const z of [.75,5.7]){
   cyl(patio,.52,.84,x,.82,z,tones.terracotta,10);
   box(patio,.99,.17,.98,x,1.30,z,tones.cream);
  }
 }
 bakeVisuals(patio);
}
function foliage(g){
 const rng=random(15723),leaves=[[],[],[]],flowers=[[],[],[]],fruits=[],trunks=[];
 for(const side of [-1,1]){
  const tx=side*6.1,tz=-2.30,scale=1.03;
  trunks.push({x:tx,y:1.68,z:tz,sx:scale,sy:scale,sz:scale});
  for(let i=0;i<9;i++){
   const a=i*2.3999,r=.55+(i%3)*.31;
   leaves[i%3].push({x:tx+Math.cos(a)*r,y:3.35+Math.sin(i*.5)*.36,z:tz+Math.sin(a)*r,sx:.92,sy:.60,sz:.91});
   for(let k=0;k<4;k++){
    const theta=k*2.3999+i*.41;
    fruits.push({x:tx+Math.cos(a)*r+Math.sin(theta)*.46,y:3.1+Math.sin(i+k)*.23,z:tz+Math.sin(a)*r+Math.cos(theta)*.45,sx:.15,sy:.17,sz:.15});
   }
  }
 }
 const planters=[[-5.9,.92],[5.9,.92],[-5.9,5.76],[5.9,5.76],[-3.8,6.45],[0,6.45],[3.8,6.45]];
 for(const [x,z] of planters){
  leaves[1].push({x,y:1.82,z,sx:.67,sy:.52,sz:.68});
  for(let i=0;i<22;i++){
   const a=i*2.399963+rng()*.1,rad=.33+.40*rng(),kind=i%3;
   flowers[kind].push({x:x+Math.sin(a)*rad,y:1.85+rng()*.47,z:z+Math.cos(a)*rad,sx:.16,sy:.15,sz:.16});
  }
 }
 batch(g,new T.CylinderGeometry(.18,.28,3.1,8),tones.wood,trunks);
 ['#27864d','#59a947','#a9c348'].forEach((c,i)=>batch(g,new T.IcosahedronGeometry(1,1),c,leaves[i]));
 batch(g,new T.IcosahedronGeometry(1,0),tones.gold,fruits);
 [tones.petal,tones.pink,tones.gold].forEach((c,i)=>batch(g,new T.IcosahedronGeometry(1,0),c,flowers[i]));
 return {trees:2,lemonFruits:fruits.length,flowers:flowers.reduce((n,a)=>n+a.length,0)};
}
export function addSignatureCafe(root,ground){
 const t=.055,offset=16,origin=lane(t,offset),road=lane(t,0);
 const g=new T.Group();g.name='Sierra Cobre · Coastal café — overlook';
 g.position.set(origin.x,ground(origin.x,origin.z)+.16,origin.z);
 g.rotation.y=Math.atan2(road.x-origin.x,road.z-origin.z);
 root.add(g);
 villa(g);
 terrace(g);
 const plants=foliage(g);
 return {position:[origin.x,origin.z],...plants};
}
export function resetSignatureCafeMaterials(){cache.clear();}
