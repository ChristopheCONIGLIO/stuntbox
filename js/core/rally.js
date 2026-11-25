export function rallyOutcome(car,dt){
 const state=car.rallyState??={still:0,overturned:0};
 if(car.arcade.done)return 'Finished';
 const v=car.body.linvel(),q=car.body.rotation();
 state.still=Math.hypot(v.x,v.y,v.z)<.7?state.still+dt:0;
 state.overturned=1-2*(q.x*q.x+q.z*q.z)<.2?state.overturned+dt:0;
 if(state.overturned>=1)return 'Overturned';
 if(state.still>=5||car.arcade.out||car.disabled)return 'Stuck';
 return null;
}
