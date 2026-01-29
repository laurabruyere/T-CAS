# T-CAS
### Plateforme Pédagogique Interactive sur le Système Anticollision

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-Educational-green) ![Tech](https://img.shields.io/badge/tech-Vanilla_JS_|_Three.js-yellow)

**Équipe de conception :**
*   Bruyère Laura
*   Dupuis Lou-Anne
*   Richard Mélina
*   Venet Viktor

---

## Introduction & Contexte

Le projet **T-CAS** (Traffic alert and Collision Avoidance System) est une initiative éducative visant à démystifier ce que l'on appelle souvent le "Cerveau du Ciel". Ce système de bord autonome est la dernière barrière de sécurité permettant aux avions d'éviter les collisions en vol. Il fonctionne indépendamment du contrôle aérien au sol en utilisant les interrogations et réponses des transpondeurs des aéronefs environnants sur les fréquences **1030 MHz** et **1090 MHz**.

Contrairement aux manuels techniques arides, cette plateforme propose une approche **immersive et interactive** pour comprendre comment des algorithmes complexes sauvent des vies à 800 km/h.

---

## Cadre Conceptuel : L'Approche Praxéologique

Le projet est structuré selon les principes de la **praxéologie** (science de l'action humaine). L'objectif est de transformer une connaissance théorique en une compétence décisionnelle.

*   **L'Action (Simulation) :** L'utilisateur est placé aux commandes d'un aéronef et confronté à un conflit de trajectoire.
*   **La Prise de Décision :** Le système impose une réaction en moins de 5 secondes. L'utilisateur doit intégrer la priorité de l'automate sur l'humain.
*   **La Réflexion (Évaluation) :** Le module de quiz permet de valider la compréhension des mécanismes après la phase d'expérimentation physique et numérique.

---

## Démarche de Conception & Expérience Utilisateur

La conception de ce site a été guidée par trois piliers fondamentaux :

### 1. La Vulgarisation par l'Interaction
Plutôt que d'expliquer le concept de "Tau" (τ) par des formules mathématiques, nous avons créé un **Simulateur 3D** qui met l'utilisateur en situation. L'apprentissage se fait par l'expérience : entendre l'alerte, voir le danger, et réagir.

### 2. Une Esthétique "Aviation Premium"
L'interface utilisateur (UI) a été soigneusement travaillée pour immerger l'utilisateur dès la première seconde :
*   **Palette de Couleurs** : Utilisation de bleus profonds (`#0f172a` Slate 900) rappelant le ciel nocturne et les instruments de bord, contrastés par un bleu électrique/technologique (`#3b82f6`) pour les éléments interactifs.
*   **Typographie** : Choix de **Plus Jakarta Sans**, une police géométrique moderne qui évoque la clarté et la précision des affichages aéronautiques.
*   **Glassmorphism** : Les effets de transparence et de flou simulent les écrans de tableau de bord. Cela reste moderne tout en optimisant la hiérarchie des informations.
*   **Animations de Décollage** : La page d'accueil ne s'ouvre pas, elle "décolle". Le geste de "Slide to Unlock" avec l'avion renforce la métaphore du vol dès l'entrée sur le site.

### 3. Accessibilité & Performance
Le choix a été fait de ne pas utiliser de frameworks lourds (React/Vue) pour le site principal afin de garantir :
*   Un temps de chargement quasi-instantané.
*   Une accessibilité maximale sur tous les navigateurs modernes.
*   Une compréhension claire du code source pour les étudiants ou curieux qui inspecteraient le projet.

---

## Logique du TAU (τ) et Seuils d'Alerte

Le système repose sur le calcul du temps restant avant l'impact (τ), défini par le rapport entre la distance et la vitesse de rapprochement : `τ = Distance / Vitesse de Rapprochement`.

*   **Traffic Advisory (TA) :** Déclenché à τ < 40 secondes. Alerte visuelle (jaune) et sonore ("Traffic, Traffic"). Prépare le pilote à une éventuelle manœuvre.
*   **Resolution Advisory (RA) :** Déclenché à τ < 25 secondes. Alerte visuelle (rouge) et sonore impérative ("CLIMB" ou "DESCEND"). Impose une modification de la vitesse verticale.
*   **Coordination RAC (Resolution Advisory Complement) :** En cas de conflit entre deux appareils équipés, les systèmes communiquent pour coordonner des manœuvres opposées (ex: l'un monte, l'autre descend).

---

## Aspects Techniques & Réalisation

Le projet repose sur une architecture **Vanilla Web** (HTML5, CSS3, JavaScript ES6+) couplée à la puissance de **Three.js** pour la simulation.

### Architecture du Code
```
T-CAS/
├── home.html / .css / .js      # Landing page avec logique de drag-and-drop
├── histoire.html / .css        # Timeline responsive CSS Grid
├── technologie.html            # Explications techniques
├── jeu.html                    # Hub du simulateur
├── quiz.html / .js             # Module d'évaluation et génération de certificat PDF
├── apropos.html                # Équipe et fiche produit
├── tcas-simulator/             # LE CŒUR DU SYSTÈME
│   └── simulation_finale.html  # Moteur 3D complet (Three.js)
└── README.md                   # Documentation
```

### Zoom sur le Moteur de Simulation (`simulation_finale.html`)

C'est la prouesse technique du projet. Il s'agit d'un moteur de jeu complet tournant entièrement dans le navigateur, ce qui allège le site contrairement à des logiciels 3D intégrés dans un serveur et qui allourdissent le site.

#### 1. Rendu Graphique (Three.js / WebGL)
Nous utilisons la librairie **Three.js** pour générer un monde 3D.
*   **Génération Procédurale** : Le terrain (montagnes, arbres, nuages) est généré aléatoirement à chaque lancement via des algorithmes mathématiques simples, garantissant une rejouabilité infinie sans charger de lourds modèles 3D.
*   **Illusion de Vitesse** : Les nuages sont des sprites 2D qui se réinitialisent devant l'avion une fois passés derrière, créant une illusion de vol infini à moindre coût (technique du "tapis roulant").

#### 2. Moteur Physique (6-DOF Simplifié)
Un moteur physique, inspiré de la physique réelle des avions, a été écrit de zéro pour gérer le vol. Il implémente un modèle **6-DOF** (six degrés de liberté) simplifié gérant la portance, la traînée, la poussée et le poids.
```javascript
// Extrait simplifié de la logique de vol
const speed = 60 + throttle * 50; // Vitesse basée sur les gaz
const vs = -Math.sin(pitch) * speed; // Vitesse verticale
position.y += vs * dt; // Intégration d'Euler
```
Il gère le tangage (pitch), le roulis (roll) et le lacet (yaw) induit, offrant une sensation de pilotage arcade mais crédible.

#### 3. L'Algorithme TCAS (La Logique Métier)
Le cœur du simulateur réplique la logique réelle du TCAS. La simulation vérifie les conditions de τ 60 fois par seconde pour déclencher les alertes audio et visuelles (HUD) en temps réel.

---

## Support Physique Tactique (Maquette)

En complément de la plateforme numérique, un support physique a été conçu pour une manipulation tangible du concept.

### Caractéristiques Matérielles
| Élément | Matériau | Technique |
| :--- | :--- | :--- |
| Châssis et pieds | Contreplaqué Peuplier (5mm) | Découpe Laser |
| Zones TA/RA | PMMA (Plexiglas) Jaune/Rouge | Découpe Laser |
| Aéronefs | Polymère PLA | Impression 3D |

### Processus de Fabrication (CAO/FAO)
*   **Conception :** Tracés vectoriels réalisés sur Adobe Illustrator pour les rails de guidage.
*   **Modélisation :** Adaptation de modèles aéronautiques pour l'impression 3D.
*   **Usinage :** Découpe laser pour la précision des emboîtements et des trajectoires verticales (rails).

### Analyse Économique
*   **Coût des matériaux :** Environ 45,00 €.
*   **Justification :** Le choix du bois et du PMMA assure une durabilité supérieure pour un usage répété en milieu scolaire.

---

## Usage Pédagogique et Transmissibilité

Ce projet est spécifiquement conçu pour les **enseignants de technologie au collège** comme un écosystème pédagogique clé en main.

*   **Synergie des supports :** La complémentarité entre le simulateur virtuel et la maquette physique permet d'aborder les notions de CAO/FAO, de physique du vol et d'algorithmique de manière concrète.
*   **Facilité de transmission :** L'enseignant dispose d'un parcours complet (Cours → Simulation → Manipulation physique → Évaluation) facilitant la gestion d'une séquence pédagogique sur la sécurité des systèmes automatisés.
*   **Autonomie des élèves :** Le site web et le quiz avec diplôme intégré permettent un apprentissage en autonomie, laissant à l'enseignant un rôle de facilitateur.

---

## Guide d'Utilisation

### Navigation
*   **Histoire** : Scrollez pour traverser le temps.
*   **Quiz** : Testez vos connaissances et obtenez votre diplôme.
*   **Simulateur** : Le point d'orgue du site.

### Commandes du Simulateur (Clavier)
| Touche | Action |
| :--- | :--- |
| **⬆️ / ⬇️** | Cabrer / Piquer (Pitch) |
| **⬅️ / ➡️** | Virage Gauche / Droite (Roll) |
| **Z / S** | Augmenter / Réduire les Gaz |
| **Barre Espace** | Stabiliser la caméra (Reset) |

**Votre Mission** : Maintenez votre cap. Si un intrus approche et que l'alarme retentit, **obéissez immédiatement** aux ordres affichés en rouge sur le HUD (CLIMB ou DESCEND).

---

## Notes

*   **Zéro Build Tools** : Le projet est conçu pour fonctionner sans `npm`, `webpack` ou étape de compilation complexe. Il suffit d'un serveur statique local (ou simplement d'ouvrir les fichiers HTML).
*   **Compatibilité** : Le module 3D utilise l'accélération matérielle (WebGL). Il est optimisé pour tourner vers les 60FPS même sur des PC modestes grâce aux graphismes très simplifiés.
*   **Évolutivité** : La structure modulaire permet d'ajouter facilement de nouveaux "scénarios" d'accident dans le simulateur.

---

## Objectifs Pédagogiques

L'ensemble du dispositif vise à démontrer que la sécurité aérienne moderne repose sur une collaboration stricte entre l'intelligence logicielle (calcul du τ) et la discipline humaine (application immédiate des ordres RA). Le certificat final valide la compréhension de ces protocoles de sécurité critiques.