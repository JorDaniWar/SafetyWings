let healthChart = null;
let allFetchedLogs = [];
let showDataLabels = true; // По подразбиране числата ще се виждат

// Регистрираме плъгина глобално
Chart.register(ChartDataLabels);

// Проверка за вход
document.addEventListener('DOMContentLoaded', () => {
    verifySession();
});

// EVENT 2: The "Back" Button (bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log("Page loaded from Back button cache. Re-verifying token...");
        verifySession();
    }
});

// EVENT 3: Switching Tabs
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log("User returned to the tab. Re-verifying token...");
        verifySession();
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
    // 2. ЗАРЕЖДАНЕ НА ИСТОРИЯТА И ЗАПИСИТЕ
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

            const flightInput = document.getElementById('flightNumber');
            const pulseInput = document.getElementById('pulse');
            const oxygenInput = document.getElementById('oxygen');
            const tempInput = document.getElementById('temperature');
            const cortInput = document.getElementById('cortisol');

            if (!flightInput || !pulseInput || !oxygenInput || !tempInput || !cortInput) {
                alert("Грешка: Липсва поле при записа!");
                return;
            }

            const logData = {
                flightID: flightInput.value.trim(),
                heartRate: pulseInput.value.trim(),
                oxygenLevel: oxygenInput.value.trim(),
                temperature: tempInput.value.trim(),
                stressIndex: cortInput.value.trim()
            };

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
                    addLogForm.reset();
                    loadHistory();
                    loadAllLogs();
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
// 4. ФУНКЦИИ ЗА ИЗТЕГЛЯНЕ НА ДАННИ
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
    if (!token) { window.location.href = 'index.html'; return; }

    try {
        const response = await fetch('/api/Health/all', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            // Покрива всички варианти на отговор
            if (Array.isArray(data)) allFetchedLogs = data;
            else if (Array.isArray(data.logs)) allFetchedLogs = data.logs;
            else if (Array.isArray(data.data)) allFetchedLogs = data.data;
            else allFetchedLogs = [];


            console.log("Заредени записи:", allFetchedLogs.length);
            console.log("Примерен запис:", allFetchedLogs[0]);

            renderAllLogsTable(allFetchedLogs);
            updateChartFilter(10);
        }
    } catch (error) {
        console.error("Грешка:", error);
    }
}

// ==========================================
// 5. РИСУВАНЕ НА ТАБЛИЦИТЕ (ЛИПСВАЩИТЕ ФУНКЦИИ!)
// ==========================================

function getHealthStatus(type, value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'normal';

    switch (type) {
        case 'pulse':
            if (num < 50 || num > 120) return 'critical';
            if (num < 60 || num > 100) return 'warning';
            break;
        case 'oxygen':
            if (num < 90) return 'critical';
            if (num < 95) return 'warning';
            break;
        case 'temp':
            if (num < 35.5 || num > 39.0) return 'critical';
            if (num < 36.0 || num > 37.5) return 'warning';
            break;
        case 'stress':
            if (num > 85) return 'critical';
            if (num > 70) return 'warning';
            break;
    }
    return 'normal';
}

function formatCell(type, value) {
    const status = getHealthStatus(type, value);
    if (status === 'normal') return value;

    let color = status === 'critical' ? '#ff4757' : '#ffa502';
    let symbol = status === 'critical' ? '🆘 ' : '⚠️ ';

    const outlineStyle = `color: ${color}; font-weight: bold; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8);`;
    return `<span style="${outlineStyle}">${symbol}${value}</span>`;
}

