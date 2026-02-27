// actualmente sólo necesitamos un tamaño elegido por el usuario
let boardSize = 2;              // 2x2, 4x4, 6x6
let nivelActual = 0;            // índice dentro de los niveles del mismo tamaño
const maxLevelsPerSize = 10;    // cada tamaño/modo dispone de 10 etapas
let tablero = null;
let primeraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let movimientos = 0;
let maxMovimientos = 0;
let parejasEncontradas = 0;
// guarda la última configuración colocada en el tablero
let ultimaConfiguracion = [];

function obtenerMaxMovimientos(size) {
  if (size === 2) return 8;
  if (size === 4) return 20;
  if (size === 6) return 30;
  return Infinity;
}

// temática actual de las cartas
let currentTheme = 'frutas';

// listas de símbolos para cada tema
const cartasFrutas = [
  "🍎", "🍌", "🍇", "🍉", "🍓", "🍍", "🥝", "🍒",
  "🍑", "🍋", "🍊", "🍐", "🍈", "🍏", "🥭", "🍅",
  "🥥", "🍆", "🥑", "🥕", "🌽", "🥔", "🍠", "🥦"
];

const cartasTradicional = [
  "2♠", "2♥", "2♦", "2♣",
  "3♠", "3♥", "3♦", "3♣",
  "4♠", "4♥", "4♦", "4♣",
  "5♠", "5♥", "5♦", "5♣",
  "6♠", "6♥", "6♦", "6♣",
  "7♠", "7♥", "7♦", "7♣",
  "8♠", "8♥", "8♦", "8♣",
  "9♠", "9♥", "9♦", "9♣",
  "10♠", "10♥", "10♦", "10♣",
  "J♠", "J♥", "J♦", "J♣",
  "Q♠", "Q♥", "Q♦", "Q♣",
  "K♠", "K♥", "K♦", "K♣",
  "A♠", "A♥", "A♦", "A♣"
];


const cartasAnimales = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
  "🐧", "🐦", "🐤", "🦆", "🦉", "🦇", "🐺", "🦄"
];

function seleccionarCartasPorTema() {
  switch (currentTheme) {
    case 'tradicional': return cartasTradicional;
    case 'animales': return cartasAnimales;
    case 'frutas':
    default: return cartasFrutas;
  }
}

function getThemeDisplayName() {
  switch (currentTheme) {
    case 'tradicional': return 'cartas tradicionales';
    case 'animales': return 'animales';
    case 'frutas':
    default: return 'frutas';
  }
}

function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

// utilitario de mezcla (Fisher–Yates)
function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// colores base vívidos para las celdas de memorizar/preview
const baseColors = [
  'rgba(255,99,132,0.6)',
  'rgba(54,162,235,0.6)',
  'rgba(255,206,86,0.6)',
  'rgba(75,192,192,0.6)',
  'rgba(153,102,255,0.6)',
  'rgba(255,159,64,0.6)',
  'rgba(199,199,199,0.6)',
  'rgba(83,102,255,0.6)',
  'rgba(255,0,0,0.6)',
  'rgba(0,255,0,0.6)',
  'rgba(0,0,255,0.6)',
  'rgba(255,255,0,0.6)'
];

function pickColors(count) {
  const copy = mezclar([...baseColors]);
  if (count <= copy.length) return copy.slice(0, count);
  while (copy.length < count) {
    copy.push(...mezclar([...baseColors]));
  }
  return copy.slice(0, count);
}

function iniciarJuego(index = 0) {
  // limpiar cualquier overlay previo
  eliminarOverlay();
  nivelActual = Math.min(Math.max(0, index), maxLevelsPerSize - 1);
  tablero = document.getElementById("tablero");
  tablero.innerHTML = "";
  movimientos = 0;
  parejasEncontradas = 0;
  maxMovimientos = obtenerMaxMovimientos(boardSize);
  document.getElementById("movimientos").textContent = `${movimientos} / ${maxMovimientos}`;
  const titulo = document.getElementById("nivelTitulo");
  if (titulo) titulo.textContent = `Nivel ${nivelActual + 1}`;
  document.getElementById("mensajeVictoria").textContent = "";

  const size = boardSize;
  const valores = crearTablero(size);
  // almacenar la configuración del tablero (puede usarse posteriormente)
  ultimaConfiguracion = valores.slice();
  // mostrar la sección del juego principal
  mostrarSeccion('juego');
}

