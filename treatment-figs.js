/* 治療介紹的步驟示意圖（自己畫的 SVG，不用外部圖片，沒有版權問題）
   TI_FIGS[介紹 id]() 回傳 <figure> 字串；treatment-info.js 的 tiBodyHtml 放在「這是什麼」說明下方。
   每張圖由幾格步驟組成（每格 140×170，下方是說明文字，\n 換行）。
   牙齒剖面：上方牙冠、下方牙根；先畫牙齦、再畫骨頭、最後畫牙齒，牙齒蓋在最上面。
   畫風：暖色色鉛筆貼紙風（奶油色底、暖棕色線條、白邊貼紙框、鉛筆紋理與手繪抖動），牙齒可加上表情 o.face。 */
'use strict';
const TI_FIGS=(()=>{
const C={bg:'#fff8e7',frame:'#efdcb4',bone:'#f7e3b9',boneS:'#c9a16a',gum:'#f9b8bb',gumS:'#e38c95',tooth:'#fffdf4',root:'#fbeccb',toothS:'#8b6a50',
  pulp:'#f7929d',gp:'#f5a54e',decay:'#7a5233',cer:'#d3f0ea',cerS:'#3a9b8f',zr:'#f6f8f7',zrS:'#7d8f94',metal:'#c3cbd0',metalS:'#737f87',
  mem:'#6aaee0',lesion:'#d0705f',sinus:'#dcefff',text:'#5b4636',arrow:'#f2a33a',hole:'#f1ead8',graft:'#f2cf7e',graftD:'#c9a050',
  stain:'#b07c3e',yellow:'#f4dc95',denture:'#f39aa6',dentureS:'#d4707f',post:'#fbf6e8',postS:'#b3a07e',mta:'#f1efe4',mtaS:'#a39d86',tray:'#cdeefa',trayS:'#7cc0dc',flap:'#ee8b96',
  eye:'#5b4636',blush:'#f7a3ae'};
/* 牙齒表情：'happy' 笑、'sad' 難過、'ok' 微笑；y 為眼睛高度，s 為縮放 */
function face(x,y,mood='happy',s=1){const e=6*s,m=mood==='sad'?`M${x-3*s},${y+7*s}Q${x},${y+4*s} ${x+3*s},${y+7*s}`:mood==='ok'?`M${x-2.5*s},${y+5*s}Q${x},${y+6.5*s} ${x+2.5*s},${y+5*s}`:`M${x-3.2*s},${y+4.5*s}Q${x},${y+8.5*s} ${x+3.2*s},${y+4.5*s}`;
  return ell(x-12*s,y+4.5*s,3.6*s,2.2*s,C.blush,.8)+ell(x+12*s,y+4.5*s,3.6*s,2.2*s,C.blush,.8)+
    (mood==='happy'?`<path d="M${x-e-2*s},${y+.8*s}Q${x-e},${y-2.2*s} ${x-e+2*s},${y+.8*s}M${x+e-2*s},${y+.8*s}Q${x+e},${y-2.2*s} ${x+e+2*s},${y+.8*s}" fill="none" stroke="${C.eye}" stroke-width="${1.6*s}" stroke-linecap="round"/>`
      :ell(x-e,y,1.9*s,2.2*s,C.eye)+ell(x+e,y,1.9*s,2.2*s,C.eye))+
    path(m,'none',C.eye,1.5*s)+(mood==='sad'?path(`M${x+e+4*s},${y-4*s}q${-1.6*s},${3*s} 0,${4*s}q${1.6*s},${-1*s} 0,${-4*s}Z`,'#9fd4f2'):'')}
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
function tooth(x,o={}){const m=o.t!=='s',ap=o.ap||152,cr=o.crown||'n';
  const R=o.cut?rootCut(x,ap):(m?rootM(x,ap):rootS(x,ap)),N=m?crownM(x):crownS(x);
  let s=solid([[R,C.root],[cr==='n'?N:prep(x),C.tooth]]);
  if(cr!=='n'&&cr!=='prep'){const[f,st]={cap:[C.cer,C.cerS],zr:[C.zr,C.zrS],metal:[C.metal,C.metalS]}[cr];
    s+=path(N,f,st,1.6)+path(prep(x),'none',st,1,DASH)}
  if(o.pulp==='live')s+=path(m?pulpM(x,ap):pulpS(x,ap),C.pulp);
  else if(o.pulp==='empty')s+=path(m?pulpM(x,ap):pulpS(x,ap),'#fff',C.pulp,1,DASH);
  else if(o.pulp==='gp')s+=path(m?canalM(x,ap):canalS(x,ap),C.gp);
  if(o.face)s+=face(x+(o.fx||0),o.fy||40,o.face);
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
    if(o.face&&(i===2||i===3))g+=face(cx,top+28,o.face,.55);
    teeth+=`<g transform="rotate(${r} ${cx} ${top})">${g}</g>`});
  let s=low+teeth;
  if(wire.length)s+=`<polyline points="${wire.join(' ')}" fill="none" stroke="${C.metalS}" stroke-width="1.4"/>`;
  if(o.tray)s+=path('M5,46H135V96Q135,106 125,106H15Q5,106 5,96Z',C.tray,C.trayS,1.4,' fill-opacity=".55"');
  return s+path('M0,0H140V48C120,54 100,42 70,48C40,54 20,42 0,48Z',C.gum,C.gumS,1.2)+(o.extra||'')}

