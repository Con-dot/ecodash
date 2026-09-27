var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function loadImage(src) { var img = new Image(); img.src = src; return img; }

var images = {
    tileset: loadImage('assets/tileset.png'),  // plain sunset colour
    sky: loadImage('assets/nuvens_3.png'),  // plain sunset colour
    clouds2: loadImage('assets/nuvens_2.png'),  //back cloud layer
    clouds1: loadImage('assets/nuvens_1.png'),  // front cloud layer <- important
    hills: loadImage('assets/bg_2.png'),  // dark hills
    clinic: loadImage('assets/clinic.png'),
};

//tile settings
var TILE = 16;  // each tile in tileset.png is 16 x 16 pixels
var SCALE = 3;  // draw them 3x bigger on screen
var TILE_PX = TILE * SCALE;  //48 pixels on scren

var camera = { x: 0 };  //basically how far the world has scrolled

function groundTop() {
    return canvas.height - 3 * TILE_PX;
}

// drawing helpers
// draw one tile: pick the square from the tileset (source), place it on the canvas (destination)
function drawTile(row, col, x, y) {
    ctx.drawImage(images.tileset,
        col * TILE, row * TILE, TILE, TILE,
        x, y, TILE_PX, TILE_PX);
}

// parallax effect
function drawParallax(img, factor) {
    var scale = canvas.height / img.height;
    var w = img.width * scale;
    var start = -(((camera.x * factor) % w) + w) % w;

    for (var x = start; x < canvas.width; x += w) {
        ctx.drawImage(img, x, 0, w, canvas.height);
    }
}

function drawGround() {
    var firstColumn = Math.floor(camera.x / TILE_PX);
    var columns = Math.ceil(canvas.width / TILE_PX) + 1;

    for (var i = 0; i < columns; i++) {
        var x = Math.round((firstColumn + i) * TILE_PX - camera.x);

        //water holes have no ground tiles
        if (holeAtX((firstColumn + i) * TILE_PX + TILE_PX / 2)) continue;

        drawTile(0, 1, x, groundTop());  //grass top
        drawTile(1, 1, x, groundTop() + TILE_PX);  // dirt
        drawTile(1, 1, x, groundTop() + 2 * TILE_PX);  // dirt
    }
}

//acacia and baobab trees in the background
function treeRandom(i) {
    return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

function drawTrees() {
    var spacing = 480;
    var scroll = camera.x * 0.6;
    var first = Math.floor(scroll / spacing) - 1;
    var count = Math.ceil(canvas.width / spacing) + 3;
    var base = groundTop() + 4;

    ctx.fillStyle = '#2b1710';

    for (var n = 0; n < count; n++) {
        var i = first + n;
        var r = treeRandom(i);
        if (r > 0.8) continue;  //some gaps between the trees
        var x = i * spacing + r * 200 - scroll;
        var h = 110 + treeRandom(i + 50) * 60;

        if (r < 0.45) {
            //acacia: thin trunk + flat top
            ctx.fillRect(x - 4, base - h, 8, h);
            ctx.beginPath();
            ctx.ellipse(x, base - h, 70, 16, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 30, base - h + 8, 40, 11, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 34, base - h + 6, 44, 11, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // baobab: fat trunk, little branches on top
            var bh = h * 0.8;
            ctx.beginPath();
            ctx.moveTo(x - 30, base);
            ctx.lineTo(x - 16, base - bh);
            ctx.lineTo(x + 16, base - bh);
            ctx.lineTo(x + 30, base);
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#2b1710';
            ctx.beginPath();
            ctx.moveTo(x - 10, base - bh); ctx.lineTo(x - 34, base - bh - 26);
            ctx.moveTo(x, base - bh);      ctx.lineTo(x, base - bh - 34);
            ctx.moveTo(x + 10, base - bh); ctx.lineTo(x + 34, base - bh - 24);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x - 34, base - bh - 28, 11, 0, Math.PI * 2);
            ctx.arc(x, base - bh - 38, 13, 0, Math.PI * 2);
            ctx.arc(x + 34, base - bh - 27, 11, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
