// 側顱分析「🤖 AI 標點」：把側顱 X 光（只有影像，不含病人姓名、生日、病歷號）交給 Claude，回傳側顱分析（Polygon／Steiner）要用的標記點位置。
// 兩階段（提高準確度）：
//   mode "coarse"：整張片子（長邊 1568 px，網頁端已畫上座標格線）→ 16 個點的大概位置
//   mode "refine"：網頁端從原圖把每個點附近放大裁切（也畫上格線）→ 在放大圖上重新定位，再換算回原圖
// AI 標的位置只是起點，醫師一定要在畫面上確認、拖曳修正後才計算角度。
// 金鑰放在 Vercel 環境變數 ANTHROPIC_API_KEY；只有登入治療計劃單的人（Firebase 帳號或認證設備）才能呼叫。
import Anthropic from "@anthropic-ai/sdk";

export const config = { maxDuration: 120 }; // Vercel 請求上限 4.5 MB：網頁端先把影像縮小成 JPEG 再送

const FIREBASE_WEB_KEY = "AIzaSyDVLHhcdtHGhcP3MpZZooCsx12faOZGkr4"; // 治療計劃單網頁用的公開金鑰，只用來確認登入身分
const client = new Anthropic();

// 要標的點（跟 js/ceph.js 的 CEPH_PTS 一致，共 16 點）：定義寫清楚，AI 才不會標成相鄰的構造
const POINTS = {
  S: "Sella：蝶鞍（顱底中央、像馬鞍形的凹窩，蝶骨上的圓形凹陷）輪廓的幾何中心點，不是凹窩的底部",
  N: "Nasion：額骨與鼻骨交接處（額鼻縫）最前方的點，位在鼻樑最凹處附近的骨頭上（不是軟組織）",
  Po: "Porion：外耳道最上緣的點（片子上常是耳桿圓環的最上緣，或解剖外耳道圓形透亮區的最上緣）",
  Or: "Orbitale：眼眶下緣（眶底骨輪廓）的最低點",
  A: "A point（Subspinale）：前鼻棘（ANS）往下到上門牙齒槽嵴之間，上顎骨前緣弧線最凹（最後方）的點",
  B: "B point（Supramentale）：下門牙齒槽嵴往下到頦前點（Pog）之間，下顎骨前緣弧線最凹（最後方）的點",
  Pog: "Pogonion：下巴（頦部聯合骨）骨輪廓最前方的點",
  Gn: "Gnathion：頦部骨輪廓上，Pog 與 Me 之間的中點（最前下方）",
  Me: "Menton：頦部聯合骨輪廓最下方的點",
  Go: "Gonion：下顎角的點：下顎枝後緣切線與下顎下緣切線的夾角二等分線，與下顎角骨輪廓的交點",
  Ar: "Articulare：下顎枝（髁突）後緣與顱底下緣（枕骨基部）影像輪廓的交點",
  U1T: "最前方上顎正中門牙的切端（牙冠最下方的尖端）",
  U1A: "同一顆上顎正中門牙的根尖（牙根最上方的尖端，通常在 A 點後上方）",
  L1T: "最前方下顎正中門牙的切端（牙冠最上方的尖端）",
  L1A: "同一顆下顎正中門牙的根尖（牙根最下方的尖端，通常在 B 點後下方）",
  Mo: "上下第一大臼齒的咬合接觸處（近心頰尖咬合的位置），用來定咬合平面",
};

const COMMON = `你是協助齒顎矯正醫師做側顱 X 光（lateral cephalogram）描圖的專家助理，熟悉解剖標記點的標準定義。
- 影像上畫有黃色座標格線，邊緣數字是像素座標（原點在左上角，x 往右、y 往下）。請利用格線精確讀出座標。
- 先仔細辨認周圍的解剖構造（顱底、蝶鞍、眼眶、上下顎骨輪廓、門牙與臼齒），再決定點的位置；標在骨頭或牙齒的輪廓上，不是軟組織。
- 只回傳一個 JSON 物件，不要其他文字、不要 Markdown。座標用數字（可有小數）。`;

const SYS_COARSE = `${COMMON}
- 這是整張側顱片。請找出指定的每一個點。格式：{"points":{"S":[x,y],...},"facing":"left"或"right","note":"簡短備註"}
- 每個點都要給座標；看不清楚的也給最可能的位置，並在 note 說明哪些點不確定。facing 是病人臉朝向（臉在圖的左邊就是 "left"）。`;

