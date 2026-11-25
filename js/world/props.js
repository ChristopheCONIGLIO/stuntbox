import {THREE,box,cylinder,label,material,random,bake} from '../core/util.js';
export function addRoadProp(world,physics,x,z,kind='bin'){
 const {group:baseGroup,props}=world,group=world.dynamicGroup||baseGroup,body=physics.prop(x,z,kind,world.heightAt?.(x,z)||0),m=new THREE.Group();
 m.userData.dynamic=true;group.add(m);
 if(kind==='bin'){
  box(m,.85,1.1,.85,0,0,0,'#627e70');box(m,.95,.14,.95,0,.6,0,'#354f46');box(m,.65,.17,.05,0,.3,.45,'#bdc8a2');
 }else if(kind==='pole'){
  box(m,.2,2.2,.2,0,0,0,'#d9d6bd');box(m,.24,.35,.24,0,.8,0,'#d48261');
 }else if(kind==='cone'){
  cylinder(m,.08,.34,.75,7,0,-.15,0,'#e49a61');box(m,.65,.08,.65,0,-.5,0,'#dcd8c2');box(m,.3,.13,.3,0,-.04,0,'#f5eacb');
 }else if(kind==='shard'){
  box(m,.55,.34,.34,0,0,0,'#e5a46f');box(m,.53,.06,.36,0,.19,0,'#f7edcf');
 }else if(kind==='streetlight'){
  cylinder(m,.12,.17,5.25,7,0,0,0,'#879b94');box(m,2.1,.13,.17,-.82,2.56,0,'#82968e');box(m,.82,.18,.45,-1.68,2.49,0,'#fff1c8');
 }else if(kind==='table'){
  cylinder(m,.78,.78,.13,9,0,.46,0,'#ddc49a');cylinder(m,.12,.17,1.3,7,0,-.13,0,'#6c8173');
 }else if(kind==='chair'){
  box(m,.72,.11,.65,0,.01,0,'#ae8662');box(m,.72,.82,.1,0,.37,-.28,'#ae8662');for(const x of [-.26,.26])box(m,.08,.64,.09,x,-.32,0,'#64766b');
 }else if(kind==='bench'){
  box(m,2.65,.16,.64,0,.15,0,'#c39760');box(m,2.65,.68,.13,0,.53,-.32,'#c39760');
  for(let x of [-1,1])box(m,.12,.65,.5,x,-.2,0,'#60766c');
 }else{
  box(m,1.55,.72,.43,0,-.2,0,'#deaa78');box(m,1.62,.16,.5,0,.2,0,'#f0dfc5');
  for(let i of [-.5,.5])box(m,.2,.18,.55,i,-.3,0,'#e8dfc7');
 }
 props.push({body,mesh:m,kind,broken:false});return props.at(-1);
}
