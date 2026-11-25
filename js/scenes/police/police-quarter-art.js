import {THREE as T,box,bake,label} from '../../core/util.js';
export function quarterRoof(g,type,h,variant){
 const palette=['#c18160','#ad6e51','#d29972'];
 if(type==='market'){
  for(const z of [-1,1]){const m=box(g,11.5,.14,4.4,0,h+.69,z*2.2,palette[variant%3]);m.rotation.x=z*.055;}
  for(let i=0;i<12;i++)for(const z of [-1,1])box(g,.075,.055,4.2,-5.3+i*.96,h+.79,z*2.2,'#ebba90');
  box(g,11.7,.18,.3,0,h+.84,0,'#b76e50');
 }else if(type==='hotel'){
  box(g,7.1,.14,4.6,0,h+.48,2.8,'#b9d7cb');
  box(g,5.5,.08,3.1,0,h+.57,2.8,'#589f9d');
  for(const z of [1.02,4.58])box(g,6.9,.16,.23,0,h+.62,z,'#e6e1ca');
  for(const x of [-3.42,3.42])box(g,.23,.16,3.8,x,h+.62,2.8,'#e6e1ca');
  for(const x of [-4.9,4.9]){box(g,1.3,.22,4.1,x,h+.59,2.8,'#c8b89a');for(let i=0;i<4;i++)box(g,1.08,.09,.85,x,h+.74,1.2+i*.95,'#708e67');}
 }else{
  for(let i=0;i<4;i++){const x=-4.5+i*3;box(g,2.35,.13,4.3,x,h+.51,3.2,'#253e50');for(let j=0;j<3;j++)box(g,.028,.03,4.1,x-.78+j*.78,h+.59,3.2,'#91aeb4');for(let j=0;j<4;j++)box(g,2.28,.03,.028,x,h+.59,1.6+j*1.05,'#91aeb4');}
 }
}
export function quarterFacade(g,type,h,variant){
 const colors={market:['#b9684b','#64847b','#c69a51'],hotel:['#4f8589','#729c92','#a18b6c'],loft:['#596f78','#75564b','#647e7b'],garage:['#d6aa55','#446f76','#b77559']};
 const c=colors[type][variant%3];
 for(const s of [-1,1]){
  for(const x of [-6.55,6.55])box(g,.48,h-1.3,.12,x,h/2, s*6.63,c);
  for(const x of [-2.5,2.5])box(g,.18,2.8,.1,x,1.65,s*6.63,c);
  if(type==='market'||type==='hotel')for(let y=4.8;y<h-1;y+=3.2)for(const x of [-5.5,-1.85,1.8,5.45]){
   for(const dx of [-1.24,1.24]){box(g,.35,1.68,.10,x+dx,y,s*6.72,c);for(let k=0;k<5;k++)box(g,.34,.033,.12,x+dx,y-.64+k*.32,s*6.77,'#c8c3aa');}
  }
 }
}
export function quarterMarkers(){
 const g=new T.Group();
 const marks=[
  {x:-108,z:-94,name:'01  MERCATO',color:'#b36e50'},
  {x:-32,z:-34,name:'02  RIVIERA PARK',color:'#65866b'},
  {x:17,z:10,name:'03  GRAND AVENUE',color:'#4c7980'},
  {x:38,z:48,name:'04  NORTH WORKS',color:'#a4824c'}
 ];
 for(const a of marks){
  box(g,4.8,.32,1.0,a.x,.35,a.z,'#c5bead');
  box(g,4.5,.14,.78,a.x,.59,a.z,a.color);
  for(const x of [-1.85,1.85])box(g,.16,2.5,.16,a.x+x,1.65,a.z,'#62716e');
  box(g,4.5,1.25,.22,a.x,2.55,a.z,a.color);
  for(const s of [-1,1]){const m=label(g,a.name,4.3,1.03,a.x,2.55,a.z+s*.125,a.color,'#fff2d4');if(s<0)m.rotation.y=Math.PI;}
  for(let i=0;i<5;i++)box(g,.56,.025,.68,a.x-1.65+i*.82,.235,a.z+1.25,i%2?a.color:'#e1d5bb');
 }
 bake(g);return g;
}
