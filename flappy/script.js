const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 사운드 시스템
class FlappySoundSystem {
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
    }
    
    playScore() {
        this.createSound(800, 0.15, 'sine', 0.08);
        setTimeout(() => this.createSound(1000, 0.15, 'sine', 0.08), 50);
    }
    
    playHit() {
        this.createSound(150, 0.3, 'sawtooth', 0.1);
    }
    
    playGameOver() {
        this.createSound(200, 0.8, 'triangle', 0.1);
    }
}

const flappySound = new FlappySoundSystem();

// --- Game Constants (scalable) ---
const BIRD_WIDTH_RATIO = 0.08;
const BIRD_HEIGHT_RATIO = 0.05;
const BIRD_START_X_RATIO = 0.2;
const BIRD_START_Y_RATIO = 0.4;
const GRAVITY_RATIO = 0.0007;
const JUMP_STRENGTH_RATIO = -0.015;

const PIPE_WIDTH_RATIO = 0.15;
const PIPE_GAP_RATIO = 0.35; // Gap is 35% of canvas height
const PIPE_SPEED_RATIO = 0.005;
const PIPE_SPAWN_INTERVAL = 120; // in frames

const FONT_SIZE_RATIO = 0.05;

// --- Game State ---
let bird, pipe, pipes, score, gameOver, frame, highScore, isPaused, gameStarted, countdown, countdownActive;
let isMobile = false;
let deviceMode = 'desktop';

// 최고 점수 불러오기
highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
isPaused = false;
gameStarted = false;
countdown = 0;
countdownActive = false;

// --- Device Detection & Responsive Setup ---
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // 모바일 디바이스 감지
    isMobile = touchSupport && (
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
        screenWidth <= 768 ||
        (screenWidth <= 1024 && screenHeight <= 1366) // 태블릿 포함
    );
    
    deviceMode = isMobile ? 'mobile' : 'desktop';
    
    console.log(`Device detected: ${deviceMode}, Touch: ${touchSupport}, Screen: ${screenWidth}x${screenHeight}`);
    
    return {
        isMobile,
        deviceMode,
        touchSupport,
        screenWidth,
        screenHeight
    };
}

