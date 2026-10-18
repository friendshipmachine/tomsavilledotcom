(() => {
 const grid=document.querySelector('.project-covers');
 if(!grid)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const states=[...grid.querySelectorAll('.project-cover')].map(el=>({el,p:[0,0,1,0],v:[0,0,0,0],target:[0,0,1,0],pending:null,due:0}));
 let hovered=null,focused=null,active=null,frame=0,last=0;
 const center=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.width*.391,w:r.width};};
 function paint(s){s.el.style.setProperty('--push-x',s.p[0]+'px');s.el.style.setProperty('--push-y',s.p[1]+'px');s.el.style.setProperty('--tile-scale',s.p[2]);s.el.style.setProperty('--tile-roll',s.p[3]+'deg');}
 function tick(now){
  const dt=Math.min((now-last)/1000||.016, .032);last=now;
  let moving=false;
  for(const s of states){
   if(s.pending){moving=true;if(now>=s.due){s.target=s.pending;s.pending=null;}}
   for(let i=0;i<4;i++){
    const k=i===2?65:52, damping=i===2?12:10;
    s.v[i]+=(k*(s.target[i]-s.p[i])-damping*s.v[i])*dt;
    s.p[i]+=s.v[i]*dt;
    const epsilon=i===2?.00008:.008;
    if(Math.abs(s.v[i])+Math.abs(s.target[i]-s.p[i])>epsilon)moving=true;
    else{s.p[i]=s.target[i];s.v[i]=0;}
   }
   paint(s);
  }
  frame=moving?requestAnimationFrame(tick):0;
 }
 function start(){if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
 function reset(){cancelAnimationFrame(frame);frame=0;active=null;states.forEach(s=>{s.p=[0,0,1,0];s.v=[0,0,0,0];s.target=[0,0,1,0];s.pending=null;s.el.classList.remove('motion-active');paint(s);});}
 function aim(el,event){
  if(reduced.matches){reset();return;}
  const changed=active!==el;active=el;
  const origin=el?center(el):null,now=performance.now();
  const mx=origin&&event?Math.max(-1,Math.min(1,(event.clientX-origin.x)/(origin.w/2))):0;
  const my=origin&&event?Math.max(-1,Math.min(1,(event.clientY-origin.y)/(origin.w*.391))):0;
  states.forEach(s=>{
   s.el.classList.toggle('motion-active',s.el===el);
   let target=[0,0,1,0],delay=0;
   if(origin){
    if(s.el===el)target=[mx*9,-6+my*7,1.15,mx*.55];
    else{
     const c=center(s.el),dx=c.x-origin.x-mx*18,dy=c.y-origin.y-my*14,d=Math.hypot(dx,dy)||1;
     // Compact ripple: immediate neighbors move, distant rows stay still.
     const reach=origin.w*2.65;
     const proximity=Math.max(0,1-d/reach);
     const smooth=proximity*proximity*(3-2*proximity);
     const influence=Math.abs(dy)>origin.w*1.9?0:smooth*smooth;
     target=[dx/d*48*influence,dy/d*48*influence,1-.24*influence,(dx/d)*.8*influence];
     delay=influence>0?Math.min(170,d*.12):0;
    }
   }
   if(changed){s.pending=target;s.due=now+delay;}
   else if(s.pending)s.pending=target;
   else s.target=target;
  });start();
 }
 states.forEach(({el})=>{
  el.addEventListener('pointerenter',e=>{if(fine.matches){hovered=el;aim(el,e);}});
  el.addEventListener('pointermove',e=>{if(fine.matches&&hovered===el)aim(el,e);});
  el.addEventListener('pointerleave',()=>{hovered=null;aim(focused);});
  el.addEventListener('focus',()=>{focused=el;aim(el);});
  el.addEventListener('blur',()=>{focused=null;aim(hovered);});
 });
 reduced.addEventListener('change',reset);
 fine.addEventListener('change',reset);
 window.addEventListener('resize',()=>aim(hovered||focused));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
})();
