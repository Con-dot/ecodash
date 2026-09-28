// game states:'menu, playing, coinflip, won, over, scores
var TIME_LIMIT = 45;  // gets changed by the difficulty  // seconds the playr has to reach the clinic
var MAX_LIVES = 3;  // lives at the start of a run
var RESPAWN_INVULN = 2.5;  // seconds of protection after losing a life
var gameState = 'menu';
var timeLeft = TIME_LIMIT;
var lives = MAX_LIVES;
var hitFlash = 0;  //red screen flash when a life is lost (fades out)
var pendingSpot = null;  //where to put the player back after dying

// idk but little helpers to show / hide the overlay screens
function showOverlay(id) { document.getElementById(id).classList.remove('hidden'); }
function hideOverlay(id) { document.getElementById(id).classList.add('hidden'); }

//lives (hearts in the HUD)
function updateLivesHud() {
  var hearts = '';
  for (var i = 0; i < MAX_LIVES; i++) {
    hearts += '<span class="heart' + (i < lives ? '' : ' lost') + '">&#9829;</span>';
  }
  document.getElementById('hearts').innerHTML = hearts;
}

// short message at the top of the scren
var toastTimer = null;
function showToast(text) {
  var toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 1700);
}

//menu
// difficulty: how far the clinic is + how much time you get
var DIFFICULTIES = [
  { name: 'EASY', dist: 3000, time: 45 },
  { name: 'MEDIUM', dist: 30000, time: 150 },
  { name: 'HARD', dist: 50000, time: 230 }
];
var difficulty = 0;

function showDifficulty() {
  gameState = 'difficulty';
  hideOverlay('menu');
  hideOverlay('gameOver');
  hideOverlay('highscores');
  showOverlay('difficulty');
}

function chooseDifficulty(n) {
  difficulty = n;
  clinic.x = DIFFICULTIES[n].dist;
  TIME_LIMIT = DIFFICULTIES[n].time;
  console.log('difficulty', DIFFICULTIES[n].name, clinic.x);
  resetGame();
}

function showMenu() {
  gameState = 'menu';
  document.getElementById('menuHigh').textContent = 'HIGH SCORE: ' + String(highScore).padStart(6, '0');
  hideOverlay('gameOver');
  hideOverlay('highscores');
  hideOverlay('difficulty');
  hideOverlay('coinflip');
  showOverlay('menu');
}

function updateTimer(dt) {
  // TODO: make the timer flash when its low
  timeLeft = Math.max(0, timeLeft - dt);
  document.getElementById('timer').textContent = 'TIME: ' + Math.ceil(timeLeft);

  if (timeLeft <= 0) {
    die('You ran out of time!');
  }
}

// has the courier reached the clinic door
function checkClinicReached() {
  var playerMiddle = player.x + player.size / 2;
  if (playerMiddle < clinic.x + clinic.width / 2) return;

  if (deliveryPackage.pickedUp) {
    endGame(true, 'Package delivered!');
  } else {
    endGame(false, 'You reached the clinic without the package!');
  }
}

function endGame(won, reason) {
  gameState = won ? 'won' : 'over';

  // time bonus for delivering the package
  if (won) {
    bonusScore += Math.ceil(timeLeft) * 10;
    score = Math.floor(furthestX / 10) + bonusScore;
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('ecoDashHighScore', highScore);
  }

  document.getElementById('gameOverTitle').textContent = won ? 'DELIVERED! HONGERA!' : 'GAME OVER';
  document.getElementById('gameOverReason').textContent = reason;
  document.getElementById('gameOverScore').textContent = 'SCORE: ' + String(score).padStart(6, '0');
  document.getElementById('gameOverHigh').textContent = 'HIGH SCORE: ' + String(highScore).padStart(6, '0');
  showOverlay('gameOver');
  scoreSaved = false;
  myRank = -1;
}

// idk but dying, lives and the last-chance coin flip ----------
// every death costs one life and you get back up straight away dont touch this
// losing the LAST life triggers the coin flip
var coinResult = null;
var coinReady = false;  //true once the coin has landed and the button works
var coinReason = '';

function die(reason, spot) {
  if (gameState != 'playing') return;

  lives = Math.max(0, lives - 1);
  updateLivesHud();
  hitFlash = 1;
  coinReason = reason;
  pendingSpot = spot || null;
  releaseKeys();

  if (lives > 0) {
    revive();
    showToast(reason + '  ' + lives + (lives == 1 ? ' LIFE LEFT' : ' LIVES LEFT'));
  } else {
    gameState = 'coinflip';
    startCoinFlip(reason);
  }
}

