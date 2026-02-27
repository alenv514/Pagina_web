// ==========================
// CONFIGURACIÓN BASE
// ==========================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

// ==========================
// CONFIGURACIÓN DE PISO Y PLATAFORMAS
// ==========================

let floorImage = null;
const floorConfig = {
    width: 9244,
    height: 100,
};

const platforms = [
    { x: 180, y: 260, width: 220, height: 40, image: null },
    { x: 600, y: 200, width: 220, height: 40, image: null }
];

// Cargar imagen del piso
const floorImg = new Image();
floorImg.src = "Escenarios/piso.png";
floorImg.onload = () => {
    floorImage = floorImg;
};

// Cargar imagen de plataformas
platforms.forEach(p => {
    p.image = new Image();
    p.image.src = "Escenarios/piso.png";
});

// ==========================
// VARIABLES GLOBALES
// ==========================

let gameState = "waitingForStart"; // waitingForStart, roundStart, playing, paused, gameOver
let currentRound = 1;
let totalRounds = 10;
let enemiesDefeatedThisRound = 0;
let enemiesRemainingInRound = 0;
let enemiesToSpawnThisRound = 0;
let enemiesSpawnedThisRound = 0;
let heartDrops = [];
let backgroundImage = null;
let playerMaxLife = 100; // ⬅️ MODIFICA ESTO PARA CAMBIAR LA VIDA DEL JUGADOR
let currentUsername = "Guerrero";
let roundStartTime = 0;
let roundStartDelay = 2000; // 2 segundos
let waitingForKeyPress = false;
let canStartRound = false;
// Rondas infinitas eliminadas por diseño: solo 10 rondas (ronda 10 = boss)
let usernameInput = ""; // Input para el nombre del usuario

const ground = {
    x: 0,
    y: 420,
    width: floorConfig.width,
    height: floorConfig.height
};

// Configuración de ritmo de rondas y spawn simultáneo
const enemiesPerRound = 10;
const baseSimultaneousEnemies = 3;
function getMaxSimultaneousEnemies(roundNumber) {
    // Escala de forma suave con la ronda, con tope para no saturar
    return Math.min(baseSimultaneousEnemies + Math.floor((roundNumber - 1) / 2), 6);
}
const debugSpawnOverlay = true; // muestra conteo de spawn en pantalla

// Curación por corazones
const heartHealAmount = 30;
const heartLifetimeMs = 12000;

// Cargar imagen de fondo
const img = new Image();
img.src = "Escenarios/Escenario3.jpeg";
img.onload = () => {
    backgroundImage = img;
};

// Cargar imágenes de las espadas
let playerSwordImage = null;
let enemySwordImage = null;

const playerSwordImg = new Image();
playerSwordImg.src = "Escenarios/Espada.png";
playerSwordImg.onload = () => {
    playerSwordImage = playerSwordImg;
};

// Los enemigos usan la misma espada que el jugador
const playerSwordImg2 = new Image();
playerSwordImg2.src = "Escenarios/Espada.png";
playerSwordImg2.onload = () => {
    enemySwordImage = playerSwordImg2;
};

// ==========================
// CARGAR SPRITES DE ORCOS PARA ENEMIGOS
// ==========================

function loadAnimationFrames(spriteType, animationName, frameCount) {
    const frames = [];
    const basePath = `Sprites/orcos/${spriteType}/PNG/PNG Sequences/${animationName}`;
    
    for (let i = 0; i < frameCount; i++) {
        const paddedIndex = String(i).padStart(3, '0');
        const img = new Image();
        img.src = `${basePath}/0_${spriteType}_${animationName}_${paddedIndex}.png`;
        frames.push(img);
    }
    
    return frames;
}

// Función para cargar animaciones del jugador Wraith
function loadPlayerAnimationFrames(animationName, frameCount) {
    const frames = [];
    const basePath = `Sprites/Jugador/PNG/Wraith_01/PNG Sequences/${animationName}`;
    
    for (let i = 0; i < frameCount; i++) {
        const paddedIndex = String(i).padStart(3, '0');
        const img = new Image();
        
        // Las animaciones tienen nombres diferentes
        let fileName = "";
        if (animationName === "Idle") {
            fileName = `Wraith_01_Idle_${paddedIndex}.png`;
        } else if (animationName === "Attacking") {
            fileName = `Wraith_01_Attack_${paddedIndex}.png`;
        } else if (animationName === "Walking") {
            fileName = `Wraith_01_Moving Forward_${paddedIndex}.png`;
        } else if (animationName === "Hurt") {
            fileName = `Wraith_01_Hurt_${paddedIndex}.png`;
        } else if (animationName === "Dying") {
            fileName = `Wraith_01_Dying_${paddedIndex}.png`;
        }
        
        img.src = `${basePath}/${fileName}`;
        frames.push(img);
    }
    
    return frames;
}

// Animaciones de ORC (para enemigos AGGRESSIVE)
let orcAnimations = {
    idle: loadAnimationFrames("Orc", "Idle", 18),
    running: loadAnimationFrames("Orc", "Running", 12),
    slashing: loadAnimationFrames("Orc", "Slashing", 12)
};

// Animaciones de GOBLIN (para enemigos DEFENSIVE)
let goblinAnimations = {
    idle: loadAnimationFrames("Goblin", "Idle", 18),
    running: loadAnimationFrames("Goblin", "Running", 12),
    slashing: loadAnimationFrames("Goblin", "Slashing", 12)
};

// Animaciones de OGRE (para enemigos RANGED)
let ogreAnimations = {
    idle: loadAnimationFrames("Ogre", "Idle", 18),
    running: loadAnimationFrames("Ogre", "Running", 12),
    slashing: loadAnimationFrames("Ogre", "Slashing", 12)
};

// ==========================
// CARGAR SPRITES DEL JUGADOR (Wraith con animaciones secuenciales)
// ==========================

// Construir animaciones del jugador usando Wraith_01
let playerAnimations = {
    idle: loadPlayerAnimationFrames("Idle", 12),
    run: loadPlayerAnimationFrames("Walking", 12),
    attack: loadPlayerAnimationFrames("Attacking", 12),
    hurt: loadPlayerAnimationFrames("Hurt", 12),
    death: loadPlayerAnimationFrames("Dying", 15)
};

// ==========================
// SINGLETON GAME MANAGER
// ==========================

class GameManager {
    constructor() {
        if (GameManager.instance) return GameManager.instance;

        this.enemies = [];
        this.defeatedStack = [];
        this.score = 0;
        this.playerLife = 100;
        this.round = 1;
        this.money = 0; // Sistema de dinero
        
        // Sistema de mejoras
        this.upgrades = {
            healthLevel: 0,
            damageLevel: 0,
            healthCost: 1000,
            damageCost: 200
        };

        GameManager.instance = this;
    }

    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    
    addMoney(amount) {
        this.money += amount;
    }
    
