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
  image.src = "./assets/world/motions/" + kind + ".png";
  return source;
}
function enemyMotionFrame(entity, kind, now, loadedSource=null) {
  const source = loadedSource || ensureEnemyMotion(kind); if (!source || !source.ready) return null;
  const direction = DungeonMotions.directionFromVector(...(entity.attackDir || entity.dir || [0, 1]));
  const column = DUNGEON_MOTION_META.directions.indexOf(direction);
  let row = 0;
  if (entity.deathT != null || (entity.hp <= 0 && !entity.pendingDeath)) row = 7;
  else if (entity.hurt && now - entity.hurt < 240) row = 5;
  else if (entity.strikeP != null) row = entity.strikeP < 0.35 ? 3 : entity.strikeP < 0.75 ? 4 : 0;
  else if (entity.walkP != null) row = ((entity.steps || 0) % 2) ? 1 : 2;
  else if (entity.specialT > now || entity.shellT > 0) row = 6;
  const tier = entity.visualTier || entity.tier || 1, key = [kind, tier, row, column,entity.variant||0].join(":");
  if (enemyMotionFrames.has(key)) {
    const frame = enemyMotionFrames.get(key); enemyMotionFrames.delete(key); enemyMotionFrames.set(key, frame); return frame;
  }
  const metadata=WORLD_MOTION_META[kind],frameIndex=row*8+column,rectangle=metadata.frames[frameIndex];
  const [left, top, width, height, anchorX, anchorY] = rectangle, scale = 106 / metadata.size;
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 160;
  const context = canvas.getContext("2d"), horizontal = 80 + (left - anchorX) * scale, vertical = 140 + (top - anchorY) * scale;
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
const WORLD_RECTS = {"items":[[87,91,259,240],[439,91,276,238],[821,72,261,267],[1187,81,263,258],[101,414,228,220],[443,389,267,270],[808,386,274,273],[1193,377,273,282],[83,715,262,242],[462,726,250,224],[819,733,260,224],[1190,711,259,245]]};
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
  const pending=document.createElement("canvas");pending.width=pending.height=128;
  const pendingContext=pending.getContext("2d");pendingContext.strokeStyle="#9aa4ae";pendingContext.lineWidth=4;pendingContext.beginPath();pendingContext.arc(64,82,16,0,Math.PI*1.5);pendingContext.stroke();
  for(const kind of Object.keys(MON))for(const tier of [1,2,3])worldArt.monsters.set(kind+":"+tier,pending);
  ensureEnemyMotion("tsubo");
  const icons = new Image();
  icons.onload = () => {
    worldArt.items = icons;
    WORLD_ICON_KEYS.forEach((key, index) => { if (key !== "item_ring" || !worldArt.icons.has(key)) worldArt.icons.set(key, artCell(icons, WORLD_RECTS.items[index])); });
    const coin=worldArt.icons.get("item_coin"),coinContext=coin.getContext("2d");
    coinContext.globalCompositeOperation="color";coinContext.fillStyle="#e7ad35";coinContext.fillRect(0,0,128,128);
    coinContext.globalCompositeOperation="destination-in";const mask=artCell(icons,WORLD_RECTS.items[9]);coinContext.drawImage(mask,0,0);coinContext.globalCompositeOperation="source-over";
    draw.st = null;
    if (state === "inv") renderInv(); else if (state === "menu") renderMenu();
  };
  icons.src = "./assets/world/items.png";
  const stone=new Image();stone.onload=()=>{
    worldArt.icons.set("item_ar_stone",artCell(stone,[518,284,488,463]));draw.st=null;
    if(state==="inv")renderInv();else if(state==="menu")renderMenu();
  };stone.src="./assets/world/stone.png";
  const bracelet = new Image(); bracelet.onload = () => {
    worldArt.icons.set("item_ring", artCell(bracelet, [304,303,702,618]));
    draw.st = null; if (state === "inv") renderInv();
  }; bracelet.src = "./assets/world/bracelet.png?v=pixel2";
  const terrain = new Image(); terrain.onload = () => { worldArt.terrain = terrain; }; terrain.src = "./assets/world/terrain.png";
  const surfaces=new Image();surfaces.onload=()=>{worldArt.surfaces=surfaces;};surfaces.src="./assets/world/surfaces.png";
  const mechanisms = new Image(); mechanisms.onload = () => {
    ["spike","gas","warp","hunger","rot","rust","stairs","crumble"].forEach((key,index) => {
      const width=mechanisms.width/4,height=mechanisms.height/2;
      worldArt.mechanisms.set(key,artCell(mechanisms,[index%4*width,Math.floor(index/4)*height,width,height]));
    });
  }; mechanisms.src="./assets/world/mechanisms.png";
}
function drawMechanism(key, x, y, context=ctx) {
  if(key==="pit"){
    context.save();context.translate(x,y);context.scale(TS/64,TS/64);
    context.fillStyle="#332b23";context.fillRect(9,17,46,38);context.fillStyle="#9b8869";context.fillRect(11,15,42,6);context.fillRect(8,21,6,29);context.fillRect(50,21,6,29);context.fillRect(12,49,40,6);
    context.fillStyle="#080c14";context.fillRect(16,23,32,24);context.fillStyle="#66513d";context.beginPath();context.moveTo(15,22);context.lineTo(31,27);context.lineTo(25,44);context.lineTo(15,47);context.fill();context.fillStyle="#c6b598";context.fillRect(12,17,4,3);context.fillRect(48,17,4,3);context.restore();return true;
  }
  const image=worldArt.mechanisms.get(key); if(!image)return false;
  context.drawImage(image,x-2,y-2,TS+4,TS+4); return true;
}
function drawWorldTile(type, horizontal, vertical, width, height) {
  if (!worldArt.terrain) return false;
  const theme = Object.keys(THEMES).find(key => THEMES[key] === THEME), themeIndex = WORLD_THEMES.indexOf(theme);
  if (themeIndex < 0) return false;
  const index = Math.floor(themeIndex / 4) * 12 + type * 4 + themeIndex % 4;
  const tileWidth = worldArt.terrain.width / 4, tileHeight = worldArt.terrain.height / 6;
  ctx.drawImage(worldArt.terrain, index % 4 * tileWidth + 2, Math.floor(index / 4) * tileHeight + 2, tileWidth - 4, tileHeight - 4, horizontal, vertical, width, height);
  return true;
}
function itemArt(kind) { const key = "item_" + iconOf(kind); return worldArt.icons.get(key) || IMG[key]; }
function paintIconCanvases(root){root.querySelectorAll("[data-art-icon]").forEach(canvas=>{const image=worldArt.icons.get(canvas.dataset.artIcon);if(image){const context=canvas.getContext("2d");context.imageSmoothingEnabled=false;context.drawImage(image,0,0,128,128);}});}
function drawSurface(kind,frame,x,y,size,context=ctx){
 const image=worldArt.surfaces;if(!image)return false;const row={water:0,ice:1,lava:2}[kind],width=image.width/4,height=image.height/3;
 context.imageSmoothingEnabled=false;context.drawImage(image,(frame%4)*width+1,row*height+1,width-2,height-2,x,y,size,size);return true;
}
function drawTitleLogo(context,x,y,width,height,variant=0){
 context.save();context.translate(x,y);context.scale(width/720,height/90);context.textAlign="center";context.font="bold 62px monospace";context.lineJoin="miter";
 context.strokeStyle="#080b12";context.lineWidth=12;context.strokeText("DUNGEON GAME",360,65);
 context.strokeStyle=["#765333","#267582","#6c7195"][variant];context.lineWidth=5;context.strokeText("DUNGEON GAME",360,62);
 const light=context.createLinearGradient(0,15,0,68);light.addColorStop(0,["#fff3c0","#d4fbf2","#eff4ff"][variant]);light.addColorStop(.5,["#d6aa55","#77bdab","#bdc9ed"][variant]);light.addColorStop(1,["#9e7336","#3c7e79","#687caa"][variant]);context.fillStyle=light;context.fillText("DUNGEON GAME",360,62);context.restore();
}