function crearTablero(size) {
  const valores = generarValores(size);

  // ajustar el grid según el tamaño (columnas de ancho automático / fijo)
  tablero.style.gridTemplateColumns = `repeat(${size}, auto)`;

  valores.forEach(val => {
    const card = document.createElement("div");
    card.classList.add("card");
    if (val === null) {
      card.classList.add('empty');
      card.innerHTML = `
        <div class="inner">
          <div class="front"></div>
          <div class="back"></div>
        </div>
      `;
      tablero.appendChild(card);
      return;
    }

    card.dataset.value = val;
    card.innerHTML = `
      <div class="inner">
        <div class="front">?</div>
        <div class="back">${val}</div>
      </div>
    `;
    card.addEventListener("click", () => voltearCarta(card, val));
    tablero.appendChild(card);
  });
  // devolver la configuración de valores colocados en el tablero
  return valores;
}

// genera el arreglo de valores (con pares mezclados) para un tablero de cierto tamaño
function generarValores(size) {
  const total = size * size;
  const pares = Math.floor(total / 2);
  let disponibles = mezclar([...seleccionarCartasPorTema()]);
  while (disponibles.length < pares) {
    disponibles = disponibles.concat(mezclar([...seleccionarCartasPorTema()]));
  }
  const seleccion = disponibles.slice(0, pares);
  const valores = [];
  seleccion.forEach(sym => valores.push(sym, sym));
  if (total % 2 === 1) {
    valores.push(null);
  }
  return mezclar(valores);
}

// muestra una pantalla de memorización con los símbolos visibles durante `durationMs`
function mostrarFaseMemoria(valores, size, durationMs, callback) {
  // bloquear interacciones mientras se muestra
  bloqueado = true;

  // crear overlay personalizado para memorización
  const overlay = document.createElement('div');
  overlay.className = 'overlay memoria-overlay';

  const box = document.createElement('div');
  box.className = 'memoria-box';

  // botón de volver a inicio dentro de la caja de memorización
  const homeBtn = document.createElement('button');
  homeBtn.className = 'overlay-icon-btn';
  homeBtn.innerHTML = '🏠';
  homeBtn.title = 'Volver al inicio';
  homeBtn.onclick = () => {
    eliminarOverlay();
    mostrarSeccion('inicio');
    bloqueado = false;
  };
  box.appendChild(homeBtn);

  const grid = document.createElement('div');
  grid.className = 'memoria-grid';
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  valores.forEach(val => {
    const cell = document.createElement('div');
    cell.className = 'memoria-card';
    cell.textContent = val === null ? '' : val;
    grid.appendChild(cell);
  });

  const info = document.createElement('div');
  info.className = 'memoria-info';
  info.textContent = `Recuerda la posición de las ${getThemeDisplayName()} — comienza en`;

  const contador = document.createElement('span');
  contador.className = 'memoria-count';
  contador.textContent = Math.ceil(durationMs / 1000);
  info.appendChild(document.createTextNode(' '));
  info.appendChild(contador);
  info.appendChild(document.createTextNode(' segundos'));

  box.appendChild(info);
  box.appendChild(grid);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // cuenta regresiva visual
  let remaining = Math.ceil(durationMs / 1000);
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining >= 0) contador.textContent = remaining;
  }, 1000);

  // al terminar, mostrar botón de siguiente nivel
  setTimeout(() => {
    clearInterval(interval);
    // Remover el contador y el info, mantener el grid visible
    info.remove();
    contador.remove();

    // Agregar botón de play para continuar al siguiente nivel
    const btnArea = document.createElement('div');
    btnArea.style.display = 'flex';
    btnArea.style.justifyContent = 'center';
    btnArea.style.gap = '20px';
    btnArea.style.marginTop = '20px';

    const btnSiguiente = document.createElement('button');
    btnSiguiente.className = 'overlay-icon-btn';
    btnSiguiente.innerHTML = '▶️';
    btnSiguiente.title = 'Siguiente nivel';
    btnSiguiente.onclick = () => {
      const existing = document.querySelector('.memoria-overlay');
      if (existing) existing.remove();
      bloqueado = false;
      if (typeof callback === 'function') callback();
    };
    btnArea.appendChild(btnSiguiente);
    box.appendChild(btnArea);
  }, durationMs);
}