    buyUpgrade(type) {
        if (type === "health") {
            if (this.money >= this.upgrades.healthCost) {
                this.money -= this.upgrades.healthCost;
                this.upgrades.healthLevel++;
                player.maxLife += 200;
                player.life = player.maxLife;
                // El costo de vida sigue siendo fijo
                return true;
            }
        } else if (type === "damage") {
            if (this.money >= this.upgrades.damageCost) {
                this.money -= this.upgrades.damageCost;
                this.upgrades.damageLevel++;
                player.damage += 9.5;
                // El costo de daño se incrementa para la siguiente mejora
                this.upgrades.damageCost += 200;
                return true;
            }
        }
        return false;
    }
}

const game = GameManager.getInstance();

// ==========================
// FUNCIONES AUXILIARES DE COLISIÓN
// ==========================

// Obtener la posición de punta de espada en pantalla
function getSwordTipPosition(entity, swordWidth, swordHeight) {
    // Anclamos la mano en una zona coherente del sprite en vez de usar offsets mágicos
    const handX = entity.x + (entity.facingRight ? entity.width * 0.55 : entity.width * 0.45);
    const handY = entity.y + entity.height * 0.55;

    // Barrido de arco controlado: evita rotaciones completas que desalinean la hitbox
    const swingProgress = Math.min(1, entity.attackFrame / Math.max(1, entity.attackDuration));
    const swingStart = entity.facingRight ? -0.35 * Math.PI : Math.PI + 0.35 * Math.PI;
    const swingEnd = entity.facingRight ? 0.65 * Math.PI : Math.PI - 0.65 * Math.PI;
    const angle = swingStart + (swingEnd - swingStart) * swingProgress;

    const reach = swordHeight + 10; // ligero extra para cubrir la hoja completa
    const tipX = handX + Math.cos(angle) * reach;
    const tipY = handY + Math.sin(angle) * reach;
    
    return { handX, handY, tipX, tipY, angle };
}

// Obtener la hitbox de la espada como segmento de línea (desde mano hasta punta)
function getSwordHitbox(entity, swordWidth, swordHeight) {
    const { handX, handY, tipX, tipY } = getSwordTipPosition(entity, swordWidth, swordHeight);
    
    return {
        // Representar la espada como un segmento de línea de mano a punta
        startX: handX,       // Inicio de la espada (en la mano)
        startY: handY,
        endX: tipX,          // Final de la espada (punta)
        endY: tipY,
        width: swordWidth    // Ancho de colisión adicional
    };
}

// Verificar colisión línea-rectángulo (espada vs cuerpo del enemigo)
// Más preciso que círculo: detecta si el segmento de la espada toca el rectángulo
function lineRectCollision(lineStartX, lineStartY, lineEndX, lineEndY, lineWidth, rectX, rectY, rectWidth, rectHeight) {
    // Expandir el rectángulo por el ancho de la fuente de colisión (espada)
    const expandedX = rectX - lineWidth / 2;
    const expandedY = rectY - lineWidth / 2;
    const expandedWidth = rectWidth + lineWidth;
    const expandedHeight = rectHeight + lineWidth;
    
    // Verificar si algún punto de la línea está dentro del rectángulo expandido
    // Primero, comprobar ambos extremos de la línea
    if (lineStartX >= expandedX && lineStartX <= expandedX + expandedWidth &&
        lineStartY >= expandedY && lineStartY <= expandedY + expandedHeight) {
        return true;
    }
    
    if (lineEndX >= expandedX && lineEndX <= expandedX + expandedWidth &&
        lineEndY >= expandedY && lineEndY <= expandedY + expandedHeight) {
        return true;
    }
    
    // Comprobar si la línea intersecta con los bordes del rectángulo
    // Calcular el punto más cercano en el segmento de línea a cada esquina del rectángulo
    const dx = lineEndX - lineStartX;
    const dy = lineEndY - lineStartY;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared > 0) {
        // Comprobar colisión con los 4 bordes del rectángulo
        const cornersX = [expandedX, expandedX + expandedWidth, expandedX, expandedX + expandedWidth];
        const cornersY = [expandedY, expandedY, expandedY + expandedHeight, expandedY + expandedHeight];
        
        for (let i = 0; i < 4; i++) {
            const t = Math.max(0, Math.min(1, ((cornersX[i] - lineStartX) * dx + (cornersY[i] - lineStartY) * dy) / lengthSquared));
            const closestX = lineStartX + t * dx;
            const closestY = lineStartY + t * dy;
            
            if (closestX >= expandedX && closestX <= expandedX + expandedWidth &&
                closestY >= expandedY && closestY <= expandedY + expandedHeight) {
                return true;
            }
        }
    }
    
    return false;
}

// Función alternativa más simple basada en círculo (fallback)
function circleRectCollision(circleX, circleY, radius, rectX, rectY, rectWidth, rectHeight) {
    // Encontrar el punto más cercano del rectángulo al círculo
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    
    // Calcular la distancia entre el círculo y el punto más cercano
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < (radius * radius);
}

// Hurtbox acolchada para ajustar colisiones al sprite real
function getEntityHurtbox(entity) {
    const padX = entity.hurtbox?.padX ?? 0;
    const padY = entity.hurtbox?.padY ?? 0;
    return {
        x: entity.x + padX,
        y: entity.y + padY,
        width: Math.max(0, entity.width - padX * 2),
        height: Math.max(0, entity.height - padY * 2)
    };
}

// ==========================
// OBJETOS: CORAZONES DE CURACIÓN
// ==========================

function spawnHeart(x, y) {
    const size = 18;
    heartDrops.push({
        x: x - size / 2,
        y: y - size / 2,
        size,
        vy: 0,
        born: performance.now()
    });
}

function updateHearts() {
    const now = performance.now();
    heartDrops = heartDrops.filter(h => {
        if (now - h.born > heartLifetimeMs) return false;
        // gravedad simple
        h.vy += 0.35;
        h.y += h.vy;
        const floorY = ground.y - h.size;
        if (h.y > floorY) {
            h.y = floorY;
            h.vy = 0;
        }

        // recogida por el jugador (AABB)
        const collected =
            h.x < player.x + player.width &&
            h.x + h.size > player.x &&
            h.y < player.y + player.height &&
            h.y + h.size > player.y;
        if (collected) {
            player.life = Math.min(player.maxLife, player.life + heartHealAmount);
            return false;
        }
        return true;
    });
}

