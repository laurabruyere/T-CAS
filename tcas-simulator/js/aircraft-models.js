// ===== AIRCRAFT-MODELS.JS - Procedural 3D Aircraft Models =====
// Creates detailed aircraft meshes based on mscsim dimensions

const AircraftModels = {
    /**
     * Create a Cessna 172 model
     */
    createC172(color1, color2) {
        const group = new THREE.Group();

        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({
            color: color1 || 0xf5f5f5,
            metalness: 0.2,
            roughness: 0.5
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: color2 || 0x1a5276,
            metalness: 0.3,
            roughness: 0.4
        });
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            metalness: 0.2
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.6,
            metalness: 0.9
        });
        const blackMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.8
        });

        // Fuselage - tapered cylinder
        const fuselageGeo = new THREE.CylinderGeometry(0.6, 0.6, 6.5, 12);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage);

        // Nose cone
        const noseGeo = new THREE.ConeGeometry(0.6, 1.5, 12);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = 4;
        group.add(nose);

        // Cockpit glass
        const cockpitGeo = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
        cockpit.scale.set(1.1, 0.6, 1.5);
        cockpit.rotation.x = -Math.PI / 2;
        cockpit.position.set(0, 0.35, 1);
        group.add(cockpit);

        // Main wing - high wing configuration
        const wingGeo = new THREE.BoxGeometry(11, 0.12, 1.3);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.position.set(0, 0.5, 0);
        group.add(wing);

        // Wing stripes
        const stripeGeo = new THREE.BoxGeometry(11.05, 0.05, 0.15);
        const stripe1 = new THREE.Mesh(stripeGeo, accentMat);
        stripe1.position.set(0, 0.52, -0.4);
        group.add(stripe1);
        const stripe2 = new THREE.Mesh(stripeGeo, accentMat);
        stripe2.position.set(0, 0.52, 0.4);
        group.add(stripe2);

        // Wing struts
        for (let side of [-1, 1]) {
            const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
            const strut = new THREE.Mesh(strutGeo, blackMat);
            strut.position.set(side * 1.5, 0, 0.5);
            strut.rotation.z = side * 0.3;
            group.add(strut);
        }

        // Horizontal stabilizer
        const hstabGeo = new THREE.BoxGeometry(3.3, 0.08, 0.9);
        const hstab = new THREE.Mesh(hstabGeo, bodyMat);
        hstab.position.set(0, 0.15, -3.5);
        group.add(hstab);

        // Vertical stabilizer
        const vstabGeo = new THREE.BoxGeometry(0.08, 1.8, 1.2);
        const vstab = new THREE.Mesh(vstabGeo, redMat);
        vstab.position.set(0, 0.95, -3.2);
        group.add(vstab);

        // Tail cone
        const tailGeo = new THREE.ConeGeometry(0.55, 1, 12);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = Math.PI / 2;
        tail.position.z = -3.8;
        group.add(tail);

        // Engine cowling
        const cowlGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.8, 12);
        const cowl = new THREE.Mesh(cowlGeo, blackMat);
        cowl.rotation.x = Math.PI / 2;
        cowl.position.z = 4.2;
        group.add(cowl);

        // Propeller
        const propGroup = new THREE.Group();
        for (let i = 0; i < 2; i++) {
            const bladeGeo = new THREE.BoxGeometry(0.15, 1.7, 0.03);
            const blade = new THREE.Mesh(bladeGeo, blackMat);
            blade.rotation.z = (i * Math.PI / 2);
            propGroup.add(blade);
        }
        propGroup.position.z = 4.65;
        group.add(propGroup);
        group.userData.propeller = propGroup;

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12);
        const wheelL = new THREE.Mesh(wheelGeo, blackMat);
        wheelL.rotation.z = Math.PI / 2;
        wheelL.position.set(-1, -0.8, 0.5);
        group.add(wheelL);
        const wheelR = new THREE.Mesh(wheelGeo, blackMat);
        wheelR.rotation.z = Math.PI / 2;
        wheelR.position.set(1, -0.8, 0.5);
        group.add(wheelR);
        const wheelN = new THREE.Mesh(wheelGeo, blackMat);
        wheelN.rotation.z = Math.PI / 2;
        wheelN.position.set(0, -0.7, 3);
        wheelN.scale.set(0.7, 1, 0.7);
        group.add(wheelN);

        // Landing gear struts
        const gearGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6);
        const gearL = new THREE.Mesh(gearGeo, blackMat);
        gearL.position.set(-1, -0.5, 0.5);
        group.add(gearL);
        const gearR = new THREE.Mesh(gearGeo, blackMat);
        gearR.position.set(1, -0.5, 0.5);
        group.add(gearR);

        group.scale.set(0.35, 0.35, 0.35);
        return group;
    },

    /**
     * Create an F-16 model
     */
    createF16(color1, color2) {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: color1 || 0x4a5568,
            metalness: 0.7,
            roughness: 0.3
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: color2 || 0x2d3748,
            metalness: 0.6,
            roughness: 0.3
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.7,
            metalness: 0.9
        });
        const engineMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2
        });

        // Fuselage - sleek fighter shape
        const fuselageGeo = new THREE.CylinderGeometry(0.8, 1.0, 12, 16);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage);

        // Nose - pointed
        const noseGeo = new THREE.ConeGeometry(0.8, 4, 16);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = 8;
        group.add(nose);

        // Radome (nose tip)
        const radomeGeo = new THREE.SphereGeometry(0.3, 12, 8);
        const radome = new THREE.Mesh(radomeGeo, accentMat);
        radome.position.z = 10;
        group.add(radome);

        // Canopy - bubble style
        const canopyGeo = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.scale.set(0.9, 0.7, 2);
        canopy.rotation.x = -Math.PI / 2;
        canopy.position.set(0, 0.7, 4);
        group.add(canopy);

        // Delta wing
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4.5, -3);
        wingShape.lineTo(4.5, -4);
        wingShape.lineTo(0, -1);
        wingShape.lineTo(-4.5, -4);
        wingShape.lineTo(-4.5, -3);
        wingShape.closePath();

        const wingExtrudeSettings = { depth: 0.1, bevelEnabled: false };
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.rotation.x = Math.PI / 2;
        wing.position.set(0, -0.2, -1);
        group.add(wing);

        // Wing tips - angled
        for (let side of [-1, 1]) {
            const tipGeo = new THREE.BoxGeometry(0.6, 0.08, 0.4);
            const tip = new THREE.Mesh(tipGeo, accentMat);
            tip.position.set(side * 4.2, -0.2, -3);
            tip.rotation.z = side * 0.3;
            group.add(tip);
        }

        // Horizontal stabilizers (small, rear)
        for (let side of [-1, 1]) {
            const hstabGeo = new THREE.BoxGeometry(2.5, 0.06, 1.2);
            const hstab = new THREE.Mesh(hstabGeo, bodyMat);
            hstab.position.set(side * 2, 0.2, -6);
            group.add(hstab);
        }

        // Vertical stabilizer (large, single)
        const vstabGeo = new THREE.BoxGeometry(0.08, 3.5, 2.5);
        const vstab = new THREE.Mesh(vstabGeo, bodyMat);
        vstab.position.set(0, 1.8, -5.5);
        group.add(vstab);

        // Ventral fins
        for (let side of [-1, 1]) {
            const vfinGeo = new THREE.BoxGeometry(0.4, 0.8, 0.8);
            const vfin = new THREE.Mesh(vfinGeo, accentMat);
            vfin.position.set(side * 0.5, -1.0, -5);
            vfin.rotation.z = side * 0.4;
            group.add(vfin);
        }

        // Engine intake (under fuselage)
        const intakeGeo = new THREE.BoxGeometry(1.2, 0.8, 3);
        const intake = new THREE.Mesh(intakeGeo, accentMat);
        intake.position.set(0, -0.9, 2);
        group.add(intake);

        // Engine nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.7, 0.85, 1.5, 16);
        const nozzle = new THREE.Mesh(nozzleGeo, engineMat);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.z = -6.5;
        group.add(nozzle);

        // Afterburner glow (subtle ring)
        const abGeo = new THREE.RingGeometry(0.4, 0.65, 16);
        const abMat = new THREE.MeshBasicMaterial({ color: 0xff4500, side: THREE.DoubleSide });
        const ab = new THREE.Mesh(abGeo, abMat);
        ab.position.z = -7.2;
        ab.visible = false;
        group.add(ab);
        group.userData.afterburner = ab;

        group.scale.set(0.25, 0.25, 0.25);
        return group;
    },

    /**
     * Create a C-130 model
     */
    createC130(color1, color2) {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: color1 || 0x4b5320,
            metalness: 0.3,
            roughness: 0.6
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: color2 || 0x3d3d3d,
            metalness: 0.4,
            roughness: 0.5
        });
        const propMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.7
        });

        // Fuselage - large cargo aircraft
        const fuselageGeo = new THREE.CylinderGeometry(2.5, 2.5, 20, 16);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage);

        // Nose - rounded
        const noseGeo = new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = 10;
        group.add(nose);

        // Cockpit windows
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.9,
            roughness: 0.1
        });
        for (let side of [-1, 1]) {
            const windowGeo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
            const window = new THREE.Mesh(windowGeo, windowMat);
            window.position.set(side * 1.2, 1.5, 9.5);
            window.rotation.y = side * 0.2;
            group.add(window);
        }

        // High wing
        const wingGeo = new THREE.BoxGeometry(40, 0.4, 4);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.position.set(0, 2.3, 0);
        group.add(wing);

        // Engine nacelles and props (4 engines)
        const enginePositions = [-14, -6, 6, 14];
        enginePositions.forEach(x => {
            // Nacelle
            const nacelleGeo = new THREE.CylinderGeometry(0.8, 0.9, 4, 12);
            const nacelle = new THREE.Mesh(nacelleGeo, accentMat);
            nacelle.rotation.x = Math.PI / 2;
            nacelle.position.set(x, 1.5, 1);
            group.add(nacelle);

            // Prop hub
            const hubGeo = new THREE.SphereGeometry(0.4, 12, 8);
            const hub = new THREE.Mesh(hubGeo, propMat);
            hub.position.set(x, 1.5, 3.2);
            group.add(hub);

            // Propeller blades (4 blade)
            const propGroup = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const bladeGeo = new THREE.BoxGeometry(0.2, 3.5, 0.06);
                const blade = new THREE.Mesh(bladeGeo, propMat);
                blade.rotation.z = (i * Math.PI / 2);
                propGroup.add(blade);
            }
            propGroup.position.set(x, 1.5, 3.5);
            group.add(propGroup);
        });

        // Tail section - T-tail
        const tailGeo = new THREE.ConeGeometry(2.2, 4, 16);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = Math.PI / 2;
        tail.position.z = -12;
        group.add(tail);

        // Vertical stabilizer
        const vstabGeo = new THREE.BoxGeometry(0.3, 8, 5);
        const vstab = new THREE.Mesh(vstabGeo, bodyMat);
        vstab.position.set(0, 6, -11);
        group.add(vstab);

        // Horizontal stabilizer (on top of vertical)
        const hstabGeo = new THREE.BoxGeometry(16, 0.25, 3);
        const hstab = new THREE.Mesh(hstabGeo, bodyMat);
        hstab.position.set(0, 9.8, -12);
        group.add(hstab);

        // Rear cargo ramp
        const rampGeo = new THREE.BoxGeometry(3.5, 0.15, 4);
        const ramp = new THREE.Mesh(rampGeo, accentMat);
        ramp.position.set(0, -2.2, -12);
        ramp.rotation.x = 0.3;
        group.add(ramp);

        // Landing gear (main and nose)
        const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);

        // Main gear pods
        for (let side of [-1, 1]) {
            const podGeo = new THREE.BoxGeometry(1.5, 1.5, 3);
            const pod = new THREE.Mesh(podGeo, accentMat);
            pod.position.set(side * 2, -2.8, -2);
            group.add(pod);

            // Wheels (4 per side)
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const wheel = new THREE.Mesh(wheelGeo, propMat);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(side * (1.5 + j * 1.2), -3.5, -2 + i * 1.5 - 0.75);
                    group.add(wheel);
                }
            }
        }

        // Nose gear
        const noseWheel = new THREE.Mesh(wheelGeo, propMat);
        noseWheel.rotation.z = Math.PI / 2;
        noseWheel.scale.set(0.8, 1, 0.8);
        noseWheel.position.set(0, -3.2, 7);
        group.add(noseWheel);

        group.scale.set(0.1, 0.1, 0.1);
        return group;
    },

    /**
     * Create aircraft based on type
     */
    create(type, color1, color2) {
        switch (type) {
            case 'f16': return this.createF16(color1, color2);
            case 'c130': return this.createC130(color1, color2);
            case 'c172':
            default: return this.createC172(color1, color2);
        }
    },

    /**
     * Create a simple traffic aircraft (less detailed)
     */
    createTraffic(threatLevel = 'none') {
        const colors = {
            none: [0x3498db, 0x2874a6],
            prox: [0x9b59b6, 0x6c3483],
            TA: [0xffa500, 0xcc8400],
            RA: [0xff3333, 0xcc0000]
        };
        const [c1, c2] = colors[threatLevel] || colors.none;
        return this.createC172(c1, c2);
    }
};

console.log('aircraft-models.js loaded');
