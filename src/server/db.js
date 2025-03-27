const fs = require('fs');
const path = require('path');

function getData(file, res) {
    const filePath = path.join(__dirname, '../../data', `${file}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Ошибка чтения файла');
            return;
        }
        res.json(JSON.parse(data));
    });
}

module.exports = { getData };