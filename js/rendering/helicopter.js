import {THREE,clamp} from '../core/util.js';
export class Helicopter{
constructor(){this.camera=new THREE.PerspectiveCamera(40,9/16,.5,600);this.focus=new THREE.Vector3();this.initial=true;this.ray=new THREE.Raycaster();}
update(car,dt,t,settings,world,impact,ending){
 const finale=world.episode;
 if(finale?.kind===2||finale?.kind===4||finale?.kind===5){finale.camera(this,car,dt,t,settings,world,impact);return;}
 if(finale?.kind===3&&finale.finaleAt!==null){if(!finale.e1CameraLock)finale.e1CameraLock={position:this.camera.position.clone(),focus:this.focus.clone(),fov:this.camera.fov};this.camera.position.copy(finale.e1CameraLock.position);this.focus.copy(finale.e1CameraLock.focus);this.camera.fov=THREE.MathUtils.lerp(finale.e1CameraLock.fov,100,clamp((t-finale.finaleAt)/3,0,1));this.camera.updateProjectionMatrix();this.camera.lookAt(this.focus.x,this.focus.y+1,this.focus.z);this.camera.updateMatrixWorld();return;}
 if(finale&&finale.kind!==3&&finale.finaleAt!==null){
  if(!finale.cameraStart){finale.cameraStart={position:this.camera.position.clone(),focus:this.focus.clone(),fov:this.camera.fov};}
  const age=t-finale.finaleAt,phase=clamp(age/1.8,0,1),ease=phase*phase*(3-2*phase);
  const destination=new THREE.Vector3(finale.signPosition.x-14,22,finale.signPosition.z+43),target=new THREE.Vector3(finale.signPosition.x,finale.signPosition.y,finale.signPosition.z);
  this.camera.position.lerpVectors(finale.cameraStart.position,destination,ease);
  this.focus.lerpVectors(finale.cameraStart.focus,target,ease);
  this.camera.fov=THREE.MathUtils.lerp(finale.cameraStart.fov,34,ease);this.camera.updateProjectionMatrix();this.camera.lookAt(this.focus);this.camera.updateMatrixWorld();return;
 }
 let first=this.initial,p=car.mesh.position,v=car.body.linvel(),speed=Math.hypot(v.x,v.z),speedZoom=clamp((speed-17)/31,0,1)*(settings.speedFollow??1);
 const crash=world.crashSpot,age=crash?t-crash.time:99,active=crash&&age>=0&&age<2.35&&crash.car?.mesh?.visible;
 let zoomForCrash=0;
 const desired=new THREE.Vector3(p.x,Math.max(0,p.y),p.z).add(new THREE.Vector3(v.x,0,v.z).multiplyScalar(world.episode?.27:.12));
 if(active){const other=crash.car.mesh.position,distance=Math.hypot(other.x-p.x,other.z-p.z),envelope=clamp((2.35-age)/1.15,0,1);
  zoomForCrash=clamp((distance-9)/45,0,1)*envelope;
  const focusBlend=(.22+.16*zoomForCrash)*envelope;
  desired.lerp(new THREE.Vector3(other.x,Math.max(other.y,0),other.z),focusBlend);
 }else{
  const peers=(world.cars||[]).filter(c=>c!==car&&!c.disabled&&!c.parked&&(c.kind==='police'||c.kind==='swat')&&c.mesh.position.distanceTo(p)<58).sort((a,b)=>a.mesh.position.distanceToSquared(p)-b.mesh.position.distanceToSquared(p)).slice(0,3);
  if(peers.length){const center=new THREE.Vector3();for(const peer of peers)center.add(peer.mesh.position);center.multiplyScalar(1/peers.length);desired.lerp(center,.34);}
 }
 if(this.initial){this.focus.copy(desired);this.initial=false;}
 this.focus.lerp(desired,1-Math.exp(-dt*(2.7+settings.camera*1.6)));
 if(finale?.kind===3){const dx=this.focus.x-p.x,dz=this.focus.z-p.z,d=Math.hypot(dx,dz);if(d>7){this.focus.x=p.x+dx/d*7;this.focus.z=p.z+dz/d*7;}}
 const reveal=clamp(car.slip/12,0,1),traffic=world.cars?.filter(c=>c!==car&&c.mesh.position.distanceTo(p)<31).length||0;
 const baseWiden=ending?1.24:1+reveal*.09+Math.min(.12,traffic*.018);
 const widen=clamp(baseWiden-speedZoom*.105+zoomForCrash*.55,.82,1.72);
 const az=(settings.cameraAngle??.72)+Math.sin(t*.12)*.065;
 const offset=new THREE.Vector3(Math.sin(az)*(settings.cameraDistance??38),settings.cameraHeight??52,Math.cos(az)*(settings.cameraDistance??38)).multiplyScalar(widen),camPos=this.focus.clone().add(offset);
 this.camera.position.lerp(camPos,1-Math.exp(-dt*(zoomForCrash>0?3.6:3.0)));
 if(first||t===0)this.camera.position.copy(camPos);
 const wantedFov=40-speedZoom*3.7+zoomForCrash*8.2;
 this.camera.fov=THREE.MathUtils.damp(this.camera.fov,wantedFov,2.8,dt);this.camera.updateProjectionMatrix();
 this.camera.lookAt(this.focus.x,this.focus.y+1.0,this.focus.z);this.camera.updateMatrixWorld();

let dir=p.clone().add(new THREE.Vector3(0,.8,0)).sub(this.camera.position);this.ray.set(this.camera.position,dir.clone().normalize());this.ray.far=dir.length()-2;let hits=this.ray.intersectObjects(world.buildings,true),hidden=new Set(hits.map(h=>{let o=h.object;while(o.parent&&!world.buildings.includes(o))o=o.parent;return o;}));for(let b of world.buildings){let fade=hidden.has(b);if(fade||b.userData.faded||b.userData.restoring){let restoring=false;b.traverse(o=>{if(!o.isMesh)return;if(!o.userData.ownMat){o.material=o.material.clone();o.userData.ownMat=true;}o.material.transparent=true;o.material.opacity=THREE.MathUtils.damp(o.material.opacity,fade?.17:1,10,dt);if(!fade&&o.material.opacity>.99)o.material.opacity=1;o.material.depthWrite=o.material.opacity>.9;if(o.material.opacity<1)restoring=true;});b.userData.faded=fade;b.userData.restoring=!fade&&restoring;}}
if(impact>.1&&(settings.shake??.5)>0){this.camera.position.x+=Math.sin(t*63)*impact*.17*(settings.shake??.5);this.camera.position.z+=Math.cos(t*55)*impact*.17;}
}
}
