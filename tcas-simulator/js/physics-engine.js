// ===== PHYSICS-ENGINE.JS - Realistic Flight Dynamics =====
// Based on mscsim/src/fdm aerodynamics calculations

const PhysicsEngine = {
    // Constants
    GRAVITY: 9.81,              // m/s²
    AIR_DENSITY_SL: 1.225,      // kg/m³ at sea level

    /**
     * Calculate Indicated Airspeed from True Airspeed
     */
    tasToIas(tasMs, altitudeM) {
        const density = Environment.getDensity(altitudeM);
        return tasMs * Math.sqrt(density / this.AIR_DENSITY_SL);
    },

    /**
     * Calculate True Airspeed from Indicated Airspeed
     */
    iasToTas(iasMs, altitudeM) {
        const density = Environment.getDensity(altitudeM);
        return iasMs * Math.sqrt(this.AIR_DENSITY_SL / density);
    },

    /**
     * Calculate Mach number
     */
    calculateMach(tasMs, altitudeM) {
        // Speed of sound varies with temperature
        const temp = 15 - (altitudeM * 0.0065);
        const speedOfSound = 331.3 * Math.sqrt(1 + temp / 273.15);
        return tasMs / speedOfSound;
    },

    /**
     * Calculate dynamic pressure
     */
    getDynamicPressure(tasMs, density) {
        return 0.5 * density * tasMs * tasMs;
    },

    /**
     * Calculate angle of attack from velocity and aircraft orientation
     */
    calculateAoA(velocity, pitch) {
        if (velocity.length() < 1) return 0;
        const verticalComponent = velocity.y;
        const horizontalComponent = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const flightPathAngle = Math.atan2(verticalComponent, horizontalComponent);
        return pitch - flightPathAngle;
    },

    /**
     * Calculate lift coefficient based on angle of attack
     * Using simplified curve from mscsim C172 data
     */
    calculateCl(aoaDeg, aircraftData) {
        const aero = aircraftData.aero;

        // Below stall
        if (aoaDeg < aero.stallAoA) {
            return aero.cl0 + (aoaDeg * Math.PI / 180) * aero.clAlpha;
        }

        // Stall region
        if (aoaDeg < aero.criticalAoA) {
            const stallFactor = 1 - (aoaDeg - aero.stallAoA) / (aero.criticalAoA - aero.stallAoA);
            return aero.clMax * stallFactor;
        }

        // Post-stall
        return aero.clMax * 0.3 * Math.cos((aoaDeg - aero.criticalAoA) * Math.PI / 30);
    },

    /**
     * Calculate drag coefficient
     * Using parabolic polar approximation
     */
    calculateCd(cl, aoaDeg, aircraftData) {
        const aero = aircraftData.aero;
        const cd0 = aero.cd0;

        // Induced drag factor (for elliptical wing loading: k = 1/(π*AR*e))
        // Assuming efficiency factor e = 0.8
        const AR = Math.pow(aircraftData.dimensions.wingspan, 2) / aircraftData.dimensions.wingArea;
        const k = 1 / (Math.PI * AR * 0.8);

        // Parabolic drag polar
        let cd = cd0 + k * cl * cl;

        // Additional drag in stall
        if (Math.abs(aoaDeg) > aircraftData.aero.stallAoA) {
            cd += 0.02 * (Math.abs(aoaDeg) - aircraftData.aero.stallAoA);
        }

        return cd;
    },

    /**
     * Calculate lift force
     */
    calculateLift(velocity, density, cl, wingArea) {
        const q = this.getDynamicPressure(velocity.length(), density);
        return q * wingArea * cl;
    },

    /**
     * Calculate drag force
     */
    calculateDrag(velocity, density, cd, wingArea) {
        const q = this.getDynamicPressure(velocity.length(), density);
        return q * wingArea * cd;
    },

    /**
     * Calculate thrust based on throttle and aircraft type
     */
    calculateThrust(throttle, velocity, altitudeM, aircraftData) {
        const engine = aircraftData.engine;

        if (engine.type === 'piston' || engine.type === 'turboprop') {
            // Propeller thrust: decreases with speed
            const maxThrust = engine.maxPower * 1000 * 0.8 / Math.max(velocity.length(), 10);
            const densityRatio = Environment.getDensity(altitudeM) / this.AIR_DENSITY_SL;
            return maxThrust * throttle * Math.sqrt(densityRatio);
        } else if (engine.type === 'turbofan') {
            // Jet thrust: relatively constant with speed
            const densityRatio = Environment.getDensity(altitudeM) / this.AIR_DENSITY_SL;
            return engine.maxThrust * throttle * densityRatio;
        }

        return 0;
    },

    /**
     * Update aircraft state for one frame
     */
    update(state, aircraftData, controls, dt) {
        const dims = aircraftData.dimensions;
        const handling = aircraftData.handling;

        // Get current conditions
        const altitudeM = state.position.y;
        const density = Environment.getDensity(altitudeM);

        // Apply wind
        const wind = Environment.getWind(altitudeM);
        const relativeVelocity = new THREE.Vector3(
            state.velocity.x - wind.x,
            state.velocity.y - wind.y,
            state.velocity.z - wind.z
        );

        // Calculate aerodynamic angles
        const aoaDeg = this.calculateAoA(relativeVelocity, state.pitch) * 180 / Math.PI;

        // Aerodynamic coefficients
        const cl = this.calculateCl(aoaDeg, aircraftData);
        const cd = this.calculateCd(cl, aoaDeg, aircraftData);

        // Forces
        const lift = this.calculateLift(relativeVelocity, density, cl, dims.wingArea);
        const drag = this.calculateDrag(relativeVelocity, density, cd, dims.wingArea);
        const thrust = this.calculateThrust(state.throttle, state.velocity, altitudeM, aircraftData);

        // Get aircraft mass
        const mass = aircraftData.mass.empty + aircraftData.mass.fuel * 0.5; // Half fuel

        // Calculate accelerations
        const speed = state.velocity.length();
        const dragAccel = speed > 0.1 ? drag / mass : 0;
        const thrustAccel = thrust / mass;
        const liftAccel = lift / mass;

        // Create force vectors in aircraft axes
        const forward = new THREE.Vector3(
            -Math.sin(state.heading * Math.PI / 180) * Math.cos(state.pitch),
            Math.sin(state.pitch),
            -Math.cos(state.heading * Math.PI / 180) * Math.cos(state.pitch)
        );

        const up = new THREE.Vector3(
            Math.sin(state.heading * Math.PI / 180) * Math.sin(state.pitch),
            Math.cos(state.pitch),
            Math.cos(state.heading * Math.PI / 180) * Math.sin(state.pitch)
        );

        // Apply forces
        const acceleration = new THREE.Vector3(0, -this.GRAVITY, 0);
        acceleration.add(forward.clone().multiplyScalar(thrustAccel - dragAccel));
        acceleration.add(up.clone().multiplyScalar(liftAccel));

        // Integrate velocity
        state.velocity.x += acceleration.x * dt;
        state.velocity.y += acceleration.y * dt;
        state.velocity.z += acceleration.z * dt;

        // Add turbulence
        const turb = Environment.getTurbulence(dt);
        state.velocity.x += turb.x;
        state.velocity.y += turb.y;
        state.velocity.z += turb.z;

        // Integrate position
        state.position.x += state.velocity.x * dt;
        state.position.y += state.velocity.y * dt;
        state.position.z += state.velocity.z * dt;

        // Apply control inputs with aircraft-specific rates
        const rollRate = handling.rollRate * Math.PI / 180;
        const pitchRate = handling.pitchRate * Math.PI / 180;

        state.roll += controls.roll * rollRate * dt;
        state.pitch += controls.pitch * pitchRate * dt;

        // Clamp attitude
        state.roll = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.roll));
        state.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.pitch));

        // Heading from roll (coordinated turn)
        const turnRate = Math.tan(state.roll) * this.GRAVITY / Math.max(speed, 10);
        state.heading += turnRate * 180 / Math.PI * dt;
        state.heading = (state.heading + 360) % 360;

        // Auto-level tendency
        state.roll *= Math.pow(0.98, dt * 60);

        // Ground constraint
        if (state.position.y < 0) {
            state.position.y = 0;
            state.velocity.y = Math.max(0, state.velocity.y);
        }

        // Update derived values
        state.altitudeFt = state.position.y * 3.28084;
        state.iasKts = this.tasToIas(speed, altitudeM) * 1.944;
        state.vsFpm = state.velocity.y * 196.85;
        state.mach = this.calculateMach(speed, altitudeM);
        state.gForce = liftAccel / this.GRAVITY;
        state.aoaDeg = aoaDeg;

        // Stall warning
        state.isStalling = Math.abs(aoaDeg) > aircraftData.aero.stallAoA;

        return state;
    }
};

console.log('physics-engine.js loaded');
