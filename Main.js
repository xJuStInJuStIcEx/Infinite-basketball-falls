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
