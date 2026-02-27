// Referencias a los botones
const btnStickman = document.getElementById('btn-stickman');
const btnHack = document.getElementById('btn-hack');
const btnTresEnRaya = document.getElementById('btn-tres-en-raya');

// Eventos de redirección a la carpeta /juegos
btnStickman.addEventListener('click', () => {
    window.location.href = 'juegos/stickman.html';
});

btnHack.addEventListener('click', () => {
    window.location.href = 'juegos/hack_terminal.html';
});

btnTresEnRaya.addEventListener('click', () => {
    window.location.href = 'juegos/tres_en_raya.html';
});