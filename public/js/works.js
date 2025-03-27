console.log('works.js loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    document.querySelectorAll('.podjezd-filter button').forEach(button => {
        button.addEventListener('click', () => {
            const podjezd = button.getAttribute('data-podjezd');
            console.log(`Button clicked for podjezd: ${podjezd}`);
            loadWorks(podjezd);
        });
    });

    // Закрытие выпадающих меню при клике вне области
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-container')) {
            document.querySelectorAll('.team-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });

    console.log('Loading default works for podjezd5');
    loadWorks('podjezd5'); // По умолчанию загружаем подъезд 5

    // Инициализация изменения ширины столбцов
    document.querySelectorAll('.progress-table th').forEach(th => {
        th.addEventListener('mousedown', startResize);
    });
});

let startX, startWidth, currentTh;

function startResize(e) {
    currentTh = e.target;
    startX = e.pageX;
    startWidth = currentTh.offsetWidth;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(e) {
    if (currentTh) {
        const diff = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + diff); // Минимальная ширина 50px
        currentTh.style.width = `${newWidth}px`;
        currentTh.style.minWidth = `${newWidth}px`; // Фиксируем ширину
    }
}

function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    currentTh = null;
}

const floors = ['-1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const mopStages = {
    'Монтаж уголков': {},
    'Откосы': ['Штукатурка', 'Шлифовка', 'Грунт', 'Шпатлевка', 'Шлифовка_2'],
    'Стены': ['Заделка', 'Грунт-краска', 'Дефектовка', 'Шкурка', 'Грунт', 'Финиш'],
    'Легкая уборка': {},
    'Укрывка': {},
    'Потолки': ['Покраска', 'Укрывка', 'Грунт-краска', 'Дефектовка', 'Грунт', 'Финиш'],
    'Распаковка': {},
    'Уборка': {}
};
const stairsStages = {
    'Уголки': ['Отбивка', 'Монтаж'],
    'Боковины': ['Штукатурка', 'Шлифовка', 'Грунт', 'Шпатлевка', 'Шлифовка_2'],
    'Откосы': ['Штукатурка', 'Шлифовка', 'Грунт', 'Шпатлевка', 'Шлифовка_2'],
    'Стены': ['Штукатурка', 'Замазки', 'Шлифовка'],
    'Очистка': {},
    'Укрывка': {},
    'Потолки': ['Покраска', 'Укрывка'],
    'Покраска Стен': ['Грунт-Краска', 'Дефектовка', 'Шкурка', 'Грунт', 'Финиш'],
    'Распаковка': {},
    'Уборка': {}
};
const balconyStages = {
    'Штукатурка': {},
    'Шпатлёвка': {},
    'Укрывка': {},
    'Покраска': {},
    'Распаковка': {},
    'Уборка': {}
};

// Состояние раскрытия этажей
const floorStates = {};

// Инициализация сотрудников
let employees = [
    { name: 'Магарам', floors: [1, 2], advances: [{ date: '01.03.2025', amount: 5000 }], earnings: 20000, accessLevel: 'yes' },
    { name: 'Хаким', floors: [3], advances: [{ date: '02.03.2025', amount: 3000 }], earnings: 15000, accessLevel: 'no' },
    { name: 'Зубайр', floors: [4], advances: [], earnings: 10000, accessLevel: 'no' },
    { name: 'Абдужилил', floors: [5], advances: [{ date: '03.03.2025', amount: 4000 }], earnings: 18000, accessLevel: 'yes' },
    { name: 'Эмар', floors: [6], advances: [], earnings: 12000, accessLevel: 'no' }
];

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        const data = await response.json();
        employees = data;
        console.log('Employees loaded:', employees);
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

loadEmployees();

