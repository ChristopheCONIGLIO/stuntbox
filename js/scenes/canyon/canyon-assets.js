import {THREE as T,box,cylinder,material,random} from '../../core/util.js';
const group=()=>new T.Group();
function mesh(g,geo,color,extra={}){
 const m=new T.Mesh(geo,material(color,extra));m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
function surface(g,positions,colors,indices){
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(indices)geo.setIndex(indices);geo.computeVertexNormals();
 return mesh(g,geo,'#ffffff',{vertexColors:true,side:T.DoubleSide,roughness:.9});
}
export const knots=[[-28,-25],[-29,3],[-22,25],[-1,31],[15,23],[27,24],[37,11],[31,-2],[34,-21],[17,-31],[-5,-24]];
const curve=new T.CatmullRomCurve3(knots.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
export const lane=(t,offset=0)=>{t=(t%1+1)%1;const p=curve.getPoint(t),d=curve.getTangent(t);return p.add(new T.Vector3(d.z,0,-d.x).multiplyScalar(offset));};
function ribbon(g,from,to,left,right,y,colorAt,steps){
 const p=[],c=[];for(let i=0;i<steps;i++){
  const a=from+(to-from)*i/steps,b=from+(to-from)*(i+1)/steps;
  const color=new T.Color(colorAt(i));for(const [t,x] of [[a,left],[b,left],[b,right],[a,left],[b,right],[a,right]]){
   const v=lane(t,x);p.push(v.x,y,v.z);c.push(color.r,color.g,color.b);
  }
 }return surface(g,p,c);
}
function track(i){
 const g=group(),n=knots.length,a=i/n,b=(i+1)/n,origin=lane(a),layout=group();g.add(layout);layout.position.copy(origin).multiplyScalar(-1);
 ribbon(layout,a,b,-4.95,4.95,.012,()=>'#e5c39b',20);
 const road=ribbon(layout,a,b,-4.25,4.25,.034,j=>new T.Color('#2b3046').multiplyScalar(.965+.03*Math.sin((i*20+j)*.53)),20);road.userData.rideSurface=true;
 road.material=road.material.clone();
 road.material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vAsphaltPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAsphaltPosition=position;');
  shader.fragmentShader='varying vec3 vAsphaltPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float fleck=fract(sin(dot(vAsphaltPosition.xz,vec2(91.17,175.81)))*43758.5453);
  float cloud=sin(vAsphaltPosition.x*.44+sin(vAsphaltPosition.z*.37))*.5+.5;
  diffuseColor.rgb*=.984+(fleck-.5)*.046+(cloud-.5)*.039;`);
 };
 for(const side of [-1,1]){
  ribbon(layout,a,b,side*3.89,side*4.0,.055,()=>'#fff8e8',20);
  ribbon(layout,a,b,side*4.05,side*4.67,.065,j=>j%2?'#fff6e9':'#ed3447',20);
 }
 if(i===0)for(let j=0;j<2;j++)for(let k=0;k<14;k++){
  const m=box(layout,.56,.015,.55,origin.x+(k-6.5)*.56,.069,origin.z+.55*j,(j+k)%2?'#202935':'#fff5dc');
  m.castShadow=false;
 }
 return g;
}
export const jumps=[
 ['hop','Speed bump · 0.9 m',7,5,.9,t=>Math.sin(Math.PI*t)**2],
 ['wedge','Short ramp · 2 m',9,6,2,t=>t],
 ['kicker','Curved kicker · 3.4 m',14,6.8,3.4,t=>t**1.55],
 ['tabletop','Tabletop jump · 3 m',24,7,3,t=>Math.min(1,t/.32,(1-t)/.34)],
 ['mega','XL ramp · 5.8 m',22,9,5.8,t=>.35*t+.65*t*t]
];
function jump([id,name,len,w,h,profile]){
 const g=group(),pos=[],colors=[],count=32;
 const y=t=>-.055+h*profile(t),z=t=>(t-.5)*len;
 function quad(a,b,c,d,col){const tint=new T.Color(col);for(const v of [a,b,c,a,c,d]){pos.push(...v);colors.push(tint.r,tint.g,tint.b);}}
 const deckP=[],deckC=[];
 for(let i=0;i<count;i++){
  const a=i/count,b=(i+1)/count,A=y(a),B=y(b);
  const l=[-w/2,A,z(a)],r=[w/2,A,z(a)],L=[-w/2,B,z(b)],R=[w/2,B,z(b)];
  const col=new T.Color('#394854');for(const v of [l,L,R,l,R,r]){deckP.push(...v);deckC.push(col.r,col.g,col.b);}
  for(const s of [-1,1]){const x=s*w/2;quad([x,-.12,z(a)],[x,A,z(a)],[x,B,z(b)],[x,-.12,z(b)],i%8<4?'#d17737':'#b15931');
   quad([x,A+.022,z(a)],[x-s*.22,A+.022,z(a)],[x-s*.22,B+.022,z(b)],[x,B+.022,z(b)],i%8<4?'#ffd57b':'#f9f1d7');}
  if(i===7||i===14||i===21)for(const s of [-1,1]){const t=i/count;const tip=z(t)+.65,base=z(t)-.6;
   quad([0,y(t+.65/len)+.045,tip],[s*w*.30,y(t-.6/len)+.045,base],[s*w*.30,y(t-.85/len)+.045,base-.25],[0,y(t+.40/len)+.045,tip-.25],'#ffca58');}
 }
 quad([-w/2,-.12,z(1)],[-w/2,y(1),z(1)],[w/2,y(1),z(1)],[w/2,-.12,z(1)],'#995237');
 surface(g,pos,colors);surface(g,deckP,deckC).userData.rideSurface=true;return g;
}
function mesa(seed){
 const g=group(),rng=random(seed),p=[],c=[],count=10;
 const radii=Array.from({length:count},()=>.78+rng()*.26);
 const levels=[[0,1.12],[1.1,1.03],[1.65,.9],[3,.84],[3.45,.66],[5,.62],[5.5,.52]];
 const layers=levels.map(([h,r])=>radii.map((rr,i)=>{const a=i*2*Math.PI/count;return [rr*r*4*Math.cos(a)+h*.10,h+(h?(rng()-.5)*.37:0),rr*r*3.2*Math.sin(a)];}));
 const bands=['#deb18b','#f2d6aa','#bd8d76','#f5ddb8','#cfa27d','#f6e7c8'];
 const tri=(a,b,d,color)=>{const co=new T.Color(color).multiplyScalar(.87+rng()*.19);for(const v of [a,b,d]){p.push(...v);c.push(co.r,co.g,co.b);}};
 for(let j=1;j<layers.length;j++)for(let i=0;i<count;i++){const k=(i+1)%count,A=layers[j-1],B=layers[j];tri(A[i],B[i],A[k],bands[j-1]);tri(A[k],B[i],B[k],bands[j-1]);}
 for(let i=0;i<count;i++)tri(layers.at(-1)[i],[.4,5.52,0],layers.at(-1)[(i+1)%count],'#fff0d6');
 surface(g,p,c);return g;
}
function cactus(){const g=group();function stalk(x,h,y,r){const m=cylinder(g,r*.88,r,h,8,x,y,0,'#358c67');mesh(g,new T.IcosahedronGeometry(r,0),'#6bbb79').position.set(x,y+h/2,0);return m;}stalk(0,2,1,.27);for(const s of [-1,1]){stalk(s*.42,.78,.88+s*.18,.15);box(g,.42,.23,.26,s*.25,.58+s*.18,0,'#4a9f72');}return g;}
function tireWall(){const g=group();for(let i=0;i<6;i++)for(let j=0;j<2;j++){const m=mesh(g,new T.TorusGeometry(.39,.17,8,14),i<2?'#d04742':'#303841');m.rotation.x=Math.PI/2;m.position.set((i-2.5)*.99,.16+j*.31,0);}return g;}
function pond(){const g=group(),p=[],c=[],rng=random(42),N=20;const rings=[0,.5,1].map(r=>Array.from({length:N},(_,i)=>{const a=i/N*2*Math.PI;return [Math.cos(a)*6*r*(1+.11*Math.sin(3*a)),.048,Math.sin(a)*4*r];}));for(let k=1;k<3;k++)for(let i=0;i<N;i++){const j=(i+1)%N;for(const vs of [[rings[k-1][i],rings[k][j],rings[k][i]],[rings[k-1][i],rings[k-1][j],rings[k][j]]]){const tint=new T.Color(['#087eb9','#18bbd4','#63e0ea','#109bc1'][Math.floor(rng()*4)]);for(const v of vs){p.push(...v);c.push(tint.r,tint.g,tint.b);}}}surface(g,p,c);return g;}
function racer(color='#13afbd'){
 const g=group(),body=group(),wheels=[];g.add(body);
 const ink='#172939',yellow='#ffc635',red='#f25348';
 function pod(x,y,z,sx,sy,sz,paint){const m=mesh(body,new T.SphereGeometry(1,24,14),paint,{roughness:.31,metalness:.18});m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 box(body,2.08,.22,4.05,0,.43,0,ink);pod(0,.69,.04,1.05,.48,2.17,color);
 for(const s of [-1,1]){pod(s*.85,.80,1.03,.36,.37,1.0,color);pod(s*.87,.80,-1.11,.39,.39,.95,color);
 box(body,.20,.16,2.65,s*1.06,.45,0,yellow);pod(s*.88,.87,1.78,.195,.072,.29,'#f3f8ff');
 box(body,.54,.09,.13,s*.60,.70,-1.92,red);
 box(body,.075,.5,.14,s*.69,1.10,-1.68,ink).rotation.x=-.19;
 for(let j=0;j<3;j++)box(body,.24,.04,.09,s*.86,1.12,-1.20+j*.16,ink);
 }
 pod(0,1.01,-.31,.67,.54,.95,ink);pod(0,1.06,-.35,.63,.52,.89,'#395f77');pod(0,1.49,-.45,.44,.11,.55,color);
 const strip=(x,w,col)=>{for(let i=0;i<10;i++){const z=.52+i*.145,y=.69+.48*Math.sqrt(Math.max(0,1-((z-.04)/2.17)**2-(x/1.05)**2));const m=box(body,w,.015,.155,x,y+.014,z,col);m.rotation.x=Math.atan(.48*(z-.04)/4.71/Math.max(.22,(y-.69)/.48));}};
 strip(-.22,.22,yellow);strip(-.035,.07,red);
 box(body,2.42,.12,.54,0,1.41,-1.8,color);for(const s of [-1,1])box(body,.12,.28,.65,s*1.16,1.43,-1.8,yellow);
 for(const x of [-1.03,1.03])for(const z of [-1.30,1.28]){const pivot=group();g.add(pivot);pivot.position.set(x,.44,z);const wheel=cylinder(pivot,.43,.43,.31,24,0,0,0,'#202532');wheel.rotation.z=Math.PI/2;const sign=Math.sign(x);
 const hub=cylinder(pivot,.295,.295,.33,20,0,0,0,yellow);hub.rotation.z=Math.PI/2;
 for(let k=0;k<6;k++){const a=k*Math.PI/3;const spoke=box(pivot,.026,.09,.34,sign*.177,.105*Math.cos(a),.105*Math.sin(a),ink);spoke.rotation.x=-a;}
 const axle=cylinder(pivot,.11,.11,.36,12,0,0,0,'#cfdae2');axle.rotation.z=Math.PI/2;wheels.push({pivot,wheel,hub,front:z>0});}
 g.userData={chassis:body,wheels,lamps:[],kind:'sport',L:2.24,w:1.2};return g;
}
export function registerCanyon(add){
 add('grid-arch','Starting gantry','Race track',()=>{
  const g=group();for(const x of [-5.6,5.6]){box(g,.72,5.6,.75,x,2.8,0,'#293a44');box(g,1.18,.55,1.4,x,.275,0,'#d9ccb2');box(g,.82,1.65,.8,x,1.1,0,'#e9aa37');}
  box(g,12,1.2,.64,0,5.45,0,'#283441');
  for(const z of [-.33,.33])for(let k=0;k<16;k++)for(let j=0;j<2;j++)box(g,.43,.34,.022,(k-7.5)*.43,5.25+j*.34,z,(k+j)%2?'#fff4d5':'#253443');
  for(const x of [-4.9,4.9])box(g,1.5,.22,.69,x,5.45,0,'#ffbe40');return g;
 });
 add('canyon-pit','Pit pavilion','Race track',()=>{
  const g=group();box(g,7,.3,3.75,0,.15,0,'#b19372');for(const x of [-3,0,3]){box(g,.13,3,.14,x,1.65,1.3,'#43545a');box(g,.13,3,.14,x,1.65,-1.3,'#43545a');}
  for(let j=0;j<4;j++){box(g,6.6,.3,.7,0,.45+j*.33,1.05-j*.68,'#82644d');box(g,6.65,.12,.73,0,.64+j*.33,1.05-j*.68,'#efd6a5');}
  const roof=box(g,7.6,.19,4.1,0,3.42,0,'#f0e3bf');roof.rotation.x=-.14;box(g,7.6,.32,.13,0,3.7,1.99,'#ad432f');return g;
 });
 add('scree','Sandstone rubble','Canyon',()=>{const g=group(),rng=random(93);for(let i=0;i<7;i++){const a=i*2.4,r=i*.47,m=mesh(g,new T.DodecahedronGeometry(1),i%2?'#e6bf99':'#f3d3a8',{flatShading:true});const s=.43+rng()*.83;m.scale.set(s*1.25,s*.76,s);m.position.set(Math.cos(a)*r,s*.32,Math.sin(a)*r);m.rotation.set(rng(),rng()*4,0);}return g;});
 add('apex-gt','GTR · Prototype','Vehicles',racer,'vehicle',{kind:'sport',style:'gt'});
 jumps.forEach(j=>add('jump-'+j[0],j[1],'Ramps',()=>jump(j),'static',{rideSurface:true}));
 knots.forEach((_,i)=>add('canyon-track-'+i,'Canyon · sector '+String(i+1).padStart(2,'0'),'Race track',()=>track(i),'static',{rideSurface:true}));
 add('mesa','Sandstone mesa','Canyon',()=>mesa(52));add('butte','Rock spire','Canyon',()=>mesa(84));
 add('cactus','Saguaro cactus','Canyon',cactus);add('tirewall','Tire wall','Race track',tireWall);
 add('oasis','Turquoise pool','Canyon',pond);
}
