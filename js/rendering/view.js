import {SoftwareRenderer} from './software-renderer.js';
import {portraitSize} from '../scenes/police/police-render.js';
import {studioReflections} from './lighting.js';
import {THREE as T,clamp} from '../core/util.js';
export class View{
 constructor(canvas){
  this.canvas=canvas;try{this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});}catch{this.renderer=new SoftwareRenderer(canvas);}this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();if(!this.renderer.isSoftware){this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.19;studioReflections(this.renderer,this.scene);}this.camera=new T.PerspectiveCamera(42,1,.08,1800);this.target=new T.Vector3();this.splitCamera=new T.PerspectiveCamera(44,1,.10,150);this.splitLook=new T.Vector3();this.splitPosition=new T.Vector3();this.splitForward=new T.Vector3();this.splitCanvas=document.createElement('canvas');this.splitCanvas.hidden=true;this.splitCanvas.setAttribute('aria-label','Synchronized onboard and helicopter views');Object.assign(this.splitCanvas.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none'});canvas.after(this.splitCanvas);this.splitContext=this.splitCanvas.getContext('2d',{alpha:false});this.distance=12;this.az=.72;this.el=.42;
  this.scene.add(new T.HemisphereLight('#d8efff','#8b765b',1.18));this.light=new T.DirectionalLight('#fff1d8',3.65);this.light.castShadow=true;this.light.shadow.mapSize.set(2048,2048);this.light.shadow.normalBias=.025;this.light.shadow.bias=-.0002;this.scene.add(this.light,this.light.target);
  this.ray=new T.Raycaster();this.orbit();new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);
  canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=clamp(this.distance*Math.exp(e.deltaY*.001),1.6,850);this.orbit();},{passive:false});
 }
 resize(){const rect=this.canvas.parentElement.getBoundingClientRect(),h=this.vertical?Math.min(rect.height,rect.width*16/9):rect.height,w=this.vertical?h*9/16:rect.width;
  if(!w||!h)return;const resolution=this.renderer.isSoftware?Math.min(1,640/w,430/h):1;this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.renderer.setPixelRatio(this.vertical?1:Math.min(devicePixelRatio,1.25)*(this.previewScale||1));const portrait=portraitSize(this.filmScale||1);this.renderer.setSize(this.vertical?portrait.width:Math.max(1,Math.round(w*resolution)),this.vertical?portrait.height:Math.max(1,Math.round(h*resolution)),false);
  if(this.split){const {width:W,height:H}=this.canvas;this.splitCanvas.style.width=w+'px';this.splitCanvas.style.height=h+'px';if(this.splitCanvas.width!==W)this.splitCanvas.width=W;if(this.splitCanvas.height!==H)this.splitCanvas.height=H;this.camera.aspect=W/(H-Math.floor(H*.31));}else this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
 }
 orbit(){const k=Math.cos(this.el)*this.distance;this.camera.position.copy(this.target).add(new T.Vector3(Math.sin(this.az)*k,Math.sin(this.el)*this.distance,Math.cos(this.az)*k));this.camera.lookAt(this.target);this.camera.updateMatrixWorld();}
 drag(dx,dy,pan){if(pan){const m=this.camera.matrixWorld.elements,s=this.distance*.0016;this.target.add(new T.Vector3(-m[0]*dx+m[4]*dy,-m[1]*dx+m[5]*dy,-m[2]*dx+m[6]*dy).multiplyScalar(s));}
  else{this.az-=dx*.008;this.el=clamp(this.el+dy*.008,-1.44,1.53);}this.orbit();}
 frame(object){if(!object)return;const bounds=new T.Box3().setFromObject(object);if(bounds.isEmpty())return;const size=bounds.getSize(new T.Vector3());bounds.getCenter(this.target);this.distance=Math.max(4,size.length()*1.23/Math.min(1,this.camera.aspect));this.el=.4;this.orbit();}
 pick(e,objects){const b=this.canvas.getBoundingClientRect();this.ray.setFromCamera({x:(e.clientX-b.left)/b.width*2-1,y:1-(e.clientY-b.top)/b.height*2},this.camera);return this.ray.intersectObjects(objects,true);}
 lightAt(p,span){this.light.position.copy(p).add(new T.Vector3(-66,75,42));this.light.target.position.copy(p);const c=this.light.shadow.camera;c.left=c.bottom=-span;c.right=c.top=span;c.far=250;c.updateProjectionMatrix();}
 setShadowSize(size){
  if(this.renderer.isSoftware)return;
  const shadow=this.light.shadow;if(shadow.mapSize.x===size&&shadow.mapSize.y===size)return;
  shadow.map?.dispose();shadow.map=null;shadow.mapPass?.dispose();shadow.mapPass=null;shadow.mapSize.set(size,size);shadow.needsUpdate=true;
 }
 get outputCanvas(){return this.split?this.splitCanvas:this.canvas;}
 setSplit(active){
  this.split=!!active&&!this.renderer.isSoftware;this.splitCanvas.hidden=!this.split;this.canvas.style.opacity=this.split?'0':'';
  if(!this.split)this.splitCar=null;
  this.resize();
 }
 draw(refreshShadow=true){
  if(this.renderer.isSoftware){this.renderer.render(this.scene,this.camera);return;}
  const shadow=this.light.shadow;shadow.autoUpdate=refreshShadow;if(refreshShadow)shadow.needsUpdate=true;
  if(!this.split||!this.splitCar){this.renderer.render(this.scene,this.camera);return;}
  const r=this.renderer,W=this.canvas.width,H=this.canvas.height,ctx=this.splitContext;
  const left=Math.round(H*.35),right=Math.floor(H*.31),top=left,bottom=H-right;
  const car=this.splitCar.mesh,fp=this.splitCamera;
  this.splitPosition.set(0,1.43,1.12).applyQuaternion(car.quaternion).add(car.position);
  this.splitForward.set(0,-.11,1).applyQuaternion(car.quaternion);
  this.splitLook.copy(this.splitPosition).addScaledVector(this.splitForward,25);
  fp.position.copy(this.splitPosition);fp.up.set(0,1,0);fp.lookAt(this.splitLook);fp.aspect=W/top;fp.updateProjectionMatrix();
  r.setScissorTest(true);
  try{
   r.setViewport(0,0,W,bottom);r.setScissor(0,0,W,bottom);
   r.render(this.scene,this.camera);
   ctx.drawImage(this.canvas,0,right,W,bottom,0,right,W,bottom);
   shadow.autoUpdate=false;shadow.needsUpdate=false;
   r.setViewport(0,H-top,W,top);r.setScissor(0,H-top,W,top);
   r.render(this.scene,fp);
   ctx.save();
   try{
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,right);ctx.lineTo(0,left);ctx.closePath();ctx.clip();
    ctx.drawImage(this.canvas,0,0,W,top,0,0,W,top);
   }finally{ctx.restore();}
   ctx.beginPath();ctx.moveTo(-1,left);ctx.lineTo(W+1,right);ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(2,W*.0065);ctx.stroke();
  }finally{
   r.setScissorTest(false);r.setViewport(0,0,W,H);shadow.autoUpdate=refreshShadow;
  }
 }
}
export function gizmo(position,size,mode){
 const g=new T.Group();g.position.copy(position);g.scale.setScalar(size);
 for(const [i,axis] of ['x','y','z'].entries()){
  const d=new T.Vector3();d[axis]=1;const color=[0xeb6860,0x73bc67,0x529bea][i];let mesh;
  if(mode==='rotate'){
   mesh=new T.Mesh(new T.TorusGeometry(.83,.042,7,52),new T.MeshBasicMaterial({color,depthTest:false}));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d);
  }else{mesh=new T.ArrowHelper(d,new T.Vector3(),1,color,.23,.14);
   const handle=new T.Mesh(mode==='scale'?new T.BoxGeometry(.17,.17,.17):new T.SphereGeometry(.095),new T.MeshBasicMaterial({color,depthTest:false}));handle.position.set(0,1,0);mesh.add(handle);}
  mesh.traverse(o=>{o.userData.axis=axis;o.renderOrder=12;if(o.material)o.material.depthTest=false;});g.add(mesh);
 }return g;
}
export function release(root){
 if(!root)return;const geos=new Set(),mats=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of [].concat(o.material)){mats.add(m);if(m.map)textures.add(m.map);}});
 for(const g of geos)g.dispose();for(const m of mats)m.dispose();for(const t of textures)t.dispose();root.removeFromParent();
}
