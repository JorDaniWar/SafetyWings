// Търсим формата по ID
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // КРИТИЧНО: Спираме презареждането на страницата

    // Взимаме данните от полетата
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log("Опит за вход на:", username);

    try {
        const response = await fetch('http://localhost:7000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } else {
            alert("Грешно потребителско име или парола!");
        }
    } catch (err) {
        console.error("Грешка при връзка:", err);
    }
});