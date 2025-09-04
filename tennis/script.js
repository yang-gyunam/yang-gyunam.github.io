const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// 사운드 시스템
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
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
    
    // 비프음 생성
    createBeep(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 효과음 메서드들
    playPaddleHit() {
        this.createBeep(440, 0.1, 'square');
    }
    
    playWallHit() {
        this.createBeep(220, 0.15, 'sawtooth');
    }
    
    playScore() {
        this.createBeep(660, 0.3, 'sine');
        setTimeout(() => this.createBeep(880, 0.3, 'sine'), 150);
    }
    
    playGameOver() {
        this.createBeep(330, 0.5, 'triangle');
        setTimeout(() => this.createBeep(220, 0.8, 'triangle'), 300);
    }
    
    playGameStart() {
        this.createBeep(440, 0.2, 'sine');
        setTimeout(() => this.createBeep(550, 0.2, 'sine'), 100);
        setTimeout(() => this.createBeep(660, 0.3, 'sine'), 200);
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const soundSystem = new SoundSystem();

// 게임 상수
const PADDLE_WIDTH = 10, PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const NET_WIDTH = 2, NET_HEIGHT = 10;

// 게임 객체
const player = {
    x: 10,
    y: (canvas.height - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#4ECDC4',
    score: 0
};

const com = {
    x: canvas.width - PADDLE_WIDTH - 10,
    y: (canvas.height - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#FF6B6B',
    score: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: BALL_RADIUS,
    speed: 7,
    velocityX: 5,
    velocityY: 5,
    color: '#FFE066'
};

let isGamePaused = false;
let gameOver = false;
let winner = '';
let gameStarted = false;
const WINNING_SCORE = 5;
let isPausedByUser = false;
let difficulty = 'medium'; // easy, medium, hard
let isMobile = false;
let deviceMode = 'desktop';
let difficultySettings = {
    easy: { aiSpeed: 0.05, ballSpeed: 5, ballSpeedIncrease: 0.3 },
    medium: { aiSpeed: 0.1, ballSpeed: 7, ballSpeedIncrease: 0.5 },
    hard: { aiSpeed: 0.15, ballSpeed: 9, ballSpeedIncrease: 0.7 }
};

// 그리기 함수
function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawGradientRect(x, y, w, h, color1, color2, isHorizontal = false) {
    const gradient = isHorizontal 
        ? context.createLinearGradient(x, y, x + w, y)
        : context.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    context.fillStyle = gradient;
    context.fillRect(x, y, w, h);
}

function drawArc(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawTennisRacket(x, y, w, h, color1, color2, isAI) {
    context.save();
    
    // 라켓 헤드 (타원형)
    const headHeight = h * 0.7;
    const headY = y + (isAI ? h - headHeight : 0);
    
    // 라켓 헤드 그라데이션
    const gradient = context.createRadialGradient(
        x + w/2, headY + headHeight/2, 0,
        x + w/2, headY + headHeight/2, w/2
    );
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.7, color2);
    gradient.addColorStop(1, color1);
    
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x + w/2, headY + headHeight/2, w/2, headHeight/2, 0, 0, Math.PI * 2);
    context.fill();
    
    // 라켓 헤드 테두리
    context.strokeStyle = color2;
    context.lineWidth = 3;
    context.stroke();
    
    // 라켓 스트링 (가로)
    context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    context.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
        const stringY = headY + (headHeight / 6) * i;
        context.beginPath();
        const stringWidth = Math.sqrt(Math.pow(w/2, 2) - Math.pow(stringY - (headY + headHeight/2), 2)) * 1.8;
        context.moveTo(x + w/2 - stringWidth/2, stringY);
        context.lineTo(x + w/2 + stringWidth/2, stringY);
        context.stroke();
    }
    
    // 라켓 스트링 (세로)
    for (let i = 1; i < 5; i++) {
        const stringX = x + (w / 5) * i;
        context.beginPath();
        const centerY = headY + headHeight/2;
        const stringHeight = Math.sqrt(Math.pow(headHeight/2, 2) - Math.pow(stringX - (x + w/2), 2)) * 1.8;
        context.moveTo(stringX, centerY - stringHeight/2);
        context.lineTo(stringX, centerY + stringHeight/2);
        context.stroke();
    }
    
    // 라켓 핸들
    const handleHeight = h - headHeight;
    const handleY = isAI ? y : y + headHeight;
    const handleWidth = w * 0.4;
    const handleX = x + (w - handleWidth) / 2;
    
    // 핸들 그라데이션
    const handleGradient = context.createLinearGradient(handleX, handleY, handleX + handleWidth, handleY);
    handleGradient.addColorStop(0, '#8B4513');
    handleGradient.addColorStop(0.5, '#A0522D');
    handleGradient.addColorStop(1, '#8B4513');
    
    context.fillStyle = handleGradient;
    context.fillRect(handleX, handleY, handleWidth, handleHeight);
    
    // 핸들 테두리
    context.strokeStyle = '#654321';
    context.lineWidth = 2;
    context.strokeRect(handleX, handleY, handleWidth, handleHeight);
    
    // 핸들 그립 텍스처
    context.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    context.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const gripY = handleY + (handleHeight / 5) * i;
        context.beginPath();
        context.moveTo(handleX + 2, gripY);
        context.lineTo(handleX + handleWidth - 2, gripY);
        context.stroke();
    }
    
    context.restore();
}

function drawBall(x, y, r) {
    context.save();
    
    // 테니스볼 베이스 (형광 노란색)
    const gradient = context.createRadialGradient(x - r/3, y - r/3, 0, x, y, r);
    gradient.addColorStop(0, '#E8FF3D');
    gradient.addColorStop(0.3, '#D4FF00'); 
    gradient.addColorStop(0.8, '#B8E000');
    gradient.addColorStop(1, '#9ACC00');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.fill();
    
    // 테니스볼의 특징적인 곡선 라인들
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.lineCap = 'round';
    
    // 첫 번째 곡선
    context.beginPath();
    context.arc(x, y, r * 0.7, -Math.PI * 0.3, Math.PI * 0.3);
    context.stroke();
    
    // 두 번째 곡선 (반대편)
    context.beginPath();
    context.arc(x, y, r * 0.7, Math.PI * 0.7, Math.PI * 1.3);
    context.stroke();
    
    // 공 테두리 (살짝 어두운 노란색)
    context.strokeStyle = '#A6B800';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.stroke();
    
    // 하이라이트 효과
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.beginPath();
    context.arc(x - r/4, y - r/4, r/4, 0, Math.PI * 2);
    context.fill();
    
    context.restore();
}

function drawText(text, x, y, color) {
    context.fillStyle = color;
    context.font = '75px fantasy';
    context.fillText(text, x, y);
}

function drawNet() {
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 가로 네트
        const netY = canvas.height / 2 - NET_WIDTH / 2;
        
        // 네트 포스트 (좌우)
        context.fillStyle = '#FFFFFF';
        context.fillRect(15, netY - 2, 8, NET_WIDTH + 4);
        context.fillRect(canvas.width - 23, netY - 2, 8, NET_WIDTH + 4);
        
        // 네트 메쉬 패턴
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 2;
        
        // 수평선 (네트 중앙)
        context.beginPath();
        context.moveTo(23, canvas.height / 2);
        context.lineTo(canvas.width - 23, canvas.height / 2);
        context.stroke();
        
        // 메쉬 패턴
        for (let i = 30; i < canvas.width - 30; i += 20) {
            context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(i, netY);
            context.lineTo(i, netY + NET_WIDTH);
            context.stroke();
        }
        
        // 네트 그림자 효과
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillRect(25, netY + 2, canvas.width - 50, NET_WIDTH);
    } else {
        // 일반 테니스: 세로 네트
        const netX = canvas.width / 2 - NET_WIDTH / 2;
        
        // 네트 포스트 (위아래)
        context.fillStyle = '#FFFFFF';
        context.fillRect(netX - 2, 15, NET_WIDTH + 4, 8);
        context.fillRect(netX - 2, canvas.height - 23, NET_WIDTH + 4, 8);
        
        // 네트 메쉬 패턴
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 2;
        
        // 수직선 (네트 중앙)
        context.beginPath();
        context.moveTo(canvas.width / 2, 23);
        context.lineTo(canvas.width / 2, canvas.height - 23);
        context.stroke();
        
        // 메쉬 패턴
        for (let i = 30; i < canvas.height - 30; i += 20) {
            context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(netX, i);
            context.lineTo(netX + NET_WIDTH, i);
            context.stroke();
        }
        
        // 네트 그림자 효과
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillRect(netX + 2, 25, NET_WIDTH, canvas.height - 50);
    }
}

