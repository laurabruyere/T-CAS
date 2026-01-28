// ===== TCAS-IMMERSIVE.JS - Complete TCAS Training Simulator =====

// Tutorial content explaining TCAS
const TUTORIAL_STEPS = [
    {
        title: "QU'EST-CE QUE LE TCAS ?",
        content: `
            <p>Le <strong>TCAS</strong> (Traffic Collision Avoidance System) est un système de sécurité embarqué qui protège les avions contre les risques de collision en vol.</p>
            <p>Il fonctionne de manière <em>indépendante</em> du contrôle aérien et communique directement avec les autres avions équipés de transpondeurs.</p>
            <div class="tcas-demo">
                <p>🛫 Le TCAS surveille l'espace aérien dans un rayon de <strong>40 NM</strong> horizontalement et <strong>±9900 ft</strong> verticalement.</p>
            </div>
        `
    },
    {
        title: "LES DEUX TYPES D'ALERTES",
        content: `
            <p>Le TCAS génère deux types d'alertes selon le niveau de danger :</p>
            <div class="tcas-demo">
                <p><strong style="color:#ffa500">⚠️ TA - Traffic Advisory</strong></p>
                <p>Alerte préventive (~40 secondes avant conflit potentiel). Vous devez rechercher visuellement le trafic conflictuel.</p>
                <br>
                <p><strong style="color:#ff3333">🚨 RA - Resolution Advisory</strong></p>
                <p>Alerte critique (~25 secondes). Le TCAS vous donne une instruction de manœuvre que vous <em>DEVEZ suivre immédiatement</em>.</p>
            </div>
        `
    },
    {
        title: "L'AFFICHAGE TCAS",
        content: `
            <p>L'écran TCAS montre votre avion au centre et le trafic environnant avec différents symboles :</p>
            <div class="tcas-demo">
                <div class="tcas-symbols">
                    <div class="symbol-item">
                        <div class="sym diamond"></div>
                        <span>Trafic normal<br>(OTHER)</span>
                    </div>
                    <div class="symbol-item">
                        <div class="sym circle"></div>
                        <span>Advisory<br>(TA - Jaune)</span>
                    </div>
                    <div class="symbol-item">
                        <div class="sym square"></div>
                        <span>Resolution<br>(RA - Rouge)</span>
                    </div>
                </div>
            </div>
            <p>Les chiffres près des symboles indiquent la différence d'altitude en centaines de pieds (ex: +05 = 500 ft au-dessus).</p>
        `
    },
    {
        title: "COMMENT RÉAGIR À UN RA",
        content: `
            <p>Quand vous recevez un <strong style="color:#ff3333">RA (Resolution Advisory)</strong>, vous devez :</p>
            <div class="tcas-demo">
                <p><strong>1.</strong> Réagir <em>immédiatement</em> (dans les 5 secondes)</p>
                <p><strong>2.</strong> Suivre l'instruction vocale :</p>
                <ul style="margin-left:20px; margin-top:10px">
                    <li><strong>"CLIMB, CLIMB"</strong> → Cabrer et monter à +1500 ft/min minimum</li>
                    <li><strong>"DESCEND, DESCEND"</strong> → Piquer et descendre à -1500 ft/min minimum</li>
                </ul>
                <p style="margin-top:15px"><strong>3.</strong> Maintenir la manœuvre jusqu'à l'annonce <em>"Clear of Conflict"</em></p>
            </div>
        `
    },
    {
        title: "PRÊT À VOLER !",
        content: `
            <p>Vous allez maintenant mettre en pratique vos connaissances.</p>
            <div class="tcas-demo">
                <p><strong>Contrôles :</strong></p>
                <ul style="margin-left:20px">
                    <li>↑ / ↓ : Tangage (monter/descendre le nez)</li>
                    <li>← / → : Roulis (incliner l'avion)</li>
                    <li>W / S : Augmenter/réduire la puissance</li>
                    <li>ESC : Pause</li>
                </ul>
            </div>
            <p style="margin-top:20px; color:#00ff41"><strong>Objectif :</strong> Suivez les instructions du TCAS pour éviter les collisions !</p>
        `
    }
];

// Game levels
const LEVELS = [
    { name: 'NIVEAU 1', obj: 'RA CLIMB - Montez au-dessus de 3200 ft', threat: { x: 0, alt: 2800, z: -2500, speed: 85, heading: 0 }, goal: { type: 'climb', target: 3200 } },
    { name: 'NIVEAU 2', obj: 'RA DESCEND - Descendez sous 2800 ft', threat: { x: 100, alt: 3200, z: -2500, speed: 90, heading: 0 }, goal: { type: 'descend', target: 2800 } },
    { name: 'NIVEAU 3', obj: 'RA CLIMB - Évitez le trafic convergent', threat: { x: -50, alt: 2700, z: -2000, speed: 95, heading: 10 }, goal: { type: 'climb', target: 3500 } },
    { name: 'NIVEAU 4', obj: 'RA DESCEND - Réaction rapide !', threat: { x: 50, alt: 3400, z: -2200, speed: 100, heading: -5 }, goal: { type: 'descend', target: 2500 } },
    { name: 'NIVEAU 5', obj: 'RA CLIMB - Menace imminente !', threat: { x: 0, alt: 2600, z: -1800, speed: 110, heading: 0 }, goal: { type: 'climb', target: 4000 } }
];