function drawHeartsDrops() {
    heartDrops.forEach(h => {
        const s = h.size;
        const cx = h.x + s / 2;
        const cy = h.y + s / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(s / 20, s / 20);
        ctx.fillStyle = "#FF4D6D";
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.quadraticCurveTo(0, -6, -10, -6);
        ctx.quadraticCurveTo(-20, -6, -20, 6);
        ctx.quadraticCurveTo(-20, 18, 0, 30);
        ctx.quadraticCurveTo(20, 18, 20, 6);
        ctx.quadraticCurveTo(20, -6, 10, -6);
        ctx.quadraticCurveTo(0, -6, 0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

// ==========================
// PLAYER (CON GRAVEDAD Y ESPADA)
// ==========================

class Player {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.width = 40;
        this.height = 60;

        this.speed = 5;
        this.velY = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.onGround = false;
        this.onPlatform = false;
        
        // Sistema de ataque con espada
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRadius = 60;
        this.attackDuration = 10;
        this.attackFrame = 0;
        this.damage = 30; // Daño base del jugador (aumentado)
        this.life = playerMaxLife;
        this.maxLife = playerMaxLife;
        this.hurtbox = { padX: 2, padY: 2 }; // hurtbox menos recortada para que los enemigos sí alcancen
        
        // Orientación del personaje
        this.facingRight = true;
        
        // ⚔️ PARÁMETROS DE LA ESPADA - AJUSTA AQUÍ EL TAMAÑO Y ALCANCE
        // swordWidth: ancho de la espada (afecta el área de daño horizontal)
        // swordHeight: largo de la espada (afecta cuán lejos llega el ataque)
        // Aumenta estos valores para que la espada sea más grande/larga
        // Disminuye para que sea más pequeña/corta
        this.swordWidth = 30;   // Ancho (ajusta si quieres espada más/menos ancha)
        this.swordHeight = 40;  // Largo (ajusta si quieres alcance más/menos lejano)
        
        // Tracking de enemigos dañados en este ataque
        this.damagedEnemiesThisAttack = [];
        
        // Flag para determinar si se está moviendo
        this.isMoving = false;
        
        // Animaciones del jugador (usar la misma API que en enemigos)
        this.sprite = playerAnimations;
        this.spriteFrame = 0;
        this.spriteAnimSpeed = 0.25;
    }

    draw() {
        // Determinar animación actual
        let currentAnimation = "idle";
        if (this.isAttacking) {
            currentAnimation = "attack";
        } else if (this.isMoving && this.onGround) {
            currentAnimation = "run";
        } else {
            currentAnimation = "idle";
        }

        // Avanzar frame de animación
        const frames = this.sprite[currentAnimation] || [null];
        this.spriteFrame = (this.spriteFrame + this.spriteAnimSpeed) % Math.max(1, frames.length);
        const spriteImg = frames[Math.floor(this.spriteFrame) % frames.length];

        // ⚔️ AJUSTA EL TAMAÑO Y POSICIÓN DEL SPRITE DEL JUGADOR AQUÍ
        // Dibujar el sprite del jugador (escalado para verse bien)
        
        // TAMAÑO DEL SPRITE
        // Aumenta estos valores para que el personaje sea más grande
        // Disminuye para que sea más pequeño
        // Mantén ambos valores proporcionales para no distorsionar
        const spriteWidth = 100;  // Ancho del sprite en píxeles (aumenta/disminuye)
        const spriteHeight = 120; // Alto del sprite en píxeles (aumenta/disminuye)
        
        // POSICIÓN DEL SPRITE EN PANTALLA
        // drawX: posición horizontal
        //   - this.x: posición del jugador
        //   - -30: ajuste hacia la izquierda
        //   Aumenta el número negativo para mover más a la izquierda (-50)
        //   Disminuye para mover más a la derecha (-10)
        // drawY: posición vertical
        //   - this.y: posición vertical del jugador
        //   - -40: ajuste hacia arriba
        //   Aumenta el número negativo para subir el sprite (-60)
        //   Disminuye para bajar el sprite (-20)
        const drawX = this.x - 30;  // Posición X (ajusta si se ve desalineado horizontalmente)
        const drawY = this.y - 40;  // Posición Y (ajusta si se ve desalineado verticalmente)

        if (spriteImg && spriteImg.complete) {
            ctx.save();
            if (!this.facingRight) {
                ctx.translate(drawX + spriteWidth, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(spriteImg, 0, 0, spriteWidth, spriteHeight);
            } else {
                ctx.drawImage(spriteImg, drawX, drawY, spriteWidth, spriteHeight);
            }
            ctx.restore();
        } else {
            // Fallback si el sprite no carga
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Barra de vida del jugador
        this.drawLifeBar();

        // Dibujar espada si está atacando
        if (this.isAttacking) {
            this.drawSwordAttack();
        }
    }

    drawLifeBar() {
        // Vida mostrada en el navbar con corazones
    }

    drawSwordAttack() {
        if (playerSwordImage) {
            const { handX, handY, angle } = getSwordTipPosition(this, this.swordWidth, this.swordHeight);
            
            ctx.save();
            ctx.translate(handX, handY);
            ctx.rotate(angle);
            const flip = this.facingRight ? 1 : -1;
            ctx.scale(flip, 1);
            ctx.drawImage(playerSwordImage, -this.swordWidth / 2, -this.swordHeight, this.swordWidth, this.swordHeight);
            
            ctx.restore();
        }
    }

    move(keys) {
        // Actualizar flag de movimiento
        this.isMoving = keys["w"] || keys["W"] || keys["a"] || keys["A"] || keys["s"] || keys["S"] || keys["d"] || keys["D"];
        
        if (keys["w"] || keys["W"]) this.y -= this.speed;
        if (keys["s"] || keys["S"]) this.y += this.speed;
        if (keys["a"] || keys["A"]) {
            this.x -= this.speed;
            this.facingRight = false;
        }
        if (keys["d"] || keys["D"]) {
            this.x += this.speed;
            this.facingRight = true;
        }

        // SALTO
        if ((keys["w"] || keys["W"]) && (this.onGround || this.onPlatform)) {
            this.velY = this.jumpForce;
            this.onGround = false;
            this.onPlatform = false;
        }

        // GRAVEDAD
        this.velY += this.gravity;
        this.y += this.velY;

        // COLISIÓN CON SUELO
        this.onGround = false;
        if (this.y + this.height >= ground.y) {
            this.y = ground.y - this.height;
            this.velY = 0;
            this.onGround = true;
        }

        // COLISIÓN CON PLATAFORMAS
        this.onPlatform = false;
        platforms.forEach(platform => {
            if (this.velY >= 0 &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + 20 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) {
                this.y = platform.y - this.height;
                this.velY = 0;
                this.onPlatform = true;
            }
        });

        // Limites del canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= this.attackDuration) {
                this.isAttacking = false;
                this.attackFrame = 0;
                this.damagedEnemiesThisAttack = []; // Resetear enemies dañados
            }
        }
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackFrame = 0;
            this.attackCooldown = 30;
            this.damagedEnemiesThisAttack = []; // Resetear enemies dañados en nuevo ataque
        }
    }

    takeDamage(damage) {
        this.life -= damage;
        if (this.life < 0) this.life = 0;
    }
}

const player = new Player();

// ==========================
// ENEMY CLASS CON IA MEJORADA
// ==========================

class Enemy {
    constructor(x, y, isBoss = false) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 70;
        this.speed = 2.5;
        this.isBoss = isBoss;
        
        // Tipos de enemigos con comportamientos diferentes
        const enemyTypes = ["aggressive", "defensive", "ranged"];
        this.type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Vida y daño escalable por ronda
        if (isBoss) {
            this.baseLife = 5000;
            this.damage = 50;
            this.attackCooldownBase = 60; // 1 segundo entre ataques
        } else {
            this.baseLife = 100;
            this.damage = 5;
            
            // Modificadores según tipo
            if (this.type === "aggressive") {
                this.baseLife *= 0.8;
                this.damage *= 1.3;
                this.attackCooldownBase = 40; // Ataca más rápido
            } else if (this.type === "defensive") {
                this.baseLife *= 1.3;
                this.damage *= 0.7;
                this.attackCooldownBase = 80; // Ataca más lento
            } else if (this.type === "ranged") {
                this.baseLife *= 0.9;
                this.damage *= 0.9;
                this.attackCooldownBase = 50;
            }
            
            // Escala en rondas normales (no hay rondas infinitas)
            this.baseLife = this.baseLife * (1 + (currentRound - 1) * 0.8);
            this.damage = this.damage * (1 + (currentRound - 1) * 0.4);
        }
        
        this.life = this.baseLife;
        this.maxLife = this.life;

        this.velY = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.onGround = false;
        this.jumpCooldown = 0;
        this.attackCooldown = 0;
        this.attackCooldownMax = this.attackCooldownBase;
        this.attackRadius = 20;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackDuration = 5;
        this.hurtbox = { padX: 8, padY: 6 }; // recorta el cuerpo para colisiones más justas
        
        // IA mejorada
        this.detectionRange = this.type === "ranged" ? 800 : 600;
        this.preferredDistance = this.type === "ranged" ? 150 : 80; // Distancia preferida según tipo
        this.isAlerted = false;
        this.alertTimer = 0;
        
        // Orientación del enemigo
        this.facingRight = true;
        
        // Parámetros de la espada
        this.swordWidth = 30;
        this.swordHeight = 40;
        this.hurtbox = { padX: 4, padY: 3 }; // hurtbox menos recortada

        // Tracking de jugador dañado en este ataque
        this.hasHitPlayerThisAttack = false;
        
        // Asignar animaciones según tipo de enemigo
        if (this.type === "aggressive") {
            this.sprite = orcAnimations;
            this.spriteType = "Orc";
        } else if (this.type === "defensive") {
            this.sprite = goblinAnimations;
            this.spriteType = "Goblin";
        } else if (this.type === "ranged") {
            this.sprite = ogreAnimations;
            this.spriteType = "Ogre";
        }
        
        // Índice de frame actual para animación
        this.spriteFrame = 0;
    }

    update() {
        // OPTIMIZADO: Usar distancia cuadrada sin sqrt
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const detectionRangeSq = this.detectionRange * this.detectionRange;
        
        // ===== SIEMPRE PERSEGUIR AL JUGADOR A MUERTE =====
        const distToPlayer = Math.sqrt(distSq);
        
        // Detección mejorada: vista periférica e instinto
        if (distSq < detectionRangeSq) {
            this.isAlerted = true;
            this.alertTimer = 400; // Mantener alerta por más tiempo
        } else if (distToPlayer < 450 && Math.random() > 0.9) {
            // Instinto de caza: a veces detectan incluso fuera de rango
            this.isAlerted = true;
            this.alertTimer = 200;
        }
        
        if (this.alertTimer > 0) {
            this.alertTimer--;
        } else {
            this.isAlerted = false;
        }
        
        // Siempre mira hacia donde está el jugador (incluso sin alertarse)
        if (dx > 0) {
            this.facingRight = true;
        } else if (dx < 0) {
            this.facingRight = false;
        }
        
        // PERSECUCIÓN AGRESIVA - SIN LÍMITES, SIEMPRE PERSIGUE
        const isChasing = this.isAlerted || distToPlayer < 500; // Rango extendido de persecución
        
        if (isChasing) {
            
            if (this.type === "aggressive") {
                // Agresivo: persigue y ataca constantemente, sin límites
                this.x += (dx > 0 ? this.speed * 1.3 : -this.speed * 1.3);
                
                // Sistema mejorado de saltos: salta cuando hay obstáculo o el jugador está más alto
                if (this.onGround && this.jumpCooldown <= 0) {
                    // Salta si el jugador está bastante más alto
                    if (dy < -50) {
                        this.velY = this.jumpForce;
                        this.onGround = false;
                        this.jumpCooldown = 25;
                    }
                    // O salta para evitar plataformas/obstáculos
                    else if (Math.abs(dx) > 15 && Math.random() > 0.85) {
                        this.velY = this.jumpForce;
                        this.onGround = false;
                        this.jumpCooldown = 30;
                    }
                }
                
                // Ataca cada vez que está lo suficientemente cerca
                if (distToPlayer < 120 && this.attackCooldown <= 0) {
                    this.isAttacking = true;
                    this.attackFrame = 0;
                    this.hasHitPlayerThisAttack = false; // Reiniciar para nuevo ataque
                    this.attackCooldown = this.attackCooldownMax;
                }
                
            } else if (this.type === "defensive") {
                // Defensivo: persigue pero más cauteloso, con mejor evasión
                this.x += (dx > 0 ? this.speed * 0.95 : -this.speed * 0.95);
                
                // Salta inteligentemente para evitar ser alcanzado
                if (this.onGround && this.jumpCooldown <= 0) {
                    if (distToPlayer < 110 && dx * (player.velY < 0 ? 1 : -1) > 0) {
                        // Salta para escapar si el jugador está cerca y se acerca
                        this.velY = this.jumpForce * 1.2;
                        this.onGround = false;
                        this.jumpCooldown = 35;
                    } else if (dy < -45) {
                        // Salta para alcanzar si el jugador está bastante arriba
                        this.velY = this.jumpForce;
                        this.onGround = false;
                        this.jumpCooldown = 35;
                    }
                }
                
                // Ataca cuando tiene oportunidad desde un ángulo seguro
                if (distToPlayer < 110 && this.attackCooldown <= 0) {
                    this.isAttacking = true;
                    this.attackFrame = 0;
                    this.hasHitPlayerThisAttack = false; // Reiniciar para nuevo ataque
                    this.attackCooldown = this.attackCooldownMax;
                }
                
            } else if (this.type === "ranged") {
                // Rango: mantiene distancia estratégica y ataca constantemente
                const optimalDistance = 110;
                
                if (distToPlayer > optimalDistance + 25) {
                    // Demasiado lejos, se acerca
                    this.x += (dx > 0 ? this.speed * 1.05 : -this.speed * 1.05);
                } else if (distToPlayer < optimalDistance - 25) {
                    // Demasiado cerca, se aleja
                    this.x += (dx > 0 ? -this.speed * 0.85 : this.speed * 0.85);
                }
                
                // Salta para maniobrar y esquivar
                if (this.onGround && this.jumpCooldown <= 0) {
                    if (dy < -35) {
                        // Salta si el jugador está más arriba
                        this.velY = this.jumpForce;
                        this.onGround = false;
                        this.jumpCooldown = 40;
                    } else if (distToPlayer > 95 && distToPlayer < 120 && Math.random() > 0.70) {
                        // Salta para esquivar mientras ataca
                        this.velY = this.jumpForce * 0.95;
                        this.onGround = false;
                        this.jumpCooldown = 35;
                    }
                }
                
                // Ataca constantemente cuando está en rango óptimo
                if (distToPlayer < 145 && this.attackCooldown <= 0) {
                    this.isAttacking = true;
                    this.attackFrame = 0;
                    this.hasHitPlayerThisAttack = false; // Reiniciar para nuevo ataque
                    this.attackCooldown = this.attackCooldownMax;
                }
            }
        } else {
            // Si no está persiguiendo, patrulla lentamente y se prepara
            if (Math.random() > 0.92) {
                this.x += Math.random() > 0.5 ? this.speed * 0.4 : -this.speed * 0.4;
            }
            
            // Patrullaje vertical ocasional
            if (this.onGround && Math.random() > 0.95 && this.jumpCooldown <= 0) {
                this.velY = this.jumpForce * 0.7;
                this.onGround = false;
                this.jumpCooldown = 100;
            }
        }

        // GRAVEDAD
        this.velY += 0.6;
        this.y += this.velY;
        this.jumpCooldown--;
        this.attackCooldown--;

        // COLISIÓN CON SUELO
        if (this.y + this.height >= ground.y) {
            this.y = ground.y - this.height;
            this.velY = 0;
            this.onGround = true;
        }

        // COLISIÓN CON PLATAFORMAS
        platforms.forEach(p => {
            if (this.velY >= 0 &&
                this.y + this.height >= p.y &&
                this.y + this.height <= p.y + 25 &&
                this.x + this.width > p.x &&
                this.x < p.x + p.width) {
                this.y = p.y - this.height;
                this.velY = 0;
                this.onGround = true;
            }
        });
        
        // COLISIÓN CON OTROS ENEMIGOS - EVITA SOLAPARSE
        game.enemies.forEach((otherEnemy) => {
            if (otherEnemy !== this) {
                const overlapX = (this.width + otherEnemy.width) / 2;
                const overlapY = (this.height + otherEnemy.height) / 2;
                
                const distX = (this.x + this.width / 2) - (otherEnemy.x + otherEnemy.width / 2);
                const distY = (this.y + this.height / 2) - (otherEnemy.y + otherEnemy.height / 2);
                
                const absDistX = Math.abs(distX);
                const absDistY = Math.abs(distY);
                
                // Si hay solapamiento
                if (absDistX < overlapX && absDistY < overlapY) {
                    // Empujar hacia afuera
                    if (absDistX > absDistY) {
                        // Solapamiento horizontal
                        if (distX > 0) {
                            this.x += 2;
                        } else {
                            this.x -= 2;
                        }
                    } else {
                        // Solapamiento vertical
                        if (distY > 0) {
                            this.y -= 1;
                        } else {
                            this.y += 1;
                        }
                    }
                }
            }
        });

        // Límites del canvas
        if (this.x < -50) this.x = -50;
        if (this.x + this.width > canvas.width + 50) this.x = canvas.width + 10;
        
        // COLISIÓN CON EL JUGADOR - EVITA ATRAVESARLO
        const playerOverlapX = (this.width + player.width) / 2;
        const playerOverlapY = (this.height + player.height) / 2;
        
        const playerDistX = (this.x + this.width / 2) - (player.x + player.width / 2);
        const playerDistY = (this.y + this.height / 2) - (player.y + player.height / 2);
        
        const playerAbsDistX = Math.abs(playerDistX);
        const playerAbsDistY = Math.abs(playerDistY);
        
        // Si hay solapamiento con el jugador
        if (playerAbsDistX < playerOverlapX && playerAbsDistY < playerOverlapY) {
            // Empujar hacia afuera (prioridad horizontal)
            if (playerAbsDistX > playerAbsDistY) {
                // Empujar horizontalmente
                if (playerDistX > 0) {
                    this.x += 3; // Empujar a la derecha
                } else {
                    this.x -= 3; // Empujar a la izquierda
                }
            } else {
                // Empujar verticalmente
                if (playerDistY > 0) {
                    this.y -= 2;
                } else {
                    this.y += 2;
                }
            }
        }

        // ACTUALIZAR ATAQUE
        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= this.attackDuration) {
                this.isAttacking = false;
                this.hasHitPlayerThisAttack = false; // Resetear tracking de daño
            }
        }
    }

    draw() {
        // Determinar qué animación mostrar basada en el estado
        let currentAnimation = "idle";
        
        if (this.isAttacking) {
            currentAnimation = "slashing";
            this.spriteFrame = (this.spriteFrame + 1) % this.sprite.slashing.length;
        } else if (this.isAlerted) {
            currentAnimation = "running";
            this.spriteFrame = (this.spriteFrame + 1) % this.sprite.running.length;
        } else {
            currentAnimation = "idle";
            this.spriteFrame = (this.spriteFrame + 1) % this.sprite.idle.length;
        }
        
        // Obtener la imagen del sprite actual
        const spriteImg = this.sprite[currentAnimation][Math.floor(this.spriteFrame) % this.sprite[currentAnimation].length];
        
        // Dibujar el sprite (si está cargado)
        if (spriteImg && spriteImg.complete) {
            ctx.save();

            // Dibujar con tamaño consistente independientemente de la dirección
            const drawWidth = this.width + 20;   // puedes ajustar este extra si quieres sprites más grandes
            const drawHeight = this.height + 20;
            const drawX = this.x - 10;           // offset para centrar la imagen respecto a la hitbox
            const drawY = this.y - 20;

            if (!this.facingRight) {
                // Para voltear, trasladamos al borde derecho del área de dibujo y escalamos -1
                ctx.translate(drawX + drawWidth, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(spriteImg, 0, 0, drawWidth, drawHeight);
            } else {
                ctx.drawImage(spriteImg, drawX, drawY, drawWidth, drawHeight);
            }

            ctx.restore();
        }
        
        // Mostrar símbolo del tipo de enemigo encima del sprite
        let typeSymbol = "•";
        
        if (this.type === "aggressive") {
            typeSymbol = "⚡"; // Símbolo de agresivo
        } else if (this.type === "defensive") {
            typeSymbol = "🛡"; // Símbolo de defensivo
        } else if (this.type === "ranged") {
            typeSymbol = "🏹"; // Símbolo de rango
        }
        
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typeSymbol, this.x + this.width / 2, this.y - 30);

        this.drawLifeBar();

        if (this.isAttacking) {
            this.drawSwordAttack();
        }
    }

    drawLifeBar() {
        const barX = this.x;
        const barY = this.y - 15;

        ctx.fillStyle = "red";
        ctx.fillRect(barX, barY, this.width, 4);

        ctx.fillStyle = "lime";
        ctx.fillRect(barX, barY, (this.life / this.maxLife) * this.width, 4);
    }

    drawSwordAttack() {
        if (enemySwordImage) {
            const { handX, handY, angle } = getSwordTipPosition(this, this.swordWidth, this.swordHeight);
            
            ctx.save();
            ctx.translate(handX, handY);
            ctx.rotate(angle);
            // Mantener escala consistente: usar flip según orientación (1 o -1)
            const flip = this.facingRight ? 1 : -1;
            ctx.scale(flip, 1);
            ctx.drawImage(enemySwordImage, -this.swordWidth / 2, -this.swordHeight, this.swordWidth, this.swordHeight);
            
            ctx.restore();
        }
    }

    takeDamage(damage) {
        this.life -= damage;
        return this.life <= 0;
    }
}

