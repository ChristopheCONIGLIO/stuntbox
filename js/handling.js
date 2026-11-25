(()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function balance(collider){
  const h=collider.shape.halfExtents,m=collider.mass();
  if(!h||!m)return;
  collider.setMassProperties(m,{x:0,y:0,z:h.z*.055},{
   x:m*(h.y*h.y+h.z*h.z)/3,
   y:m*(h.x*h.x+h.z*h.z)/3,
   z:m*(h.x*h.x+h.y*h.y)/3
  },{x:0,y:0,z:0,w:1});
 }
 function attach(physics){
  if(!physics||physics.rearBalance)return;
  physics.rearBalance=true;
  const step=physics.step.bind(physics);
  physics.step=function(){
   const dt=this.world.timestep;
   for(const tag of this.vehicles){
    if(!tag.rearBalanced){balance(tag.collider);tag.rearBalanced=true;}
    const car=tag.owner,b=tag.body;
    if(!car||!car.grounded||car.disabled||car.parked||car.crashMode)continue;
    const q=b.rotation();if(1-2*(q.x*q.x+q.z*q.z)<.7)continue;
    const v=b.linvel(),yaw=car.yaw,s=Math.sin(yaw),c=Math.cos(yaw);
    const speed=Math.hypot(v.x,v.z),weight=clamp((speed-5)/10,0,1);
    const side=v.x*c-v.z*s,lever=1.45,rearSlip=side-b.angvel().y*lever;
    const force=clamp(rearSlip*.95,-5.5,5.5)*weight*b.mass()*dt;
    const p=b.translation();
    b.applyImpulseAtPoint({x:c*force,y:0,z:-s*force},{x:p.x-s*lever,y:p.y,z:p.z-c*lever},true);
   }
   return step();
  };
 }
 globalThis.apexHandling={attach,balance};
})();
