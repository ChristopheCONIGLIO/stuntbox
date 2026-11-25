import {THREE as T,random} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const palette={stone:'#f3dfb8',edge:'#fff3d9',shade:'#c99770',clay:'#bd714d',leaf:'#27874f',dark:'#174c43',pink:'#f43fa5',light:'#ff94c7',gold:'#f4b446'};
const cached=new Map();
export function resetRivieraMaterials(){cached.clear();}
function material(color){
 if(!cached.has(color))cached.set(color,new T.MeshStandardMaterial({color,roughness:.86,metalness:0,flatShading:true}));
 return cached.get(color);
}
function surface(parent,geometry,color,shadows=true){
 const m=new T.Mesh(geometry,material(color));m.castShadow=shadows;m.receiveShadow=shadows;m.raycast=()=>{};parent.add(m);return m;
}
function batch(parent,geometry,color,transforms,shadows=true){
 if(!transforms.length)return;
 const mesh=new T.InstancedMesh(geometry,material(color),transforms.length);
 const t=new T.Object3D();
 for(let i=0;i<transforms.length;i++){
  const p=transforms[i];
  t.position.set(p.x,p.y,p.z);
  t.rotation.set(p.rx||0,p.yaw||0,p.rz||0);
  t.scale.set(p.sx||1,p.sy||1,p.sz||1);
  t.updateMatrix();mesh.setMatrixAt(i,t.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=shadows;mesh.receiveShadow=shadows;mesh.raycast=()=>{};parent.add(mesh);
}
function balustradeGeometry(){
 const stone=new T.Shape();
 stone.moveTo(-1.65,0);stone.lineTo(1.65,0);
 stone.lineTo(1.65,1.5);stone.lineTo(-1.65,1.5);stone.closePath();
 const opening=new T.Path();
 opening.moveTo(-.90,.22);opening.lineTo(.90,.22);
 opening.lineTo(.90,.72);opening.absarc(0,.72,.90,0,Math.PI,false);
 opening.closePath();stone.holes.push(opening);
 const geo=new T.ExtrudeGeometry(stone,{depth:.28,steps:1,bevelEnabled:false,curveSegments:12});
 geo.computeVertexNormals();return geo;
}
export function addCoastalPromenade(root,ground){
 const rails=[],caps=[],posts=[],postCaps=[],pots=[],plants=[],pink=[],light=[],gold=[];
 const first=.008,last=.183,segments=33,rng=random(90318);
 const point=t=>lane(t,-8.5);
 for(let i=0;i<segments;i++){
  const a=point(first+(last-first)*i/segments),b=point(first+(last-first)*(i+1)/segments);
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
  const h=ground(x,z),yaw=Math.atan2(-dz,dx);
  rails.push({x,y:h+.12,z,yaw,sx:length/3.3});
  caps.push({x,y:h+1.64,z,yaw,sx:length/3.3});
  if(i%3===0){
   const out=lane(first+(last-first)*(i+.5)/segments,-9.9);
   const y=ground(out.x,out.z)+.24;
   pots.push({x:out.x,y:y+.45,z:out.z});
   plants.push({x:out.x,y:y+1.06,z:out.z,sx:.88,sy:.71,sz:.84});
   for(let k=0;k<11;k++){
    const ang=k*2.399963,r=.24+.49*rng(),color=k%4;
    const item={x:out.x+Math.cos(ang)*r,y:y+1.19+Math.sin(k*2.2)*.28,z:out.z+Math.sin(ang)*r,sx:.15,sy:.12,sz:.15};
    [pink,light,gold,pink][color].push(item);
   }
  }
 }
 for(let i=0;i<=segments;i++){
  const p=point(first+(last-first)*i/segments),y=ground(p.x,p.z);
  posts.push({x:p.x,y:y+1.03,z:p.z});
  postCaps.push({x:p.x,y:y+2.08,z:p.z});
 }
 batch(root,balustradeGeometry(),palette.stone,rails);
 batch(root,new T.BoxGeometry(3.5,.16,.54),palette.edge,caps);
 batch(root,new T.BoxGeometry(.48,2.07,.58),palette.shade,posts);
 batch(root,new T.BoxGeometry(.77,.18,.82),palette.edge,postCaps);
 batch(root,new T.CylinderGeometry(.48,.35,.8,10),palette.clay,pots);
 batch(root,new T.IcosahedronGeometry(.68,1),palette.leaf,plants);
 batch(root,new T.IcosahedronGeometry(1,0),palette.pink,pink);
 batch(root,new T.IcosahedronGeometry(1,0),palette.light,light);
 batch(root,new T.IcosahedronGeometry(1,0),palette.gold,gold);
 return {arches:segments,flowerPots:pots.length,flowers:pink.length+light.length+gold.length};
}
function sailGeometry(w,h,side){
 const v=side<0?[0,0,0,-w,0,0,0,h,0]:[.12,.35,0,w,.35,0,.12,h*.8,0];
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(v,3));
 geo.computeVertexNormals();return geo;
}
export function addSailboats(root){
 const boats=[[-103,-38,1.06,-.37],[-135,21,.72,.6],[-177,-22,1.24,-.16],[-114,54,.62,.88],[-197,48,.82,-.21],[-155,-56,1.10,.46]];
 for(let i=0;i<boats.length;i++){
  const [x,z,size,heading]=boats[i],g=new T.Group();
  g.position.set(x,-4.43,z);g.rotation.y=heading;g.scale.setScalar(size);root.add(g);
  const hull=surface(g,new T.SphereGeometry(1,14,9),i%2?'#f9f3e4':'#d84a4d');
  hull.scale.set(2.24,.33,.83);hull.position.y=.04;
  const deck=surface(g,new T.BoxGeometry(3.62,.12,1.14),'#fff1d5');
  deck.position.y=.27;
  const mast=surface(g,new T.CylinderGeometry(.045,.067,5.4,7),'#d2c19a');
  mast.position.set(.06,2.85,0);
  const sail=surface(g,sailGeometry(1.95,4.55,-1),'#fffdf1',false);
  sail.position.set(0,.56,.06);sail.material.side=T.DoubleSide;
  const jib=surface(g,sailGeometry(1.09,3.05,1),'#f4cfa9',false);
  jib.position.set(.05,.68,-.12);jib.material.side=T.DoubleSide;
  const shadow=surface(g,new T.CircleGeometry(2.55,18),'#168eaa',false);
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.22;
 }
 return boats.length;
}
export function addHillsideVillage(root,ground,makeVilla){
 const centers=[[-47,22],[-46,-36],[9,43],[29,42],[23,-43]];
 const offsets=[[-3,-2],[3,0],[-1,5],[5,6]];
 const track=Array.from({length:220},(_,i)=>lane(i/220));
 const placed=[],rng=random(31121);
 for(let cluster=0;cluster<centers.length;cluster++){
  const [cx,cz]=centers[cluster];
  for(let i=0;i<offsets.length;i++){
   const [dx,dz]=offsets[i],x=cx+dx+(rng()-.5)*1.5,z=cz+dz+(rng()-.5)*1.3;
   if(Math.abs(x)>57||Math.abs(z)>52)continue;
   if(track.some(p=>Math.hypot(p.x-x,p.z-z)<15.2))continue;
   if(placed.some(p=>Math.hypot(p.x-x,p.z-z)<6.0))continue;
   const house=makeVilla(root,x,z,rng()*Math.PI*2,cluster*4+i+10,ground);
   house.scale.setScalar(.78+rng()*.16);placed.push({x,z});
  }
 }
 return placed.length;
}

export function addDistantHorizon(root){
 const rng=random(4091),ridges=[[],[],[]],clouds=[[],[],[]];
 for(let i=0;i<27;i++){
  const x=-213+(rng()-.5)*31,z=-104+i*8.1+(rng()-.5)*5,sy=.67+rng()*.85;
  ridges[i%3].push({x,y:-5.3+sy*14.5,z,sy,sx:.76+rng()*.46,sz:.76+rng()*.28,yaw:rng()*6.28});
 }
 batch(root,new T.ConeGeometry(15,30,5),'#6895ab',ridges[0],false);
 batch(root,new T.ConeGeometry(14,29,6),'#8eb9c1',ridges[1],false);
 batch(root,new T.ConeGeometry(12,25,5),'#b0cbbf',ridges[2],false);
 for(let i=0;i<13;i++){
  const x=-145-rng()*70,z=-90+i*14.5+rng()*9,y=42+rng()*25;
  for(let k=0;k<3;k++)clouds[(i+k)%3].push({x:x+(k-1)*6,y:y+Math.sin(k*2.1)*1.6,z:z+(k-1)*2,sx:7+rng()*4,sy:2.5+rng()*2.1,sz:3.8+rng()*2});
 }
 batch(root,new T.IcosahedronGeometry(1,1),'#ffffff',clouds[0],false);
 batch(root,new T.IcosahedronGeometry(1,1),'#e6f8ff',clouds[1],false);
 batch(root,new T.IcosahedronGeometry(1,1),'#f8fbf1',clouds[2],false);
 return {ridges:27,cloudPuffs:39};
}
