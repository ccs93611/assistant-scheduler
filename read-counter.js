// 雲端讀取筆數（估計）：排班系統、治療計劃單、耗材登記共用（同一個 Firebase 專案、共用每天 5 萬筆免費讀取額度）
// 攔截所有讀取（get／即時同步），依 Firestore 計費方式估算：查詢每筆文件算 1 次、沒有結果也算 1 次；即時同步只算有變動的文件；
// 本機快取讀到的不算。每 2 分鐘（以及關閉或切走頁面時）把累計數加到 tpUsage/{日期}，
// 日期以美西時間計，跟 Firebase 免費額度每天重算的時間一致。
(function(){
  const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
  let pending=0,session=0,db=null,label=()=>'',sys='';
  const add=n=>{if(n>0){pending+=n;session+=n}};
  function flush(){
    if(!pending||!db)return;const who=label();if(!who)return;
    const n=pending,inc=firebase.firestore.FieldValue.increment;pending=0;
    db.doc('tpUsage/'+day()).set({total:inc(n),sys:{[sys]:inc(n)},devs:{[sys+'｜'+who]:inc(n)},at:Date.now()},{merge:true}).catch(()=>{pending+=n});
  }
  function install(fs,getLabel,sysName){
    if(db)return;db=fs;label=getLabel;sys=sysName;
    const F=firebase.firestore;
    const wrapGet=(proto,isDoc)=>{const g=proto.get;proto.get=function(...a){return g.apply(this,a).then(s=>{if(!s.metadata||!s.metadata.fromCache)add(isDoc?1:Math.max(1,s.size));return s})}};
    const wrapSnap=(proto,isDoc)=>{const o=proto.onSnapshot;proto.onSnapshot=function(...a){let first=true;
      const wrap=fn=>function(s){try{if(!s.metadata.fromCache){if(isDoc)add(1);else{const n=s.docChanges().length;add(first?Math.max(1,n):n)}first=false}}catch(e){}return fn.apply(this,arguments)};
      const i=a.findIndex(x=>typeof x==='function');if(i>=0)a[i]=wrap(a[i]);else if(a[0]&&typeof a[0].next==='function')a[0]={...a[0],next:wrap(a[0].next)};
      return o.apply(this,a)}};
    wrapGet(F.Query.prototype,false);wrapGet(F.DocumentReference.prototype,true);wrapSnap(F.Query.prototype,false);wrapSnap(F.DocumentReference.prototype,true);
    setInterval(flush,120000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
    window.addEventListener('pagehide',flush);
  }
  window.ReadCounter={install,flush,day,get pending(){return pending},get session(){return session}};
})();
