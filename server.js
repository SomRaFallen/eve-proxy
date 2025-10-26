// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Берём переменные из Environment Render
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

let routes = {}; // маршруты персонажей

// --- OAuth EVE Online ---
app.post('/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      body: params,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResp.json();
    if (tokenData.error) return res.status(400).json(tokenData);

    const userResp = await fetch('https://esi.evetech.net/latest/verify/', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResp.json();

    const locResp = await fetch(
      `https://esi.evetech.net/latest/characters/${userData.CharacterID}/location/`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
    );
    const locData = await locResp.json();

    const character = {
      CharacterID: userData.CharacterID,
      CharacterName: userData.CharacterName,
      SystemID: locData.solar_system_id || null,
    };

    res.json({ access_token: tokenData.access_token, character });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// --- Маршруты персонажей ---
app.get('/route/:characterId', (req, res) =>
  res.json(routes[req.params.characterId] || { nodes: [], edges: [] })
);
app.post('/route/:characterId', (req, res) => {
  routes[req.params.characterId] = req.body;
  res.json({ success: true });
});
app.delete('/route/:characterId', (req, res) => {
  delete routes[req.params.characterId];
  res.json({ success: true });
});

// --- Последние киллы с zKillboard ---
app.get('/zkbKills', async (req, res) => {
  const { characterId } = req.query;
  if (!characterId) return res.status(400).json({ error: 'characterId required' });

  try {
    const resp = await fetch(`https://zkillboard.com/api/characters/${characterId}/recent.json/`);
    const data = await resp.json();
    const kills = data.slice(0, 10).map(k => ({
      solarSystem: k.solarSystemName,
      date: k.killTime,
      ship: k.victim.shipTypeName,
    }));
    res.json(kills);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Поиск персонажей через ESI ---
app.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json([]);

  try {
    const searchResp = await fetch(
      `https://esi.evetech.net/latest/search/?categories=character&search=${encodeURIComponent(
        query
      )}&strict=false`
    );
    const searchData = await searchResp.json();
    res.json((searchData.character || []).map(id => ({ id, name: `Character ${id}` })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Добавлен GET / для проверки ---
app.get('/', (req, res) => {
  res.send('✅ EVE WH Map backend is running!');
});

// --- Запуск сервера ---
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
