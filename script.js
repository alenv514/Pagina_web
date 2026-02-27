window.addEventListener('load', () => {
    const track = document.getElementById('carouselTrack');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    // Clonación para el Loop (Duplicamos para asegurar cobertura suave)
    const cards = Array.from(track.children);
    cards.forEach(card => track.appendChild(card.cloneNode(true)));

    let scrollSpeed = 0.5; // Velocidad de desplazamiento continuo
    let isPaused = false;
    let animationId;

    const getStep = () => track.querySelector('.card').offsetWidth + 32;

    // Botones con desplazamiento suave integrado
    nextBtn.onclick = () => {
        isPaused = true;
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
        setTimeout(() => isPaused = false, 2000);
    };

    prevBtn.onclick = () => {
        isPaused = true;
        track.scrollBy({ left: -getStep(), behavior: 'smooth' });
        setTimeout(() => isPaused = false, 2000);
    };

    // Función de animación principal (Movimiento Continuo)
    function step() {
        if (!isPaused) {
            track.scrollLeft += scrollSpeed;

            // Reset infinito: al llegar a la mitad, volvemos silenciosamente al inicio
            if (track.scrollLeft >= track.scrollWidth / 2) {
                track.scrollLeft = 0;
            }
        }
        animationId = requestAnimationFrame(step);
    }

    // Iniciar el movimiento continuo
    step();

    // Pausa al interactuar para accesibilidad
    track.onmouseenter = () => isPaused = true;
    track.onmouseleave = () => isPaused = false;
});

// Fondo de Partículas (Simplificado)
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 50; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 2 });

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,0,51,0.5)";
    particles.forEach(p => {
        p.y -= p.s;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(animate);
}
animate();