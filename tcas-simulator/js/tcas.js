// ===== TCAS.JS - Traffic Collision Avoidance System =====

class TCAS {
    constructor(ownAircraft) {
        this.ownAircraft = ownAircraft;
        this.contacts = [];
        this.currentAlert = null;
        this.alertAudio = null;

        // TCAS thresholds (in seconds)
        this.TA_THRESHOLD = 40; // Traffic Advisory
        this.RA_THRESHOLD = 25; // Resolution Advisory

        // Alert cooldown
        this.lastAlertTime = 0;
        this.alertCooldown = 3000; // 3 seconds
    }

    update(trafficAircraft) {
        // Clear previous contacts
        this.contacts = [];

        // Analyze each traffic aircraft
        trafficAircraft.forEach(aircraft => {
            const contact = this.analyzeContact(aircraft);
            if (contact) {
                this.contacts.push(contact);
            }
        });

        // Determine highest threat level
        this.updateAlertStatus();
    }

    analyzeContact(aircraft) {
        const distance = this.ownAircraft.distanceTo(aircraft);
        const closureRate = this.ownAircraft.getClosureRate(aircraft);

        // Calculate time to closest approach
        let timeToClosest = Infinity;
        if (closureRate > 0) {
            timeToClosest = distance / closureRate;
        }

        // Calculate vertical separation
        const verticalSeparation = Math.abs(
            this.ownAircraft.position.y - aircraft.position.y
        );

        // Determine threat level
        let threatLevel = 'OTHER';

        // Check for Resolution Advisory
        if (timeToClosest < this.RA_THRESHOLD && verticalSeparation < 1000) {
            threatLevel = 'RA';
        }
        // Check for Traffic Advisory
        else if (timeToClosest < this.TA_THRESHOLD && verticalSeparation < 1200) {
            threatLevel = 'TA';
        }

        // Determine required vertical speed for RA
        let requiredVS = null;
        if (threatLevel === 'RA') {
            // Determine if we should climb or descend
            const altDiff = aircraft.position.y - this.ownAircraft.position.y;
            if (altDiff > 0) {
                // Other aircraft is above, descend
                requiredVS = -1500; // fpm
            } else {
                // Other aircraft is below, climb
                requiredVS = 1500; // fpm
            }
        }

        return {
            aircraft: aircraft,
            distance: distance,
            closureRate: closureRate,
            timeToClosest: timeToClosest,
            verticalSeparation: verticalSeparation,
            threatLevel: threatLevel,
            requiredVS: requiredVS
        };
    }

    updateAlertStatus() {
        // Find highest threat
        let highestThreat = null;
        let highestThreatLevel = 0;

        this.contacts.forEach(contact => {
            let level = 0;
            if (contact.threatLevel === 'TA') level = 1;
            if (contact.threatLevel === 'RA') level = 2;

            if (level > highestThreatLevel) {
                highestThreatLevel = level;
                highestThreat = contact;
            }
        });

        // Update alert display
        const now = Date.now();
        if (highestThreat && highestThreat.threatLevel !== 'OTHER') {
            // Check cooldown
            if (now - this.lastAlertTime > this.alertCooldown) {
                this.showAlert(highestThreat);
                this.lastAlertTime = now;
            }
        } else {
            this.hideAlert();
        }
    }

    showAlert(contact) {
        const alertDisplay = document.getElementById('alertDisplay');
        const alertIcon = document.getElementById('alertIcon');
        const alertText = document.getElementById('alertText');
        const alertSubtext = document.getElementById('alertSubtext');
        const alertContent = alertDisplay.querySelector('.alert-content');
        const vsIndicator = document.getElementById('vsIndicator');

        if (contact.threatLevel === 'RA') {
            // Resolution Advisory
            alertContent.classList.add('danger');
            alertIcon.textContent = '🚨';

            if (contact.requiredVS > 0) {
                alertText.textContent = 'CLIMB, CLIMB';
                this.playAudio('climb');
            } else {
                alertText.textContent = 'DESCEND, DESCEND';
                this.playAudio('descend');
            }

            const altDiff = Math.round(
                (contact.aircraft.position.y - this.ownAircraft.position.y) / 0.3048
            );
            alertSubtext.textContent = `Trafic à ${Math.round(contact.distance / 1852)} NM, ${altDiff >= 0 ? '+' : ''}${altDiff} ft`;

            // Show vertical speed indicator
            vsIndicator.classList.remove('hidden');
            this.updateVSIndicator(contact.requiredVS);

        } else if (contact.threatLevel === 'TA') {
            // Traffic Advisory
            alertContent.classList.remove('danger');
            alertIcon.textContent = '⚠️';
            alertText.textContent = 'TRAFFIC, TRAFFIC';
            this.playAudio('traffic');

            const altDiff = Math.round(
                (contact.aircraft.position.y - this.ownAircraft.position.y) / 0.3048
            );
            alertSubtext.textContent = `Trafic à ${Math.round(contact.distance / 1852)} NM, ${altDiff >= 0 ? '+' : ''}${altDiff} ft`;

            // Hide vertical speed indicator
            vsIndicator.classList.add('hidden');
        }

        alertDisplay.classList.remove('hidden');
        this.currentAlert = contact;
    }

    hideAlert() {
        const alertDisplay = document.getElementById('alertDisplay');
        const vsIndicator = document.getElementById('vsIndicator');

        if (this.currentAlert) {
            alertDisplay.classList.add('hidden');
            vsIndicator.classList.add('hidden');
            this.currentAlert = null;
        }
    }

    updateVSIndicator(requiredVS) {
        const vsValue = document.getElementById('vsValue');
        const vsTarget = document.getElementById('vsTarget');
        const vsCurrent = document.getElementById('vsCurrent');

        // Update text
        vsValue.textContent = (requiredVS >= 0 ? '+' : '') + requiredVS + ' fpm';

        // Update bar positions (0-200px, center at 100px)
        const currentVS = this.ownAircraft.verticalSpeed * 196.85; // m/s to fpm
        const targetPos = 100 - (requiredVS / 3000 * 100); // -3000 to +3000 fpm range
        const currentPos = 100 - (currentVS / 3000 * 100);

        vsTarget.style.top = Math.max(0, Math.min(200, targetPos)) + 'px';
        vsCurrent.style.top = Math.max(0, Math.min(200, currentPos)) + 'px';
    }

    playAudio(type) {
        // Audio playback would go here
        // For now, we'll just log it
        console.log('TCAS Audio:', type);

        // In a full implementation, you would use Web Audio API:
        // const audio = new Audio(`assets/sounds/${type}.mp3`);
        // audio.play();
    }
}

console.log('tcas.js loaded');
