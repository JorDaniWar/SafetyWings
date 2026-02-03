const launchBtn = document.getElementById('btn-login');

launchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Тук по-късно ще добавим проверка към C# бекенда
    console.log("Подготовка за излитане...");
    
    // Пренасочване към новата страница
    window.location.href = "dashboard.html";
});