import {THREE as T,box,bake} from '../../core/util.js';
function roofCode(g,code,y,z,w){
 const segments=[[0,.32,.48,.07],[0,0,.48,.07],[0,-.32,.48,.07],[-.24,.16,.07,.28],[.24,.16,.07,.28],[-.24,-.16,.07,.28],[.24,-.16,.07,.28]];
 const digits={'0':[0,2,3,4,5,6],'1':[4,6],'2':[0,1,2,4,5],'3':[0,1,2,4,6],'4':[1,3,4,6],'5':[0,1,2,3,6],'6':[0,1,2,3,5,6],'7':[0,4,6],'8':[0,1,2,3,4,5,6],'9':[0,1,2,3,4,6]};
 for(let i=0;i<code.length;i++)for(const j of digits[code[i]]||[]){const [x,dz,a,b]=segments[j];box(g,a*w,.008,b*w,((i-(code.length-1)/2)*.67+x)*w,y,z+dz*w,'#eaf1ec');}
}
export function decoratePoliceCar(mesh,obj,index=0){
 const data=mesh.userData,chassis=data.chassis,kind=data.kind,w=data.w,L=data.L;
 if(!chassis||!Number.isFinite(w)||!Number.isFinite(L))return;
 const g=new T.Group();g.name='Police#1 livery';
 if(obj.role==='fugitive'&&obj.asset==='muscle')return;
 if(kind==='police'||kind==='swat'){
  const swat=kind==='swat';
  for(const x of [-1,1]){
   box(g,.025,.16,1.62,x*(w+.055),.91,-.13,swat?'#d5b76c':'#2b659b');
   for(let i=0;i<3;i++)box(g,.028,.15,.17,x*(w+.06),.92,-.92+i*.20,swat?'#e9d5a2':'#eaf0e7');
  }
  const y=swat?2.233:1.765,z=swat?-1.12:-.34;
  box(g,swat?1.46:1.32,.013,.73,0,y,z,swat?'#263c46':'#285b83');
  roofCode(g,swat?'05':String(10+index%10),y+.011,z,.7);
  for(const x of [-.55,.55])box(g,.16,.012,.88,x,1.0,1.69,swat?'#d6b369':'#285b83');
  for(const lamp of data.lamps||[]){lamp.sprite.scale.set(3,3,1);lamp.core?.scale.set(.48,.48,1);}
 }else if(kind==='civil'||kind==='truck'){
  if(kind==='truck'){
   for(const x of [-1,1]){box(g,.025,.15,2.7,x*1.095,1.79,-.28,'#bda56e');for(let i=0;i<3;i++)box(g,.028,.18,.12,x*1.10,1.79,-1.45+i*.22,'#f4e8c8');}
   for(const x of [-.73,.73])box(g,.085,.013,2.9,x,2.452,-.25,'#9a9f95');
  }else for(const x of [-1,1])box(g,.022,.055,Math.min(2.1,L),x*(w+.045),.82,-.15,'#526466');
 }
 if(!g.children.length)return;
 bake(g);chassis.add(g);
 g.traverse(m=>{if(m.isMesh){m.material.roughness=.48;m.material.metalness=.16;}});
}
export function finishPolicePaint(chassis){
 for(const m of chassis.children){
  if(!m.isMesh||!m.geometry.attributes.color)continue;
  m.material.roughness=.39;m.material.metalness=.16;
 }
}
