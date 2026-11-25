import {policeMotion} from '../scenes/police/police-one.js';
import {visualTick,chooseImpact} from '../scenes/police/police-camera.js';
import {contactGround,terrainTiles,tileAttribute,streetSectors,budgetBeacons,syncPropVisual,trafficTelemetry,closeArrest} from '../scenes/police/police-render.js';
import {driftSmokeCount} from '../scenes/police/police-fx.js';
import {finaleState} from '../scenes/police/police-finale.js';
import {fragmentLayout,fragmentColor,FragmentBatch,syncFragment} from '../scenes/police/police-fragments.js';
import {impactMaterial} from '../scenes/police/police-audio.js';
import {decoratePoliceCar,finishPolicePaint} from '../scenes/police/police-livery.js';
import {rightingImpulse} from '../scenes/police/police-recovery.js';
import {trafficCommand} from '../scenes/police/police-traffic.js';
import {prepareRun,pilotArcade,routeMotion} from '../physics/arcade-drive.js';
import {contact,castOnFloor} from '../rendering/lighting.js';
import {THREE as T,clamp,random,box,bake} from './util.js';
import {Physics,RAPIER as R,drive} from '../physics/physics.js';
import {assets,instance} from './registry.js';
import {Terrain} from '../world/terrain.js';
import {Effects} from '../rendering/effects.js';
const vec=a=>new T.Vector3().fromArray(a);
function triangles(root){
 const positions=[],indices=[],v=new T.Vector3();root.updateWorldMatrix(true,true);
 root.traverse(m=>{if(!m.isMesh||!m.geometry.attributes.position)return;const g=m.geometry,p=g.attributes.position,start=positions.length/3;
  for(let i=0;i<p.count;i++)positions.push(...v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray());
  for(let i=0;i<(g.index?.count??p.count);i++)indices.push(start+(g.index?g.index.getX(i):i));
 });return [positions,indices];
}
function damageCar(car,severity,rng){
 if(!car||!car.mesh?.userData)return;
 const data=car.mesh.userData;car.visualDamage=Math.min(1.6,(car.visualDamage||0)+severity*.32);
 car.damagePitch=(car.damagePitch||0)+severity*.06;car.damageRoll=(car.damageRoll||0)+(rng()-.5)*severity*.18;
 car.damageSink=Math.min(.28,(car.damageSink||0)+severity*.035);
 car.damageSquash=Math.min(.34,(car.damageSquash||0)+severity*.06);
 if(data.wheels){
  for(const w of data.wheels){
   if(!w.baseY)w.baseY=w.pivot.position.y;
   if(!w.baseScale)w.baseScale=w.pivot.scale.x||1;
  }
  if(severity>.9){
   const pick=data.wheels[Math.floor(rng()*data.wheels.length)];
   if(pick&&!pick.detached){pick.detached=true;pick.detachSpin=(rng()>.5?1:-1)*(.8+rng()*.8);pick.detachDrop=.06+rng()*.08;}
  }
 }
 if(severity>1.15&&!car.destroyed){car.destroyed=true;car.disabled=true;}
}

function syncChassis(car,time,wheelDistance=(car.wheelSpeed||0)/120){let chassis=car.mesh.userData.chassis;if(chassis){const dmg=car.visualDamage||0;chassis.rotation.z=clamp(-car.steer*car.slip*.018,-.12,.12)+(car.damageRoll||0);chassis.rotation.x=clamp((car.inputs?.brake||0)*.06-(car.inputs?.throttle||0)*.035,-.06,.08)+(car.damagePitch||0);chassis.position.y=Math.sin(time*37)*car.hitStun*.035-(car.damageSink||0);chassis.scale.set(1-Math.min(.14,dmg*.05),1-Math.min(.28,dmg*.11),1-Math.min(.18,dmg*.07));car.lastVisualSpeed=car.speed;}for(let w of car.mesh.userData.wheels){if(!w.baseY)w.baseY=w.pivot.position.y;if(!w.baseScale)w.baseScale=w.pivot.scale.x||1;w.pivot.rotation.y=(w.front?car.steer*.43:0)+(w.detached?(w.detachSpin||0):0);if(!w.rotor){const pieces=w.pivot.children.slice();w.rotor=new T.Group();w.pivot.add(w.rotor);w.rotor.add(...pieces);}
 const radius=w.wheel.geometry.parameters.radiusTop||.44;
 w.rotor.rotation.x+=wheelDistance/radius;
 w.pivot.position.y=(w.baseY??.44)-(w.detached?(w.detachDrop||.08):0);const scale=(w.baseScale||1)*(w.detached?.84:1);w.pivot.scale.set(scale,scale,scale);}for(let l of car.mesh.userData.lamps){let phase=(time*2.8+car.phase/(Math.PI*2)+(l.s>0?.5:0))%1,on=!car.disabled&&(phase<.19||(phase>.26&&phase<.38));l.sprite.material.opacity=car.disabled?0:on?.95:.06;l.m.material.emissiveIntensity=car.disabled?0:on?4.5:.15;l.pool.material.opacity=car.disabled?0:on?.48:.025;if(l.core)l.core.material.opacity=car.disabled?0:on?.9:.01;if(l.light){l.light.visible=!car.disabled&&!car.parked&&(!car.episodePursuer||car.primaryLights);l.light.intensity=on?28:.2;}}}
