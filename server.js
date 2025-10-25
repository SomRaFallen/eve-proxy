import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

let routes = {}; // сохраняем маршруты по CharacterID

// --- Проверка сервера ---
app.get('/', (req,res)=>{
  res.send('EVE WH API Server is running. Используйте /exchange и /route');
});

// --- Обмен кода на токен ---
app.post('/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if(!code) return res.status(400).json({ error: 'code required' });

    const params = new URLSearchParams();
    params.append('grant_type','authorization_code');
    params.append('code', code);

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token',{
      method:'POST',
      body: params,
      headers:{
        'Authorization':`Basic ${auth}`,
        'Content-Type':'application/x-www-form-urlencoded'
      }
    });
    const tokenData = await tokenResp.json();
    if(tokenData.error) return res.status(400).json(tokenData);

    const userResp = await fetch('https://esi.evetech.net/latest/verify/',{
      headers:{'Authorization':`Bearer ${tokenData.access_token}`}
    });
    const userData = await userResp.json();

    // Получаем текущую систему
    const locResp = await fetch(`https://esi.evetech.net/latest/characters/${userData.CharacterID}/location/`,{
      headers:{'Authorization':`Bearer ${tokenData.access_token}`}
    });
    const locData = await locResp.json();

    const character = {
      CharacterID: userData.CharacterID,
      CharacterName: userData.CharacterName,
      SystemName: locData.solar_system_id ? `J${locData.solar_system_id}` : "J114337"
    };

    res.json({ access_token: tokenData.access_token, character });
  } catch(e){
    console.error(e);
    res.status(500).json({ error:e.message });
  }
});

// --- Маршрут ---
app.get('/route/:characterId', (req,res)=>{
  const { characterId } = req.params;
  if(!routes[characterId]) return res.json({ nodes:[], edges:[] });
  res.json(routes[characterId]);
});

app.post('/route/:characterId', (req,res)=>{
  const { characterId } = req.params;
  const { nodes, edges } = req.body;
  routes[characterId] = { nodes, edges };
  res.json({ success:true });
});

app.delete('/route/:characterId', (req,res)=>{
  const { characterId } = req.params;
  delete routes[characterId];
  res.json({ success:true });
});

// --- Поиск персонажей ---
app.get('/search', async (req,res)=>{
  const { query } = req.query;
  if(!query) return res.status(400).json([]);
  try{
    const searchResp = await fetch(`https://esi.evetech.net/latest/search/?categories=character&search=${encodeURIComponent(query)}&strict=false`);
    const searchData = await searchResp.json();
    const results = searchData.character || [];
    const characters = results.map(id=>({ id, name:`Character ${id}` })); 
    res.json(characters);
  }catch(e){ res.status(500).json({ error:e.message }); }
});

// --- ZKB киллмейлы ---
app.get('/zkbKills', async (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({ error:'characterId required' });
  try{
    const resp = await fetch(`https://zkillboard.com/api/characters/${characterId}/recent.json/`);
    const data = await resp.json();
    const kills = data.slice(0,10).map(k=>{
      return {
        solarSystem: k.solarSystemName,
        date: k.killTime,
        ship: k.victim.shipTypeName
      };
    });
    res.json(kills);
  }catch(e){ res.status(500).json({ error:e.message }); }
});

app.listen(PORT, ()=>console.log(`EVE WH API Server is running on port ${PORT}`));
