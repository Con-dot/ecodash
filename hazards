/// hazards fix later maybe
// spikes:       sit on the ground. Jump over them
// flying crate: flies in from the right at three heights. Jump the low ones, stay low under
// the middle ones took me ages

var holes = [];  // { x, w }   world coordinates, lined up with the ground tiles lol
var spikes = [];  // { x, w }
var crates = [];
var rocks = [];
var particles = [];

var HAZARD_MIN_X = 800;  //nothing static in the first stretch of the level
var HAZARD_END_GAP = 400;  // ...or right before the clinic
var SPIKE_W = 24;  //width of one spike
var SPIKE_H = 24;
var WATER_DEPTH = 22;  // how far below the grass line the water surface sits

var hazardCursor = HAZARD_MIN_X;  // where the next ground hazard may start
var crateTimer = 4;  // seconds until the next flying crate
var rockTimer = 6;  // ok so seconds until the next falling rock

function resetHazards() {
    holes = [];
    spikes = [];
    crates = [];
    rocks = [];
    particles = [];
    hazardCursor = HAZARD_MIN_X;
    crateTimer = 4;
    rockTimer = 6;
}

// basically looking things up ----------

function holeUnder(x0, x1) {
    for (var h of holes) {
        if (x0 >= h.x && x1 <= h.x + h.w) return h;
    }
    return null;
}

//the hole that contains this single x (if any)
function holeAtX(x) {
    for (var h of holes) {
        if (x >= h.x && x < h.x + h.w) return h;
    }
    return null;
}

function groundBlocked(x0, x1) {
    for (var h of holes) {
        if (x1 > h.x - 6 && x0 < h.x + h.w + 6) return true;
    }
    for (var s of spikes) {
        if (x1 > s.x - 6 && x0 < s.x + s.w + 6) return true;
    }
    return false;
}

//a low platform
function lowPlatformNear(x0, x1) {
    return platforms.some(p =>
        p.heightTiles <= 2 &&
        p.x < x1 + 80 &&
        p.x + p.widthTiles * TILE_PX > x0 - 80);
}

// where something falling at x..x+w lands lol
function landingY(x, w) {
    var y = groundTop();
    for (var p of platforms) {
        var b = platformBox(p);
        if (x < b.x + b.width && x + w > b.x && b.y < y) y = b.y;
    }
    return y;
}

// generating water holes and spikes as the player moves right ---------- <- important
function generateHazards() {
    var generateUntil = camera.x + canvas.width + 500;
    var lastAllowed = clinic.x - HAZARD_END_GAP;

    while (hazardCursor < generateUntil && hazardCursor < lastAllowed) {
        var x, w, isWater;

        if (Math.random() < 0.55) {
            isWater = true;
            w = randomInt(3, 4) * TILE_PX;  // 144 or 192 px: a jump clears it
            x = Math.ceil(hazardCursor / TILE_PX) * TILE_PX;  // line up with the ground tiles
        } else {
            isWater = false;
            w = randomInt(3, 4) * SPIKE_W;
            x = Math.round(hazardCursor);
        }

        if (x + w > lastAllowed) {
            hazardCursor = clinic.x;
            break;
        }

        if (lowPlatformNear(x, x + w)) {
            hazardCursor += 120;
            continue;
        }

        if (isWater) holes.push({ x: x, w: w });
        else spikes.push({ x: x, w: w });

        //ground walkers that were standing there get removed
        enemies = enemies.filter(e =>
            !(e.type == 'walker' && e.heightTiles == 0 && e.x + e.w > x - 20 && e.x < x + w + 20));

        //breathing room before the next hazard
        hazardCursor = x + w + randomInt(320, 560);
    }

    // forget hazards far behind the player
    holes = holes.filter(h => h.x + h.w > camera.x - 400);
    spikes = spikes.filter(s => s.x + s.w > camera.x - 400);
}

// flying crates and falling rocks ---------- took me ages

// three heights (pixels between the ground and the bottom of the crate)
var CRATE_LIFTS = [40, 92, 144];  // low: jump it | middle: don't jump | high: stay on the ground

function spawnCrate() {
    var startX = camera.x + canvas.width + 250;
    crates.push({
        x: startX,  // starts just off screen on the right
        y: 0,
        w: 40,
        h: 40,
        lift: CRATE_LIFTS[randomInt(0, CRATE_LIFTS.length - 1)],
        speed: 170 + Math.random() * 100,  // how fast it flies left took me ages
        t: Math.random() * 10,
        startX: startX,  // where it started, for the wave
        amp: 20 + Math.random() * 10,  // how high the wave goes
        waveLen: 280 + Math.random() * 200,  // pixels for one full wave
        phase: Math.random() * Math.PI * 2,
        broken: false
    });
}

function spawnRock() {
    var x = player.x + 280 + Math.random() * 240;  // a little ahead of the player
    if (holeAtX(x) || holeAtX(x + 44)) return false;  //idk but not into the water
    rocks.push({
        x: x,
        y: -60,
        w: 44,
        h: 44,
        state: 'warning',  // idk but 'warning' (marker on the ground) then 'falling'
        t: 0,
        landY: groundTop(),
        done: false
    });
    return true;
}