/* ---- 無牙的牙床剖面（全口假牙、Over Denture） ---- */
const ridge=()=>path('M0,170V112C22,108 40,84 70,82C100,84 118,108 140,112V170Z',C.gum,C.gumS,1.2)+path('M0,170V122C22,118 40,96 70,94C100,96 118,118 140,122V170Z',C.bone,C.boneS,1.2);
const denture=(dy=0,cap,mood)=>`<g transform="translate(0,${dy})">${path(`M8,111C26,100 40,66 70,62C100,66 114,100 132,111C118,108 100,84 70,82C40,84 22,108 8,111Z`,C.denture,C.dentureS,1.4)}`+
  `<g transform="translate(0,-16)">${solid([[crownM(70),C.tooth]])}${mood?face(70,40,mood):''}</g>${cap?path('M64,82V76H76V82',C.tray,C.trayS,1.2):''}</g>`;
const locator=x=>path(`M${x-6},88V83Q${x-6},80 ${x-3},80H${x+3}Q${x+6},80 ${x+6},83V88Z`,C.metal,C.metalS,1.2);
const down=(x,y1,y2)=>path(`M${x},${y1}V${y2}M${x-5},${y2-6}L${x},${y2}L${x+5},${y2-6}`,'none',C.arrow,2,DASH);

