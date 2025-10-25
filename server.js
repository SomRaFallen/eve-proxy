import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Хранилище в памяти для примера
// Формат: { characterID: [{ id, name, timestamp }, ...] }
const whHistory = {};

// POST /location — сохраняем текущую систему персонажа
app.post('/location', (req, res) => {
    const { characterID, systemID, systemName } = req.body;
    if (!characterID || !systemID || !systemName) {
        return res.status(400).send('Missing data');
    }
    if (!whHistory[characterID]) whHistory[characterID] = [];
    whHistory[characterID].push({ id: systemID, name: systemName, timestamp: Date.now() });
    res.json({ status: 'ok' });
});

// GET /history/:characterID — возвращает историю ВХ
app.get('/history/:characterID', (req, res) => {
    const charID = req.params.characterID;
    res.json(whHistory[charID] || []);
});

// GET /location?characterID=... — возвращает последнюю систему персонажа
app.get('/location', (req, res) => {
    const charID = req.query.characterID;
    if (!charID) return res.status(400).send('Missing characterID');
    const history = whHistory[charID];
    if (!history || history.length === 0) return res.status(404).send('No data');
    const last = history[history.length - 1];
    res.json({ system_id: last.id, system_name: last.name });
});

// Опционально: простой GET для проверки сервера
app.get('/', (req, res) => {
    res.send('EVE WH Proxy Server работает');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
