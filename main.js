// Costanti emoji e probabilità
const EMOJI_LIST = ['🏀','⚽️','⚾️','🥎','🏈','🏉','🏐','🎱','🧿','🪩','🧶','🥏','🐡','🎃'];
const ELEMENT_TYPES = [
  { type: 'basket', icon: '🗑', probability: 30 },
  { type: 'brick', icon: '🧱', probability: 20 },
  { type: 'sword', icon: '⚔️', probability: 10 },
  { type: 'snail', icon: '🐌', probability: 20 },
  { type: 'battery', icon: '🔋', probability: 20 },
  { type: 'magnet', icon: '🧲', probability: 15 },
  { type: 'timeBonus', icon: '🕑', probability: 15 }
];

// Parametri di gioco
const GAME_DURATION = 180;        // secondi totali
const FALL_SPEED = 100;          // pixel al secondo
const SIDE_SPEED = 200;          // pixel al secondo (base)

// Durata effetti (in secondi)
const EFFECT_DURATIONS = {
  bounceDisable: 3,
  slow: 10,
  fast: 10,
  magnetUses: 5,
};

// LocalStorage keys
const LS_BEST_SCORE = 'bestScore';
const LS_LAST_SCORE = 'lastScore';

// Stato di base
let canvas, ctx;
let screenWidth, screenHeight;
let gameState = 'TITLE'; // TITLE, PLAYING, GAMEOVER
let selectedEmoji = EMOJI_LIST[0];
let bestScore = 0, lastScore = 0;

// Variabili di runtime
let player;
let elements = [];
let timeLeft = GAME_DURATION;
let score = 0;
let lastTimestamp = 0;
// Funzione di inizializzazione
function init() {
  // Canvas setup
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Carica punteggi da localStorage
  bestScore = parseInt(localStorage.getItem(LS_BEST_SCORE)) || 0;
  lastScore = parseInt(localStorage.getItem(LS_LAST_SCORE)) || 0;
  document.getElementById('bestScore').textContent = bestScore;
  document.getElementById('lastScore').textContent = lastScore;

  // Setup selettore emoji
  document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Evidenzia la selezione
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // Imposta emoji scelta
    selectedEmoji = btn.textContent;
    // Avvia subito la partita
    document.getElementById('titleScreen').style.display = 'none';
    startGame();
  });
});

  // Controlli touch
  setupControls();

  // Avvia loop titolo
  requestAnimationFrame(loop);
}

// Ridimensiona il canvas al 16:9 verticale centrato
function resizeCanvas() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerWidth * 16 / 9;
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  canvas.style.height = screenHeight + 'px';
}

// Loop principale (gestisce rendering e update in TITLE mostriamo schermo)
function loop(timestamp) {
  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (gameState === 'TITLE') {
    // Mostra solo schermata titolo
    // (render in overlay con HTML/CSS)
  }

  if (gameState === 'PLAYING') {
    update(dt);
    render();
  }

  requestAnimationFrame(loop);
}

// Avvia la partita
function startGame() {
  // Nascondi titolo
  document.getElementById('titleScreen').style.display = 'none';
  // Mostra i controlli touch
  document.getElementById('controls').style.display = 'flex';
  
  gameState = 'PLAYING';
  timeLeft = GAME_DURATION;
  score = 0;
  elements = [];
  player = {
    x: screenWidth / 2,
    y: screenHeight / 4,
    sideSpeed: SIDE_SPEED
  };
}
// Funzione di rendering
function render() {
  // Pulisce il canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disegna elemento guidato
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(selectedEmoji, player.x, player.y);

  // Disegna elementi cadenti
  ctx.font = '32px sans-serif';
  elements.forEach(el => {
    ctx.fillText(el.icon, el.x, el.y);
  });

  // Disegna HUD
  // Barra del tempo
  const timePct = timeLeft / GAME_DURATION;
  document.getElementById('timeBar').style.width = (timePct * 100) + '%';
  // Testo tempo e punteggio
  document.getElementById('timeText').textContent = Math.ceil(timeLeft);
  document.getElementById('scoreText').textContent = score;
}
function update(dt) {
  // Decrementa tempo
  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  // Move and remove elements
  elements = elements.filter(el => {
    el.y -= FALL_SPEED * dt;
    return el.y + 32 > 0; // mantieni se non oltre bordo superiore
  });

  // Spawning con probabilità
  if (Math.random() < 0.3 * dt) {
    spawnElement();
  }

  // Muovi il giocatore (controlli settati da setupControls)
  // player.vx impostata da eventi touch
  player.x += (player.vx || 0) * dt;
  // Limita ai bordi
  player.x = Math.max(0, Math.min(screenWidth, player.x));

  // Controlla collisioni
  elements.forEach(el => {
    if (isColliding(player, el)) handleCollision(el);
  });
}

