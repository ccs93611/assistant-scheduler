/* ====== 側顱 X 光分析（治療計劃單「LH日式矯正分析」項目旁的「📐 側顱分析」） ======
   分析項目：Polygon（Downs／Northwestern 項目，日本人常模，照 LH 的 Polygon 表）＋ Steiner 補充
   流程：上傳側顱 X 光原圖 → 🤖 AI 先標點（也可以不用，全部自己點）→ 醫師在原圖上拖曳修正 → 自動算角度、畫 Polygon 圖 → 儲存
   儲存只存縮小圖（tpFiles）與每個點的相對位置（0～1），不存原圖；只算角度
   p.ceph = {img: 縮小圖檔案編號（本機測試為 dataURL）, w, h: 標點時影像的寬高（算角度用的長寬比）, pts:{S:[x,y],…}, ai: 有沒有用 AI 標點, at, by}
   用到 treatment-plan.html 的 modal、esc、cur、touch、renderEditor、DB、fs、firebase、nowLocal、fmtDT、me、canEdit、isPhotoData */

// 要標的點：[代號, 名稱, 說明]
const CEPH_PTS=[
  ['S','S 蝶鞍點','Sella：蝶鞍輪廓的中心'],
  ['N','N 鼻根點','Nasion：額鼻縫最前點'],
  ['Po','Po 耳點','Porion：外耳道最上點（定 FH 平面）'],
  ['Or','Or 眶點','Orbitale：眼眶下緣最低點（定 FH 平面）'],
  ['A','A 點','上顎前緣最凹處（Subspinale）'],
  ['B','B 點','下顎前緣最凹處（Supramentale）'],
  ['Pog','Pog 頦前點','Pogonion：頦部最前點'],
  ['Gn','Gn 頦頂點','Gnathion：頦部最前下點'],
  ['Me','Me 頦下點','Menton：頦部最下點'],
  ['Go','Go 下顎角點','Gonion：下顎角最外下點'],
  ['Ar','Ar 關節點','Articulare：下顎枝後緣與顱底下緣的交點'],
  ['U1T','上門牙切緣','最前方上顎正中門牙的切端'],
  ['U1A','上門牙根尖','同一顆上門牙的根尖'],
  ['L1T','下門牙切緣','最前方下顎正中門牙的切端'],
  ['L1A','下門牙根尖','同一顆下門牙的根尖'],
  ['Mo','大臼齒咬合點','上下第一大臼齒咬合接觸處（定咬合平面）'],
];
// 描線（OP＝上下門牙切緣的中點，與 Mo 連成咬合平面）
const CEPH_LINES=[['S','N'],['Po','Or'],['N','Pog'],['N','A'],['N','B'],['A','Pog'],['Go','Me'],['Ar','Go'],['S','Gn'],['U1A','U1T'],['L1A','L1T'],['Mo','OP']];
// 分析項目（平均 ± 標準差；超出 ±1 SD 標 ↑↓）。poly：畫在 Polygon 圖上的組
const CEPH_GROUPS=[
  {poly:true,items:[
    {k:'Facial',label:'Facial angle',zh:'顏面角（FH－N-Pog）',mean:84.83,sd:3.05},
    {k:'Convex',label:'Convexity',zh:'顏面突度（N-A-Pog）',mean:7.58,sd:4.95},
    {k:'ABpl',label:'A-B plane',zh:'AB 平面角（AB－N-Pog）',mean:-4.81,sd:3.50},
    {k:'MP',label:'Mandibular plane',zh:'下顎平面角（FH－Go-Me）',mean:28.81,sd:5.23},
    {k:'Yax',label:'Y-axis',zh:'Y 軸角（FH－S-Gn）',mean:65.38,sd:5.63}]},
  {poly:true,items:[
    {k:'OccFH',label:'Occlusal plane',zh:'咬合平面角（FH－咬合平面）',mean:11.42,sd:3.64},
    {k:'U1L1',label:'Interincisal',zh:'上下門牙夾角',mean:124.09,sd:7.63},
    {k:'L1Occ',label:'L-1 to Occlusal',zh:'下門牙－咬合平面',mean:23.84,sd:5.28},
    {k:'IMPA',label:'L-1 to Mandibular',zh:'下門牙－下顎平面（IMPA）',mean:96.33,sd:5.78},
    {k:'FMIA',label:'FMIA',zh:'FH－下門牙',mean:54.63,sd:6.47}]},
  {poly:true,items:[
    {k:'FHSN',label:'FH to SN plane',zh:'FH－SN 平面',mean:6.19,sd:2.89}]},
  {poly:true,items:[
    {k:'SNA',label:'SNA',zh:'上顎相對顱底的前後位置',mean:82.32,sd:3.45},
    {k:'SNB',label:'SNB',zh:'下顎相對顱底的前後位置',mean:78.90,sd:3.45},
    {k:'ANB',label:'SNA-SNB diff.',zh:'ANB：上下顎前後關係',mean:3.39,sd:1.77}]},
  {poly:true,items:[
    {k:'U1FH',label:'U-1 to FH plane',zh:'上門牙－FH',mean:111.13,sd:5.54},
    {k:'U1SN',label:'U-1 to SN plane',zh:'上門牙－SN',mean:104.54,sd:5.55}]},
  {poly:true,items:[
    {k:'Gonial',label:'Gonial angle',zh:'下顎角（Ar-Go-Me）',mean:122.23,sd:4.61},
    {k:'Ramus',label:'Ramus inclination',zh:'下顎枝傾斜（FH－Ar-Go）',mean:87.07,sd:4.40}]},
  {poly:false,title:'Steiner 補充',items:[
    {k:'U1NA',label:'U1–NA',zh:'上門牙相對 NA 線',mean:22,sd:5},
    {k:'L1NB',label:'L1–NB',zh:'下門牙相對 NB 線',mean:25,sd:5},
    {k:'OccSN',label:'Occ–SN',zh:'咬合平面－SN',mean:14,sd:3},
    {k:'GoGnSN',label:'GoGn–SN',zh:'下顎平面－SN',mean:32,sd:5}]},
];
const CEPH_NORM=CEPH_GROUPS.flatMap(g=>g.items);
// 每個項目用到的線（數值分析點選項目時，在 X 光上用紅線標出）
const CEPH_HL={Facial:'Po-Or N-Pog',Convex:'N-A A-Pog',ABpl:'A-B N-Pog',MP:'Po-Or Go-Me',Yax:'Po-Or S-Gn',OccFH:'Po-Or Mo-OP',
  U1L1:'U1A-U1T L1A-L1T',L1Occ:'L1A-L1T Mo-OP',IMPA:'L1A-L1T Go-Me',FMIA:'Po-Or L1A-L1T',FHSN:'Po-Or S-N',
  SNA:'S-N N-A',SNB:'S-N N-B',ANB:'N-A N-B',U1FH:'U1A-U1T Po-Or',U1SN:'U1A-U1T S-N',Gonial:'Ar-Go Go-Me',Ramus:'Ar-Go Po-Or',
  U1NA:'U1A-U1T N-A',L1NB:'L1A-L1T N-B',OccSN:'Mo-OP S-N',GoGnSN:'Go-Gn S-N'};
