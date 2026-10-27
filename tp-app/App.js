// 新海治療計劃單：把 treatment-plan.html 包成 iOS / Android App，放在診所的平板上用。
// 開單、編輯、資料同步都在網頁裡；App 只負責：把「裝置編號」交給網頁（window.APP_HW，設備認證可以綁定這台平板，
// 清除資料、重裝 App 也不用重新核准）、列印（App 裡的網頁不能直接 window.print，改由系統列印）、斷線重試、返回上一頁。
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Print from 'expo-print';

const TP_URL = 'https://shinyhi-dental.vercel.app/treatment-plan.html';
const RETRY_MS = 15000;

// 裝置編號：Android 用 Android ID（重裝 App 不變，恢復原廠設定才變）；
// iOS 用 identifierForVendor（同一開發者的 App 全部刪除後重裝才會變）。與「新海打卡」App 相同算法
async function getHardwareId() {
  try {
    const raw = Platform.OS === 'android' ? Application.getAndroidId() : await Application.getIosIdForVendorAsync();
    if (!raw) return null;
    return (Platform.OS === 'android' ? 'and-' : 'ios-') + String(raw).replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  } catch (e) { return null; }
}

// 列印：網頁呼叫 window.print() 時，先觸發 beforeprint（網頁會排好列印版面：牙位對齊、每頁標題、頁數），
// 再把整頁（含表單目前的值）轉成 HTML 交給 App，用系統列印；印完通知網頁 afterprint 恢復畫面
const PRINT_BRIDGE = `(function(){
  if(!window.ReactNativeWebView)return;
  window.print=function(){
    try{window.dispatchEvent(new Event('beforeprint'))}catch(e){}
    setTimeout(function(){
      var doc=document.documentElement.cloneNode(true);
      var src=document.querySelectorAll('input,textarea,select'),dst=doc.querySelectorAll('input,textarea,select');
      for(var i=0;i<src.length;i++){var a=src[i],b=dst[i];if(!b)continue;
        if(a.tagName==='TEXTAREA')b.textContent=a.value;
        else if(a.tagName==='SELECT'){for(var j=0;j<a.options.length;j++)if(a.options[j].selected&&b.options[j])b.options[j].setAttribute('selected','')}
        else if(a.type==='checkbox'||a.type==='radio'){if(a.checked)b.setAttribute('checked','')}
        else if(a.type!=='file')b.setAttribute('value',a.value)}
      doc.querySelectorAll('script').forEach(function(s){s.remove()});
      var base=document.createElement('base');base.href=location.href;doc.querySelector('head').prepend(base);
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'print',html:'<!doctype html>'+doc.outerHTML}));
    },60);
  };
})();true;`;

export default function App() {
  const web = useRef(null);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0); // 改變 key 讓 WebView 重新載入
  const timer = useRef(null);
  const canBack = useRef(false);
  const [hw, setHw] = useState(undefined); // undefined＝讀取中；null＝讀不到

  useEffect(() => { getHardwareId().then(setHw); }, []);

  // Android 返回鍵：網頁有上一頁（例如從計劃單開了治療介紹）就回上一頁，否則照系統預設
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack.current && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  const reload = useCallback(() => {
    clearTimeout(timer.current);
    setFailed(false);
    setKey(k => k + 1);
  }, []);

  const onFail = useCallback(() => {
    setFailed(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(reload, RETRY_MS); // 網路恢復後自動重試
  }, [reload]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onMessage = useCallback(async e => {
    let m; try { m = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (m.type !== 'print') return;
    try { await Print.printAsync({ html: m.html, margins: { left: 0, top: 0, right: 0, bottom: 0 } }); }
    catch (err) { /* 使用者取消列印 */ }
    web.current && web.current.injectJavaScript("try{window.dispatchEvent(new Event('afterprint'))}catch(e){};true;");
  }, []);

  if (hw === undefined) return <View style={s.root} />;
  const hwInfo = JSON.stringify({ id: hw, platform: Platform.OS, model: [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={web}
        key={key}
        source={{ uri: TP_URL }}
        injectedJavaScriptBeforeContentLoaded={`window.APP_HW=${hwInfo};true;`}
        injectedJavaScript={PRINT_BRIDGE}
        onMessage={onMessage}
        onNavigationStateChange={n => { canBack.current = n.canGoBack; }}
        style={s.root}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        originWhitelist={['https://*']}
        onError={onFail}
        onHttpError={e => { if (e.nativeEvent.statusCode >= 500) onFail(); }}
        onContentProcessDidTerminate={reload}
        onRenderProcessGone={reload}
      />
      {failed && (
        <View style={[StyleSheet.absoluteFill, s.root, s.center]}>
          <Text style={s.title}>無法連線</Text>
          <Text style={s.body}>請確認平板已連上網路，{RETRY_MS / 1000} 秒後會自動重試。</Text>
          <Pressable style={s.btn} onPress={reload}><Text style={s.btnText}>立即重試</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7F8' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#1D2A30', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  body: { color: '#5F6F76', fontSize: 18, textAlign: 'center', lineHeight: 28, marginBottom: 24 },
  btn: { backgroundColor: '#0F7C80', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
