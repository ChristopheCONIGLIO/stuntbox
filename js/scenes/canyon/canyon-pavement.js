import {THREE as T} from '../../core/util.js';
import {lane} from './canyon-assets.js';

const SAMPLES=512;
const LANES=[-4.20,-4.02,-3.65,-3.10,-2.38,-2.02,-1.77,-1.50,-.65,0,.65,1.50,1.77,2.02,2.38,3.10,3.65,4.02,4.20];
const CURB=[3.98,4.055,4.16,4.48,4.66,4.78];
const HEIGHTS=[.054,.082,.119,.119,.085,.050];

function sampleCurve(){
 const samples=[];
 for(let i=0;i<=SAMPLES;i++){
  const center=lane(i/SAMPLES,0),side=lane(i/SAMPLES,1);
  samples.push({x:center.x,z:center.z,nx:side.x-center.x,nz:side.z-center.z});
 }
 return samples;
}
function at(samples,i,offset){
 const p=samples[i];return{x:p.x+p.nx*offset,z:p.z+p.nz*offset};
}

function surface(parent,positions,colors,indices,material){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 const mesh=new T.Mesh(geometry,material);
 mesh.receiveShadow=true;mesh.castShadow=false;mesh.raycast=()=>{};
 parent.add(mesh);return mesh;
}
function gridIndices(width,length){
 const indices=[];
 for(let i=0;i<length-1;i++)for(let j=0;j<width-1;j++){
  const a=i*width+j,b=a+width;
  indices.push(a,b,a+1,a+1,b,b+1);
 }
 return indices;
}
function asphaltColor(lateral,station,arc){
 const d=Math.abs(lateral);
 const wheel=Math.exp(-Math.pow((d-1.77)/.31,2));
 const fine=Math.sin(arc*.087+Math.sin(lateral*2.3+arc*.021))*.017;
 const aggregate=Math.sin(station*.79+lateral*6.11)*Math.sin(station*.21-lateral*9.37)*.016;
 const edge=.16*Math.pow(Math.max(0,(d-3.45)/.76),1.3);
 const apex=.052*Math.exp(-Math.pow(lateral/.95,2));
 const intensity=Math.max(.67,Math.min(1.10,.965+fine+aggregate-edge-.16*wheel+apex));
 const col=new T.Color('#33364b');
 col.multiplyScalar(intensity);
 return col;
}
function createAsphalt(root,samples){
 const positions=[],colors=[],roadLength=LANES.length;
 const geometryIndices=gridIndices(roadLength,SAMPLES+1);
 let arc=0,previous=samples[0];
 const baseY=.047;
 for(let i=0;i<=SAMPLES;i++){
  const center=samples[i];
  if(i)arc+=Math.hypot(center.x-previous.x,center.z-previous.z);
  previous=center;
  for(const lateral of LANES){
   const p=at(samples,i,lateral),d=Math.abs(lateral);
   const bevel=Math.max(0,(d-3.98)/.22);
   const y=baseY-.007*bevel;
   positions.push(p.x,y,p.z);
   const c=asphaltColor(lateral,i,arc);
   colors.push(c.r,c.g,c.b);
  }
 }
 const mesh=surface(root,positions,colors,geometryIndices,new T.MeshStandardMaterial({
  vertexColors:true,roughness:.91,metalness:.035,side:T.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
 }));
 mesh.name='Sierra Cobre · Illustrated asphalt road';
 return {segments:SAMPLES,vertices:positions.length/3,triangles:geometryIndices.length/3};
}
function createCurbs(root,side,samples){
 const positions=[],colors=[],width=CURB.length,idx=gridIndices(width,SAMPLES+1);
 const cream=new T.Color('#fff5e8'),scarlet=new T.Color('#f03549');
 const creamShade=new T.Color('#d3bfa5'),redShade=new T.Color('#ad2f41');
 for(let i=0;i<=SAMPLES;i++){
  const alternate=Math.floor(i/8)%2===0;
  for(let j=0;j<width;j++){
   const p=at(samples,i,side*CURB[j]);
   positions.push(p.x,HEIGHTS[j],p.z);
   const c=(alternate?scarlet:cream).clone();
   if(j===0||j===width-1)c.lerp(alternate?redShade:creamShade,.40);
   else if(j===2||j===3)c.multiplyScalar(1.06);
   colors.push(c.r,c.g,c.b);
  }
 }
 const m=surface(root,positions,colors,idx,new T.MeshStandardMaterial({
  vertexColors:true,roughness:.78,metalness:0,side:T.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
 }));
 m.name=side<0?'Sierra Cobre · Inner kerb':'Sierra Cobre · Outer kerb';
 m.castShadow=true;
 return {segments:SAMPLES,vertices:positions.length/3,triangles:idx.length/3};
}
function roadWearing(root){
 const pos=[],col=[],rng=(i)=>((Math.sin(i*12.9898)*43758.5453)%1+1)%1;
 const asphalt=new T.Color('#1b1b2b'),smoke=new T.Color('#48445b');
 const stripes=66,steps=20;
 let stripesDone=0;
 for(let band=0;band<stripes;band++){
  const t0=(band*.6180339887)%1,t1=(t0+(.009+(.013*rng(band+7))))%1;
  if(t1<t0)continue;
  const laneOffset=(band%2===0?-1:1)*(1.66+.11*Math.sin(band*3.11));
  const width=.13+.11*rng(band+59),isDark=band%4!==0;
  const c=isDark?asphalt:smoke;
  for(let j=0;j<steps;j++){
   const a=t0+(t1-t0)*j/steps,b=t0+(t1-t0)*(j+1)/steps;
   const taper=Math.sin(Math.PI*(j+.5)/steps);
   const shift=(1-taper)*width*.68;
   const L0=lane(a,laneOffset-width*taper+shift),R0=lane(a,laneOffset+width*taper+shift);
   const L1=lane(b,laneOffset-width*taper+shift),R1=lane(b,laneOffset+width*taper+shift);
   for(const p of [L0,L1,R1,L0,R1,R0]){
    pos.push(p.x,.055,p.z);col.push(c.r,c.g,c.b);
   }
  }
  stripesDone++;
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(col,3));
 geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.32,
  side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 mesh.castShadow=false;mesh.receiveShadow=false;mesh.raycast=()=>{};
 mesh.renderOrder=2;root.add(mesh);
 return {rubberStreaks:stripesDone,triangles:pos.length/9};
}
export function addIllustratedRaceway(root){
 const group=new T.Group();
 group.name='Sierra Cobre · Premium visual surface';
 root.add(group);
 const samples=sampleCurve();
 const asphalt=createAsphalt(group,samples);
 const curbInside=createCurbs(group,-1,samples),curbOutside=createCurbs(group,1,samples);
 const wearing=roadWearing(group);
 return {asphalt,curbs:[curbInside,curbOutside],wearing};
}
