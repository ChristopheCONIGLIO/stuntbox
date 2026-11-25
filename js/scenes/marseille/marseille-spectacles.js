import {THREE as T,random,bake} from '../../core/util.js';
import {marseilleLane,marseilleWidth} from './marseille-track.js';

const paint={
 chalk:'#f7e4c2',limestone:'#e3ba8d',sand:'#d0a27e',
 ochre:'#b98c6d',warm:'#fff1d5',terracotta:'#c96b49',
 foliage:'#267c4c',lightLeaf:'#5aab54',rose:'#f5369c',
 pink:'#ff94c4',yellow:'#f7cd5a',olive:'#45794e',
 sea:'#40d7d8',gold:'#f5d09a',shadow:'#42555c'
};
const cache=new Map();
function material(color,roughness=.85,emissive=null){
 const key=color+roughness+emissive;
 if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({
  color,roughness,metalness:0,flatShading:true,side:T.DoubleSide,
  ...(emissive?{emissive,emissiveIntensity:.65}:{})
 }));
 return cache.get(key);
}
function block(root,w,h,d,x,y,z,color,shadow=false){
 const o=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));
 o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=shadow;o.raycast=()=>{};
 root.add(o);return o;
}
function mesh(root,geometry,color,shadow=false){
 const o=new T.Mesh(geometry,typeof color==='string'?material(color):color);
 o.castShadow=shadow;o.receiveShadow=shadow;o.raycast=()=>{};root.add(o);return o;
}
function batch(root,geometry,color,parts,shadows=false){
 if(!parts.length)return null;
 const o=new T.InstancedMesh(geometry,material(color),parts.length),q=new T.Object3D();
 for(let i=0;i<parts.length;i++){
  const p=parts[i];
  q.position.set(p.x,p.y,p.z);
  q.rotation.set(p.rx||0,p.yaw||0,p.rz||0);
  q.scale.set(p.sx??1,p.sy??1,p.sz??1);
  q.updateMatrix();o.setMatrixAt(i,q.matrix);
 }
 o.instanceMatrix.needsUpdate=true;o.castShadow=shadows;o.receiveShadow=shadows;o.raycast=()=>{};
 root.add(o);return o;
}
function finish(root){
 const seen=new Set();
 root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry)seen.add(o.geometry)});
 bake(root,o=>o.isInstancedMesh);
 for(const geometry of seen)geometry.dispose();
 root.traverse(o=>{if(o.isMesh)o.raycast=()=>{}});
}
function coastSide(t){
 const a=marseilleLane(t,1),b=marseilleLane(t,-1);
 return a.x<b.x?1:-1;
}
const arcStart=.866,arcEnd=.945;
function point(t,lateral){return marseilleLane(t,coastSide(t)*(marseilleWidth(t)/2+lateral));}
function bridgeArchGeometry(){
 const shape=new T.Shape();
 shape.moveTo(-.5,-.055);shape.lineTo(.5,-.055);shape.lineTo(.5,1);
 shape.lineTo(-.5,1);shape.closePath();
 const hole=new T.Path(),r=.365;
 hole.moveTo(-r,-.018);hole.lineTo(r,-.018);hole.lineTo(r,.55);
 hole.absarc(0,.55,r,0,Math.PI,false);hole.closePath();
 shape.holes.push(hole);
 return new T.ExtrudeGeometry(shape,{depth:2.0,bevelEnabled:false,curveSegments:14,steps:1});
}
export function addCalanqueViaduct(root,ground){
 const bridge=new T.Group();bridge.name='Marseille · Corniche aux vingt-quatre arches';root.add(bridge);
 const arches=[],caps=[],keystones=[],piers=[],vases=[],flowerClusters=[[],[],[]],bushes=[],rails=[];
 const rng=random(159004),N=24;
 for(let i=0;i<N;i++){
  const t0=arcStart+(arcEnd-arcStart)*i/N,t1=arcStart+(arcEnd-arcStart)*(i+1)/N;
  const a=point(t0,9.2),b=point(t1,9.2),mid=point((t0+t1)/2,9.2);
  const roadside=point((t0+t1)/2,3.4),axis=marseilleLane((t0+t1)/2);
  const yaw=-Math.atan2(b.z-a.z,b.x-a.x);
  const length=Math.hypot(a.x-b.x,a.z-b.z),base=ground(axis.x,axis.z);
  const top=base+.14;
  arches.push({x:mid.x,y:top-13.8,z:mid.z,yaw,sx:length*1.04,sy:13.8,sz:1});
  caps.push({x:mid.x,y:top+.30,z:mid.z,yaw,sx:length*1.03,sy:.46,sz:1.62});
  rails.push({x:roadside.x,y:top+1.62,z:roadside.z,yaw,sx:length*1.06,sy:.26,sz:.44});
  if(i%3===0){
   const p=point(t0,3.4);
   piers.push({x:p.x,y:ground(p.x,p.z)+.92,z:p.z,sx:.92,sy:1.86,sz:1.1});
   vases.push({x:p.x,y:ground(p.x,p.z)+2.22,z:p.z,sx:.85,sy:.64,sz:.85});
   bushes.push({x:p.x,y:ground(p.x,p.z)+2.83,z:p.z,sx:.88,sy:.72,sz:.92});
   for(let k=0;k<14;k++){
    const f=k*2.399963,rad=.55+.26*rng();
    flowerClusters[k%3].push({
     x:p.x+rad*Math.cos(f),y:ground(p.x,p.z)+3.02+.38*rng(),
     z:p.z+rad*Math.sin(f),sx:.20,sy:.18,sz:.20
    });
   }
  }
  keystones.push({x:mid.x,y:top-2.15,z:mid.z,yaw,sx:.45,sy:.70,sz:1.23});
 }
 batch(bridge,bridgeArchGeometry(),paint.limestone,arches,true);
 batch(bridge,new T.BoxGeometry(1,1,1),paint.chalk,caps);
 batch(bridge,new T.BoxGeometry(1,1,1),paint.warm,rails);
 batch(bridge,new T.BoxGeometry(1,1,1),paint.sand,keystones);
 batch(bridge,new T.BoxGeometry(1,1,1),paint.chalk,piers);
 batch(bridge,new T.CylinderGeometry(.54,.43,1,10),paint.terracotta,vases);
 batch(bridge,new T.IcosahedronGeometry(1,1),paint.foliage,bushes);
 for(let i=0;i<3;i++)batch(bridge,new T.IcosahedronGeometry(1,0),[paint.rose,paint.pink,paint.yellow][i],flowerClusters[i],false);
 const outcrop=[[],[],[]],foam=[];
 for(let i=0;i<105;i++){
  const t=arcStart+(arcEnd-arcStart)*(i+.37)/105,p=point(t,14+rng()*19);
  const drop=5+rng()*9,span=3+rng()*5;
  outcrop[i%3].push({
   x:p.x,y:ground(p.x,p.z)-drop*.18,z:p.z,
   sx:span,sy:drop,sz:span*(.65+rng()*.3),yaw:rng()*Math.PI
  });
  if(i%4===0){
   foam.push({x:p.x,y:-11.61,z:p.z,sx:1.5,sy:.05,sz:2.5});
  }
 }
 for(let i=0;i<3;i++)batch(bridge,new T.IcosahedronGeometry(1,1),[paint.chalk,paint.limestone,paint.ochre][i],outcrop[i],false);
 batch(bridge,new T.BoxGeometry(1,1,1),paint.sea,foam,false);
 return {archSpans:N,flowerPots:vases.length,flowers:flowerClusters.flat().length,coastalRocks:outcrop.flat().length};
}

