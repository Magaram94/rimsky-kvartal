function login() {
    const pin = document.getElementById('pin').value;
    const error = document.getElementById('error');

    fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.cookie = `pin=${pin}; path=/`;
            switch (data.role) {
                case 'admin':
                    window.location.href = '/admin.html';
                    break;
                case 'foreman':
                    window.location.href = '/foreman.html';
                    break;
                case 'employee':
                    window.location.href = '/employee.html';
                    break;
                default:
                    error.textContent = 'Неизвестная роль';
                    error.style.display = 'block';
            }
        } else {
            error.textContent = data.message || 'Неверный пин-код';
            error.style.display = 'block';
        }
    })
    .catch(err => {
        error.textContent = 'Ошибка сервера: ' + err.message;
        error.style.display = 'block';
        console.error(err);
    });
}