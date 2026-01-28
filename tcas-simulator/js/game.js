// ===== GAME.JS - Main Game Controller (Enhanced) =====
// Integrates all modules: Physics, Autopilot, Weather, Navigation, Audio

const GAME = (() => {
    let scene, camera, renderer, player, clock;
    let traffic = [];
    let keys = {};
    let running = false, paused = false;
    let mode = 'sandbox';
    let level = 1;
    let levelComplete = false;
    let selectedAircraft = 'c172';
    let lastAlertType = null;

    // Flight state
    let state = {
        position: { x: 0, y: 914, z: 0 }, // ~3000ft in meters
        velocity: { x: 0, y: 0, z: -50 },
        rotation: { pitch: 0, roll: 0, yaw: 0 },
        throttle: 0.6,
        altitude: 3000,
        speed: 50,
        ias: 120,
        tas: 120,
        groundSpeed: 120,
        machNumber: 0.18,
        verticalSpeed: 0,
        heading: 0,
        aoa: 0,
        gForce: { x: 0, y: 1, z: 0, total: 1 },
        isStalling: false
    };

    const $ = id => document.getElementById(id);

    // LEVELS
    const LEVELS = [
        { name: 'Niveau 1', obj: 'CLIMB - Montez au-dessus de 3200 ft', threat: { x: 0, alt: 2800, z: -2500, speed: 85, heading: 0 }, goal: { type: 'climb', target: 3200 } },
        { name: 'Niveau 2', obj: 'DESCEND - Descendez sous 2800 ft', threat: { x: 100, alt: 3200, z: -2500, speed: 90, heading: 0 }, goal: { type: 'descend', target: 2800 } },
        { name: 'Niveau 3', obj: 'CLIMB - Montez au-dessus de 3500 ft', threat: { x: -50, alt: 2700, z: -2000, speed: 95, heading: 10 }, goal: { type: 'climb', target: 3500 } },
        { name: 'Niveau 4', obj: 'DESCEND - Descendez sous 2500 ft', threat: { x: 50, alt: 3400, z: -2200, speed: 100, heading: -5 }, goal: { type: 'descend', target: 2500 } },
        { name: 'Niveau 5', obj: 'CLIMB rapide - Au-dessus de 4000 ft', threat: { x: 0, alt: 2600, z: -1800, speed: 110, heading: 0 }, goal: { type: 'climb', target: 4000 } }
    ];

    function init() {
        clock = new THREE.Clock();
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x5aafdb);
        scene.fog = new THREE.FogExp2(0x8ec5e8, 0.00012);

        camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 20000);
        renderer = new THREE.WebGLRenderer({ canvas: $('canvas'), antialias: true });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const sun = new THREE.DirectionalLight(0xfffaf0, 1.2);
        sun.position.set(500, 800, 300);
        scene.add(sun);
        scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d6b3d, 0.6));

        createEnvironment();
        player = createAircraft(0x1e3a5f, 0x2980b9);
        player.position.set(0, 914, 0);
        scene.add(player);

        // Initialize modules
        FlightPhysics.init(selectedAircraft);
        Navigation.init();
        Audio.init();
        Weather.setPreset('calm');

        // Event listeners
        window.addEventListener('keydown', e => {
            keys[e.key.toLowerCase()] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
            if (e.key === 'Escape' && running) togglePause();
            Autopilot.handleKey(e.key.toLowerCase(), state);
        });
        window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });
    }

    function createEnvironment() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(20000, 20000),
            new THREE.MeshStandardMaterial({ color: 0x3d6b4a, roughness: 0.9 })
        );
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        for (let i = 0; i < 8; i++) {
            const m = new THREE.Mesh(
                new THREE.ConeGeometry(300 + Math.random() * 300, 400 + Math.random() * 500, 6),
                new THREE.MeshStandardMaterial({ color: 0x4a6b52 })
            );
            const angle = (i / 8) * Math.PI * 2;
            m.position.set(Math.cos(angle) * 6000, 200, Math.sin(angle) * 6000);
            scene.add(m);
        }

        for (let i = 0; i < 30; i++) {
            const cloud = createCloud();
            cloud.position.set((Math.random() - 0.5) * 10000, 600 + Math.random() * 500, (Math.random() - 0.5) * 10000);
            scene.add(cloud);
        }
    }

    function createCloud() {
        const g = new THREE.Group();
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        for (let i = 0; i < 5; i++) {
            const s = new THREE.Mesh(new THREE.SphereGeometry(15 + Math.random() * 20, 8, 6), m);
            s.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 50);
            s.scale.y = 0.6;
            g.add(s);
        }
        return g;
    }

    function createAircraft(c1, c2) {
        const g = new THREE.Group();
        const mat1 = new THREE.MeshStandardMaterial({ color: c1, metalness: 0.6, roughness: 0.3 });
        const mat2 = new THREE.MeshStandardMaterial({ color: c2, metalness: 0.5, roughness: 0.4 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 16), mat1);
        body.rotation.x = Math.PI / 2;
        g.add(body);

        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 16), mat1);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = 7.25;
        g.add(nose);

        const wing = new THREE.Mesh(new THREE.BoxGeometry(14, 0.15, 2.5), mat2);
        wing.position.y = -0.1;
        g.add(wing);

        const tv = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 1.8), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
        tv.position.set(0, 1.3, -6);
        g.add(tv);

        const th = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 1.2), mat2);
        th.position.set(0, 0.2, -6.5);
        g.add(th);

        for (let side of [-1, 1]) {
            const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 2, 12), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
            eng.rotation.x = Math.PI / 2;
            eng.position.set(side * 4, -0.6, 0.5);
            g.add(eng);
        }

        g.scale.set(0.35, 0.35, 0.35);
        return g;
    }

    function start(m) {
        if (!scene) init();

        selectedAircraft = $('aircraftSelect')?.value || 'c172';
        const weatherPreset = $('weatherSelect')?.value || 'calm';

        FlightPhysics.init(selectedAircraft);
        Weather.setPreset(weatherPreset);

        mode = m;
        level = 1;
        levelComplete = false;

        traffic.forEach(t => scene.remove(t));
        traffic = [];

        // Reset state
        state = {
            position: { x: 0, y: 914, z: 0 },
            velocity: { x: 0, y: 0, z: -50 },
            rotation: { pitch: 0, roll: 0, yaw: 0 },
            throttle: 0.6,
            altitude: 3000,
            speed: 50,
            ias: 120,
            heading: 0,
            aoa: 0,
            isStalling: false,
            gForce: { x: 0, y: 1, z: 0, total: 1 }
        };

        player.position.set(0, 914, 0);
        player.rotation.set(0, 0, 0);

        if (mode === 'simulation') {
            loadLevel(level);
        } else {
            for (let i = 0; i < 8; i++) spawnAmbientTraffic();
            $('lvlTxt').textContent = 'Vol Libre';
            $('objTxt').textContent = 'Explorez le ciel sans contraintes';
        }

        $('menu').classList.add('hidden');
        $('gameOver').classList.add('hidden');
        ['pfd', 'tcas', 'thr', 'info', 'apPanel', 'windDisplay'].forEach(x => $(x)?.classList.remove('hidden'));

        Audio.startEngineSound();
        running = true;
        paused = false;
        clock.start();
        loop();
    }

    function loadLevel(n) {
        const lvl = LEVELS[n - 1];
        if (!lvl) { showGameOver(true, 'Simulation terminée !'); return; }

        levelComplete = false;
        traffic.forEach(t => scene.remove(t));
        traffic = [];

        const ac = createAircraft(0xcc0000, 0xff3333);
        ac.position.set(lvl.threat.x, lvl.threat.alt * 0.3048, lvl.threat.z);
        ac.userData = { speed: lvl.threat.speed, heading: lvl.threat.heading, isThreat: true };
        ac.rotation.y = -lvl.threat.heading * Math.PI / 180;
        scene.add(ac);
        traffic.push(ac);

        state.position = { x: 0, y: 914, z: 0 };
        player.position.set(0, 914, 0);
        player.rotation.set(0, 0, 0);

        $('lvlTxt').textContent = lvl.name;
        $('objTxt').textContent = lvl.obj;
    }

    function spawnAmbientTraffic() {
        const colors = [[0x2874a6, 0x3498db], [0x6c3483, 0x9b59b6], [0x1e8449, 0x27ae60], [0xb9770e, 0xf39c12]];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const ac = createAircraft(c[0], c[1]);

        const angle = Math.random() * Math.PI * 2;
        const dist = 1000 + Math.random() * 2000;
        ac.position.set(Math.cos(angle) * dist, (2700 + Math.random() * 600) * 0.3048, Math.sin(angle) * dist - 500);
        ac.userData = { speed: 50 + Math.random() * 60, heading: Math.random() * 360, turnRate: (Math.random() - 0.5) * 0.4 };
        ac.rotation.y = -ac.userData.heading * Math.PI / 180;

        scene.add(ac);
        traffic.push(ac);
    }

    function loop() {
        if (!running) return;
        requestAnimationFrame(loop);
        if (paused) return;

        const dt = Math.min(clock.getDelta(), 0.05);

        updateFlight(dt);
        updateTraffic(dt);
        checkCollisions();
        if (mode === 'simulation') checkGoal();
        updateTCAS();
        updateHUD();
        updateCamera(dt);

        renderer.render(scene, camera);
    }

    function updateFlight(dt) {
        let pitchInput = 0, rollInput = 0, throttleInput = 0;

        if (keys['arrowup']) pitchInput = 1;
        if (keys['arrowdown']) pitchInput = -1;
        if (keys['arrowleft']) rollInput = 1;
        if (keys['arrowright']) rollInput = -1;
        if (keys['w']) throttleInput = 0.5;
        if (keys['s']) throttleInput = -0.5;

        // Get autopilot inputs
        if (Autopilot.enabled) {
            const apInputs = Autopilot.update(state, dt);
            if (!keys['arrowup'] && !keys['arrowdown']) pitchInput += apInputs.pitchInput;
            if (!keys['arrowleft'] && !keys['arrowright']) rollInput += apInputs.rollInput;
            throttleInput += apInputs.throttleInput;
        }

        // Apply weather effects
        const turbulence = Weather.getTurbulenceEffect(dt);
        state.velocity.x += turbulence.x;
        state.velocity.y += turbulence.y;

        // Update state using physics
        const inputs = { pitchInput, rollInput, yawInput: 0, throttleInput };
        state = FlightPhysics.update(state, inputs, dt);

        // Update 3D model
        player.position.set(state.position.x, state.position.y, state.position.z);
        player.rotation.set(state.rotation.pitch, state.rotation.yaw, state.rotation.roll, 'YXZ');

        // Stall warning
        if (state.isStalling) {
            $('stallWarning')?.classList.remove('hidden');
            Audio.playStallWarning();
        } else {
            $('stallWarning')?.classList.add('hidden');
        }

        // Update engine sound
        Audio.updateEngineSound(state.throttle, state.speed);

        // Ground collision
        if (state.position.y < 30) {
            state.position.y = 30;
            if (mode === 'simulation') showGameOver(false, 'Crash au sol !');
        }
    }

    function updateTraffic(dt) {
        traffic.forEach(t => {
            if (t.userData.turnRate) {
                t.userData.heading = (t.userData.heading + t.userData.turnRate * dt * 60 + 360) % 360;
            }
            t.rotation.y = -t.userData.heading * Math.PI / 180;

            const headingRad = t.userData.heading * Math.PI / 180;
            t.position.x += Math.sin(headingRad) * (t.userData.speed || 70) * dt;
            t.position.z -= Math.cos(headingRad) * (t.userData.speed || 70) * dt;

            if (t.position.x > 10000) t.position.x = -10000;
            if (t.position.x < -10000) t.position.x = 10000;
            if (t.position.z > 10000) t.position.z = -10000;
            if (t.position.z < -10000) t.position.z = 10000;
        });
    }

    function checkCollisions() {
        if (mode !== 'simulation') return;

        traffic.forEach(t => {
            if (!t.userData.isThreat) return;
            const dx = t.position.x - player.position.x;
            const dy = t.position.y - player.position.y;
            const dz = t.position.z - player.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 25) showGameOver(false, 'Collision avec un autre avion !');
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
                showGameOver(true, 'Tous les niveaux complétés !');
            } else {
                setTimeout(() => loadLevel(level), 1500);
                $('objTxt').textContent = '✓ Niveau réussi ! Prochain niveau...';
            }
        }
    }

    function showGameOver(success, msg) {
        running = false;
        Audio.stopEngineSound();

        const go = $('gameOver');
        go.classList.remove('hidden', 'crash', 'success');
        go.classList.add(success ? 'success' : 'crash');
        $('goTitle').textContent = success ? '✓ RÉUSSI' : '💥 COLLISION';
        $('goMsg').textContent = msg;
    }

    function updateTCAS() {
        const c = $('tcasCanvas');
        const ctx = c.getContext('2d');
        const cx = c.width / 2, cy = c.height / 2;
        const scale = (cx - 8) / 10;

        ctx.clearRect(0, 0, c.width, c.height);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-state.heading * Math.PI / 180);
        ctx.translate(-cx, -cy);

        ctx.strokeStyle = 'rgba(0,229,255,0.15)';
        ctx.lineWidth = 1;
        [3, 6, 10].forEach(nm => { ctx.beginPath(); ctx.arc(cx, cy, nm * scale, 0, Math.PI * 2); ctx.stroke(); });

        ctx.fillStyle = 'rgba(0,229,255,0.6)';
        ctx.font = '10px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, 12);
        ctx.restore();

        ctx.fillStyle = '#00ff9d';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx - 4, cy + 5);
        ctx.lineTo(cx + 4, cy + 5);
        ctx.fill();

        let activeAlert = null;

        traffic.forEach(t => {
            const dx = t.position.x - player.position.x;
            const dz = t.position.z - player.position.z;
            const headingRad = state.heading * Math.PI / 180;
            const relX = (dx * Math.cos(headingRad) + dz * Math.sin(headingRad)) / 1852 * scale;
            const relZ = (-dx * Math.sin(headingRad) + dz * Math.cos(headingRad)) / 1852 * scale;

            const sx = cx + relX, sy = cy + relZ;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const altDiff = t.position.y * 3.28084 - state.altitude;

            if (Math.sqrt(relX * relX + relZ * relZ) > scale * 11) return;

            let threat = 'none';
            if (dist < 6000 && Math.abs(altDiff) < 400) threat = 'prox';
            if (dist < 3500 && Math.abs(altDiff) < 300) threat = 'TA';
            if (dist < 2000 && Math.abs(altDiff) < 200) threat = 'RA';

            if (threat === 'RA') {
                ctx.fillStyle = '#ff3d3d';
                ctx.fillRect(sx - 5, sy - 5, 10, 10);
                activeAlert = { type: 'RA', alt: altDiff };
            } else if (threat === 'TA') {
                ctx.fillStyle = '#ffd000';
                ctx.beginPath();
                ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                ctx.fill();
                if (!activeAlert) activeAlert = { type: 'TA' };
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-3, -3, 6, 6);
                ctx.restore();
            }
        });

        const alertEl = $('alert');
        const labelEl = $('alertLabel');

        if (activeAlert) {
            alertEl.classList.remove('hidden', 'ta', 'ra');
            alertEl.classList.add('active', activeAlert.type.toLowerCase());
            labelEl.classList.remove('hidden', 'ta', 'ra');
            labelEl.classList.add(activeAlert.type.toLowerCase());
            labelEl.textContent = activeAlert.type === 'RA' ? (activeAlert.alt > 0 ? '⚠️ DESCEND' : '⚠️ CLIMB') : '⚠️ TRAFFIC';

            // Play audio alerts
            if (activeAlert.type !== lastAlertType) {
                if (activeAlert.type === 'RA') {
                    activeAlert.alt > 0 ? Audio.playDescendAlert() : Audio.playClimbAlert();
                } else if (activeAlert.type === 'TA') {
                    Audio.playTrafficAlert();
                }
                lastAlertType = activeAlert.type;
            }
        } else {
            if (lastAlertType) Audio.playClearOfConflict();
            lastAlertType = null;
            alertEl.classList.remove('active', 'ta', 'ra');
            alertEl.classList.add('hidden');
            labelEl.classList.add('hidden');
        }
    }

    function updateHUD() {
        $('vAlt').textContent = Math.round(state.altitude);
        $('vSpd').textContent = Math.round(state.ias);
        $('vHdg').textContent = String(Math.round(state.heading)).padStart(3, '0');
        $('vVs').textContent = Math.round(state.verticalSpeed);
        $('vGs') && ($('vGs').textContent = Math.round(state.groundSpeed));
        $('vMach') && ($('vMach').textContent = state.machNumber.toFixed(2));
        $('vAoa') && ($('vAoa').textContent = state.aoa.toFixed(1) + '°');
        $('vG') && ($('vG').textContent = state.gForce.total.toFixed(1));
        $('thrFill').style.height = `${state.throttle * 100}%`;
        $('thrVal').textContent = `${Math.round(state.throttle * 100)}%`;

        // Wind display
        const windInfo = $('windInfo');
        const windArrow = $('windArrow');
        if (windInfo && windArrow) {
            windInfo.textContent = `${String(Math.round(Weather.wind.direction)).padStart(3, '0')}°/${Math.round(Weather.wind.speed * 1.94)}kt`;
            windArrow.style.transform = `rotate(${Weather.wind.direction}deg)`;
        }

        Autopilot.updateUI();
    }

    function updateCamera(dt) {
        const offset = new THREE.Vector3(0, 8, -45);
        offset.applyQuaternion(player.quaternion);
        camera.position.lerp(player.position.clone().add(offset), 2 * dt);
        camera.lookAt(player.position);
    }

    function togglePause() {
        paused = !paused;
        $('pause').classList.toggle('hidden', !paused);
        if (!paused) { clock.start(); loop(); }
    }

    // Public API
    return {
        start,
        retry: () => { $('gameOver').classList.add('hidden'); if (mode === 'simulation') level = 1; start(mode); },
        backToMenu: () => {
            running = false;
            Audio.stopEngineSound();
            traffic.forEach(t => scene.remove(t));
            traffic = [];
            ['gameOver', 'pause', 'alert', 'alertLabel', 'stallWarning'].forEach(x => $(x)?.classList.add('hidden'));
            ['pfd', 'tcas', 'thr', 'info', 'apPanel', 'windDisplay'].forEach(x => $(x)?.classList.add('hidden'));
            $('menu').classList.remove('hidden');
        },
        resume: () => { paused = false; $('pause').classList.add('hidden'); clock.start(); loop(); },
        getHeading: () => state.heading,
        getAltitude: () => state.altitude,
        getVS: () => state.verticalSpeed,
        getIAS: () => state.ias
    };
})();

console.log('game.js loaded');
