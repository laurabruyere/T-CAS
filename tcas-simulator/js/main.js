// ===== MAIN.JS - Entry Point =====

// Global variables
let scene, camera, renderer;
let playerAircraft;
let trafficAircraft = [];
let currentScenario = null;
let gameState = 'menu'; // 'menu', 'loading', 'playing', 'paused'
let keys = {};
let isPaused = false;

// Initialize the application
window.addEventListener('load', () => {
    console.log('TCAS Flight Simulator loading...');
    checkThreeJS();
});

// Check if Three.js is loaded
function checkThreeJS() {
    if (typeof THREE !== 'undefined') {
        console.log('Three.js loaded successfully!');
        initializeApp();
    } else {
        console.error('Three.js failed to load!');
        document.getElementById('loadingStatus').textContent = 'Erreur: Three.js non chargé';
    }
}

// Initialize the application
function initializeApp() {
    console.log('Initializing TCAS Flight Simulator...');
    setupEventListeners();
    console.log('Application ready!');
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        // ESC to pause
        if (e.key === 'Escape' && gameState === 'playing') {
            togglePause();
        }

        // Prevent arrow key scrolling
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// Start a scenario
function startScenario(scenarioId) {
    console.log('Starting scenario:', scenarioId);
    gameState = 'loading';

    // Show loading screen
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Initialize Three.js scene
    setTimeout(() => {
        initThreeJS();
        loadScenario(scenarioId);
    }, 500);
}

// Initialize Three.js
function initThreeJS() {
    try {
        console.log('Initializing Three.js scene...');
        document.getElementById('loadingStatus').textContent = 'Création de la scène 3D...';

        // Create scene
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x87ceeb, 5000, 15000);
        scene.background = new THREE.Color(0x87ceeb);
        console.log('Scene created');

        // Create camera
        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            20000
        );
        camera.position.set(0, 50, 100);
        console.log('Camera created');

        // Create renderer
        const canvas = document.getElementById('flightCanvas');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        console.log('Renderer created');

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffd700, 0.8);
        sunLight.position.set(1000, 2000, 500);
        sunLight.castShadow = true;
        scene.add(sunLight);

        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x228b22, 0.4);
        scene.add(hemisphereLight);
        console.log('Lights added');

        // Create environment
        createEnvironment();

        console.log('Three.js scene initialized!');
    } catch (error) {
        console.error('Error in initThreeJS:', error);
        document.getElementById('loadingStatus').textContent = 'ERREUR Three.js: ' + error.message;
        throw error;
    }
}

// Create environment (sky, clouds, ground)
function createEnvironment() {
    document.getElementById('loadingStatus').textContent = 'Création de l\'environnement...';

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        roughness: 0.8
    });

    // Add terrain variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        vertices[i + 2] = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 50 +
            Math.sin(x * 0.01) * Math.cos(y * 0.01) * 20;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create clouds
    for (let i = 0; i < 50; i++) {
        const cloudGroup = new THREE.Group();

        for (let j = 0; j < 5; j++) {
            const cloudGeometry = new THREE.SphereGeometry(30 + Math.random() * 20, 8, 8);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
                roughness: 1
            });
            const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudPart.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 60
            );
            cloudGroup.add(cloudPart);
        }

        cloudGroup.position.set(
            (Math.random() - 0.5) * 10000,
            1000 + Math.random() * 1000,
            (Math.random() - 0.5) * 10000
        );
        scene.add(cloudGroup);
    }
}

// Load a scenario
function loadScenario(scenarioId) {
    try {
        console.log('loadScenario called with:', scenarioId);
        document.getElementById('loadingStatus').textContent = 'Chargement du scénario...';

        // Create player aircraft
        console.log('Creating player aircraft...');
        playerAircraft = new Aircraft(scene, true);
        console.log('Player aircraft created successfully');

        playerAircraft.position.set(0, 10000, 0);
        console.log('Player aircraft position set');

        // Load scenario-specific setup
        console.log('Creating scenario...');
        currentScenario = new Scenario(scenarioId, scene, playerAircraft);
        console.log('Scenario created successfully');

        trafficAircraft = currentScenario.trafficAircraft;
        console.log('Traffic aircraft loaded:', trafficAircraft.length);

        // Update UI
        updateScenarioInfo();
        console.log('Scenario info updated');

        // Start game
        setTimeout(() => {
            console.log('Starting game...');
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            gameState = 'playing';

            // Show tutorial if needed
            if (currentScenario.hasTutorial) {
                showTutorial();
            }

            // Start game loop
            console.log('Starting animation loop...');
            animate();
        }, 1000);
    } catch (error) {
        console.error('Error in loadScenario:', error);
        document.getElementById('loadingStatus').textContent = 'ERREUR: ' + error.message;
        alert('Erreur de chargement: ' + error.message + '\n\nOuvrez la console (F12) pour plus de détails.');
    }
}

// Game loop
function animate() {
    if (gameState !== 'playing') return;

    requestAnimationFrame(animate);

    if (!isPaused) {
        // Update player aircraft
        if (playerAircraft) {
            playerAircraft.update(keys);
        }

        // Update traffic aircraft
        trafficAircraft.forEach(aircraft => {
            aircraft.update();
        });

        // Update TCAS
        if (playerAircraft && playerAircraft.tcas) {
            playerAircraft.tcas.update(trafficAircraft);
        }

        // Update scenario
        if (currentScenario) {
            currentScenario.update();
        }

        // Update camera
        updateCamera();

        // Update UI
        updateHUD();
        updateTCASDisplay();
    }

    // Render scene
    renderer.render(scene, camera);
}

