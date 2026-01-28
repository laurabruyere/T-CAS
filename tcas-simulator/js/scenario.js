// ===== SCENARIO.JS - Scenario Management =====

class Scenario {
    constructor(id, scene, playerAircraft) {
        this.id = id;
        this.scene = scene;
        this.playerAircraft = playerAircraft;
        this.trafficAircraft = [];
        this.tutorialSteps = [];
        this.currentTutorialStep = 0;
        this.hasTutorial = false;

        // Load scenario-specific setup
        this.loadScenario();
    }

    loadScenario() {
        switch (this.id) {
            case 'free':
                this.setupFreeFlight();
                break;
            case 'intro':
                this.setupIntroduction();
                break;
            case 'ta':
                this.setupTrafficAdvisory();
                break;
            case 'ra-climb':
                this.setupRAClimb();
                break;
            case 'ra-descend':
                this.setupRADescend();
                break;
            case 'complex':
                this.setupComplex();
                break;
            default:
                this.setupFreeFlight();
        }
    }

    setupFreeFlight() {
        this.name = 'Vol Libre';
        this.objective = 'Familiarisez-vous avec les contrôles de l\'avion';
        // No traffic aircraft
    }

    setupIntroduction() {
        this.name = 'Introduction TCAS';
        this.objective = 'Apprenez à utiliser l\'affichage TCAS';
        this.hasTutorial = true;

        // Add one distant aircraft
        const traffic = new Aircraft(this.scene, false);
        traffic.position.set(5000, 10000, -8000);
        traffic.throttle = 0.5;
        traffic.setFlightPath([
            new THREE.Vector3(5000, 10000, -8000),
            new THREE.Vector3(-5000, 10000, -8000),
            new THREE.Vector3(-5000, 10000, 8000),
            new THREE.Vector3(5000, 10000, 8000)
        ]);
        this.trafficAircraft.push(traffic);

        // Tutorial steps
        this.tutorialSteps = [
            {
                title: 'Bienvenue dans le simulateur TCAS',
                text: 'Le TCAS (Traffic Collision Avoidance System) est un système de sécurité qui surveille le trafic aérien autour de votre avion et vous alerte en cas de risque de collision.'
            },
            {
                title: 'L\'affichage TCAS',
                text: 'Regardez en haut à droite de l\'écran. Vous voyez l\'affichage TCAS avec votre avion au centre (triangle vert) et le trafic environnant. Les cercles représentent les distances (2, 5, 10 NM).'
            },
            {
                title: 'Symboles de trafic',
                text: 'Les autres avions apparaissent avec différents symboles : Losange blanc (trafic normal), Cercle jaune (Traffic Advisory), Carré rouge (Resolution Advisory).'
            },
            {
                title: 'Prêt à voler !',
                text: 'Utilisez Z/S pour le tangage, Q/D pour le roulis, et les flèches ↑/↓ pour la puissance. Observez le trafic sur l\'affichage TCAS pendant que vous volez.'
            }
        ];
    }

    setupTrafficAdvisory() {
        this.name = 'Traffic Advisory (TA)';
        this.objective = 'Expérimentez une alerte de trafic (TA)';
        this.hasTutorial = true;

        // Add aircraft on collision course (TA level)
        const traffic = new Aircraft(this.scene, false);
        traffic.position.set(0, 10000, -15000);
        traffic.throttle = 0.6;
        traffic.setFlightPath([
            new THREE.Vector3(0, 10000, -15000),
            new THREE.Vector3(0, 10000, 15000)
        ]);
        this.trafficAircraft.push(traffic);

        this.tutorialSteps = [
            {
                title: 'Traffic Advisory (TA)',
                text: 'Un Traffic Advisory (TA) vous alerte qu\'un autre avion se trouve dans votre zone de surveillance (environ 40 secondes avant un conflit potentiel).'
            },
            {
                title: 'Alerte "Traffic, Traffic"',
                text: 'Quand vous recevrez l\'alerte TA, vous entendrez "Traffic, Traffic" et verrez l\'avion en JAUNE sur l\'affichage TCAS. Aucune manœuvre n\'est requise, mais soyez vigilant.'
            },
            {
                title: 'Votre mission',
                text: 'Volez droit devant et observez l\'alerte TA quand l\'autre avion s\'approche. Surveillez l\'affichage TCAS pour voir le symbole changer de blanc à jaune.'
            }
        ];
    }

