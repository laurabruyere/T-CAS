// TCAS SIMULATOR - GAME CORE
const TUTO = [
    { t: "BIENVENUE", c: `<p>Bienvenue dans le <strong>Simulateur TCAS</strong>!</p><p>Apprenez le système anticollision utilisé par les avions de ligne.</p><div class="demo-box"><p>🛫 Ce tutoriel vous guidera à travers les concepts essentiels.</p></div>` },
    { t: "LE TCAS", c: `<p>Le <strong>TCAS</strong> (Traffic Collision Avoidance System) protège les avions contre les collisions.</p><div class="demo-box"><p>📡 Il surveille <strong>40 NM</strong> autour de l'avion et détecte les menaces.</p></div>` },
    { t: "LES ALERTES", c: `<div class="demo-box"><p><strong style="color:#ffaa00">⚠️ TA - Traffic Advisory</strong><br>Alerte préventive. Surveillez le trafic.</p><br><p><strong style="color:#ff4444">🚨 RA - Resolution Advisory</strong><br>Alerte critique. Suivez l'instruction immédiatement!</p></div>` },
    { t: "SYMBOLES", c: `<p>L'écran TCAS affiche:</p><div class="demo-box"><div class="symbols"><div class="sym-item"><div class="sym-box diamond"></div><span>OTHER</span></div><div class="sym-item"><div class="sym-box circle"></div><span>TA</span></div><div class="sym-item"><div class="sym-box square"></div><span>RA</span></div></div></div>` },
    { t: "PRÊT!", c: `<div class="demo-box"><p><strong>Contrôles:</strong></p><ul style="margin-left:20px"><li>↑↓: Tangage · ←→: Roulis</li><li>W/S: Puissance · ESC: Pause</li></ul><p style="margin-top:15px;color:#00ff88"><strong>Objectif:</strong> Suivez les instructions TCAS!</p></div>` }
];
const LVLS = [
    { n: 'NIVEAU 1', o: 'RA CLIMB - Montez au-dessus de 3200 ft', t: { x: 0, a: 2800, z: -2000, s: 80, h: 0 }, g: { t: 'climb', v: 3200 } },
    { n: 'NIVEAU 2', o: 'RA DESCEND - Descendez sous 2800 ft', t: { x: 80, a: 3200, z: -2000, s: 85, h: 0 }, g: { t: 'descend', v: 2800 } },
    { n: 'NIVEAU 3', o: 'RA CLIMB - Évitez le convergent', t: { x: -50, a: 2700, z: -1800, s: 90, h: 8 }, g: { t: 'climb', v: 3500 } },
    { n: 'NIVEAU 4', o: 'RA DESCEND - Réaction rapide!', t: { x: 40, a: 3400, z: -1900, s: 95, h: -5 }, g: { t: 'descend', v: 2500 } },
    { n: 'NIVEAU 5', o: 'RA CLIMB - Menace imminente!', t: { x: 0, a: 2600, z: -1500, s: 100, h: 0 }, g: { t: 'climb', v: 4000 } }
];
let scene, camera, renderer, player, clock, traffic = [], keys = {}, running = false, paused = false, mode = 'sandbox', level = 1, levelDone = false, tutoStep = 0, lastAlert = null;
let st = { pos: null, vel: null, thr: 0.6, pitch: 0, roll: 0, hdg: 0, alt: 3000, spd: 120, vs: 0 };
const $ = id => document.getElementById(id);

function startTutorial() { tutoStep = 0; showTuto(); $('tutorial').classList.remove('hidden'); }
function showTuto() { const s = TUTO[tutoStep]; $('tutoTitle').textContent = s.t; $('tutoContent').innerHTML = s.c; let d = ''; for (let i = 0; i < TUTO.length; i++)d += `<div class="dot ${i === tutoStep ? 'active' : ''}"></div>`; $('tutoDots').innerHTML = d; }
function nextTuto() { if (tutoStep < TUTO.length - 1) { tutoStep++; showTuto(); } else { $('tutorial').classList.add('hidden'); startGame('simulation'); } }
function prevTuto() { if (tutoStep > 0) { tutoStep--; showTuto(); } }

