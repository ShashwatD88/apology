/* ==========================================================================
   Apology & Rose Shower Dashboard Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. STATE & CONSTANTS
    // -------------------------------------------------------------
    const state = {
        clicked: false,
        musicPlaying: false,
        roseShowerActive: false
    };

    // DOM Elements
    const ambientCanvas = document.getElementById("ambient-canvas");
    const ctx = ambientCanvas.getContext("2d");
    
    const heartWrapper = document.getElementById("heart-wrapper");
    const heartTriggerBtn = document.getElementById("heart-trigger-btn");
    const apologyCard = document.getElementById("apology-card");
    const apologyMessageElement = document.getElementById("apology-message");
    const musicToggleBtn = document.getElementById("music-toggle-btn");

    // -------------------------------------------------------------
    // 2. CANVAS & PARTICLE ENGINE
    // -------------------------------------------------------------
    let particles = [];
    let ambientHearts = [];

    // Resize canvas
    function resizeCanvas() {
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle Classes
    class FallingRose {
        constructor(x, y, isBurst = false) {
            this.x = x;
            this.y = y;
            
            // Choose emoji with 80% roses, 10% cherry blossoms (as petals), 10% red hearts
            const rand = Math.random();
            if (rand < 0.75) {
                this.char = '🌹';
            } else if (rand < 0.9) {
                this.char = '🌸';
            } else {
                this.char = '❤️';
            }

            this.size = Math.random() * 12 + 18; // font size 18px to 30px
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.03;
            
            // Sway physics
            this.swayAngle = Math.random() * Math.PI * 2;
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.swayWidth = Math.random() * 1.5 + 0.5;

            if (isBurst) {
                // Explode in random directions
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 6 + 2;
                this.speedX = Math.cos(angle) * speed;
                this.speedY = Math.sin(angle) * speed - 2;
                this.gravity = 0.12;
                this.drag = 0.97;
                this.opacity = 1.0;
                this.fadeSpeed = Math.random() * 0.008 + 0.006;
            } else {
                // Gentle drift down from top (increased speed)
                this.speedX = (Math.random() - 0.5) * 1.2;
                this.speedY = Math.random() * 2.0 + 2.8;
                this.gravity = 0.0;
                this.drag = 1.0;
                this.opacity = Math.random() * 0.3 + 0.7; // 0.7 to 1.0 opacity
                this.fadeSpeed = 0.0; // Don't fade until near bottom
            }
        }

        update() {
            if (this.gravity > 0) {
                // Burst physics
                this.speedX *= this.drag;
                this.speedY *= this.drag;
                this.speedY += this.gravity;
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= this.fadeSpeed;
            } else {
                // Gentle falling rain physics + horizontal leaf sway
                this.swayAngle += this.swaySpeed;
                this.x += this.speedX + Math.sin(this.swayAngle) * this.swayWidth * 0.5;
                this.y += this.speedY;
                this.rotation += this.rotationSpeed;
                
                // Fade out when approaching bottom of screen
                if (this.y > ambientCanvas.height - 100) {
                    this.opacity -= 0.01;
                }
            }
            
            this.rotation += this.rotationSpeed;
        }

        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.font = `${this.size}px Outfit`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.char, 0, 0);
            ctx.restore();
        }
    }

    class AmbientHeart {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * ambientCanvas.width;
            this.y = initial ? Math.random() * ambientCanvas.height : ambientCanvas.height + 40;
            this.size = Math.random() * 12 + 6;
            this.speedY = -(Math.random() * 1.0 + 0.3);
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.35 + 0.1;
            this.rotation = Math.random() * 0.2 - 0.1;
            
            // Soft romantic gradient tones
            const colors = ['var(--color-accent-pink)', 'var(--color-accent-purple)', 'rgba(255, 51, 102, 0.4)'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.y < 50) {
                this.opacity -= 0.005;
            }
            
            if (this.y < -30 || this.opacity <= 0) {
                this.reset(false);
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            
            // Draw standard heart curves
            ctx.beginPath();
            const d = this.size;
            ctx.moveTo(0, -d / 2);
            ctx.bezierCurveTo(d / 2, -d, d, -d / 3, 0, d);
            ctx.bezierCurveTo(-d, -d / 3, -d / 2, -d, 0, -d / 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Populate ambient hearts initially
    for (let i = 0; i < 30; i++) {
        ambientHearts.push(new AmbientHeart());
    }

    // Spawn Rose Explosion Burst
    function spawnRoseBurst(x, y, count = 80) {
        for (let i = 0; i < count; i++) {
            particles.push(new FallingRose(x, y, true));
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

        // 1. Draw & update ambient drifting background hearts
        ambientHearts.forEach(heart => {
            heart.update();
            heart.draw();
        });

        // 2. Continuous Spawning of Roses
        if (state.roseShowerActive) {
            // Spawn new roses more frequently
            if (Math.random() < 0.45) {
                particles.push(new FallingRose(Math.random() * ambientCanvas.width, -30, false));
            }
        }

        // 3. Draw & update active roses/bursts
        particles = particles.filter(p => p.y < ambientCanvas.height + 40 && p.opacity > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }
    animate();

    // -------------------------------------------------------------
    // 3. SYNTHESIZED ROMANTIC MUSIC (WEB AUDIO API)
    // -------------------------------------------------------------
    let audioCtx = null;
    let synthIntervalId = null;

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playSynthLoop() {
        if (!audioCtx) initAudio();
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Progression: Cmaj9 -> Am9 -> Fmaj9 -> G11
        const chordRoots = [
            [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
            [220.00, 261.63, 329.63, 392.00, 440.00], // Am9
            [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
            [196.00, 246.94, 293.66, 349.23, 392.00]  // G11
        ];

        let index = 0;

        function playChord() {
            if (!state.musicPlaying) return;
            const now = audioCtx.currentTime;
            const chord = chordRoots[index];

            chord.forEach((freq, noteIndex) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + noteIndex * 0.12);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);

                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.04, now + noteIndex * 0.12 + 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

                osc.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start(now + noteIndex * 0.12);
                osc.stop(now + 3.3);
            });

            index = (index + 1) % chordRoots.length;
        }

        playChord();
        synthIntervalId = setInterval(playChord, 3500);
    }

    function stopSynthLoop() {
        if (synthIntervalId) {
            clearInterval(synthIntervalId);
            synthIntervalId = null;
        }
    }

    function toggleMusic() {
        if (state.musicPlaying) {
            stopSynthLoop();
            state.musicPlaying = false;
            musicToggleBtn.classList.remove("playing");
            document.querySelector(".play-icon").classList.remove("hidden");
            document.querySelector(".pause-icon").classList.add("hidden");
        } else {
            state.musicPlaying = true;
            playSynthLoop();
            musicToggleBtn.classList.add("playing");
            document.querySelector(".play-icon").classList.add("hidden");
            document.querySelector(".pause-icon").classList.remove("hidden");
        }
    }

    musicToggleBtn.addEventListener("click", toggleMusic);

    // -------------------------------------------------------------
    // 4. TIMELINE FLOW & TYPING EFFECT
    // -------------------------------------------------------------
    heartTriggerBtn.addEventListener("click", () => {
        if (state.clicked) return;
        state.clicked = true;

        // Sound init
        setTimeout(() => {
            toggleMusic();
        }, 100);

        // Spawn massive burst of roses/hearts from center of trigger
        const rect = heartTriggerBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        spawnRoseBurst(centerX, centerY, 120);

        // Enable continuous shower of roses
        state.roseShowerActive = true;

        // Hide heart wrapper smoothly
        heartWrapper.style.transform = "scale(0.5)";
        heartWrapper.style.opacity = "0";
        heartWrapper.style.pointerEvents = "none";
        
        setTimeout(() => {
            heartWrapper.classList.add("hidden");
            
            // Show apology card
            apologyCard.classList.remove("hidden");
            musicToggleBtn.classList.remove("hidden"); // Reveal music toggle button
            
            // Start message typing
            startMessageTyping();
        }, 1000);
    });

    function startMessageTyping() {
        // EXACT MESSAGE REQUIRED BY USER
        const fullMessage = "very sorry mabbi,i am going to be mummas good boy. Hate uhh go-goo-ma ❤";
        
        apologyMessageElement.textContent = fullMessage;
        apologyMessageElement.classList.add("visible");
        
        // Pop a celebratory mini burst of roses immediately
        const rect = apologyCard.getBoundingClientRect();
        spawnRoseBurst(rect.left + rect.width / 2, rect.top, 40);
    }
});