async function loadWorks(podjezd) {
    console.log(`Loading works for ${podjezd}`);
    document.querySelectorAll('.podjezd-filter button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`.podjezd-filter button[data-podjezd="${podjezd}"]`);
    if (activeButton) activeButton.classList.add('active');

    // Загружаем данные с сервера
    const response = await fetch(`/api/works/${podjezd}`);
    console.log(`Fetch response status: ${response.status}`);
    const worksData = await response.json();
    console.log('Works data received:', worksData);

    // Преобразуем данные в удобный формат
    const data = {};
    worksData.forEach(work => {
        if (!data[work.podjezd]) data[work.podjezd] = {};
        if (!data[work.podjezd][work.floor]) data[work.podjezd][work.floor] = {};
        data[work.podjezd][work.floor][work.type] = {
            team: work.team,
            ...work.stages
        };
    });
    console.log('Processed data structure:', data);

    const renderTable = (containerId, stages, type) => {
        console.log(`Rendering table for ${containerId} with type ${type}`);
        const table = document.getElementById(containerId);
        if (!table) {
            console.error(`Table with ID ${containerId} not found`);
            return;
        }

        // Добавляем кнопку сворачивания/раскрытия
        const header = table.previousElementSibling;
        header.classList.add('table-header');
        let toggleBtn = header.querySelector('.toggle-table-btn');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-table-btn';
            toggleBtn.innerHTML = '⬇';
            toggleBtn.addEventListener('click', () => {
                const details = document.querySelectorAll(`#${containerId} .floor-details`);
                const anyOpen = Array.from(details).some(d => d.style.display === 'table-row');
                details.forEach(details => {
                    details.style.display = anyOpen ? 'none' : 'table-row';
                    details.classList.toggle('active', !anyOpen);
                    const floor = details.getAttribute('data-floor');
                    floorStates[`${podjezd}-${type}-${floor}`] = !anyOpen;
                });
                toggleBtn.style.animation = 'rotate180 0.5s ease';
                setTimeout(() => toggleBtn.style.animation = '', 500);
                toggleBtn.innerHTML = anyOpen ? '⬇' : '⬆';
            });
            header.appendChild(toggleBtn);
        }

        let html = `
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>Этаж</th>
                        <th>Ответственные</th>
                        <th>Прогресс</th>
                        <th>Сумма весов</th>
                        <th>Объём</th>
                        <th>Финансы</th>
                    </tr>
                </thead>
                <tbody>
        `;
        floors.forEach(floor => {
            const floorData = data[podjezd]?.[floor]?.[type] || {};
            console.log(`Rendering floor ${floor} for ${type} in ${podjezd}:`, floorData);
            let totalVolume = 0, totalWeight = 0, progress = 0, plasterVolume = 0, puttyVolume = 0, totalEarnings = 0;
            const floorTeam = floorData.team || [];

            let stagesHtml = '';
            for (const stage in stages) {
                const subStages = stages[stage];
                console.log(`Processing stage ${stage} for ${type} on floor ${floor}:`, subStages);
                const stageData = floorData[stage] || (Object.keys(subStages).length ? {} : { volume: 0, state: 'notStarted', weight: 0, rate: calculateDefaultRate(stage), team: floorTeam });
                let stageProgress = 0;

                let subStageHtml = '';
                if (Object.keys(subStages).length) {
                    subStageHtml = `
                        <table class="substage-table">
                            <thead>
                                <tr>
                                    <th>Подэтап</th>
                                    <th>Объём</th>
                                    <th>Статус</th>
                                    <th>Вес</th>
                                    <th>Расценка</th>
                                    <th>Ответственные</th>
                                    <th>Прибыль</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subStages.map(subStage => {
                                    const w = stageData[subStage] || { volume: 0, state: 'notStarted', weight: 0, rate: calculateDefaultRate(subStage), team: floorTeam };
                                    totalVolume += w.volume || 0;
                                    totalWeight += w.weight || 0;
                                    plasterVolume += (subStage === 'Штукатурка' ? w.volume : 0) || 0;
                                    puttyVolume += (subStage === 'Шпатлевка' ? w.volume : 0) || 0;
                                    const subProgress = (w.weight || 0) * (w.state === 'checked' || w.state === 'skipped' ? 1 : w.state === 'inProgress' ? 0.5 : 0);
                                    progress += subProgress;
                                    stageProgress += subProgress;
                                    const earnings = w.volume ? w.volume * w.rate : 0;
                                    totalEarnings += earnings;
                                    return `
                                        <tr>
                                            <td data-label="Подэтап">${subStage}</td>
                                            <td data-label="Объём"><input type="number" value="${w.volume || 0}" onchange="updateVolume('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', this.value)"></td>
                                            <td data-label="Статус">
                                                <select class="status-select ${w.state}" onchange="updateStatus('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', this.value)">
                                                    <option value="notStarted" ${w.state === 'notStarted' ? 'selected' : ''}>Не начато</option>
                                                    <option value="inProgress" ${w.state === 'inProgress' ? 'selected' : ''}>В процессе</option>
                                                    <option value="checked" ${w.state === 'checked' ? 'selected' : ''}>Готово</option>
                                                    <option value="skipped" ${w.state === 'skipped' ? 'selected' : ''}>Пропущен</option>
                                                </select>
                                            </td>
                                            <td data-label="Вес"><input type="number" value="${w.weight || 0}" onchange="updateWeight('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', this.value)"></td>
                                            <td data-label="Расценка"><input type="number" value="${w.rate || calculateDefaultRate(subStage)}" onchange="updateRate('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', this.value)"></td>
                                            <td data-label="Ответственные">
                                                <div class="team-container" data-substage="${stage}-${subStage}">
                                                    ${w.team.map(name => `
                                                        <span class="team-tag">
                                                            ${name}
                                                            <button class="remove-btn" onclick="removeSubstageTeam('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', '${name}')"></button>
                                                        </span>
                                                    `).join('')}
                                                    <button class="add-team-btn" onclick="toggleSubstageTeamDropdown(event, '${stage}', '${subStage}')"></button>
                                                    <div class="team-dropdown" id="substage-team-dropdown-${stage}-${subStage}">
                                                        ${employees.map(e => `<button onclick="addSubstageTeam('${podjezd}', '${floor}', '${type}', '${stage}', '${subStage}', '${e.name}')">${e.name}</button>`).join('')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Прибыль"><span class="financial-tag">${earnings.toFixed(2)} руб.</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    const w = stageData || { volume: 0, state: 'notStarted', weight: 0, rate: calculateDefaultRate(stage), team: floorTeam };
                    totalVolume += w.volume || 0;
                    totalWeight += w.weight || 0;
                    plasterVolume += (stage === 'Штукатурка' ? w.volume : 0) || 0;
                    puttyVolume += (stage === 'Шпатлевка' ? w.volume : 0) || 0;
                    const subProgress = (w.weight || 0) * (w.state === 'checked' || w.state === 'skipped' ? 1 : w.state === 'inProgress' ? 0.5 : 0);
                    progress += subProgress;
                    stageProgress += subProgress;
                    const earnings = w.volume ? w.volume * w.rate : 0;
                    totalEarnings += earnings;
                    subStageHtml = `
                        <table class="substage-table">
                            <thead>
                                <tr>
                                    <th>Этап</th>
                                    <th>Объём</th>
                                    <th>Статус</th>
                                    <th>Вес</th>
                                    <th>Расценка</th>
                                    <th>Ответственные</th>
                                    <th>Прибыль</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td data-label="Этап">${stage}</td>
                                    <td data-label="Объём"><input type="number" value="${w.volume || 0}" onchange="updateVolume('${podjezd}', '${floor}', '${type}', '${stage}', '', this.value)"></td>
                                    <td data-label="Статус">
                                        <select class="status-select ${w.state}" onchange="updateStatus('${podjezd}', '${floor}', '${type}', '${stage}', '', this.value)">
                                            <option value="notStarted" ${w.state === 'notStarted' ? 'selected' : ''}>Не начато</option>
                                            <option value="inProgress" ${w.state === 'inProgress' ? 'selected' : ''}>В процессе</option>
                                            <option value="checked" ${w.state === 'checked' ? 'selected' : ''}>Готово</option>
                                            <option value="skipped" ${w.state === 'skipped' ? 'selected' : ''}>Пропущен</option>
                                        </select>
                                    </td>
                                    <td data-label="Вес"><input type="number" value="${w.weight || 0}" onchange="updateWeight('${podjezd}', '${floor}', '${type}', '${stage}', '', this.value)"></td>
                                    <td data-label="Расценка"><input type="number" value="${w.rate || calculateDefaultRate(stage)}" onchange="updateRate('${podjezd}', '${floor}', '${type}', '${stage}', '', this.value)"></td>
                                    <td data-label="Ответственные">
                                        <div class="team-container" data-substage="${stage}">
                                            ${w.team.map(name => `
                                                <span class="team-tag">
                                                    ${name}
                                                    <button class="remove-btn" onclick="removeSubstageTeam('${podjezd}', '${floor}', '${type}', '${stage}', '', '${name}')"></button>
                                                </span>
                                            `).join('')}
                                            <button class="add-team-btn" onclick="toggleSubstageTeamDropdown(event, '${stage}', '')"></button>
                                            <div class="team-dropdown" id="substage-team-dropdown-${stage}">
                                                ${employees.map(e => `<button onclick="addSubstageTeam('${podjezd}', '${floor}', '${type}', '${stage}', '', '${e.name}')">${e.name}</button>`).join('')}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Прибыль"><span class="financial-tag">${earnings.toFixed(2)} руб.</span></td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                }

                stagesHtml += `
                    <div class="stage">${stage} (${((stageProgress / (subStages.length || 1)) * 100).toFixed(1)}%)</div>
                    ${subStageHtml}
                `;
            }

            const weightColor = totalWeight < 100 ? '#d4a017' : totalWeight > 100 ? '#e63946' : '#000';
            const floorKey = `${podjezd}-${type}-${floor}`;
            const isOpen = floorStates[floorKey] || false;
            html += `
                <tr class="floor-row" data-floor="${floor}">
                    <td><span class="floor-number">${floor}</span></td>
                    <td>
                        <div class="team-container" data-floor="${floor}">
                            ${floorTeam.map(name => `
                                <span class="team-tag">
                                    ${name}
                                    <button class="remove-btn" onclick="removeTeam('${podjezd}', '${floor}', '${type}', '${name}')"></button>
                                </span>
                            `).join('')}
                            <button class="add-team-btn" onclick="toggleTeamDropdown(event, '${floor}')"></button>
                            <div class="team-dropdown" id="team-dropdown-${floor}">
                                ${employees.map(e => `<button onclick="addTeam('${podjezd}', '${floor}', '${type}', '${e.name}')">${e.name}</button>`).join('')}
                            </div>
                        </div>
                    </td>
                    <td><span class="data-tag progress">${progress.toFixed(1)}%</span></td>
                    <td>
                        <span class="data-tag weight">${totalWeight}%</span> <button class="copy-weight-btn" onclick="copyWeights('${podjezd}', '${floor}', '${type}')">⚖️</button>
                    </td>
                    <td>
                        <div class="volume-container">
                            <span class="volume-tag plaster">🛠️ ${plasterVolume} м²</span>
                            <span class="volume-tag putty">🎨 ${puttyVolume} м²</span>
                            <span class="volume-tag total">🎨 ${totalVolume} м²</span>
                        </div>
                    </td>
                    <td><span class="financial-tag">${totalEarnings.toFixed(2)} руб.</span></td>
                </tr>
                <tr class="floor-details" style="display: ${isOpen ? 'table-row' : 'none'};" data-floor="${floor}">
                    <td colspan="6">${stagesHtml}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        table.innerHTML = html;
        console.log(`Table ${containerId} rendered with HTML:`, html);

        // Обновляем иконку кнопки в зависимости от состояния
        const details = document.querySelectorAll(`#${containerId} .floor-details`);
        const anyOpen = Array.from(details).some(d => d.style.display === 'table-row');
        toggleBtn.innerHTML = anyOpen ? '⬆' : '⬇';

        // Обработчики кликов на строку
        document.querySelectorAll(`#${containerId} .floor-row`).forEach(row => {
            const floor = row.getAttribute('data-floor');
            const floorKey = `${podjezd}-${type}-${floor}`;
            const details = row.nextElementSibling;
            const isOpen = floorStates[floorKey] || false;
            if (isOpen) details.classList.add('active');

            row.addEventListener('click', (e) => {
                if (!e.target.closest('.team-container') && !e.target.closest('.floor-actions') && !e.target.closest('.copy-weight-btn')) {
                    const details = row.nextElementSibling;
                    const isOpen = details.style.display === 'table-row';
                    details.style.display = isOpen ? 'none' : 'table-row';
                    if (!isOpen) details.classList.add('active');
                    else details.classList.remove('active');
                    floorStates[floorKey] = !isOpen;
                    console.log(`Updated floor state for ${floorKey}: ${floorStates[floorKey]}`);

                    const anyOpen = Array.from(document.querySelectorAll(`#${containerId} .floor-details`)).some(d => d.style.display === 'table-row');
                    toggleBtn.innerHTML = anyOpen ? '⬆' : '⬇';
                    toggleBtn.style.animation = 'rotate180 0.5s ease';
                    setTimeout(() => toggleBtn.style.animation = '', 500);
                }
            });
        });
    };

    console.log('Rendering tables for Mop, Stairs, Balcony');
    renderTable('mop-table', mopStages, 'mop');
    renderTable('stairs-table', stairsStages, 'stairs');
    renderTable('balcony-table', balconyStages, 'balcony');
}

function toggleTeamDropdown(event, floor) {
    event.stopPropagation();
    const dropdown = document.getElementById(`team-dropdown-${floor}`);
    const isOpen = dropdown.style.display === 'block';
    document.querySelectorAll('.team-dropdown').forEach(d => d.style.display = 'none');
    if (!isOpen) {
        dropdown.style.display = 'block';
        const btn = event.target;
        btn.style.animation = 'rotate180 0.5s ease';
        setTimeout(() => btn.style.animation = '', 500);
    }
}

async function addTeam(podjezd, floor, type, name) {
    console.log(`Adding team ${name} to ${podjezd}, floor ${floor}, type ${type}`);
    const container = document.querySelector(`.team-container[data-floor="${floor}"]`);
    const existingTags = Array.from(container.querySelectorAll('.team-tag')).map(tag => tag.textContent.trim().replace('X', ''));
    if (!existingTags.includes(name)) {
        const response = await fetch(`/api/works/${podjezd}`);
        const worksData = await response.json();
        const floorData = worksData.find(w => w.floor === floor && w.type === type);
        const team = [...(floorData.team || []), name];

        await fetch('/api/works/update-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ podjezd, floor, type, team }),
        });

        container.classList.add('save-success');
        setTimeout(() => container.classList.remove('save-success'), 500);
        document.querySelectorAll('.team-dropdown').forEach(d => d.style.display = 'none');
        loadWorks(podjezd);
    }
}

async function removeTeam(podjezd, floor, type, name) {
    const container = document.querySelector(`.team-container[data-floor="${floor}"]`);
    const response = await fetch(`/api/works/${podjezd}`);
    const worksData = await response.json();
    const floorData = worksData.find(w => w.floor === floor && w.type === type);
    const team = (floorData.team || []).filter(n => n !== name);

    await fetch('/api/works/update-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, team }),
    });

    container.classList.add('save-success');
    setTimeout(() => container.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

function toggleSubstageTeamDropdown(event, stage, subStage) {
    event.stopPropagation();
    const dropdown = document.getElementById(`substage-team-dropdown-${stage}${subStage ? `-${subStage}` : ''}`);
    const isOpen = dropdown.style.display === 'block';
    document.querySelectorAll('.team-dropdown').forEach(d => d.style.display = 'none');
    if (!isOpen) {
        dropdown.style.display = 'block';
        const btn = event.target;
        btn.style.animation = 'rotate180 0.5s ease';
        setTimeout(() => btn.style.animation = '', 500);
    }
}

async function addSubstageTeam(podjezd, floor, type, stage, subStage, name) {
    console.log(`Adding substage team ${name} to ${podjezd}, floor ${floor}, type ${type}, stage ${stage}, subStage ${subStage}`);
    const container = document.querySelector(`.team-container[data-substage="${stage}${subStage ? `-${subStage}` : ''}"]`);
    const existingTags = Array.from(container.querySelectorAll('.team-tag')).map(tag => tag.textContent.trim().replace('X', ''));
    if (!existingTags.includes(name)) {
        const response = await fetch(`/api/works/${podjezd}`);
        const worksData = await response.json();
        const floorData = worksData.find(w => w.floor === floor && w.type === type);
        let team;
        if (subStage) {
            team = [...(floorData.stages[stage][subStage].team || []), name];
        } else {
            team = [...(floorData.stages[stage].team || []), name];
        }

        await fetch('/api/works/update-substage-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ podjezd, floor, type, stage, subStage, team }),
        });

        container.classList.add('save-success');
        setTimeout(() => container.classList.remove('save-success'), 500);
        document.querySelectorAll('.team-dropdown').forEach(d => d.style.display = 'none');
        loadWorks(podjezd);
    }
}

async function removeSubstageTeam(podjezd, floor, type, stage, subStage, name) {
    const container = document.querySelector(`.team-container[data-substage="${stage}${subStage ? `-${subStage}` : ''}"]`);
    const response = await fetch(`/api/works/${podjezd}`);
    const worksData = await response.json();
    const floorData = worksData.find(w => w.floor === floor && w.type === type);
    let team;
    if (subStage) {
        team = (floorData.stages[stage][subStage].team || []).filter(n => n !== name);
    } else {
        team = (floorData.stages[stage].team || []).filter(n => n !== name);
    }

    await fetch('/api/works/update-substage-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, stage, subStage, team }),
    });

    container.classList.add('save-success');
    setTimeout(() => container.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

async function updateVolume(podjezd, floor, type, stage, subStage, value) {
    const volume = parseInt(value) || 0;
    await fetch('/api/works/update-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, stage, subStage, volume }),
    });

    const td = document.querySelector(`.floor-row[data-floor="${floor}"] td:nth-child(5)`);
    td.classList.add('save-success');
    setTimeout(() => td.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

async function updateStatus(podjezd, floor, type, stage, subStage, value) {
    await fetch('/api/works/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, stage, subStage, state: value }),
    });

    const td = document.querySelector(`.floor-row[data-floor="${floor}"] td:nth-child(3)`);
    td.classList.add('save-success');
    setTimeout(() => td.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

async function updateWeight(podjezd, floor, type, stage, subStage, value) {
    const weight = parseInt(value) || 0;
    await fetch('/api/works/update-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, stage, subStage, weight }),
    });

    const td = document.querySelector(`.floor-row[data-floor="${floor}"] td:nth-child(4)`);
    td.classList.add('save-success');
    setTimeout(() => td.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

async function updateRate(podjezd, floor, type, stage, subStage, value) {
    const rate = parseInt(value) || 0;
    await fetch('/api/works/update-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type, stage, subStage, rate }),
    });

    const td = document.querySelector(`.floor-row[data-floor="${floor}"] td:nth-child(6)`);
    td.classList.add('save-success');
    setTimeout(() => td.classList.remove('save-success'), 500);
    loadWorks(podjezd);
}

async function copyWeights(podjezd, floor, type) {
    console.log(`Copying weights for ${podjezd}, floor ${floor}, type ${type}`);
    await fetch('/api/works/copy-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podjezd, floor, type }),
    });

    const btn = document.querySelector(`.floor-row[data-floor="${floor}"] .copy-weight-btn`);
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 500);
    loadWorks(podjezd);
}

function calculateDefaultRate(stageOrSubStage) {
    if (stageOrSubStage === 'Штукатурка') return 300;
    if (stageOrSubStage === 'Шпатлевка') return 200;
    if (stageOrSubStage === 'Монтаж уголков' || stageOrSubStage === 'Отбивка' || stageOrSubStage === 'Монтаж') return 200;
    return 0;
}