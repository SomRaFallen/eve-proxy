import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ Настройки
const CLIENT_ID = "5a40c55151c241e3a007f2562fd4e1dd";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET"; // ⚠️ вставь свой секрет с developers.eveonline.com
const REDIRECT_URI = "https://somrafallen.github.io/eve-wh-map/";

// 🗂️ Простая база данных в памяти
let userData = {}; 
// userData[characterID] = { history: [...], map: {nodes:[], edges:[]} }

// 🧩 Обмен кода на токен
app.post("/exchange", async (req, res) => {
  try {
    const { code } = req.body;
    const response = await fetch("https://login.eveonline.com/v2/oauth/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(400).json({ error: "Ошибка обмена токена", details: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error("Ошибка обмена токена:", e);
    res.status(500).json({ error: e.message });
  }
});

// 🛰️ Добавить новую систему в историю
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

// 📜 Получить историю маршрута
app.get("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  if (!userData[characterID]) {
    return res.json([]);
  }
  res.json(userData[characterID].history);
});

// 🧹 Очистить историю
app.delete("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  if (userData[characterID]) {
    userData[characterID].history = [];
    userData[characterID].map = { nodes: [], edges: [] };
  }
  res.json({ success: true });
});

// 💾 Сохранить карту (узлы + связи)
app.post("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  const { nodes, edges } = req.body;
  if (!userData[characterID]) {
    userData[characterID] = { history: [], map: { nodes: [], edges: [] } };
  }
  userData[characterID].map = { nodes, edges };
  res.json({ success: true, message: "Карта сохранена" });
});

// 📡 Получить сохранённую карту
app.get("/map/:characterID", (req, res) => {
  const { characterID } = req.params;
  if (!userData[characterID]) {
    return res.json({ nodes: [], edges: [] });
  }
  res.json(userData[characterID].map);
});

// 🌐 Проверка
app.get("/", (req, res) => {
  res.send("✅ EVE WH API Server is running.");
});

// 🚀 Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 EVE WH API Server started on port ${PORT}`);
});
