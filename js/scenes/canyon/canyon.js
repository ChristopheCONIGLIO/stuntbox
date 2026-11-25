import {tracks,startingGrid} from '../../core/practice.js';
import {blank,heightAt} from '../../world/terrain.js';
import {knots,lane} from './canyon-assets.js';
import {random} from '../../core/util.js';
export const canyonMapId='canyon-map-v1',canyonRaceId='canyon-race-v1';
export function canyon(){
 const map=blank(136,124),rng=random(24),points=Array.from({length:240},(_,i)=>lane(i/240));
 Object.assign(map,{id:canyonMapId,revision:1,name:'Sierra Cobre · Circuit'});
 const t=map.terrain;t.mat.fill(4);t.theme='sierra';
 const distance=(x,z)=>Math.sqrt(Math.min(...points.map(p=>(p.x-x)**2+(p.z-z)**2)));
 for(let z=0;z<=t.nz;z++)for(let x=0;x<=t.nx;x++){
  const X=x*2-t.w/2,Z=z*2-t.d/2,i=z*(t.nx+1)+x;
  const d=distance(X,Z);const edge=Math.min(1,Math.max(0,(d-8)/16)),outer=Math.max(Math.abs(X)/41,Math.abs(Z)/38);
  const ridge=Math.max(0,Math.min(1,(outer-.88)*2.8));t.h[i]=edge*(ridge*(1.5+2.1*(1+Math.sin(X*.18+Z*.115))+.8*Math.cos(Z*.31))+.16*(1+Math.sin(X*.29)*Math.sin(Z*.23)));
 }
 function add(asset,x,z,yaw=0,scale=[1,1,1],y=0){map.objects.push({id:'sc-'+map.objects.length,asset,p:[x,y+heightAt(t,x,z),z],r:[0,yaw,0],s:scale,behavior:'static'});}
 knots.forEach(([x,z],i)=>add('canyon-track-'+i,x,z));
 for(const [x,z,sx,sy,sz] of [[-45,-22,2.4,2.5,2],[-49,-6,2.6,3.5,2.1],[-43,12,1.4,1.6,1.8],[-40,32,2.1,2.1,1.6],[-20,46,2,2,2.3],[0,48,2.5,2.8,1.9],[20,47,1.8,2,1.4],[50,35,1.5,1.6,1.3],[54,10,1.7,2.2,2.1],[53,-16,2.1,2.7,2.1],[43,-42,3,2.5,1.5],[12,-48,2.4,2.7,1.8],[-14,-45,3,2.1,1.8],[-43,-42,2.6,2,2],[-7,2,1.6,1.35,1.6],[-4,10,.95,1.8,1.12]])add('mesa',x,z,rng()*3,[sx,sy,sz],-.12);
 add('oasis',10,4,.15,[1.85,1,1.18],.30);
 const line=lane(0),along=lane(.002);add('grid-arch',line.x,line.z,Math.atan2(along.x-line.x,along.z-line.z));
 for(let i=0;i<2;i++){const t=.018+i*.03,a=lane(t,-8.2),b=lane(t+.001,-8.2);add('canyon-pit',a.x,a.z,Math.atan2(b.x-a.x,b.z-a.z)+Math.PI/2);}
 for(const [x,z,sx,sy,sz] of [[-47,-32,2,1.05,2],[-46,-14,2.4,1.3,3.3],[-47,2,2.1,1.15,2.8],[-32,45,2.9,1.24,2.2],[-10,46,2.2,1.15,2.1],[10,48,2.2,1.2,1.7],[53,-2,2.5,1.5,3.2],[28,-46,2.2,1.3,1.7],[-9,6,1.2,.6,1.5]])add('butte',x,z,rng()*3,[sx,sy,sz],-.85);
 for(let i=0;i<47;i++){const f=rng(),s=rng()<.5?-1:1,p=lane(f,s*(7.6+rng()*8)),size=.36+rng()*.65;if(distance(p.x,p.z)>7.1&&Math.hypot(p.x-10,p.z-4)>11)add('scree',p.x,p.z,rng()*6,[size,size,size],-.12);}
 
 for(let i=0;i<38;i++){const x=(rng()-.5)*106,z=(rng()-.5)*96;if(distance(x,z)<8||Math.hypot(x-10,z-4)<10)continue;
 const s=.61+rng()*.7;add('cactus',x,z,rng()*6,[s,s,s],.12);}
 for(const f of [.13,.15,.60,.62,.72,.74]){const p=lane(f,6.8),q=lane(f+.002,6.8);add('tirewall',p.x,p.z,Math.atan2(q.x-p.x,q.z-p.z)+Math.PI/2);}
 const take=lane(.05),out=lane(.051);add('jump-wedge',take.x,take.z,Math.atan2(out.x-take.x,out.z-take.z),[1.26,.73,1],.04);
 const track=tracks.find(t=>t.id==='canyon'),grid=startingGrid(track,track.gates,3,140,2);
 return {map,scenario:{id:canyonRaceId,version:1,revision:1,mapId:canyonMapId,mapRevision:1,name:'Sierra Cobre · Grand Prix',seed:2046,arcade:grid.arcade,vehicles:grid.vehicles}};
}
