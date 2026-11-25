import {THREE as T} from '../../core/util.js';
export function fragmentLayout(size,index){
 const axis=size.x>=size.z?'x':'z',other=axis==='x'?'z':'x';
 const h={x:size.x,y:size.y/2,z:size.z};h[axis]/=3;
 const offset={x:0,y:(index<3?-1:1)*size.y/2,z:0};
 offset[axis]=(index%3-1)*size[axis]*2/3;
 return {h,offset,axis,other};
}
export function fragmentColor(asset,i,fallback){
 if(asset==='police-exit-panel')return i%2===0?'#e9dfc5':'#cd6243';
 if(asset==='crate')return ['#bb8853','#dfba83','#96663e'][i%3];
 return fallback;
}

export class FragmentBatch{
 constructor(root,capacity=150){this.root=root;this.capacity=capacity;this.items=[];this.matrix=new T.Matrix4();this.position=new T.Vector3();this.rotation=new T.Quaternion();this.scale=new T.Vector3();this.color=new T.Color();this.dirtySlots=new Set();}
 prepare(){
  if(!this.mesh){
   this.mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0xffffff,roughness:.72}),this.capacity);
   this.mesh.name='Police#1 · Instanced fragments';this.mesh.count=0;this.mesh.castShadow=true;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.setColorAt(0,this.color.set(0xffffff));this.mesh.visible=false;this.root.add(this.mesh);
  }
  return this.mesh;
 }
 add(position,rotation,h,color){
  if(this.items.length>=this.capacity)return null;
  this.prepare();
  const item={slot:this.items.length,h,color};this.items.push(item);this.mesh.count=this.items.length;this.mesh.visible=true;
  this.mesh.setColorAt(item.slot,this.color.set(color));this.mesh.instanceColor.needsUpdate=true;this.update(item,position,rotation);return item;
 }
 update(item,p,q){
  this.position.copy(p);this.rotation.copy(q);this.scale.copy(item.h).multiplyScalar(2);
  this.matrix.compose(this.position,this.rotation,this.scale);this.mesh.setMatrixAt(item.slot,this.matrix);this.dirtySlots.add(item.slot);this.dirty=true;
 }
 remove(item){
  const i=item.slot,last=this.items.pop();
  if(i<this.items.length){this.mesh.getMatrixAt(last.slot,this.matrix);this.mesh.setMatrixAt(i,this.matrix);this.mesh.setColorAt(i,this.color.set(last.color));this.mesh.instanceColor.needsUpdate=true;this.items[i]=last;last.slot=i;this.dirtySlots.add(i);this.dirty=true;}
  item.slot=-1;this.mesh.count=this.items.length;this.mesh.visible=this.items.length>0;
 }
 flush(){
  if(!this.dirty)return;
  const a=this.mesh.instanceMatrix,slots=[...this.dirtySlots].filter(i=>i<this.mesh.count).sort((x,y)=>x-y);
  if(slots.length){
   if(a.addUpdateRange){
    let first=slots[0],last=first;
    for(let i=1;i<slots.length;i++){const slot=slots[i];if(slot===last+1){last=slot;continue;}a.addUpdateRange(first*16,(last-first+1)*16);first=last=slot;}
    a.addUpdateRange(first*16,(last-first+1)*16);
   }
   a.needsUpdate=true;
  }
  this.dirtySlots.clear();this.dirty=false;
 }
 dispose(){this.mesh?.dispose();}
}

export function syncFragment(batch,d){
 const sleeping=d.body.isSleeping();if(sleeping&&d.visualSleeping)return false;
 d.visualSleeping=sleeping;batch.update(d.instance,d.body.translation(),d.body.rotation());return true;
}
