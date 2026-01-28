// ===== AIRCRAFT-DATA.JS - Realistic Aircraft Data from mscsim =====
// Data extracted from mscsim/data/fdm/*.xml

const AircraftData = {
    // Cessna 172 Skyhawk - General Aviation
    c172: {
        name: "Cessna 172 Skyhawk",
        type: "general_aviation",
        description: "Avion d'entraînement populaire, stable et facile à piloter",

        // Physical dimensions (from c172_fdm.xml)
        dimensions: {
            wingspan: 11.00,      // m
            mac: 1.49,            // m - mean aerodynamic chord
            wingArea: 16.17,      // m²
            length: 8.28,         // m
            height: 2.72          // m
        },

        // Mass properties
        mass: {
            empty: 754,           // kg
            maxTakeoff: 1111,     // kg
            fuel: 152.6,          // kg (2 tanks)
            payload: 204.4        // kg
        },

        // Performance limits (from limitations section)
        limits: {
            vne: 95,              // m/s - Never exceed speed
            vno: 73,              // m/s - Max structural cruise
            vs0: 25,              // m/s - Stall speed (flaps down)
            vs1: 28,              // m/s - Stall speed (clean)
            maxLoad: 3.8,         // G positive
            minLoad: -1.52        // G negative
        },

        // Aerodynamic coefficients (simplified from XML lookup tables)
        aero: {
            cl0: 0.137,           // Lift coefficient at 0° AoA
            clMax: 1.196,         // Max lift coefficient (stall)
            clAlpha: 5.73,        // Lift curve slope (per rad)
            cd0: 0.027,           // Zero-lift drag
            cdMin: 0.026,         // Minimum drag
            stallAoA: 15,         // degrees
            criticalAoA: 17       // degrees (full stall)
        },

        // Engine - Lycoming O-360
        engine: {
            type: "piston",
            maxPower: 134,        // kW (180 hp)
            propDiameter: 1.93,   // m
            maxRPM: 2700
        },

        // Control effectiveness
        controls: {
            aileronMax: 17.5,     // degrees
            elevatorUp: 28,       // degrees
            elevatorDown: 23,     // degrees
            rudderMax: 17.7       // degrees
        },

        // Three.js model parameters
        model: {
            fuselageLength: 8,
            fuselageRadius: 0.9,
            wingSpan: 11,
            wingChord: 1.5,
            tailHeight: 2.5,
            color1: 0xf5f5f5,      // White
            color2: 0x1a5276,      // Blue stripe
            color3: 0xc0392b       // Red tail
        },

        // Flight characteristics
        handling: {
            rollRate: 90,         // deg/s max
            pitchRate: 45,        // deg/s max
            climbRate: 3.8,       // m/s (750 fpm)
            turnRate: 3.0,        // deg/s standard rate
            approachSpeed: 32     // m/s
        }
    },

    // General Dynamics F-16 Fighting Falcon - Fighter Jet
    f16: {
        name: "F-16 Fighting Falcon",
        type: "fighter",
        description: "Chasseur multirôle supersonique très maniable",

        dimensions: {
            wingspan: 9.144,
            mac: 3.45,
            wingArea: 27.87,
            length: 15.06,
            height: 4.88
        },

        mass: {
            empty: 8570,
            maxTakeoff: 19200,
            fuel: 3200,
            payload: 7400
        },

        limits: {
            vne: 700,             // m/s
            maxMach: 2.0,
            vs0: 77,
            vs1: 85,
            maxLoad: 9.0,         // G positive
            minLoad: -3.0         // G negative
        },

        aero: {
            cl0: 0.0,
            clMax: 1.6,
            clAlpha: 3.44,
            cd0: 0.016,
            cdMin: 0.014,
            stallAoA: 25,
            criticalAoA: 35
        },

        engine: {
            type: "turbofan",
            maxThrust: 127000,    // N with afterburner
            dryThrust: 76000      // N without afterburner
        },

        controls: {
            aileronMax: 20,
            elevatorMax: 25,
            rudderMax: 30
        },

        model: {
            fuselageLength: 15,
            fuselageRadius: 1.2,
            wingSpan: 9.1,
            wingChord: 3.0,
            tailHeight: 4.5,
            color1: 0x4a5568,      // Dark gray
            color2: 0x2d3748,      // Darker gray
            color3: 0xed8936       // Orange markings
        },

        handling: {
            rollRate: 270,
            pitchRate: 120,
            climbRate: 254,       // m/s (50000 fpm!)
            turnRate: 18,
            approachSpeed: 85
        }
    },

    // Lockheed C-130 Hercules - Transport
    c130: {
        name: "C-130 Hercules",
        type: "transport",
        description: "Avion de transport militaire tactique à quatre turbopropulseurs",

        dimensions: {
            wingspan: 40.4,
            mac: 4.2,
            wingArea: 162.1,
            length: 29.8,
            height: 11.7
        },

        mass: {
            empty: 34900,
            maxTakeoff: 70300,
            fuel: 20520,
            payload: 20000
        },

        limits: {
            vne: 180,
            vs0: 45,
            vs1: 52,
            maxLoad: 3.0,
            minLoad: -1.0
        },

        aero: {
            cl0: 0.25,
            clMax: 2.0,
            clAlpha: 4.2,
            cd0: 0.025,
            cdMin: 0.022,
            stallAoA: 18,
            criticalAoA: 22
        },

        engine: {
            type: "turboprop",
            maxPower: 3400,       // kW per engine (4 engines)
            propDiameter: 4.1
        },

        controls: {
            aileronMax: 15,
            elevatorMax: 20,
            rudderMax: 25
        },

        model: {
            fuselageLength: 30,
            fuselageRadius: 2.5,
            wingSpan: 40,
            wingChord: 4.5,
            tailHeight: 10,
            color1: 0x4b5320,      // Olive drab
            color2: 0x3d3d3d,      // Dark gray
            color3: 0x1a1a1a       // Black
        },

        handling: {
            rollRate: 45,
            pitchRate: 20,
            climbRate: 9.1,
            turnRate: 1.5,
            approachSpeed: 55
        }
    }
};

// Helper function to get aircraft by ID
AircraftData.get = function (id) {
    return this[id] || this.c172;
};

// List all available aircraft
AircraftData.list = function () {
    return ['c172', 'f16', 'c130'];
};

console.log('aircraft-data.js loaded with mscsim data');
