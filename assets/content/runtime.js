const contentSources=new Map(),contentFrames=new Map();
let contentObjects=[],contentBombs=[],contentCutIn=null;
let contentFlames=[];
function contentProductionTheme(theme){return ({forest:'jungle',snowfield:'snow',marsh:'lake',ashfield:'volcano'})[theme]||theme;}
function contentSource(file){let entry=contentSources.get(file);if(!entry){const image=new Image();entry={image,ready:false};contentSources.set(file,entry);image.onload=()=>{entry.ready=true;};image.src=file;}return entry;}
function contentFrame(key){const meta=GAME_CONTENT.extra[key];if(!meta)return null;if(contentFrames.has(key))return contentFrames.get(key);const source=contentSource(meta.file);if(!source.ready)return null;const frame=artCell(source.image,meta.rect);contentFrames.set(key,frame);return frame;}
function contentTheme(f){
 if(LAST_FLOOR===99){const plan=floorEvents.skinPlan||(floorEvents.skinPlan=[]),keys=Object.keys(GAME_CONTENT.themes);for(let i=plan.length;i<=Math.floor((f-1)/5);i++){const choices=keys.filter(key=>key!==plan[i-1]);plan.push(choices[Math.floor(R()*choices.length)]);}return contentProductionTheme(plan[Math.floor((f-1)/5)]);}
 return contentProductionTheme(GAME_CONTENT.tables[LAST_FLOOR]?.[chosen||'viking']?.[Math.max(0,f-1)]?.theme||'cave');
}
function contentRow(){return GAME_CONTENT.tables[LAST_FLOOR]?.[chosen||'viking']?.[floor-1]||GAME_CONTENT.tables[10].viking[0];}
function contentFloorEnemies(){const base=FLOOR_ENEMIES[Math.min(10,floor)]||FLOOR_ENEMIES[10];return {...base,start:LAST_FLOOR===99?Math.min(10,4+Math.floor(floor/8)):LAST_FLOOR===30?Math.min(9,4+Math.floor(floor/4)):base.start,max:LAST_FLOOR===99?14:base.max,every:LAST_FLOOR===99?40:base.every,table:contentRow().entries.filter(e=>!e.fixed&&!e.rare).map(e=>[Object.keys(ENEMIES).find(id=>ENEMIES[id].kind===e.kind&&ENEMIES[id].tier===e.tier),e.weight])};}
function contentPickSpawn(point){let pool=contentRow().entries.filter(e=>!e.fixed&&!e.rare);if(monsters.some(m=>m.kind==='dragon'))pool=pool.filter(e=>e.kind!=='dragon');const room=point&&roomAt(point.x,point.y),support=['healer','web','caller','wind','hunger','bomb'];if(room&&monsters.some(m=>roomAt(m.x,m.y)===room&&support.includes(m.ai)))pool=pool.filter(e=>!support.includes(MON[e.kind].ai));if(!pool.length)return {kind:'mokko',tier:Math.min(3,Math.ceil(floor/25))};let roll=R()*pool.reduce((sum,e)=>sum+e.weight,0);return {...(pool.find(e=>(roll-=e.weight)<0)||pool[0])};}
function contentPotFree(pot){return Math.max(0,(pot.capacity??3)-(pot.usedSlots??pot.contents?.length??0));}
function contentEffects(item){if(!item)return [];return [...new Set([item.kind,...(item.effects||[])])].filter(key=>ITEMS[key]?.cat==='武器'||ITEMS[key]?.cat==='盾');}
function contentHas(item,key){return contentEffects(item).includes(key);}
function contentPutInPot(pot,item){
 if(pot.kind!=='pot_fusion'){pot.contents.push(item);return;}
 pot.usedSlots=(pot.usedSlots??pot.contents.length)+1;
 const base=pot.contents.find(other=>ITEMS[other.kind].cat===ITEMS[item.kind].cat&&['武器','盾'].includes(ITEMS[item.kind].cat));
 if(!base){pot.contents.push(item);return;}
 base.fused=true;base.plus=(base.plus||0)+(item.plus||0);base.effects=[...new Set([...contentEffects(base),...contentEffects(item)])].filter(key=>contentSpecial(key)&&key!==base.kind).slice(0,2-(contentSpecial(base.kind)?1:0));
 log(`${ITEMS[base.kind].name}に修正値と特殊効果が合成された。`);sfx('magic');
}
function contentSpecial(key){return ['w_dragon','w_insect','w_purify','w_push','w_spear','w_axe','s_flame','s_insulate','s_stand','s_blast','s_spike','s_fur'].includes(key);}
function contentEquipmentDetails(item){const definition=ITEMS[item.kind],base=definition.cat==='武器'?definition.atk:definition.def,plus=item.plus||0;return [{label:definition.cat==='武器'?'攻撃力':'防御力',desc:`${base}（${plus>=0?'＋':'−'}${Math.abs(plus)}）＝${base+plus}`},...contentEffects(item).filter(contentSpecial).map(key=>({label:ITEMS[key].name,desc:ITEMS[key].desc}))];}
function contentIncoming(amount,type){if(type==='fire'&&contentHas(player.shield,'s_flame')||type==='magic'&&contentHas(player.shield,'s_insulate')||type==='blast'&&contentHas(player.shield,'s_blast'))return Math.max(1,Math.ceil(amount/2));return amount;}
function contentRescue(){if(!player||player.hp>0)return;const tag=player.inv.find(item=>item.kind==='tag_substitute');if(!tag)return;player.inv.splice(player.inv.indexOf(tag),1);player.hp=1;log('身代わりの木札が砕け、HP1で踏みとどまった！');fxSeq(()=>{sfx('heal');ring(player,'#fff3ba',1.5,400);},180);}
function contentObjectAt(x,y){return contentObjects.find(o=>o.x===x&&o.y===y&&!o.broken);}
function contentPush(actor,dx,dy,count){if(actor===player&&contentHas(player.shield,'s_stand')){log('踏んばりの盾が移動を防いだ。');return;}for(let i=0;i<count;i++){if(!canStep(actor.x,actor.y,dx,dy)||occupied(actor.x+dx,actor.y+dy))break;moveEnt(actor,actor.x+dx,actor.y+dy);}if(actor===player)updateSeen();}
function contentDamage(source,target,amount,type='melee'){
 const damage=target===player?contentIncoming(amount,type):amount;target.hp-=damage;target.awake=true;target.sleep=0;
 log(`${source.name||'爆発'}で${target.name}に${damage}のダメージ。`);if(target===player){player.killer=`${source.name||'爆発'}で倒された`;contentRescue();}
 addHits({a:source,t:target,d:damage,far:true,still:true,killed:target!==player&&target.hp<=0});if(target!==player&&target.hp<=0)kill(target,source.kind?source:undefined);
}
function contentBlast(at,power,radius=1,breakWalls=false){
 const source=monsters.find(m=>m.contentId===at.ownerId&&at.ownerId)||{name:'爆発',x:at.x,y:at.y};
 fxSeq(()=>{sfx('fire');shake(260,7);ring(at,'#ffb24f',radius+.6,420);sparks(at,'#ffbd64',24,.09,.02);},220);
 for(const target of [player,ally,...monsters].filter(Boolean))if(target.hp>0&&dist(at,target)<=radius)contentDamage(source,target,power,'blast');
 if(breakWalls)for(let y=Math.max(1,at.y-radius);y<=Math.min(MH-2,at.y+radius);y++)for(let x=Math.max(1,at.x-radius);x<=Math.min(MW-2,at.x+radius);x++)if(isWallTile(tileAt(x,y)))map[y][x]=TILE.FLOOR;
 if(breakWalls){sfx('collapse');updateSeen();}
}
function contentHitObject(object){
 if(object.kind==='altar'){
  if(object.used){log('祭壇は静まり返っている。');return;}
  object.used=true;const item=randomItem(),point=nearFree(player.x,player.y);if(point)items.push({...item,...point});log(point?'祭壇に道具が現れた。':'祭壇の光は消えた。');fxSeq(()=>{sfx('special');ring(object,'#fff0a5',1.5,500);},240);return;
 }
 object.broken=true;log(object.kind==='crystal'?'水晶が砕け、道が開いた。':'爆発岩がはじけた！');
 if(object.kind==='rock')contentBlast(object,15,1,true);else fxSeq(()=>{sfx('collapse');sparks(object,'#a6e9ef',18,.08,.02);},180);
}
function contentExit(){const theme=themeFor(floor);if(!THEMES[theme]?.outdoor)return ['stairs','下り階段'];return ({forest:['exit-trail','森の小道'],snowfield:['exit-pass','峠への登り口'],marsh:['exit-bridge','向こう岸への橋'],ashfield:['exit-gate','岩の切れ目']})[theme]||['stairs','下り階段'];}
function drawContentObjects(sx,sy,now){
 drawContentFlames(sx,sy,now);
 for(const object of contentObjects){if(object.broken||!seen[object.y]?.[object.x])continue;const image=contentFrame(({crystal:'crystal-object',rock:'explosive-rock',altar:'bonus-altar'})[object.kind]);if(!image)continue;ctx.save();ctx.globalAlpha=object.used?.45:1;ctx.drawImage(image,sx(object.x)-8,sy(object.y)-20,TS+16,TS+16);ctx.restore();}
 for(const bomb of contentBombs)if(visible(bomb.x,bomb.y)){const x=sx(bomb.x)+TS/2,y=sy(bomb.y)+TS/2;ctx.fillStyle='#1d2027';ctx.beginPath();ctx.arc(x,y,14,0,7);ctx.fill();ctx.strokeStyle='#ffb251';ctx.lineWidth=3;ctx.stroke();ctx.font='bold 22px monospace';ctx.textAlign='center';ctx.fillStyle='#fff4bc';ctx.fillText(String(bomb.remaining),x,y+7);ctx.textAlign='left';}
}
function contentAfterTurn(){
 for(const actor of [player,ally,...monsters].filter(Boolean))if(actor.poisonT>0&&actor.poisonTurn<turn){const damage=Math.min(actor.hp-1,actor.poisonPower||1);if(damage>0){actor.hp-=damage;fxStep(()=>popup(actor,String(damage),'#badd8a'),0);}if(--actor.poisonT<=0){delete actor.poisonPower;log(`${actor.name}の毒が消えた。`);}}
 const curse=player.hungerCurse;if(curse&&curse.created<turn){player.food=Math.max(0,player.food-curse.rate);if(--curse.left<=0){delete player.hungerCurse;log('腹減りの呪いが解けた。');}}
 for(const bomb of [...contentBombs])if(bomb.created<turn&&--bomb.remaining<=0){contentBombs=contentBombs.filter(b=>b!==bomb);contentBlast(bomb,bomb.power,bomb.radius);}
 if(player.firewalkT>0)player.firewalkT--;if(player.sealedT>0)player.sealedT--;
 for(const key of Object.keys(player.skillCooldowns||{}))player.skillCooldowns[key]=Math.max(0,player.skillCooldowns[key]-1);
 if(player.ring?.kind==='ring_calm')player.confT=0;contentRescue();
}
function contentPlaceObjects(){
 const theme=themeFor(floor),pool=[];
 if(floor>=8&&['cave','ice','crystal','obsidian','sealed','bone'].includes(theme))pool.push('crystal');
 if(floor>=18&&['volcano','ashfield','obsidian'].includes(theme))pool.push('rock');
 if(floor>=6&&['ruins','sandstone','coral','clockwork','sealed','altar'].includes(theme))pool.push('altar');
 for(const room of rooms){if(room===shop?.room||monsters.some(m=>m.kind==='banjin'&&roomAt(m.x,m.y)===room)||room===house||R()>.35)continue;
  const eligible=pool.filter(kind=>contentObjects.filter(o=>o.kind===kind).length<(kind==='crystal'?2:1));if(!eligible.length)continue;
  const choices=[];for(let y=room.y+1;y<room.y+room.h-1;y++)for(let x=room.x+1;x<room.x+room.w-1;x++)if(itemLandingAllowed(x,y)&&!occupied(x,y)&&dist({x,y},player)>3)choices.push({x,y});
  if(choices.length<3)continue;const point=choices[ri(0,choices.length-1)];contentObjects.push({...point,kind:eligible[ri(0,eligible.length-1)]});
 }
 const rare=contentRow().entries.find(e=>e.rare);if(rare&&!floorEvents.mitsuMade&&R()<rare.initialChance){for(let i=0;i<30;i++){const point=freeSpot(roomAt(player.x,player.y));if(point&&roomAt(point.x,point.y)!==house&&roomAt(point.x,point.y)!==shop?.room){monsters.push(makeMonster(rare.kind,rare.tier,point.x,point.y));floorEvents.mitsuMade=true;break;}}}
 player.entryPoint={x:player.x,y:player.y};
}
function contentAttackDamage(monster,damage){
 const families=MON[monster.kind].families||[];
 if(contentHas(player.weapon,'w_dragon')&&families.includes('dragon')||contentHas(player.weapon,'w_insect')&&families.includes('insect')||contentHas(player.weapon,'w_purify')&&families.includes('undead'))damage=Math.ceil(damage*1.5);
 if(monster.ai==='armor'&&!monster.sealed){const[dx,dy]=monster.dir||[0,1];if((player.x-monster.x)*dx+(player.y-monster.y)*dy>0)damage=Math.max(1,Math.ceil(damage/2));}
 return damage;
}
function initializeContent(){
 Object.assign(MON,GAME_CONTENT.monsters);Object.assign(TIERS,GAME_CONTENT.tiers);Object.assign(THEMES,GAME_CONTENT.themes);Object.assign(ITEMS,GAME_CONTENT.items);CAT_ICON['木札']='woodtag';PRICE_BY_CAT['木札']=250;
 ITEMS.ar_stone.cat='石';CAT_ICON['石']='stone';if(!CAT_ORDER.includes('石'))CAT_ORDER.splice(CAT_ORDER.indexOf('草'),0,'石');
 if(!CAT_ORDER.includes('木札'))CAT_ORDER.push('木札');
 Object.assign(SFX,{pot:{...SFX.drop,f0:450,f1:230,dur:.12},quietheal:{...SFX.heal,vol:.008,dur:.08},punch:{...SFX.hit,f0:150,f1:75,vol:.03}});
 for(const[key,base]of Object.entries({forest:'jungle',snowfield:'snow',marsh:'lake',ashfield:'volcano',mycelium:'jungle',crystal:'ice',obsidian:'volcano',sealed:'altar',sandstone:'ruins',coral:'lake',clockwork:'ruins',bone:'cave'}))TRACKS[key]={...TRACKS[base]};
 MON.banjin.slow=false;MON.hoshi.baseFast=true;MON.mitsukoro.baseFast=true;
 for(const[kind,monster]of Object.entries(MON)){if(!TIERS[kind][0])TIERS[kind][0]={name:monster.name,abil:[],desc:monster.desc};}
 let id=70;for(const kind of Object.keys(MON).filter(kind=>!Object.values(ENEMIES).some(e=>e.kind===kind)&&!MON[kind].npc))for(const tier of [1,2,3])ENEMIES[id++]={kind,tier};
 for(const[key,item]of Object.entries(GAME_CONTENT.items))ITEM_POOL.push([key,['武器','盾','腕輪'].includes(item.cat)?2:3]);
 for(const key of ['ar_wood','ar_iron','ar_stone'])ITEMS[key].desc=`基礎威力${ITEMS[key].power}に主人公の攻撃力を加える。${key==='ar_stone'?'射程5マス。':'直線上へ飛ぶ。'}手前の仲間にも当たる。`;
 for(let level=20;level<50;level++)LV_NEED.push((LV_NEED[level-1]||2200)+Math.round(550*Math.pow(1.1,level-20)));
 for(const[key,list]of Object.entries(GAME_CONTENT.learned))list.forEach((skill,index)=>SKILLS[key].push({...skill,id:`${key}-learned-${index}`}));
 installContentRules();installContentFields();installContentCombat();installContentArt();
}
