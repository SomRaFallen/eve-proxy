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

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server started on port ${PORT}`));
