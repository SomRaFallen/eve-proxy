import express from 'express';
import fs from 'fs';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const FILE = './systems.json';

// Получить все системы
app.get('/systems', (req, res) => {
  if(!fs.existsSync(FILE)) return res.json([]);
  const data = fs.readFileSync(FILE);
  res.json(JSON.parse(data));
});

// Добавить/обновить систему
app.post('/systems', (req, res) => {
  const newSystem = req.body; // {id, name, x, y, connections, home}
  let systems = [];
  if(fs.existsSync(FILE)){
    systems = JSON.parse(fs.readFileSync(FILE));
    const idx = systems.findIndex(s=>s.id===newSystem.id);
    if(idx>=0) systems[idx] = newSystem;
    else systems.push(newSystem);
  } else {
    systems.push(newSystem);
  }
  fs.writeFileSync(FILE, JSON.stringify(systems, null, 2));
  res.json({success:true});
});

// Очистить все системы
app.delete('/systems', (req, res) => {
  fs.writeFileSync(FILE, '[]');
  res.json({success:true});
});

app.listen(process.env.PORT || 3000, ()=>console.log('Server running'));
