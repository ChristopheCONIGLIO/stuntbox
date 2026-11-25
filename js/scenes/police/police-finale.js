import {THREE as T,box,bake,label,clamp} from '../../core/util.js';
export const exitX=160;
export function exitGantry(){
 const g=new T.Group();
 for(const z of [-8.9,8.9]){
  box(g,2.4,.55,2.4,0,.275,z,'#c9c4b6');
  box(g,.76,8.0,.76,0,4.25,z,'#566b70');
  box(g,1.1,.45,1.1,0,8.2,z,'#8e9b98');
  for(let i=0;i<5;i++)box(g,.8,.3,.82,0,.95+i*.57,z,i%2?'#e3c17b':'#384b50');
 }
 box(g,.85,1.1,19.2,0,8.65,0,'#53666c');
 box(g,1.4,.22,19.2,0,9.29,0,'#b9c4bd');
 for(const z of [-5,5]){
  box(g,.18,2.1,5.8,-.55,7.55,z,'#234e58');
  const sign=label(g,z<0?'RIVIERA':'EXIT 01',5.45,1.45,-.67,7.57,z,'#234e58','#f4efda');sign.rotation.y=-Math.PI/2;
 }
 for(const z of [-2.4,2.4]){box(g,.35,.27,.75,-.65,7.0,z,'#e8b55b');}
 bake(g);return g;
}
export function exitPanel(){
 const g=new T.Group();
 box(g,.17,1.18,2.35,0,.85,0,'#e5d9b9');
 for(const face of [-1,1])for(let i=0;i<4;i++){const stripe=box(g,.022,.16,.62,face*.095,.65+(i%2)*.35,-.81+i*.54,'#d36143');stripe.rotation.x=face*.55;}
 for(const z of [-1.08,1.08])box(g,.21,1.24,.10,0,.85,z,'#596566');
 box(g,.21,.09,2.38,0,1.46,0,'#777e77');
 for(const z of [-.95,.95])box(g,.52,.18,.48,0,.1,z,'#566065');
 bake(g);return g;
}
export function exitScenery(){
 const g=new T.Group();
 for(const z of [-1,1]){
  for(let i=0;i<9;i++){const x=96+i*3.1,zz=78+z*8.05;box(g,2.85,.32,.28,x,.36,zz,'#8a9997');box(g,.17,.69,.22,x,.36,zz,'#66787a');box(g,.42,.12,.32,x,.49,zz,'#e4c37a');}
  for(let i=0;i<6;i++){const x=123+i*4.5,zz=78+z*11.3;box(g,2.8,.12,2.5,x,.08,zz,'#c4bca8');box(g,2.5,.48,2.1,x,.38,zz,'#9caa8c');for(let k=0;k<3;k++)box(g,.45,.38,.4,x-0.65+k*.65,.78,zz,['#718b64','#8fa67c','#748f6a'][k]);}
  for(const x of [101,119,140,157]){const zz=78+z*8.2;box(g,.18,.68,.18,x,.35,zz,'#5b6e70');box(g,.23,.24,.23,x,.78,zz,'#e7c37f',{emissive:'#e7c37f',emissiveIntensity:.65});}
 }
 for(const x of [103,105,107])for(const z of [-1,1]){const zz=78+z*4.3;box(g,1.15,.018,.22,x,.073,zz,'#e7ba65');}
 runoutScenery(g);
 const sign=label(g,'RIVIERA EXPRESS',9.6,1.4,138,2.5,89.4,'#355b62','#f6e8cb');sign.rotation.y=Math.PI;
 box(g,.22,2.4,.22,134,1.2,89.4,'#647675');box(g,.22,2.4,.22,142,1.2,89.4,'#647675');
 bake(g,m=>!!m.material?.emissiveIntensity&&m.material.emissive?.getHex()!==0);return g;
}
export function exitMarkings(){
 const g=new T.Group();
 for(let i=0;i<9;i++)box(g,1.3,.014,.7,exitX,.069,78-5.2+i*1.3,'#e4d9b9');
 for(const z of [71,85])for(let x=145;x<170;x+=3)box(g,1.6,.017,.17,x,.067,z,'#e0ca87');
 bake(g);return g;
}
export function finaleState(pos,velocity,disabled,metrics){
 if(disabled)return 'wrecked';
 if(pos.x>=exitX&&Math.abs(pos.z-78)<7)return 'escaped';
 if(metrics?.arrestTicks>=120)return 'captured';
 return 'unfinished';
}
export function finaleCamera(pos){
 const approach=clamp((pos.x-88)/23,0,1)*clamp((pos.z-65)/9,0,1);
 const exit=clamp((pos.x-139)/20,0,1)*clamp((pos.z-65)/9,0,1);
 return {approach,exit};
}

export function runoutScenery(g){
 for(const side of [-1,1]){
  const edge=78+side*9.6;
  for(let x=173;x<=253;x+=5){
   box(g,4.7,.44,.30,x,.57,edge,'#8a9b9b');
   box(g,.22,.84,.26,x-2.35,.42,edge,'#566b70');
   box(g,.44,.16,.32,x-2.35,.73,edge,'#e8b966');
  }
  box(g,88,.13,7,214,.065,78+side*13.8,'#d7cdb8');
  for(const x of [177,190,203,216,229,242,255]){
   const z=78+side*15;
   box(g,6,.25,3.2,x,.25,z,'#b9af99');
   box(g,5.7,.21,2.9,x,.48,z,'#829774');
   for(const dx of [-1.65,0,1.65])box(g,1.15,.48,1.18,x+dx,.82,z,'#658764');
  }
 }
 for(const x of [178,192,206,220,234,248]){
  for(const side of [-1,1]){
   const z=78+side*8.65;
   box(g,.82,.013,.14,x,.055,z-side*1.5,'#e5c577');
   box(g,.82,.013,.14,x+.9,.055,z-side*1.5,'#e5c577');
  }
 }
}
