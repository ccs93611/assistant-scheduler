// 治療計劃單「🤖 AI 分析優缺點」：把同一張單的多個方案（只有治療項目，不含病人姓名、生日、病歷號）交給 Claude 比較優缺點。
// 金鑰放在 Vercel 環境變數 ANTHROPIC_API_KEY；只有登入治療計劃單的人（Firebase 帳號或認證設備）才能呼叫，避免被外人盜用。
import Anthropic from "@anthropic-ai/sdk";

export const config = { maxDuration: 60 };

const FIREBASE_WEB_KEY = "AIzaSyDVLHhcdtHGhcP3MpZZooCsx12faOZGkr4"; // 治療計劃單網頁用的公開金鑰，只用來確認登入身分
const client = new Anthropic();

const SYSTEM = `你是協助牙醫師的臨床助理。醫師會給你同一位病人的多個治療方案（每個方案有治療項目、牙位、數量、金額）。
請用繁體中文、台灣牙科常用說法，客觀比較各方案，供醫師與病人討論時參考：
- 每個方案分別列出「優點」「缺點／風險」各 2～4 點，簡短具體（例如療程時間、回診次數、耐用度、美觀、對鄰牙的影響、費用）。
- 最後用 1～3 句話說明「適合什麼樣的病人或情況」的比較，不要替醫師做最終決定，也不要寫成保證療效。
- 不知道或資料不足的地方就直接說資料不足，不要編造。
- 格式固定：每個方案用一行「【方案名稱】」開頭（方案名稱照醫師給的，例如【方案A】），下面分別寫「優點」「缺點／風險」兩個小標題，各自用「・」條列；最後一段用「【綜合比較】」開頭。
- 只用純文字與「・」條列，不要用 Markdown 標記（#、**、表格）。`;

const money = n => "$" + Math.round(n || 0).toLocaleString("en-US");
function planText(options) {
  return options.map(o => [
    `【${o.label}】總金額 ${money(o.total)}`,
    ...o.items.map((it, i) => `${i + 1}. ${it.cat}：${it.name}${it.teeth ? `（牙位 ${it.teeth}）` : ""} × ${it.qty}　${money(it.amount)}`),
  ].join("\n")).join("\n\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "只接受 POST" });
  // 確認是治療計劃單的登入使用者（Firebase ID token）
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "請先登入" });
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) return res.status(401).json({ error: "登入已失效，請重新整理頁面" });
  } catch (e) { return res.status(502).json({ error: "無法確認登入身分" }); }

  const options = Array.isArray(req.body?.options) ? req.body.options : [];
  if (options.length < 2) return res.status(400).json({ error: "至少需要兩個方案" });
  if (options.length > 6 || options.some(o => !Array.isArray(o.items) || o.items.length > 60)) return res.status(400).json({ error: "方案或項目太多" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "伺服器還沒設定 ANTHROPIC_API_KEY" });

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" }, // 比較方案不需要長時間推理，用 low 加快回應、降低費用
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 安全審查拒答時自動改用其他模型重試
      system: SYSTEM,
      messages: [{ role: "user", content: `請比較以下治療方案的優缺點：\n\n${planText(options)}` }],
    });
    if (response.stop_reason === "refusal") return res.status(422).json({ error: "AI 無法分析這組方案" });
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!text) return res.status(502).json({ error: "AI 沒有回覆內容" });
    return res.status(200).json({ text, model: response.model, usage: response.usage });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "ANTHROPIC_API_KEY 金鑰無效" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "AI 使用量暫時已滿，請稍後再試" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `AI 服務錯誤（${e.status}）` });
    return res.status(500).json({ error: "分析失敗" });
  }
}
