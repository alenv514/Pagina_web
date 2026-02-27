const celdas = document.querySelectorAll('.celda');
const textoTurno = document.getElementById('turno');
const botonReiniciar = document.getElementById('reiniciar');

let turnoActual = 'X';
let juegoActivo = true;
let estadoTablero = ['', '', '', '', '', '', '', '', ''];

const combinacionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

celdas.forEach(celda => celda.addEventListener('click', manejarClick));
botonReiniciar.addEventListener('click', reiniciarJuego);

function manejarClick(e) {
    const celda = e.target;
    const indice = celda.getAttribute('data-index');

    if (estadoTablero[indice] !== '' || !juegoActivo) return;

    estadoTablero[indice] = turnoActual;
    celda.textContent = turnoActual;

    verificarGanador();
}

function verificarGanador() {
    let rondaGanada = false;

    for (let i = 0; i < combinacionesGanadoras.length; i++) {
        const [a, b, c] = combinacionesGanadoras[i];
        if (estadoTablero[a] && estadoTablero[a] === estadoTablero[b] && estadoTablero[a] === estadoTablero[c]) {
            rondaGanada = true;
            break;
        }
    }

    if (rondaGanada) {
        textoTurno.textContent = `> VICTORIA: JUGADOR [ ${turnoActual} ]`;
        juegoActivo = false;
        return;
    }

    if (!estadoTablero.includes('')) {
        textoTurno.textContent = '> ADVERTENCIA: EMPATE_DETECTADO';
        juegoActivo = false;
        return;
    }

    turnoActual = turnoActual === 'X' ? 'O' : 'X';
    textoTurno.textContent = `TURNO_ACTUAL: [ ${turnoActual} ]`;
}

function reiniciarJuego() {
    turnoActual = 'X';
    juegoActivo = true;
    estadoTablero = ['', '', '', '', '', '', '', '', ''];
    textoTurno.textContent = `TURNO_ACTUAL: [ ${turnoActual} ]`;
    celdas.forEach(celda => celda.textContent = '');
}