// 側顱分析「🤖 AI 標點」：把側顱 X 光（只有影像，不含病人姓名、生日、病歷號）交給 Claude，回傳 側顱分析（Polygon／Steiner）要用的標記點大概位置。
// AI 標的位置只是起點，醫師一定要在畫面上確認、拖曳修正後才計算角度。
// 金鑰放在 Vercel 環境變數 ANTHROPIC_API_KEY；只有登入治療計劃單的人（Firebase 帳號或認證設備）才能呼叫。
import Anthropic from "@anthropic-ai/sdk";

export const config = { maxDuration: 120 }; // Vercel 請求上限 4.5 MB：網頁端先把影像縮到長邊 1568 px 的 JPEG 再送

const FIREBASE_WEB_KEY = "AIzaSyDVLHhcdtHGhcP3MpZZooCsx12faOZGkr4"; // 治療計劃單網頁用的公開金鑰，只用來確認登入身分
const client = new Anthropic();

// 要標的點（跟 js/ceph.js 的 CEPH_PTS 一致（共 16 點））
const POINTS = {
  S: "Sella：蝶鞍（sella turcica）輪廓的幾何中心",
  N: "Nasion：額骨與鼻骨交接（額鼻縫）最前方的點",
  Po: "Porion：外耳道（耳桿影像或解剖外耳道）的最上點",
  Or: "Orbitale：眼眶下緣的最低點",
  A: "A point（Subspinale）：前鼻棘到上顎齒槽嵴之間，上顎前緣輪廓最凹的點",
  B: "B point（Supramentale）：下顎齒槽嵴到頦前點之間，下顎前緣輪廓最凹的點",
  Pog: "Pogonion：頦部骨輪廓最前方的點",
  Gn: "Gnathion：頦部骨輪廓最前方與最下方之間的中點",
  Me: "Menton：頦部聯合骨輪廓最下方的點",
  Go: "Gonion：下顎角最外下方的點（下顎枝後緣與下顎下緣切線夾角的二等分線與下顎角輪廓的交點）",
  Ar: "Articulare：下顎枝後緣（髁突後緣）與顱底下緣影像的交點",
  U1T: "最前方上顎正中門牙的切端（切緣尖）",
  U1A: "同一顆上顎正中門牙的根尖",
  L1T: "最前方下顎正中門牙的切端（切緣尖）",
  L1A: "同一顆下顎正中門牙的根尖",
  Mo: "上下第一大臼齒的咬合接觸處（近心頰尖附近），用來定咬合平面",
};

const SYSTEM = `你是協助齒顎矯正醫師做側顱 X 光（lateral cephalogram）描圖的助理。
醫師會給你一張側顱 X 光片，請找出指定的解剖標記點，回傳它們在這張圖上的像素座標（原點在左上角，x 往右、y 往下）。
- 只回傳一個 JSON 物件，不要其他文字、不要 Markdown。格式：{"points":{"S":[x,y],...},"facing":"left"或"right","note":"簡短備註"}
- 每個點都要給座標；看不清楚的點也給最可能的位置，並在 note 說明哪些點不確定。
- facing 是病人臉朝向的方向（臉在圖的左邊就是 "left"）。
- 座標用數字（可有小數），範圍在圖片寬高之內。`;

function parseJson(text) {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
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

  const { image, mediaType, width, height } = req.body || {};
  const W = Number(width), H = Number(height);
  if (typeof image !== "string" || !image || image.length > 4_000_000) return res.status(400).json({ error: "影像格式不正確或太大" });
  if (!["image/jpeg", "image/png"].includes(mediaType)) return res.status(400).json({ error: "只接受 JPEG 或 PNG" });
  if (!(W > 0 && H > 0 && W <= 4000 && H <= 4000)) return res.status(400).json({ error: "影像尺寸不正確" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "伺服器還沒設定 ANTHROPIC_API_KEY" });

  const list = Object.entries(POINTS).map(([k, d]) => `- ${k}：${d}`).join("\n");
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "high" }, // 找標記點需要仔細看圖
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 安全審查拒答時自動改用其他模型重試
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: `這張側顱 X 光片寬 ${W} 像素、高 ${H} 像素。請標出以下各點：\n${list}` },
        ],
      }],
    });
    if (response.stop_reason === "refusal") return res.status(422).json({ error: "AI 無法分析這張影像" });
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    const j = parseJson(text);
    if (!j || typeof j.points !== "object") return res.status(502).json({ error: "AI 回覆格式不正確，請再試一次或手動標點" });
    // 換成 0～1 的相對位置（跟原圖大小無關）；缺的點或超出範圍的點不回傳，由醫師自己點
    const points = {};
    for (const k of Object.keys(POINTS)) {
      const v = j.points[k];
      if (Array.isArray(v) && v.length >= 2 && isFinite(v[0]) && isFinite(v[1])) {
        const x = v[0] / W, y = v[1] / H;
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) points[k] = [x, y];
      }
    }
    return res.status(200).json({ points, facing: j.facing === "right" ? "right" : "left", note: String(j.note || "").slice(0, 300), model: response.model, usage: response.usage });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "ANTHROPIC_API_KEY 金鑰無效" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "AI 使用量暫時已滿，請稍後再試" });
    if (e instanceof Anthropic.BadRequestError) return res.status(400).json({ error: "影像無法處理，請換一張或手動標點" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `AI 服務錯誤（${e.status}）` });
    return res.status(500).json({ error: "標點失敗" });
  }
}