/* ---- 組成一張圖 ---- */
function fig(label,panels){const id='tf'+(++uid),n=panels.length,TW=n*W+(n-1)*G,gp=`url(#${id}g)`;
  // 色鉛筆風：p＝線條手繪抖動、h＝斜向鉛筆紋（白色細線蓋在顏色上）、sh＝貼紙陰影
  let s=`<defs><clipPath id="${id}c"><rect width="${W}" height="${H}" rx="14"/></clipPath>`+
    `<pattern id="${id}g" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${C.graft}"/><circle cx="1.8" cy="1.8" r="1.2" fill="${C.graftD}"/><circle cx="4.6" cy="4.6" r="0.9" fill="${C.graftD}"/></pattern>`+
    `<pattern id="${id}h" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="#fff" stroke-width="1"/></pattern>`+
    `<filter id="${id}p" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>`+
    `<filter id="${id}sh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#b98b4a" flood-opacity=".28"/></filter></defs>`;
  panels.forEach(([draw,,flip],i)=>{const x0=i*(W+G),body=draw(gp);
    s+=`<g transform="translate(${x0},0)"><rect width="${W}" height="${H}" rx="14" fill="${C.bg}" filter="url(#${id}sh)"/>`+
      `<g clip-path="url(#${id}c)"><g filter="url(#${id}p)">${flip?`<g transform="translate(0,${H}) scale(1,-1)">${body}</g>`:body}</g>`+
      `<rect width="${W}" height="${H}" fill="url(#${id}h)" opacity=".28"/></g>`+
      `<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="13" fill="none" stroke="#fff" stroke-width="4"/>`+
      `<rect x="-.5" y="-.5" width="${W+1}" height="${H+1}" rx="15" fill="none" stroke="${C.frame}" stroke-width="1"/></g>`;
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
  [()=>base()+tooth(70,{pulp:'live',face:'sad',fx:-8})+ell(82,36,10,9,C.decay),'缺損、大範圍蛀牙'],
  [()=>base()+tooth(70,{crown:'prep',pulp:'live'}),'修磨牙齒'],
  [()=>base()+tooth(70,{crown:cap,pulp:'live',face:'happy'}),'套上牙冠']]);
const orthoBad={rot:[10,-14,8,-6,16,-9],dy:[3,7,0,4,8,1],dx:[3,2,0,-1,-3,-2]};
const sinusBone=()=>path('M0,90Q35,87 70,90T140,90V114Q70,108 0,114Z',C.bone,C.boneS,1.2);
const sinusAir=()=>path('M0,114Q70,108 140,114V170H0Z',C.sinus);
const sinusDome='M42,112Q70,154 98,112Z';
const rctFig=(label,caps,first)=>fig(label,[
  [()=>base()+tooth(70,{pulp:first,face:'sad',fx:first==='live'?-8:0})+(first==='live'?ell(79,34,8,7,C.decay):'')+ell(58,152,8,7,C.lesion,.5)+ell(82,152,8,7,C.lesion,.5),caps[0]],
  [()=>base()+tooth(70,{pulp:'empty'})+ell(58,152,7,6,C.lesion,.3)+ell(82,152,7,6,C.lesion,.3),caps[1]],
  [()=>base()+tooth(70,{crown:'cap',pulp:'gp',face:'happy'}),caps[2]]]);
// 牙齦蓋在牙齒前面（看得出牙根有沒有露出來），牙齦手術的圖用
const gumOver=(g,b)=>path(`M0,${g+3}Q35,${g-2} 70,${g+3}T140,${g+3}V${b+2}H0Z`,C.gum,C.gumS,1.2);
const recession=(label,cap2)=>fig(label,[
  [()=>bone(108)+tooth(70,{t:'s',face:'sad'})+gumOver(100,108),'牙齦萎縮、\n牙根外露'],
  [()=>bone(108)+tooth(70,{t:'s'})+gumOver(100,108)+path('M52,78Q70,74 88,78L90,102Q70,98 50,102Z',C.flap,C.gumS,1.2,' fill-opacity=".9"')+path('M56,84v12M84,84v12','none',C.text,1),cap2],
  [()=>bone(108)+tooth(70,{t:'s',face:'happy'})+gumOver(74,108),'牙齦增厚、\n蓋住牙根']]);

const F={
'mta-vpt':()=>fig('MTA 活髓保存步驟',[
  [()=>base()+tooth(70,{pulp:'live',face:'sad',fx:-8})+ell(79,34,8,7,C.decay),'蛀牙很深、\n接近神經'],
  [()=>base()+tooth(70,{pulp:'live'})+path(cavDeep(70),C.hole,C.toothS,1,DASH)+path(mtaCap(70),C.mta,C.mtaS,1.2),'清除蛀牙，\n以 MTA 蓋住神經'],
  [()=>base()+tooth(70,{pulp:'live',face:'happy',fx:-6})+path(mtaCap(70),C.mta,C.mtaS,1.2)+path(cavDeep(70),C.cer,C.cerS,1.4),'填補恢復牙齒，\n保留神經']]),
'bpr':()=>fig('齒雕步驟',[
  [()=>base()+tooth(70,{pulp:'live',face:'sad',fx:-8})+ell(83,34,8.5,7,C.decay),'大範圍蛀牙'],
  [()=>base()+tooth(70,{pulp:'live'})+path(onlay(70),C.bg,C.toothS,1,DASH),'只修整缺損部分'],
  [()=>base()+tooth(70,{pulp:'live',face:'happy',fx:-6})+path(onlay(70),C.cer,C.cerS,1.4),'黏上訂製的\n陶瓷修復體']]),
'veneer':()=>fig('美學貼片步驟（門牙側面）',[
  [()=>base()+solid([[rootI(70),C.root],[crownI(70),C.tooth]])+path(pulpI(70),C.pulp)+face(68,44,'ok',.6),'原本的門牙\n（側面）'],
  [()=>base()+solid([[rootI(70),C.root],[prepI(70),C.tooth]])+path(pulpI(70),C.pulp)+path(crownI(70),'none',C.toothS,1,DASH),'表面微量修磨\n（虛線為原本外形）'],
  [()=>base()+solid([[rootI(70),C.root],[prepI(70),C.tooth]])+path(pulpI(70),C.pulp)+path(veneerI(70),C.cer,C.cerS,1.2)+face(68,44,'happy',.6),'黏上薄陶瓷貼片']]),
'post':()=>fig('玻璃纖維釘步驟',[
  [()=>base()+tooth(70,{t:'s',crown:'prep',pulp:'gp',face:'sad'}),'根管治療後，\n牙齒缺損'],
  [()=>base()+tooth(70,{t:'s',crown:'prep',pulp:'gp'})+fiberPost(70),'牙根內放入\n玻璃纖維釘'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp'})+fiberPost(70)+face(70,40,'happy'),'堆出核心、\n套上牙冠']]),
'crown-emax':()=>crownFig('全瓷冠步驟','zr'), // 與全鋯冠同一張圖
'crown-cercon':()=>crownFig('全鋯冠步驟','zr'),
'maryland':()=>fig('馬里蘭牙橋',[
  [()=>front({missing:2,face:'sad'}),'缺一顆門牙'],
  [()=>front({cer:[2],face:'happy',extra:path('M37,62H82V72H37Z','none',C.cerS,1.4,DASH)}),'假牙的翼片黏在\n鄰牙內側（虛線）']]),
'cd':()=>fig('全口活動假牙（牙床剖面）',[
  [()=>ridge(),'全口缺牙的牙床'],
  [()=>ridge()+denture(0,0,'happy'),'戴上全口假牙，\n靠密合吸附']]),
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
  [()=>base()+implant(70)+abut(70)+path(crownM(70),C.zr,C.zrS,1.6)+face(70,40,'happy')+nb(),'裝上牙冠']]),
'implant-crown':()=>fig('植牙全鋯冠',[
  [()=>base()+implant(70)+abut(70)+nb(),'植體與骨頭結合，\n裝上支台'],
  [()=>base()+implant(70)+abut(70)+path(crownM(70),C.zr,C.zrS,1.6)+face(70,40,'happy')+nb(),'鎖上全鋯冠']]),
'overdenture':()=>fig('植牙固位式活動假牙（牙床剖面）',[
  [()=>ridge()+implant(70,88,150)+locator(70)+denture(-18,1)+down(70,66,80),'植體裝上\nLocator 連接頭'],
  [()=>ridge()+implant(70,88,150)+locator(70)+denture(0,1,'happy'),'假牙內的扣環\n扣住連接頭']]),
'all-on-x':()=>{const jaw=()=>path('M8,84Q70,76 132,84V104Q70,98 8,104Z',C.gum,C.gumS,1.2)+path('M8,96Q70,88 132,96V150Q70,160 8,150Z',C.bone,C.boneS,1.2);
  const imps=()=>`<g transform="rotate(-28 26 92)">${implant(26,92,136)}</g>`+implant(54,90,138)+implant(86,90,138)+`<g transform="rotate(28 114 92)">${implant(114,92,136)}</g>`;
  let t='';for(let i=0;i<9;i++){const x=16+i*12.4,y=40+Math.abs(i-4)*1.6;t+=path(`M${x},${y+30}V${y+5}Q${x},${y} ${x+5},${y}H${x+6.4}Q${x+11.4},${y} ${x+11.4},${y+5}V${y+30}Z`,C.tooth,C.toothS,1.1)}
  return fig('All-on-X 全口重建（全口側面展開）',[
    [()=>jaw()+imps(),'一顎植入\n4～8 支植體'],
    [()=>jaw()+imps()+t+path('M10,66Q70,58 130,66V86Q70,80 10,86Z',C.denture,C.dentureS,1.4),'固定整排假牙']])},
'micro-rct':()=>rctFig('顯微根管治療步驟',['神經發炎、\n根尖感染','顯微鏡下清潔、\n消毒根管','填充根管、\n做牙冠保護'],'live'),
'micro-retreat':()=>rctFig('顯微根管再治療步驟',['舊的根管治療\n再次發炎','取出舊填充物、\n重新清潔','重新填充密封、\n做新牙冠'],'gp'),
'apicoectomy':()=>fig('顯微根尖手術步驟',[
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp',face:'sad'})+ell(70,152,11,9,C.lesion,.55),'根管治療後，\n根尖仍發炎'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp',cut:1,ap:140})+path('M66.5,135H73.5V140H66.5Z',C.mta,C.mtaS,1)+ell(70,150,11,9,C.lesion,.18),'切除根尖、\n逆封填'],
  [()=>base()+tooth(70,{t:'s',crown:'cap',pulp:'gp',cut:1,ap:140,face:'happy'})+path('M66.5,135H73.5V140H66.5Z',C.mta,C.mtaS,1),'骨頭癒合']]),
