// ===== MAIN-SIMULATOR.JS - Complete TCAS Simulator Main Controller =====
// Integrates all modules: aircraft data, models, environment, physics

// ===== TUTORIAL CONTENT =====
const TUTORIAL_STEPS = [
    {
        title: "BIENVENUE",
        content: `
            <p>Bienvenue dans le <strong>Simulateur de Formation TCAS</strong> !</p>
            <p>Ce simulateur vous permettra d'apprendre le fonctionnement du système anticollision et de pratiquer vos réactions aux alertes.</p>
            <div class="tcas-demo">
                <p>Vous pourrez choisir parmi <em>3 types d'avions</em> et différentes conditions météo pour une expérience réaliste.</p>
            </div>
        `
    },
    {
        title: "QU'EST-CE QUE LE TCAS ?",
        content: `
            <p>Le <strong>TCAS</strong> (Traffic Collision Avoidance System) est un système de sécurité embarqué qui protège les avions contre les risques de collision en vol.</p>
            <p>Il fonctionne de manière <em>indépendante</em> du contrôle aérien et communique directement avec les autres avions.</p>
            <div class="tcas-demo">
                <p>🛫 Le TCAS surveille l'espace aérien dans un rayon de <strong>40 NM</strong> horizontalement et <strong>±9900 ft</strong> verticalement.</p>
            </div>
        `
    },
    {
        title: "LES ALERTES TCAS",
        content: `
            <p>Le TCAS génère deux types d'alertes :</p>
            <div class="tcas-demo">
                <p><strong style="color:#ffa500">⚠️ TA - Traffic Advisory</strong></p>
                <p>Alerte préventive (~40 secondes avant conflit). Recherchez visuellement le trafic.</p>
                <br>
                <p><strong style="color:#ff3333">🚨 RA - Resolution Advisory</strong></p>
                <p>Alerte critique (~25 secondes). Suivez <em>immédiatement</em> l'instruction de manœuvre.</p>
            </div>
        `
    },
    {
        title: "L'AFFICHAGE TCAS",
        content: `
            <p>L'écran TCAS affiche le trafic avec différents symboles :</p>
            <div class="tcas-demo">
                <div class="tcas-symbols">
                    <div class="symbol-item"><div class="sym diamond"></div><span>OTHER<br>(Trafic)</span></div>
                    <div class="symbol-item"><div class="sym circle"></div><span>TA<br>(Jaune)</span></div>
                    <div class="symbol-item"><div class="sym square"></div><span>RA<br>(Rouge)</span></div>
                </div>
            </div>
            <p>Les chiffres indiquent la différence d'altitude en centaines de pieds.</p>
        `
    },
    {
        title: "PRÊT À VOLER !",
        content: `
            <p>Vous allez maintenant pouvoir voler !</p>
            <div class="tcas-demo">
                <p><strong>Contrôles :</strong></p>
                <ul style="margin-left:20px">
                    <li>↑↓ : Tangage · ←→ : Roulis</li>
                    <li>W/S : Puissance · ESC : Pause</li>
                </ul>
                <p style="margin-top:15px; color:#00ff41"><strong>Objectif :</strong> Suivez les instructions du TCAS !</p>
            </div>
        `
    }
];

// ===== GAME LEVELS =====
const LEVELS = [
    { name: 'NIVEAU 1', obj: 'RA CLIMB - Montez au-dessus de 3200 ft', threat: { x: 0, alt: 2800, z: -2500, speed: 85, heading: 0 }, goal: { type: 'climb', target: 3200 } },
    { name: 'NIVEAU 2', obj: 'RA DESCEND - Descendez sous 2800 ft', threat: { x: 100, alt: 3200, z: -2500, speed: 90, heading: 0 }, goal: { type: 'descend', target: 2800 } },
    { name: 'NIVEAU 3', obj: 'RA CLIMB - Évitez le trafic convergent', threat: { x: -50, alt: 2700, z: -2000, speed: 95, heading: 10 }, goal: { type: 'climb', target: 3500 } },
    { name: 'NIVEAU 4', obj: 'RA DESCEND - Réaction rapide !', threat: { x: 50, alt: 3400, z: -2200, speed: 100, heading: -5 }, goal: { type: 'descend', target: 2500 } },
    { name: 'NIVEAU 5', obj: 'RA CLIMB - Menace imminente !', threat: { x: 0, alt: 2600, z: -1800, speed: 110, heading: 0 }, goal: { type: 'climb', target: 4000 } }
];