// 렌더링 함수
function render() {
    if (!gameStarted && !gameOver) {
        drawStartScreen();
        return;
    }
    
    if (gameOver) {
        drawGameOverScreen();
        return;
    }
    
    if (isPausedByUser) {
        drawUserPauseScreen();
        return;
    }
    
    // 배경 그라데이션 (어두운 테니스장 분위기)
    const bgGradient = context.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0f1419');
    bgGradient.addColorStop(0.5, '#1a2332');
    bgGradient.addColorStop(1, '#0f1419');
    context.fillStyle = bgGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 테니스 코트 그리기 (하드코트 스타일)
    const courtGradient = context.createLinearGradient(0, 0, 0, canvas.height);
    courtGradient.addColorStop(0, '#2E5B3C');
    courtGradient.addColorStop(0.5, '#3A7049');
    courtGradient.addColorStop(1, '#2E5B3C');
    
    context.fillStyle = courtGradient;
    context.fillRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // 코트 테두리
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 4;
    context.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // 서비스 라인들 (모바일 세로 모드와 일반 모드 구분)
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 2;
    
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 가로 방향 라인들
        const sideMargin = (canvas.height - 30) * 0.1;
        context.beginPath();
        context.moveTo(15, 15 + sideMargin);
        context.lineTo(canvas.width - 15, 15 + sideMargin);
        context.moveTo(15, canvas.height - 15 - sideMargin);
        context.lineTo(canvas.width - 15, canvas.height - 15 - sideMargin);
        context.stroke();
        
        // 서비스 박스 라인들
        const serviceLineX1 = 15 + (canvas.width - 30) * 0.3;
        const serviceLineX2 = canvas.width - 15 - (canvas.width - 30) * 0.3;
        context.beginPath();
        context.moveTo(serviceLineX1, 15 + sideMargin);
        context.lineTo(serviceLineX1, canvas.height - 15 - sideMargin);
        context.moveTo(serviceLineX2, 15 + sideMargin);
        context.lineTo(serviceLineX2, canvas.height - 15 - sideMargin);
        context.stroke();
        
        // 센터 서비스 라인
        context.beginPath();
        context.moveTo(serviceLineX1, canvas.height / 2);
        context.lineTo(serviceLineX2, canvas.height / 2);
        context.stroke();
    } else {
        // 일반 테니스: 세로 방향 라인들
        const sideMargin = (canvas.width - 30) * 0.1;
        context.beginPath();
        context.moveTo(15 + sideMargin, 15);
        context.lineTo(15 + sideMargin, canvas.height - 15);
        context.moveTo(canvas.width - 15 - sideMargin, 15);
        context.lineTo(canvas.width - 15 - sideMargin, canvas.height - 15);
        context.stroke();
        
        // 서비스 박스 라인들
        const serviceLineY1 = 15 + (canvas.height - 30) * 0.3;
        const serviceLineY2 = canvas.height - 15 - (canvas.height - 30) * 0.3;
        context.beginPath();
        context.moveTo(15 + sideMargin, serviceLineY1);
        context.lineTo(canvas.width - 15 - sideMargin, serviceLineY1);
        context.moveTo(15 + sideMargin, serviceLineY2);
        context.lineTo(canvas.width - 15 - sideMargin, serviceLineY2);
        context.stroke();
        
        // 센터 서비스 라인
        context.beginPath();
        context.moveTo(canvas.width / 2, serviceLineY1);
        context.lineTo(canvas.width / 2, serviceLineY2);
        context.stroke();
    }

    // 네트 그리기
    drawNet();

    // 점수 그리기 (그림자 효과)
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 10;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    drawText(player.score, canvas.width / 4, canvas.height / 5, '#FFE066');
    drawText(com.score, 3 * canvas.width / 4, canvas.height / 5, '#FFE066');
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // 패들 그리기 (개선된 테니스 라켓 스타일)
    drawTennisRacket(player.x, player.y, player.width, player.height, '#4ECDC4', '#2D8B86', false);
    drawTennisRacket(com.x, com.y, com.width, com.height, '#FF6B6B', '#C44444', true);

    // 공 그리기
    drawBall(ball.x, ball.y, ball.radius);
    
    // 모바일용 터치 컨트롤 힌트
    if (isMobile && gameStarted && !gameOver && !isPausedByUser) {
        context.save();
        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        context.font = '14px Arial';
        context.textAlign = 'center';
        
        if (window.innerHeight > window.innerWidth) {
            // 세로 모드: 좌우 터치
            context.fillText('좌우 터치로 패들 조작', canvas.width / 2, canvas.height - 40);
        } else {
            // 가로 모드: 상하 터치
            context.fillText('터치로 패들 조작', canvas.width / 2, canvas.height - 20);
        }
        
        context.restore();
    }
}

