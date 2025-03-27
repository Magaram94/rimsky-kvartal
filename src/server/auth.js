// auth.js
const express = require('express');
const router = express.Router();

// Исправляем маршрут: убираем префикс /auth
router.post('/', (req, res) => {
  const { pin } = req.body;

  const validPins = [
    { pin: '1234', role: 'admin', name: 'Администратор' },
    { pin: '5678', role: 'foreman', name: 'Бригадир' },
    { pin: '9012', role: 'employee', name: 'Сотрудник' },
  ];

  const user = validPins.find((u) => u.pin === pin);
  if (user) {
    res.cookie('pin', pin, { path: '/', maxAge: 3600000 }); // 1 час
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Неверный пин-код' });
  }
});

// Исправляем маршрут: убираем префикс /auth
router.get('/user', (req, res) => {
  const pin = req.cookies.pin || req.headers.authorization;
  if (!pin) {
    return res.status(401).json({ success: false, message: 'Не авторизован' });
  }

  const validPins = [
    { pin: '1234', role: 'admin', name: 'Администратор' },
    { pin: '5678', role: 'foreman', name: 'Бригадир' },
    { pin: '9012', role: 'employee', name: 'Сотрудник' },
  ];

  const user = validPins.find((u) => u.pin === pin);
  if (user) {
    res.json({ success: true, role: user.role, name: user.name });
  } else {
    res.status(401).json({ success: false, message: 'Неверный пин-код' });
  }
});

// Исправляем маршрут: убираем префикс /auth
router.post('/logout', (req, res) => {
  res.cookie('pin', '', { maxAge: -1, path: '/' }); // Удаляем куки
  res.json({ success: true, message: 'Выход выполнен' });
});

module.exports = router;