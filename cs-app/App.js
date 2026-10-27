// 新海耗材：把 consumables.html（耗材登記）包成 Android／iOS App，放在診間平板上登記耗材。
// 登記、資料同步都在網頁裡；App 只負責：全螢幕、斷線重試，以及把「裝置編號」交給網頁（window.APP_HW），
// 讓超級管理員在設備認證頁綁定這台平板（清除資料、重裝 App 後代碼變了也不用重新核准）。
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

const CS_URL = 'https://shinyhi-dental.vercel.app/consumables.html';
const RETRY_MS = 15000;

// 裝置編號：Android 用 Android ID（重裝 App 不變，恢復原廠設定才變）；
// iOS 用 identifierForVendor（同一開發者的 App 全部刪除後重裝才會變）。與打卡 App 相同的算法
async function getHardwareId() {
  try {
    const raw = Platform.OS === 'android' ? Application.getAndroidId() : await Application.getIosIdForVendorAsync();
    if (!raw) return null;
    return (Platform.OS === 'android' ? 'and-' : 'ios-') + String(raw).replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  } catch (e) { return null; }
}

export default function App() {
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0); // 改變 key 讓 WebView 重新載入
  const timer = useRef(null);
  const web = useRef(null);
  const canBack = useRef(false);
  const [hw, setHw] = useState(undefined); // undefined＝讀取中；null＝讀不到

  useEffect(() => { getHardwareId().then(setHw); }, []);

  // Android 返回鍵：網頁能返回就返回（例如 Google 登入頁），否則留在耗材登記
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack.current && web.current) web.current.goBack();
      return true;
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

  if (hw === undefined) return <View style={s.root} />;
  const hwInfo = JSON.stringify({ id: hw, platform: Platform.OS, model: [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <WebView
        key={key}
        ref={web}
        source={{ uri: CS_URL }}
        injectedJavaScriptBeforeContentLoaded={`window.APP_HW=${hwInfo};true;`}
        style={s.root}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        originWhitelist={['https://*']}
        onNavigationStateChange={st => { canBack.current = st.canGoBack; }}
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
  root: { flex: 1, backgroundColor: '#D2DEEF' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#1D2A30', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  body: { color: '#66767D', fontSize: 18, textAlign: 'center', lineHeight: 28, marginBottom: 24 },
  btn: { backgroundColor: '#0F7C80', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
