const { Engine, Render, Runner, Bodies, Composite, Constraint, Body, Events } = Matter;

const engine = Engine.create();
const render = Render.create({
    element: document.getElementById('contenedor-canvas'),
    engine: engine,
    options: { width: 800, height: 400, wireframes: false, background: 'transparent' }
});

// 1. LIMITES DEL RING (Paredes reforzadas para que no se salgan)
const wallOpt = { isStatic: true, render: { fillStyle: '#ff4500' }, friction: 0.1 };
const suelo = Bodies.rectangle(400, 390, 810, 40, wallOpt);
const paredIzq = Bodies.rectangle(10, 200, 20, 400, wallOpt);
const paredDer = Bodies.rectangle(790, 200, 20, 400, wallOpt);
Composite.add(engine.world, [suelo, paredIzq, paredDer]);

let vidaJugador = 100, vidaIA = 100, finalizado = false;

function crearLuchador(x, y, color, etiqueta) {
    const grupo = Body.nextGroup(true);
    const opt = { 
        collisionFilter: { group: grupo }, 
        render: { fillStyle: color, strokeStyle: '#fff', lineWidth: 1 },
        friction: 0.1, frictionAir: 0.02, restitution: 0.3, density: 0.005,
        chamfer: { radius: 5 }
    };

    const cabeza = Bodies.circle(x, y - 60, 15, { ...opt, label: etiqueta + '_cabeza' });
    const torso = Bodies.rectangle(x, y - 10, 10, 50, { ...opt, label: etiqueta + '_torso' });
    const bIzq = Bodies.rectangle(x - 15, y - 20, 8, 40, { ...opt, label: etiqueta + '_brazo' });
    const bDer = Bodies.rectangle(x + 15, y - 20, 8, 40, { ...opt, label: etiqueta + '_brazo' });
    const pIzq = Bodies.rectangle(x - 10, y + 30, 8, 45, { ...opt, label: etiqueta + '_pierna' });
    const pDer = Bodies.rectangle(x + 10, y + 30, 8, 45, { ...opt, label: etiqueta + '_pierna' });

    // MODELAMIENTO: Inercia Infinita para que siempre estén parados
    Body.setInertia(torso, Infinity);
    Body.setInertia(cabeza, Infinity);

    const jointOpt = { stiffness: 0.8, render: { visible: false } };
    const joints = [
        Constraint.create({ bodyA: cabeza, bodyB: torso, pointA: {x:0, y:15}, pointB: {x:0, y:-25}, ...jointOpt }),
        Constraint.create({ bodyA: torso, bodyB: bIzq, pointA: {x:-5, y:-20}, pointB: {x:0, y:-15}, ...jointOpt }),
        Constraint.create({ bodyA: torso, bodyB: bDer, pointA: {x:5, y:-20}, pointB: {x:0, y:-15}, ...jointOpt }),
        Constraint.create({ bodyA: torso, bodyB: pIzq, pointA: {x:-5, y:20}, pointB: {x:0, y:-20}, ...jointOpt }),
        Constraint.create({ bodyA: torso, bodyB: pDer, pointA: {x:5, y:20}, pointB: {x:0, y:-20}, ...jointOpt })
    ];

    Composite.add(engine.world, [cabeza, torso, bIzq, bDer, pIzq, pDer, ...joints]);
    return { torso, bDer, pDer, bIzq };
}

const jugador = crearLuchador(250, 300, '#00e5ff', 'JUGADOR');
const ia = crearLuchador(550, 300, '#ff4500', 'IA');

const teclas = {};
window.addEventListener('keydown', e => teclas[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => teclas[e.key.toLowerCase()] = false);

Events.on(engine, 'beforeUpdate', () => {
    if (finalizado) return;

    // CONTROLES JUGADOR
    if (teclas['a']) Body.setVelocity(jugador.torso, { x: -4, y: jugador.torso.velocity.y });
    if (teclas['d']) Body.setVelocity(jugador.torso, { x: 4, y: jugador.torso.velocity.y });
    if (teclas['w'] && Math.abs(jugador.torso.velocity.y) < 0.5) Body.applyForce(jugador.torso, jugador.torso.position, {x:0, y:-0.12});

    // ATAQUES JUGADOR
    if (teclas['j']) { Body.setAngularVelocity(jugador.bDer, 0.4); Body.applyForce(jugador.bDer, jugador.bDer.position, {x:0.02, y:-0.01}); }
    if (teclas['k']) { Body.setAngularVelocity(jugador.pDer, 0.4); Body.applyForce(jugador.pDer, jugador.pDer.position, {x:0.02, y:-0.02}); }

    // IA AGRESIVA
    const dist = jugador.torso.position.x - ia.torso.position.x;
    if (Math.abs(dist) > 60) {
        Body.applyForce(ia.torso, ia.torso.position, { x: dist > 0 ? 0.005 : -0.005, y: 0 });
    } else {
        // IA ATACA Y SALTA
        if (Math.random() < 0.05) Body.applyForce(ia.torso, ia.torso.position, {x:0, y:-0.1});
        if (Math.random() < 0.1) {
            const f = dist > 0 ? -0.02 : 0.02; // IA golpea hacia el jugador
            Body.setAngularVelocity(ia.bDer, f > 0 ? 0.5 : -0.5);
            Body.applyForce(ia.bDer, ia.bDer.position, {x:f, y:-0.01});
        }
    }
});

// DETECCIÓN DE DAÑO (IA TAMBIÉN HACE DAÑO)
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const a = pair.bodyA, b = pair.bodyB;
        const vel = Math.abs(a.speed) + Math.abs(b.speed);

        if (vel > 10) {
            // Jugador golpea IA
            if (a.label.includes('JUGADOR') && b.label.includes('IA_torso')) vidaIA -= 5;
            // IA golpea Jugador
            if (a.label.includes('IA') && b.label.includes('JUGADOR_torso')) vidaJugador -= 5;
            actualizarHUD();
        }
    });
});

function actualizarHUD() {
    document.getElementById('vida-jugador').style.width = Math.max(0, vidaJugador) + '%';
    document.getElementById('perc-jugador').textContent = Math.max(0, vidaJugador) + '%';
    document.getElementById('vida-enemigo').style.width = Math.max(0, vidaIA) + '%';
    document.getElementById('perc-enemigo').textContent = Math.max(0, vidaIA) + '%';

    if (vidaJugador <= 0 || vidaIA <= 0) {
        finalizado = true;
        const m = document.getElementById('mensaje-ko');
        m.textContent = vidaJugador <= 0 ? "IA WIN" : "PLAYER WIN";
        m.style.display = "block";
    }
}

document.getElementById('btn-reiniciar').addEventListener('click', () => location.reload());
Render.run(render);
Runner.run(Runner.create(), engine);