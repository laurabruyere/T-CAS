// ===== AIRCRAFT.JS - Aircraft Class and Flight Physics =====

class Aircraft {
    constructor(scene, isPlayer = false) {
        this.scene = scene;
        this.isPlayer = isPlayer;

        // Position and movement
        this.position = new THREE.Vector3(0, 10000, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { pitch: 0, roll: 0, yaw: 0 };

        // Flight parameters
        this.throttle = 0.5;
        this.speed = 120; // m/s (~233 knots)
        this.verticalSpeed = 0; // m/s
        this.heading = 0; // degrees

        // Control inputs
        this.pitchInput = 0;
        this.rollInput = 0;
        this.yawInput = 0;

        // Create 3D model
        this.createMesh();

        // TCAS system (only for player)
        if (isPlayer) {
            this.tcas = new TCAS(this);
        }
    }

    createMesh() {
        const group = new THREE.Group();

        // Fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(2, 2, 20, 16);
        const fuselageMaterial = new THREE.MeshStandardMaterial({
            color: this.isPlayer ? 0x3498db : 0xe74c3c,
            metalness: 0.7,
            roughness: 0.3
        });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        group.add(fuselage);

        // Wings
        const wingGeometry = new THREE.BoxGeometry(50, 0.5, 8);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: this.isPlayer ? 0x2980b9 : 0xc0392b,
            metalness: 0.6,
            roughness: 0.4
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.z = -2;
        wings.castShadow = true;
        group.add(wings);

        // Tail
        const tailGeometry = new THREE.BoxGeometry(0.5, 8, 6);
        const tail = new THREE.Mesh(tailGeometry, wingMaterial);
        tail.position.set(0, 4, -10);
        tail.castShadow = true;
        group.add(tail);

        // Horizontal stabilizer
        const hStabGeometry = new THREE.BoxGeometry(15, 0.5, 4);
        const hStab = new THREE.Mesh(hStabGeometry, wingMaterial);
        hStab.position.set(0, 5, -10);
        hStab.castShadow = true;
        group.add(hStab);

        // Nose
        const noseGeometry = new THREE.ConeGeometry(2, 5, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.8,
            roughness: 0.2
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.rotation.x = Math.PI / 2;
        nose.position.z = 12.5;
        nose.castShadow = true;
        group.add(nose);

        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(2.5, 16, 16);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            transparent: true,
            opacity: 0.7,
            metalness: 0.9,
            roughness: 0.1
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 1.5, 5);
        cockpit.scale.set(1, 0.8, 1.2);
        cockpit.castShadow = true;
        group.add(cockpit);

        this.mesh = group;
        this.scene.add(this.mesh);
        this.updateMeshPosition();
    }

    update(keys = {}) {
        if (this.isPlayer) {
            this.handlePlayerInput(keys);
        } else {
            this.handleAIMovement();
        }

        this.updatePhysics();
        this.updateMeshPosition();

        // Update TCAS if player
        if (this.tcas) {
            // TCAS update is handled in main.js
        }
    }

    handlePlayerInput(keys) {
        const pitchSpeed = 0.02;
        const rollSpeed = 0.03;
        const yawSpeed = 0.015;
        const throttleSpeed = 0.01;

        // Pitch (Z/S)
        if (keys['z']) this.pitchInput += pitchSpeed;
        if (keys['s']) this.pitchInput -= pitchSpeed;

        // Roll (Q/D)
        if (keys['q']) this.rollInput += rollSpeed;
        if (keys['d']) this.rollInput -= rollSpeed;

        // Yaw (A/E)
        if (keys['a']) this.yawInput += yawSpeed;
        if (keys['e']) this.yawInput -= yawSpeed;

        // Throttle (Arrow Up/Down)
        if (keys['arrowup']) this.throttle = Math.min(this.throttle + throttleSpeed, 1.0);
        if (keys['arrowdown']) this.throttle = Math.max(this.throttle - throttleSpeed, 0.0);

        // Apply damping
        this.pitchInput *= 0.85;
        this.rollInput *= 0.85;
        this.yawInput *= 0.85;

        // Update rotations
        this.rotation.pitch += this.pitchInput;
        this.rotation.roll += this.rollInput;
        this.rotation.yaw += this.yawInput;

        // Limit pitch and roll
        this.rotation.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.pitch));
        this.rotation.roll = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.roll));
    }

    handleAIMovement() {
        // Simple AI: fly straight and level
        // This will be overridden by scenario-specific behavior

        // Gradually level out
        this.rotation.pitch *= 0.98;
        this.rotation.roll *= 0.98;
    }

    updatePhysics() {
        // Calculate forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(
            this.rotation.pitch,
            this.rotation.yaw,
            this.rotation.roll,
            'YXZ'
        ));
        forward.applyQuaternion(quaternion);

        // Calculate speed based on throttle
        const targetSpeed = 80 + (this.throttle * 120); // 80-200 m/s
        this.speed += (targetSpeed - this.speed) * 0.02;

        // Update velocity
        this.velocity.copy(forward).multiplyScalar(this.speed);

        // Add gravity
        this.velocity.y -= 9.81 * 0.1; // Reduced gravity for gameplay

        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(0.016)); // ~60fps

        // Ground collision
        if (this.position.y < 100) {
            this.position.y = 100;
            this.velocity.y = Math.max(0, this.velocity.y);
        }

        // Update vertical speed
        this.verticalSpeed = this.velocity.y;

        // Update heading
        this.heading = Math.atan2(forward.x, -forward.z) * 180 / Math.PI;
    }

    updateMeshPosition() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.set(
            this.rotation.pitch,
            this.rotation.yaw,
            this.rotation.roll,
            'YXZ'
        );
    }

    // Set AI flight path
    setFlightPath(waypoints) {
        this.waypoints = waypoints;
        this.currentWaypoint = 0;
    }

    // Follow waypoints (for AI aircraft)
    followWaypoints() {
        if (!this.waypoints || this.waypoints.length === 0) return;

        const target = this.waypoints[this.currentWaypoint];
        const direction = target.clone().sub(this.position).normalize();

        // Simple steering towards waypoint
        const targetYaw = Math.atan2(direction.x, -direction.z);
        const yawDiff = targetYaw - this.rotation.yaw;
        this.rotation.yaw += yawDiff * 0.02;

        // Altitude control
        const altDiff = target.y - this.position.y;
        this.rotation.pitch = Math.max(-0.3, Math.min(0.3, altDiff * 0.0001));

        // Check if reached waypoint
        if (this.position.distanceTo(target) < 500) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
        }
    }

    // Get distance to another aircraft
    distanceTo(otherAircraft) {
        return this.position.distanceTo(otherAircraft.position);
    }

    // Get closure rate with another aircraft
    getClosureRate(otherAircraft) {
        const relativeVelocity = this.velocity.clone().sub(otherAircraft.velocity);
        const direction = otherAircraft.position.clone().sub(this.position).normalize();
        return relativeVelocity.dot(direction);
    }
}

console.log('aircraft.js loaded');
