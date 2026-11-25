import {THREE,box,cylinder,material} from '../core/util.js';
const RADIUS=5.15,CENTER=6.65,LIP=12.5,RAMP_END=30,RAMP_HEIGHT=4.7;
const firePoint=(route,distance,lateral=0,y=0)=>({x:route.outX*distance+route.outZ*lateral,y,z:route.outZ*distance-route.outX*lateral});

const addMesh=(group,geometry,mat)=>{const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
function line(group,from,to,width,color){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),dir=b.clone().sub(a),m=box(group,width,width,dir.length(),...(a.clone().add(b).multiplyScalar(.5).toArray()),color);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir.normalize());return m;}
export function ramp(scene,physics,route){
 const root=new THREE.Group();scene.add(root);
 const half=route.width/2;
 const a=firePoint(route,RAMP_END,-half,-.045),b=firePoint(route,RAMP_END,half,-.045);
 const c=firePoint(route,LIP,-half,RAMP_HEIGHT),d=firePoint(route,LIP,half,RAMP_HEIGHT);
 const e=firePoint(route,RAMP_END,-half,-.10),f=firePoint(route,RAMP_END,half,-.10);
 const g=firePoint(route,LIP,-half,-.10),h=firePoint(route,LIP,half,-.10);
 const points=[a,b,c,d,e,f,g,h],verts=[];
 for(const p of points)verts.push(p.x,p.y,p.z);
 const faces=[0,1,2,1,3,2,4,6,5,5,6,7,0,4,1,1,4,5,2,3,6,3,7,6,0,2,4,2,6,4,1,5,3,3,5,7];
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setIndex(faces);geometry.computeVertexNormals();
 const wedge=addMesh(root,geometry,material('#84919a',{side:THREE.DoubleSide,roughness:.86,metalness:.11}));wedge.receiveShadow=true;
 const top=[a.x,a.y+.015,a.z,b.x,b.y+.015,b.z,c.x,c.y+.015,c.z,d.x,d.y+.015,d.z];
 const surfaceGeometry=new THREE.BufferGeometry();surfaceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(top,3));surfaceGeometry.setIndex([0,1,2,1,3,2]);surfaceGeometry.computeVertexNormals();
 const surface=addMesh(root,surfaceGeometry,material('#6f808b',{side:THREE.DoubleSide,roughness:.95}));surface.castShadow=false;surface.receiveShadow=true;
 wedge.userData.rideHull=true;
 for(const lateral of [-half+.14,half-.14]){
  const outer=firePoint(route,RAMP_END,lateral,.02),inner=firePoint(route,LIP,lateral,RAMP_HEIGHT+.065);
  line(root,[outer.x,outer.y,outer.z],[inner.x,inner.y,inner.z],.17,'#f1bd73');
 }
 for(let i=0;i<11;i++){
  const t=(i+.5)/11,dist=RAMP_END-(RAMP_END-LIP)*t;
  const height=-.045+(RAMP_HEIGHT+.045)*t+.044;
  const left=firePoint(route,dist,-half+.65,height),right=firePoint(route,dist,half-.65,height);
  line(root,[left.x,left.y,left.z],[right.x,right.y,right.z],.052,i%3===0?'#e1cbb1':'#b2c2cb');
 }
 const lipStart=firePoint(route,LIP,-half+.28,RAMP_HEIGHT+.065);
 const lipEnd=firePoint(route,LIP,half-.28,RAMP_HEIGHT+.065);
 line(root,[lipStart.x,lipStart.y,lipStart.z],[lipEnd.x,lipEnd.y,lipEnd.z],.18,'#f4d18f');
 return {route,geometry,body:'hull'};
}
export function ring(scene,physics){
 const mount=new THREE.Group();mount.position.set(0,CENTER,0);scene.add(mount);
 const gray=material('#7b858e',{metalness:.75,roughness:.3}),bright=new THREE.MeshStandardMaterial({color:'#ff6819',emissive:'#ff4100',emissiveIntensity:2.25,metalness:.16,roughness:.45}),core=new THREE.MeshBasicMaterial({color:'#ffd58c'});
 const rear=addMesh(mount,new THREE.TorusGeometry(RADIUS,.59,12,64),gray);rear.position.z=-.33;
 addMesh(mount,new THREE.TorusGeometry(RADIUS,.39,10,64),bright);
 const halo=addMesh(mount,new THREE.TorusGeometry(RADIUS,.13,8,64),core);halo.position.z=.35;
 for(let i=0;i<30;i++){
  const theta=i*Math.PI*2/30,x=Math.cos(theta)*RADIUS,y=Math.sin(theta)*RADIUS;
  if(i%3===0){const stud=box(mount,.42,.7,.56,x,y,-.4,'#434e55');stud.rotation.z=theta;}
 }
 const flames=[];
 const footGroup=new THREE.Group();scene.add(footGroup);
 const poleTop=CENTER-RADIUS+.13,poleHeight=poleTop-.18;
 cylinder(footGroup,1.05,1.22,.34,20,0,.17,0,'#5b666e');
 cylinder(footGroup,.45,.57,poleHeight,18,0,.18+poleHeight/2,0,'#78848d');
 cylinder(footGroup,.67,.57,.19,18,0,poleTop-.10,0,'#424e57');
 physics.fixedBox(0,poleTop/2,0,.48,poleTop/2,.48,'fire-post');
 const light=new THREE.PointLight('#ff6b22',90,45,2);light.position.set(0,CENTER,.3);scene.add(light);
 return {mount,flames,light,phase:0};
}
