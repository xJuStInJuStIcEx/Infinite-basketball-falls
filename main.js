// Immagine del giocatore
const PLAYER_IMAGE_SRC = 'Ninja.png';
let playerImage = new Image();
playerImage.src = PLAYER_IMAGE_SRC;
let playerImageLoaded = false;
playerImage.onload = () => {
  playerImageLoaded = true;
  console.log('Player image caricata');
};

const ELEMENT_TYPES = [
  { type: 'basket',    icon: '🗑', probability: 30 },
  { type: 'brick',     icon: '🧱', probability: 20 },
  { type: 'sword',     icon: '⚔️', probability: 10 },
  { type: 'snail',     icon: '🐌', probability: 20 },
  { type: 'battery',   icon: '🔋', probability: 20 },
  { type: 'magnet',    icon: '🧲', probability: 15 },
  { type: 'timeBonus', icon: '🕑', probability: 15 }
];

const GAME_DURATION    = 180;
const FALL_SPEED       = 100;
const SIDE_SPEED       = 200;
const EFFECT_DURATIONS = { bounceDisable: 3, slow: 10, fast: 10, magnetUses: 5 };

const LS_BEST_SCORE = 'bestScore';
const LS_LAST_SCORE = 'lastScore';

let canvas, ctx;
let screenWidth, screenHeight;
let gameState = 'TITLE';
let bestScore = 0;
let lastScore = 0;

let player = {};
let elements = [];
let timeLeft = GAME_DURATION;
let score = 0;
let lastTimestamp = 0;

window.addEventListener('DOMContentLoaded', init);

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bestScore = parseInt(localStorage.getItem(LS_BEST_SCORE)) || 0;
  lastScore = parseInt(localStorage.getItem(LS_LAST_SCORE)) || 0;
  document.getElementById('bestScore').textContent = bestScore;
  document.getElementById('lastScore').textContent = lastScore;

  document.getElementById('controls').style.display = 'none';

  setupControls();

  requestAnimationFrame(loop);
}

function resizeCanvas() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerWidth * 16 / 9;
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  canvas.style.height = screenHeight + 'px';
}

function loop(timestamp) {
  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (gameState === 'PLAYING') {
    update(dt);
    render();
  }

  requestAnimationFrame(loop);
}

function startGame() {
  document.body.classList.add('playing');

  gameState = 'PLAYING';
  timeLeft = GAME_DURATION;
  score = 0;
  elements = [];
  player = {
    x: screenWidth / 2,
    y: screenHeight / 4,
    sideSpeed: SIDE_SPEED,
    vx: 0,
    magnetUses: 0,
    controlsDisabled: false
  };
  lastTimestamp = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  gameState = 'GAMEOVER';
  document.body.classList.remove('playing');
  document.getElementById('titleScreen').style.display = 'flex';

  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}

function update(dt) {
  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  if (Math.random() < 1.2 * dt) spawnElement();

  elements = elements.filter(el => {
    el.y -= FALL_SPEED * dt;
    return el.y + 32 > 0;
  });

  if (player.magnetUses > 0) applyMagnet();

  if (!player.controlsDisabled) {
    player.x += (player.vx || 0) * dt;
    player.x = Math.max(0, Math.min(screenWidth, player.x));
  }

  elements.forEach(el => {
    if (isColliding(player, el)) handleCollision(el);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (playerImageLoaded) {
    const imgW = 64, imgH = 64;
    ctx.drawImage(playerImage, player.x - imgW / 2, player.y - imgH / 2, imgW, imgH);
  } else {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading…', player.x, player.y);
  }

  ctx.font = '32px sans-serif';
  elements.forEach(el => {
    ctx.fillText(el.icon, el.x, el.y);
  });

  const timePct = timeLeft / GAME_DURATION;
  document.getElementById('timeBar').style.width = `${timePct * 100}%`;
  document.getElementById('timeText').textContent = Math.ceil(timeLeft);
  document.getElementById('scoreText').textContent = score;
}

function setupControls() {
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

  leftBtn.addEventListener('touchstart', () => {
    if (!player.controlsDisabled) player.vx = -player.sideSpeed;
  });
  leftBtn.addEventListener('touchend', () => {
    player.vx = 0;
  });
  rightBtn.addEventListener('touchstart', () => {
    if (!player.controlsDisabled) player.vx = player.sideSpeed;
  });
  rightBtn.addEventListener('touchend', () => {
    player.vx = 0;
  });
}

function spawnElement() {
  const rand = Math.random() * 100;
  let acc = 0;
  for (const t of ELEMENT_TYPES) {
    acc += t.probability;
    if (rand <= acc) {
      elements.push({
        type: t.type,
        icon: t.icon,
        x: Math.random() * screenWidth,
        y: screenHeight + 32
      });
      break;
    }
  }
}

function isColliding(p, el) {
  const size = 32;
  return Math.abs(p.x - el.x) < size && Math.abs(p.y - el.y) < size;
}

function handleCollision(el) {
  switch (el.type) {
    case 'basket':
      score += 10;
      break;
    case 'brick':
      player.vx = 0;
      disableControls(EFFECT_DURATIONS.bounceDisable);
      break;
    case 'sword':
      timeLeft = 0;
      break;
    case 'snail':
      player.sideSpeed /= 2;
      setTimeout(() => player.sideSpeed = SIDE_SPEED, EFFECT_DURATIONS.slow * 1000);
      break;
    case 'battery':
      player.sideSpeed *= 1.5;
      setTimeout(() => player.sideSpeed = SIDE_SPEED, EFFECT_DURATIONS.fast * 1000);
      break;
    case 'magnet':
      player.magnetUses = EFFECT_DURATIONS.magnetUses;
      break;
    case 'timeBonus':
      timeLeft = Math.min(GAME_DURATION, timeLeft + 10);
      break;
  }
  elements = elements.filter(e => e !== el);
}

function applyMagnet() {
  elements.forEach(item => {
    if (item.type === 'basket') {
      const dir = player.x > item.x ? 1 : -1;
      item.x += dir * (player.sideSpeed / 2) * (1 / 60);
    }
  });
  player.magnetUses--;
}

function disableControls(sec) {
  player.controlsDisabled = true;
  setTimeout(() => {
    player.controlsDisabled = false;
  }, sec * 1000);
}