function startCoinFlip(reason) {
  var heads = Math.random() < 0.5;
  coinResult = heads ? 'heads' : 'tails';
  coinReady = false;

  document.getElementById('coinReason').textContent = reason;
  document.getElementById('coinText').textContent = 'Flipping the coin...';
  document.getElementById('coinButton').classList.add('hidden');
  showOverlay('coinflip');

  // restart the CSS animation
  var coin = document.getElementById('coin');
  var wrap = document.getElementById('coinWrap');
  coin.classList.remove('spinning');
  wrap.style.animation = 'none';
  coin.style.setProperty('--end', (heads ? 1800 : 1980) + 'deg');
  void coin.offsetWidth;  // forces the browser to notice, so the animation restarts
  wrap.style.animation = '';
  coin.classList.add('spinning');

  setTimeout(() => {
    if (gameState != 'coinflip') return;
    coinReady = true;

    var button = document.getElementById('coinButton');
    if (heads) {
      document.getElementById('coinText').textContent = 'HEADS! You get an extra life!';
      button.textContent = 'CONTINUE';
    } else {
      document.getElementById('coinText').textContent = 'TAILS! No lives left...';
      button.textContent = 'GAME OVER';
    }
    button.classList.remove('hidden');
  }, 1900);
}

function finishCoinFlip() {
  if (!coinReady) return;
  coinReady = false;
  hideOverlay('coinflip');

  if (coinResult === 'heads') {
    lives = 1;
    updateLivesHud();
    revive();
    gameState = 'playing';
    showToast('EXTRA LIFE!');
  } else {
    endGame(false, 'You ran out of lives!');
  }
}

//get back up after losing a life
function revive() {

  // water / spikes
  if (pendingSpot) {
    player.x = Math.max(0, pendingSpot.x);
    player.y = groundTop() - player.size;
    player.onGround = true;
    pendingSpot = null;
  }

  //get rid of anything dangerous right next to us (works now!!)
  enemies = enemies.filter(e => Math.abs(e.x - player.x) > 300);
  crates = [];
  rocks = [];

  player.velocityY = 0;
  player.invuln = RESPAWN_INVULN;
  energy.exhausted = false;

  // ran out of time? you get a little extra
  timeLeft = Math.max(timeLeft, coinReason == 'You ran out of time!' ? 15 : 10);

  releaseKeys();
}

// start again without refreshing the page
function resetGame() {
  console.log('new game');

  player.x = 0;
  player.y = groundTop() - player.size;
  player.velocityY = 0;
  player.onGround = true;
  player.facing = 1;
  player.invuln = 0;
  releaseKeys();

  // full energy lol
  energy.value = energy.max;
  energy.boosting = false;
  energy.exhausted = false;

  platforms = [];
  enemies = [];
  lastPlatformRight = 400;
  lastHeightTiles = 0;
  resetHazards();
  resetPads();

  //full lives <- important
  lives = MAX_LIVES;
  hitFlash = 0;
  pendingSpot = null;
  updateLivesHud();

  // package back on the ground, score back to zero
  deliveryPackage.pickedUp = false;
  score = 0;
  bonusScore = 0;
  furthestX = 0;

  //the storm never stops: only the lightning restarts
  weather.flash = 0;
  weather.bolt = null;
  weather.nextLightning = 2;

  timeLeft = TIME_LIMIT;
  gameState = 'playing';
  hideOverlay('menu');
  hideOverlay('gameOver');
  hideOverlay('highscores');
  hideOverlay('difficulty');
  hideOverlay('coinflip');
  showToast('Karibu! Grab the package to start');
}

//buttons and the Enter key ----------
document.getElementById('playButton').addEventListener('click', e => {
  e.target.blur();  // so pressing Space afterwards does not press the button again (works now!!)
  showDifficulty();
});

document.getElementById('easyButton').addEventListener('click', e => { e.target.blur(); chooseDifficulty(0); });
document.getElementById('mediumButton').addEventListener('click', e => { e.target.blur(); chooseDifficulty(1); });
document.getElementById('hardButton').addEventListener('click', e => { e.target.blur(); chooseDifficulty(2); });

document.getElementById('scoresButton').addEventListener('click', e => {
  e.target.blur();
  showScoresPage();
});

document.getElementById('saveScoreButton').addEventListener('click', e => {
  e.target.blur();
  submitName();
});

document.getElementById('restartButton').addEventListener('click', e => {
  e.target.blur();
  showDifficulty();  // pick the route again
});

document.getElementById('coinButton').addEventListener('click', e => {
  e.target.blur();
  finishCoinFlip();
});

window.addEventListener('keydown', e => {
  if (gameState == 'difficulty') {
    if (e.key == '1') chooseDifficulty(0);
    if (e.key == '2') chooseDifficulty(1);
    if (e.key == '3') chooseDifficulty(2);
  }

  if (e.key !== 'Enter') return;
  e.preventDefault();

  if (gameState == 'menu') showDifficulty();
  else if (gameState == 'coinflip') finishCoinFlip();
  else if (gameState == 'won' || gameState == 'over') showScoresPage();
  else if (gameState == 'scores') {
    //name box still open? then enter saves the name idk why
    if (!scoreSaved && scoreQualifies(score)) submitName();
    else showDifficulty();
  }
});

// basically show the hearts as soon as the page loads
updateLivesHud();
