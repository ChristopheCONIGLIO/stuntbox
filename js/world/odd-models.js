import {THREE as T,box,cylinder,bake,material} from '../core/util.js';
const ink='#293a41',rubber='#292c31',steel='#a6b6b9',darkSteel='#536569',ivory='#eee5d3',teal='#317b78';
function rod(g,a,b,r,color){
 const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
 const m=cylinder(g,r,r,delta.length(),6,0,0,0,color);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
}
function torus(g,r,t,arc,color){
 const m=new T.Mesh(new T.TorusGeometry(r,t,7,arc===Math.PI?16:24,arc),material(color));g.add(m);return m;
}
function tire(g,half,sign){
 const arc=half?Math.PI:2*Math.PI,rotation=half&&sign<0?Math.PI:0;
 for(const z of [-.085,.085]){const m=torus(g,.45,.17,arc,rubber);m.position.z=z;m.rotation.z=rotation;}
 for(const z of [-.208,.208]){const m=torus(g,.459,.023,arc,'#576064');m.position.z=z;m.rotation.z=rotation;}
 for(let i=0;i<(half?7:14);i++){const a=(i+.5)*Math.PI/7+rotation;const m=box(g,.115,.043,.245,.611*Math.cos(a),.611*Math.sin(a),0,i===2?'#dfc889':'#3d4246');m.rotation.z=a-Math.PI/2;}
 if(half)g.children.forEach(m=>m.position.y-=sign*.30);
}
function drum(g,kind,color){
 if(kind!=='drumLid'){const y=kind==='drumTank'?0:-.07;cylinder(g,.49,.50,1.28,16,0,y,0,color);
 for(const off of [-.49,.36])cylinder(g,.519,.519,.075,16,0,y+off,0,ink);
 cylinder(g,.508,.508,.135,16,0,y+.04,0,'#f5db98');cylinder(g,.512,.512,.06,16,0,y-.615,0,darkSteel);}
 if(kind!=='drumTank'){const y=kind==='drumLid'?0:.65;cylinder(g,.519,.519,.12,16,0,y,0,'#586568');cylinder(g,.46,.46,.032,16,0,y+.063,0,color);cylinder(g,.07,.07,.02,8,.27,y+.09,.12,ink);}
}
function cart(g,kind){
 if(kind!=='cartBase'){
 const m=new T.Group();g.add(m);m.position.y=kind==='cartBin'?-.08:0;
 for(const s of [-1,1]){for(const y of [-.19,.07,.32])rod(m,[s*(.43+y*.15),y,-.58],[s*(.43+y*.15),y,.57],.025,steel);
 for(let i=0;i<6;i++){const z=-.54+i*.215;rod(m,[s*.4,-.22,z*.82],[s*.5,.34,z],.023,steel);}
 rod(m,[s*.48,.30,-.56],[s*.49,.54,-.82],.038,darkSteel);}
 for(const z of [-.57,.57]){for(const y of [-.18,.08,.32])rod(m,[-.47,y,z],[.47,y,z],.025,steel);for(let j=-2;j<=2;j++)rod(m,[j*.16,-.22,z*.8],[j*.19,.32,z],.022,steel);}
 for(const x of [-.32,-.1,.1,.32])rod(m,[x,-.22,-.49],[x,-.22,.49],.026,steel);
 rod(m,[-.55,.54,-.82],[.55,.54,-.82],.057,'#e86735');
 }
 if(kind!=='cartBin'){
 const m=new T.Group();g.add(m);m.position.y=kind==='cartBase'?.43:0;
 for(const x of [-.44,.44]){rod(m,[x,-.33,-.68],[x,-.33,.59],.045,darkSteel);for(const z of [-.57,.49]){
 box(m,.085,.15,.09,x,-.39,z,darkSteel);const wheel=cylinder(m,.105,.105,.094,9,x,-.48,z,ink);wheel.rotation.z=Math.PI/2;}}
 rod(m,[-.44,-.33,-.66],[.44,-.33,-.66],.044,darkSteel);
 }
}
function toilet(g,kind){
 if(kind==='loo'||kind==='looBase'){
 const p=new T.Group();g.add(p);p.position.y=kind==='looBase'?.68:0;
 box(p,1.38,.17,1.34,0,-1.09,0,ink);box(p,1.29,.83,1.25,0,-.61,0,teal);
 box(p,.64,.23,.78,0,-.13,.13,'#ece8dd');cylinder(p,.20,.20,.027,12,0,.002,.16,ink);
 }
 if(kind==='loo'||kind==='looShell'){
 const p=new T.Group();g.add(p);p.position.y=kind==='looShell'?-.39:0;
 for(const side of [-1,1]){box(p,.09,1.28,1.25,side*.63,.40,0,teal);for(const z of [-.42,-.14,.14,.42])box(p,.035,1.03,.043,side*.69,.35,z,'#58a399');}
 box(p,1.28,1.25,.085,0,.40,.61,teal);box(p,1.22,1.25,.085,0,.40,-.63,'#3a918b');
 box(p,1.00,.83,.04,0,.27,-.683,teal);box(p,.13,.28,.07,.43,.25,-.72,ink);
 for(let i=0;i<3;i++)box(p,.59,.045,.045,0,.77+i*.08,-.685,ink);
 box(p,.14,.065,.04,.43,.51,-.71,'#e4af4e');
 }
 if(kind==='loo'||kind==='looRoof'){const y=kind==='looRoof'?0:1.09;box(g,1.46,.18,1.41,0,y,0,ivory);box(g,1.27,.08,1.20,0,y+.11,0,'#faf3dc');}
}
function cube(g,kind,sign,color){
 const split=kind==='blockHalf',w=split?.925:1.85;box(g,w,1.84,1.84,0,0,0,color);
 for(const z of [-.927,.927]){
 for(const xx of [-.48,0,.48]){if(split&&xx*sign<=0)continue;const x=xx-(split?sign*.465:0),y=xx;
 const dot=cylinder(g,.14,.14,.023,12,x,y,z,ivory);dot.rotation.x=Math.PI/2;}
 for(const y of [-.80,.80])box(g,w*.91,.045,.024,0,y,z,ivory);}
 const side=split?sign:1;for(const s of split?[side]:[-1,1]){for(const y of [-.45,.45]){const dot=cylinder(g,.13,.13,.025,10,s*w*.5,y,-y,ivory);dot.rotation.z=Math.PI/2;}}
}
export function oddModel(type,paint=0,sign=1){
 const g=new T.Group();
 if(type.startsWith('tire'))tire(g,type==='tireHalf',sign);
 else if(type.startsWith('drum'))drum(g,type,['#dc6c37','#d7a02c'][paint%2]);
 else if(type.startsWith('cart'))cart(g,type);
 else if(type.startsWith('loo'))toilet(g,type);
 else cube(g,type,sign,['#456d84','#cd7754'][paint%2]);
 bake(g);return g.children[0].clone();
}