function initScene() {
    clock = new THREE.Clock(); scene = new THREE.Scene(); scene.background = new THREE.Color(0x5090c0); scene.fog = new THREE.FogExp2(0x7ab0d0, 0.00006);
    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 30000);
    renderer = new THREE.WebGLRenderer({ canvas: $('canvas'), antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scene.add(new THREE.AmbientLight(0xffffff, 0.5)); const sun = new THREE.DirectionalLight(0xfffaf0, 1.2); sun.position.set(500, 800, 300); scene.add(sun); scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d6b3d, 0.6));
    createWorld(); player = createPlane(0x1e3a5f, 0x2980b9); player.position.set(0, 914, 0); scene.add(player);
    window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault(); if (e.key === 'Escape' && running) togglePause(); });
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
}
function createWorld() {
    const gGeo = new THREE.PlaneGeometry(50000, 50000, 80, 80); const v = gGeo.attributes.position.array; for (let i = 2; i < v.length; i += 3)v[i] = Math.sin(v[i - 2] * 0.001) * Math.cos(v[i - 1] * 0.001) * 40 + Math.random() * 3; gGeo.computeVertexNormals();
    const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ color: 0x2d5a3d, roughness: 0.9, flatShading: true })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    for (let i = 0; i < 25; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(250 + Math.random() * 400, 400 + Math.random() * 700, 6), new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x8b7355 : 0x4a6b52, flatShading: true })); const a = (i / 25) * Math.PI * 2; m.position.set(Math.cos(a) * (8000 + Math.random() * 3000), 200 + Math.random() * 350, Math.sin(a) * (8000 + Math.random() * 3000)); scene.add(m); }
    for (let i = 0; i < 40; i++) { const cg = new THREE.Group(); for (let j = 0; j < 5 + Math.floor(Math.random() * 5); j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(15 + Math.random() * 25, 6, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); s.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 70); s.scale.y = 0.4; cg.add(s); } cg.position.set((Math.random() - 0.5) * 25000, 2500 + Math.random() * 1500, (Math.random() - 0.5) * 25000); scene.add(cg); }
}
function createPlane(c1, c2) {
    const g = new THREE.Group(); const m1 = new THREE.MeshStandardMaterial({ color: c1, metalness: 0.6, roughness: 0.3 }); const m2 = new THREE.MeshStandardMaterial({ color: c2, metalness: 0.5, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 14, 16), m1); body.rotation.x = Math.PI / 2; g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1, 3, 16), m1); nose.rotation.x = -Math.PI / 2; nose.position.z = 8.5; g.add(nose);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 3), m2); wing.position.y = -0.2; g.add(wing);
    const hs = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 1.5), m2); hs.position.z = -7; hs.position.y = 0.5; g.add(hs);
    const vs = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 2), m2); vs.position.set(0, 1.5, -6.5); g.add(vs);
    g.scale.set(0.4, 0.4, 0.4); return g;
}
function spawnTraffic(threat) {
    const ac = createPlane(threat ? 0xcc0000 : 0x3498db, threat ? 0xff4444 : 0x2980b9);
    if (threat) { ac.position.set(threat.x, threat.a * 0.3048, threat.z); ac.userData = { speed: threat.s, heading: threat.h, isThreat: true }; }
    else { const a = Math.random() * Math.PI * 2; const d = 1500 + Math.random() * 3500; ac.position.set(Math.cos(a) * d, (2500 + Math.random() * 2000) * 0.3048, Math.sin(a) * d - 500); ac.userData = { speed: 40 + Math.random() * 70, heading: Math.random() * 360, turn: (Math.random() - 0.5) * 0.15 }; }
    ac.rotation.y = -ac.userData.heading * Math.PI / 180; scene.add(ac); traffic.push(ac);
}

function startGame(m) {
    if (!scene) initScene(); mode = m; level = 1; levelDone = false; lastAlert = null;
    traffic.forEach(t => scene.remove(t)); traffic = [];
    st = { pos: new THREE.Vector3(0, 914, 0), vel: new THREE.Vector3(0, 0, -50), thr: 0.6, pitch: 0, roll: 0, hdg: 0, alt: 3000, spd: 120, vs: 0 };
    if (player) scene.remove(player); player = createPlane(0x1e3a5f, 0x2980b9); player.position.set(0, 914, 0); scene.add(player);
    if (mode === 'simulation') loadLvl(level); else { for (let i = 0; i < 10; i++)spawnTraffic(); $('lvl').textContent = 'VOL LIBRE'; $('obj').textContent = 'Explorez avec le TCAS'; }
    $('menu').classList.add('hidden'); $('tutorial').classList.add('hidden'); $('result').classList.add('hidden');
    ['pfd', 'tcas', 'throttle', 'controls', 'mission', 'cockpit'].forEach(id => $(id)?.classList.remove('hidden'));
    running = true; paused = false; clock.start(); gameLoop();
}
function loadLvl(n) {
    const l = LVLS[n - 1]; if (!l) { showRes(true, 'FÉLICITATIONS', 'Tous les niveaux terminés!'); return; }
    levelDone = false; traffic.forEach(t => scene.remove(t)); traffic = [];
    spawnTraffic(l.t); st.pos.set(0, 914, 0); player.position.set(0, 914, 0); player.rotation.set(0, 0, 0); st.hdg = 0; st.pitch = 0; st.roll = 0;
    $('lvl').textContent = l.n; $('obj').textContent = l.o;
}

