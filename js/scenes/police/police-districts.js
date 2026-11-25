import {THREE as T,box,bake,label} from '../../core/util.js';
import {surfaceFinish} from './police-look.js';
import {parkSurface} from './police-one.js';
const styles={
 market:{wall:'#dcac80',trim:'#f4e2bd',glass:'#416c75',roof:'#b5664b',accent:'#9b5940',sign:'MERCATO',height:10},
 loft:{wall:'#b38470',trim:'#ded1ba',glass:'#345d6b',roof:'#566b73',accent:'#667c80',sign:'NORTH WORKS',height:14},
 hotel:{wall:'#e7dfc7',trim:'#fff0d6',glass:'#4a8387',roof:'#9ab4a6',accent:'#70938a',sign:'HOTEL RIVIERA',height:16},
 garage:{wall:'#91a39e',trim:'#e8d8b6',glass:'#315465',roof:'#52676c',accent:'#d5ac65',sign:'AUTO SERVICE',height:7}
};
export function districtArchitecture(type,variant=0){
 const s=styles[type],h=s.height+(type==='garage'?0:variant%3*2),pieces=[];
 const add=(w,h,d,x,y,z,color,rx=0)=>pieces.push({w,h,d,x,y,z,color,rx});
 const mass=(w,top,d,x,z,bottom=0,color=s.wall)=>add(w,top-bottom,d,x,(top+bottom)/2,z,color);
 const cap=(w,d,x,y,z,color=s.trim)=>add(w,.24,d,x,y+.12,z,color);
 const windows=(w,d,x,z,bottom,top,spacing=3.2)=>{
  for(let y=bottom+1.65;y<top-.9;y+=spacing){
   for(const side of [-1,1]){
    for(let xx=-w/2+1.75;xx<=w/2-1.4;xx+=3.45){
     add(2.02,1.96,.12,x+xx,y,z+side*(d/2+.065),s.trim);
     add(1.72,1.63,.13,x+xx,y,z+side*(d/2+.14),s.glass);
     add(.08,1.63,.04,x+xx,y,z+side*(d/2+.23),s.trim);
    }
    for(let zz=-d/2+1.8;zz<d/2-1.35;zz+=3.8)add(.13,1.68,1.9,x+side*(w/2+.07),y,z+zz,s.glass);
   }
  }
 };
 mass(15,3.7,13,0,0);cap(15.3,13.3,0,3.7,0);
 for(const side of [-1,1])for(const x of [-5,0,5]){
  add(4.05,2.7,.14,x,1.65,side*6.59,s.glass);add(.12,2.7,.18,x,1.65,side*6.72,s.trim);
 }
 if(type==='market'){
  const wing=h-2.3;
  mass(6.9,wing,12.6,-3.95,0,3.94);mass(6.9,h,12.6,3.95,0,3.94);
  windows(6.9,12.6,-3.95,0,3.94,wing);windows(6.9,12.6,3.95,0,3.94,h);
  for(const [x,y] of [[-3.95,wing],[3.95,h]]){
   cap(7.1,12.8,x,y,0,s.trim);
   for(const side of [-1,1])add(7.05,.23,6.7,x,y+.92,side*3.03,s.roof,side*.20);
   add(7.15,.21,.25,x,y+1.6,0,s.accent);
  }
  for(const x of [-5,0,5]){add(4.25,.19,1.7,x,3.3,7.34,s.accent,.12);add(4.25,.17,.16,x,3.13,8.1,s.trim);}
 }else if(type==='hotel'){
  const podium=h-5;
  mass(14.8,podium,12.8,0,0,3.94);windows(14.8,12.8,0,0,3.94,podium);cap(15.1,13.1,0,podium,0);
  mass(10.2,h-2.7,9,-1.8,-1.2,podium+.24);windows(10.2,9,-1.8,-1.2,podium+.24,h-2.7);cap(10.5,9.3,-1.8,h-2.7,-1.2);
  mass(6.4,h,6.2,-2.6,-2.1,h-2.46);cap(6.8,6.6,-2.6,h,-2.1,s.roof);
  for(const y of [podium-3.2,podium]){add(10.8,.20,1.35,0,y,6.92,s.trim);add(10.8,.56,.1,0,y+.38,7.54,s.glass);}
  add(3.5,.11,4.4,4.8,podium+.32,2.6,'#6faeaa');add(3.9,.2,.25,4.8,podium+.43,4.95,s.trim);
  for(const z of [-4,0,4])add(1.0,.45,1.4,6.4,podium+.48,z,'#73936d');
 }else if(type==='loft'){
  const eave=h-2.4;
  mass(14.8,eave,12.8,0,0,3.94);windows(14.8,12.8,0,0,3.94,eave,3.5);
  for(const x of [-4.8,0,4.8]){
   mass(4.5,h-.65,6.0,x,-2.9,eave,s.accent);
   add(4.6,.23,7.1,x,eave+1.48,.8,s.roof,.24);
   add(4.1,1.18,.13,x,h-.89,-5.97,s.glass);
  }
  for(const x of [-6,6])add(.72,eave-3.7,.42,x,(eave+3.7)/2,6.6,s.trim);
  add(1.1,3.6,1.1,-5.9,h+.95,-4.8,'#98634d');
 }else{
  mass(14.8,h-1.5,12.8,0,0,3.94);cap(15,13,0,h-1.5,0,s.roof);
  mass(5,h,7.8,-4.8,-1,h-1.26,s.accent);cap(5.2,8,-4.8,h,-1,s.roof);
  for(const x of [-4,4]){add(5.8,3.25,.22,x,1.78,6.76,s.roof);for(let y=.65;y<3.3;y+=.52)add(5.6,.055,.06,x,y,6.9,'#adb8af');}
  add(13.9,.24,2.2,0,3.65,7.3,s.accent);for(const x of [-6.4,6.4])add(.22,3.4,.22,x,1.75,8.15,s.trim);
  for(const x of [0,4.5])add(3.5,.18,4.1,x,h-1.18,-1.7,'#334f60');
 }
 return {pieces,sign:s.sign};
}
export function districtBuilding(type,variant=0){
 const g=new T.Group(),plan=districtArchitecture(type,variant);
 for(const a of plan.pieces){const m=box(g,a.w,a.h,a.d,a.x,a.y,a.z,a.color);if(a.rx)m.rotation.x=a.rx;}
 label(g,plan.sign,10,.85,0,3.95,6.83,'#334b50','#fff2d7');
 bake(g);return surfaceFinish(g,'building');
}
export function districtDetails(){
 const g=new T.Group();
 for(const [x,z] of [[-123,-84],[-69,-84],[25,0],[75,78]]){
  for(const side of [-1,1]){const zz=z+side*6.7;for(let i=-2;i<=2;i++){box(g,.09,.012,2.2,x+i*4,.055,zz,'#d7d8cd');box(g,3.7,.012,.09,x+i*4,.055,zz+side*1.1,'#d7d8cd');}}
 }
 for(const [x,z] of [[-69,-64],[25,59],[129,59]]){
  for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++)box(g,2.7,.024,2.7,x+i*2.8,.225,z+j*2.8,(i+j)%2?'#c2bba9':'#e1d4ba');
 }
 for(const [x,z] of [[-19,20],[75,-21]]){
  for(let i=0;i<8;i++){const a=i*Math.PI/4,px=x+Math.cos(a)*7,pz=z+Math.sin(a)*7,py=parkSurface(px,pz);box(g,2.4,.16,1.1,px,py+.32,pz,'#e1b69a');box(g,2,.16,.85,px,py+.48,pz,'#9bba85');}
 }
 bake(g);return g;
}
