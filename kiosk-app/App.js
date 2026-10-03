// 新海打卡：把 kiosk.html 包成 iOS / Android App，放在診所的平板上當打卡機。
// 辨識、打卡、資料同步都在網頁（kiosk.html）裡；App 只負責：相機權限、全螢幕、螢幕不休眠、斷線重試，
// 以及把「裝置編號」交給網頁（window.KIOSK_HW），讓排班系統可以綁定這台平板。
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';
import { useCameraPermissions } from 'expo-camera';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

const KIOSK_URL = 'https://assistant-scheduler-five.vercel.app/kiosk.html';
const RETRY_MS = 15000;

// 裝置編號：Android 用 Android ID（重裝 App 不變，恢復原廠設定才變）；
// iOS 用 identifierForVendor（同一開發者的 App 全部刪除後重裝才會變）。
async function getHardwareId() {
  try {
    const raw = Platform.OS === 'android' ? Application.getAndroidId() : await Application.getIosIdForVendorAsync();
    if (!raw) return null;
    return (Platform.OS === 'android' ? 'and-' : 'ios-') + String(raw).replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  } catch (e) { return null; }
}

export default function App() {
  useKeepAwake(); // 打卡機螢幕常亮
  const [perm, requestPerm] = useCameraPermissions();
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0); // 改變 key 讓 WebView 重新載入
  const timer = useRef(null);
  const [hw, setHw] = useState(undefined); // undefined＝讀取中；null＝讀不到

  useEffect(() => { getHardwareId().then(setHw); }, []);

  useEffect(() => {
    if (perm && !perm.granted && perm.canAskAgain) requestPerm();
  }, [perm]);

  // Android 返回鍵不離開打卡畫面
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
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

  if (!perm || hw === undefined) return <View style={s.root} />;
  const hwInfo = JSON.stringify({ id: hw, platform: Platform.OS, model: [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') });
  if (!perm.granted) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar hidden />
        <Text style={s.title}>需要相機權限</Text>
        <Text style={s.body}>打卡要用前鏡頭辨識臉部。{perm.canAskAgain ? '' : '\n請到「設定 → 新海打卡 → 相機」開啟後再回來。'}</Text>
        {perm.canAskAgain && <Pressable style={s.btn} onPress={requestPerm}><Text style={s.btnText}>允許使用相機</Text></Pressable>}
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar hidden />
      <WebView
        key={key}
        source={{ uri: KIOSK_URL }}
        injectedJavaScriptBeforeContentLoaded={`window.KIOSK_HW=${hwInfo};true;`}
        style={s.root}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        allowsBackForwardNavigationGestures={false}
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
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
  root: { flex: 1, backgroundColor: '#16201B' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#F1F4F1', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  body: { color: '#A9B8AF', fontSize: 18, textAlign: 'center', lineHeight: 28, marginBottom: 24 },
  btn: { backgroundColor: '#8DB5A2', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#10160F', fontSize: 18, fontWeight: '700' },
});