// ===== GAME STATE =====
let scene, camera, renderer, player, clock;
let traffic = [];
let keys = {};
let running = false, paused = false;
let mode = 'sandbox';
let level = 1;
let levelComplete = false;
let currentTutorialStep = 0;
let lastAlertType = null;
let selectedAircraft = 'c172';
let selectedWeather = 'vfr';

let state = {
    position: new THREE.Vector3(0, 914, 0),
    velocity: new THREE.Vector3(0, 0, -50),
    throttle: 0.6,
    pitch: 0,
    roll: 0,
    heading: 0,
    altitudeFt: 3000,
    iasKts: 120,
    vsFpm: 0,
    mach: 0,
    aoaDeg: 0,
    gForce: 1,
    isStalling: false
};

const $ = id => document.getElementById(id);

// ===== TUTORIAL =====
function startTutorial() {
    currentTutorialStep = 0;
    showTutorialStep();
    $('tutorialOverlay').classList.remove('hidden');
}

function showTutorialStep() {
    const step = TUTORIAL_STEPS[currentTutorialStep];
    $('tutorialTitle').textContent = step.title;
    $('tutorialContent').innerHTML = step.content;

    let dotsHtml = '';
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
        dotsHtml += `<div class="dot ${i === currentTutorialStep ? 'active' : ''}"></div>`;
    }
    $('tutorialDots').innerHTML = dotsHtml;
}

function nextTutorial() {
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        currentTutorialStep++;
        showTutorialStep();
    } else {
        $('tutorialOverlay').classList.add('hidden');
        showAircraftSelection('simulation');
    }
}

function prevTutorial() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep();
    }
}

// ===== AIRCRAFT/WEATHER SELECTION =====
function showAircraftSelection(gameMode) {
    mode = gameMode;
    $('mainMenu').classList.add('hidden');
    $('aircraftSelect').classList.remove('hidden');
    updateAircraftCards();
}

function updateAircraftCards() {
    const cards = document.querySelectorAll('.aircraft-card');
    cards.forEach(card => {
        card.classList.toggle('selected', card.dataset.aircraft === selectedAircraft);
    });
}

function selectAircraft(type) {
    selectedAircraft = type;
    updateAircraftCards();
}

function selectWeather(preset) {
    selectedWeather = preset;
    document.querySelectorAll('.weather-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.weather === preset);
    });
}

function confirmSelection() {
    $('aircraftSelect').classList.add('hidden');
    Environment.setPreset(selectedWeather);
    startGame(mode);
}

function backFromSelection() {
    $('aircraftSelect').classList.add('hidden');
    $('mainMenu').classList.remove('hidden');
}

// ===== THREE.JS SCENE =====
function initScene() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(Environment.getSkyColor());
    scene.fog = new THREE.FogExp2(Environment.getSkyColor(), Environment.getFogDensity());

    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 25000);
    renderer = new THREE.WebGLRenderer({ canvas: $('gameCanvas'), antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4 * Environment.getLightIntensity());
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffaf0, Environment.getLightIntensity());
    sun.position.set(500, 800, 300);
    sun.castShadow = true;
    scene.add(sun);

    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d6b3d, 0.5 * Environment.getLightIntensity()));

    createEnvironment();

    // Create player aircraft
    player = AircraftModels.create(selectedAircraft);
    player.position.set(0, 914, 0);
    scene.add(player);

    // Events
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        if (e.key === 'Escape' && running) togglePause();
    });
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
}

function createEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(40000, 40000, 100, 100);
    const vertices = groundGeo.attributes.position.array;
    for (let i = 2; i < vertices.length; i += 3) {
        vertices[i] = Math.sin(vertices[i - 2] * 0.001) * Math.cos(vertices[i - 1] * 0.001) * 50 +
            Math.random() * 5;
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x2d5a3d,
        roughness: 0.95,
        flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Water areas (lakes)
    for (let i = 0; i < 5; i++) {
        const lakeGeo = new THREE.CircleGeometry(300 + Math.random() * 500, 32);
        const lake = new THREE.Mesh(lakeGeo, new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.8,
            roughness: 0.2
        }));
        lake.rotation.x = -Math.PI / 2;
        lake.position.set((Math.random() - 0.5) * 15000, 1, (Math.random() - 0.5) * 15000);
        scene.add(lake);
    }

    // Mountains
    for (let i = 0; i < 20; i++) {
        const m = new THREE.Mesh(
            new THREE.ConeGeometry(300 + Math.random() * 500, 400 + Math.random() * 800, 6),
            new THREE.MeshStandardMaterial({
                color: i % 3 === 0 ? 0x8b7355 : 0x4a6b52,
                flatShading: true
            })
        );
        const angle = (i / 20) * Math.PI * 2;
        m.position.set(Math.cos(angle) * (9000 + Math.random() * 3000), 200 + Math.random() * 400, Math.sin(angle) * (9000 + Math.random() * 3000));
        m.castShadow = true;
        scene.add(m);
    }

    // Clouds based on weather
    createClouds();
}

function createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85 - Environment.current.cloudCoverage * 0.3
    });

    const numClouds = Math.floor(20 + Environment.current.cloudCoverage * 80);

    for (let i = 0; i < numClouds; i++) {
        const cloudGroup = new THREE.Group();
        const numPuffs = 4 + Math.floor(Math.random() * 6);

        for (let j = 0; j < numPuffs; j++) {
            const s = new THREE.Mesh(new THREE.SphereGeometry(20 + Math.random() * 30, 6, 5), cloudMat);
            s.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 80);
            s.scale.y = 0.5;
            cloudGroup.add(s);
        }

        const baseAlt = Environment.current.cloudBase;
        cloudGroup.position.set(
            (Math.random() - 0.5) * 20000,
            baseAlt + Math.random() * 500,
            (Math.random() - 0.5) * 20000
        );
        scene.add(cloudGroup);
    }
}

// ===== GAME START =====
function startGame(m) {
    if (!scene) initScene();

    mode = m;
    level = 1;
    levelComplete = false;
    lastAlertType = null;

    traffic.forEach(t => scene.remove(t));
    traffic = [];

    // Reset state using aircraft data
    const acData = AircraftData.get(selectedAircraft);
    state = {
        position: new THREE.Vector3(0, 914, 0),
        velocity: new THREE.Vector3(0, 0, -acData.handling.approachSpeed * 1.5),
        throttle: 0.6,
        pitch: 0,
        roll: 0,
        heading: 0,
        altitudeFt: 3000,
        iasKts: 120,
        vsFpm: 0,
        mach: 0,
        aoaDeg: 0,
        gForce: 1,
        isStalling: false
    };

    // Recreate player with selected aircraft
    if (player) scene.remove(player);
    player = AircraftModels.create(selectedAircraft);
    player.position.set(0, 914, 0);
    scene.add(player);

    // Update scene for weather
    scene.background = new THREE.Color(Environment.getSkyColor());
    scene.fog = new THREE.FogExp2(Environment.getSkyColor(), Environment.getFogDensity());

    if (mode === 'simulation') {
        loadLevel(level);
    } else {
        for (let i = 0; i < 12; i++) spawnAmbientTraffic();
        $('missionLevel').textContent = 'VOL LIBRE - ' + acData.name;
        $('missionObjective').textContent = 'Explorez avec le TCAS activé';
    }

    // Show UI
    $('mainMenu').classList.add('hidden');
    $('aircraftSelect').classList.add('hidden');
    $('tutorialOverlay').classList.add('hidden');
    $('resultScreen').classList.add('hidden');
    ['pfd', 'tcasPanel', 'throttlePanel', 'controlsHelp', 'missionInfo', 'cockpitFrame'].forEach(id => $(id)?.classList.remove('hidden'));

    // Update aircraft info display
    updateAircraftInfo();

    running = true;
    paused = false;
    clock.start();
    gameLoop();
}