// ==========================
// BULLET (Removido - Usamos espada)
// ==========================

// Sistema de rondas y spawn está ahora en spawn.js para aislar y depurar

// ==========================
// COLISIONES Y DAÑO
// ==========================

function checkSwordCollisions() {
    // Limpiar enemigos fuera de pantalla para evitar que bloqueen el conteo
    game.enemies = game.enemies.filter(enemy => {
        const offscreen = enemy.x < -120 || enemy.x > canvas.width + 120 || enemy.y > canvas.height + 200;
        if (offscreen) {
            enemiesDefeatedThisRound = Math.min(enemiesRemainingInRound, enemiesDefeatedThisRound + 1);
            return false;
        }
        return true;
    });

    // Failsafe: si hay enemigos pero ninguno visible, mover el primero a un punto visible
    if (game.enemies.length > 0) {
        const anyVisible = game.enemies.some(e => e.x >= 0 && e.x <= canvas.width && e.y >= 0 && e.y <= canvas.height);
        if (!anyVisible) {
            const e = game.enemies[0];
            e.x = canvas.width / 2;
            e.y = ground.y - 100;
        }
    }

    // ========== ATAQUE DEL JUGADOR ==========
    if (player.isAttacking) {
        // Obtener hitbox de la espada del jugador (segmento de línea desde mano hasta punta)
        const swordHitbox = getSwordHitbox(player, player.swordWidth, player.swordHeight);
        
        game.enemies.forEach((enemy, index) => {
            // Verificar colisión espada-cuerpo solo si no hemos dañado este enemigo en este ataque
            if (!player.damagedEnemiesThisAttack.includes(enemy)) {
                const enemyBox = getEntityHurtbox(enemy);
                // ⚔️ COLISIÓN PRECISA: usar línea-rectángulo en lugar de círculo
                // Esto hace que la espada solo golpee si realmente alcanza al enemigo
                const collision = lineRectCollision(
                    swordHitbox.startX,
                    swordHitbox.startY,
                    swordHitbox.endX,
                    swordHitbox.endY,
                    swordHitbox.width,
                    enemyBox.x, 
                    enemyBox.y, 
                    enemyBox.width, 
                    enemyBox.height
                );
                
                if (collision) {
                    // Registrar que este enemigo fue dañado en este ataque
                    player.damagedEnemiesThisAttack.push(enemy);
                    
                    // Aplicar daño
                    if (enemy.takeDamage(player.damage)) {
                        // Enemigo derrotado
                        const randomDrop = Math.random();
                        let moneyReward = 0;
                        
                        if (randomDrop < 0.5) moneyReward = 1;
                        else if (randomDrop < 0.75) moneyReward = 6;
                        else if (randomDrop < 0.9) moneyReward = 10;
                        else moneyReward = 50;
                        
                        game.addMoney(moneyReward);
                        game.defeatedStack.push(enemy);
                        game.enemies.splice(index, 1);
                        game.score += 10;
                        enemiesDefeatedThisRound = Math.min(enemiesRemainingInRound, enemiesDefeatedThisRound + 1);
                            // Chance de corazón de curación (20%)
                            if (Math.random() < 0.2) {
                                spawnHeart(enemy.x, enemy.y);
                            }
                        
                        // No spawnear inmediatamente al matar: esperar a que ambos enemigos estén muertos
                    }
                }
            }
        });
    }

    // ========== ATAQUE DE LOS ENEMIGOS ==========
    game.enemies.forEach((enemy) => {
        // Chequeamos daño durante TODA la secuencia de ataque, una sola vez
        if (enemy.isAttacking && !enemy.hasHitPlayerThisAttack) {
            // Obtener hitbox de la espada del enemigo (segmento de línea desde mano hasta punta)
            const enemySwordHitbox = getSwordHitbox(enemy, enemy.swordWidth, enemy.swordHeight);
            const playerBox = getEntityHurtbox(player);
            
            // ⚔️ COLISIÓN PRECISA: usar línea-rectángulo en lugar de círculo
            // Esto hace que la espada del enemigo solo golpee si realmente alcanza al jugador
            const collision = lineRectCollision(
                enemySwordHitbox.startX,
                enemySwordHitbox.startY,
                enemySwordHitbox.endX,
                enemySwordHitbox.endY,
                enemySwordHitbox.width,
                playerBox.x, 
                playerBox.y, 
                playerBox.width, 
                playerBox.height
            );
            
            // Si hay colisión
            if (collision) {
                // Marcar que ya golpeamos
                enemy.hasHitPlayerThisAttack = true;
                // Aplicar daño al jugador
                player.takeDamage(enemy.damage);
            }
        }
    });
}