// 패들 이동 (마우스 및 터치)
let isTouch = false;
document.addEventListener('mousemove', movePaddle);
document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', movePaddle, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(evt) {
    if (!gameStarted || gameOver) return;
    evt.preventDefault();
    isTouch = true;
    movePaddle(evt);
}

function handleTouchEnd(evt) {
    evt.preventDefault();
    isTouch = false;
}

function movePaddle(evt) {
    if (!gameStarted || gameOver) return;
    
    evt.preventDefault(); // 스크롤 등 기본 동작 방지
    let x, y;
    if (evt.type === 'touchmove' || evt.type === 'touchstart') {
        if (evt.touches && evt.touches.length > 0) {
            const touch = evt.touches[0];
            x = touch.clientX;
            y = touch.clientY;
        } else {
            return; // 터치 정보가 없으면 종료
        }
    } else if (evt.type === 'mousemove' && !isTouch) {
        // 터치 중이 아닐 때만 마우스 이벤트 처리
        x = evt.clientX;
        y = evt.clientY;
    } else {
        return; // 처리하지 않을 이벤트
    }

    let rect = canvas.getBoundingClientRect();
    
    // 캔버스의 CSS 크기와 실제 렌더링 크기 사이의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 터치/마우스 위치를 캔버스 내부 좌표로 변환
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    // 모바일 세로 모드에서는 패들이 위아래에 있으므로 좌우로 움직임
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 플레이어 패들은 아래쪽, 좌우로 움직임
        player.x = Math.max(0, Math.min(canvas.width - player.width, canvasX - player.width / 2));
    } else {
        // 일반 테니스: 플레이어 패들은 왼쪽, 위아래로 움직임
        player.y = Math.max(0, Math.min(canvas.height - player.height, canvasY - player.height / 2));
    }
}

