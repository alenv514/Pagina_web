const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let targets = [];

// --- CLASE ENEMIGO (PERSONAS) ---
class Person {
    constructor() {
        this.reset();
    }

    reset() {
        this.width = 30;
        this.height = 60;
        this.x = Math.random() > 0.5 ? -50 : canvas.width + 50; // Aparecen por los lados
        this.y = canvas.height - 150 - (Math.random() * 100); // En la zona del "suelo"
        this.speed = (Math.random() * 2 + 1) * (this.x < 0 ? 1 : -1);
        this.alive = true;
        this.color = "#d9534f"; // Rojo suave
        this.legAngle = 0;
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Dibujar cuerpo simple
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        // Cabeza
        ctx.beginPath();
        ctx.arc(0, -50, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tronco
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, -15);
        ctx.stroke();

        // Piernas animadas
        this.legAngle += 0.15;
        let walk = Math.sin(this.legAngle) * 10;
        
        ctx.beginPath(); // Pierna 1
        ctx.moveTo(0, -15);
        ctx.lineTo(walk, 5);
        ctx.stroke();

        ctx.beginPath(); // Pierna 2
        ctx.moveTo(0, -15);
        ctx.lineTo(-walk, 5);
        ctx.stroke();

        ctx.restore();
    }

    update() {
        this.x += this.speed;
        // Si sale de la pantalla, reaparece
        if (this.x > canvas.width + 100 || this.x < -100) this.reset();
        this.draw();
    }
}

// --- AMBIENTE (FONDO) ---
function drawBackground() {
    // Cielo atardecer
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1a2a6c");
    gradient.addColorStop(0.5, "#b21f1f");
    gradient.addColorStop(1, "#fdbb2d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Montañas lejanas
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(200, 300);
    ctx.lineTo(400, canvas.height - 100);
    ctx.lineTo(700, 200);
    ctx.lineTo(1000, canvas.height - 100);
    ctx.lineTo(canvas.width, 400);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Suelo
    ctx.fillStyle = "#1e272e";
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
}

// --- EL RIFLE Y MIRA ---
function drawSniperRifle() {
    ctx.save();
    // El arma sigue un poco al mouse para efecto parallax
    let moveX = (mouse.x - canvas.width / 2) * 0.05;
    
    ctx.translate(canvas.width / 2 + moveX, canvas.height);
    
    // Cuerpo del rifle
    ctx.fillStyle = "#333";
    ctx.fillRect(-40, -220, 80, 220); 
    
    // Mira telescópica (cañón arriba)
    ctx.fillStyle = "#111";
    ctx.fillRect(-20, -300, 40, 150);
    
    ctx.restore();
}

function drawScope() {
    // Oscurecer los bordes (Efecto lente)
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2, false);
    ctx.rect(canvas.width, 0, -canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fill();

    // Círculo de la mira
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Cruz central
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 150, mouse.y);
    ctx.lineTo(mouse.x + 150, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 150);
    ctx.lineTo(mouse.x, mouse.y + 150);
    ctx.stroke();
}

// --- LÓGICA PRINCIPAL ---
function init() {
    targets = [];
    for (let i = 0; i < 6; i++) {
        targets.push(new Person());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();

    targets.forEach(person => person.update());

    drawSniperRifle();
    drawScope();

    requestAnimationFrame(animate);
}

// Eventos
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('click', () => {
    // Efecto de retroceso (shake) visual rápido podría ir aquí
    targets.forEach(person => {
        // Detectar si el clic está cerca del cuerpo del monigote
        const dx = mouse.x - person.x;
        const dy = mouse.y - (person.y - 25); // Ajuste al centro del cuerpo
        
        if (Math.abs(dx) < 20 && Math.abs(dy) < 40) {
            person.alive = false;
            score += 100;
            scoreElement.innerText = score;
            setTimeout(() => person.reset(), 1000);
        }
    });
});

init();
animate();