// ==========================
// INPUT SYSTEM
// ==========================

const keys = {};

document.addEventListener("keydown", e => {
    if (gameState === "waitingForStart") {
        // Lanzar la animación de inicio de ronda, no saltar directo al juego
        gameState = "roundStart";
        roundStartTime = Date.now();
        return;
    } else if (gameState === "roundStart") {
        return; // Evita saltarse la pantalla de inicio de ronda
    } else if (gameState === "playing") {
        keys[e.key] = true;
        
        if (e.key === "Escape") {
            gameState = "paused";
        }
    } else if (gameState === "paused") {
        keys[e.key] = true;
        
        if (e.key === "Escape") {
            gameState = "playing";
        }
    }
});

document.addEventListener("keyup", e => {
    keys[e.key] = false;
});

document.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (gameState === "gameOver") {
        const btn = restartButton;
        restartButton.isHovered = (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                                   mouseY >= btn.y && mouseY <= btn.y + btn.height);
    } else if (gameState === "paused") {
        // Detectar hover en botones de tienda
        shopButtons.health.isHovered = (mouseX >= shopButtons.health.x && mouseX <= shopButtons.health.x + shopButtons.health.width &&
                                        mouseY >= shopButtons.health.y && mouseY <= shopButtons.health.y + shopButtons.health.height);
        shopButtons.damage.isHovered = (mouseX >= shopButtons.damage.x && mouseX <= shopButtons.damage.x + shopButtons.damage.width &&
                                        mouseY >= shopButtons.damage.y && mouseY <= shopButtons.damage.y + shopButtons.damage.height);
        shopButtons.continue.isHovered = (mouseX >= shopButtons.continue.x && mouseX <= shopButtons.continue.x + shopButtons.continue.width &&
                                          mouseY >= shopButtons.continue.y && mouseY <= shopButtons.continue.y + shopButtons.continue.height);
        
        // Cambiar cursor
        if (shopButtons.health.isHovered || shopButtons.damage.isHovered || shopButtons.continue.isHovered) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "default";
        }
    }
});

