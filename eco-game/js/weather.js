//weather: a permanent thunderstorm
var MAX_RAINDROPS = 400;
var STORM_DARKNESS = 0.6;  // how dark the edges of the screen get works now!!

var weather = {
  rain: 1,  //always a full storm
  wind: -220,  //sideways speed of the rain
  flash: 0,  // lightning brightness, fades out quickly (works now!!)
  nextLightning: 2,  // ok so seconds until the next strike
  bolt: null  // the points of the lightning bolt currently on screen
};

var raindrops = [];
for (var i = 0; i < MAX_RAINDROPS; i++) {
  raindrops.push({
    x: Math.random() * 1600 - 200,
    y: Math.random() * 1000,
    speed: 700 + Math.random() * 400,
    length: 12 + Math.random() * 14
  });
}

// a jagged line from the sky down to the ground
function makeBolt() {
  var points = [];
  var x = Math.random() * canvas.width;
  var y = 0;

  while (y < groundTop()) {
    points.push({ x: x, y: y });
    x += (Math.random() - 0.5) * 60;
    y += 30 + Math.random() * 30;
  }
  points.push({ x: x, y: groundTop() });
  return points;
}

function updateWeather(dt) {

  // move the raindrops
  for (var i = 0; i < MAX_RAINDROPS; i++) {
    var drop = raindrops[i];
    drop.y += drop.speed * dt;
    drop.x += weather.wind * dt;

    if (drop.y > canvas.height || drop.x < -50) {
      drop.y = -20;
      drop.x = Math.random() * (canvas.width + 300);
    }
  }

  weather.nextLightning -= dt;
  if (weather.nextLightning <= 0) {
    weather.flash = 1;
    weather.bolt = makeBolt();
    playThunder();
    weather.nextLightning = Math.random() < 0.3 ? 0.25 + Math.random() * 0.2 : 2.5 + Math.random() * 4.5;
  }
  weather.flash = Math.max(0, weather.flash - dt * 3);
}

function drawWeather() {

  //darkness: the storm dims everything except a lit area around the player
  //(this is the gameplay effect
  var playerScreenX = player.x - camera.x + player.size / 2;
  var playerScreenY = player.y + player.size / 2;
  var radius = 900 - 500 * weather.rain;

  var darkness = ctx.createRadialGradient(playerScreenX, playerScreenY, radius * 0.25, playerScreenX, playerScreenY, radius);
  darkness.addColorStop(0, `rgba(10, 20, 40, ${0.15 * weather.rain})`);
  darkness.addColorStop(1, `rgba(10, 20, 40, ${STORM_DARKNESS * weather.rain})`);
  ctx.fillStyle = darkness;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // rain streaks: one line per drop, slanted by the wind
  ctx.strokeStyle = `rgba(200, 225, 255, ${0.25 + 0.35 * weather.rain})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (var i = 0; i < MAX_RAINDROPS; i++) {
    var drop = raindrops[i];
    var slant = weather.wind / drop.speed * drop.length;
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + slant, drop.y + drop.length);
  }
  ctx.stroke();

  // lightning: bolt first, then a white flash over everything
  if (weather.flash > 0) {
    if (weather.bolt && weather.flash > 0.5) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      weather.bolt.forEach((point, i) => {
        if (i == 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * weather.flash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// sound: rain hiss and thunder, made with the Web Audio API (no sound files needed) ----------
// browsers only allow sound after the player has pressed a key or clicked
// press M to mute / unmute
var audioCtx = null;
var masterGain = null;
var thunderBuffer = null;
var muted = false;

function startAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(audioCtx.destination);

  // white noise for the rain (2 seconds looped)
  var rainBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  var rainData = rainBuffer.getChannelData(0);
  for (var i = 0; i < rainData.length; i++) rainData[i] = Math.random() * 2 - 1;

  var rainSource = audioCtx.createBufferSource();
  rainSource.buffer = rainBuffer;
  rainSource.loop = true;

  var rainFilter = audioCtx.createBiquadFilter();
  rainFilter.type = 'highpass';
  rainFilter.frequency.value = 1500;

  var rainGain = audioCtx.createGain();
  rainGain.gain.value = 0.05;

  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(masterGain);
  rainSource.start();

  thunderBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
  var thunderData = thunderBuffer.getChannelData(0);
  var last = 0;
  for (var i = 0; i < thunderData.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    thunderData[i] = last * 3.5;
  }
}

function playThunder() {
  if (!audioCtx || audioCtx.state != 'running' || !thunderBuffer) return;

  //the sound arrives a moment after the flash
  var start = audioCtx.currentTime + 0.1 + Math.random() * 0.7;

  var source = audioCtx.createBufferSource();
  source.buffer = thunderBuffer;

  var filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, start);
  filter.frequency.exponentialRampToValueAtTime(70, start + 3);

  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(1.2, start + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 3.5);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(start);
  source.stop(start + 4);
}

window.addEventListener('keydown', e => {
  startAudio();
  if (e.target.tagName === 'INPUT') return;
  if (e.key.toLowerCase() == 'm') {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  }
});
window.addEventListener('pointerdown', startAudio);