function loadLevel(n) {
    const lvl = LEVELS[n - 1];
    if (!lvl) { showResult(true, 'FÉLICITATIONS', 'Tous les niveaux terminés !'); return; }

    levelComplete = false;
    traffic.forEach(t => scene.remove(t));
    traffic = [];

    // Spawn threat aircraft
    const threatColors = [[0xcc0000, 0xff3333]];
    const [c1, c2] = threatColors[0];
    const ac = AircraftModels.createTraffic('RA');
    ac.position.set(lvl.threat.x, lvl.threat.alt * 0.3048, lvl.threat.z);
    ac.userData = { speed: lvl.threat.speed, heading: lvl.threat.heading, isThreat: true };
    ac.rotation.y = -lvl.threat.heading * Math.PI / 180;
    scene.add(ac);
    traffic.push(ac);

    state.position.set(0, 914, 0);
    player.position.set(0, 914, 0);
    player.rotation.set(0, 0, 0);

    const acData = AircraftData.get(selectedAircraft);
    $('missionLevel').textContent = lvl.name + ' - ' + acData.name;
    $('missionObjective').textContent = lvl.obj;
}

function spawnAmbientTraffic() {
    const ac = AircraftModels.createTraffic('none');

    const angle = Math.random() * Math.PI * 2;
    const dist = 2000 + Math.random() * 4000;
    ac.position.set(
        Math.cos(angle) * dist,
        (2500 + Math.random() * 2000) * 0.3048,
        Math.sin(angle) * dist - 500
    );
    ac.userData = {
        speed: 40 + Math.random() * 80,
        heading: Math.random() * 360,
        turnRate: (Math.random() - 0.5) * 0.2
    };
    ac.rotation.y = -ac.userData.heading * Math.PI / 180;

    scene.add(ac);
    traffic.push(ac);
}

// ===== GAME LOOP =====
function gameLoop() {
    if (!running) return;
    requestAnimationFrame(gameLoop);
    if (paused) return;

    const dt = Math.min(clock.getDelta(), 0.05);

    updateFlight(dt);
    updateTraffic(dt);
    checkCollisions();
    if (mode === 'simulation') checkGoal();
    updateTCASDisplay();
    updateHUD();
    updateCamera(dt);

    renderer.render(scene, camera);
}

