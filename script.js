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
        // Adjust canvas size based on text length
        const textLength = this.text.length;
        const isEnglish = /^[a-zA-Z]/.test(this.text);
        const baseWidth = isEnglish ? Math.max(200, textLength * 28) : 200;
        this.canvas.width = baseWidth;
        this.canvas.height = 200;
    }

    createTextParticles() {
        // Resize canvas based on text
        this.resize();

        // Create target positions forming the text
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        // Adjust font size for English text
        const isEnglish = /^[a-zA-Z]/.test(this.text);
        const fontSize = isEnglish ? 48 : 60;
        this.ctx.font = `bold ${fontSize}px "Orbitron", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);

        // Clear the target particles array
        this.targetParticles = [];

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

    updateText(newText) {
        this.text = newText;
        this.createTextParticles();

        // Update container width to fit the text
        const container = document.getElementById('logo-container');
        if (container) {
            const isEnglish = /^[a-zA-Z]/.test(newText);
            const baseWidth = isEnglish ? Math.max(200, newText.length * 28) : 200;
            container.style.width = baseWidth + 'px';
        }
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
// Custom Cute Cursor - Pink Arrow with Heart and Trail
// ============================================
class CuteCursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        this.trailContainer = document.getElementById('trail-container');
        this.lastX = 0;
        this.lastY = 0;
        this.init();
    }

    init() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            // Update cursor position
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';

            // Create trail effect
            if (this.lastX !== 0 || this.lastY !== 0) {
                const dist = Math.sqrt(
                    Math.pow(e.clientX - this.lastX, 2) +
                    Math.pow(e.clientY - this.lastY, 2)
                );
                if (dist > 8) {
                    this.createTrail(e.clientX, e.clientY);
                }
            }
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        // Show cursor
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
        });

        // Hide on interactive elements
        const hideOnElements = document.querySelectorAll('a, button, .nav-item, input, textarea');
        hideOnElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.opacity = '0';
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.style.opacity = '1';
            });
        });

        // Initial show
        this.cursor.style.opacity = '1';
    }

    createTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = x + 'px';
        trail.style.top = y + 'px';
        trail.innerHTML = '<div class="trail-dot"></div>';
        this.trailContainer.appendChild(trail);

        // Remove after animation
        setTimeout(() => {
            trail.remove();
        }, 600);
    }
}

// ============================================
// Internationalization (i18n) System
// ============================================
const i18n = {
    currentLang: 'zh',
    translations: {
        en: {
            scroll_down: 'Scroll Down',
            title: 'LLM Algorithm Engineer',
            tag1: 'LLM',
            tag2: 'Diffusion',
            tag3: 'Agent',
            about_title_en: 'About Me',
            about_title_cn: '',
            name: 'Chen Shaozhe',
            job_title: 'LLM Algorithm Engineer',
            age: '22 years old · Male',
            education_title_en: 'Education',
            education_title_cn: '',
            cuhk_name: 'The Chinese University of Hong Kong',
            qs_badge: 'QS Top 50',
            master_degree: 'Master',
            cuhk_major: 'Communication Engineering',
            research_label: 'Research',
            research_content: 'Diffusion Model Acceleration, Agent Architecture, LLM Fine-tuning, Prompt Engineering',
            course1: 'Image Processing & Computer Vision',
            course2: 'Machine Learning & Intelligent Communications',
            course3: 'Stochastic Processes',
            sustech_name: 'Southern University of Science and Technology',
            double_badge: 'Double First-Class',
            bachelor_degree: 'Bachelor',
            sustech_major: 'Microelectronics Science & Technology',
            sustech_course1: 'Deep Learning Chip Design',
            sustech_course2: 'Microprocessor Design',
            sustech_course3: 'Signals & Systems',
            sustech_course4: 'Digital IC Design',
            grad_design_label: 'Graduation Design',
            grad_design_content: 'YOLOv11-based UAV remote sensing dataset for intelligent corn seedling quality assessment in precision agriculture',
            campus_label: 'Campus Life',
            campus_content: 'Student Union President, Youth Marxist Training Program',
            experience_title_en: 'Experience',
            experience_title_cn: '',
            company1_name: 'ShumeiWANWU (Guangzhou) Network Technology',
            position1: 'Image Algorithm Developer',
            exp1_1: 'Built ComfyUI environment on 5090 cluster servers, deployed AI image/video generation workflows based on Flux model',
            exp1_2: 'Self-developed ComfyUI dual-guidance nodes, supporting dual-model step allocation and multi-acceleration strategy integration',
            exp1_3: 'Deployed three strategies in ComfyUI: Teacache step-skipping acceleration, model quantization, kv-cache/SageAttention optimization',
            exp1_4: 'Discovered and fixed Teacache acceleration bug, achieving 40% visually lossless speedup',
            exp1_5: 'Trained style-specific LoRA using Flux model, applied distribution matching distillation for 4x image generation speedup',
            company2_name: 'Huawei Technologies Co., Ltd.',
            position2: 'AI Development Intern',
            exp2_1: 'Completed full CV+NLP deep learning model development based on Huawei MindSpore and Ascend ecosystem',
            exp2_2: 'CV: Deployed LeNet5/ResNet50/GoogleNet models, implemented handwritten digit/object recognition on MNIST/CIFAR datasets',
            exp2_3: 'NLP: Built Seq2Seq model with Attention, implemented Chinese-English bidirectional machine translation',
            exp2_4: 'Completed model training and validation entirely on Huawei Cloud ECS servers',
            projects_title_en: 'Projects',
            projects_title_cn: '',
            project1_title: 'AI Intelligent Travel Planning System',
            project1_type: 'Agent Development',
            project1_desc: 'Designed multi-Agent collaboration architecture with dynamic prompt and tool injection via Middleware, achieving process orchestration and business logic decoupling',
            project1_h1: 'Multi-Query, HyDE, BM25+Dense vector retrieval, RRF fusion, LLM reranking',
            project1_h2: 'Built with FastMCP, MultiServerMCPClient for unified multi-service invocation',
            project1_h3: 'PostgreSQL session-level Checkpointer + long-term user profile storage',
            project2_title: 'Raspberry Pi Robot Smart Elderly Care Environment Sensing System',
            project2_type: 'Algorithm Implementation',
            project2_desc: 'Designed and implemented 360° panoramic scanning and semantic understanding robot system, providing lightweight and highly interpretable environmental safety monitoring for smart elderly care',
            project2_h1_label: '3-Level Recognition',
            project2_h1: 'Space-Object-State three-level semantic understanding',
            project2_h2_label: 'Anomaly Detection',
            project2_h2: 'Doors, obstacles, unclosed fire, etc.',
            project2_h3_label: 'Voice Alert',
            project2_h3: 'Real-time voice reminders and warnings',
            skills_title_en: 'Skills',
            skills_title_cn: '',
            skill_cat1: 'LLM',
            skill1_3: 'Pre-training & Fine-tuning',
            skill_cat2: 'Image Generation',
            skill2_1: 'Diffusion Models',
            skill2_2: 'YOLO Object Detection',
            skill2_3: 'Model Acceleration',
            skill_cat3: 'RAG & Agent',
            skill3_2: 'Hybrid Retrieval / Rerank',
            skill3_4: 'Multi-Agent Collaboration',
            skill_cat4: 'Tools',
            skill4_3: 'Prompt Engineering',
            contact_title_en: 'Contact',
            contact_title_cn: '',
            phone_label: 'Phone',
            email_label: 'Email',
            edu_label: 'Education',
            edu_value: 'CUHK (M.Sc.)',
            name_footer: 'Chen Shaozhe',
            footer_tagline: 'LLM Algorithm | Diffusion Models | Agent Architecture'
        },
        zh: {
            scroll_down: '向下探索',
            title: '大模型算法工程师',
            tag1: '大模型算法',
            tag2: '扩散模型',
            tag3: 'Agent架构',
            about_title_en: 'About Me',
            about_title_cn: '关于我',
            name: '陈劭哲',
            job_title: '大模型算法工程师',
            age: '22岁 · 男',
            education_title_en: 'Education',
            education_title_cn: '教育背景',
            cuhk_name: '香港中文大学',
            qs_badge: 'QS前50',
            master_degree: '硕士',
            cuhk_major: '通信工程',
            research_label: '研究方向',
            research_content: '扩散模型加速、Agent架构、大模型微调、提示词工程',
            course1: '图像处理与计算机视觉',
            course2: '机器学习与智能通信',
            course3: '随机过程',
            sustech_name: '南方科技大学',
            double_badge: '双一流',
            bachelor_degree: '本科',
            sustech_major: '微电子科学与技术',
            sustech_course1: '深度学习芯片设计',
            sustech_course2: '微型计算机处理器设计',
            sustech_course3: '信号与系统',
            sustech_course4: '数字集成电路设计',
            grad_design_label: '毕业设计',
            grad_design_content: '基于YOLOv11目标检测算法的无人机遥感自制数据集，实现精准农业下玉米出苗质量智能评估',
            campus_label: '校园生活',
            campus_content: '书院学生会主席，青年马克思主义者培养工程',
            experience_title_en: 'Experience',
            experience_title_cn: '实习经历',
            company1_name: '数美万物(广州)网络技术有限公司',
            position1: '图像算法开发',
            exp1_1: '负责5090集群服务器上ComfyUI环境搭建，落地基于Flux模型的AI图像/视频生成工作流',
            exp1_2: '自研ComfyUI双引导器节点，支持双模型步数分配与多加速策略融合',
            exp1_3: '在ComfyUI部署三类策略（Teacache跳步加速、模型量化、kv-cache/SageAttention底层优化）',
            exp1_4: '发现并修正Teacache跳步加速漏洞，实现40%肉眼无损加速',
            exp1_5: '基于Flux模型训练特定风格Lora，使用分布匹配蒸馏方法进行少步蒸馏，实现生图四倍加速',
            company2_name: '华为技术有限公司',
            position2: 'AI开发实习生',
            exp2_1: '基于华为MindSpore框架及昇腾生态，完成CV+NLP多类深度学习模型的全流程开发',
            exp2_2: 'CV方向：落地LeNet5/ResNet50/GoogleNet模型，基于MNIST/CIFAR数据集实现手写体/物体识别',
            exp2_3: 'NLP方向：搭建带Attention的Seq2Seq模型，实现中英双向机器翻译',
            exp2_4: '全程基于华为云ECS服务器完成模型训练与验证',
            projects_title_en: 'Projects',
            projects_title_cn: '项目经历',
            project1_title: 'AI智能旅行规划系统',
            project1_type: 'Agent开发',
            project1_desc: '设计多Agent协作架构，通过Middleware动态注入提示词与工具集，实现流程编排与业务逻辑解耦',
            project1_h1: 'Multi-Query、HyDE、BM25+Dense向量检索、RRF融合、LLM重排序',
            project1_h2: '基于FastMCP构建，MultiServerMCPClient多服务统一调用',
            project1_h3: 'PostgreSQL会话级Checkpointer + 用户画像长期存储',
            project2_title: '树莓派机器人智能养老环境感知系统',
            project2_type: '算法实现',
            project2_desc: '设计并实现360°全景扫描与语义理解机器人系统，为智慧养老提供轻量化、高可解释性的环境安全监测方案',
            project2_h1_label: '三级智能识别',
            project2_h1: '空间-物体-状态三级语义理解',
            project2_h2_label: '环境异常检测',
            project2_h2: '门窗、障碍物、未关火等状态检测',
            project2_h3_label: '语音提醒',
            project2_h3: '语音模块进行实时提醒与警告',
            skills_title_en: 'Skills',
            skills_title_cn: '专业技能',
            skill_cat1: '大模型',
            skill1_3: '预训练与微调',
            skill_cat2: '图像生成',
            skill2_1: '扩散模型',
            skill2_2: 'YOLO目标检测',
            skill2_3: '模型加速',
            skill_cat3: 'RAG & Agent',
            skill3_2: '混合检索 / Rerank',
            skill3_4: '多Agent协作',
            skill_cat4: '工具',
            skill4_3: '提示词工程',
            contact_title_en: 'Contact',
            contact_title_cn: '联系方式',
            phone_label: '电话',
            email_label: '邮箱',
            edu_label: '教育',
            edu_value: '香港中文大学(硕士)',
            name_footer: '陈劭哲',
            footer_tagline: '大模型算法工程师 | 扩散模型 | Agent架构'
        }
    },

    init() {
        // Load saved language preference
        const savedLang = localStorage.getItem('portfolio-lang') || 'zh';
        this.currentLang = savedLang;
        this.updatePage();
        this.setupSwitcher();
    },

    toggle() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('portfolio-lang', this.currentLang);
        this.updatePage();
    },

    updatePage() {
        const t = this.translations[this.currentLang];
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update section title visibility
        document.querySelectorAll('.section-title').forEach(title => {
            const enEl = title.querySelector('.title-en');
            const cnEl = title.querySelector('.title-cn');
            if (cnEl) {
                cnEl.style.display = this.currentLang === 'zh' ? 'inline' : 'none';
            }
        });

        // Update language label
        const label = document.querySelector('.lang-label');
        if (label) {
            label.textContent = this.currentLang === 'zh' ? '中' : 'EN';
        }

        // Update typing animation texts
        if (typeof TypingAnimation !== 'undefined') {
            const typingElement = document.getElementById('typing-text');
            if (typingElement && window.typingAnimationInstance) {
                window.typingAnimationInstance.texts = this.currentLang === 'zh'
                    ? ['大模型算法工程师', '扩散模型加速', 'Agent架构开发', 'RAG&Agent专家']
                    : ['LLM Algorithm Engineer', 'Diffusion Model Acceleration', 'Agent Architecture', 'RAG & Agent Expert'];
            }
        }

        // Update particle text (logo)
        if (window.particleTextInstance) {
            const nameText = this.currentLang === 'zh' ? '陈劭哲' : 'Chen Shaozhe';
            window.particleTextInstance.updateText(nameText);
        }

        // Update document lang attribute
        document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
    },

    setupSwitcher() {
        const switcher = document.getElementById('language-switcher');
        if (switcher) {
            switcher.addEventListener('click', () => this.toggle());
        }
    }
};

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

    // Initialize custom cursor
    new CuteCursor();

    // Initialize WebGL background
    const webglCanvas = document.getElementById('webgl-canvas');
    const fluidBg = new FluidBackground(webglCanvas);
    fluidBg.start();

    // Initialize particle text
    const logoCanvas = document.getElementById('logo-canvas');
    const particleText = new ParticleText(logoCanvas);
    particleText.start();
    window.particleTextInstance = particleText;

    // Initialize magnetic field
    const magneticContainer = document.getElementById('magnetic-field');
    const magneticField = new MagneticField(magneticContainer);
    magneticField.start();

    // Initialize ripple effect
    const rippleContainer = document.getElementById('ripples-container');
    const rippleEffect = new RippleEffect(rippleContainer);

    // Initialize i18n system
    i18n.init();

    // Typing animation
    const typingElement = document.getElementById('typing-text');
    const typingTexts = i18n.currentLang === 'zh'
        ? ['大模型算法工程师', '扩散模型加速', 'Agent架构开发', 'RAG&Agent专家']
        : ['LLM Algorithm Engineer', 'Diffusion Model Acceleration', 'Agent Architecture', 'RAG & Agent Expert'];
    const typingAnimation = new TypingAnimation(typingElement, typingTexts);
    window.typingAnimationInstance = typingAnimation;

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