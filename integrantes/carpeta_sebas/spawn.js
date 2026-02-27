// Sistema de rondas y spawn extraído para depuración y mantenimiento

function getEnemiesForRound(roundNumber) {
    if (roundNumber >= totalRounds) {
        return 1; // solo boss en la última ronda
    }
    return enemiesPerRound * roundNumber;
}

function getPendingEnemies() {
    return Math.max(0, enemiesRemainingInRound - enemiesDefeatedThisRound);
}

function computeSpawnPlan(force = false) {
    const pending = getPendingEnemies();
    const cap = getMaxSimultaneousEnemies(currentRound);
    const remainingToSpawn = Math.max(0, enemiesRemainingInRound - enemiesSpawnedThisRound);
    const desiredOnScreen = Math.min(cap, pending, remainingToSpawn + game.enemies.length);
    const current = game.enemies.length;
    const availableSlots = Math.max(0, desiredOnScreen - current);
    const toSpawn = force ? Math.min(availableSlots, remainingToSpawn) : Math.min(availableSlots, remainingToSpawn);
    return { pending, cap, desiredOnScreen, current, toSpawn, remainingToSpawn };
}

function initializeRound(roundNumber) {
    currentRound = roundNumber;
    gameState = "roundStart";
    roundStartTime = Date.now();
    waitingForKeyPress = false;
    canStartRound = false;

    enemiesToSpawnThisRound = getEnemiesForRound(roundNumber);
    enemiesRemainingInRound = enemiesToSpawnThisRound;
    enemiesDefeatedThisRound = 0;
    enemiesSpawnedThisRound = 0;
    game.enemies = [];
    spawnEnemiesForRound(true);
}

function spawnEnemiesForRound(force = false) {
    // Boss único en ronda final
    if (currentRound === totalRounds && game.enemies.length === 0) {
        game.enemies.push(new Enemy(50, ground.y - 100, true));
        return;
    }

    const plan = computeSpawnPlan(force);
    if (plan.pending === 0 || plan.toSpawn <= 0) return;

    for (let i = 0; i < plan.toSpawn; i++) {
        const totalEnemies = enemiesDefeatedThisRound + game.enemies.length;
        const spawnLeft = totalEnemies % 2 === 0;
        // Spawnea dentro de pantalla con ligera variación, para que siempre sean visibles
        const margin = 40;
        const spawnX = spawnLeft ? margin + Math.random() * 80 : (canvas.width - margin - 80) + Math.random() * 80;
        const spawnY = ground.y - 100 + Math.random() * 20;

        const enemy = (currentRound === totalRounds)
            ? new Enemy(spawnX, spawnY, true)
            : new Enemy(spawnX, spawnY);

        enemy.isAlerted = true;
        enemy.alertTimer = 360;

        game.enemies.push(enemy);
        enemiesSpawnedThisRound = Math.min(enemiesRemainingInRound, enemiesSpawnedThisRound + 1);
    }
}
