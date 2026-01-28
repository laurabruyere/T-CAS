// ===== AUDIO.JS - Sound Effects System =====
// TCAS audio alerts and engine sounds

const Audio = {
    // Audio context
    context: null,
    masterGain: null,

    // Sound sources
    sounds: {},

    // Engine sound oscillator
    engineOsc: null,
    engineGain: null,

    // State
    enabled: true,
    volume: 0.7,

    /**
     * Initialize audio system
     */
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.context.destination);

            // Create TCAS alert sounds
            this.createTCASSounds();

            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
        return this;
    },

    /**
     * Resume audio context (required for user interaction)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    /**
     * Create TCAS alert tones
     */
    createTCASSounds() {
        // We'll use oscillators to create synthetic voice-like sounds
        // In a real implementation, you'd load audio files
    },

    /**
     * Play a tone
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return;

        this.resume();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    },

    /**
     * Play TCAS Traffic Advisory alert
     */
    playTrafficAlert() {
        if (!this.enabled) return;

        // Two-tone alert pattern
        this.playTone(600, 0.15);
        setTimeout(() => this.playTone(800, 0.15), 200);
        setTimeout(() => this.playTone(600, 0.15), 500);
        setTimeout(() => this.playTone(800, 0.15), 700);

        // Speak "Traffic, Traffic" using speech synthesis
        this.speak('Traffic, Traffic');
    },

    /**
     * Play TCAS Climb alert
     */
    playClimbAlert() {
        if (!this.enabled) return;

        // Ascending tone pattern
        this.playTone(400, 0.1);
        setTimeout(() => this.playTone(500, 0.1), 120);
        setTimeout(() => this.playTone(600, 0.1), 240);
        setTimeout(() => this.playTone(700, 0.2), 360);

        this.speak('Climb, Climb');
    },

    /**
     * Play TCAS Descend alert
     */
    playDescendAlert() {
        if (!this.enabled) return;

        // Descending tone pattern
        this.playTone(700, 0.1);
        setTimeout(() => this.playTone(600, 0.1), 120);
        setTimeout(() => this.playTone(500, 0.1), 240);
        setTimeout(() => this.playTone(400, 0.2), 360);

        this.speak('Descend, Descend');
    },

    /**
     * Play clear of conflict
     */
    playClearOfConflict() {
        if (!this.enabled) return;

        this.playTone(500, 0.3);
        this.speak('Clear of Conflict');
    },

    /**
     * Play stall warning
     */
    playStallWarning() {
        if (!this.enabled) return;

        // Harsh repeating tone
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(1000, 0.1, 'sawtooth'), i * 150);
        }
    },

    /**
     * Play gear warning
     */
    playGearWarning() {
        if (!this.enabled) return;
        this.playTone(400, 0.5, 'square');
    },

    /**
     * Play autopilot disconnect
     */
    playAPDisconnect() {
        if (!this.enabled) return;

        this.playTone(800, 0.1);
        setTimeout(() => this.playTone(600, 0.2), 150);
    },

    /**
     * Play altitude alert (approaching selected altitude)
     */
    playAltitudeAlert() {
        if (!this.enabled) return;

        this.playTone(1200, 0.1);
        setTimeout(() => this.playTone(1200, 0.1), 200);
    },

    /**
     * Use speech synthesis for voice alerts
     */
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 0.8;
            utterance.volume = this.volume;
            speechSynthesis.speak(utterance);
        }
    },

    /**
     * Start engine sound
     */
    startEngineSound() {
        if (!this.enabled || !this.context || this.engineOsc) return;

        this.resume();

        // Create a more complex engine sound using multiple oscillators
        this.engineOsc = this.context.createOscillator();
        this.engineGain = this.context.createGain();

        // Low frequency rumble
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 80;

        // Very quiet by default
        this.engineGain.gain.value = 0.02;

        // Add some filtering
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineOsc.start();
    },

    /**
     * Update engine sound based on throttle
     */
    updateEngineSound(throttle, rpm) {
        if (!this.engineOsc || !this.engineGain) return;

        // Map throttle to frequency (80-200 Hz)
        const freq = 80 + throttle * 120;
        this.engineOsc.frequency.setTargetAtTime(freq, this.context.currentTime, 0.1);

        // Map throttle to volume
        const vol = 0.02 + throttle * 0.05;
        this.engineGain.gain.setTargetAtTime(vol, this.context.currentTime, 0.1);
    },

    /**
     * Stop engine sound
     */
    stopEngineSound() {
        if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc = null;
            this.engineGain = null;
        }
    },

    /**
     * Set master volume
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    },

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopEngineSound();
        }
        return this.enabled;
    },

    /**
     * Play button click sound
     */
    playClick() {
        if (!this.enabled) return;
        this.playTone(1000, 0.05);
    }
};

console.log('audio.js loaded');
