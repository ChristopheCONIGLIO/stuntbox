import {THREE as T} from '../../core/util.js';

export const marseilleId='marseille',marseilleMapId='marseille-map-v1';
export const marseilleKnots=[
 [-213,-172],[-135,-195],[-36,-211],[70,-211],[166,-196],[239,-157],
 [269,-95],[243,-39],[175,-29],[115,-63],[88,-18],[126,34],
 [205,54],[269,108],[250,163],[174,205],[69,228],[-34,230],
 [-143,218],[-220,182],[-263,130],[-228,81],[-168,88],[-109,140],
 [-64,128],[-86,68],[-154,42],[-218,32],[-273,-11],[-283,-56],
 [-256,-112],[-244,-152]
];
const start=marseilleKnots[0];
const heightRaw=(x,z)=>1.14*Math.sin(x/105)+1.24*Math.cos(z/92)+.46*Math.sin((x+z)/78);
const zero=heightRaw(...start);
export const marseilleHeight=(x,z)=>heightRaw(x,z)-zero;
export const marseilleGates=marseilleKnots.map(([x,z])=>[x,marseilleHeight(x,z)+.10,z]);
const points=marseilleGates.map(v=>new T.Vector3(...v));
export const marseilleCurve=new T.CatmullRomCurve3(points,true,'centripetal');
const loop=t=>(t%1+1)%1;
export function marseilleLane(t,offset=0){
 const u=loop(t),p=marseilleCurve.getPoint(u);
 if(offset){const tangent=marseilleCurve.getTangent(u).normalize();p.x+=tangent.z*offset;p.z-=tangent.x*offset;}
 return p;
}
export function marseilleWidth(t){
 const u=loop(t);
 const base=15.0+1.55*Math.sin(2*Math.PI*u*3+.6);
 const city=u>.05&&u<.22?2.6:0;
 const harbor=u>.87||u<.07?2.2:0;
 const forest=u>.60&&u<.81?-1.5:0;
 return Math.max(12.8,Math.min(19.7,base+city+harbor+forest));
}
export const marseilleSectors=[
 {name:'Vieux-Port & Joliette',from:0,to:.16,color:'#df7954'},
 {name:'Corniche des Catalans',from:.16,to:.30,color:'#329fbb'},
 {name:'La Valentine · grandes courbes',from:.30,to:.46,color:'#78ae59'},
 {name:'Massif des Calanques',from:.46,to:.70,color:'#c99e72'},
 {name:'Col de Sormiou',from:.70,to:.86,color:'#d2ad7e'},
 {name:'Route littorale',from:.86,to:1,color:'#339dbb'}
];
