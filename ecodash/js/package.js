// ok so delivery package that must be delivered to clinic
var deliveryPackage = {
  x: 100,
  y: 0,
  size: 32,
  pickedUp: false
};

var clinic = {
  x: 3000,
  y: 0,
  width: 240,  // was 100
  height: 190  //was 100
};

//draw the clinic standing on the ground
function drawClinic() {
  var screenX = Math.round(clinic.x - camera.x);

  // skip drawing when it is off screen
  if (screenX > canvas.width || screenX + clinic.width < 0) return;

  ctx.drawImage(images.clinic, screenX, Math.round(groundTop() - clinic.height));
}
// package position
deliveryPackage.y = groundTop() - deliveryPackage.size;

function updateDelivery() {

  // package postion
  deliveryPackage.y = groundTop() - deliveryPackage.size;

  //cant walk past the package before picking it up
  if (!deliveryPackage.pickedUp && player.x > deliveryPackage.x + 20) {
    player.x = deliveryPackage.x + 20;
  }

  // idk but pick up package
  if (!deliveryPackage.pickedUp &&
      player.x < deliveryPackage.x + deliveryPackage.size &&
      player.x + player.size > deliveryPackage.x &&
      player.y < deliveryPackage.y + deliveryPackage.size &&
      player.y + player.size > deliveryPackage.y) {

    deliveryPackage.pickedUp = true;
    console.log('package picked up, game starts');
    showToast('GOT IT! GET TO THE CLINIC!');
  }
}

function drawDelivery() {

  if (!deliveryPackage.pickedUp) {
    var packageX = deliveryPackage.x - camera.x;

    // bouncing hint so people know what to do
    if (gameState === 'playing') {
      var bounce = Math.sin(performance.now() / 200) * 5;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f4dfb3';
      ctx.fillText('GRAB THE PACKAGE!', packageX + 16, deliveryPackage.y - 24 + bounce);
      ctx.textAlign = 'left';
    }

    // box
    ctx.fillStyle = '#c98b45';
    ctx.fillRect(
      packageX,
      deliveryPackage.y,
      deliveryPackage.size,
      deliveryPackage.size
    );

    // tape (works now!!)
    ctx.fillStyle = '#f4dfb3';
    ctx.fillRect(
      packageX + 13,
      deliveryPackage.y,
      6,
      deliveryPackage.size
    );

    // i think little red cross
    ctx.fillStyle = '#8f3f24';
    ctx.fillRect(
      packageX + 12,
      deliveryPackage.y + 9,
      8,
      14
    );

    ctx.fillRect(
      packageX + 9,
      deliveryPackage.y + 12,
      14,
      8
    );
  }

  // make package appear on top of playr head
  if (deliveryPackage.pickedUp) {

    ctx.fillStyle = '#c98b45';

    ctx.fillRect(
      player.x - camera.x + 4,
      player.y - 32,
      32,
      32
    );

    ctx.fillStyle = '#f4dfb3';

    ctx.fillRect(
      player.x - camera.x + 17,
      player.y - 32,
      6,
      32
    );

    ctx.fillStyle = '#8f3f24';

    ctx.fillRect(
      player.x - camera.x + 12,
      player.y - 23,
      16,
      8
    );

    ctx.fillRect(
      player.x - camera.x + 16,
      player.y - 27,
      8,
      16
    );
  }
}
