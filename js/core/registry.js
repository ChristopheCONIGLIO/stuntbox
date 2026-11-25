import {cityLandmark,streetAccents} from '../scenes/police/police-look.js';
import {districtBuilding,districtDetails} from '../scenes/police/police-districts.js';
import {quarterMarkers} from '../scenes/police/police-quarter-art.js';
import {exitGantry,exitPanel,exitMarkings,exitScenery} from '../scenes/police/police-finale.js';
import {policeStreets} from '../scenes/police/police-one.js';
import {oddModel} from '../world/odd-models.js';
import {samples} from '../physics/arcade-drive.js';
import {trainingRoad,tracks} from './practice.js';
import {registerCanyon} from '../scenes/canyon/canyon-assets.js';
import {marseilleVehicle,marseilleVehicles} from '../scenes/marseille/marseille-vehicles.js';
import {sign,freewaySign,excavator,parking} from '../world/street-assets.js';
import {THREE as T,random,box,label} from './util.js';
import {vehicleModel,building,tree,bench} from '../vehicles/models.js';
import {palm,urbanBuilding,lifeguard,bridge} from '../world/architecture.js';
import {premiumBuilding,railSegment,parkFountain} from '../world/city.js';
import {addRoadProp} from '../world/props.js';
import {ring,ramp} from '../world/stunts.js';
export const assets=new Map();
const noop={fixedBox(){},fixedTrimesh(){},prop(){}};
function add(id,name,group,create,behavior='static',metadata={}){
 assets.set(id,{id,name,group,create,behavior,...metadata});
}
registerCanyon(add);
add('police-streets','Police#1 streets','Infrastructure',policeStreets);
add('police-exit-gantry','Riviera Exit 01 gantry','Infrastructure',exitGantry);
add('police-exit-panel','Light roadblock panel','Obstacles',exitPanel,'breakable',{mass:18});
add('police-exit-markings','Riviera exit markings','Infrastructure',exitMarkings);
add('police-exit-scenery','Riviera exit scenery','Infrastructure',exitScenery);
add('police-district-details','Police#1 district details','Infrastructure',districtDetails);
add('police-quarter-markers','Riviera district signage','Infrastructure',quarterMarkers);
add('police-street-accents','Police#1 street markings','Infrastructure',streetAccents);
add('police-market-hall','Riviera covered market','Buildings',()=>cityLandmark('market'),'static',{policeBuilding:true});
add('police-freight-hall','Riviera Freight warehouse','Buildings',()=>cityLandmark('freight'),'static',{policeBuilding:true});
for(const [type,name] of [['market','Market hall'],['loft','Industrial workshop'],['hotel','Riviera Hotel'],['garage','City garage']])for(let i=0;i<3;i++)add('police-'+type+'-'+i,name+' '+(i+1),'Buildings',()=>districtBuilding(type,i),'static',{policeBuilding:true});
for(const entry of marseilleVehicles){
 add(entry.id,entry.name,'Vehicles',color=>marseilleVehicle(entry.id,color||entry.color),'vehicle',{kind:entry.kind,style:entry.style});
}
add('speedway-wall','Outer wall','Infrastructure',(color,obj)=>{
 const gates=obj?.gates||tracks[0].gates,points=samples(gates,true),geo=new T.BufferGeometry(),pos=[],colors=[];
 const dir=Math.sign(gates.reduce((area,a,i)=>{const b=gates[(i+1)%gates.length];return area+a[0]*b[2]-a[2]*b[0];},0))||1;
 const n=points.length-1;
 const verts=points.map((p,i)=>{const d=points[(i+1)%n].clone().sub(points[(i+n-1)%n]).normalize();
  return [0,.7].flatMap(k=>[0,.86].map(y=>[p.x+d.z*dir*((obj?.width||15)/2+1+k),y,p.z-d.x*dir*((obj?.width||15)/2+1+k)]));});
 for(let i=0;i<n;i++){const a=verts[i],b=verts[i+1];
  for(const [lo,hi,shade] of [[0,1,i%16<4?'#d57942':'#deddd0'],[1,3,'#f7e8c8'],[3,2,'#a9a397']]){const c=new T.Color(shade);for(const p of [a[lo],b[lo],b[hi],a[lo],b[hi],a[hi]]){pos.push(...p);colors.push(c.r,c.g,c.b);}}
 }
 geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide}));mesh.castShadow=mesh.receiveShadow=true;return mesh;
});
add('practice-road','Practice track','Race track',trainingRoad,'static');
const root=()=>new T.Group();
function fromWorld(make){
 const group=root();make({group,buildings:[],props:[],rng:random(17)},noop);return group;
}
for(const [id,name,kind,style] of [
 ['muscle','Muscle car GT','sport','muscle'],['sport','Sports coupe','sport',''],['sedan','Sedan','civil',''],
 ['wagon','Station wagon','civil','wagon'],['hatch','Hatchback','civil','hatch'],['patrol','Patrol car','police',''],
 ['swat','Tactical van','swat',''],['truck','Truck','truck','']]){
 add(id,name,'Vehicles',color=>vehicleModel(kind,color||'#c44336',style),'vehicle',{kind,style});
}
const names=['Corner Café','Mint Market','Pizza Club','Garage','Pine House','Bakery','Workshop 05'];
names.forEach((name,i)=>add('block'+i,name,'Buildings',()=>building(root(),noop,0,0,9,8,5.5,['#ca9b87','#8bb8aa','#dbbc94'][i%3],i,random(17)),'breakable'));
for(const [style,name] of [['deco','Art Deco hotel'],['brick','Brick building'],['tower','Office tower']]){
 add(style,name,'Buildings',()=>fromWorld((w,p)=>urbanBuilding(w,p,0,0,12,10,style==='tower'?34:14,style,random(17))));
}
for(const [style,name] of [['tower','Skyscraper'],['brick','Urban residence']]){
 add('city-'+style,name,'Buildings',()=>fromWorld((w,p)=>premiumBuilding(w,p,0,0,16,14,style==='tower'?36:15,style,random(12))));
}
for(const [id,name] of Object.entries({bin:'Trash bin',pole:'Bollard',cone:'Cone',barrier:'Construction barrier',streetlight:'Streetlight',table:'Outdoor table',chair:'Chair',bench:'Street bench',shard:'Debris'})){
 add(id,name,'Street furniture',()=>{const g=root(),m=addRoadProp({group:g,props:[]},noop,0,0,id).mesh;m.position.y=-new T.Box3().setFromObject(m).min.y;return g;},['barrier','streetlight','bench'].includes(id)?'breakable':'dynamic');
}
add('parkbench','Park bench','Street furniture',()=>bench(root(),0,0),'breakable');
add('rail','Fence','Street furniture',()=>fromWorld((w,p)=>railSegment(w,p,{x:0,z:-4},{x:0,z:4})),'breakable');
add('fountain','Fountain','Street furniture',()=>fromWorld((w,p)=>parkFountain(w,p,0,0,4)));
add('hut','Lifeguard station','Buildings',()=>lifeguard(root(),0,0),'breakable');
for(let i=0;i<2;i++)add('tree'+i,['Park tree','Conifer'][i],'Vegetation',()=>tree(root(),0,0,1,i));
add('palm','Palm tree','Vegetation',()=>palm(root(),0,0));
add('bridge','Road bridge','Infrastructure',()=>fromWorld((w,p)=>bridge(w,p,{x:0,z:-16},{x:0,z:16},9)));
add('ramp','Stunt ramp','Infrastructure',()=>{const g=root();ramp(g,noop,{width:9.2,outX:0,outZ:-1});g.children[0].position.z=21.25;return g;});
add('fire','Ring of fire','Infrastructure',()=>{const g=root();ring(g,noop);return g;});
function road(type){
 const g=root(),width=type==='highway'?18:8;
 function strip(x,z,length,angle){
  const s=root();g.add(s);s.position.set(x,0,z);s.rotation.y=angle;
  box(s,width,.10,length,0,-.035,0,'#5b666b');
  for(let t=-length/2+1;t<length/2;t+=5)box(s,.16,.012,Math.min(2,length),0,.022,t,'#f2ead2');
 }
 if(type==='bend'){
  const shape=new T.Shape();shape.absarc(0,0,16,0,Math.PI/2,false);shape.absarc(0,0,8,Math.PI/2,0,true);shape.closePath();
  const surface=new T.Mesh(new T.ShapeGeometry(shape,28),new T.MeshStandardMaterial({color:'#5b666b',side:T.DoubleSide}));surface.rotation.x=-Math.PI/2;surface.position.set(-8,.02,8);g.add(surface);
  for(let i=1;i<12;i+=2){const a=i*Math.PI/24;box(g,.14,.02,1.4,-8+12*Math.cos(a),.035,8-12*Math.sin(a),'#eee5c8').rotation.y=a;}
 }else{strip(0,0,20,0);if(type==='cross')strip(0,.001,20,Math.PI/2);}
 return g;
}
for(const [id,name] of Object.entries({straight:'Straight road',bend:'90° turn',cross:'Intersection',highway:'Highway'}))add(id,name,'Infrastructure',()=>road(id));
add('sign','Road sign','Street furniture',()=>{const g=root();box(g,.16,3,.16,0,1.5,0,'#68767c');box(g,3,1,.16,0,2.7,0,'#267573');label(g,'EXIT →',2.8,.75,0,2.7,.09);return g;},'breakable');
add('crate','Wooden crate','Street furniture',()=>{const g=root();box(g,1.5,1.4,1.5,0,.7,0,'#aa8158');for(const x of [-.55,.55])box(g,.16,1.44,1.53,x,.7,0,'#d0ab7f');return g;},'breakable');
add('excavator','Excavator','Construction',excavator);
add('roadworks','Construction sign','Construction',()=>sign(root(),'ROAD','WORKS',0,0,{warning:true}).group,'breakable');
add('overhead','Highway sign','Infrastructure',()=>freewaySign(root(),'HIGHWAY','NORTH',0,0),'breakable');
add('parking','Neighborhood parking','Infrastructure',()=>{const g=root();parking(g,0,0);g.children.forEach(m=>m.position.y-=.24);return g;});
add('ascent','Access ramp','Infrastructure',()=>{
 const g=root(),vertices=[],idx=[];for(let i=0;i<=20;i++){const t=i/20,y=4*t*t*(3-2*t)-.025,z=-12+24*t;vertices.push(-4,y,z,4,y,z);if(i){const a=(i-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}if(i%4===2){const stripe=box(g,.15,.018,1.2,0,y+.025,z,'#ece6c7');stripe.rotation.x=-Math.atan(t*(1-t));}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(idx);geo.computeVertexNormals();const deck=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#53616a',side:T.DoubleSide}));deck.receiveShadow=deck.castShadow=true;g.add(deck);return g;
});

for(const [type,name,mass] of [['tire','Tire',28],['drum','Barrel',55],['cart','Shopping cart',85],['loo','Portable toilet',175],['block','Giant cube',680]]){
 add('obstacle-'+type,name,'Obstacles',()=>{
  const g=root(),m=oddModel(type,0);g.add(m);m.position.y=-new T.Box3().setFromObject(m).min.y;return g;
 },'dynamic',{mass,shape:type});
}
const member=(asset,p,r=[0,0,0])=>({asset,p,r,s:[1,1,1],behavior:'dynamic'});
function groupAsset(id,name,members){
 add(id,name,'Obstacle groups',()=>{
  const g=root();for(const item of members)g.add(instance(item));return g;
 },'dynamic',{members});
}
for(const [type,name,spacing,height] of [['drum','Barrel pyramid',1.08,1.46],['cart','Shopping cart pile',1.25,1.17]]){
 const members=[];
 for(let row=0;row<3;row++)for(let col=0;col<3-row;col++)members.push(member('obstacle-'+type,[(col-(2-row)/2)*spacing,row*height,0]));
 groupAsset('group-'+type,name,members);
}
const tireStack=[];
for(let row=0;row<3;row++){
 for(let col=0;col<3-row;col++){
  tireStack.push(member('obstacle-tire',[(col-(2-row)/2)*1.27,.252+row*.506,-.63],[Math.PI/2,0,0]));
 }
}
groupAsset('group-tire','Tire pyramid',tireStack);
groupAsset('group-loo','Portable toilet stack',Array.from({length:6},(_,i)=>member('obstacle-loo',[(i%3-1)*1.45,Math.floor(i/3)*2.45,0])));
groupAsset('group-block','Cube wall · 5 × 3',Array.from({length:15},(_,i)=>member('obstacle-block',[(i%5-2)*1.94,Math.floor(i/5)*1.94,0])));
groupAsset('group-barrier','Row of barriers',Array.from({length:5},(_,i)=>member('barrier',[(i-2)*1.75,0,0])));
add('police-beacon-patrol','Roadblock patrol · flashing lights','Obstacles',()=>{const g=vehicleModel('police');for(const l of g.userData.lamps){l.light?.removeFromParent();l.pool?.removeFromParent();l.sprite.scale.set(2.7,2.7,1);}return g;},'dynamic',{mass:1450});
add('obstacle-patrol','Roadblock car','Obstacles',()=>{
 const g=vehicleModel('police');for(const lamp of g.userData.lamps)for(const part of [lamp.light,lamp.sprite,lamp.core,lamp.pool])part?.removeFromParent();return g;
},'dynamic',{mass:1450});
groupAsset('group-roadblock','Police roadblock',[
 member('obstacle-patrol',[-6,0,0],[0,Math.PI/2,0]),member('barrier',[-1.1,0,0]),member('obstacle-patrol',[6,0,0],[0,-Math.PI/2,0])
]);
export const uid=()=>globalThis.crypto?.randomUUID?.()||'obj-'+Date.now().toString(36)+Math.random().toString(36).slice(2);
export function instance(item){
 const m=assets.get(item.asset).create(item.color,item);m.position.fromArray(item.p);m.rotation.set(...item.r);m.scale.fromArray(item.s);m.userData.item=item;return m;
}

export const placeableProp=a=>!!a&&!a.members&&(['dynamic','breakable'].includes(a.behavior)||a.behavior==='static'&&['Buildings','Street furniture','Vegetation','Construction'].includes(a.group));
export const propBehavior=o=>o.behavior==='static'?'static':'dynamic';
export const validPropMass=n=>typeof n==='number'&&Number.isFinite(n)&&n>=.1&&n<=1e8;
const defaultMassCache=new Map();
export function propMass(o){
 if(validPropMass(o.mass))return o.mass;
 const a=assets.get(o.asset),scale=o.s.reduce((n,v)=>n*v,1);
 if(a.members)return a.members.reduce((n,m)=>n+propMass({...m,s:m.s.map((v,i)=>v*o.s[i])}),0);
 if(a.mass)return a.mass*scale;
 const key=o.asset+':'+o.s.join(',');
 if(!defaultMassCache.has(key)){
  const mesh=instance({...o,p:[0,0,0],r:[0,0,0]});
  const size=new T.Box3().setFromObject(mesh).getSize(new T.Vector3());
  const mass=16*size.toArray().reduce((n,v)=>n*Math.max(.08,v),1);
  defaultMassCache.set(key,Math.max(.1,mass));
 }
 return defaultMassCache.get(key);
}
