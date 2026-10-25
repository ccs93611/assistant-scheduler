/* 治療介紹的步驟示意圖（自己畫的 SVG，不用外部圖片，沒有版權問題）
   TI_FIGS[介紹 id]() 回傳 <figure> 字串；treatment-info.js 的 tiBodyHtml 放在「這是什麼」說明下方。
   每張圖由幾格步驟組成（每格 140×170，下方是說明文字，\n 換行）。
   牙齒剖面：上方牙冠、下方牙根；先畫牙齦、再畫骨頭、最後畫牙齒，牙齒蓋在最上面。
   畫風：寫實解剖圖（淡藍底、白色牙釉質、米色牙本質、紅色牙髓與血管神經、粉紅牙齦、米色骨頭）。 */
'use strict';
const TI_FIGS=(()=>{
const C={bg:'#d9ecf9',bone:'#eadfc4',boneS:'#d3c4a1',gum:'#efa9bb',gumS:'#dc8fa4',enamel:'#ffffff',tooth:'#ffffff',root:'#f6d2ae',dentin:'#f6d2ae',toothS:'#c9ad90',
  pulp:'#e27b7d',pulpS:'#f1cd55',nerveR:'#c0282d',nerveB:'#2f7fd0',gp:'#ef8b3c',decay:'#3f3b3b',cer:'#c8cdd1',cerS:'#8b959b',zr:'#f1f3f4',zrS:'#97a3a9',metal:'#b9c2c8',metalS:'#6f7c84',
  mem:'#3f8bd6',lesion:'#b0473f',sinus:'#bfe0f6',text:'#33424a',arrow:'#f0965a',hole:'#d9ecf9',graft:'#e9d59c',graftD:'#bfa262',
  stain:'#a0743c',yellow:'#f1dfa5',denture:'#e98fa3',dentureS:'#cc6f86',post:'#fbf8ee',postS:'#b0a588',mta:'#2fa760',mtaS:'#1d7a44',tray:'#cfe9f4',trayS:'#7fb7cf',flap:'#e7899c'};
const W=140,H=170,G=26,CEJ=80,DASH=' stroke-dasharray="3 2.5"';
let uid=0;
const path=(d,fill,stroke,sw=1.6,extra='')=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`:''}${extra}/>`;
const ell=(cx,cy,rx,ry,f,op)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${op?` opacity="${op}"`:''}/>`;
// 同色的幾塊拼成一顆牙：先畫粗外框再蓋上填色，拼接處就看不到線
const solid=(parts,stroke=C.toothS)=>parts.map(([d])=>path(d,'none',stroke,3.2)).join('')+parts.map(([d,f])=>path(d,f)).join('');

/* ---- 牙齒形狀（x = 牙齒中心） ---- */
const crownM=x=>`M${x-21},${CEJ}C${x-26},64 ${x-26},34 ${x-19},28Q${x-13},21 ${x-7},27Q${x},32 ${x+7},27Q${x+13},21 ${x+19},28C${x+26},34 ${x+26},64 ${x+21},${CEJ}Z`;
const rootM=(x,ap)=>`M${x-21},${CEJ}C${x-22},108 ${x-17},${ap-16} ${x-13},${ap}Q${x-10},${ap+3} ${x-7},${ap-2}C${x-5},125 ${x-3},108 ${x},104C${x+3},108 ${x+5},125 ${x+7},${ap-2}Q${x+10},${ap+3} ${x+13},${ap}C${x+17},${ap-16} ${x+22},108 ${x+21},${CEJ}Z`;
const crownS=x=>`M${x-19},${CEJ}C${x-24},62 ${x-23},34 ${x-15},26Q${x},15 ${x+15},26C${x+23},34 ${x+24},62 ${x+19},${CEJ}Z`;
const rootS=(x,ap)=>`M${x-19},${CEJ}C${x-17},108 ${x-8},${ap-12} ${x-3},${ap}Q${x},${ap+4} ${x+3},${ap}C${x+8},${ap-12} ${x+17},108 ${x+19},${CEJ}Z`;
const rootCut=(x,ap)=>`M${x-19},${CEJ}C${x-17},108 ${x-9},${ap-10} ${x-6},${ap}L${x+6},${ap}C${x+9},${ap-10} ${x+17},108 ${x+19},${CEJ}Z`; // 根尖切除後
const prep=x=>`M${x-18},${CEJ}L${x-15},42Q${x-14},35 ${x-8},34L${x+8},34Q${x+14},35 ${x+15},42L${x+18},${CEJ}Z`; // 修磨後
const pulpM=(x,ap)=>`M${x-12},56Q${x-9},47 ${x-5},53Q${x},56 ${x+5},53Q${x+9},47 ${x+12},56L${x+11},72Q${x+12},100 ${x+11},${ap-6}L${x+9},${ap-6}Q${x+8},100 ${x+4},74L${x-4},74Q${x-8},100 ${x-9},${ap-6}L${x-11},${ap-6}Q${x-12},100 ${x-11},70Z`;
const pulpS=(x,ap)=>`M${x-6},54Q${x},46 ${x+6},54L${x+2.5},${ap-6}Q${x},${ap-3} ${x-2.5},${ap-6}Z`;
const canalM=(x,ap)=>`M${x-12},74L${x-9},74Q${x-8.5},100 ${x-9.5},${ap-5}L${x-11},${ap-5}Q${x-12.5},100 ${x-12},74ZM${x+12},74L${x+9},74Q${x+8.5},100 ${x+9.5},${ap-5}L${x+11},${ap-5}Q${x+12.5},100 ${x+12},74Z`;
const canalS=(x,ap)=>`M${x-3},60L${x+3},60L${x+1.8},${ap-5}L${x-1.8},${ap-5}Z`;
/* o.t：'m' 臼齒（兩根）／'s' 單根；o.crown：'n' 原本／'prep' 修磨後／'cap' 陶瓷牙冠／'zr' 氧化鋯牙冠／'metal' 金屬牙套
   o.pulp：'live' 神經／'empty' 清空的根管／'gp' 根管填充；o.ap 根尖位置；o.cut 根尖切除 */
// 牙髓裡的血管（紅）與神經（藍）
function vessels(x,m,ap){const r=[],b=[];
  if(m){r.push(`M${x-10},60Q${x-11},100 ${x-10.2},${ap-8}`,`M${x+10},60Q${x+11},100 ${x+10.2},${ap-8}`,`M${x-10},61L${x-4},57L${x+3},62L${x+9},58`);
    b.push(`M${x-9},63Q${x-9.6},100 ${x-9.4},${ap-8}`,`M${x+9},63Q${x+9.6},100 ${x+9.4},${ap-8}`,`M${x-9},65L${x-2},60L${x+5},65L${x+10},61`)}
  else{r.push(`M${x-1},57L${x-.6},${ap-9}`,`M${x-4},59L${x},62L${x+3},58`);b.push(`M${x+1},58L${x+.6},${ap-9}`)}
  return path(r.join(''),'none',C.nerveR,.7)+path(b.join(''),'none',C.nerveB,.7)}
function tooth(x,o={}){const m=o.t!=='s',ap=o.ap||152,cr=o.crown||'n';
  const R=o.cut?rootCut(x,ap):(m?rootM(x,ap):rootS(x,ap)),N=m?crownM(x):crownS(x);
  let s=solid([[R,C.dentin],[cr==='n'?N:prep(x),cr==='n'?C.enamel:C.dentin]]);
  if(cr==='n')s+=`<g transform="translate(${x},${CEJ}) scale(.8,.85) translate(${-x},${-CEJ})">${path(N,C.dentin)}</g>`; // 牙釉質內層的牙本質
  if(cr!=='n'&&cr!=='prep'){const[f,st]={cap:[C.cer,C.cerS],zr:[C.zr,C.zrS],metal:[C.metal,C.metalS]}[cr];
    s+=path(N,f,st,1.6)+path(prep(x),'none',st,1,DASH)}
  if(o.pulp==='live')s+=path(m?pulpM(x,ap):pulpS(x,ap),C.pulp,C.pulpS,1)+vessels(x,m,ap);
  else if(o.pulp==='empty')s+=path(m?pulpM(x,ap):pulpS(x,ap),'#fff',C.pulp,1,DASH);
  else if(o.pulp==='gp')s+=path(m?canalM(x,ap):canalS(x,ap),C.gp);
  return s}
/* 門牙側面（左舌側、右唇側），貼片用 */
const crownI=x=>`M${x-13},${CEJ}C${x-17},70 ${x-16},60 ${x-12},55C${x-7},47 ${x-3},32 ${x-1},18L${x+3},17C${x+12},30 ${x+17},52 ${x+13},${CEJ}Z`;
const prepI=x=>`M${x-13},${CEJ}C${x-17},70 ${x-16},60 ${x-12},55C${x-7},47 ${x-3},32 ${x-1},19.5L${x+1},19.5C${x+9},31 ${x+13.5},52 ${x+10.5},${CEJ}Z`;
const rootI=x=>`M${x-13},${CEJ}C${x-12},110 ${x-6},140 ${x-1},152Q${x+1},155 ${x+3},152C${x+8},140 ${x+13},110 ${x+13},${CEJ}Z`;
const veneerI=x=>`M${x+1},19.5L${x+3},17C${x+12},30 ${x+17},52 ${x+13},${CEJ-1}L${x+10.5},${CEJ-1}C${x+13.5},52 ${x+9},31 ${x+1},19.5Z`;
const pulpI=x=>`M${x-4},62Q${x},52 ${x+4},62L${x+2},146Q${x+1},148 ${x},146Z`;

/* ---- 牙齦、骨頭、植體 ---- */
const gum=(g=74,bot=132)=>path(`M0,${g+3}Q35,${g-2} 70,${g+3}T140,${g+3}V${bot}H0Z`,C.gum,C.gumS,1.2);
const bone=(b=90)=>path(`M0,${b}Q35,${b-3} 70,${b}T140,${b}V170H0Z`,C.bone,C.boneS,1.2);
const base=(g,b)=>gum(g)+bone(b);
function implant(x,top=92,bot=148){let s=path(`M${x-8},${top}H${x+8}L${x+7},${bot-6}Q${x},${bot+3} ${x-7},${bot-6}Z`,C.metal,C.metalS,1.4);
  for(let y=top+6;y<bot-6;y+=7)s+=`<line x1="${x-8}" y1="${y}" x2="${x+8}" y2="${y+3}" stroke="${C.metalS}" stroke-width="1.1"/>`;
  return s}
const abut=(x,top=92)=>path(`M${x-6},${top}L${x-5},60H${x+5}L${x+6},${top}Z`,C.metal,C.metalS,1.4);
const nb=ap=>tooth(4,{ap})+tooth(136,{ap}); // 左右鄰牙
const graft=(d,g)=>path(d,g,C.graftD,1);
const membrane=d=>path(d,'none',C.mem,2.6);

/* ---- 門牙正面（矯正、美白、馬里蘭牙橋）：上排犬齒、側門牙、正中門牙…，下排只當背景 ---- */
const FW=[19,17,23,23,17,19],FH=[50,45,56,56,45,50],FX0=8.5,FTOP=42;
const fcx=i=>FX0+FW.slice(0,i).reduce((a,b)=>a+b+1,0)+FW[i]/2; // 第 i 顆上排牙的中心
function toothFront(cx,top,w,h,canine){const l=cx-w/2,r=cx+w/2,b=top+h;
  return canine?`M${l},${top}V${b-11}Q${l+1},${b-5} ${cx},${b}Q${r-1},${b-5} ${r},${b-11}V${top}Z`
    :`M${l},${top}V${b-7}Q${l},${b} ${l+7},${b}H${r-7}Q${r},${b} ${r},${b-7}V${top}Z`}
function front(o={}){let teeth='',wire=[],low='';
  for(let i=0,x=23.5;i<6;i++){const w=[16,14,14,14,14,16][i];const l=x,r=x+w;low+=path(`M${l},146V107Q${l},102 ${l+5},102H${r-5}Q${r},102 ${r},107V146Z`,o.fill||C.tooth,C.toothS,1.2);x+=w+1}
  low+=path('M0,170V140C20,134 40,146 70,140C100,134 120,146 140,140V170Z',C.gum,C.gumS,1.2);
  FW.forEach((w,i)=>{const cx=fcx(i)+(o.dx?.[i]||0),top=FTOP,h=FH[i]+(o.dy?.[i]||0),r=o.rot?.[i]||0;
    if(o.missing===i)return;
    const ce=o.cer?.includes(i);
    let g=path(toothFront(cx,top,w,h,i===0||i===5),ce?C.cer:(o.fill||C.tooth),ce?C.cerS:C.toothS,1.4);
    if(o.decay?.includes(i))g+=ell(cx+2,top+h-13,4.5,6,C.decay);
    if(o.stains)g+=ell(cx-2,top+14,3,2.2,C.stain,.75)+ell(cx+3,top+20,2.2,1.6,C.stain,.75);
    if(o.brackets){const by=top+h*.58,a=r*Math.PI/180,L=by-top;
      g+=`<rect x="${cx-3.5}" y="${by-3.5}" width="7" height="7" rx="1.5" fill="${C.metal}" stroke="${C.metalS}" stroke-width="1"/>`;
      wire.push(`${(cx-L*Math.sin(a)).toFixed(1)},${(top+L*Math.cos(a)).toFixed(1)}`)}
    teeth+=`<g transform="rotate(${r} ${cx} ${top})">${g}</g>`});
  let s=low+teeth;
  if(wire.length)s+=`<polyline points="${wire.join(' ')}" fill="none" stroke="${C.metalS}" stroke-width="1.4"/>`;
  if(o.tray)s+=path('M5,46H135V96Q135,106 125,106H15Q5,106 5,96Z',C.tray,C.trayS,1.4,' fill-opacity=".55"');
  return s+path('M0,0H140V48C120,54 100,42 70,48C40,54 20,42 0,48Z',C.gum,C.gumS,1.2)+(o.extra||'')}

/* ---- 無牙的牙床剖面（全口假牙、Over Denture） ---- */
const ridge=()=>path('M0,170V112C22,108 40,84 70,82C100,84 118,108 140,112V170Z',C.gum,C.gumS,1.2)+path('M0,170V122C22,118 40,96 70,94C100,96 118,118 140,122V170Z',C.bone,C.boneS,1.2);
const denture=(dy=0,cap)=>`<g transform="translate(0,${dy})">${path(`M8,111C26,100 40,66 70,62C100,66 114,100 132,111C118,108 100,84 70,82C40,84 22,108 8,111Z`,C.denture,C.dentureS,1.4)}`+
  `<g transform="translate(0,-16)">${solid([[crownM(70),C.tooth]])}</g>${cap?path('M64,82V76H76V82',C.tray,C.trayS,1.2):''}</g>`;
const locator=x=>path(`M${x-6},88V83Q${x-6},80 ${x-3},80H${x+3}Q${x+6},80 ${x+6},83V88Z`,C.metal,C.metalS,1.2);
const down=(x,y1,y2)=>path(`M${x},${y1}V${y2}M${x-5},${y2-6}L${x},${y2}L${x+5},${y2-6}`,'none',C.arrow,2,DASH);

/* ---- 組成一張圖 ---- */
function fig(label,panels,zoom=1.2){ // zoom：剖面圖放大，牙齒填滿圖框（正面圖、牙床圖傳 1）
  const Z=zoom===1?(b=>b):(b=>`<g transform="translate(70,88) scale(${zoom}) translate(-70,-88)">${b}</g>`);const id='tf'+(++uid),n=panels.length,TW=n*W+(n-1)*G,gp=`url(#${id}g)`;
  let s=`<defs><clipPath id="${id}c"><rect width="${W}" height="${H}" rx="14"/></clipPath>`+
    `<pattern id="${id}g" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${C.graft}"/><circle cx="1.8" cy="1.8" r="1.2" fill="${C.graftD}"/><circle cx="4.6" cy="4.6" r="0.9" fill="${C.graftD}"/></pattern>`+
    `</defs>`;
  panels.forEach(([draw,,flip],i)=>{const x0=i*(W+G),body=draw(gp);
    s+=`<g transform="translate(${x0},0)"><rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>`+
      `<g clip-path="url(#${id}c)">${Z(flip?`<g transform="translate(0,${H}) scale(1,-1)">${body}</g>`:body)}</g></g>`;
    if(i<n-1){const ax=x0+W+G/2;s+=`<path d="M${ax-5},${H/2-9}L${ax+5},${H/2}L${ax-5},${H/2+9}" fill="none" stroke="${C.arrow}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`}});
  // 說明文字放在圖下方（一般文字，手機上也不會縮得太小），欄寬對齊每一格
  const caps=panels.map(p=>`<span>${p[1].replace(/\n/g,'<br>')}</span>`).join('');
  return `<figure class="ti-fig" style="max-width:${n*210}px"><svg viewBox="-4 -4 ${TW+8} ${H+10}" role="img" aria-label="${label}">${s}</svg>`+
    `<figcaption style="grid-template-columns:repeat(${n},1fr);column-gap:${(G/(TW+8)*100).toFixed(2)}%;padding:0 ${(4/(TW+8)*100).toFixed(2)}%">${caps}</figcaption></figure>`}

/* ---- 共用的局部形狀 ---- */
const cavSmall=x=>`M${x-6},28Q${x},32 ${x+6},28L${x+4},40Q${x},43 ${x-4},40Z`;
const cavDeep=x=>`M${x+1},29.4Q${x+4},30 ${x+7},27Q${x+13},21 ${x+18},26.8L${x+16},42Q${x+9},47 ${x+3},41Z`;
const mtaCap=x=>`M${x+3},41Q${x+9},47 ${x+16},42L${x+15},46Q${x+9},51 ${x+4},45Z`;
const onlay=x=>`M${x-6},28.6Q${x},31.6 ${x+7},27Q${x+13},21 ${x+19},28C${x+24},31 ${x+25.6},38 ${x+25},44L${x+4},42Z`; // 底部停在神經上方，不碰到牙髓
const fiberPost=x=>path(`M${x-2.6},40L${x+2.6},40L${x+2},114L${x-2},114Z`,C.post,C.postS,1.1);
const crownFig=(label,cap)=>fig(label,[
  [()=>base()+tooth(70,{pulp:'live'})+ell(82,36,10,9,C.decay),'缺損、大範圍蛀牙'],
  [()=>base()+tooth(70,{crown:'prep',pulp:'live'}),'修磨牙齒'],
  [()=>base()+tooth(70,{crown:cap,pulp:'live'}),'套上牙冠']]);
const orthoBad={rot:[10,-14,8,-6,16,-9],dy:[3,7,0,4,8,1],dx:[3,2,0,-1,-3,-2]};
const sinusBone=()=>path('M0,90Q35,87 70,90T140,90V114Q70,108 0,114Z',C.bone,C.boneS,1.2);
const sinusAir=()=>path('M0,114Q70,108 140,114V170H0Z',C.sinus);
const sinusDome='M42,112Q70,154 98,112Z';
const rctFig=(label,caps,first)=>fig(label,[
  [()=>base()+tooth(70,{pulp:first})+(first==='live'?ell(79,34,8,7,C.decay):'')+ell(58,152,8,7,C.lesion,.5)+ell(82,152,8,7,C.lesion,.5),caps[0]],
  [()=>base()+tooth(70,{pulp:'empty'})+ell(58,152,7,6,C.lesion,.3)+ell(82,152,7,6,C.lesion,.3),caps[1]],
  [()=>base()+tooth(70,{crown:'cap',pulp:'gp'}),caps[2]]]);
// 牙齦蓋在牙齒前面（看得出牙根有沒有露出來），牙齦手術的圖用
const gumOver=(g,b)=>path(`M0,${g+3}Q35,${g-2} 70,${g+3}T140,${g+3}V${b+2}H0Z`,C.gum,C.gumS,1.2);
const recession=(label,cap2)=>fig(label,[
  [()=>bone(108)+tooth(70,{t:'s'})+gumOver(100,108),'牙齦萎縮、\n牙根外露'],
  [()=>bone(108)+tooth(70,{t:'s'})+gumOver(100,108)+path('M52,78Q70,74 88,78L90,102Q70,98 50,102Z',C.flap,C.gumS,1.2,' fill-opacity=".9"')+path('M56,84v12M84,84v12','none',C.text,1),cap2],
  [()=>bone(108)+tooth(70,{t:'s'})+gumOver(74,108),'牙齦增厚、\n蓋住牙根']]);

const F={
'mta-vpt':()=>fig('MTA 活髓保存步驟',[
  [()=>base()+tooth(70,{pulp:'live'})+ell(79,34,8,7,C.decay),'蛀牙很深、\n接近神經'],
  [()=>base()+tooth(70,{pulp:'live'})+path(cavDeep(70),C.hole,C.toothS,1,DASH)+path(mtaCap(70),C.mta,C.mtaS,1.2),'清除蛀牙，\n以 MTA 蓋住神經'],
  [()=>base()+tooth(70,{pulp:'live'})+path(mtaCap(70),C.mta,C.mtaS,1.2)+path(cavDeep(70),C.cer,C.cerS,1.4),'填補恢復牙齒，\n保留神經']]),
'bpr':()=>fig('齒雕步驟',[
  [()=>base()+tooth(70,{pulp:'live'})+ell(83,34,8.5,7,C.decay),'大範圍蛀牙'],
  [()=>base()+tooth(70,{pulp:'live'})+path(onlay(70),C.bg,C.toothS,1,DASH),'只修整缺損部分'],
  [()=>base()+tooth(70,{pulp:'live'})+path(onlay(70),C.cer,C.cerS,1.4),'黏上訂製的\n陶瓷修復體']]),
'veneer':()=>fig('美學貼片步驟（門牙側面）',[
  [()=>base()+solid([[rootI(70),C.root],[crownI(70),C.tooth]])+path(pulpI(70),C.pulp),'原本的門牙\n（側面）'],
  [()=>base()+solid([[rootI(70),C.root],[prepI(70),C.tooth]])+path(pulpI(70),C.pulp)+path(crownI(70),'none',C.toothS,1,DASH),'表面微量修磨\n（虛線為原本外形）'],
  [()=>base()+solid([[rootI(70),C.root],[prepI(70),C.tooth]])+path(pulpI(70),C.pulp)+path(veneerI(70),C.cer,C.cerS,1.2),'黏上薄陶瓷貼片']]),
'post':()=>fig('玻璃纖維釘步驟',[
  [()=>base()+tooth(70,{t:'s',crown:'prep',pulp:'gp'}),'根管治療後，\n牙齒缺損'],
  [()=>base()+tooth(70,{t:'s',crown:'prep',pulp:'gp'})+fiberPost(70),'牙根內放入\n玻璃纖維釘'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp'})+fiberPost(70),'堆出核心、\n套上牙冠']]),
'crown-emax':()=>crownFig('全瓷冠步驟','zr'), // 與全鋯冠同一張圖
'crown-cercon':()=>crownFig('全鋯冠步驟','zr'),
'maryland':()=>fig('馬里蘭牙橋',[
  [()=>front({missing:2}),'缺一顆門牙'],
  [()=>front({cer:[2],extra:path('M37,62H82V72H37Z','none',C.cerS,1.4,DASH)}),'假牙的翼片黏在\n鄰牙內側（虛線）']],1),
'cd':()=>fig('全口活動假牙（牙床剖面）',[
  [()=>ridge(),'全口缺牙的牙床'],
  [()=>ridge()+denture(0,0),'戴上全口假牙，\n靠密合吸附']],1),
'apr':()=>fig('齒槽骨保存術步驟',[
  [()=>base()+path(rootS(70,150),C.hole,C.toothS,1,DASH)+nb(),'拔牙後的牙窩'],
  [(g)=>base()+graft(rootS(70,150),g)+membrane('M48,86Q70,80 92,86')+nb(),'填入骨粉、\n蓋上再生膜'],
  [()=>base()+path('M62,92H78L77,142Q70,150 63,142Z','none',C.metalS,1,DASH)+nb(),'骨頭保留，\n日後好植牙']]),
'gbr':()=>fig('引導骨再生（補骨）步驟',[
  [()=>gum()+path('M0,90Q35,87 62,90L78,92L79,132Q105,124 140,122V170H0Z',C.bone,C.boneS,1.2)+implant(70),'骨頭寬度不足，\n植體外露'],
  [(g)=>gum()+path('M0,90Q35,87 62,90L78,92L79,132Q105,124 140,122V170H0Z',C.bone,C.boneS,1.2)+graft('M78,92Q98,93 104,106Q108,120 100,127L79,132Z',g)+implant(70)+membrane('M76,90Q100,90 106,106Q110,121 100,129'),'補骨粉、\n蓋上再生膜'],
  [()=>base()+implant(70),'骨頭長回來\n包住植體']]),
'sinus-lift':()=>fig('上顎竇增高術步驟',[
  [()=>gum()+sinusBone()+sinusAir()+path('M0,114Q70,108 140,114','none',C.mem,1.6)+nb(112),'上顎骨頭太薄，\n上方是鼻竇',1],
  [(g)=>gum()+sinusBone()+sinusAir()+graft(sinusDome,g)+path('M0,114Q20,111 42,112Q70,154 98,112Q120,111 140,114','none',C.mem,1.6)+nb(112),'抬高竇膜、\n填入骨粉',1],
  [(g)=>gum()+sinusBone()+sinusAir()+graft(sinusDome,g)+path('M0,114Q20,111 42,112Q70,154 98,112Q120,111 140,114','none',C.mem,1.6)+implant(70,92,140)+nb(112),'骨頭足夠，\n植入植體',1]]),
'implant-guide':()=>fig('植牙手術導板',[
  [()=>base()+nb()+path('M62,92H78L77,142Q70,150 63,142Z','none',C.metalS,1.2,DASH),'電腦規劃植體\n位置與角度'],
  [()=>base()+nb()+path('M0,30H58V60H82V30H140V48H96V74H44V48H0Z',C.tray,C.trayS,1.4,' fill-opacity=".8"')+down(70,62,96),'戴上導板，\n依規劃植入']]),
'implant':()=>fig('人工植牙步驟',[
  [()=>base()+nb(),'缺牙'],
  [()=>base()+implant(70)+nb(),'植入植體，\n與骨頭結合'],
  [()=>base()+implant(70)+abut(70)+path(crownM(70),C.zr,C.zrS,1.6)+nb(),'裝上牙冠']]),
'implant-crown':()=>fig('植牙全鋯冠',[
  [()=>base()+implant(70)+abut(70)+nb(),'植體與骨頭結合，\n裝上支台'],
  [()=>base()+implant(70)+abut(70)+path(crownM(70),C.zr,C.zrS,1.6)+nb(),'鎖上全鋯冠']]),
'overdenture':()=>fig('植牙固位式活動假牙（牙床剖面）',[
  [()=>ridge()+implant(70,88,150)+locator(70)+denture(-18,1)+down(70,66,80),'植體裝上\nLocator 連接頭'],
  [()=>ridge()+implant(70,88,150)+locator(70)+denture(0,1),'假牙內的扣環\n扣住連接頭']],1),
'all-on-x':()=>{const jaw=()=>path('M8,84Q70,76 132,84V104Q70,98 8,104Z',C.gum,C.gumS,1.2)+path('M8,96Q70,88 132,96V150Q70,160 8,150Z',C.bone,C.boneS,1.2);
  const imps=()=>`<g transform="rotate(-28 26 92)">${implant(26,92,136)}</g>`+implant(54,90,138)+implant(86,90,138)+`<g transform="rotate(28 114 92)">${implant(114,92,136)}</g>`;
  let t='';for(let i=0;i<9;i++){const x=16+i*12.4,y=40+Math.abs(i-4)*1.6;t+=path(`M${x},${y+30}V${y+5}Q${x},${y} ${x+5},${y}H${x+6.4}Q${x+11.4},${y} ${x+11.4},${y+5}V${y+30}Z`,C.tooth,C.toothS,1.1)}
  return fig('All-on-X 全口重建（全口側面展開）',[
    [()=>jaw()+imps(),'一顎植入\n4～8 支植體'],
    [()=>jaw()+imps()+t+path('M10,66Q70,58 130,66V86Q70,80 10,86Z',C.denture,C.dentureS,1.4),'固定整排假牙']],1)},
'micro-rct':()=>rctFig('顯微根管治療步驟',['神經發炎、\n根尖感染','顯微鏡下清潔、\n消毒根管','填充根管、\n做牙冠保護'],'live'),
'micro-retreat':()=>rctFig('顯微根管再治療步驟',['舊的根管治療\n再次發炎','取出舊填充物、\n重新清潔','重新填充密封、\n做新牙冠'],'gp'),
'apicoectomy':()=>fig('顯微根尖手術步驟',[
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp'})+ell(70,152,11,9,C.lesion,.55),'根管治療後，\n根尖仍發炎'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp',cut:1,ap:140})+path('M66.5,135H73.5V140H66.5Z',C.mta,C.mtaS,1)+ell(70,150,11,9,C.lesion,.18),'切除根尖、\n逆封填'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp',cut:1,ap:140})+path('M66.5,135H73.5V140H66.5Z',C.mta,C.mtaS,1),'骨頭癒合']]),
'micro-filling':()=>fig('顯微齲齒填補步驟',[
  [()=>base()+tooth(70,{pulp:'live'})+ell(70,34,5,6,C.decay),'蛀牙'],
  [()=>base()+tooth(70,{pulp:'live'})+path(cavSmall(70),C.hole,C.toothS,1,DASH),'顯微鏡下\n只清除蛀牙'],
  [()=>base()+tooth(70,{pulp:'live'})+path(cavSmall(70),C.cer,C.cerS,1.4),'美學樹脂填補']]),
'clp':()=>fig('牙冠增長術步驟',[
  [()=>bone(70)+tooth(70,{t:'s',crown:'prep',pulp:'live'})+gumOver(52,70),'牙齦、骨頭太高，\n牙冠露出太少'],
  [()=>bone(90)+tooth(70,{t:'s',crown:'prep',pulp:'live'})+gumOver(74,90)+path('M0,55Q35,50 70,55T140,55','none',C.gumS,1.2,DASH),'修整牙齦與骨頭\n（虛線為原本位置）'],
  [()=>bone(90)+tooth(70,{t:'s',crown:'cap',pulp:'live'})+gumOver(74,90),'露出足夠牙冠，\n做上假牙']]),
'fgg':()=>recession('角化牙齦移植步驟','從上顎取牙齦，\n移植到萎縮處'),
'ctg':()=>recession('結締組織移植步驟','在牙齦下放入\n結締組織'),
'gtr':()=>fig('引導組織再生術步驟',[
  [()=>base()+path('M88,90L112,90Q100,108 85,128Z','#f6d3d0',C.gumS,1)+tooth(70,{t:'s'}),'牙周病造成\n骨頭缺損'],
  [(g)=>base()+graft('M88,90L112,90Q100,108 85,128Z',g)+membrane('M86,88Q104,84 114,90')+tooth(70,{t:'s'}),'放入骨粉、\n蓋上再生膜'],
  [()=>base()+tooth(70,{t:'s'}),'骨頭再生，\n牙齒更穩固']]),
'lh':()=>fig('固定式矯正（正面）',[
  [()=>front({...orthoBad}),'牙齒不整齊'],
  [()=>front({...orthoBad,brackets:1}),'黏上矯正器，\n慢慢移動牙齒'],
  [()=>front(),'排列整齊，\n之後配戴維持器']],1),
'invisalign':()=>fig('隱形矯正（正面）',[
  [()=>front({...orthoBad}),'牙齒不整齊'],
  [()=>front({...orthoBad,tray:1}),'配戴透明牙套，\n定期換新的一副'],
  [()=>front(),'排列整齊']],1),
'ssc':()=>fig('金屬乳牙套步驟',[
  [()=>base()+tooth(70,{pulp:'live'})+ell(80,38,11,10,C.decay),'乳牙大範圍蛀牙'],
  [()=>base()+tooth(70,{crown:'metal',pulp:'live'}),'套上金屬牙套，\n保護到換牙']]),
'strip-crown':()=>fig('樹脂乳牙套（正面）',[
  [()=>front({decay:[2,3]}),'乳門牙大範圍蛀牙'],
  [()=>front({cer:[2,3]}),'樹脂重建外型']],1),
'space-maintainer':()=>{const bud=`<g transform="translate(71,124) scale(.6) translate(-71,-48)">${solid([[crownS(71),C.tooth]])}</g>`+path('M52,121A19,22 0 1 0 90,121A19,22 0 1 0 52,121Z','none',C.toothS,1,DASH);
  const sides=()=>tooth(16,{ap:140})+tooth(126,{t:'s',ap:140});
  return fig('空間維持器步驟',[
    [()=>base()+bud+sides(),'乳牙提早掉了，\n恆牙還沒長出'],
    [()=>base()+bud+sides()+'<rect x="-6" y="52" width="44" height="13" rx="2" fill="'+C.metal+'" stroke="'+C.metalS+'" stroke-width="1"/>'+path('M38,56H100M38,62H100M100,56Q104,59 100,62','none',C.metalS,1.8),'空間維持器\n保留位置'],
    [()=>base()+sides()+tooth(71,{t:'s',ap:140}),'恆牙順利長出']])},
'home-whitening':()=>fig('居家美白（正面）',[
  [()=>front({fill:C.yellow}),'牙齒顏色偏黃'],
  [()=>front({fill:C.yellow,tray:1}),'牙托裝入美白凝膠\n在家配戴'],
  [()=>front(),'牙齒變亮']],1),
'airflow':()=>fig('噴砂美白（正面）',[
  [()=>front({stains:1}),'表面茶垢、\n咖啡漬、菸垢'],
  [()=>front({stains:1,extra:path('M136,156L114,120L121,116L142,152Z',C.metal,C.metalS,1.2)+path('M110,114L98,100M114,112L106,96M106,118L92,108','none',C.mem,1.6,DASH)}),'細粉與水氣\n噴洗表面'],
  [()=>front(),'恢復原本光澤']],1),
};
F['veneer-emax']=F.veneer; // E.max 美學貼片與 GC 美學貼片同一張圖
F['crown-gc']=F['crown-cercon']; // GC 全瓷冠與其他牙冠同一張圖
F['implant-hiossen']=F['implant-blc']=F['implant-blx']=F.implant; // 三種植體共用人工植牙示意圖
F['all-on-x-temp']=F['all-on-x-zr']=F['all-on-x-frame']=F['all-on-x']; // All-on-X 的三種假牙共用全口重建示意圖
return F;
})();