document.addEventListener("mousedown", e => {
    if (e.button === 0) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        if (gameState === "playing") {
            player.attack();
        } else if (gameState === "paused") {
            // Botón VIDA
            if (clickX >= shopButtons.health.x && clickX <= shopButtons.health.x + shopButtons.health.width &&
                clickY >= shopButtons.health.y && clickY <= shopButtons.health.y + shopButtons.health.height) {
                game.buyUpgrade("health");
            }
            // Botón DAÑO
            else if (clickX >= shopButtons.damage.x && clickX <= shopButtons.damage.x + shopButtons.damage.width &&
                     clickY >= shopButtons.damage.y && clickY <= shopButtons.damage.y + shopButtons.damage.height) {
                game.buyUpgrade("damage");
            }
            // Botón CONTINUAR
            else if (clickX >= shopButtons.continue.x && clickX <= shopButtons.continue.x + shopButtons.continue.width &&
                     clickY >= shopButtons.continue.y && clickY <= shopButtons.continue.y + shopButtons.continue.height) {
                gameState = "playing";
            }
        } else if (gameState === "gameOver") {
            // Detectar click en el botón VOLVER A INICIAR
            const btn = restartButton;
            if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                clickY >= btn.y && clickY <= btn.y + btn.height) {
                // Reiniciar el juego
                game.score = 0;
                game.money = 0;
                game.upgrades = {
                    healthLevel: 0,
                    damageLevel: 0,
                    healthCost: 100,
                    damageCost: 200
                };
                player.life = 100;
                player.maxLife = 100;
                player.damage = 80; // mantener el daño base elevado en reinicio
                player.x = 100;
                player.y = 100;
                currentRound = 1;
                enemiesDefeatedThisRound = 0;
                enemiesRemainingInRound = 0;
                game.enemies = [];
                initializeRound(1);
                gameState = "waitingForStart";
            }
        }
    }
});

