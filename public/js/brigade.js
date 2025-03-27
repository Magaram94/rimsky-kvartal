(function () {
    let employees = [];

    document.addEventListener('DOMContentLoaded', () => {
        loadEmployees();
    });

    function loadEmployees() {
        fetch('/api/employees')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                employees = data;
                renderEmployees();
            })
            .catch(err => {
                console.error('Ошибка загрузки сотрудников:', err);
                document.getElementById('employees-body').innerHTML = '<tr><td colspan="7">Ошибка загрузки данных</td></tr>';
            });
    }

    function renderEmployees() {
        const tbody = document.getElementById('employees-body');
        if (!tbody) {
            console.error('Элемент с ID "employees-body" не найден в DOM.');
            return;
        }
        tbody.innerHTML = '';
        employees.forEach((employee, index) => {
            const totalAdvances = employee.advances.reduce((sum, a) => sum + a.amount, 0);
            const profit = employee.earnings - totalAdvances;

            const row = document.createElement('tr');
            row.classList.add('employee-row');
            row.innerHTML = `
                <td>${employee.fio}</td>
                <td>${employee.floors.join(', ')}</td>
                <td>${totalAdvances.toFixed(2)} ₽</td>
                <td>${employee.earnings.toFixed(2)} ₽</td>
                <td>${profit.toFixed(2)} ₽</td>
                <td class="access-level">
                    <select onchange="updateAccessLevel('${employee._id}', this.value)">
                        <option value="yes" ${employee.accessLevel === 'yes' ? 'selected' : ''}>Да</option>
                        <option value="no" ${employee.accessLevel === 'no' ? 'selected' : ''}>Нет</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn" onclick="openAddAdvanceModal('${employee._id}', event)">💰 Аванс</button>
                    <button class="action-btn" onclick="openEditModal('${employee._id}', event)">✏️ Редактировать</button>
                </td>
            `;
            const detailsRow = document.createElement('tr');
            detailsRow.innerHTML = `
                <td colspan="7">
                    <div class="employee-details" id="details-${index}">
                        <div class="period-filter">
                            <input type="date" id="period-start-${index}" onchange="filterPeriod(${index})">
                            <input type="date" id="period-end-${index}" onchange="filterPeriod(${index})">
                        </div>
                        <div id="advances-${index}"></div>
                        <canvas id="advance-chart-${index}" class="advance-graph"></canvas>
                        <div class="advance-actions">
                            <button onclick="openAddAdvanceModal('${employee._id}')">Добавить аванс</button>
                        </div>
                    </div>
                </td>
            `;
            row.addEventListener('click', () => toggleRow(index));
            tbody.appendChild(row);
            tbody.appendChild(detailsRow);
        });
    }

    function toggleRow(index) {
        const details = document.getElementById(`details-${index}`);
        if (!details) return;
        details.classList.toggle('active');
        if (details.classList.contains('active')) {
            renderAdvances(index);
            renderChart(index);
        }
    }

    function filterPeriod(index) {
        renderAdvances(index);
        renderChart(index);
    }

    let charts = {};
    function renderChart(index) {
        const canvas = document.getElementById(`advance-chart-${index}`);
        if (canvas && !charts[index]) {
            const filteredAdvances = filterAdvances(index, employees[index].advances);
            charts[index] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: filteredAdvances.map(a => a.date),
                    datasets: [{
                        label: 'Авансы',
                        data: filteredAdvances.map(a => a.amount),
                        borderColor: '#4a90e2',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => `Дата: ${context.label}, Сумма: ${context.raw} ₽`
                            }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Дата' } },
                        y: { title: { display: true, text: 'Сумма (₽)' } }
                    }
                }
            });
        } else if (canvas && charts[index]) {
            const filteredAdvances = filterAdvances(index, employees[index].advances);
            charts[index].data.labels = filteredAdvances.map(a => a.date);
            charts[index].data.datasets[0].data = filteredAdvances.map(a => a.amount);
            charts[index].update();
        }
    }

    function filterAdvances(index, advances) {
        const start = document.getElementById(`period-start-${index}`).value;
        const end = document.getElementById(`period-end-${index}`).value;
        if (!start || !end) return advances;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return advances.filter(advance => {
            const advanceDate = new Date(advance.date.split('.').reverse().join('-'));
            return advanceDate >= startDate && advanceDate <= endDate;
        });
    }

    function renderAdvances(index) {
        const div = document.getElementById(`advances-${index}`);
        if (!div) return;
        const filteredAdvances = filterAdvances(index, employees[index].advances);
        div.innerHTML = filteredAdvances.map(advance => `
            <span class="data-tag">${advance.amount.toFixed(2)} ₽</span>
            <span class="data-tag">${advance.date}</span>
        `).join('');
    }

    window.openAddAdvanceModal = function (employeeId, event) {
        if (event) event.stopPropagation();
        const employee = employees.find(e => e._id === employeeId);
        const modal = document.createElement('div');
        modal.classList.add('modal-overlay');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Добавить аванс для ${employee.fio}</h3>
                <input type="date" id="advance-date" value="${new Date().toISOString().split('T')[0]}">
                <input type="number" id="advance-amount" placeholder="Сумма (₽)">
                <div class="buttons">
                    <button class="save" onclick="addAdvance('${employee._id}')">Сохранить</button>
                    <button class="cancel" onclick="this.parentElement.parentElement.parentElement.remove()">Отмена</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.addAdvance = function (employeeId) {
        const date = document.getElementById('advance-date').value;
        const amount = document.getElementById('advance-amount').value;
        fetch('/api/employees/add-advance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, date, amount })
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const employee = employees.find(e => e._id === employeeId);
                employee.advances.push({ date, amount: parseFloat(amount) });
                renderEmployees();
                document.querySelector('.modal-overlay').remove();
            })
            .catch(err => console.error('Ошибка добавления аванса:', err));
    };

    window.openEditModal = function (employeeId, event) {
        if (event) event.stopPropagation();
        const employee = employees.find(e => e._id === employeeId);
        const modal = document.createElement('div');
        modal.classList.add('modal-overlay');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Редактировать сотрудника</h3>
                <input type="text" id="edit-fio" value="${employee.fio}">
                <input type="text" id="edit-floors" value="${employee.floors.join(',')}">
                <select id="edit-access">
                    <option value="yes" ${employee.accessLevel === 'yes' ? 'selected' : ''}>Да</option>
                    <option value="no" ${employee.accessLevel === 'no' ? 'selected' : ''}>Нет</option>
                </select>
                <div class="buttons">
                    <button class="save" onclick="updateEmployee('${employee._id}')">Сохранить</button>
                    <button class="cancel" onclick="this.parentElement.parentElement.parentElement.remove()">Отмена</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.updateEmployee = function (employeeId) {
        const fio = document.getElementById('edit-fio').value;
        const floors = document.getElementById('edit-floors').value.split(',').map(Number);
        const accessLevel = document.getElementById('edit-access').value;
        fetch('/api/employees/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, fio, floors, accessLevel })
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const employee = employees.find(e => e._id === employeeId);
                employee.fio = fio;
                employee.floors = floors;
                employee.accessLevel = accessLevel;
                renderEmployees();
                document.querySelector('.modal-overlay').remove();
            })
            .catch(err => console.error('Ошибка обновления сотрудника:', err));
    };

    window.updateAccessLevel = function (employeeId, accessLevel) {
        fetch('/api/employees/update-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, accessLevel })
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const employee = employees.find(e => e._id === employeeId);
                employee.accessLevel = accessLevel;
                renderEmployees();
            })
            .catch(err => console.error('Ошибка обновления уровня доступа:', err));
    };
})();