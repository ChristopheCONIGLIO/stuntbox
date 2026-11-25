import {THREE as T} from '../../core/util.js';
import {marseilleLane,marseilleWidth} from './marseille-track.js';

const N=1120;
const colors={
 asphalt:'#2f344a',grain:'#3b3e53',white:'#fff3dc',
 crimson:'#ed3c4a',limestone:'#e8c5a0',dark:'#1b273b',steel:'#acb7af'
};
function mesh(parent,geometry,material,name,shadow=false){
 const m=new T.Mesh(geometry,material);
 m.name=name;m.castShadow=shadow;m.receiveShadow=true;m.raycast=()=>{};
 parent.add(m);return m;
}
function ribbon(parent,columns,shade,position,ground){
 const pos=[],cols=[],indices=[],width=columns.length;
 for(let i=0;i<=N;i++){
  const t=i/N,half=marseilleWidth(t)/2;
  for(let j=0;j<width;j++){
   const offset=columns[j]*half,p=marseilleLane(t,offset);
   const edge=Math.abs(columns[j]);
   const h=ground(p.x,p.z)+position-(edge>.9?.004:0);
   pos.push(p.x,h,p.z);
   const c=shade(t,i,j,columns[j]);
   cols.push(c.r,c.g,c.b);
  }
 }
 for(let i=0;i<N;i++)for(let j=0;j<width-1;j++){
  const a=i*width+j,b=(i+1)*width+j;
  indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 mesh(parent,geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.94,metalness:.014,
  polygonOffset:true,polygonOffsetFactor:-1}),shade.name||'Road');
 return indices.length/3;
}
function instanced(parent,geometry,color,parts,shadows=false){
 if(!parts.length)return;
 const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color,roughness:.82,metalness:.03}),parts.length);
 const dummy=new T.Object3D();
 for(let i=0;i<parts.length;i++){
  const p=parts[i];dummy.position.set(p.x,p.y,p.z);
  dummy.rotation.set(0,p.yaw||0,0);
  dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);
  dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.raycast=()=>{};parent.add(mesh);
}
function racingColor(t,i,j,p){
 const c=new T.Color(colors.asphalt),d=Math.abs(p);
 const r=.972+Math.sin(i*.37+j*1.8)*.025+Math.sin(i*.91-j*2.31)*.018;
 const wheel=Math.exp(-Math.pow((d-.33)/.16,2));
 c.multiplyScalar(r-wheel*.14-(d>.87?.055:0));
 return c;
}
function stripColor(t,i,j,p){
 const center=Math.abs(p)<.08;
 const marked=Math.floor(i/12)%2===0;
 const red=Math.floor(i/14)%2===0;
 return new T.Color(center?(marked?colors.white:colors.asphalt):(red?colors.crimson:colors.white));
}
export function decorateMarseilleRoad(root,ground){
 const road=new T.Group();road.name='MARSEILLE · route de rallye — rendu';root.add(road);
 const asphalt=ribbon(road,[-1,-.93,-.66,-.46,-.30,0,.30,.46,.66,.93,1],racingColor,.084,ground);
 const paint=[],paintColor=[],laneSteps=1120;
 const ribbons=[{shift:0,width:.09,type:'middle'},{shift:-1,width:.08,type:'edge'},{shift:1,width:.08,type:'edge'}];
 for(const mark of ribbons){
  const stroke=[],ink=[],shade=new T.Color(colors.white);
  for(let i=0;i<laneSteps;i++){
   if(mark.type==='middle'&&Math.floor(i/18)%2)continue;
   const t0=i/laneSteps,t1=(i+1)/laneSteps;
   let shift=(t)=>mark.shift===0?0:mark.shift*(marseilleWidth(t)/2-.72);
   const v=[];
   for(const [t,side] of [[t0,-1],[t1,-1],[t1,1],[t0,-1],[t1,1],[t0,1]]){
    const p=marseilleLane(t,shift(t)+side*mark.width);
    v.push([p.x,ground(p.x,p.z)+.116,p.z]);
   }
   for(const p of v){stroke.push(...p);ink.push(shade.r,shade.g,shade.b);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(stroke,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(ink,3));geo.computeVertexNormals();
  mesh(road,geo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,depthWrite:true,
   polygonOffset:true,polygonOffsetFactor:-2}),'Marseille · marquage',false);
 }
 const curbPos=[],curbCol=[],curbV=0;
 for(let i=0;i<N;i++){
  const a=i/N,b=(i+1)/N,red=Math.floor(i/12)%2===0;
  for(const side of [-1,1]){
   const w0=marseilleWidth(a)/2,w1=marseilleWidth(b)/2;
   const c=new T.Color(red?colors.crimson:colors.white);
   const inner=side*(w0-.07),outer=side*(w0+.52),inner1=side*(w1-.07),outer1=side*(w1+.52);
   for(const [t,off] of [[a,inner],[b,inner1],[b,outer1],[a,inner],[b,outer1],[a,outer]]){
    const p=marseilleLane(t,off),h=ground(p.x,p.z);
    curbPos.push(p.x,h+.115,p.z);curbCol.push(c.r,c.g,c.b);
   }
  }
 }
 const curbGeo=new T.BufferGeometry();
 curbGeo.setAttribute('position',new T.Float32BufferAttribute(curbPos,3));
 curbGeo.setAttribute('color',new T.Float32BufferAttribute(curbCol,3));
 curbGeo.computeVertexNormals();
 mesh(road,curbGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:.86,side:T.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-3}),'Marseille · vibreurs rouges / blancs');
 const beams=[],posts=[],warning=[];
 let barriers=0;
 for(const [start,end,side] of [[.02,.13,-1],[.18,.29,-1],[.46,.63,1],[.72,.83,-1],[.87,.99,-1]]){
  for(let t=start;t<end;t+=.0044){
   const a=marseilleLane(t,side*(marseilleWidth(t)/2+1.7)),next=Math.min(end,t+.0044);
   const b=marseilleLane(next,side*(marseilleWidth(next)/2+1.7));
   const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
   const y=ground(x,z)+.52;
   beams.push({x,y,z,yaw,sx:.15,sy:.24,sz:dist+.09});
   barriers++;
   if(barriers%3===0){
    posts.push({x:a.x,y:ground(a.x,a.z)+.29,z:a.z,sx:.2,sy:.6,sz:.20});
    warning.push({x:a.x,y:ground(a.x,a.z)+.73,z:a.z,sx:.30,sy:.10,sz:.30});
   }
  }
 }
 instanced(road,new T.BoxGeometry(1,1,1),colors.steel,beams,true);
 instanced(road,new T.BoxGeometry(1,1,1),colors.dark,posts,true);
 instanced(road,new T.BoxGeometry(1,1,1),colors.crimson,warning,false);
 const checkers=[];
 const start=marseilleLane(0),dir=marseilleLane(.001);
 const yaw=Math.atan2(dir.x-start.x,dir.z-start.z);
 for(let x=0;x<16;x++)for(let z=0;z<2;z++){
  const lateral=(x-7.5)*.83,forward=z*.83;
  const p=marseilleLane(forward/2300,lateral);
  checkers.push({x:p.x,y:ground(p.x,p.z)+.128,z:p.z,yaw,sx:.81,sy:.014,sz:.81});
 }
 const white=checkers.filter((_,i)=>(Math.floor(i/2)+i%2)%2===0),black=checkers.filter((_,i)=>(Math.floor(i/2)+i%2)%2!==0);
 instanced(road,new T.BoxGeometry(1,1,1),colors.white,white,false);
 instanced(road,new T.BoxGeometry(1,1,1),colors.dark,black,false);
 return {roadTriangles:asphalt,curbSegments:N*2,barrierSegments:barriers,startCells:checkers.length};
}
