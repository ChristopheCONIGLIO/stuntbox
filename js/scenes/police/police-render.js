export function portraitSize(scale=1){
 const unit=Math.max(1,Math.round(120*scale));
 return {width:9*unit,height:16*unit};
}
export function policeRenderScale(active,recording,diagnostic=false){
 return !active||recording?1:diagnostic?.5:2/3;
}
export function frameSample(canvas){
 const copy=document.createElement('canvas');copy.width=32;copy.height=32;
 const ctx=copy.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0,32,32);
 const pixels=ctx.getImageData(0,0,32,32).data;let min=255,max=0,opaque=0;
 for(let i=0;i<pixels.length;i+=4){const light=(pixels[i]+pixels[i+1]+pixels[i+2])/3;min=Math.min(min,light);max=Math.max(max,light);if(pixels[i+3]>0)opaque++;}
 return {contrast:max-min,opaque,nonBlank:opaque>900&&max-min>15};
}

const tiers=[1,5/6,2/3,1/2,.4];
export class PolicePacer {
 constructor(now,recording=false){this.period=1000/60;this.next=now;this.ceiling=recording?0:2;this.level=this.ceiling;this.recording=recording;this.frames=0;this.elapsed=0;this.windowFrames=0;this.windowMs=0;this.good=0;this.fps=60;this.slowStreak=0;this.lastCallback=now;this.refreshMs=1000/60;}
 get scale(){return tiers[this.level];}
 accept(now){const interval=now-this.lastCallback;this.lastCallback=now;if(interval>1&&interval<25)this.refreshMs+=.12*(interval-this.refreshMs);const tolerance=Math.min(this.period*.49,this.refreshMs*.48);if(now+tolerance<this.next)return false;const skipped=Math.max(0,Math.floor((now+tolerance-this.next)/this.period));this.next+=(skipped+1)*this.period;return true;}
 sample(ms){
  if(!Number.isFinite(ms)||ms<=0)return false;
  this.frames++;this.elapsed+=ms;this.windowFrames++;this.windowMs+=ms;
  this.slowStreak=ms>26?this.slowStreak+1:0;
  const emergency=this.slowStreak>=8;
  if(this.windowFrames<24&&!emergency)return false;
  this.slowStreak=0;
  const average=this.windowMs/this.windowFrames;this.fps=1000/average;this.windowFrames=0;this.windowMs=0;
  const before=this.level;
  if(emergency||average>17.85){this.level=Math.min(tiers.length-1,this.level+1);this.good=0;}
  else if(average<17.1&&!this.recording){if(++this.good>=4){this.level=Math.max(this.ceiling,this.level-1);this.good=0;}}
  else this.good=0;
  return before!==this.level;
 }
}

export function policeShadowSize(scale){return scale<=.5?1024:2048;}

export function contactGround(car,p,physics,precise){
 if(!physics.policeOne||precise)return physics.surfaceHeightAt(p.x,p.z,p.y+1.25);
 const last=car.contactGroundCache;
 if(last&&Math.abs(p.x-last.x)<.025&&Math.abs(p.z-last.z)<.025&&Math.abs(p.y-last.y)<.025)return last.ground;
 const ground=physics.surfaceHeightAt(p.x,p.z,p.y+1.25);
 car.contactGroundCache={x:p.x,y:p.y,z:p.z,ground};
 return ground;
}

export function terrainTiles(nx,nz,sourceIndex,side=16){
 const stride=nx+1,tiles=[];
 for(let z=0;z<nz;z+=side)for(let x=0;x<nx;x+=side){
  const w=Math.min(side,nx-x),h=Math.min(side,nz-z),width=w+1,vertices=new Uint32Array(width*(h+1)),indices=new Uint16Array(w*h*6);
  for(let j=0;j<=h;j++)for(let i=0;i<=w;i++)vertices[j*width+i]=(z+j)*stride+x+i;
  let k=0;for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const offset=((z+j)*nx+x+i)*6;
   for(let m=0;m<6;m++){const v=sourceIndex[offset+m],vx=v%stride-x,vz=Math.floor(v/stride)-z;indices[k++]=vz*width+vx;}
  }
  tiles.push({x,z,w,h,vertices,indices});
 }
 return tiles;
}
export function tileAttribute(attribute,vertices){
 const size=attribute.itemSize,data=new attribute.array.constructor(vertices.length*size);
 for(let i=0;i<vertices.length;i++)for(let k=0;k<size;k++)data[i*size+k]=attribute.array[vertices[i]*size+k];
 return data;
}

export function shadowRefresh(frame,recording,scale,force=false,pressure=false){
 return force||(recording&&scale>.5&&!pressure)||frame%2===0;
}

export function applyPoliceQuality(view,scale,shadowSize=policeShadowSize(scale)){
 view.filmScale=scale;view.previewScale=scale;view.setShadowSize(shadowSize);view.resize();
}

export function streetSectors(position,side=64){
 const sectors=new Map();
 for(let i=0;i<position.count;i+=3){const a=i*3,b=a+3,c=a+6,p=position.array,x=Math.floor((p[a]+p[b]+p[c])/(3*side)),z=Math.floor((p[a+2]+p[b+2]+p[c+2])/(3*side)),key=x+','+z;
  if(!sectors.has(key))sectors.set(key,[]);sectors.get(key).push(i,i+1,i+2);
 }
 return [...sectors.values()].map(v=>Uint32Array.from(v));
}

