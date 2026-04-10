/**
 * 陈劭哲 Portfolio - WebGL Effects & Interactions
 * Cosmic Neural Network Theme
 */

// ============================================
// Global State
// ============================================
const state = {
    isLoaded: false,
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastClickX: 0,
    lastClickY: 0,
    particles: [],
    magneticLines: [],
    ripples: []
};

// ============================================
// Utility Functions
// ============================================
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ============================================
// WebGL Fluid Background
// ============================================
class FluidBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.flowField = [];
        this.time = 0;
        this.colors = [
            { r: 107, g: 33, b: 168 },   // Purple
            { r: 124, g: 58, b: 237 },   // Violet
            { r: 236, g: 72, b: 153 },   // Pink
            { r: 6, g: 182, b: 212 },    // Cyan
            { r: 59, g: 130, b: 246 }    // Blue
        ];
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cols = Math.ceil(this.canvas.width / 20);
        this.rows = Math.ceil(this.canvas.height / 20);
    }

    createParticles() {
        const numParticles = Math.floor((this.canvas.width * this.canvas.height) / 8000);
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                size: Math.random() * 3 + 1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                alpha: Math.random() * 0.5 + 0.2,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    updateFlowField() {
        this.time += 0.003;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const angle = (Math.sin(x * 0.05 + this.time) + Math.cos(y * 0.05 + this.time)) * Math.PI;
                this.flowField[y * this.cols + x] = angle;
            }
        }
    }

    updateParticles() {
        const centerX = state.mouseX;
        const centerY = state.mouseY;
        const mouseRadius = 200;

        this.particles.forEach(p => {
            // Flow field influence
            const col = Math.floor(p.x / 20);
            const row = Math.floor(p.y / 20);
            const idx = row * this.cols + col;

            if (this.flowField[idx] !== undefined) {
                p.vx += Math.cos(this.flowField[idx]) * 0.1;
                p.vy += Math.sin(this.flowField[idx]) * 0.1;
            }

            // Mouse interaction - attraction/repulsion
            const dist = distance(p.x, p.y, centerX, centerY);
            if (dist < mouseRadius && dist > 0) {
                const force = (mouseRadius - dist) / mouseRadius;
                const angle = Math.atan2(p.y - centerY, p.x - centerX);

                // Repel when not dragging, attract when dragging
                const multiplier = state.isDragging ? -0.5 : 0.3;
                p.vx += Math.cos(angle) * force * multiplier;
                p.vy += Math.sin(angle) * force * multiplier;
            }

            // Dragging creates vortex
            if (state.isDragging) {
                const dist = distance(p.x, p.y, state.dragStartX, state.dragStartY);
                if (dist < 300 && dist > 0) {
                    const angle = Math.atan2(p.y - state.dragStartY, p.x - state.dragStartX);
                    const vortexStrength = (300 - dist) / 300 * 0.8;
                    p.vx += Math.cos(angle + Math.PI / 2) * vortexStrength;
                    p.vy += Math.sin(angle + Math.PI / 2) * vortexStrength;
                }
            }

            // Apply velocity with damping
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
        });
    }

    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw particles
        this.particles.forEach(p => {
            const { r, g, b } = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
            this.ctx.fill();

            // Draw connections (nebula effect)
            this.particles.forEach(p2 => {
                const dist = distance(p.x, p.y, p2.x, p2.y);
                if (dist < 60) {
                    const alpha = (1 - dist / 60) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    this.ctx.stroke();
                }
            });
        });

        // Draw nebula clouds
        this.drawNebula();
    }

    drawNebula() {
        const time = this.time;
        for (let i = 0; i < 3; i++) {
            const x = (Math.sin(time * 0.5 + i * 2) * 0.5 + 0.5) * this.canvas.width;
            const y = (Math.cos(time * 0.3 + i * 1.5) * 0.5 + 0.5) * this.canvas.height;
            const radius = 200 + Math.sin(time + i) * 50;

            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            const color = this.colors[(i + 2) % this.colors.length];
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.03)`);
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    animate() {
        this.updateFlowField();
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.animate();
    }
}

// ============================================
// Particle Text Effect
// ============================================
class ParticleText {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.targetParticles = [];
        this.text = '陈劭哲';
        this.isAnimating = true;
        this.init();
    }

    init() {
        this.resize();
        this.createTextParticles();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = 200;
        this.canvas.height = 200;
    }

    createTextParticles() {
        // Create target positions forming the text
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 60px "Orbitron", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let y = 0; y < this.canvas.height; y += 4) {
            for (let x = 0; x < this.canvas.width; x += 4) {
                const alpha = data[(y * this.canvas.width + x) * 4];
                if (alpha > 128) {
                    this.targetParticles.push({
                        targetX: x,
                        targetY: y,
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        size: Math.random() * 2 + 1,
                        alpha: Math.random() * 0.8 + 0.2
                    });
                }
            }
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    update() {
        this.targetParticles.forEach(p => {
            p.x = lerp(p.x, p.targetX, 0.03);
            p.y = lerp(p.y, p.targetY, 0.03);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#ec4899');

        this.targetParticles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    animate() {
        if (state.isLoaded) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.animate();
    }
}

// ============================================
// Magnetic Field Lines
// ============================================
class MagneticField {
    constructor(container) {
        this.container = container;
        this.lines = [];
        this.init();
    }

    init() {
        this.createLines();
    }

    createLines() {
        const numLines = 20;
        for (let i = 0; i < numLines; i++) {
            this.lines.push({
                angle: (Math.PI * 2 * i) / numLines,
                speed: randomRange(0.5, 1.5),
                radius: randomRange(100, 300),
                offset: randomRange(0, Math.PI * 2)
            });
        }
    }

    draw() {
        const centerX = state.mouseX;
        const centerY = state.mouseY;

        this.container.innerHTML = '';

        this.lines.forEach(line => {
            const points = [];
            const segments = 50;

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const radius = line.radius * (1 + Math.sin(t * Math.PI * 4 + line.offset + state.mouseX * 0.01) * 0.2);
                const angle = line.angle + t * Math.PI * 0.5;

                const x = centerX + Math.cos(angle + state.mouseX * 0.002) * radius;
                const y = centerY + Math.sin(angle + state.mouseY * 0.002) * radius;
                points.push({ x, y });
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = `M ${points[0].x} ${points[0].y}`;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const cpX = (prev.x + curr.x) / 2;
                const cpY = (prev.y + curr.y) / 2;
                d += ` Q ${prev.x} ${prev.y} ${cpX} ${cpY}`;
            }

            path.setAttribute('d', d);
            path.setAttribute('stroke', 'rgba(124, 58, 237, 0.15)');
            path.setAttribute('stroke-width', '1');
            path.setAttribute('fill', 'none');

            this.container.appendChild(path);
        });
    }

    update() {
        this.draw();
        requestAnimationFrame(() => this.update());
    }

    start() {
        this.update();
    }
}

// ============================================
// Ripple Effect
// ============================================
class RippleEffect {
    constructor(container) {
        this.container = container;
    }

    create(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        this.container.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
}

// ============================================
// Typing Animation
// ============================================
class TypingAnimation {
    constructor(element, texts, speed = 100) {
        this.element = element;
        this.texts = texts;
        this.speed = speed;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.init();
    }

    init() {
        this.type();
    }

    type() {
        const currentText = this.texts[this.currentTextIndex];

        if (this.isDeleting) {
            this.element.textContent = currentText.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;
        } else {
            this.element.textContent = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
        }

        let delay = this.isDeleting ? 50 : this.speed;

        if (!this.isDeleting && this.currentCharIndex === currentText.length) {
            delay = 2000;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            delay = 500;
        }

        setTimeout(() => this.type(), delay);
    }
}

// ============================================
// Scroll Animations
// ============================================
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');

                        // Animate skill bars
                        if (entry.target.classList.contains('skills')) {
                            this.animateSkillBars();
                        }
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.section').forEach(section => {
            this.observer.observe(section);
        });
    }

    animateSkillBars() {
        document.querySelectorAll('.skill-fill').forEach(bar => {
            setTimeout(() => {
                bar.classList.add('animated');
            }, Math.random() * 300);
        });
    }
}

// ============================================
// Navigation
// ============================================
class Navigation {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.section');
        this.init();
    }

    init() {
        // Click navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('href').substring(1);
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Scroll spy
        window.addEventListener('scroll', () => this.updateActiveNav());
    }

    updateActiveNav() {
        let current = '';
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 300) {
                current = section.getAttribute('id');
            }
        });

        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').substring(1) === current) {
                item.classList.add('active');
            }
        });
    }
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader after page load
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('main-content').classList.add('visible');
        state.isLoaded = true;
    }, 1500);

    // Initialize WebGL background
    const webglCanvas = document.getElementById('webgl-canvas');
    const fluidBg = new FluidBackground(webglCanvas);
    fluidBg.start();

    // Initialize particle text
    const logoCanvas = document.getElementById('logo-canvas');
    const particleText = new ParticleText(logoCanvas);
    particleText.start();

    // Initialize magnetic field
    const magneticContainer = document.getElementById('magnetic-field');
    const magneticField = new MagneticField(magneticContainer);
    magneticField.start();

    // Initialize ripple effect
    const rippleContainer = document.getElementById('ripples-container');
    const rippleEffect = new RippleEffect(rippleContainer);

    // Typing animation
    const typingElement = document.getElementById('typing-text');
    const typingAnimation = new TypingAnimation(typingElement, [
        '大模型算法工程师',
        '扩散模型加速',
        'Agent架构开发',
        'RAG&Agent专家'
    ]);

    // Scroll animations
    new ScrollAnimations();

    // Navigation
    new Navigation();

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
    });

    // Drag detection for vortex effect
    document.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        state.isDragging = false;
    });

    // Click ripple effect
    document.addEventListener('click', (e) => {
        // Don't create ripple if clicking on nav or links
        if (e.target.closest('.floating-nav') || e.target.closest('a')) return;
        rippleEffect.create(e.clientX, e.clientY);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - scrolled / 700;
        }
    });
});

// Prevent context menu on right click (for better drag experience)
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#webgl-canvas')) {
        e.preventDefault();
    }
});