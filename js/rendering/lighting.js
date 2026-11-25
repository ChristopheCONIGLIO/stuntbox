import {heightAt} from '../world/terrain.js';
import {THREE as T} from '../core/util.js';
import {groundShadow} from './shadows.js';
let contactTexture;
function penumbra(){
 if(contactTexture)return contactTexture;
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
 for(const [x,a] of [[0,.75],[.48,.61],[.76,.26],[1,0]])gradient.addColorStop(x,'rgba(19,24,45,'+a+')');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);contactTexture=new T.CanvasTexture(c);contactTexture.colorSpace=T.SRGBColorSpace;return contactTexture;
}
export function contact(parent,w,d){
 const mesh=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:penumbra(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 mesh.rotation.x=-Math.PI/2;mesh.position.y=.026;mesh.renderOrder=2;mesh.userData.shadow=true;parent.add(mesh);return mesh;
}
export function castOnFloor(parent,obj,y=0,terrain=null){
 obj.updateWorldMatrix(true,true);const projected=[],v=new T.Vector3();obj.traverse(m=>{
  if(!m.isMesh||!m.castShadow||m.material.transparent||m.userData.shadow)return;const p=m.geometry.attributes.position;
  for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/40))){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);const h=Math.max(0,v.y-y);projected.push([v.x+h*.88,v.z-h*.56]);}
 });if(projected.length<3)return;
 projected.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const half=list=>{const out=[];for(const p of list){while(out.length>=2){const [a,b]=out.slice(-2);if((b[0]-a[0])*(p[1]-a[1])>(b[1]-a[1])*(p[0]-a[0]))break;out.pop();}out.push(p);}out.pop();return out;};
 const hull=half(projected).concat(half(projected.reverse()));if(hull.length<3)return;
 if(!terrain)return groundShadow(parent,hull,.36,y+.022);
 const positions=[],mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 function drape(a,b,c,level){
  const span=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1]));
  if(span>2.8&&level<4){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);drape(a,ab,ca,level+1);drape(ab,b,bc,level+1);drape(ca,bc,c,level+1);drape(ab,bc,ca,level+1);return;}
  for(const [x,z] of [a,b,c])positions.push(x,heightAt(terrain,x,z)+.065,z);
 }
 for(let i=1;i+1<hull.length;i++)drape(hull[0],hull[i],hull[i+1],0);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:'#26303a',transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide}));m.renderOrder=1;m.userData.shadow=true;parent.add(m);return m;
}
export function studioReflections(renderer,scene){
 const room=new T.Scene();room.background=new T.Color('#79bce9');
 const panels=[
  [-5,7,3,7,4,'#fff2d9',2.35],
  [5,3,-1,4,7,'#c4e5fa',1.75],
  [0,7,-5,8,3,'#eefaff',2.05],
  [1,2,5,5,2,'#e5b989',.9]
 ];
 for(const [x,y,z,w,h,color,intensity] of panels){
  const glow=new T.Color(color).multiplyScalar(intensity);
  const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:glow,side:T.DoubleSide}));
  panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);
 }
 const pmrem=new T.PMREMGenerator(renderer);
 const target=pmrem.fromScene(room,.055);
 scene.environment=target.texture;scene.environmentIntensity=.78;
 pmrem.dispose();room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
}
