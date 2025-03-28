const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRouter = require('./auth');

const app = express();

// Подключение к MongoDB
mongoose.connect('mongodb+srv://rimskyuser:wR9O6OjVGwljfBcW@cluster0.tmt9m.mongodb.net/rimsky-kvartal?retryWrites=true&w=majority&appName=Cluster0', {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Схемы и модели
// Работы
const SubStageSchema = new mongoose.Schema({
  volume: { type: Number, default: 0 },
  state: { type: String, enum: ['notStarted', 'inProgress', 'checked', 'skipped'], default: 'notStarted' },
  weight: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  team: { type: [String], default: [] }
});

const WorkSchema = new mongoose.Schema({
  podjezd: String,
  floor: String,
  type: String,
  team: { type: [String], default: [] },
  stages: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

WorkSchema.index({ podjezd: 1, floor: 1, type: 1 });
const Work = mongoose.model('Work', WorkSchema);

// Сотрудники
const EmployeeSchema = new mongoose.Schema({
  fio: { type: String, required: true },
  floors: { type: [Number], default: [] },
  advances: { type: [{ date: String, amount: Number }], default: [] },
  earnings: { type: Number, default: 0 },
  accessLevel: { type: String, enum: ['yes', 'no'], default: 'no' }
});

const Employee = mongoose.model('Employee', EmployeeSchema);

// Схема для "Главная" (общая статистика по подъездам)
const SummarySchema = new mongoose.Schema({
  podjezd: { type: String, required: true },
  totalProgress: { type: Number, default: 0 }, // В процентах
  totalVolume: { type: Number, default: 0 },   // В м²
  totalEarnings: { type: Number, default: 0 }   // В рублях
});

const Summary = mongoose.model('Summary', SummarySchema);

// Схема для "Склад" (материалы)
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'шт' }, // Единица измерения (шт, кг, м² и т.д.)
  dateReceived: { type: String, default: '' },
  status: { type: String, enum: ['available', 'low', 'outOfStock'], default: 'available' }
});

const Warehouse = mongoose.model('Warehouse', WarehouseSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Настройка статических файлов
const publicPath = path.join(__dirname, '../../public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Явные маршруты для CSS и JS
app.use('/admin.css', express.static(path.join(publicPath, 'admin.css')));
app.use('/brigade.css', express.static(path.join(publicPath, 'brigade.css')));
app.use('/works.css', express.static(path.join(publicPath, 'works.css')));
app.use('/admin.js', express.static(path.join(publicPath, 'js/admin.js')));
app.use('/brigade.js', express.static(path.join(publicPath, 'js/brigade.js')));
app.use('/works.js', express.static(path.join(publicPath, 'js/works.js')));

// Подключаем роутер аутентификации
app.use('/auth', authRouter);

// Обработчик для корневого маршрута
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

const floors = ['-1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const podjezds = ['podjezd5', 'podjezd6', 'podjezd7', 'podjezd8'];
const types = ['mop', 'stairs', 'balcony'];

const mopStages = {
  'Монтаж уголков': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
  'Откосы': {
    'Штукатурка': { volume: 0, state: 'notStarted', weight: 0, rate: 300, team: [] },
    'Шлифовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шпатлевка': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
    'Шлифовка_2': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Стены': {
    'Заделка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт-краска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Дефектовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шкурка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Финиш': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Легкая уборка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Укрывка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Потолки': {
    'Покраска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Укрывка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт-краска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Дефектовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Финиш': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Распаковка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Уборка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
};

const stairsStages = {
  'Уголки': {
    'Отбивка': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
    'Монтаж': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
  },
  'Боковины': {
    'Штукатурка': { volume: 0, state: 'notStarted', weight: 0, rate: 300, team: [] },
    'Шлифовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шпатлевка': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
    'Шлифовка_2': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Откосы': {
    'Штукатурка': { volume: 0, state: 'notStarted', weight: 0, rate: 300, team: [] },
    'Шлифовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шпатлевка': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
    'Шлифовка_2': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Стены': {
    'Штукатурка': { volume: 0, state: 'notStarted', weight: 0, rate: 300, team: [] },
    'Замазки': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шлифовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Очистка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Укрывка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Потолки': {
    'Покраска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Укрывка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Покраска Стен': {
    'Грунт-Краска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Дефектовка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Шкурка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Грунт': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
    'Финиш': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  },
  'Распаковка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Уборка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
};

const balconyStages = {
  'Штукатурка': { volume: 0, state: 'notStarted', weight: 0, rate: 300, team: [] },
  'Шпатлёвка': { volume: 0, state: 'notStarted', weight: 0, rate: 200, team: [] },
  'Укрывка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Покраска': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Распаковка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
  'Уборка': { volume: 0, state: 'notStarted', weight: 0, rate: 0, team: [] },
};

// Инициализация данных
mongoose.connection.once('open', async () => {
  try {
    // Инициализация работ
    const workCount = await Work.countDocuments();
    if (workCount === 0) {
      console.log('Initializing database with default work data...');
      const bulkOps = [];
      podjezds.forEach(podjezd => {
        floors.forEach(floor => {
          types.forEach(type => {
            const stages = type === 'mop' ? mopStages : type === 'stairs' ? stairsStages : balconyStages;
            bulkOps.push({
              insertOne: {
                document: {
                  podjezd,
                  floor,
                  type,
                  team: [],
                  stages,
                },
              },
            });
          });
        });
      });
      await Work.bulkWrite(bulkOps);
      console.log('Database initialized with default work data.');
    }

    // Инициализация сотрудников
    const employeeCount = await Employee.countDocuments();
    if (employeeCount === 0) {
      const initialEmployees = [
        {
          fio: "Иванов Сергей Иванович",
          floors: [1, 2],
          advances: [
            { date: "01.03.2025", amount: 5000 },
            { date: "05.03.2025", amount: 3000 }
          ],
          earnings: 20000,
          accessLevel: "yes"
        },
        {
          fio: "Петров Алексей Петрович",
          floors: [3],
          advances: [
            { date: "02.03.2025", amount: 5000 }
          ],
          earnings: 15000,
          accessLevel: "no"
        }
      ];
      await Employee.insertMany(initialEmployees);
      console.log('Database initialized with default employee data.');
    }

    // Инициализация статистики для "Главная"
    const summaryCount = await Summary.countDocuments();
    if (summaryCount === 0) {
      const initialSummaries = podjezds.map(podjezd => ({
        podjezd,
        totalProgress: 0,
        totalVolume: 0,
        totalEarnings: 0
      }));
      await Summary.insertMany(initialSummaries);
      console.log('Database initialized with default summary data.');
    }

    // Инициализация данных для "Склад"
    const warehouseCount = await Warehouse.countDocuments();
    if (warehouseCount === 0) {
      const initialWarehouseItems = [
        {
          name: "Штукатурка",
          quantity: 50,
          unit: "кг",
          dateReceived: "01.03.2025",
          status: "available"
        },
        {
          name: "Краска",
          quantity: 20,
          unit: "л",
          dateReceived: "02.03.2025",
          status: "low"
        },
        {
          name: "Уголки",
          quantity: 0,
          unit: "шт",
          dateReceived: "03.03.2025",
          status: "outOfStock"
        }
      ];
      await Warehouse.insertMany(initialWarehouseItems);
      console.log('Database initialized with default warehouse data.');
    }
  } catch (err) {
    console.error('Error initializing data:', err);
  }
});

// API-эндпоинты для работ
app.get('/api/works/:podjezd', async (req, res) => {
  try {
    const { podjezd } = req.params;
    const works = await Work.find({ podjezd });
    res.json(works);
  } catch (err) {
    console.error('Error fetching works:', err);
    res.status(500).json({ error: 'Failed to fetch works' });
  }
});

app.post('/api/works/update-team', async (req, res) => {
  try {
    const { podjezd, floor, type, team } = req.body;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { team } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

app.post('/api/works/update-substage-team', async (req, res) => {
  try {
    const { podjezd, floor, type, stage, subStage, team } = req.body;
    const updatePath = subStage ? `stages.${stage}.${subStage}.team` : `stages.${stage}.team`;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { [updatePath]: team } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating substage team:', err);
    res.status(500).json({ error: 'Failed to update substage team' });
  }
});

app.post('/api/works/update-volume', async (req, res) => {
  try {
    const { podjezd, floor, type, stage, subStage, volume } = req.body;
    const updatePath = subStage ? `stages.${stage}.${subStage}.volume` : `stages.${stage}.volume`;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { [updatePath]: volume } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating volume:', err);
    res.status(500).json({ error: 'Failed to update volume' });
  }
});

app.post('/api/works/update-status', async (req, res) => {
  try {
    const { podjezd, floor, type, stage, subStage, state } = req.body;
    const updatePath = subStage ? `stages.${stage}.${subStage}.state` : `stages.${stage}.state`;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { [updatePath]: state } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/works/update-weight', async (req, res) => {
  try {
    const { podjezd, floor, type, stage, subStage, weight } = req.body;
    const updatePath = subStage ? `stages.${stage}.${subStage}.weight` : `stages.${stage}.weight`;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { [updatePath]: weight } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating weight:', err);
    res.status(500).json({ error: 'Failed to update weight' });
  }
});

app.post('/api/works/update-rate', async (req, res) => {
  try {
    const { podjezd, floor, type, stage, subStage, rate } = req.body;
    const updatePath = subStage ? `stages.${stage}.${subStage}.rate` : `stages.${stage}.rate`;
    await Work.updateOne(
      { podjezd, floor, type },
      { $set: { [updatePath]: rate } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating rate:', err);
    res.status(500).json({ error: 'Failed to update rate' });
  }
});

app.post('/api/works/copy-weights', async (req, res) => {
  try {
    const { podjezd, floor, type } = req.body;
    const currentFloorIndex = floors.indexOf(floor);
    if (currentFloorIndex > 0) {
      const prevFloor = floors[currentFloorIndex - 1];
      const prevWork = await Work.findOne({ podjezd, floor: prevFloor, type });
      const currentWork = await Work.findOne({ podjezd, floor, type });
      if (prevWork && currentWork) {
        const updatedStages = { ...currentWork.stages };
        for (const stage in prevWork.stages) {
          if (Object.keys(prevWork.stages[stage]).length > 0) {
            for (const subStage in prevWork.stages[stage]) {
              if (updatedStages[stage] && updatedStages[stage][subStage]) {
                updatedStages[stage][subStage].weight = prevWork.stages[stage][subStage].weight || 0;
              }
            }
          } else {
            if (updatedStages[stage]) {
              updatedStages[stage].weight = prevWork.stages[stage].weight || 0;
            }
          }
        }
        await Work.updateOne(
          { podjezd, floor, type },
          { $set: { stages: updatedStages } }
        );
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Previous floor data not found' });
      }
    } else {
      res.status(400).json({ error: 'No previous floor to copy from' });
    }
  } catch (err) {
    console.error('Error copying weights:', err);
    res.status(500).json({ error: 'Failed to copy weights' });
  }
});

// API-эндпоинты для сотрудников
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees/add-advance', async (req, res) => {
  try {
    const { employeeId, date, amount } = req.body;
    await Employee.updateOne(
      { _id: employeeId },
      { $push: { advances: { date, amount: parseFloat(amount) } } }
    );
    const updatedEmployee = await Employee.findById(employeeId);
    res.json(updatedEmployee);
  } catch (err) {
    console.error('Error adding advance:', err);
    res.status(500).json({ error: 'Failed to add advance' });
  }
});

app.post('/api/employees/update', async (req, res) => {
  try {
    const { employeeId, fio, floors, accessLevel } = req.body;
    await Employee.updateOne(
      { _id: employeeId },
      { $set: { fio, floors, accessLevel } }
    );
    const updatedEmployee = await Employee.findById(employeeId);
    res.json(updatedEmployee);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.post('/api/employees/update-access', async (req, res) => {
  try {
    const { employeeId, accessLevel } = req.body;
    await Employee.updateOne(
      { _id: employeeId },
      { $set: { accessLevel } }
    );
    const updatedEmployee = await Employee.findById(employeeId);
    res.json(updatedEmployee);
  } catch (err) {
    console.error('Error updating access level:', err);
    res.status(500).json({ error: 'Failed to update access level' });
  }
});

// API-эндпоинты для "Главная"
app.get('/api/summary', async (req, res) => {
  try {
    const summaries = await Summary.find();
    res.json(summaries);
  } catch (err) {
    console.error('Error fetching summaries:', err);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// API-эндпоинты для "Склад"
app.get('/api/warehouse', async (req, res) => {
  try {
    const items = await Warehouse.find();
    res.json(items);
  } catch (err) {
    console.error('Error fetching warehouse items:', err);
    res.status(500).json({ error: 'Failed to fetch warehouse items' });
  }
});

// Старт сервера
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
