document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const restartBtn = document.getElementById('restart-btn');

    const ALL_IMAGES = [
        'https://game-icons.net/icons/ffffff/000000/1x1/lorc/cat.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/delapouite/labrador-head.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/delapouite/duck.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/delapouite/elephant.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/lorc/fox-head.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/delapouite/panda.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/delapouite/rabbit.svg',
        'https://game-icons.net/icons/ffffff/000000/1x1/sparker/bear-face.svg'
    ];

    const DIFFICULTIES = {
        easy: { pairs: 4, columns: 4 },   // 2x4 grid
        medium: { pairs: 6, columns: 4 }, // 3x4 grid
        hard: { pairs: 8, columns: 4 }    // 4x4 grid
    };

    let flippedCards = [];
    let matchedPairs = 0;
    let currentDifficulty = 'medium'; // Default difficulty
    let totalPairs = 0;
    let lockBoard = false;

    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    function createBoard(difficulty) {
        currentDifficulty = difficulty;
        const settings = DIFFICULTIES[difficulty];
        totalPairs = settings.pairs;

        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${settings.columns}, 100px)`;

        const imagesForGame = ALL_IMAGES.slice(0, totalPairs);
        const cardImages = [...imagesForGame, ...imagesForGame];
        shuffle(cardImages);

        matchedPairs = 0;
        flippedCards = [];
        lockBoard = false;

        for (let i = 0; i < cardImages.length; i++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.image = cardImages[i];

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-face', 'card-front');
            cardFront.textContent = '?';

            const cardBack = document.createElement('div');
            cardBack.classList.add('card-face', 'card-back');
            cardBack.innerHTML = `<img src="${cardImages[i]}" alt="card image">`;

            card.appendChild(cardFront);
            card.appendChild(cardBack);

            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
        }

        updateActiveButton();
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('flipped')) return;
        if (flippedCards.length < 2) {
            this.classList.add('flipped');
            flippedCards.push(this);

            if (flippedCards.length === 2) {
                lockBoard = true;
                setTimeout(checkForMatch, 1000);
            }
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.image === card2.dataset.image) {
            card1.removeEventListener('click', flipCard);
            card2.removeEventListener('click', flipCard);
            matchedPairs++;
            if (matchedPairs === totalPairs) {
                setTimeout(() => alert('축하합니다! 게임에서 승리했습니다!'), 500);
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }
        flippedCards = [];
        lockBoard = false;
    }

    function updateActiveButton() {
        document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
        if (currentDifficulty === 'easy') easyBtn.classList.add('active');
        else if (currentDifficulty === 'medium') mediumBtn.classList.add('active');
        else if (currentDifficulty === 'hard') hardBtn.classList.add('active');
    }

    easyBtn.addEventListener('click', () => createBoard('easy'));
    mediumBtn.addEventListener('click', () => createBoard('medium'));
    hardBtn.addEventListener('click', () => createBoard('hard'));
    restartBtn.addEventListener('click', () => createBoard(currentDifficulty));

    // Initial game start
    createBoard(currentDifficulty);
});