const SYS_REFINE = `${COMMON}
- 這些是從側顱片放大裁切的局部影像，每張只找一個指定的點。裁切時那個點的大概位置在影像中央附近，但可能有偏差，請依解剖定義找出正確位置。
- 每張裁切圖的座標都是那張圖自己的像素座標。格式：{"points":{"S":[x,y],...}}；如果那個點確定不在該裁切圖內，給 null。`;

function parseJson(text) {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}
const okImg = (im) => im && typeof im.image === "string" && im.image.length < 3_000_000 && ["image/jpeg", "image/png"].includes(im.mediaType)
  && Number(im.width) > 0 && Number(im.height) > 0 && Number(im.width) <= 4000 && Number(im.height) <= 4000;
// 回傳的座標換成 0～1（相對於該張影像）；超出範圍或格式不對的不回傳
const norm = (v, W, H) => Array.isArray(v) && v.length >= 2 && isFinite(v[0]) && isFinite(v[1]) && v[0] >= 0 && v[0] <= W && v[1] >= 0 && v[1] <= H ? [v[0] / W, v[1] / H] : null;

async function ask(system, content) {
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "high" }, // 找標記點需要仔細看圖
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // 安全審查拒答時自動改用其他模型重試
    system,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw Object.assign(new Error("AI 無法分析這張影像"), { status: 422 });
  const j = parseJson(response.content.filter(b => b.type === "text").map(b => b.text).join("\n"));
  if (!j || typeof j.points !== "object" || !j.points) throw Object.assign(new Error("AI 回覆格式不正確，請再試一次或手動標點"), { status: 502 });
  return { j, response };
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
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "伺服器還沒設定 ANTHROPIC_API_KEY" });

  const body = req.body || {};
  try {
    if (body.mode === "refine") {
      // 每張裁切圖找一個點：crops=[{key,image,mediaType,width,height}]
      const crops = Array.isArray(body.crops) ? body.crops.filter(c => POINTS[c.key] && okImg(c)).slice(0, 8) : [];
      if (!crops.length) return res.status(400).json({ error: "沒有可分析的裁切影像" });
      const content = crops.flatMap((c, i) => [
        { type: "text", text: `裁切圖 ${i + 1}（寬 ${c.width}、高 ${c.height} 像素）：找「${c.key}」— ${POINTS[c.key]}` },
        { type: "image", source: { type: "base64", media_type: c.mediaType, data: c.image } },
      ]);
      content.push({ type: "text", text: `請回傳 {"points":{${crops.map(c => `"${c.key}":[x,y]`).join(",")}}}，座標是各自裁切圖內的像素座標。` });
      const { j, response } = await ask(SYS_REFINE, content);
      const points = {};
      for (const c of crops) { const v = norm(j.points[c.key], Number(c.width), Number(c.height)); if (v) points[c.key] = v; }
      return res.status(200).json({ points, model: response.model, usage: response.usage });
    }
    // coarse：整張片子
    if (!okImg(body)) return res.status(400).json({ error: "影像格式不正確或太大" });
    const W = Number(body.width), H = Number(body.height);
    const list = Object.entries(POINTS).map(([k, d]) => `- ${k}：${d}`).join("\n");
    const { j, response } = await ask(SYS_COARSE, [
      { type: "image", source: { type: "base64", media_type: body.mediaType, data: body.image } },
      { type: "text", text: `這張側顱 X 光片寬 ${W} 像素、高 ${H} 像素。請標出以下各點：\n${list}` },
    ]);
    const points = {};
    for (const k of Object.keys(POINTS)) { const v = norm(j.points[k], W, H); if (v) points[k] = v; }
    return res.status(200).json({ points, facing: j.facing === "right" ? "right" : "left", note: String(j.note || "").slice(0, 300), model: response.model, usage: response.usage });
  } catch (e) {
    if (e.status && !(e instanceof Anthropic.APIError)) return res.status(e.status).json({ error: e.message });
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "ANTHROPIC_API_KEY 金鑰無效" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "AI 使用量暫時已滿，請稍後再試" });
    if (e instanceof Anthropic.BadRequestError) return res.status(400).json({ error: "影像無法處理，請換一張或手動標點" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `AI 服務錯誤（${e.status}）` });
    return res.status(500).json({ error: "標點失敗" });
  }
}
