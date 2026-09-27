// solar pads on the ground standing on one is the ONLY way to charge the boost
var pads = [];  // { x, w }
var padCursor = 600;  // where the next pad can go
var SOLAR_RATE = 80;  // energy per second while on a pad
var padCharging = false;

function resetPads() {
  pads = [];
  padCursor = 600;
  padCharging = false;
}

function generateSolarPads() {
  // smaller than the hazards one so the holes and spikes are already made
  var generateUntil = camera.x + canvas.width + 300;
  var lastAllowed = clinic.x - 300;

  while (padCursor < generateUntil && padCursor < lastAllowed) {
    var x = Math.ceil(padCursor / TILE_PX) * TILE_PX;
    var w = 2 * TILE_PX;

    // not on top of water or spikes
    if (groundBlocked(x, x + w)) {
      padCursor += TILE_PX;
      continue;
    }

    pads.push({ x: x, w: w });
    padCursor = x + w + randomInt(500, 900);
  }

  pads = pads.filter(p => p.x + p.w > camera.x - 400);
}

function updateSolarPads(dt) {
  padCharging = false;

  // has to be on the ground and not boosting
  if (energy.boosting) return;
  if (player.y + player.size < groundTop() - 2) return;

  for (var p of pads) {
    if (player.x + player.size > p.x + 6 && player.x < p.x + p.w - 6) {
      padCharging = true;
      energy.value = Math.min(energy.max, energy.value + SOLAR_RATE * dt);
      if (energy.exhausted && energy.value >= energy.restartAt) energy.exhausted = false;

      // little sparks
      if (Math.random() < 0.3) {
        burst(player.x + Math.random() * player.size, groundTop() - 12, 1, ['#ffe066', '#fff3b0'], 60, 120);
      }
    }
  }
}

function drawSolarPads() {
  for (var p of pads) {
    var sx = Math.round(p.x - camera.x);
    if (sx > canvas.width || sx + p.w < 0) continue;
    var top = groundTop() - 14;

    // yellow glow when charging
    if (padCharging && player.x + player.size > p.x && player.x < p.x + p.w) {
      ctx.fillStyle = 'rgba(255, 224, 102, 0.35)';
      ctx.fillRect(sx - 6, top - 22, p.w + 12, 36);
    }

    // frame
    ctx.fillStyle = '#2b2a33';
    ctx.fillRect(sx, top, p.w, 14);

    // blue cells
    ctx.fillStyle = '#2f6fb0';
    for (var i = 0; i < 6; i++) {
      ctx.fillRect(sx + 4 + i * 15, top + 3, 13, 8);
    }

    // shiny bit on the cells
    ctx.fillStyle = '#7fb8e8';
    for (var i = 0; i < 6; i++) {
      ctx.fillRect(sx + 4 + i * 15, top + 3, 13, 2);
    }
  }
}