function voltearCarta(card, simbolo) {
  if (bloqueado || card.classList.contains("flip")) return;

  card.classList.add("flip");

  if (!primeraCarta) {
    primeraCarta = { card, simbolo };
  } else {
    segundaCarta = { card, simbolo };
    movimientos++;
    document.getElementById("movimientos").textContent = `${movimientos} / ${maxMovimientos}`;
    verificarPareja();
  }
}

function verificarPareja() {
  if (primeraCarta.simbolo === segundaCarta.simbolo) {
    parejasEncontradas++;
    resetTurno();

    const totalPairs = Math.floor((boardSize * boardSize) / 2);
    if (parejasEncontradas === totalPairs) {
      mostrarVictoria();
    } else if (movimientos >= maxMovimientos) {
      setTimeout(() => mostrarGameOver('¡Te quedaste sin movimientos!'), 500);
    }
  } else {
    bloqueado = true;
    setTimeout(() => {
      primeraCarta.card.classList.remove("flip");
      segundaCarta.card.classList.remove("flip");
      resetTurno();
      if (movimientos >= maxMovimientos) {
        mostrarGameOver('¡Te quedaste sin movimientos!');
      }
    }, 1000);
  }
}

function resetTurno() {
  [primeraCarta, segundaCarta, bloqueado] = [null, null, false];
}