'micro-filling':()=>fig('顯微齲齒填補步驟',[
  [()=>base()+tooth(70,{pulp:'live',face:'sad',fy:44})+ell(70,34,5,6,C.decay),'蛀牙'],
  [()=>base()+tooth(70,{pulp:'live'})+path(cavSmall(70),C.hole,C.toothS,1,DASH),'顯微鏡下\n只清除蛀牙'],
  [()=>base()+tooth(70,{pulp:'live',face:'happy',fy:44})+path(cavSmall(70),C.cer,C.cerS,1.4),'美學樹脂填補']]),
'clp':()=>fig('牙冠增長術步驟',[
  [()=>bone(70)+tooth(70,{t:'s',crown:'prep',pulp:'live',face:'sad'})+gumOver(52,70),'牙齦、骨頭太高，\n牙冠露出太少'],
  [()=>bone(90)+tooth(70,{t:'s',crown:'prep',pulp:'live'})+gumOver(74,90)+path('M0,55Q35,50 70,55T140,55','none',C.gumS,1.2,DASH),'修整牙齦與骨頭\n（虛線為原本位置）'],
  [()=>bone(90)+tooth(70,{t:'s',crown:'cap',pulp:'live',face:'happy'})+gumOver(74,90),'露出足夠牙冠，\n做上假牙']]),