const tunnelStart=.583,tunnelEnd=.632;
function archPortal(parent,t,ground){
 const p=marseilleLane(t),q=marseilleLane(t+.001),width=marseilleWidth(t)/2;
 const g=new T.Group();g.position.set(p.x,ground(p.x,p.z),p.z);
 g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);parent.add(g);
 const R=width+2.8;
 for(const sign of [-1,1]){
  block(g,2.35,7.5,4.0,sign*(R+.76),3.75,0,paint.limestone);
  block(g,2.8,.70,4.7,sign*(R+.76),7.65,0,paint.warm);
  block(g,2.55,1.26,2.0,sign*(R+.77),8.58,0,paint.ochre);
 }
 const arch=mesh(g,new T.TorusGeometry(R,.83,10,40,Math.PI),paint.chalk,true);
 arch.position.set(0,4.2,1.45);
 block(g,R*2+2.7,.63,3.4,0,4.6+R,1.20,paint.warm);
 for(let s of [-1,1]){
  block(g,.76,1.18,.23,s*(width+1.55),3.5,2.20,paint.gold);
 }
 finish(g);
}
export function addMountainGallery(root,ground){
 const gallery=new T.Group();gallery.name='Marseille · Tunnel de Sormiou, galerie rocheuse';root.add(gallery);
 const outside=[[],[],[]],upper=[[],[],[]],roof=[],bands=[],sideWalls=[[],[]],lamps=[],wallPanels=[];
 const rng=random(594113),steps=78;
 for(let i=0;i<steps;i++){
  const t=tunnelStart+(tunnelEnd-tunnelStart)*(i+.5)/steps;
  const last=marseilleLane(t-.0003),next=marseilleLane(t+.0003),center=marseilleLane(t),dx=next.x-last.x,dz=next.z-last.z;
  const yaw=Math.atan2(dx,dz),width=marseilleWidth(t)/2;
  const y=ground(center.x,center.z),pieceLength=Math.hypot(dx,dz)*((tunnelEnd-tunnelStart)/steps)/.0006;
  roof.push({x:center.x,y:y+15.1,z:center.z,yaw,sx:2*width+12,sy:2.75,sz:pieceLength+1.45});
  bands.push({x:center.x,y:y+17.2,z:center.z,yaw,sx:2*width+16,sy:.48,sz:pieceLength+2});
  for(const sign of [-1,1]){
   const p=marseilleLane(t,sign*(width+6.1)),gY=ground(p.x,p.z);
   const k=(i+(sign>0?1:0))%3;
   outside[k].push({x:p.x,y:gY+7.7,z:p.z,
    sx:6.0+rng()*1.3,sy:9.0+rng()*3,sz:5.8+rng()*1.4,yaw:rng()*3.14});
   sideWalls[sign>0?1:0].push({
    x:p.x,y:y+5.3,z:p.z,yaw,
    sx:4.0,sy:10.3,sz:pieceLength+1.20
   });
  }
  if(i%3===0){
   for(const sign of [-1,1]){
    const p=marseilleLane(t,sign*(width+7.0));
    upper[(i+1)%3].push({x:p.x,y:y+17.1,z:p.z,
      sx:5.7,sy:5.3,sz:6.4,yaw:rng()*3});
   }
  }
  if(i%13===0){
   for(const sign of [-1,1]){
    const p=marseilleLane(t,sign*(width+2.45));
    lamps.push({x:p.x,y:y+8.65,z:p.z,sx:.5,sy:.19,sz:1.3,yaw});
    wallPanels.push({x:p.x,y:y+4.3,z:p.z,sx:.44,sy:1.4,sz:1.1,yaw});
   }
  }
 }
 batch(gallery,new T.BoxGeometry(1,1,1),paint.shadow,roof,false);
 batch(gallery,new T.BoxGeometry(1,1,1),paint.sand,bands,false);
 batch(gallery,new T.BoxGeometry(1,1,1),paint.ochre,sideWalls[0],false);
 batch(gallery,new T.BoxGeometry(1,1,1),paint.limestone,sideWalls[1],false);
 for(let i=0;i<3;i++){
  batch(gallery,new T.IcosahedronGeometry(1,1),[paint.limestone,paint.chalk,paint.ochre][i],outside[i],false);
  batch(gallery,new T.IcosahedronGeometry(1,1),[paint.warm,paint.sand,paint.chalk][i],upper[i],false);
 }
 batch(gallery,new T.BoxGeometry(1,1,1),paint.gold,lamps,false);
 batch(gallery,new T.BoxGeometry(1,1,1),paint.chalk,wallPanels,false);
 archPortal(gallery,tunnelStart,ground);
 archPortal(gallery,tunnelEnd,ground);
 return {lengthSections:steps,portals:2,interiorLamps:lamps.length,sideRocks:outside.flat().length,roofPanels:roof.length};
}
export function resetMarseilleSpectacleMaterials(){cache.clear();}