// 충돌 감지
function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

// 공 리셋 (초기 속도 랜덤화)
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = difficultySettings[difficulty].ballSpeed;
    
    // 초기 방향 랜덤화
    const randomAngle = (Math.random() - 0.5) * Math.PI / 3; // -30도 ~ +30도
    const direction = Math.random() < 0.5 ? -1 : 1;
    
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 모드: Y축이 주 방향
        ball.velocityY = direction * ball.speed * Math.cos(randomAngle);
        ball.velocityX = ball.speed * Math.sin(randomAngle);
    } else {
        // 일반 모드: X축이 주 방향
        ball.velocityX = direction * ball.speed * Math.cos(randomAngle);
        ball.velocityY = ball.speed * Math.sin(randomAngle);
    }
}

function pauseAndReset() {
    isGamePaused = true;
    setTimeout(() => {
        resetBall();
        isGamePaused = false;
    }, 2000); // 2초 딜레이
}

// 업데이트 함수
function update() {
    if (isGamePaused || !gameStarted || gameOver || isPausedByUser) return;

    // 공 이동
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // 컴퓨터 패들 AI (개선된 지능)
    let computerLevel = difficultySettings[difficulty].aiSpeed;
    
    // 공이 AI 쪽으로 향하고 있을 때만 적극적으로 움직임
    let aiShouldMove = false;
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 모드: 공이 위쪽(AI)으로 향하고 있는지 확인
        aiShouldMove = ball.velocityY < 0 && ball.y < canvas.height * 0.7;
    } else {
        // 일반 모드: 공이 오른쪽(AI)으로 향하고 있는지 확인  
        aiShouldMove = ball.velocityX > 0 && ball.x > canvas.width * 0.3;
    }
    
    // AI가 움직여야 할 때만 추적, 그렇지 않으면 중앙으로 천천히 이동
    if (aiShouldMove) {
        if (isMobile && window.innerHeight > window.innerWidth) {
            // 세로 테니스: AI 패들은 위쪽, 좌우로 움직임
            const targetX = ball.x - com.width / 2;
            com.x += (targetX - com.x) * computerLevel;
        } else {
            // 일반 테니스: AI 패들은 오른쪽, 위아래로 움직임
            const targetY = ball.y - com.height / 2;
            com.y += (targetY - com.y) * computerLevel;
        }
    } else {
        // 공이 멀리 있을 때는 중앙으로 천천히 이동
        if (isMobile && window.innerHeight > window.innerWidth) {
            const centerX = (canvas.width - com.width) / 2;
            com.x += (centerX - com.x) * (computerLevel * 0.3);
        } else {
            const centerY = (canvas.height - com.height) / 2;
            com.y += (centerY - com.y) * (computerLevel * 0.3);
        }
    }
    
    // 패들이 화면 밖으로 나가지 않도록 제한
    if (isMobile && window.innerHeight > window.innerWidth) {
        com.x = Math.max(0, Math.min(canvas.width - com.width, com.x));
    } else {
        com.y = Math.max(0, Math.min(canvas.height - com.height, com.y));
    }


    // 벽 충돌 처리 (모바일 세로 모드와 일반 모드 구분)
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 좌우 벽 충돌
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            soundSystem.playWallHit();
            ball.velocityX = -ball.velocityX;
        }
    } else {
        // 일반 테니스: 상하 벽 충돌
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            soundSystem.playWallHit();
            ball.velocityY = -ball.velocityY;
        }
    }

    // 패들 충돌 (라운드 패들에 맞는 고급 충돌 감지)
    let p;
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 공이 위쪽에 있으면 AI, 아래쪽에 있으면 플레이어
        p = (ball.y < canvas.height / 2) ? com : player;
    } else {
        // 일반 테니스: 공이 왼쪽에 있으면 플레이어, 오른쪽에 있으면 AI
        p = (ball.x < canvas.width / 2) ? player : com;
    }
    if (collision(ball, p)) {
        // 패들 히트 사운드
        soundSystem.playPaddleHit();
        
        // 모바일 세로 모드에서는 다른 충돌 처리
        if (isMobile && window.innerHeight > window.innerWidth) {
            // 세로 테니스: 패들이 위아래에 있으므로 X축 충돌 계산
            const paddleRadius = p.height / 2; // 세로 모드에서는 height가 짧은 길이
            const ballCenterX = ball.x;
            const paddleLeftX = p.x + paddleRadius;
            const paddleRightX = p.x + p.width - paddleRadius;
            
            let collidePoint, angleRad;
            
            // 패들의 충돌 지점 계산 (좌우 비율)
            collidePoint = (ball.x - (p.x + p.width / 2)) / (p.width / 2);
            angleRad = (Math.PI / 4) * collidePoint; // 최대 45도 각도
            
            // Y 방향 변경 (세로 테니스에서는 Y축이 주 방향)
            let direction = (ball.y < canvas.height / 2) ? 1 : -1; // 위에서 아래로 또는 아래에서 위로
            
            // 속도 계산 (세로 모드에서는 X와 Y가 반대)
            ball.velocityY = direction * ball.speed * Math.cos(angleRad);
            ball.velocityX = ball.speed * Math.sin(angleRad);
            
        } else {
            // 일반 테니스 모드 (기존 코드)
            const paddleRadius = p.width / 2;
            const ballCenterY = ball.y;
            const paddleTopY = p.y + paddleRadius;
            const paddleBottomY = p.y + p.height - paddleRadius;
            
            let collidePoint, angleRad;
            
            // 라운드 끝부분 (위쪽) 충돌
            if (ballCenterY < paddleTopY) {
                const paddleCenterX = p.x + p.width / 2;
                const paddleCenterY = paddleTopY;
                const dx = ball.x - paddleCenterX;
                const dy = ball.y - paddleCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= paddleRadius + ball.radius) {
                    // 원형 충돌에서의 반사각 계산
                    angleRad = Math.atan2(dy, dx);
                    // 더 극단적인 각도 생성 (라운드 끝에서)
                    const extraAngle = (Math.PI / 6) * (dy < 0 ? -1 : 1); // 30도 추가
                    angleRad += extraAngle;
                } else {
                    // 일반적인 패들 면 충돌
                    collidePoint = (ball.y - (p.y + p.height / 2)) / (p.height / 2);
                    angleRad = (Math.PI / 4) * collidePoint;
                }
            }
            // 라운드 끝부분 (아래쪽) 충돌
            else if (ballCenterY > paddleBottomY) {
                const paddleCenterX = p.x + p.width / 2;
                const paddleCenterY = paddleBottomY;
                const dx = ball.x - paddleCenterX;
                const dy = ball.y - paddleCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= paddleRadius + ball.radius) {
                    // 원형 충돌에서의 반사각 계산
                    angleRad = Math.atan2(dy, dx);
                    // 더 극단적인 각도 생성 (라운드 끝에서)
                    const extraAngle = (Math.PI / 6) * (dy < 0 ? -1 : 1); // 30도 추가
                    angleRad += extraAngle;
                } else {
                    // 일반적인 패들 면 충돌
                    collidePoint = (ball.y - (p.y + p.height / 2)) / (p.height / 2);
                    angleRad = (Math.PI / 4) * collidePoint;
                }
            }
            // 일반적인 패들 면 충돌
            else {
                collidePoint = (ball.y - (p.y + p.height / 2)) / (p.height / 2);
                angleRad = (Math.PI / 4) * collidePoint;
            }

            // X 방향 변경 (라운드 끝에서는 각도에 따라 계산)
            let direction = (ball.x < canvas.width / 2) ? 1 : -1;
            
            if (ballCenterY < paddleTopY || ballCenterY > paddleBottomY) {
                // 라운드 끝에서의 반사
                ball.velocityX = ball.speed * Math.cos(angleRad);
                ball.velocityY = ball.speed * Math.sin(angleRad);
                
                // 방향 보정 (항상 올바른 방향으로)
                if ((ball.x < canvas.width / 2 && ball.velocityX < 0) || 
                    (ball.x > canvas.width / 2 && ball.velocityX > 0)) {
                    ball.velocityX = -ball.velocityX;
                }
            } else {
                // 일반적인 면에서의 반사
                ball.velocityX = direction * ball.speed * Math.cos(angleRad);
                ball.velocityY = ball.speed * Math.sin(angleRad);
            }
        }

        // 공 속도 증가
        ball.speed += difficultySettings[difficulty].ballSpeedIncrease;
    }

    // 점수 업데이트 (모바일 세로 모드와 일반 모드 구분)
    if (isMobile && window.innerHeight > window.innerWidth) {
        // 세로 테니스: 위아래로 득점
        if (ball.y - ball.radius < 0) {
            // 공이 위쪽으로 나가면 플레이어 득점 (AI가 위쪽)
            player.score++;
            soundSystem.playScore();
            checkGameOver();
            pauseAndReset();
        } else if (ball.y + ball.radius > canvas.height) {
            // 공이 아래쪽으로 나가면 AI 득점 (플레이어가 아래쪽)
            com.score++;
            soundSystem.playScore();
            checkGameOver();
            pauseAndReset();
        }
    } else {
        // 일반 테니스: 좌우로 득점
        if (ball.x - ball.radius < 0) {
            com.score++;
            soundSystem.playScore();
            checkGameOver();
            pauseAndReset();
        } else if (ball.x + ball.radius > canvas.width) {
            player.score++;
            soundSystem.playScore();
            checkGameOver();
            pauseAndReset();
        }
    }
}

