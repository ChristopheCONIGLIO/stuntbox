import {THREE as T,box,bake,cylinder,clamp} from '../../core/util.js';
import {blank,heightAt} from '../../world/terrain.js';
import {surfaceFinish} from './police-look.js';
import {exitX} from './police-finale.js';
import {recoverRoute} from './police-recovery.js';
import {addPoliceTraffic,trafficAvoidance} from './police-traffic.js';
export const policeGates=[[-154,-84],[-110,-84],[-58,-84],[-49,-81],[-44,-76],[-42,-68],[-42,-16],[-39,-7],[-34,-2],[-26,0],[32,0],[41,3],[46,8],[48,16],[48,62],[51,71],[56,76],[64,78],[125,78],[160,78]].map(([x,z])=>[x,.06,z]);
const xs=[-150,-96,-42,3,48,102,156],zs=[-84,-42,0,39,78];
export const policeDuration=25;
const leadStart=40;
export const policeRamps=[{id:'police-finale-ramp',asset:'jump-kicker',p:[112,0,78],r:[0,Math.PI/2,0],s:[1.06,.90,1.16],height:0,behavior:'static'}];
export const policeRunout=252;
const roadX=x=>xs.some(v=>Math.abs(x-v)<8.5),roadZ=z=>zs.some(v=>Math.abs(z-v)<8.5);
export const policeParks=[
 {x:-19.5,z:-21,rx:12,rz:9.5,h:3.2},
 {x:-19.5,z:19.5,rx:12,rz:9,h:4.6},
 {x:75,z:-21,rx:14,rz:9.5,h:2.8}
];
export function parkRelief(x,z){
 for(const p of policeParks){
  const u=Math.max(Math.abs(x-p.x)/p.rx,Math.abs(z-p.z)/p.rz);
  if(u<1){const t=clamp((1-u)/.62,0,1);return p.h*t*t*(3-2*t);}
 }
 return 0;
}
function parkAt(x,z){return policeParks.find(p=>p.x===x&&p.z===z);}
export function parkSurface(x,z){
 const ix=Math.floor(x/2)*2,iz=Math.floor(z/2)*2,u=(x-ix)/2,v=(z-iz)/2;
 const a=parkRelief(ix,iz),b=parkRelief(ix+2,iz),c=parkRelief(ix,iz+2),d=parkRelief(ix+2,iz+2);
 return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}
