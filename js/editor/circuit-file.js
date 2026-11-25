import {assets,placeableProp,validPropMass} from '../core/registry.js';
import {tracks} from '../core/practice.js';
export function parseCircuit(text){
 const doc=JSON.parse(text);
 if(!doc||typeof doc!=='object'||Array.isArray(doc))throw Error('The file does not contain a circuit.');
 if(doc.version!==undefined&&![1,2].includes(doc.version))throw Error('Unsupported circuit version.');
 if(!tracks.some(t=>t.id===doc.track))throw Error('Unknown track type.');
 const vector=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(n=>Number.isFinite(n)&&Math.abs(n)<10000))throw Error(name+' is invalid.');return [...v];};
 const points=(list,name)=>{if(!Array.isArray(list)||list.length<2||list.length>256)throw Error(name+': invalid number of points.');return list.map(p=>vector(p,name));};
 const result={version:2,name:String(doc.name||'Imported circuit').slice(0,100),track:doc.track,road:points(doc.road||doc.gates,'Road'),gates:points(doc.gates,'Waypoints')};
 const closed=tracks.find(t=>t.id===doc.track).closed;if(closed&&(result.road.length<3||result.gates.length<3))throw Error('A closed circuit requires at least three points.');
 result.width=doc.width??11.4;if(!Number.isFinite(result.width)||result.width<8||result.width>18)throw Error('Invalid track width.');
 for(const list of ['ramps','obstacles','groups']){
  const values=doc[list]??[];if(!Array.isArray(values)||values.length>120)throw Error('Too many objects in '+list+'.');
  result[list]=values.map((o,i)=>{
   if(!o||!assets.has(o.asset))throw Error('Unknown object in '+list+'.');
   const asset=assets.get(o.asset);
   if(list==='ramps'?!o.asset.startsWith('jump-'):list==='groups'?!asset.members:!placeableProp(asset))throw Error('Incompatible object in '+list+'.');
   const p=vector(o.p,'Position'),r=vector(o.r||[0,0,0],'Orientation'),s=vector(o.s||[1,1,1],'Scale');
   if(s.some(v=>v<.1||v>5))throw Error('Scale out of range.');
   const height=o.height??Math.max(0,p[1]-.06);if(!Number.isFinite(height)||height< -5||height>30)throw Error('Height out of range.');
   if(o.mass!==undefined&&!validPropMass(o.mass))throw Error('Mass out of range.');
   if(o.behavior!==undefined&&!['static','dynamic','breakable'].includes(o.behavior))throw Error('Unknown physics behavior.');
   return {id:list+'-'+i,asset:o.asset,p,r,s,height,behavior:list==='ramps'||o.behavior==='static'?'static':'dynamic',...(list!=='ramps'&&o.mass!==undefined?{mass:o.mass}:{})};
  });
 }
 for(const [key,fallback,min,max] of [['cars',6,1,16],['speed',140,20,260],['laps',3,1,30]]){
  const value=doc[key]??fallback;if(!Number.isFinite(value)||value<min||value>max)throw Error('Invalid setting: '+key);
  result[key]=Math.round(value);
 }
 result.mode=doc.mode??'race';if(!['race','rally','pursuit'].includes(result.mode))throw Error('Unknown mode.');
 if(result.mode==='pursuit'||doc.pursuit!==undefined){
  const config=doc.pursuit;
  if(!config||typeof config!=='object'||!Array.isArray(config.pursuers)||config.pursuers.length<1||config.pursuers.length>8)throw Error('Invalid pursuers.');
  if(assets.get(config.fugitive)?.behavior!=='vehicle'||config.pursuers.some(id=>assets.get(id)?.behavior!=='vehicle'))throw Error('Unknown pursuit vehicle model.');
  result.pursuit={fugitive:config.fugitive,pursuers:[...config.pursuers]};
 }
 const roster=doc.roster??Array.from({length:result.cars},(_,i)=>i%3===2?'sport':'muscle');
 if(!Array.isArray(roster)||roster.length!==result.cars||roster.some(id=>assets.get(id)?.behavior!=='vehicle'))throw Error('Invalid vehicle roster.');
 result.roster=[...roster];
 const bodies=result.groups.reduce((n,o)=>n+assets.get(o.asset).members.length,0)+result.obstacles.length;
 if(bodies>500)throw Error('The circuit exceeds 500 physical obstacles.');
 return result;
}
export function circuitDocument(track,layout,name,settings){
 return {format:'apex-stock-car',version:2,name,track:track.id,...structuredClone(layout),...settings};
}
