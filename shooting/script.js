console.log("Airplane Shooting Game script loaded!");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 사운드 시스템
class ShootingSoundSystem {
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
    
    createSound(frequency, duration, type = 'sine', volume = 0.05) {
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
    
    playShoot() {
        this.createSound(800, 0.05, 'square', 0.03);
    }
    
    playEnemyHit() {
        this.createSound(300, 0.1, 'sawtooth', 0.05);
        setTimeout(() => this.createSound(200, 0.1, 'triangle', 0.03), 50);
    }
    
    playPlayerHit() {
        this.createSound(150, 0.3, 'sawtooth', 0.1);
    }
    
    playLevelUp() {
        this.createSound(500, 0.2, 'sine', 0.08);
        setTimeout(() => this.createSound(600, 0.2, 'sine', 0.08), 100);
        setTimeout(() => this.createSound(700, 0.3, 'sine', 0.08), 200);
    }
    
    playGameOver() {
        this.createSound(200, 1.0, 'triangle', 0.08);
    }
}

const shootingSound = new ShootingSoundSystem();

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const isMobile = touchSupport && (
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
        screenWidth <= 768 ||
        (screenWidth <= 1024 && screenHeight <= 1366)
    );
    
    return { isMobile, screenWidth, screenHeight };
}

// Responsive Canvas Setup
function setupCanvas() {
    const { isMobile, screenWidth, screenHeight } = detectDevice();
    
    if (isMobile) {
        // 모바일: 전체 화면 사용
        canvas.width = Math.min(screenWidth, 480);
        canvas.height = Math.min(screenHeight, 800);
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.maxWidth = '100vw';
        canvas.style.maxHeight = '100vh';
        
        // 모바일 최적화 스타일
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
    } else {
        // 데스크톱: 기본 크기
        canvas.width = Math.min(window.innerWidth, 1200);
        canvas.height = Math.min(window.innerHeight, 800);
    }
    
    return { isMobile };
}

const { isMobile } = setupCanvas();

// Game variables
let score = 0;
let lives = 3;
let gameOver = false;
let level = 1;
let enemiesDestroyed = 0;
let highScore = parseInt(localStorage.getItem('shootingGameHighScore')) || 0;
let isPaused = false;
let gameStarted = false;
let startButtonClicked = false;
let hitEffect = { active: false, time: 0 };
let damageText = [];

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
    if (e.key === 'Escape' && !gameOver) {
        isPaused = !isPaused;
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

// 클릭 이벤트 처리
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleClick);

function handleClick(e) {
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    if (!gameStarted && !gameOver) {
        // 간단하게 화면의 어디든 클릭하면 게임 시작
        gameStarted = true;
        startButtonClicked = true;
    } else if (gameOver) {
        // 게임 오버 화면에서 버튼 클릭 처리
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const buttonWidth = 120;
        const buttonHeight = 40;
        const restartButtonX = canvas.width / 2 - buttonWidth - 10;
        const mainButtonX = canvas.width / 2 + 10;
        const buttonY = canvas.height / 2 + 50;
        
        // 다시하기 버튼 클릭
        if (x >= restartButtonX && x <= restartButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            resetGame();
            return;
        }
        
        // 메인으로 버튼 클릭
        if (x >= mainButtonX && x <= mainButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            window.location.href = '../index.html';
            return;
        }
    }
}

function shoot() {
    bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 5,
        height: 15,
        color: '#FFD700'
    });
    shootingSound.playShoot();
}

function spawnEnemy() {
    const size = 40 + Math.random() * 20; // 크기 다양화
    const speed = Math.random() * 3 + 1; // 속도 다양화
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        color: '#DC143C',
        speed: speed
    });
}

