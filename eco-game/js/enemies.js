// walker: patrols back and forth on the ground or on top of a platform
//flyer:  hovers in the air over the gaps bobbing up and down
// stomp them from above or boost through them. Touch them any other way and you die
var enemies = [];

var ENEMY_MIN_X = 600;  //no enemies right at the start of the level
var ENEMY_END_GAP = 250;  // no enemies right next to the clinic too

function makeWalker(heightTiles, minX, maxX) {
  return {
    type: 'walker',
    x: minX + Math.random() * (maxX - minX),
    y: 0,
    w: 36,
    h: 32,
    heightTiles: heightTiles,  // 0 = on the ground
    vx: (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 40),
    minX: minX,
    maxX: maxX,
    t: Math.random() * 10,
    dead: false,
    deadT: 0
  };
}

function makeFlyer(centerX, heightTiles) {
  return {
    type: 'flyer',
    x: centerX - 100,
    y: 0,
    w: 36,
    h: 28,
    heightTiles: heightTiles,  // height of its bottom above the ground, in tiles
    vx: 90,
    minX: centerX - 100,
    maxX: centerX + 100,
    t: Math.random() * 10,
    dead: false,
    deadT: 0
  };
}

//called by the platform generator for every new platform
function spawnEnemies(gapStart, platformX, heightTiles, widthTiles) {
  if (platformX < ENEMY_MIN_X || platformX > clinic.x - ENEMY_END_GAP) return;

  // a walker guarding the platform
  if (widthTiles >= 4 && Math.random() < 0.5) {
    var minX = platformX + 6;
    var maxX = platformX + widthTiles * TILE_PX - 36 - 6;
    enemies.push(makeWalker(heightTiles, minX, maxX));
  }

  var gap = platformX - gapStart;

  // a walker patrolling the ground in the gap
  if (gap > 150 && Math.random() < 0.35) {
    enemies.push(makeWalker(0, gapStart, platformX - 36));
  }

  // a flyer hovering over the gap
  if (gap > 120 && Math.random() < 0.3) {
    enemies.push(makeFlyer(gapStart + gap / 2, 1.3 + Math.random() * 1.1));
  }
}

function updateEnemies(dt) {
  for (var e of enemies) {
    e.t += dt;

    // vertical position always follows the ground
    var baseY = groundTop() - e.heightTiles * TILE_PX - e.h;
    e.y = e.type === 'flyer' ? baseY + Math.sin(e.t * 3) * 18 : baseY;

    if (e.dead) {
      e.deadT += dt;
      continue;
    }

    var previousX = e.x;
    e.x += e.vx * dt;

    if (e.type == 'walker' && e.heightTiles === 0 &&
        groundBlocked(e.x, e.x + e.w) && !groundBlocked(previousX, previousX + e.w)) {
      e.x = previousX;
      e.vx = -e.vx;
    }

    if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
    if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
  }

  // idk but forget enemies far behind the player
  enemies = enemies.filter(e => e.x + e.w > camera.x - 300 && !(e.dead && e.deadT > 0.4));
}

function killEnemy(e) {
  e.dead = true;
  e.deadT = 0;
  bonusScore += 50;
}

//player vs enemies
function checkEnemyCollisions() {
  var px = player.x + 4;
  var py = player.y + 4;
  var pw = player.size - 8;
  var ph = player.size - 8;

  for (var e of enemies) {
    if (e.dead) continue;

    var hit =
      px < e.x + e.w &&
      px + pw > e.x &&
      py < e.y + e.h &&
      py + ph > e.y;

    if (!hit) continue;

    var stomping = player.velocityY > 0 && (player.y + player.size) - e.y < 24;

    if (stomping) {  // jumped on its head: bounce and get some energy back
      killEnemy(e);
      player.velocityY = -420;
      energy.value = Math.min(energy.max, energy.value + 20);
    } else if (energy.boosting) {  // boosting through it
      killEnemy(e);
      energy.value = Math.min(energy.max, energy.value + 10);
    } else if (player.invuln <= 0) {
      die('An enemy got you!');
      return;
    }
  }
}

// drawing
function drawEnemies() {
  for (var e of enemies) {
    var sx = Math.round(e.x - camera.x);
    if (sx > canvas.width || sx + e.w < 0) continue;
    var sy = Math.round(e.y);

    if (e.type == 'walker') drawWalker(e, sx, sy);
    else drawFlyer(e, sx, sy);
  }
}

function drawWalker(e, sx, sy) {

  // squashed flat
  if (e.dead) {
    ctx.fillStyle = '#5b2a6e';
    ctx.fillRect(sx, sy + e.h - 8, e.w, 8);
    return;
  }

  var step = Math.floor(e.t * 8) % 2;
  var dir = e.vx > 0 ? 1 : -1;

  ctx.fillStyle = '#2a1233';
  ctx.fillRect(sx + 3, sy + e.h - 6, 10, 6 - step * 2);
  ctx.fillRect(sx + e.w - 13, sy + e.h - 6, 10, 4 + step * 2);

  //body lol
  ctx.fillStyle = '#2a1233';
  ctx.fillRect(sx, sy, e.w, e.h - 4);
  ctx.fillStyle = '#5b2a6e';
  ctx.fillRect(sx + 3, sy + 3, e.w - 6, e.h - 10);

  // eyes looking the way it walks
  var eyeX = dir > 0 ? 18 : 4;
  ctx.fillStyle = '#f4dfb3';
  ctx.fillRect(sx + eyeX, sy + 9, 8, 8);
  ctx.fillRect(sx + eyeX + 10, sy + 9, 8, 8);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(sx + eyeX + (dir > 0 ? 4 : 0), sy + 11, 4, 4);
  ctx.fillRect(sx + eyeX + 10 + (dir > 0 ? 4 : 0), sy + 11, 4, 4);

  // angry brows lol
  ctx.fillStyle = '#2a1233';
  ctx.fillRect(sx + eyeX, sy + 6, 8, 3);
  ctx.fillRect(sx + eyeX + 10, sy + 6, 8, 3);
}

function drawFlyer(e, sx, sy) {

  if (e.dead) {
    ctx.fillStyle = '#5b2a6e';
    ctx.fillRect(sx + 4, sy + e.h - 6, e.w - 8, 6);
    return;
  }

  var flap = Math.sin(e.t * 18);  // i think wing angle
  var dir = e.vx > 0 ? 1 : -1;

  ctx.fillStyle = '#8a4aa0';
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 12);
  ctx.lineTo(sx + 2, sy + 12 - 16 * flap);
  ctx.lineTo(sx + 18, sy + 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + e.w - 10, sy + 12);
  ctx.lineTo(sx + e.w - 2, sy + 12 - 16 * flap);
  ctx.lineTo(sx + e.w - 18, sy + 10);
  ctx.fill();

  ctx.fillStyle = '#2a1233';
  ctx.fillRect(sx + 6, sy + 8, e.w - 12, e.h - 8);
  ctx.fillStyle = '#5b2a6e';
  ctx.fillRect(sx + 9, sy + 11, e.w - 18, e.h - 14);

  //eye + beak
  ctx.fillStyle = '#f4dfb3';
  ctx.fillRect(sx + (dir > 0 ? 18 : 10), sy + 12, 8, 7);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(sx + (dir > 0 ? 22 : 10), sy + 14, 4, 4);
  ctx.fillStyle = '#d69a3a';
  ctx.fillRect(sx + (dir > 0 ? e.w - 6 : 0), sy + 18, 6, 4);
}