// 게임 상태 체크
function checkGameOver() {
    if (player.score >= WINNING_SCORE) {
        gameOver = true;
        winner = 'Player';
        soundSystem.playGameOver();
    } else if (com.score >= WINNING_SCORE) {
        gameOver = true;
        winner = 'Computer';
        soundSystem.playGameOver();
    }
}

// 일시정지 화면 그리기
function drawUserPauseScreen() {
    // 반투명 오버레이
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 일시정지 메시지
    context.fillStyle = '#FFE066';
    context.font = '60px fantasy';
    context.textAlign = 'center';
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 10;
    context.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
    
    context.fillStyle = '#FFF';
    context.font = '24px Arial';
    context.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
    
    context.shadowBlur = 0;
    context.textAlign = 'left';
}

// 게임 초기화
function resetGame() {
    player.score = 0;
    com.score = 0;
    gameOver = false;
    winner = '';
    gameStarted = false;
    isPausedByUser = false;
    resetBall();
}

// 시작 화면 그리기
function drawStartScreen() {
    // 반투명 오버레이
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 제목
    context.fillStyle = '#FFE066';
    context.font = '50px fantasy';
    context.textAlign = 'center';
    context.fillText('TENNIS GAME', canvas.width / 2, canvas.height / 2 - 120);
    
    // 난이도 선택
    context.fillStyle = '#FFF';
    context.font = '24px Arial';
    context.fillText('난이도 선택:', canvas.width / 2, canvas.height / 2 - 70);
    
    // 난이도 버튼들
    const buttonWidth = 80;
    const buttonHeight = 40;
    const buttonY = canvas.height / 2 - 50;
    
    // Easy 버튼
    context.fillStyle = difficulty === 'easy' ? '#4ECDC4' : '#666';
    context.fillRect(canvas.width / 2 - 140, buttonY, buttonWidth, buttonHeight);
    context.fillStyle = '#000';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('쉬움', canvas.width / 2 - 100, buttonY + 25);
    
    // Medium 버튼
    context.fillStyle = difficulty === 'medium' ? '#4ECDC4' : '#666';
    context.fillRect(canvas.width / 2 - 40, buttonY, buttonWidth, buttonHeight);
    context.fillStyle = '#000';
    context.fillText('보통', canvas.width / 2, buttonY + 25);
    
    // Hard 버튼
    context.fillStyle = difficulty === 'hard' ? '#4ECDC4' : '#666';
    context.fillRect(canvas.width / 2 + 60, buttonY, buttonWidth, buttonHeight);
    context.fillStyle = '#000';
    context.fillText('어려움', canvas.width / 2 + 100, buttonY + 25);
    
    // 조작법
    context.fillStyle = '#FFF';
    context.font = '18px Arial';
    context.fillText('마우스 또는 터치로 패들 조작', canvas.width / 2, canvas.height / 2 + 10);
    context.fillText(`${WINNING_SCORE}점 먼저 획득하면 승리!`, canvas.width / 2, canvas.height / 2 + 35);
    
    // 시작 버튼
    context.fillStyle = '#4ECDC4';
    context.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 70, 200, 50);
    context.fillStyle = '#000';
    context.font = 'bold 24px Arial';
    context.fillText('게임 시작', canvas.width / 2, canvas.height / 2 + 100);
    
    context.textAlign = 'left';
}

