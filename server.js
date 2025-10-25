import express from "express";
import fetch from "node-fetch";
import cors from "cors";

// ==========================
// 🔧 Конфигурация
// ==========================
const app = express();
app.use(express.json());
app.use(cors({
  origin: "https://somrafallen.github.io", // твой фронтенд
}));

const CLIENT_ID = "5a40c55151c241e3a007f2562fd4e1dd";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET"; // ⚠️ вставь свой CCP Secret
const REDIRECT_URI = "https://somrafallen.github.io/eve-wh-map/";

// Простая память сервера (временная база)
let userData = {}; // characterID -> { history: [], map: { nodes: [], edges: [] } }

// ==========================
// 🔐 OAuth — обмен кода на токен
// ==========================
app.post("/exchange", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Нет кода авторизации" });

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);

    const tokenResponse = await fetch("https://login.eveonline.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const text = await tokenResponse.text();
    if (!tokenResponse.ok) {
      console.error("Ошибка обмена токена:", text);
      return res.status(400).json({ error: "Ошибка обмена кода", details: text });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Ошибка при авторизации:", err);
    res.status(500).json({ error: "Ошибка обмена токена", details: err.message });
  }
});

// ==========================
// 📍 Добавление систем в маршрут
// ==========================
app.post("/location", (req, res) => {
  const { characterID, systemID, systemName } = req.body;
  if (!characterID || !systemID || !systemName) {
    return res.status(400).json({ error: "Неполные данные" });
  }

  if (!userData[characterID]) {
    userData[characterID] = { history: [], map: { nodes: [], edges: [] } };
  }

  userData[characterID].history.push({
    systemID,
    systemName,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: "Система добавлена" });
});

// ==========================
// 🧭 Получение истории маршрута
// ==========================
app.get("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  const history = userData[characterID]?.history || [];
  res.json(history);
});

// ==========================
// 🧹 Очистка истории
// ==========================
app.delete("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  if (userData[characterID]) {
    userData[characterID].history = [];
    userData[characterID].map = { nodes: [], edges: [] };
  }
  res.json({ success: true });
});

// ==========================
// 💾 Сохранение карты (узлы + связи)
// ==========================
app.post("/map/:characterID", (req, res) => {
  const { characterID } = req.params;
  const { nodes, edges } = req.body;
  if (!userData[characterID]) {
    userData[characterID] = { history: [], map: { nodes: [], edges: [] } };
  }
  userData[characterID].map = { nodes, edges };
  res.json({ success: true, message: "Карта сохранена" });
});

// ==========================
// 🌌 Получение карты
// ==========================
app.get("/map/:characterID", (req, res) => {
  const { characterID } = req.params;
  const map = userData[characterID]?.map || { nodes: [], edges: [] };
  res.json(map);
});

// ==========================
// 🌍 Проверка сервера
// ==========================
app.get("/", (req, res) => {
  res.send("✅ EVE WH API Server is running!");
});

// ==========================
// 🚀 Запуск
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
