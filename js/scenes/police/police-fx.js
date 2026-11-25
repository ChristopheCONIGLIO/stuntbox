import {THREE as T,clamp} from '../../core/util.js';
const profiles={
 dust:{color:'#cdbba2',opacity:.23,life:.85,size:1.25,growth:2.1,gravity:-.4},
 rubber:{color:'#e9e8e4',opacity:.36,life:.68,size:.85,growth:2.05,gravity:-.2},
 spark:{color:'#ffcf79',opacity:.95,life:.26,size:.18,growth:0,gravity:22}
};
export function impactBudget(speed,breakable=false){
 const strength=clamp((speed-3)/25,0,1);
 return {dust:breakable?Math.round(8+strength*12):Math.round(2+strength*5),spark:Math.round(3+strength*8),strength};
}
export function packParticles(live,type,offsets,sizes,opacity){
 let n=0;
 for(const a of live){if(a.type!==type)continue;const s=a.s;offsets[n*3]=s.position.x;offsets[n*3+1]=s.position.y;offsets[n*3+2]=s.position.z;sizes[n]=s.scale.x;opacity[n]=s.material.opacity;n++;}
 return n;
}
class ParticleBatch{
 constructor(root,type,p,texture,n){
  this.type=type;const g=new T.InstancedBufferGeometry(),quad=new T.PlaneGeometry(1,1);
  g.setAttribute('position',quad.attributes.position);g.setAttribute('uv',quad.attributes.uv);g.setIndex(quad.index);
  this.offsets=new Float32Array(n*3);this.sizes=new Float32Array(n);this.opacity=new Float32Array(n);
  for(const [name,array,size] of [['center',this.offsets,3],['particleSize',this.sizes,1],['particleAlpha',this.opacity,1]])g.setAttribute(name,new T.InstancedBufferAttribute(array,size).setUsage(T.DynamicDrawUsage));
  g.instanceCount=0;
  const mat=new T.ShaderMaterial({uniforms:{spriteMap:{value:texture},tint:{value:new T.Color(p.color)}},transparent:true,depthWrite:false,blending:type==='spark'?T.AdditiveBlending:T.NormalBlending,
   vertexShader:`attribute vec3 center;attribute float particleSize;attribute float particleAlpha;varying vec2 vUv;varying float vAlpha;
    void main(){vUv=uv;vAlpha=particleAlpha;vec4 mv=modelViewMatrix*vec4(center,1.0);mv.xy+=position.xy*particleSize;gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform sampler2D spriteMap;uniform vec3 tint;varying vec2 vUv;varying float vAlpha;
    void main(){vec4 tex=texture2D(spriteMap,vUv);gl_FragColor=vec4(tint*tex.rgb,tex.a*vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  this.mesh=new T.Mesh(g,mat);this.mesh.name='Police#1 · particules '+type;this.mesh.frustumCulled=false;this.mesh.visible=false;this.mesh.renderOrder=3+(type==='spark'?1:0);root.add(this.mesh);
 }
 update(live){const n=packParticles(live,this.type,this.offsets,this.sizes,this.opacity),g=this.mesh.geometry;g.instanceCount=n;this.mesh.visible=n>0;if(n)for(const key of ['center','particleSize','particleAlpha'])g.attributes[key].needsUpdate=true;}
 dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.removeFromParent();}
}
export class PoliceFX{
 constructor(root,rng,texture,software=false){
  this.rng=rng;this.root=new T.Group();root.add(this.root);
  this.free={};this.live=[];this.count=0;this.max=128;this.batches=software?null:[];this.batchDirty=false;this.batchFlushes=0;
  for(const [type,p] of Object.entries(profiles)){
   const pool=[];this.free[type]=pool;
   const n=type==='dust'?48:type==='rubber'?48:32;
   if(this.batches)this.batches.push(new ParticleBatch(this.root,type,p,texture,n));
   for(let i=0;i<n;i++){
    if(this.batches){pool.push({position:new T.Vector3(),scale:new T.Vector3(),material:{opacity:0},visible:false});continue;}
    const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,color:p.color,transparent:true,opacity:0,depthWrite:false,blending:type==='spark'?T.AdditiveBlending:T.NormalBlending}));
    sprite.visible=false;this.root.add(sprite);pool.push(sprite);
   }
  }
 }
 emit(type,x,y,z,vx,vz,count,strength=1){
  const p=profiles[type],rand=this.rng;
  for(let i=0;i<count&&this.live.length<this.max;i++){
   const s=this.free[type].pop();if(!s)break;
   const a=rand()*Math.PI*2,spread=(type==='spark'?8:2.3)*(0.5+strength),life=p.life*(.8+rand()*.4);
   const size=p.size*(.75+rand()*.5);
   s.position.set(x+(rand()-.5)*.65,y+.08+rand()*.22,z+(rand()-.5)*.65);
   s.scale.set(size,size,1);s.material.opacity=p.opacity;s.visible=true;
   this.live.push({s,type,p,life,max:life,size,vx:vx+Math.cos(a)*spread,vz:vz+Math.sin(a)*spread,vy:type==='spark'?2+rand()*5:.35+rand()*.7});this.count++;this.batchDirty=true;
  }
 }
 impact(hit,breakable){
  const b=impactBudget(hit.speed,breakable),v=hit.carVelocity||{x:0,z:0};
  this.emit('spark',hit.x,hit.y,hit.z,v.x*.12,v.z*.12,b.spark,b.strength);
  if(hit.speed>6||breakable)this.emit('dust',hit.x,Math.max(.2,hit.y*.65),hit.z,v.x*.09,v.z*.09,b.dust,b.strength);
 }
 tyres(car){
  const p=car.body.translation(),v=car.body.linvel(),yaw=car.yaw;
  const sn=Math.sin(yaw),cs=Math.cos(yaw);
  for(const side of [-1,1])this.emit('rubber',p.x-sn*1.65+cs*.83*side,Math.max(.17,p.y+.12),p.z-cs*1.65-sn*.83*side,v.x*.13,v.z*.13,1,clamp(car.slip/8,.25,1));
 }
 landing(car,strength){
  const p=car.body.translation(),v=car.body.linvel();
  this.emit('dust',p.x,.2+p.y,p.z,v.x*.08,v.z*.08,Math.round(8+strength*10),strength);
 }
 update(dt){
  if(!this.live.length)return;
  this.batchDirty=true;const dragSpark=Math.exp(-dt*.7),dragCloud=Math.exp(-dt*2.4);
  for(let i=this.live.length-1;i>=0;i--){
   const a=this.live[i];a.life-=dt;if(a.life<=0){a.s.visible=false;this.free[a.type].push(a.s);this.live.splice(i,1);continue;}
   a.vy-=a.p.gravity*dt;const damping=a.type==='spark'?dragSpark:dragCloud;a.vx*=damping;a.vz*=damping;
   a.s.position.x+=a.vx*dt;a.s.position.y=Math.max(.1,a.s.position.y+a.vy*dt);a.s.position.z+=a.vz*dt;
   const age=1-a.life/a.max,size=a.size+a.p.growth*age;a.s.scale.set(size,size,1);
   a.s.material.opacity=a.p.opacity*Math.min(1,age*12+.2)*(1-age)**1.4;
  }
 }
 flush(){if(!this.batches||!this.batchDirty)return;for(const batch of this.batches)batch.update(this.live);this.batchDirty=false;this.batchFlushes++;}
 dispose(){if(this.batches){for(const batch of this.batches)batch.dispose();}else{for(const a of this.live)a.s.material.dispose();for(const pool of Object.values(this.free))for(const s of pool)s.material.dispose();}this.root.removeFromParent();this.live=[];}
}

export function driftSmokeCount(car,tick,nearby,available){
 if(!car.grounded||car.disabled||car.parked||car.speed<=10||car.slip<=2.1||available<2)return 0;
 const fug=car.obj.role==='fugitive';
 if(!fug&&(car.obj.role!=='pursuer'||!nearby||car.slip<3.2||available<16))return 0;
 const cadence=fug?8:16;
 if((tick+(fug?0:(car.thinkOffset||0)))%cadence!==0)return 0;
 return 1;
}
