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
  啟動     boot()：有 window.claude 就用共用 DB，否則改用 localStorage
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

## 放在 GitHub 上要注意

這個檔案原本跑在 Claude Artifact 裡，會用到 `window.claude` 提供的平台功能：

| 功能 | Artifact 內 | 一般瀏覽器 / GitHub Pages |
|---|---|---|
| 多人共用資料庫（`claude.use('db')`） | ✅ 即時同步 | ❌ 自動改成 **localStorage**，只存在該瀏覽器 |
| 使用者身分與權限（`claude.use('user')`） | ✅ | ❌ 所有人都是管理者 |
| 匯出 Excel（`claude.use('downloads')`） | ✅ | ❌ 會顯示「這個檢視不支援下載檔案」 |

之後可以考慮的方向：

- [ ] 匯出 Excel 在沒有 `downloads` 時，改用 `XLSX.writeFile()` 或 `<a download>` 下載
- [ ] 資料庫改接 Firebase／Supabase（`store.*` 與 `boot()` 的介面和 Firestore 很像，改起來比較容易）
- [ ] 加上 JSON 匯出／匯入，方便在 localStorage 模式下備份
- [ ] 把 CSS／JS 拆成獨立檔案

## 本機使用

直接用瀏覽器打開 `index.html` 就可以使用。如果要開 GitHub Pages：repo 的 Settings → Pages → Branch 選 `main`，路徑選 `/ (root)`。
