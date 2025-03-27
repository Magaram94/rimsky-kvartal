function fetchData(url) {
    return fetch(url, { method: 'GET', credentials: 'include' })
        .then(response => response.json())
        .catch(err => console.error(`Ошибка загрузки ${url}:`, err));
}

function saveData(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(response => response.json())
    .catch(err => console.error(`Ошибка сохранения ${url}:`, err));
}