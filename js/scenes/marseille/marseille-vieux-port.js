import {THREE as T,random,bake} from '../../core/util.js';
import {marseilleLane,marseilleWidth} from './marseille-track.js';

const C={
 stone:'#edd3ae',cream:'#fff0d2',shadow:'#bf976e',plaster:['#f5d2a4','#f8e1bd','#f3bd9e','#e6ccad','#f3dbc0'],
 roof:['#bb6048','#d97d50','#a95043'],wood:'#83634c',sand:'#d6ad83',
 sea:'#0d87ad',foam:'#dcfaf1',steel:'#819a9f',dark:'#253f4d',glass:'#2b8096',
 green:'#287b52',leaf:'#62ae55',pink:'#f2419c',rose:'#ff8fc4',gold:'#efb94d',
 police:'#234d6d',whitesail:'#fff6e4',salmon:'#e6805c'
};
const cache=new Map();
function material(color,roughness=.82){
 const key=color+':'+roughness;
 if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness:.01,flatShading:true,side:T.DoubleSide}));
 return cache.get(key);
}
function mesh(g,geo,color,shadow=false){
 const o=new T.Mesh(geo,typeof color==='string'?material(color):color);
 o.castShadow=shadow;o.receiveShadow=true;o.raycast=()=>{};g.add(o);return o;
}
function box(g,w,h,d,x,y,z,color,shadow=false){
 const o=mesh(g,new T.BoxGeometry(w,h,d),color,shadow);o.position.set(x,y,z);return o;
}
function cone(g,r,h,x,y,z,color,sides=5){
 const o=mesh(g,new T.ConeGeometry(r,h,sides),color,true);o.position.set(x,y,z);return o;
}
function batch(g,geo,color,items,cast=false){
 if(!items.length)return;
 const o=new T.InstancedMesh(geo,material(color),items.length),q=new T.Object3D();
 for(let i=0;i<items.length;i++){
  const p=items[i];q.position.set(p.x,p.y,p.z);
  q.rotation.set(p.rx||0,p.ry||0,p.rz||0);
  q.scale.set(p.sx??1,p.sy??1,p.sz??1);
  q.updateMatrix();o.setMatrixAt(i,q.matrix);
 }
 o.instanceMatrix.needsUpdate=true;o.castShadow=cast;o.receiveShadow=true;o.raycast=()=>{};g.add(o);
}
function finish(g){
 const originals=new Set();
 g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry)originals.add(o.geometry);});
 bake(g,o=>o.isInstancedMesh);
 for(const geometry of originals)geometry.dispose();
 g.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});
}
const route=Array.from({length:560},(_,i)=>marseilleLane(i/560));
function roadDistance(x,z){
 let best=Infinity;
 for(const p of route){const d=(x-p.x)**2+(z-p.z)**2;if(d<best)best=d;}
 return Math.sqrt(best);
}
function hullShape(){
 const pos=[],indices=[];
 const rings=[
  {y:-.62,w:.52,z:-2.30},{y:-.18,w:.85,z:-2.30},
  {y:-.07,w:1.02,z:-1.65},{y:-.05,w:1.04,z:.95},
  {y:.02,w:.66,z:2.04},{y:.10,w:.12,z:2.60}
 ];
 for(const r of rings){pos.push(-r.w,r.y,r.z,r.w,r.y,r.z);}
 for(let i=0;i<rings.length-1;i++){
  const a=i*2,b=a+2;indices.push(a,a+1,b,a+1,b+1,b);
 }
 for(let i=1;i<rings.length-1;i++)indices.push(0,i*2,(i+1)*2,1,(i+1)*2+1,i*2+1);
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function sailGeo(){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([
  0,0,0,.06,7.0,0,3.10,.15,0,
  0,0,0,3.10,.15,0,.06,7.0,0
 ],3));g.computeVertexNormals();return g;
}
function marina(root){
 const port=new T.Group();port.name='Marseille · Bassin de plaisance et Vieux-Port';root.add(port);
 const baseY=-11.28,woodParts=[],pilings=[],cleats=[],bollards=[],seat=[],glow=[];
 // Continuous waterfront and four timber pontoons along the northern basin.
 box(port,5.8,.52,151,-309.7,baseY,-75,C.stone);
 box(port,1.2,.22,150,-306.2,baseY+.43,-75,C.cream);
 for(let i=0;i<4;i++){
  const z=-132+i*33.2;
  woodParts.push({x:-334,y:baseY+.10,z,sx:53,sy:.35,sz:3.6});
  for(let j=0;j<13;j++){
   const x=-311-j*3.9;
   for(const side of [-1,1]){
    pilings.push({x,y:baseY-.94,z:z+side*1.48,sx:.25,sy:2.4,sz:.25});
   }
   if(j%2===0){
    cleats.push({x,y:baseY+.48,z:z+1.4,sx:.35,sy:.15,sz:.48});
    cleats.push({x,y:baseY+.48,z:z-1.4,sx:.35,sy:.15,sz:.48});
   }
  }
 }
 batch(port,new T.BoxGeometry(1,1,1),C.wood,woodParts);
 batch(port,new T.CylinderGeometry(.16,.21,1,7),C.shadow,pilings);
 batch(port,new T.BoxGeometry(1,1,1),C.steel,cleats);
 // Life-size parking lanes for yachts, oriented lengthwise along the pier.
 const rng=random(18733),boats=[[],[],[],[]],decks=[],cabins=[],windows=[],masts=[],sails=[[],[],[]],stripes=[];
 const hulls=['#f5e3cb','#fff3e4','#de885f','#2d7297'],sailColors=[C.whitesail,'#f8d9af','#e9b66e'];
 let total=0;
 for(let row=0;row<4;row++){
  const z0=-132+row*33.2;
  for(let j=0;j<10;j++){
   const x=-317-j*4.3,side=j%2?1:-1,z=z0+side*(4.8+rng()*1.6);
   const yaw=(side>0?Math.PI:0)+(rng()-.5)*.10,size=.73+rng()*.28;
   if(roadDistance(x,z)<23)continue;
   const base={x,y:-11.24,z,ry:yaw,sx:size,sy:size,sz:size};
   boats[total%4].push(base);
   decks.push({...base,y:-11.13,sy:.07,sx:1.67*size,sz:3.8*size});
   cabins.push({...base,y:-10.79,sx:.98*size,sy:.45*size,sz:1.23*size});
   windows.push({...base,y:-10.57,sx:.75*size,sy:.1*size,sz:1.04*size});
   masts.push({...base,y:-8.03,sy:5.9*size,sx:.075*size,sz:.075*size});
   if(total%4!==0)sails[total%3].push({
    x,y:-10.90,z,ry:yaw+(total%2?.18:-.18),
    sx:.87*size,sy:.87*size,sz:1
   });
   if(total%5===0)stripes.push({...base,y:-11.02,sx:.26*size,sy:.08,sz:3.5*size});
   total++;
  }
 }
 const hull=hullShape();
 hulls.forEach((color,i)=>batch(port,hull,color,boats[i],true));
 batch(port,new T.BoxGeometry(1,1,1),C.cream,decks);
 batch(port,new T.BoxGeometry(1,1,1),C.cream,cabins);
 batch(port,new T.BoxGeometry(1,1,1),C.glass,windows);
 batch(port,new T.CylinderGeometry(.032,.046,1,6),C.wood,masts);
 const sail=sailGeo();
 sailColors.forEach((c,i)=>batch(port,sail,c,sails[i],false));
 batch(port,new T.BoxGeometry(1,1,1),C.salmon,stripes);
 // The waterfront promenade gets a continuous row of slender lamps.
 for(let i=0;i<22;i++){
  const z=-146+i*6.8;
  bollards.push({x:-305.8,y:baseY+.74,z,sy:1.50,sx:.20,sz:.20});
  glow.push({x:-305.8,y:baseY+1.56,z,sx:.45,sy:.25,sz:.45});
 }
 batch(port,new T.BoxGeometry(1,1,1),C.dark,bollards);
 batch(port,new T.IcosahedronGeometry(1,0),C.gold,glow,false);
 return {pontoons:4,yachts:total,waterfrontLength:151,pilings:pilings.length};
}
function marketFacade(root,ground,index,x,z){
 const rng=random(67231+index*43),g=new T.Group();
 g.position.set(x,ground(x,z)+.06,z);g.rotation.y=-Math.PI*.5;
 root.add(g);
 const w=7.4+rng()*1.7,h=8.2+rng()*4.1,depth=6.7;
 box(g,w,h,depth,0,h/2,0,C.plaster[index%C.plaster.length],true);
 box(g,w+.3,.26,depth+.42,0,h-.12,0,C.cream);
 const top=cone(g,Math.max(w,depth)*.72,2.1,0,h+1.02,0,C.roof[index%3],4);
 top.rotation.y=Math.PI/4;
 const shopZ=depth/2+.13;
 box(g,w*.88,2.55,.18,0,1.53,shopZ,C.glass);
 box(g,w*.88,.18,.43,0,2.90,shopZ+.2,C.stone);
 for(let floor=0;floor<2;floor++){
  for(const side of [-1,1]){
   const xx=side*w*.28,yy=4.35+floor*2.82;
   if(yy+1.1>h-.4)continue;
   box(g,1.48,1.86,.10,xx,yy,shopZ,C.cream);
   box(g,1.21,1.60,.12,xx,yy,shopZ+.07,C.glass);
   box(g,.10,1.67,.15,xx,yy,shopZ+.17,C.stone);
   box(g,.26,1.66,.20,xx+side*.93,yy,shopZ+.10,C.green);
   box(g,1.78,.22,.42,xx,yy-.97,shopZ+.20,C.stone);
  }
 }
 for(let j=0;j<9;j++){
  const awning=box(g,w/9,.12,2.30,-w*.445+(j+.5)*w/9,3.11,shopZ+.92,j%2?C.cream:C.salmon);
  awning.rotation.x=-.16;
 }
 box(g,w+.4,.24,.28,0,.45,shopZ,C.shadow);
 finish(g);
}
function cityFront(root,ground){
 const g=new T.Group();g.name='Marseille · Provençal waterfront';root.add(g);
 let facades=0;
 for(let i=0;i<9;i++){
  const x=-294+(i%3)*1.3,z=-155+i*6.1;
  if(roadDistance(x,z)<21)continue;
  marketFacade(g,ground,i,x,z);facades++;
 }
 const plaza=new T.Group();
 plaza.position.set(-293,ground(-293,-138)+.15,-138);g.add(plaza);
 box(plaza,9,.4,9,0,.20,0,C.stone);
 for(const x of [-3.4,3.4]){
  box(plaza,.65,2.2,.65,x,1.35,-4.1,C.cream);
  box(plaza,.9,.22,.9,x,2.48,-4.1,C.shadow);
 }
 // Outdoor fish market: open rafters and striped textile roof.
 for(const x of [-2.9,2.9])for(const z of [-2.5,2.5]){
  box(plaza,.19,3.50,.19,x,1.95,z,C.wood);
 }
 for(let j=0;j<8;j++)box(plaza,.73,.10,5.90,-2.55+j*.73,3.76,0,j%2?C.cream:C.salmon);
 for(const x of [-1.6,1.6])box(plaza,2.30,.82,1.24,x,.98,.18,C.sand);
 for(const x of [-1.6,1.6])box(plaza,2.35,.16,1.36,x,1.45,.18,C.cream);
 finish(plaza);
 const trees=[],crowns=[[],[]],flowers=[[],[]],pots=[];
 for(let i=0;i<11;i++){
  const z=-153+i*5.7,x=-304.2;
  const y=ground(x,z);
  pots.push({x,y:y+.44,z,sx:.63,sy:.87,sz:.63});
  crowns[i%2].push({x,y:y+1.35,z,sx:1.05,sy:.83,sz:1.02});
  for(let j=0;j<9;j++){
   const a=j*2.399963,rr=.60;
   flowers[(j+i)%2].push({x:x+rr*Math.cos(a),y:y+1.76,z:z+rr*Math.sin(a),sx:.20,sy:.18,sz:.19});
  }
 }
 batch(g,new T.CylinderGeometry(.45,.54,1,9),C.salmon,pots);
 batch(g,new T.IcosahedronGeometry(1,1),C.green,crowns[0]);
 batch(g,new T.IcosahedronGeometry(1,1),C.leaf,crowns[1]);
 batch(g,new T.IcosahedronGeometry(1,0),C.pink,flowers[0]);
 batch(g,new T.IcosahedronGeometry(1,0),C.rose,flowers[1]);
 return {facades,fishMarket:1,flowerPlanters:pots.length};
}
function basilica(root,ground){
 const x=-151,z=-245,g=new T.Group();g.name='Marseille · Stylized Notre-Dame-de-la-Garde';
 g.position.set(x,ground(x,z)+.15,z);g.rotation.y=-.33;root.add(g);
 // Monumental stone terraces and stepped basilica, inspired by the Marseille skyline.
 box(g,32,1.6,24,0,.8,0,C.stone);
 box(g,28,1.2,21,0,2.0,-.8,C.shadow);
 box(g,25,1.1,18,0,3.05,-1.1,C.cream);
 for(let i=0;i<6;i++)box(g,12,.20,1.25,0,.20+i*.32,13-i*.90,C.stone);
 box(g,20,14,13,0,10.8,-2.8,C.cream,true);
 for(const side of [-1,1]){
  box(g,1.1,14.7,13.6,side*10.2,11,-2.8,C.stone,true);
  for(let k=0;k<4;k++){
   box(g,1.3,3.0,.25,side*5.7,7.0+k*2.4,3.82,C.shadow);
  }
 }
 for(let i=-3;i<=3;i++)box(g,20,.42,1.2,0,13+i*.14,-10.45+i*.46,i%2?C.stone:C.shadow);
 box(g,22,.40,14.0,0,18,-2.8,C.stone);
 const roof=cone(g,12.4,7.6,0,22.0,-2.8,C.roof[0],4);roof.rotation.y=Math.PI/4;
 // Four ornate chapels surround the main dome.
 for(const xx of [-8,8]){
  for(const zz of [-7,2]){
   box(g,5.8,8.0,5.4,xx,7.2,zz,C.stone);
   cone(g,4.2,4.3,xx,13.4,zz,C.roof[1],4).rotation.y=Math.PI/4;
  }
 }
 box(g,8.4,24.8,8.4,0,16.3,8.4,C.cream,true);
 for(let level=0;level<5;level++){
  const yy=6.0+level*4.0;
  for(const side of [-1,1]){
   box(g,1.65,2.2,.19,side*2.35,yy,12.69,C.shadow);
   box(g,.24,2.3,.23,side*2.35,yy,12.83,C.stone);
  }
 }
 for(let i=0;i<3;i++){
  box(g,9.3,.45,9.2,0,27.7+i*1.4,8.4,i%2?C.stone:C.shadow);
 }
 cone(g,6.2,9.8,0,36.5,8.4,C.roof[2],4).rotation.y=Math.PI/4;
 box(g,.53,6.2,.55,0,43.0,8.4,C.gold);
 // Gold statue silhouette from the main race viewpoint.
 const statue=mesh(g,new T.IcosahedronGeometry(1.18,1),C.gold);statue.position.set(0,47.8,8.4);
 box(g,3.8,.37,.46,0,46.15,8.4,C.gold);
 for(const side of [-1,1]){
  const arm=box(g,.6,4.1,.58,side*1.75,45.25,8.4,C.gold);
  arm.rotation.z=-side*.45;
 }
 finish(g);
 return {height:49,position:[x,z]};
}
function promenade(root,ground){
 const g=new T.Group();g.name='Marseille · Balustrades et fleurs du Vieux-Port';root.add(g);
 const parapet=[],caps=[],columns=[],pots=[],leaves=[],flowers=[[],[],[]],arches=[];
 const archGeometry=new T.TorusGeometry(.74,.16,6,14,Math.PI);
 const rng=random(72219);
 const N=42,t0=.951,t1=.997;
 for(let i=0;i<N;i++){
  const t=t0+(t1-t0)*(i+.5)/N,side=marseilleLane(t,1).x<marseilleLane(t,-1).x?1:-1;
  const width=marseilleWidth(t)/2;
  const p=marseilleLane(t,side*(width+3.45));
  const a=marseilleLane(t-.00045,side*(width+3.45)),b=marseilleLane(t+.00045,side*(width+3.45));
  const angle=Math.atan2(b.x-a.x,b.z-a.z);
  const y=ground(p.x,p.z);
  parapet.push({x:p.x,y:y+.94,z:p.z,ry:angle,sx:.43,sy:1.75,sz:1.3});
  caps.push({x:p.x,y:y+1.84,z:p.z,ry:angle,sx:.7,sy:.22,sz:1.37});
  if(i%3===0){
   columns.push({x:p.x,y:y+1.10,z:p.z,sx:.80,sy:2.24,sz:.80});
   pots.push({x:p.x,y:y+2.52,z:p.z,sx:.70,sy:.72,sz:.70});
   leaves.push({x:p.x,y:y+3.04,z:p.z,sx:.91,sy:.66,sz:.94});
   for(let j=0;j<12;j++){
    const a=j*2.399963;
    flowers[(i+j)%3].push({x:p.x+Math.cos(a)*.58,y:y+3.22+rng()*.28,
     z:p.z+Math.sin(a)*.58,sx:.16,sy:.17,sz:.17});
   }
  }else{
   arches.push({x:p.x,y:y+.98,z:p.z,ry:angle,rz:0,sx:.89,sy:.86,sz:.89});
  }
 }
 batch(g,new T.BoxGeometry(1,1,1),C.stone,parapet);
 batch(g,new T.BoxGeometry(1,1,1),C.cream,caps);
 batch(g,new T.BoxGeometry(1,1,1),C.shadow,columns);
 batch(g,new T.TorusGeometry(.74,.13,6,14,Math.PI),C.cream,arches);
 batch(g,new T.CylinderGeometry(.40,.50,1,8),C.salmon,pots);
 batch(g,new T.IcosahedronGeometry(1,1),C.green,leaves);
 [C.pink,C.rose,C.gold].forEach((color,i)=>batch(g,new T.IcosahedronGeometry(1,0),color,flowers[i]));
 return {parapetSections:N,flowerPots:pots.length,flowers:flowers.flat().length};
}
export function addVieuxPortDistrict(root,ground){
 cache.clear();
 const marinaStats=marina(root),front=cityFront(root,ground);
 const monument=basilica(root,ground),roadside=promenade(root,ground);
 return {...marinaStats,...front,basilica:monument,...roadside};
}
