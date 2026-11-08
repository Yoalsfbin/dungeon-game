function contentFlee(monster){
 const directions=[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]],key=(x,y)=>y*MW+x;
 const threats=[player,...(ally?.joined?[ally]:[]),...(monster.kind==='mitsukoro'?monsters.filter(m=>m!==monster&&m.ai!=='morsel'&&!m.peaceful&&m.hp>0):[])];
 const danger=new Map(),wave=[];for(const actor of threats){danger.set(key(actor.x,actor.y),0);wave.push({x:actor.x,y:actor.y});}
 for(let i=0;i<wave.length;i++){const p=wave[i],distance=danger.get(key(p.x,p.y))+1;for(const[dx,dy]of directions){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(danger.has(k)||!canStep(p.x,p.y,dx,dy))continue;danger.set(k,distance);wave.push({x,y});}}
 const start=key(monster.x,monster.y),paths=new Map([[start,{x:monster.x,y:monster.y,depth:0,first:null}]]),open=[paths.get(start)];let best=null,bestScore=-Infinity;
 for(let i=0;i<open.length;i++){const p=open[i];if(p.depth>=10)continue;for(const[dx,dy]of directions){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(paths.has(k)||!monCanStep(monster,p.x,p.y,dx,dy)||occupied(x,y)||sanctAt(x,y)||tileAt(x,y)===TILE.LAVA||traps.some(t=>t.x===x&&t.y===y&&t.seen))continue;
   const node={x,y,depth:p.depth+1,first:p.first||{x,y}},exits=directions.filter(([a,b])=>canStep(x,y,a,b)&&!occupied(x+a,y+b)).length;paths.set(k,node);open.push(node);
   const distance=danger.get(k)??MW+MH,score=distance*6+Math.min(4,exits)*1.5-node.depth*.2;if(score>bestScore){best=node;bestScore=score;}
  }}
 if(best?.first)moveEnt(monster,best.first.x,best.first.y);else if(threats[0])stepToward(monster,threats[0].x,threats[0].y,true);
}
