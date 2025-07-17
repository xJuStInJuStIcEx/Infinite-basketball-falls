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
  // … codice esistente …

  // Nascondi controlli di default
  document.getElementById('controls').style.display = 'none';

  // Seleziona il pulsante “Inizia!” e aggiungi il listener
  const startBtn = document.getElementById('startBtn');
  startBtn.addEventListener('click', () => {
    // Nascondi overlay titolo
    document.getElementById('titleScreen').style.display = 'none';
    // Aggiungi classe playing per mostrare controlli
    document.body.classList.add('playing');
    // Mostra i controlli touch
    document.getElementById('controls').style.display = 'flex';
    // Avvia la partita
    startGame();
  });

  // Setup controlli touch
  setupControls();

  // Avvia il loop di gioco
  requestAnimationFrame(loop);
}