function renderAllLogsTable(logs) {
    const tableBody = document.getElementById('flights-data-all');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Няма намерени записи.</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        const flightID = log.flightID || log.flightId || '-';
        row.id = `log-row-${log.id || log.logId || log.ID}`;

        let dateString = '-';
        if (log.timestamp) {
            const d = new Date(log.timestamp);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            dateString = `${day}.${month}.${year} ${hours}:${minutes}`;
        }

        const pulseDisplay = formatCell('pulse', log.heartRate || log.pulse || '-');
        const oxygenDisplay = formatCell('oxygen', log.oxygenLevel || log.oxygen || '-');
        const tempDisplay = formatCell('temp', log.tempInput || log.temperature || '-');
        const stressDisplay = formatCell('stress', log.stressIndex || log.cortisol || '-');

        let rowIcon = '✅';
        const combined = pulseDisplay + oxygenDisplay + tempDisplay + stressDisplay;
        if (combined.includes('🆘')) rowIcon = '🆘';
        else if (combined.includes('⚠️')) rowIcon = '⚠️';

        row.innerHTML = `
            <td style="text-align:center; font-size: 1.2rem;">${rowIcon}</td>
            <td>${flightID}</td>
            <td>${pulseDisplay}</td>
            <td>${oxygenDisplay}</td>
            <td>${tempDisplay}</td>
            <td>${stressDisplay}</td>
            <td>${dateString}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderHistoryTable(logs) {
    const tableBody = document.getElementById('flights-data');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Няма скорошна история.</td></tr>';
        return;
    }

    const recentLogs = logs.slice(0, 5);

    recentLogs.forEach(log => {
        const row = document.createElement('tr');
        const flightID = log.flightID || log.flightId || '-';

        let dateString = '-';
        if (log.timestamp) {
            const d = new Date(log.timestamp);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            dateString = `${day}.${month} ${hours}:${minutes}`;
        }

        const pulseDisplay = formatCell('pulse', log.heartRate || log.pulse || '-');
        const oxygenDisplay = formatCell('oxygen', log.oxygenLevel || log.oxygen || '-');
        const tempDisplay = formatCell('temp', log.tempInput || log.temperature || '-');
        const stressDisplay = formatCell('stress', log.stressIndex || log.cortisol || '-');

        let rowIcon = '✅';
        const combined = pulseDisplay + oxygenDisplay + tempDisplay + stressDisplay;
        if (combined.includes('🆘')) rowIcon = '🆘';
        else if (combined.includes('⚠️')) rowIcon = '⚠️';

        row.innerHTML = `
            <td style="text-align:center;">${rowIcon}</td>
            <td>${flightID}</td>
            <td>${dateString}</td>
             <td>
        <button onclick="scrollToLog('${log.id}')">Детайли</button>
                </td>
            `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// 6. ГРАФИКА И ФИЛТРИ
// ==========================================
function updateChartFilter(limit) {
    let dataToDisplay = [...allFetchedLogs];
    const chartCanvas = document.getElementById('healthChart');
    const noDataMessage = document.getElementById('no-data-message');
    const chartControls = document.getElementById('chart-controls');

    if (!allFetchedLogs || allFetchedLogs.length === 0) {
        if (chartCanvas) chartCanvas.style.display = 'none';
        if (chartControls) chartControls.style.display = 'none';
        if (noDataMessage) noDataMessage.style.display = 'block';
        return;
    } else {
        if (chartCanvas) chartCanvas.style.display = 'block';
        if (chartControls) chartControls.style.display = 'flex';
        if (noDataMessage) noDataMessage.style.display = 'none';
    }

    if (limit === 10) {
        dataToDisplay = dataToDisplay.slice(-10);
    }

    const btn10 = document.getElementById('btn-10');
    const btnAll = document.getElementById('btn-all');
    if (btn10) btn10.classList.toggle('active', limit === 10);
    if (btnAll) btnAll.classList.toggle('active', limit === 'all');

    renderHealthChart(dataToDisplay);
}

function renderHealthChart(logs) {
    const ctx = document.getElementById('healthChart').getContext('2d');

    if (healthChart) {
        healthChart.destroy();
    }

    const labels = logs.map(l => {
        const flight = l.flightID || l.flightId || '-';
        let formattedDate = '';
        if (l.timestamp) {
            const d = new Date(l.timestamp);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            const secs = String(d.getSeconds()).padStart(2, '0');
            formattedDate = `${day}.${month}.${year} ${hours}:${mins}:${secs}`;
        }
        return [flight, formattedDate];
    });

    const pulseData = logs.map(l => {
        const v = Number(l.heartRate);
        return isNaN(v) ? null : v;
    });

    const oxygenData = logs.map(l => {
        const v = Number(l.oxygenLevel ?? l.oxygenSaturation ?? l.oxygen);
        return isNaN(v) ? null : v;
    });

    const stressData = logs.map(l => {
        const raw = (l.stressIndex ?? l.cortisol)?.toString().replace(',', '.');
        const v = Number(raw);
        return isNaN(v) ? null : v;
    });

    const temperatureData = logs.map(l => {
        const raw = l.temperature?.toString().replace(',', '.');
        const v = Number(raw);
        return isNaN(v) ? null : v;
    });


    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Пулс (bpm)',
                    data: pulseData,
                    borderColor: '#ff4757',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
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
            animation: {
                y: { duration: 1000, from: 500 }
            }, 
            layout: {
                padding: { top: 25, right: 30, bottom: 5, left: 10 }
            },
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
                legend: {
                    labels: { color: '#fff' }
                },
                datalabels: {
                    display: showDataLabels,
                    color: '#fff',
                    align: 'top',
                    offset: 4,
                    clamp: true,
                    font: { size: 11, weight: 'bold' },
                    formatter: value => value ?? ''
                },
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            const label = context[0].chart.data.labels[context[0].dataIndex];
                            return Array.isArray(label)
                                ? `Полет: ${label[0]} | Дата: ${label[1]}`
                                : label;
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
    if (btn) {
        if (showDataLabels) {
            btn.classList.add('active');
            btn.textContent = 'Скрий числата';
        } else {
            btn.classList.remove('active');
            btn.textContent = 'Покажи числата';
        }
    }

    if (healthChart) {
        healthChart.options.plugins.datalabels.display = showDataLabels;
        healthChart.update();
    }
}

// ==========================================
// 7. ДРУГИ ФУНКЦИИ (Scroll, Exit, Verify)
// ==========================================
function scrollToLog(logID) {
    const targetRow = document.getElementById(`log-row-${logID}`);
    if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.highlighted-row').forEach(r => r.classList.remove('highlighted-row'));
        targetRow.classList.add('highlighted-row');
        setTimeout(() => {
            targetRow.classList.remove('highlighted-row');
        }, 10000);
    } else {
        console.warn("Редът не е намерен! ID:", logID);
    }
}

function logout() {
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

async function verifySession() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Вие не сте влезли в профила си! Ще бъдете пренасочени към страницата за вход.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/Auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            alert("Вашата сесия е изтекла или невалидна! Ще бъдете пренасочени към формата за вход.");
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        // If valid, load the user data (like you already do)
        const userData = await response.json();

        const welcomeElement = document.getElementById('welcome-name');
        if (welcomeElement) {
            const fName = userData.firstName || userData.FirstName || userData.username || "Unknown";
            const lName = userData.lastName || userData.LastName || "";
            welcomeElement.textContent = `${fName} ${lName}`;
        }

    } catch (error) {
        console.error("Server connection error:", error);
    }
}