'fgg':()=>recession('角化牙齦移植步驟','從上顎取牙齦，\n移植到萎縮處'),
'ctg':()=>recession('結締組織移植步驟','在牙齦下放入\n結締組織'),
'gtr':()=>fig('引導組織再生術步驟',[
  [()=>base()+path('M88,90L112,90Q100,108 85,128Z','#f6d3d0',C.gumS,1)+tooth(70,{t:'s',face:'sad'}),'牙周病造成\n骨頭缺損'],
  [(g)=>base()+graft('M88,90L112,90Q100,108 85,128Z',g)+membrane('M86,88Q104,84 114,90')+tooth(70,{t:'s'}),'放入骨粉、\n蓋上再生膜'],
  [()=>base()+tooth(70,{t:'s',face:'happy'}),'骨頭再生，\n牙齒更穩固']]),
'lh':()=>fig('固定式矯正（正面）',[
  [()=>front({...orthoBad,face:'sad'}),'牙齒不整齊'],
  [()=>front({...orthoBad,brackets:1}),'黏上矯正器，\n慢慢移動牙齒'],
  [()=>front({face:'happy'}),'排列整齊，\n之後配戴維持器']]),
'invisalign':()=>fig('隱形矯正（正面）',[
  [()=>front({...orthoBad,face:'sad'}),'牙齒不整齊'],
  [()=>front({...orthoBad,tray:1}),'配戴透明牙套，\n定期換新的一副'],
  [()=>front({face:'happy'}),'排列整齊']]),
'ssc':()=>fig('金屬乳牙套步驟',[
  [()=>base()+tooth(70,{pulp:'live',face:'sad',fx:-8})+ell(80,38,11,10,C.decay),'乳牙大範圍蛀牙'],
  [()=>base()+tooth(70,{crown:'metal',pulp:'live',face:'happy'}),'套上金屬牙套，\n保護到換牙']]),
'strip-crown':()=>fig('樹脂乳牙套（正面）',[
  [()=>front({decay:[2,3],face:'sad'}),'乳門牙大範圍蛀牙'],
  [()=>front({cer:[2,3],face:'happy'}),'樹脂重建外型']]),
'space-maintainer':()=>{const bud=`<g transform="translate(71,124) scale(.6) translate(-71,-48)">${solid([[crownS(71),C.tooth]])}</g>`+path('M52,121A19,22 0 1 0 90,121A19,22 0 1 0 52,121Z','none',C.toothS,1,DASH);
  const sides=()=>tooth(16,{ap:140})+tooth(126,{t:'s',ap:140});
  return fig('空間維持器步驟',[
    [()=>base()+bud+sides(),'乳牙提早掉了，\n恆牙還沒長出'],
    [()=>base()+bud+sides()+'<rect x="-6" y="52" width="44" height="13" rx="2" fill="'+C.metal+'" stroke="'+C.metalS+'" stroke-width="1"/>'+path('M38,56H100M38,62H100M100,56Q104,59 100,62','none',C.metalS,1.8),'空間維持器\n保留位置'],
    [()=>base()+sides()+tooth(71,{t:'s',ap:140,face:'happy'}),'恆牙順利長出']])},
'home-whitening':()=>fig('居家美白（正面）',[
  [()=>front({fill:C.yellow,face:'sad'}),'牙齒顏色偏黃'],
  [()=>front({fill:C.yellow,tray:1}),'牙托裝入美白凝膠\n在家配戴'],
  [()=>front({face:'happy'}),'牙齒變亮']]),
'airflow':()=>fig('噴砂美白（正面）',[
  [()=>front({stains:1,face:'sad'}),'表面茶垢、\n咖啡漬、菸垢'],
  [()=>front({stains:1,extra:path('M136,156L114,120L121,116L142,152Z',C.metal,C.metalS,1.2)+path('M110,114L98,100M114,112L106,96M106,118L92,108','none',C.mem,1.6,DASH)}),'細粉與水氣\n噴洗表面'],
  [()=>front({face:'happy'}),'恢復原本光澤']]),
};
F['veneer-emax']=F.veneer; // E.max 美學貼片與 GC 美學貼片同一張圖
return F;
})();