// 紅線的線段（0～1 相對座標）：兩條線時延長到交點，看得出夾角；其他情況各自前後延長一點
function cephHlSegs(k,P){const ls=(CEPH_HL[k]||'').split(' ').filter(Boolean).map(x=>x.split('-').map(P));if(ls.some(([a,b])=>!a||!b))return {segs:[],x:null};
  const ext=([a,b],t)=>[[a[0]-(b[0]-a[0])*t,a[1]-(b[1]-a[1])*t],[b[0]+(b[0]-a[0])*t,b[1]+(b[1]-a[1])*t]];
  if(ls.length===2){const [[p1,p2],[p3,p4]]=ls,d=(p2[0]-p1[0])*(p4[1]-p3[1])-(p2[1]-p1[1])*(p4[0]-p3[0]);
    if(Math.abs(d)>1e-9){const t=((p3[0]-p1[0])*(p4[1]-p3[1])-(p3[1]-p1[1])*(p4[0]-p3[0]))/d,X=[p1[0]+t*(p2[0]-p1[0]),p1[1]+t*(p2[1]-p1[1])];
      if(X[0]>-0.3&&X[0]<1.3&&X[1]>-0.3&&X[1]<1.3){const far=(a,b)=>Math.hypot(a[0]-X[0],a[1]-X[1])>Math.hypot(b[0]-X[0],b[1]-X[1])?a:b; // 從離交點較遠的那端畫到交點
        return {segs:ls.map(([a,b])=>[far(a,b),X]),x:X}}}}
  return {segs:ls.map(l=>ext(l,0.15)),x:null}}

