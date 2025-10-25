import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let historyData = {};

// Сохранение текущей системы
app.post('/location', (req,res)=>{
  try {
    const {characterID, systemID, systemName} = req.body;
    if(!historyData[characterID]) historyData[characterID] = [];
    historyData[characterID].push({systemID, systemName});
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// Получение истории перемещений
app.get('/history/:characterID', (req,res)=>{
  try { res.json(historyData[req.params.characterID] || []); }
  catch(e) { res.status(500).json({error:e.message}); }
});

// Очистка истории перемещений
app.delete('/history/:characterID', (req,res)=>{
  try { historyData[req.params.characterID] = []; res.json({ok:true}); }
  catch(e) { res.status(500).json({error:e.message}); }
});

// ZKillboard (последние киллмейлы)
app.get('/zkb/:characterID', async (req,res)=>{
  try {
    const r = await fetch(`https://zkillboard.com/api/characters/${req.params.characterID}/recent/`);
    const data = await r.json();
    res.json(data);
  } catch(e){ res.status(500).json({error:e.message}); }
});

// Обмен кода на токен EVE Online
app.post('/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
    const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
    const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    });

    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`API Server started on port ${PORT}`));
