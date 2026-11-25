import {THREE,glowTexture} from '../core/util.js';
import {PoliceFX} from '../scenes/police/police-fx.js';
const texture=glowTexture();
export class Effects{
constructor(scene,rng,police=false,software=false){this.police=police?new PoliceFX(scene,rng,texture,software):null;this.scene=scene;this.rng=rng;this.items=[];this.max=300;this.impulse=0;this.segmentCount=0;this.asphaltCount=0;this.capacity=24000;this.positions=new Float32Array(this.capacity*18);this.geom=new THREE.BufferGeometry();this.geom.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));this.geom.setDrawRange(0,0);this.skidMesh=new THREE.Mesh(this.geom,new THREE.MeshBasicMaterial({color:'#1a2825',transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}));this.skidMesh.frustumCulled=false;this.skidMesh.renderOrder=2;scene.add(this.skidMesh);this.sandCount=0;this.sandPositions=new Float32Array(this.capacity*18);this.sandGeometry=new THREE.BufferGeometry();this.sandGeometry.setAttribute('position',new THREE.BufferAttribute(this.sandPositions,3).setUsage(THREE.DynamicDrawUsage));this.sandGeometry.setDrawRange(0,0);this.sandMesh=new THREE.Mesh(this.sandGeometry,new THREE.MeshBasicMaterial({color:'#a78d62',transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide}));this.sandMesh.frustumCulled=false;this.sandMesh.renderOrder=2;scene.add(this.sandMesh);}
puff(x,y,z,type='smoke',count=3){for(let i=0;i<count&&this.items.length<this.max;i++){let spark=type==='spark',sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:spark?'#ffbf65':type==='sand'?'#e8cfa2':'#dae0d2',transparent:true,depthWrite:false,opacity:spark?1:.25,blending:spark?THREE.AdditiveBlending:THREE.NormalBlending}));sprite.position.set(x,y,z);let size=spark?.32:.8;sprite.scale.set(size,size,1);this.scene.add(sprite);this.items.push({sprite,life:spark?.38:.6,max:spark?.38:.6,vx:(this.rng()-.5)*(spark?20:3),vy:spark?2+this.rng()*6:1.5,vz:(this.rng()-.5)*(spark?20:3),spark});}}
segment(a,b,sand=false,width=.3){let dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.06||len>5)return;let x=-dz/len*width/2,z=dx/len*width/2,i=(sand?this.sandCount:this.asphaltCount)%this.capacity*18;const positions=sand?this.sandPositions:this.positions,geometry=sand?this.sandGeometry:this.geom;positions.set([a.x+x,a.y,a.z+z,a.x-x,a.y,a.z-z,b.x-x,b.y,b.z-z,a.x+x,a.y,a.z+z,b.x-x,b.y,b.z-z,b.x+x,b.y,b.z+z],i);if(sand)this.sandCount++;else this.asphaltCount++;this.segmentCount++;geometry.setDrawRange(0,Math.min(sand?this.sandCount:this.asphaltCount,this.capacity)*6);const attr=geometry.attributes.position;
 if(this.partialUploads){const last=attr.updateRanges.at(-1);if(last&&last.start+last.count===i)last.count+=18;else attr.addUpdateRange(i,18);}
 attr.needsUpdate=true;}
skid(car){
 const p=car.body.translation(),q=car.body.rotation(),v=car.body.linvel(),speed=Math.hypot(v.x,v.z),side=Math.abs(v.x*Math.cos(car.yaw)-v.z*Math.sin(car.yaw)),upright=1-2*(q.x*q.x+q.z*q.z),sand=car.surface==='sand';
 const active=upright>.65&&speed>7&&(sand||side>1.8||car.slip>1.8||car.inputs?.brake>.65||car.inputs?.handbrake||car.hitStun>.2);
 if(!active){car.lastSkid=null;return;}
 const rotation=new THREE.Quaternion(q.x,q.y,q.z,q.w),wheels=car.mesh.userData.wheels;
 const points=wheels.map(w=>{const local=w.pivot.position,radius=w.wheel.geometry.parameters.radiusTop,contact=new THREE.Vector3(local.x,local.y-radius,local.z).applyQuaternion(rotation).add(new THREE.Vector3(p.x,p.y,p.z)),ground=car.physics.surfaceHeightAt?.(contact.x,contact.z,p.y+.8)||0;
 // The road paint and pavement are visual layers above the physics collider.
 // Keep the rubber above them, and never connect airborne wheel samples.
 if(contact.y-ground>.28||contact.y-ground<-.6)return null;
 return {x:contact.x,z:contact.z,y:ground+.125,width:w.wheel.geometry.parameters.height,sand};});
 if(car.lastSkid)for(let i=0;i<points.length;i++){const before=car.lastSkid[i],now=points[i];if(before&&now&&before.sand===now.sand)this.segment(before,now,sand,now.width);}
 car.lastSkid=points;
}
update(dt){this.police?.update(dt);this.impulse*=Math.exp(-dt*5);for(let i=this.items.length-1;i>=0;i--){let p=this.items[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.sprite);p.sprite.material.dispose();this.items.splice(i,1);continue;}p.sprite.position.x+=p.vx*dt;p.sprite.position.y+=p.vy*dt;p.sprite.position.z+=p.vz*dt;if(p.spark)p.vy-=18*dt;else p.sprite.scale.addScalar(dt*1.5);p.sprite.material.opacity=(p.spark?1:.25)*p.life/p.max;}}
dispose(){this.police?.dispose();for(let p of this.items){this.scene.remove(p.sprite);p.sprite.material.dispose();}this.scene.remove(this.skidMesh);this.scene.remove(this.sandMesh);this.sandGeometry.dispose();this.sandMesh.material.dispose();this.geom.dispose();this.skidMesh.material.dispose();}
}
