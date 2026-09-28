// platforms are generated randomly as the player moves right
// each platfrom is: x = where it starts in the world
// widthTiles = how many tiles wide it is
var platforms = [];

var lastPlatformRight = 400;  //where the newest platform ends dont touch this
var lastHeightTiles = 0;  // height of the newest platform (0 = ground level)

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlatforms() {

  // keep generating until there are platforms well past the right edge of the screen
  var generateUntil = camera.x + canvas.width + 600;

  //do not build platforms too high for a small window
  var maxHeightTiles = Math.min(6, Math.max(2, Math.floor((groundTop() - 120) / TILE_PX)));

  while (lastPlatformRight < generateUntil && lastPlatformRight < clinic.x) {

    // new height: at most 2 tiles higher than the last one, so the jump can always reach it
    var heightTiles = lastHeightTiles + randomInt(-2, 2);
    heightTiles = Math.max(2, Math.min(maxHeightTiles, heightTiles));

    // gap: smaller when the next platfrom is higher (harder jump)
    var rise = heightTiles - lastHeightTiles;
    var gap = rise > 0 ? randomInt(90, 150) : randomInt(90, 200);

    // (no long stretches near the clinic
    if (Math.random() < 0.25 && lastHeightTiles > 0 && lastPlatformRight < clinic.x - 900) {
      gap = randomInt(350, 700);
      heightTiles = 2;
    }

    var x = lastPlatformRight + gap;

    // the clinic is the end of the level
    var roomTiles = Math.floor((clinic.x - x) / TILE_PX);
    if (roomTiles < 3) {
      lastPlatformRight = clinic.x;  //no room left, so stop generating
      break;
    }
    var widthTiles = Math.min(randomInt(3, 6), roomTiles);

    platforms.push({ x: x, heightTiles: heightTiles, widthTiles: widthTiles });

    // enemies for the gap before this platform and the platform itself dont touch this
    spawnEnemies(lastPlatformRight, x, heightTiles, widthTiles);

    lastPlatformRight = x + widthTiles * TILE_PX;
    lastHeightTiles = heightTiles;
  }

  // throw away platforms far behind the player
  platforms = platforms.filter(p => p.x + p.widthTiles * TILE_PX > camera.x - 300);
}

//turn a platform into a collision box
function platformBox(platform) {
  return {
    x: platform.x,
    y: groundTop() - platform.heightTiles * TILE_PX,
    width: platform.widthTiles * TILE_PX,
    height: TILE_PX
  };
}

// drawing took me ages
function drawPlatforms() {
  for (var platform of platforms) {
    var box = platformBox(platform);
    var screenX = Math.round(box.x - camera.x);

    if (screenX > canvas.width || screenX + box.width < 0) continue;

    for (var i = 0; i < platform.widthTiles; i++) {
      var column = 7;  // middle piece lol
      if (i == 0) column = 6;  //left cap
      if (i == platform.widthTiles - 1) column = 8;  // right cap
      drawTile(3, column, screenX + i * TILE_PX, box.y);
    }
  }
}