function updateFlight(dt) {
    // Get control inputs
    const controls = {
        pitch: 0,
        roll: 0,
        throttle: state.throttle
    };

    if (keys['arrowup']) controls.pitch = 1;
    if (keys['arrowdown']) controls.pitch = -1;
    if (keys['arrowleft']) controls.roll = 1;
    if (keys['arrowright']) controls.roll = -1;
    if (keys['w']) state.throttle = Math.min(1, state.throttle + dt * 0.5);
    if (keys['s']) state.throttle = Math.max(0.15, state.throttle - dt * 0.5);

    // Use physics engine for simulation
    const acData = AircraftData.get(selectedAircraft);

    // Simple physics for now (physics engine needs THREE.Vector3)
    const pitchRate = acData.handling.pitchRate * Math.PI / 180;
    const rollRate = acData.handling.rollRate * Math.PI / 180;

    state.pitch += controls.pitch * pitchRate * dt;
    state.roll += controls.roll * rollRate * dt;

    state.pitch = THREE.MathUtils.clamp(state.pitch, -0.6, 0.6);
    state.roll = THREE.MathUtils.clamp(state.roll, -1.2, 1.2);

    // Apply to aircraft rotation
    player.rotation.x = state.pitch;
    player.rotation.z = state.roll;

    // Calculate heading from turn
    const turnRate = Math.tan(state.roll) * 9.81 / Math.max(state.velocity.length(), 10);
    state.heading += turnRate * 180 / Math.PI * dt;
    state.heading = (state.heading + 360) % 360;
    player.rotation.y = -state.heading * Math.PI / 180;

    // Auto-level
    if (Math.abs(controls.roll) < 0.1) state.roll *= Math.pow(0.97, dt * 60);

    // Speed based on throttle and aircraft type
    const maxSpeed = acData.limits.vno * 0.7 + acData.limits.vno * 0.3 * state.throttle;
    const targetSpeed = maxSpeed * (0.4 + state.throttle * 0.6);
    const currentSpeed = state.velocity.length();
    const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * dt * 0.5;

    // Forward direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    state.velocity.copy(forward.multiplyScalar(newSpeed));

    // Add vertical component based on pitch
    state.velocity.y += Math.sin(state.pitch) * newSpeed * dt * 2 - 2 * dt;

    // Update position
    state.position.add(state.velocity.clone().multiplyScalar(dt));
    player.position.copy(state.position);

    // Ground check
    if (state.position.y < 30) {
        state.position.y = 30;
        state.velocity.y = Math.max(0, state.velocity.y);
        if (mode === 'simulation') showResult(false, 'CRASH', 'Contact avec le sol !');
    }

    // Update displayed values
    state.altitudeFt = state.position.y * 3.28084;
    state.iasKts = newSpeed * 1.944;
    state.vsFpm = state.velocity.y * 196.85;

    // Animate propeller if exists
    if (player.userData.propeller && acData.engine.type !== 'turbofan') {
        player.userData.propeller.rotation.z += state.throttle * 50 * dt;
    }

    // Afterburner effect for jets
    if (player.userData.afterburner && acData.engine.type === 'turbofan') {
        player.userData.afterburner.visible = state.throttle > 0.9;
    }
}

function updateTraffic(dt) {
    traffic.forEach(t => {
        if (t.userData.turnRate) {
            t.userData.heading = (t.userData.heading + t.userData.turnRate * dt * 60 + 360) % 360;
        }
        t.rotation.y = -t.userData.heading * Math.PI / 180;

        const hdgRad = t.userData.heading * Math.PI / 180;
        t.position.x += Math.sin(hdgRad) * (t.userData.speed || 70) * dt;
        t.position.z -= Math.cos(hdgRad) * (t.userData.speed || 70) * dt;

        // Animate propellers
        if (t.userData.propeller) {
            t.userData.propeller.rotation.z += 30 * dt;
        }

        // Wrap around
        if (Math.abs(t.position.x) > 15000) t.position.x = -Math.sign(t.position.x) * 15000;
        if (Math.abs(t.position.z) > 15000) t.position.z = -Math.sign(t.position.z) * 15000;
    });
}

function checkCollisions() {
    if (mode !== 'simulation') return;

    traffic.forEach(t => {
        if (!t.userData.isThreat) return;
        const dist = player.position.distanceTo(t.position);
        if (dist < 35) {
            showResult(false, 'COLLISION', 'Vous n\'avez pas suivi le TCAS !');
        }
    });
}

