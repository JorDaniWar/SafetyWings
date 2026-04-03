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
    loadHistory(); 

    // ==========================================
    // 3. ДОБАВЯНЕ НА НОВ ЗАПИС (POST Заявка)
    // ==========================================
    const addLogForm = document.getElementById('addLogForm');
    const formMessage = document.getElementById('formMessage');
    
    if (addLogForm) {
        addLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("СУПЕР! Формата се изпраща!");

            const token = localStorage.getItem('token');
            if (!token) {
                showMessage("Грешка: Не сте влезли в профила си!", "error");
                return;
            }

            // 1. Намираме елементите (Оправено: cortisol с малко 'c')
            const flightInput = document.getElementById('flightNumber');
            const pulseInput = document.getElementById('pulse');
            const oxygenInput = document.getElementById('oxygen');
            const tempInput = document.getElementById('temperature');
            const cortInput = document.getElementById('cortisol'); 

            // 2. Проверка за липсващи полета
            if (!flightInput || !pulseInput || !oxygenInput || !tempInput || !cortInput) { 
                alert("Грешка: Липсва поле в HTML-а!"); 
                return; 
            }

            // 3. Опаковаме данните с точните имена, които C# очаква, като ТЕКСТ (string)
            const logData = {
                flightID: flightInput.value.trim(),
                heartRate: pulseInput.value.trim(),
                oxygenLevel: oxygenInput.value.trim(),
                temperature: tempInput.value.trim(),
                stressIndex: cortInput.value.trim()
            };

            // 4. ИЗПРАЩАМЕ КЪМ C# (Това липсваше!)
            try {
                const response = await fetch('/api/Health/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(logData)
                });

                if (response.ok) {
                    showMessage("Успешен запис на полета! 🚀", "success");
                    addLogForm.reset(); // Изчистваме полетата
                    loadHistory();      // Зареждаме таблицата наново
                } else {
                    showMessage("Грешка при запис! Статус: " + response.status, "error");
                }
            } catch (error) {
                console.error("Мрежова грешка:", error);
                showMessage("Сървърът не отговаря.", "error");
            }
        });
    }

    function showMessage(text, type) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.style.color = type === 'success' ? '#4CAF50' : '#f44336';
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
    const tableBody = document.getElementById('flights-data'); 
    if (!tableBody) return;

    console.log("Ето това пристигна от C#:", logs); // <--- ДОБАВИ ТОЗИ РЕД
    tableBody.innerHTML = ''; 

    if (logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Няма намерени полети.</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        
        // C# връща 'timestamp', а не 'date'
        const dateString = log.timestamp ? new Date(log.timestamp).toLocaleString('bg-BG') : '-';
        const flightDisplay = log.flightID || log.flightId || log.FlightID || '-';

        row.innerHTML = `
            <td style="text-align:center;">✅</td>
            <td>${flightDisplay || '-'}</td>
            <td>${dateString}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// 5. ИЗХОД И АНИМАЦИИ
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