// Update camera to follow aircraft
function updateCamera() {
    if (!playerAircraft) return;

    const offset = new THREE.Vector3(0, 30, 80);
    offset.applyQuaternion(playerAircraft.mesh.quaternion);

    const targetPosition = playerAircraft.position.clone().add(offset);
    camera.position.lerp(targetPosition, 0.1);

    const lookTarget = playerAircraft.position.clone();
    lookTarget.y += 10;
    camera.lookAt(lookTarget);
}

// Update HUD
function updateHUD() {
    if (!playerAircraft) return;

    // Update instruments
    document.getElementById('altitude').textContent = Math.round(playerAircraft.position.y);
    document.getElementById('speed').textContent = Math.round(playerAircraft.speed * 1.94384); // m/s to knots
    document.getElementById('heading').textContent = Math.round((playerAircraft.heading + 360) % 360).toString().padStart(3, '0');
    document.getElementById('verticalSpeed').textContent = Math.round(playerAircraft.verticalSpeed * 196.85); // m/s to fpm

    // Update throttle
    const throttlePercent = Math.round(playerAircraft.throttle * 100);
    document.getElementById('throttleFill').style.height = throttlePercent + '%';
    document.getElementById('throttleValue').textContent = throttlePercent + '%';
}

// Update TCAS display
function updateTCASDisplay() {
    const canvas = document.getElementById('tcasCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 10; // pixels per nautical mile

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw range rings
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
    ctx.lineWidth = 1;
    [2, 5, 10].forEach(range => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, range * scale, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Draw cardinal directions
    ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.font = '12px "Roboto Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerX, 20);
    ctx.fillText('S', centerX, canvas.height - 10);
    ctx.fillText('E', canvas.width - 15, centerY + 5);
    ctx.fillText('W', 15, centerY + 5);

    // Draw own aircraft (center)
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 6, centerY + 6);
    ctx.lineTo(centerX + 6, centerY + 6);
    ctx.closePath();
    ctx.fill();

    // Draw traffic
    if (playerAircraft && playerAircraft.tcas) {
        playerAircraft.tcas.contacts.forEach(contact => {
            const dx = (contact.aircraft.position.x - playerAircraft.position.x) / 1852; // meters to nm
            const dz = (contact.aircraft.position.z - playerAircraft.position.z) / 1852;
            const altDiff = Math.round((contact.aircraft.position.y - playerAircraft.position.y) / 100) * 100; // feet

            const screenX = centerX + dx * scale;
            const screenY = centerY + dz * scale;

            // Only draw if within display range
            if (Math.abs(dx) < 15 && Math.abs(dz) < 15) {
                // Draw symbol based on threat level
                if (contact.threatLevel === 'RA') {
                    // Red square for Resolution Advisory
                    ctx.fillStyle = '#ff3333';
                    ctx.fillRect(screenX - 6, screenY - 6, 12, 12);
                } else if (contact.threatLevel === 'TA') {
                    // Yellow circle for Traffic Advisory
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // White diamond for other traffic
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY - 5);
                    ctx.lineTo(screenX + 5, screenY);
                    ctx.lineTo(screenX, screenY + 5);
                    ctx.lineTo(screenX - 5, screenY);
                    ctx.closePath();
                    ctx.fill();
                }

                // Draw altitude tag
                ctx.fillStyle = contact.threatLevel === 'RA' ? '#ff3333' :
                    contact.threatLevel === 'TA' ? '#ffd700' : 'white';
                ctx.font = '10px "Roboto Mono"';
                ctx.textAlign = 'left';
                const altText = (altDiff >= 0 ? '+' : '') + Math.round(altDiff / 100);
                ctx.fillText(altText, screenX + 8, screenY + 4);
            }
        });
    }
}

// Update scenario info
function updateScenarioInfo() {
    if (currentScenario) {
        document.getElementById('scenarioName').textContent = currentScenario.name;
        document.getElementById('scenarioObjective').textContent = currentScenario.objective;
    }
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('pauseMenu').classList.remove('hidden');
    } else {
        document.getElementById('pauseMenu').classList.add('hidden');
    }
}

// Resume game
function resumeGame() {
    isPaused = false;
    document.getElementById('pauseMenu').classList.add('hidden');
    animate();
}

// Restart scenario
function restartScenario() {
    if (currentScenario) {
        // Clean up
        scene.clear();
        trafficAircraft = [];

        // Reload scenario
        loadScenario(currentScenario.id);
        isPaused = false;
        document.getElementById('pauseMenu').classList.add('hidden');
    }
}

// Back to menu
function backToMenu() {
    // Clean up
    if (scene) scene.clear();
    trafficAircraft = [];
    playerAircraft = null;
    currentScenario = null;

    // Show start screen
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');

    gameState = 'menu';
    isPaused = false;
}

// Window resize handler
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Tutorial functions
function showTutorial() {
    if (currentScenario && currentScenario.tutorialSteps.length > 0) {
        currentScenario.currentTutorialStep = 0;
        updateTutorialDisplay();
        document.getElementById('tutorialOverlay').classList.remove('hidden');
    }
}

function nextTutorialStep() {
    if (currentScenario) {
        currentScenario.currentTutorialStep++;
        if (currentScenario.currentTutorialStep >= currentScenario.tutorialSteps.length) {
            document.getElementById('tutorialOverlay').classList.add('hidden');
        } else {
            updateTutorialDisplay();
        }
    }
}

function updateTutorialDisplay() {
    if (currentScenario && currentScenario.tutorialSteps[currentScenario.currentTutorialStep]) {
        const step = currentScenario.tutorialSteps[currentScenario.currentTutorialStep];
        document.getElementById('tutorialTitle').textContent = step.title;
        document.getElementById('tutorialText').textContent = step.text;
    }
}

console.log('main.js loaded');