function mostrarVictoria() {
  const tieneProximoNivel = nivelActual < maxLevelsPerSize - 1;
  const box = document.createElement('div');
  box.className = 'message-box';

  if (!tieneProximoNivel) {
    const msg = document.createElement('div');
    msg.textContent = `🎉 ¡Nivel ${nivelActual + 1} completado en ${movimientos} movimientos!`;
    box.appendChild(msg);
  } else {
    // Título "Otro juego"
    const tituloOtroJuego = document.createElement('div');
    tituloOtroJuego.textContent = 'Otro juego';
    tituloOtroJuego.style.fontSize = '24px';
    tituloOtroJuego.style.fontWeight = 'bold';
    box.appendChild(tituloOtroJuego);

    // Fruta del siguiente nivel
    const frutasContainer = document.createElement('div');
    frutasContainer.style.display = 'flex';
    frutasContainer.style.justifyContent = 'center';
    frutasContainer.style.margin = '20px 0';
    frutasContainer.style.fontSize = '80px';
    frutasContainer.style.cursor = 'pointer';

    // el siguiente nivel usa el mismo tamaño
    const previewVals = generarValores(boardSize);
    const frutas = previewVals.filter(v => v !== null);
    // Mostrar solo 1 fruta
    const frutaUnica = [...new Set(frutas)][0];
    const frutaEl = document.createElement('span');
    frutaEl.textContent = frutaUnica;
    frutaEl.style.cursor = 'pointer';
    frutaEl.style.transition = 'transform 0.2s';
    frutaEl.onmouseover = () => frutaEl.style.transform = 'scale(1.1)';
    frutaEl.onmouseout = () => frutaEl.style.transform = 'scale(1)';
    frutaEl.onclick = () => { eliminarOverlay(); irAlJuegoMemoria(); };
    frutasContainer.appendChild(frutaEl);
    box.appendChild(frutasContainer);

    // Mensaje de Siguiente nivel
    const msg = document.createElement('div');
    msg.textContent = `🎉 ¡Siguiente nivel!`;
    box.appendChild(msg);
  }

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.gap = '20px';
  btnContainer.style.marginTop = '20px';
  const btnVolver = document.createElement('button');
  btnVolver.className = 'overlay-icon-btn';
  btnVolver.innerHTML = '🏠';
  btnVolver.title = 'Volver al inicio';
  btnVolver.onclick = () => { eliminarOverlay(); mostrarSeccion('inicio'); };
  btnContainer.appendChild(btnVolver);
  if (tieneProximoNivel) {
    const btnSiguiente = document.createElement('button');
    btnSiguiente.className = 'overlay-icon-btn';
    btnSiguiente.innerHTML = '▶️';
    btnSiguiente.title = 'Siguiente nivel';
    btnSiguiente.onclick = () => { eliminarOverlay(); iniciarJuego(nivelActual + 1); };
    btnContainer.appendChild(btnSiguiente);
  }
  box.appendChild(btnContainer);
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function irAlJuegoMemoria() {
  // incrementar nivel de memorizar
  nivelMemoria = Math.min(nivelMemoria + 1, maxLevelsPerSize);
  movimientos = 0;
  parejasEncontradas = 0;
  document.getElementById('movimientos').textContent = movimientos;

  // si ya completamos todos los 9 niveles de memorizar
  if (nivelMemoria > maxLevelsPerSize) {
    const box = document.createElement('div');
    box.className = 'message-box';
    const msg = document.createElement('div');
    msg.textContent = `🎉 ¡Completaste los ${maxLevelsPerSize} niveles de memorizar!`;
    box.appendChild(msg);
    const btn = document.createElement('button');
    btn.className = 'overlay-icon-btn';
    btn.innerHTML = '🏠';
    btn.title = 'Volver al inicio';
    btn.style.width = '80px';
    btn.style.height = '80px';
    btn.style.fontSize = '40px';
    btn.onclick = () => {
      eliminarOverlay();
      mostrarSeccion('inicio');
    };
    box.appendChild(btn);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return;
  }

  // inicia un único nivel (ronda) del mini-juego interactivo extra
  // recibe opcionalmente un existingOverlay para evitar recrearlo y perder el flujo
  irAlJuegoFrutasArrastre(null);
}

// inicia un único nivel (ronda) del mini-juego interactivo extra
function irAlJuegoFrutasArrastre() {
  nivelMemoria++;
  const nextSize = boardSize;
  const totalCells = nextSize * nextSize;
  let disponibles = mezclar([...new Set(seleccionarCartasPorTema())]);
  let resultVals = disponibles.slice(0, totalCells);
  let idx = 0;
  while (resultVals.length < totalCells) {
    resultVals.push(disponibles[idx % disponibles.length]);
    idx++;
  }
  const previewVals = mezclar(resultVals);

  const box = document.createElement('div');
  box.className = 'message-box';

  const previewContainer = document.createElement('div');
  previewContainer.className = 'preview-container';

  let interval; // declarado antes para poder limpiarlo
  const homeBtn = document.createElement('button');
  homeBtn.className = 'overlay-icon-btn';
  homeBtn.innerHTML = '🏠';
  homeBtn.title = 'Volver al inicio';
  homeBtn.style.alignSelf = 'flex-start';
  homeBtn.style.marginBottom = '10px';
  homeBtn.onclick = () => {
    if (interval) clearInterval(interval);
    eliminarOverlay();
    mostrarSeccion('inicio');
  };
  previewContainer.appendChild(homeBtn);

  const info = document.createElement('div');
  info.className = 'memoria-info';
  info.textContent = 'Memoriza esta disposición. Faltan ';
  const countSpan = document.createElement('span');
  countSpan.className = 'memoria-count';
  countSpan.textContent = '10';
  info.appendChild(countSpan);
  info.appendChild(document.createTextNode(' segundos'));
  previewContainer.appendChild(info);

  const grid = document.createElement('div');
  grid.className = 'preview-grid';
  grid.style.gridTemplateColumns = `repeat(${nextSize}, 1fr)`;
  const cellColors = pickColors(previewVals.length);
  previewVals.forEach((val, idx) => {
    const cell = document.createElement('div');
    cell.className = 'preview-cell';
    cell.textContent = val === null ? '' : val;
    cell.style.background = cellColors[idx];
    grid.appendChild(cell);
  });

  previewContainer.appendChild(grid);
  box.appendChild(previewContainer);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // iniciar cuenta regresiva
  let rem = 10;
  interval = setInterval(() => {
    rem -= 1;
    if (rem >= 0) countSpan.textContent = rem;
    if (rem === 0) {
      clearInterval(interval);
      // al terminar la cuenta, convertimos el cuadro en interactivo
      habilitarInteractividad(previewContainer, previewVals, nextSize, () => {
        // cuando se complete correctamente
        if (nivelMemoria < maxLevelsPerSize) {
          // mostramos botón de siguiente nivel (play)
          mostrarSiguienteNivelOverlay();
        } else {
          // ya no hay más niveles drag; mostramos la victoria final
          eliminarOverlay();
          mostrarVictoria();
        }
      }, () => {
        // juego terminado por error
        mostrarGameOver('Colocación incorrecta. Fin del juego.');
      });
    }
  }, 1000);
}

// Muestra botón de PLAY para el siguiente nivel del mini juego
function mostrarSiguienteNivelOverlay() {
  const box = document.createElement('div');
  box.className = 'message-box';

  const title = document.createElement('div');
  title.className = 'memoria-info';
  title.textContent = `NIVEL ${nivelMemoria} COMPLETADO`;
  title.style.marginBottom = '20px';
  box.appendChild(title);

  const btn = document.createElement('button');
  btn.className = 'overlay-icon-btn';
  btn.innerHTML = '▶️';
  btn.title = 'Siguiente Nivel';
  btn.style.width = '80px';
  btn.style.height = '80px';
  btn.style.fontSize = '40px';
  btn.onclick = () => {
    eliminarOverlay(); // removemos la victoria y el juego anterior
    irAlJuegoFrutasArrastre(); // avanzar al siguiente nivel limpio
  };
  box.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


// convierte un contenedor de vista previa en un espacio de arrastrar y soltar
// previewVals: arreglo de símbolos en el orden correcto para las celdas
// size: ancho del tablero (número de columnas)
// onComplete: callback cuando todas las frutas estén bien colocadas
// onFail: callback cuando se coloca mal alguna fruta
function habilitarInteractividad(previewContainer, previewVals, size, onComplete, onFail) {
  // limpiamos instrucciones de cuenta y grid antiguo
  previewContainer.innerHTML = '';

  // insertar botón de volver a inicio para el usuario
  const homeBtn = document.createElement('button');
  homeBtn.className = 'overlay-icon-btn';
  homeBtn.innerHTML = '🏠';
  homeBtn.title = 'Volver al inicio';
  homeBtn.onclick = () => {
    eliminarOverlay();
    mostrarSeccion('inicio');
  };
  previewContainer.appendChild(homeBtn);

  const instrucciones = document.createElement('div');
  instrucciones.className = 'memoria-info';
  instrucciones.textContent = 'Arrastra cada fruta a su posición correcta';
  previewContainer.appendChild(instrucciones);

  const main = document.createElement('div');
  main.className = 'interactive-area';
  // paletas de frutas a ambos lados de la cuadrícula
  const paletaLeft = document.createElement('div');
  paletaLeft.className = 'palette palette-left';
  const paletaRight = document.createElement('div');
  paletaRight.className = 'palette palette-right';
  // clonamos y mezclamos los valores para que no estén ordenados
  const allItems = mezclar(previewVals.filter(v => v !== null));
  // dividir en dos mitades (si es impar, left tendrá un elemento más)
  const mid = Math.ceil(allItems.length / 2);
  const leftItems = allItems.slice(0, mid);
  const rightItems = allItems.slice(mid);

  function crearDraggables(lista, contenedor) {
    lista.forEach(val => {
      const itm = document.createElement('div');
      itm.className = 'draggable-item';
      itm.textContent = val;
      itm.draggable = true;
      itm.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', val);
      });
      contenedor.appendChild(itm);
    });
  }
  crearDraggables(leftItems, paletaLeft);
  crearDraggables(rightItems, paletaRight);

  const targets = document.createElement('div');
  targets.className = 'targets';
  targets.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  // reutilizamos los mismos colores generados anteriormente
  // (siendo la función pickColors ya definida) ejecutamos de nuevo
  const cellColors = pickColors(previewVals.length);
  previewVals.forEach((val, idx) => {
    const cell = document.createElement('div');
    cell.className = 'preview-cell target-cell';
    cell.dataset.index = idx;
    // mismo color que en el preview inicial
    cell.style.background = cellColors[idx];
    cell.addEventListener('dragover', e => e.preventDefault());
    cell.addEventListener('drop', e => {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      // si la casilla ya se ocupó no hacemos nada
      if (cell.classList.contains('filled')) return;

      // agregar clase de verificación (luces blancas)
      cell.classList.add('checking');
      cell.textContent = data;

      // esperar 1 segundo mientras se verifica
      setTimeout(() => {
        cell.classList.remove('checking');
        const isCorrect = data === val;

        if (isCorrect) {
          // colocación correcta - se pone verde
          cell.classList.add('correct');
          cell.classList.add('filled');
          // eliminar item de la paleta
          const dragged = Array.from(paletaLeft.children).concat(Array.from(paletaRight.children)).find(c => c.textContent === data && !c.classList.contains('used'));
          if (dragged) {
            dragged.classList.add('used');
            dragged.style.opacity = '0.3';
            dragged.draggable = false;
          }
          // comprobar si terminó
          const filled = targets.querySelectorAll('.filled').length;
          if (filled === previewVals.filter(v => v !== null).length) {
            if (typeof onComplete === 'function') onComplete();
          }
        } else {
          // colocación incorrecta - se pone rojo y termina en 2 segundos
          cell.classList.add('incorrect');
          cell.textContent = data;
          setTimeout(() => {
            if (typeof onFail === 'function') onFail();
          }, 2000);
        }
      }, 1000);
    });
    targets.appendChild(cell);
  });

  main.appendChild(paletaLeft);
  main.appendChild(targets);
  main.appendChild(paletaRight);
  previewContainer.appendChild(main);
}

