document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. САЙДБАР И НАВИГАЦИЯ
    // ==========================================
    const sidebarBtn = document.querySelector('.sidebar-button');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebarBtn && sidebar && overlay) {
        sidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        const navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. ЗАРЕЖДАНЕ НА ИСТОРИЯТА (Последни полети)
    // ==========================================
    loadHistory(); // Извикваме функцията веднага при отваряне на страницата

    // ==========================================
    // 3. ДОБАВЯНЕ НА НОВ ЗАПИС (POST Заявка)
    // ==========================================
    const addLogForm = document.getElementById('addLogForm');
    const formMessage = document.getElementById('formMessage');
    
    if (addLogForm) {
        addLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("СУПЕР! Бутонът работи и формата е хваната!");

            const token = localStorage.getItem('token');
            if (!token) {
                showMessage("Грешка: Не сте влезли в профила си!", "error");
                return;
            }

            // 1. Намираме всички полета едно по едно
            // 1. Намираме елементите
            const flightInput = document.getElementById('flightNumber');
            const pulseInput = document.getElementById('pulse');
            const oxygenInput = document.getElementById('oxygen');
            const tempInput = document.getElementById('temperature');
            const cortInput = document.getElementById('Cortisol');

            // 2. БРОНИРАНАТА ПРОВЕРКА: Ако някое липсва, вади голям прозорец (alert)!
            if (!flightInput) { alert("Грешка: Не намирам поле с id='flightNumber'"); return; }
            if (!pulseInput) { alert("Грешка: Не намирам поле с id='pulse'"); return; }
            if (!oxygenInput) { alert("Грешка: Не намирам поле с id='oxygen'"); return; }
            if (!tempInput) { alert("Грешка: Не намирам поле с id='temperature'"); return; }
            if (!cortInput) { alert("Грешка: Не намирам поле с id='Cortisol'"); return; }

            // 3. Ако всичко е намерено, чак тогава четем стойностите
            const logData = {
                flightNumber: flightInput.value.trim(),
                pulse: parseInt(pulseInput.value, 10),
                oxygenSaturation: parseInt(oxygenInput.value, 10),
                temperature: parseFloat(tempInput.value),
                cortisol: parseFloat(cortInput.value)
            };
        });
    }

    function showMessage(text, type) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.style.color = type === 'success' ? '#4CAF50' : (type === 'error' ? '#f44336' : '#ff9800');
        setTimeout(() => formMessage.textContent = "", 5000);
    }
});

// ==========================================
// 4. ФУНКЦИИ ЗА ИЗТЕГЛЯНЕ И РИСУВАНЕ НА ТАБЛИЦАТА
// ==========================================
async function loadHistory() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/Health/history', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const logs = await response.json();
            renderTable(logs);
        }
    } catch (error) {
        console.error("Грешка при изтегляне на историята:", error);
    }
}

function renderTable(logs) {
    const tableBody = document.getElementById('flights-data'); // ID-то от твоя HTML
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Изчистваме надписа "Зареждане на данни... ⏳"

    if (logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Няма намерени полети.</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        
        // Съобразяваме се с 3-те колони от твоя HTML: Статус, Номер, Дата
        // Ако C# моделът ти няма "Date", сложихме Date.now() като резерва
        const dateString = log.date ? new Date(log.date).toLocaleString('bg-BG') : new Date().toLocaleDateString('bg-BG');

        row.innerHTML = `
            <td style="text-align:center;">✅</td>
            <td>${log.flightNumber || '-'}</td>
            <td>${dateString}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// 5. ИЗХОД И АНИМАЦИИ (Остават непокътнати)
// ==========================================
function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

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