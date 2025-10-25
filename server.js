import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

app.post('/exchange', async (req,res)=>{
  const { code } = req.body;
  if(!code) return res.status(400).send('code missing');

  try{
    // обмен кода на токен
    const params = new URLSearchParams();
    params.append('grant_type','authorization_code');
    params.append('code',code);
    params.append('redirect_uri',REDIRECT_URI);

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenResp = await fetch('https://login.eveonline.com/v2/oauth/token',{
      method:'POST',
      headers:{
        'Authorization':'Basic '+auth,
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if(!tokenResp.ok){
      const t = await tokenResp.text();
      return res.status(500).send('Ошибка токена: '+t);
    }

    const tokenData = await tokenResp.json();
    const access_token = tokenData.access_token;

    // Получаем данные персонажа
    const charResp = await fetch('https://esi.evetech.net/latest/characters/me/?datasource=tranquility',{
      headers:{'Authorization':'Bearer '+access_token}
    });
    if(!charResp.ok) return res.status(500).send('Ошибка получения персонажа');
    const character = await charResp.json();

    // возвращаем фронтенду
    res.json({ access_token, character });

  } catch(e){
    console.error(e);
    res.status(500).send('Server error: '+e.message);
  }
});

app.listen(process.env.PORT || 3000, ()=>console.log('EVE WH API Server is running.'));
