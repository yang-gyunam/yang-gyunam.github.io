// 사운드 시스템
class MemorySoundSystem {
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
    
    playCardFlip() {
        this.createSound(600, 0.1, 'sine', 0.05);
    }
    
    playMatch() {
        this.createSound(800, 0.2, 'sine', 0.08);
        setTimeout(() => this.createSound(1000, 0.2, 'sine', 0.08), 100);
    }
    
    playMismatch() {
        this.createSound(300, 0.3, 'sawtooth', 0.06);
    }
    
    playGameComplete() {
        this.createSound(500, 0.3, 'sine', 0.1);
        setTimeout(() => this.createSound(600, 0.3, 'sine', 0.1), 150);
        setTimeout(() => this.createSound(800, 0.3, 'sine', 0.1), 300);
        setTimeout(() => this.createSound(1000, 0.5, 'sine', 0.1), 450);
    }
}

const memorySound = new MemorySoundSystem();

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    // Device Detection
    const detectDevice = () => {
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
    };
    
    const { isMobile } = detectDevice();

    // 컬러풀하고 라이센스 프리한 CSS 아이콘들
    const ALL_ICONS = [
        { emoji: '🐱', color: '#FF6B6B', name: 'cat' },        // 고양이
        { emoji: '🐶', color: '#4ECDC4', name: 'dog' },        // 강아지
        { emoji: '🐰', color: '#45B7D1', name: 'rabbit' },     // 토끼
        { emoji: '🐼', color: '#96CEB4', name: 'panda' },      // 판다
        { emoji: '🐯', color: '#FFEAA7', name: 'tiger' },     // 호랑이
        { emoji: '🐵', color: '#DDA0DD', name: 'monkey' },     // 원숭이
        { emoji: '🐸', color: '#98D8C8', name: 'frog' },      // 개구리
        { emoji: '🐙', color: '#F7DC6F', name: 'octopus' }    // 문어
    ];

    const DIFFICULTIES = {
        easy: { pairs: 4, columns: 4 },   // 2x4 grid
        medium: { pairs: 6, columns: 4 }, // 3x4 grid
        hard: { pairs: 8, columns: 4 }    // 4x4 grid
    };

    let flippedCards = [];
    let matchedPairs = 0;
    let currentDifficulty = 'medium';
    let totalPairs = 0;
    let lockBoard = false;
    let moves = 0;
    let timer = 0;
    let gameTimer = null;
    let gameStarted = false;
    let bestScores = JSON.parse(localStorage.getItem('memoryGameBestScores') || '{}');

    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    function createBoard(difficulty) {
        currentDifficulty = difficulty;
        const settings = DIFFICULTIES[difficulty];
        totalPairs = settings.pairs;

        gameBoard.innerHTML = '';
        
        // 모바일에 맞는 카드 크기 조정
        let cardSize, gap;
        if (isMobile) {
            cardSize = Math.min(70, Math.floor((window.innerWidth - 40) / settings.columns) - 10);
            gap = '8px';
        } else {
            cardSize = 100;
            gap = '15px';
        }
        
        gameBoard.style.gridTemplateColumns = `repeat(${settings.columns}, ${cardSize}px)`;
        gameBoard.style.gap = gap;

        const iconsForGame = ALL_ICONS.slice(0, totalPairs);
        const cardImages = [...iconsForGame, ...iconsForGame];
        shuffle(cardImages);

        // 게임 상태 초기화
        matchedPairs = 0;
        flippedCards = [];
        lockBoard = false;
        moves = 0;
        timer = 0;
        gameStarted = false;
        
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }

        for (let i = 0; i < cardImages.length; i++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.image = cardImages[i].name;
            
            // 모바일 대응 카드 크기
            if (isMobile) {
                card.style.width = cardSize + 'px';
                card.style.height = cardSize + 'px';
            }

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-face', 'card-front');
            
            // 모바일에서 물음표 크기 조정
            const questionMarkSize = isMobile ? Math.max(20, cardSize * 0.4) : 40;
            cardFront.innerHTML = `<span style="font-size: ${questionMarkSize}px;">❓</span>`;

            const cardBack = document.createElement('div');
            cardBack.classList.add('card-face', 'card-back');
            const iconData = cardImages[i];
            
            // 모바일에서 이모지 크기 조정
            const emojiSize = isMobile ? Math.max(1.5, cardSize * 0.04) : 3;
            cardBack.innerHTML = `
                <div class="custom-icon" style="
                    font-size: ${emojiSize}em;
                    color: ${iconData.color};
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                ">${iconData.emoji}</div>
            `;

            card.appendChild(cardFront);
            card.appendChild(cardBack);

            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
        }

        updateActiveButton();
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('flipped')) return;
        
        // 첫 번째 카드 클릭 시 게임 시작
        if (!gameStarted) {
            startGame();
        }
        
        if (flippedCards.length < 2) {
            this.classList.add('flipped');
            flippedCards.push(this);
            memorySound.playCardFlip();

            if (flippedCards.length === 2) {
                lockBoard = true;
                moves++;
                updateUI();
                setTimeout(checkForMatch, 1000);
            }
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.image === card2.dataset.image) {
            // 매치된 카드는 flipped 상태를 유지하면서 matched 클래스 추가
            card1.removeEventListener('click', flipCard);
            card2.removeEventListener('click', flipCard);
            // flipped 클래스를 확실히 유지
            card1.classList.add('flipped');
            card2.classList.add('flipped');
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            memorySound.playMatch();
            
            if (matchedPairs === totalPairs) {
                memorySound.playGameComplete();
                endGame();
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            memorySound.playMismatch();
        }
        flippedCards = [];
        lockBoard = false;
        updateUI();
    }

    function updateActiveButton() {
        document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
        if (currentDifficulty === 'easy') easyBtn.classList.add('active');
        else if (currentDifficulty === 'medium') mediumBtn.classList.add('active');
        else if (currentDifficulty === 'hard') hardBtn.classList.add('active');
    }

    // 게임 시작
    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        timer = 0;
        gameTimer = setInterval(() => {
            timer++;
            updateUI();
        }, 1000);
        updateUI();
    }
    
    // 게임 종료
    function endGame() {
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        const score = calculateScore();
        const difficulty = currentDifficulty;
        
        // 최고 기록 업데이트
        if (!bestScores[difficulty] || score > bestScores[difficulty]) {
            bestScores[difficulty] = score;
            localStorage.setItem('memoryGameBestScores', JSON.stringify(bestScores));
        }
        
        setTimeout(() => {
            showGameOverModal(score, difficulty);
        }, 500);
    }
    
    // 점수 계산
    function calculateScore() {
        const baseScore = 1000;
        const timeBonus = Math.max(0, 300 - timer);
        const movePenalty = moves * 5;
        const difficultyMultiplier = currentDifficulty === 'easy' ? 1 : currentDifficulty === 'medium' ? 1.5 : 2;
        
        return Math.round((baseScore + timeBonus - movePenalty) * difficultyMultiplier);
    }
    
    // UI 업데이트
    function updateUI() {
        let uiPanel = document.querySelector('.game-ui');
        if (!uiPanel) {
            uiPanel = document.createElement('div');
            uiPanel.className = 'game-ui';
            uiPanel.style.cssText = `
                display: flex;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 15px;
                border-radius: 15px;
                color: white;
                font-weight: 600;
                margin-bottom: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            `;
            document.querySelector('.game-container').insertBefore(uiPanel, gameBoard);
        }
        
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        
        uiPanel.innerHTML = `
            <span>🕰️ 시간: ${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span>🔄 이동: ${moves}</span>
            <span>🏆 점수: ${gameStarted ? calculateScore() : 0}</span>
            <span>🏅 최고: ${bestScores[currentDifficulty] || 0}</span>
        `;
    }
    
    // 게임 오버 모달
    function showGameOverModal(score, difficulty) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const isNewRecord = bestScores[difficulty] === score;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                color: white;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 400px;
            ">
                <h2 style="margin-top: 0;">🎉 게임 완료!</h2>
                ${isNewRecord ? '<p style="color: #FFD700; font-weight: bold;">🏆 새로운 최고 기록!</p>' : ''}
                <p>난이도: ${difficulty}</p>
                <p>시간: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}</p>
                <p>이동 횟수: ${moves}</p>
                <p style="font-size: 24px; color: #FFD700;">점수: ${score}</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove(); createBoard('${difficulty}')" 
                            style="
                                background: #4ECDC4;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                            ">다시 하기</button>
                    <button onclick="window.location.href='../index.html'" 
                            style="
                                background: #FF6B6B;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                            ">메인으로</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    easyBtn.addEventListener('click', () => createBoard('easy'));
    mediumBtn.addEventListener('click', () => createBoard('medium'));
    hardBtn.addEventListener('click', () => createBoard('hard'));
    restartBtn.addEventListener('click', () => createBoard(currentDifficulty));

    // Initial game start
    createBoard(currentDifficulty);
    updateUI();
});
