function drawContentSleepIcon(context,x,y,now){context.save();context.font='bold 14px monospace';context.textAlign='center';context.strokeStyle='#172239';context.lineWidth=3;context.fillStyle='#e7e8ff';for(let i=0;i<3;i++){const p=((now/1700+i/3)%1),xx=x+i*6,yy=y-p*15;context.globalAlpha=Math.sin(p*Math.PI);context.strokeText(i?'z':'Z',xx,yy);context.fillText(i?'z':'Z',xx,yy);}context.restore();}
function drawContentFieldPath(context,x,y,X,Y,width,height,theme){
 const key=(xx,yy)=>contentFieldPaths.has(xx+','+yy),cardinal=[[0,-1],[1,0],[0,1],[-1,0]],diagonal=[[1,-1],[1,1],[-1,1],[-1,-1]],cardinalLinks=cardinal.filter(([dx,dy])=>key(x+dx,y+dy)),links=cardinalLinks.length?cardinalLinks:diagonal.filter(([dx,dy])=>key(x+dx,y+dy));
 const colors={forest:['#483727','#907049','#b4915d'],snowfield:['#57544b','#9a8c72','#c7b99e'],marsh:['#3c4540','#7b7560','#a99a70'],ashfield:['#482c24','#9a5132','#cc8150']}[theme]||['#49382b','#90704a','#b4915d'];
 const cx=X+width/2,cy=Y+height/2,scale=Math.min(width,height)/64,stroke=(color,thick)=>{context.strokeStyle=color;context.lineWidth=thick*scale;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(cx,cy);for(const[dx,dy]of links){context.moveTo(cx,cy);context.lineTo(cx+dx*width*.56,cy+dy*height*.56);}context.stroke();};
 context.save();context.globalAlpha=.75;stroke(colors[0],17);stroke(colors[1],11);stroke(colors[2],6);
 const hash=(n)=>contentLandscapeHash(x,y,n),specks=7;for(let i=0;i<specks;i++){const px=X+width*(.18+hash(i+1)*.64),py=Y+height*(.18+hash(i+15)*.64),radius=(1+hash(i+28)*2)*scale;context.globalAlpha=.24+hash(i+37)*.2;context.fillStyle=i%2?colors[0]:colors[2];context.beginPath();context.ellipse(px,py,radius*1.6,radius,hash(i+44),0,Math.PI*2);context.fill();}context.restore();
}
const contentFieldPatterns=new Map();
function contentFieldPattern(source,theme,column,row){const key=theme+':'+row;if(contentFieldPatterns.has(key))return contentFieldPatterns.get(key);const width=TS*2,height=TS*2,tile=document.createElement('canvas');tile.width=width;tile.height=height;const tileContext=tile.getContext('2d');tileContext.imageSmoothingEnabled=false;tileContext.drawImage(source.image,column*source.image.width/4,row*source.image.height/3,source.image.width/4,source.image.height/3,0,0,width,height);const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(tile,0,0);context.save();context.translate(width*2,0);context.scale(-1,1);context.drawImage(tile,0,0);context.restore();context.save();context.translate(0,height*2);context.scale(1,-1);context.drawImage(tile,0,0);context.restore();context.save();context.translate(width*2,height*2);context.scale(-1,-1);context.drawImage(tile,0,0);context.restore();const pattern=ctx.createPattern(canvas,'repeat');contentFieldPatterns.set(key,pattern);return pattern;}
function installContentArt(){
 Object.assign(WORLD_MOTION_META,CONTENT_MOTION_META);
 Object.assign(MONSTER_ACCENTS,{
  dragon:[null,'#9a3d50','#594b80'],hinawa:[null,'#667365','#e43c29'],yoroi:[null,'#376b77','#57536c'],kaze:[null,'#ac84cb','#4caa8e'],
  iwakudaki:[null,'#ac493b','#57836e'],kumoito:[null,'#b68a3d','#405aa3'],hari:[null,'#3a8f8b','#ac4f75'],kagami:[null,'#c7d9ea','#d3ad47'],
  yadorigi:[null,'#8f6f99','#2b7961'],kani:[null,'#686087','#468f7b'],mitsukoro:[null,'#cb7a32','#8b4f33']
 });
 for(const meta of Object.values(GAME_CONTENT.extra))contentSource(meta.file);
 const wood=contentSource(GAME_CONTENT.extra['wood-tag'].file),onWood=wood.image.onload;wood.image.onload=()=>{onWood();worldArt.icons.set('item_woodtag',contentFrame('wood-tag'));};
 const originalTile=drawWorldTile;drawWorldTile=function(type,x,y,width,height,worldX=0,worldY=0){const key=Object.keys(THEMES).find(key=>THEMES[key]===THEME),skin=GAME_CONTENT.skins[key],field=['forest','snowfield','marsh','ashfield'].indexOf(key);if(!skin&&field<0)return originalTile(type,x,y,width,height);const file=field>=0?'./assets/world/terrain/terrain-fields.png':'./assets/world/terrain/'+skin.file.split('/').pop(),source=contentSource(file);if(!source.ready)return false;const w=source.image.width/4,h=source.image.height/3,column=field>=0?field:skin.column;if(field>=0){const pattern=contentFieldPattern(source,key,column,0),tx=x-worldX*width,ty=y-worldY*height;pattern.setTransform(new DOMMatrix().translate(tx,ty));ctx.fillStyle=pattern;ctx.fillRect(x,y,width,height);if(type===0&&contentFieldPaths.has(worldX+','+worldY))drawContentFieldPath(ctx,worldX,worldY,x,y,width,height,key);return true;}ctx.drawImage(source.image,column*w+2,type*h+2,w-4,h-4,x,y,width,height);return true;};
 const originalMechanism=drawMechanism;drawMechanism=function(key,x,y,context=ctx){if(key==='stairs'&&state!=='manual'&&THEME.outdoor)return true;return originalMechanism(key,x,y,context);};
 const originalGoal=drawGoalItem;drawGoalItem=function(context,x,y,size,now){const image=contentFrame('goal-orb');if(image){context.drawImage(image,x-4,y-8+Math.sin(now/350)*2,size+8,size+8);return;}originalGoal(context,x,y,size,now);};
 const originalDraw=draw;draw=function(now=NOW()){
  originalDraw(now);if(!contentCutIn||state==='title')return;
  const elapsed=now-contentCutIn.t0,duration=1050;if(elapsed<0)return;if(elapsed>=duration){contentCutIn=null;return;}
  const image=heroPortraits.get(contentCutIn.character);if(!image)return;
  const progress=Math.min(1,elapsed/150),ease=1-Math.pow(1-progress,3),fade=elapsed<810?1:Math.max(0,(duration-elapsed)/240),slide=(1-ease)*-cv.width*.72;
  const[x,y,w,h]=HERO_PORTRAIT_RECTS[contentCutIn.character],scale=Math.min(cv.height*1.02/h,cv.width*.61/w),panelW=cv.width*.61;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=fade;
  // Manga-style cut-in panel slams over the left side while leaving the action visible.
  ctx.beginPath();ctx.moveTo(slide,0);ctx.lineTo(slide+panelW,0);ctx.lineTo(slide+panelW-cv.width*.1,cv.height);ctx.lineTo(slide,cv.height);ctx.closePath();
  ctx.fillStyle='#101722';ctx.fill();ctx.save();ctx.clip();
  ctx.fillStyle='#f3c650';ctx.fillRect(slide,0,panelW,cv.height);
  ctx.globalAlpha=fade*.2;ctx.strokeStyle='#fff7dc';ctx.lineWidth=2;
  for(let i=-12;i<18;i++){const bx=slide+panelW*.48,by=cv.height*.45,ex=slide+i*cv.width*.105,ey=i%2?cv.height:-cv.height*.25;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.stroke();}
  ctx.globalAlpha=fade;ctx.drawImage(image,x,y,w,h,slide+panelW*.015,cv.height-h*scale+cv.height*.035,w*scale,h*scale);
  ctx.restore();
  ctx.beginPath();ctx.moveTo(slide,0);ctx.lineTo(slide+panelW,0);ctx.lineTo(slide+panelW-cv.width*.1,cv.height);ctx.lineTo(slide,cv.height);ctx.closePath();
  ctx.lineWidth=Math.max(7,cv.width*.012);ctx.strokeStyle='#101722';ctx.stroke();ctx.lineWidth=Math.max(3,cv.width*.005);ctx.strokeStyle='#fff4d2';ctx.stroke();
  const label=contentCutIn.name||'特技';ctx.save();ctx.translate(slide+panelW*.52,cv.height*.82);ctx.rotate(-.045);ctx.font=`900 ${Math.max(26,cv.width*.052)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(7,cv.width*.012);ctx.strokeStyle='#18202c';ctx.strokeText(label,0,0,panelW*.82);ctx.fillStyle='#fff8dc';ctx.fillText(label,0,0,panelW*.82);ctx.restore();ctx.restore();
 };Object.assign(draw,originalDraw);
}
