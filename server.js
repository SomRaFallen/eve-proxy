import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let routes = {};

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

// --- поиск персонажей (заглушка) ---
app.get('/search', (req,res)=>{
  const { query } = req.query;
  if(!query) return res.json([]);
  // Поиск через ESI публичный (можно заменить реальным)
  res.json([{ id:1, name:"Character One"}, { id:2, name:"Character Two"}]);
});

// --- zKillboard ---
app.get('/zkbKills', async (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({ error:'characterId required' });

  try{
    const resp = await fetch(`https://zkillboard.com/api/characters/${characterId}/recent.json/`);
    const data = await resp.json();
    const kills = data.slice(0,10).map(k=>({
      solarSystem: k.solarSystemName,
      date: k.killTime,
      ship: k.victim.shipTypeName
    }));
    res.json(kills);
  }catch(e){ res.status(500).json({ error:e.message }); }
});

app.get('/', (req,res)=>res.send('✅ EVE WH Map backend running (editable)'));

app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