function updateRock(r, dt) {
    r.t += dt;
    r.landY = landingY(r.x, r.w);

    if (r.state == 'warning') {
        if (r.t >= 0.9) {
            r.state = 'falling';
            r.y = -r.h;
        }
        return;
    }

    r.y += 1000 * dt;
    if (r.y + r.h >= r.landY) {
        burst(r.x + r.w / 2, r.landY, 14, ['#6b6f75', '#8b9096', '#4a4d52'], 260, 380);
        r.done = true;
    }
}

function updateHazards(dt) {

    // flying crates: one every few seconds, never right at the start or end of the level
    crateTimer -= dt;
    if (crateTimer <= 0 && player.x > 500 && player.x < clinic.x - 500 && crates.length < 2) {
        spawnCrate();
        crateTimer = 3 + Math.random() * 3;
    }
    for (var c of crates) {
        c.t += dt;
        c.x -= c.speed * dt;
        // sin wave: goes up and down depending on how far it has flown
        var flown = c.startX - c.x;
        c.y = groundTop() - c.lift - c.h + Math.sin(flown / c.waveLen * Math.PI * 2 + c.phase) * c.amp;
    }
    crates = crates.filter(c => !c.broken && c.x + c.w > camera.x - 200);

    // falling rocks
    rockTimer -= dt;
    if (rockTimer <= 0 && player.x > 700 && player.x < clinic.x - 600 && rocks.length == 0) {
        rockTimer = spawnRock() ? 4 + Math.random() * 4 : 0.3;
    }
    for (var r of rocks) updateRock(r, dt);
    rocks = rocks.filter(r => !r.done);
}

// idk but particles (splashes, wood and rock chips) ----------
function burst(x, y, count, colors, speed, up) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * speed,
            vy: -Math.random() * up,
            life: 0.5 + Math.random() * 0.5,
            size: 3 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function splashAt(x) {
    burst(x, groundTop() + WATER_DEPTH, 18, ['#8fd3e8', '#d6f1f8', '#2f86a6'], 240, 460);
}

