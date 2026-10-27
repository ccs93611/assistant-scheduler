// 從 Expo 帳號取出打卡 App（@shinyhi/xinhai-kiosk）的 Android 簽章金鑰，存成 credentials.json＋keystore.jks 給其他 App 共用。
// 用這台電腦 eas-cli 已登入的 session；不在畫面印出金鑰內容。
// 用法（在專案根目錄）：node cs-app/get-keystore.js cs-app tp-app　→ 產生各資料夾的 credentials.json＋credentials/keystore.jks（已列入 .gitignore，不能上傳）
const fs=require('fs'),path=require('path'),os=require('os');
const st=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.expo','state.json'),'utf8'));
const secret=st.auth&&st.auth.sessionSecret;if(!secret){console.error('找不到 Expo 登入資訊');process.exit(1)}
const q=`query{app{byFullName(fullName:"@shinyhi/xinhai-kiosk"){id androidAppCredentials(filter:{applicationIdentifier:"tw.xinhai.kiosk"}){androidAppBuildCredentialsList{isDefault name androidKeystore{keystore keystorePassword keyAlias keyPassword type}}}}}}`;
(async()=>{
  const r=await fetch('https://api.expo.dev/graphql',{method:'POST',headers:{'content-type':'application/json','expo-session':secret},body:JSON.stringify({query:q})});
  const j=await r.json();if(j.errors){console.error(JSON.stringify(j.errors).slice(0,400));process.exit(1)}
  const list=(j.data.app.byFullName.androidAppCredentials[0]||{}).androidAppBuildCredentialsList||[];
  const c=(list.find(x=>x.isDefault)||list[0]||{}).androidKeystore;if(!c||!c.keystore){console.error('打卡 App 沒有 Android 金鑰');process.exit(1)}
  for(const dir of process.argv.slice(2)){
    const out=path.join(dir,'credentials');fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'keystore.jks'),Buffer.from(c.keystore,'base64'));
    fs.writeFileSync(path.join(dir,'credentials.json'),JSON.stringify({android:{keystore:{keystorePath:'credentials/keystore.jks',keystorePassword:c.keystorePassword,keyAlias:c.keyAlias,keyPassword:c.keyPassword}}},null,2)+'\n');
    console.log('已寫入',dir,'（alias 長度',c.keyAlias.length,'，類型',c.type,'）');
  }
})().catch(e=>{console.error(e.message);process.exit(1)});
