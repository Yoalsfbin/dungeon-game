function contentWarpActor(actor){const from={x:actor.x,y:actor.y},point=warpDestination(from);if(!point)return false;flushEvents(false);actor.x=point.x;actor.y=point.y;fxSeq(()=>{sfx('warp');ring(from,'#80d8fa',1.3,400);},120);queue.push({dur:200,update(p){actor.warpScale=1-p;},end(){actor.rx=point.x;actor.ry=point.y;}});queue.push({dur:240,update(p){actor.warpScale=p;},end(){delete actor.warpScale;sfx('arrive');ring(point,'#80d8fa',1.3,400);}});log(`${actor.name}は水に落ち、別の場所へワープした！`);if(actor===player)updateSeen();return true;}
function contentIceCrash(source,target){
 const dx=Math.sign(target.x-source.x),dy=Math.sign(target.y-source.y),from={x:target.x,y:target.y,name:target.name,dir:[dx,dy]};
 if(target===player&&contentHas(player.shield,'s_stand')){log('踏んばりの盾で吹き飛ばしを防いだ。');return;}
 for(let step=0;step<2;step++){const x=target.x+dx,y=target.y+dy;if(!diagonalClear(target.x,target.y,dx,dy))break;if(tileAt(x,y)===TILE.WATER){contentWarpActor(target);break;}if(!walkable(x,y)||occupied(x,y))break;moveEnt(target,x,y);}
 log(`${target.name}が吹き飛ばされた！`);
 if(target===player){const candidates=player.inv.filter(item=>![player.weapon,player.shield,player.ring,player.arrow].includes(item));if(candidates.length){const item=candidates[ri(0,candidates.length-1)];claimGround(item);player.inv.splice(player.inv.indexOf(item),1);const dirs=[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]],direction=dirs[ri(0,7)];log(`${ITEMS[item.kind].name}が荷物からこぼれた！`);throwItem(item,from,direction);}}
}
function contentAbsorbItem(monster,item){
 if(monster.kind!=='tsubo'||monster.sealed||!(monster.shellT>0)||ITEMS[item.kind].cat==='壺')return false;
 const capacity=monster.tier;if((monster.swallowedCount||0)>=capacity){log(`${monster.name}の壺はいっぱいで、道具ははじかれた。`);dropItemNear(item,monster.x,monster.y);return true;}
 monster.swallowedPot??={kind:monster.tier===3?'pot_fusion':'pot',capacity,contents:[]};monster.swallowedPot.capacity=capacity;monster.swallowedPot.kind=monster.tier===3?'pot_fusion':'pot';
 contentPutInPot(monster.swallowedPot,item);monster.swallowedCount=(monster.swallowedCount||0)+1;monster.atk+=2;
 if(monster.tier>=2){known.add(item.kind);log(`壺の中で${ITEMS[item.kind].name}の正体が分かった。`);}
 log(`${monster.name}の壺に道具が入り、攻撃力が上がった！`);fxSeq(()=>{sfx('pot');monster.specialActionT=NOW()+400;ring(monster,'#e6c691',.8,350);},160);return true;
}
function contentHealFeedback(actor,amount){if(!(amount>0))return;fxStep(()=>{if(!actor||actor.hp<=0)return;sfx(amount>=3?'heal':'quietheal');ring(actor,'#92f0ab',amount>=3?1.15:.65,300);rise(actor,'#92f0ab',amount>=3?12:4);popup(actor,'+'+amount,'#9ff4b7');},amount>=3?180:0);}
function installContentCombat(){
 const oldThrow=throwItem;throwItem=function(item,from=player,direction=from.dir||player.dir){const result=lineTarget(10,from,direction);if(result.hit?.kind==='tsubo'&&result.hit.shellT>0&&!result.hit.sealed&&ITEMS[item.kind].cat!=='壺'){flyAnim(item.kind,result.x,result.y,null,from);contentAbsorbItem(result.hit,item);return;}return oldThrow(item,from,direction);};
 const oldKill=kill;kill=function(monster,by){if(monster===player){contentRescue();return;}if(monster.swallowedPot?.contents?.length){for(const item of monster.swallowedPot.contents)dropItemNear(item,monster.x,monster.y);monster.swallowedPot.contents=[];}return oldKill(monster,by);};
 const oldLevel=levelUpMonster;levelUpMonster=function(monster){const before=monster.tier,boost=(monster.swallowedCount||0)*2;oldLevel(monster);if(monster.tier!==before&&boost){monster.atk+=boost;if(monster.tier>=2)for(const item of monster.swallowedPot?.contents||[])known.add(item.kind);if(monster.tier===3&&monster.swallowedPot){const contents=[...monster.swallowedPot.contents];monster.swallowedPot={kind:'pot_fusion',capacity:3,contents:[]};for(const item of contents)contentPutInPot(monster.swallowedPot,item);}}};
 const oldAttack=monsterAttack;monsterAttack=function(monster,power,verb,far,special){const hit=oldAttack(monster,power,verb,far,special);if(hit&&monster.kind==='pen'&&monster.tier===3&&String(verb).includes('体当たり'))contentIceCrash(monster,player);return hit;};
 const oldAllyAttack=attackAlly;attackAlly=function(monster,options={}){const target=ally,hit=oldAllyAttack(monster,options);if(hit&&target?.hp>0&&monster.kind==='pen'&&monster.tier===3&&String(options.verb).includes('体当たり'))contentIceCrash(monster,target);return hit;};
 const oldHeal=heal;heal=function(amount){const before=player.hp;oldHeal(amount);contentHealFeedback(player,player.hp-before);};
 const oldOptions=itemOptions;itemOptions=function(item,index,ground=false){const options=oldOptions(item,index,ground);if(item.kind==='pot_heal'){const push=options.find(option=>option.label==='押す');if(push){const run=push.run;push.run=()=>{const before=player.hp,result=run();if(result)contentHealFeedback(player,player.hp-before);return result;};}}return options;};
 const antidote=ITEMS.curegrass.use;ITEMS.curegrass.use=function(){const poisoned=player.poisonT>0;antidote();delete player.poisonT;delete player.poisonPower;if(poisoned)log('毒も消えた。');};ITEMS.curegrass.desc='食べると毒・混乱・鈍足・しびれ・巻きつきが治る。';
 const purify=ITEMS.sc_purify.use;ITEMS.sc_purify.use=function(){purify();if(player.hungerCurse){delete player.hungerCurse;log('腹減りの呪いも解けた。');}};
 for(const item of Object.values(ITEMS).filter(item=>item.cat==='杖'&&item.zap)){const zap=item.zap;item.zap=function(target){if(target!==player)return zap(target);if(item===ITEMS.st_bolt)contentDamage({name:'稲妻'},player,12,'magic');else if(item===ITEMS.st_slow)player.slowT=6;else if(item===ITEMS.st_seal)player.sealedT=6;else if(item===ITEMS.st_happy){player.lv=Math.min(50,player.lv+1);player.maxhp+=4;player.hp=Math.min(player.maxhp,player.hp+4);player.atk++;}else log('魔法弾が当たったが、変化はなかった。');};}
}