function drawPlayer() {
    ctx.save();
    
    // 피격 시 깜빡임 효과
    if (player.hit && Math.floor(Date.now() / 100) % 2) {
        ctx.restore();
        return; // 깜빡임 효과로 잠시 안 그리기
    }
    
    // 비행기 몸통 (전투기 스타일)
    const gradient = ctx.createLinearGradient(player.x - player.width/2, player.y, player.x + player.width/2, player.y);
    gradient.addColorStop(0, player.hit ? '#FF6B6B' : '#4A90E2');
    gradient.addColorStop(0.5, player.hit ? '#FF8888' : '#5BA0F2');
    gradient.addColorStop(1, player.hit ? '#FF6B6B' : '#4A90E2');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 3, player.y);
    ctx.lineTo(player.x - player.width / 4, player.y + player.height / 3);
    ctx.lineTo(player.x + player.width / 4, player.y + player.height / 3);
    ctx.lineTo(player.x + player.width / 3, player.y);
    ctx.closePath();
    ctx.fill();
    
    // 날개
    ctx.fillStyle = '#2C5AA0';
    ctx.beginPath();
    ctx.moveTo(player.x - player.width / 2, player.y + player.height / 4);
    ctx.lineTo(player.x - player.width / 4, player.y);
    ctx.lineTo(player.x - player.width / 4, player.y + player.height / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + player.height / 4);
    ctx.lineTo(player.x + player.width / 4, player.y);
    ctx.lineTo(player.x + player.width / 4, player.y + player.height / 3);
    ctx.closePath();
    ctx.fill();
    
    // 조종석 캐노피
    ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
    ctx.beginPath();
    ctx.arc(player.x, player.y - player.height / 4, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 엔진 불꽃 효과
    const flameGradient = ctx.createRadialGradient(player.x, player.y + player.height/2, 0, player.x, player.y + player.height/2, 15);
    flameGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
    flameGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
    flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(player.x - 5, player.y + player.height / 3);
    ctx.lineTo(player.x, player.y + player.height / 2 + Math.random() * 10);
    ctx.lineTo(player.x + 5, player.y + player.height / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
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
        // 총알 그라데이션 효과
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
        gradient.addColorStop(0, '#FFE066');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        
        // 총알 발광 효과
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height / 3);
        ctx.shadowBlur = 0;
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
        ctx.save();
        
        // 적 비행기 몸통
        const gradient = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x + enemy.width, enemy.y);
        gradient.addColorStop(0, '#8B0000');
        gradient.addColorStop(0.5, '#DC143C');
        gradient.addColorStop(1, '#8B0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 3);
        ctx.lineTo(enemy.x + enemy.width / 4, enemy.y);
        ctx.lineTo(enemy.x + enemy.width * 3/4, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 3);
        ctx.closePath();
        ctx.fill();
        
        // 적 날개
        ctx.fillStyle = '#4B0000';
        ctx.beginPath();
        ctx.moveTo(enemy.x - 5, enemy.y + enemy.height / 3);
        ctx.lineTo(enemy.x + enemy.width / 4, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width / 4, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width + 5, enemy.y + enemy.height / 3);
        ctx.lineTo(enemy.x + enemy.width * 3/4, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width * 3/4, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        // 적 조종석
        ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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
                // Collision detected - enemy destroyed
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                
                // 점수 증가
                score += 10 * level;
                enemiesDestroyed++;
                shootingSound.playEnemyHit();
                
                // 레벨업 체크 (10개 파괴시)
                if (enemiesDestroyed % 10 === 0) {
                    level++;
                    shootingSound.playLevelUp();
                }
            }
        }
    }
    
    // 플레이어와 적 충돌 체크 (개선된 충돌 감지)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // 더 정확한 충돌 감지 (중심점 기준으로 거리 계산)
        const dx = player.x - (enemy.x + enemy.width / 2);
        const dy = player.y - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionDistance = (player.width / 2) + (enemy.width / 2) - 5; // 여유 마진
        
        if (distance < collisionDistance) {
            // 플레이어 피격
            enemies.splice(i, 1);
            lives--;
            shootingSound.playPlayerHit();
            
            // 피격 효과 (잠시 깜빡임)
            player.hit = true;
            setTimeout(() => player.hit = false, 500);
            
            // 화면 진동 효과
            hitEffect.active = true;
            hitEffect.time = Date.now();
            
            // 데미지 텍스트 추가
            damageText.push({
                x: player.x,
                y: player.y - 30,
                text: '-1 LIFE',
                time: Date.now(),
                alpha: 1.0
            });
            
            if (lives <= 0) {
                gameOver = true;
                shootingSound.playGameOver();
            }
            
            console.log(`Player hit! Lives remaining: ${lives}`); // 디버깅용
            break; // 한 프레임에 여러 번 맞지 않도록
        }
    }
}


