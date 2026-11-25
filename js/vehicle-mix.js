(()=>{
 const cache=new WeakMap();
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function decode(ctx){
  if(!cache.has(ctx))cache.set(ctx,Promise.all(Object.entries(globalThis.apexSampleData).map(async ([name,data])=>{
   const bytes=Uint8Array.from(atob(data),v=>v.charCodeAt(0));
   return [name,await ctx.decodeAudioData(bytes.buffer)];
  })).then(Object.fromEntries));
  return cache.get(ctx);
 }
 async function create(audio){
  const ctx=audio.ctx,buffers=await decode(ctx);
  const channels={};
  for(const name of ['petrol','heavy']){
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   const sample=buffers[name],wave=sample.getChannelData(0),rate=sample.sampleRate;
   const start=Math.round(.065*rate),end=wave.length-start,blend=Math.round(.045*rate);
   for(let i=0;i<blend;i++){
    const u=i/blend;wave[end-blend+i]=wave[end-blend+i]*(1-u)+wave[start+i]*u;
   }
   source.buffer=sample;source.loop=true;source.loopStart=(start+blend)/rate;source.loopEnd=end/rate;
   filter.type='lowpass';filter.Q.value=.55;gain.gain.value=0;
   source.connect(filter);filter.connect(gain);gain.connect(audio.master);source.start();
   channels[name]={source,filter,gain};
  }
  const skid=ctx.createBufferSource(),skidGain=ctx.createGain(),skidFilter=ctx.createBiquadFilter();
  skid.buffer=buffers.skid;skid.loop=true;
  const samples=skid.buffer.getChannelData(0),cross=Math.floor(skid.buffer.sampleRate*.06);
  for(let i=0;i<cross;i++){const u=i/cross,k=samples.length-cross+i;samples[k]=samples[k]*(1-u)+samples[i]*u;}
  skid.loopStart=cross/skid.buffer.sampleRate;
  skidFilter.type='lowpass';skidFilter.frequency.value=3200;skidGain.gain.value=0;
  skid.connect(skidFilter);skidFilter.connect(skidGain);skidGain.connect(audio.master);skid.start();
  let next=0,lastHit=-10,gear=0,current='',lastActive=false,shift=-2,previous=0;
  let envelope=0,lastDrive=0;
  const gears=[1,.69,.50,.38,.30];
  return {
   drive(model,speed,load,active,level=1,brake=0){
    const t=ctx.currentTime;if(t<next&&current===model&&lastActive===active)return;next=t+.045;
    speed=Math.abs(speed||0);load=clamp(load??.55,0,1);
    const heavy=['semi','truck','bus','ice','van','swat'].includes(model),family=heavy?'heavy':'petrol';
    const ratio=speed/(heavy?17:22),changed=current!==model||(!lastActive&&active);
    if(changed){gear=0;while(gear<4&&ratio*gears[gear]>1.15)gear++;shift=t-1;}
    else if(t-shift>.4){
     if(ratio*gears[gear]>1.2&&gear<4){gear++;shift=t;}
     else if(ratio*gears[gear]<.57&&gear>0){gear--;shift=t;}
    }
    const elapsed=clamp(t-lastDrive,.005,.2);
    const demand=clamp(load+.18*Math.min(1,speed/24),0,1);
    envelope=changed?demand:envelope+(demand-envelope)*(1-Math.exp(-elapsed/(demand>envelope?.055:.18)));
    lastDrive=t;
    current=model;lastActive=active;
    for(const [name,ch] of Object.entries(channels)){
     const enabled=active&&name===family;
     const rpm=clamp(ratio*gears[gear],0,1.3);
     const muscle=model==='muscle',sport=model==='sport';
     const pitch=(heavy?.62:muscle?.64:.72)+rpm*(heavy?.65:sport?.92:.80)+envelope*.075;
     const gearCut=1-.20*Math.max(0,1-(t-shift)/.14);
     ch.source.playbackRate.setTargetAtTime(pitch*gearCut,t,.06);
     ch.filter.frequency.setTargetAtTime((muscle?670:800)+rpm*1050+envelope*(sport?2300:1700),t,.08);
     const volume=(heavy?.74:.65)*(.39+.61*envelope+.09*brake)*(t-shift<.13?.82:1)*(t-lastHit<.18?.65:1);
     ch.gain.gain.setTargetAtTime(enabled?volume*level:0,t,active?.075:.045);
    }
   },
   tyres(slip,speed,grounded,active){
    const t=ctx.currentTime,amount=clamp((Math.abs(slip)-1.15)/6,0,1)*clamp((speed-4)/14,0,1);
    skidGain.gain.setTargetAtTime(active&&grounded?Math.pow(amount,.8)*.25:0,t,active&&grounded?.07:.04);
    skid.playbackRate.setTargetAtTime(.88+amount*.22,t,.14);
    skidFilter.frequency.setTargetAtTime(1350+amount*1600,t,.12);
   },
   hit(material,strength){
    const t=ctx.currentTime;if(!Number.isFinite(strength)||strength<2||t-lastHit<.095)return;
    const b=material==='body'?buffers[previous%2?'crash':'crash2']:(buffers[material]||buffers.metal),src=ctx.createBufferSource(),gain=ctx.createGain();
    src.buffer=b;previous=(previous+1)%5;src.playbackRate.value=[.94,1.04,.89,1.08,.99][previous];
    const level=clamp(Math.sqrt(strength)*.094,.09,.52);gain.gain.value=level;
    src.connect(gain);gain.connect(audio.master);src.start();lastHit=t;
    src.onended=()=>{src.disconnect();gain.disconnect();};
   }
  };
 }
 function install(audio){
  if(audio.sampleBankInstalled)return;audio.sampleBankInstalled=true;
  const init=audio.init.bind(audio),update=audio.update.bind(audio),oldHit=audio.hit.bind(audio);
  let ready;
  audio.init=async function(...args){
   await init(...args);
   ready??=create(audio).then(mix=>{audio.sampleMix=mix;audio.motorGain.disconnect();audio.tyreGain.disconnect();}).catch(err=>console.warn('Audio samples:',err));
   await ready;
  };
  audio.update=function(sim,cam,playing,settings){
   globalThis.apexHandling?.attach(sim?.physics);
   update(sim,cam,playing,settings);if(!audio.sampleMix||!sim?.fugitive)return;const car=settings?.focusCar||sim.fugitive,a=sim.episode?.audio||{};
   audio.sampleMix?.drive(car.obj?.asset||car.kind||'car',car.speed,car.inputs?.throttle,!!playing&&!car.disabled&&!a.silence,a.engine??1,car.inputs?.brake||0);
   audio.sampleMix.tyres(car.slip||0,car.speed,car.grounded===true,!!playing&&!car.disabled&&!a.silence);
  };
  audio.hit=(strength,material='body')=>audio.sampleMix?audio.sampleMix.hit(material,strength):oldHit(strength);
 }
 globalThis.apexVehicleMix={install};
})();
