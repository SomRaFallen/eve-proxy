import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://somrafallen.github.io',
  methods: ['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// ===== Параметры EVE SSO =====
const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

// ===== Временное хранение маршрутов =====
const routes = {}; // characterId -> { nodes, edges }

// ===== /exchange =====
app.post('/exchange', async (req,res)=>{
  const { code } = req.body;
  if(!code) return res.status(400).json({error:'code required'});
  try{
    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token',{
      method:'POST',
      headers:{
        'Authorization':'Basic '+Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type:'authorization_code',
        code,
        redirect_uri:REDIRECT_URI
      })
    });
    const tokenData = await tokenResp.json();
    if(!tokenData.access_token) return res.status(400).json({error:'Failed to get access_token'});
    
    // Получаем информацию о персонаже
    const charResp = await fetch('https://esi.evetech.net/latest/characters/me/?datasource=tranquility',{
      headers:{'Authorization':'Bearer '+tokenData.access_token}
    });
    const charData = await charResp.json();
    const character = {
      CharacterID: charData.character_id,
      CharacterName: charData.name || 'Unknown'
    };
    
    res.json({ access_token: tokenData.access_token, character });
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

// ===== /zkb/exchange =====
app.post('/zkb/exchange', async (req,res)=>{
  const { characterId } = req.body;
  if(!characterId) return res.status(400).json({error:'characterId required'});
  // Заглушка токена ZKB
  res.json({ access_token: 'zkb_dummy_token', characterId });
});

// ===== /zkb/kills =====
app.get('/zkb/kills', async (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({error:'characterId required'});
  // Заглушка киллмейлов
  res.json({ kills:[
    { system:'J114337', date:'2025-10-26', ship:'Rattlesnake' },
    { system:'J100000', date:'2025-10-25', ship:'Rokh' }
  ]});
});

// ===== /zkb/search =====
app.get('/zkb/search', async (req,res)=>{
  const { name } = req.query;
  if(!name) return res.status(400).json({error:'name required'});
  // Заглушка поиска
  res.json({ results:[
    { characterId: 123456, name: name+"1" },
    { characterId: 123457, name: name+"2" }
  ]});
});

// ===== /route POST =====
app.post('/route', (req,res)=>{
  const { characterId, nodes: n, edges: e } = req.body;
  if(!characterId) return res.status(400).json({error:'characterId required'});
  routes[characterId] = { nodes: n, edges: e };
  res.json({status:'ok'});
});

// ===== /route GET =====
app.get('/route', (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({error:'characterId required'});
  res.json(routes[characterId] || { nodes: [], edges: [] });
});

// ===== /route DELETE =====
app.delete('/route', (req,res)=>{
  const { characterId } = req.body;
  if(!characterId) return res.status(400).json({error:'characterId required'});
  delete routes[characterId];
  res.json({status:'deleted'});
});

app.listen(PORT, ()=>console.log(`EVE WH API Server is running on port ${PORT}`));
