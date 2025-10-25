import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({
  origin: "https://somrafallen.github.io", // фронтенд
}));

// 🔧 Настройки
const CLIENT_ID = "5a40c55151c241e3a007f2562fd4e1dd";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "https://somrafallen.github.io/eve-wh-map/";

let userData = {}; // characterID -> { token, history, map }

// ==========================
// 🔐 Обмен кода на токен
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

    // Получаем данные о персонаже
    const verifyRes = await fetch("https://login.eveonline.com/oauth/verify", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const verifyData = await verifyRes.json();

    const characterID = verifyData.CharacterID;
    userData[characterID] = {
      token: data.access_token,
      history: [],
      map: { nodes: [], edges: [] },
    };

    res.json({ ...data, character: verifyData });
  } catch (err) {
    console.error("Ошибка при авторизации:", err);
    res.status(500).json({ error: "Ошибка обмена токена", details: err.message });
  }
});

// ==========================
// 📡 Получение текущей системы пилота
// ==========================
async function getCurrentLocation(characterID) {
  const user = userData[characterID];
  if (!user || !user.token) throw new Error("Нет токена для персонажа");

  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterID}/location/`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Ошибка получения локации:", text);
    throw new Error("Не удалось получить текущее местоположение");
  }

  const data = await res.json();

  // Получаем имя системы
  const sysRes = await fetch(`https://esi.evetech.net/latest/universe/systems/${data.solar_system_id}/`);
  const sysData = await sysRes.json();

  return {
    systemID: data.solar_system_id,
    systemName: sysData.name,
  };
}

// ==========================
// 📍 Сохранение текущей системы в историю
// ==========================
app.post("/location/:characterID", async (req, res) => {
  try {
    const { characterID } = req.params;
    const location = await getCurrentLocation(characterID);

    if (!userData[characterID]) {
      userData[characterID] = { history: [], map: { nodes: [], edges: [] } };
    }

    userData[characterID].history.push({
      systemID: location.systemID,
      systemName: location.systemName,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: "Локация добавлена", location });
  } catch (err) {
    console.error("Ошибка сохранения локации:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 📜 История маршрута
// ==========================
app.get("/history/:characterID", (req, res) => {
  const { characterID } = req.params;
  const history = userData[characterID]?.history || [];
  res.json(history);
});

// ==========================
// 🧹 Очистка маршрута
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
// 💾 Сохранение карты
// ==========================
app.post("/map/:characterID", (req, res) => {
  const { characterID } = req.params;
  const { nodes, edges } = req.body;
  if (!userData[characterID]) {
    userData[characterID] = { history: [], map: { nodes: [], edges: [] } };
  }
  userData[characterID].map = { nodes, edges };
  res.json({ success: true });
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
// 🌍 Проверка
// ==========================
app.get("/", (req, res) => {
  res.send("✅ EVE WH API Server is running with auto-location!");
});

// ==========================
// 🚀 Запуск
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
