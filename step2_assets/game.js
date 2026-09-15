const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// loading Background images //
function loadImage(src) { const img = new Image(); img.src = src; return img; }

const images = {
  tileset: loadImage('assets/tileset.png'),
  sky: loadImage('assets/nuvens_3.png'),       // plain sunset colour
  clouds2: loadImage('assets/nuvens_2.png'),   // back cloud layer
  clouds1: loadImage('assets/nuvens_1.png'),   // front cloud layer
  hills: loadImage('assets/bg_2.png'),         // dark hills
};

// Tile settings //
const TILE = 16;                 // each tile in tileset.png is 16 x 16 pixels
const SCALE = 3;                 // draw them 3x bigger on screen
const TILE_PX = TILE * SCALE;    // 48 pixels on screen

// Player movement and camera //
const player = {
  x: 0,
  y: 0,
  size: 40,
  speed: 300,
  velocityY: 0,
  gravity: 1400,
  jumpPower: 600,
  onGround: false
};

const camera = { x: 0 };         // how far the world has scrolled
const keys = { w: false, a: false, d: false, space: false };

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'w') keys.w = true;
  if (e.key.toLowerCase() === 'a') keys.a = true;
  if (e.key.toLowerCase() === 'd') keys.d = true;

  if (e.code === 'Space') {
    keys.space = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  if (e.key.toLowerCase() === 'w') keys.w = false;
  if (e.key.toLowerCase() === 'a') keys.a = false;
  if (e.key.toLowerCase() === 'd') keys.d = false;

  if (e.code === 'Space') keys.space = false;
});

function groundTop() {
  return canvas.height - 3 * TILE_PX;
}

// bug fix to stop movement when leaving tab //

window.addEventListener('blur', () => {
  keys.a = false;
  keys.d = false;
  keys.w = false;
  keys.space = false;
});

function update(dt) {

  // horizontal movement //
  if (keys.a) player.x -= player.speed * dt;
  if (keys.d) player.x += player.speed * dt;

  // gravity //
  player.velocityY += player.gravity * dt;
  player.y += player.velocityY * dt;

  // ground collision //
  const floorY = groundTop() - player.size;

  if (player.y >= floorY) {
    player.y = floorY;
    player.velocityY = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // jumping //
  if ((keys.space) && player.onGround) {
    player.velocityY = -player.jumpPower;
    player.onGround = false;
  }

  camera.x = player.x - canvas.width / 2;
}

// Drawing helpers //
// Draw one tile: pick the square from the tileset (source), place it on the canvas (destination)

function drawTile(row, col, x, y) {
  ctx.drawImage(images.tileset,
    col * TILE, row * TILE, TILE, TILE,
    x, y, TILE_PX, TILE_PX);
}

// parallax effect //
function drawParallax(img, factor) {
  const scale = canvas.height / img.height;
  const w = img.width * scale;
  const start = -(((camera.x * factor) % w) + w) % w;

  for (let x = start; x < canvas.width; x += w) {
    ctx.drawImage(img, x, 0, w, canvas.height);
  }
}

function drawGround() {
  const firstColumn = Math.floor(camera.x / TILE_PX);
  const columns = Math.ceil(canvas.width / TILE_PX) + 1;

  for (let i = 0; i < columns; i++) {
    const x = Math.round((firstColumn + i) * TILE_PX - camera.x);

    drawTile(0, 1, x, groundTop());                 // grass top
    drawTile(1, 1, x, groundTop() + TILE_PX);       // dirt
    drawTile(1, 1, x, groundTop() + 2 * TILE_PX);   // dirt
  }
}

function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawParallax(images.sky, 0);                 // far layers move slowly (0 = doesn't move)...
  drawParallax(images.clouds2, 0.05);
  drawParallax(images.clouds1, 0.15);
  drawParallax(images.hills, 0.4);             // closer layers move faster

  drawGround();

  ctx.fillStyle = 'orange';
  ctx.fillRect(player.x - camera.x, player.y, player.size, player.size);
}

let lastTime = performance.now();

function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// start the player standing on the ground //

player.y = groundTop() - player.size;
player.onGround = true;

requestAnimationFrame(loop);