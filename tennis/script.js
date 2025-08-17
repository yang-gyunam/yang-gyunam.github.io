const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// 게임 상수
const PADDLE_WIDTH = 10, PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const NET_WIDTH = 2, NET_HEIGHT = 10;

// 게임 객체
const player = {
    x: 0,
    y: (canvas.height - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#FFF',
    score: 0
};

const com = {
    x: canvas.width - PADDLE_WIDTH,
    y: (canvas.height - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#FFF',
    score: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: BALL_RADIUS,
    speed: 7,
    velocityX: 5,
    velocityY: 5,
    color: '#FFF'
};

let isGamePaused = false;

// 그리기 함수
function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawArc(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawText(text, x, y, color) {
    context.fillStyle = color;
    context.font = '75px fantasy';
    context.fillText(text, x, y);
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(canvas.width / 2 - NET_WIDTH / 2, i, NET_WIDTH, NET_HEIGHT, '#FFF');
    }
}

// 렌더링 함수
function render() {
    // 캔버스 지우기
    drawRect(0, 0, canvas.width, canvas.height, '#111');

    // 네트 그리기
    drawNet();

    // 점수 그리기
    drawText(player.score, canvas.width / 4, canvas.height / 5, '#FFF');
    drawText(com.score, 3 * canvas.width / 4, canvas.height / 5, '#FFF');

    // 패들 그리기
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);

    // 공 그리기
    drawArc(ball.x, ball.y, ball.radius, ball.color);
}

// 패들 이동 (마우스 및 터치)
document.addEventListener('mousemove', movePaddle);
document.addEventListener('touchmove', movePaddle);

function movePaddle(evt) {
    evt.preventDefault(); // 스크롤 등 기본 동작 방지
    let y;
    if (evt.type === 'touchmove') {
        const touch = evt.touches[0];
        y = touch.clientY;
    } else {
        y = evt.clientY;
    }

    let rect = canvas.getBoundingClientRect();
    
    // 캔버스의 CSS 크기와 실제 렌더링 크기 사이의 비율 계산
    const scaleY = canvas.height / rect.height;

    // 터치/마우스 위치를 캔버스 내부 좌표로 변환
    const canvasY = (y - rect.top) * scaleY;

    player.y = canvasY - player.height / 2;
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

// 공 리셋
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 7;
    ball.velocityX = -ball.velocityX;
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
    if (isGamePaused) return;

    // 공 이동
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // 컴퓨터 패들 AI
    let computerLevel = 0.1;
    com.y += (ball.y - (com.y + com.height / 2)) * computerLevel;


    // 벽 충돌 (상하)
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
    }

    // 패들 충돌
    let p = (ball.x < canvas.width / 2) ? player : com;
    if (collision(ball, p)) {
        // 공이 패들의 어디에 부딪혔는지 확인
        let collidePoint = (ball.y - (p.y + p.height / 2));
        collidePoint = collidePoint / (p.height / 2);

        // 반사 각도 계산
        let angleRad = (Math.PI / 4) * collidePoint;

        // X 방향 변경
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // 공 속도 증가
        ball.speed += 0.5;
    }

    // 점수 업데이트
    if (ball.x - ball.radius < 0) {
        com.score++;
        pauseAndReset();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        pauseAndReset();
    }
}

// 창 크기 조절
function resizeCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.min(viewportWidth / 800, viewportHeight / 600);

    canvas.style.width = (800 * scale) + 'px';
    canvas.style.height = (600 * scale) + 'px';
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// 게임 루프
function gameLoop() {
    update();
    render();
}

// 프레임 속도 설정
const framePerSecond = 50;
setInterval(gameLoop, 1000 / framePerSecond);
