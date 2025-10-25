import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Настройки EVE SSO
const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

// --- Обмен кода на токен и возврат персонажа ---
app.post('/exchange', async (req,res)=>{
  const { code } = req.body;
  if(!code) return res.status(400).json({error:'code required'});
  try{
    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method:'POST',
      headers:{
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID+':'+CLIENT_SECRET).toString('base64'),
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${code}`
    });

    const tokenData = await tokenResp.json();
    const access_token = tokenData.access_token;
    if(!access_token) return res.status(500).json({error:'Failed to get access token'});

    // Получаем данные персонажа
    const charResp = await fetch('https://esi.evetech.net/latest/characters/me/?datasource=tranquility', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const characterData = await charResp.json();

    if(!characterData.character_id || !characterData.name){
      return res.status(500).json({error:'Failed to get character info'});
    }

    res.json({
      access_token,
      character: {
        CharacterID: characterData.character_id,
        CharacterName: characterData.name,
        SystemName: 'J114337' // временно фиксированная система, потом можно брать с esi-location
      }
    });

  }catch(e){ 
    console.error(e);
    res.status(500).json({error:e.message}); 
  }
});

// --- Простейший маршрут для теста ---
app.get('/route', (req,res)=>res.json({message:'Server route is working'}));

app.listen(PORT, ()=>console.log(`EVE WH API Server is running on port ${PORT}`));
