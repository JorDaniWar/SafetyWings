let interval = 2;

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
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">THY50</td>     
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.heartRate}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.oxygenSaturation}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.temperature.toFixed(1)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${data.cortisol.toFixed(2)}</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${time}</td>
    `;

    tableBody.insertBefore(row, tableBody.firstChild);
}