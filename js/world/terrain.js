import {decorateCanyonTerrain} from '../scenes/canyon/canyon-visuals.js';
import {decorateMarseilleTerrain} from '../scenes/marseille/marseille-visuals.js';
import {THREE as T,clamp} from '../core/util.js';
export const surfaces=['Asphalt','Concrete','Grass','Dirt','Sand','Gravel'];
const colors=['#34384c','#f1ead9','#54a864','#b88965','#f6d599','#b1a79c'].map(x=>new T.Color(x));
const marseilleColors=['#2f344a','#e3d2b5','#60a75d','#bb9476','#edcca1','#bdb4a2'].map(x=>new T.Color(x));
export function blank(w=120,d=120){
 const nx=Math.ceil(w/2),nz=Math.ceil(d/2),n=(nx+1)*(nz+1);
 return {version:1,name:'Untitled map',terrain:{w,d,nx,nz,h:Array(n).fill(0),mat:Array(n).fill(1)},objects:[]};
}
export class Terrain{
 constructor(data,edit){
  this.data=data;this.edit=edit;
  const {w,d,nx,nz}=data;this.geo=new T.PlaneGeometry(w,d,nx,nz);this.geo.rotateX(-Math.PI/2);
  this.geo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(data.h.length*3),3));
  const mat=new T.MeshStandardMaterial({vertexColors:true,flatShading:data.theme==='sierra',roughness:.95,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  if(edit)mat.onBeforeCompile=s=>{s.vertexShader='varying vec2 gridPos;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ngridPos=position.xz;');s.fragmentShader='varying vec2 gridPos;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec2 g=abs(fract(gridPos/2.+.5)-.5)/max(fwidth(gridPos/2.),vec2(.0001));float k=1.-smoothstep(0.,1.,min(g.x,g.y));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.34,.45),.65*k);');};
  this.mesh=new T.Mesh(this.geo,mat);this.mesh.receiveShadow=true;this.update();
  if(data.theme==='sierra')this.mesh.add(decorateCanyonTerrain(data,(x,z)=>heightAt(data,x,z)));
  if(data.theme==='marseille')this.mesh.add(decorateMarseilleTerrain(data,(x,z)=>heightAt(data,x,z)));
 }
 update(){const {h,mat}=this.data,p=this.geo.attributes.position,c=this.geo.attributes.color,blue=new T.Color('#274156');
  for(let i=0;i<h.length;i++){p.setY(i,h[i]);const col=this.edit&&mat[i]===1?blue:colors[this.data.theme==='training'&&mat[i]===1?2:mat[i]];if(this.data.theme==='sierra'&&mat[i]===4){const x=p.getX(i),z=p.getZ(i),v=.96+.044*Math.sin(x*.22+z*.17)+.025*Math.cos(z*.44-x*.19)+.035*Math.sin(x*1.3+z*2.7);const ridge=clamp((h[i]-.9)/7,0,1);
   const coast=clamp((-x-22)/46,0,1);
   const mineral=clamp(.12+ridge*.51+coast*.42+.11*Math.sin(x*.16+z*.21),.05,.96);
   const green=new T.Color('#59b45e'),limestone=new T.Color('#efc99c');
   green.lerp(limestone,mineral);
   c.setXYZ(i,Math.min(1,green.r*v),Math.min(1,green.g*v),Math.min(1,green.b*v));}else{
   const x=p.getX(i),z=p.getZ(i),index=mat[i];
   const texture=index===2||this.data.theme==='training'&&index===1;
   const base=this.data.theme==='marseille'?marseilleColors[index]:col;
   const ripple=texture ? .91+.11*(.5+.5*Math.sin(x*.31+Math.sin(z*.19)*1.4))+.035*Math.sin(x*1.21-z*.74) : 1;
   c.setXYZ(i,Math.min(1,base.r*ripple),Math.min(1,base.g*ripple),Math.min(1,base.b*ripple));
  }}
  p.needsUpdate=c.needsUpdate=true;this.geo.computeVertexNormals();this.geo.computeBoundingSphere();this.geo.computeBoundingBox();
 }
 brush(point,mode,radius,power,soft,material,level){
  const {nx,nz,w,d,h,mat}=this.data,dx=w/nx,dz=d/nz,cx=(point.x+w/2)/dx,cz=(point.z+d/2)/dz;
  const old=mode==='smooth'?h.slice():h;
  for(let z=Math.max(0,Math.floor(cz-radius/dz));z<=Math.min(nz,cz+radius/dz);z++)for(let x=Math.max(0,Math.floor(cx-radius/dx));x<=Math.min(nx,cx+radius/dx);x++){
   const dist=Math.hypot((x-cx)*dx,(z-cz)*dz)/radius;if(dist>1)continue;
   const i=z*(nx+1)+x,k=power*Math.min(1,(1-dist)/Math.max(.02,soft));
   if(mode==='paint')mat[i]=material;
   else if(mode==='raise'||mode==='lower')h[i]=clamp(h[i]+k*(mode==='raise'?1:-1),-80,80);
   else{const avg=(old[z>0?i-nx-1:i]+old[z<nz?i+nx+1:i]+old[i-(x>0?1:0)]+old[i+(x<nx?1:0)])/4;h[i]+=(mode==='flat'?level-h[i]:avg-h[i])*Math.min(1,k);}
  }this.update();
 }
 dispose(){
  for(const root of [...this.mesh.children]){
   if(root.name!=='Sierra Cobre · Riviera scenery'&&root.name!=='MARSEILLE · 3D scenery')continue;
   const geometries=new Set(),materials=new Set();
   root.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    if(o.material)for(const m of [].concat(o.material))materials.add(m);
   });
   for(const geo of geometries)geo.dispose();
   for(const mat of materials)mat.dispose();
   this.mesh.remove(root);
  }
  this.geo.dispose();this.mesh.material.dispose();
 }
}
export function heightAt(t,x,z){
 const gx=clamp((x/t.w+.5)*t.nx,0,t.nx),gz=clamp((z/t.d+.5)*t.nz,0,t.nz),ix=Math.min(t.nx-1,Math.floor(gx)),iz=Math.min(t.nz-1,Math.floor(gz)),u=gx-ix,v=gz-iz,i=iz*(t.nx+1)+ix;
 const a=t.h[i],b=t.h[i+1],c=t.h[i+t.nx+1],d=t.h[i+t.nx+2];
 return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}
