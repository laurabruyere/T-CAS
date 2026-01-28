// ===== AUTOPILOT.JS - Autopilot Control System =====
// Inspired by mscsim KFC325 autopilot

const Autopilot = {
    // Autopilot state
    enabled: false,
    modes: {
        hdg: false,     // Heading hold
        alt: false,     // Altitude hold
        vs: false,      // Vertical speed hold
        ias: false,     // Airspeed hold
        nav: false,     // VOR/NAV tracking
        apr: false,     // ILS approach
        gs: false       // Glideslope
    },

    // Target values
    targets: {
        heading: 0,     // degrees
        altitude: 3000, // feet
        vs: 0,          // fpm
        ias: 120,       // knots
        course: 0       // degrees (for NAV/ILS)
    },

    // Current selections
    selectedHeading: 0,
    selectedAltitude: 3000,
    selectedVS: 0,
    selectedIAS: 120,
    selectedCourse: 0,

    // PID controllers
    pidHeading: { kp: 0.5, ki: 0.01, kd: 0.1, integral: 0, lastError: 0 },
    pidAltitude: { kp: 0.3, ki: 0.005, kd: 0.2, integral: 0, lastError: 0 },
    pidVS: { kp: 0.01, ki: 0.001, kd: 0.005, integral: 0, lastError: 0 },
    pidBank: { kp: 0.8, ki: 0.02, kd: 0.15, integral: 0, lastError: 0 },
    pidPitch: { kp: 0.6, ki: 0.015, kd: 0.12, integral: 0, lastError: 0 },

    // Limits
    maxBankAngle: 25,   // degrees
    maxPitchAngle: 15,  // degrees
    maxVS: 2000,        // fpm

    /**
     * Enable/disable autopilot
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.disengageAll();
        }
        this.updateUI();
        return this.enabled;
    },

    /**
     * Disengage all modes
     */
    disengageAll() {
        Object.keys(this.modes).forEach(mode => this.modes[mode] = false);
        this.resetPID();
    },

    /**
     * Reset all PID integrators
     */
    resetPID() {
        const pids = [this.pidHeading, this.pidAltitude, this.pidVS, this.pidBank, this.pidPitch];
        pids.forEach(pid => {
            pid.integral = 0;
            pid.lastError = 0;
        });
    },

    /**
     * PID controller calculation
     */
    calculatePID(pid, error, dt) {
        pid.integral += error * dt;
        // Anti-windup
        pid.integral = Math.max(-100, Math.min(100, pid.integral));

        const derivative = (error - pid.lastError) / dt;
        pid.lastError = error;

        return pid.kp * error + pid.ki * pid.integral + pid.kd * derivative;
    },

    /**
     * Toggle heading hold mode
     */
    toggleHDG(currentHeading) {
        if (!this.enabled) return;

        this.modes.hdg = !this.modes.hdg;
        if (this.modes.hdg) {
            this.selectedHeading = currentHeading;
            this.targets.heading = currentHeading;
            this.modes.nav = false;
            this.modes.apr = false;
        }
        this.updateUI();
    },

    /**
     * Toggle altitude hold mode
     */
    toggleALT(currentAltitude) {
        if (!this.enabled) return;

        this.modes.alt = !this.modes.alt;
        if (this.modes.alt) {
            this.selectedAltitude = Math.round(currentAltitude / 100) * 100;
            this.targets.altitude = this.selectedAltitude;
            this.modes.vs = false;
        }
        this.updateUI();
    },

    /**
     * Toggle vertical speed mode
     */
    toggleVS(currentVS) {
        if (!this.enabled) return;

        this.modes.vs = !this.modes.vs;
        if (this.modes.vs) {
            this.selectedVS = Math.round(currentVS / 100) * 100;
            this.targets.vs = this.selectedVS;
            this.modes.alt = false;
        }
        this.updateUI();
    },

    /**
     * Toggle IAS hold mode
     */
    toggleIAS(currentIAS) {
        if (!this.enabled) return;

        this.modes.ias = !this.modes.ias;
        if (this.modes.ias) {
            this.selectedIAS = Math.round(currentIAS);
            this.targets.ias = this.selectedIAS;
        }
        this.updateUI();
    },

    /**
     * Adjust heading bug
     */
    adjustHeading(delta) {
        this.selectedHeading = (this.selectedHeading + delta + 360) % 360;
        if (this.modes.hdg) {
            this.targets.heading = this.selectedHeading;
        }
        this.updateUI();
    },

    /**
     * Adjust altitude target
     */
    adjustAltitude(delta) {
        this.selectedAltitude = Math.max(0, this.selectedAltitude + delta);
        if (this.modes.alt) {
            this.targets.altitude = this.selectedAltitude;
        }
        this.updateUI();
    },

    /**
     * Adjust vertical speed target
     */
    adjustVS(delta) {
        this.selectedVS = Math.max(-this.maxVS, Math.min(this.maxVS, this.selectedVS + delta));
        if (this.modes.vs) {
            this.targets.vs = this.selectedVS;
        }
        this.updateUI();
    },

    /**
     * Adjust airspeed target
     */
    adjustIAS(delta) {
        this.selectedIAS = Math.max(60, Math.min(300, this.selectedIAS + delta));
        if (this.modes.ias) {
            this.targets.ias = this.selectedIAS;
        }
        this.updateUI();
    },

    /**
     * Calculate heading error (shortest path)
     */
    getHeadingError(current, target) {
        let error = target - current;
        if (error > 180) error -= 360;
        if (error < -180) error += 360;
        return error;
    },

    /**
     * Main autopilot update - returns control inputs
     */
    update(flightState, dt) {
        if (!this.enabled) {
            return { pitchInput: 0, rollInput: 0, throttleInput: 0 };
        }

        let pitchInput = 0;
        let rollInput = 0;
        let throttleInput = 0;

        const { heading, altitude, verticalSpeed, ias, roll, pitch } = flightState;

        // HEADING HOLD
        if (this.modes.hdg) {
            const headingError = this.getHeadingError(heading, this.targets.heading);

            // Target bank angle based on heading error
            let targetBank = headingError * 1.5; // deg per deg error
            targetBank = Math.max(-this.maxBankAngle, Math.min(this.maxBankAngle, targetBank));

            // Bank angle control
            const bankError = targetBank - (roll * 180 / Math.PI);
            rollInput = this.calculatePID(this.pidBank, bankError, dt) * 0.02;
        }

        // ALTITUDE HOLD
        if (this.modes.alt) {
            const altError = this.targets.altitude - altitude;

            // Convert altitude error to target VS
            let targetVS = altError * 2; // 2 fpm per foot of error
            targetVS = Math.max(-this.maxVS, Math.min(this.maxVS, targetVS));

            // VS control
            const vsError = targetVS - verticalSpeed;
            pitchInput = this.calculatePID(this.pidAltitude, vsError, dt) * 0.0003;
        }

        // VERTICAL SPEED HOLD
        if (this.modes.vs) {
            const vsError = this.targets.vs - verticalSpeed;
            pitchInput = this.calculatePID(this.pidVS, vsError, dt) * 0.0005;
        }

        // IAS HOLD (via throttle)
        if (this.modes.ias) {
            const iasError = this.targets.ias - ias;
            throttleInput = this.calculatePID(this.pidPitch, iasError, dt) * 0.01;
        }

        // Clamp outputs
        pitchInput = Math.max(-1, Math.min(1, pitchInput));
        rollInput = Math.max(-1, Math.min(1, rollInput));
        throttleInput = Math.max(-0.5, Math.min(0.5, throttleInput));

        return { pitchInput, rollInput, throttleInput };
    },

    /**
     * Update UI display
     */
    updateUI() {
        // AP Master
        const apBtn = document.getElementById('apBtn');
        if (apBtn) apBtn.classList.toggle('active', this.enabled);

        // Mode buttons
        const modeButtons = ['hdg', 'alt', 'vs', 'ias'];
        modeButtons.forEach(mode => {
            const btn = document.getElementById(`ap${mode.toUpperCase()}Btn`);
            if (btn) btn.classList.toggle('active', this.modes[mode]);
        });

        // Values display
        const hdgVal = document.getElementById('apHdgVal');
        const altVal = document.getElementById('apAltVal');
        const vsVal = document.getElementById('apVsVal');
        const iasVal = document.getElementById('apIasVal');

        if (hdgVal) hdgVal.textContent = Math.round(this.selectedHeading).toString().padStart(3, '0') + '°';
        if (altVal) altVal.textContent = this.selectedAltitude + ' ft';
        if (vsVal) vsVal.textContent = (this.selectedVS >= 0 ? '+' : '') + this.selectedVS + ' fpm';
        if (iasVal) iasVal.textContent = this.selectedIAS + ' kts';
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKey(key, flightState) {
        switch (key) {
            case 'p': // AP toggle
                this.toggle();
                break;
            case 'h': // HDG
                if (this.enabled) this.toggleHDG(flightState.heading);
                break;
            case 'a': // ALT
                if (this.enabled) this.toggleALT(flightState.altitude);
                break;
            case 'v': // VS
                if (this.enabled) this.toggleVS(flightState.verticalSpeed);
                break;
            case 'i': // IAS
                if (this.enabled) this.toggleIAS(flightState.ias);
                break;
        }
    }
};

console.log('autopilot.js loaded');