// muestra un overlay de fin de juego con mensaje y opción de reiniciar
function mostrarGameOver(text) {
  const box = document.createElement('div');
  box.className = 'message-box';
  const msg = document.createElement('div');
  msg.textContent = text;
  box.appendChild(msg);
  const btn = document.createElement('button');
  btn.textContent = 'Reiniciar';
  btn.onclick = () => {
    eliminarOverlay();
    iniciarJuego(nivelActual); // reinicia mismo nivel
  };
  btn.style.marginLeft = '10px';
  box.appendChild(btn);
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// función que muestra la primera fase del nuevo nivel: un patrón
// de círculos de colores que aparece en pantalla durante `durationMs`.
// se puede reutilizar más adelante si se quiere cambiar el diseño.
function mostrarNivelEspecial(durationMs, callback) {
  bloqueado = true;

  const overlay = document.createElement('div');
  overlay.className = 'overlay memoria-overlay';

  const box = document.createElement('div');
  box.className = 'memoria-box';

  const info = document.createElement('div');
  info.className = 'memoria-info';
  info.textContent = 'Memoriza el patrón mostrado — comienza en';

  const contador = document.createElement('span');
  contador.className = 'memoria-count';
  contador.textContent = Math.ceil(durationMs / 1000);
  info.appendChild(document.createTextNode(' '));
  info.appendChild(contador);
  info.appendChild(document.createTextNode(' segundos'));

  // contenedor con frutas a los lados y el patrón en el centro
  const layout = document.createElement('div');
  layout.className = 'memoria-layout';

  const leftFruits = document.createElement('div');
  leftFruits.className = 'memoria-fruits left';
  // ejemplo de frutas laterales (puedes personalizar)
  ['🍇', '🍊', '🍋', '🍌', '🍒', '🍎'].forEach(f => {
    const fdiv = document.createElement('div');
    fdiv.className = 'fruit';
    fdiv.textContent = f;
    leftFruits.appendChild(fdiv);
  });

  const rightFruits = document.createElement('div');
  rightFruits.className = 'memoria-fruits right';
  ['🥥', '🥝', '🍐', '🍉', '🥭', '🥒'].forEach(f => {
    const fdiv = document.createElement('div');
    fdiv.className = 'fruit';
    fdiv.textContent = f;
    rightFruits.appendChild(fdiv);
  });

  const grid = document.createElement('div');
  grid.className = 'memoria-grid';
  grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

  // colores similares a la imagen de ejemplo
  const colores = [
    '#6a0dad', '#c71585', '#ff4500', '#ffd700',
    '#7fff00', '#00fa9a', '#00ced1', '#1e90ff',
    '#4b0082', '#0000cd', '#4169e1', '#0000ff',
    '#ff69b4', '#ff6347', '#ffa500', '#adff2f'
  ];

  colores.forEach(col => {
    const cell = document.createElement('div');
    cell.className = 'memoria-card';
    cell.style.background = col;
    grid.appendChild(cell);
  });

  // ensamblar layout completo
  layout.appendChild(leftFruits);
  layout.appendChild(grid);
  layout.appendChild(rightFruits);

  box.appendChild(info);
  box.appendChild(layout);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  let remaining = Math.ceil(durationMs / 1000);
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining >= 0) contador.textContent = remaining;
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    const existing = document.querySelector('.memoria-overlay');
    if (existing) existing.remove();
    bloqueado = false;
    if (typeof callback === 'function') callback();
  }, durationMs);
}

