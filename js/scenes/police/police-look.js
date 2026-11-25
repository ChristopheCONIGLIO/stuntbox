import {THREE as T,box,bake,cylinder,random,label} from '../../core/util.js';
export function surfaceFinish(root,kind){
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry.attributes.color||mesh.material.map)return;
  const mat=mesh.material.clone();mesh.material=mat;
  mat.roughness=kind==='street'?.91:.78;
  mat.onBeforeCompile=s=>{
   s.vertexShader='varying vec3 vPolicePos;\nvarying vec3 vPoliceNormal;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPolicePos=position;vPoliceNormal=normal;');
   s.fragmentShader='varying vec3 vPolicePos;\nvarying vec3 vPoliceNormal;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 pp=vPolicePos;
    float grain=fract(sin(dot(floor(pp.xz*48.0)+floor(pp.y*48.0),vec2(127.1,311.7)))*43758.5453)-.5;
    float mottle=sin(pp.x*1.17+sin(pp.z*.73+pp.y*.81))*.5+.5;
    float horizontal=step(.7,abs(normalize(vPoliceNormal).y));
    ${kind==='street'?`
    float dark=1.0-step(.18,max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b));
    float asphalt=dark*horizontal*(1.0-step(.10,abs(pp.y-.038)));
    float tile=horizontal*step(.16,pp.y)*(1.0-step(.27,pp.y));
    vec2 cell=abs(fract(pp.xz/1.5+.5)-.5);
    float joint=smoothstep(.465,.495,max(cell.x,cell.y));
    diffuseColor.rgb*=1.0+asphalt*(grain*.12+(mottle-.5)*.12)+tile*(grain*.045-joint*.11);
    `:`
    float wall=(1.0-horizontal)*step(.17,diffuseColor.r)*step(diffuseColor.b,diffuseColor.r);
    float course=smoothstep(.47,.495,abs(fract(pp.y/.46+.5)-.5));
    diffuseColor.rgb*=1.0+wall*(grain*.045+(mottle-.5)*.065-course*.065);
    diffuseColor.rgb*=1.0+horizontal*(grain*.035+(mottle-.5)*.055);
    `}
   `);
  };
  mat.customProgramCacheKey=()=> 'police-surface-'+kind+'-v1';
 });return root;
}
export function cityLandmark(type){
 const g=new T.Group(),rng=random(type==='market'?31:42);
 if(type==='market'){
  const w=19,d=12;
  box(g,w,.28,d,0,.14,0,'#c8bda5');
  for(const x of [-8,0,8])for(const z of [-5,5]){box(g,.42,4.2,.42,x,2.1,z,'#55736c');box(g,.85,.22,.85,x,.24,z,'#e6d5b9');}
  for(let i=0;i<12;i++){const x=-8.8+i*1.6;const left=box(g,1.62,.18,6.5,x,4.6,-3,'#e5b66e');left.rotation.x=-.21;const right=box(g,1.62,.18,6.5,x,4.6,3,'#d39859');right.rotation.x=.21;}
  box(g,w+.2,.24,.34,0,5.25,0,'#53716a');
  for(const x of [-6,0,6]){box(g,4,.95,2,x,.65,2,'#936b50');box(g,4.2,.14,2.2,x,1.2,2,'#e7cfa0');for(let i=0;i<8;i++){const fruit=new T.Mesh(new T.IcosahedronGeometry(.2,0),new T.MeshStandardMaterial({color:['#de8d41','#b7ac58','#c65c49'][i%3]}));fruit.position.set(x-1.6+i*.44,1.48,2+(rng()-.5));g.add(fruit);}}
  label(g,'RIVIERA MARKET',12,1.1,0,3.7,5.35,'#44665d');
 }else{
  box(g,18,.24,12,0,.12,0,'#a7acaa');
  box(g,18,8,12,0,4,0,'#b0a092');box(g,18.6,.35,12.6,0,8.18,0,'#657477');
  for(const x of [-5,5]){box(g,6,5.3,.20,x,2.75,6.12,'#536b73');for(let y=.5;y<5.4;y+=.43)box(g,5.9,.06,.10,x,y,6.25,'#8f9f9e');}
  for(const x of [-6,0,6])box(g,4,1.4,.16,x,6.8,6.16,'#2d535e');
  for(const x of [-6,6]){cylinder(g,.48,.62,5,12,x,10.5,-4,'#916d5a');cylinder(g,.65,.65,.25,12,x,13,-4,'#c4b7a0');}
  for(let i=0;i<5;i++)box(g,2.3,.32,5,-6+i*3,.22,-8,'#b8b2a3');
  label(g,'RIVIERA FREIGHT',13,1.25,0,7.9,6.35,'#4d6265');
 }
 bake(g);return surfaceFinish(g,'building');
}
export function streetAccents(){
 const g=new T.Group();
 for(const z of [-84,0,78])for(const x of [-135,-81,-25,25,75,129]){
  for(const side of [-1,1]){
   const zz=z+side*7.8;
   box(g,8,.014,.19,x,.065,zz,'#b9b8a8');
   box(g,.18,.014,2.0,x-4,.065,zz-side*.8,'#b9b8a8');
  }
  for(const side of [-1,1]){
   const zz=z+side*5.85;
   box(g,1.2,.016,.08,x,.063,zz,'#c9c5af');
   box(g,.08,.016,.9,x-.56,.063,zz-side*.40,'#c9c5af');
   box(g,.08,.016,.9,x+.56,.063,zz-side*.40,'#c9c5af');
  }
 }
 for(const [x,z] of [[-42,-84],[-42,0],[48,0],[48,78],[102,78]]){
  for(const side of [-1,1]){box(g,2.5,.013,.22,x+side*5.0,.069,z-6,'#f5ebd4');box(g,.22,.013,2.5,x-6,.069,z+side*5,'#f5ebd4');}
 }
 for(const [x,z] of [[-123,-103],[-69,-103],[75,98],[129,98]]){
  box(g,18,.1,2.4,x,.1,z,'#c0b6a1');
  for(let i=-2;i<=2;i++){box(g,2.8,.36,1.9,x+i*3.5,.32,z,'#c9b59c');box(g,2.5,.16,1.65,x+i*3.5,.56,z,'#68835f');}
 }
 bake(g);return g;
}
export function unobstructedHeight(focus,offset,boxes){
 const end=focus.clone().add(offset),ray=new T.Ray(focus,new T.Vector3().subVectors(end,focus).normalize()),hit=new T.Vector3();
 let lift=0;const distance=offset.length();
 for(const expanded of boxes){
  if(!ray.intersectBox(expanded,hit)||hit.distanceTo(focus)>distance)continue;
  const dx=hit.x-focus.x,dz=hit.z-focus.z,flat=Math.hypot(dx,dz),total=Math.hypot(offset.x,offset.z);
  if(flat<.25||total<.25)continue;
  lift=Math.max(lift,(expanded.max.y+2-hit.y)*total/flat);
 }
 return Math.min(20,Math.max(0,lift));
}
