import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let historyData = {}; // { characterID: [{systemID, systemName}, ...] }

app.post('/location', (req,res)=>{
    const {characterID, systemID, systemName} = req.body;
    if(!historyData[characterID]) historyData[characterID]=[];
    historyData[characterID].push({systemID, systemName});
    res.json({ok:true});
});

app.get('/history/:characterID', (req,res)=>{
    const id = req.params.characterID;
    res.json(historyData[id] || []);
});

app.delete('/history/:characterID', (req,res)=>{
    const id = req.params.characterID;
    historyData[id] = [];
    res.json({ok:true});
});

// Прокси ZKB
app.get('/zkb/:characterID', async (req,res)=>{
    try{
        const r = await fetch(`https://zkillboard.com/api/characters/${req.params.characterID}/recent/`);
        const data = await r.json();
        res.json(data);
    }catch(e){
        res.status(500).json({error:e.message});
    }
});

app.post('/exchange', async (req,res)=>{
    // сюда вставить ваш код обмена токена через ESI
    res.json({access_token:'ВАШ_ACCESS_TOKEN'});
});

app.listen(process.env.PORT || 3000, ()=>console.log('Server started'));
