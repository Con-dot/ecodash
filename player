// player movement
var player = {
    x: 0,
    y: 0,
    size: 40,
    speed: 300,
    velocityY: 0,
    gravity: 1400,
    jumpPower: 600,
    onGround: false,
    facing: 1,  // 1 = looking right dont touch this
    invuln: 0  // seconds of protection left (works now!!)
};

// energy system: hold SHIFT to boost forward, energy drains while boosting and refills when not idk why
var energy = {
    value: 100,
    max: 100,
    boosting: false,
    exhausted: false,  // ran dry: cannot boost until energy is back above restartAt lol
    restartAt: 30,
    drainPerSecond: 40,  // about 2.5 seconds of boost from a full bar
    speedMultiplier: 2.4,  //boost speed compared to normal running
    glide: 0.35  // gravity is reduced to 35% while boosting
};

var keys = { w: false, a: false, d: false, space: false, shift: false };

window.addEventListener('keydown', e => {
    if (e.target.tagName == 'INPUT') return;  //typing a name
    if (e.key.toLowerCase() === 'w') keys.w = true;
    if (e.key.toLowerCase() == 'a') keys.a = true;
    if (e.key.toLowerCase() == 'd') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;

    if (e.code == 'Space') {
        keys.space = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', e => {
    if (e.target.tagName == 'INPUT') return;
    if (e.key.toLowerCase() == 'w') keys.w = false;
    if (e.key.toLowerCase() == 'a') keys.a = false;
    if (e.key.toLowerCase() === 'd') keys.d = false;
    if (e.key == 'Shift') keys.shift = false;

    if (e.code == 'Space') keys.space = false;
});

//bug fix to stop movement when leaving tab <- important
function releaseKeys() {
    keys.a = false;
    keys.d = false;
    keys.w = false;
    keys.space = false;
    keys.shift = false;
}
window.addEventListener('blur', releaseKeys);

function updatePlayer(dt) {

    var dir = 0;
    if (keys.a) dir -= 1;
    if (keys.d) dir += 1;
    if (dir !== 0) player.facing = dir;

    // boost: needs SHIFT, and some energy that is not "exhausted"
    energy.boosting = keys.shift && !energy.exhausted && energy.value > 0;

    if (energy.boosting) {
        energy.value = Math.max(0, energy.value - energy.drainPerSecond * dt);
        dir = player.facing;  //the boost always pushes you forward
        if (energy.value <= 0) {
            energy.exhausted = true;
            energy.boosting = false;
        }
    } else {
        // no regen anymore, only solar pads charge it (see solar.js)
        if (energy.exhausted && energy.value >= energy.restartAt) energy.exhausted = false;
    }

    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);

    //horizontal movement
    var speed = player.speed * (energy.boosting ? energy.speedMultiplier : 1);
    player.x += dir * speed * dt;
    // console.log(player.x);
    if (player.x < 0) player.x = 0;  // idk but invisible wall at the start of the level

    // platform sides dont touch this
    for (var platform of platforms) {
        var box = platformBox(platform);

        // the 2 pixel margin stops us counting the platform we are standing on
        var touching =
            player.x < box.x + box.width &&
            player.x + player.size > box.x &&
            player.y + player.size > box.y + 2 &&
            player.y < box.y + box.height - 2;

        if (touching) {
            if (dir > 0) player.x = box.x - player.size;  //hit the left side (works now!!)
            else if (dir < 0) player.x = box.x + box.width;  //hit the right side (works now!!)
        }
    }

    // gravity (weaker while boosting)
    var gravity = energy.boosting ? player.gravity * energy.glide : player.gravity;
    player.velocityY += gravity * dt;
    player.y += player.velocityY * dt;
    player.onGround = false;

    // platform top and bottom
    for (var platform of platforms) {
        var box = platformBox(platform);

        var overlapping =
            player.x < box.x + box.width &&
            player.x + player.size > box.x &&
            player.y < box.y + box.height &&
            player.y + player.size > box.y;

        if (overlapping) {
            if (player.velocityY > 0) {  //falling: land on top
                player.y = box.y - player.size;
                player.velocityY = 0;
                player.onGround = true;
            } else if (player.velocityY < 0) {  // ok so rising: bump our head
                player.y = box.y + box.height;
                player.velocityY = 0;
            }
        }
    }

    // ground collision (a water hole has no floor)
    var floorY = groundTop() - player.size;
    var overHole = holeUnder(player.x + 8, player.x + player.size - 8);

    if (overHole) {
        //sinking: the walls of the pit stop us drifting sideways
        if (player.y + player.size > groundTop() + 2) {
            player.x = Math.max(overHole.x, Math.min(overHole.x + overHole.w - player.size, player.x));
        }
        // under the surface
        if (player.y + player.size > groundTop() + WATER_DEPTH + 4 && gameState == 'playing') {
            splashAt(player.x + player.size / 2);
            die('You fell in the water!', { x: overHole.x - 90 });
        }
    } else if (player.y >= floorY) {
        player.y = floorY;
        player.velocityY = 0;
        player.onGround = true;
    }

    // idk but jumping
    if ((keys.space || keys.w) && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }

    camera.x = player.x - canvas.width / 2;
}

//energy bar in the HUD
function updateEnergyHud() {
    var fill = document.getElementById('energyFill');
    fill.style.width = (energy.value / energy.max * 100) + '%';
    fill.classList.toggle('exhausted', energy.exhausted);
}

// draw the courier (plus a trail while boosting)
function drawPlayer() {

    if (player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0) return;

    var screenX = player.x - camera.x;

    if (energy.boosting) {
        for (var i = 1; i <= 4; i++) {
            ctx.fillStyle = `rgba(111, 210, 232, ${0.4 - i * 0.08})`;
            ctx.fillRect(screenX - player.facing * i * 14, player.y, player.size, player.size);
        }
    }

    ctx.fillStyle = gameState == 'coinflip' ? '#c0392b' : '#6b3e1f';
    ctx.fillRect(screenX, player.y, player.size, player.size);

    //little headband: gold, red, green
    ctx.fillStyle = '#d69a3a';
    ctx.fillRect(screenX, player.y, 14, 6);
    ctx.fillStyle = '#b3261e';
    ctx.fillRect(screenX + 14, player.y, 12, 6);
    ctx.fillStyle = '#315c3a';
    ctx.fillRect(screenX + 26, player.y, 14, 6);

    // a little eye so you can see which way you are facing
    ctx.fillStyle = 'white';
    ctx.fillRect(screenX + (player.facing > 0 ? 24 : 8), player.y + 10, 8, 8);
    ctx.fillStyle = '#3b2115';
    ctx.fillRect(screenX + (player.facing > 0 ? 28 : 8), player.y + 12, 4, 4);
}