// elimina cualquier overlay de victoria existente
function eliminarOverlay() {
  const existing = document.querySelector('.overlay');
  if (existing) existing.remove();
}

// Exponer funciones a nivel global para los botones HTML
window.mostrarSeccion = mostrarSeccion;
window.iniciarJuego = iniciarJuego;

// funciones de configuración de inicio (tamaño y tema)
function setBoardSize(size) {
  boardSize = size;
  document.querySelectorAll('.size-buttons button').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.size, 10) === size);
  });
}

function setTheme(theme) {
  currentTheme = theme;
  document.querySelectorAll('.theme-buttons button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.theme === theme);
  });
  // actualizar el preview si existe
  const preview = document.getElementById('theme-preview');
  if (preview) {
    preview.innerHTML = '';
    const symbols = seleccionarCartasPorTema().slice(0, 6);
    symbols.forEach(sym => {
      const sp = document.createElement('span');
      sp.className = 'preview-symbol';
      sp.textContent = sym;
      preview.appendChild(sp);
    });
  }
}

window.setBoardSize = setBoardSize;
window.setTheme = setTheme;

// inicializar botones con valores por defecto
setBoardSize(boardSize);
setTheme(currentTheme);

// mini‑juego de mover frutas independiente
function iniciarMiniJuegoFrutas() {
  mostrarSeccion('juego');
  nivelMemoria = 0;
  movimientos = 0;
  parejasEncontradas = 0;
  document.getElementById('movimientos').textContent = movimientos;
  irAlJuegoMemoria();
}

window.iniciarMiniJuegoFrutas = iniciarMiniJuegoFrutas;