import {blank} from '../../world/terrain.js';
import {marseilleLane,marseilleWidth,marseilleHeight,marseilleMapId,marseilleGates,marseilleKnots} from './marseille-track.js';

const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function marseilleMap(){
 const map=blank(700,600);
 map.id=marseilleMapId;map.revision=1;map.name='MARSEILLE · Rally & Police Chase';
 const terrain=map.terrain;
 terrain.nx=234;terrain.nz=200;terrain.theme='marseille';
 const {w,d,nx,nz}=terrain;
 const count=(nx+1)*(nz+1);
 terrain.h=new Array(count).fill(0);terrain.mat=new Array(count).fill(2);
 const minDistance=new Float32Array(count).fill(1e6);
 const nearRoute=new Float32Array(count),cellX=w/nx,cellZ=d/nz;
 const N=1500,reach=37;
 for(let i=0;i<N;i++){
  const t=i/N,p=marseilleLane(t),cx=(p.x/w+.5)*nx,cz=(p.z/d+.5)*nz;
  const rx=Math.ceil(reach/cellX),rz=Math.ceil(reach/cellZ);
  for(let row=Math.max(0,Math.floor(cz-rz));row<=Math.min(nz,Math.ceil(cz+rz));row++){
   const z=row*cellZ-d/2,dz=z-p.z;
   for(let col=Math.max(0,Math.floor(cx-rx));col<=Math.min(nx,Math.ceil(cx+rx));col++){
    const x=col*cellX-w/2,dx=x-p.x,q=dx*dx+dz*dz,idx=row*(nx+1)+col;
    if(q<minDistance[idx]){minDistance[idx]=q;nearRoute[idx]=t;}
   }
  }
 }
 for(let iz=0;iz<=nz;iz++){
  const z=iz*cellZ-d/2;
  for(let ix=0;ix<=nx;ix++){
   const x=ix*cellX-w/2,i=iz*(nx+1)+ix,dist=Math.sqrt(minDistance[i]);
   const nw=smooth(70,255,z),east=smooth(105,285,x),west=smooth(155,290,-x);
   const limestone=Math.pow(.5+.5*Math.sin(x*.032+Math.cos(z*.025)*2.5),1.5);
   const pinery=Math.pow(.5+.5*Math.cos(z*.038-x*.025),2.1);
   const hills=(10+14*limestone)*nw+(5+10*pinery)*east+(6+12*limestone)*west;
   const ravine=2.8*Math.sin(x*.045+z*.018)*Math.sin(z*.033);
   const blend=smooth(11,41,dist);
   let height=marseilleHeight(x,z)+(hills+ravine)*blend;
   const coast=smooth(298,326,-x);
   height=height*(1-coast)+(-13.1)*coast;
   const t=nearRoute[i];
   if(t>.855&&t<.957&&dist<66){
    const center=marseilleLane(t),plus=marseilleLane(t,1),minus=marseilleLane(t,-1);
    const sign=plus.x<minus.x?1:-1,toward=sign>0?plus:minus;
    const side=(x-center.x)*(toward.x-center.x)+(z-center.z)*(toward.z-center.z);
    const clearance=side-marseilleWidth(t)/2-2.0;
    if(clearance>0){
     const sector=smooth(.855,.883,t)*(1-smooth(.932,.957,t));
     const chasm=18.5*sector*smooth(0,18,clearance);
     height=Math.max(-13.1,height-chasm);
    }
   }
   terrain.h[i]=Math.round(height*1000)/1000;
   const roadHalf=marseilleWidth(nearRoute[i])*.5;
   if(dist<roadHalf+.6)terrain.mat[i]=0;
   else if(dist<roadHalf+3.4)terrain.mat[i]=5;
   else if(coast>.86)terrain.mat[i]=4;
   else if((z<-144&&x>-170)||(x>132&&z<63))terrain.mat[i]=1;
   else if(nw>.6||west>.62)terrain.mat[i]=4;
   else terrain.mat[i]=2;
  }
 }
 map.objects=[];
 return map;
}
export function marseilleRouteStatistics(){
 const samples=2400;
 let length=0,last=marseilleLane(0);
 for(let i=1;i<=samples;i++){
  const p=marseilleLane(i/samples);
  length+=Math.hypot(p.x-last.x,p.z-last.z);
  last=p;
 }
 let sharp=0;
 for(let i=0;i<marseilleKnots.length;i++){
  const prev=marseilleKnots[(i+marseilleKnots.length-1)%marseilleKnots.length];
  const point=marseilleKnots[i],next=marseilleKnots[(i+1)%marseilleKnots.length];
  const a=[point[0]-prev[0],point[1]-prev[1]],b=[next[0]-point[0],next[1]-point[1]];
  const turn=Math.abs(Math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]));
  if(turn>Math.PI/3)sharp++;
 }
 return {lengthMeters:Math.round(length),strongDirectionChanges:sharp,terrainCells:235*201};
}
