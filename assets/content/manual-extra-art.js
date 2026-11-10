const manualExtraSources=new Map(),manualExtraFrames=new Map();
const manualExtraBase=new URL('../',document.currentScript?.src||new URL('./assets/content/manual-extra-art.js',document.baseURI));
function manualExtraSource(file){let source=manualExtraSources.get(file);if(!source){const image=new Image();source={image,ready:false};manualExtraSources.set(file,source);image.onload=()=>{source.ready=true;};image.src=new URL(file,manualExtraBase).href;}return source;}
function manualExtraFrame(key){
 const metadata=MANUAL_EXTRA_META[key];if(!metadata)return null;if(manualExtraFrames.has(key))return manualExtraFrames.get(key);
 const source=manualExtraSource(metadata.file);if(!source.ready)return null;
 const [x,y,w,h]=metadata.rect,scale=118/Math.max(w,h),canvas=document.createElement('canvas');canvas.width=canvas.height=128;const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(source.image,x,y,w,h,64-w*scale/2,124-h*scale,w*scale,h*scale);manualExtraFrames.set(key,canvas);return canvas;
}
const MANUAL_FIELDS={forest:'world/field-forest.png',snowfield:'world/field-snowfield.png',marsh:'world/field-marsh.png',ashfield:'world/field-ashfield.png'};
function drawManualField(context,kind,width,height){
 const file=MANUAL_FIELDS[kind];if(!file)return false;const source=manualExtraSource(file);if(!source.ready)return false;
 context.imageSmoothingEnabled=false;context.drawImage(source.image,0,0,width,height);return true;
}
function drawManualSkin(context,kind,width,height){
 if(MANUAL_FIELDS[kind])return drawManualField(context,kind,width,height);
 const metadata=MANUAL_SKIN_META[kind];if(!metadata){const index=WORLD_THEMES.indexOf(kind);if(index<0||!worldArt.terrain)return false;const image=worldArt.terrain,w=image.width/4,h=image.height/6;context.imageSmoothingEnabled=false;for(let y=0;y<3;y++)for(let x=0;x<4;x++){const type=y===0?1:y===1?2:0,cell=Math.floor(index/4)*12+type*4+index%4;context.drawImage(image,cell%4*w+2,Math.floor(cell/4)*h+2,w-4,h-4,x*width/4,y*height/3,width/4,height/3);}return true;}const source=manualExtraSource(metadata.file);if(!source.ready)return false;
 const image=source.image,w=image.width/4,h=image.height/3,tile=width/4;
 context.imageSmoothingEnabled=false;
 for(let y=0;y<3;y++)for(let x=0;x<4;x++){const type=y===0?1:y===1?2:0;context.drawImage(image,metadata.column*w+2,type*h+2,w-4,h-4,x*tile,y*height/3,tile,height/3);}
 return true;
}
