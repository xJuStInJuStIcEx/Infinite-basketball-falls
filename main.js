// main.js – Codice ottimizzato

// COSTANTI DI GIOCO
const PLAYER_IMAGE_SRC  = 'Ninja.png';
const GAME_DURATION     = 180;    // secondi
const FALL_SPEED        = 100;    // px/s
const SIDE_SPEED        = 200;    // px/s
const EFFECT_DURATIONS  = { bounceDisable: 3, slow: 10, fast: 10, magnetUses: 5 };
const LS_BEST_SCORE     = 'bestScore';
const LS_LAST_SCORE     = 'lastScore';

// Tipi di elementi cadenti e probabilità
const ELEMENT_TYPES = [
  { type: 'basket',    icon: '🗑',  probability: 30 },
  { type: 'brick',     icon: '🧱', probability: 20 },
  { type: 'sword',     icon: '⚔️',  probability: 10 },
  { type: 'snail',     icon: '🐌',  probability: 20 },
  { type: 'battery',   icon: '🔋',  probability: 20 },
  { type: 'magnet',    icon: '🧲', probability: 15 },
  { type: 'timeBonus', icon: '🕑',  probability: 15 }
];

// CACHE PROBABILITÀ CUMULATIVE PER SPAWN
const spawnCumulProb = (() => {
  let acc = 0;
  return ELEMENT_TYPES.map(t => {
    acc += t.probability;
    return { ...t, threshold: acc };
  });
})();

// STATI E VARIABILI GLOBALI
let canvas, ctx;
let titleScreen, controlsEl, startBtn;
let leftBtn, rightBtn;
let timeBar, timeText, scoreText;
let debugLog;
let screenW, screenH;

let gameState     = 'TITLE';   // TITLE | PLAYING | GAMEOVER
let bestScore     = 0;
let lastScore     = 0;

// Oggetti runtime
let player;
let elements      = [];
let timeLeft      = GAME_DURATION;
let score         = 0;
let lastTimestamp = 0;

// CLASSE GIOCATORE
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.sideSpeed = SIDE_SPEED;
    this.effects = { slow: 0, fast: 0, bounceDisable: 0 };
    this.magnetUses = 0;
    this.imgLoaded = false;
    this.img = new Image();
    this.img.onload = () => this.imgLoaded = true;
    this.img.src = PLAYER_IMAGE_SRC;
  }

  update(dt) {
    // Aggiorna timer effetti
    for (let e in this.effects) {
      if (this.effects[e] > 0) {
        this.effects[e] = Math.max(0, this.effects[e] - dt);
      }
    }

    // Muovi orizzontalmente se non bloccato
    if (this.effects.bounceDisable <= 0) {
      this.x += this.vx * dt;
      // Limita ai bordi
      this.x = Math.max(0, Math.min(screenW, this.x));
    }
  }

  draw(ctx) {
    const size = 64;
    if (this.imgLoaded) {
      ctx.drawImage(
        this.img,
        this.x - size/2,
        this.y - size/2,
        size, size
      );
    } else {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading…', this.x, this.y);
    }
  }
}

// CLASSE ELEMENTI CADENTI
class FallingElement {
  constructor(type, icon, x, y) {
    this.type = type;
    this.icon = icon;
    this.x = x;
    this.y = y;
  }

  update(dt) {
    this.y -= FALL_SPEED * dt;
  }

  draw(ctx) {
    ctx.fillText(this.icon, this.x, this.y);
  }
}

// INIZIALIZZAZIONE
window.addEventListener('DOMContentLoaded', init);

function init() {
  // Riferimenti DOM
  canvas       = document.getElementById('gameCanvas');
  ctx          = canvas.getContext('2d');
  titleScreen  = document.getElementById('titleScreen');
  controlsEl   = document.getElementById('controls');
  startBtn     = document.getElementById('startBtn');
  leftBtn      = document.getElementById('leftBtn');
  rightBtn     = document.getElementById('rightBtn');
  timeBar      = document.getElementById('timeBar');
  timeText     = document.getElementById('timeText');
  scoreText    = document.getElementById('scoreText');
  debugLog     = document.getElementById('debugLog');

  // Canvas responsive
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Carica punteggi da LocalStorage
  bestScore = parseInt(localStorage.getItem(LS_BEST_SCORE)) || 0;
  lastScore = parseInt(localStorage.getItem(LS_LAST_SCORE)) || 0;
  document.getElementById('bestScore').textContent = bestScore;
  document.getElementById('lastScore').textContent = lastScore;

  // Bottone Inizia
  startBtn.addEventListener('click', () => {
    titleScreen.style.display = 'none';
    document.body.classList.add('playing');
    startGame();
  });

  // Setup controlli (pointer per mouse e touch)
  leftBtn.addEventListener('pointerdown', () => {
    if (player.effects.bounceDisable <= 0) player.vx = -SIDE_SPEED;
  });
  rightBtn.addEventListener('pointerdown', () => {
    if (player.effects.bounceDisable <= 0) player.vx = SIDE_SPEED;
  });
  ['pointerup','pointerleave'].forEach(evt => {
    leftBtn.addEventListener(evt,  () => player.vx = 0);
    rightBtn.addEventListener(evt, () => player.vx = 0);
  });

  // Avvia loop
  requestAnimationFrame(loop);
}

