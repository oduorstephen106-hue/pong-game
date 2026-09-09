// Startup screen handler
document.getElementById('enterBtn').addEventListener('click', () => {
    const startupScreen = document.getElementById('startupScreen');
    const gameContainer = document.getElementById('gameContainer');
    
    startupScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
});

// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const paddleWidth = 10;
const paddleHeight = 80;
const ballRadius = 8;
let gameRunning = false;

// Game State - Cosmetics and Shop
let gameState = {
    coins: 0,
    isPremium: false,
    selectedBallSkin: 'default',
    selectedPaddleSkin: 'default',
    ownedBallSkins: ['default'],
    ownedPaddleSkins: ['default']
};

// Shop Items
const ballSkins = [
    { id: 'default', name: 'Classic', color: '#ffff00', cost: 0 },
    { id: 'fire', name: 'Fire Ball', color: '#ff4444', cost: 100 },
    { id: 'ice', name: 'Ice Ball', color: '#44ccff', cost: 100 },
    { id: 'neon', name: 'Neon', color: '#00ff00', cost: 150 },
    { id: 'rainbow', name: 'Rainbow', gradient: true, cost: 200 },
    { id: 'electric', name: 'Electric', color: '#ffff00', glow: true, cost: 150 }
];

const paddleSkins = [
    { id: 'default', name: 'Classic', color: '#00ff00', cost: 0 },
    { id: 'dark', name: 'Dark Knight', color: '#333333', cost: 100 },
    { id: 'gold', name: 'Gold', color: '#ffd700', cost: 150 },
    { id: 'plasma', name: 'Plasma', color: '#ff00ff', cost: 150 },
    { id: 'crystal', name: 'Crystal', color: '#00ffff', cost: 200 }
];

// Player paddle
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

// Computer paddle
const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 5
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: 5,
    dy: 5,
    speed: 5
};

// Score
let playerScore = 0;
let computerScore = 0;

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('pongGameState');
    if (saved) {
        gameState = JSON.parse(saved);
    }
    updateCoinsDisplay();
    updatePremiumBadge();
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('pongGameState', JSON.stringify(gameState));
}

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse movement for player paddle
document.addEventListener('mousemove', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - canvasRect.top;
    
    if (mouseY - paddleHeight / 2 !== player.y) {
        player.y = mouseY - paddleHeight / 2;
    }
});

// Shop Modal Functions
const shopModal = document.getElementById('shopModal');
const closeShopBtn = document.getElementById('closeShop');
const shopBtn = document.getElementById('shopBtn');

shopBtn.addEventListener('click', () => {
    shopModal.classList.remove('hidden');
    populateShop();
});

closeShopBtn.addEventListener('click', () => {
    shopModal.classList.add('hidden');
});

shopModal.addEventListener('click', (e) => {
    if (e.target === shopModal) {
        shopModal.classList.add('hidden');
    }
});

function populateShop() {
    const ballShop = document.getElementById('ballShop');
    const paddleShop = document.getElementById('paddleShop');
    const shopCoinsDisplay = document.getElementById('shopCoins');
    
    shopCoinsDisplay.textContent = gameState.coins;
    
    // Populate ball skins
    ballShop.innerHTML = '';
    ballSkins.forEach(skin => {
        const owned = gameState.ownedBallSkins.includes(skin.id);
        const isSelected = gameState.selectedBallSkin === skin.id;
        
        const item = document.createElement('div');
        item.className = 'shop-item' + (owned ? ' owned' : '');
        item.innerHTML = `
            <div style="width: 40px; height: 40px; margin: 0 auto 10px; border-radius: 50%; background: ${skin.gradient ? 'linear-gradient(135deg, #ff00ff, #00ff00)' : skin.color}; ${skin.glow ? 'box-shadow: 0 0 20px ' + skin.color : ''}"></div>
            <h4>${skin.name}</h4>
            <p>${skin.cost === 0 ? 'FREE' : skin.cost + ' coins'}</p>
            <button class="buy-btn ${owned ? 'owned' : ''}" onclick="buySkin('ball', '${skin.id}', ${skin.cost})">
                ${owned ? (isSelected ? '✓ EQUIPPED' : 'EQUIP') : 'BUY'}
            </button>
        `;
        ballShop.appendChild(item);
    });
    
    // Populate paddle skins
    paddleShop.innerHTML = '';
    paddleSkins.forEach(skin => {
        const owned = gameState.ownedPaddleSkins.includes(skin.id);
        const isSelected = gameState.selectedPaddleSkin === skin.id;
        
        const item = document.createElement('div');
        item.className = 'shop-item' + (owned ? ' owned' : '');
        item.innerHTML = `
            <div style="width: 20px; height: 50px; margin: 0 auto 10px; background: ${skin.color}; border-radius: 3px;"></div>
            <h4>${skin.name}</h4>
            <p>${skin.cost === 0 ? 'FREE' : skin.cost + ' coins'}</p>
            <button class="buy-btn ${owned ? 'owned' : ''}" onclick="buySkin('paddle', '${skin.id}', ${skin.cost})">
                ${owned ? (isSelected ? '✓ EQUIPPED' : 'EQUIP') : 'BUY'}
            </button>
        `;
        paddleShop.appendChild(item);
    });
}

