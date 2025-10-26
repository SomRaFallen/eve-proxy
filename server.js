import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Сохраняем маршруты персонажей
let routes = {};

// Тестовая проверка
app.get('/', (req,res)=>res.send('EVE WH Map Backend running!'));

// Получение маршрута
app.get('/route/:characterId', (req,res)=>{
  const charId = req.params.characterId;
  res.json(routes[charId] || { steps: [] });
});

// Сохранение маршрута
app.post('/route/:characterId', (req,res)=>{
  const charId = req.params.characterId;
  routes[charId] = req.body;
  res.json({ success: true });
});

// Удаление маршрута
app.delete('/route/:characterId', (req,res)=>{
  const charId = req.params.characterId;
  delete routes[charId];
  res.json({ success: true });
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
