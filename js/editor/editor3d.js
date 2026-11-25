import {THREE as T,clamp} from '../core/util.js';
import {startingGrid,pursuitGrid} from '../core/practice.js';
import {Terrain,heightAt} from '../world/terrain.js';
import {instance,assets,placeableProp,propBehavior,propMass,validPropMass} from '../core/registry.js';
import {release} from '../rendering/view.js';
import {buildMap} from '../core/layout.js';
import {samples} from '../physics/arcade-drive.js';
import {jumps} from '../scenes/canyon/canyon-assets.js';
const $=id=>document.getElementById(id);
export class CircuitEditor{
 constructor(view){
  this.view=view;this.tool='gates';this.history=[];this.selected=-1;this.labels=$('marks');this.canvas=view.canvas;
  this.profiles();
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{this.tool=b.dataset.tool;this.selected=-1;this.inserting=false;this.profiles();this.overlay();});
  $('add').onclick=()=>{this.inserting=!this.inserting;this.overlay();};
  $('remove').onclick=()=>{if(this.selected<0||!this.canRemove())return;this.remember();this.items.splice(this.selected,1);this.selected=-1;this.rebuild();};
  $('undo').onclick=()=>{if(this.history.length){Object.assign(this.layout,this.history.pop());this.selected=-1;this.rebuild();}};
  $('width').onchange=()=>{this.remember();this.layout.width=clamp(+$('width').value||11.4,8,18);this.rebuild();};
  for(const id of ['yaw','size','profile','height'])$(id).onchange=()=>{if(!this.objects||this.selected<0)return;this.remember();const o=this.items[this.selected];if(id==='yaw')o.r[1]=(+$('yaw').value||0)*Math.PI/180;if(id==='size')o.s.fill(clamp(+$('size').value||1,.1,5));if(id==='profile'){o.asset=$('profile').value;delete o.mass;}if(id==='height')o.height=clamp(+$('height').value||0,-5,30);this.rebuild();};
  $('propBehavior').onchange=()=>{if(!this.physicalSelection)return;this.remember();this.items[this.selected].behavior=$('propBehavior').value;this.overlay();};
  $('propMass').onchange=()=>{if(!this.physicalSelection)return;const n=$('propMass').valueAsNumber;if(!validPropMass(n)){$('propMass').reportValidity();this.overlay();return;}this.remember();this.items[this.selected].mass=n;this.overlay();};
  $('propMassReset').onclick=()=>{if(!this.physicalSelection)return;this.remember();delete this.items[this.selected].mass;this.overlay();};
  this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));
  for(const ev of ['pointerup','pointercancel'])this.canvas.addEventListener(ev,()=>{if(this.drag?.changed)this.rebuild();this.drag=null;});
  this.canvas.addEventListener('wheel',()=>this.draw());this.observer=new ResizeObserver(()=>{if(this.root){view.resize();this.draw();}});this.observer.observe(this.canvas.parentElement);
 }
 get physicalSelection(){return ['obstacles','groups'].includes(this.tool)&&this.selected>=0&&!!this.items[this.selected];}
 get objects(){return ['ramps','obstacles','groups'].includes(this.tool);}
 profiles(){
  const select=$('profile');select.replaceChildren();
  for(const a of assets.values())if(a.id!=='group-cart'&&(this.tool==='ramps'?a.id.startsWith('jump-'):this.tool==='groups'?!!a.members:this.tool==='obstacles'&&placeableProp(a)))select.add(new Option(a.name,a.id));
 }
 get items(){return this.layout[this.tool];}
 location(v){return this.objects?v.p:v;}
 canRemove(){return this.objects||this.items.length>(this.track.closed?3:2);}
 remember(){this.history.push(structuredClone(this.layout));if(this.history.length>40)this.history.shift();}
 open(track,layout,reset=true){this.track=track;this.layout=layout;this.tool='gates';this.inserting=false;this.selected=-1;if(reset)this.history=[];this.profiles();this.rebuild();this.frame();}
 frame(){if(!this.root)return;const points=samples(this.layout.road,this.track.closed,this.track.id);const box=new T.Box3().setFromPoints(points);box.getCenter(this.view.target);const sz=box.getSize(new T.Vector3());this.view.distance=Math.max(48,sz.x/Math.max(.35,this.view.camera.aspect)*1.9,sz.z*1.85,sz.x*.95);this.view.az=.09;this.view.el=1.03;this.view.camera.fov=42;this.view.camera.updateProjectionMatrix();this.view.orbit();this.draw();}
 clear(){if(this.root)release(this.root);this.root=null;this.route=null;this.labels.replaceChildren();this.drag=null;}
 rebuild(){
  this.clear();const map=buildMap(this.track,this.layout);this.terrain=map.terrain;this.root=new T.Group();this.view.scene.add(this.root);
  this.ground=new Terrain(map.terrain,false).mesh;this.root.add(this.ground);for(const o of map.objects)this.root.add(instance(o));
  const preview=$('raceMode').value==='pursuit'
   ?pursuitGrid(this.track,this.layout.gates,+$('speed').value,+$('laps').value,$('fugitiveCar').value,Array.from(document.querySelectorAll('#pursuitVehicleSlots select'),s=>s.value))
   :startingGrid(this.track,this.layout.gates,+$('cars').value,140,1,Array.from(document.querySelectorAll('#vehicleSlots select'),s=>s.value));
  for(const car of preview.vehicles)this.root.add(instance(car));
  this.view.scene.background=new T.Color('#76c9fa');this.view.lightAt(new T.Vector3(),88);this.overlay();
 }
 overlay(){
  if(!this.root)return;if(this.route)release(this.route);this.route=new T.Group();this.root.add(this.route);
  if(!this.objects){
   const pts=samples(this.items,this.track.closed,this.track.id);pts.forEach(p=>p.y=heightAt(this.terrain,p.x,p.z)+.22);
   this.route.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:this.tool==='road'?'#ffcc61':'#66ffeb',depthTest:false})));this.route.renderOrder=2;
  }
  this.labels.replaceChildren();this.items.forEach((o,i)=>{const l=document.createElement('span');l.className='mark '+this.tool+(i===this.selected?' sel':'');l.textContent=String(i+1);this.labels.append(l);});
  $('width').value=this.layout.width;$('roadWidth').hidden=this.tool!=='road';$('rampTools').hidden=!this.objects;$('undo').disabled=!this.history.length;$('remove').disabled=this.selected<0||!this.canRemove();
  document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===this.tool));$('add').classList.toggle('active',this.inserting);
  if(this.objects&&this.selected>=0){const o=this.items[this.selected];$('profile').value=o.asset;$('yaw').value=Math.round(o.r[1]*180/Math.PI);$('size').value=o.s[0];$('height').value=o.height||0;}
  $('propPhysics').hidden=!this.physicalSelection;
  if(this.physicalSelection){const o=this.items[this.selected],fixed=propBehavior(o)==='static';$('propBehavior').value=propBehavior(o);$('propMass').value=Number(propMass(o).toFixed(2));$('propMass').disabled=fixed;$('propMassReset').disabled=fixed||o.mass===undefined;$('propMassHint').textContent=fixed?'Mass has no effect while the object is fixed.':(this.tool==='groups'?'Total mass distributed among objects. ': '')+(o.mass===undefined?'Automatic based on model and scale.':'Custom mass.');}
  $('tip').textContent=this.inserting?'Click the scene to insert an object.':({road:'Drag a vertex to reshape the road.',gates:'Drag a waypoint to adjust the driving line.',ramps:'Place and adjust ramps.',obstacles:'Place and adjust fixed or movable props.',groups:'Place multiple obstacles at once.'}[this.tool])+' Drag empty space to orbit. Scroll to zoom.';
  this.draw();
 }
 draw(){if(!this.root)return;this.view.draw();const b=this.canvas.getBoundingClientRect();this.screen=[];this.items.forEach((v,i)=>{const p=this.location(v),q=new T.Vector3(p[0],heightAt(this.terrain,p[0],p[2])+.5+(this.objects?(v.height||0):0),p[2]).project(this.view.camera),x=(q.x+1)*b.width/2,y=(1-q.y)*b.height/2;
  const label=this.labels.children[i];if(!label)return;label.style.left=x+'px';label.style.top=y+'px';label.hidden=q.z>1||q.z< -1;this.screen.push([x+b.left,y+b.top]);});}
 pick(e){const hit=this.view.pick(e,[this.ground])[0];if(!hit)return null;return [clamp(hit.point.x,-this.terrain.w/2+4,this.terrain.w/2-4),.06,clamp(hit.point.z,-this.terrain.d/2+4,this.terrain.d/2-4)];}
 down(e){
  if(!this.root)return;this.canvas.setPointerCapture(e.pointerId);const index=this.screen.findIndex(([x,y])=>Math.hypot(x-e.clientX,y-e.clientY)<16);
  this.drag={x:e.clientX,y:e.clientY,orbit:e.button!==0||e.shiftKey||(!this.inserting&&index<0),pan:e.shiftKey||e.button===1};
  if(this.drag.orbit)return;
  if(this.inserting){const p=this.pick(e);if(!p||this.items.length>=(this.objects?120:256))return;
   this.remember();if(this.objects){const s=clamp(+$('size').value||1,.1,5);this.items.push({id:'r'+crypto.getRandomValues(new Uint32Array(1))[0],asset:$('profile').value,p,r:[0,(+$('yaw').value||0)*Math.PI/180,0],s:[s,s,s],height:clamp(+$('height').value||0,-5,30),behavior:this.tool==='ramps'||this.tool==='obstacles'&&assets.get($('profile').value).behavior==='static'?'static':'dynamic'});this.selected=this.items.length-1;}
   else{let best=Infinity,pos=1;const n=this.items.length;for(let i=0;i<n-(this.track.closed?0:1);i++){const a=this.items[i],b=this.items[(i+1)%n],dx=b[0]-a[0],dz=b[2]-a[2],k=clamp(((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(dx*dx+dz*dz||1),0,1),d=Math.hypot(p[0]-a[0]-k*dx,p[2]-a[2]-k*dz);if(d<best){best=d;pos=i+1;}}this.items.splice(pos,0,p);this.selected=pos;}
   this.inserting=false;this.rebuild();return;
  }
  this.selected=index;this.overlay();
 }
 move(e){
  if(!this.root||!this.drag)return;const d=this.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;
  if(d.orbit){this.view.drag(dx,dy,d.pan);this.draw();return;}
  const p=this.pick(e);if(!p||this.selected<0)return;
  if(!this.objects&&this.items.some((v,i)=>i!==this.selected&&Math.hypot(v[0]-p[0],v[2]-p[2])<3))return;
  if(!d.changed)this.remember();d.changed=true;
  if(this.objects){this.items[this.selected].p=p;const mesh=this.root.children.find(o=>o.userData.item?.id===this.items[this.selected].id);if(mesh)mesh.position.set(p[0],heightAt(this.terrain,p[0],p[2])+.04+(this.items[this.selected].height||0),p[2]);}
  else {const old=this.items[this.selected];if(this.tool==='road'){const linked=this.layout.gates.find(v=>Math.hypot(v[0]-old[0],v[2]-old[2])<.01);if(linked)linked.splice(0,3,...p);}this.items[this.selected]=p;}
  this.overlay();
 }
}