function buySkin(type, skinId, cost) {
    if (type === 'ball') {
        if (gameState.ownedBallSkins.includes(skinId)) {
            gameState.selectedBallSkin = skinId;
            saveGameState();
            populateShop();
            return;
        }
        
        if (gameState.coins >= cost && cost > 0) {
            gameState.coins -= cost;
            gameState.ownedBallSkins.push(skinId);
            gameState.selectedBallSkin = skinId;
            saveGameState();
            updateCoinsDisplay();
            populateShop();
            showNotification(`🎉 Ball skin "${skinId}" purchased!`);
        } else if (cost === 0) {
            gameState.selectedBallSkin = skinId;
            saveGameState();
            populateShop();
        } else {
            showNotification('❌ Not enough coins!');
        }
    } else if (type === 'paddle') {
        if (gameState.ownedPaddleSkins.includes(skinId)) {
            gameState.selectedPaddleSkin = skinId;
            saveGameState();
            populateShop();
            return;
        }
        
        if (gameState.coins >= cost && cost > 0) {
            gameState.coins -= cost;
            gameState.ownedPaddleSkins.push(skinId);
            gameState.selectedPaddleSkin = skinId;
            saveGameState();
            updateCoinsDisplay();
            populateShop();
            showNotification(`🎉 Paddle skin "${skinId}" purchased!`);
        } else if (cost === 0) {
            gameState.selectedPaddleSkin = skinId;
            saveGameState();
            populateShop();
        } else {
            showNotification('❌ Not enough coins!');
        }
    }
}

function updateCoinsDisplay() {
    document.getElementById('coins').textContent = gameState.coins;
}

function updatePremiumBadge() {
    const badge = document.getElementById('premiumBadge');
    const adBannerTop = document.getElementById('adBannerTop');
    const adBannerBottom = document.getElementById('adBannerBottom');
    
    if (gameState.isPremium) {
        badge.classList.remove('hidden');
        adBannerTop.classList.add('hidden');
        adBannerBottom.classList.add('hidden');
    } else {
        badge.classList.add('hidden');
        adBannerTop.classList.remove('hidden');
        adBannerBottom.classList.remove('hidden');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: #000;
        padding: 20px 40px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 1.2em;
        z-index: 3000;
        animation: slideUp 0.5s ease-out;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Update function
function update() {
    if (!gameRunning) return;

    // Player paddle movement with arrow keys
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }

    // Constrain player paddle
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Ball collision with left and right walls (scoring)
    if (ball.x - ball.radius < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        addCoins(10); // Earn 10 coins for computer scoring
        resetBall();
        return;
    }
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        addCoins(20); // Earn 20 coins for player scoring
        resetBall();
        return;
    }

    // Ball collision with player paddle
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.dx;
        ball.x = player.x + player.width + ball.radius;
        
        const collidePoint = ball.y - (player.y + player.height / 2);
        ball.dy = (collidePoint / (player.height / 2)) * ball.speed;
    }

    // Ball collision with computer paddle
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;
        
        const collidePoint = ball.y - (computer.y + computer.height / 2);
        ball.dy = (collidePoint / (computer.height / 2)) * ball.speed;
    }

    // Computer AI
    const computerCenter = computer.y + computer.height / 2;
    if (computerCenter < ball.y - 35) {
        computer.y += computer.speed;
    } else if (computerCenter > ball.y + 35) {
        computer.y -= computer.speed;
    }

    // Keep computer paddle in bounds
    if (computer.y < 0) computer.y = 0;
    if (computer.y > canvas.height - computer.height) {
        computer.y = canvas.height - computer.height;
    }
}

// Draw function
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player paddle with selected skin
    const playerSkin = paddleSkins.find(s => s.id === gameState.selectedPaddleSkin);
    ctx.fillStyle = playerSkin.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw computer paddle
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Draw ball with selected skin
    const ballSkin = ballSkins.find(s => s.id === gameState.selectedBallSkin);
    
    if (ballSkin.gradient) {
        const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#00ff00');
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = ballSkin.color;
    }
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (ballSkin.glow) {
        ctx.strokeStyle = ballSkin.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
}

// Add coins to player
function addCoins(amount) {
    gameState.coins += amount;
    updateCoinsDisplay();
    saveGameState();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
document.getElementById('startBtn').addEventListener('click', () => {
    gameRunning = !gameRunning;
    const btn = document.getElementById('startBtn');
    btn.textContent = gameRunning ? 'Pause Game' : 'Resume Game';
});

// Reset score
document.getElementById('resetBtn').addEventListener('click', () => {
    playerScore = 0;
    computerScore = 0;
    gameRunning = false;
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
    document.getElementById('startBtn').textContent = 'Start Game';
    resetBall();
});

// Initialize game
loadGameState();
resetBall();
gameLoop();
