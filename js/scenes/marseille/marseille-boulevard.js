import {THREE as T,random,bake} from '../../core/util.js';
import {marseilleLane,marseilleWidth} from './marseille-track.js';

const C={
 limestone:'#f2d4a9',chalk:'#ffedcf',sand:'#d8ab7e',shadow:'#bd8f6b',
 pale:'#fff2d5',plaster:['#ffecd4','#f6cdad','#e7b79c','#e7d2ba','#e8c9a1'],
 roof:['#bd6148','#dc8054','#ac523f'],wood:'#8a654f',steel:'#60777b',
 glazing:'#238ba1',turquoise:'#4fa6ae',green:'#2f8452',olive:'#6fa953',
 flower:'#f13c98',pink:'#ff91c4',gold:'#f7c958',orange:'#ed9854',
 asphalt:'#30354d',dark:'#293f4d'
};
const materials=new Map();
function mat(color,roughness=.85){
 const key=color+':'+roughness;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness:0,flatShading:true,side:T.DoubleSide}));
 return materials.get(key);
}
function mesh(parent,geometry,color,shadow=false){
 const m=new T.Mesh(geometry,typeof color==='string'?mat(color):color);
 m.castShadow=shadow;m.receiveShadow=true;m.raycast=()=>{};parent.add(m);return m;
}
function box(g,w,h,d,x,y,z,color){
 const m=mesh(g,new T.BoxGeometry(w,h,d),color,true);
 m.position.set(x,y,z);return m;
}
function cylinder(g,r,h,x,y,z,color,n=10){
 const m=mesh(g,new T.CylinderGeometry(r,r*.88,h,n),color,true);
 m.position.set(x,y,z);return m;
}
function batch(root,geometry,color,arr,shadows=false){
 if(!arr.length)return;
 const g=new T.InstancedMesh(geometry,mat(color),arr.length),temp=new T.Object3D();
 for(let i=0;i<arr.length;i++){
  const a=arr[i];temp.position.set(a.x,a.y,a.z);
  temp.rotation.set(a.rx||0,a.yaw||0,a.rz||0);
  temp.scale.set(a.sx??1,a.sy??1,a.sz??1);temp.updateMatrix();g.setMatrixAt(i,temp.matrix);
 }
 g.instanceMatrix.needsUpdate=true;g.castShadow=shadows;g.receiveShadow=true;g.raycast=()=>{};root.add(g);
}
function finish(g){
 const old=new Set();g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry)old.add(o.geometry);});
 bake(g,o=>o.isInstancedMesh);
 for(const geo of old)geo.dispose();
 g.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});
}
function roadPosition(t,extra){
 const edge=marseilleWidth(t)/2;
 return marseilleLane(t,edge+extra);
}
function driveDirection(t){
 const a=marseilleLane(t-.0002),b=marseilleLane(t+.0002);
 return -Math.atan2(b.z-a.z,b.x-a.x);
}
function arcadeGeometry(){
 const shape=new T.Shape(),w=3.0,h=5.9,r=2.14;
 shape.moveTo(-w,0);shape.lineTo(-w,h);shape.lineTo(w,h);shape.lineTo(w,0);
 shape.lineTo(r,0);shape.lineTo(r,2.84);
 shape.absarc(0,2.84,r,0,Math.PI,false);
 shape.lineTo(-r,0);shape.closePath();
 return new T.ExtrudeGeometry(shape,{depth:2.4,bevelEnabled:false,steps:1,curveSegments:13});
}
function waterfrontTerraces(root,ground){
 const g=new T.Group();g.name='Marseille · Boulevard de la Corniche et galeries marchandes';root.add(g);
 const a=.004,b=.128,n=76,positions=[],colors=[],idx=[],stone=new T.Color(C.chalk);
 const wall=[],cap=[],arches=[],lanterns=[],awnings=[[],[]],pilasters=[],pots=[],leaves=[[],[]],flowers=[[],[],[]];
 let storeys=0;
 for(let i=0;i<=n;i++){
  const t=a+(b-a)*i/n;
  const near=roadPosition(t,2.9),far=roadPosition(t,16.7);
  const nearY=ground(near.x,near.z),farY=ground(far.x,far.z);
  for(const [p,y] of [[near,nearY],[far,farY]]){positions.push(p.x,y+.19,p.z);colors.push(stone.r,stone.g,stone.b);}
  if(i<n){const v=i*2;idx.push(v,v+2,v+1,v+1,v+2,v+3);}
  if(i%2!==0||i===n)continue;
  const yaw=driveDirection(t),p=roadPosition(t,16.6);
  const q=roadPosition(t,5.3),z=ground(p.x,p.z);
  const span=(b-a)*2376/n*2;
  wall.push({x:q.x,y:ground(q.x,q.z)+.63,z:q.z,yaw,sx:.36,sy:1.17,sz:span*1.02});
  cap.push({x:q.x,y:ground(q.x,q.z)+1.25,z:q.z,yaw,sx:.70,sy:.24,sz:span*1.05});
  if(i%4!==0)continue;
  const towerDist=Math.hypot(p.x+151,p.z+245);
  if(towerDist<40)continue;
  arches.push({x:p.x,y:z+.2,z:p.z,yaw,sy:1.0,sz:1.0,sx:1.0});
  const back=roadPosition(t,23.8),backY=ground(back.x,back.z);
  pilasters.push({x:back.x,y:backY+3.0,z:back.z,yaw,sx:6.2,sy:6.0,sz:2.4});
  const shade=roadPosition(t,20.7),shadeY=ground(shade.x,shade.z);
  for(let stripe=0;stripe<8;stripe++){
   const dx=(stripe-3.5)*.73;
   awnings[stripe%2].push({
    x:shade.x+Math.cos(yaw)*dx,y:shadeY+5.35,z:shade.z-Math.sin(yaw)*dx,
    yaw,sx:.76,sy:.13,sz:3.35
   });
  }
  if(i%8===0){
   const f=roadPosition(t,11.2),fy=ground(f.x,f.z);
   pots.push({x:f.x,y:fy+.46,z:f.z,sx:.86,sy:.94,sz:.86});
   leaves[i%2].push({x:f.x,y:fy+1.53,z:f.z,sx:1.19,sy:.90,sz:1.12});
   for(let j=0;j<15;j++){
    const theta=j*2.399963;
    flowers[(i+j)%3].push({x:f.x+.77*Math.cos(theta),y:fy+1.94+.19*Math.sin(j*1.7),
     z:f.z+.77*Math.sin(theta),sx:.24,sy:.19,sz:.24});
   }
  }
  storeys++;
 }
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geom.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geom.setIndex(idx);geom.computeVertexNormals();
 mesh(g,geom,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide}),false);
 batch(g,new T.BoxGeometry(1,1,1),C.sand,wall);
 batch(g,new T.BoxGeometry(1,1,1),C.pale,cap);
 batch(g,arcadeGeometry(),C.limestone,arches,true);
 batch(g,new T.BoxGeometry(1,1,1),C.chalk,pilasters,false);
 batch(g,new T.BoxGeometry(1,1,1),C.pale,awnings[0]);
 batch(g,new T.BoxGeometry(1,1,1),C.orange,awnings[1]);
 batch(g,new T.CylinderGeometry(.45,.62,1,9),C.orange,pots,true);
 batch(g,new T.IcosahedronGeometry(1,1),C.green,leaves[0]);
 batch(g,new T.IcosahedronGeometry(1,1),C.olive,leaves[1]);
 [C.flower,C.pink,C.gold].forEach((co,i)=>batch(g,new T.IcosahedronGeometry(1,0),co,flowers[i]));
 const lamps=[];
 for(let i=0;i<20;i++){
  const t=a+(b-a)*(i+.5)/20,p=roadPosition(t,8.5),y=ground(p.x,p.z);
  lamps.push({x:p.x,y:y+2.63,z:p.z,sx:.27,sy:5.1,sz:.27});
 }
 batch(g,new T.BoxGeometry(1,1,1),C.dark,lamps);
 const light=lamps.map(p=>({x:p.x,y:p.y+2.45,z:p.z,sx:.55,sy:.48,sz:.55}));
 batch(g,new T.IcosahedronGeometry(1,0),C.gold,light,false);
 return {terraceSections:n,arcades:arches.length,streetLamps:lamps.length,flowerPots:pots.length,flowers:flowers.flat().length,arcadeLength:295};
}
function storeHouse(g,index){
 const rng=random(801+index*499),w=8.8+rng()*2,h=9.5+rng()*4,d=8.4,facade=d/2+.1;
 box(g,w,h,d,0,h/2,0,C.plaster[index%C.plaster.length]);
 box(g,w+.45,.32,d+.4,0,h+.1,0,C.chalk);
 const roof=mesh(g,new T.ConeGeometry(w*.76,3.3,4),C.roof[index%3],true);
 roof.position.y=h+1.7;roof.rotation.y=Math.PI/4;
 for(let floor=0;floor<3;floor++){
  const yy=2.65+floor*2.95;if(yy+1.1>h-.5)continue;
  for(const side of [-1,1]){
   const xx=side*w*.255;
   box(g,1.6,2.05,.13,xx,yy,facade,C.stone);
   box(g,1.35,1.78,.14,xx,yy,facade+.11,C.glazing);
   box(g,.11,1.81,.15,xx,yy,facade+.23,C.chalk);
   box(g,.42,1.82,.13,xx+side*1.00,yy,facade+.15,C.green);
   box(g,2.05,.25,.53,xx,yy-1.05,facade+.25,C.sand);
   if(floor>=1){
    box(g,2.08,.15,.92,xx,yy-1.13,facade+.54,C.chalk);
    for(let p=0;p<4;p++)box(g,.075,.69,.075,xx-0.78+p*.52,yy-.73,facade+.92,C.dark);
   }
  }
 }
 box(g,2.35,3.05,.20,0,1.55,facade,C.wood);
 box(g,2.65,.26,.47,0,3.13,facade,C.chalk);
 for(let i=0;i<10;i++){
  const aw=box(g,w*.094,.12,2.35,(i-4.5)*w*.094,3.58,facade+.95,i%2?C.pale:C.orange);
  aw.rotation.x=-.12;
 }
 box(g,w+.3,.28,.65,0,.38,facade,C.sand);
 finish(g);
}
function downtown(root,ground){
 const g=new T.Group();g.name='Marseille · City frontage, shops and facades';root.add(g);
 let stores=0;const steps=22;
 for(let i=0;i<steps;i++){
  const t=.006+(.118)*(i+.5)/steps;
  const p=roadPosition(t,31.7);
  if(Math.hypot(p.x+151,p.z+245)<38)continue;
  if(Math.abs(p.x)>275||Math.abs(p.z)>275)continue;
  const building=new T.Group();building.position.set(p.x,ground(p.x,p.z)+.18,p.z);
  building.rotation.y=driveDirection(t);
  g.add(building);storeHouse(building,i);stores++;
 }
 return {newShopHouses:stores};
}
function harborFort(root,ground){
 const g=new T.Group();const x=-274,z=-248;
 g.name='Marseille · Fort Saint-Jean, bastion sur la mer';g.position.set(x,ground(x,z)+.1,z);
 g.rotation.y=.09;root.add(g);
 const stone=C.limestone,sand=C.sand,w=57,d=37;
 box(g,62,1.8,41,0,.9,0,C.shadow);
 box(g,58,1.6,38,0,2.25,0,C.chalk);
 for(const sign of [-1,1]){
  box(g,3.5,10.5,d,sign*w/2,8.0,0,stone);
  box(g,w,10.5,3.4,0,8.0,sign*d/2,stone);
 }
 const notches=[];
 for(let i=0;i<13;i++){
  const x=-26+i*4.3;
  for(const sign of [-1,1])notches.push({x,y:14.5,z:sign*18.5,sx:2.4,sy:2.0,sz:2.5});
 }
 for(let i=0;i<9;i++){
  const z=-17+i*4.15;
  for(const sign of [-1,1])notches.push({x:sign*28.2,y:14.5,z,sx:2.5,sy:2.0,sz:2.4});
 }
 batch(g,new T.BoxGeometry(1,1,1),C.chalk,notches,true);
 for(const xx of [-27,27])for(const zz of [-17,17]){
  const tower=new T.Group();tower.position.set(xx,3.1,zz);g.add(tower);
  box(tower,8,14.8,8,0,7.4,0,C.sand);
  box(tower,9.7,.72,9.7,0,15.1,0,C.chalk);
  for(const s of [-1,1]){
   box(tower,1.3,2.5,.23,s*2.35,10.4,4.1,C.dark);
   box(tower,1.5,.25,.53,s*2.35,9.10,4.22,C.chalk);
  }
  for(const cx of [-3,0,3])box(tower,2.2,1.55,2.1,cx,16.05,3.4,C.chalk);
  finish(tower);
 }
 const keep=new T.Group();keep.position.set(0,3.15,0);g.add(keep);
 box(keep,19,17.6,16,0,8.8,0,C.sand);
 box(keep,20,.6,17,0,17.8,0,C.chalk);
 for(const xx of [-6.5,6.5]){
  for(let floor=0;floor<3;floor++){
   box(keep,2.2,2.4,.26,xx,4.0+floor*4.9,8.18,C.dark);
   box(keep,2.5,.30,.45,xx,2.75+floor*4.9,8.29,C.chalk);
  }
 }
 const bell=mesh(keep,new T.ConeGeometry(11.4,7.5,4),C.roof[1],true);
 bell.position.set(0,21.6,0);bell.rotation.y=Math.PI/4;
 const tower=new T.Group();tower.position.set(8,16.8,-3.1);keep.add(tower);
 box(tower,5.4,16.9,5.4,0,8.45,0,C.chalk);
 for(let level=0;level<3;level++)box(tower,2.0,2.55,.22,0,4.0+level*4.8,2.81,C.dark);
 const cap=mesh(tower,new T.ConeGeometry(4.4,6.2,4),C.roof[2],true);
 cap.position.y=19.8;cap.rotation.y=Math.PI/4;
 box(tower,.30,3.4,.34,0,24.6,0,C.gold);
 finish(keep);
 const courtyard=new T.Group();courtyard.position.set(0,3.1,0);g.add(courtyard);
 for(const x of [-10.5,10.5])for(const z of [-12,12]){
  box(courtyard,2.15,1.45,2.1,x,.75,z,C.orange);
  const plant=mesh(courtyard,new T.IcosahedronGeometry(1.35,1),C.green);
  plant.position.set(x,2.05,z);
  for(let i=0;i<6;i++){const a=i*2.399;
   const fl=mesh(courtyard,new T.IcosahedronGeometry(.24,0),i%2?C.pink:C.flower);
   fl.position.set(x+.95*Math.cos(a),2.37,z+.95*Math.sin(a));
  }
 }
 finish(courtyard);
 return {fortress:1,towers:4,battlements:notches.length,highestPoint:52,position:[x,z]};
}
function harborStairs(root,ground){
 const g=new T.Group();g.name='Marseille · Joliette staircase and market terrace';root.add(g);
 const x=-281,z=-167,base=ground(x,z);
 g.position.set(x,base+.03,z);g.rotation.y=.07;
 const steps=24,width=15.5;
 for(let i=0;i<steps;i++){
  const dz=-11.3+i*.90;
  box(g,width,.17,1.12,0,.32+i*.105,dz,C.chalk);
  box(g,width,.11,.18,0,.24+i*.105,dz-.53,C.sand);
 }
 for(const side of [-1,1]){
  const wall=box(g,.55,4.1,22,side*8.1,2.10,-.6,C.limestone);
  wall.rotation.x=-.10;
  box(g,.82,.23,22.5,side*8.1,4.28,-.6,C.pale);
 }
 const lamps=[],pots=[],flower=[[],[]],bushes=[];
 for(let i=0;i<7;i++)for(const side of [-1,1]){
  const zz=-9.5+i*3.15,xx=side*9.75;
  lamps.push({x:xx,y:2.5+i*.17,z:zz,sx:.22,sy:4.8,sz:.22});
  pots.push({x:side*8.0,y:2.1+i*.17,z:zz,sx:.65,sy:.85,sz:.65});
  bushes.push({x:side*8.0,y:2.75+i*.17,z:zz,sx:.82,sy:.60,sz:.88});
  for(let j=0;j<9;j++){
   const a=j*2.399963;
   flower[j%2].push({x:side*8+.55*Math.cos(a),y:3.1+i*.17,z:zz+.55*Math.sin(a),sx:.18,sy:.18,sz:.18});
  }
 }
 finish(g);
 batch(g,new T.BoxGeometry(1,1,1),C.dark,lamps);
 batch(g,new T.CylinderGeometry(.42,.53,1,9),C.orange,pots);
 batch(g,new T.IcosahedronGeometry(1,1),C.green,bushes);
 batch(g,new T.IcosahedronGeometry(1,0),C.pink,flower[0]);
 batch(g,new T.IcosahedronGeometry(1,0),C.flower,flower[1]);
 root.add(g);
 return {stairSteps:steps,stairLanterns:lamps.length,stairFlowerPots:pots.length};
}
export function addMarseilleUrbanBoulevard(root,ground){
 materials.clear();
 const terrace=waterfrontTerraces(root,ground);
 const houses=downtown(root,ground);
 const fort=harborFort(root,ground);
 const stairs=harborStairs(root,ground);
 return {...terrace,...houses,...fort,...stairs};
}
