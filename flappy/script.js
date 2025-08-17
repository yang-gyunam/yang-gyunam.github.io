const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants (scalable) ---
const BIRD_WIDTH_RATIO = 0.08;
const BIRD_HEIGHT_RATIO = 0.05;
const BIRD_START_X_RATIO = 0.2;
const BIRD_START_Y_RATIO = 0.4;
const GRAVITY_RATIO = 0.0007;
const JUMP_STRENGTH_RATIO = -0.015;

const PIPE_WIDTH_RATIO = 0.15;
const PIPE_GAP_RATIO = 0.25; // Gap is 25% of canvas height
const PIPE_SPEED_RATIO = 0.005;
const PIPE_SPAWN_INTERVAL = 120; // in frames

const FONT_SIZE_RATIO = 0.05;

// --- Game State ---
let bird, pipe, pipes, score, gameOver, frame;

// --- Initialization ---
function setCanvasSize() {
    const style = getComputedStyle(canvas);
    const width = parseInt(style.width, 10);
    const height = parseInt(style.height, 10);
    canvas.width = width;
    canvas.height = height;
}

function initGame() {
    score = 0;
    gameOver = false;
    frame = 0;
    pipes = [];

    bird = {
        x: canvas.width * BIRD_START_X_RATIO,
        y: canvas.height * BIRD_START_Y_RATIO,
        width: canvas.width * BIRD_WIDTH_RATIO,
        height: canvas.height * BIRD_HEIGHT_RATIO,
        color: 'yellow',
        velocity: 0,
        gravity: canvas.height * GRAVITY_RATIO,
        jump: canvas.height * JUMP_STRENGTH_RATIO
    };

    pipe = {
        width: canvas.width * PIPE_WIDTH_RATIO,
        gap: canvas.height * PIPE_GAP_RATIO,
        color: 'green',
        speed: canvas.width * PIPE_SPEED_RATIO
    };
}

// --- Draw Functions ---
function drawBird() {
    ctx.fillStyle = bird.color;
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    ctx.fillStyle = pipe.color;
    for (const p of pipes) {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = `${canvas.height * FONT_SIZE_RATIO}px Arial`;
    ctx.fillText('Score: ' + score, 10, canvas.height * FONT_SIZE_RATIO);
}

function drawGameOver() {
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    const baseFontSize = canvas.height * FONT_SIZE_RATIO;
    ctx.font = `${baseFontSize * 1.5}px Arial`;
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - baseFontSize);
    ctx.font = `${baseFontSize}px Arial`;
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + baseFontSize);
}

// --- Update Functions ---
function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
}

function generatePipes() {
    if (frame % PIPE_SPAWN_INTERVAL === 0) {
        const topPipeHeight = Math.random() * (canvas.height - pipe.gap - (canvas.height * 0.2)) + (canvas.height * 0.1);
        const bottomPipeY = topPipeHeight + pipe.gap;

        pipes.push({ x: canvas.width, y: 0, width: pipe.width, height: topPipeHeight, passed: false });
        pipes.push({ x: canvas.width, y: bottomPipeY, width: pipe.width, height: canvas.height - bottomPipeY });
    }
}

function updatePipes() {
    for (const p of pipes) {
        p.x -= pipe.speed;
    }

    if (pipes.length > 0 && pipes[0].passed === false && pipes[0].x + pipe.width < bird.x) {
        score++;
        for(let i = 0; i < pipes.length; i++){
            if(pipes[i].x + pipe.width < bird.x){
                pipes[i].passed = true;
            }
        }
    }
    
    pipes = pipes.filter(p => p.x + p.width > 0);
}

function checkCollisions() {
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver = true;
        return;
    }

    for (const p of pipes) {
        if (
            bird.x < p.x + p.width &&
            bird.x + bird.width > p.x &&
            bird.y < p.y + p.height &&
            bird.y + bird.height > p.y
        ) {
            gameOver = true;
            return;
        }
    }
}

// --- Game Controls ---
function jump() {
    if (!gameOver) {
        bird.velocity = bird.jump;
    }
}

function handleInput(e) {
    // Prevent click event from firing after touchstart
    if (e && e.type === 'touchstart') {
        e.preventDefault();
    }
    jump();
    if (gameOver) {
        // Use a slight delay to prevent immediate restart
        setTimeout(() => document.location.reload(), 100);
    }
}

// --- Game Loop ---
function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateBird();
    updatePipes();
    checkCollisions();
    
    drawBird();
    drawPipes();
    drawScore();

    generatePipes();

    frame++;
    requestAnimationFrame(gameLoop);
}

// --- Start Game ---
setCanvasSize();
initGame();
gameLoop();

// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === ' ') {
        handleInput(e);
    }
});
document.addEventListener('click', handleInput);
document.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('resize', () => document.location.reload());