// Game state
let scene, camera, renderer, player, clock;
let traffic = [];
let keys = {};
let running = false, paused = false;
let mode = 'sandbox';
let level = 1;
let levelComplete = false;
let currentTutorialStep = 0;
let lastAlertType = null;
let alertAudioPlayed = false;

let state = {
    position: { x: 0, y: 914, z: 0 },
    velocity: { x: 0, y: 0, z: -50 },
    throttle: 0.6,
    pitch: 0,
    roll: 0,
    heading: 0,
    altitude: 3000,
    ias: 120,
    vs: 0
};

const $ = id => document.getElementById(id);

// ===== TUTORIAL SYSTEM =====
function startTutorial() {
    currentTutorialStep = 0;
    showTutorialStep();
    $('tutorialOverlay').classList.remove('hidden');
}

function showTutorialStep() {
    const step = TUTORIAL_STEPS[currentTutorialStep];
    $('tutorialTitle').textContent = step.title;
    $('tutorialContent').innerHTML = step.content;

    // Update dots
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
        startGame('simulation');
    }
}

function prevTutorial() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep();
    }
}

// ===== THREE.JS SETUP =====
function initScene() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5aafdb);
    scene.fog = new THREE.FogExp2(0x8ec5e8, 0.00008);

    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 25000);
    renderer = new THREE.WebGLRenderer({ canvas: $('gameCanvas'), antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfffaf0, 1.2);
    sun.position.set(500, 800, 300);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d6b3d, 0.6));

    createEnvironment();
    player = createAircraft(0x1e3a5f, 0x2980b9);
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
    // Ground with texture pattern
    const groundGeo = new THREE.PlaneGeometry(30000, 30000, 50, 50);
    const vertices = groundGeo.attributes.position.array;
    for (let i = 2; i < vertices.length; i += 3) {
        vertices[i] = Math.sin(vertices[i - 2] * 0.002) * Math.cos(vertices[i - 1] * 0.002) * 30;
    }
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
        color: 0x2d5a3d, roughness: 0.9
    }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Mountains
    for (let i = 0; i < 12; i++) {
        const m = new THREE.Mesh(
            new THREE.ConeGeometry(400 + Math.random() * 400, 500 + Math.random() * 600, 6),
            new THREE.MeshStandardMaterial({ color: 0x4a6b52 })
        );
        const angle = (i / 12) * Math.PI * 2;
        m.position.set(Math.cos(angle) * 8000, 250, Math.sin(angle) * 8000);
        scene.add(m);
    }

    // Clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 40; i++) {
        const cloudGroup = new THREE.Group();
        for (let j = 0; j < 6; j++) {
            const s = new THREE.Mesh(new THREE.SphereGeometry(20 + Math.random() * 25, 8, 6), cloudMat);
            s.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 60);
            s.scale.y = 0.6;
            cloudGroup.add(s);
        }
        cloudGroup.position.set((Math.random() - 0.5) * 15000, 400 + Math.random() * 400, (Math.random() - 0.5) * 15000);
        scene.add(cloudGroup);
    }
}

function createAircraft(c1, c2) {
    const g = new THREE.Group();
    const mat1 = new THREE.MeshStandardMaterial({ color: c1, metalness: 0.6, roughness: 0.3 });
    const mat2 = new THREE.MeshStandardMaterial({ color: c2, metalness: 0.5, roughness: 0.4 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 14, 16), mat1);
    body.rotation.x = Math.PI / 2;
    g.add(body);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1, 3, 16), mat1);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 8.5;
    g.add(nose);

    // Wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 3), mat2);
    wing.position.y = -0.2;
    g.add(wing);

    // Tail
    const tv = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 2), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
    tv.position.set(0, 1.5, -7);
    g.add(tv);

    const th = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 1.5), mat2);
    th.position.set(0, 0.3, -7.5);
    g.add(th);

    // Engines
    for (let side of [-1, 1]) {
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 2.5, 12), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
        eng.rotation.x = Math.PI / 2;
        eng.position.set(side * 5, -0.7, 0.5);
        g.add(eng);
    }

    g.scale.set(0.4, 0.4, 0.4);
    return g;
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

    // Reset state
    state = {
        position: { x: 0, y: 914, z: 0 },
        velocity: { x: 0, y: 0, z: -50 },
        throttle: 0.6,
        pitch: 0,
        roll: 0,
        heading: 0,
        altitude: 3000,
        ias: 120,
        vs: 0
    };

    player.position.set(0, 914, 0);
    player.rotation.set(0, 0, 0);

    if (mode === 'simulation') {
        loadLevel(level);
    } else {
        for (let i = 0; i < 10; i++) spawnAmbientTraffic();
        $('missionLevel').textContent = 'VOL LIBRE';
        $('missionObjective').textContent = 'Observez le TCAS en action';
    }

    // Show UI
    $('mainMenu').classList.add('hidden');
    $('tutorialOverlay').classList.add('hidden');
    $('resultScreen').classList.add('hidden');
    ['pfd', 'tcasPanel', 'throttlePanel', 'controlsHelp', 'missionInfo', 'cockpitFrame'].forEach(id => $(id)?.classList.remove('hidden'));

    running = true;
    paused = false;
    clock.start();
    gameLoop();
}

