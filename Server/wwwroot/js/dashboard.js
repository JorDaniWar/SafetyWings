const token = localStorage.getItem('token');
if (!token) {
    alert("Грешка: Не сте влезли в профила си! Ще бъдете пренасочени към началната страница.");
    window.location.href = 'index.html';
}
// ==========================================
    // 1. САЙДБАР И НАВИГАЦИЯ
    // ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
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
    loadAllLogs();

    // ==========================================
    // 3. ДОБАВЯНЕ НА НОВ ЗАПИС (POST Заявка)
    // ==========================================
    const addLogForm = document.getElementById('addLogForm');
    const formMessage = document.getElementById('formMessage');
    
    if (addLogForm) {
        addLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Формата се изпраща!");

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
                alert("Грешка: Липсва поле при записа!"); 
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
                    loadAllLogs();     // Зареждаме и всички записи наново
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
    if (!token) return;

    try {
        const response = await fetch('/api/Health/history', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const historylogs = await response.json();
            renderHistoryTable(historylogs);
        }
    } catch (error) {
        console.error("Грешка при изтегляне на историята:", error);
    }
}
async function loadAllLogs() {
    if (!token) {
        alert("Грешка: Не сте влезли в профила си! Ще бъдете пренасочени към началната страница.");
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('/api/Health/all', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const allLogs = await response.json();
            renderAllLogsTable(allLogs);
        }
    } catch (error) {
        console.error("Грешка при изтегляне на всички записи:", error);
    }
}
function renderHistoryTable(historylogs) {
    const tableBody = document.getElementById('flights-data'); 
    if (!tableBody) return;

    tableBody.innerHTML = ''; 

    if (historylogs.length === 0) {
        // Променихме colspan на 4, защото имаме 4 колони
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Няма намерени полети.</td></tr>';
        return;
    }

    historylogs.forEach(log => {
        const row = document.createElement('tr');
        
        const dateString = log.timestamp ? new Date(log.timestamp).toLocaleString('bg-BG') : '-';
        const flightDisplay = log.flightID || log.flightId || log.FlightID || '-';
        
        // Гарантираме, че вземаме правилното ID
        const currentLogID = log.logID || log.logId;

        // БУТОНЪТ вече е правилно прибран в свое собствено <td>
        row.innerHTML = `
            <td style="text-align:center;">✅</td>
            <td>${flightDisplay}</td>
            <td>${dateString}</td>
            <td style="text-align:center;">
                <button onclick="scrollToLog(${currentLogID})" class="flights-table button" style="cursor: pointer;">
                    🔍 Детайли
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
function renderAllLogsTable(allLogs) {
    const tableBody = document.getElementById('flights-data-all'); 
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Изчистваме таблицата преди да я напълним

    // ОПРАВЕНО: Проверяваме allLogs, а не historylogs
    if (allLogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Няма намерени полети.</td></tr>';
        return;
    }

    // ОПРАВЕНО: ДОБАВЕН Е ЛИПСВАЩИЯТ ЦИКЪЛ!
    allLogs.forEach(log => {
        const row = document.createElement('tr');
        
        // МАГИЯТА: Закачаме уникално ID на всеки ред, за да го намира бутонът горе!
        const currentLogID = log.logID || log.logId;
        row.id = `log-row-${currentLogID}`; 

        const dateString = log.timestamp ? new Date(log.timestamp).toLocaleString('bg-BG') : '-';
        const flightID = log.flightID || log.flightId || log.FlightID || '-';
        const pulse = log.heartRate || log.pulse || log.HeartRate || '-';
        const oxygen = log.oxygenLevel || log.oxygen || log.OxygenLevel || '-';
        const temp = log.temperature || log.temp || log.Temperature || '-';
        const cort = log.stressIndex || log.cortisol || log.StressIndex || '-';

        row.innerHTML = `
            <td style="text-align:center;">✅</td>
            <td>${flightID}</td>
            <td>${dateString}</td>
            <td>${pulse}</td>
            <td>${oxygen}</td>
            <td>${temp}</td>
            <td>${cort}</td>
        `;
        tableBody.appendChild(row);
    });
}
function scrollToLog(logID) {
    // ОПРАВЕНО: Използваме logID (с главно D), за да съвпада с параметъра горе
    const targetRow = document.getElementById(`log-row-${logID}`);
    
    if (targetRow) {
        // Плъзгаме екрана плавно до него
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Махаме маркировката от всички други редове
        document.querySelectorAll('.highlighted-row').forEach(r => r.classList.remove('highlighted-row'));
        
        // Слагаме цвета на нашия ред
        targetRow.classList.add('highlighted-row');
        
        // Махаме цвета след 3 секунди
        setTimeout(() => {
            targetRow.classList.remove('highlighted-row');
        }, 3000);
    } else {
        console.warn("Редът не е намерен! ID:", logID);
    }
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