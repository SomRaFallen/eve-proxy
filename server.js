import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let historyData = {};

app.post('/location', (req,res)=>{
    try {
        const {characterID, systemID, systemName} = req.body;
        if(!historyData[characterID]) historyData[characterID]=[];
        historyData[characterID].push({systemID, systemName});
        res.json({ok:true});
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/history/:characterID', (req,res)=>{
    try{ res.json(historyData[req.params.characterID] || []); }
    catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/history/:characterID', (req,res)=>{
    try{ historyData[req.params.characterID]=[]; res.json({ok:true}); }
    catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/zkb/:characterID', async (req,res)=>{
    try{
        const r = await fetch(`https://zkillboard.com/api/characters/${req.params.characterID}/recent/`);
        const data = await r.json();
        res.json(data);
    }catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/exchange', async (req,res)=>{
    try{
        const { code } = req.body;
        const CLIENT_ID = '5a40c55151c241e3a007f2562fd4e1dd';
        const CLIENT_SECRET = 'eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd';
        const REDIRECT_URI = 'https://somrafallen.github.io/eve-wh-map/';
        const r = await fetch('https://login.eveonline.com/v2/oauth/token',{
            method:'POST',
            headers:{
                'Authorization':'Basic '+Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
                'Content-Type':'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({grant_type:'authorization_code', code, redirect_uri:REDIRECT_URI})
        });
        const data = await r.json();
        res.json(data);
    }catch(e){ res.status(500).json({error:e.message}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`API Server started on port ${PORT}`));
