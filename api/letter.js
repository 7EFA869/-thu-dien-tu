const redis = require("./_db");
module.exports = async (req, res) => {
  const id = String(req.query.id || "");
  if (!/^[A-Za-z0-9_-]{30,40}$/.test(id)) return res.status(400).json({ error: "Link không hợp lệ" });
  try {
    const raw = await redis.get("letter:" + id);
    if (!raw) return res.status(404).json({ error: "Không tìm thấy thư" });
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};
