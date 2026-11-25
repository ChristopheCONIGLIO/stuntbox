import {THREE as T,glowTexture,label} from '../../core/util.js';

const configs={
 'mar-rally-gt':{kind:'sport',half:2.38,w:1.13,roof:1.49,look:'gt',base:'#d93e32',stripe:'#fff5e3',accent:'#254355'},
 'mar-rally-hatch':{kind:'civil',half:2.04,w:1.10,roof:1.73,look:'hatch',base:'#f2a72b',stripe:'#182f40',accent:'#f9edcf'},
 'mar-rally-raid':{kind:'truck',half:2.72,w:1.22,roof:2.02,look:'raid',base:'#248e9e',stripe:'#f3d1a2',accent:'#213c46'},
 'mar-police-blue':{kind:'police',half:2.26,w:1.14,roof:1.70,look:'police',base:'#ebf2e9',stripe:'#24638f',accent:'#243849'},
 'mar-police-interceptor':{kind:'police',half:2.51,w:1.19,roof:1.51,look:'interceptor',base:'#2d3542',stripe:'#d9e7ed',accent:'#0b1b31'},
 'mar-police-van':{kind:'swat',half:2.93,w:1.29,roof:2.25,look:'van',base:'#23495b',stripe:'#e5efed',accent:'#243648'}
};
const mat=(color,rough=.33,metal=.14,extra={})=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
function cube(root,w,h,d,x,y,z,color,rough=.33,metal=.14){
 const obj=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color,rough,metal));
 obj.position.set(x,y,z);obj.castShadow=obj.receiveShadow=true;root.add(obj);return obj;
}
function cylinder(root,rt,rb,h,x,y,z,color,faces=18){
 const obj=new T.Mesh(new T.CylinderGeometry(rt,rb,h,faces),mat(color,.37,.15));
 obj.position.set(x,y,z);obj.castShadow=true;root.add(obj);return obj;
}
function shell(root,c){
 const {half:L,w,roof,base,accent}=c,halfWidth=w*.96;
 const sections=[
  [-L,w*.77,.49,.72],[-L+.33,w,.48,1.02],
  [L-.42,w,.49,.99],[L,w*.80,.48,.72]
 ];
 const pos=[],indices=[];
 for(const [z,width,bottom,top] of sections){
  for(const [x,y] of [[-width,bottom],[width,bottom],[-width,top],[width,top]])pos.push(x,y,z);
 }
 for(let i=0;i<sections.length-1;i++){
  const a=i*4,b=(i+1)*4;
  for(const face of [[a,a+2,b],[a+2,b+2,b],[a+1,b+1,a+3],[a+3,b+1,b+3],
    [a+2,a+3,b+2],[a+3,b+3,b+2],[a,b,b+1],[a,b+1,a+1]]){
   indices.push(...face);
  }
 }
 for(const face of [[0,1,2],[1,3,2],[12,14,13],[13,14,15]])indices.push(...face);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 const body=new T.Mesh(geo,mat(base,.29,.17,{side:T.DoubleSide}));
 body.castShadow=body.receiveShadow=true;root.add(body);
 cube(root,2*w,.23,2*L-.3,0,.50,0,accent,.49,.08);
 const cabinHalf=c.look==='van'?L*.69:c.look==='hatch'?L*.58:L*.49;
 const cabin= new T.Mesh(new T.BoxGeometry(w*1.64,roof-1.03,cabinHalf*2),
  mat('#1e5878',.13,.18,{transparent:true,opacity:.89}));
 cabin.position.set(0,(roof+1.03)/2,c.look==='van'?-.22:-.31);
 cabin.castShadow=true;root.add(cabin);
 cube(root,w*1.67,.10,cabinHalf*2+.22,0,roof+.005,cabin.position.z,base,.31,.14);
 for(const side of [-1,1]){
  const x=side*w*.94;
  cube(root,.085,roof-.98,.12,x,(roof+.98)/2,-.2,base,.31,.1);
  cube(root,.12,.24,.42,side*(w+.12),1.03,.85,base);
  cube(root,.19,.13,.30,side*(w+.15),1.12,.80,'#2b444f');
  for(const z of [-1.49,1.49]){
   const ring=new T.Mesh(new T.TorusGeometry(.49,.08,6,20,Math.PI*1.03),mat(accent,.37,.13));
   ring.rotation.y=side*Math.PI/2;ring.rotation.z=Math.PI;
   ring.position.set(side*(w+.03),.49,z);root.add(ring);
  }
  cube(root,.53,.17,.09,side*w*.64,.87,L+.015,'#fff4cf',.14,.17);
  cube(root,.48,.13,.085,side*w*.63,.83,-L-.02,'#ed513d',.14,.17);
  cube(root,.10,.07,.30,side*(w+.03),.77,-.95,'#f0d6bd');
 }
 cube(root,2*w*.83,.23,.20,0,.58,L+.06,accent,.35,.14);
 cube(root,2*w*.85,.18,.18,0,.55,-L-.05,accent,.35,.14);
}
function rallyDetails(chassis,c){
 const {look,half:L,w,roof,stripe,accent}=c;
 if(look==='gt'||look==='hatch'||look==='raid'){
  for(const s of [-1,1]){
   cube(chassis,.31,.027,L*.72,s*.44,1.016,L*.52,stripe,.40,.09);
   cube(chassis,.28,.025,1.05,s*.40,roof+.065,-.25,stripe);
   cube(chassis,.45,.04,.8,s*(w+.01),.78,0,stripe,.30,.10);
  }
  cube(chassis,1.88,.12,.45,0,roof+.28,-L*.75,accent,.29,.30);
  for(const s of [-1,1])cube(chassis,.14,.36,.15,s*.81,roof+.11,-L*.75,accent);
  cube(chassis,1.75,.19,.38,0,1.05,L*.69,baseColor(c),.25,.25);
  for(let x of [-.62,0,.62]){
   const lamp=cylinder(chassis,.19,.19,.12,x,1.03,L+.18,'#fff8d9',12);
   lamp.rotation.x=Math.PI/2;lamp.material.emissive=new T.Color('#ffe9a2');lamp.material.emissiveIntensity=.25;
  }
 }
 if(look==='hatch')cube(chassis,1.72,.11,.40,0,roof+.08,-L*.73,'#2b4248',.34,.08);
 if(look==='raid'){
  cube(chassis,2.24,.14,3.32,0,roof+.37,-.27,'#2a4248');
  for(const s of [-1,1])cube(chassis,.14,.42,3.0,s*1.07,roof+.21,-.25,'#293942');
  for(let z=-1;z<=1;z++)cube(chassis,2.22,.08,.10,0,roof+.42,z,'#d9c7a4');
  const spare=cylinder(chassis,.55,.55,.28,0,roof+.62,-1.02,'#293942',14);
  spare.rotation.z=Math.PI/2;
  cube(chassis,2.25,.35,.19,0,.62,-L-.18,'#adbcb6',.41,.29);
 }
 if(look==='gt')cube(chassis,1.70,.24,.26,0,roof+.12,-L*.71,'#293943');
}
function baseColor(c){return c.look==='gt'?'#c42c29':c.look==='hatch'?'#dc9530':'#236776'}
function policeDetails(root,chassis,c){
 const {look,half:L,w,roof,stripe,accent}=c;
 for(const side of [-1,1]){
  cube(chassis,.075,.37,2.7,side*(w+.06),.84,0,stripe,.39,.15);
  cube(chassis,.04,.10,1.35,side*(w+.10),1.08,-.22,'#fff1dc');
  cube(chassis,.08,.32,.32,side*(w+.04),1.05,.51,'#e2bc73');
 }
 cube(chassis,1.8,.08,.57,0,roof+.12,-.12,'#253a4d',.30,.08);
 if(look==='van'){
  cube(chassis,2*w*.94,1.05,3.5,0,1.68,-.58,c.base,.49,.10);
  cube(chassis,2.20,.16,3.65,0,2.22,-.60,accent);
  for(const side of [-1,1]){
   cube(chassis,.06,.45,1.17,side*(w+.02),1.66,-.7,'#2d6a83');
   cube(chassis,.075,.22,1.1,side*(w+.05),1.25,.62,stripe);
  }
  cube(chassis,1.95,.20,.24,0,.62,L+.12,'#b4bebb');
 }else if(look==='interceptor'){
  cube(chassis,1.82,.10,.42,0,roof+.22,-L*.79,accent,.29,.13);
  for(const side of [-1,1])cube(chassis,.11,.33,.17,side*.78,roof+.11,-L*.79,accent);
 }
 const lamps=[],glow=glowTexture();
 for(const side of [-1,1]){
  const color=side<0?'#f7434c':'#267dff';
  const m=cube(chassis,.62,.21,.43,side*.40,roof+.27,.03,color,.25,.12);
  m.material.emissive=new T.Color(color);m.material.emissiveIntensity=1.8;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:glow,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  sprite.position.set(side*.40,roof+.46,.04);sprite.scale.set(3.2,3.2,1);chassis.add(sprite);
  const pool=new T.Mesh(new T.PlaneGeometry(5.1,5.1),new T.MeshBasicMaterial({
   map:glow,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.25
  }));
  pool.rotation.x=-Math.PI/2;pool.position.set(side*.9,.15,0);root.add(pool);
  const core=new T.Sprite(new T.SpriteMaterial({map:glow,color:'#fef6ed',transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  core.position.copy(sprite.position);core.position.y+=.05;core.scale.set(.60,.60,1);chassis.add(core);
  const light=new T.PointLight(color,0,13,2);light.position.set(side*.35,roof+.56,.05);chassis.add(light);
  lamps.push({s:side,m,sprite,pool,core,light});
 }
 label(chassis,look==='van'?'UNITÉ 13':'POLICE',1.67,.27,0,1.07,-L-.07,'#243847','#fff1d3');
 return lamps;
}
function wheels(root,c){
 const wheels=[],position=[-c.w,c.w],axles=[-1.53,1.53];
 for(const x of position)for(const z of axles){
  const pivot=new T.Group();pivot.position.set(x,.45,z);root.add(pivot);
  const tire=cylinder(pivot,.48,.48,.32,0,0,0,'#202a32',18);tire.rotation.z=Math.PI/2;
  const hub=cylinder(pivot,.30,.30,.34,0,0,0,'#d1dbe0',18);hub.rotation.z=Math.PI/2;
  const disc=cylinder(pivot,.25,.25,.355,x>0?.03:-.03,0,0,'#465d70',16);disc.rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   const spoke=cube(pivot,.038,.13,.18,x>0?.18:-.18,Math.cos(a)*.14,Math.sin(a)*.14,'#f0eee4',.24,.26);
   spoke.rotation.x=a;
  }
  wheels.push({pivot,wheel:tire,hub,front:z>0});
 }
 return wheels;
}
export function marseilleVehicle(id,color){
 const c=configs[id];if(!c)throw new Error('Marseille vehicle unknown: '+id);
 const car=new T.Group(),chassis=new T.Group();car.add(chassis);
 shell(chassis,{...c,base:color||c.base});
 const lamps=c.look.startsWith('police')||['interceptor','van'].includes(c.look)?policeDetails(car,chassis,c):[];
 if(!lamps.length)rallyDetails(chassis,c);
 const wheelParts=wheels(car,c);
 car.userData={chassis,wheels:wheelParts,lamps,kind:c.kind,w:c.w,L:c.half,variant:c.look};
 return car;
}
export const marseilleVehicles=[
 {id:'mar-rally-gt',name:'Marseille · Rally GT',kind:'sport',style:'gt',color:'#d93e32'},
 {id:'mar-rally-hatch',name:'Marseille · Compact rally',kind:'civil',style:'hatch',color:'#f2a72b'},
 {id:'mar-rally-raid',name:'Marseille · Rally Raid SUV',kind:'truck',style:'raid',color:'#248e9e'},
 {id:'mar-police-blue',name:'Police · Marseille patrol',kind:'police',style:'police',color:'#ebf2e9'},
 {id:'mar-police-interceptor',name:'Police · Interceptor',kind:'police',style:'interceptor',color:'#2d3542'},
 {id:'mar-police-van',name:'Police · Tactical van',kind:'swat',style:'van',color:'#23495b'}
];