// Adatta canvas alla dimensione del container
function resizeCanvas() {
  // dimensioni basate su container 16:9 (come nel CSS)
  screenWidth  = window.innerWidth;
  screenHeight = screenWidth * 16 / 9;
  canvas.width  = screenWidth;
  canvas.height = screenHeight;
  // regola anche lo style-height per mantenere il container corretto
  canvas.style.height = screenHeight + 'px';
}

// Inizia partita
function startGame() {
  gameState = 'PLAYING';
  timeLeft  = GAME_DURATION;
  score     = 0;
  elements  = [];
  player    = new Player(screenW/2, screenH/4);
  lastTimestamp = performance.now();
}

// Termina partita
function endGame() {
  gameState = 'GAMEOVER';
  document.body.classList.remove('playing');
  titleScreen.style.display = 'flex';

  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}

// Loop principale
function loop(ts) {
  const dt = (ts - lastTimestamp) / 1000;
  lastTimestamp = ts;

  if (gameState === 'PLAYING') {
    update(dt);
    render();
  }

  requestAnimationFrame(loop);
}

// Aggiorna stato di gioco
function update(dt) {
  // Timer
  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  // Spawn casuale
  if (Math.random() < 1.2 * dt) spawnRandomElement();

  // Aggiorna elementi e li filtra quando fuori schermo
  elements = elements.filter(el => {
    el.update(dt);
    return el.y + 32 > 0;
  });

  // Effetto calamita
  if (player.magnetUses > 0) applyMagnet();

  // Aggiorna giocatore
  player.update(dt);

  // Collisioni
  elements.forEach(el => {
    if (isColliding(player, el)) handleCollision(el);
  });
}

// Renderizza scena
function render() {
  ctx.clearRect(0, 0, screenW, screenH);

  // Giocatore
  player.draw(ctx);

  // Elementi cadenti
  ctx.font = '32px sans-serif';
  elements.forEach(el => el.draw(ctx));

  // HUD
  timeBar.style.width = `${(timeLeft / GAME_DURATION) * 100}%`;
  timeText.textContent  = Math.ceil(timeLeft);
  scoreText.textContent = score;
}

// Crea un nuovo elemento in base a probabilità
function spawnRandomElement() {
  const r = Math.random() * spawnCumulProb.slice(-1)[0].threshold;
  const t = spawnCumulProb.find(o => r <= o.threshold);
  elements.push(
    new FallingElement(
      t.type,
      t.icon,
      Math.random() * screenW,
      screenH + 32
    )
  );
}

// Gestione collisione
function handleCollision(el) {
  switch (el.type) {
    case 'basket':
      score += 10;
      break;
    case 'brick':
      player.effects.bounceDisable = EFFECT_DURATIONS.bounceDisable;
      break;
    case 'sword':
      timeLeft = 0;
      break;
    case 'snail':
      player.effects.slow = EFFECT_DURATIONS.slow;
      break;
    case 'battery':
      player.effects.fast = EFFECT_DURATIONS.fast;
      break;
    case 'magnet':
      player.magnetUses = EFFECT_DURATIONS.magnetUses;
      break;
    case 'timeBonus':
      timeLeft = Math.min(GAME_DURATION, timeLeft + 10);
      break;
  }
  elements = elements.filter(x => x !== el);
}

// Controllo calamita: attira solo 'basket'
function applyMagnet() {
  elements.forEach(item => {
    if (item.type === 'basket') {
      const dir = player.x > item.x ? 1 : -1;
      item.x += dir * (SIDE_SPEED / 2) * (1 / 60);
    }
  });
  player.magnetUses--;
}

// Collisioni AABB semplice
function isColliding(p, el) {
  return (
    Math.abs(p.x - el.x) < 32 &&
    Math.abs(p.y - el.y) < 32
  );
}

// Debug log su schermo
function log(msg) {
  if (!debugLog) return;
  const time = new Date().toLocaleTimeString();
  debugLog.innerHTML += `[${time}] ${msg}<br>`;
  debugLog.scrollTop = debugLog.scrollHeight;
}
