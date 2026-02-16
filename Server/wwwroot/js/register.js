const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // КРИТИЧНО: Спираме презареждането на страницата

    // Взимаме данните от полетата
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;


    if (password !== confirmPassword) {
        alert("Паролите не съвпадат! Моля, опитайте отново.");
        return;
    }

    console.log("Опит за регистрация на:", username);

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, firstName, lastName,password })
        });

        if (response.ok) {
            alert("Регистрацията беше успешна! Можете да влезете с новия си акаунт.");
            window.location.href = 'index.html';
        } else if (response.status === 400) {
            alert("Потребителското име вече съществува! Моля, изберете друго.");
        }
    } catch (err) {
        console.error("Грешка при връзка:", err);
    }
});