// Funzione di spawning
function spawnElement() {
  const rand = Math.random() * 100;
  let acc = 0;
  for (const type of ELEMENT_TYPES) {
    acc += type.probability;
    if (rand <= acc) {
      elements.push({
        type: type.type,
        icon: type.icon,
        x: Math.random() * screenWidth,
        y: screenHeight + 32,
      });
      break;
    }
  }
}

// Rilevamento collisioni (AABB semplificato)
function isColliding(player, el) {
  const size = 32;
  return Math.abs(player.x - el.x) < size && Math.abs(player.y - el.y) < size;
}

// Gestione fine partita
function endGame() {
  gameState = 'GAMEOVER';
  // Mostra titolo
  document.getElementById('titleScreen').style.display = 'flex';
  // Nascondi i controlli touch
  document.getElementById('controls').style.display = 'none';

  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}
  gameState = 'GAMEOVER';
  document.getElementById('titleScreen').style.display = 'none';
  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}
// Funzione di rendering
function render() {
  // Pulisce il canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disegna elemento guidato
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(selectedEmoji, player.x, player.y);

  // Disegna elementi cadenti
  ctx.font = '32px sans-serif';
  elements.forEach(el => {
    ctx.fillText(el.icon, el.x, el.y);
  });

  // Disegna HUD
  // Barra del tempo
  const timePct = timeLeft / GAME_DURATION;
  document.getElementById('timeBar').style.width = (timePct * 100) + '%';
  // Testo tempo e punteggio
  document.getElementById('timeText').textContent = Math.ceil(timeLeft);
  document.getElementById('scoreText').textContent = score;
}
function setupControls() {
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

  leftBtn.addEventListener('touchstart', () => { player.vx = -player.sideSpeed; });
  leftBtn.addEventListener('touchend', () => { player.vx = 0; });
  rightBtn.addEventListener('touchstart', () => { player.vx = player.sideSpeed; });
  rightBtn.addEventListener('touchend', () => { player.vx = 0; });
}

// Avvia tutto
window.onload = init;
function update(dt) {
  // Decrementa tempo
  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  // Move and remove elements
  elements = elements.filter(el => {
    el.y -= FALL_SPEED * dt;
    return el.y + 32 > 0; // mantieni se non oltre bordo superiore
  });

  // Spawning con probabilità
  if (Math.random() < 0.3 * dt) {
    spawnElement();
  }

  // Muovi il giocatore (controlli settati da setupControls)
  // player.vx impostata da eventi touch
  player.x += (player.vx || 0) * dt;
  // Limita ai bordi
  player.x = Math.max(0, Math.min(screenWidth, player.x));

  // Controlla collisioni
  elements.forEach(el => {
    if (isColliding(player, el)) handleCollision(el);
  });
}

// Funzione di spawning
function spawnElement() {
  const rand = Math.random() * 100;
  let acc = 0;
  for (const type of ELEMENT_TYPES) {
    acc += type.probability;
    if (rand <= acc) {
      elements.push({
        type: type.type,
        icon: type.icon,
        x: Math.random() * screenWidth,
        y: screenHeight + 32,
      });
      break;
    }
  }
}

// Rilevamento collisioni (AABB semplificato)
function isColliding(player, el) {
  const size = 32;
  return Math.abs(player.x - el.x) < size && Math.abs(player.y - el.y) < size;
}

// Gestione fine partita
function endGame() {
  gameState = 'GAMEOVER';
  // Mostra titolo
  document.getElementById('titleScreen').style.display = 'flex';
  // Nascondi i controlli touch
  document.getElementById('controls').style.display = 'none';

  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}
// Funzione di rendering
function render() {
  // Pulisce il canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disegna elemento guidato
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(selectedEmoji, player.x, player.y);

  // Disegna elementi cadenti
  ctx.font = '32px sans-serif';
  elements.forEach(el => {
    ctx.fillText(el.icon, el.x, el.y);
  });

  // Disegna HUD
  // Barra del tempo
  const timePct = timeLeft / GAME_DURATION;
  document.getElementById('timeBar').style.width = (timePct * 100) + '%';
  // Testo tempo e punteggio
  document.getElementById('timeText').textContent = Math.ceil(timeLeft);
  document.getElementById('scoreText').textContent = score;
}
// All'interno di update(dt), già decrementiamo timeLeft e aggiorniamo score.
// Qui eventuale logica aggiuntiva per bonus magnet:

