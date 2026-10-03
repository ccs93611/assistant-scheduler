// 把最新一次完成的 Android 建置寫進 ../app-latest.json（下載頁 app.html 讀這個檔）。
// 用法（在 kiosk-app 資料夾）：node set-latest.js "這一版的更新說明"
// 之後 commit／push，網站上的下載頁就會指向最新版。
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const notes = process.argv.slice(2).join(' ').trim();
const out = execSync('npx eas-cli build:list --platform android --status finished --limit 1 --json --non-interactive', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const b = JSON.parse(out)[0];
if (!b || !b.artifacts || !b.artifacts.buildUrl) { console.error('找不到已完成的 Android 建置'); process.exit(1); }

const file = path.join(__dirname, '..', 'app-latest.json');
const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
cur.android = {
  version: b.appVersion,
  build: Number(b.appBuildVersion) || b.appBuildVersion,
  builtAt: b.completedAt,
  url: b.artifacts.buildUrl,
  notes: notes || (cur.android && cur.android.url === b.artifacts.buildUrl ? cur.android.notes : ''),
};
if (!('ios' in cur)) cur.ios = null;
fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n');
console.log(`已更新 app-latest.json：${cur.android.version}（第 ${cur.android.build} 版）${cur.android.url}`);
