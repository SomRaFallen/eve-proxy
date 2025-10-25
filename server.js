import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ==== Настройки EVE SSO ====
const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/'; // должен точно совпадать с SSO

// ==== Хранилище WH истории в памяти ====
const whHistory = {}; // { characterID: [{id, system_name, timestamp}, ...] }

// ==== /exchange — обмен кода на токен ====
app.post('/exchange', async (req,res)=>{
    const code = req.body.code;
    if(!code) return res.status(400).send('Missing code');

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try{
        const r = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method:'POST',
            headers:{
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
        });

        if(!r.ok){
            const errText = await r.text();
            return res.status(r.status).send(errText);
        }

        const data = await r.json();
        res.json(data);
    }catch(e){
        res.status(500).send(e.message);
    }
});

// ==== /location — POST сохраняет текущую систему ====
app.post('/location', (req,res)=>{
    const { characterID, systemID, systemName } = req.body;
    if(!characterID || !systemID || !systemName) return res.status(400).send('Missing data');
    if(!whHistory[characterID]) whHistory[characterID] = [];
    whHistory[characterID].push({id: systemID, system_name: systemName, timestamp: Date.now()});
    res.json({status:'ok'});
});

// ==== /history/:characterID — возвращает историю ====
app.get('/history/:characterID', (req,res)=>{
    const charID = req.params.characterID;
    res.json(whHistory[charID] || []);
});

// ==== /location — GET возвращает последнюю систему ====
app.get('/location', (req,res)=>{
    const charID = req.query.characterID;
    if(!charID) return res.status(400).send('Missing characterID');
    const history = whHistory[charID];
    if(!history || history.length===0) return res.status(404).send('No data');
    const last = history[history.length - 1];
    res.json({ system_id: last.id, system_name: last.system_name });
});

// ==== Тестовый root ====
app.get('/', (req,res)=>{
    res.send('EVE WH Proxy Server работает');
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
