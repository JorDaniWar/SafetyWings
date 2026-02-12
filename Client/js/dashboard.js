function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
    console.log("Exit succesfully");
}

document.querySelectorAll('a').forEach(link => {
    let isAnimating = false; // Пази ни от прекъсване
    let shouldExit = false;  // Флаг, ако мишката е излязла по време на анимация

    link.addEventListener('mouseenter', () => {
        if (isAnimating) return; // Ако вече тече анимация (например излизане), не прави нищо

        isAnimating = true;
        link.classList.remove('anim-out');
        link.classList.add('anim-in');

        // Изчакваме точно 500ms (колкото трае анимацията в CSS)
        setTimeout(() => {
            isAnimating = false;
            // Ако потребителят вече е излязъл, докато се е разпъвало - пусни изхода сега
            if (shouldExit) {
                triggerExit();
            }
        }, 500);
    });

    link.addEventListener('mouseleave', () => {
        if (isAnimating) {
            shouldExit = true; // Отбелязваме, че трябва да излезе веднага щом свърши разпъването
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
            link.classList.remove('anim-out'); // Връщаме в изходна позиция за следващия път
        }, 500);
    }
});