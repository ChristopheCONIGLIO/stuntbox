import {THREE as T,random} from '../../core/util.js';

const rockColors=['#f0d5a6','#dfb98c','#f5e3bd','#b98d72','#d6a679','#f6edcd'];
const leafColors=['#1f8150','#42a95b','#91bd48'];
const flowerColors=['#f43e9c','#ff87bc','#ffc64b'];
const materials=new Map();
function material(color,roughness=.93){
 const key=color+':'+roughness;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,flatShading:true,side:T.DoubleSide}));
 return materials.get(key);
}
const geoMesh=(parent,geometry,mat,shadow=false)=>{
 const o=new T.Mesh(geometry,mat);o.castShadow=shadow;o.receiveShadow=shadow;o.raycast=()=>{};parent.add(o);return o;
};
function instances(parent,geo,color,transforms,shadow=true){
 if(!transforms.length)return;
 const m=new T.InstancedMesh(geo,material(color),transforms.length),dummy=new T.Object3D();
 transforms.forEach((v,i)=>{
  dummy.position.set(v.x,v.y,v.z);
  dummy.rotation.set(v.pitch||0,v.yaw||0,v.roll||0);
  dummy.scale.set(v.sx||1,v.sy||1,v.sz||1);
  dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
 });
 m.instanceMatrix.needsUpdate=true;m.castShadow=shadow;m.receiveShadow=shadow;m.raycast=()=>{};parent.add(m);
}
function coastalShelf(parent,ground){
 const vertices=[],colors=[],rng=random(60135),n=112;
 const bands=[0,1,2,3,4,5],cliffColors=['#f1d9b2','#d9b28a','#e8c6a0','#bf9977','#f6e4c2'];
 const shore=z=>-.30*Math.sin(z*.15)-.44*Math.sin(z*.05)+.17*Math.cos(z*.48);
 const point=(i,band)=>{
  const z=-61+(i/n)*122,coast=shore(z);
  const step=[0,2.2,5.1,8.2,11.5,13.3][band],x=-68.18-step+coast*(band/5);
  const height=ground(-67.8,z);
  const y=[height+.12,height-.15,height-1.15,height-2.88,-4.45,-4.58][band];
  const ripple=[0,.13,.17,.24,.10,.04][band]*Math.sin(z*.35+band*1.2);
  return [x,y+ripple,z];
 };
 const push=(a,b,c,tint)=>{
  const col=new T.Color(tint);
  for(const p of [a,b,c]){vertices.push(...p);colors.push(col.r,col.g,col.b);}
 };
 for(let i=0;i<n;i++){
  for(let band=0;band<5;band++){
   const a=point(i,band),b=point(i+1,band),c=point(i,band+1),d=point(i+1,band+1);
   const col=cliffColors[(Math.floor(i/3)+band*2)%cliffColors.length];
   push(a,c,b,col);push(b,c,d,col);
   if(band===1&&i%7<3){
    const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2+.055,(a[2]+b[2])/2];
    push(a,b,mid,'#fff0ce');
   }
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 geoMesh(parent,geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.96,flatShading:true}),true);
 return {sections:n,bands:5};
}
function beaches(root){
 const sands=[],foams=[];
 for(const [x,z,s] of [[-82,-43,1],[-82,2,.86],[-82,43,1.12]]){
  const a=[],b=[],N=30;
  const center=[x,-4.52,z],inner=6.6*s,outer=10.5*s;
  for(let k=0;k<N;k++){
   const t=k*Math.PI*2/N,next=(k+1)*Math.PI*2/N;
   const p=(ang,r,y)=>[x+Math.cos(ang)*r,y,z+Math.sin(ang)*r*.72];
   for(const v of [center,p(t,inner,-4.52),p(next,inner,-4.52)])a.push(v);
   for(const v of [p(t,outer,-4.57),p(t,inner,-4.52),p(next,outer,-4.57),p(next,outer,-4.57),p(t,inner,-4.52),p(next,inner,-4.52)])b.push(v);
  }
  sands.push(...a);
  foams.push(...b);
 }
 const create=(positions,color,opacity)=>{
  const coords=positions.flat(),geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(coords,3));
  geometry.computeVertexNormals();
  geoMesh(root,geometry,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity===1}),false);
 };
 create(sands,'#f3deb2',1);create(foams,'#d4fafd',.44);
 return {coves:3};
}
function rockArch(parent,x,z,scale,angle){
 const group=new T.Group();group.position.set(x,-4.52,z);group.rotation.y=angle;group.scale.setScalar(scale);parent.add(group);
 const shape=new T.Shape();
 shape.moveTo(-6,0);shape.lineTo(-5.9,5.1);shape.lineTo(-4.5,9.6);shape.lineTo(-2.8,11.7);
 shape.lineTo(2.5,11.4);shape.lineTo(4.8,8.1);shape.lineTo(6,0);shape.closePath();
 const cut=new T.Path();cut.moveTo(-3.2,-.5);cut.lineTo(3.1,-.5);
 cut.lineTo(3.1,3.5);cut.absarc(0,3.5,3.1,0,Math.PI,false);cut.closePath();shape.holes.push(cut);
 const geo=new T.ExtrudeGeometry(shape,{depth:2.2,bevelEnabled:true,bevelSegments:1,bevelSize:.15,bevelThickness:.18,steps:1,curveSegments:10});
 geo.computeVertexNormals();
 geoMesh(group,geo,material('#e5c096'),true);
 const cap=new T.Mesh(new T.IcosahedronGeometry(2.8,1),material('#f8e3b7'));
 cap.position.set(-.6,10.2,1.1);cap.scale.set(1.5,.36,.70);cap.castShadow=true;cap.raycast=()=>{};group.add(cap);
}
function seaStacks(root){
 const locations=[[-106,-40,1.0,.27],[-125,23,.76,-.42]];
 locations.forEach(([x,z,s,angle])=>rockArch(root,x,z,s,angle));
 const rng=random(922111),stones=[[],[],[]],greens=[[],[],[]];
 for(let i=0;i<44;i++){
  const x=-91-rng()*36,z=-57+rng()*114;
  const s=.65+rng()*1.60,base=-4.56+s*.52;
  stones[i%3].push({x,y:base,z,sx:s*1.4,sy:s*1.65,sz:s*.95,yaw:rng()*6.28});
  if(i%3===0)greens[i%3].push({x,y:base+s*.85,z,sx:s*.78,sy:s*.3,sz:s*.75});
 }
 instances(root,new T.IcosahedronGeometry(1,1),'#e0bb8e',stones[0]);
 instances(root,new T.IcosahedronGeometry(1,1),'#f0d6a6',stones[1]);
 instances(root,new T.IcosahedronGeometry(1,1),'#b88e72',stones[2]);
 instances(root,new T.IcosahedronGeometry(1,1),'#337c58',greens[0]);
 return {arches:locations.length,stacks:stones.reduce((n,a)=>n+a.length,0)};
}
function coastalGarden(root,ground){
 const rng=random(42007),trees=[[],[],[]],flower=[[],[],[]],oliveTrunks=[];
 for(let i=0;i<125;i++){
  const z=-57+rng()*114,x=-66.1-rng()*2.2;
  const y=ground(-67.0,z),size=.55+rng()*1.10;
  if(i%4===0){
   oliveTrunks.push({x,y:y+.75*size,z,sx:size,sy:size,sz:size});
  }
  trees[i%3].push({x,y:y+1.10*size,z,sx:size*.95,sy:size*.62,sz:size*.89});
  for(let j=0;j<4;j++){
   const a=j*2.39996+rng(),d=.5+rng()*.38;
   flower[(i+j)%3].push({x:x+Math.cos(a)*d*size,y:y+1.47*size,z:z+Math.sin(a)*d*size,sx:.18*size,sy:.17*size,sz:.18*size});
  }
 }
 instances(root,new T.CylinderGeometry(.15,.24,1.5,7),'#9a7556',oliveTrunks);
 trees.forEach((p,i)=>instances(root,new T.IcosahedronGeometry(1,1),leafColors[i],p));
 flower.forEach((p,i)=>instances(root,new T.IcosahedronGeometry(1,0),flowerColors[i],p));
 return {flowerBushes:125,blossoms:500};
}
function seaGradient(root){
 const bands=[[-79,21,.27,'#38d8d4'],[-95,19,.15,'#3bcacb'],[-117,25,.09,'#b6eefa']];
 for(const [x,width,opacity,color] of bands){
  const plane=geoMesh(root,new T.PlaneGeometry(width,123),new T.MeshBasicMaterial({color,transparent:true,opacity,side:T.DoubleSide,depthWrite:false}),false);
  plane.rotation.x=-Math.PI/2;plane.position.set(x,-4.61,0);
 }
}
export function addScenicCoastline(root,ground){
 const group=new T.Group();group.name='Riviera · Sculpted cliffs and coves';root.add(group);
 const cliffs=coastalShelf(group,ground),coves=beaches(group),rocks=seaStacks(group),plants=coastalGarden(group,ground);
 seaGradient(group);
 return {...cliffs,...coves,...rocks,...plants};
}
export function resetCoastMaterials(){materials.clear();}