// 게임 오버 화면 그리기
function drawGameOverScreen() {
    // 반투명 오버레이
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 승리자 발표
    context.fillStyle = winner === 'Player' ? '#4ECDC4' : '#FF6B6B';
    context.font = '60px fantasy';
    context.textAlign = 'center';
    context.fillText(winner === 'Player' ? 'YOU WIN!' : 'YOU LOSE!', canvas.width / 2, canvas.height / 2 - 60);
    
    // 점수 표시 (더 자세히)
    context.fillStyle = '#FFE066';
    context.font = '30px fantasy';
    context.fillText(`최종 점수`, canvas.width / 2, canvas.height / 2 - 40);
    
    // 플레이어 vs 컴퓨터 점수
    context.font = '40px fantasy';
    context.fillStyle = winner === 'Player' ? '#4ECDC4' : '#FFE066';
    context.fillText(player.score.toString(), canvas.width / 2 - 40, canvas.height / 2 + 10);
    
    context.fillStyle = '#FFF';
    context.font = '30px fantasy';
    context.fillText(':', canvas.width / 2, canvas.height / 2 + 5);
    
    context.font = '40px fantasy';
    context.fillStyle = winner === 'Computer' ? '#FF6B6B' : '#FFE066';
    context.fillText(com.score.toString(), canvas.width / 2 + 40, canvas.height / 2 + 10);
    
    // 승부 설명
    context.fillStyle = '#FFF';
    context.font = '18px Arial';
    context.fillText(`(${WINNING_SCORE}점 선취제)`, canvas.width / 2, canvas.height / 2 + 35);
    
    // 다시하기 버튼
    context.fillStyle = '#4ECDC4';
    context.fillRect(canvas.width / 2 - 110, canvas.height / 2 + 40, 90, 50);
    context.fillStyle = '#000';
    context.font = 'bold 18px Arial';
    context.fillText('다시하기', canvas.width / 2 - 65, canvas.height / 2 + 70);
    
    // 메인으로 버튼
    context.fillStyle = '#FF6B6B';
    context.fillRect(canvas.width / 2 + 20, canvas.height / 2 + 40, 90, 50);
    context.fillStyle = '#000';
    context.font = 'bold 18px Arial';
    context.fillText('메인으로', canvas.width / 2 + 65, canvas.height / 2 + 70);
    
    context.textAlign = 'left';
}