function loadLevel(n) {
    const lvl = LEVELS[n - 1];
    if (!lvl) { showResult(true, 'Félicitations !', 'Vous avez terminé tous les niveaux !'); return; }

    levelComplete = false;
    traffic.forEach(t => scene.remove(t));
    traffic = [];

    // Spawn threat
    const ac = createAircraft(0xcc0000, 0xff3333);
    ac.position.set(lvl.threat.x, lvl.threat.alt * 0.3048, lvl.threat.z);
    ac.userData = { speed: lvl.threat.speed, heading: lvl.threat.heading, isThreat: true };
    ac.rotation.y = -lvl.threat.heading * Math.PI / 180;
    scene.add(ac);
    traffic.push(ac);

    state.position = { x: 0, y: 914, z: 0 };
    player.position.set(0, 914, 0);
    player.rotation.set(0, 0, 0);

    $('missionLevel').textContent = lvl.name;
    $('missionObjective').textContent = lvl.obj;
}

function spawnAmbientTraffic() {
    const colors = [[0x2874a6, 0x3498db], [0x6c3483, 0x9b59b6], [0x1e8449, 0x27ae60], [0xb9770e, 0xf39c12]];
    const c = colors[Math.floor(Math.random() * colors.length)];
    const ac = createAircraft(c[0], c[1]);

    const angle = Math.random() * Math.PI * 2;
    const dist = 1500 + Math.random() * 3000;
    ac.position.set(Math.cos(angle) * dist, (2500 + Math.random() * 1000) * 0.3048, Math.sin(angle) * dist - 500);
    ac.userData = { speed: 50 + Math.random() * 60, heading: Math.random() * 360, turnRate: (Math.random() - 0.5) * 0.3 };
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
    let pitchInput = 0, rollInput = 0;
    if (keys['arrowup']) pitchInput = 1;
    if (keys['arrowdown']) pitchInput = -1;
    if (keys['arrowleft']) rollInput = 1;
    if (keys['arrowright']) rollInput = -1;
    if (keys['w']) state.throttle = Math.min(1, state.throttle + dt * 0.5);
    if (keys['s']) state.throttle = Math.max(0.15, state.throttle - dt * 0.5);

    // Smooth controls
    if (pitchInput !== 0) state.pitch += (pitchInput - state.pitch) * 2 * dt;
    else state.pitch *= Math.max(0, 1 - 2 * dt);

    if (rollInput !== 0) state.roll += (rollInput - state.roll) * 3 * dt;
    else state.roll *= Math.max(0, 1 - 2 * dt);

    // Apply to aircraft
    player.rotation.x += state.pitch * dt * 0.5;
    player.rotation.z += state.roll * dt * 0.8;
    player.rotation.x = THREE.MathUtils.clamp(player.rotation.x, -0.6, 0.6);
    player.rotation.z = THREE.MathUtils.clamp(player.rotation.z, -0.9, 0.9);
    player.rotation.y -= player.rotation.z * dt * 0.4;

    if (Math.abs(rollInput) < 0.1) player.rotation.z *= 0.98;

    state.heading = (-player.rotation.y * 180 / Math.PI + 360) % 360;

    // Physics
    const speed = 80 + state.throttle * 150;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    state.velocity = forward.multiplyScalar(speed);
    state.velocity.y -= 3;

    player.position.add(state.velocity.clone().multiplyScalar(dt));

    // Ground collision
    if (player.position.y < 30) {
        player.position.y = 30;
        if (mode === 'simulation') showResult(false, 'CRASH', 'Vous avez touché le sol !');
    }

    // Update state values
    state.altitude = player.position.y * 3.28084;
    state.ias = speed * 1.94;
    state.vs = state.velocity.y * 196.85;
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

        // Wrap around
        if (Math.abs(t.position.x) > 12000) t.position.x = -Math.sign(t.position.x) * 12000;
        if (Math.abs(t.position.z) > 12000) t.position.z = -Math.sign(t.position.z) * 12000;
    });
}

