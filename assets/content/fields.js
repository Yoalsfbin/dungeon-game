let contentFieldPaths=new Set(),contentFieldSafeGround=new Set(),contentFieldTemplate=0,contentLookFocus=null;
const CONTENT_FIELD_START={x:11,y:2,size:26};
const CONTENT_FIELD_LAYOUTS={
 forest:{areas:[[18,2],[14,5],[9,10],[8,15],[6,19]],links:[[0,1],[1,2],[2,3],[3,4]]},
 snowfield:{areas:[[8,2],[11,6],[9,11],[8,16],[12,19]],links:[[0,1],[1,2],[2,3],[3,4]]},
 marsh:{areas:[[17,2],[13,5],[10,9],[6,12],[5,16],[9,19]],links:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
 ashfield:{areas:[[2,5],[6,7],[10,8],[14,11],[18,14],[15,19]],links:[[0,1],[1,2],[2,3],[3,4],[4,5]]}
};
function contentGenerateField(){
 map=Array.from({length:MH},()=>Array(MW).fill(TILE.WALL));seen=Array.from({length:MH},()=>Array(MW).fill(false));contentFieldPaths=new Set();contentFieldSafeGround=new Set();
 const {x:ox,y:oy,size}=CONTENT_FIELD_START,theme=Object.keys(THEMES).find(key=>THEMES[key]===THEME)||contentTheme(floor),layout=CONTENT_FIELD_LAYOUTS[theme]||CONTENT_FIELD_LAYOUTS.forest;
 rooms=[{x:ox,y:oy,w:size,h:size,cx:ox+size/2,cy:oy+size/2}];
 const open=(x,y,safe=false)=>{if(x<0||y<0||x>=size||y>=size)return;const gx=ox+x,gy=oy+y,key=gx+','+gy;map[gy][gx]=TILE.FLOOR;contentFieldPaths.add(key);if(safe)contentFieldSafeGround.add(key);},scale=size/20;
 const areas=layout.areas.map(([x,y],index)=>({x:x*scale,y:y*scale,rx:(1.75+((index*7+floor)%4)*.22)*scale,ry:(1.55+((index*5+floor)%3)*.22)*scale}));
 for(let index=0;index<areas.length;index++){const area=areas[index],phase=index*1.7+floor*.31;for(let y=Math.floor(area.y-area.ry-1);y<=area.y+area.ry+1;y++)for(let x=Math.floor(area.x-area.rx-1);x<=area.x+area.rx+1;x++){const dx=(x-area.x)/area.rx,dy=(y-area.y)/area.ry,angle=Math.atan2(dy,dx),edge=.88+.09*Math.sin(angle*3+phase)+.06*Math.cos(angle*5-phase);if(dx*dx+dy*dy<edge)open(x,y);}}
 for(const[index,[from,to]]of layout.links.entries()){const a=areas[from],b=areas[to],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),sideX=-dy/length,sideY=dx/length,bend=((index+floor)%2?1:-1)*Math.min(1.7*scale,length*.15),steps=Math.ceil(length*5),width=1.42*scale,safeWidth=.86*scale;for(let n=0;n<=steps;n++){const t=n/steps,curve=Math.sin(t*Math.PI)*bend+Math.sin(t*Math.PI*2+index)*.22*scale,cx=a.x+dx*t+sideX*curve,cy=a.y+dy*t+sideY*curve;for(let oy2=-Math.ceil(width);oy2<=Math.ceil(width);oy2++)for(let ox2=-Math.ceil(width);ox2<=Math.ceil(width);ox2++){const distance=ox2*ox2+oy2*oy2;if(distance<=width*width)open(Math.round(cx)+ox2,Math.round(cy)+oy2,distance<=safeWidth*safeWidth);}}}
}
function contentLOS(a,b){const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let n=1;n<steps;n++){const x=Math.round(a.x+dx*n/steps),y=Math.round(a.y+dy*n/steps);if(isWallTile(tileAt(x,y))||contentObjectAt?.(x,y))return false;}return true;}
function contentFieldSight(x,y){const focus=state==='look'&&contentLookFocus?contentLookFocus:player;if(THEME?.outdoor&&!debug)return Math.max(Math.abs(x-focus.x),Math.abs(y-focus.y))<=8&&contentLOS(focus,{x,y});const room=roomAt(focus.x,focus.y);return room?roomAt(x,y)===room:dist(focus,{x,y})<=2&&contentLOS(focus,{x,y});}
function contentCanNotice(observer,target){return !!target&&target.hp>0&&!target.hidden&&dist(observer,target)<=7&&contentLOS(observer,target);}
function contentPlaceDeepExit(){
 if(!THEME?.outdoor||debug||floor>=LAST_FLOOR)return;
 const start={x:player.x,y:player.y},queue=[start],distance=new Map([[start.x+','+start.y,0]]);
 for(let i=0;i<queue.length;i++){const p=queue[i],d=distance.get(p.x+','+p.y);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(!distance.has(key)&&tileAt(x,y)===TILE.FLOOR&&diagonalClear(p.x,p.y,dx,dy)){distance.set(key,d+1);queue.push({x,y});}}}
 const nearPath=p=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(contentFieldPaths.has((p.x+dx)+','+(p.y+dy)))return true;return false;};
 const available=p=>distance.get(p.x+','+p.y)>=8&&contentFieldSafeGround.has(p.x+','+p.y)&&!occupied(p.x,p.y)&&!contentObjectAt?.(p.x,p.y)&&!items.some(o=>Math.abs(o.x-p.x)<=1&&Math.abs(o.y-p.y)<=1)&&!traps.some(o=>Math.abs(o.x-p.x)<=1&&Math.abs(o.y-p.y)<=1);
 const choices=queue.filter(available).sort((a,b)=>distance.get(b.x+','+b.y)-distance.get(a.x+','+a.y));
 const end=choices[0]||queue.filter(p=>distance.get(p.x+','+p.y)>=8&&contentFieldSafeGround.has(p.x+','+p.y)&&!occupied(p.x,p.y)&&!items.some(o=>o.x===p.x&&o.y===p.y)&&!traps.some(o=>o.x===p.x&&o.y===p.y)).sort((a,b)=>distance.get(b.x+','+b.y)-distance.get(a.x+','+a.y))[0];if(!end)return;stairs={x:end.x,y:end.y};
 items=items.filter(o=>Math.abs(o.x-end.x)>1||Math.abs(o.y-end.y)>1);traps=traps.filter(o=>Math.abs(o.x-end.x)>1||Math.abs(o.y-end.y)>1);updateSeen();
}
function installContentFields(){
 const oldNewFloor=newFloor;newFloor=function(){oldNewFloor();if(THEME?.outdoor){contentLookFocus=null;const{ x:ox,y:oy,size }=CONTENT_FIELD_START,aimY=oy+5,candidates=[...contentFieldSafeGround].map(key=>{const[x,y]=key.split(',').map(Number);return{x,y,score:Math.abs(y-aimY)*4+Math.abs(x-(ox+size/2))};}).filter(p=>!monsters.some(m=>m.x===p.x&&m.y===p.y)&&!items.some(i=>i.x===p.x&&i.y===p.y)&&!traps.some(t=>t.x===p.x&&t.y===p.y)).sort((a,b)=>a.score-b.score);if(candidates[0])Object.assign(player,{x:candidates[0].x,y:candidates[0].y,rx:candidates[0].x,ry:candidates[0].y,lx:0,ly:0});if(ally&&candidates[0]){const q=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].map(([dx,dy])=>({x:player.x+dx,y:player.y+dy})).find(p=>walkable(p.x,p.y)&&!occupied(p.x,p.y));if(q)Object.assign(ally,{x:q.x,y:q.y,rx:q.x,ry:q.y,lx:0,ly:0});}if(goal&&!contentFieldSafeGround.has(goal.x+','+goal.y)){const spot=[...contentFieldSafeGround].map(key=>key.split(',').map(Number)).map(([x,y])=>({x,y})).find(p=>!occupied(p.x,p.y)&&!items.some(i=>i.x===p.x&&i.y===p.y)&&!traps.some(t=>t.x===p.x&&t.y===p.y));if(spot)goal=spot;}seen=Array.from({length:MH},()=>Array(MW).fill(false));contentPlaceDeepExit();if(!debug)saveGame();}};
 const oldGen=genMap;genMap=function(){contentFieldPaths=new Set();if(THEMES[contentTheme(floor)]?.outdoor&&!debug)return contentGenerateField();return oldGen();};
 const oldTerrain=placeTerrain;placeTerrain=function(theme){if(THEME?.outdoor){const{x,y,size}=CONTENT_FIELD_START;for(let my=y;my<y+size;my++)for(let mx=x;mx<x+size;mx++)map[my][mx]=contentFieldPaths.has(mx+','+my)?TILE.FLOOR:TILE.WALL;return;}oldTerrain(theme);};
 const oldVisible=visible;visible=function(x,y){if(state==='look')return contentFieldSight(x,y);if(THEME?.outdoor&&!debug)return contentFieldSight(x,y);return oldVisible(x,y);};
 const oldActor=actorOnMap;actorOnMap=function(actor){return THEME?.outdoor?visible(actor.x,actor.y):oldActor(actor);};
 const oldFree=freeSpot;freeSpot=function(avoid){if(!THEME?.outdoor||debug)return oldFree(avoid);const candidates=[...contentFieldSafeGround].map(key=>key.split(',').map(Number));for(let i=0;i<Math.min(1000,candidates.length*3);i++){const[x,y]=candidates[ri(0,candidates.length-1)];if(tileAt(x,y)!==TILE.FLOOR||contentFieldSight(x,y)||occupied(x,y)||items.some(it=>it.x===x&&it.y===y)||traps.some(t=>t.x===x&&t.y===y)||stairs?.x===x&&stairs?.y===y||goal?.x===x&&goal?.y===y)continue;return{x,y};}return null;};
 const oldStartSpawn=spawnInStartRoom;spawnInStartRoom=function(){return THEME?.outdoor?false:oldStartSpawn();};
 const oldAwareness=archerSeesPlayer;archerSeesPlayer=function(monster){return THEME?.outdoor?contentCanNotice(monster,player):oldAwareness(monster);};
 const oldPlaceKeeper=makeShop;makeShop=function(room){if(THEME?.outdoor)return;return oldPlaceKeeper(room);};
}
