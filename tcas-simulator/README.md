# 🛡️ TCAS : L'Ange Gardien Invisible
> **Projet de Simulation Aéronautique & Pédagogique**

Bienvenue dans la version finale du simulateur TCAS (*Traffic Collision Avoidance System*). Ce projet a été transformé pour offrir une expérience immersive, moderne et éducative, démontrant pourquoi, dans le ciel, **l'algorithme est le dernier rempart contre la catastrophe.**

## 🌟 La Philosophie : "Robot > Humain"

Le TCAS est un système critique qui illustre un changement de paradigme fondamental en aviation :
1.  **L'Ange Gardien :** Il surveille l'espace aérien 360° autour de l'avion, toutes les millisecondes.
2.  **La Priorité Absolue :** En cas d'alerte rouge (RA), le pilote **DOIT** obéir au TCAS, même si le contrôleur aérien (un humain) lui dit l'inverse. C'est la règle d'or pour éviter les collisions.

## ⏳ Le Cœur du Système : Le TAU ($\tau$)

Oubliez la distance. À 800 km/h, "2 kilomètres" ne veut rien dire.
Le TCAS calcule le **TAU** : le **temps restant avant l'impact**.

*   Si je ne fais rien, dans combien de secondes on se percute ?
*   C'est cette valeur ($\tau$) qui déclenche les alertes, pas juste la proximité géographique.

---

## 🎮 L'Expérience : `simulation_finale.html`

Tout le projet tient désormais dans **un seul fichier** ultra-optimisé. Lancez `simulation_finale.html` pour vivre l'expérience.

### Le Scénario "Face-à-Face" ⚔️
Vous ne volez pas au hasard. Le simulateur exécute un scénario précis :
*   **T+00s** : Vous volez paisiblement à 9000ft (Cessna 172).
*   **L'Intrus** : Un avion invisible fonce sur vous. Il est programmé par le code pour croiser votre trajectoire exactement 60 secondes après le lancement.
*   **T+20s (Zone Jaune)** : Alerte **TA** ("Traffic Advisory"). Préparez-vous.
*   **T+35s (Zone Rouge)** : Alerte **RA** ("Resolution Advisory"). **ACTION REQUISE !**

### Les Commandes 🕹️
*   **⬆️ / ⬇️** : Tirer / Pousser le manche (Pitch). C'est ce qui vous sauvera (monter ou descendre).
*   **⬅️ / ➡️** : Virer (Roll).
*   **W / S** : Gérer les gaz (Throttle).

---

## 🏗️ Sous le Capot (Architecture Technique)

Ce simulateur est une prouesse technique Web :

### 1. Moteur Hybride (Three.js + CSS3D) 🎨
Au lieu d'utiliser des modèles 3D lourds (.obj/.gltf), nous utilisons le **CSS3DRenderer**.
*   L'avion que vous voyez est construit entièrement en **divs HTML et CSS**.
*   Three.js gère la mathématique 3D et la caméra, mais le rendu est du pur DOM.

### 2. Physique de Vol (6-DOF) ✈️
Un moteur physique complet calcule en temps réel :
*   **Portance ($C_L$)** : Varie selon votre angle d'attaque.
*   **Traînée ($C_D$)** : Freine l'avion quand vous manœuvrez.
*   **Atmosphère (ISA)** : L'air se raréfie avec l'altitude.

### 3. Logique TCAS II Réaliste 🧠
L'algorithme implémenté respecte les standards :
*   Simule l'interrogation (1030 MHz) et la réponse (1090 MHz).
*   Calcule le CPA (*Closest Point of Approach*).
*   Définit les seuils : **TA = 40s** / **RA = 25s**.
*   Gère la coordination (si l'intrus est plus haut, on descend).

### 4. Interface "Glassmorphism" 💎
Un HUD (Head-Up Display) moderne inspiré des cockpits du futur :
*   Flou d'arrière-plan (Backdrop Filter).
*   Radar vectoriel animé.
*   Indicateurs de vitesse verticale (VSI) dynamiques.

---
*Cette simulation prouve qu'avec les technologies web modernes, on peut créer des outils pédagogiques complexes, performants et visuellement impactants sans aucune installation.*
