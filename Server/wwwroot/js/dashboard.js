
let healthChart = null;
let allFetchedLogs = [];
let showDataLabels = true; // По подразбиране числата ще се виждат

// Регистрираме плъгина глобално
Chart.register(ChartDataLabels);
//Проверка за вход
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Първо взимаме токена
    const token = localStorage.getItem('token');

    // Ако изобщо няма токен, директно го гоним
    if (!token) {
        alert('Не сте влезли в профила си! Ще бъдете пренасочени към формата за вход.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 2. Правим заявката
        const response = await fetch('/api/Auth/profile',{
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

        // Ако всичко е наред (response.ok е true), продължаваш с данните:
        const userData = await response.json();
        console.log("Успешен вход за:", userData.username);
        // ... твоят код за визуализация на данните ...

    } catch (error) {
        console.error("Грешка при връзката със сървъра:", error);
    }
});

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
                    showMessage("Успешен запис на полета!", "success");
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
            // Вземаме целия обект от сървъра (имена + логове)
            const data = await response.json();

            // 1. ПОКАЗВАМЕ ИМЕНАТА В WELCOME СЕКЦИЯТА
            // (Уверете се, че в HTML имате елемент с id="welcome-name")
            const welcomeElement = document.getElementById('welcome-name');
            if (welcomeElement) {
                // Забележка: ASP.NET обикновено прави първите букви малки в JSON (camelCase)
                welcomeElement.textContent = `${data.firstName} ${data.lastName}`;
            }

            // 2. ЗАПАЗВАМЕ ЛОГОВЕТЕ В ГЛОБАЛНАТА ПРОМЕНЛИВА
            allFetchedLogs = data.logs || [];

            // 3. Рендираме таблицата (както досега)
            renderAllLogsTable(allFetchedLogs);

            // 4. ПУСКАМЕ ГРАФИКАТА С ПЪРВОНАЧАЛЕН ФИЛТЪР (Последни 10)
            updateChartFilter(10);
        } else {
            console.error("Грешка от сървъра:", response.status);
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
            <td>${pulse}</td>
            <td>${oxygen}</td>
            <td>${temp}</td>
            <td>${cort}</td>
            <td>${dateString}</td>
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
        }, 10000);
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
// Функция, която филтрира данните и обновява графиката
function updateChartFilter(limit) {
    // Дефинираме кои данни ще ползваме
    let dataToDisplay = [...allFetchedLogs];

    // Ако искаме последните 10, режем масива (вземаме последните 10 записа)
    if (limit === 10) {
        dataToDisplay = dataToDisplay.slice(-10);
    }

    // Маркираме активния бутон
    document.getElementById('btn-10').classList.toggle('active', limit === 10);
    document.getElementById('btn-all').classList.toggle('active', limit === 'all');

    renderHealthChart(dataToDisplay);
}

//
// Основната функция за рисуване на Chart.js
//
function renderHealthChart(logs) {
    const ctx = document.getElementById('healthChart').getContext('2d');

    // Ако графиката вече съществува, унищожаваме я, за да нарисуваме нова върху чисто
    if (healthChart) {
        healthChart.destroy();
    }

    // Подготвяме етикетите (Flight IDs) и данните
    const labels = logs.map(l => {
        const flight = l.flightID || l.flightId || '-';
        // Форматираме датата (ако има такава), за да изглежда добре, напр. "12.04.2026"
        let formattedDate = '';

        if (l.timestamp) {
            // Създаваме обект дата от записа в лога
            const d = new Date(l.timestamp);

            // Вземаме отделните части и добавяме водеща нула, ако са под 10 (напр. 5 става 05)
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();

            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            // ТУК ИЗБИРАШ КАК ДА ИЗГЛЕЖДА:

            // Ако искаш само датата (напр. "25.10.2026"):
            // formattedDate = `${day}.${month}.${year}`;

            // Ако искаш дата и час (напр. "25.10.2026 14:30"):
            formattedDate = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
        }

        // Връщаме масив от два елемента, за да се покажат на два реда в графиката
        return [flight, formattedDate];
    });
    const pulseData = logs.map(l => l.heartRate || l.pulse);
    const oxygenData = logs.map(l => l.oxygenLevel || l.oxygen);
    const stressData = logs.map(l => l.stressIndex || l.cortisol);
    const temperatureData = logs.map(l => l.tempInput || l.temperature)

    healthChart = new Chart(ctx, {
        type: 'line', // Линейна графика
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Пулс (bpm)',
                    data: pulseData,
                    borderColor: '#ff4757',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    borderWidth: 2,
                    tension: 0.3, // Прави линията леко заоблена
                },
                {
                    label: 'Кислород (%)',
                    data: oxygenData,
                    borderColor: '#2ed573',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Стрес (Кортизол)',
                    data: stressData,
                    borderColor: '#00a8ff',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Температура (°C)',
                    data: temperatureData,
                    borderColor: '#FFEA00',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#00a8ff' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#00a8ff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } },

                // 1. НАСТРОЙКИ ЗА ПОСТОЯННО ВИДИМИТЕ ЧИСЛА
                datalabels: {
                    display: showDataLabels, // Взима стойността от променливата
                    color: '#fff',
                    align: 'top', // Показва ги над точката
                    offset: 4,    // Отстояние от точката
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    // Показва само самото число без закръгляне или друго (по желание може да се форматира)
                    formatter: function (value) {
                        return value;
                    }
                },

                // 2. ОПРАВЯНЕ НА БАЛОНЧЕТО (TOOLTIP) ПРИ ПОСОЧВАНЕ
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            // Взимаме оригиналния масив [Полет, Дата], който подадохме по-рано
                            const rawLabelArray = context[0].chart.data.labels[context[0].dataIndex];

                            // Сглобяваме го красиво на един ред с разделител
                            if (Array.isArray(rawLabelArray)) {
                                return `Полет: ${rawLabelArray[0]} | Дата: ${rawLabelArray[1]}`;
                            }
                            return rawLabelArray; // Резервен вариант
                        }
                    }
                }
            }
        }
    });
}
function toggleDataLabels() {
    showDataLabels = !showDataLabels;

    const btn = document.getElementById('btn-toggle-labels');
    if (showDataLabels) {
        btn.classList.add('active');
        btn.textContent = 'Скрий числата';
    } else {
        btn.classList.remove('active');
        btn.textContent = 'Покажи числата';
    }

    // Ако графиката вече е заредена, я обновяваме мигновено
    if (healthChart) {
        healthChart.options.plugins.datalabels.display = showDataLabels;
        healthChart.update();
    }
}