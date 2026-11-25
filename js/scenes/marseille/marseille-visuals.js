import {THREE as T,random,bake,label} from '../../core/util.js';
import {marseilleLane,marseilleWidth,marseilleSectors} from './marseille-track.js';
import {decorateMarseilleRoad} from './marseille-road.js';
import {addCalanqueViaduct,addMountainGallery,resetMarseilleSpectacleMaterials} from './marseille-spectacles.js';
import {addVieuxPortDistrict} from './marseille-vieux-port.js';
import {addMarseilleUrbanBoulevard} from './marseille-boulevard.js';

const plaster=['#f5d2a4','#fff0ce','#efbca0','#e9d4b2','#edd8bf','#e4bd94'];
const roofs=['#b95945','#da8053','#c66c49','#ea9960'];
const bushes=['#28794d','#3f9f59','#7db74f'];
const flowers=['#f13e9a','#ff8bbd','#f7c34b'];
const stone=['#eccda3','#d7aa7d','#f8e3be','#b98b6f'];
const cache=new Map();
const mat=(color,rough=.88)=>{
 const key=color+rough;
 if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:rough,metalness:0,flatShading:true,side:T.DoubleSide}));
 return cache.get(key);
};
function visual(root,geo,color,shadow=true){
 const mesh=new T.Mesh(geo,typeof color==='string'?mat(color):color);
 mesh.castShadow=shadow;mesh.receiveShadow=shadow;mesh.raycast=()=>{};root.add(mesh);return mesh;
}
function cube(g,w,h,d,x,y,z,color){
 const mesh=visual(g,new T.BoxGeometry(w,h,d),color);mesh.position.set(x,y,z);return mesh;
}
function orb(g,r,x,y,z,color,lod=0){
 const mesh=visual(g,new T.IcosahedronGeometry(r,lod),color);mesh.position.set(x,y,z);return mesh;
}
function inst(root,geo,color,list,shadow=true){
 if(!list.length)return;
 const mesh=new T.InstancedMesh(geo,mat(color),list.length),q=new T.Object3D();
 list.forEach((p,i)=>{
  q.position.set(p.x,p.y,p.z);q.rotation.set(0,p.yaw||0,0);
  q.scale.set(p.sx||1,p.sy||1,p.sz||1);q.updateMatrix();mesh.setMatrixAt(i,q.matrix);
 });
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=shadow;mesh.receiveShadow=shadow;mesh.raycast=()=>{};root.add(mesh);
}
function finish(g){
 const geo=new Set();
 g.traverse(o=>{if(o.isMesh&&o.geometry&&!o.isInstancedMesh)geo.add(o.geometry);});
 bake(g,o=>o.isInstancedMesh);
 for(const item of geo)item.dispose();
 g.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});
}
const centerSamples=Array.from({length:420},(_,i)=>marseilleLane(i/420));
function distanceToRoad(x,z){
 let min=Infinity;
 for(const p of centerSamples){const v=(x-p.x)**2+(z-p.z)**2;if(v<min)min=v;}
 return Math.sqrt(min);
}
function safe(x,z,margin=21){
 return x>-299&&x<320&&Math.abs(z)<270&&distanceToRoad(x,z)>margin;
}
function water(root,ground){
 const sea=visual(root,new T.PlaneGeometry(310,670),new T.MeshStandardMaterial({
  color:'#0879b5',roughness:.24,metalness:.05,side:T.DoubleSide
 }),false);
 sea.rotation.x=-Math.PI/2;sea.position.set(-403,-11.7,0);
 const shallows=visual(root,new T.PlaneGeometry(55,600),new T.MeshBasicMaterial({
  color:'#23c9d6',transparent:true,opacity:.37,depthWrite:false,side:T.DoubleSide
 }),false);
 shallows.rotation.x=-Math.PI/2;shallows.position.set(-318,-11.64,0);
 const surf=[],color=[],N=180,levels=[0,1,2,3,4];
 const shades=['#f5e1bc','#d4ad88','#c69c72','#f5ddb1'];
 for(let i=0;i<N;i++){
  const z=-295+i*590/N,z1=-295+(i+1)*590/N,coast=z=>-300+6*Math.sin(z*.026)+4*Math.sin(z*.064);
  const x=coast(z),y=coast(z1);
  const vertices=(x,z,b)=>[x-b*2.8,ground(x+2,z)*(1-b/4)-11.45*(b/4)+.08*(1-b/4),z];
  for(let band=0;band<4;band++){
   const a=vertices(x,z,band),b=vertices(y,z1,band),c=vertices(x,z,band+1),d=vertices(y,z1,band+1),col=new T.Color(shades[(band+Math.floor(i/9))%shades.length]);
   for(const p of [a,c,b,b,c,d]){surf.push(...p);color.push(col.r,col.g,col.b);}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(surf,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(color,3));geo.computeVertexNormals();
 visual(root,geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1,flatShading:true}),false);
 const foam=[];
 for(let i=0;i<70;i++){const z=-270+i*7.7;
  const x=-307+5*Math.sin(z*.026)+3*Math.sin(z*.06);
  foam.push({x,y:-11.58,z,sx:.18,sy:.04,sz:2.7});
 }
 inst(root,new T.BoxGeometry(1,1,1),'#b5fff2',foam,false);
 const waves=[[],[],[]],rng=random(1707);
 for(let i=0;i<90;i++){
  const x=-330-rng()*180,z=-285+rng()*570;
  waves[i%3].push({x,y:-11.60,z,sx:1.4+rng()*2.4,sy:.025,sz:.07+rng()*.04,yaw:rng()*.2});
 }
 for(let i=0;i<3;i++)inst(root,new T.BoxGeometry(1,1,1),['#65e1ed','#d2ffff','#a5f1ef'][i],waves[i],false);
 return {cliffSegments:N,waves:90};
}
function vegetation(root,ground){
 const rng=random(59327),trunks=[],needles=[[],[],[]],shrubs=[[],[],[]],blossoms=[[],[],[]],rocks=[[],[],[]];
 let trees=0;
 for(let i=0;i<720;i++){
  const x=-300+rng()*610,z=-267+rng()*535;
  if(!safe(x,z,17))continue;
  const q=ground(x,z),scale=.74+rng()*.95;
  if(i%5===0){
   rocks[i%3].push({x,y:q+scale*.46,z,sx:scale*2.25,sy:scale*.82,sz:scale*1.74,yaw:rng()*Math.PI});
  }else if(i%3===0){
   shrubs[i%3].push({x,y:q+.63*scale,z,sx:.9*scale,sy:.62*scale,sz:.9*scale,yaw:rng()*6});
   for(let k=0;k<5;k++){
    const a=k*2.399+rng()*.18;
    blossoms[(i+k)%3].push({x:x+Math.cos(a)*.62*scale,y:q+1.05*scale,
      z:z+Math.sin(a)*.62*scale,sx:.15*scale,sy:.14*scale,sz:.15*scale});
   }
  }else{
   trees++;trunks.push({x,y:q+1.25*scale,z,sx:scale,sy:scale,sz:scale});
   needles[i%3].push({x,y:q+3.00*scale,z,sx:1.22*scale,sy:1.16*scale,sz:1.25*scale,yaw:rng()*6});
   needles[(i+1)%3].push({x,y:q+4.2*scale,z,sx:.9*scale,sy:.95*scale,sz:.9*scale,yaw:rng()*6});
  }
 }
 inst(root,new T.CylinderGeometry(.23,.37,2.5,7),'#977455',trunks);
 for(let i=0;i<3;i++){
  inst(root,new T.ConeGeometry(1.45,3.4,8),['#176e4a','#2d9153','#529d53'][i],needles[i]);
  inst(root,new T.IcosahedronGeometry(1,1),bushes[i],shrubs[i]);
  inst(root,new T.IcosahedronGeometry(1,0),flowers[i],blossoms[i],false);
  inst(root,new T.IcosahedronGeometry(1,1),stone[i],rocks[i]);
 }
 return {pineTrees:trees,rockClusters:rocks.reduce((a,v)=>a+v.length,0),flowerClusters:blossoms.reduce((a,v)=>a+v.length,0)};
}
function house(root,x,z,index,ground,variant=0){
 const rng=random(index*17+37);
 const g=new T.Group();g.position.set(x,ground(x,z)+.10,z);g.rotation.y=(rng()-.5)*.4;root.add(g);
 const w=6.1+rng()*3.3,d=5.3+rng()*2.8,h=4.8+rng()*5.0,c=plaster[index%plaster.length];
 cube(g,w,h,d,0,h/2,0,c);
 cube(g,w+.4,.24,d+.3,0,h-.16,0,'#ffe9c9');
 const roof=visual(g,new T.ConeGeometry(Math.max(w,d)*.76,2.25,4),roofs[index%roofs.length]);
 roof.position.y=h+1.04;roof.rotation.y=Math.PI/4;roof.scale.z=.85;
 for(let floor=0;floor<(h>7.5?2:1);floor++){
  for(let j=-1;j<=1;j+=2){
   const xx=j*w*.27,yy=2.0+floor*2.8;
   cube(g,1.20,1.55,.12,xx,yy,d/2+.08,'#f8dfbb');
   cube(g,1.00,1.34,.14,xx,yy,d/2+.16,'#1d839c');
   cube(g,.08,1.36,.16,xx,yy,d/2+.25,'#d7e6e2');
   cube(g,.20,1.57,.16,xx+j*.75,yy,d/2+.22,'#408b65');
   cube(g,1.50,.16,.30,xx,yy-.86,d/2+.23,'#e9be96');
  }
 }
 cube(g,1.36,2.28,.15,0,1.26,d/2+.11,'#906b4d');
 if(index%3===0){
  for(let j=0;j<8;j++)cube(g,w/8,.12,1.65,-w*.44+j*w/8,h*.56,d/2+.8,
    j%2?'#fff4e1':'#ef9d4f');
 }
 cube(g,w+.2,.22,.3,0,.36,d/2+.18,'#e3b489');
 finish(g);
 return g;
}
function towns(root,ground){
 const clusters=[
  {x:217,z:156,count:21,spread:65},
  {x:191,z:-112,count:16,spread:57},
  {x:-92,z:180,count:20,spread:70},
  {x:-209,z:-238,count:19,spread:56}
 ];
 const rng=random(21993);
 let count=0;const districts=[];
 for(const cluster of clusters){
  let placed=0;
  for(let i=0;i<cluster.count*16&&placed<cluster.count;i++){
   const x=cluster.x+(rng()-.5)*cluster.spread,z=cluster.z+(rng()-.5)*cluster.spread;
   if(!safe(x,z,18))continue;
   house(root,x,z,count+1,ground);
   count++;placed++;
  }
  districts.push(placed);
 }
 return {houses:count,districts};
}
function oldPort(root,ground){
 const g=new T.Group();g.position.set(-309,-11.1,-196);root.add(g);
 const dock=cube(g,88,1.8,42,0,.45,0,'#b7a48e');
 cube(g,88,.23,42,0,1.43,0,'#e8d6b6');
 const containers=[[],[],[],[]];
 const colors=['#d97c48','#e8b34f','#257f8e','#a34f55'];
 for(let i=0;i<40;i++){
  const x=-40+(i%10)*8,z=-15+Math.floor(i/10)*9;
  containers[i%4].push({x,y:2.8+Math.floor(i/20)*2,z,sx:7.2,sy:2.65,sz:6.0});
 }
 for(let i=0;i<4;i++)inst(g,new T.BoxGeometry(1,1,1),colors[i],containers[i]);
 for(const craneX of [-30,15]){
  const crane=new T.Group();crane.position.set(craneX,0,-13);g.add(crane);
  cube(crane,1.55,27,1.55,0,14,0,'#ebba65');
  cube(crane,35,1.5,1.85,11.2,27.3,0,'#e4a34d');
  cube(crane,1.45,4.5,2.1,-7.5,27.2,0,'#455967');
  for(let k=0;k<6;k++)cube(crane,.22,1.5,1.0,k*5.1,25.4,0,'#d7883d');
  cube(crane,.16,14,.16,19.3,19.5,0,'#303d45');
  cube(crane,6,.22,4.5,19.3,12.3,0,'#4d6166');
  finish(crane);
 }
 const warehouse=new T.Group();warehouse.position.set(3,1.53,13);g.add(warehouse);
 cube(warehouse,24,9,11,0,4.8,0,'#d7c8a9');
 cube(warehouse,25,.35,12,0,9.60,0,'#a97859');
 for(let i=-2;i<=2;i++){
  cube(warehouse,3.3,5.2,.18,i*4.3,3.0,5.60,'#3b7791');
  cube(warehouse,3.7,.15,.3,i*4.3,5.68,5.72,'#fff1da');
 }
 finish(warehouse);
 return {cranes:2,containers:40,warehouses:1};
}
function roadSigns(root,ground){
 const signs=[
  [.055,'VIEUX PORT'],[.26,'CORNICHE'],[.49,'CALANQUES'],[.70,'SORMIOU'],[.88,'MARSEILLE']
 ];
 for(const [t,txt] of signs){
  const p=marseilleLane(t,marseilleWidth(t)/2+8),q=marseilleLane(t+.001,marseilleWidth(t)/2+8);
  const g=new T.Group();g.position.set(p.x,ground(p.x,p.z),p.z);g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);root.add(g);
  cube(g,.20,4.5,.2,-2.7,2.25,0,'#657c78');
  cube(g,.20,4.5,.2,2.7,2.25,0,'#657c78');
  cube(g,6.0,1.55,.20,0,4.45,0,'#277c94');
  label(g,txt,5.45,.82,0,4.45,.15,'#277c94','#fff1d1');
  for(const child of g.children)if(child.isMesh)child.raycast=()=>{};
 }
 return {directionSigns:signs.length};
}
export function decorateMarseilleTerrain(data,ground){
 cache.clear();
 resetMarseilleSpectacleMaterials();
 const root=new T.Group();root.name='MARSEILLE · 3D scenery';
 const sea=water(root,ground),road=decorateMarseilleRoad(root,ground);
 const hills=vegetation(root,ground),village=towns(root,ground);
 const port=oldPort(root,ground),vieuxPort=addVieuxPortDistrict(root,ground),boulevard=addMarseilleUrbanBoulevard(root,ground),viaduct=addCalanqueViaduct(root,ground),mountain=addMountainGallery(root,ground),signs=roadSigns(root,ground);
 root.userData.stats={...sea,...road,...hills,...village,...port,...vieuxPort,...boulevard,...viaduct,...mountain,...signs,vieuxPortDistrict:vieuxPort,urbanBoulevard:boulevard};
 return root;
}