function parkWalk(g,p,axis){
 const positions=[],indices=[],length=axis==='x'?p.rx+1:p.rz+1,steps=Math.ceil(length*4);
 for(let i=0;i<=steps;i++){
  const along=-length+2*length*i/steps;
  for(const side of [-1,0,1]){
   const x=p.x+(axis==='x'?along:side*.95),z=p.z+(axis==='z'?along:side*.95);
   positions.push(x,Math.max(.24,parkSurface(x,z)+.085),z);
  }
  if(i){const a=(i-1)*3,b=i*3;for(let j=0;j<2;j++)if(axis==='x')indices.push(a+j,a+j+1,b+j,b+j,a+j+1,b+j+1);else indices.push(a+j,b+j,a+j+1,b+j,b+j+1,a+j+1);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#dfc9a5',roughness:.9,side:T.DoubleSide}));mesh.receiveShadow=true;g.add(mesh);
}
const districtPalettes={
 market:{base:'#c5a78c',top:'#dfbc97',edge:'#f2d8b0',band:'#ad745c',inset:'#f3dbb8'},
 riviera:{base:'#b7c4b6',top:'#dce2c9',edge:'#f2ead5',band:'#73958a',inset:'#b4c8ae'},
 civic:{base:'#bfc8c7',top:'#e0e2dd',edge:'#faf1da',band:'#8babae',inset:'#b2c5c6'},
 industrial:{base:'#a2aba8',top:'#b8bcb4',edge:'#e0c899',band:'#817e73',inset:'#d6b675'}
};
export function districtPalette(i,j){
 return districtPalettes[j===0?'market':j===3?'industrial':i<3?'riviera':'civic'];
}
export function plazaPlan(x,z,w,d,i,j){
 const p=districtPalette(i,j),pieces=[];
 const add=(w,h,d,x,y,z,c)=>pieces.push({w,h,d,x,y,z,c});
 for(const side of [-1,1]){
  const zz=z+side*(d/2-1.9);
  add(w-1.8,.021,2.4,x,.213,zz,p.inset);
  add(w-1.8,.025,.18,x,.228,zz-side*1.05,p.band);
  add(w-1.8,.025,.18,x,.228,zz+side*1.05,p.band);
  if(j===0){
   for(let k=-Math.floor((w-5)/6);k<=Math.floor((w-5)/6);k++){
    const xx=x+k*3;add(.88,.028,.88,xx,.231,zz,p.band);add(.45,.032,.45,xx,.237,zz,p.edge);
   }
  }else if(j===3){
   for(let k=-Math.floor((w-6)/7);k<=Math.floor((w-6)/7);k++)add(1.55,.027,.28,x+k*3.5,.233,zz,p.band);
  }else{
   for(let k=-Math.floor((w-6)/8);k<=Math.floor((w-6)/8);k++)add(2.4,.024,.22,x+k*4,.231,zz,p.edge);
  }
 }
 for(const side of [-1,1]){
  const xx=x+side*(w/2-1.5);
  add(1.25,.022,d-6,xx,.215,z,p.inset);
  add(.13,.027,d-6,xx-side*.52,.232,z,p.band);
 }
 return pieces;
}
export function intersectionPlan(x,z,major){
 const markings=[],signals=[];
 const add=(w,d,dx,dz,color,yaw=0)=>markings.push({w,d,x:x+dx,z:z+dz,color,yaw});
 for(const side of [-1,1]){
  for(let k=-2;k<=2;k++){
   add(.72,2.4,k*1.35,side*10.2,'#f5ead5');
   add(2.4,.72,side*10.2,k*1.35,'#f5ead5');
  }
  add(3.5,.22,side*2.2,-side*13.1,'#f4ead7');
  add(.22,3.5,-side*13.1,-side*2.2,'#f4ead7');
  signals.push({x:x+side*10.8,z:z-side*10.8,yaw:side===1?Math.PI:0,green:major});
  signals.push({x:x-side*10.8,z:z-side*10.8,yaw:side===1?-Math.PI/2:Math.PI/2,green:!major});
  if(major){
   for(const [dx,dz,yaw] of [[side*2.2,-side*17.3,side===1?0:Math.PI],[-side*17.3,-side*2.2,side===1?Math.PI/2:-Math.PI/2]]){
    add(.20,2.0,dx,dz,'#e9dfc9',yaw);
    add(.22,.85,dx+Math.sin(yaw)*.85+Math.cos(yaw)*.25,dz+Math.cos(yaw)*.85-Math.sin(yaw)*.25,'#e9dfc9',yaw-.65);
    add(.22,.85,dx+Math.sin(yaw)*.85-Math.cos(yaw)*.25,dz+Math.cos(yaw)*.85+Math.sin(yaw)*.25,'#e9dfc9',yaw+.65);
   }
  }
 }
 return {markings,signals};
}
export function policeStreets(){
 const g=new T.Group(),paint='#eee4cb',asphalt='#39434e',curb='#f3e9d5';
 for(const x of xs){box(g,17,.035,240,x,.021,0,asphalt);for(let z=-116;z<116;z+=7)if(!zs.some(v=>Math.abs(z-v)<14))box(g,.15,.012,2.8,x,.045,z,paint);}
 for(const z of zs){box(g,340,.035,17,0,.023,z,asphalt);const major=z===-84||z===0||z===78;for(let x=-165;x<165;x+=7)if(!xs.some(v=>Math.abs(x-v)<14)){if(major){for(const d of [-.27,.27])box(g,2.8,.012,.12,x,.046,z+d,'#e4cc94');}else box(g,2.8,.012,.15,x,.046,z,paint);}if(major)for(const side of [-1,1])for(let i=0;i<xs.length-1;i++){const from=xs[i]+14,to=xs[i+1]-14;if(to>from){box(g,to-from,.009,1.05,(from+to)/2,.045,z+side*7.6,'#647d7d');box(g,to-from,.012,.10,(from+to)/2,.052,z+side*7.02,'#dcd8c6');}}}
 box(g,90,.035,17,215,.023,78,asphalt);
 for(let x=172;x<259;x+=7)box(g,2.8,.012,.15,x,.046,78,paint);
 for(const side of [-1,1]){box(g,90,.18,1.2,215,.09,78+side*8.7,curb);box(g,90,.014,.14,215,.05,78+side*7.5,paint);}
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2,w=xs[i+1]-xs[i]-17,d=zs[j+1]-zs[j]-17;if(!parkAt(x,z)){const p=districtPalette(i,j);box(g,w,.18,d,x,.09,z,p.base);box(g,w-1.1,.02,d-1.1,x,.19,z,p.top);}else{for(const side of [-1,1]){box(g,w,.18,1.6,x,.09,z+side*(d/2-.8),'#c9c6b9');box(g,1.6,.18,d-3.2,x+side*(w/2-.8),.09,z,'#c9c6b9');}}}
 for(const x of xs)for(const z of zs){
  const plan=intersectionPlan(x,z,z===-84||z===0||z===78);
  for(const m of plan.markings){const mesh=box(g,m.w,.013,m.d,m.x,.065,m.z,m.color);mesh.rotation.y=m.yaw;}
  for(const q of plan.signals){
   const dx=Math.sin(q.yaw),dz=Math.cos(q.yaw);
   box(g,.72,.24,.72,q.x,.32,q.z,'#89938d');
   box(g,.16,3.3,.16,q.x,1.95,q.z,'#45565a');
   const housing=box(g,.40,1.05,.34,q.x,3.5,q.z,'#26383b');housing.rotation.y=q.yaw;
   for(let k=0;k<3;k++){const active=k===(q.green?0:2),color=active?['#57cf8e','#efc465','#e35a4f'][k]:'#354443';const lamp=box(g,.22,.22,.05,q.x+dx*.19,3.2+k*.31,q.z+dz*.19,color);lamp.rotation.y=q.yaw;}
  }
 }
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2,w=xs[i+1]-xs[i]-17,d=zs[j+1]-zs[j]-17;
  const p=districtPalette(i,j);
  for(const side of [-1,1]){box(g,w,.08,.35,x,.21,z+side*(d/2-.18),p.edge);box(g,.35,.08,d,x+side*(w/2-.18),.21,z,p.edge);}
  if(!parkAt(x,z)&&!(i===3&&j===3))for(const a of plazaPlan(x,z,w,d,i,j))box(g,a.w,a.h,a.d,a.x,a.y,a.z,a.c);
  if(i===3&&j===3){
   box(g,w-2,.035,d-2,x,.235,z,'#b9b4a6');
   for(let k=0;k<5;k++){const zz=z-8+k*4;box(g,10,.017,.14,x-4,.261,zz,'#f5e8c7');box(g,.14,.017,3.7,x-9,.262,zz+1.8,'#f5e8c7');}
   for(let k=0;k<5;k++)box(g,1.0,.02,.18,x+6+k*1.6,.265,z-8+k*.4,'#d6a455');
  }
  const park=parkAt(x,z);
  if(park){
   for(const axis of ['x','z'])parkWalk(g,park,axis);
   for(const a of [-1,1])for(const b of [-1,1]){
    const px=x+a*(w/2-5),pz=z+b*(d/2-5),py=parkSurface(px,pz);
    box(g,4,.18,2.2,px,py+.32,pz,'#b9af96');box(g,3.7,.12,1.9,px,py+.47,pz,'#65865f');
   }
   for(const side of [-1,1])for(let k=0;k<3;k++){
    const px=x+side*(park.rx*.45+k*1.4),pz=z+side*2.7,py=parkSurface(px,pz);
    box(g,1.25,.55,3.1,px,py-.04,pz,'#b8a58d');
    box(g,1.3,.12,3.15,px,py+.27,pz,'#e0cfb5');
   }
  }
 }
 bake(g);return surfaceFinish(g,'street');
}
export function policeMap(){
 const map=blank(520,260);map.name='Police#1';map.terrain.mat.fill(1);
 const t=map.terrain;for(let j=0;j<=t.nz;j++)for(let i=0;i<=t.nx;i++){const x=i*2-t.w/2,z=j*2-t.d/2;const k=j*(t.nx+1)+i,h=parkRelief(x,z);if(roadX(x)||roadZ(z))t.mat[k]=0;else if(h>0){t.h[k]=h;t.mat[k]=2;}}
 const add=(asset,x,z,s=1,behavior='static',mass,yaw=0,y=0)=>map.objects.push({id:'police-'+map.objects.length,asset,p:[x,y,z],r:[0,yaw,0],s:[s,s,s],behavior,...(mass?{mass}:{})});
 add('police-streets',0,0);add('police-district-details',0,0);add('police-street-accents',0,0);
 add('police-market-hall',-123,-112,1,'static',undefined,0,.02);
 add('police-freight-hall',129,111,1,'static',undefined,Math.PI,.02);
 for(const z of [-112,111])for(const x of [-69,-19,25,75]){add('police-'+(z<0?'market':'garage')+'-'+(Math.abs(x)%3),x,z,.94,'static',undefined,z<0?0:Math.PI);add('palm',x+10,z+(z<0?9:-9),.8);}
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;
  if(i===3&&j===3){add('police-garage-1',x-7,z,.68,'static',undefined,Math.PI/2);for(const zz of [z-7,z+7]){add('crate',x+1,zz,.8,'breakable',18);add('obstacle-drum',x+4,zz,.75,'dynamic',22);}continue;}
  if(parkAt(x,z)){const ground=(px,pz)=>heightAt(t,px,pz);add('fountain',x,z,.8,'static',undefined,0,ground(x,z));for(const dx of [-5,9])for(const dz of [-5,5])add('tree0',x+dx,z+dz,.75,'static',undefined,0,ground(x+dx,z+dz));for(const dx of [-4,6])add('parkbench',x+dx,z+5,.8,'dynamic',65,0,ground(x+dx,z+5));continue;}
  for(const dx of [-8,8]){const type=(i===0||i===5)&&j%2===0?'tower':'police-'+(j===0?'market':j===3?'garage':i<3?'hotel':'loft')+'-'+((i+j+(dx>0?1:0))%3);add(type,x+dx,z,.72+((i+j)%3)*.05,'static',undefined,j%2===0?Math.PI:0);}
  for(const dx of [-15,15])add('tree0',x+dx,z-8,.65);
 }
 for(const x of xs.slice(1,-1))for(const z of zs){add('streetlight',x+13.5,z+10.5,.8,'dynamic',65);add('bin',x-13,z+10.5,.85,'dynamic',20);}
 for(const [x,z] of [[-115,-96],[-77,-96],[-30,12],[28,12],[62,66],[118,90]]){add('table',x,z,.8,'dynamic',22);for(const dx of [-1.6,1.6])add('chair',x+dx,z,.8,'dynamic',7);}
 for(let i=0;i<5;i++)add('cone',-85+i*3,-84+(i%2?1:-1),1,'dynamic',4);
 for(let i=0;i<3;i++)add('barrier',-48.6,-32+i*2.6,.75,'dynamic',24,0);
 for(let i=0;i<3;i++)add('cone',-44.6,-29+i*2.8,.8,'dynamic',3);
 add('roadworks',-50.2,-35,.85,'dynamic',12,Math.PI);
 add('excavator',-59,-24,.65);
 for(const [x,z,yaw] of [[-122,-90,Math.PI/2],[-106,-78,Math.PI/2],[22,6,Math.PI/2],[68,84,Math.PI/2],[91,72,Math.PI/2]])add('police-beacon-patrol',x,z,.9,'dynamic',1300,yaw);
 add('police-beacon-patrol',4,-5,1,'dynamic',1450,Math.PI/2);
 add('police-beacon-patrol',4,5,1,'dynamic',1450,Math.PI/2);
 for(const z of [-3.1,3.1])add('cone',-4,z,1,'dynamic',4);
 add('barrier',7,-2.9,.8,'dynamic',28,Math.PI/2);
 for(let i=0;i<4;i++)add('crate',52.5+(i%2?1.5:0),43+Math.floor(i/2)*2,.8,'breakable',22);
 for(let i=0;i<4;i++)add('obstacle-drum',52+i*.9,49+(i%2?1.2:-1.2),.8,'dynamic',26);
 for(let i=0;i<3;i++)add('barrier',51.3+i*1.6,55,.7,'breakable',20,Math.PI/2);
 for(let i=0;i<4;i++)add('cone',46.7,46+i*2.5,.8,'dynamic',3);
 for(let i=0;i<5;i++)add('cone',87+i*4,78+(i%2?3.3:-3.3),1,'dynamic',4);
 for(let i=0;i<6;i++)add('crate',132+(i%2)*2,78+(i-2.5)*1.35,.75,'breakable',14);
 for(let i=0;i<4;i++)add('obstacle-tire',136+i*1.5,78+(i%2?3:-3),.85,'dynamic',16);
 for(const z of [72,84])add('police-beacon-patrol',143,z,.95,'dynamic',1400,Math.PI/2);
 add('police-exit-gantry',exitX,78,1);add('police-exit-markings',0,0);add('police-exit-scenery',0,0);
 for(let i=0;i<3;i++)add('police-exit-panel',149,78+(i-1)*2.55,1,'breakable',18);
 for(let i=0;i<3;i++)add('police-exit-panel',151.2,78+(i-1)*2.55,.78,'breakable',12);
 for(const z of [70.8,85.2])for(let i=0;i<3;i++)add('cone',147+i*3,z,.95,'dynamic',4);
 add('police-quarter-markers',0,0);
 return map;
}
export function openingFormation(i){
 return {gap:i===0?8.5:13+Math.floor(i/2)*7,lane:i%2?-2.35:2.35,initial:i===0?105:96+i*2};
}
export function policeScenario(scenario,position){
 scenario.seed=731914;scenario.policeOne=true;
 const fug=scenario.vehicles[0];position(fug,leadStart,0);fug.initial=105;fug.color='#dc312b';fug.speed=145;
 scenario.vehicles.slice(1).forEach((c,i)=>{const start=openingFormation(i);position(c,Math.max(0,leadStart-start.gap),start.lane);c.initial=start.initial;c.speed=155;c.policeGap=13+Math.floor(i/2)*7;c.policePressureRole=i===0?'lead':i===1?'cover':null;});
 if(scenario.vehicles.length>=4){const c=scenario.vehicles[3];c.p=[-2.5,.14,-27];c.r=[0,0,0];c.lane=1.75;c.initial=0;c.policeGap=6;c.policeReinforcement=true;}
 return addPoliceTraffic(scenario);
}
const openingLine=[[-128,0],[-115,2.7],[-105,2.35],[-91,-2.7],[-78,2.25],[-65,0]];
const northLine=[[-68,0],[-60,-2.45],[-49,2.15],[-43,0]];
const industrialLine=[[18,0],[25,2.6],[34,2.4],[43,-2.4],[52,-2.4],[59,0]];
const escapeLine=[[168,0],[179,2.4],[191,2.4],[205,-2.6],[217,-1.3],[230,0]];
function lineAt(points,at){
 if(at<=points[0][0]||at>=points.at(-1)[0])return 0;
 for(let i=1;i<points.length;i++)if(at<=points[i][0]){const [a,from]=points[i-1],[b,to]=points[i],u=(at-a)/(b-a);return from+(to-from)*u*u*(3-2*u);}
 return 0;
}
export function policeActionLine(p,speed){
 let points,at;
 if(Math.abs(p.z+84)<7&&p.x>-128&&p.x<-65){points=openingLine;at=p.x;}
 else if(Math.abs(p.x+42)<7&&p.z>-68&&p.z<-43){points=northLine;at=p.z;}
 else if(Math.abs(p.x-48)<7&&p.z>18&&p.z<59){points=industrialLine;at=p.z;}
 else if(Math.abs(p.z-78)<7&&p.x>168&&p.x<230){points=escapeLine;at=p.x;}
 else return null;
 const shift=lineAt(points,at+2.4),slope=Math.abs(lineAt(points,at+5)-lineAt(points,at-1))/6;
 const edge=clamp((at-points[0][0])/5,0,1)*clamp((points.at(-1)[0]-at)/6,0,1);
 const slide=clamp((slope-.06)/.29,0,1)*clamp((speed-12)/9,0,1)*edge;
 return {shift,slide,boost:points===openingLine?3.5*edge:points===escapeLine||points===industrialLine?0:1.2*edge};
}
export function policeOpeningPressure(car,quarry,p){
 const role=car.obj.policePressureRole;
 if(!role||car.obj.policeReinforcement||car.hitStun>0||car.reverse>0||car.disabled)return null;
 const q=quarry.body.translation(),gap=q.x-p.x;
 if(p.x< -136||p.x> -70||q.x> -67||Math.abs(p.z+84)>6||Math.abs(q.z+84)>6||gap< -3||gap>34)return null;
 const weight=clamp((-67-q.x)/10,0,1)*clamp((p.x+136)/6,0,1);
 const desired=role==='lead'?6.5:10.5;
 const qv=quarry.body.linvel(),own=car.body.linvel(),closing=own.x-qv.x;
 const speed=clamp(qv.x+(gap-desired)*.9-closing*.18,10,35);
 const side=role==='lead'?clamp(1.1-(gap-5)*.09,.35,1.1):-2.65;
 const line=clamp(role==='lead'?-(q.z+84)+side:side,-2.9,2.9);
 return {speed,shift:line-(car.obj.lane||0),weight,gap};
}
export function approachPressure(car,quarry,p,progress){
 const role=car.obj.policePressureRole;
 if((role!=='lead'&&role!=='cover'&&!car.policeMerged)||car.hitStun>0||car.reverse>0||car.disabled||car.parked||car.crashMode)return null;
 const q=quarry.body.translation(),gap=(quarry.arcade.index-progress)*1.35;
 const zone=Math.max(clamp((p.x-19)/8,0,1)*clamp((10-Math.abs(p.z))/5,0,1),clamp((p.x-36)/8,0,1)*clamp((24-p.z)/9,0,1)*clamp((p.z+4)/4,0,1));
 if(zone<=0||q.x<28||q.z>47||gap<5||gap>45)return null;
 const weight=zone*.94*clamp((47-q.z)/12,0,1);
 const v=quarry.body.linvel(),own=car.body.linvel(),pace=Math.hypot(v.x,v.z),closing=Math.hypot(own.x,own.z)-pace;
 const desired=role==='cover'?11:7.5;
 return {speed:clamp(pace+(gap-desired)*1.05-closing*.25,10,35),weight,gap};
}
export function industrialPressure(car,quarry,p){
 const role=car.obj.policePressureRole;
 if((role!=='lead'&&!car.policeMerged)||car.hitStun>0||car.reverse>0||car.disabled||car.parked)return null;
 const q=quarry.body.translation(),gap=q.z-p.z;
 if(Math.abs(p.x-48)>6||Math.abs(q.x-48)>6||p.z<17||q.z>59||gap<5||gap>34)return null;
 const weight=.7*clamp((p.z-17)/8,0,1)*clamp((59-q.z)/9,0,1);
 const v=quarry.body.linvel(),own=car.body.linvel();
 const desired=car.policeMerged?9:8;
 const speed=clamp(v.z+(gap-desired)*.78-(own.z-v.z)*.2,10,34);
 return {speed,weight,gap};
}
export function reinforcementCommand(p,q,t,released){
 const ready=released||Math.abs(q.z)<12&&q.x>7||t>=13&&q.x>0;
 if(!ready)return {released:false,target:{x:-2.5,z:-6},speed:0};
 if(p.z<-9)return {released:true,target:{x:-2.5,z:-4},speed:15};
 if(p.x<12)return {released:true,target:{x:18,z:0},speed:13};
 return {released:true,merged:true};
}
export function policeMotion(car,quarry,t,routeMotion,cars=[]){
 const path=car.arcade,route=path.route,p=car.body.translation(),fug=car===quarry;
 const progress=recoverRoute(car),finish=path.finishIndex;
 if(car.obj.policeReinforcement&&!car.policeMerged){
  const q=quarry.body.translation(),command=reinforcementCommand(p,q,t,car.policeReleased);
  if(command.released&&!car.policeReleased){car.policeReleased=true;car.parked=false;car.policeReleaseTime=t;}
  if(!command.merged)return {index:progress,target:command.target,speed:command.speed};
  car.policeMerged=true;car.policeMergeTime=t;
  let best=path.index,dist=Infinity;for(let i=0;i<route.length;i++){const d=Math.hypot(route[i].x-p.x,route[i].z-p.z);if(d<dist){dist=d;best=i;}}path.index=best;
  return routeMotion(car,route,best,18,0);
 }
 const gap=car.obj.policeGap||8;
 const reference=(leadStart+(finish*1.35-leadStart)*clamp(t/21.8,0,1))/1.35;
 const tracking=fug?reference-progress:quarry.arcade.index-progress-gap/1.35;
 let speed=clamp((fug?25:22)+tracking*.95,fug?16:10,fug?34:35);
 if(!fug&&quarry.arcade.index-progress<gap/1.35)speed=Math.min(speed,Math.max(8,quarry.speed*.86));
 const jumpApproach=p.z>69&&p.x>83&&p.x<119;
 if(jumpApproach&&fug)speed=Math.max(speed,25);
 if(jumpApproach&&!fug)speed=Math.min(speed,30);
 if(!fug&&car.obj.policeReinforcement&&car.policeMerged)car.obj.policeGap=6;
 let shift=fug?Math.sin(t*.95)*.45:Math.sin(t*.65+car.phase)*.75;
 if(Math.abs(p.z)<10&&p.x>-18&&p.x<19)shift=fug?0:(car.obj.lane>0?-1.65:1.65);
 if(p.x>86&&p.z>65)shift=fug?0:(car.obj.lane>0?1:-1);
 if(!fug&&p.x>88&&p.x<137&&p.z>65&&car.obj.lane>0)shift=3.5;
 const action=fug?policeActionLine(p,car.speed):null;
 if(action){shift=action.shift;speed=Math.min(35,speed+action.boost);}
 else if(fug&&p.z<-72&&p.x<-65)shift=1.1*Math.sin((p.x+120)*.12);
 const pressure=fug?null:policeOpeningPressure(car,quarry,p);
 if(pressure){speed+=(pressure.speed-speed)*pressure.weight;shift+=(pressure.shift-shift)*pressure.weight;}
 const approach=fug?null:approachPressure(car,quarry,p,progress),industrial=fug?null:industrialPressure(car,quarry,p);
 if(approach)speed+=(approach.speed-speed)*approach.weight;
 if(industrial)speed+=(industrial.speed-speed)*industrial.weight;
 const avoidance=trafficAvoidance(car,cars);
 if(!jumpApproach){shift+=avoidance.shift;speed*=avoidance.factor;}
 const at=route[progress],deviation=Math.hypot(p.x-at.x,p.z-at.z),recovering=deviation>(action&&!car.hitStun?5.1:4.5);
 if(recovering){shift=-(car.obj.lane||0);speed=Math.min(speed,12);}
 shift=clamp(shift,-3.0-(car.obj.lane||0),3.0-(car.obj.lane||0));
 const motion=routeMotion(car,route,progress,speed,shift);
 const corner=car.cornerLoad||0;car.policeSlide=recovering||car.reverse>0?0:(action?.slide||0);car.policeDrift=recovering?0:clamp((corner-.12)*1.15,0,1);car.driftIntent=car.policeDrift>.45||car.policeSlide>.28;
 if(recovering){const next=route[Math.min(motion.index+4,route.length-1)];motion.target={x:next.x,z:next.z};motion.speed=Math.min(motion.speed,14);}
 if(jumpApproach&&fug){car.policeDrift=0;car.policeSlide=0;car.driftIntent=false;motion.target.z=78;}
 if(p.z>69&&p.x>135){
  if(p.x<151)motion.speed=Math.min(motion.speed,Math.sqrt(Math.max(0,176-p.x)*6));
  else{motion.speed=runoutSpeed(p.x,t,motion.speed,fug,recovering);if(!fug&&!recovering)motion.speed=Math.min(Math.sqrt(Math.max(0,policeRunout-p.x)*10),escapePressure(car,quarry,p,motion.speed));}
 }
 if(motion.index>=route.length-3)motion.speed=0;
 return motion;
}

