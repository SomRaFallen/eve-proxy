import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Хранилище истории перемещений
let historyData = {};

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, req.body || '');
  next();
});

// Добавить текущее местоположение персонажа
app.post('/location', (req, res) => {
  try {
    const { characterID, systemID, systemName } = req.body;
    if (!characterID || !systemID || !systemName) {
      return res.status(400).json({ error: 'characterID, systemID и systemName обязательны' });
    }
    if (!historyData[characterID]) historyData[characterID] = [];
    historyData[characterID].push({ systemID, systemName, timestamp: new Date().toISOString() });
    res.json({ ok: true, message: 'Локация добавлена' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Получить историю перемещений персонажа
app.get('/history/:characterID', (req, res) => {
  try {
    const characterID = req.params.characterID;
    res.json(historyData[characterID] || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Очистить историю перемещений персонажа
app.delete('/history/:characterID', (req, res) => {
  try {
    const characterID = req.params.characterID;
    historyData[characterID] = [];
    res.json({ ok: true, message: 'История очищена' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
