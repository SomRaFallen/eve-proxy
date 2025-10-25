import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = "5a40c55151c241e3a007f2562fd4e1dd";
const CLIENT_SECRET = process.env.CLIENT_SECRET; // укажи в Render
const REDIRECT_URI = "https://somrafallen.github.io/eve-wh-map/";

let pilotLocations = {}; // хранение пути пилота

// --- авторизация ---
app.get("/exchange", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch("https://login.eveonline.com/v2/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Token exchange failed:", data);
      return res.status(response.status).json({ error: "Ошибка обмена кода" });
    }

    res.json(data);
  } catch (err) {
    console.error("Exchange error:", err);
    res.status(500).json({ error: "Ошибка обмена кода" });
  }
});

// --- получение локации ---
app.post("/location", async (req, res) => {
  const { access_token, character_id } = req.body;
  if (!access_token || !character_id) {
    return res.status(400).json({ error: "Missing access_token or character_id" });
  }

  try {
    const response = await fetch(`https://esi.evetech.net/latest/characters/${character_id}/location/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Не удалось получить текущее местоположение" });
    }

    const data = await response.json();
    pilotLocations[character_id] = pilotLocations[character_id] || [];
    pilotLocations[character_id].push(data);
    res.json(data);
  } catch (err) {
    console.error("Location error:", err);
    res.status(500).json({ error: "Ошибка при получении локации" });
  }
});

// --- история перемещений ---
app.get("/history/:character_id", (req, res) => {
  const { character_id } = req.params;
  res.json(pilotLocations[character_id] || []);
});

// --- очистка пути ---
app.delete("/history/:character_id", (req, res) => {
  const { character_id } = req.params;
  delete pilotLocations[character_id];
  res.json({ message: "Путь очищен" });
});

// --- тестовый роут ---
app.get("/", (req, res) => {
  res.send("✅ EVE WH API Server is running.");
});

app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
