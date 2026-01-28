// ===== NAVIGATION.JS - Navigation Aids System =====
// Inspired by mscsim nav_DataBase

const Navigation = {
    // Navigation database
    navaids: [],
    airports: [],
    waypoints: [],

    // Active navigation
    selectedNavaid: null,
    selectedCourse: 0,
    flightPlan: [],
    currentWaypoint: 0,

    // ILS approach data
    ils: {
        active: false,
        frequency: 0,
        course: 0,
        glideslope: 3.0,        // degrees
        localizerWidth: 2.5,    // degrees half-width
        gsWidth: 0.7,           // degrees half-width
        runway: null
    },

    // VOR data
    vor: {
        active: false,
        radial: 0,
        dme: 0,
        toFrom: 'OFF'           // 'TO', 'FROM', 'OFF'
    },

    // Constants
    NM_TO_M: 1852,
    M_TO_NM: 0.000539957,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,

    /**
     * Initialize navigation database
     */
    init() {
        // Sample navaids (positioned around the default scenery)
        this.navaids = [
            { id: 'VOR1', type: 'VOR', name: 'Central VOR', lat: 0, lon: 0, x: 0, y: 0, z: 0, freq: 115.5 },
            { id: 'VOR2', type: 'VOR', name: 'North VOR', lat: 0.05, lon: 0, x: 0, y: 0, z: -5000, freq: 112.3 },
            { id: 'NDB1', type: 'NDB', name: 'South NDB', lat: -0.03, lon: 0.02, x: 2000, y: 0, z: 3000, freq: 385 },
            {
                id: 'ILS27', type: 'ILS', name: 'ILS Runway 27',
                lat: 0, lon: 0,
                x: 5000, y: 0, z: 0,
                freq: 110.9,
                course: 270,
                glideslope: 3.0,
                runwayThreshold: { x: 5000, y: 0, z: 0 }
            }
        ];

        this.airports = [
            {
                id: 'MAIN',
                name: 'Main Airport',
                x: 5000, y: 0, z: 0,
                elevation: 0,
                runways: [
                    { id: '09/27', heading: 90, length: 2500, width: 45 }
                ]
            }
        ];

        return this;
    },

    /**
     * Tune to a navaid by frequency
     */
    tuneNavaid(frequency) {
        this.selectedNavaid = this.navaids.find(n => n.freq === frequency);
        if (this.selectedNavaid) {
            if (this.selectedNavaid.type === 'ILS') {
                this.ils.active = true;
                this.ils.frequency = frequency;
                this.ils.course = this.selectedNavaid.course;
                this.ils.glideslope = this.selectedNavaid.glideslope;
                this.ils.runway = this.selectedNavaid.runwayThreshold;
            } else {
                this.vor.active = true;
                this.ils.active = false;
            }
        }
        return this.selectedNavaid;
    },

    /**
     * Set OBS (course selector)
     */
    setCourse(course) {
        this.selectedCourse = course;
    },

    /**
     * Calculate bearing to a point
     */
    getBearing(fromX, fromZ, toX, toZ) {
        const dx = toX - fromX;
        const dz = toZ - fromZ;
        let bearing = Math.atan2(dx, -dz) * this.RAD_TO_DEG;
        return (bearing + 360) % 360;
    },

    /**
     * Calculate distance between points
     */
    getDistance(x1, z1, x2, z2) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dz * dz);
    },

    /**
     * Get VOR radial and DME
     */
    getVORData(aircraftX, aircraftZ, aircraftHeading) {
        if (!this.vor.active || !this.selectedNavaid) {
            return { radial: 0, dme: 0, deviation: 0, toFrom: 'OFF' };
        }

        const nav = this.selectedNavaid;

        // Calculate bearing FROM station TO aircraft
        const radial = this.getBearing(nav.x, nav.z, aircraftX, aircraftZ);

        // Distance (DME)
        const distanceM = this.getDistance(aircraftX, aircraftZ, nav.x, nav.z);
        const dme = distanceM * this.M_TO_NM;

        // Course deviation
        let deviation = this.selectedCourse - radial;
        if (deviation > 180) deviation -= 360;
        if (deviation < -180) deviation += 360;

        // TO/FROM flag
        let toFrom = 'OFF';
        const bearingToStation = this.getBearing(aircraftX, aircraftZ, nav.x, nav.z);
        const diff = Math.abs(this.selectedCourse - bearingToStation);
        if (diff < 90 || diff > 270) {
            toFrom = 'TO';
        } else {
            toFrom = 'FROM';
        }

        // Normalize deviation for CDI (-1 to +1, ±10° full scale)
        const cdiDeviation = Math.max(-1, Math.min(1, deviation / 10));

        return { radial, dme, deviation: cdiDeviation, toFrom };
    },

    /**
     * Get ILS deviation data
     */
    getILSData(aircraftX, aircraftY, aircraftZ, aircraftHeading) {
        if (!this.ils.active || !this.selectedNavaid || !this.ils.runway) {
            return { locDeviation: 0, gsDeviation: 0, locVisible: false, gsVisible: false, dme: 0 };
        }

        const runway = this.ils.runway;
        const ilsCourse = this.ils.course;

        // Distance to runway threshold
        const distanceM = this.getDistance(aircraftX, aircraftZ, runway.x, runway.z);
        const dme = distanceM * this.M_TO_NM;

        // Localizer deviation
        const bearingToRunway = this.getBearing(aircraftX, aircraftZ, runway.x, runway.z);
        let locError = ilsCourse - bearingToRunway;
        if (locError > 180) locError -= 360;
        if (locError < -180) locError += 360;

        // Normalize to ±1 (full deflection at ±2.5°)
        const locDeviation = Math.max(-1, Math.min(1, locError / this.ils.localizerWidth));
        const locVisible = dme < 25 && Math.abs(locError) < 35;

        // Glideslope deviation
        const altitudeM = aircraftY * 0.3048;
        const idealAltitude = distanceM * Math.tan(this.ils.glideslope * this.DEG_TO_RAD);
        const gsError = (altitudeM - idealAltitude) / idealAltitude * 100; // percent error

        // Normalize to ±1 (full deflection at ±0.7°)
        const gsDeviation = Math.max(-1, Math.min(1, gsError / 30));
        const gsVisible = dme < 10 && dme > 0.2 && locVisible;

        return { locDeviation, gsDeviation, locVisible, gsVisible, dme };
    },

    /**
     * Update navigation display
     */
    updateDisplay() {
        // CDI needle
        const cdiNeedle = document.getElementById('cdiNeedle');
        if (cdiNeedle && this.vor.active) {
            const vorData = this.getVORData(0, 0, 0); // Will be called with real data
            cdiNeedle.style.transform = `translateX(${vorData.deviation * 40}px)`;
        }

        // TO/FROM indicator
        const toFromEl = document.getElementById('toFromIndicator');
        if (toFromEl) {
            toFromEl.textContent = this.vor.active ? this.vor.toFrom : 'OFF';
        }

        // DME display
        const dmeEl = document.getElementById('dmeDisplay');
        if (dmeEl && this.selectedNavaid) {
            dmeEl.textContent = this.vor.dme.toFixed(1) + ' NM';
        }
    },

    /**
     * Get bearing and distance to next waypoint
     */
    getNextWaypoint(aircraftX, aircraftZ) {
        if (this.flightPlan.length === 0 || this.currentWaypoint >= this.flightPlan.length) {
            return null;
        }

        const wp = this.flightPlan[this.currentWaypoint];
        const bearing = this.getBearing(aircraftX, aircraftZ, wp.x, wp.z);
        const distance = this.getDistance(aircraftX, aircraftZ, wp.x, wp.z) * this.M_TO_NM;

        // Check if we've reached the waypoint
        if (distance < 0.5) { // Within 0.5 NM
            this.currentWaypoint++;
        }

        return { bearing, distance, name: wp.name };
    },

    /**
     * Create flight plan from waypoint names
     */
    createFlightPlan(waypointIds) {
        this.flightPlan = waypointIds.map(id => {
            return this.navaids.find(n => n.id === id) ||
                this.waypoints.find(w => w.id === id);
        }).filter(wp => wp !== undefined);
        this.currentWaypoint = 0;
    },

    /**
     * Get all navaids within range
     */
    getNavaidsInRange(aircraftX, aircraftZ, rangeNM) {
        const rangeM = rangeNM * this.NM_TO_M;
        return this.navaids.filter(nav => {
            const dist = this.getDistance(aircraftX, aircraftZ, nav.x, nav.z);
            return dist <= rangeM;
        });
    }
};

console.log('navigation.js loaded');