function checkGoal() {
    if (levelComplete) return;
    const lvl = LEVELS[level - 1];
    if (!lvl) return;

    let goalMet = false;
    if (lvl.goal.type === 'climb' && state.altitudeFt > lvl.goal.target) goalMet = true;
    if (lvl.goal.type === 'descend' && state.altitudeFt < lvl.goal.target) goalMet = true;

    if (goalMet) {
        levelComplete = true;
        level++;
        if (level > LEVELS.length) {
            showResult(true, 'FÉLICITATIONS', 'Maîtrise du TCAS complète !');
        } else {
            setTimeout(() => loadLevel(level), 2000);
            $('missionObjective').textContent = '✓ Conflit évité ! Niveau suivant...';
        }
    }
}

// ===== TCAS DISPLAY =====
function updateTCASDisplay() {
    const canvas = $('tcasDisplay');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const scale = (cx - 15) / 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-state.heading * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Range rings
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    [3, 6, 10].forEach(nm => {
        ctx.beginPath();
        ctx.arc(cx, cy, nm * scale, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.font = '11px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 16);

    ctx.restore();

    // Own aircraft
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 6, cy + 8);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.closePath();
    ctx.fill();

    let activeAlert = null;

    traffic.forEach(t => {
        const dx = t.position.x - player.position.x;
        const dz = t.position.z - player.position.z;

        const hdgRad = state.heading * Math.PI / 180;
        const relX = (dx * Math.cos(hdgRad) + dz * Math.sin(hdgRad)) / 1852 * scale;
        const relZ = (-dx * Math.sin(hdgRad) + dz * Math.cos(hdgRad)) / 1852 * scale;

        const sx = cx + relX, sy = cy + relZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const altDiff = t.position.y * 3.28084 - state.altitudeFt;

        if (Math.sqrt(relX * relX + relZ * relZ) > scale * 11) return;

        let threat = 'none';
        if (dist < 7000 && Math.abs(altDiff) < 500) threat = 'prox';
        if (dist < 4000 && Math.abs(altDiff) < 350) threat = 'TA';
        if (dist < 2200 && Math.abs(altDiff) < 250) threat = 'RA';

        if (threat === 'RA') {
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(sx - 7, sy - 7, 14, 14);
            activeAlert = { type: 'RA', alt: altDiff };
        } else if (threat === 'TA') {
            ctx.fillStyle = '#ffa500';
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI * 2);
            ctx.fill();
            if (!activeAlert) activeAlert = { type: 'TA' };
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-5, -5, 10, 10);
            ctx.restore();
        }

        // Altitude tag
        if (threat !== 'none') {
            ctx.fillStyle = threat === 'RA' ? '#ff3333' : threat === 'TA' ? '#ffa500' : '#fff';
            ctx.font = '9px Share Tech Mono';
            ctx.textAlign = 'left';
            const altTag = (altDiff >= 0 ? '+' : '') + Math.round(altDiff / 100);
            ctx.fillText(altTag, sx + 10, sy + 3);
        }
    });

    // Update alert displays
    const alertEl = $('tcasAlert');
    const pulseEl = $('screenPulse');
    const vsCmd = $('vsCommand');

    if (activeAlert) {
        alertEl.classList.remove('hidden', 'ta', 'ra');
        alertEl.classList.add(activeAlert.type.toLowerCase());
        pulseEl.classList.remove('ta', 'ra');
        pulseEl.classList.add(activeAlert.type.toLowerCase());

        if (activeAlert.type === 'RA') {
            const instruction = activeAlert.alt > 0 ? 'DESCEND' : 'CLIMB';
            $('alertText').textContent = instruction;
            $('alertInstruction').textContent = instruction === 'CLIMB' ? '↑ +1500 ft/min' : '↓ -1500 ft/min';

            vsCmd.classList.remove('hidden');
            const targetVs = instruction === 'CLIMB' ? 1500 : -1500;
            $('targetVs').textContent = (targetVs > 0 ? '+' : '') + targetVs;
            $('vsTarget').style.top = (50 - targetVs / 40) + '%';
            $('vsCurrent').style.top = (50 - state.vsFpm / 40) + '%';

            if (lastAlertType !== 'RA') {
                speakAlert(instruction + ', ' + instruction);
            }
        } else {
            $('alertText').textContent = 'TRAFFIC';
            $('alertInstruction').textContent = 'Surveillez le trafic';
            vsCmd.classList.add('hidden');

            if (lastAlertType !== 'TA' && lastAlertType !== 'RA') {
                speakAlert('Traffic, Traffic');
            }
        }
        lastAlertType = activeAlert.type;
    } else {
        if (lastAlertType) {
            speakAlert('Clear of Conflict');
        }
        lastAlertType = null;
        alertEl.classList.add('hidden');
        pulseEl.classList.remove('ta', 'ra');
        vsCmd.classList.add('hidden');
    }
}

