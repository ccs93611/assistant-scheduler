/* 設備認證彈窗：在目前頁面用彈窗開啟 devices.html，不另開新分頁。
   排班系統（index.html）、治療計劃單、耗材登記共用；按 ✕、Esc 或點旁邊空白處關閉。 */
'use strict';
function openDevicesModal(){
  if(document.getElementById('devModal'))return;
  if(!document.getElementById('devModalCss'))document.head.insertAdjacentHTML('beforeend',`<style id="devModalCss">
#devModal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
#devModal .dm-box{position:relative;width:min(1100px,100%);height:min(92vh,900px);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35)}
#devModal iframe{display:block;width:100%;height:100%;border:0}
#devModal .dm-x{position:absolute;top:8px;right:8px;z-index:1;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.15);background:rgba(255,255,255,.92);color:#333;font-size:17px;line-height:1;cursor:pointer;padding:0}
#devModal .dm-x:hover{background:#fff}
@media (max-width:600px){#devModal{padding:0}#devModal .dm-box{width:100%;height:100%;border-radius:0}}
</style>`);
  const bg=document.createElement('div');bg.id='devModal';
  bg.innerHTML='<div class="dm-box" role="dialog" aria-modal="true" aria-label="設備認證"><button class="dm-x" type="button" aria-label="關閉" title="關閉">✕</button><iframe src="devices.html" title="設備認證"></iframe></div>';
  const ov=document.body.style.overflow;document.body.style.overflow='hidden';
  const close=()=>{bg.remove();document.body.style.overflow=ov;document.removeEventListener('keydown',kd)};
  const kd=e=>{if(e.key==='Escape')close()};
  bg.addEventListener('mousedown',e=>{if(e.target===bg)close()});
  bg.querySelector('.dm-x').addEventListener('click',close);
  document.addEventListener('keydown',kd);
  // 游標在彈窗裡面（設備認證頁）時按 Esc 也能關閉
  bg.querySelector('iframe').addEventListener('load',e=>{try{e.target.contentWindow.addEventListener('keydown',kd)}catch(_){}});
  document.body.appendChild(bg);
}
