import RAPIER from '../../vendor/rapier.js';
import {angle,clamp} from '../core/util.js';
import {impactPair,propImpulse} from '../scenes/police/police-impact.js';
export {RAPIER};
export class Physics{
static async init(){await RAPIER.init();}
constructor(){this.world=new RAPIER.World({x:0,y:-22,z:0});this.world.timestep=1/120;this.events=new RAPIER.EventQueue(true);this.tags=new Map();this.impacts=[];this.vehicles=[];this.contacts=new Map();this.time=0;globalThis.apexHandling?.attach(this);this.world.numSolverIterations=8;this.world.integrationParameters.maxCcdSubsteps=4;}
fixedBox(x,y,z,hx,hy,hz,tag='solid',rotation){let d=RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setFriction(.4);if(rotation)d.setRotation(rotation);let c=this.world.createCollider(d);this.tags.set(c.handle,{tag,collider:c});return c;}
car(x,z,yaw,kind,style=''){let body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,.7,z).setRotation({x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}).setLinearDamping(.04).setAngularDamping(1.3).setCcdEnabled(true));body.setEnabledRotations(true,true,true,true);let c=this.world.createCollider(RAPIER.ColliderDesc.cuboid(kind==='swat'?1.12:kind==='truck'?1.16:style==='muscle'?1.1:.98,kind==='truck'?.71:kind==='swat'?.7:.43,kind==='swat'?2.5:kind==='truck'?3.2:style==='muscle'?2.34:2.2).setTranslation(0,kind==='truck'?.73:kind==='swat'?.72:.45,0).setDensity(kind==='swat'?210:kind==='truck'?240:125).setFriction(.18).setRestitution(.27).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body),tag={tag:'car',body,kind,collider:c,owner:null,velocity:{x:0,z:0}};this.tags.set(c.handle,tag);this.vehicles.push(tag);
const roof=this.world.createCollider(RAPIER.ColliderDesc.cuboid(kind==='truck'?.95:.78,kind==='truck'?.40:kind==='swat'?.35:style==='muscle'?.33:.30,kind==='truck'?1.5:kind==='swat'?1.45:style==='muscle'?.9:.8).setTranslation(0,kind==='truck'?1.91:kind==='swat'?1.80:style==='muscle'?1.40:1.35,kind==='swat'?-.7:style==='muscle'?-.3:0).setDensity(8).setFriction(.35).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);
this.tags.set(roof.handle,{tag:'car',body,kind,collider:roof,get owner(){return tag.owner;},get velocity(){return tag.velocity;}});return body;}
bindCar(body,car){car.physics=this;this.vehicles.find(v=>v.body===body).owner=car;}
prop(x,z,kind,groundY=0){let body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,({bin:.74,pole:1.18,cone:.48,barrier:.56,shard:.24,bench:.57,streetlight:2.73,table:.79,chair:.48}[kind]||.74)+groundY,z).setLinearDamping(.11).setAngularDamping(.38).setCcdEnabled(true));let shapes={bin:[.48,.63,.48],pole:[.16,1.1,.16],cone:[.38,.40,.38],barrier:[.85,.48,.31],shard:[.31,.18,.17],bench:[1.35,.45,.42],streetlight:[.19,2.65,.19],table:[.67,.67,.67],chair:[.38,.38,.38]},h=shapes[kind]||shapes.bin;let col=this.world.createCollider(RAPIER.ColliderDesc.cuboid(...h).setDensity(kind==='streetlight'?2.2:kind==='bench'?4.2:kind==='shard'?1.4:5).setFriction(.45).setRestitution(.38).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);this.tags.set(col.handle,{tag:'prop',body,kind,collider:col});return body;}
step(){this.time+=this.world.timestep;for(let v of this.vehicles)v.velocity=v.body.linvel();this.world.step(this.events);const handle=(a,b,start)=>{if(!start)return;let aa=this.tags.get(a),bb=this.tags.get(b);if(aa?.tag!=='car'&&bb?.tag!=='car')return;let car=aa?.tag==='car'?aa:bb,other=car===aa?bb:aa;if(!other||['ground','ramp','bridge','waterbed'].includes(other.tag))return;let key=this.policeOne?impactPair(a,b,aa,bb):a<b?`${a}:${b}`:`${b}:${a}`;if(this.time-(this.contacts.get(key)??-100)<.25)return;this.contacts.set(key,this.time);let ov=other.tag==='car'?other.velocity:other.body?.linvel()||{x:0,z:0},cv=car.velocity,speed=Math.hypot(cv.x-ov.x,cv.z-ov.z);if(speed<2.5)return;if(other.tag==='prop'&&speed>4){const v=car.velocity,dir=Math.hypot(v.x,v.z)||1,m=other.body.mass(),scale=Math.min(32,Math.max(7,speed*.85)),tune=this.policeOne?propImpulse(speed,car.body.mass(),m):{horizontal:scale,vertical:Math.min(10,1.8+speed*.2),spin:scale};other.body.applyImpulse({x:v.x/dir*m*tune.horizontal,y:m*tune.vertical,z:v.z/dir*m*tune.horizontal},true);other.body.applyTorqueImpulse({x:m*tune.spin*.48,y:m*tune.spin*.32,z:m*tune.spin*.62},true);}let p=car.body.translation(),point={x:p.x,y:p.y+.65,z:p.z};this.world.contactPair(car.collider,other.collider,m=>{if(m.numSolverContacts())point=m.solverContactPoint(0);});for(let tag of [car,other]){if(tag.tag!=='car'||!tag.owner)continue;if(other.tag!=='prop')tag.owner.hitStun=Math.max(tag.owner.hitStun,clamp(.15+speed*.014,.18,.65));if(other.tag==='car'||other.tag==='building'){let q=tag.body.translation(),dx=q.x-point.x,dz=q.z-point.z,len=Math.hypot(dx,dz)||1,kick=Math.min(2.5,speed*.12)*tag.body.mass();tag.body.applyImpulseAtPoint({x:dx/len*kick,y:0,z:dz/len*kick},point,true);}}
if(speed>19&&(other.tag==='car'||other.tag==='building')){
 for(const tag of [car,other]){
  if(tag.tag!=='car'||!tag.owner||tag.owner.crashMode||speed<(tag.owner.agile?36:19))continue;
  const owner=tag.owner,body=tag.body,vel=body.linvel(),p=body.translation(),q=body.rotation();
  const up=1-2*(q.x*q.x+q.z*q.z),otherPos=(tag===car?other:car).body?.translation()||point;
  const direction=Math.sign((otherPos.x-p.x)*Math.cos(owner.yaw)-(otherPos.z-p.z)*Math.sin(owner.yaw))||1;
  const intensity=Math.min(1.7,(speed-15)/15)*(owner.agile?.62:1);
  body.setEnabledRotations(true,true,true,true);
  body.applyImpulse({x:0,y:body.mass()*(2.6+intensity*3.8),z:0},true);
  body.applyTorqueImpulse({x:body.mass()*intensity*11*direction,y:body.mass()*intensity*2.5,z:body.mass()*intensity*5*direction},true);
  owner.crashMode='airborne';owner.crashTimer=0;
 }
}
this.impacts.push({carVelocity:{x:cv.x,y:cv.y||0,z:cv.z},x:point.x,y:point.y,z:point.z,speed,prop:other.tag==='prop',propBody:other.tag==='prop'?other.body:null,building:other.tag==='building',otherTag:other.tag,car:car.owner,other:other.owner});};if(this.policeOne){const pending=[];this.events.drainCollisionEvents((a,b,start)=>{if(start)pending.push([Math.min(a,b),Math.max(a,b),start]);});pending.sort((x,y)=>x[0]-y[0]||x[1]-y[1]);for(const e of pending)handle(...e);}else this.events.drainCollisionEvents(handle);}
fixedHull(vertices,tag='bridge'){const desc=RAPIER.ColliderDesc.convexHull(new Float32Array(vertices));if(!desc)throw new Error('Invalid bridge hull');const collider=this.world.createCollider(desc.setFriction(.92));this.tags.set(collider.handle,{tag,collider});return collider;}
fixedTrimesh(vertices,indices,tag='bridge'){const collider=this.world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices),RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(.35).setRestitution(0));this.tags.set(collider.handle,{tag,collider});return collider;}
dispose(){this.events.free();this.world.free();}
}
function chassisForce(car,dt,accel,steer,drift,control=1,state=null){
 const b=car.body,v=state?.v??b.linvel(),q=state?.q??b.rotation(),yaw=car.yaw,speed=state?.speed??Math.hypot(v.x,v.z),side=state?.side??(v.x*Math.cos(yaw)-v.z*Math.sin(yaw)),p=state?.p;
 const hit=car.physics.world.castRay(new RAPIER.Ray({x:p?p.x:b.translation().x,y:(p?p.y:b.translation().y)+.15,z:p?p.z:b.translation().z},{x:0,y:-1,z:0}),.8,true,undefined,undefined,undefined,b);
 const grounded=!!hit;car.grounded=grounded;
 const mass=state&&grounded&&!car.crashMode?b.mass():null;
 if(grounded&&!car.crashMode){const upx=2*(q.x*q.y-q.w*q.z),upz=2*(q.y*q.z+q.w*q.x),av=b.angvel();b.applyTorqueImpulse({x:(-upz*20-av.x*5)*(mass??b.mass())*dt,y:0,z:(upx*20-av.z*5)*(mass??b.mass())*dt},true);}
 if(!grounded||car.crashMode)return;
 const forward=state?.forward??(v.x*Math.sin(yaw)+v.z*Math.cos(yaw)),wantedYaw=steer*clamp(.9+speed*.105,.9,4.4)*(forward< -1?-1:1),av=b.angvel();
 b.applyTorqueImpulse({x:0,y:(wantedYaw-av.y)*(mass??b.mass())*16*dt*control,z:0},true);
 const surface=car.physics.surfaceAt?.(p?p.x:b.translation().x,p?p.z:b.translation().z)||'asphalt';car.surface=surface;const factor=surface==='sand'?(car.agile?.83:.68):surface==='grass'?.88:1;accel*=surface==='sand'?.87:1;const arcadeGrip=car.physics.policeOne?9.4-3.1*(car.cornerLoad||0)-(car.policeDrift||0)*.8-2.65*(car.policeSlide||0):8.0-4.65*(car.cornerLoad||0)-(car.policeDrift||0)*1.1;const grip=(car.hitStun>0?(car.physics.policeOne?4.1:1.3):car.arcade?arcadeGrip:drift?3.3:6.4)*factor,lateral=-side*grip;
 b.applyImpulse({x:(Math.sin(yaw)*accel+Math.cos(yaw)*lateral)*(mass??b.mass())*dt,y:0,z:(Math.cos(yaw)*accel-Math.sin(yaw)*lateral)*(mass??b.mass())*dt},true);
}
export function drive(car,target,dt,maxSpeed){if(car.disabled||car.parked)return;let b=car.body,p=b.translation(),v=b.linvel(),q=b.rotation(),yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z));car.yaw=yaw;let err=angle(Math.atan2(target.x-p.x,target.z-p.z)-yaw),speed=Math.hypot(v.x,v.z),forward=v.x*Math.sin(yaw)+v.z*Math.cos(yaw),side=v.x*Math.cos(yaw)-v.z*Math.sin(yaw);car.hitStun=Math.max(0,car.hitStun-dt);car.recoveryCooldown=Math.max(0,car.recoveryCooldown-dt);let desired=maxSpeed*(1-(car.agile?.08:.27)*Math.min(1,Math.abs(err)/1.5));if(Math.abs(err)>2.2)desired=Math.min(desired,car.agile?14:7);
car.stuck=speed<2.2&&maxSpeed>5?car.stuck+dt:Math.max(0,car.stuck-dt*2);if(car.stuck>(car.physics.policeOne?.55:1.15)&&car.reverse<=0&&car.recoveryCooldown<=0){car.reverse=car.physics.policeOne?.95:.6+(car.brain?.rng()||.5)*.3;car.stuck=0;car.recoveryCooldown=car.physics.policeOne?1.35:2;}
let reverse=car.reverse>0;if(reverse){car.reverse-=dt;desired=-9;}
let steer=clamp(err*(car.arcade?2.22:1.7)*(car.physics.policeOne&&reverse?-1:1),-1,1),stun=car.hitStun>0,control=stun?(car.physics.policeOne?.48:.16):1;
const regain=stun&&!reverse&&desired>forward?centralRecovery(car,p,err,forward,side):0;
let drift=(car.driftIntent||Math.abs(err)>.48)&&speed>12&&!reverse,accel=clamp((desired-forward)*(car.arcade?3.7:3.1),-36,car.arcade?44:38)*(stun?.32+.36*regain:1);
chassisForce(car,dt,accel,steer,drift,control,car.physics.policeOne?{p,v,q,speed,side,forward}:null);
car.inputs={steering:steer,throttle:reverse?0:clamp(accel/38,0,1),brake:reverse?0:clamp(-accel/36,0,1),reverse,handbrake:drift};car.steer=steer;car.speed=speed;car.slip=Math.abs(side);car.forward=forward;car.drifting=drift;}


export function centralRecovery(car,p,error,forward,side){
 if(!car.physics.policeOne||car.obj.role!=='fugitive'||!car.grounded||car.crashMode||forward<3||Math.abs(p.z)>=3||p.x<=0||p.x>=26||Math.abs(error)>=.4||Math.abs(side)>=3)return 0;
 const zone=clamp(p.x/5,0,1)*clamp((26-p.x)/5,0,1);
 return zone*clamp((.4-Math.abs(error))/.2,0,1)*clamp((3-Math.abs(side))/1.5,0,1);
}