function speakAlert(text) {
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.1;
        u.pitch = 0.9;
        u.volume = 0.8;
        speechSynthesis.speak(u);
    }
}

function updateHUD() {
    $('altValue').textContent = Math.round(state.altitudeFt);
    $('iasValue').textContent = Math.round(state.iasKts);
    $('hdgValue').textContent = String(Math.round(state.heading)).padStart(3, '0');
    $('vsValue').textContent = Math.round(state.vsFpm);

    $('throttleFill').style.height = `${state.throttle * 100}%`;
    $('throttleValue').textContent = `${Math.round(state.throttle * 100)}%`;

    // Update attitude display
    const pitchOffset = -state.pitch * 80;
    if ($('pitchLadder')) $('pitchLadder').style.transform = `translateY(${pitchOffset}px)`;
}

function updateAircraftInfo() {
    const acData = AircraftData.get(selectedAircraft);
    const infoEl = $('aircraftInfoDisplay');
    if (infoEl) {
        infoEl.textContent = acData.name.toUpperCase();
    }
}

function updateCamera(dt) {
    const offset = new THREE.Vector3(0, 10, -40);
    offset.applyQuaternion(player.quaternion);
    camera.position.lerp(player.position.clone().add(offset), 4 * dt);
    camera.lookAt(player.position);
}

// ===== UI FUNCTIONS =====
function showResult(success, title, message) {
    running = false;
    const el = $('resultScreen');
    el.classList.remove('hidden', 'crash', 'success');
    el.classList.add(success ? 'success' : 'crash');
    $('resultTitle').textContent = title;
    $('resultMessage').textContent = message;
}

function retryGame() {
    $('resultScreen').classList.add('hidden');
    if (mode === 'simulation') level = 1;
    startGame(mode);
}

function backToMenu() {
    running = false;
    traffic.forEach(t => scene.remove(t));
    traffic = [];

    ['resultScreen', 'pauseScreen', 'tcasAlert', 'screenPulse', 'vsCommand'].forEach(id => $(id)?.classList.add('hidden'));
    $('screenPulse').classList.remove('ta', 'ra');
    ['pfd', 'tcasPanel', 'throttlePanel', 'controlsHelp', 'missionInfo', 'cockpitFrame'].forEach(id => $(id)?.classList.add('hidden'));
    $('mainMenu').classList.remove('hidden');
}

function togglePause() {
    paused = !paused;
    $('pauseScreen').classList.toggle('hidden', !paused);
    if (!paused) { clock.start(); gameLoop(); }
}

function resumeGame() {
    paused = false;
    $('pauseScreen').classList.add('hidden');
    clock.start();
    gameLoop();
}

// Global exports
window.startTutorial = startTutorial;
window.nextTutorial = nextTutorial;
window.prevTutorial = prevTutorial;
window.startGame = startGame;
window.showAircraftSelection = showAircraftSelection;
window.selectAircraft = selectAircraft;
window.selectWeather = selectWeather;
window.confirmSelection = confirmSelection;
window.backFromSelection = backFromSelection;
window.retryGame = retryGame;
window.backToMenu = backToMenu;
window.resumeGame = resumeGame;

console.log('main-simulator.js loaded');