// ==========================
// GAME LOOP
// ==========================

function drawFloor() {
    if (floorImage) {
        // Dibujar piso cubriendo todo el ancho con la textura
        const tileWidth = 64; // Ajusta según el tamaño de la imagen
        for (let x = 0; x < canvas.width; x += tileWidth) {
            ctx.drawImage(floorImage, x, ground.y, tileWidth, ground.height);
        }
    } else {
        ctx.fillStyle = "rgba(101, 67, 33, 0.9)";
        ctx.fillRect(ground.x, ground.y, canvas.width, ground.height);
    }
}

function drawPlatforms() {
    platforms.forEach(platform => {
        if (platform.image && platform.image.complete) {
            // Llenar la plataforma completamente con la textura
            const tileWidth = 64;
            for (let x = platform.x; x < platform.x + platform.width; x += tileWidth) {
                const drawWidth = Math.min(tileWidth, platform.x + platform.width - x);
                ctx.drawImage(platform.image, x, platform.y, drawWidth, platform.height);
            }
        } else {
            // Color de relleno si la imagen no está cargada
            ctx.fillStyle = "#654321";
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Borde
            ctx.strokeStyle = "#3d2817";
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
    });
}

function drawLoginMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "gold";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ MEDIEVAL LEGEND ⚔️", canvas.width / 2, 80);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Ingresa tu nombre de usuario:", canvas.width / 2, 200);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(canvas.width / 2 - 150, 240, 300, 50);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(usernameInput + (Math.floor(Date.now() / 500) % 2 === 0 ? "|" : ""), canvas.width / 2 - 140, 270);

    ctx.textAlign = "center";
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Presiona ENTER para continuar", canvas.width / 2, 350);
}

function drawWaitingScreen() {
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#1e3c72";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 70px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MEDIEVAL LEGEND", canvas.width / 2, canvas.height / 2 - 60);

    // Instrucción (pulse simplificado)
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.font = "bold 28px Arial";
    ctx.fillText("Presiona cualquier tecla para comenzar", canvas.width / 2, canvas.height / 2 + 40);
}

function drawRoundStart() {
    const elapsed = Date.now() - roundStartTime;
    
    if (elapsed >= roundStartDelay) {
        gameState = "playing";
        return;
    }
    
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#1e3c72";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ronda con fade optimizado
    ctx.fillStyle = "#FF6B6B";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.globalAlpha = Math.max(0, 1 - elapsed / 1500);
    
    ctx.fillText("RONDA " + currentRound, canvas.width / 2, canvas.height / 2 - 50);
    if (currentRound === totalRounds) {
        ctx.fillStyle = "#FFD700";
        ctx.fillText("¡BOSS FINAL!", canvas.width / 2, canvas.height / 2 + 50);
    }
    
    ctx.globalAlpha = 1;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "waitingForStart") {
        drawWaitingScreen();
    } else if (gameState === "roundStart") {
        drawRoundStart();
    } else {
        // Dibujar fondo
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#1e3c72");
            gradient.addColorStop(1, "#2a5298");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Dibujar piso y plataformas
        drawFloor();
        drawPlatforms();

        if (gameState === "playing") {
            player.move(keys);
            player.draw();

            updateHearts();
            drawHeartsDrops();

            game.enemies.forEach(enemy => {
                enemy.update();
                enemy.draw();
            });

            checkSwordCollisions();

            // Respawn mientras falten enemigos; si por algún motivo no se llena el cupo, forzamos
            const plan = computeSpawnPlan();
            const shouldForce = plan.pending > 0 && game.enemies.length < plan.desiredOnScreen;
            spawnEnemiesForRound(shouldForce);

            if (game.enemies.length === 0 && enemiesDefeatedThisRound >= enemiesRemainingInRound) {
                if (currentRound < totalRounds) {
                    // Pasar a la siguiente ronda normal
                    currentRound++;
                    initializeRound(currentRound);
                } else {
                    // Si era la ronda final (boss) y fue derrotado -> victoria final
                    gameState = "gameOver";
                }
            }

            if (player.life <= 0) {
                gameState = "gameOver";
            }

            drawUI();
        } else if (gameState === "paused") {
            drawShop();
            drawUI();
        } else if (gameState === "gameOver") {
            drawGameOverScreen();
        }
    }

    requestAnimationFrame(update);
}