function checkCollisions() {
    if (mode !== 'simulation') return;

    traffic.forEach(t => {
        if (!t.userData.isThreat) return;
        const dist = player.position.distanceTo(t.position);
        if (dist < 30) {
            showResult(false, 'COLLISION', 'Vous n\'avez pas suivi les instructions du TCAS !');
        }
    });
}

function checkGoal() {
    if (levelComplete) return;
    const lvl = LEVELS[level - 1];
    if (!lvl) return;

    let goalMet = false;
    if (lvl.goal.type === 'climb' && state.altitude > lvl.goal.target) goalMet = true;
    if (lvl.goal.type === 'descend' && state.altitude < lvl.goal.target) goalMet = true;

    if (goalMet) {
        levelComplete = true;
        level++;
        if (level > LEVELS.length) {
            showResult(true, 'FÉLICITATIONS', 'Vous maîtrisez le TCAS !');
        } else {
            setTimeout(() => loadLevel(level), 2000);
            $('missionObjective').textContent = '✓ Conflit évité ! Prochain niveau...';
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

    // Rotate display to heading
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

    // Cardinal N
    ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 18);

    ctx.restore();

    // Own aircraft (center)
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 6, cy + 8);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.closePath();
    ctx.fill();

    let activeAlert = null;

    // Draw traffic
    traffic.forEach(t => {
        const dx = t.position.x - player.position.x;
        const dz = t.position.z - player.position.z;

        const hdgRad = state.heading * Math.PI / 180;
        const relX = (dx * Math.cos(hdgRad) + dz * Math.sin(hdgRad)) / 1852 * scale;
        const relZ = (-dx * Math.sin(hdgRad) + dz * Math.cos(hdgRad)) / 1852 * scale;

        const sx = cx + relX, sy = cy + relZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const altDiff = t.position.y * 3.28084 - state.altitude;

        if (Math.sqrt(relX * relX + relZ * relZ) > scale * 11) return;

        // Threat level determination
        let threat = 'none';
        if (dist < 7000 && Math.abs(altDiff) < 500) threat = 'prox';
        if (dist < 4000 && Math.abs(altDiff) < 350) threat = 'TA';
        if (dist < 2200 && Math.abs(altDiff) < 250) threat = 'RA';

        // Draw symbol
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
            ctx.font = '10px Share Tech Mono';
            ctx.textAlign = 'left';
            const altTag = (altDiff >= 0 ? '+' : '') + Math.round(altDiff / 100);
            ctx.fillText(altTag, sx + 10, sy + 4);
        }
    });

    // Update alert UI
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
            $('alertInstruction').textContent = instruction === 'CLIMB' ? '↑ Montez à +1500 ft/min' : '↓ Descendez à -1500 ft/min';

            vsCmd.classList.remove('hidden');
            const targetVs = instruction === 'CLIMB' ? 1500 : -1500;
            $('targetVs').textContent = (targetVs > 0 ? '+' : '') + targetVs;
            $('vsTarget').style.top = (50 - targetVs / 40) + '%';
            $('vsCurrent').style.top = (50 - state.vs / 40) + '%';

            // Audio feedback
            if (lastAlertType !== 'RA') {
                speakAlert(instruction + ', ' + instruction);
                alertAudioPlayed = true;
            }
        } else {
            $('alertText').textContent = 'TRAFFIC';
            $('alertInstruction').textContent = 'Surveillez le trafic conflictuel';
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
    $('altValue').textContent = Math.round(state.altitude);
    $('iasValue').textContent = Math.round(state.ias);
    $('hdgValue').textContent = String(Math.round(state.heading)).padStart(3, '0');
    $('vsValue').textContent = Math.round(state.vs);

    $('throttleFill').style.height = `${state.throttle * 100}%`;
    $('throttleValue').textContent = `${Math.round(state.throttle * 100)}%`;

    // Update attitude indicator (simple version)
    const pitchOffset = -player.rotation.x * 100;
    $('pitchLadder').style.transform = `translateY(${pitchOffset}px)`;
}

function updateCamera(dt) {
    const offset = new THREE.Vector3(0, 10, -50);
    offset.applyQuaternion(player.quaternion);
    camera.position.lerp(player.position.clone().add(offset), 3 * dt);
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

// Make functions global
window.startTutorial = startTutorial;
window.nextTutorial = nextTutorial;
window.prevTutorial = prevTutorial;
window.startGame = startGame;
window.retryGame = retryGame;
window.backToMenu = backToMenu;
window.resumeGame = resumeGame;

console.log('TCAS Immersive Simulator loaded');
