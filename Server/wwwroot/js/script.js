//
// Анимация на А тагове
//
document.querySelectorAll('a').forEach(link => {
    let isAnimating = false;
    let shouldExit = false;

    link.addEventListener('mouseenter', () => {
        if (isAnimating) return;
        isAnimating = true;
        link.classList.remove('anim-out');
        link.classList.add('anim-in');
        setTimeout(() => {
            isAnimating = false;
            if (shouldExit) triggerExit();
        }, 500);
    });

    link.addEventListener('mouseleave', () => {
        if (isAnimating) {
            shouldExit = true;
        } else {
            triggerExit();
        }
    });

    function triggerExit() {
        isAnimating = true;
        shouldExit = false;
        link.classList.remove('anim-in');
        link.classList.add('anim-out');
        setTimeout(() => {
            isAnimating = false;
            link.classList.remove('anim-out');
        }, 500);
    }
});

const loginBtn = document.getElementById('login-redirect')
const regBtn = document.getElementById('register-redirect')
const prmBtn = document.getElementById('btn-primary')
const moreBtn = document.getElementById('btn-secondary')
//
// Бутоп Вход
//
loginBtn.addEventListener('click', async function (event) {
    
    event.preventDefault();
   
    const token = localStorage.getItem('token')
    if (token) {
        try {
            // 2. Правим заявката
            const response = await fetch('/api/Auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            }); // <-- ВАЖНО: FETCH ПРИКЛЮЧВА ТУК със скоба и точка и запетая!

            // 3. ЧАК СЛЕД ТОВА проверяваме отговора
            if (!response.ok) {
                alert('Вашата сесия е изтекла или невалидна! Ще бъдете пренасочени към формата за вход!');
                console.log("Токенът изтече или е невалиден!");
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return; // Спираме изпълнението надолу
            }


        } catch (error) {
            window.location.href = 'login.html';
        }
    }

    
});
///
// Бутон Регастрация
//
regBtn.addEventListener('click', function(event){
    event.preventDefault();
    window.location.href ='register.html';
});
//
// Бутон Главен
//
prmBtn.addEventListener('click', async function (event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // 2. Правим заявката
            const response = await fetch('/api/Auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            }); // <-- ВАЖНО: FETCH ПРИКЛЮЧВА ТУК със скоба и точка и запетая!

            // 3. ЧАК СЛЕД ТОВА проверяваме отговора
            if (!response.ok) {
                alert('Вашата сесия е изтекла или невалидна! Ще бъдете пренасочени към формата за вход!');
                console.log("Токенът изтече или е невалиден!");
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return; // Спираме изпълнението надолу
            }
            else {
                // ЕТО ТОВА ЛИПСВАШЕ: 
                // Ако изобщо няма токен, прати го да се логва!
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            window.location.href = 'login.html';
        }
    }
    else {
        window.location.href = 'login.html';
    }
});
//
//
//
moreBtn.addEventListener('click', async function (event) {
    event.preventDefault();
    window.location.href = '#features'
});