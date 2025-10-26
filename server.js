import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let routes = {};

app.get('/', (req,res)=>res.send('EVE WH Map Backend running!'));

app.get('/route/:characterId', (req,res)=>{
  const charId = req.params.characterId;
  res.json(routes[charId] || { steps: [] });
});

app.post('/route/:characterId', (req,res)=>{
  const charId = req.params.characterId;
  routes[charId] = req.body;
  res.json({ success: true });
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