// --- Initialization ---
function setCanvasSize() {
    detectDevice();
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let canvasWidth, canvasHeight;
    
    if (isMobile) {
        // 모바일: 전체 화면 활용, 세로 모드 최적화
        if (viewportHeight > viewportWidth) {
            // 세로 모드
            canvasWidth = Math.min(viewportWidth * 0.95, 450);
            canvasHeight = Math.min(viewportHeight * 0.85, 700);
        } else {
            // 가로 모드 (랜드스케이프)
            canvasWidth = Math.min(viewportWidth * 0.7, 600);
            canvasHeight = Math.min(viewportHeight * 0.9, 450);
        }
    } else {
        // 데스크톱: 적절한 창 크기
        canvasWidth = Math.min(viewportWidth * 0.8, 800);
        canvasHeight = Math.min(viewportHeight * 0.8, 600);
        
        // 최소 크기 보장
        canvasWidth = Math.max(canvasWidth, 500);
        canvasHeight = Math.max(canvasHeight, 400);
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // CSS 크기도 동기화
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // 모바일에서 상태표시줄/네비게이션바 고려
    if (isMobile) {
        document.body.style.overflow = 'hidden';
        canvas.style.display = 'block';
        canvas.style.margin = 'auto';
    }
}

function initGame() {
    score = 0;
    gameOver = false;
    frame = 0;
    pipes = [];
    isPaused = false;
    gameStarted = false;
    countdown = 0;
    countdownActive = false;

    bird = {
        x: canvas.width * BIRD_START_X_RATIO,
        y: canvas.height * BIRD_START_Y_RATIO,
        width: canvas.width * BIRD_WIDTH_RATIO,
        height: canvas.height * BIRD_HEIGHT_RATIO,
        color: '#FFD23F',
        velocity: 0,
        gravity: canvas.height * GRAVITY_RATIO,
        jump: canvas.height * JUMP_STRENGTH_RATIO
    };

    pipe = {
        width: canvas.width * PIPE_WIDTH_RATIO,
        gap: canvas.height * PIPE_GAP_RATIO,
        color: '#5FAD56',
        speed: canvas.width * PIPE_SPEED_RATIO
    };
}

// --- Draw Functions ---
function drawBird() {
    ctx.save();
    
    // 날개 애니메이션을 위한 wing phase
    const wingPhase = Math.sin(frame * 0.2) * 0.3;
    
    // 몸통 (원형)
    const gradient = ctx.createRadialGradient(
        bird.x + bird.width * 0.3, 
        bird.y + bird.height * 0.3, 
        0, 
        bird.x + bird.width/2, 
        bird.y + bird.height/2, 
        bird.width/2
    );
    gradient.addColorStop(0, '#FFE066');
    gradient.addColorStop(0.5, '#FFD23F');
    gradient.addColorStop(1, '#F4AC00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(bird.x + bird.width/2, bird.y + bird.height/2, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 부리
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width - 5, bird.y + bird.height/2 - 3);
    ctx.lineTo(bird.x + bird.width + 8, bird.y + bird.height/2);
    ctx.lineTo(bird.x + bird.width - 5, bird.y + bird.height/2 + 3);
    ctx.closePath();
    ctx.fill();
    
    // 눈
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width * 0.7, bird.y + bird.height * 0.3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width * 0.72, bird.y + bird.height * 0.32, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 날개
    ctx.fillStyle = '#E09F00';
    ctx.beginPath();
    ctx.ellipse(
        bird.x + bird.width * 0.2, 
        bird.y + bird.height/2 + wingPhase * 5, 
        bird.width * 0.4, 
        bird.height * 0.3, 
        wingPhase, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.restore();
}

function drawPipes() {
    for (const p of pipes) {
        // 파이프 그라데이션
        const gradient = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        gradient.addColorStop(0, '#5FAD56');
        gradient.addColorStop(0.3, '#78C258');
        gradient.addColorStop(0.6, '#5FAD56');
        gradient.addColorStop(1, '#4A8B45');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        
        // 파이프 테두리
        ctx.strokeStyle = '#3A6B35';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
        
        // 파이프 캐픽 (위/아래 끝부분)
        const capHeight = 20;
        const capOverhang = 10;
        
        if (p.y === 0) {
            // 위쪽 파이프 캐픽
            const capGradient = ctx.createLinearGradient(p.x - capOverhang, 0, p.x + p.width + capOverhang, 0);
            capGradient.addColorStop(0, '#4A8B45');
            capGradient.addColorStop(0.5, '#6FBD67');
            capGradient.addColorStop(1, '#4A8B45');
            
            ctx.fillStyle = capGradient;
            ctx.fillRect(p.x - capOverhang, p.height - capHeight, p.width + capOverhang * 2, capHeight);
            ctx.strokeRect(p.x - capOverhang, p.height - capHeight, p.width + capOverhang * 2, capHeight);
        } else {
            // 아래쪽 파이프 캐픽
            const capGradient = ctx.createLinearGradient(p.x - capOverhang, 0, p.x + p.width + capOverhang, 0);
            capGradient.addColorStop(0, '#4A8B45');
            capGradient.addColorStop(0.5, '#6FBD67');
            capGradient.addColorStop(1, '#4A8B45');
            
            ctx.fillStyle = capGradient;
            ctx.fillRect(p.x - capOverhang, p.y, p.width + capOverhang * 2, capHeight);
            ctx.strokeRect(p.x - capOverhang, p.y, p.width + capOverhang * 2, capHeight);
        }
    }
}

function drawScore() {
    // 점수 배경 (여백 추가)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(15, 15, 200, 60);
    
    // 점수 텍스트 (왼쪽 여백 늘리기)
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = `bold ${canvas.height * FONT_SIZE_RATIO}px Arial`;
    ctx.strokeText('Score: ' + score, 25, 35);
    ctx.fillText('Score: ' + score, 25, 35);
    
    // 최고 점수
    ctx.font = `bold ${canvas.height * FONT_SIZE_RATIO * 0.7}px Arial`;
    ctx.strokeText('Best: ' + highScore, 25, 60);
    ctx.fillText('Best: ' + highScore, 25, 60);
}

function drawGameOver() {
    // 배경 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 동적 크기 조정
    const minPanelWidth = Math.min(canvas.width * 0.85, 350);
    const minPanelHeight = Math.min(canvas.height * 0.6, 300);
    const panelX = (canvas.width - minPanelWidth) / 2;
    const panelY = (canvas.height - minPanelHeight) / 2;
    
    // 패널 배경
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(panelX, panelY, minPanelWidth, minPanelHeight);
    
    // 테두리
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, panelY, minPanelWidth, minPanelHeight);
    
    ctx.textAlign = 'center';
    
    // 폰트 크기 동적 조정
    const titleFontSize = Math.min(32, canvas.width * 0.07);
    const textFontSize = Math.min(20, canvas.width * 0.045);
    const smallFontSize = Math.min(16, canvas.width * 0.035);
    
    // Game Over 타이틀
    ctx.fillStyle = '#FF6B6B';
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillText('💥 Game Over', canvas.width / 2, panelY + 50);
    
    // 점수 정보
    ctx.fillStyle = '#333';
    ctx.font = `${textFontSize}px Arial`;
    ctx.fillText(`점수: ${score}`, canvas.width / 2, panelY + 100);
    
    // 새 기록 체크
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore.toString());
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${smallFontSize + 2}px Arial`;
        ctx.fillText('🏆 새로운 최고 기록!', canvas.width / 2, panelY + 130);
        ctx.fillStyle = '#333';
    }
    
    // 최고 점수
    ctx.font = `${textFontSize - 2}px Arial`;
    ctx.fillText(`최고: ${highScore}`, canvas.width / 2, panelY + 160);
    
    // 재시작 버튼
    const buttonWidth = Math.min(120, minPanelWidth * 0.5);
    const buttonHeight = 35;
    const restartButtonX = canvas.width / 2 - buttonWidth - 10;
    const buttonY = panelY + 190;
    
    ctx.fillStyle = '#4A8B45';
    ctx.fillRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
    
    // 버튼 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(restartButtonX + 2, buttonY + 2, buttonWidth, buttonHeight);
    ctx.fillStyle = '#4A8B45';
    ctx.fillRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${smallFontSize}px Arial`;
    ctx.fillText('🔄 다시하기', restartButtonX + buttonWidth/2, buttonY + 22);
    
    // 메인 화면 버튼
    const mainButtonX = canvas.width / 2 + 10;
    
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(mainButtonX, buttonY, buttonWidth, buttonHeight);
    
    // 버튼 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(mainButtonX + 2, buttonY + 2, buttonWidth, buttonHeight);
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(mainButtonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${smallFontSize}px Arial`;
    ctx.fillText('🏠 메인으로', mainButtonX + buttonWidth/2, buttonY + 22);
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
        flappySound.playScore();
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
        flappySound.playHit();
        setTimeout(() => flappySound.playGameOver(), 200);
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
            flappySound.playHit();
            setTimeout(() => flappySound.playGameOver(), 200);
            return;
        }
    }
}

// --- Game Controls ---
function jump() {
    if (!gameOver && !isPaused) {
        bird.velocity = bird.jump;
        flappySound.playJump();
    }
}

function drawStartScreen() {
    drawBackground();
    
    // 디바이스에 따른 패널 크기 조정
    let minPanelWidth, minPanelHeight;
    if (isMobile) {
        minPanelWidth = Math.min(canvas.width * 0.95, 380);
        minPanelHeight = Math.min(canvas.height * 0.9, 520);
    } else {
        minPanelWidth = Math.min(canvas.width * 0.85, 480);
        minPanelHeight = Math.min(canvas.height * 0.8, 580);
    }
    
    const panelX = (canvas.width - minPanelWidth) / 2;
    const panelY = (canvas.height - minPanelHeight) / 2;
    
    // 패널 배경
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(panelX, panelY, minPanelWidth, minPanelHeight);
    
    // 테두리
    ctx.strokeStyle = '#4A8B45';
    ctx.lineWidth = isMobile ? 2 : 3;
    ctx.strokeRect(panelX, panelY, minPanelWidth, minPanelHeight);
    
    ctx.textAlign = 'center';
    
    // 디바이스별 폰트 크기 조정
    let titleFontSize, textFontSize, buttonFontSize, smallFontSize;
    if (isMobile) {
        titleFontSize = Math.min(24, minPanelWidth * 0.07);
        textFontSize = Math.min(12, minPanelWidth * 0.035);
        buttonFontSize = Math.min(14, minPanelWidth * 0.04);
        smallFontSize = Math.min(10, minPanelWidth * 0.028);
    } else {
        titleFontSize = Math.min(28, minPanelWidth * 0.065);
        textFontSize = Math.min(14, minPanelWidth * 0.032);
        buttonFontSize = Math.min(16, minPanelWidth * 0.037);
        smallFontSize = Math.min(11, minPanelWidth * 0.025);
    }
    
    // 게임 타이틀
    ctx.fillStyle = '#4A8B45';
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillText('🐦 Flappy Bird', canvas.width / 2, panelY + 60);
    
    // 설명 (줄 간격 조정)
    ctx.fillStyle = '#333';
    ctx.font = `${textFontSize}px Arial`;
    ctx.fillText('클릭 또는 스페이스로 날기!', canvas.width / 2, panelY + 120);
    ctx.fillText('파이프를 피해 최대한 멀리 날아가세요', canvas.width / 2, panelY + 145);
    
    // 최고 점수
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${textFontSize + 1}px Arial`;
    ctx.fillText(`🏆 최고 점수: ${highScore}`, canvas.width / 2, panelY + 190);
    
    // 시작 버튼 (디바이스별 크기 조정)
    let buttonWidth, buttonHeight;
    if (isMobile) {
        buttonWidth = Math.min(160, minPanelWidth * 0.7);
        buttonHeight = 50; // 모바일에서 터치하기 쉽게 더 크게
    } else {
        buttonWidth = Math.min(180, minPanelWidth * 0.6);
        buttonHeight = 45;
    }
    
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = panelY + (isMobile ? 220 : 240);
    
    ctx.fillStyle = '#4A8B45';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // 버튼 그림자 효과
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(buttonX + 2, buttonY + 2, buttonWidth, buttonHeight);
    ctx.fillStyle = '#4A8B45';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${buttonFontSize}px Arial`;
    ctx.fillText('🎮 게임 시작', canvas.width / 2, buttonY + 29);
    
    // 조작법 (패널 하단에 여유있게 배치)
    ctx.fillStyle = '#666';
    ctx.font = `${smallFontSize}px Arial`;
    ctx.fillText('ESC: 일시정지', canvas.width / 2, panelY + minPanelHeight - 40);
}

function drawCountdown() {
    drawBackground();
    
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // 카운트다운 숫자 (크고 화려하게)
    const countdownSize = Math.min(120, canvas.width * 0.2);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 6;
    ctx.font = `bold ${countdownSize}px Arial`;
    
    // 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    const displayNumber = countdown > 0 ? countdown : 'GO!';
    const textY = canvas.height / 2;
    
    ctx.strokeText(displayNumber, canvas.width / 2, textY);
    ctx.fillText(displayNumber, canvas.width / 2, textY);
    
    // 그림자 효과 리셋
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 준비 메시지
    if (countdown > 0) {
        ctx.fillStyle = '#FFF';
        ctx.font = `${Math.min(24, canvas.width * 0.05)}px Arial`;
        ctx.fillText('준비하세요!', canvas.width / 2, textY + 80);
    } else {
        ctx.fillStyle = '#4ECDC4';
        ctx.font = `${Math.min(28, canvas.width * 0.06)}px Arial`;
        ctx.fillText('게임 시작!', canvas.width / 2, textY + 80);
    }
    
    ctx.textAlign = 'left';
}

function startCountdown() {
    countdownActive = true;
    countdown = 3;
    flappySound.playScore(); // 카운트다운 시작 소리
    
    const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
            flappySound.playScore(); // 카운트다운 소리
        } else {
            flappySound.playJump(); // GO! 소리
            setTimeout(() => {
                gameStarted = true;
                countdownActive = false;
                clearInterval(countdownInterval);
            }, 1000); // GO! 표시 후 1초 대기
        }
    }, 1000); // 1초마다 카운트다운
}

function handleInput(e) {
    // Prevent click event from firing after touchstart
    if (e && e.type === 'touchstart') {
        e.preventDefault();
    }
    
    if (!gameStarted && !gameOver && !countdownActive) {
        startCountdown();
    } else if (gameStarted && !gameOver && !countdownActive) {
        jump();
    } else if (gameOver) {
        // 게임 오버 화면에서 버튼 클릭 처리
        if (e && (e.type === 'click' || e.type === 'touchstart')) {
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
            
            const minPanelWidth = Math.min(canvas.width * 0.85, 350);
            const minPanelHeight = Math.min(canvas.height * 0.6, 300);
            const panelY = (canvas.height - minPanelHeight) / 2;
            const buttonWidth = Math.min(120, minPanelWidth * 0.5);
            const buttonHeight = 35;
            const buttonY = panelY + 190;
            const restartButtonX = canvas.width / 2 - buttonWidth - 10;
            const mainButtonX = canvas.width / 2 + 10;
            
            // 다시하기 버튼 클릭
            if (x >= restartButtonX && x <= restartButtonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                setTimeout(() => document.location.reload(), 100);
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
}

// 배경 그리기 함수
function drawBackground() {
    // 하늘 그라데이션
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.7, '#98D8E8');
    skyGradient.addColorStop(1, '#B6E5F8');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 구름 그리기
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        const cloudX = (frame * 0.5 + i * 200) % (canvas.width + 100) - 50;
        const cloudY = 50 + i * 60;
        
        // 구름 모양
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 15, cloudY - 10, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 35, cloudY - 10, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 땅 그리기
    const groundHeight = 50;
    const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B7355');
    groundGradient.addColorStop(1, '#654321');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // 풀 그리기
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < canvas.width; i += 20) {
        const grassHeight = 10 + Math.sin((i + frame * 2) * 0.1) * 5;
        ctx.fillRect(i, canvas.height - groundHeight, 3, -grassHeight);
    }
}

function drawPauseScreen() {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 일시정지 메시지
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.strokeText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
}

// --- Game Loop ---
function gameLoop() {
    if (!gameStarted && !gameOver && !countdownActive) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (countdownActive) {
        drawCountdown();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameOver) {
        drawBackground();
        drawPipes();
        drawBird();
        drawGameOver();
        requestAnimationFrame(gameLoop);
        return;
    }

    drawBackground();
    drawPipes();
    drawBird();
    drawScore();

    if (!isPaused) {
        updateBird();
        updatePipes();
        checkCollisions();
        generatePipes();
        frame++;
    } else {
        drawPauseScreen();
    }

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
    } else if (e.key === 'Escape') {
        if (!gameOver) {
            isPaused = !isPaused;
        }
    }
});
document.addEventListener('click', handleInput);
document.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('resize', () => {
    setCanvasSize();
    // 게임 객체들 위치 재조정
    if (bird) {
        bird.x = canvas.width * BIRD_START_X_RATIO;
        bird.y = canvas.height * BIRD_START_Y_RATIO;
        bird.width = canvas.width * BIRD_WIDTH_RATIO;
        bird.height = canvas.height * BIRD_HEIGHT_RATIO;
        bird.gravity = canvas.height * GRAVITY_RATIO;
        bird.jump = canvas.height * JUMP_STRENGTH_RATIO;
    }
    
    if (pipe) {
        pipe.width = canvas.width * PIPE_WIDTH_RATIO;
        pipe.gap = canvas.height * PIPE_GAP_RATIO;
        pipe.speed = canvas.width * PIPE_SPEED_RATIO;
    }
});

// 페이지 가시성 API를 사용한 성능 최적화
let isPageVisible = !document.hidden;

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨지면 자동으로 일시정지
        isPageVisible = false;
        if (gameStarted && !gameOver) {
            isPaused = true;
        }
    } else {
        // 페이지가 다시 보이면 게임 재개 준비
        isPageVisible = true;
        if (gameStarted && !gameOver && isPaused) {
            // 사용자가 수동으로 일시정지한 것이 아니라면 자동 재개
            setTimeout(() => {
                if (isPaused && isPageVisible) {
                    isPaused = false;
                }
            }, 100);
        }
    }
});
