import {THREE,box,label} from '../core/util.js';
export function sign(root,top,bottom,x,z,opt={}){
 const width=opt.width||11,height=opt.height||5.1,y=opt.y||6.8;
 const g=new THREE.Group();g.position.set(x,opt.baseY||0,z);g.rotation.y=opt.yaw||0;root.add(g);
 for(const s of [-1,1]){box(g,.19,y-1,.19,s*width*.40,(y-1)/2,0,'#7c8984');box(g,.85,.18,.9,s*width*.40,.12,0,'#a6afa5');}
 box(g,width+.55,height+.55,.26,0,y,0,'#e6e9dc');
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
 ctx.fillStyle=opt.bg||'#e0a45c';ctx.fillRect(0,0,1024,512);
 if(opt.warning){ctx.strokeStyle='#242b28';ctx.lineWidth=27;ctx.strokeRect(15,15,994,482);}
 if(opt.stripes){ctx.fillStyle='#222c2b';for(let i=-800;i<1800;i+=150){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+42,0);ctx.lineTo(i+460,512);ctx.lineTo(i+405,512);ctx.fill();}ctx.fillStyle=opt.bg||'#e0a45c';ctx.fillRect(87,80,850,355);}
 ctx.fillStyle=opt.fg||'#202b27';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font=`900 ${opt.topSize||112}px Arial,sans-serif`;ctx.fillText(top,512,bottom?204:267,910);
 if(bottom){ctx.font=`900 ${opt.bottomSize||98}px Arial,sans-serif`;ctx.fillText(bottom,512,344,910);}
 if(opt.arrow){ctx.strokeStyle='#f4f5e8';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(800,410);ctx.lineTo(860,350);ctx.lineTo(800,290);ctx.stroke();}
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
 const board=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide}));board.position.set(0,y,.17);board.userData.keep=true;g.add(board);
 return {group:g,board,position:new THREE.Vector3(x,y+(opt.baseY||0),z),width,height};
}
export function excavator(){const excavator=new THREE.Group();
 box(excavator,4.4,.78,3.2,0,.78,0,'#e1b44a');
 for(const s of [-1,1])box(excavator,.78,.7,4.1,s*1.84,.5,0,'#455151');
 box(excavator,2.25,2.25,2.0,-.7,2.05,0,'#e8bf53');box(excavator,.12,1.1,1.4,-1.83,2.13,0,'#56777c');
 const boom=box(excavator,.72,.72,5.2,1.45,3.7,1.65,'#edc05b');boom.rotation.x=.65;
 const arm=box(excavator,.59,.59,3.2,2.05,2.9,5.1,'#edc05b');arm.rotation.x=-.55;
 box(excavator,2.15,.75,1.05,2.2,1.83,6.8,'#515d58');
return excavator;}
export function parking(g,x,z){box(g,13,.035,13,x,.26,z,'#afb3a2');for(let i=0;i<4;i++){box(g,.12,.02,5,x-5+i*3.2,.3,z,'#e9dfc7');}box(g,10,.02,.12,x,.3,z-2.5,'#e9dfc7');}
export function freewaySign(root,top,bottom,x,z,base=0,yaw=0,warning=false){const g=new THREE.Group();g.position.set(x,base,z);g.rotation.y=yaw;root.add(g);for(const s of [-1,1])box(g,.18,7,.18,s*4,3.5,0,'#889a9b');box(g,10.8,4,.24,0,7,0,warning?'#e5a64b':'#245d58');label(g,top,10.3,1.6,0,7.9,.14,warning?'#e5a64b':'#245d58',warning?'#242d2e':'#fff1da');label(g,bottom,10.3,1.6,0,6.25,.14,warning?'#e5a64b':'#245d58',warning?'#242d2e':'#fff1da');return g;}