// 클릭/터치 이벤트 처리
function handleClick(evt) {
    evt.preventDefault(); // 기본 동작 방지
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let x, y;
    if (evt.type === 'touchstart' || evt.type === 'touchend') {
        if (evt.touches && evt.touches.length > 0) {
            x = (evt.touches[0].clientX - rect.left) * scaleX;
            y = (evt.touches[0].clientY - rect.top) * scaleY;
        } else if (evt.changedTouches && evt.changedTouches.length > 0) {
            x = (evt.changedTouches[0].clientX - rect.left) * scaleX;
            y = (evt.changedTouches[0].clientY - rect.top) * scaleY;
        } else {
            return; // 터치 정보가 없으면 종료
        }
    } else {
        x = (evt.clientX - rect.left) * scaleX;
        y = (evt.clientY - rect.top) * scaleY;
    }
    
    // 게임 시작 전
    if (!gameStarted && !gameOver) {
        // 난이도 버튼 클릭 체크
        const buttonY = canvas.height / 2 - 50;
        if (y >= buttonY && y <= buttonY + 40) {
            if (x >= canvas.width / 2 - 140 && x <= canvas.width / 2 - 60) {
                difficulty = 'easy';
            } else if (x >= canvas.width / 2 - 40 && x <= canvas.width / 2 + 40) {
                difficulty = 'medium';
            } else if (x >= canvas.width / 2 + 60 && x <= canvas.width / 2 + 140) {
                difficulty = 'hard';
            }
        }
        
        // 시작 버튼 클릭
        if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
            y >= canvas.height / 2 + 70 && y <= canvas.height / 2 + 120) {
            gameStarted = true;
            soundSystem.playGameStart();
        }
    }
    
    // 게임 오버 후 버튼 클릭
    if (gameOver) {
        // 다시하기 버튼 클릭
        if (x >= canvas.width / 2 - 110 && x <= canvas.width / 2 - 20 &&
            y >= canvas.height / 2 + 40 && y <= canvas.height / 2 + 90) {
            resetGame();
            soundSystem.playGameStart();
        }
        
        // 메인으로 버튼 클릭
        if (x >= canvas.width / 2 + 20 && x <= canvas.width / 2 + 110 &&
            y >= canvas.height / 2 + 40 && y <= canvas.height / 2 + 90) {
            window.location.href = '../index.html';
        }
    }
}

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    isMobile = touchSupport && (
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
        screenWidth <= 768 ||
        (screenWidth <= 1024 && screenHeight <= 1366)
    );
    
    deviceMode = isMobile ? 'mobile' : 'desktop';
    
    return { isMobile, deviceMode, touchSupport, screenWidth, screenHeight };
}

