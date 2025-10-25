import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let historyData = {}; // { characterID: [{systemID, systemName}, ...] }

// Сохранение текущей системы
app.post('/location', (req,res)=>{
    const {characterID, systemID, systemName} = req.body;
    if(!historyData[characterID]) historyData[characterID]=[];
    historyData[characterID].push({systemID, systemName});
    res.json({ok:true});
});

// Получение истории перемещений
app.get('/history/:characterID', (req,res)=>{
    const id = req.params.characterID;
    res.json(historyData[id] || []);
});

// Очистка истории
app.delete('/history/:characterID', (req,res)=>{
    const id = req.params.characterID;
    historyData[id] = [];
    res.json({ok:true});
});

// Прокси для ZKillboard
app.get('/zkb/:characterID', async (req,res)=>{
    try{
        const r = await fetch(`https://zkillboard.com/api/characters/${req.params.characterID}/recent/`);
        const data = await r.json();
        res.json(data);
    }catch(e){
        res.status(500).json({error:e.message});
    }
});

// Обмен кода на токен EVE Online
app.post('/exchange', async (req,res)=>{
    const { code } = req.body;
    // Тут вставьте ваш client_id и client_secret
    const client_id = '5a40c55151c241e3a007f2562fd4e1dd';
    const client_secret = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
    const redirect_uri = 'https://somrafallen.github.io/eve-wh-map/';

    try{
        const r = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method:'POST',
            headers: {
                'Authorization':'Basic '+Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
                'Content-Type':'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type:'authorization_code',
                code,
                redirect_uri
            })
        });
        const data = await r.json();
        res.json(data);
    }catch(e){
        res.status(500).json({error:e.message});
    }
});

app.listen(process.env.PORT || 3000, ()=>console.log('Server started'));