function gameLoop() {
    if (!running) return; requestAnimationFrame(gameLoop); if (paused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    updateFlight(dt); updateTraffic(dt); checkCollision(); if (mode === 'simulation') checkGoal(); updateTcas(); updateHud(); updateCam(dt);
    renderer.render(scene, camera);
}
function updateFlight(dt) {
    let pi = 0, ri = 0; if (keys['arrowup']) pi = 1; if (keys['arrowdown']) pi = -1; if (keys['arrowleft']) ri = 1; if (keys['arrowright']) ri = -1;
    if (keys['w']) st.thr = Math.min(1, st.thr + dt * 0.5); if (keys['s']) st.thr = Math.max(0.15, st.thr - dt * 0.5);
    st.pitch += pi * 1.5 * dt; st.roll += ri * 2 * dt; st.pitch = THREE.MathUtils.clamp(st.pitch, -0.6, 0.6); st.roll = THREE.MathUtils.clamp(st.roll, -1.2, 1.2);
    player.rotation.x = st.pitch; player.rotation.z = st.roll;
    const turn = Math.tan(st.roll) * 9.81 / Math.max(st.vel.length(), 10); st.hdg += turn * 180 / Math.PI * dt; st.hdg = (st.hdg + 360) % 360; player.rotation.y = -st.hdg * Math.PI / 180;
    if (Math.abs(ri) < 0.1) st.roll *= Math.pow(0.97, dt * 60);
    const maxSpd = 70 + st.thr * 60; const tgtSpd = maxSpd * (0.5 + st.thr * 0.5); const curSpd = st.vel.length(); const newSpd = curSpd + (tgtSpd - curSpd) * dt * 0.5;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion); st.vel.copy(fwd.multiplyScalar(newSpd));
    st.vel.y += Math.sin(st.pitch) * newSpd * dt * 2 - 2 * dt; st.pos.add(st.vel.clone().multiplyScalar(dt)); player.position.copy(st.pos);
    if (st.pos.y < 30) { st.pos.y = 30; st.vel.y = Math.max(0, st.vel.y); if (mode === 'simulation') showRes(false, 'CRASH', 'Contact avec le sol!'); }
    st.alt = st.pos.y * 3.28084; st.spd = newSpd * 1.944; st.vs = st.vel.y * 196.85;
}
function updateTraffic(dt) { traffic.forEach(t => { if (t.userData.turn) t.userData.heading = (t.userData.heading + t.userData.turn * dt * 60 + 360) % 360; t.rotation.y = -t.userData.heading * Math.PI / 180; const h = t.userData.heading * Math.PI / 180; t.position.x += Math.sin(h) * (t.userData.speed || 60) * dt; t.position.z -= Math.cos(h) * (t.userData.speed || 60) * dt; if (Math.abs(t.position.x) > 12000) t.position.x = -Math.sign(t.position.x) * 12000; if (Math.abs(t.position.z) > 12000) t.position.z = -Math.sign(t.position.z) * 12000; }); }
function checkCollision() { if (mode !== 'simulation') return; traffic.forEach(t => { if (!t.userData.isThreat) return; if (player.position.distanceTo(t.position) < 30) showRes(false, 'COLLISION', 'Suivez les instructions TCAS!'); }); }
function checkGoal() { if (levelDone) return; const l = LVLS[level - 1]; if (!l) return; let ok = false; if (l.g.t === 'climb' && st.alt > l.g.v) ok = true; if (l.g.t === 'descend' && st.alt < l.g.v) ok = true; if (ok) { levelDone = true; level++; if (level > LVLS.length) showRes(true, 'FÉLICITATIONS', 'Maîtrise TCAS complète!'); else { setTimeout(() => loadLvl(level), 2000); $('obj').textContent = '✓ Conflit évité!'; } } }

