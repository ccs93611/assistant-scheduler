# 新海美學牙醫診所・助理排班系統

單一 HTML 檔的排班系統（`index.html`），不用建置，也不需要安裝套件。原本是 Claude Artifact，放在這裡方便繼續開發。

## 目前能做什麼

| 分頁 | 功能 |
|---|---|
| 排班表 | 以月為單位、按週顯示早／午／晚三班 × 5 個崗位。可拖曳或點選排班，也可以放「缺口」 |
| 醫師休假 | 登記醫師休假（依日期與班別），自動排班時會避開 |
| 助理請假 | 登記各類假別；另有「家庭照顧假」（以小時計，未滿 1 小時以 1 小時計，不影響排班） |
| 休假日 | 全天休診的日期，班表不排班 |
| 工時統計 | 助理的班數、全天班、早+晚、各崗位班數、工時、合理工時、超時；可自訂統計區間 |
| 人員名單 | 管理人員／醫師／助理，可停用、記錄個資、設定權限 |
| 排班規則 | 預設醫師班表、不參與自動排班的助理、每崗位人數、上限設定、看診時段 |

上方工具列：切換月份、**帶入醫師班表**、**自動排班**（可復原）、**匯出 Excel**（包含班表、工時統計、醫師休假、助理請假、家庭照顧假五個工作表）。

## 程式結構（都在 `index.html` 的 `<script>` 內）

```
CSS（:root 色彩變數，支援深色模式）
HTML（7 個 <section id="tab-*">）
<script>
  常數     SHIFTS（三班，每班 3.5h）、POS（主櫃/副櫃/跟診/流動/健保）、DEFAULT_CFG
  狀態     staff, cfg, weeks, leaves, familyCare, privateInfo, accessLinks
  日期     monthInfo(), mondayOf(), ymd()
  存取     store.*（先更新記憶體 → renderAll() → 寫入 DB 或 localStorage）
  啟動     boot()：有 FIREBASE_CONFIG 就走 Google 登入 + Firestore，否則改用 localStorage
  薪資     payCfg(), calcPay(), renderPay(), openAdj()
  畫面     renderAll() → renderWeeks / renderLeave / renderStats / renderSettings / renderRules / renderHolidays
  排班     autoSchedule(fillOnly), undoAuto()
  匯出     exportBtn → SheetJS (xlsx 0.18.5, CDN)
</script>
```

### 資料模型

- **staff**：`{id, role: 'manager'|'doctor'|'assistant', code, name, active}`
- **weeks[週一日期 'YYYY-MM-DD']**：
  - `"{dow}_{shift}"`（例如 `"0_day"` = 週一早班）→ 長度 5 的陣列，對應 POS 的 5 個崗位，每格是人員 id 陣列（`'_gap'` 表示缺口）
  - `"L{dow}_{shift}"` → `[[助理id, 醫師id], ...]` 跟診配對
- **leaves**：`{id, staffId, date, shifts: ['day','eve','night'], type, note}`
- **familyCare**：`{id, staffId, date, shift, start, end, hours, note}`
- **cfg**：`need[5]`（每崗位人數）、`maxPerDay`、`otMax`、`maxFullDays`、`maxDN`、`nhOnly`、`closed{"dow_shift":true}`、`holidays{date:{name}}`、預設醫師班表、排除名單
- **privateInfo / accessLinks**：人員個資、帳號與權限（view / self / manage / super）

### 自動排班演算法（`autoSchedule`）

依階段填入，人手不足時缺口會留在後面的階段：

1. **主櫃**與**跟診醫師**
2. **跟診配對**：幫醫師配助理，同一醫師同一天盡量由同一位助理跟
3. **健保**（可以限定只排某些助理）
4. **流動**（依晚 → 午 → 早的順序）
5. **副櫃**（依午 → 晚 → 早的順序）

候選人的硬性條件：沒有請假、沒被排除、當天班數 < `maxPerDay`、全天班／早+晚次數沒超過上限，且工時不超過「合理工時 + 超時上限」。

