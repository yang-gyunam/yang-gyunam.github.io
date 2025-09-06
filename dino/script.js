const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 사운드 시스템
class DinoSoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('오디오 컨텍스트를 생성할 수 없습니다.');
            this.enabled = false;
        }
    }
    
    createSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playJump() {
        this.createSound(400, 0.1, 'sine', 0.05);
        setTimeout(() => this.createSound(600, 0.1, 'sine', 0.03), 50);
    }
    
    playScore() {
        this.createSound(800, 0.05, 'square', 0.03);
        setTimeout(() => this.createSound(1000, 0.05, 'square', 0.03), 50);
    }
    
    playGameOver() {
        this.createSound(300, 0.2, 'sawtooth', 0.1);
        setTimeout(() => this.createSound(200, 0.3, 'sawtooth', 0.1), 100);
    }
    
    playLanding() {
        this.createSound(150, 0.05, 'triangle', 0.03);
    }
}

const soundSystem = new DinoSoundSystem();

// 디바이스 감지
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const isMobile = touchSupport && (
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
        screenWidth <= 768
    );
    
    return { isMobile, screenWidth, screenHeight };
}

// 캔버스 설정
function setupCanvas() {
    const { isMobile, screenWidth, screenHeight } = detectDevice();
    
    if (isMobile) {
        // 모바일: 캔버스 실제 크기는 고정하고 CSS로 스케일링
        canvas.width = 800;
        canvas.height = 400;
        
        // CSS로 화면에 맞게 스케일링
        const maxWidth = screenWidth * 0.95;
        const maxHeight = screenHeight * 0.7; // 70% 사용
        
        // 비율 유지하면서 최대 크기에 맞추기
        const scale = Math.min(maxWidth / 800, maxHeight / 400);
        const displayWidth = 800 * scale;
        const displayHeight = 400 * scale;
        
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.style.maxWidth = '95vw';
        canvas.style.maxHeight = '70vh';
    } else {
        canvas.width = 800;
        canvas.height = 400;
        canvas.style.width = '800px';
        canvas.style.height = '400px';
    }
    
    return { isMobile };
}

const { isMobile } = setupCanvas();

// 게임 변수
let gameSpeed = 6;
let score = 0;
let highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let gravity = 0.6;
let jumpPower = -12;
let doubleJumpAvailable = true;

// 플레이어 (다이노)
const player = {
    x: 50,
    y: 0,
    width: 40,
    height: 50,
    velocityY: 0,
    jumping: false,
    groundY: canvas.height - 100,
    color: '#535353',
    legAnimation: 0
};

// 초기 위치 설정
player.y = player.groundY;

// 장애물 배열
let obstacles = [];
let clouds = [];
let particles = [];

// 지면 변수
let groundOffset = 0;

// 키보드 입력
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if ((e.key === ' ' || e.key === 'ArrowUp') && !gameStarted && !gameOver) {
        startGame();
    } else if ((e.key === ' ' || e.key === 'ArrowUp') && gameOver) {
        resetGame();
    } else if ((e.key === ' ' || e.key === 'ArrowUp') && gameStarted) {
        jump(); // jump 함수 내부에서 첫 번째/두 번째 점프를 처리
    }
    
    e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 터치 이벤트
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (!gameStarted && !gameOver) {
        startGame();
    } else if (gameOver) {
        resetGame();
    } else if (gameStarted) {
        jump(); // jump 함수 내부에서 첫 번째/두 번째 점프를 처리
    }
});

canvas.addEventListener('click', (e) => {
    if (!gameStarted && !gameOver) {
        startGame();
    } else if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // 버튼 클릭 체크
        const buttonWidth = 120;
        const buttonHeight = 40;
        const restartButtonX = canvas.width / 2 - buttonWidth - 10;
        const mainButtonX = canvas.width / 2 + 10;
        const buttonY = canvas.height / 2 + 50;
        
        // 다시하기 버튼
        if (x >= restartButtonX && x <= restartButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            resetGame();
        }
        
        // 메인으로 버튼
        if (x >= mainButtonX && x <= mainButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            window.location.href = '../index.html';
        }
    } else if (gameStarted) {
        jump(); // jump 함수 내부에서 첫 번째/두 번째 점프를 처리
    }
});

// 점프 함수
function jump() {
    if (!player.jumping) {
        // 첫 번째 점프
        player.velocityY = jumpPower;
        player.jumping = true;
        doubleJumpAvailable = true;
        soundSystem.playJump();
    } else if (doubleJumpAvailable) {
        // 더블 점프 (공중에 있을 때 언제든지 가능)
        player.velocityY = jumpPower * 0.85; // 두 번째 점프는 조금 약하게
        doubleJumpAvailable = false;
        soundSystem.playJump();
        
        // 더블 점프 이펙트
        createParticle(player.x + player.width / 2, player.y + player.height / 2);
    }
}

// 게임 시작
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    clouds = [];
    particles = [];
}