export function beaconOwner(cars,fugitive,previous){
 const eligible=c=>!c.parked&&!c.disabled&&c.obj.role==='pursuer'&&c.mesh.userData.lamps?.some(l=>l.light);
 const distance=c=>c.mesh.position.distanceToSquared(fugitive.mesh.position);
 let best=null,d=Infinity;
 for(const c of cars)if(eligible(c)){const n=distance(c);if(n<d){best=c;d=n;}}
 if(previous&&eligible(previous)&&distance(previous)<=d*1.44)return previous;
 return best;
}
export function budgetBeacons(cars,fugitive,previous){
 const owner=beaconOwner(cars,fugitive,previous),fallback=owner||cars.find(c=>c.obj.role==='pursuer'&&c.mesh.userData.lamps?.some(l=>l.light));
 for(const c of cars)for(const l of c.mesh.userData.lamps||[])if(l.light){l.light.visible=c===fallback;if(c===fallback&&!owner)l.light.intensity=0;}
 return owner;
}

export function syncPropVisual(prop,police,visual){
 if(police){if(prop.obj.behavior!=='breakable'&&!visual)return false;const sleeping=prop.body.isSleeping();if(sleeping&&prop.visualSleeping)return false;prop.visualSleeping=sleeping;}
 prop.mesh.position.copy(prop.body.translation());prop.mesh.quaternion.copy(prop.body.rotation());return true;
}
export function trafficTelemetry(m,cars){
 let released=0,crossed=0,reinforcement=false;
 for(const c of cars){if(c.policeMerged)reinforcement=true;if(c.trafficReleased)released++;if(c.trafficCrossed)crossed++;}
 m.reinforcement=reinforcement;m.trafficReleased=released;
 if(crossed!==m.trafficCrossed){m.trafficCrossed=crossed;m.trafficCrossings=cars.filter(v=>v.trafficCrossed).map(v=>({id:v.obj.id,time:+v.trafficCrossAt.toFixed(2),separation:+v.trafficSeparation.toFixed(2)}));}
}
export function closeArrest(cars,p,speed){
 if(speed>=2.3)return false;
 for(const c of cars)if(c.obj.role==='pursuer'&&!c.disabled){const q=c.body.translation();if(Math.hypot(q.x-p.x,q.z-p.z)<7)return true;}
 return false;
}

export function advancePoliceFrame(run,acc,audio,recording,endTick,clock=()=>performance.now()){
 const start=clock(),step=1/120;let count=0;
 while(acc>=step&&run.ticks<endTick){
  if(!recording&&count>=2&&(count>=4||clock()-start>=8))break;
  run.step(audio);acc-=step;count++;
 }
 if(run.ticks>=endTick)acc=0;
 return {acc,count,alpha:run.ticks>=endTick?1:Math.min(1,acc*120)};
}

export async function warmPoliceRender(view,batches,clock=()=>performance.now()){
 const renderer=view.renderer;if(renderer.isSoftware)return null;
 const start=clock(),hidden=(batches||[]).map(b=>b.mesh).filter(m=>!m.visible);
 try{
  for(const mesh of hidden)mesh.visible=true;
  if(typeof renderer.compileAsync==='function')await renderer.compileAsync(view.scene,view.camera);
  else if(typeof renderer.compile==='function')renderer.compile(view.scene,view.camera);
 }finally{for(const mesh of hidden)mesh.visible=false;}
 view.draw();renderer.getContext().finish();
 return {ms:clock()-start,preparedBatches:hidden.length};
}

export class PoliceFrameAudit{
 constructor(recording){this.recording=recording;this.frames=0;this.intervals=[];this.physics=[];this.render=[];this.copy=[];this.full=0;this.shadows=0;this.maxDebt=0;this.first=null;this.last=null;}
 add(now,physicsMs,renderMs,copyMs,scale,shadow,debt){
  if(this.last!==null&&now>this.last)this.intervals.push(now-this.last);
  this.first??=now;this.last=now;this.frames++;
  this.physics.push(physicsMs);this.render.push(renderMs);this.copy.push(copyMs);
  if(scale>=1)this.full++;if(shadow)this.shadows++;this.maxDebt=Math.max(this.maxDebt,debt);
 }
 report(ticks){
  const round=n=>Math.round(n*100)/100,stats=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?{mean:round(s.reduce((x,y)=>x+y,0)/s.length),p95:round(s[Math.ceil(s.length*.95)-1]),max:round(s.at(-1))}:null;};
  const elapsed=this.last-this.first,interval=stats(this.intervals);
  return {recording:this.recording,renderedFrames:this.frames,simulatedSeconds:ticks/120,wallSeconds:round(elapsed/1000),renderedFps:elapsed>0?round(this.intervals.length*1000/elapsed):null,frameIntervalMs:interval,over25ms:this.intervals.filter(n=>n>25).length,fullScalePct:this.frames?round(100*this.full/this.frames):null,shadowPasses:this.shadows,maxPhysicsDebtMs:round(this.maxDebt*1000),physicsCpuMs:stats(this.physics),renderSubmitCpuMs:stats(this.render),captureCopyCpuMs:stats(this.copy)};
 }
}