// 별 배경
let stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.5
    });
}

function drawBackground() {
    ctx.save();
    
    // 화면 진동 효과
    if (hitEffect.active) {
        const elapsed = Date.now() - hitEffect.time;
        if (elapsed < 300) { // 0.3초간 진동
            const intensity = Math.max(0, 5 - (elapsed / 60)); // 진동 강도 감소
            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;
            ctx.translate(shakeX, shakeY);
        } else {
            hitEffect.active = false;
        }
    }
    
    // 우주 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000428');
    gradient.addColorStop(0.5, '#004e92');
    gradient.addColorStop(1, '#000428');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 피격 시 빨간 오버레이 효과
    if (player.hit) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 별 그리기
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 별 이동
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
        }
    });
    
    ctx.restore();
}

function drawUI() {
    // 모바일에 맞는 UI 크기 조정
    let panelWidth = isMobile ? Math.min(180, canvas.width * 0.4) : 220;
    let panelHeight = isMobile ? 120 : 100;
    let fontSize = isMobile ? 14 : 18;
    
    // UI 배경 패널
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, panelWidth, panelHeight);
    
    // 점수 표시 (모바일 대응)
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // 최고 점수
    ctx.fillStyle = '#FFA500';
    ctx.fillText(`High: ${highScore}`, 20, 50);
    
    // 레벨 표시
    ctx.fillStyle = '#00FF00';
    ctx.fillText(`Level: ${level}`, 20, 70);
    
    // 생명 표시 (더 크고 명확하게)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Lives: ', 20, 90);
    
    // 생명 하트를 더 크게 표시
    ctx.font = 'bold 24px Arial';
    for (let i = 0; i < 3; i++) {
        if (i < lives) {
            // 살아있는 하트 (빨간색)
            ctx.fillStyle = '#FF0000';
            ctx.fillText('❤️', 80 + i * 30, 90);
        } else {
            // 잃은 하트 (어두운 색)
            ctx.fillStyle = '#444444';
            ctx.fillText('💔', 80 + i * 30, 90);
        }
    }
    
    // 생명이 부족할 때 경고 표시
    if (lives <= 1) {
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('⚠️ DANGER!', 20, 110);
    }
}

function drawDamageText() {
    ctx.textAlign = 'center';
    
    for (let i = damageText.length - 1; i >= 0; i--) {
        const damage = damageText[i];
        const elapsed = Date.now() - damage.time;
        
        if (elapsed > 2000) { // 2초 후 제거
            damageText.splice(i, 1);
            continue;
        }
        
        // 페이드 아웃 효과
        damage.alpha = Math.max(0, 1 - (elapsed / 2000));
        damage.y -= 1; // 위로 천천히 이동
        
        ctx.save();
        ctx.globalAlpha = damage.alpha;
        ctx.fillStyle = '#FF4444';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.font = 'bold 20px Arial';
        
        // 텍스트 윤곽선과 채우기
        ctx.strokeText(damage.text, damage.x, damage.y);
        ctx.fillText(damage.text, damage.x, damage.y);
        
        ctx.restore();
    }
    
    ctx.textAlign = 'left';
}

function drawGameOver() {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over 텍스트
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
    
    // 최종 점수
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    
    // 새 기록 체크 및 저장
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shootingGameHighScore', highScore.toString());
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('🏆 NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 25px Arial';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 20);
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
    ctx.fillText('다시하기', restartButtonX + buttonWidth/2, buttonY + 25);
    
    // 메인으로 버튼
    const mainButtonX = canvas.width / 2 + 10;
    
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(mainButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('메인으로', mainButtonX + buttonWidth/2, buttonY + 25);
    
    // 키보드 안내 (작게)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '14px Arial';
    ctx.fillText('또는 SPACE키로 재시작', canvas.width / 2, canvas.height / 2 + 110);
    
    ctx.textAlign = 'left';
}

function drawPauseScreen() {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 일시정지 메시지
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 60);
    
    ctx.textAlign = 'left';
}