    setupRAClimb() {
        this.name = 'Resolution Advisory - Montée';
        this.objective = 'Suivez une résolution de montée (RA)';
        this.hasTutorial = true;

        // Add aircraft on direct collision course (below)
        const traffic = new Aircraft(this.scene, false);
        traffic.position.set(0, 9500, -10000);
        traffic.throttle = 0.65;
        traffic.setFlightPath([
            new THREE.Vector3(0, 9500, -10000),
            new THREE.Vector3(0, 9500, 10000)
        ]);
        this.trafficAircraft.push(traffic);

        this.tutorialSteps = [
            {
                title: 'Resolution Advisory (RA)',
                text: 'Un Resolution Advisory (RA) est une alerte CRITIQUE qui vous donne une instruction spécifique pour éviter une collision (environ 25 secondes avant impact).'
            },
            {
                title: 'Alerte "Climb, Climb"',
                text: 'Vous allez recevoir l\'alerte "CLIMB, CLIMB" en ROUGE. Vous DEVEZ suivre cette instruction immédiatement en augmentant votre taux de montée.'
            },
            {
                title: 'Indicateur de vitesse verticale',
                text: 'Un indicateur de vitesse verticale apparaîtra en bas à droite. La ligne ROUGE montre le taux de montée requis (+1500 fpm). La ligne VERTE montre votre taux actuel. Alignez-les !'
            },
            {
                title: 'Votre mission',
                text: 'Volez droit devant. Quand vous recevez l\'alerte RA, MONTEZ immédiatement en tirant sur Z et en augmentant la puissance. Maintenez +1500 fpm jusqu\'à ce que l\'alerte disparaisse.'
            }
        ];
    }

    setupRADescend() {
        this.name = 'Resolution Advisory - Descente';
        this.objective = 'Suivez une résolution de descente (RA)';
        this.hasTutorial = true;

        // Add aircraft on direct collision course (above)
        const traffic = new Aircraft(this.scene, false);
        traffic.position.set(0, 10500, -10000);
        traffic.throttle = 0.65;
        traffic.setFlightPath([
            new THREE.Vector3(0, 10500, -10000),
            new THREE.Vector3(0, 10500, 10000)
        ]);
        this.trafficAircraft.push(traffic);

        this.tutorialSteps = [
            {
                title: 'Resolution Advisory - Descente',
                text: 'Cette fois, vous allez recevoir une instruction de DESCENTE. L\'autre avion est au-dessus de vous.'
            },
            {
                title: 'Alerte "Descend, Descend"',
                text: 'Vous recevrez l\'alerte "DESCEND, DESCEND" en ROUGE. Vous devez descendre immédiatement avec un taux de -1500 fpm.'
            },
            {
                title: 'Votre mission',
                text: 'Volez droit devant. Quand l\'alerte RA apparaît, DESCENDEZ en poussant sur S et en réduisant légèrement la puissance. Maintenez -1500 fpm jusqu\'à résolution du conflit.'
            }
        ];
    }

    setupComplex() {
        this.name = 'Scénario Multi-Avions';
        this.objective = 'Gérez plusieurs conflits de trafic simultanés';

        // Add multiple aircraft at various positions
        const positions = [
            { pos: new THREE.Vector3(3000, 10200, -12000), path: [new THREE.Vector3(3000, 10200, -12000), new THREE.Vector3(3000, 10200, 12000)] },
            { pos: new THREE.Vector3(-4000, 9800, -15000), path: [new THREE.Vector3(-4000, 9800, -15000), new THREE.Vector3(-4000, 9800, 15000)] },
            { pos: new THREE.Vector3(0, 10500, -8000), path: [new THREE.Vector3(0, 10500, -8000), new THREE.Vector3(0, 10500, 8000)] }
        ];

        positions.forEach(config => {
            const traffic = new Aircraft(this.scene, false);
            traffic.position.copy(config.pos);
            traffic.throttle = 0.5 + Math.random() * 0.2;
            traffic.setFlightPath(config.path);
            this.trafficAircraft.push(traffic);
        });
    }

    update() {
        // Update AI aircraft to follow their flight paths
        this.trafficAircraft.forEach(aircraft => {
            if (aircraft.waypoints) {
                aircraft.followWaypoints();
            }
        });

        // Check scenario completion conditions
        this.checkCompletion();
    }

    checkCompletion() {
        // Scenario-specific completion logic
        // For now, scenarios run indefinitely
    }
}

console.log('scenario.js loaded');