function applyMagnet(el) {
  // Sposta i cesti verso il player quando el.type=='magnet'
  elements.forEach(item => {
    if (item.type === 'basket' && player.magnetUses > 0) {
      // Leggero spostamento orizzontale verso player
      const dir = player.x > item.x ? 1 : -1;
      item.x += dir * (player.sideSpeed / 2) * (1/60);
    }
  });
  if (player.magnetUses > 0) player.magnetUses--;
}
function handleCollision(el) {
  switch (el.type) {
    case 'basket':
      score += 10;
      break;
    case 'brick':
      // Rimbalzo: disabilita movimenti per EFFECT_DURATIONS.bounceDisable
      player.vx = 0;
      disableControls(EFFECT_DURATIONS.bounceDisable);
      break;
    case 'sword':
      // Fine partita immediata
      timeLeft = 0;
      break;
    case 'snail':
      // Diminuisci velocità laterale per slow
      player.sideSpeed /= 2;
      setTimeout(() => { player.sideSpeed = SIDE_SPEED; }, EFFECT_DURATIONS.slow * 1000);
      break;
    case 'battery':
      // Aumenta velocità laterale
      player.sideSpeed *= 1.5;
      setTimeout(() => { player.sideSpeed = SIDE_SPEED; }, EFFECT_DURATIONS.fast * 1000);
      break;
    case 'magnet':
      // I cesti si muovono verso giocatore (gestito in update)
      player.magnetUses = EFFECT_DURATIONS.magnetUses;
      break;
    case 'timeBonus':
      // Aggiungi tempo
      timeLeft += 10;
      if (timeLeft > GAME_DURATION) timeLeft = GAME_DURATION;
      break;
  }
  // Rimuovi l'elemento dopo collisione
  elements = elements.filter(e => e !== el);
}

// Disabilita controlli per un tempo
function disableControls(sec) {
  player.controlsDisabled = true;
  setTimeout(() => { player.controlsDisabled = false; }, sec * 1000);
}
function setupControls() {
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

  leftBtn.addEventListener('touchstart', () => { player.vx = -player.sideSpeed; });
  leftBtn.addEventListener('touchend', () => { player.vx = 0; });
  rightBtn.addEventListener('touchstart', () => { player.vx = player.sideSpeed; });
  rightBtn.addEventListener('touchend', () => { player.vx = 0; });
}

// Avvia tutto
window.onload = init;
function update(dt) {
  // Decrementa tempo
  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  // Move and remove elements
  elements = elements.filter(el => {
    el.y -= FALL_SPEED * dt;
    return el.y + 32 > 0; // mantieni se non oltre bordo superiore
  });

  // Spawning con probabilità
  if (Math.random() < 0.3 * dt) {
    spawnElement();
  }

  // Muovi il giocatore (controlli settati da setupControls)
  // player.vx impostata da eventi touch
  player.x += (player.vx || 0) * dt;
  // Limita ai bordi
  player.x = Math.max(0, Math.min(screenWidth, player.x));

  // Controlla collisioni
  elements.forEach(el => {
    if (isColliding(player, el)) handleCollision(el);
  });
}

// Funzione di spawning
function spawnElement() {
  const rand = Math.random() * 100;
  let acc = 0;
  for (const type of ELEMENT_TYPES) {
    acc += type.probability;
    if (rand <= acc) {
      elements.push({
        type: type.type,
        icon: type.icon,
        x: Math.random() * screenWidth,
        y: screenHeight + 32,
      });
      break;
    }
  }
}

// Rilevamento collisioni (AABB semplificato)
function isColliding(player, el) {
  const size = 32;
  return Math.abs(player.x - el.x) < size && Math.abs(player.y - el.y) < size;
}

// Gestione fine partita
function endGame() {
  gameState = 'GAMEOVER';
  // Mostra titolo
  document.getElementById('titleScreen').style.display = 'flex';
  // Nascondi i controlli touch
  document.getElementById('controls').style.display = 'none';

  lastScore = score;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
  document.getElementById('lastScore').textContent = lastScore;
  document.getElementById('bestScore').textContent = bestScore;
}
// Funzione di rendering
function render() {
  // Pulisce il canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disegna elemento guidato
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(selectedEmoji, player.x, player.y);

  // Disegna elementi cadenti
  ctx.font = '32px sans-serif';
  elements.forEach(el => {
    ctx.fillText(el.icon, el.x, el.y);
  });

  // Disegna HUD
  // Barra del tempo
  const timePct = timeLeft / GAME_DURATION;
  document.getElementById('timeBar').style.width = (timePct * 100) + '%';
  // Testo tempo e punteggio
  document.getElementById('timeText').textContent = Math.ceil(timeLeft);
  document.getElementById('scoreText').textContent = score;
}
// Salva punteggi (già chiamato in endGame)
function saveScores() {
  localStorage.setItem(LS_LAST_SCORE, lastScore);
  localStorage.setItem(LS_BEST_SCORE, bestScore);
}

// Reset scores (facoltativo, per debug)
function resetScores() {
  localStorage.removeItem(LS_LAST_SCORE);
  localStorage.removeItem(LS_BEST_SCORE);
  document.getElementById('lastScore').textContent = 0;
  document.getElementById('bestScore').textContent = 0;
}

// Chiamata in endGame
// saveScores(); // se vuoi separare la logica
