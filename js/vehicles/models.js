import {THREE,box,cylinder,material,label,glowTexture,bake} from '../core/util.js';
import {ovalShadow,buildingShadow} from '../rendering/shadows.js';
const halo=glowTexture();
function shell(parent,sections,color,openRoof=false){let vertices=[],indices=[];for(let [z,w,b,t] of sections)vertices.push(-w,b,z,w,b,z,-w,t,z,w,t,z);for(let i=0;i<sections.length-1;i++){let a=i*4,b=a+4;indices.push(a,a+1,b+1,a,b+1,b);if(!openRoof||Math.abs(sections[i][3]-sections[i+1][3])>.0001)indices.push(a+2,b+2,b+3,a+2,b+3,a+3);indices.push(a,b,a+2,a+2,b,b+2,a+1,a+3,b+1,a+3,b+3,b+1);}indices.push(0,2,3,0,3,1);let a=(sections.length-1)*4;indices.push(a,a+1,a+3,a,a+3,a+2);let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo=geo.toNonIndexed();geo.computeVertexNormals();const glazing=color==='#254451'||color==='#123b62';
let m=new THREE.Mesh(geo,glazing?new THREE.MeshPhysicalMaterial({color,roughness:.13,metalness:.12,clearcoat:.9,clearcoatRoughness:.07,side:THREE.DoubleSide}):new THREE.MeshPhysicalMaterial({color,roughness:.31,metalness:.14,clearcoat:.63,clearcoatRoughness:.2,side:THREE.DoubleSide}));m.castShadow=true;parent.add(m);return m;}
function musclePaint(body,roof,paint){
 const c=document.createElement('canvas');c.width=512;c.height=32;
 const ctx=c.getContext('2d'),u=x=>(x/2.4+.5)*c.width;
 ctx.fillStyle=paint;ctx.fillRect(0,0,c.width,c.height);
 ctx.fillStyle='#fff8ef';for(const x of [-.34,.34])ctx.fillRect(u(x-.135),0,u(x+.135)-u(x-.135),c.height);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const finish=body.material;finish.color.set('#ffffff');finish.map=texture;finish.needsUpdate=true;
 function project(mesh){
  const geo=mesh.geometry,p=geo.attributes.position,n=geo.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=n.getY(i)>.5?(p.getX(i)/2.4+.5):.02;uv[i*2+1]=.5;}
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 }
 project(body);roof.geometry=roof.geometry.clone();roof.material=finish.clone();project(roof);
}
function muscleCar(color){
 const root=new THREE.Group(),g=new THREE.Group();root.add(g);
 const paint=color||'#e73332',glass='#123b62',black='#1c202b';
 // Shorter nose, forward cabin and recessed wheels. Side profile includes real wheel openings.
 const sections=[];for(let i=0;i<=64;i++){
  const z=-2.4+i*4.72/64,edge=Math.max(0,(Math.abs(z)-1.95)/.45),w=1.14-edge*.15;
  let bottom=.34;for(const axle of [-1.48,1.40]){const d=z-axle;if(Math.abs(d)<.52)bottom=Math.max(bottom,.47+Math.sqrt(.52*.52-d*d));}
  const top=1.10-(z+2.4)/4.72*.065-Math.max(0,z-2.12)*.30;
  sections.push([z,w,bottom,Math.max(bottom+.025,top)]);
 }
 const body=shell(g,sections,paint);box(g,1.76,.12,4.35,0,.29,-.03,black);
 // The complete cabin is glass, as on civilian/police models: no painted face over the windshield.
 shell(g,[[-1.83,.96,1.04,1.06],[-1.04,.82,1.04,1.66],[.32,.82,1.04,1.66],[1.15,.97,1.02,1.055]],glass,true);
 const roof=box(g,1.70,.075,1.42,0,1.69,-.36,paint);
 musclePaint(body,roof,paint);
 for(const side of [-1,1]){
  box(g,.075,.58,.07,side*.86,1.37,-.97,paint);
  const frontPillar=box(g,.07,.94,.07,side*.88,1.36,.74,paint);frontPillar.rotation.x=-.94;
  const rearPillar=box(g,.07,.97,.07,side*.88,1.36,-1.44,paint);rearPillar.rotation.x=.93;
  box(g,.06,.075,2.24,side*.98,1.04,-.27,paint);
  box(g,.06,.035,.28,side*1.145,.93,-.60,black);
 box(g,.025,.035,1.7,side*1.158,.96,-.27,'#fee9d4',{metalness:.22,roughness:.28});
 box(g,.07,.08,.65,side*1.125,.49,.05,'#f0614f');
  box(g,.18,.12,.27,side*1.13,1.08,.74,paint);
  box(g,.018,.035,1.75,side*1.146,.43,-.22,'#86242d');
  box(g,.018,.47,.028,side*1.146,.68,-.98,'#86242d');
  box(g,.41,.15,.05,side*.70,.81,-2.42,'#e74848',{emissive:'#a62225',emissiveIntensity:.22});
  box(g,.41,.14,.05,side*.69,.81,2.34,'#fff0cc',{emissive:'#ffe4aa',emissiveIntensity:.3});
  box(g,.09,.18,.11,side*.78,1.16,-2.10,paint);
 box(g,.48,.07,.035,side*.71,.87,2.405,'#fff9e8',{emissive:'#fff0cc',emissiveIntensity:.12});
 box(g,.43,.08,.028,side*.71,.86,-2.454,'#e92a36',{emissive:'#d72c38',emissiveIntensity:.18});
 box(g,.14,.025,1.53,side*.88,1.1,1.38,'#ff7c60');
 }
 box(g,1.38,.20,.08,0,.65,2.37,black);
 box(g,1.43,.03,.075,0,.76,2.445,'#ccd8df',{metalness:.75,roughness:.22});for(let k=-4;k<=4;k++)box(g,.035,.13,.08,k*.14,.65,2.42,'#738082');
 box(g,1.99,.12,.11,0,.40,2.33,black);box(g,1.95,.17,.09,0,.55,-2.43,black);
 box(g,2.10,.085,.32,0,1.29,-2.14,paint);box(g,.25,.14,.045,0,.78,-2.49,'#d6c8b2');
 const wheels=[];for(const x of [-.975,.975])for(const z of [-1.48,1.40]){
  const pivot=new THREE.Group();pivot.position.set(x,.47,z);root.add(pivot);
  const wheel=cylinder(pivot,.47,.47,.26,16,0,0,0,black);wheel.rotation.z=Math.PI/2;
  const hub=new THREE.Group();pivot.add(hub);const rim=cylinder(hub,.33,.33,.272,20,0,0,0,'#4c555f');rim.rotation.z=Math.PI/2;
  const lip=cylinder(hub,.365,.365,.018,24,.143,0,0,'#d9e4ee');lip.rotation.z=Math.PI/2;
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5,spoke=box(hub,.285,.065,.28,0,Math.sin(a)*.15,Math.cos(a)*.15,'#bcc4c7');spoke.rotation.x=-a;}
  const cap=cylinder(hub,.10,.10,.31,12,0,0,0,'#e5edf0');cap.rotation.z=Math.PI/2;
  wheels.push({pivot,wheel,hub,front:z>0});
 }
 root.userData={wheels,lamps:[],kind:'sport',L:2.4,w:1.14,chassis:g,hoodLength:1.17};return root;
}
export function vehicleModel(kind,color,style=''){if(style==='muscle'&&kind==='sport')return muscleCar(color);let root=new THREE.Group(),g=new THREE.Group();root.add(g);const sport=kind==='sport',swat=kind==='swat',truck=kind==='truck',civil=kind==='civil'||truck,muscle=style==='muscle',w=truck?1.24:swat?1.2:1.08,L=truck?3.12:swat?2.6:civil&&style==='wagon'?2.65:civil&&style==='hatch'?1.98:2.32,paint=sport||civil?color:swat?'#344b50':'#e9eee8',glass='#254451';
box(g,w*1.88,.26,L*1.78,0,.49,0,'#223033');shell(g,[[-L,w*.83,.58,.88],[-L+.42,w,.48,1.03],[L-.52,w,.49,.97],[L,w*.79,.6,.81]],paint);
let cabin=truck?2.32:swat?1.92:sport?1.48:1.67;
const roofRear=civil&&style==='wagon'?-1.65:civil&&style==='hatch'?-.95:-.65,back=civil&&style==='wagon'?-2.15:civil&&style==='hatch'?-1.75:-1.4;
shell(g,[[back,w*.86,.96,1.02],[roofRear,w*.73,1.02,cabin],[.65,w*.73,1.02,cabin],[1.32,w*.81,.96,1.03]],glass,true);box(g,w*1.52,.08,.65-roofRear+.04,0,cabin+.035,(roofRear+.65)/2,paint);
if(swat){box(g,2.20,1.3,2.75,0,1.48,-.95,paint);box(g,2.23,.11,2.8,0,2.17,-.95,paint);for(const s of [-1,1])box(g,.04,.5,.9,s*1.12,1.65,-1.3,'#20353b');}
for(let side of [-1,1]){box(g,.11,cabin-1,.12,side*w*.75,(cabin+1)/2,-.08,paint);box(g,.15,.2,2.9,side*w,1.03,0,paint);box(g,.22,.15,.34,side*(w+.13),1.14,.9,paint);box(g,.045,.055,.28,side*(w+.015),.94,-.6,'#b7c3b8');if(!sport&&!civil){box(g,.04,.35,2.4,side*(w+.03),.77,0,swat?'#233637':'#263a43');box(g,.05,.24,.4,side*(w+.04),.8,-.25,'#e5c670');}for(let z of [-1.42,1.43])box(g,.17,.14,.94,side*w,.87,z,paint);}
box(g,w*1.62,.16,.17,0,.58,L+.035,'#a9b4a9');box(g,w*1.65,.14,.15,0,.55,-L-.035,'#65777a');box(g,.85,.19,.06,0,.8,L+.06,'#24393b');
for(let s of [-1,1]){box(g,.44,.17,.08,s*w*.62,.89,L+.045,'#fff0c1',{emissive:'#ffe5a3',emissiveIntensity:.35});box(g,.44,.12,.08,s*w*.64,.91,-L-.04,'#ed674e',{emissive:'#f04e39',emissiveIntensity:.25});}
for(const side of [-1,1]){
 box(g,.032,.055,L*.95,side*(w+.018),.95,-.12,'#f2e7d6');
 box(g,.12,.07,.27,side*(w+.13),1.15,.91,paint);
 box(g,.025,.035,.55,side*(w+.02),.53,.08,'#323b46');
}
if(!truck&&!swat){
 box(g,w*1.3,.018,.32,0,cabin+.085,-.18,'#ebf4fb',{roughness:.17,metalness:.14});
 box(g,w*1.65,.035,.11,0,.71,L+.082,'#dce8ee',{metalness:.55,roughness:.21});
}
if(sport&&!muscle){box(g,1.95,.095,.35,0,1.25,-1.93,'#294441');for(let s of [-1,1])box(g,.09,.32,.12,s*.68,1.07,-1.93,'#294441');box(g,.32,.016,.86,0,1.045,1.76,'#fbf0cf');box(g,.32,.016,.59,0,1.065,-1.78,'#fbf0cf');box(g,.3,.012,1.27,0,cabin+.078,0,'#fff2d3');}
if(muscle){
 box(g,2.03,.12,1.27,0,1.027,1.45,paint);
 for(const x of [-.44,.44]){
  box(g,.24,.021,1.63,x,1.101,1.5,'#fff7e9');
  box(g,.24,.022,1.34,x,cabin+.087,0,'#fff7e9');
  box(g,.24,.022,.53,x,1.092,-1.83,'#fff7e9');
 }
 box(g,1.94,.14,.28,0,.88,2.2,'#2b3436');
 box(g,1.85,.09,.17,0,.83,-2.24,'#333b3d');
 for(const x of [-.92,.92])box(g,.19,.11,.9,x,.77,1.73,'#c42d26');
 }
 if(truck){box(g,2.17,1.32,3.4,0,1.68,-.26,paint);box(g,2.1,.13,3.5,0,2.38,-.25,'#e6d8bd');box(g,2,.95,.08,0,1.55,1.68,'#476b70');box(g,1.8,.12,.12,0,1.28,3.08,'#c7cfc6');}
 let wheels=[];for(let x of [-w,w])for(let z of [-1.44,1.44]){let pivot=new THREE.Group();pivot.position.set(x,.44,z);root.add(pivot);let wheel=cylinder(pivot,.46,.46,.31,12,0,0,0,'#20292a');wheel.rotation.z=Math.PI/2;let hub=cylinder(pivot,.28,.28,.322,18,0,0,0,'#b6c5d1');hub.rotation.z=Math.PI/2;
 let trim=cylinder(pivot,.315,.315,.024,20,.162,0,0,'#e0e9ee');trim.rotation.z=Math.PI/2;
 for(let i=0;i<6;i++){const a=i*Math.PI/3;const spoke=box(pivot,.024,.092,.19,.179,Math.cos(a)*.145,Math.sin(a)*.145,'#f6f7ee');spoke.rotation.x=a;}
 let cap=cylinder(pivot,.1,.1,.33,8,0,0,0,'#566f70');cap.rotation.z=Math.PI/2;wheels.push({pivot,wheel,hub,front:z>0});}
let lamps=[];if(!sport&&!civil){let y=cabin+.19;box(g,1.7,.11,.42,0,y-.1,0,'#243a3e');for(let s of [-1,1]){let col=s<0?'#ff3b4a':'#267cff',m=box(g,.7,.22,.4,s*.45,y+.05,0,col,{emissive:col,emissiveIntensity:2});m.material=m.material.clone();let sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(s*.45,y+.21,0);sprite.scale.set(3.8,3.8,1);g.add(sprite);let pool=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5),new THREE.MeshBasicMaterial({map:halo,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.22}));pool.rotation.x=-Math.PI/2;pool.position.set(s*1.3,.12,0);root.add(pool);let core=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,color:'#fff7e4',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));core.position.copy(sprite.position);core.position.y+=.02;core.scale.set(.65,.65,1);g.add(core);let light=new THREE.PointLight(col,0,13,2);light.position.set(s*.5,y+.3,0);g.add(light);lamps.push({m,sprite,pool,core,light,s});}label(g,swat?'UNIT 05':'POLICE',1.7,.37,0,1.06,-L-.07,'#263b44');}
root.userData={wheels,lamps,kind,L,w,chassis:g,variant:style||'sedan'};return root;}
function roof(parent,w,d,h,type,accent){if(type===3||type===5){let shape=new THREE.Shape();shape.moveTo(-w/2-.25,0);shape.lineTo(w/2+.25,0);shape.lineTo(0,2.2);shape.closePath();let geo=new THREE.ExtrudeGeometry(shape,{depth:d+.5,bevelEnabled:false});let m=new THREE.Mesh(geo,material(type===3?'#6e8382':'#b56f56'));m.position.set(0,h,-d/2-.25);m.castShadow=true;parent.add(m);box(parent,w+.6,.16,d+.6,0,h+.02,0,'#d6c4a0');box(parent,.2,.15,d+.8,0,h+2.18,0,'#e2c49a');return;}box(parent,w+.5,.24,d+.5,0,h,0,accent);box(parent,w-.5,.09,d-.5,0,h+.15,0,'#dedbca');for(let s of [-1,1]){box(parent,w+.5,.4,.24,0,h+.25,s*(d/2+.15),accent);box(parent,.24,.4,d+.4,s*(w/2+.15),h+.25,0,accent);}if(h>8){box(parent,2.4,.9,2,-w*.25,h+.65,-d*.16,'#e5e7d9');for(let i=0;i<4;i++)box(parent,1.9,.035,.12,-w*.25,h+1.12,-d*.16-.5+i*.35,'#98a5a0');cylinder(parent,.35,.35,1.4,8,w*.28,h+.8,-d*.2,'#9ba7a0');}}
export function building(scene,physics,x,z,w,d,h,color,type,rng,rotation=0){let g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);let quat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation);physics.fixedBox(x,h/2,z,w/2,h/2,d/2,'building',quat);box(g,w,h,d,0,h/2,0,color);box(g,w+.22,.3,d+.22,0,.18,0,'#e8d4aa');let accent=['#f1b75f','#4f996c','#e8795e','#ffca70','#f7d9b6','#df916c','#b8d7a7'][type%7],trim='#fff2d9';roof(g,w,d,h,type,accent);
const floors=Math.floor((h-1.5)/3);for(let face=0;face<4;face++){let f=new THREE.Group();f.rotation.y=face*Math.PI/2;g.add(f);let width=face%2?d:w,depth=face%2?w:d;if(face!==0){let count=Math.max(2,Math.floor(width/3.6));for(let k=0;k<count;k++){let xx=(k-(count-1)/2)*3.15;box(f,2,1.95,.11,xx,1.45,depth/2+.055,trim);box(f,1.75,1.7,.12,xx,1.45,depth/2+.13,type===3?'#536f6c':'#477271');box(f,.07,1.7,.14,xx,1.45,depth/2+.21,'#d4d9c0');}if([0,1,2,5].includes(type)){box(f,width-.4,.52,.18,0,2.93,depth/2+.11,accent);if(face===1||face===3){let aw=box(f,width-.6,.13,1.3,0,2.65,depth/2+.63,accent);aw.rotation.x=.19;for(let k=0;k<Math.floor(width/.85);k++){let stripe=box(f,.32,.135,1.3,-width/2+.7+k*.85,2.66,depth/2+.63,'#fff7de');stripe.rotation.x=.19;}}}}for(let level=1;level<=floors;level++){let yy=level*2.8+1;if(yy>h-1.3)continue;let count=Math.max(2,Math.floor(width/3.6));for(let k=0;k<count;k++){let xx=(k-(count-1)/2)*3.1;box(f,1.65,1.75,.12,xx,yy,depth/2+.045,trim);box(f,1.4,1.5,.13,xx,yy+.025,depth/2+.13,'#14527b');box(f,1.8,.14,.36,xx,yy-.88,depth/2+.16,trim);if(type===4&&level%2===1){box(f,2.1,.16,.8,xx,yy-.93,depth/2+.4,'#e2d8c0');for(let i of [-1,0,1])box(f,.06,.6,.06,xx+i*.75,yy-.6,depth/2+.75,'#617c78');box(f,1.8,.065,.06,xx,yy-.3,depth/2+.75,'#617c78');}}}}
let names=['CORNER CAFÉ','MINT MARKET','PIZZA CLUB','AUTO SERVICE','RUE DES PINS','LA BOULANGERIE','ATELIER 05'];let front=d/2;
if(type===3){for(let sx of [-1,1]){box(g,w*.38,2.75,.16,sx*w*.235,1.55,front+.1,'#41565b');for(let k=0;k<7;k++)box(g,w*.38,.045,.18,sx*w*.235,.5+k*.36,front+.2,'#71817c');}label(g,names[type],w-1,.85,0,3.35,front+.22,'#465d5a');box(g,w+.8,.17,2,0,3.1,front+.8,'#e5b862');}
else{box(g,w-.65,.9,.22,0,3.04,front+.14,accent);label(g,names[type],w-1.3,.63,0,3.05,front+.27,type===4?'#849a88':'#'+new THREE.Color(accent).getHexString());box(g,1.6,2.35,.14,0,1.28,front+.06,trim);box(g,1.3,2.12,.16,0,1.3,front+.16,'#126b8a');box(g,.08,.5,.1,.45,1.2,front+.27,'#ddc98f');for(let side of [-1,1]){let ww=Math.max(1.8,(w-4)/2),wx=side*(w/4+.55);box(g,ww,1.95,.12,wx,1.47,front+.06,trim);box(g,ww-.2,1.7,.14,wx,1.47,front+.15,'#267e9b');box(g,.09,1.7,.17,wx,1.47,front+.19,'#d3d9c4');if(type!==4&&type!==6){let aw=box(g,ww+.3,.12,1.75,wx,2.62,front+.8,accent);aw.rotation.x=.21;for(let k=0;k<Math.ceil(ww/.7);k++){let stripe=box(g,.3,.125,1.75,wx-ww/2+k*.7,2.63,front+.8,'#fff7de');stripe.rotation.x=.21;}box(g,ww+.3,.28,.13,wx,2.36,front+1.6,accent);}}}
if(type===2||type===0){let s=label(g,type===0?'CAFÉ':'PIZZA',2.6,2.6,w/2+.29,h-1.1,0,'#335d53','#f3dfb4');s.rotation.y=Math.PI/2;}
if(type===4){box(g,w*.39,h*.43,d*.25,w*.305,h*.215,-d*.44,'#849f94');}
g.userData={type:'building',w,d,h};bake(g);buildingShadow(scene,x,z,w,d,h,rotation);return g;}
export function tree(parent,x,z,size=1,type=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.userData={type:'tree',radius:1.6*size};parent.add(g);
 const bark=material('#a77b55',{roughness:1});
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.17*size,.3*size,2.5*size,9),bark);
 trunk.position.y=1.25*size;trunk.castShadow=true;g.add(trunk);
 if(type){
  for(let i=0;i<4;i++){
   const m=new THREE.Mesh(new THREE.ConeGeometry((1.42-i*.19)*size,(2.55-i*.19)*size,9),material(i%2?'#168b51':'#2dad5b',{roughness:.86}));
   m.position.y=(2.15+i*.70)*size;m.castShadow=true;m.receiveShadow=true;g.add(m);
  }
 }else{
  const palette=['#157c44','#219c4b','#50bc3c','#93cd35','#cbdc42','#f9d84b'];
  const blooms=['#ed3197','#ff56b1','#ff9ccc'];
  for(let i=0;i<15;i++){
   const a=i*2.39996,r=Math.sqrt((i+.5)/15)*1.54;
   const y=(2.23+1.16*(1-r/1.8)+.13*Math.sin(i*2.7))*size;
   const m=new THREE.Mesh(new THREE.IcosahedronGeometry((.63+(i%4)*.075)*size,1),material(palette[i%palette.length],{roughness:.91,flatShading:true}));
   m.position.set(Math.cos(a)*r*size,y,Math.sin(a)*r*size);
   m.castShadow=true;m.receiveShadow=true;g.add(m);
   if(i%4===0){
    const flower=new THREE.Mesh(new THREE.IcosahedronGeometry(.19*size,0),material(blooms[i%blooms.length],{roughness:.9}));
    flower.position.set(m.position.x*1.12,y+.40*size,m.position.z*1.12);g.add(flower);
   }
  }
 }
 ovalShadow(parent,x+1.2*size,z-.9*size,2.1*size,1.25*size,.23);return g;
}
export function bench(parent,x,z,rotation=0){let g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);for(let i=0;i<3;i++){box(g,2.8,.12,.2,0,.8,-.25+i*.25,'#cf965f');box(g,2.8,.18,.12,0,1.25+i*.18,-.5,'#cf965f');}for(let s of [-1,1]){box(g,.14,.8,.7,s*1.03,.4,0,'#365d58');box(g,.12,1.25,.12,s*1.03,.8,-.48,'#365d58');}return g;}
