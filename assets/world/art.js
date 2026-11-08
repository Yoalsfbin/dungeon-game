const worldArt = { monsters:new Map(), motionKinds:new Set(), icons:new Map(), mechanisms:new Map(), items:null, terrain:null,surfaces:null };
const enemyMotionSources = new Map(), enemyMotionFrames = new Map();
function ensureEnemyMotion(kind) {
  if (!WORLD_MOTION_META[kind]) return null;
  if (enemyMotionSources.has(kind)) {
    const source = enemyMotionSources.get(kind); source.used = NOW(); return source;
  }
  if (enemyMotionSources.size >= 12) {
    const oldest = [...enemyMotionSources].sort((first, second) => first[1].used - second[1].used)[0];
    enemyMotionSources.delete(oldest[0]);
  }
  const image = new Image(), source = { image, ready:false, used:NOW() };
  enemyMotionSources.set(kind, source); image.onload = () => { source.ready = true;worldArt.motionKinds.add(kind);
    for(const tier of [1,2,3])worldArt.monsters.set(kind+":"+tier,enemyMotionFrame({tier,dir:[0,1],hp:1},kind,NOW(),source));
    if(typeof state!=="undefined"&&state==="menu")renderMenu();
  };
  image.src = "./assets/world/monsters/" + kind + "/motion-sheet.png";
  return source;
}
function enemyMotionRow(entity,now) {
  let row = 0;
  if (entity.deathT != null || (entity.hp <= 0 && !entity.pendingDeath)) row = 5;
  else if (entity.hurt && now - entity.hurt < 240) row = 5;
  else if (entity.sleep>0) row = 7;
  else if (entity.specialActionT>now) row = entity.specialPoseRow??6;
  else if (entity.strikeP != null) row = entity.strikeP < 0.3 ? 3 : entity.strikeP < 0.72 ? 4 : entity.strikeP<.92?3:0;
  else if (entity.walkP != null) row = ((entity.steps || 0) % 2) ? 1 : 2;
  else if (entity.specialT > now || entity.shellT > 0) row = 6;
  return row;
}
const FROG_MOUTHS = [[82.6,90.7],[63.9,92.1],[57.6,96],[33.4,114.2],[78.2,70.5],[137.4,112.6],[124.7,99.2],[90.7,92.6],[82.4,89.5],[55.7,91.5],[55.6,90.3],[34.2,109.2],[79.1,69.8],[137.8,108.3],[124.1,99],[93.3,90.8],[82.9,96.2],[58,88.2],[57.6,99.6],[35.2,101.9],[77.8,67.1],[138.5,110],[124.4,99.9],[94.5,92.8],[83.4,98.6],[56.6,97.9],[49.1,95.4],[28.3,106],[76.9,72.5],[143.1,102.7],[125.7,104.7],[90.6,102.1],[81.5,84.8],[53.6,93.6],[48.4,92.8],[29.3,93.9],[77.8,71.2],[146.5,102],[125.8,104.4],[84.2,92.8],[79.8,86.1],[70.3,81.6],[67.9,94.2],[48.4,93.1],[76.9,71.2],[130.7,91.7],[117.4,93],[88.8,85.7],[82.7,94.8],[61.1,93.4],[48,97.4],[23.6,107],[79.6,70.5],[148.3,109.5],[125.8,102],[93.7,94],[78.9,115.4],[49.1,123.9],[57.1,127.1],[24,125.9],[77.8,86],[141.3,125.9],[118.9,125.9],[93,123.7]];
function frogMouthOffset(entity,now,size=64) {
  const direction=DungeonMotions.directionFromVector(...(entity.attackDir||entity.dir||[0,1]));
  const column=DUNGEON_MOTION_META.directions.indexOf(direction),[x,y]=FROG_MOUTHS[enemyMotionRow(entity,now)*8+column];
  let horizontal=(x-80)*size/100,vertical=size-2-size*1.4+y*size/100;
  if(!entity.sleep&&!entity.stun&&entity.strikeP==null&&Math.abs(entity.lx||0)+Math.abs(entity.ly||0)<=.02){const phase=now/520+(entity.x*97+entity.y*31)*.37,b=Math.sin(phase*2)*.025;horizontal*=1-b*.6;vertical=size+(vertical-size)*(1+b);}
  return [size/2+horizontal,vertical-6];
}
function enemyMotionFrame(entity, kind, now, loadedSource=null) {
  const source = loadedSource || ensureEnemyMotion(kind); if (!source || !source.ready) return null;
  const direction = DungeonMotions.directionFromVector(...(entity.attackDir || entity.dir || [0, 1]));
  const column = DUNGEON_MOTION_META.directions.indexOf(direction);
  const row = enemyMotionRow(entity,now);
  const tier = entity.visualTier || entity.tier || 1, key = [kind, tier, row, column,entity.variant||0].join(":");
  if (enemyMotionFrames.has(key)) {
    const frame = enemyMotionFrames.get(key); enemyMotionFrames.delete(key); enemyMotionFrames.set(key, frame); return frame;
  }
  const metadata=WORLD_MOTION_META[kind],frameIndex=row*8+column,rectangle=metadata.frames[frameIndex];
  let [left, top, width, height, anchorX, anchorY] = rectangle;
  // 鏡の斜め前・横向きは隣のコマの残像を輪郭検出が拾っていたため、
  // 元シート上の各個体を目視確認した範囲で独立して切り出す。
  if(kind==="kagami"&&column===1){left=205;width=130;anchorX=270;}
  if(kind==="kagami"&&column===2){left=355;width=140;anchorX=430;}
  const frameLimit = 148, spriteLimit = kind === "kagami" ? 112 : 106;
  const scale = Math.min(spriteLimit / metadata.size,frameLimit/width,frameLimit/height);
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 160;
  const context = canvas.getContext("2d"), horizontal = Math.max(6,Math.min(154-width*scale,80 + (left - anchorX) * scale)), vertical = Math.max(6,Math.min(154-height*scale,140 + (top - anchorY) * scale));
  context.imageSmoothingEnabled = false;
  context.drawImage(source.image, left, top, width, height, horizontal, vertical, width * scale, height * scale);
  if(kind==='hoshi'&&tier===1){
    const mask=document.createElement('canvas');mask.width=mask.height=160;const maskContext=mask.getContext('2d'),runs=atob(metadata.plainMasks[frameIndex]);
    for(let index=0;index<runs.length;index+=3)maskContext.fillRect(horizontal+runs.charCodeAt(index)*width*scale/48,vertical+runs.charCodeAt(index+1)*height*scale/48,runs.charCodeAt(index+2)*width*scale/48,height*scale/48);
    context.globalCompositeOperation='destination-in';context.drawImage(mask,0,0);context.globalCompositeOperation='source-over';
  }
  const tint = kind==="banjin"&&entity.variant===30?"#ae78bd":monsterTint(kind, tier);
  if (tint) {
    const encoded=(kind==="banjin"&&entity.variant===30?metadata.bodyMasks:metadata.masks)[frameIndex];
    const runs=atob(encoded);context.save();context.beginPath();
    for(let index=0;index<runs.length;index+=3)context.rect(horizontal+runs.charCodeAt(index)*width*scale/48,vertical+runs.charCodeAt(index+1)*height*scale/48,runs.charCodeAt(index+2)*width*scale/48,height*scale/48);
    context.clip();context.globalCompositeOperation = "color"; context.globalAlpha = kind==="hoshi"&&tier===2?1:tier === 1 ? 0.6 : 0.95; context.fillStyle = tint; context.fillRect(0, 0, 160, 160);context.restore();
    context.globalCompositeOperation = "destination-in";
    context.drawImage(source.image, left, top, width, height, horizontal, vertical, width * scale, height * scale);
    context.globalCompositeOperation = "source-over";
  }
  enemyMotionFrames.set(key, canvas);
  if (enemyMotionFrames.size > 192) enemyMotionFrames.delete(enemyMotionFrames.keys().next().value);
  return canvas;
}
const WORLD_ICON_KEYS = ["herb", "rice", "club", "buckler", "ring", "arrow", "book", "staff", "pot", "coin", "heart", "star"].map(key => "item_" + key);
const WORLD_THEMES = ["cave", "snow", "jungle", "ruins", "ice", "lake", "volcano", "altar"];
const MONSTER_ACCENTS = {
  muni:["#70d6bd", "#bb8dde", "#f4ca65"], mokko:[null, "#67b9b0", "#e7be58"], kusune:[null, "#6e85bf", "#9e71b9"],
  berogaeru:[null, "#d67c50", "#bc7bd8"], hitotsume:[null, "#e27b81", "#7799af"], kinokoro:[null, "#b884de", "#80dce9"],
  yumi:[null, "#dfaf59", "#dc7966"], sabi:[null, "#99b871", "#70c4b0"], hara:["#b69cdb", "#8dc8e8", "#e69aba"],
  wana:[null, "#658dba", "#a76da7"], tsubo:[null, "#438b82", "#945b82"], nise:[null, "#d48b7a", "#9e8dd0"],
  pen:[null, "#6dbf97", "#b583c7"], tsuta:[null, "#d96056", "#edc853"], kage:[null, "#53b9be", "#e180ac"],
  banjin:[null, "#8ca8df", "#e8c06b"], kiba:[null, "#9b79bc", "#d5ae59"], hibachi:[null, "#ce8be9", "#85d9ed"],
  hoshi:[null, "#cbd4df", "#efbe42"], iwagame:[null, "#bea76c", "#85bc93"], fuefuki:[null, "#80cdd6", "#ba9ae6"],
  doromaru:[null, "#8c6bb4", "#7caf70"], gaikotsu:[null, "#7cae8a", "#c77e68"]
};
function monsterTint(kind, tier) {
  if (MON[kind].npc) return null;
  return MONSTER_ACCENTS[kind]?.[Math.min(3, Math.max(1, tier)) - 1] || null;
}
function artCell(image, rectangle) {
  const [left, top, width, height] = rectangle;
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d"), scale = 118 / Math.max(width, height);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, left, top, width, height, (128 - width * scale) / 2, 124 - height * scale, width * scale, height * scale);
  return canvas;
}
function loadWorldArt() {
  if(typeof contentFieldScene==='function')for(const theme of ['forest','snowfield','marsh','ashfield'])contentFieldScene(theme);
  const pending=document.createElement("canvas");pending.width=pending.height=128;
  const pendingContext=pending.getContext("2d");pendingContext.strokeStyle="#9aa4ae";pendingContext.lineWidth=4;pendingContext.beginPath();pendingContext.arc(64,82,16,0,Math.PI*1.5);pendingContext.stroke();
  for(const kind of Object.keys(MON))for(const tier of [1,2,3])worldArt.monsters.set(kind+":"+tier,pending);
  ensureEnemyMotion("tsubo");
  WORLD_ICON_KEYS.forEach(key=>{const icon=new Image();icon.onload=()=>{const frame=artCell(icon,[0,0,icon.width,icon.height]);worldArt.icons.set(key,frame);if(key==="item_coin"){const mask=document.createElement("canvas");mask.width=mask.height=128;mask.getContext("2d").drawImage(frame,0,0);const c=frame.getContext("2d");c.globalCompositeOperation="color";c.fillStyle="#e7ad35";c.fillRect(0,0,128,128);c.globalCompositeOperation="destination-in";c.drawImage(mask,0,0);c.globalCompositeOperation="source-over";}draw.st=null;if(state==="inv")renderInv();else if(state==="menu")renderMenu();};icon.src="./assets/world/items/icons/"+key.slice(5)+".png";});
  const stone=new Image();stone.onload=()=>{
    worldArt.icons.set("item_ar_stone",artCell(stone,[518,284,488,463]));draw.st=null;
    if(state==="inv")renderInv();else if(state==="menu")renderMenu();
  };stone.src="./assets/world/items/stone.png";
  const bracelet = new Image(); bracelet.onload = () => {
    worldArt.icons.set("item_ring", artCell(bracelet, [304,303,702,618]));
    draw.st = null; if (state === "inv") renderInv();
  }; bracelet.src = "./assets/world/items/bracelet.png?v=pixel2";
  const terrain = new Image(); terrain.onload = () => { worldArt.terrain = terrain; }; terrain.src = "./assets/world/terrain/terrain.png";
  const surfaces=new Image();surfaces.onload=()=>{worldArt.surfaces=surfaces;};surfaces.src="./assets/world/terrain/surfaces.png";
  for(const key of ["spike","gas","warp","hunger","rot","rust","pit"]){const icon=new Image();icon.onload=()=>{worldArt.mechanisms.set(key,icon);draw.st=null;};icon.src="./assets/world/traps/"+key+".png";}
}
function drawMechanism(key, x, y, context=ctx) {
  const image=worldArt.mechanisms.get(key); if(!image)return false;
  context.drawImage(image,x-2,y-2,TS+4,TS+4); return true;
}
function drawWorldTile(type, horizontal, vertical, width, height) {
  const theme = Object.keys(THEMES).find(key => THEMES[key] === THEME), themeIndex = WORLD_THEMES.indexOf(theme);
  if (!worldArt.terrain) return false;
  if (themeIndex < 0) return false;
  const index = Math.floor(themeIndex / 4) * 12 + type * 4 + themeIndex % 4;
  const tileWidth = worldArt.terrain.width / 4, tileHeight = worldArt.terrain.height / 6;
  ctx.drawImage(worldArt.terrain, index % 4 * tileWidth + 2, Math.floor(index / 4) * tileHeight + 2, tileWidth - 4, tileHeight - 4, horizontal, vertical, width, height);
  return true;
}
function drawGoalItem(context,x,y,size,now){
 context.save();context.translate(x,y);context.scale(size/64,size/64);const b=Math.sin(now/250)*3;
 context.fillStyle="rgba(0,0,0,.4)";context.beginPath();context.ellipse(32,52,18,6,0,0,7);context.fill();context.fillStyle="#6a5a4a";context.fillRect(18,40,28,12);context.fillStyle="#9a8a76";context.fillRect(18,40,28,3);
 const g=context.createRadialGradient(28,24+b,2,32,28+b,16);g.addColorStop(0,"#ffffff");g.addColorStop(.3,"#ffe880");g.addColorStop(1,"#d07010");context.fillStyle=g;context.beginPath();context.arc(32,28+b,13,0,7);context.fill();context.strokeStyle=`rgba(255,230,120,${.4+.3*Math.sin(now/200)})`;context.lineWidth=3;context.beginPath();context.arc(32,28+b,19,0,7);context.stroke();context.restore();
}
function itemArt(kind) { const key = "item_" + iconOf(kind); return worldArt.icons.get(key) || IMG[key]; }
function paintIconCanvases(root){root.querySelectorAll("[data-art-icon]").forEach(canvas=>{const image=worldArt.icons.get(canvas.dataset.artIcon);if(image){const context=canvas.getContext("2d");context.imageSmoothingEnabled=false;context.drawImage(image,0,0,128,128);}});}
function drawSurface(kind,frame,x,y,size,context=ctx){
 const image=worldArt.surfaces;if(!image)return false;const row={water:0,ice:1,lava:2}[kind],width=image.width/4,height=image.height/3;
 context.imageSmoothingEnabled=false;context.drawImage(image,(frame%4)*width+1,row*height+1,width-2,height-2,x,y,size,size);return true;
}
function drawTitleLogo(context,x,y,width,height,variant=0){
 context.save();context.translate(x,y);context.scale(width/720,height/90);context.textAlign="center";context.lineJoin="round";
 const accent=["#c8ae77","#8cb8ad","#aab9d4"][variant]||"#c8ae77";
 context.font="16px Georgia, 'Times New Roman', serif";context.fillStyle=accent;
 const label="THE ROAD",spacing=6,total=[...label].reduce((sum,letter)=>sum+context.measureText(letter).width,0)+spacing*(label.length-1);
 let at=360-total/2;context.textAlign="left";for(const letter of label){context.fillText(letter,at,20);at+=context.measureText(letter).width+spacing;}
 context.textAlign="center";context.font="600 60px Georgia, 'Times New Roman', serif";
 context.strokeStyle="#111519";context.lineWidth=4;context.strokeText("REMEMBERS",360,71,680);
 const light=context.createLinearGradient(0,28,0,73);light.addColorStop(0,"#fff7df");light.addColorStop(.55,"#e8dec4");light.addColorStop(1,accent);context.fillStyle=light;context.fillText("REMEMBERS",360,70,680);
 context.strokeStyle=accent;context.lineWidth=1;context.beginPath();context.moveTo(208,83);context.lineTo(341,83);context.moveTo(379,83);context.lineTo(512,83);context.stroke();
 context.beginPath();context.moveTo(360,78);context.lineTo(365,83);context.lineTo(360,88);context.lineTo(355,83);context.closePath();context.stroke();context.restore();
}