function drawStartScreen() {
    drawBackground();
    
    // 제목 패널
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // 게임 타이틀 (모바일 대응)
    ctx.fillStyle = '#FFD700';
    const titleFontSize = isMobile ? Math.min(40, canvas.width * 0.12) : 60;
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillText('SPACE SHOOTER', canvas.width / 2, canvas.height / 2 - 150);
    
    // 설명
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('적을 파괴하고 생존하세요!', canvas.width / 2, canvas.height / 2 - 80);
    
    // 조작법
    ctx.font = '20px Arial';
    ctx.fillText('이동: 화살표 키 또는 터치', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('자동 사격: 시작과 동시에 자동 발사', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('ESC: 일시정지', canvas.width / 2, canvas.height / 2 + 40);
    
    // 최고 점수
    ctx.fillStyle = '#FFA500';
    ctx.font = '28px Arial';
    ctx.fillText(`최고 점수: ${highScore}`, canvas.width / 2, canvas.height / 2 + 90);
    
    // 시작 버튼
    const buttonWidth = 250;
    const buttonHeight = 60;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 130;
    
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('게임 시작', canvas.width / 2, buttonY + 38);
    
    ctx.textAlign = 'left';
}

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    level = 1;
    enemiesDestroyed = 0;
    enemies = [];
    bullets = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.hit = false;
    isPaused = false;
    gameStarted = false;
    startButtonClicked = false;
    hitEffect = { active: false, time: 0 };
    damageText = [];
    
    // 키 상태 초기화
    for (let key in keys) {
        keys[key] = false;
    }
}

function gameLoop() {
    if (!gameStarted && !gameOver) {
        drawStartScreen();
        
        // 시작 체크 (키보드)
        if (keys[' '] || keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) {
            gameStarted = true;
            // 키 리셋
            for (let key in keys) {
                keys[key] = false;
            }
        }
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameOver) {
        drawBackground();
        drawEnemies();
        drawPlayer();
        drawBullets();
        drawGameOver();
        
        // 재시작 체크
        if (keys[' ']) {
            resetGame();
            keys[' '] = false;
        }
    } else {
        drawBackground();
        drawEnemies();
        drawBullets();
        drawPlayer();
        drawUI();
        drawDamageText();
        
        if (!isPaused) {
            // Update game state
            updatePlayerPosition();
            updateBullets();
            updateEnemies();
            detectCollisions();
        } else {
            drawPauseScreen();
        }
    }

    requestAnimationFrame(gameLoop);
}

// Spawn enemies periodically (레벨에 따라 빨라짐)
setInterval(() => {
    if (!gameOver && !isPaused) {
        spawnEnemy();
        // 레벨이 오를수록 추가 적 생성
        if (level > 2 && Math.random() < 0.3) {
            spawnEnemy();
        }
    }
}, Math.max(500, 1000 - level * 50)); // 레벨당 50ms씩 빨라짐

// Auto-fire for the player
setInterval(() => {
    if (!gameOver && !isPaused) {
        shoot();
    }
}, 200); // Fire a bullet every 200ms

// 페이지 가시성 API를 사용한 성능 최적화
let isPageVisible = !document.hidden;

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨지면 자동으로 일시정지
        isPageVisible = false;
        if (!gameOver) {
            isPaused = true;
        }
    } else {
        // 페이지가 다시 보이면 게임 재개 준비
        isPageVisible = true;
        if (!gameOver && isPaused) {
            // 자동으로 재개 (사용자가 수동으로 일시정지한 것이 아니라면)
            setTimeout(() => {
                if (isPaused && isPageVisible) {
                    isPaused = false;
                }
            }, 100);
        }
    }
});

// Start the game loop
gameLoop();
