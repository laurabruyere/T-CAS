// === QUIZ DATA ===
const questions = [
    {
        question: "Quelle est la \"Règle d'Or\" absolue pour un pilote ?",
        answers: [
            "A) Suivre les ordres du contrôleur aérien au sol.",
            "B) Obéir immédiatement au TCAS, même si le contrôleur dit le contraire.",
            "C) Attendre de voir l'avion par le hublot."
        ],
        correct: 1,
        explanation: "Le TCAS a toujours raison ! En cas de conflit entre le contrôleur aérien et le TCAS, le pilote DOIT suivre le TCAS. C'est la règle d'or car le système voit des dangers que l'humain ne peut pas détecter à temps."
    },
    {
        question: "Qu'est-ce que le \"TAU\" calculé par l'ordinateur ?",
        answers: [
            "A) La distance exacte en kilomètres entre les deux avions.",
            "B) Le temps restant avant l'impact (compte à rebours).",
            "C) La puissance des moteurs de l'avion."
        ],
        correct: 1,
        explanation: "Le TAU (τ) est un compte à rebours ! Il calcule le temps restant avant l'impact, pas la distance. C'est plus utile car à 800 km/h, les distances changent très vite. TAU = Distance ÷ Vitesse de rapprochement."
    },
    {
        question: "Sur quelle fréquence l'avion envoie-t-il sa réponse (je suis ici !) ?",
        answers: [
            "A) 1030 MHz.",
            "B) 1090 MHz.",
            "C) 900 MHz."
        ],
        correct: 1,
        explanation: "Retiens : 1030 MHz pour interroger, 1090 MHz pour répondre ! L'avion reçoit les questions sur 1030 MHz et envoie sa position sur 1090 MHz. C'est comme une conversation radio codée entre avions."
    },
    {
        question: "Si le TCAS crie \"CLIMB, CLIMB\", en combien de temps le pilote doit-il agir ?",
        answers: [
            "A) Moins de 5 secondes.",
            "B) En une minute.",
            "C) Dès qu'il a fini son café."
        ],
        correct: 0,
        explanation: "Moins de 5 secondes ! C'est une question de vie ou de mort. À 800 km/h, les avions se rapprochent de 400 mètres par seconde. Le pilote doit réagir immédiatement, sans réfléchir."
    },
    {
        question: "Sur l'écran radar, quel symbole représente un danger immédiat (RA) ?",
        answers: [
            "A) Un losange blanc.",
            "B) Un rond jaune.",
            "C) Un carré rouge."
        ],
        correct: 2,
        explanation: "Le carré rouge = danger immédiat (RA) ! Le rond jaune représente une alerte de trafic (TA), et le losange blanc/bleu montre les avions sans danger. Plus le symbole est rouge et carré, plus c'est urgent !"
    },
    {
        question: "À combien de secondes de l'impact l'alerte rouge (RA) se déclenche-t-elle ?",
        answers: [
            "A) 40 secondes.",
            "B) 25 secondes.",
            "C) 5 secondes."
        ],
        correct: 1,
        explanation: "25 secondes avant l'impact ! C'est le TAU critique pour déclencher une RA. L'alerte jaune (TA) se déclenche vers 40 secondes. À 5 secondes, il serait beaucoup trop tard pour réagir."
    },
    {
        question: "Comment s'appelle le message de coordination envoyé entre les deux avions ?",
        answers: [
            "A) Le message SOS.",
            "B) Le message RAC (Resolution Advisory Complement).",
            "C) Un e-mail prioritaire."
        ],
        correct: 1,
        explanation: "Le message RAC permet aux deux avions de se coordonner ! Si un avion monte, l'autre doit descendre. Le RAC garantit que les deux TCAS donnent des ordres complémentaires pour éviter la collision."
    },
    {
        question: "Quel événement tragique a provoqué l'invention du TCAS ?",
        answers: [
            "A) Une collision en 1956 au-dessus du Grand Canyon.",
            "B) Une panne d'essence géante.",
            "C) La tempête du siècle."
        ],
        correct: 0,
        explanation: "La collision du Grand Canyon en 1956 a été un tournant. Deux avions se sont percutés car les pilotes ne comptaient que sur leurs yeux. Cette tragédie a lancé la recherche qui a mené au TCAS."
    },
    {
        question: "Quelle unité le calculateur utilise-t-il pour mesurer l'altitude ?",
        answers: [
            "A) Le Mètre (m).",
            "B) Le Pied (ft).",
            "C) Le Kilomètre (km)."
        ],
        correct: 1,
        explanation: "L'aviation utilise le Pied (ft) ! 1 pied = 30,48 cm. C'est un standard international. Quand le TCAS dit de monter de 1000 ft, cela représente environ 300 mètres."
    },
    {
        question: "Quelle est la précision requise pour valider un signal radio TCAS ?",
        answers: [
            "A) 1 seconde.",
            "B) Quelques microsecondes (μs).",
            "C) Pas de précision particulière."
        ],
        correct: 1,
        explanation: "Des microsecondes (millionièmes de seconde) ! Le signal radio voyage à 300 000 km/s. Pour calculer la distance précisément, le TCAS mesure le temps de réponse avec une précision extrême."
    }
];

