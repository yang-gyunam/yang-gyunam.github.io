console.log("Airplane Shooting Game script loaded!");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player airplane
let player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5
};

// Bullets
let bullets = [];
let bulletSpeed = 7;

// Enemies
let enemies = [];

// Keyboard input state
let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    ' ': false
};

// Event Listeners for keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// Event Listeners for touch input
const touchOffsetY = 75; // a.k.a Touch-to-move offset
function handleTouch(e) {
    if (e.touches) {
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY - touchOffsetY;
        e.preventDefault();
    }
}

canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);

function shoot() {
    bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 5,
        height: 10,
        color: 'yellow'
    });
}

function spawnEnemy() {
    const size = 50;
    const speed = Math.random() < 0.5 ? 2 : 4; // Randomly choose between speed 2 and 4
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        color: 'red',
        speed: speed
    });
}

function drawPlayer() {
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fillStyle = 'blue'; // Changed player color to blue
    ctx.fill();
}

function updatePlayerPosition() {
    if (keys.ArrowLeft && player.x - player.width / 2 > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x + player.width / 2 < canvas.width) {
        player.x += player.speed;
    }
    if (keys.ArrowUp && player.y - player.height / 2 > 0) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown && player.y + player.height / 2 < canvas.height) {
        player.y += player.speed;
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bulletSpeed;
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed; // Use the enemy's individual speed
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

function detectCollisions() {
    // Loop through enemies and bullets to check for collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const enemy = enemies[i];
            const bullet = bullets[j];

            if (bullet && enemy &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Collision detected
                enemies.splice(i, 1);
                bullets.splice(j, 1);
            }
        }
    }
}


function gameLoop() {
    // Update game state
    updatePlayerPosition();
    updateBullets();
    updateEnemies();
    detectCollisions();

    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawPlayer();
    drawBullets();
    drawEnemies();

    requestAnimationFrame(gameLoop);
}

// Spawn enemies periodically
setInterval(spawnEnemy, 1000); // Spawn an enemy every second

// Auto-fire for the player
setInterval(shoot, 200); // Fire a bullet every 200ms

// Start the game loop
gameLoop();