function updateParticles(dt) {
    for (var p of particles) {
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
}

function checkHazardCollisions() {
    var px = player.x + 4;
    var py = player.y + 4;
    var pw = player.size - 8;
    var ph = player.size - 8;

    // spikes: deadly from any side, boosting does not help
    for (var s of spikes) {
        var hit =
            px < s.x + s.w - 4 &&
            px + pw > s.x + 4 &&
            py + ph > groundTop() - SPIKE_H + 4 &&
            py < groundTop();

        if (hit && player.invuln <= 0) {
            die('You hit the spikes!', { x: s.x - 100 });
            return;
        }
    }

    // ok so flying crates: boost right through them, otherwise they hurt
    for (var c of crates) {
        var hit =
            px < c.x + c.w &&
            px + pw > c.x &&
            py < c.y + c.h &&
            py + ph > c.y;

        if (!hit) continue;

        if (energy.boosting) {
            c.broken = true;
            bonusScore += 25;
            burst(c.x + c.w / 2, c.y + c.h / 2, 12, ['#c98b45', '#8f3f24', '#f4dfb3'], 320, 300);
        } else if (player.invuln <= 0) {
            die('A flying crate hit you!');
            return;
        }
    }

    //falling rocks: only dangerous while they are falling
    for (var r of rocks) {
        if (r.state != 'falling') continue;

        var hit =
            px < r.x + r.w &&
            px + pw > r.x &&
            py < r.y + r.h &&
            py + ph > r.y;

        if (hit && player.invuln <= 0) {
            die('A rock fell on you!');
            return;
        }
    }
}

// drawing ----------

// the water inside the holes
function waterSurfacePoints(h, sx, time) {
    var top = groundTop() + WATER_DEPTH;
    var points = [];
    for (var xx = 0; xx <= h.w; xx += 8) {
        points.push({ x: sx + xx, y: top + Math.sin(time * 3 + (h.x + xx) * 0.06) * 3 });
    }
    return points;
}

function drawWaterBack() {
    var bottom = canvas.height;
    var time = performance.now() / 1000;

    for (var h of holes) {
        var sx = Math.round(h.x - camera.x);
        if (sx > canvas.width || sx + h.w < 0) continue;

        // dark pit behind the water
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(sx, groundTop(), h.w, bottom - groundTop());

        var points = waterSurfacePoints(h, sx, time);
        ctx.fillStyle = '#1c5a78';
        ctx.beginPath();
        ctx.moveTo(sx, bottom);
        for (var p of points) ctx.lineTo(p.x, p.y);
        ctx.lineTo(sx + h.w, bottom);
        ctx.closePath();
        ctx.fill();

        // lighter line on the surface
        ctx.strokeStyle = '#8fd3e8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => { if (i == 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.stroke();
    }
}

// a see-through layer of water over the player while sinking
function drawWaterFront() {
    var bottomOfPlayer = player.y + player.size;
    if (bottomOfPlayer <= groundTop() + WATER_DEPTH) return;

    var h = holeUnder(player.x, player.x + player.size) || holeAtX(player.x + player.size / 2);
    if (!h) return;

    var sx = Math.round(h.x - camera.x);
    var top = groundTop() + WATER_DEPTH;
    ctx.fillStyle = 'rgba(40, 130, 165, 0.55)';
    ctx.fillRect(sx, top, h.w, canvas.height - top);
}

function drawSpikes() {
    var gt = groundTop();

    for (var s of spikes) {
        var sx = Math.round(s.x - camera.x);
        if (sx > canvas.width || sx + s.w < 0) continue;

        var count = s.w / SPIKE_W;
        for (var i = 0; i < count; i++) {
            var left = sx + i * SPIKE_W;
            var mid = left + SPIKE_W / 2;
            var right = left + SPIKE_W;

            ctx.fillStyle = '#c9d1d6';
            ctx.beginPath();
            ctx.moveTo(left, gt);
            ctx.lineTo(mid, gt - SPIKE_H);
            ctx.lineTo(right, gt);
            ctx.fill();

            ctx.fillStyle = '#7d8a93';  // shaded right half
            ctx.beginPath();
            ctx.moveTo(mid, gt - SPIKE_H);
            ctx.lineTo(right, gt);
            ctx.lineTo(mid, gt);
            ctx.fill();
        }
    }
}

function drawCrates() {
    for (var c of crates) {
        var sx = Math.round(c.x - camera.x);
        var sy = Math.round(c.y);
        if (sx > canvas.width || sx + c.w < 0) continue;

        // wooden box <- important
        ctx.fillStyle = '#2a1233';
        ctx.fillRect(sx - 2, sy - 2, c.w + 4, c.h + 4);
        ctx.fillStyle = '#c98b45';
        ctx.fillRect(sx, sy, c.w, c.h);

        // planks and cross
        ctx.fillStyle = '#8f3f24';
        ctx.fillRect(sx, sy, c.w, 5);
        ctx.fillRect(sx, sy + c.h - 5, c.w, 5);
        ctx.fillRect(sx, sy, 5, c.h);
        ctx.fillRect(sx + c.w - 5, sy, 5, c.h);
        ctx.strokeStyle = '#8f3f24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx + 5, sy + 5);
        ctx.lineTo(sx + c.w - 5, sy + c.h - 5);
        ctx.moveTo(sx + c.w - 5, sy + 5);
        ctx.lineTo(sx + 5, sy + c.h - 5);
        ctx.stroke();

        // red warning light
        ctx.fillStyle = Math.floor(c.t * 6) % 2 === 0 ? '#ff5a36' : '#7a2a1a';
        ctx.fillRect(sx + c.w - 12, sy - 4, 8, 6);
    }
}

function drawRocks() {
    for (var r of rocks) {
        if (r.state != 'falling') continue;
        var sx = Math.round(r.x - camera.x);
        var sy = Math.round(r.y);
        if (sx > canvas.width || sx + r.w < 0) continue;

        ctx.fillStyle = '#4a4d52';
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + r.h);
        ctx.lineTo(sx, sy + 16);
        ctx.lineTo(sx + 12, sy + 2);
        ctx.lineTo(sx + 32, sy);
        ctx.lineTo(sx + r.w, sy + 14);
        ctx.lineTo(sx + r.w - 4, sy + r.h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8b9096';
        ctx.beginPath();
        ctx.moveTo(sx + 12, sy + 2);
        ctx.lineTo(sx + 32, sy);
        ctx.lineTo(sx + 26, sy + 16);
        ctx.lineTo(sx + 8, sy + 20);
        ctx.closePath();
        ctx.fill();
    }
}

function drawParticles() {
    for (var p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - camera.x), Math.round(p.y), p.size, p.size);
    }
}

// warnings are drawn on top of the storm darkness
function drawHazardWarnings() {
    var time = performance.now() / 1000;
    var pulse = 0.6 + 0.4 * Math.sin(time * 14);

    for (var c of crates) {
        if (c.x < camera.x + canvas.width) continue;

        var bx = canvas.width - 50;
        var by = Math.max(70, Math.min(groundTop() - 40, c.y));

        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(bx, by, 38, 38);
        ctx.strokeStyle = '#f4dfb3';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, 38, 38);
        ctx.fillStyle = '#f4dfb3';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', bx + 19, by + 29);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }

    // a rock is about to fall
    for (var r of rocks) {
        if (r.state == 'done') continue;
        var cx = Math.round(r.x + r.w / 2 - camera.x);
        if (cx < -20 || cx > canvas.width + 20) continue;

        ctx.globalAlpha = 0.35 + 0.35 * pulse;
        ctx.strokeStyle = '#ff5a36';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, r.landY - 14);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff5a36';
        ctx.beginPath();
        ctx.moveTo(cx, r.landY - 6);
        ctx.lineTo(cx - 16, r.landY - 34);
        ctx.lineTo(cx + 16, r.landY - 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f4dfb3';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, r.landY - 17);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }
}
