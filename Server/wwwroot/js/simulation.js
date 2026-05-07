let interval = 2;
let simulation = false;
// Взимаме токена за оторизация (ако контролерът го изисква)
const showBtn = document.getElementById('show-all-logs');

document.addEventListener('DOMContentLoaded', () => {
    verifySession();
});
// EVENT 2: The "Back" Button (bfcache)
window.addEventListener('pageshow', (event) => {
    // event.persisted is TRUE if the browser loaded the page from the "Back" button cache
    if (event.persisted) {
        console.log("Page loaded from Back button cache. Re-verifying token...");
        verifySession();
    }
});

// EVENT 3: Switching Tabs (Bonus!)
// If the user leaves the tab open, the token expires, and they come back an hour later.
document.addEventListener('visibilitychange', () => {
    // document.visibilityState is 'visible' when the user looks at this tab again
    if (document.visibilityState === 'visible') {
        console.log("User returned to the tab. Re-verifying token...");
        verifySession();
    }
});

//
// Страничен панел
//
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
    const token = localStorage.getItem('token');
    simulation = true;
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
    try {
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
                    addRecordToTable(result.data);
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
    }
    finally {
        // FINALLY блокът се изпълнява ВИНАГИ - независимо дали цикълът е завършил успешно или е прекъснат от грешка.
        // Това гарантира, че навигацията ще бъде отключена!
        simulation = false;

        if (btn) {
            btn.disabled = false;
            btn.innerText = "Симулирай данни";
        }
    }
}
function addRecordToTable(data) {
    const row = document.createElement('tr');
    const tableBody = document.getElementById('added-logs-all');

    if (tableBody.children.length === 1 && tableBody.textContent.includes('няма')) {
        tableBody.innerHTML = '';
    }

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
    <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center; ${statusStyle}">${icon} ${data.alertNote}</td>
    <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.flightID}</td>     
        <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.heartRate}</td>
        <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.oxygenLevel}%</td>
        <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.temperature.toFixed(1)}</td>
        <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.stressIndex.toFixed(2)}</td>
    <td style="color: white; padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${time}</td>
    `;

    tableBody.insertBefore(row, tableBody.firstChild);
}

showBtn.addEventListener('click', function(event){
    event.preventDefault();
    window.location.href = 'dashboard.html#all-flights';
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