function drawUI() {
    // === NAVBAR SUPERIOR OPTIMIZADO ===
    const navbarHeight = 70;
    
    // Fondo simple (más rápido que gradiente)
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, navbarHeight);
    
    // Borde
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, navbarHeight);
    
    // Contenido del navbar - texto simple sin cálculos extra
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFD700";
    let roundDisplay = ("RONDA " + currentRound + " / " + totalRounds);
    ctx.fillText("⚔ " + roundDisplay, 20, 35);
    
    ctx.fillStyle = "#FF6B6B";
    const enemyText = currentRound === totalRounds ? "BOSS" : enemiesDefeatedThisRound + "/" + enemiesRemainingInRound;
    ctx.fillText(enemyText, 200, 35);
    
    ctx.fillStyle = "#4ECDC4";
    ctx.fillText("✦ " + game.score, 350, 35);
    
    ctx.fillStyle = "#FFD700";
    ctx.fillText("💰 " + game.money, 480, 35);

    if (debugSpawnOverlay) {
        const pending = getPendingEnemies();
        const cap = getMaxSimultaneousEnemies(currentRound);
        ctx.font = "12px Arial";
        ctx.fillStyle = "#9CDCFE";
        ctx.fillText(`Spawn dbg - on:${game.enemies.length} pend:${pending} spawned:${enemiesSpawnedThisRound}/${enemiesRemainingInRound} defeated:${enemiesDefeatedThisRound}/${enemiesRemainingInRound} cap:${cap}`, 20, 55);
    }
    
    // Corazones de vida (OPTIMIZADO)
    drawHearts();
    
    // Usuario
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "13px Arial";
    ctx.textAlign = "right";
    ctx.fillText(currentUsername, canvas.width - 20, 50);
    
    // Help text
    ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("[W/A/S/D] Mov | [CLICK] Atq | [ESC] Pausa", 20, canvas.height - 10);
}

function drawHearts() {
    const maxHearts = 3;
    const currentHearts = Math.max(0, Math.ceil(player.life / (player.maxLife / maxHearts)));
    
    const startX = canvas.width - 140;
    const startY = 28;
    const spacing = 12;
    
    ctx.font = "bold 20px Arial";
    
    for (let i = 0; i < maxHearts; i++) {
        ctx.fillStyle = i < currentHearts ? "#FF1744" : "rgba(100, 100, 100, 0.5)";
        ctx.fillText("❤", startX + i * spacing, startY);
    }
}

// Variable para el botón de restart
const restartButton = {
    x: canvas.width / 2 - 120,
    y: 320,
    width: 240,
    height: 50,
    text: "VOLVER A INICIAR",
    isHovered: false
};

// Botones de la tienda
const shopButtons = {
    health: { x: 100, y: 180, width: 200, height: 60, text: "VIDA", isHovered: false },
    damage: { x: 600, y: 180, width: 200, height: 60, text: "DAÑO", isHovered: false },
    continue: { x: canvas.width / 2 - 100, y: 400, width: 200, height: 50, text: "CONTINUAR JUGANDO", isHovered: false }
};

function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título sin sombra
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = player.life <= 0 ? "#FF3333" : "#FFD700";
    let titleText = player.life <= 0 ? "GAME OVER" : "¡VICTORIA!";
    ctx.fillText(titleText, canvas.width / 2, canvas.height / 2 - 50);
    
    // Estadísticas
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Arial";
    
    let roundDisplay = (currentRound + " / " + totalRounds);
    ctx.fillText("Ronda: " + roundDisplay, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.fillText("Puntuación: " + game.score, canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillText("Dinero: " + game.money, canvas.width / 2, canvas.height / 2 + 140);
    
    // Botón VOLVER A INICIAR
    drawRestartButton();
}

function drawShop() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⚔ TIENDA ⚔", canvas.width / 2, 60);
    
    // Dinero
    ctx.fillStyle = "#4ECDC4";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Dinero: " + game.money, canvas.width / 2, 120);
    
    // Botones de mejoras
    drawShopButton(shopButtons.health, "VIDA", game.upgrades.healthCost, "+" + (game.upgrades.healthLevel * 25 + 100) + " HP");
    drawShopButton(shopButtons.damage, "DAÑO", game.upgrades.damageCost, "+" + (game.upgrades.damageLevel * 5 + 10) + " DMG");
    
    // Botón continuar
    drawContinueButton();
}

function drawShopButton(btn, name, cost, description) {
    // Fondo simple (no gradiente cada frame)
    const canBuy = game.money >= cost;
    
    if (!canBuy) {
        ctx.fillStyle = "#555555";
    } else if (btn.isHovered) {
        ctx.fillStyle = "#00FF00";
    } else {
        ctx.fillStyle = "#4ECDC4";
    }
    
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    
    // Borde simple
    ctx.strokeStyle = btn.isHovered && canBuy ? "#00FF00" : (canBuy ? "#FFD700" : "#888888");
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
    
    // Texto
    ctx.fillStyle = canBuy ? "#000000" : "#999999";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, btn.x + btn.width / 2, btn.y + btn.height / 2 - 12);
    
    ctx.font = "12px Arial";
    ctx.fillText("Costo: " + cost, btn.x + btn.width / 2, btn.y + btn.height / 2 + 12);
}

function drawContinueButton() {
    const btn = shopButtons.continue;
    
    // Fondo simple
    ctx.fillStyle = btn.isHovered ? "#FF8C42" : "#FF6B35";
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    
    // Borde
    ctx.strokeStyle = btn.isHovered ? "#FFFF00" : "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
    
    // Texto
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}


function drawRestartButton() {
    const btn = restartButton;
    
    // Fondo simple
    ctx.fillStyle = btn.isHovered ? "#FF8C42" : "#FF6B35";
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    
    // Borde
    ctx.strokeStyle = btn.isHovered ? "#FFFF00" : "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
    
    // Texto
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

// Iniciar juego
initializeRound(1);
gameState = "waitingForStart";
update();