export function escapePressure(car,quarry,p,requested){
 if(car.obj.role!=='pursuer'||car.disabled||car.parked||car.hitStun>0||car.reverse>0||car.crashMode)return requested;
 const q=quarry.body.translation(),gap=q.x-p.x;
 if(p.x<=160||q.x<=168||Math.abs(p.z-78)>6||Math.abs(q.z-78)>6||gap<=9||gap>=55)return requested;
 const v=quarry.body.linvel(),own=car.body.linvel(),closing=own.x-v.x;
 const weight=clamp((p.x-160)/8,0,1)*clamp((55-gap)/10,0,1)*clamp((gap-9)/6,0,1);
 const pace=clamp(v.x+(gap-11)*.8-closing*.3,10,32);
 return requested+(Math.max(requested,pace)-requested)*weight;
}
export function runoutSpeed(x,t,requested,fug,recovering=false){
 const beforeExit=x<160,remaining=Math.max(0,(beforeExit?212:policeRunout)-x),seconds=Math.max(.65,policeDuration-t);
 if(beforeExit){const target=clamp((remaining-4)/seconds,10,22);return Math.min(Math.sqrt(remaining*8),recovering?Math.min(requested,12):fug?target:Math.min(Math.max(requested,12),24));}
 const blend=clamp((x-160)/8,0,1);
 const target=clamp((remaining-5)/(seconds+.7),15,25);
 const safety=Math.sqrt(remaining*10);
 const previous=clamp((212-x-4)/seconds,10,22);
 return Math.min(safety,recovering?Math.min(requested,12):fug?previous+(target-previous)*blend:Math.min(Math.max(requested,12),24+blend*4));
}
