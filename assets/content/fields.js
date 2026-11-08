let contentFieldPaths=new Set(),contentFieldTemplate=0,contentLookFocus=null;
const CONTENT_FIELD_TEMPLATES=[[[0,1],[1,4],[4,5],[5,2],[4,3]],[[0,1],[1,2],[1,4],[4,3],[4,5]],[[0,3],[3,4],[4,1],[1,2],[4,5]],[[0,1],[1,4],[4,3],[4,5],[5,2]],[[0,3],[3,4],[4,5],[5,2],[5,1]],[[0,1],[1,2],[2,5],[5,4],[4,3]],[[0,1],[1,4],[4,2],[4,5],[5,3]],[[0,3],[3,4],[4,1],[4,5],[5,2]]];
function contentGenerateField(){
 map=Array.from({length:MH},()=>Array(MW).fill(TILE.WALL));seen=Array.from({length:MH},()=>Array(MW).fill(false));rooms=[];contentFieldPaths=new Set();contentFieldTemplate=ri(0,CONTENT_FIELD_TEMPLATES.length-1);
 const centers=[[.13,.18],[.48,.14],[.84,.21],[.2,.73],[.51,.57],[.82,.79]],noise=(x,y)=>Math.sin(x*12.9898+y*78.233+contentFieldTemplate*31.3)*43758.5453;
 for(const[fx,fy]of centers){const cx=Math.round(MW*fx)+ri(-2,2),cy=Math.round(MH*fy)+ri(-2,2),w=ri(8,12),h=ri(6,9);rooms.push({x:Math.max(3,cx-(w>>1)),y:Math.max(3,cy-(h>>1)),w,h,cx,cy});}
 for(let i=0;i<rooms.length;i++){const room=rooms[i],phase=i*.9+contentFieldTemplate;for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++){const dx=(x-room.cx)/(room.w*.53),dy=(y-room.cy)/(room.h*.53),angle=Math.atan2(dy,dx),edge=.84+.11*Math.sin(angle*3+phase)+.07*Math.sin(angle*5-phase)+.06*(noise(x,y)%1);if(dx*dx+dy*dy<edge&&x>1&&y>1&&x<MW-2&&y<MH-2)map[y][x]=TILE.FLOOR;}}
 const carve=(a,b,index)=>{const dx=b.cx-a.cx,dy=b.cy-a.cy,length=Math.hypot(dx,dy);if(!length)return;const bend=(R()<.5?-1:1)*Math.min(5,length*.22),steps=Math.ceil(length*1.8),wide=index%4===0?2:1,sideX=-dy/length,sideY=dx/length;let previous=null;const open=(xx,yy)=>{if(xx>1&&yy>1&&xx<MW-2&&yy<MH-2){map[yy][xx]=TILE.FLOOR;contentFieldPaths.add(xx+','+yy);}};for(let i=0;i<=steps;i++){const t=i/steps,curve=Math.sin(t*Math.PI)*bend+Math.sin(t*Math.PI*2+contentFieldTemplate)*.8,x=Math.round(a.cx+dx*t+sideX*curve),y=Math.round(a.cy+dy*t+sideY*curve);if(previous&&x!==previous.x&&y!==previous.y){open(x,previous.y);open(previous.x,y);}for(let offset=0;offset<wide;offset++){const shift=offset-(wide-1)/2,xx=Math.round(x+sideX*shift),yy=Math.round(y+sideY*shift);open(xx,yy);}previous={x,y};}};
 CONTENT_FIELD_TEMPLATES[contentFieldTemplate].forEach(([from,to],index)=>carve(rooms[from],rooms[to],index));
 // Small internal tree and rock islands break up broad clearings while keeping routes connected.
 for(let i=0;i<15;i++){const x=ri(4,MW-5),y=ri(4,MH-5);if(map[y][x]!==TILE.FLOOR||rooms.some(r=>Math.hypot((x-r.cx)/r.w,(y-r.cy)/r.h)<.5))continue;let nearPath=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(contentFieldPaths.has((x+dx)+','+(y+dy)))nearPath=true;if(nearPath)continue;for(const[dx,dy]of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])if(map[y+dy]?.[x+dx]===TILE.FLOOR&&!contentFieldPaths.has((x+dx)+','+(y+dy)))map[y+dy][x+dx]=TILE.WALL;}
}
function contentLOS(a,b){const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let n=1;n<steps;n++){const x=Math.round(a.x+dx*n/steps),y=Math.round(a.y+dy*n/steps);if(isWallTile(tileAt(x,y))||contentObjectAt?.(x,y))return false;}return true;}
function contentFieldSight(x,y){const focus=state==='look'&&contentLookFocus?contentLookFocus:player;if(THEME?.outdoor&&!debug)return Math.max(Math.abs(x-focus.x),Math.abs(y-focus.y))<=8&&contentLOS(focus,{x,y});const room=roomAt(focus.x,focus.y);return room?roomAt(x,y)===room:dist(focus,{x,y})<=2&&contentLOS(focus,{x,y});}
function contentCanNotice(observer,target){return !!target&&target.hp>0&&!target.hidden&&dist(observer,target)<=7&&contentLOS(observer,target);}
function contentPlaceDeepExit(){
 if(!THEME?.outdoor||debug||floor>=LAST_FLOOR)return;
 const start={x:player.x,y:player.y},queue=[start],distance=new Map([[start.x+','+start.y,0]]);
 for(let i=0;i<queue.length;i++){const p=queue[i],d=distance.get(p.x+','+p.y);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(!distance.has(key)&&tileAt(x,y)===TILE.FLOOR&&diagonalClear(p.x,p.y,dx,dy)){distance.set(key,d+1);queue.push({x,y});}}}
 const nearPath=p=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(contentFieldPaths.has((p.x+dx)+','+(p.y+dy)))return true;return false;};
 const available=p=>distance.get(p.x+','+p.y)>=8&&!nearPath(p)&&!occupied(p.x,p.y)&&!contentObjectAt?.(p.x,p.y)&&!items.some(o=>Math.abs(o.x-p.x)<=1&&Math.abs(o.y-p.y)<=1)&&!traps.some(o=>Math.abs(o.x-p.x)<=1&&Math.abs(o.y-p.y)<=1);
 const choices=queue.filter(available).sort((a,b)=>distance.get(b.x+','+b.y)-distance.get(a.x+','+a.y));
 const end=choices[0]||queue.filter(p=>distance.get(p.x+','+p.y)>=8&&!occupied(p.x,p.y)&&!items.some(o=>o.x===p.x&&o.y===p.y)&&!traps.some(o=>o.x===p.x&&o.y===p.y)).sort((a,b)=>distance.get(b.x+','+b.y)-distance.get(a.x+','+a.y))[0];if(!end)return;stairs={x:end.x,y:end.y};for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=end.x+dx,y=end.y+dy;if(x>1&&y>1&&x<MW-2&&y<MH-2)map[y][x]=TILE.FLOOR;}
 items=items.filter(o=>Math.abs(o.x-end.x)>1||Math.abs(o.y-end.y)>1);traps=traps.filter(o=>Math.abs(o.x-end.x)>1||Math.abs(o.y-end.y)>1);updateSeen();
}
function installContentFields(){
 const oldNewFloor=newFloor;newFloor=function(){oldNewFloor();if(THEME?.outdoor){contentLookFocus=null;contentPlaceDeepExit();if(!debug)saveGame();}};
 const oldGen=genMap;genMap=function(){contentFieldPaths=new Set();if(THEMES[contentTheme(floor)]?.outdoor&&!debug)return contentGenerateField();return oldGen();};
 const oldTerrain=placeTerrain;placeTerrain=function(theme){oldTerrain(theme);if(THEME.outdoor)for(const key of contentFieldPaths){const[x,y]=key.split(',').map(Number);map[y][x]=TILE.FLOOR;}};
 const oldVisible=visible;visible=function(x,y){if(state==='look')return contentFieldSight(x,y);if(THEME?.outdoor&&!debug)return contentFieldSight(x,y);return oldVisible(x,y);};
 const oldActor=actorOnMap;actorOnMap=function(actor){return THEME?.outdoor?visible(actor.x,actor.y):oldActor(actor);};
 const oldFree=freeSpot;freeSpot=function(avoid){if(!THEME?.outdoor||debug)return oldFree(avoid);for(let i=0;i<1000;i++){const x=ri(2,MW-3),y=ri(2,MH-3);if(tileAt(x,y)!==TILE.FLOOR||contentFieldSight(x,y)||occupied(x,y)||avoid&&roomAt(x,y)===avoid||items.some(it=>it.x===x&&it.y===y)||traps.some(t=>t.x===x&&t.y===y)||stairs?.x===x&&stairs?.y===y||goal?.x===x&&goal?.y===y)continue;return{x,y};}return null;};
 const oldAwareness=archerSeesPlayer;archerSeesPlayer=function(monster){return THEME?.outdoor?contentCanNotice(monster,player):oldAwareness(monster);};
 const oldPlaceKeeper=makeShop;makeShop=function(room){if(THEME?.outdoor)return;return oldPlaceKeeper(room);};
}
