// === QUIZ DATA ===
const questions = [
    {
        question: "C'est quoi le T-CAS ?",
        answers: [
            "A) Un système GPS pour trouver les aéroports.",
            "B) Un bouclier invisible qui prévient le pilote si un autre avion s'approche trop.",
            "C) Un système de divertissement pour les passagers."
        ],
        correct: 1,
        explanation: "Le T-CAS est comme un bouclier invisible autour de l'avion. Si un autre avion s'approche trop, il prévient le pilote pour éviter une collision."
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
        question: "Pourquoi la détection visuelle par les pilotes est-elle devenue insuffisante ?",
        answers: [
            "A) Les pilotes ont besoin de lunettes.",
            "B) Les avions volent trop vite (900 km/h) et le trafic est trop dense.",
            "C) Il fait toujours nuit dans le ciel."
        ],
        correct: 1,
        explanation: "Les avions modernes volent à 900 km/h et le trafic aérien est devenu très dense. À ces vitesses, impossible pour l'œil humain de détecter un danger à temps !"
    },
    {
        question: "En quelle année le TCAS II a-t-il été développé ?",
        answers: [
            "A) Dans les années 1950.",
            "B) Dans les années 1980.",
            "C) En 2020."
        ],
        correct: 1,
        explanation: "Le TCAS II a été développé dans les années 1980 aux États-Unis. C'est à cette époque que les avions ont commencé à 'dialoguer' entre eux par radio."
    },
    {
        question: "Depuis quand le T-CAS est-il obligatoire en Europe ?",
        answers: [
            "A) Depuis 1956.",
            "B) Depuis l'an 2000.",
            "C) Il n'est pas obligatoire."
        ],
        correct: 1,
        explanation: "Depuis l'an 2000, le T-CAS est obligatoire dans tous les avions importants (plus de 19 passagers ou 5,7 tonnes) en Europe. Sans TCAS, pas de décollage !"
    },
    {
        question: "Où se trouve le 'cerveau' du T-CAS dans l'avion ?",
        answers: [
            "A) Dans le cockpit, sur les genoux du pilote.",
            "B) C'est une boîte métallique cachée dans une soute sous les pieds des pilotes.",
            "C) Sur le toit de l'avion, à côté des antennes."
        ],
        correct: 1,
        explanation: "Le calculateur TCAS est une boîte métallique cachée dans une soute spéciale sous les pieds des pilotes. C'est lui qui réfléchit très vite pour calculer le danger."
    },
    {
        question: "Où sont placées les antennes du T-CAS sur l'avion ?",
        answers: [
            "A) Uniquement sur les ailes.",
            "B) Sur le dos et sous le ventre de l'avion.",
            "C) Dans les moteurs."
        ],
        correct: 1,
        explanation: "L'avion a des antennes sur son dos et sous son ventre. Elles permettent de 'parler' aux autres avions et de savoir exactement où ils se trouvent."
    },
    {
        question: "Que dit le T-CAS quand un avion entre dans la zone jaune ?",
        answers: [
            "A) 'Climb ! Climb !'",
            "B) 'Traffic, Traffic'",
            "C) 'Atterrissage immédiat !'"
        ],
        correct: 1,
        explanation: "Dans la zone jaune (attention), le T-CAS dit 'Traffic, Traffic' pour prévenir le pilote qu'un autre avion est proche. C'est un message d'alerte, pas encore d'urgence."
    },
    {
        question: "Que signifie la zone orange sur le radar T-CAS ?",
        answers: [
            "A) Tout va bien, pas de danger.",
            "B) Danger ! Le pilote doit agir.",
            "C) L'avion a besoin de carburant."
        ],
        correct: 1,
        explanation: "La zone orange signifie DANGER ! Le T-CAS crie 'Climb ! Climb !' ou 'Descend !' et le pilote doit obéir immédiatement pour éviter la collision."
    },
    {
        question: "Combien de zones de sécurité le T-CAS surveille-t-il autour de l'avion ?",
        answers: [
            "A) 1 seule zone.",
            "B) 3 zones : jaune (attention), orange (danger) et rouge (collision).",
            "C) 10 zones différentes."
        ],
        correct: 1,
        explanation: "Le T-CAS surveille 3 zones : la zone jaune (attention - 'Traffic, Traffic'), la zone orange (danger - 'Climb/Descend') et la zone rouge (collision critique)."
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

        // Afficher le nom de l'élève
        studentNameFinal.textContent = `${userName.prenom} ${userName.nom}`;
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
