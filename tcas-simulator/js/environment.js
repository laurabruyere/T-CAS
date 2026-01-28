// ===== ENVIRONMENT.JS - Weather and Environment System =====
// Inspired by mscsim Data.h Environment structure

const Environment = {
    // Current conditions
    current: {
        temperature: 15,          // °C at sea level
        pressure: 1013.25,        // hPa (QNH)
        density: 1.225,           // kg/m³
        visibility: 9999,         // meters
        windDirection: 270,       // degrees
        windSpeed: 5,             // m/s
        windGusts: 0,             // m/s
        turbulence: 0,            // 0-1 intensity
        cloudBase: 3000,          // meters
        cloudCoverage: 0.2,       // 0-1 (0=clear, 1=overcast)
        precipitation: 'none',    // none, rain, snow
        timeOfDay: 12             // hours (24h format)
    },

    // Weather presets from mscsim
    presets: {
        cavok: {
            name: "CAVOK - Ciel clair",
            description: "Conditions de vol parfaites",
            temperature: 20,
            pressure: 1020,
            visibility: 9999,
            windSpeed: 3,
            windGusts: 0,
            turbulence: 0,
            cloudBase: 5000,
            cloudCoverage: 0.1,
            precipitation: 'none'
        },
        vfr: {
            name: "VFR Standard",
            description: "Bonnes conditions de vol à vue",
            temperature: 15,
            pressure: 1013.25,
            visibility: 8000,
            windSpeed: 8,
            windGusts: 2,
            turbulence: 0.1,
            cloudBase: 2500,
            cloudCoverage: 0.3,
            precipitation: 'none'
        },
        windy: {
            name: "Vent Fort",
            description: "Rafales et turbulences modérées",
            temperature: 12,
            pressure: 1008,
            visibility: 6000,
            windSpeed: 15,
            windGusts: 8,
            turbulence: 0.4,
            cloudBase: 2000,
            cloudCoverage: 0.5,
            precipitation: 'none'
        },
        overcast: {
            name: "Couvert",
            description: "Plafond bas, visibilité réduite",
            temperature: 8,
            pressure: 1005,
            visibility: 4000,
            windSpeed: 10,
            windGusts: 4,
            turbulence: 0.2,
            cloudBase: 300,
            cloudCoverage: 0.9,
            precipitation: 'none'
        },
        storm: {
            name: "Orage",
            description: "Conditions dangereuses",
            temperature: 10,
            pressure: 995,
            visibility: 2000,
            windSpeed: 20,
            windGusts: 15,
            turbulence: 0.8,
            cloudBase: 200,
            cloudCoverage: 1.0,
            precipitation: 'rain'
        }
    },

    /**
     * Set weather from preset
     */
    setPreset(presetName) {
        const preset = this.presets[presetName];
        if (preset) {
            Object.assign(this.current, preset);
            this.current.windDirection = Math.random() * 360;
            this.updateDensity();
        }
    },

    /**
     * Calculate air density based on altitude and conditions
     */
    getDensity(altitudeMeters) {
        // ISA temperature lapse rate: -6.5°C per 1000m
        const tempAtAlt = this.current.temperature - (altitudeMeters * 0.0065);
        // Pressure decreases with altitude
        const pressAtAlt = this.current.pressure * Math.pow(1 - (altitudeMeters * 0.0000226), 5.256);
        // Ideal gas law: ρ = P / (R * T)
        const R = 287.05; // J/(kg·K)
        const tempKelvin = tempAtAlt + 273.15;
        return (pressAtAlt * 100) / (R * tempKelvin);
    },

    /**
     * Get wind vector at altitude
     */
    getWind(altitudeMeters) {
        // Wind generally increases with altitude
        const altFactor = 1 + (altitudeMeters / 5000) * 0.5;
        const speed = this.current.windSpeed * altFactor;

        // Add gusts
        const gustEffect = this.current.windGusts * (Math.random() - 0.5) * 2;
        const finalSpeed = speed + gustEffect;

        // Convert to vector
        const dirRad = (this.current.windDirection + 180) * Math.PI / 180;
        return {
            x: Math.sin(dirRad) * finalSpeed,
            y: 0,
            z: Math.cos(dirRad) * finalSpeed
        };
    },

    /**
     * Get turbulence displacement
     */
    getTurbulence(dt) {
        if (this.current.turbulence === 0) return { x: 0, y: 0, z: 0 };

        const intensity = this.current.turbulence * 5;
        return {
            x: (Math.random() - 0.5) * intensity * dt,
            y: (Math.random() - 0.5) * intensity * dt * 0.5,
            z: (Math.random() - 0.5) * intensity * dt
        };
    },

    /**
     * Update density from current conditions
     */
    updateDensity() {
        this.current.density = this.getDensity(0);
    },

    /**
     * Get sky color based on time and weather
     */
    getSkyColor() {
        const hour = this.current.timeOfDay;
        const coverage = this.current.cloudCoverage;

        // Base colors for different times
        let color;
        if (hour < 6 || hour > 20) {
            // Night
            color = { r: 15, g: 23, b: 42 };
        } else if (hour < 8 || hour > 18) {
            // Dawn/dusk
            color = { r: 255, g: 140, b: 80 };
        } else {
            // Day
            color = { r: 135, g: 206, b: 235 };
        }

        // Gray out for overcast
        if (coverage > 0.5) {
            const grayAmount = (coverage - 0.5) * 2;
            color.r = color.r * (1 - grayAmount) + 128 * grayAmount;
            color.g = color.g * (1 - grayAmount) + 128 * grayAmount;
            color.b = color.b * (1 - grayAmount) + 128 * grayAmount;
        }

        return (Math.round(color.r) << 16) + (Math.round(color.g) << 8) + Math.round(color.b);
    },

    /**
     * Get fog density based on visibility
     */
    getFogDensity() {
        // Convert visibility to fog density
        return 1 / (this.current.visibility * 0.5);
    },

    /**
     * Get ambient light intensity
     */
    getLightIntensity() {
        const hour = this.current.timeOfDay;
        const coverage = this.current.cloudCoverage;

        // Base intensity from time of day
        let intensity;
        if (hour < 6 || hour > 20) {
            intensity = 0.1;
        } else if (hour < 8) {
            intensity = 0.3 + (hour - 6) * 0.35;
        } else if (hour > 18) {
            intensity = 1 - (hour - 18) * 0.35;
        } else {
            intensity = 1;
        }

        // Reduce for cloud coverage
        intensity *= (1 - coverage * 0.5);

        return intensity;
    }
};

// Initialize with default preset
Environment.setPreset('vfr');

console.log('environment.js loaded');
