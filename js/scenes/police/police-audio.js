import {clamp} from '../../core/util.js';
export function impactMaterial(hit,asset){
 if(!hit.prop)return hit.building?'block':'body';
 if(/cone|chair|bin|panel/.test(asset||''))return 'plastic';
 if(/tire/.test(asset||''))return 'rubber';
 if(/crate/.test(asset||''))return 'block';
 if(/drum/.test(asset||''))return 'tin';
 if(/patrol/.test(asset||''))return 'body';
 return 'metal';
}
export function sirenProfile(p,camera,time){
 const dx=p.mesh.position.x-camera.position.x,dy=p.mesh.position.y-camera.position.y,dz=p.mesh.position.z-camera.position.z,dist=Math.hypot(dx,dy,dz);
 const v=p.body.linvel(),doppler=clamp(1-(dx*v.x+dz*v.z)/Math.max(1,dist)/343,.86,1.14);
 const right=camera.matrixWorld.elements;
 const pan=clamp((dx*right[0]+dy*right[1]+dz*right[2])/Math.max(8,dist)*1.6,-.85,.85);
 const phase=time*(p.kind==='swat'?2.7:4.4)+p.phase;
 const frequency=(p.kind==='swat'?480:610)+(p.kind==='swat'?280:410)*(.5+.5*Math.sin(phase));
 return {frequency:frequency*doppler,pan,gain:p.parked||p.disabled?0:.075/(1+(dist/36)**2)};
}
export function tensionProfile(time,airborne,playing){
 const amount=playing?clamp(time/20,0,1):0;
 return {wind:playing?(airborne?.095:.012+amount*.018):0,pulse:playing?(.022+amount*.035)*(airborne?.35:1):0,frequency:42+amount*14,rate:2.2+amount*1.9};
}
export class PoliceAudio{
 constructor(audio){
  this.audio=audio;const c=audio.ctx;
  this.wind=c.createBufferSource();this.wind.buffer=audio.noiseBuffer;this.wind.loop=true;
  this.filter=c.createBiquadFilter();this.filter.type='bandpass';this.filter.frequency.value=590;this.filter.Q.value=.6;
  this.windGain=c.createGain();this.windGain.gain.value=0;this.wind.connect(this.filter);this.filter.connect(this.windGain);this.windGain.connect(audio.master);this.wind.start();
  this.pulse=c.createOscillator();this.pulse.type='sine';this.pulseGain=c.createGain();this.pulseGain.gain.value=0;this.pulse.connect(this.pulseGain);this.pulseGain.connect(audio.master);this.pulse.start();
 }
 update(sim,playing){
  const t=this.audio.ctx.currentTime,car=sim.fugitive,active=playing&&sim.policeOne;
  const p=tensionProfile(sim.time,!!car.policeAirborne,active);
  this.windGain.gain.setTargetAtTime(p.wind,t,.065);
  this.filter.frequency.setTargetAtTime(480+Math.max(0,car.speed||0)*14,t,.08);
  this.pulse.frequency.setTargetAtTime(p.frequency,t,.08);
  const beat=Math.pow(.5+.5*Math.cos(sim.time*p.rate*Math.PI*2),5);
  this.pulseGain.gain.setTargetAtTime(p.pulse*beat,t,.04);
 }
 landing(speed){
  const c=this.audio.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(83,t);o.frequency.exponentialRampToValueAtTime(35,t+.25);
  g.gain.setValueAtTime(Math.min(.21,.06+speed*.004),t);g.gain.exponentialRampToValueAtTime(.001,t+.3);
  o.connect(g);g.connect(this.audio.master);o.start(t);o.stop(t+.31);o.onended=()=>{o.disconnect();g.disconnect();};
 }
}
