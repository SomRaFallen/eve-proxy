import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';

// Хранилище истории перемещений
let historyData = {};

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, req.body || '');
  next();
});

// Корневой маршрут для проверки сервера
app.get('/', (req,res) => {
  res.send('EVE WH API Server is running.');
});

// Обмен кода на токен EVE Online
app.post('/exchange', async (req,res)=>{
  try{
    const { code } = req.body;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    });

    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method:'POST',
      headers:{
        'Authorization':'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    if(!response.ok) return res.status(response.status).json(data);
    res.json(data);

  } catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

// Сохранение текущей системы персонажа
app.post('/location', (req,res)=>{
  try {
    const { characterID, systemID, systemName } = req.body;
    if(!characterID || !systemID || !systemName) {
      return res.status(400).json({error:'characterID, systemID и systemName обязательны'});
    }
    if(!historyData[characterID]) historyData[characterID] = [];
    historyData[characterID].push({systemID, systemName, timestamp: new Date().toISOString()});
    res.json({ok:true, message:'Локация добавлена'});
  } catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

// Получение истории перемещений персонажа
app.get('/history/:characterID', (req,res)=>{
  try {
    const characterID = req.params.characterID;
    res.json(historyData[characterID] || []);
  } catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

// Очистка истории перемещений персонажа
app.delete('/history/:characterID', (req,res)=>{
  try {
    const characterID = req.params.characterID;
    historyData[characterID] = [];
    res.json({ok:true, message:'История очищена'});
  } catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server started on port ${PORT}`));
