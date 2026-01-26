const plane = document.getElementById('draggablePlane');
const intro = document.getElementById('intro-screen');
const site = document.getElementById('main-site');
let isLaunched = false;

// --- GESTION DU DÉCOLLAGE ---
plane.addEventListener('mousedown', (e) => {
    let startY = e.clientY;
    function onMouseMove(event) {
        let deltaY = event.clientY - startY;
        if (deltaY < -100 && !isLaunched) {
            launch();
            window.removeEventListener('mousemove', onMouseMove);
        }
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', () => window.removeEventListener('mousemove', onMouseMove));
});

function launch() {
    isLaunched = true;
    intro.style.transform = 'translateY(-100%)';
    site.style.opacity = '1';
    // On autorise le scroll une fois le site lancé
    document.body.style.overflowY = 'auto'; 
}

// --- GESTION DES COMPTEURS AU SCROLL ---
const startCounters = (el) => {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000; // Animation de 2 secondes
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.innerText = target.toLocaleString();
            clearInterval(timer);
        } else {
            el.innerText = Math.floor(current).toLocaleString();
        }
    }, stepTime);
};

// L'observateur qui regarde si la section est visible
const observerOptions = {
    threshold: 0.5 // Déclenche quand 50% de l'élément est visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // On récupère TOUS les compteurs et on les lance
            const counters = document.querySelectorAll('.counter');
            counters.forEach(counter => startCounters(counter));
            // On arrête d'observer une fois l'animation lancée
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// On cible la boîte qui contient les stats
const statsSection = document.querySelector('.stats-container');
observer.observe(statsSection);

// Support Tactile
plane.addEventListener('touchstart', (e) => {
    let startY = e.touches[0].clientY;
    plane.addEventListener('touchmove', (me) => {
        if (me.touches[0].clientY - startY < -70) launch();
    });
});