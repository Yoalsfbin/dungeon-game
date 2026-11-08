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
 const column=['forest','snowfield','marsh','ashfield'].indexOf(theme);if(column<0)return null;if(contentExitFrames.has(theme))return contentExitFrames.get(theme);
 const source=contentSource('./assets/world/fields/landscape-exits.png');if(!source.ready)return null;const canvas=document.createElement('canvas');canvas.width=192;canvas.height=256;const g=canvas.getContext('2d');g.drawImage(source.image,column*source.image.width/4,0,source.image.width/4,source.image.height,0,0,192,256);
 const mask=document.createElement('canvas');mask.width=192;mask.height=256;const mg=mask.getContext('2d'),runs=atob(CONTENT_LANDSCAPE_MASKS['exit:'+column]);for(let i=0;i<runs.length;i+=3)mg.fillRect(runs.charCodeAt(i),runs.charCodeAt(i+1),runs.charCodeAt(i+2),1);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);contentExitFrames.set(theme,canvas);return canvas;
}
function drawContentFieldExit(context,x,y){const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),image=contentExitFrame(theme);if(image)context.drawImage(image,x-TS*.8,y-TS*2.6,TS*2.6,TS*3.45);return true;}
function contentLandscapeHash(x,y,salt=0){const n=Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453;return n-Math.floor(n);}
const contentPropFrames=new Map();
function contentPropFrame(column,row){
 const key=column+':'+row;if(contentPropFrames.has(key))return contentPropFrames.get(key);const source=contentSource('./assets/world/fields/landscape-props.png');if(!source.ready)return null;
 const image=source.image,w=image.width/4,bands=[[0,.39],[.394,.66],[.672,1]],top=bands[row][0]*image.height,height=(bands[row][1]-bands[row][0])*image.height;
 const canvas=document.createElement('canvas');canvas.width=144;canvas.height=row===0?172:128;const g=canvas.getContext('2d');g.drawImage(image,column*w,top,w,height,0,0,canvas.width,canvas.height);
 const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const mg=mask.getContext('2d'),runs=atob(CONTENT_LANDSCAPE_MASKS[key]);for(let i=0;i<runs.length;i+=3)mg.fillRect(runs.charCodeAt(i),runs.charCodeAt(i+1),runs.charCodeAt(i+2),1);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);contentPropFrames.set(key,canvas);return canvas;
}
function drawContentBrush(context,X,Y,x,y,now){
 const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME),column=Math.max(0,['forest','snowfield','marsh','ashfield'].indexOf(theme)),image=contentPropFrame(column,2);if(!image)return false;
 const phase=contentLandscapeHash(x,y)*6,shift=Math.sin(now/1100+phase)*1.2;context.save();context.imageSmoothingEnabled=false;
 context.drawImage(image,X-TS*.08+shift,Y-TS*.2,TS*.9,TS*.9);context.drawImage(image,X+TS*.22-shift,Y+TS*.17,TS*.85,TS*.85);context.restore();return true;
}
function contentLandscapePiece(theme,variant){
 const key=theme+':'+variant;if(contentLandscapeCache.has(key))return contentLandscapeCache.get(key);
 const columnIndex=['forest','snowfield','marsh','ashfield'].indexOf(theme),tree=contentPropFrame(columnIndex,0),bush=contentPropFrame(columnIndex,1);
 if(tree&&bush){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;const rnd=n=>contentLandscapeHash(variant,n,4);g.drawImage(bush,2+rnd(1)*10,83,80,66);if(rnd(2)<.75){const size=95+rnd(3)*24;g.drawImage(tree,64-size/2+(rnd(4)-.5)*12,151-size*1.2,size,size*1.2);}g.drawImage(bush,40+rnd(5)*15,104,73,48);contentLandscapeCache.set(key,canvas);return canvas;}
 return null;
}
function drawContentLandscape(sx,sy){
 const theme=Object.keys(THEMES).find(k=>THEMES[k]===THEME);if(!THEME.outdoor)return;
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  if(!isWallTile(tileAt(x,y))||!seen[y]?.[x])continue;
  const X=sx(x),Y=sy(y);if(X< -TS*2||Y< -TS*3||X>cv.width+TS||Y>cv.height+TS)continue;
  const hash=contentLandscapeHash(x,y),variant=Math.floor(hash*24),image=contentLandscapePiece(theme,variant);if(!image)continue;
  const offset=(contentLandscapeHash(x,y,2)-.5)*TS*.16,scale=.91+contentLandscapeHash(x,y,3)*.18;
  ctx.save();ctx.globalAlpha=visible(x,y)?1:.4;ctx.drawImage(image,X+TS/2-TS*.67*scale+offset,Y+TS-TS*1.6*scale,TS*1.34*scale,TS*1.675*scale);ctx.restore();
 }
 if(stairs&&seen[stairs.y]?.[stairs.x])drawContentFieldExit(ctx,sx(stairs.x),sy(stairs.y));
}