// 창 크기 조절 (반응형)
function resizeCanvas() {
    detectDevice();
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 이전 캔버스 크기와 비율 저장
    const prevWidth = canvas.width || 800;
    const prevHeight = canvas.height || 600;
    
    if (isMobile) {
        // 모바일: 세로 화면에서 세로 테니스로 플레이 (위아래 패들)
        if (viewportHeight > viewportWidth) {
            // 세로 모드: 화면 크기를 최대한 활용
            canvas.width = Math.min(viewportWidth * 0.95, 400);
            canvas.height = Math.min(viewportHeight * 0.9, 700);
            
            // 게임이 진행 중이 아닐 때만 위치 초기화
            if (!gameStarted || gameOver) {
                // 패들을 위아래로 배치 (세로 테니스)
                player.x = (canvas.width - PADDLE_HEIGHT) / 2; // 중앙 정렬
                player.y = canvas.height - PADDLE_WIDTH - 20; // 아래쪽
                player.width = PADDLE_HEIGHT; // 가로가 더 길게
                player.height = PADDLE_WIDTH; // 세로가 짧게
                
                com.x = (canvas.width - PADDLE_HEIGHT) / 2; // 중앙 정렬
                com.y = 20; // 위쪽
                com.width = PADDLE_HEIGHT; // 가로가 더 길게
                com.height = PADDLE_WIDTH; // 세로가 짧게
                
                ball.x = canvas.width / 2;
                ball.y = canvas.height / 2;
            } else {
                // 게임 진행 중: 비율에 맞게 위치 조정
                const xRatio = canvas.width / prevWidth;
                const yRatio = canvas.height / prevHeight;
                
                player.x = player.x * xRatio;
                player.y = player.y * yRatio;
                com.x = com.x * xRatio;
                com.y = com.y * yRatio;
                ball.x = ball.x * xRatio;
                ball.y = ball.y * yRatio;
            }
        } else {
            // 가로 모드: 기존 좌우 패들 방식 유지
            canvas.width = Math.min(viewportWidth * 0.9, 600);
            canvas.height = Math.min(viewportHeight * 0.9, 400);
            
            // 게임이 진행 중이 아닐 때만 위치 초기화
            if (!gameStarted || gameOver) {
                // 패들을 좌우로 배치
                player.x = 10;
                player.y = (canvas.height - PADDLE_HEIGHT) / 2;
                player.width = PADDLE_WIDTH;
                player.height = PADDLE_HEIGHT;
                
                com.x = canvas.width - PADDLE_WIDTH - 10;
                com.y = (canvas.height - PADDLE_HEIGHT) / 2;
                com.width = PADDLE_WIDTH;
                com.height = PADDLE_HEIGHT;
                
                ball.x = canvas.width / 2;
                ball.y = canvas.height / 2;
            } else {
                // 게임 진행 중: 비율에 맞게 위치 조정
                const xRatio = canvas.width / prevWidth;
                const yRatio = canvas.height / prevHeight;
                
                player.x = player.x * xRatio;
                player.y = player.y * yRatio;
                com.x = com.x * xRatio;
                com.y = com.y * yRatio;
                ball.x = ball.x * xRatio;
                ball.y = ball.y * yRatio;
            }
        }
        
        // CSS 크기 설정
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        
        // 모바일 스타일 적용 (기존 CSS와 충돌하지 않도록 최소한만 적용)
        if (!document.body.dataset.styleApplied) {
            document.body.style.margin = '0';
            document.body.style.padding = '5px';
            document.body.dataset.styleApplied = 'true';
        }
        canvas.style.maxWidth = '100vw';
        canvas.style.maxHeight = '100vh';
    } else {
        // 데스크톱: 고정 크기 유지 (좌우 패들)
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.width = '800px';
        canvas.style.height = '600px';
        
        // 게임이 진행 중이 아닐 때만 위치 초기화
        if (!gameStarted || gameOver) {
            // 패들을 좌우로 배치
            player.x = 10;
            player.y = (canvas.height - PADDLE_HEIGHT) / 2;
            player.width = PADDLE_WIDTH;
            player.height = PADDLE_HEIGHT;
            
            com.x = canvas.width - PADDLE_WIDTH - 10;
            com.y = (canvas.height - PADDLE_HEIGHT) / 2;
            com.width = PADDLE_WIDTH;
            com.height = PADDLE_HEIGHT;
            
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
        } else {
            // 게임 진행 중: 비율에 맞게 위치 조정
            const xRatio = canvas.width / prevWidth;
            const yRatio = canvas.height / prevHeight;
            
            player.x = player.x * xRatio;
            player.y = player.y * yRatio;
            com.x = com.x * xRatio;
            com.y = com.y * yRatio;
            ball.x = ball.x * xRatio;
            ball.y = ball.y * yRatio;
        }
    }
}

// 키보드 이벤트 리스너
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameStarted && !gameOver) {
        isPausedByUser = !isPausedByUser;
    }
});

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
// 터치와 클릭 이벤트 중복 방지
let lastTouchTime = 0;

function handleClickWithTouchCheck(evt) {
    // 터치 이벤트 후 300ms 이내의 클릭 이벤트는 무시
    if (evt.type === 'click' && Date.now() - lastTouchTime < 300) {
        return;
    }
    handleClick(evt);
}

function handleTouchClick(evt) {
    lastTouchTime = Date.now();
    handleClick(evt);
}

canvas.addEventListener('click', handleClickWithTouchCheck);
canvas.addEventListener('touchstart', handleTouchClick, { passive: false });

// 게임 루프
function gameLoop() {
    update();
    render();
}

// 프레임 속도 설정 (모바일 최적화)
let framePerSecond = isMobile ? 40 : 50;
let gameLoopId;

function startGameLoop() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
    }
    gameLoopId = setInterval(gameLoop, 1000 / framePerSecond);
}

// 페이지 가시성 API를 사용한 성능 최적화
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨지면 게임 루프 중지
        if (gameLoopId) {
            clearInterval(gameLoopId);
            gameLoopId = null;
        }
    } else {
        // 페이지가 다시 보이면 게임 루프 재시작
        startGameLoop();
    }
});

startGameLoop();
