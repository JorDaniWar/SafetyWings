let interval = 2;
// Взимаме токена за оторизация (ако контролерът го изисква)
const token = localStorage.getItem('token');
if (!token) {
    alert("Грешка: Не сте влезли в профила си! Ще бъдете пренасочени към началната страница.");
    window.location.href = 'index.html';
}

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
});
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

async function startSimulationSequence() {
    

    // Настройки на цикъла
    const totalDuration = 10000; // 10 секунди
    const interval = 2000;       // 2 секунди
    const iterations = totalDuration / interval; // Точно 5 изпълнения

    // Опционално: Заключваме бутона, за да не се цъка по време на цикъла
    const btn = document.getElementById('simulate-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Симулиране...";
    }

    for (let i = 0; i < iterations; i++) {
        try {
            // Правим заявката към контролера (смени URL-а с твоя точен маршрут)
            const response = await fetch('/api/Simulation/simulate-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Сървърът върна грешка: ${response.status}`);
            }

            const result = await response.json();

            // Подаваме данните към твоята функция за рисуване
            // Забележка: Ако контролерът връща директно обекта, ползвай addRecordToTable(result)
            // Ако връща { success: true, data: {...} }, ползвай result.data
            if (result.data) {
                addRecordToTable(result.data);
            } else {
                addRecordToTable(result);
            }

        } catch (error) {
            console.error("Грешка при изтегляне на данните:", error);
            break; // Прекъсваме цикъла, ако сървърът гръмне
        }

        // Чакаме 2 секунди ПРЕДИ следващото завъртане 
        // (Пропускаме чакането на последната стъпка, за да приключим веднага)
        if (i < iterations - 1) {
            if (btn) btn.innerText = `Симулиране (остават ${10 - (i + 1) * 2} сек)...`;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    // Връщаме бутона в нормално състояние след края на 10-те секунди
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Симулирай данни";
    }
}
function addRecordToTable(data) {
    const tableBody = document.querySelector('#added-logs-table tbody');
    const row = document.createElement('tr');

    // Стилизиране според това дали съобщението съдържа "КРИТИЧНО", "Внимание" или е "Нормално"
    let statusStyle = 'color: green;';
    let icon = '✅';

    if (data.isCritical) {
        statusStyle = 'color: #ff4d4d; font-weight: bold; background-color: rgba(255,0,0,0.1);';
        icon = '🚨';
    } else if (data.alertNote.includes("Внимание")) {
        statusStyle = 'color: #ff9900; font-weight: bold; background-color: rgba(255,153,0,0.1);';
        icon = '⚠️';
    }

    const time = new Date(data.timestamp).toLocaleTimeString('bg-BG');

    row.innerHTML = `
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; ${statusStyle}">${icon} ${data.alertNote}</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.flightID}</td>     
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.heartRate}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.oxygenSaturation}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.temperature.toFixed(1)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.cortisol.toFixed(2)}</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${time}</td>
    `;

    tableBody.insertBefore(row, tableBody.firstChild);
}