// 依點的位置算角度（c={w,h,pts}；點是 0～1 相對位置，先換回像素才算得出正確角度；臉朝左或朝右都可以，前方由 Po→Or 決定）
function cephCalc(c){
  const P=k=>{if(k==='OP'){const a=P('U1T'),b=P('L1T');return a&&b?[(a[0]+b[0])/2,(a[1]+b[1])/2]:null}
    const v=c&&c.pts&&c.pts[k];return v?[v[0]*c.w,v[1]*c.h]:null};
  const V=(a,b)=>[b[0]-a[0],b[1]-a[1]];
  const ab=(u,v)=>{const n=Math.hypot(u[0],u[1])*Math.hypot(v[0],v[1]);return n?Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/n)))*180/Math.PI:null}; // 兩向量夾角
  const la=(u,v)=>{const a=ab(u,v);return a==null?null:a>90?180-a:a}; // 兩條線的夾角（銳角）
  const has=(...ks)=>ks.every(k=>P(k));const r={};
  // 前方：有 Po、Or 用 FH 的方向；沒有就用 S→N
  const ant=has('Po','Or')?V(P('Po'),P('Or')):has('S','N')?V(P('S'),P('N')):null;
  // 點 X 在 a-b 線的前方多少（沿著前方、垂直於線的方向；正＝前方）
  const fwd=(X,a,b)=>{if(!ant)return 0;const d=V(a,b),L=Math.hypot(d[0],d[1]);if(!L)return 0;let n=[-d[1]/L,d[0]/L];if(n[0]*ant[0]+n[1]*ant[1]<0)n=[-n[0],-n[1]];const w=V(a,X);return w[0]*n[0]+w[1]*n[1]};
  const FHp=has('Po','Or')?V(P('Or'),P('Po')):null; // FH 往後的方向
  // Polygon
  if(FHp&&has('N','Pog'))r.Facial=ab(FHp,V(P('N'),P('Pog')));
  if(has('N','A','Pog')){const a=ab(V(P('A'),P('N')),V(P('A'),P('Pog')));r.Convex=(180-a)*(fwd(P('A'),P('N'),P('Pog'))>=0?1:-1)}
  if(has('A','B','N','Pog')){const a=la(V(P('A'),P('B')),V(P('N'),P('Pog')));r.ABpl=a*(fwd(P('B'),P('N'),P('Pog'))<fwd(P('A'),P('N'),P('Pog'))?-1:1)}
  if(FHp&&has('Go','Me'))r.MP=la(FHp,V(P('Go'),P('Me')));
  if(FHp&&has('S','Gn'))r.Yax=ab([-FHp[0],-FHp[1]],V(P('S'),P('Gn')));
  if(FHp&&has('Mo','OP'))r.OccFH=la(FHp,V(P('Mo'),P('OP')));
  if(has('U1A','U1T','L1A','L1T'))r.U1L1=ab(V(P('U1T'),P('U1A')),V(P('L1T'),P('L1A')));
  if(has('L1A','L1T','Mo','OP'))r.L1Occ=90-ab(V(P('L1A'),P('L1T')),V(P('Mo'),P('OP')));
  if(has('L1A','L1T','Go','Me'))r.IMPA=ab(V(P('L1A'),P('L1T')),V(P('Me'),P('Go')));
  if(r.MP!=null&&r.IMPA!=null)r.FMIA=180-r.MP-r.IMPA;
  if(FHp&&has('S','N'))r.FHSN=la(FHp,V(P('S'),P('N')));
  if(has('S','N','A'))r.SNA=ab(V(P('N'),P('S')),V(P('N'),P('A')));
  if(has('S','N','B'))r.SNB=ab(V(P('N'),P('S')),V(P('N'),P('B')));
  if(r.SNA!=null&&r.SNB!=null)r.ANB=r.SNA-r.SNB;
  if(FHp&&has('U1A','U1T'))r.U1FH=ab(V(P('U1A'),P('U1T')),FHp);
  if(has('U1A','U1T','S','N'))r.U1SN=ab(V(P('U1A'),P('U1T')),V(P('N'),P('S')));
  if(has('Ar','Go','Me'))r.Gonial=ab(V(P('Go'),P('Ar')),V(P('Go'),P('Me')));
  if(FHp&&has('Ar','Go'))r.Ramus=ab(V(P('Go'),P('Ar')),FHp);
  // Steiner 補充
  if(has('U1A','U1T','N','A'))r.U1NA=la(V(P('U1A'),P('U1T')),V(P('N'),P('A')));
  if(has('L1A','L1T','N','B'))r.L1NB=la(V(P('L1A'),P('L1T')),V(P('N'),P('B')));
  if(has('Mo','OP','S','N'))r.OccSN=la(V(P('Mo'),P('OP')),V(P('S'),P('N')));
  if(has('Go','Gn','S','N'))r.GoGnSN=la(V(P('Go'),P('Gn')),V(P('S'),P('N')));
  return r;
}
const cephFlag=(n,v)=>v==null?'':v>n.mean+n.sd?'hi':v<n.mean-n.sd?'lo':'ok';
const cephFmt=(n,v)=>v==null?(n.unit==='mm'?'需比例尺':'—'):v.toFixed(1)+(n.unit==='mm'?' mm':'°');
function cephTableHtml(c){const r=cephCalc(c);
  return `<table class="ceph-tbl"><thead><tr><th>項目</th><th class="num">測量值</th><th class="num">Mean</th><th class="num">S.D.</th><th></th></tr></thead>${CEPH_GROUPS.map(g=>`<tbody>${g.title?`<tr class="gh"><th colspan="5">${esc(g.title)}</th></tr>`:''}${g.items.map(n=>{const v=r[n.k],f=cephFlag(n,v);
    return `<tr class="${f}" data-hl="${n.k}" title="點一下在 X 光上用紅線標出"><td><b>${esc(n.label)}</b><small>${esc(n.zh)}</small></td><td class="num">${cephFmt(n,v)}</td><td class="num">${n.mean}</td><td class="num">${n.sd}</td><td class="fl">${f==='hi'?'↑':f==='lo'?'↓':''}</td></tr>`}).join('')}</tbody>`).join('')}</table>`}
// Polygon 圖：中線＝平均值；細線＝±1 SD 範圍；粗線＝測量值（橫軸單位為度，每組上下兩端回到中線）
function cephPolygonSvg(c){const r=cephCalc(c),W=300,CX=W/2,K=4.6,ROW=26,GAP=18;let y=10;const env=[],val=[],rows=[];
  for(const g of CEPH_GROUPS.filter(g=>g.poly)){const y0=y;env.push([[CX,y0]]);val.push([[CX,y0]]);y+=ROW*0.6;
    for(const n of g.items){const v=r[n.k],x=v==null?CX:Math.max(4,Math.min(W-4,CX+(v-n.mean)*K));
      env[env.length-1].unshift([CX-n.sd*K,y]);env[env.length-1].push([CX+n.sd*K,y]);val[val.length-1].push([x,y]);rows.push(y);y+=ROW}
    y+=-ROW+ROW*0.6;env[env.length-1].unshift([CX,y]);env[env.length-1].push([CX,y]);val[val.length-1].push([CX,y]);y+=GAP}
  const H=y;const pl=a=>a.map(p=>p.map(Math.round).join(',')).join(' ');
  const grid=[-30,-20,-10,10,20,30].map(d=>`<line class="gd" x1="${CX+d*K}" y1="0" x2="${CX+d*K}" y2="${H}"/>`).join('');
  return `<svg class="ceph-poly" viewBox="0 0 ${W} ${H}" aria-label="Polygon">${grid}<rect class="fr" x="0" y="0" width="${W}" height="${H}"/>
    ${env.map(e=>`<polygon class="env" points="${pl(e)}"/>`).join('')}<line class="mid" x1="${CX}" y1="0" x2="${CX}" y2="${H}"/>
    ${val.map(v=>`<polyline class="val" points="${pl(v)}"/>`).join('')}</svg>`}
