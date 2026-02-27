const historial = document.getElementById('historial');
const entrada = document.getElementById('entrada-comando');
const infoMision = document.getElementById('info-mision');

let faseMision = 1;

const comandos = {
    'help': () => `COMANDOS DISPONIBLES:
    - nmap: Escanear puertos de red.
    - crack: Intentar fuerza bruta en el objetivo.
    - status: Ver estado de la misión.
    - clear: Limpiar pantalla.`,
    
    'nmap': () => {
        if (faseMision === 1) {
            faseMision = 2;
            infoMision.textContent = "MISIÓN: Vulnerabilidad detectada en puerto 80. Use 'crack' para entrar.";
            return "ESCANEO COMPLETADO: [OBJETIVO: 192.168.1.50] - PUERTO 80 ABIERTO.";
        }
        return "ERROR: Red ya escaneada.";
    },

    'crack': () => {
        if (faseMision === 2) {
            faseMision = 3;
            infoMision.textContent = "MISIÓN CUMPLIDA. Datos extraídos.";
            return "INICIANDO FUERZA BRUTA... [########] 100% - PASSWORD ENCONTRADO: UTA_2026";
        }
        return "ERROR: No hay objetivos detectados para atacar.";
    },

    'status': () => `ESTADO: FASE ${faseMision} DE 3. OBJETIVO: SERVIDOR_LAB_FISEI.`,
    
    'clear': () => { historial.innerHTML = ''; return ''; }
};

entrada.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const fullCmd = entrada.value.toLowerCase().trim();
        entrada.value = '';

        // Agregar comando al historial
        const pCmd = document.createElement('p');
        pCmd.className = 'comando-eco';
        pCmd.textContent = `> ${fullCmd}`;
        historial.appendChild(pCmd);

        // Procesar comando
        const respuesta = comandos[fullCmd] ? comandos[fullCmd]() : `COMANDO NO RECONOCIDO: '${fullCmd}'`;
        
        if (respuesta) {
            const pRes = document.createElement('p');
            pRes.className = 'respuesta';
            pRes.innerText = respuesta;
            historial.appendChild(pRes);
        }

        // Auto-scroll al final
        document.getElementById('consola').scrollTop = document.getElementById('consola').scrollHeight;
    }
});