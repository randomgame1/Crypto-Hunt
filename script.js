// Get canvas and its context
const canvas = document.getElementById('gameCanvas');
canvas.width = 700;
canvas.height = 500;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true; // Enable smoother images

// Global game variables
let score = 0;
let level = 1;
let speedMultiplier = 1;
let gameOver = false;
let lastCollectedCrypto = 'None';
let lastBadCrypto = 'None';

// Get UI overlay elements from the game container
const scoreOverlay = document.getElementById('scoreOverlay');
const lastCollectedOverlay = document.getElementById('lastCollectedOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const restartButton = document.getElementById('restartButton');

// Player definition; drawn using a custom image if available
const player = {
  x: 20,
  y: 20,
  width: 20,
  height: 20,
  speed: 3,
  dx: 0,
  dy: 0
};

// Preload background and player images
const bgImage = new Image();
bgImage.src = 'images/background.jpg';
const playerImage = new Image();
playerImage.src = 'images/player.png';

// Preload crypto images
const goodCryptoFilenames = [
  'bitcoin.png',
  'bitcoin-cash.png',
  'bitcoin-sv.png',
  'ethereum.png',
  'tether.png',
  'litecoin.png'
];
const badCryptoFilenames = [
  'cardano.png',
  'cosmos.png',
  'dogecoin.png',
  'polkadot.png',
  'shiba-inu.png',
  'uniswap.png',
  'xrp.png'
];

const goodCryptoImages = [];
const badCryptoImages = [];

// Helper: Convert filename to formatted name
function formatName(filename) {
  let name = filename.split('.')[0];
  name = name.replace(/-/g, ' ');
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return name;
}

// Preload good crypto images
goodCryptoFilenames.forEach(filename => {
  const img = new Image();
  img.src = `images/goodCryptoImages/${filename}`;
  goodCryptoImages.push({ image: img, name: formatName(filename) });
});

// Preload bad crypto images
badCryptoFilenames.forEach(filename => {
  const img = new Image();
  img.src = `images/badCryptoImages/${filename}`;
  badCryptoImages.push({ image: img, name: formatName(filename) });
});

// Array to hold crypto objects
let cryptos = [];

// Returns a random position at least 200px away from the player's starting point.
function getRandomPositionAwayFromPlayer(size) {
  let pos, distance;
  do {
    pos = {
      x: Math.random() * (canvas.width - size * 2) + size,
      y: Math.random() * (canvas.height - size * 2) + size
    };
    distance = Math.sqrt((pos.x - player.x) ** 2 + (pos.y - player.y) ** 2);
  } while (distance < 200);
  return pos;
}

// Create a crypto object with random movement
function createCrypto(x, y, type) {
  let cryptoAsset;
  if (type === 'good') {
    cryptoAsset = goodCryptoImages[Math.floor(Math.random() * goodCryptoImages.length)];
  } else if (type === 'bad') {
    cryptoAsset = badCryptoImages[Math.floor(Math.random() * badCryptoImages.length)];
  }
  let angle = Math.random() * Math.PI * 2;
  let baseSpeed = 0.5 + Math.random();
  let speed = baseSpeed * speedMultiplier;
  return {
    x: x,
    y: y,
    type: type,
    image: cryptoAsset.image,
    name: cryptoAsset.name,
    size: 15,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed
  };
}

// Initialize a level by spawning 6 good and 7 bad cryptos.
function initLevel() {
  cryptos = [];
  for (let i = 0; i < 6; i++) {
    let pos = getRandomPositionAwayFromPlayer(15);
    cryptos.push(createCrypto(pos.x, pos.y, 'good'));
  }
  for (let i = 0; i < 7; i++) {
    let pos = getRandomPositionAwayFromPlayer(15);
    cryptos.push(createCrypto(pos.x, pos.y, 'bad'));
  }
}

// Reset game state for a new game.
function initGame() {
  score = 0;
  level = 1;
  speedMultiplier = 1;
  gameOver = false;
  lastCollectedCrypto = 'None';
  lastBadCrypto = 'None';
  
  player.x = 20;
  player.y = 20;
  player.dx = 0;
  player.dy = 0;
  
  initLevel();
  
  updateOverlays();
  gameOverOverlay.style.display = 'none';
  restartButton.style.display = 'none';
  console.log('Game initialized');
}

// Level up: Increase level, raise speed, and reinitialize cryptos.
function levelUp() {
  level++;
  speedMultiplier += 0.2;
  initLevel();
}

// Drawing functions
function drawBackground() {
  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlayer() {
  if (playerImage.complete) {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}

function drawCryptos() {
  cryptos.forEach(crypto => {
    if (crypto.image.complete) {
      ctx.drawImage(
        crypto.image,
        crypto.x - crypto.size,
        crypto.y - crypto.size,
        crypto.size * 2,
        crypto.size * 2
      );
    } else {
      // Fallback: Draw a colored circle if the image isn't loaded
      ctx.beginPath();
      ctx.arc(crypto.x, crypto.y, crypto.size, 0, Math.PI * 2);
      ctx.fillStyle = crypto.type === 'good' ? 'green' : 'red';
      ctx.fill();
    }
  });
}

// Movement updates
function updatePlayer() {
  player.x += player.dx;
  player.y += player.dy;
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function updateCrypto(crypto) {
  const oldX = crypto.x;
  const oldY = crypto.y;
  crypto.x += crypto.dx;
  crypto.y += crypto.dy;
  if (crypto.x - crypto.size < 0 || crypto.x + crypto.size > canvas.width) {
    crypto.x = oldX;
    crypto.dx = -crypto.dx;
  }
  if (crypto.y - crypto.size < 0 || crypto.y + crypto.size > canvas.height) {
    crypto.y = oldY;
    crypto.dy = -crypto.dy;
  }
}

// Collision detection and handling
function checkCollisions() {
  for (let i = cryptos.length - 1; i >= 0; i--) {
    const crypto = cryptos[i];
    const distX = Math.abs((player.x + player.width / 2) - crypto.x);
    const distY = Math.abs((player.y + player.height / 2) - crypto.y);
    const distance = Math.sqrt(distX * distX + distY * distY);
    if (distance < crypto.size + Math.max(player.width, player.height) / 2) {
      if (crypto.type === 'good') {
        score += 10;
        lastCollectedCrypto = crypto.name;
        cryptos.splice(i, 1);
      } else if (crypto.type === 'bad') {
        lastBadCrypto = crypto.name;
        gameOver = true;
      }
    }
  }
  const goodRemaining = cryptos.some(c => c.type === 'good');
  if (!goodRemaining && !gameOver) {
    levelUp();
  }
}

// Update the overlay UI elements
function updateOverlays() {
  scoreOverlay.innerText = `Score: ${score} | Level: ${level}`;
  lastCollectedOverlay.innerText = `Last Collected: ${lastCollectedCrypto}`;
}

// When game over, update the overlay to show final score and wrong crypto collected.
function handleGameOver() {
  gameOverOverlay.innerHTML = `Game Over! Your score: ${score}<br>Wrong Crypto collected: ${lastBadCrypto}`;
  gameOverOverlay.style.display = 'block';
  restartButton.style.display = 'inline-block';
}

// Main game loop
function update() {
  if (gameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlayer();
    drawCryptos();
    handleGameOver();
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  updatePlayer();
  cryptos.forEach(crypto => updateCrypto(crypto));
  checkCollisions();
  drawPlayer();
  drawCryptos();
  updateOverlays();
  
  requestAnimationFrame(update);
}

// Input handling
function keyDownHandler(e) {
  if (e.key === 'ArrowRight') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft') {
    player.dx = -player.speed;
  } else if (e.key === 'ArrowUp') {
    player.dy = -player.speed;
  } else if (e.key === 'ArrowDown') {
    player.dy = player.speed;
  }
}
function keyUpHandler(e) {
  if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
    player.dx = 0;
  }
  if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
    player.dy = 0;
  }
}
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// Start the game once the window has loaded
window.onload = function () {
  initGame();
  update();
};

// Restart button listener
restartButton.addEventListener('click', () => {
  initGame();
  gameOverOverlay.style.display = 'none';
  update();
});