// 게임 리셋
function resetGame() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    clouds = [];
    particles = [];
    player.y = player.groundY;
    player.velocityY = 0;
    player.jumping = false;
    doubleJumpAvailable = true;
}

// 장애물 생성
function createObstacle() {
    const types = ['cactus', 'bird'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle = {
        x: canvas.width,
        type: type,
        passed: false
    };
    
    if (type === 'cactus') {
        obstacle.width = 20 + Math.random() * 20;
        obstacle.height = 40 + Math.random() * 30;
        obstacle.y = player.groundY + player.height - obstacle.height;
        obstacle.color = '#2d5016';
    } else if (type === 'bird') {
        obstacle.width = 35;
        obstacle.height = 25;
        obstacle.y = player.groundY - Math.random() * 100;
        obstacle.color = '#333';
        obstacle.wingPhase = 0;
    }
    
    obstacles.push(obstacle);
}

// 구름 생성
function createCloud() {
    clouds.push({
        x: canvas.width,
        y: 50 + Math.random() * 100,
        width: 60 + Math.random() * 40,
        height: 20 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5
    });
}

// 파티클 생성
function createParticle(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3,
            life: 1.0,
            color: '#8B7355'
        });
    }
}

// 플레이어 업데이트
function updatePlayer() {
    if (player.jumping || player.y < player.groundY) {
        player.velocityY += gravity;
        player.y += player.velocityY;
        
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.velocityY = 0;
            player.jumping = false;
            doubleJumpAvailable = true; // 착지 시 더블 점프 리셋
            soundSystem.playLanding();
            createParticle(player.x + player.width / 2, player.y + player.height);
        }
    }
    
    // 다리 애니메이션
    if (!player.jumping && gameStarted) {
        player.legAnimation += 0.3;
    }
}

// 장애물 업데이트
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // 새 날개짓 애니메이션
        if (obstacles[i].type === 'bird') {
            obstacles[i].wingPhase += 0.2;
        }
        
        // 점수 체크
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
            obstacles[i].passed = true;
            score += 10;
            soundSystem.playScore();
            
            // 속도 증가
            if (score % 50 === 0) {
                gameSpeed += 0.5;
            }
        }
        
        // 화면 밖으로 나간 장애물 제거
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// 구름 업데이트
function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }
}

// 파티클 업데이트
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].vy += 0.2;
        particles[i].life -= 0.02;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 충돌 감지
function checkCollision() {
    for (let obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            gameOver = true;
            soundSystem.playGameOver();
            
            // 하이스코어 저장
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('dinoHighScore', highScore.toString());
            }
        }
    }
}

// 플레이어 그리기
function drawPlayer() {
    ctx.save();
    
    // 몸통
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height - 10);
    
    // 머리
    ctx.fillRect(player.x + player.width - 15, player.y - 10, 20, 20);
    
    // 눈
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + player.width - 10, player.y - 5, 5, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + player.width - 8, player.y - 3, 2, 2);
    
    // 꼬리
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 10);
    ctx.lineTo(player.x - 10, player.y + 5);
    ctx.lineTo(player.x, player.y + 20);
    ctx.closePath();
    ctx.fill();
    
    // 다리
    if (!player.jumping) {
        const legOffset = Math.sin(player.legAnimation) * 5;
        
        // 왼쪽 다리
        ctx.fillRect(player.x + 5, player.y + player.height - 10, 5, 10 + legOffset);
        
        // 오른쪽 다리
        ctx.fillRect(player.x + 20, player.y + player.height - 10, 5, 10 - legOffset);
    } else {
        // 점프 중 다리
        ctx.fillRect(player.x + 5, player.y + player.height - 10, 5, 5);
        ctx.fillRect(player.x + 20, player.y + player.height - 10, 5, 5);
    }
    
    ctx.restore();
}