// === STATE ===
let currentQuestion = 0;
let score = 0;
let userName = { prenom: '', nom: '' };

// === DOM ELEMENTS ===
const stepRegistration = document.getElementById('step-registration');
const stepQuiz = document.getElementById('step-quiz');
const stepResult = document.getElementById('step-result');
const registrationForm = document.getElementById('registration-form');
const questionContainer = document.getElementById('question-container');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const currentQuestionSpan = document.getElementById('current-question');
const progressFill = document.getElementById('progress-fill');
const resultFail = document.getElementById('result-fail');
const resultSuccess = document.getElementById('result-success');
const scoreFail = document.getElementById('score-fail');
const studentNameFinal = document.getElementById('student-name-final');
const certDate = document.getElementById('cert-date');

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    registrationForm.addEventListener('submit', handleRegistration);
});

// === REGISTRATION ===
function handleRegistration(e) {
    e.preventDefault();
    userName.prenom = document.getElementById('prenom').value.trim();
    userName.nom = document.getElementById('nom').value.trim();

    if (userName.prenom && userName.nom) {
        showStep('quiz');
        loadQuestion();
    }
}

// === STEP NAVIGATION ===
function showStep(step) {
    stepRegistration.classList.remove('active');
    stepQuiz.classList.remove('active');
    stepResult.classList.remove('active');

    switch (step) {
        case 'registration':
            stepRegistration.classList.add('active');
            break;
        case 'quiz':
            stepQuiz.classList.add('active');
            break;
        case 'result':
            stepResult.classList.add('active');
            break;
    }
}

// === QUIZ LOGIC ===
function loadQuestion() {
    const q = questions[currentQuestion];
    questionText.textContent = q.question;
    currentQuestionSpan.textContent = currentQuestion + 1;
    progressFill.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

    answersContainer.innerHTML = '';
    q.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(btn);
    });
}

function selectAnswer(selectedIndex) {
    const q = questions[currentQuestion];
    const buttons = answersContainer.querySelectorAll('.answer-btn');
    const isCorrect = selectedIndex === q.correct;

    // Disable all buttons
    buttons.forEach(btn => btn.classList.add('disabled'));

    // Show correct/incorrect
    if (isCorrect) {
        buttons[selectedIndex].classList.add('correct');
        score++;
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[q.correct].classList.add('correct');

        // Show explanation for wrong answers
        showExplanation(q.explanation);
    }

    // Next question after delay (longer if explanation shown)
    const delay = isCorrect ? 1200 : 4500;
    setTimeout(() => {
        hideExplanation();
        currentQuestion++;
        if (currentQuestion < questions.length) {
            loadQuestion();
        } else {
            showResults();
        }
    }, delay);
}

// === EXPLANATION ===
function showExplanation(text) {
    // Remove existing explanation if any
    hideExplanation();

    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation-box';
    explanationDiv.innerHTML = `
        <div class="explanation-icon">i</div>
        <div class="explanation-text">${text}</div>
    `;
    answersContainer.appendChild(explanationDiv);

    // Trigger animation
    setTimeout(() => explanationDiv.classList.add('visible'), 50);
}

function hideExplanation() {
    const existing = document.querySelector('.explanation-box');
    if (existing) {
        existing.remove();
    }
}

// === RESULTS ===
function showResults() {
    showStep('result');

    if (score === 10) {
        resultFail.style.display = 'none';
        resultSuccess.style.display = 'flex';

        // Remplir le diplôme avec nom et date
        studentNameFinal.textContent = `${userName.prenom} ${userName.nom}`;

        // Format date JJ/MM/AAAA
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        certDate.textContent = `${day}/${month}/${year}`;
    } else {
        resultSuccess.style.display = 'none';
        resultFail.style.display = 'block';
        scoreFail.textContent = score;
    }
}

// === RESTART ===
function restartQuiz() {
    currentQuestion = 0;
    score = 0;
    showStep('registration');
    registrationForm.reset();
}

// === PDF DOWNLOAD ===
async function downloadDiploma() {
    const diploma = document.getElementById('diploma');
    const { jsPDF } = window.jspdf;

    try {
        // Capture diploma as image
        const canvas = await html2canvas(diploma, {
            scale: 2,
            backgroundColor: '#1a1a2e',
            logging: false
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Calculate dimensions to fit A4 landscape
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        // Add dark background
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

        // Add image
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        // Save
        pdf.save(`Certificat_TCAS_${userName.prenom}_${userName.nom}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}
