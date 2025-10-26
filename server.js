import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

let routes = {};

// --- OAuth: обмен кода на токен ---
app.post('/exchange', async (req,res)=>{
  try{
    const { code } = req.body;
    if(!code) return res.status(400).json({ error:'code required' });

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

    res.json({ access_token: tokenData.access_token, character: userData });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

// --- маршруты Wormhole Map ---
app.get('/route/:characterId', (req,res)=>{
  res.json(routes[req.params.characterId] || { nodes:[], edges:[] });
});

app.post('/route/:characterId', (req,res)=>{
  routes[req.params.characterId] = req.body;
  res.json({ success:true });
});

app.delete('/route/:characterId', (req,res)=>{
  delete routes[req.params.characterId];
  res.json({ success:true });
});

// --- поиск персонажей ---
app.get('/search', async (req,res)=>{
  const { query } = req.query;
  if(!query) return res.json([]);

  try{
    const resp = await fetch(`https://esi.evetech.net/latest/search/?categories=character&search=${encodeURIComponent(query)}&strict=false`);
    const data = await resp.json();
    res.json((data.character||[]).map(id=>({ id, name:`Character ${id}`})));
  }catch(e){ res.status(500).json({ error:e.message }); }
});

// --- zKillboard ---
app.get('/zkbKills', async (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({ error:'characterId required' });

  try{
    const resp = await fetch(`https://zkillboard.com/api/characters/${characterId}/recent.json/`);
    const data = await resp.json();
    const kills = data.slice(0,10).map(k=>({
      solarSystem:k.solarSystemName,
      date:k.killTime,
      ship:k.victim.shipTypeName
    }));
    res.json(kills);
  }catch(e){ res.status(500).json({ error:e.message }); }
});

app.get('/', (req,res)=>res.send('✅ EVE WH Map backend running (with auth & editable map)'));

app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