const init=()=>Physics.init();let ready;
export class Run{
 static async create(map,scenario,software=false,diagnostic=false){await (ready??=init());return new Run(map,scenario,software,diagnostic);}
 constructor(map,scenario,software=false,diagnostic=false){this.software=software;this.diagnostic=diagnostic;
  this.pursuit=!!scenario.pursuit;this.policeOne=!!scenario.policeOne;this.root=new T.Group();this.physics=new Physics();this.physics.policeOne=this.policeOne;this.rng=random(scenario.seed);this.visualRng=this.policeOne?random(scenario.seed+917):this.rng;this.cars=[];this.policeOccluders=[];this.props=[];this.debris=[];this.fragmentBatch=this.policeOne&&!software?new FragmentBatch(this.root):null;this.time=0;this.ticks=0;this.policeMetrics=this.policeOne?{impacts:0,fractures:0,maxSpeed:0,maxSlip:0,maxAltitude:0,airTicks:0,firstAirTime:null,exitTime:null,reinforcement:false,trafficReleased:0,trafficCrossed:0,trafficCrossings:[],trafficImpacts:0,arrestTicks:0,recoveries:0,fugitiveImpacts:0,finaleFractures:0,maxStationaryTicks:0,stationaryTicks:0,exitReached:false,finale:'unfinished',events:[]}:null;this.fx=new Effects(this.root,this.visualRng,this.policeOne,software);this.fx.partialUploads=!software;
  this.terrain=new Terrain(map.terrain,false);this.root.add(this.terrain.mesh);
  const geo=this.terrain.geo;this.physics.fixedTrimesh(geo.attributes.position.array,geo.index.array,'ground');
  if(this.policeOne&&!software){const group=new T.Group();group.name='Police#1 · terrain visuel par tuiles';const {nx,nz}=map.terrain;for(const tile of terrainTiles(nx,nz,geo.index.array)){const g=new T.BufferGeometry();for(const [name,a] of Object.entries(geo.attributes))g.setAttribute(name,new T.BufferAttribute(tileAttribute(a,tile.vertices),a.itemSize,a.normalized));g.setIndex(new T.BufferAttribute(tile.indices,1));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,this.terrain.mesh.material);mesh.receiveShadow=true;group.add(mesh);}this.terrain.mesh.visible=false;this.root.add(group);}
  const t=map.terrain;this.physics.surfaceAt=(x,z)=>['asphalt','concrete','grass','dirt','sand','gravel'][t.mat[clamp(Math.round((z/t.d+.5)*t.nz),0,t.nz)*(t.nx+1)+clamp(Math.round((x/t.w+.5)*t.nx),0,t.nx)]];
  for(const obj of map.objects)this.place(obj);
  for(const obj of scenario.vehicles){
   const asset=assets.get(obj.asset),mesh=instance(obj),body=this.physics.car(obj.p[0],obj.p[2],obj.r[1],asset.kind,asset.style);
   body.setTranslation({x:obj.p[0],y:obj.p[1]+.09,z:obj.p[2]},true);body.setRotation(mesh.quaternion,true);
   const forward=new T.Vector3(0,0,1).applyQuaternion(mesh.quaternion);body.setLinvel(forward.multiplyScalar(obj.initial/3.6),true);
   const path=obj.points.map(p=>({...p,v:vec(p.p)}));
   const car={obj,kind:asset.kind,mesh,body,path,index:0,yaw:obj.r[1],speed:obj.initial/3.6,hitStun:0,recoveryCooldown:0,reverse:0,stuck:0,steer:0,slip:0,forward:obj.initial/3.6,phase:this.rng()*6,pace:.97+this.rng()*.06,brain:{rng:this.rng},agile:obj.role==='fugitive'};
   if(scenario.arcade&&obj.points.length>=2){
    bake(mesh.userData.chassis);
    if(this.policeOne){finishPolicePaint(mesh.userData.chassis);decoratePoliceCar(mesh,obj,this.cars.length);}
    for(const w of mesh.userData.wheels)bake(w.pivot);
    car.oldPos=mesh.position.clone();car.oldRot=mesh.quaternion.clone();car.newPos=mesh.position.clone();car.newRot=mesh.quaternion.clone();
    car.arcade=prepareRun(obj,{...scenario.arcade,offset:obj.lane||0});car.agile=true;
    if(this.policeOne){car.parked=!!(obj.policeReinforcement||obj.policeTraffic);let nearest=Infinity;car.arcade.route.forEach((v,i)=>{const d=Math.hypot(v.x-obj.p[0],v.z-obj.p[2]);if(d<nearest){nearest=d;car.arcade.index=i;}});car.attack=1.12;car.apexOffset=.55;if(obj.policeTraffic){car.agile=false;car.attack=.8;}}
   }
   car.shadow=contact(this.root,3.25,5.8);this.physics.bindCar(body,car);this.root.add(mesh);this.cars.push(car);car.thinkOffset=this.cars.length%6;
  }
  this.fugitive=this.cars.find(c=>c.obj.role==='fugitive')||this.cars[0];
  if(this.policeOne&&!this.software)this.beaconOwner=budgetBeacons(this.cars,this.fugitive,null);
  this.physics.surfaceHeightAt=(x,z,y)=>{const hit=this.physics.world.castRay(new R.Ray({x,y,z},{x:0,y:-1,z:0}),10,true,undefined,undefined,undefined,undefined,col=>!['car','prop'].includes(this.physics.tags.get(col.handle)?.tag));return hit?y-hit.timeOfImpact:0;};
 }
 place(obj){
  const mesh=instance(obj);this.root.add(mesh);
  const asset=assets.get(obj.asset);
  if(this.policeOne&&!this.software&&this.diagnostic&&obj.asset==='police-streets'){
   const source=mesh.children.find(m=>m.isMesh&&!m.geometry.index&&m.geometry.attributes.color);
   if(source){const sectors=new T.Group();sectors.name='Police#1 · voirie par secteurs';for(const vertices of streetSectors(source.geometry.attributes.position)){const geo=new T.BufferGeometry();for(const [name,a] of Object.entries(source.geometry.attributes))geo.setAttribute(name,new T.BufferAttribute(tileAttribute(a,vertices),a.itemSize,a.normalized));geo.computeBoundingBox();geo.computeBoundingSphere();const part=new T.Mesh(geo,source.material);part.castShadow=source.castShadow;part.receiveShadow=source.receiveShadow;sectors.add(part);}sectors.visible=false;mesh.add(sectors);this.streetSectors={source,sectors};}
  }
  if(obj.asset==='practice-road'||obj.asset==='police-streets'||obj.asset==='police-district-details'||obj.asset==='police-street-accents'||obj.asset==='police-exit-markings'||obj.asset==='police-exit-scenery'||obj.asset==='police-quarter-markers')return;
  if(this.policeOne&&obj.behavior==='static'&&asset.group==='Buildings')this.policeOccluders.push(new T.Box3().setFromObject(mesh).expandByScalar(.35));
  if(obj.behavior==='static'&&asset.policeBuilding){const bounds=new T.Box3().setFromObject(mesh),c=bounds.getCenter(new T.Vector3()),s=bounds.getSize(new T.Vector3());this.physics.fixedBox(c.x,c.y,c.z,s.x/2,s.y/2,s.z/2,'building');return;}
  if(this.software&&obj.behavior==='static'&&!asset.rideSurface&&asset.group!=='Infrastructure'&&obj.asset!=='oasis')castOnFloor(this.root,mesh,obj.p[1],this.terrain.data);
  if(obj.behavior==='static'&&asset.rideSurface){mesh.updateMatrixWorld(true);mesh.traverse(part=>{if(part.userData.rideSurface){const [v,i]=triangles(part);this.physics.fixedTrimesh(v,i,'ramp');}});return;}
  if(obj.behavior==='static'&&obj.asset==='ramp'){mesh.updateMatrixWorld(true);mesh.traverse(m=>{if(m.userData.rideHull){const points=[],p=m.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++)points.push(...v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray());this.physics.fixedHull(points,'ramp');}});return;}
  if(obj.behavior==='static'){const [v,i]=triangles(mesh);this.physics.fixedTrimesh(v,i,assets.get(obj.asset).group==='Infrastructure'?'bridge':'building');return;}
  const pivot=mesh.position.clone(),q=mesh.quaternion.clone();mesh.position.set(0,0,0);mesh.quaternion.identity();
  const bounds=new T.Box3().setFromObject(mesh),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  mesh.position.copy(pivot);mesh.quaternion.copy(q);
  const desc=obj.behavior==='breakable'&&!this.policeOne?R.RigidBodyDesc.fixed():R.RigidBodyDesc.dynamic();
  const body=this.physics.world.createRigidBody(desc.setTranslation(...pivot.toArray()).setRotation(q));
  size.multiplyScalar(.5);
  let shape=R.ColliderDesc.cuboid(...size.toArray().map(x=>Math.max(.04,x)));
  if(asset.shape==='tire')shape=R.ColliderDesc.cylinder(size.z,Math.max(size.x,size.y)).setRotation({x:Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2});
  if(asset.shape==='drum')shape=R.ColliderDesc.cylinder(size.y,Math.max(size.x,size.z));
  shape.setTranslation(...center.toArray()).setDensity(16).setRestitution(asset.shape==='tire'?.55:.12).setFriction(.58).setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
  if(Number.isFinite(obj.mass)&&obj.mass>0)shape.setMass(obj.mass);
  else if(asset.mass)shape.setMass(asset.mass*obj.s[0]*obj.s[1]*obj.s[2]);
  const collider=this.physics.world.createCollider(shape,body);
  if(obj.behavior!=='breakable'||this.policeOne)body.enableCcd(true);
  this.physics.tags.set(collider.handle,{tag:'prop',collider,body});this.props.push({mesh,body,obj,center,size,collider});
 }
 fracture(prop){
  const {body,mesh,size,center,collider}=prop;mesh.updateMatrixWorld(true);
  const impact=prop.impact,position=mesh.position.clone(),rotation=mesh.quaternion.clone();
  this.physics.tags.delete(collider.handle);this.physics.world.removeRigidBody(body);this.root.remove(mesh);
  const color=new T.Color('#b78c69');mesh.traverse(m=>{if(m.isMesh&&m.material.color&&!m.material.map)color.copy(m.material.color);});
  for(let i=0;i<6;i++){
   const fragment=this.policeOne?fragmentLayout(size,i):{h:{x:size.x/3,y:size.y/2,z:size.z},offset:{x:(i%3-1)*size.x*2/3,y:(i<3?-1:1)*size.y/2,z:0}};
   const h=new T.Vector3().copy(fragment.h).multiplyScalar(.93),p=center.clone().add(new T.Vector3().copy(fragment.offset)).applyQuaternion(rotation).add(position);
   const tint=this.policeOne?fragmentColor(prop.obj.asset,i,color.getHex()):color.getHex(),instance=this.fragmentBatch?.add(p,rotation,h,tint);
   const m=instance?null:box(this.root,h.x*2,h.y*2,h.z*2,...p.toArray(),tint);if(m)m.quaternion.copy(rotation);
   const b=this.physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(...p.toArray()).setRotation(rotation).setCcdEnabled(true));
   const shape=R.ColliderDesc.cuboid(...h.toArray()).setDensity(12);if(this.policeOne&&Number.isFinite(prop.obj.mass))shape.setMass(prop.obj.mass/6);this.physics.world.createCollider(shape,b);
   const v=this.policeOne&&impact.carVelocity?impact.carVelocity:impact.car.body.linvel();b.setLinvel({x:v.x*.38+(this.rng()-.5)*4,y:2+this.rng()*3,z:v.z*.38+(this.rng()-.5)*4},true);
   b.setAngvel({x:this.rng()*3,y:this.rng()*2,z:this.rng()*3},true);this.debris.push({body:b,mesh:m,instance,until:this.time+7});
  }
 }
 control(car,dt){
  const {obj,body,path}=car,p=new T.Vector3().copy(body.translation()),goal=path[car.index];
  if(car.crashMode){const q=body.rotation();car.crashTimer+=dt;if(car.crashTimer>1&&1-2*(q.x*q.x+q.z*q.z)>.8&&Math.abs(body.linvel().y)<1){car.crashMode=null;car.policeRighting=false;}}
  if(this.policeOne&&car.crashMode&&obj.role!=='civil'&&!car.disabled&&car.crashTimer>1.4&&p.y<1.8){const impulse=rightingImpulse(body.rotation(),body.linvel(),body.angvel(),body.mass(),dt);if(impulse){if(!car.policeRighting){car.policeRighting=true;this.policeMetrics.recoveries++;}body.applyTorqueImpulse(impulse,true);}else car.policeRighting=false;}
  if(this.policeOne&&obj.policeTraffic){const cmd=trafficCommand(car,this.fugitive,this.time);drive(car,cmd.target,dt,cmd.speed);return;}
  if(this.policeOne&&car.arcade){
   const path=car.arcade,motion=policeMotion(car,this.fugitive,this.time,routeMotion,this.cars);
   path.index=motion.index;drive(car,motion.target,dt,motion.speed);return;
  }
  if(this.pursuit&&obj.role==='pursuer'){
   const quarry=this.fugitive,q=quarry.body.translation(),v=quarry.body.linvel();
   if(quarry.arcade?.done){drive(car,q,dt,0);return;}
   if((this.ticks+car.thinkOffset)%4===0||!car.pursuitCommand){
    const distance=Math.hypot(q.x-p.x,q.z-p.z),slot=this.cars.indexOf(car)-1;
    let target;
    if(distance>25&&car.arcade){
     const motion=routeMotion(car,car.arcade.route,car.arcade.index,Math.min(obj.speed/3.6,car.speed+10),car.arcade.shift||0);
     car.arcade.index=motion.index;target=motion.target;
    }else{
     const side=(slot%3-1)*Math.min(1.7,distance*.16),lead=distance<9?.12:Math.min(.55,distance/70);
     target={x:q.x+v.x*lead+Math.cos(quarry.yaw)*side,z:q.z+v.z*lead-Math.sin(quarry.yaw)*side};
    }
    const maxSpeed=Math.min(obj.speed/3.6,Math.max(quarry.speed+5,19));
    car.pursuitCommand={target,speed:maxSpeed};
   }
   drive(car,car.pursuitCommand.target,dt,car.pursuitCommand.speed);return;
  }
  if(car.arcade&&obj.role!=='static'){pilotArcade(car,dt,drive,this.cars);return;}
  if(!goal||obj.role==='static'){car.command=null;drive(car,{x:p.x+Math.sin(car.yaw),z:p.z+Math.cos(car.yaw)},dt,0);return;}
  if(car.command&&(this.ticks+car.thinkOffset)%6!==0){drive(car,car.command.target,dt,car.command.speed);return;}
  const cautious=obj.profile==='careful'||obj.role==='civil',aggressive=obj.profile==='aggressive',reach=goal.radius;
  if(p.distanceTo(goal.v)<reach){car.command=null;car.index++;if(goal.type==='finish')car.index=path.length;return;}
  const next=path[car.index+1],previous=path[car.index-1]?.v||vec(obj.p),dir=goal.v.clone().sub(previous),length=dir.length();
  dir.normalize();const along=clamp(p.clone().sub(previous).dot(dir),0,length),ahead=clamp(3+car.speed*.32,3,11),target=previous.clone().addScaledVector(dir,Math.min(length,along+ahead));
  let speed=Math.min(obj.speed,goal.speed)/3.6*car.pace;
  const remaining=goal.v.distanceTo(p);
  if(next){const out=next.v.clone().sub(goal.v).normalize(),bend=Math.acos(clamp(dir.dot(out),-1,1));
   if(remaining<8+car.speed*(cautious?1.8:1.1)){speed=Math.min(speed,Math.max(4,16/(1+bend*1.8))+remaining*.12);target.addScaledVector(out,Math.min(reach*.55,Math.max(0,along+ahead-length)));}
  }else speed=Math.min(speed,Math.sqrt(Math.max(1,remaining)*14));
  const quarry=this.cars.find(c=>c.obj.id===obj.target);
  if(obj.role==='pursuer'&&quarry){const predicted=new T.Vector3().copy(quarry.body.translation()).addScaledVector(quarry.body.linvel(),.35);
   if(predicted.distanceTo(p)<22&&Math.abs(predicted.y-p.y)<3&&predicted.clone().sub(p).dot(dir)>0)target.lerp(predicted,.48);
  }
  const heading=target.clone().sub(p);heading.y=0;heading.normalize();const side=new T.Vector3(heading.z,0,-heading.x),range=cautious?14:aggressive?6:10;
  const ray=new R.Ray({x:p.x,y:p.y+.7,z:p.z},heading),hit=this.physics.world.castRay(ray,range,true,undefined,undefined,undefined,body);
  if(hit&& !['ground','bridge','ramp'].includes(this.physics.tags.get(hit.collider.handle)?.tag)){
   const offset=new R.Ray({x:p.x+side.x*2,y:p.y+.7,z:p.z+side.z*2},heading);
   const right=this.physics.world.castRay(offset,range,true,undefined,undefined,undefined,body);target.addScaledVector(side,right?-2.6:2.6);speed*=aggressive?.87:cautious?.36:.62;
  }
  if(obj.role==='fugitive'){
   const hunter=this.cars.find(other=>other.obj.role==='pursuer'&&other.obj.target===obj.id&&p.distanceTo(other.body.translation())<13);
   if(hunter){const flank=new T.Vector3().copy(hunter.body.translation()).sub(p).dot(side);target.addScaledVector(side,flank>0?-1.25:1.25);}
  }
  car.command={target,speed:speed*(aggressive?1:cautious?.75:.9)};drive(car,target,dt,car.command.speed);
 }
 step(audio){
  const dt=1/120;this.ticks++;const visual=visualTick(this.ticks,this.policeOne);for(const c of this.cars)this.control(c,dt);this.physics.step();this.time+=dt;
  for(const hit of this.physics.impacts){if(this.policeMetrics){const m=this.policeMetrics;m.impacts++;if(hit.car===this.fugitive||hit.other===this.fugitive)m.fugitiveImpacts++;if(hit.car?.obj.policeTraffic||hit.other?.obj.policeTraffic)m.trafficImpacts++;if(m.events.length<120)m.events.push({time:+this.time.toFixed(2),kind:hit.otherTag,speed:+hit.speed.toFixed(1),x:+hit.x.toFixed(1),z:+hit.z.toFixed(1)});}if(hit.speed>9){this.crashSpot={car:hit.other?.mesh?hit.other:hit.car,time:this.time};if(this.policeOne)this.policeImpact=chooseImpact(this.policeImpact,hit,this.fugitive.body.translation(),this.time);}if(!hit.prop&&hit.speed>12)for(const c of [hit.car,hit.other])if(c?.mesh)damageCar(c,Math.min(this.policeOne&&c===this.fugitive?1.1:1.5,hit.speed/40),this.rng);
   const prop=this.props.find(o=>o.body===hit.propBody),breaking=prop?.obj.behavior==='breakable'&&hit.speed>5;if(this.policeOne)audio?.hit(hit.speed,impactMaterial(hit,prop?.obj.asset));else audio?.hit(hit.speed);if(this.policeOne)this.fx.police.impact(hit,breaking);else this.fx.puff(hit.x,hit.y,hit.z,'spark',5);if(breaking)prop.impact=hit;}
  this.physics.impacts.length=0;
  for(let i=this.props.length-1;i>=0;i--){const p=this.props[i];if(p.impact){this.fracture(p);if(this.policeMetrics){this.policeMetrics.fractures++;if(p.obj.asset==='police-exit-panel')this.policeMetrics.finaleFractures++;}this.props.splice(i,1);}else{syncPropVisual(p,this.policeOne,visual);if(visual&&p.obj.asset==='police-beacon-patrol'){for(const l of p.mesh.userData.lamps){const phase=(this.time*3.1+(l.s>0?.5:0)+p.obj.p[0]*.07)%1,on=phase<.19||phase>.27&&phase<.39;l.m.material.emissiveIntensity=on?4:.12;l.sprite.material.opacity=on?.9:.035;l.core.material.opacity=on?.85:.01;}}}}
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i];if(this.time>d.until||this.debris.length>150){this.physics.world.removeRigidBody(d.body);if(d.instance)this.fragmentBatch.remove(d.instance);else this.root.remove(d.mesh);this.debris.splice(i,1);}else if(visual){if(d.instance)syncFragment(this.fragmentBatch,d);else{d.mesh.position.copy(d.body.translation());d.mesh.quaternion.copy(d.body.rotation());}}}this.fragmentBatch?.flush();
  for(const c of this.cars){c.mesh.position.copy(c.body.translation());c.mesh.quaternion.copy(c.body.rotation());if(c.arcade){c.oldPos.copy(c.newPos);c.oldRot.copy(c.newRot);c.newPos.copy(c.mesh.position);c.newRot.copy(c.mesh.quaternion);}if(visualTick(this.ticks,this.policeOne,c.thinkOffset))this.fx.skid(c);
   const p=c.mesh.position,shadowTick=visual||c===this.fugitive,ground=shadowTick?contactGround(c,p,this.physics,c===this.fugitive):0,alt=Math.max(0,p.y-ground);
   if(shadowTick){c.shadow.position.set(p.x,ground+.035,p.z);c.shadow.rotation.set(-Math.PI/2,0,-c.yaw);c.shadow.material.opacity=.94/(1+alt*.58);}
   if(this.policeMetrics&&c===this.fugitive){const m=this.policeMetrics;m.maxSpeed=Math.max(m.maxSpeed,c.speed*3.6);m.maxSlip=Math.max(m.maxSlip,c.slip);m.maxAltitude=Math.max(m.maxAltitude,p.y);if(alt>1.1){m.airTicks++;if(m.firstAirTime===null)m.firstAirTime=this.time;}trafficTelemetry(m,this.cars);const cv=c.body.linvel(),speed=Math.hypot(cv.x,cv.z);m.stationaryTicks=speed<2.3&&!m.exitReached?m.stationaryTicks+1:0;m.maxStationaryTicks=Math.max(m.maxStationaryTicks,m.stationaryTicks);m.arrestTicks=closeArrest(this.cars,p,speed)?m.arrestTicks+1:Math.max(0,m.arrestTicks-1);if(p.x>=160&&Math.abs(p.z-78)<7&&!c.disabled){if(!m.exitReached)m.exitTime=this.time;m.exitReached=true;}m.finale=m.exitReached?'escaped':finaleState(p,cv,c.disabled,m);if(alt>1.1)c.policeAirborne=true;if(c.policeAirborne&&alt<.3&&c.grounded){c.policeAirborne=false;this.fx.police.landing(c,Math.min(1,c.speed/28));audio?.policeMix?.landing(c.speed);}}
   if(this.policeOne&&(c===this.fugitive||c.obj.role==='pursuer')){const nearby=c===this.fugitive||c.mesh.position.distanceToSquared(this.fugitive.mesh.position)<625;if(driftSmokeCount(c,this.ticks,nearby,this.fx.police.free.rubber.length))this.fx.police.tyres(c);}
   const vel=c.body.linvel();if(this.policeOne){const q=c.mesh.quaternion,fx=2*(q.x*q.z+q.w*q.y),fy=2*(q.y*q.z-q.w*q.x),fz=1-2*(q.x*q.x+q.y*q.y);c.wheelSpeed=vel.x*fx+vel.y*fy+vel.z*fz;c.wheelTravel=(c.wheelTravel||0)+c.wheelSpeed*dt;if(visual){syncChassis(c,this.time,c.wheelTravel);c.wheelTravel=0;}}else{const forward=new T.Vector3(0,0,1).applyQuaternion(c.mesh.quaternion);c.wheelSpeed=vel.x*forward.x+vel.y*forward.y+vel.z*forward.z;syncChassis(c,this.time);}
  }if(visual&&this.policeOne&&!this.software)this.beaconOwner=budgetBeacons(this.cars,this.fugitive,this.beaconOwner);this.fx.update(dt);
 }
 interpolate(alpha){this.fx.police?.flush();for(const c of this.cars){if(c.arcade){c.mesh.position.lerpVectors(c.oldPos,c.newPos,alpha);c.mesh.quaternion.slerpQuaternions(c.oldRot,c.newRot,alpha);}}}
 dispose(){this.fragmentBatch?.dispose();this.fx.dispose();this.terrain.dispose();this.physics.dispose();}
}
