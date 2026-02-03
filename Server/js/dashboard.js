const exitBtn = document.getElementById('exit-btn');

exitBtn.addEventListener('click', () => {
    sessionStorage.clear();
    console.log("Системите се изключват... Довиждане, пилот!");
    // Тук по-късно ще добавим логика за изход от системата
    console.log("Излизане от таблото...");});