function updateTcas() {
    const cv = $('tcasCanvas'); const ctx = cv.getContext('2d'); const cx = cv.width / 2, cy = cv.height / 2; const sc = (cx - 15) / 10;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-st.hdg * Math.PI / 180); ctx.translate(-cx, -cy);
    ctx.strokeStyle = 'rgba(0,212,255,0.25)'; ctx.lineWidth = 1;[3, 6, 10].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r * sc, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = 'rgba(0,212,255,0.9)'; ctx.font = 'bold 13px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('N', cx, 18);
    ctx.restore();
    ctx.fillStyle = '#00ff88'; ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx - 8, cy + 10); ctx.lineTo(cx + 8, cy + 10); ctx.closePath(); ctx.fill();
    let active = null;
    traffic.forEach(t => {
        const dx = t.position.x - player.position.x, dz = t.position.z - player.position.z; const hr = st.hdg * Math.PI / 180;
        const rx = (dx * Math.cos(hr) + dz * Math.sin(hr)) / 1852 * sc, rz = (-dx * Math.sin(hr) + dz * Math.cos(hr)) / 1852 * sc;
        const sx = cx + rx, sy = cy + rz; const dist = Math.sqrt(dx * dx + dz * dz); const altD = t.position.y * 3.28084 - st.alt;
        if (Math.sqrt(rx * rx + rz * rz) > sc * 11) return;
        let th = 'none'; if (dist < 6000 && Math.abs(altD) < 500) th = 'prox'; if (dist < 3500 && Math.abs(altD) < 350) th = 'TA'; if (dist < 2000 && Math.abs(altD) < 250) th = 'RA';
        if (th === 'RA') { ctx.fillStyle = '#ff4444'; ctx.fillRect(sx - 8, sy - 8, 16, 16); active = { t: 'RA', a: altD }; }
        else if (th === 'TA') { ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill(); if (!active) active = { t: 'TA' }; }
        else { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore(); }
        if (th !== 'none') { ctx.fillStyle = th === 'RA' ? '#ff4444' : th === 'TA' ? '#ffaa00' : '#fff'; ctx.font = '10px Share Tech Mono'; ctx.textAlign = 'left'; ctx.fillText((altD >= 0 ? '+' : '') + Math.round(altD / 100), sx + 12, sy + 4); }
    });
    const ae = $('alert'), pe = $('screenPulse');
    if (active) {
        ae.classList.remove('hidden', 'ta', 'ra'); ae.classList.add(active.t.toLowerCase()); pe.classList.remove('ta', 'ra'); pe.classList.add(active.t.toLowerCase());
        if (active.t === 'RA') { const ins = active.a > 0 ? 'DESCEND' : 'CLIMB'; $('alertTxt').textContent = ins; $('alertInstr').textContent = ins === 'CLIMB' ? '↑ MONTEZ +1500 ft/min' : '↓ DESCENDEZ -1500 ft/min'; if (lastAlert !== 'RA') speak(ins + ', ' + ins); }
        else { $('alertTxt').textContent = 'TRAFFIC'; $('alertInstr').textContent = 'Surveillez le trafic'; if (lastAlert !== 'TA' && lastAlert !== 'RA') speak('Traffic, Traffic'); }
        lastAlert = active.t;
    } else { if (lastAlert) speak('Clear of Conflict'); lastAlert = null; ae.classList.add('hidden'); pe.classList.remove('ta', 'ra'); }
}
function speak(t) { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(t); u.rate = 1.1; u.pitch = 0.85; u.volume = 0.85; speechSynthesis.speak(u); } }
function updateHud() { $('alt').textContent = Math.round(st.alt); $('ias').textContent = Math.round(st.spd); $('hdg').textContent = String(Math.round(st.hdg)).padStart(3, '0'); $('vs').textContent = Math.round(st.vs); $('thrFill').style.height = st.thr * 100 + '%'; $('thrVal').textContent = Math.round(st.thr * 100) + '%'; const ho = $('horizon'); if (ho) ho.style.transform = `translateY(${-st.pitch * 60}px) rotate(${st.roll * 30}deg)`; }
function updateCam(dt) { const off = new THREE.Vector3(0, 8, -35); off.applyQuaternion(player.quaternion); camera.position.lerp(player.position.clone().add(off), 4 * dt); camera.lookAt(player.position); }

function showRes(ok, t, m) { running = false; const e = $('result'); e.classList.remove('hidden', 'crash', 'success'); e.classList.add(ok ? 'success' : 'crash'); $('resTitle').textContent = t; $('resMsg').textContent = m; }
function retry() { $('result').classList.add('hidden'); if (mode === 'simulation') level = 1; startGame(mode); }
function toMenu() { running = false; traffic.forEach(t => scene.remove(t)); traffic = [];['result', 'pause', 'alert', 'pfd', 'tcas', 'throttle', 'controls', 'mission', 'cockpit'].forEach(id => $(id)?.classList.add('hidden')); $('screenPulse').classList.remove('ta', 'ra'); $('menu').classList.remove('hidden'); }
function togglePause() { paused = !paused; $('pause').classList.toggle('hidden', !paused); if (!paused) { clock.start(); gameLoop(); } }
function resume() { paused = false; $('pause').classList.add('hidden'); clock.start(); gameLoop(); }

window.startTutorial = startTutorial; window.nextTuto = nextTuto; window.prevTuto = prevTuto; window.startGame = startGame; window.retry = retry; window.toMenu = toMenu; window.resume = resume;