// 장애물 그리기
function drawObstacles() {
    for (let obstacle of obstacles) {
        if (obstacle.type === 'cactus') {
            // 선인장
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 선인장 가시
            ctx.strokeStyle = '#1a3009';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + 10);
            ctx.lineTo(obstacle.x - 5, obstacle.y + 5);
            ctx.moveTo(obstacle.x + obstacle.width, obstacle.y + 20);
            ctx.lineTo(obstacle.x + obstacle.width + 5, obstacle.y + 15);
            ctx.stroke();
        } else if (obstacle.type === 'bird') {
            // 새 몸통
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width - 10, obstacle.height);
            
            // 부리
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.moveTo(obstacle.x - 5, obstacle.y + obstacle.height / 2);
            ctx.lineTo(obstacle.x, obstacle.y + obstacle.height / 2 - 3);
            ctx.lineTo(obstacle.x, obstacle.y + obstacle.height / 2 + 3);
            ctx.closePath();
            ctx.fill();
            
            // 날개
            const wingOffset = Math.sin(obstacle.wingPhase) * 5;
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(obstacle.x + 10, obstacle.y);
            ctx.lineTo(obstacle.x + 20, obstacle.y - wingOffset);
            ctx.lineTo(obstacle.x + 25, obstacle.y);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(obstacle.x + 10, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + 20, obstacle.y + obstacle.height + wingOffset);
            ctx.lineTo(obstacle.x + 25, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// 구름 그리기
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let cloud of clouds) {
        // 구름 모양
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 3, cloud.y - 5, cloud.height / 2 + 5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 2/3, cloud.y, cloud.height / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 파티클 그리기
function drawParticles() {
    for (let particle of particles) {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 3, 3);
        ctx.restore();
    }
}

// 지면 그리기
function drawGround() {
    const groundY = player.groundY + player.height;
    
    // 지면 선
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    // 지면 패턴
    ctx.fillStyle = '#666';
    groundOffset -= gameSpeed;
    if (groundOffset <= -20) groundOffset = 0;
    
    for (let x = groundOffset; x < canvas.width; x += 20) {
        ctx.fillRect(x, groundY + 2, 10, 2);
        ctx.fillRect(x + 5, groundY + 6, 8, 1);
    }
}

// 배경 그리기
function drawBackground() {
    // 하늘 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#F0E68C');
    gradient.addColorStop(1, '#DEB887');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 태양
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 60, 30, 0, Math.PI * 2);
    ctx.fill();
}

// UI 그리기
function drawUI() {
    // 점수
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`점수: ${score}`, 20, 30);
    
    // 최고 점수
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText(`최고: ${highScore}`, 20, 55);
    
    // 속도 표시
    if (gameStarted && !gameOver) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.fillText(`속도: ${gameSpeed.toFixed(1)}`, 20, 75);
    }
}

// 시작 화면
function drawStartScreen() {
    drawBackground();
    drawGround();
    
    // 타이틀
    ctx.fillStyle = '#333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('다이노 점프', canvas.width / 2, canvas.height / 2 - 60);
    
    // 설명
    ctx.font = '20px Arial';
    ctx.fillText('스페이스바 또는 화면 터치로 점프!', canvas.width / 2, canvas.height / 2);
    
    // 시작 안내
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4A90E2';
    ctx.fillText('시작하려면 점프하세요', canvas.width / 2, canvas.height / 2 + 40);
    
    // 더블 점프 설명
    ctx.font = '18px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('✨ 공중에서 한 번 더 점프 가능!', canvas.width / 2, canvas.height / 2 + 70);
    
    // 최고 점수
    if (highScore > 0) {
        ctx.font = '18px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`최고 기록: ${highScore}`, canvas.width / 2, canvas.height / 2 + 100);
    }
}

// 게임 오버 화면
function drawGameOverScreen() {
    // 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 게임 오버 텍스트
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    
    // 점수
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`점수: ${score}`, canvas.width / 2, canvas.height / 2 - 10);
    
    // 최고 점수
    if (score >= highScore) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('새로운 최고 기록!', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        ctx.fillStyle = '#666';
        ctx.fillText(`최고 기록: ${highScore}`, canvas.width / 2, canvas.height / 2 + 20);
    }
    
    // 다시하기 버튼
    const buttonWidth = 120;
    const buttonHeight = 40;
    const restartButtonX = canvas.width / 2 - buttonWidth - 10;
    const buttonY = canvas.height / 2 + 50;
    
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('다시하기', restartButtonX + buttonWidth/2, buttonY + 27);
    
    // 메인으로 버튼
    const mainButtonX = canvas.width / 2 + 10;
    
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(mainButtonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('메인으로', mainButtonX + buttonWidth/2, buttonY + 27);
}

// 게임 루프
function gameLoop() {
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리기
    drawBackground();
    drawClouds();
    drawGround();
    
    if (!gameStarted && !gameOver) {
        drawStartScreen();
        drawPlayer();
    } else if (gameStarted && !gameOver) {
        // 업데이트
        updatePlayer();
        updateObstacles();
        updateClouds();
        updateParticles();
        checkCollision();
        
        // 그리기
        drawParticles();
        drawObstacles();
        drawPlayer();
        drawUI();
        
        // 장애물 생성
        if (Math.random() < 0.02) {
            createObstacle();
        }
        
        // 구름 생성
        if (Math.random() < 0.003) {
            createCloud();
        }
    } else if (gameOver) {
        // 그리기
        drawParticles();
        drawObstacles();
        drawPlayer();
        drawUI();
        drawGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// 윈도우 리사이즈 대응
window.addEventListener('resize', () => {
    setupCanvas();
    player.groundY = canvas.height - 100;
    if (!player.jumping) {
        player.y = player.groundY;
    }
});

// 초기 구름 생성
for (let i = 0; i < 3; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: 50 + Math.random() * 100,
        width: 60 + Math.random() * 40,
        height: 20 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5
    });
}

// 게임 시작
gameLoop();