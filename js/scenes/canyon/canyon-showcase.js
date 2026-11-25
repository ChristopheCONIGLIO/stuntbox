import {THREE as T,random,bake} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const colors={road:'#fff5dc',rubber:'#101522',stone:'#f5e3c2',sand:'#e4c69f',lime:'#fff1d6',clay:'#cb754f',brick:'#ad553b',pine:'#206e4d',leaf:'#4a9f56',dark:'#265c5a',sea:'#2f8e9b',blossom:'#ff4aab',pink:'#ff9bd0',sun:'#f6c65e',metal:'#8a6a47'};
const mats=new Map();
function m(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.86,metalness:0,flatShading:true}));return mats.get(color);}
function mesh(g,geo,color,cast=true){const o=new T.Mesh(geo,typeof color==='string'?m(color):color);o.castShadow=cast;o.receiveShadow=cast;o.raycast=()=>{};g.add(o);return o;}
function box(g,w,h,d,x,y,z,color){const o=mesh(g,new T.BoxGeometry(w,h,d),color);o.position.set(x,y,z);return o;}
function cylinder(g,r,rt,h,x,y,z,color,n=10){const o=mesh(g,new T.CylinderGeometry(r,rt,h,n),color);o.position.set(x,y,z);return o;}
function ball(g,r,x,y,z,color,detail=1){const o=mesh(g,new T.IcosahedronGeometry(r,detail),color);o.position.set(x,y,z);return o;}
function inst(g,geo,color,array,shadow=true){
 if(!array.length)return;
 const o=new T.InstancedMesh(geo,m(color),array.length),t=new T.Object3D();
 for(let i=0;i<array.length;i++){
  const p=array[i];t.position.set(p.x,p.y,p.z);
  t.rotation.set(p.rx||0,p.ry||0,p.rz||0);
  t.scale.set(p.sx||1,p.sy||1,p.sz||1);
  t.updateMatrix();o.setMatrixAt(i,t.matrix);
 }
 o.instanceMatrix.needsUpdate=true;o.castShadow=shadow;o.receiveShadow=shadow;o.raycast=()=>{};g.add(o);
}
function mergedRibbons(root,entries,color,opacity=1){
 const position=[],tone=new T.Color(color),vertices=[];
 for(const e of entries)for(const p of e)vertices.push(p);
 for(const p of vertices)position.push(p[0],p[1],p[2]);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(position,3));
 geo.computeVertexNormals();
 const mat=new T.MeshBasicMaterial({color:tone,side:T.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity===1,polygonOffset:true,polygonOffsetFactor:-1});
 return mesh(root,geo,mat,false);
}
function quad(a,b,c,d){return [a,c,b,a,d,c];}
export function addRaceSurfaceArt(root){
 const paint=[],worn=[],steps=430;
 const sample=(t,n,y)=>{
  const p=lane(t,n);return [p.x,y,p.z];
 };
 let length=0,prev=lane(0,0);
 for(let i=0;i<steps;i++){
  const t=i/steps,next=(i+1)/steps;
  const center=lane(next,0),dist=Math.hypot(center.x-prev.x,center.z-prev.z),before=length;
  length+=dist;prev=center;
  const dash=Math.floor((before+length)*.5/5.5)%2===0;
  if(dash&&i%3!==0){
   paint.push(quad(sample(t,-.065,.088),sample(next,-.065,.088),sample(next,.065,.088),sample(t,.065,.088)));
  }
  if(i%11!==0){
   for(const side of [-1,1]){
    const n=side*1.71,wide=.22;
    worn.push(quad(sample(t,n-wide,.078),sample(next,n-wide,.078),sample(next,n+wide,.078),sample(t,n+wide,.078)));
   }
  }
 }
 mergedRibbons(root,paint,colors.road,.98);
 mergedRibbons(root,worn,colors.rubber,.22);
 return {centerDashes:paint.length,curbSegments:0,skidSegments:worn.length};
}
function clock(g,z,front=1){
 const face=mesh(g,new T.CylinderGeometry(1.14,1.14,.15,32),'#fff3d6');
 face.rotation.x=Math.PI/2;face.position.set(0,13.5,z+front*.08);
 const ring=mesh(g,new T.TorusGeometry(1.14,.075,6,30),'#d99b63');
 ring.position.set(0,13.5,z+front*.18);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  const dot=ball(g,.055,Math.sin(a)*.91,13.5+Math.cos(a)*.91,z+front*.24,'#765744',0);
  dot.scale.set(1.3,1.3,.60);
 }
 const big=box(g,.10,.70,.055,.13,13.74,z+front*.26,'#765744');big.rotation.z=-.46;
 const small=box(g,.12,.48,.06,-.15,13.62,z+front*.26,'#765744');small.rotation.z=.51;
 ball(g,.115,0,13.5,z+front*.28,'#a56e3f',1);
}
export function addLandmark(root,ground){
 const spots=[[-53,6],[-52,-9],[51,8],[0,51],[-48,-28],[47,-31]];
 const circuit=Array.from({length:320},(_,i)=>lane(i/320,0));
 const safe=spots.filter(([x,z])=>circuit.every(p=>Math.hypot(p.x-x,p.z-z)>16.5));
 if(!safe.length)return {towers:0,terraces:0};
 const [x,z]=safe[0],group=new T.Group();
 group.position.set(x,ground(x,z)+.05,z);group.rotation.y=-.18;root.add(group);
 box(group,8,.65,8,0,.31,0,colors.stone);
 for(const side of [-1,1]){
  for(let i=-1;i<=1;i++){
   box(group,.22,1.15,1.86,side*3.82,1.06,i*2.38,colors.sand);
  }
 }
 const tower=new T.Group();tower.position.set(-.8,.65,-.8);group.add(tower);
 box(tower,4.7,12.3,4.7,0,6.15,0,colors.lime);
 for(const side of [-1,1]){
  box(tower,.22,12.2,4.78,side*2.38,6.1,0,colors.stone);
  box(tower,4.78,12.2,.22,0,6.1,side*2.38,colors.stone);
 }
 for(let yy=2.6;yy<11;yy+=3.2){
  for(const side of [-1,1]){
   box(tower,.24,1.60,.88,side*2.42,yy,-.48,colors.sand);
   box(tower,1.07,1.70,.09,-.50,yy,side*2.42,colors.dark);
  }
 }
 for(const side of [-1,1])for(const k of [-1,1]){
  box(tower,.69,3.18,.69,k*1.7,15.07,side*1.7,colors.lime);
 }
 box(tower,5.2,.46,5.2,0,12.44,0,colors.clay);
 box(tower,5.2,.54,5.2,0,16.8,0,colors.clay);
 cylinder(tower,.76,.90,1.26,0,15.1,0,colors.metal);
 cylinder(tower,.17,.17,1.8,0,16.25,0,colors.dark);
 const roof=mesh(tower,new T.ConeGeometry(3.95,4.8,4),'#c16b48');
 roof.position.y=19.39;roof.rotation.y=Math.PI/4;
 cylinder(tower,.07,.11,2.2,0,22.4,0,colors.stone,8);
 ball(tower,.32,0,23.55,0,colors.sun);
 clock(tower,2.43);
 for(const p of tower.children)if(p.isMesh)p.raycast=()=>{};
 bake(tower);
 for(const p of tower.children)if(p.isMesh)p.raycast=()=>{};
 const cafe=new T.Group();cafe.position.set(9,0,-1.8);group.add(cafe);
 box(cafe,9.5,.32,7.2,0,.17,0,colors.stone);
 for(const side of [-1,1]){
  for(const front of [-1,1]){
   cylinder(cafe,.13,.14,4.4,side*3.7,2.5,front*2.65,colors.sand);
  }
 }
 box(cafe,8.7,.2,5.7,0,4.74,0,'#fff5df');
 for(let i=0;i<9;i++)box(cafe,.56,.045,5.58,(i-4)*.91,4.87,0,i%2?colors.road:'#eaa35d');
 for(const [tx,tz] of [[-1.7,-1.1],[2.0,1.4]]){
  cylinder(cafe,.64,.64,.14,tx,1.17,tz,'#deaa71');
  cylinder(cafe,.09,.10,.91,tx,.65,tz,'#896846');
  for(const side of [-1,1]){
   box(cafe,.57,.16,.58,tx+side*1.03,.74,tz,'#b6794f');
   cylinder(cafe,.07,.07,.68,tx+side*1.03,.34,tz,'#816348',6);
  }
 }
 for(const [px,pz] of [[-4,3],[4,3],[-4,-3],[4,-3]]){
  cylinder(cafe,.47,.33,.75,px,.6,pz,colors.clay);
  ball(cafe,.67,px,1.29,pz,colors.leaf);
  for(let k=0;k<7;k++){
   const a=k*2.399963;
   ball(cafe,.20,px+Math.cos(a)*.53,1.52+Math.sin(k)*.13,pz+Math.sin(a)*.50,k%2?colors.blossom:colors.pink,0);
  }
 }
 bake(cafe);for(const p of cafe.children)if(p.isMesh)p.raycast=()=>{};
 return {towers:1,terraces:1,position:[x,z]};
}
export function addFloweringOlives(root,ground){
 const rng=random(71171),trunks=[],canopy=[[],[],[]],blooms=[[],[],[]],farFlowers=[];
 const path=Array.from({length:240},(_,i)=>lane(i/240,0));
 for(let i=0;i<86;i++){
  const t=(i+.3)/86,side=i%2?-1:1,off=14+rng()*14,p=lane(t,side*off);
  if(path.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<11.3))continue;
  const scale=.64+rng()*.75,y=ground(p.x,p.z);
  trunks.push({x:p.x,y:y+1.12*scale,z:p.z,sx:scale,sy:scale,sz:scale,rz:(rng()-.5)*.16});
  for(let k=0;k<3;k++){
   const a=k*Math.PI*2/3+.25,r=.43+.35*rng(),cx=p.x+Math.cos(a)*r*scale,cz=p.z+Math.sin(a)*r*scale;
   const cy=y+(2.35+k*.21)*scale;
   canopy[k].push({x:cx,y:cy,z:cz,sx:.94*scale,sy:.83*scale,sz:.97*scale});
   if(i%3===0)for(let j=0;j<5;j++){
    const f=j*2.39996;blooms[(i+j)%3].push({x:cx+Math.cos(f)*.74*scale,y:cy+.28*scale+Math.cos(j*3)*.31*scale,z:cz+Math.sin(f)*.74*scale,sx:.15*scale,sy:.15*scale,sz:.15*scale});
   }
  }
 }
 inst(root,new T.CylinderGeometry(.15,.24,2.25,7),'#84654b',trunks);
 const leaf=['#287d4f','#58a84d','#a1b85b'];
 for(let i=0;i<3;i++)inst(root,new T.IcosahedronGeometry(.99,1),leaf[i],canopy[i]);
 for(let i=0;i<3;i++)inst(root,new T.IcosahedronGeometry(1,0),[colors.blossom,colors.pink,colors.sun][i],blooms[i]);
 return {oliveTrees:trunks.length,flowerClusters:blooms.reduce((a,x)=>a+x.length,0)};
}
export function resetShowcaseMaterials(){mats.clear();}
