const contentLandscapeCache=new Map();
function drawContentShore(context,x,y,X,Y,now){
 const snow=THEME===THEMES.snow||THEME===THEMES.snowfield||THEME===THEMES.ice;
 context.save();context.beginPath();context.rect(X,Y,TS,TS);context.clip();
 for(const[dx,dy,angle]of [[0,-1,0],[1,0,Math.PI/2],[0,1,Math.PI],[-1,0,-Math.PI/2]]){
  if(tileAt(x+dx,y+dy)===TILE.WATER)continue;
  context.save();context.translate(X+TS/2,Y+TS/2);context.rotate(angle);context.translate(-TS/2,-TS/2);
  const coast=offset=>{context.beginPath();context.moveTo(-3,offset+2);for(let n=0;n<4;n++){const wave=contentLandscapeHash(x+n*dx,y+n*dy,n+15)*3;context.quadraticCurveTo((n+.5)*TS/4,offset+wave,n*TS/4+TS/4,offset+1);}context.stroke();};
  context.strokeStyle=snow?'rgba(197,221,228,.75)':'rgba(66,78,61,.65)';context.lineWidth=8;coast(0);
  context.strokeStyle=snow?'rgba(226,244,246,.6)':'rgba(135,157,132,.5)';context.lineWidth=2;coast(5);
  context.strokeStyle='rgba(163,214,221,.2)';context.lineWidth=1;coast(8+Math.sin(now/900+x+y));context.restore();
 }
 context.restore();
}
function drawContentLavaShore(context,x,y,X,Y,now){
 context.save();context.beginPath();context.rect(X,Y,TS,TS);context.clip();
 for(const[dx,dy,angle]of [[0,-1,0],[1,0,Math.PI/2],[0,1,Math.PI],[-1,0,-Math.PI/2]]){
  if(tileAt(x+dx,y+dy)===TILE.LAVA)continue;
  context.save();context.translate(X+TS/2,Y+TS/2);context.rotate(angle);context.translate(-TS/2,-TS/2);
  context.beginPath();context.moveTo(-4,1);for(let n=0;n<=6;n++){const px=n*TS/6,noise=(contentLandscapeHash(x+n*dx,y+n*dy,9)-.5)*7;context.lineTo(px,3+noise);}
  context.strokeStyle='rgba(24,12,10,.9)';context.lineWidth=12;context.lineCap='round';context.stroke();
  context.strokeStyle='rgba(100,43,27,.95)';context.lineWidth=8;context.stroke();
  context.strokeStyle='rgba(238,104,37,.78)';context.lineWidth=3;context.stroke();
  context.strokeStyle='rgba(255,202,92,.78)';context.lineWidth=1.2;context.stroke();context.restore();
 }
 context.restore();
}
const contentExitFrames=new Map();
function contentExitFrame(theme){
 const key={forest:'exit-trail',snowfield:'exit-pass',marsh:'exit-bridge',ashfield:'exit-gate'}[theme],meta=GAME_CONTENT.extra[key];if(!meta)return null;if(contentExitFrames.has(theme))return contentExitFrames.get(theme);
 const source=contentSource(meta.file);if(!source.ready)return null;contentExitFrames.set(theme,source.image);return source.image;
}
function contentFieldAssetsReady(){
 if(!THEME?.outdoor||debug)return true;
 const theme=Object.keys(THEMES).find(key=>THEMES[key]===THEME),column=['forest','snowfield','marsh','ashfield'].indexOf(theme);
 if(column<0)return true;
 const terrain=contentSource('./assets/world/terrain/terrain-fields.png');
 const scene=contentFieldScene(theme);
 for(let row=0;row<3;row++)contentPropFrame(column,row);
 contentExitFrame(theme);
 const files=['tree','shrub','grass'].map(name=>`./assets/world/fields/${theme}/${name}.png`),exitKey={forest:'exit-trail',snowfield:'exit-pass',marsh:'exit-bridge',ashfield:'exit-gate'}[theme];
 files.push(GAME_CONTENT.extra[exitKey].file);
 return (scene.ready||scene.failed)&&(terrain.ready||terrain.failed)&&files.every(file=>{const source=contentSources.get(file);return source&&(source.ready||source.failed);});
}
function contentAllFieldArtReady(){
 const terrain=contentSource('./assets/world/terrain/terrain-fields.png');if(!terrain.ready&&!terrain.failed)return false;
 const themes=['forest','snowfield','marsh','ashfield'];
 for(let column=0;column<themes.length;column++){
  const theme=themes[column],scene=contentFieldScene(theme);for(let row=0;row<3;row++)contentPropFrame(column,row);contentExitFrame(theme);
  const files=['tree','shrub','grass'].map(name=>`./assets/world/fields/${theme}/${name}.png`),exitKey={forest:'exit-trail',snowfield:'exit-pass',marsh:'exit-bridge',ashfield:'exit-gate'}[theme];files.push(GAME_CONTENT.extra[exitKey].file);
  if((!scene.ready&&!scene.failed)||!files.every(file=>{const source=contentSources.get(file);return source&&(source.ready||source.failed);}))return false;
 }
 return true;
}
function drawContentLoading(now){
 const width=Math.min(cv.width-32,420),height=104,x=(cv.width-width)/2,y=(cv.height-height)/2;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='rgba(8,12,16,.68)';ctx.fillRect(0,0,cv.width,cv.height);
 ctx.fillStyle='#15283a';ctx.fillRect(x,y,width,height);ctx.strokeStyle='#9dc6d5';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,width-2,height-2);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 20px sans-serif';ctx.fillStyle='#f0f5f1';ctx.fillText('地形を読み込み中…',cv.width/2,y+39);
 const phase=Math.floor(now/180)%4;ctx.font='16px sans-serif';ctx.fillStyle='#bad5d7';ctx.fillText('景色を準備しています'+'・'.repeat(phase),cv.width/2,y+72);ctx.restore();
}
function drawContentFieldExit(context,x,y){const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),image=contentExitFrame(theme);if(image){const width=TS*2.7,height=TS*3.6;context.save();context.imageSmoothingEnabled=false;context.drawImage(image,x-width*.5,y+TS-height,width,height);context.restore();}return true;}
function contentLandscapeHash(x,y,salt=0){const n=Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453;return n-Math.floor(n);}
const contentPropFrames=new Map();
function contentPropFrame(column,row){
 const key=column+':'+row;if(contentPropFrames.has(key))return contentPropFrames.get(key);const theme=['forest','snowfield','marsh','ashfield'][column],name=['tree','shrub','grass'][row];if(!theme||!name)return null;const source=contentSource('./assets/world/fields/'+theme+'/'+name+'.png');if(!source.ready)return null;
 const canvas=document.createElement('canvas');canvas.width=144;canvas.height=row===0?172:128;const g=canvas.getContext('2d'),isSheet=name==='grass',cellWidth=source.image.width/4,cellHeight=source.image.height/3;g.imageSmoothingEnabled=false;if(isSheet)g.drawImage(source.image,column*cellWidth,row*cellHeight,cellWidth,cellHeight,0,0,canvas.width,canvas.height);else g.drawImage(source.image,0,0,source.image.width,source.image.height,0,0,canvas.width,canvas.height);
 const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const mg=mask.getContext('2d'),runs=atob(CONTENT_LANDSCAPE_MASKS[key]);for(let i=0;i<runs.length;i+=3)mg.fillRect(runs.charCodeAt(i),runs.charCodeAt(i+1),runs.charCodeAt(i+2),1);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);contentPropFrames.set(key,canvas);return canvas;
}
function drawContentBrush(context,X,Y,x,y,now){
 const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),column=Math.max(0,['forest','snowfield','marsh','ashfield'].indexOf(theme)),grass=contentPropFrame(column,2),leaves=contentPropFrame(column,1);if(!grass)return false;
 const phase=contentLandscapeHash(x,y)*6,shift=Math.sin(now/820+phase)*TS*.025,scale=TS/64;context.save();context.imageSmoothingEnabled=false;
 context.fillStyle='rgba(15,22,14,.42)';context.beginPath();context.ellipse(X+TS/2,Y+TS*.79,TS*.4,TS*.14,0,0,Math.PI*2);context.fill();
 if(leaves){context.globalAlpha=.92;context.drawImage(leaves,X+TS*.02-shift,Y+TS*.25,TS*.63,TS*.59);context.save();context.translate(X+TS*.99+shift,Y+TS*.1);context.scale(-1,1);context.drawImage(leaves,0,0,TS*.64,TS*.64);context.restore();}
 context.globalAlpha=1;context.drawImage(grass,X-TS*.03+shift,Y-TS*.12,TS*.72,TS*.78);
 // Broad layered leaves form a readable tuft at game scale; dark edges keep them distinct from the floor.
 const bladeColors=theme==='snowfield'?['#63836e','#b9d3c2','#e9efd8']:theme==='marsh'?['#365f4d','#71986a','#c2c87c']:theme==='ashfield'?['#68432c','#a36a35','#d7a753']:['#315a28','#5f8c34','#b7c65a'];
 for(let i=0;i<8;i++){const u=contentLandscapeHash(x,y,i+61),side=contentLandscapeHash(x,y,i+83),bx=X+TS*(.12+u*.76),by=Y+TS*(.72+side*.1),height=TS*(.2+contentLandscapeHash(x,y,i+107)*.28),lean=Math.sin(now/900+phase+i*1.7)*TS*.035,bend=lean+(side-.5)*TS*.18,width=(3.2+u*2.3)*scale;
  const blade=()=>{context.beginPath();context.moveTo(bx-width*.55,by);context.quadraticCurveTo(bx+bend-width*.3,by-height*.56,bx+bend,by-height);context.quadraticCurveTo(bx+bend+width*.4,by-height*.57,bx+width*.55,by);context.closePath();};
  blade();context.fillStyle='#1b281b';context.fill();context.save();context.translate(-width*.14,-1);blade();context.fillStyle=bladeColors[i%bladeColors.length];context.fill();context.restore();
  context.strokeStyle=bladeColors[(i+1)%bladeColors.length];context.lineWidth=Math.max(1,scale);context.beginPath();context.moveTo(bx,by-2*scale);context.quadraticCurveTo(bx+bend*.65,by-height*.6,bx+bend,by-height+2*scale);context.stroke();
 }
 for(let i=0;i<4;i++){const bx=X+TS*(.24+i*.15),by=Y+TS*.79;context.fillStyle=bladeColors[(i+1)%bladeColors.length];context.beginPath();context.ellipse(bx,by,TS*.065,TS*.035,(i-1.5)*.35,0,Math.PI*2);context.fill();context.fillStyle='rgba(225,226,142,.55)';context.fillRect(bx-1,by-2,2,2);}
 context.restore();return true;
}
function contentLandscapePiece(theme,variant){
 const key=theme+':'+variant;if(contentLandscapeCache.has(key))return contentLandscapeCache.get(key);
 const columnIndex=['forest','snowfield','marsh','ashfield'].indexOf(theme),tree=contentPropFrame(columnIndex,0),bush=contentPropFrame(columnIndex,1);
 if(tree&&bush){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;const rnd=n=>contentLandscapeHash(variant,n,4);g.drawImage(bush,2+rnd(1)*10,83,80,66);if(rnd(2)<.75){const size=95+rnd(3)*24;g.drawImage(tree,64-size/2+(rnd(4)-.5)*12,151-size*1.2,size,size*1.2);}g.drawImage(bush,40+rnd(5)*15,104,73,48);contentLandscapeCache.set(key,canvas);return canvas;}
 return null;
}
function drawContentLandscape(sx,sy){
 const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME);if(!THEME.outdoor)return;
 if(contentFieldUsingArtwork){if(stairs&&seen[stairs.y]?.[stairs.x])drawContentFieldExit(ctx,sx(stairs.x)+TS/2,sy(stairs.y));return;}
 const{x:ox,y:oy,size}=CONTENT_FIELD_START,step=4;
 // Place scenery in scattered clusters over blocked ground. Several tiles share each cluster,
 // so foliage reads as continuous terrain instead of a repeated prop on every map cell.
 for(let gy=oy+1;gy<oy+size-1;gy+=step)for(let gx=ox+1;gx<ox+size-1;gx+=step){
  const seed=contentLandscapeHash(gx,gy,contentFieldTemplate+201);if(seed<.48)continue;
  const x=Math.min(ox+size-2,gx+Math.floor(contentLandscapeHash(gx,gy,contentFieldTemplate+202)*step)),y=Math.min(oy+size-2,gy+Math.floor(contentLandscapeHash(gx,gy,contentFieldTemplate+203)*step));
  if(!isWallTile(tileAt(x,y)))continue;
  const X=sx(x),Y=sy(y),variant=Math.floor(contentLandscapeHash(gx,gy,contentFieldTemplate+204)*24),image=contentLandscapePiece(theme,variant);if(!image||X< -TS*2||Y< -TS*3||X>cv.width+TS||Y>cv.height+TS)continue;
  const offset=(contentLandscapeHash(gx,gy,205)-.5)*TS*.3,scale=1.05+contentLandscapeHash(gx,gy,206)*.34,width=TS*1.58*scale,height=TS*1.82*scale;
  ctx.save();ctx.drawImage(image,X+TS/2-width/2+offset,Y+TS-height,width,height);ctx.restore();
 }
 if(stairs&&seen[stairs.y]?.[stairs.x])drawContentFieldExit(ctx,sx(stairs.x)+TS/2,sy(stairs.y));
}
function drawContentFieldBoundary(context,x,y,X,Y,theme){
 const palette={forest:['rgba(17,29,15,.76)','rgba(117,150,69,.82)'],snowfield:['rgba(65,78,91,.8)','rgba(238,247,251,.92)'],marsh:['rgba(16,37,37,.8)','rgba(113,153,132,.85)'],ashfield:['rgba(34,23,23,.85)','rgba(196,105,52,.8)']}[theme]||['rgba(17,29,15,.76)','rgba(117,150,69,.82)'];
 const edges=[[0,-1,'n'],[1,0,'e'],[0,1,'s'],[-1,0,'w']];
 for(const[dx,dy,side]of edges){if(isWallTile(tileAt(x+dx,y+dy)))continue;context.save();context.lineCap='round';context.lineJoin='round';const path=(inset)=>{context.beginPath();for(let i=0;i<=8;i++){const p=i/8,noise=(contentLandscapeHash(x+dx*(i===8?1:0)+(side==='n'||side==='s'?i:0),y+dy*(i===8?1:0)+(side==='e'||side==='w'?i:0),83)-.5)*5;if(side==='n'){const px=X+p*TS,py=Y+inset+noise;i?context.lineTo(px,py):context.moveTo(px,py);}else if(side==='s'){const px=X+p*TS,py=Y+TS-inset+noise;i?context.lineTo(px,py):context.moveTo(px,py);}else if(side==='w'){const px=X+inset+noise,py=Y+p*TS;i?context.lineTo(px,py):context.moveTo(px,py);}else{const px=X+TS-inset+noise,py=Y+p*TS;i?context.lineTo(px,py):context.moveTo(px,py);}}};path(2);context.strokeStyle=palette[0];context.lineWidth=10;context.stroke();path(3);context.strokeStyle=palette[1];context.lineWidth=2.5;context.stroke();context.restore();}
}
