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
function drawContentFieldExit(context,x,y){const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),image=contentExitFrame(theme);if(image){const width=TS*2.7,height=TS*3.6;context.save();context.imageSmoothingEnabled=false;context.drawImage(image,x-width*.5,y+TS-height,width,height);context.restore();}return true;}
function contentLandscapeHash(x,y,salt=0){const n=Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453;return n-Math.floor(n);}
const contentPropFrames=new Map();
function contentPropFrame(column,row){
 const key=column+':'+row;if(contentPropFrames.has(key))return contentPropFrames.get(key);const theme=['forest','snowfield','marsh','ashfield'][column],name=['tree','shrub','grass'][row];if(!theme||!name)return null;const source=contentSource('./assets/world/fields/'+theme+'/'+name+'.png');if(!source.ready)return null;
 const canvas=document.createElement('canvas');canvas.width=144;canvas.height=row===0?172:128;const g=canvas.getContext('2d');g.drawImage(source.image,0,0,source.image.width,source.image.height,0,0,canvas.width,canvas.height);
 const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const mg=mask.getContext('2d'),runs=atob(CONTENT_LANDSCAPE_MASKS[key]);for(let i=0;i<runs.length;i+=3)mg.fillRect(runs.charCodeAt(i),runs.charCodeAt(i+1),runs.charCodeAt(i+2),1);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);contentPropFrames.set(key,canvas);return canvas;
}
function drawContentBrush(context,X,Y,x,y,now){
 const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),column=Math.max(0,['forest','snowfield','marsh','ashfield'].indexOf(theme)),image=contentPropFrame(column,2);if(!image)return false;
 const phase=contentLandscapeHash(x,y)*6,shift=Math.sin(now/820+phase)*1.8,scale=TS/64,palette={forest:['#315d28','#5e8d35','#9ab94c','#d5d478'],snowfield:['#526b5b','#8ba88c','#cbd9c4','#f4f1d8'],marsh:['#36584a','#568064','#9aa55d','#cfbd73'],ashfield:['#68432c','#9a6334','#c38b42','#ecc16a']}[theme]||['#315d28','#5e8d35','#9ab94c','#d5d478'];context.save();context.imageSmoothingEnabled=false;
 context.fillStyle='rgba(15,22,14,.24)';context.beginPath();context.ellipse(X+TS/2,Y+TS*.76,TS*.39,TS*.16,0,0,Math.PI*2);context.fill();
 context.drawImage(image,X-TS*.08+shift,Y-TS*.14,TS*.68,TS*.68);context.drawImage(image,X+TS*.28-shift*.55,Y+TS*.05,TS*.66,TS*.66);context.drawImage(image,X+TS*.08+shift*.35,Y+TS*.27,TS*.62,TS*.62);
 for(let i=0;i<15;i++){const u=contentLandscapeHash(x,y,i+61),v=contentLandscapeHash(x,y,i+83),bx=X+TS*(.12+u*.76),by=Y+TS*(.48+v*.42),height=TS*(.12+contentLandscapeHash(x,y,i+107)*.27),lean=Math.sin(now/900+phase+i*1.7)*TS*.025;context.strokeStyle=palette[i%palette.length];context.lineWidth=(1.3+u*1.5)*scale;context.lineCap='round';context.beginPath();context.moveTo(bx,by);context.quadraticCurveTo(bx+lean*1.5,by-height*.62,bx+lean,by-height);context.stroke();if(i%4===0){context.fillStyle=palette[(i+2)%palette.length];context.beginPath();context.ellipse(bx+lean,by-height,2.3*scale,1.2*scale,lean,0,Math.PI*2);context.fill();}}
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
 const scene=contentFieldScene?.(theme);if(scene?.ready){if(stairs&&seen[stairs.y]?.[stairs.x])drawContentFieldExit(ctx,sx(stairs.x)+TS/2,sy(stairs.y));return;}
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  if(!isWallTile(tileAt(x,y))||(!seen[y]?.[x]&&!visible(x,y)&&!lightAll))continue;
  const X=sx(x),Y=sy(y);if(X< -TS*2||Y< -TS*3||X>cv.width+TS||Y>cv.height+TS)continue;
  drawContentFieldBoundary(ctx,x,y,X,Y,theme);
  const hash=contentLandscapeHash(x,y),variant=Math.floor(hash*24),image=contentLandscapePiece(theme,variant);if(!image)continue;
  const offset=(contentLandscapeHash(x,y,2)-.5)*TS*.16,scale=.91+contentLandscapeHash(x,y,3)*.18;
  ctx.save();ctx.globalAlpha=THEME?.outdoor||visible(x,y)?1:.4;ctx.drawImage(image,X+TS/2-TS*.67*scale+offset,Y+TS-TS*1.6*scale,TS*1.34*scale,TS*1.675*scale);ctx.restore();
 }
 if(stairs&&seen[stairs.y]?.[stairs.x])drawContentFieldExit(ctx,sx(stairs.x)+TS/2,sy(stairs.y));
}
function drawContentFieldBoundary(context,x,y,X,Y,theme){
 const palette={forest:['rgba(17,29,15,.76)','rgba(117,150,69,.82)'],snowfield:['rgba(65,78,91,.8)','rgba(238,247,251,.92)'],marsh:['rgba(16,37,37,.8)','rgba(113,153,132,.85)'],ashfield:['rgba(34,23,23,.85)','rgba(196,105,52,.8)']}[theme]||['rgba(17,29,15,.76)','rgba(117,150,69,.82)'];
 const edges=[[0,-1,'n'],[1,0,'e'],[0,1,'s'],[-1,0,'w']];
 for(const[dx,dy,side]of edges){if(isWallTile(tileAt(x+dx,y+dy)))continue;context.save();context.lineCap='round';context.lineJoin='round';const path=(inset)=>{context.beginPath();for(let i=0;i<=8;i++){const p=i/8,noise=(contentLandscapeHash(x+dx*(i===8?1:0)+(side==='n'||side==='s'?i:0),y+dy*(i===8?1:0)+(side==='e'||side==='w'?i:0),83)-.5)*5;if(side==='n'){const px=X+p*TS,py=Y+inset+noise;i?context.lineTo(px,py):context.moveTo(px,py);}else if(side==='s'){const px=X+p*TS,py=Y+TS-inset+noise;i?context.lineTo(px,py):context.moveTo(px,py);}else if(side==='w'){const px=X+inset+noise,py=Y+p*TS;i?context.lineTo(px,py):context.moveTo(px,py);}else{const px=X+TS-inset+noise,py=Y+p*TS;i?context.lineTo(px,py):context.moveTo(px,py);}}};path(2);context.strokeStyle=palette[0];context.lineWidth=10;context.stroke();path(3);context.strokeStyle=palette[1];context.lineWidth=2.5;context.stroke();context.restore();}
}