排序分數（越低越優先）＝ 本月班數 + 全天班／早+晚平均分配懲罰（×10000）+ 超過合理工時懲罰（1e6 起跳）。分數相同時，用 hash 讓結果固定。

**合理工時** ＝（期間天數 − 週日數 − 休假日天數）× 8 − 請假天數 × 7

## 線上部署（GitHub Pages + Firebase）

- **網站**：GitHub Pages 直接提供 `index.html`，推上 `main` 就會更新。
- **登入**：Firebase Authentication（Google 帳號）。
- **資料**：Cloud Firestore，所有人即時同步。
- **權限**：由 [`firestore.rules`](firestore.rules) 在伺服器端檢查，前端的按鈕停用只是介面提示。

`index.html` 開頭的 `window.FIREBASE_CONFIG` 設為 `null` 時，會退回本機 localStorage 模式，方便離線開發。

### 權限

| 等級 | 可以做什麼 |
|---|---|
| 僅檢視 `view` | 看班表、請假、休假日、統計 |
| 登記本人請假 `self` | 上述 + 登記／變更自己的請假與家庭照顧假 + 看自己的薪資 |
| 排班管理 `manage` | 排班、所有人的請假、休假日、規則、所有人的薪資 |
| 超級管理員 `super` | 上述 + 個資 + 設定權限 |

- `OWNER_EMAILS`（`index.html`）與 `firestore.rules` 裡列出的 Gmail 不必綁定，一律是超級管理員；兩邊要一致。
- 其他人要由超級管理員到「人員名單 → 權限」填入 Gmail 並選擇權限，才能登入。

### Firestore 資料結構

| 路徑 | 內容 |
|---|---|
| `weeks/{週一日期}` | `c.{dow}_{shift}` 等欄位，值是 JSON 字串（因為 Firestore 不接受巢狀陣列） |
| `staff/{id}`、`leaves/{id}`、`familyCare/{id}`、`config/main` | 同上方資料模型 |
| `pay/{staffId}_{YYYY-MM}` | `{staffId, ym, base, attend, perf, skill, otMin, selfInd, selfTeam, stars, labor, health, dependents, lateMin, items}` 當月薪資項目 |
| `data/private/people/{staffId}` | 個資 |
| `access/{Gmail}` | `{staffId, perm}` 帳號綁定與權限 |

### 薪資

每人每月一筆，還沒儲存的月份顯示為「試算」：
- 本俸、勞保費、健保費、眷屬人數：帶入前一個有紀錄的月份
- 出勤津貼、績效獎金、技能津貼：用預設值
- 其他欄位：0

| 應發 | 算法 |
|---|---|
| 本俸 | 每人每月填寫 |
| 出勤津貼 / 績效獎金 / 技能津貼 | 預設 1000 / 1000 / 3500 |
| 加班薪資 | （排班總超時 × 60 ＋ 另計加班分鐘數）× 每分鐘 4 元 |
| 自費獎金 | 個人、團體各一欄 |
| 五星好評 | 則數 × 每則 30 元 |

| 扣除 | 算法 |
|---|---|
| 勞保費 | 每人每月填寫 |
| 健保費 | 本人健保費 ×（1 ＋ 眷屬人數） |
| 遲到 | 遲到分鐘數 × 每分鐘 4 元 |
| 請假扣款 | 請假時數 × 時薪（本俸 ÷ 240）× 假別扣薪比例。每班算 3.5 小時，一筆最多 8 小時；家庭照顧假依登記的時數。預設比例：事假、家庭照顧假、不可上班、其他 1，病假 0.5，其餘 0 |

加減項（`items:[{label, amount}]`）只屬於當月，不帶入下個月。

實發 = 應發 − 扣除 + 加減項。每分鐘金額、每則金額與三項津貼的預設值都存在 `config/main.pay`，可在「薪資」分頁調整。

## 本機使用

直接用瀏覽器打開 `index.html` 就可以使用。如果要開 GitHub Pages：repo 的 Settings → Pages → Branch 選 `main`，路徑選 `/ (root)`。
