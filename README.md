# T-CAS : Traffic Alert and Collision Avoidance System

Bienvenue dans le projet **T-CAS**, une plateforme éducative et interactive dédiée à la compréhension du système anticollision aérien.

Ce projet a pour but de vulgariser le fonctionnement du "cerveau du ciel", ce système invisible qui permet aux avions de dialoguer entre eux pour éviter les accidents. Il est conçu pour accompagner un support pédagogique physique (maquette à rails).

## 🌍 Vue d'Ensemble

Le site se divise en plusieurs sections clés :

*   **Accueil (`home.html`)** : Introduction immersive avec une animation de décollage au survol ("Slide to Unlock") et un tableau de bord des statistiques mondiales du TCAS.
*   **Histoire (`histoire.html`)** : Une fresque chronologique interactive (Timeline) retraçant l'évolution de la sécurité aérienne, de la collision du Grand Canyon en 1956 jusqu'aux normes actuelles.
*   **Technologie (`technologie.html`)** : [En construction] Explication détaillée des algorithmes et des fréquences radio (1030/1090 MHz).
*   **Simulateur (`jeu.html`)** : Espace dédié à l'intégration d'un "Serious Game" permettant à l'utilisateur de vivre une situation de conflit aérien et d'appliquer les consignes du TCAS (TA/RA).

## 🛠️ Architecture du Projet

### Fichiers Principaux
*   `home.html` / `home.css` / `home.js` : Page d'accueil et scripts d'interaction (drag-to-takeoff).
*   `histoire.html` / `histoire.css` : Page historique avec timeline responsive.
*   `jeu.html` / `jeu.css` : Interface du simulateur. Actuellement configurée pour recevoir le module de jeu.

### Module Simulateur 3D (Dossier `T-CAS game/`)
Un prototype de simulateur de vol immersif est disponible dans ce dossier.
*   **Technologies** : Three.js (Environnement 3D) + CSS3DRenderer (Avion Joueur).
*   **Fonctionnalités** : Radar fonctionnel, alertes vocales ("Climb", "Descend"), horizon artificiel.
*   **Utilisation** : Peut être intégré dans `jeu.html` ou lancé individuellement via `index.html` dans le dossier.

## 🚀 Comment Lancer le Projet

1.  Clonez ce dépôt ou téléchargez les fichiers.
2.  Ouvrez simplement le fichier **`home.html`** dans un navigateur web moderne (Chrome, Firefox, Edge).
3.  Naviguez via le menu en haut de page.

## 🎨 Choix Techniques

*   **Design System** : Utilisation d'une palette de couleurs "Aviation" (Dark Blue `#0f172a`, Tech Blue `#3b82f6`) et de la typographie **Plus Jakarta Sans** pour un rendu moderne et lisible.
*   **Approche Mobile-First** : Bien que le sujet soit complexe, l'interface est pensée pour être accessible sur tous les écrans.
*   **Zéro Dépendance Lourde** : Le site principal est conçu en pur HTML/CSS/JS pour une performance maximale et une maintenance aisée.

---
*Projet développé dans un cadre éducatif pour la démonstration des technologies de sécurité aérienne.*
