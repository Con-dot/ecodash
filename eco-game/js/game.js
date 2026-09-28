// drawing
function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawParallax(images.sky, 0);  //far layers move slowly (0 = doesn't move)
    drawParallax(images.clouds2, 0.05);
    drawParallax(images.clouds1, 0.15);
    drawParallax(images.hills, 0.4);  //closer layers move faster
    drawTrees();

    drawGround();
    drawSolarPads();
    drawWaterBack();
    drawPlatforms();
    drawClinic();
    drawSpikes();
    drawEnemies();
    drawCrates();
    drawRocks();
    drawDelivery();
    drawWeather();
    drawPlayer();
    drawWaterFront();
    drawParticles();
    drawHazardWarnings();

    //red flash when a life is lost
    if (hitFlash > 0) {
        ctx.fillStyle = `rgba(200, 30, 30, ${0.4 * hitFlash})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// game update
function update(dt) {

    if (gameState === 'playing') {
        generatePlatforms();
        updateWeather(dt);
        updatePlayer(dt);
        updateDelivery();
        updateSolarPads(dt);

        //nothing else runs
        if (deliveryPackage.pickedUp) {
            generateHazards();
            generateSolarPads();
            updateEnemies(dt);
            updateHazards(dt);
            updateScore();
            checkEnemyCollisions();
            if (gameState == 'playing') checkHazardCollisions();
            if (gameState == 'playing') checkClinicReached();
            if (gameState === 'playing') updateTimer(dt);
        }
    }

    // ok so menu: the level just idles in the background (enemies patrol, the storm rages)
    else if (gameState == 'menu') {
        camera.x = player.x - canvas.width / 2;
        generatePlatforms();
        generateHazards();
        updateWeather(dt);
        updateEnemies(dt);
    }

    // coin flip / end screens
    else {
        updateWeather(dt);
    }

    updateParticles(dt);
    hitFlash = Math.max(0, hitFlash - dt * 2);
    updateEnergyHud();
}

var lastTime = performance.now();

function loop(now) {
    var dt = Math.min(0.05, (now - lastTime) / 1000);  // cap so big lag can't push us through platfroms
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// start the player standing on the ground

player.y = groundTop() - player.size;
player.onGround = true;
showMenu();

requestAnimationFrame(loop);
