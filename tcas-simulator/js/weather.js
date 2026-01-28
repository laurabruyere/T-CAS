// ===== WEATHER.JS - Weather and Environment System =====
// Inspired by mscsim Environment data

const Weather = {
    // Current weather state
    wind: {
        direction: 0,       // degrees (from)
        speed: 0,           // m/s
        gusts: 0,           // m/s (gust speed above steady)
        gustFrequency: 0.1  // Hz
    },

    turbulence: {
        intensity: 0,       // 0=none, 1=light, 2=moderate, 3=severe
        lastUpdate: 0,
        acceleration: { x: 0, y: 0, z: 0 }
    },

    visibility: 10000,      // meters
    cloudBase: 2000,        // meters AGL
    cloudTop: 3000,         // meters AGL
    cloudCoverage: 0,       // 0=SKC, 1=FEW, 2=SCT, 3=BKN, 4=OVC

    temperature: 15,        // °C at sea level
    pressure: 1013.25,      // hPa

    // Time of day
    timeOfDay: 12,          // hours (0-24)
    sunAzimuth: 180,        // degrees
    sunElevation: 60,       // degrees

    // Presets
    presets: {
        clear: {
            wind: { direction: 0, speed: 0, gusts: 0 },
            turbulence: 0,
            visibility: 10000,
            cloudBase: 10000,
            cloudCoverage: 0
        },
        calm: {
            wind: { direction: 270, speed: 3, gusts: 0 },
            turbulence: 0,
            visibility: 10000,
            cloudBase: 2000,
            cloudCoverage: 1
        },
        windy: {
            wind: { direction: 270, speed: 10, gusts: 5 },
            turbulence: 1,
            visibility: 8000,
            cloudBase: 1500,
            cloudCoverage: 2
        },
        stormy: {
            wind: { direction: 240, speed: 20, gusts: 15 },
            turbulence: 3,
            visibility: 3000,
            cloudBase: 500,
            cloudCoverage: 4
        },
        foggy: {
            wind: { direction: 0, speed: 2, gusts: 0 },
            turbulence: 0,
            visibility: 500,
            cloudBase: 100,
            cloudCoverage: 4
        }
    },

    /**
     * Apply a weather preset
     */
    setPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.wind = { ...preset.wind, gustFrequency: 0.1 };
        this.turbulence.intensity = preset.turbulence;
        this.visibility = preset.visibility;
        this.cloudBase = preset.cloudBase;
        this.cloudCoverage = preset.cloudCoverage;

        this.updateSceneEffects();
    },

    /**
     * Set custom wind
     */
    setWind(direction, speed, gusts = 0) {
        this.wind.direction = direction;
        this.wind.speed = speed;
        this.wind.gusts = gusts;
    },

    /**
     * Calculate wind effect on aircraft
     */
    getWindEffect(heading, altitude) {
        // Wind decreases with altitude (simple model)
        const altFactor = Math.max(0.5, 1 - altitude * 0.3048 / 10000);
        const effectiveSpeed = this.wind.speed * altFactor;

        // Calculate headwind/crosswind components
        const windRad = this.wind.direction * Math.PI / 180;
        const headingRad = heading * Math.PI / 180;
        const relativeWind = windRad - headingRad;

        const headwind = effectiveSpeed * Math.cos(relativeWind);
        const crosswind = effectiveSpeed * Math.sin(relativeWind);

        // Add gusts
        let gustEffect = 0;
        if (this.wind.gusts > 0) {
            const time = Date.now() / 1000;
            gustEffect = Math.sin(time * this.wind.gustFrequency * 2 * Math.PI) * this.wind.gusts * altFactor;
        }

        return {
            headwind: headwind + gustEffect * Math.cos(relativeWind),
            crosswind: crosswind + gustEffect * Math.sin(relativeWind),
            vertical: 0
        };
    },

    /**
     * Calculate turbulence effect
     */
    getTurbulenceEffect(dt) {
        if (this.turbulence.intensity === 0) {
            return { x: 0, y: 0, z: 0 };
        }

        const now = Date.now() / 1000;
        const updateInterval = 0.1; // seconds

        if (now - this.turbulence.lastUpdate > updateInterval) {
            this.turbulence.lastUpdate = now;

            // Random acceleration based on intensity
            const magnitude = this.turbulence.intensity * 2; // m/s²

            this.turbulence.acceleration = {
                x: (Math.random() - 0.5) * magnitude,
                y: (Math.random() - 0.5) * magnitude,
                z: (Math.random() - 0.5) * magnitude * 0.5
            };
        }

        return {
            x: this.turbulence.acceleration.x * dt,
            y: this.turbulence.acceleration.y * dt,
            z: this.turbulence.acceleration.z * dt
        };
    },

    /**
     * Check if aircraft is in clouds
     */
    isInClouds(altitude) {
        if (this.cloudCoverage === 0) return false;
        const altMeters = altitude * 0.3048;
        return altMeters >= this.cloudBase && altMeters <= this.cloudTop;
    },

    /**
     * Get visibility at altitude
     */
    getVisibility(altitude) {
        // Reduce visibility in clouds
        if (this.isInClouds(altitude)) {
            return Math.min(this.visibility, 100);
        }
        return this.visibility;
    },

    /**
     * Calculate sun position based on time
     */
    updateSunPosition() {
        // Simple sun position model
        const hourAngle = (this.timeOfDay - 12) * 15; // degrees
        this.sunAzimuth = 180 + hourAngle;
        this.sunElevation = 90 - Math.abs(hourAngle);

        // Clamp elevation
        this.sunElevation = Math.max(-10, Math.min(90, this.sunElevation));
    },

    /**
     * Get sky color based on time of day
     */
    getSkyColor() {
        const elev = this.sunElevation;

        if (elev < -5) {
            // Night
            return { r: 0.02, g: 0.02, b: 0.08 };
        } else if (elev < 5) {
            // Twilight
            const t = (elev + 5) / 10;
            return {
                r: 0.02 + t * 0.5,
                g: 0.02 + t * 0.3,
                b: 0.08 + t * 0.4
            };
        } else if (elev < 20) {
            // Sunrise/sunset
            const t = (elev - 5) / 15;
            return {
                r: 0.52 + t * 0.1,
                g: 0.32 + t * 0.4,
                b: 0.48 + t * 0.4
            };
        } else {
            // Daytime
            return { r: 0.62, g: 0.72, b: 0.88 };
        }
    },

    /**
     * Update Three.js scene effects
     */
    updateSceneEffects(scene) {
        if (!scene) return;

        // Update fog based on visibility
        if (scene.fog) {
            scene.fog.near = this.visibility * 0.1;
            scene.fog.far = this.visibility;
        }

        // Update sky color
        const skyColor = this.getSkyColor();
        if (scene.background) {
            scene.background.setRGB(skyColor.r, skyColor.g, skyColor.b);
        }
    },

    /**
     * Get temperature at altitude
     */
    getTemperature(altitude) {
        // ISA model: -2°C per 1000ft
        const altFeet = altitude;
        return this.temperature - (altFeet / 1000) * 2;
    },

    /**
     * Get pressure at altitude
     */
    getPressure(altitude) {
        // Barometric formula approximation
        const altMeters = altitude * 0.3048;
        return this.pressure * Math.exp(-altMeters / 8500);
    },

    /**
     * Get density altitude
     */
    getDensityAltitude(altitude) {
        const temp = this.getTemperature(altitude);
        const isaTemp = 15 - (altitude / 1000) * 2;
        const tempDeviation = temp - isaTemp;

        // 120ft per 1°C above ISA
        return altitude + tempDeviation * 120;
    },

    /**
     * Set time of day
     */
    setTimeOfDay(hours) {
        this.timeOfDay = hours % 24;
        this.updateSunPosition();
    },

    /**
     * Advance time
     */
    advanceTime(minutes) {
        this.timeOfDay = (this.timeOfDay + minutes / 60) % 24;
        this.updateSunPosition();
    }
};

console.log('weather.js loaded');
