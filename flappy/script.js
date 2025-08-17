const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let score = 0;
let gameOver = false;
let frame = 0;

// Bird properties
const bird = {
    x: 50,
    y: 150,
    width: 20,
    height: 20,
    color: 'yellow',
    velocity: 0,
    gravity: 0.5,
    jump: -8 // -10s
};

// Pipe properties
const pipe = {
    width: 50,
    gap: 150,
    color: 'green',
    speed: 2
};

// Pipes array
let pipes = [];

// Draw Functions
function drawBird() {
    ctx.fillStyle = bird.color;
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    ctx.fillStyle = pipe.color;
    for (let i = 0; i < pipes.length; i++) {
        ctx.fillRect(pipes[i].x, pipes[i].y, pipes[i].width, pipes[i].height);
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
}

function drawGameOver() {
    ctx.fillStyle = 'black';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 20);
}

// Update Functions
function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
}

function generatePipes() {
    if (frame % 120 === 0) { // Generate pipes every 120 frames
        const pipeY = Math.random() * (canvas.height - pipe.gap - 100) + 50;

        // Top pipe
        pipes.push({ x: canvas.width, y: 0, width: pipe.width, height: pipeY, passed: false });
        // Bottom pipe
        pipes.push({ x: canvas.width, y: pipeY + pipe.gap, width: pipe.width, height: canvas.height - pipeY - pipe.gap });
    }
}

function updatePipes() {
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= pipe.speed;
    }

    // Scoring
    for (let i = 0; i < pipes.length; i += 2) {
        if (pipes[i].passed === false && pipes[i].x + pipe.width < bird.x) {
            pipes[i].passed = true;
            score++;
        }
    }

    pipes = pipes.filter(p => p.x + p.width > 0);
}

function checkCollisions() {
    // Ground and ceiling collision
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver = true;
        return;
    }

    // Pipe collision
    for (let i = 0; i < pipes.length; i++) {
        if (
            bird.x < pipes[i].x + pipes[i].width &&
            bird.x + bird.width > pipes[i].x &&
            bird.y < pipes[i].y + pipes[i].height &&
            bird.y + bird.height > pipes[i].y
        ) {
            gameOver = true;
            return;
        }
    }
}

// Game Controls
function jump() {
    if (!gameOver) {
        bird.velocity = bird.jump;
    }
}

function restartGame() {
    if (gameOver) {
       document.location.reload();
    }
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.key === ' ') {
        jump();
    }
});

document.addEventListener('click', function() {
    jump();
    restartGame();
});

// Game Loop
function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update
    updateBird();
    updatePipes();
    checkCollisions();

    // Draw
    drawBird();
    drawPipes();
    drawScore();

    // Generate Pipes
    generatePipes();

    frame++;
    requestAnimationFrame(gameLoop);
}

// Start Game
gameLoop();
