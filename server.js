import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let routes = {};

// --- маршруты для карты ---
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

// --- поиск персонажей (только заглушка) ---
app.get('/search', (req,res)=>{
  const { query } = req.query;
  if(!query) return res.json([]);
  // Пример статичного ответа
  res.json([{ id:1, name:"Character One"}, { id:2, name:"Character Two"}]);
});

// --- киллы (заглушка) ---
app.get('/zkbKills', (req,res)=>{
  const { characterId } = req.query;
  if(!characterId) return res.status(400).json({ error:'characterId required' });

  res.json([
    { solarSystem:"J12345", date:"2025-10-26T12:00:00Z", ship:"Rifter" },
    { solarSystem:"J54321", date:"2025-10-25T18:30:00Z", ship:"Astero" },
  ]);
});

app.get('/', (req,res)=>{
  res.send('✅ EVE WH Map backend running (no auth)');
});

app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
