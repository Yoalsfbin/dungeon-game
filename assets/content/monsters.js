function contentAimLine(a,b,range){const dx=b.x-a.x,dy=b.y-a.y;if(!dx&&!dy||Math.max(Math.abs(dx),Math.abs(dy))>range||dx&&dy&&Math.abs(dx)!==Math.abs(dy))return false;let x=a.x,y=a.y;while(x!==b.x||y!==b.y){x+=Math.sign(dx);y+=Math.sign(dy);if(isWallTile(tileAt(x,y))||contentObjectAt(x,y))return false;}return true;}
function contentLine(a,b,range){if(!contentAimLine(a,b,range))return false;const dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);let x=a.x,y=a.y;while(x!==b.x||y!==b.y){x+=dx;y+=dy;if((x!==b.x||y!==b.y)&&occupied(x,y))return false;}return true;}
function contentRayTarget(source,target,range=MW+MH){if(!contentAimLine(source,target,range))return null;const dx=Math.sign(target.x-source.x),dy=Math.sign(target.y-source.y);let x=source.x,y=source.y;for(;;){x+=dx;y+=dy;const actor=[player,ally,...monsters].find(entity=>entity&&entity!==source&&entity.hp>0&&entity.x===x&&entity.y===y);if(actor)return actor;if(x===target.x&&y===target.y)return target;}}
function contentTarget(m){return ally?.joined&&ally.hp>0&&dist(m,ally)<dist(m,player)&&noticesAlly(m)?ally:player;}
function contentSpecialPose(m,label,color='#ddc99a'){m.dir=m.dir||[0,1];fxSeq(()=>{m.specialT=NOW()+450;m.specialActionT=NOW()+450;m.specialPoseRow=6;banner(`${m.name}の${label}`,color);sfx('magic');},180);}
function contentMonsterAct(m){
 if(MON[m.kind].npc||m.hp<=0)return false;
 const target=contentTarget(m),distance=dist(m,target);
 if(m.ai==='morsel'||m.kind==='hoshi'||m.kind==='kusune'&&m.tier>=2&&m.carry){contentFlee(m);return true;}
 const food=monsters.find(other=>other.ai==='morsel'&&other.hp>0&&dist(m,other)<=5&&roomAt(m.x,m.y)===roomAt(other.x,other.y));
 if(food&&dist(m,food)<Math.max(2,distance)){if(dist(m,food)===1&&canStep(m.x,m.y,food.x-m.x,food.y-m.y)){food.hp=0;log(`${m.name}が${food.name}を食べた！`);addHits({a:m,t:food,d:food.maxhp,killed:true});kill(food,m);}else stepToward(m,food.x,food.y);return true;}
 if(!m.awake||m.sealed)return false;
 if(m.contentCooldown>0)m.contentCooldown--;
 const face=()=>m.dir=[Math.sign(target.x-m.x),Math.sign(target.y-m.y)];
 if(m.kind==='pen'&&m.tier===3&&!m.contentCooldown&&distance>=2&&contentAimLine(m,target,4)){
  const victim=contentRayTarget(m,target,4);face();m.dir=[Math.sign(victim.x-m.x),Math.sign(victim.y-m.y)];m.contentCooldown=4;contentSpecialPose(m,'滑走体当たり','#bde9ff');for(let n=0;n<3&&dist(m,victim)>1;n++){const[dx,dy]=m.dir,x=m.x+dx,y=m.y+dy;if(!canStep(m.x,m.y,dx,dy)||contentObjectAt(x,y)||isWallTile(tileAt(x,y)))break;const blocker=[player,ally,...monsters].find(actor=>actor&&actor!==m&&actor.hp>0&&actor.x===x&&actor.y===y);if(blocker){contentDamage(m,blocker,dmg(Math.round(m.atk*1.5),blocker===player?defTotal():blocker===ally?2:blocker.def));return true;}moveEnt(m,x,y);}
  if(dist(m,victim)===1){if(victim===player)monsterAttack(m,Math.round(m.atk*1.5),'の体当たり',false,true);else if(victim===ally)attackAlly(m,{verb:'の体当たり',fixed:dmg(Math.round(m.atk*1.5),2)});else contentDamage(m,victim,dmg(Math.round(m.atk*1.5),victim.def));}return true;
 }
 if(m.ai==='healer'&&!m.contentCooldown){const hurt=monsters.filter(other=>other!==m&&!other.peaceful&&other.hp>0&&other.hp<other.maxhp&&dist(m,other)<=m.tier).sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp)[0];if(hurt){const amount=[6,12,20][m.tier-1];hurt.hp=Math.min(hurt.maxhp,hurt.hp+amount);m.contentCooldown=3;contentSpecialPose(m,'癒し','#a9e3a2');log(`${hurt.name}のHPが${amount}回復した。`);fxSeq(()=>{rise(hurt,'#a9e3a2',12);ring(hurt,'#a9e3a2',.8,300);},150);return true;}}
 if(m.kind==='dragon'){
  const sameRoom=roomAt(m.x,m.y)&&roomAt(m.x,m.y)===roomAt(target.x,target.y),valid=(sameRoom||m.tier===3)&&contentAimLine(m,target,MW+MH);
  if(!m.contentCooldown&&valid){const victim=contentRayTarget(m,target);if(!victim)return false;face();m.contentCooldown=5;contentSpecialPose(m,m.tier===3?'追尾する業火':'炎の息','#ffa859');contentRoastLine(m,victim);contentDragonFire(m,victim);contentDamage(m,victim,[20,30,40][m.tier-1],'fire');return true;}
 }
 if(m.ai==='bomb'&&!m.contentCooldown&&distance>=2&&contentLine(m,target,4)&&!contentBombs.some(b=>b.x===target.x&&b.y===target.y)){
  face();const immediate=roomAt(m.x,m.y)&&roomAt(m.x,m.y)===roomAt(target.x,target.y)&&R()<.4;m.contentCooldown=immediate?5:4;contentSpecialPose(m,immediate?'炸裂弾投げ':'爆弾投げ','#f5bb75');
  m.contentId??=(floorEvents.actorSeq=(floorEvents.actorSeq||0)+1);const bomb={ownerId:m.contentId,x:target.x,y:target.y,remaining:3,created:turn,power:[12,20,30][m.tier-1],radius:m.tier===3?2:1};
  fxStep(()=>{m.specialPoseRow=4;m.specialActionT=NOW()+400;},0);flyAnim('ar_stone',bomb.x,bomb.y,'#ddaa66',m);
  if(immediate){log(`${m.name}が炸裂弾を投げた！`);contentBlast(bomb,[8,12,18][m.tier-1],1);}else{contentBombs.push(bomb);log('爆弾が落ちた！　3→2→1で爆発する。');}return true;
 }
 if(m.ai==='hunger'&&!m.contentCooldown&&target===player&&!player.hungerCurse&&contentLine(m,target,m.tier===1?2:3)){
  face();m.contentCooldown=8;contentSpecialPose(m,'腹減りの呪い','#c6a6df');player.hungerCurse={left:m.tier===1?4:5,rate:m.tier===3?2:1,created:turn};log('腹減りの呪いを受けた。しばらく満腹度が減り続ける。');fxSeq(()=>{ring(player,'#b48bc9',1,400);},160);return true;
 }
 if(m.ai==='web'&&!m.contentCooldown&&!(target.bindT>0)&&distance>=2&&contentLine(m,target,m.tier+1)){face();m.contentCooldown=5;contentSpecialPose(m,m.tier>=2?'毒糸':'糸吐き',m.tier>=2?'#b7d0a1':'#e1e6ee');flyAnim('bolt',target.x,target.y,m.tier>=2?'#b7d0a1':'#e1e6ee',m);target.bindT=m.tier;if(target===player&&player.ring?.kind==='ring_unbind')target.bindT=Math.max(1,Math.ceil(target.bindT/2));if(m.tier>=2){target.poisonT=m.tier===3?5:3;target.poisonPower=m.tier===3?2:1;target.poisonTurn=turn;log(`${target.name}は毒にも侵された。`);}log(`${target.name}は糸で${target.bindT}ターン移動できない。攻撃や道具は使える。`);return true;}
 if(m.ai==='wind'){
  if(m.windReady){delete m.windReady;m.contentCooldown=4;if(contentLine(m,target,3)){face();const[dx,dy]=m.dir;contentSpecialPose(m,'突風','#b5edf2');fxSeq(()=>puffCloud(m,target,'#c9f2ed',16),180);contentPush(target,dx,dy,m.tier);log(`${target.name}が突風で押し戻された。`);}return true;}
  if(!m.contentCooldown&&distance>=2&&contentLine(m,target,3)){face();m.windReady=true;contentSpecialPose(m,'吸い込み','#b5edf2');log(`${m.name}が風を吸い込んでいる…`);return true;}
 }
 if(m.ai==='breaker'){
  if(m.chargeDir){const[dx,dy]=m.chargeDir;delete m.chargeDir;m.contentCooldown=4;contentSpecialPose(m,'突進','#d1b890');for(let step=0;step<m.tier+2;step++){const x=m.x+dx,y=m.y+dy;if(x<=0||y<=0||x>=MW-1||y>=MH-1)break;if(contentObjectAt(x,y))break;if(isWallTile(tileAt(x,y))){map[y][x]=TILE.FLOOR;fxSeq(()=>{sfx('collapse');sparks({x,y},'#b2a18d',12,.06,.02);},100);}const victim=[player,ally,...monsters].find(actor=>actor&&actor!==m&&actor.hp>0&&actor.x===x&&actor.y===y);if(victim){contentDamage(m,victim,dmg(m.atk,victim===player?defTotal():victim===ally?2:victim.def));break;}if(occupied(x,y)||!walkable(x,y))break;moveEnt(m,x,y);}updateSeen();return true;}
  if(!m.contentCooldown&&distance>=2&&distance<=6&&(Math.abs(target.x-m.x)===Math.abs(target.y-m.y)||target.x===m.x||target.y===m.y)){face();m.chargeDir=[...m.dir];contentSpecialPose(m,'構え','#d1b890');log(`${m.name}が突進の構えを取った。`);return true;}
 }
 if(m.ai==='mirror'&&turn%4<2)m.specialT=NOW()+350;
 if(m.ai==='quill'&&turn%3!==2)m.specialT=NOW()+350;
 if(m.ai==='crab'&&distance===1&&canStep(m.x,m.y,target.x-m.x,target.y-m.y)){face();const hit=target===player?monsterAttack(m,m.atk,'のハサミ攻撃',false):attackAlly(m,{verb:'のハサミ攻撃'});if(!hit){m.stun=1;log(`${m.name}はハサミを振り下ろし、隙を見せた。`);}return true;}
 return false;
}
