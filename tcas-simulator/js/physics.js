// ===== PHYSICS.JS - Realistic Flight Dynamics Model =====
// Inspired by mscsim fdm_Aerodynamics

const FlightPhysics = {
    // Constants
    GRAVITY: 9.81,          // m/s²
    AIR_DENSITY_SEA: 1.225, // kg/m³
    SPEED_OF_SOUND: 343,    // m/s at sea level
    FT_TO_M: 0.3048,
    M_TO_FT: 3.28084,
    KTS_TO_MS: 0.514444,
    MS_TO_KTS: 1.94384,
    FPM_TO_MS: 0.00508,
    MS_TO_FPM: 196.85,

    // Aircraft configurations (from mscsim C172 data)
    aircraftTypes: {
        c172: {
            name: "Cessna 172",
            mass: 1043,              // kg (empty weight)
            wingArea: 16.2,          // m²
            wingSpan: 11.0,          // m
            maxThrust: 2400,         // N
            stallSpeed: 25,          // m/s (48 kts)
            maxSpeed: 72,            // m/s (140 kts)
            climbRate: 3.8,          // m/s (750 fpm)
            stallAoA: 0.28,          // rad (~16°)
            cl0: 0.307,              // lift coefficient at zero AoA
            clAlpha: 4.41,           // lift curve slope
            cd0: 0.027,              // parasitic drag
            cdAlpha: 0.121,          // induced drag factor
            cmAlpha: -0.89,          // pitch moment coefficient
            rollRate: 0.5,           // rad/s max roll rate
            pitchRate: 0.3,          // rad/s max pitch rate
            yawRate: 0.2,            // rad/s max yaw rate
        },
        f16: {
            name: "F-16 Falcon",
            mass: 8570,
            wingArea: 27.87,
            wingSpan: 9.96,
            maxThrust: 75000,
            stallSpeed: 77,
            maxSpeed: 600,
            climbRate: 250,
            stallAoA: 0.35,
            cl0: 0.08,
            clAlpha: 3.44,
            cd0: 0.016,
            cdAlpha: 0.09,
            cmAlpha: -0.7,
            rollRate: 4.5,
            pitchRate: 1.2,
            yawRate: 0.8,
        },
        c130: {
            name: "C-130 Hercules",
            mass: 34900,
            wingArea: 162.1,
            wingSpan: 40.4,
            maxThrust: 64000,
            stallSpeed: 45,
            maxSpeed: 180,
            climbRate: 9.1,
            stallAoA: 0.26,
            cl0: 0.25,
            clAlpha: 4.2,
            cd0: 0.025,
            cdAlpha: 0.11,
            cmAlpha: -0.85,
            rollRate: 0.3,
            pitchRate: 0.2,
            yawRate: 0.15,
        }
    },

    // Current aircraft config
    currentAircraft: null,

    /**
     * Initialize physics with aircraft type
     */
    init(aircraftType = 'c172') {
        this.currentAircraft = this.aircraftTypes[aircraftType] || this.aircraftTypes.c172;
        return this;
    },

    /**
     * Calculate angle of attack
     * From mscsim: fdm_Aerodynamics::getAngleOfAttack
     */
    getAngleOfAttack(velocity, pitch) {
        const u = velocity.z; // Forward velocity
        const w = velocity.y; // Vertical velocity
        const velMin = 0.01;
        
        if (Math.abs(u) > velMin) {
            return Math.atan2(w, -u);
        }
        return 0;
    },

    /**
     * Calculate sideslip angle
     * From mscsim: fdm_Aerodynamics::getSideslipAngle
     */
    getSideslipAngle(velocity) {
        const velXZ = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const velMin = 0.01;
        
        if (velXZ > velMin) {
            return Math.atan2(velocity.x, velXZ);
        }
        return 0;
    },

    /**
     * Calculate air density at altitude
     */
    getAirDensity(altitude) {
        // Standard atmosphere model
        const altitudeM = altitude * this.FT_TO_M;
        const temperature = 288.15 - 0.0065 * altitudeM; // Kelvin
        const pressure = 101325 * Math.pow(temperature / 288.15, 5.255);
        return pressure / (287.05 * temperature);
    },

    /**
     * Calculate Mach number
     */
    getMachNumber(airspeed, altitude) {
        const altitudeM = altitude * this.FT_TO_M;
        const temperature = 288.15 - 0.0065 * altitudeM;
        const speedOfSound = Math.sqrt(1.4 * 287.05 * temperature);
        return airspeed / speedOfSound;
    },

    /**
     * Calculate indicated airspeed from true airspeed
     */
    getIAS(tas, altitude) {
        const rho = this.getAirDensity(altitude);
        return tas * Math.sqrt(rho / this.AIR_DENSITY_SEA);
    },

    /**
     * Calculate true airspeed from indicated airspeed
     */
    getTAS(ias, altitude) {
        const rho = this.getAirDensity(altitude);
        return ias * Math.sqrt(this.AIR_DENSITY_SEA / rho);
    },

    /**
     * Calculate lift coefficient
     */
    getLiftCoefficient(aoa) {
        const ac = this.currentAircraft;
        let cl = ac.cl0 + ac.clAlpha * aoa;
        
        // Stall modeling - lift drops after critical AoA
        if (Math.abs(aoa) > ac.stallAoA) {
            const stallFactor = 1 - (Math.abs(aoa) - ac.stallAoA) * 3;
            cl *= Math.max(0.3, stallFactor);
        }
        
        return cl;
    },

    /**
     * Calculate drag coefficient
     */
    getDragCoefficient(aoa, cl) {
        const ac = this.currentAircraft;
        // Parasitic + induced drag
        return ac.cd0 + ac.cdAlpha * cl * cl;
    },

    /**
     * Check stall condition
     */
    isStalling(aoa) {
        return Math.abs(aoa) > this.currentAircraft.stallAoA;
    },

    /**
     * Calculate G-force vector
     */
    calculateGForce(acceleration, orientation) {
        // G-force = (acceleration + gravity) / gravity
        // Expressed in body axes
        const gx = acceleration.x / this.GRAVITY;
        const gy = (acceleration.y + this.GRAVITY) / this.GRAVITY;
        const gz = acceleration.z / this.GRAVITY;
        
        return { x: gx, y: gy, z: gz, total: Math.sqrt(gx*gx + gy*gy + gz*gz) };
    },

    /**
     * Calculate all aerodynamic forces
     */
    calculateForces(state) {
        const ac = this.currentAircraft;
        const { velocity, altitude, pitch, roll, throttle } = state;
        
        const speed = Math.sqrt(velocity.x*velocity.x + velocity.y*velocity.y + velocity.z*velocity.z);
        const rho = this.getAirDensity(altitude);
        const dynamicPressure = 0.5 * rho * speed * speed;
        
        // Angle of attack
        const aoa = this.getAngleOfAttack(velocity, pitch);
        
        // Coefficients
        const cl = this.getLiftCoefficient(aoa);
        const cd = this.getDragCoefficient(aoa, cl);
        
        // Forces
        const lift = cl * dynamicPressure * ac.wingArea;
        const drag = cd * dynamicPressure * ac.wingArea;
        const thrust = throttle * ac.maxThrust;
        
        // Weight
        const weight = ac.mass * this.GRAVITY;
        
        return {
            lift,
            drag,
            thrust,
            weight,
            cl,
            cd,
            aoa,
            dynamicPressure,
            isStalling: this.isStalling(aoa)
        };
    },

    /**
     * Main physics update - returns new state
     */
    update(state, inputs, dt) {
        const ac = this.currentAircraft;
        if (!ac) return state;

        let { position, velocity, rotation, throttle, altitude } = state;
        const { pitchInput, rollInput, yawInput, throttleInput } = inputs;

        // Update throttle
        throttle = Math.max(0, Math.min(1, throttle + throttleInput * dt));

        // Calculate speed
        const speed = Math.sqrt(velocity.x*velocity.x + velocity.y*velocity.y + velocity.z*velocity.z);
        
        // Air density at altitude
        const rho = this.getAirDensity(altitude);
        const dynamicPressure = 0.5 * rho * speed * speed;

        // Angle of attack & sideslip
        const aoa = this.getAngleOfAttack(velocity, rotation.pitch);
        const beta = this.getSideslipAngle(velocity);

        // Aerodynamic coefficients
        const cl = this.getLiftCoefficient(aoa);
        const cd = this.getDragCoefficient(aoa, cl);

        // Forces
        const lift = cl * dynamicPressure * ac.wingArea;
        const drag = cd * dynamicPressure * ac.wingArea;
        const thrust = throttle * ac.maxThrust;

        // Control effectiveness (scales with dynamic pressure)
        const controlEffect = Math.min(1, dynamicPressure / 1000);

        // Update rotations
        rotation.pitch += pitchInput * ac.pitchRate * controlEffect * dt;
        rotation.roll += rollInput * ac.rollRate * controlEffect * dt;
        rotation.yaw += yawInput * ac.yawRate * controlEffect * dt;

        // Clamp rotations
        rotation.pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, rotation.pitch));
        rotation.roll = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotation.roll));

        // Auto-level tendency
        if (Math.abs(rollInput) < 0.1) {
            rotation.roll *= (1 - 0.5 * dt);
        }

        // Calculate heading from yaw
        let heading = (rotation.yaw * 180 / Math.PI + 360) % 360;

        // Turn rate based on bank angle
        const turnRate = (this.GRAVITY / speed) * Math.tan(rotation.roll);
        rotation.yaw += turnRate * dt;

        // Acceleration
        const accel = {
            x: 0,
            y: (lift * Math.cos(rotation.roll) - ac.mass * this.GRAVITY + thrust * Math.sin(rotation.pitch)) / ac.mass,
            z: (thrust * Math.cos(rotation.pitch) - drag) / ac.mass
        };

        // Stall effects
        const isStalling = this.isStalling(aoa);
        if (isStalling) {
            accel.y -= 5; // Additional drop
            rotation.pitch += (0.1 - aoa) * dt; // Nose drop tendency
        }

        // Update velocity
        velocity.x += accel.x * dt;
        velocity.y += accel.y * dt;
        velocity.z += accel.z * dt;

        // Forward velocity component
        const forwardSpeed = Math.sqrt(velocity.x*velocity.x + velocity.z*velocity.z);

        // Update position
        const forward = {
            x: Math.sin(rotation.yaw),
            y: velocity.y * dt,
            z: -Math.cos(rotation.yaw)
        };

        position.x += forward.x * forwardSpeed * dt;
        position.y += forward.y;
        position.z += forward.z * forwardSpeed * dt;

        // Ground collision
        if (position.y < 0) {
            position.y = 0;
            velocity.y = 0;
        }

        // Calculate derived values
        const ias = this.getIAS(speed, altitude);
        const tas = speed;
        const machNumber = this.getMachNumber(speed, altitude);
        const verticalSpeed = velocity.y;
        const gForce = this.calculateGForce(accel, rotation);

        return {
            position,
            velocity,
            rotation,
            throttle,
            altitude: position.y * this.M_TO_FT,
            
            // Derived values
            speed: forwardSpeed,
            ias: ias * this.MS_TO_KTS,
            tas: tas * this.MS_TO_KTS,
            groundSpeed: forwardSpeed * this.MS_TO_KTS,
            machNumber,
            verticalSpeed: verticalSpeed * this.MS_TO_FPM,
            heading,
            
            // Aerodynamics
            aoa: aoa * 180 / Math.PI,
            beta: beta * 180 / Math.PI,
            cl,
            cd,
            isStalling,
            gForce,
            
            // Status
            onGround: position.y < 1
        };
    }
};

console.log('physics.js loaded');
