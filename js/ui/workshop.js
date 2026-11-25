import {policeDuration} from '../scenes/police/police-one.js';
import {policeRenderScale,PolicePacer,policeShadowSize,shadowRefresh,applyPoliceQuality,advancePoliceFrame,warmPoliceRender,PoliceFrameAudit} from '../scenes/police/police-render.js';
import {finaleCamera} from '../scenes/police/police-finale.js';
import {frameChase,chaseHeading,stuntShot,escapeReveal,actionCamera,impactShot,escapeShot,openingShot,blockadeShot,escapeDriftShot,industrialShot,marketCrossingShot,escapePeerFraming,openingComposition} from '../scenes/police/police-camera.js';
import {unobstructedHeight} from '../scenes/police/police-look.js';
import {THREE as T,clamp} from '../core/util.js';
import {View,release} from '../rendering/view.js';
import {Run} from '../core/runtime.js';
import {tracks,startingGrid,pursuitGrid} from '../core/practice.js';
import {CircuitEditor} from '../editor/editor3d.js';
import {layoutFor,buildMap} from '../core/layout.js';
import {parseCircuit,circuitDocument} from '../editor/circuit-file.js';
import {assets} from '../core/registry.js';
import {rallyOutcome} from '../core/rally.js';
import {Audio} from '../audio/audio.js';
import {Recorder} from '../capture/recorder.js';
import {Helicopter} from '../rendering/helicopter.js';

