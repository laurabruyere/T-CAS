const plane = document.getElementById('draggablePlane');
const intro = document.getElementById('intro-screen');
const site = document.getElementById('main-site');
let isDragging = false;
let startY = 0;
let isLaunched = false;

// --- 1. GESTION DU DÉCOLLAGE ---

const handleStart = (e) => {
    if (isLaunched) return;
    isDragging = true;
    startY = e.clientY || e.touches[0].clientY;
    plane.style.transition = "none";
};

const handleMove = (e) => {
    if (!isDragging || isLaunched) return;
    const currentY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    const deltaY = currentY - startY;

    if (deltaY < 0) {
        const scale = 1 + Math.abs(deltaY) / 500;
        plane.style.transform = `translateY(${deltaY}px) scale(${scale})`;
        if (deltaY < -180) {
            launch();
        }
    }
};

const handleEnd = () => {
    if (!isDragging || isLaunched) return;
    isDragging = false;
    plane.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    plane.style.transform = `translateY(0px) scale(1)`;
};

function launch() {
    isLaunched = true;
    isDragging = false;
    
    // Animation de l'avion
    plane.style.transition = "transform 0.6s ease-in";
    plane.style.transform = "translateY(-1000px) scale(2.5)";
    
    // Le rideau bleu monte
    intro.style.transform = 'translateY(-100%)';
    
    // --- CORRECTION DU SCROLL ---
    // On débloque TOUT : body et html
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto'; 
    document.body.style.height = 'auto';
    
    // On affiche le site
    site.style.opacity = '1';

    // Après l'animation (800ms), on retire l'intro du flux pour être sûr
    setTimeout(() => {
        intro.style.display = 'none';
    }, 800);

    initCounterObserver();
}

// Événements
plane.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
plane.addEventListener('touchstart', handleStart);
window.addEventListener('touchmove', handleMove);
window.addEventListener('touchend', handleEnd);

// --- 2. GESTION DES CHIFFRES ---

function initCounterObserver() {
    const statsSection = document.querySelector('.stats-container');
    if(!statsSection) return;

    const observerOptions = { threshold: 0.2 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.counter');
                counters.forEach(counter => animateValue(counter));
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(statsSection);
}

function animateValue(obj) {
    const target = parseInt(obj.getAttribute('data-target'));
    const duration = 2500;
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * target);
        obj.innerHTML = currentValue.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = target.toLocaleString();
        }
    };
    window.requestAnimationFrame(step);
}