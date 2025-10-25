// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// === Данные EVE SSO ===
const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

// --- Временное хранилище маршрутов и логов
let routes = {};
let logs = [];

// --- Проверка сервера ---
app.get('/status', (req,res)=>{
  res.json({status:'EVE WH API Server is running.'});
});

// --- Главная страница ---
app.get('/', (req,res)=>{
  res.send('EVE WH API Server is running. Используйте /exchange и /route');
});

// --- Exchange SSO code на токен + получение character_id ---
app.post('/exchange', async (req,res)=>{
  const { code } = req.body;
  if(!code) return res.status(400).send('code missing');

  try{
    console.log('Получен код SSO:', code);

    // Обмен кода на токен
    const params = new URLSearchParams();
    params.append('grant_type','authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if(!tokenResp.ok){
      const t = await tokenResp.text();
      console.error('Ошибка получения токена:', t);
      return res.status(500).send('Ошибка токена: '+t);
    }

    const tokenData = await tokenResp.json();
    const access_token = tokenData.access_token;
    const character_id = tokenData.character_id; // ✅ Используем character_id напрямую
    console.log('Access token:', access_token);
    console.log('Character ID:', character_id);

    // Сохраняем лог авторизации
    logs.push({type:'login', charId:character_id, time:Date.now()});

    // Отправляем на фронтенд
    res.json({
      access_token,
      character: {
        CharacterID: character_id,
        CharacterName: tokenData.character_name || 'Unknown'
      }
    });

  } catch(e){
    console.error('Server error:', e);
    res.status(500).send('Server error: '+e.message);
  }
});

// --- Сохраняем маршрут ---
app.post('/route/save', (req,res)=>{
  const { charId, route } = req.body;
  if(!charId || !route) return res.status(400).send('charId или route missing');
  routes[charId] = route;
  logs.push({type:'route_save', charId, route, time:Date.now()});
  res.json({status:'ok', route});
});

// --- Получаем маршрут ---
app.get('/route/:charId', (req,res)=>{
  const charId = req.params.charId;
  if(routes[charId]){
    res.json({route:routes[charId]});
  } else res.status(404).json({route:[]});
});

// --- Очистка маршрута ---
app.post('/route/clear', (req,res)=>{
  const { charId } = req.body;
  if(!charId) return res.status(400).send('charId missing');
  routes[charId] = [];
  logs.push({type:'route_clear', charId, time:Date.now()});
  res.json({status:'cleared'});
});

// --- Получение логов ---
app.get('/logs', (req,res)=>{
  res.json(logs);
});

app.listen(PORT, ()=>console.log(`EVE WH API Server running on port ${PORT}`));