const $=id=>document.getElementById(id),canvas=$('game'),view=new View(canvas),editor=new CircuitEditor(view);
const audio=new Audio(),heli=new Helicopter(),drafts=new Map();
const diagnostic=false;
let beforePoliceView=null,policePacer=null,shadowFrame=0,policeAudit=null;
function policeLook(active){
 view.filmScale=policeRenderScale(active,false,diagnostic);
 if(active&&!beforePoliceView){beforePoliceView={fog:view.scene.fog,light:view.light.color.clone(),intensity:view.light.intensity,exposure:view.renderer.toneMappingExposure};view.light.color.set('#fff0d5');view.light.intensity=3.35;if(!view.renderer.isSoftware)view.renderer.toneMappingExposure=1.12;}
 else if(!active&&beforePoliceView){view.scene.fog=beforePoliceView.fog;view.light.color.copy(beforePoliceView.light);view.light.intensity=beforePoliceView.intensity;if(!view.renderer.isSoftware)view.renderer.toneMappingExposure=beforePoliceView.exposure;beforePoliceView=null;}
}
const filmCanvas=document.createElement('canvas'),filmContext=filmCanvas.getContext('2d');
let track,layout,title='',run,locked=false,finished=false,previous=0,acc=0,recorder,follow,selectedAt=0,lastHud=0;
const say=v=>$('status').textContent=v;
for(const t of tracks)$('tracks').append(new Option(t.name+' · '+(t.closed?'Circuit':'Point-to-point'),t.id));
let roster=[],rallyIndex=0,rallyReason=null,rallyHold=0;
let pursuitCars=['patrol','patrol','swat'],captureHold=0,pursuitResult='';
const isRally=()=>$('raceMode').value==='rally';
const isPursuit=()=>$('raceMode').value==='pursuit';
function pursuitSlots(values){
 if(values)pursuitCars=[...values];
 const count=+$('pursuitCount').value;
 pursuitCars=Array.from({length:count},(_,i)=>pursuitCars[i]||(i%3===2?'swat':'patrol'));
 $('pursuitVehicleSlots').replaceChildren();
 pursuitCars.forEach((id,i)=>{
  const label=document.createElement('label'),select=document.createElement('select');label.textContent=(i+1)+'. ';
  for(const asset of assets.values())if(asset.behavior==='vehicle')select.add(new Option(asset.name,asset.id));
  select.value=id;select.disabled=!!run;select.setAttribute('aria-label','Pursuer '+(i+1));
  select.onchange=()=>{pursuitCars[i]=select.value;if(editor.root&&!run)editor.rebuild();};label.append(select);$('pursuitVehicleSlots').append(label);
 });
}
function pursuitSettings(){
 $('raceRoster').hidden=isPursuit();$('pursuitSettings').hidden=!isPursuit();
 $('lapLabel').hidden=!track?.closed;
}
for(const asset of assets.values())if(asset.behavior==='vehicle')$('fugitiveCar').add(new Option(asset.name,asset.id));
$('fugitiveCar').value='muscle';
$('pursuitCount').onchange=()=>{pursuitSlots();if(editor.root&&!run)editor.rebuild();};
$('fugitiveCar').onchange=()=>{if(editor.root&&!run)editor.rebuild();};
$('raceMode').onchange=()=>{pursuitSettings();if(editor.root&&!run)editor.rebuild();};
function vehicleSlots(values){
 if(values)roster=[...values];
 const count=+$('cars').value;roster=Array.from({length:count},(_,i)=>roster[i]||(i%3===2?'sport':'muscle'));
 $('vehicleSlots').replaceChildren();
 roster.forEach((id,i)=>{
  const label=document.createElement('label'),select=document.createElement('select');label.textContent=(i+1)+'. ';
  for(const asset of assets.values())if(asset.behavior==='vehicle')select.add(new Option(asset.name,asset.id));
  select.value=id;select.disabled=!!run;select.setAttribute('aria-label','Vehicle '+(i+1));
  select.onchange=()=>{roster[i]=select.value;if(editor.root)editor.rebuild();};label.append(select);$('vehicleSlots').append(label);
 });
}
function readDoc(){
 const settings={cars:+$('cars').value,speed:+$('speed').value,laps:+$('laps').value,mode:$('raceMode').value,roster:[...roster]};
 if(isPursuit())settings.pursuit={fugitive:$('fugitiveCar').value,pursuers:[...pursuitCars]};
 return circuitDocument(track,layout,title,settings);
}
function lock(v){locked=v;for(const id of ['play','film','track','open','save','back'])$(id).disabled=v||(id==='film'&&!!recorder?.recording);}
function mode(racing){
 document.body.dataset.mode=racing?'race':'editor';
 if(beforePoliceView)view.scene.fog=racing?new T.Fog('#d9e2db',95,360):null;
 $('racePanel').hidden=!racing;$('editorTab').toggleAttribute('aria-current',!racing);$('raceTab').toggleAttribute('aria-current',racing);
 $('tools').hidden=racing;$('roadWidth').hidden=editor.tool!=='road';
 $('hud').hidden=!racing;$('back').hidden=!racing;$('frame').hidden=racing;$('phase').textContent=racing?(isPursuit()?'Police chase':'Race'):'3D editing';
 $('play').textContent=racing?'↻ Restart race':'▶ Start race';
 for(const id of ['cars','speed','laps','raceMode','pursuitCount','fugitiveCar'])$(id).disabled=racing;
 for(const select of document.querySelectorAll('#vehicleSlots select, #pursuitVehicleSlots select'))select.disabled=racing;
}
async function halt(){
 if(recorder?.recording)await recorder.stop();
 if(run){audio.update(run,view.camera,false,{});run.dispose();release(run.root);run=null;}
 finished=false;policePacer=null;policeAudit=null;shadowFrame=0;view.setShadowSize(2048);view.filmScale=1;view.previewScale=1;view.vertical=false;view.setSplit(false);$('camera').disabled=false;editor.clear();
}
async function choose(id,doc){
 if(locked)return;lock(true);
 try{
  if(track)drafts.set(track.id,readDoc());await halt();track=null;
  $('track').value=id;const splitOption=$('format').querySelector('[value="split"]');splitOption.disabled=id!=='police-one'||view.renderer.isSoftware;if(splitOption.disabled&&$('format').value==='split')$('format').value='phone';policeLook(id==='police-one');$('download').hidden=true;mode(false);say('');
  track=tracks.find(t=>t.id===id);doc=doc||drafts.get(id);layout=layoutFor(track,doc||{});title=doc?.name||track.name;$('title').textContent=title;
  if(doc)for(const k of ['cars','speed','laps'])$(k).value=doc[k];$('raceMode').value=doc?.mode||(id==='police-one'?'pursuit':'race');if(id==='police-one'){if(!doc)$('speed').value='170';$('camera').value='heli2';$('format').value='phone';cameraSliders();}vehicleSlots(doc?.roster||(id==='marseille'?['mar-rally-gt','mar-rally-hatch','mar-rally-raid','mar-rally-gt','mar-rally-hatch','mar-rally-raid']:undefined));
  if(doc?.pursuit){$('fugitiveCar').value=doc.pursuit.fugitive;$('pursuitCount').value=doc.pursuit.pursuers.length;}else{$('fugitiveCar').value=id==='marseille'?'mar-rally-gt':'muscle';$('pursuitCount').value=3;}
  pursuitSlots(doc?.pursuit?.pursuers||(id==='marseille'?['mar-police-blue','mar-police-interceptor','mar-police-van']:['patrol','patrol','swat']));pursuitSettings();editor.open(track,layout);
 }catch(e){say(e.message);}finally{lock(false);}
}
$('cars').onchange=()=>{vehicleSlots();if(editor.root)editor.rebuild();};
$('track').onchange=()=>choose($('track').value);$('frame').onclick=()=>editor.frame();
function target(){
 if(isPursuit())return run.fugitive;
 if(!follow||follow.arcade.out||follow.arcade.done||run.time-selectedAt>2.5){
  const live=run.cars.filter(c=>!c.arcade.done&&!c.arcade.out&&!c.disabled);
  const lead=live.sort((a,b)=>b.arcade.index-a.arcade.index)[0];if(lead){follow=lead;selectedAt=run.time;}
 }
 return follow||run.cars[0];
}
function leader(){
 if(isPursuit())return run.fugitive;
 const moving=run.cars.filter(c=>c.arcade&&!c.arcade.done&&!c.arcade.out&&!c.disabled);
 return moving.reduce((best,c)=>!best||c.arcade.index>best.arcade.index?c:best,null)||run.cars[0];
}
function camera(dt,refreshShadow=true){
 const kind=view.split?'heli2':$('camera').value,car=kind==='heli2'?leader():target(),p=car.mesh.position,cfg=cameras[kind];if(view.split)view.splitCar=run.fugitive;
 if(kind==='heli'){heli.camera=view.camera;heli.update(car,dt,run.time,{camera:.85,cameraDistance:cfg.distance,cameraHeight:cfg.height,cameraAngle:cfg.angle*Math.PI/180},{cars:run.cars,buildings:[],crashSpot:run.crashSpot},0,false);}
 else if(kind==='heli2'){
  const focus=p.clone().add(new T.Vector3(0,.8,0));
  const angle=cfg.angle*Math.PI/180+Math.sin(run.time*.12)*.055;
  const offset=new T.Vector3(Math.sin(angle)*cfg.distance,cfg.height,Math.cos(angle)*cfg.distance);
  if(run.policeOne){
   const v=car.body.linvel(),route=car.arcade.route,i=car.arcade.index;
   const heading=chaseHeading(route,i,car.yaw),peers=run.cars.filter(c=>c!==car&&!c.parked&&!c.disabled&&c.obj.role==='pursuer'&&c.mesh.position.distanceTo(p)<23).sort((a,b)=>a.mesh.position.distanceToSquared(p)-b.mesh.position.distanceToSquared(p)).slice(0,2);
   const event=run.policeImpact,impact=impactShot(event,p,run.time),hook=openingShot(run.time,impact),blockade=blockadeShot(p,impact),reveal=escapeReveal(run.time,run.policeMetrics.exitTime),driftExit=escapeDriftShot(reveal,car.slip,Math.hypot(v.x,v.z),p.x),industrial=industrialShot(p,Math.hypot(v.x,v.z),car.slip,impact),marketCar=run.cars.find(c=>c.obj.policeTraffic?.id==='market'&&c.trafficReleased&&!c.trafficDone&&!c.disabled),market=marketCrossingShot(p,marketCar?.mesh.position,impact);
   if(peers.length){const center=new T.Vector3();let total=0;peers.forEach((c,rank)=>{const weight=driftExit.weight>0?escapePeerFraming(driftExit.weight,c.mesh.position.distanceTo(p),rank).focus:1;center.addScaledVector(c.mesh.position,weight);total+=weight;});if(total>0)focus.lerp(center.multiplyScalar(1/total),Math.max(hook.peerFocus,industrial.peerFocus)*Math.min(1,total/peers.length));}
   focus.addScaledVector(heading,Math.min(3,Math.hypot(v.x,v.z)*.10));
   const shot=finaleCamera(p),final=shot.approach,jump=clamp((p.y-.6)/2.5,0,1),reinforcement=peers.find(c=>c.obj.policeReinforcement&&c.policeReleased&&!c.policeMerged);
   if(reinforcement)focus.lerp(reinforcement.mesh.position,.12);
   if(marketCar&&market.trafficFocus>0)focus.lerp(marketCar.mesh.position,market.trafficFocus);
   const crossing=run.cars.some(c=>c.obj.policeTraffic&&c.trafficReleased&&!c.trafficDone&&c.mesh.position.distanceTo(p)<15);
   const sceneImpact=impact>.08?new T.Vector3(event.x,Math.max(.6,event.y),event.z):null;if(sceneImpact)focus.lerp(sceneImpact,.24*impact);
   const stunt=stuntShot(p,v),action=actionCamera(Math.hypot(v.x,v.z),car.slip,car.steer,impact,stunt.weight,reveal),escape=escapeShot(reveal,Math.hypot(v.x,v.z));focus.addScaledVector(heading,stunt.lead+escape.lead+action.lead+hook.lead+blockade.lead+driftExit.lead+industrial.lead+market.lead);focus.y-=Math.max(0,p.y)*stunt.groundFocus;
   const height=29+impact*5+final*3+(reinforcement?3:0)+(crossing?2:0)-jump*3-stunt.height+escape.height-action.lower+hook.height+blockade.height+driftExit.height+industrial.height+market.height;
   const side=cfg.angle*Math.PI/180+.23*Math.sin(run.time*.35)+shot.exit*.27+stunt.lateral+escape.side+action.side+hook.side+blockade.side+driftExit.side+industrial.side+market.side;
   const back=-14-final*5+shot.exit*7+escape.distance+hook.distance+blockade.distance+driftExit.distance+industrial.distance+market.distance+stunt.distance;
   const baseFov=38+impact*5+final*2-jump*2+escape.fov-action.fov+hook.fov+blockade.fov+driftExit.fov+industrial.fov+market.fov+stunt.fov;
   if(view.vertical&&run.time<=.55&&!run.openingComposition&&peers.length)run.openingComposition=openingComposition(focus,heading,[p,...peers.map(c=>c.mesh.position)],view.camera.aspect,height,back,baseFov,side,o=>unobstructedHeight(focus,new T.Vector3(o.x,o.y,o.z),run.policeOccluders));
   const composition=view.vertical?run.openingComposition:null,w=composition?hook.weight:0;
   const behind=heading.clone().applyAxisAngle(new T.Vector3(0,1,0),side+(composition?.delta||0)*w).multiplyScalar(back-(composition?.extra||0)*w);
   offset.copy(behind);offset.y=height+(composition?.up||0)*w;
   offset.y+=unobstructedHeight(focus,offset,run.policeOccluders);
   const initial=heli.initial,k=initial?1:1-Math.exp(-dt*5.5);heli.initial=false;view.target.lerp(focus,k);view.camera.position.lerp(focus.clone().add(offset),k);
   view.camera.lookAt(view.target);
   const subjects=[p,...peers.filter((c,rank)=>(driftExit.weight<.45||escapePeerFraming(driftExit.weight,c.mesh.position.distanceTo(p),rank).visibility>.05)&&(stunt.weight<.5||c.mesh.position.distanceToSquared(p)<(23-10*stunt.weight)**2)).map(c=>c.mesh.position)];if(blockade.subject)subjects.push(new T.Vector3(4,1,0));if(market.subject&&marketCar)subjects.push(marketCar.mesh.position);if(stunt.weight>.45){subjects.push(new T.Vector3(p.x,0,p.z));subjects.push(new T.Vector3(p.x+heading.x*(5+stunt.lead+3*stunt.landing),0,p.z+heading.z*(5+stunt.lead+3*stunt.landing)));}if(sceneImpact&&impact>.22&&stunt.weight<.6)subjects.push(sceneImpact);
   const actualOffset=view.camera.position.clone().sub(view.target),fov=frameChase(view.target,actualOffset,subjects,view.camera.aspect,baseFov);
   view.camera.fov=initial||fov>view.camera.fov?fov:view.camera.fov+(fov-view.camera.fov)*(1-Math.exp(-dt*3));
  }else{view.target.copy(focus);view.camera.position.copy(focus).add(offset);}
  if(!run.policeOne)view.camera.lookAt(focus);
 }
 else if(kind!=='free'){
  const angle=kind==='cinematic'?Math.sin(run.time*.22)*.85:0;
  const off=kind==='air'?new T.Vector3(Math.sin(cfg.angle*Math.PI/180)*cfg.distance,cfg.height,-Math.cos(cfg.angle*Math.PI/180)*cfg.distance):new T.Vector3(Math.sin(angle+cfg.angle*Math.PI/180)*cfg.distance,cfg.height,-cfg.distance*Math.cos(angle+cfg.angle*Math.PI/180)).applyAxisAngle(new T.Vector3(0,1,0),car.yaw);
  const k=1-Math.exp(-6*dt);view.target.lerp(p.clone().add(new T.Vector3(Math.sin(car.yaw)*2,.8,Math.cos(car.yaw)*2)),k);view.camera.position.lerp(p.clone().add(off),k);view.camera.lookAt(view.target);
 }
 if(!(run.policeOne&&kind==='heli2'))view.camera.fov=cfg.fov;view.camera.updateProjectionMatrix();if(refreshShadow)view.lightAt(p,run.policeOne?38:32);
}
$('camera').onchange=()=>{cameraSliders();heli.initial=true;if(run){if($('camera').value==='free'){view.target.copy(target().mesh.position);const c=cameras.free;view.distance=Math.hypot(c.distance,c.height);view.el=Math.atan2(c.height,c.distance);view.az=c.angle*Math.PI/180;view.orbit();}camera(1);view.draw();}};
let orbit;canvas.addEventListener('pointerdown',e=>{if(run&&$('camera').value==='free'){orbit=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(orbit){view.drag(e.clientX-orbit[0],e.clientY-orbit[1],e.shiftKey);orbit=[e.clientX,e.clientY];view.draw();}});for(const ev of ['pointerup','pointercancel'])canvas.addEventListener(ev,()=>orbit=null);
async function createPass(){
 if(run){audio.update(run,view.camera,false,{});run.dispose();release(run.root);run=null;}
 const choices=isRally()?[roster[rallyIndex]]:roster;
 const scenario=isPursuit()
  ?pursuitGrid(track,layout.gates,+$('speed').value,+$('laps').value,$('fugitiveCar').value,pursuitCars)
  :startingGrid(track,layout.gates,choices.length,+$('speed').value,+$('laps').value,choices);
 run=await Run.create(buildMap(track,layout),scenario,view.renderer.isSoftware,diagnostic);
 view.scene.add(run.root);heli.initial=true;follow=null;acc=0;previous=performance.now();rallyReason=null;rallyHold=0;captureHold=0;pursuitResult='';
 for(const [i,label] of Array.from($('vehicleSlots').children).entries())label.classList.toggle('current',isRally()&&i===rallyIndex);
 $('camera').onchange();
}
async function nextPass(){
 lock(true);
 try{rallyIndex++;await createPass();say('');}catch(e){finished=true;if(recorder?.recording)await recorder.stop();say(e.message);}finally{lock(false);}
}
async function launch(film=false){
 if(locked)return;lock(true);
 try{
  const audioReady=audio.init().catch(()=>{});await halt();view.filmScale=policeRenderScale(track.id==='police-one',film,diagnostic);view.previewScale=view.filmScale;applyFormat();mode(true);$('tip').textContent='';say('Preparing starting grid…');
  rallyIndex=0;await createPass();await audioReady;
  if(run.policeOne&&!view.renderer.isSoftware){say('Preparing visual effects…');run.fragmentBatch?.prepare();run.warmup=await warmPoliceRender(view,[...run.fx.police.batches,...(run.fragmentBatch?[run.fragmentBatch]:[])]);}
  if(film){
   if(!audio.dest)throw Error('Audio capture unavailable.');
   startRecording();
  }
  previous=performance.now();acc=0;policePacer=run.policeOne&&!diagnostic?new PolicePacer(previous,!!recorder?.recording):null;policeAudit=policePacer?new PoliceFrameAudit(!!recorder?.recording):null;window.policeFrameReport=null;if(!film)say('');
 }catch(e){await halt();mode(false);editor.open(track,layout,false);say(e.message);}finally{lock(false);}
}
$('play').onclick=()=>launch();$('film').onclick=()=>{if(!run||finished||run.policeOne){launch(true);return;}startRecording();};$('download').onclick=()=>recorder?.download(track.id);
function frame(now){
 requestAnimationFrame(frame);
 if(!run||finished||locked||(diagnostic&&run.policeOne))return;
 if(run.policeOne&&!diagnostic){
  if(!policePacer)policePacer=new PolicePacer(previous,!!recorder?.recording);
  if(policePacer&&!policePacer.accept(now))return;
  if(policePacer&&policePacer.sample(now-previous)){applyPoliceQuality(view,policePacer.scale);}
 }
 const pressure=!!policePacer&&(policePacer.slowStreak>=2||policePacer.fps<56);
 const refreshShadow=!run.policeOne||shadowRefresh(shadowFrame++,!!recorder?.recording,view.filmScale||1,!view.light.shadow.map||view.light.shadow.needsUpdate,pressure);
 const physicsStart=policeAudit?performance.now():0;
 const dt=clamp((now-previous)/1000,0,.25);previous=now;acc+=dt;
 let alpha;
 if(run.policeOne){const frame=advancePoliceFrame(run,acc,audio.ctx?audio:undefined,!!recorder?.recording,policeDuration*120);acc=frame.acc;alpha=frame.alpha;}
 else{while(acc>=1/120){run.step(audio.ctx?audio:undefined);acc-=1/120;}alpha=acc*120;}
 const physicsMs=policeAudit?performance.now()-physicsStart:0;
 run.interpolate(alpha);camera(dt,refreshShadow);if(isRally()){
  rallyReason??=rallyOutcome(run.cars[0],dt);
  if(rallyReason){rallyHold+=dt;if(rallyHold>=1){if(rallyIndex+1<roster.length){nextPass();return;}finished=true;}}
 }else if(isPursuit()){
  if(run.policeOne){if(run.ticks>=policeDuration*120){const m=run.policeMetrics;pursuitResult=({escaped:'Escaped',captured:'Arrested',wrecked:'Crash',unfinished:'Chase unfinished'})[m.finale];finished=true;}}
  else{
   const fug=run.fugitive,pos=fug.body.translation(),v=fug.body.linvel();
   const slow=Math.hypot(v.x,v.z)<2.3||fug.disabled;
   const close=slow&&run.cars.some(c=>{if(c.obj.role!=='pursuer'||c.disabled)return false;const p=c.body.translation();return Math.hypot(p.x-pos.x,p.z-pos.z)<8;});
   captureHold=slow&&close?captureHold+dt:Math.max(0,captureHold-dt*.7);
   if(fug.arcade?.done){pursuitResult='Escaped';finished=true;}
   else if(captureHold>=3){pursuitResult='Arrested';finished=true;}
  }
  if(finished&&run.policeOne){const m=run.policeMetrics;say('Police#1 · 25 s · '+m.impacts+' impacts · '+m.fractures+' objects destroyed · '+m.trafficCrossed+'/'+m.trafficReleased+' civilian vehicles passed · '+(m.airTicks/120).toFixed(1)+' s airborne');}
  else if(finished)say(pursuitResult==='Escaped'?'The fugitive reached the finish.':'The fugitive has been stopped and arrested.');
 }else finished=run.cars.every(c=>c.arcade.done||c.arcade.out);if(finished&&!refreshShadow)camera(0,true);const drawStart=policeAudit?performance.now():0;view.draw(refreshShadow||finished);const drawMs=policeAudit?performance.now()-drawStart:0;const copyStart=policeAudit?performance.now():0;if(recorder?.recording)filmContext.drawImage(view.outputCanvas,0,0,filmCanvas.width,filmCanvas.height);const copyMs=policeAudit&&recorder?.recording?performance.now()-copyStart:0;audio.update(run,view.camera,!finished,{focusCar:target()});run.interpolate(1);
 if(policeAudit){policeAudit.add(now,physicsMs,drawMs,copyMs,view.filmScale||1,refreshShadow||finished,acc);if(finished){window.policeFrameReport=policeAudit.report(run.ticks);console.info('Police#1 frame report',window.policeFrameReport);policeAudit=null;}}
 if(finished&&recorder?.recording)recorder.stop();
 if(now-lastHud>100||finished){lastHud=now;const arrivals=run.cars.filter(c=>c.arcade.done).length,car=target();$('hud').textContent=isPursuit()?('Police chase · '+(pursuitResult||Math.round(car.speed*3.6)+' km/h')+' · '+pursuitCars.length+' pursuers · '+run.time.toFixed(1)+' s'+(run.policeOne&&policePacer?' · '+Math.round(policePacer.fps)+' FPS · '+canvas.width+' px wide'+(acc>1/30?' · lag '+Math.round(acc*1000)+' ms':''):'')):isRally()?('Run '+(rallyIndex+1)+'/'+roster.length+' · '+assets.get(roster[rallyIndex]).name+' · '+(rallyReason||Math.round(car.speed*3.6)+' km/h')+(finished?' · Finished':'')):finished?'Finish · '+arrivals+'/'+run.cars.length+' finished · '+run.time.toFixed(1)+' s':Math.round(car.speed*3.6)+' km/h  ·  '+run.time.toFixed(1)+' s';}
}

function startRecording(){
 try{
  if(run?.policeOne){applyPoliceQuality(view,1);camera(1/60);view.draw();}
  filmCanvas.width=view.vertical?1080:1920;filmCanvas.height=view.vertical?1920:1080;
  recorder??=new Recorder(filmCanvas,audio,(state,detail)=>{
   if(state==='done'){if(run?.policeOne){policePacer=null;applyPoliceQuality(view,policeRenderScale(true,false,diagnostic),2048);view.draw();}$('download').hidden=false;$('stopFilm').hidden=true;$('film').disabled=false;$('format').disabled=false;say(window.policeFrameReport?`Video ready · ${window.policeFrameReport.renderedFps??'—'} rendered FPS · ${window.policeFrameReport.fullScalePct}% at full resolution`:'Video ready.');}
   if(state==='error')say(detail);
  });
  filmContext.drawImage(view.outputCanvas,0,0,filmCanvas.width,filmCanvas.height);recorder.start();$('stopFilm').hidden=false;$('film').disabled=true;$('format').disabled=true;$('download').hidden=true;say('Recording…');
 }catch(e){say(e.message);}
}
$('stopFilm').onclick=()=>recorder?.stop();
const cameras={heli:{distance:24,height:24,angle:0,fov:42},heli2:{distance:24,height:27,angle:0,fov:42},chase:{distance:12,height:5,angle:0,fov:48},air:{distance:9,height:38,angle:0,fov:42},cinematic:{distance:20,height:12,angle:0,fov:42},free:{distance:25,height:25,angle:0,fov:42}};
function cameraSliders(){
 const c=cameras[$('camera').value];
 for(const [key,label] of [['Distance','distance'],['Height','height'],['Angle','angle'],['Fov','fov']]){
  $('cam'+key).value=c[label];$(label+'Value').textContent=c[label];
 }
}
for(const [key,label] of [['Distance','distance'],['Height','height'],['Angle','angle'],['Fov','fov']])$('cam'+key).oninput=()=>{
 cameras[$('camera').value][label]=+$('cam'+key).value;$(label+'Value').textContent=$('cam'+key).value;
 if(run){if($('camera').value==='free')$('camera').onchange();else{camera(1/60);view.draw();}}
};
function applyFormat(){
 const split=$('format').value==='split'&&track?.id==='police-one'&&!view.renderer.isSoftware;
 if($('format').value==='split'&&!split)$('format').value='phone';
 view.vertical=$('format').value!=='wide';
 if(split){$('camera').value='heli2';cameraSliders();}
 $('camera').disabled=split;view.setSplit(split);
}
$('format').onchange=()=>{applyFormat();if(run){run.openingComposition=null;heli.initial=true;camera(1);view.draw();}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();view.resize();}catch(e){say('Fullscreen unavailable: '+e.message);}};
$('save').onclick=()=>{
 try{const doc=readDoc();parseCircuit(JSON.stringify(doc));const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(title.replace(/[^a-z0-9-]/gi,'-')||'circuit')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Circuit exported with objects and waypoints.');}catch(e){say(e.message);}
};
$('open').onclick=()=>$('importFile').click();
$('importFile').onchange=async()=>{
 const file=$('importFile').files[0];if(!file)return;
 try{if(file.size>2000000)throw Error('File is too large.');const doc=parseCircuit(await file.text());
 for(const k of ['cars','speed','laps'])if(!Array.from($(k).options).some(o=>o.value===String(doc[k])))$(k).add(new Option(doc[k],doc[k]));
 await showEditor();await choose(doc.track,doc);say('Circuit imported.');}catch(e){say('Import rejected: '+e.message);}finally{$('importFile').value='';}
};
async function showEditor(){
 if(locked)return;
 if(run){await halt();mode(false);editor.open(track,layout,false);}
 mode(false);view.resize();editor.draw();
}
$('editorTab').onclick=showEditor;
$('raceTab').onclick=async()=>{
 if(locked)return;
 if(!run)await launch();else mode(true);
};
$('back').onclick=showEditor;
const requestedScene=new URLSearchParams(location.search).get('scene');
const initialScene=!diagnostic&&tracks.some(t=>t.id===requestedScene)?requestedScene:'police-one';
cameraSliders();choose(initialScene);requestAnimationFrame(frame);
