document.addEventListener('DOMContentLoaded', () => {
    // Показать секцию по ID
    window.showSection = function(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
    };

    // Показать вкладку "Работы" по умолчанию
    showSection('works');

    // Обновление имени пользователя
    fetch('/auth/user')
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                document.getElementById('user-name').textContent = data.user.username;
            }
        })
        .catch(err => console.error('Error fetching user:', err));

    // Показать/скрыть выпадающее меню пользователя
    window.toggleUserMenu = function() {
        const dropdown = document.getElementById('user-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    };

    // Выход
    window.logout = function() {
        fetch('/auth/logout', { method: 'POST' })
            .then(() => window.location.href = '/')
            .catch(err => console.error('Error logging out:', err));
    };

    // Загрузка данных для "Главная"
    async function loadSummary() {
        try {
            const response = await fetch('/api/summary');
            const summaries = await response.json();
            const tbody = document.getElementById('summary-body');
            tbody.innerHTML = summaries.map(summary => `
                <tr>
                    <td>${summary.podjezd}</td>
                    <td>${summary.totalProgress}%</td>
                    <td>${summary.totalVolume} м²</td>
                    <td>${summary.totalEarnings} руб.</td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading summary:', err);
        }
    }

    // Загрузка данных для "Склад"
    async function loadWarehouse() {
        try {
            const response = await fetch('/api/warehouse');
            const items = await response.json();
            const tbody = document.getElementById('warehouse-body');
            tbody.innerHTML = items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.dateReceived}</td>
                    <td>${item.status}</td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading warehouse:', err);
        }
    }

    // Вызов функций загрузки данных
    loadSummary();
    loadWarehouse();
});