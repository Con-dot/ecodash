var score = 0;
var highScore = localStorage.getItem('ecoDashHighScore') || 0;
var furthestX = 0;
var bonusScore = 0;  //points from enemies and the time bonus

//distance score lol
function updateScore() {

  if (player.x > furthestX) furthestX = player.x;
  score = Math.floor(furthestX / 10) + bonusScore;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('ecoDashHighScore', highScore);
  }

  document.getElementById('score').textContent =
    'SCORE: ' + String(score).padStart(6, '0');

  document.getElementById('highscore').textContent =
    'HIGH SCORE: ' + String(highScore).padStart(6, '0');

  // clinic distance bar <- important
  var distance = Math.max(0, clinic.x - player.x);
  var totalDistance = clinic.x;
  var progress = Math.min(100, Math.max(0, ((totalDistance - distance) / totalDistance) * 100));

  document.getElementById('distanceFill').style.width = progress + '%';
}

var MAX_SCORES = 10;
var scoreSaved = false;  //did the player already put their name in this run?
var myRank = -1;  // row to highlight

function getScores() {
  try {
    var list = JSON.parse(localStorage.getItem('ecoDashScores'));
    if (Array.isArray(list)) return list;
  } catch (err) {}
  return [];
}

// does this score make it onto the list?
function scoreQualifies(s) {
  if (s <= 0) return false;
  var list = getScores();
  return list.length < MAX_SCORES || s > list[list.length - 1].score;
}

function saveScore(name, s) {
  var list = getScores();
  var entry = { name: name, score: s, mode: DIFFICULTIES[difficulty].name.charAt(0) };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  var kept = list.slice(0, MAX_SCORES);
  localStorage.setItem('ecoDashScores', JSON.stringify(kept));
  return kept.indexOf(entry);
}

function renderScores() {
  var table = document.getElementById('scoreTable');
  var list = getScores();
  table.innerHTML = '';

  if (list.length === 0) {
    table.innerHTML = '<tr><td>no scores yet, deliver something!</td></tr>';
    return;
  }

  for (var i = 0; i < list.length; i++) {
    var row = document.createElement('tr');
    if (i == myRank) row.className = 'mine';
    row.innerHTML = '<td>' + (i + 1) + '.</td><td>' + list[i].name + '</td><td>' + (list[i].mode || '') + '</td><td>' +
      String(list[i].score).padStart(6, '0') + '</td>';
    table.appendChild(row);
  }
}

function showScoresPage() {
  gameState = 'scores';
  hideOverlay('gameOver');
  showOverlay('highscores');

  var canEnter = !scoreSaved && scoreQualifies(score);
  document.getElementById('nameRow').classList.toggle('hidden', !canEnter);
  document.getElementById('newScoreText').classList.toggle('hidden', !canEnter);

  renderScores();

  if (canEnter) {
    var input = document.getElementById('nameInput');
    input.value = '';
    input.focus();
  }
}

function submitName() {
  if (scoreSaved) return;
  var name = document.getElementById('nameInput').value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (name === '') name = 'COURIER';

  myRank = saveScore(name, score);
  scoreSaved = true;
  document.getElementById('nameRow').classList.add('hidden');
  document.getElementById('newScoreText').classList.add('hidden');
  renderScores();
}
