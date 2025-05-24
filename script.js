// Get a reference to the canvas element
const canvas = document.getElementById('gameCanvas');
// Get the 2D rendering context
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game state
let animationFrameId; // To control the game loop

// Game constants
const gravity = 0.8;

// Player properties
const player = {
  x: 50, 
  y: 0, 
  width: 30,
  height: 50,
  color: 'red', // Restored color
  speed: 5,
  velocityY: 0, 
  jumpForce: 15, 
  isOnGround: true 
};
player.y = canvas.height - player.height - 10; 


// Platforms array
const platforms = [
  { x: 100, y: canvas.height - 100, width: 150, height: 20, color: 'green' }, // Restored color
  { x: 300, y: canvas.height - 200, width: 100, height: 20, color: 'green' }, // Restored color
  { x: 500, y: canvas.height - 300, width: 120, height: 20, color: 'green' }  // Restored color
];

// Enemies array
const enemyHeight = 40;
const enemyWidth = 30;
const enemies = [
  { 
    x: 400, 
    y: canvas.height - enemyHeight - 10, 
    width: enemyWidth, 
    height: enemyHeight, 
    color: 'brown', // Restored color
    speed: 1, 
    startX: 400, 
    moveRange: 100,
    isActive: true
  },
  { 
    x: platforms[0].x + 20, 
    y: platforms[0].y - enemyHeight, 
    width: enemyWidth, 
    height: enemyHeight, 
    color: 'brown', // Restored color
    speed: 0.8, 
    startX: platforms[0].x + 20, 
    moveRange: platforms[0].width - enemyWidth - 40,
    isActive: true
  }
];
if (enemies.length > 1) {
    const platformEnemy = enemies[1];
    const platform = platforms[0];
    const maxRange = platform.width - platformEnemy.width; 
    if (platformEnemy.moveRange > maxRange) {
        platformEnemy.moveRange = maxRange > 0 ? maxRange : 0;
    }
    if (platformEnemy.startX < platform.x) platformEnemy.startX = platform.x;
    if (platformEnemy.startX + platformEnemy.width > platform.x + platform.width) {
        platformEnemy.startX = platform.x + platform.width - platformEnemy.width;
    }
    platformEnemy.x = platformEnemy.startX; 
}

// Goal object
const goal = {
  width: 10,
  height: 40,
  color: 'gold' // Restored color
};
const lastPlatform = platforms[platforms.length - 1];
goal.x = lastPlatform.x + lastPlatform.width / 2 - goal.width / 2;
goal.y = lastPlatform.y - goal.height;


// Object to keep track of pressed keys
const keysPressed = {
  ArrowLeft: false,
  ArrowRight: false
};

// --- Drawing Functions ---
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
  platforms.forEach(platform => {
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (enemy.isActive) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });
}

function drawGoal() {
  ctx.fillStyle = goal.color;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
}

// --- Update Functions ---
function updateEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.isActive) return;
    enemy.x += enemy.speed;
    if (enemy.x >= enemy.startX + enemy.moveRange) {
      enemy.x = enemy.startX + enemy.moveRange; 
      enemy.speed *= -1;
    } else if (enemy.x <= enemy.startX) {
      enemy.x = enemy.startX; 
      enemy.speed *= -1;
    }
  });
}

function updatePlayerPosition() {
  if (keysPressed.ArrowLeft) player.x -= player.speed;
  if (keysPressed.ArrowRight) player.x += player.speed;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.velocityY += gravity;
  player.y += player.velocityY;

  // player.isOnGround is now set to false when a jump starts (in keydown),
  // or should be set to false here if, after movement, no collision is detected below.
  // For now, per instruction, only removing the unconditional 'player.isOnGround = false;'
  // This means if player walks off an edge, player.isOnGround remains true until they land.

  // To correctly handle walking off an edge, we would need to:
  // 1. Store the previous isOnGround state.
  // 2. Assume it's false for the current physics tick *if* it was previously true.
  // 3. Then, if collision is detected, set it back to true.
  // let wasOnGround = player.isOnGround; // Example for more complex logic
  // if (wasOnGround) player.isOnGround = false; // Tentatively set to false if was on ground

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    if (player.velocityY > 0 &&
        (player.y - player.velocityY) + player.height <= platform.y && 
        player.y + player.height >= platform.y &&                      
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.isOnGround = true;
      break; 
    }
  }

  if (!player.isOnGround) {
    const currentMainGroundLevel = canvas.height - player.height - 10;
    if (player.y + player.height >= currentMainGroundLevel) {
      player.y = currentMainGroundLevel;
      player.velocityY = 0;
      player.isOnGround = true;
    }
  }
}

// --- Collision and Win Condition Functions ---
function checkPlayerEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy.isActive) continue;

    const playerPrevBottom = (player.y - player.velocityY) + player.height;
    const playerCurrBottom = player.y + player.height;

    if (player.velocityY > 0 && 
        player.x + player.width > enemy.x && 
        player.x < enemy.x + enemy.width &&
        playerPrevBottom <= enemy.y &&       
        playerCurrBottom >= enemy.y &&       
        playerCurrBottom <= enemy.y + 10) {  
      enemy.isActive = false;
      player.velocityY = -player.jumpForce / 1.5; 
      player.isOnGround = false; 
      continue; 
    }

    if (player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y) {
      console.log('Hit by enemy!');
      player.x = 50;
      player.y = canvas.height - player.height - 10; 
      player.velocityY = 0;
      player.isOnGround = true; 
      break; 
    }
  }
}

function checkWinCondition() {
  if (player.x < goal.x + goal.width &&
      player.x + player.width > goal.x &&
      player.y < goal.y + goal.height &&
      player.y + player.height > goal.y) {
    console.log('You Win!');
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null; 
    }
  }
}

// --- Event Listeners ---
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowLeft') keysPressed.ArrowLeft = true;
  else if (event.key === 'ArrowRight') keysPressed.ArrowRight = true;
  else if (event.code === 'Space' && player.isOnGround) {
    player.velocityY = -player.jumpForce;
    player.isOnGround = false; 
  }
});

document.addEventListener('keyup', function(event) {
  if (event.key === 'ArrowLeft') keysPressed.ArrowLeft = false;
  else if (event.key === 'ArrowRight') keysPressed.ArrowRight = false;
});

// --- Game Loop ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlatforms();
  drawGoal(); 
  
  updateEnemies();
  drawEnemies();   
  
  updatePlayerPosition();
  checkPlayerEnemyCollisions(); 
  checkWinCondition(); 

  drawPlayer();

  if (animationFrameId) { // Check if game loop should continue
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

// Start the game loop directly
animationFrameId = requestAnimationFrame(gameLoop);
