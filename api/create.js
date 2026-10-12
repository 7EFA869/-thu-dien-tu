const crypto = require("crypto");
const redis = require("./_db");
const MAX_BYTES = 900 * 1024;
const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
const num = (v, a, b, d) => (typeof v === "number" && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = req.body || {};
    if (!Array.isArray(b.pages) || b.pages.length < 1 || b.pages.length > 12)
      return res.status(400).json({ error: "Số trang không hợp lệ (1-12)." });
    const letter = {
      title: String(b.title || "Thư không tiêu đề").slice(0, 80),
      created: Date.now(),
      pages: b.pages.map((p) => ({
        text: String(p.text || "").slice(0, 3000),
        font: String(p.font || "Lora").slice(0, 40),
        color: /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : "#fffdf8",
        imgs: (Array.isArray(p.imgs) ? p.imgs : []).slice(0, 8)
          .filter((i) => typeof i.src === "string" && JPEG.test(i.src))
          .map((i) => ({ src: i.src, x: num(i.x, -10, 95, 20), y: num(i.y, -10, 95, 50), w: num(i.w, 8, 100, 40) })),
      })),
    };
    const json = JSON.stringify(letter);
    if (json.length > MAX_BYTES)
      return res.status(413).json({ error: "Thư quá nặng (ảnh quá nhiều). Hãy bớt ảnh." });
    const id = crypto.randomBytes(24).toString("base64url");
    const ok = await redis.set("letter:" + id, json, { nx: true });
    if (!ok) return res.status(500).json({ error: "Trùng mã, thử lại." });
    return res.status(200).json({ id });
  } catch (e) {
    return res.status(500).json({ error: "Lỗi máy chủ: " + e.message });
  }
};