// Polygon 表＋圖（左表右圖，列印與畫面共用）
function cephPolyHtml(c){return `<div class="ceph-pg">${cephTableHtml(c)}</div>`} // Polygon 圖已移除（只留表格）
// 描線圖（列印用）：SVG 疊在縮小圖上
function cephSvg(c){const W=1000,H=Math.round(1000*c.h/c.w);
  const P=k=>{if(k==='OP'){const a=P('U1T'),b=P('L1T');return a&&b?[(a[0]+b[0])/2,(a[1]+b[1])/2]:null}const v=c.pts[k];return v?[v[0]*W,v[1]*H]:null};
  const ln=CEPH_LINES.map(([a,b])=>{const p=P(a),q=P(b);return p&&q?`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`:''}).join('');
  const pt=CEPH_PTS.map(([k])=>{const p=P(k);return p?`<circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+10}" y="${p[1]-8}">${k}</text>`:''}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><g class="l">${ln}</g><g class="p">${pt}</g></svg>`}
// 列印頁（一張 A4）：img 傳入縮小圖的 dataURL
function cephPrintHtml(p,img){const c=p.ceph;
  return `<div class="tip-page tip-ceph"><h3>側顱分析（Polygon）<span class="tip-ai-no">治療計劃單 ${esc(p.no)}・${esc(p.name||'')}</span></h3>
    <div class="ceph-pr"><div class="ceph-pr-img"><img src="${img}" alt="側顱 X 光">${cephSvg(c)}</div>${cephPolyHtml(c)}</div>
    <div class="tip-disc">標記點${c.ai?'由 AI 初步標記，':''}經醫師確認（${esc(fmtDT(c.at))}）；常模為日本人 Polygon 標準值。<b>角度數值僅供診斷參考，實際治療方式請以醫師評估與說明為準。</b></div></div>`}

// 讀圖：File 或網址 → Image
const cephLoadImg=src=>new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(new Error('影像讀取失敗'));i.src=src});
// 縮圖：長邊不超過 max，輸出 JPEG
function cephShrink(img,max,q){const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');
  c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
  return {url:c.toDataURL('image/jpeg',q),w:c.width,h:c.height}}

async function openCeph(p){
  const edit=canEdit()&&p.status==='open';
  const st={img:null,fresh:false,pts:JSON.parse(JSON.stringify(p.ceph?.pts||{})),ai:!!p.ceph?.ai,sel:null,dirty:false,bright:100,contrast:100};
  st.sel=(CEPH_PTS.find(([k])=>!st.pts[k])||CEPH_PTS[0])[0];
  await modal(`<h3>📐 側顱分析（Polygon，只算角度）</h3>
    <div class="ceph">
      <div class="ceph-stage"><canvas></canvas><canvas class="ceph-loupe" width="150" height="150" hidden></canvas>
        <div class="ceph-empty">${edit?'按「📁 上傳側顱 X 光」選擇影像（JPEG／PNG）':'尚未上傳影像'}</div>
        <div class="ceph-zoom"><button data-c="zin" title="放大">＋</button><button data-c="zout" title="縮小">－</button><button data-c="fit" title="符合視窗">⤢</button></div></div>
      <div class="ceph-side">
        ${edit?`<div class="ceph-tools"><label class="btn-sm">📁 上傳側顱 X 光<input type="file" accept="image/jpeg,image/png" hidden></label><button class="btn-sm ai-btn" data-c="ai">🤖 AI 標點</button></div>`:''}
        <div class="ceph-msg hint"></div>
        <div class="ceph-tabs"><button data-tab="pts">📍 點位標注 <span class="ceph-cnt"></span></button><button data-tab="res">📊 數值分析</button></div>
        <div class="ceph-pane" data-pane="pts">
          <div class="ceph-adj"><label>亮度<input type="range" min="40" max="200" value="100" data-adj="bright"></label><label>對比<input type="range" min="40" max="300" value="100" data-adj="contrast"></label></div>
          <div class="ceph-list"></div></div>
        <div class="ceph-pane" data-pane="res"><div class="ceph-res"></div></div>
      </div>
    </div>
    <div class="acts">${edit&&p.ceph?'<button class="btn-danger" data-c="del">刪除分析</button>':''}<span class="sp"></span><button data-c="cancel">${edit?'取消':'關閉'}</button>${edit?'<button class="btn-primary" data-c="save">儲存</button>':''}</div>`,
  async (box,close)=>{
    box.classList.add('ceph-modal');
    const stage=box.querySelector('.ceph-stage'),cv=stage.querySelector('canvas'),ctx=cv.getContext('2d'),lp=box.querySelector('.ceph-loupe'),lx=lp.getContext('2d');
    const msg=t=>{box.querySelector('.ceph-msg').textContent=t};
    const view={s:1,x:0,y:0};let dpr=1;
    const IW=()=>st.img.naturalWidth,IH=()=>st.img.naturalHeight;
    const toScr=([nx,ny])=>[view.x+nx*IW()*view.s,view.y+ny*IH()*view.s];
    const toImg=(sx,sy)=>[Math.max(0,Math.min(1,(sx-view.x)/view.s/IW())),Math.max(0,Math.min(1,(sy-view.y)/view.s/IH()))];
    const P=k=>{if(k==='OP'){const a=st.pts.U1T,b=st.pts.L1T;return a&&b?[(a[0]+b[0])/2,(a[1]+b[1])/2]:null}return st.pts[k]||null};
    function fit(){if(!st.img)return;const w=stage.clientWidth,h=stage.clientHeight;view.s=Math.min(w/IW(),h/IH());view.x=(w-IW()*view.s)/2;view.y=(h-IH()*view.s)/2;draw()}
    function resize(){dpr=window.devicePixelRatio||1;cv.width=stage.clientWidth*dpr;cv.height=stage.clientHeight*dpr;draw()}
    function draw(){
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#111';ctx.fillRect(0,0,cv.width,cv.height);
      box.querySelector('.ceph-empty').hidden=!!st.img;if(!st.img)return;
      ctx.filter=`brightness(${st.bright}%) contrast(${st.contrast}%)`;ctx.drawImage(st.img,view.x,view.y,IW()*view.s,IH()*view.s);ctx.filter='none';
      ctx.lineWidth=1.5;ctx.strokeStyle='rgba(80,220,210,.9)';
      for(const [a,b] of CEPH_LINES){const p=P(a),q=P(b);if(!p||!q)continue;const [x1,y1]=toScr(p),[x2,y2]=toScr(q);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
      if(st.hl){const {segs,x}=cephHlSegs(st.hl,P); // 點選的項目：紅線
        ctx.save();ctx.strokeStyle='#ff2d2d';ctx.lineWidth=3;ctx.lineCap='round';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=3;
        for(const [a,b] of segs){const [x1,y1]=toScr(a),[x2,y2]=toScr(b);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
        ctx.restore()}
      ctx.font='bold 13px sans-serif';
      for(const [k] of CEPH_PTS){const v=st.pts[k];if(!v)continue;const [x,y]=toScr(v),on=k===st.sel;
        ctx.beginPath();ctx.arc(x,y,on?7:5,0,7);ctx.fillStyle=on?'#ffd54a':'#ff4d4f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#fff';ctx.stroke();
        ctx.fillStyle=on?'#ffd54a':'#fff';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;ctx.strokeText(k,x+9,y-8);ctx.fillText(k,x+9,y-8)}
      if(st.hl){const v=cephCalc({w:IW(),h:IH(),pts:st.pts})[st.hl],n=CEPH_NORM.find(n=>n.k===st.hl); // 點選項目的名稱與角度：放在畫面左上角，不擋到點
        if(v!=null){const t=n.label+'  '+v.toFixed(1)+'°';ctx.font='bold 16px sans-serif';const w=ctx.measureText(t).width;
          ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(8,8,w+20,30);ctx.strokeStyle='#ff2d2d';ctx.lineWidth=2;ctx.strokeRect(8,8,w+20,30);ctx.fillStyle='#ff6b6b';ctx.fillText(t,18,29)}}
    }
    function loupe(sx,sy){if(!st.img){lp.hidden=true;return}lp.hidden=false;
      lp.style.left=sx<stage.clientWidth/2?'auto':'8px';lp.style.right=sx<stage.clientWidth/2?'8px':'auto'; // 放在手指的另一邊
      const Z=3,r=75/(view.s*Z),[nx,ny]=toImg(sx,sy),cx=nx*IW(),cy=ny*IH();
      lx.fillStyle='#111';lx.fillRect(0,0,150,150);lx.filter=`brightness(${st.bright}%) contrast(${st.contrast}%)`;
      lx.drawImage(st.img,cx-r,cy-r,r*2,r*2,0,0,150,150);lx.filter='none';
      lx.strokeStyle='#ffd54a';lx.lineWidth=1;lx.beginPath();lx.moveTo(75,60);lx.lineTo(75,90);lx.moveTo(60,75);lx.lineTo(90,75);lx.stroke()}
    function renderSide(){
      const placed=CEPH_PTS.filter(([k])=>st.pts[k]).length;box.querySelector('.ceph-cnt').textContent=`${placed}/${CEPH_PTS.length}`;
      box.querySelector('.ceph-list').innerHTML=`<div class="hint">標記點 ${placed} / ${CEPH_PTS.length}${edit?'　點選清單中的點，再點圖上的位置；也可以直接拖曳圖上的點':''}</div>`+
        CEPH_PTS.map(([k,n,d])=>`<button class="cp ${k===st.sel?'on':''} ${st.pts[k]?'done':''}" data-k="${k}"><span class="dot"></span><b>${esc(n)}</b><small>${esc(d)}</small></button>`).join('');
      box.querySelector('.ceph-res').innerHTML=cephPolyHtml({w:st.img?IW():p.ceph?.w||1,h:st.img?IH():p.ceph?.h||1,pts:st.pts});
      if(st.hl)box.querySelector(`tr[data-hl="${st.hl}"]`)?.classList.add('sel');
    }
    // 右邊分成「點位標注」「數值分析」兩頁；點都標完的分析預設打開數值分析
    const setTab=t=>{box.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));box.querySelectorAll('[data-pane]').forEach(x=>x.hidden=x.dataset.pane!==t)};
    setTab(CEPH_PTS.every(([k])=>st.pts[k])?'res':'pts');
    const nextSel=()=>{const n=CEPH_PTS.find(([k])=>!st.pts[k]);if(n)st.sel=n[0]};
    const setImg=(img,fresh)=>{st.img=img;st.fresh=fresh;fit();renderSide()};
    // 已有分析：載入存檔的縮小圖
    if(p.ceph?.img){try{setImg(await cephLoadImg(await DB.getFile(p.ceph.img)),false);msg(edit?'目前顯示的是存檔的縮小圖；要在原圖上更精確標點，請重新上傳原圖（已標的點會保留）。':'')}catch(e){msg('存檔的影像讀取失敗')}}
    else msg(edit?'先上傳側顱 X 光，再按「🤖 AI 標點」讓 AI 先標，或直接自己點。':'');
    resize();fit();renderSide();
    const ro=new ResizeObserver(()=>{const keep=st.img&&view.s;resize();if(keep)fit()});ro.observe(stage);

    // 上傳原圖（標點用原圖，不存檔）
    box.querySelector('input[type=file]')?.addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
      if(!/^image\/(jpeg|png)$/.test(f.type)){alert('請選擇 JPEG 或 PNG 影像（DICOM 請先匯出成 JPEG）');return}
      const url=URL.createObjectURL(f);try{setImg(await cephLoadImg(url),true);st.dirty=true;msg(Object.keys(st.pts).length?'已換成新影像，原本的點保留在相同的相對位置，請確認或重新標點。':'按「🤖 AI 標點」讓 AI 先標，或在「📍 點位標注」選一個點，再點圖上位置。')}catch(err){alert(err.message)}});
    // 亮度、對比（只影響畫面，方便看清楚）
    box.querySelector('.ceph-adj').addEventListener('input',e=>{const k=e.target.dataset.adj;if(k){st[k]=+e.target.value;draw()}});

    // 滑鼠／觸控：點空白處＝把選取的點放到那裡；拖曳點＝移動；拖曳空白＝移動畫面；兩指＝縮放；滾輪＝縮放
    const ptrs=new Map();let drag=null,pinch=null;
    const pos=e=>{const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
    const hit=(sx,sy)=>{let best=null,bd=14;for(const [k] of CEPH_PTS){const v=st.pts[k];if(!v)continue;const [x,y]=toScr(v),d=Math.hypot(x-sx,y-sy);if(d<bd){bd=d;best=k}}return best};
    const zoomAt=(f,sx,sy)=>{const ns=Math.max(0.05,Math.min(20,view.s*f));view.x=sx-(sx-view.x)*ns/view.s;view.y=sy-(sy-view.y)*ns/view.s;view.s=ns;draw()};
    cv.addEventListener('pointerdown',e=>{if(!st.img)return;try{cv.setPointerCapture(e.pointerId)}catch(_){}const [sx,sy]=pos(e);ptrs.set(e.pointerId,[sx,sy]);
      if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:view.s,x:view.x,y:view.y,m:[(a[0]+b[0])/2,(a[1]+b[1])/2]};drag=null;lp.hidden=true;return}
      const k=edit?hit(sx,sy):null;
      // 按到已標的點：拖曳才移動那個點；沒拖曳就當成點一下（選取的點還沒標時，就把它標在這裡；上下門牙切緣靠很近時也能標）
      drag=k?{t:'pt',k,sx,sy,moved:false}:{t:'tap',sx,sy,vx:view.x,vy:view.y,moved:false}});
    cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const [sx,sy]=pos(e);ptrs.set(e.pointerId,[sx,sy]);
      if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),ns=Math.max(0.05,Math.min(20,pinch.s*d/pinch.d)),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        view.x=m[0]-(pinch.m[0]-pinch.x)*ns/pinch.s;view.y=m[1]-(pinch.m[1]-pinch.y)*ns/pinch.s;view.s=ns;draw();return}
      if(!drag)return;
      if(drag.t==='pt'){if(!drag.moved&&Math.hypot(sx-drag.sx,sy-drag.sy)<=4)return;if(!drag.moved){drag.moved=true;st.sel=drag.k;renderSide()}st.pts[drag.k]=toImg(sx,sy);st.dirty=true;draw();loupe(sx,sy);return}
      if(!drag.moved&&Math.hypot(sx-drag.sx,sy-drag.sy)>6)drag.moved=true;
      if(drag.moved){view.x=drag.vx+sx-drag.sx;view.y=drag.vy+sy-drag.sy;draw()}});
    const up=e=>{if(!ptrs.has(e.pointerId))return;const [sx,sy]=pos(e);ptrs.delete(e.pointerId);
      if(pinch){if(ptrs.size<2)pinch=null;drag=null;return}
      const place=()=>{st.pts[st.sel]=toImg(sx,sy);st.dirty=true;nextSel();renderSide()};
      if(drag&&drag.t==='tap'&&!drag.moved&&edit&&st.sel)place();
      else if(drag&&drag.t==='pt'&&!drag.moved){if(st.sel&&!st.pts[st.sel])place();else{st.sel=drag.k;renderSide()}}
      else if(drag&&drag.t==='pt')renderSide();
      drag=null;lp.hidden=true;draw()};
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    cv.addEventListener('wheel',e=>{if(!st.img)return;e.preventDefault();const [sx,sy]=pos(e);zoomAt(e.deltaY<0?1.15:1/1.15,sx,sy)},{passive:false});

    box.addEventListener('click',async e=>{
      const tb=e.target.closest('[data-tab]');if(tb){setTab(tb.dataset.tab);return}
      const hr=e.target.closest('tr[data-hl]');if(hr){st.hl=st.hl===hr.dataset.hl?null:hr.dataset.hl;renderSide();draw();return} // 點項目：紅線標出；再點一次取消
      const cp=e.target.closest('.cp');if(cp){st.sel=cp.dataset.k;renderSide();draw();return}
      const c=e.target.closest('[data-c]')?.dataset.c;if(!c)return;
      if(c==='zin'||c==='zout'){zoomAt(c==='zin'?1.3:1/1.3,stage.clientWidth/2,stage.clientHeight/2);return}
      if(c==='fit'){fit();return}
      if(c==='cancel'){if(st.dirty&&!confirm('還沒儲存，確定要關閉嗎？'))return;ro.disconnect();close();return}
      if(c==='del'){if(!confirm('確定刪除這張單的側顱分析（影像與標記點）？'))return;
        const old=p.ceph?.img;if(old&&fs&&!isPhotoData(old))fs.doc('tpFiles/'+old).delete().catch(()=>{});
        delete p.ceph;touch();ro.disconnect();close();renderEditor();return}
      if(c==='ai'){
        if(!st.img){alert('請先上傳側顱 X 光');return}
        if(!fs||!firebase.auth().currentUser){alert('本機測試模式無法使用 AI 標點，請在正式網站使用。');return}
        if(Object.keys(st.pts).length&&!confirm('AI 標點會取代目前所有的點，確定嗎？'))return;
        const b=e.target.closest('button'),old=b.textContent;b.disabled=true;b.textContent='🤖 AI 標點中…';msg('AI 標點中，約需 20～60 秒…');
        try{const s=cephShrink(st.img,1568,0.9); // 送給 AI 的影像：長邊 1568 px（不含病人資料）
          const r=await fetch('/api/ceph-landmarks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await firebase.auth().currentUser.getIdToken()},
            body:JSON.stringify({image:s.url.split(',')[1],mediaType:'image/jpeg',width:s.w,height:s.h})});
          const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));
          st.pts=j.points||{};st.ai=true;st.dirty=true;nextSel();renderSide();draw();
          const miss=CEPH_PTS.filter(([k])=>!st.pts[k]).map(([,n])=>n);
          msg('AI 已標好，請逐一檢查每個點並拖曳修正，確認後再儲存。'+(miss.length?`AI 沒標到：${miss.join('、')}，請自己點。`:'')+(j.note?`（AI 備註：${j.note}）`:''))}
        catch(err){msg('');alert('AI 標點失敗：'+err.message)}
        finally{b.disabled=false;b.textContent=old}
        return}
      if(c==='save'){
        if(!st.img){alert('請先上傳側顱 X 光');return}
        const miss=CEPH_PTS.filter(([k])=>!st.pts[k]).map(([,n])=>n);
        if(miss.length&&!confirm(`還有 ${miss.length} 個點沒標（${miss.join('、')}），相關角度不會計算。確定儲存？`))return;
        const b=e.target.closest('button');b.disabled=true;b.textContent='儲存中…';
        try{let img=p.ceph?.img;
          if(st.fresh||!img){const s=cephShrink(st.img,1000,0.75); // 存檔：縮小圖（長邊 1000 px）
            const nid=await DB.putFile(s.url,p.id);if(img&&fs&&!isPhotoData(img))fs.doc('tpFiles/'+img).delete().catch(()=>{});img=nid}
          p.ceph={img,w:IW(),h:IH(),pts:st.pts,ai:st.ai,at:nowLocal(),by:me};touch();ro.disconnect();close();renderEditor()}
        catch(err){alert('儲存失敗：'+err.message);b.disabled=false;b.textContent='儲存'}
        return}
    });
  },true); // sticky：不會因為按到外面或 Esc 就關掉，避免標到一半不見
}

document.head.insertAdjacentHTML('beforeend',`<style>
.ceph-btn{border-color:#7a5cc7;color:#5b3fae;background:#f4f0fd}
.modal.ceph-modal{width:98vw;max-width:1500px;height:94vh;max-height:94vh;display:flex;flex-direction:column;padding:12px 14px}
.ceph-modal h3{margin:0 0 8px}
.ceph{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,3fr) minmax(340px,2fr);gap:10px} /* X 光約 6 成、右邊約 4 成 */
.ceph-stage{position:relative;background:#111;border-radius:8px;overflow:hidden;min-height:0}
.ceph-stage>canvas:first-child{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}
.ceph-loupe{position:absolute;top:8px;width:150px;height:150px;border:2px solid #ffd54a;border-radius:50%;pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,.5)}
.ceph-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#bbb;padding:20px;text-align:center}
.ceph-zoom{position:absolute;right:8px;bottom:8px;display:flex;gap:4px}.ceph-zoom button{width:36px;height:36px;padding:0;font-size:18px;opacity:.85}
.ceph-side{overflow-y:auto;overflow-x:hidden;min-height:0;display:flex;flex-direction:column;gap:8px} /* 不要左右捲動 */
.ceph-tools{display:flex;gap:6px;flex-wrap:wrap}.ceph-tools label{cursor:pointer;display:inline-flex;align-items:center;border:1px solid var(--accent);border-radius:6px;background:var(--panel);color:var(--accent);font-weight:700;padding:3px 10px}.ceph-tools label:hover{background:var(--accent-soft)} /* 上傳按鈕（label）要有外框，跟其他按鈕一樣 */
.ceph-msg:empty{display:none}.ceph-msg{background:#fff8e1;border-radius:6px;padding:6px 8px;color:#6b5300}
.ceph-adj{display:flex;gap:10px;font-size:12px;color:var(--muted)}.ceph-adj label{flex:1;display:flex;align-items:center;gap:4px}.ceph-adj input{flex:1;min-width:0;width:0;padding:0;margin:0}
.ceph-tabs{display:flex;border-bottom:2px solid var(--line,#ddd);gap:2px}.ceph-tabs button{flex:1;border:1px solid var(--line,#ddd);border-bottom:0;border-radius:8px 8px 0 0;background:var(--soft,#f3f5f6);color:var(--muted);font-weight:700;padding:7px 6px;margin-bottom:-2px}
.ceph-tabs button.on{background:var(--panel,#fff);color:var(--accent);border-color:var(--accent);border-bottom:2px solid var(--panel,#fff)}.ceph-cnt{font-weight:400;font-size:12px}
.ceph-pane{display:flex;flex-direction:column;gap:8px}.ceph-pane[hidden]{display:none}
.ceph-list{display:grid;grid-template-columns:1fr 1fr;gap:3px}.ceph-list>.hint{grid-column:1/-1} /* 標記點兩欄，一次看得到比較多 */
.ceph-list .cp{display:grid;grid-template-columns:12px minmax(0,1fr);column-gap:5px;text-align:left;padding:3px 6px;min-width:0;border-radius:6px;border:1px solid var(--line);background:var(--panel);font-size:13px}
.ceph-list .cp small{grid-column:2;color:var(--muted);font-size:10.5px;line-height:1.3}.ceph-list .cp b{font-size:12.5px}
.ceph-list .cp .dot{grid-row:1/3;align-self:center;width:10px;height:10px;border-radius:50%;border:2px solid #ff4d4f}
.ceph-list .cp.done .dot{background:#ff4d4f}.ceph-list .cp.on{border-color:#e0a800;background:#fffbe6;box-shadow:inset 0 0 0 1px #e0a800}.ceph-list .cp.on .dot{border-color:#e0a800}.ceph-list .cp.on.done .dot{background:#ffd54a}
.ceph-tbl{width:100%;border-collapse:collapse;font-size:13px}.ceph-side .ceph-tbl tr[data-hl]{cursor:pointer}.ceph-side .ceph-tbl tr[data-hl]:hover td{background:#fff5f5}.ceph-side .ceph-tbl tr.sel td{background:#ffe3e3}.ceph-side .ceph-tbl tr.sel td:first-child{box-shadow:inset 4px 0 0 #ff2d2d}.ceph-side .ceph-tbl{font-size:12px}.ceph-side .ceph-tbl td.num{font-size:16px;vertical-align:middle}.ceph-side .ceph-tbl td.num:nth-child(2){font-size:18px;font-weight:700}.ceph-side .ceph-tbl thead th.num{font-size:13px}.ceph-side .ceph-tbl td.fl{font-size:18px;vertical-align:middle} /* 數字加大，填滿數字欄的空白 */.ceph-side .ceph-tbl th,.ceph-side .ceph-tbl td{padding:3px 4px}
.ceph-tbl th,.ceph-tbl td{border-bottom:1px solid var(--line,#ddd);padding:4px 6px;text-align:left;vertical-align:top}
.ceph-tbl td small{display:block;color:#777;font-size:11px;font-weight:400}
.ceph-tbl .num{text-align:right;white-space:nowrap}.ceph-tbl thead th{white-space:nowrap}.ceph-tbl td.fl,.ceph-tbl thead th:last-child{width:1.4em;padding-left:2px}.ceph-tbl .fl{white-space:nowrap;font-weight:700}
.ceph-tbl tr.hi .fl,.ceph-tbl tr.hi td.num:nth-child(2){color:#c62828}.ceph-tbl tr.lo .fl,.ceph-tbl tr.lo td.num:nth-child(2){color:#1565c0}.ceph-tbl tr.ok .fl{color:#2e7d32}
@media (max-width:900px){.ceph{grid-template-columns:1fr;grid-template-rows:minmax(0,1.4fr) minmax(0,1fr)}}
.tip-ceph .ceph-pr{display:grid;grid-template-columns:1fr;gap:10px;margin-top:8px}
.ceph-pr-img{position:relative;background:#000;border-radius:4px;overflow:hidden}.ceph-pr-img img{display:block;width:100%}
.ceph-pr-img svg{position:absolute;inset:0;width:100%;height:100%}
.ceph-pr-img .l line{stroke:#3fd4c8;stroke-width:3}.ceph-pr-img .p circle{fill:#ff4d4f;stroke:#fff;stroke-width:2}
.ceph-pr-img .p text{fill:#fff;font:bold 26px sans-serif;paint-order:stroke;stroke:#000;stroke-width:5px}
.ceph-tbl tr.gh th{background:var(--soft,#f3f5f6);font-size:12px;padding:3px 6px}
.ceph-tbl tbody+tbody tr:first-child td{border-top:2px solid var(--line,#ccc)}
.ceph-pg{display:grid;grid-template-columns:1fr;gap:8px}.ceph-pg-fig .hint{font-size:11px;margin-bottom:2px}
.ceph-poly{width:100%;height:auto;display:block;background:#fff}.ceph-side .ceph-poly{max-width:240px;margin:0 auto}
.ceph-poly .fr{fill:none;stroke:#bbb}.ceph-poly .gd{stroke:#ddd;stroke-dasharray:2 3}.ceph-poly .mid{stroke:#000;stroke-width:2}
.ceph-poly .env{fill:none;stroke:#555;stroke-width:1}.ceph-poly .val{fill:none;stroke:#000;stroke-width:2.6;stroke-linejoin:round}
.tip-ceph .ceph-tbl{font-size:11px}.tip-ceph .ceph-tbl td,.tip-ceph .ceph-tbl th{padding:2px 5px}
.tip-ceph .ceph-pg{grid-template-columns:1fr}
.tip-ceph .ceph-pr{text-align:center}.tip-ceph .ceph-pr>.ceph-pg{text-align:left}
.tip-ceph .ceph-pr-img{display:inline-block;vertical-align:top;justify-self:center}.tip-ceph .ceph-pr-img img{width:auto;height:88mm;max-width:180mm;object-fit:contain}
</style>`);
