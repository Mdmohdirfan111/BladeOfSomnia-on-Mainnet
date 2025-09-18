// Import wallet functions from wallet.js
import { connectWallet, updateWokeBalance, getOnChainHighScore, handleGm, contract } from './wallet.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Game Variables ---
    let score = 0, highScore = 0, isGameOver = false, isSlashing = false, gameStartTime, speedMultiplier;
    let coins = [], bombs = [], slashes = [];

    // --- Game Physics & Config ---
    const gravity = 0.05;
    const initialSpawnRate = 1200; // in milliseconds
    const coinTypes = { btc: { color: '#F7931A', radius: 35, score: 50 }, eth: { color: '#627EEA', radius: 35, score: 50 }, ada: { color: '#0033AD', radius: 30, score: 30 }, doge: { color: '#C2A633', radius: 25, score: 20 }, shiba: { color: '#FFC107', radius: 25, score: 20 } };
    const coinKeys = Object.keys(coinTypes);

    // --- DOM Elements ---
    const lobbyContainer = document.getElementById('lobby-container');
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const gmBtn = document.getElementById('gmBtn');
    const playerAddressEl = document.getElementById('playerAddress');
    const wokeBalanceEl = document.getElementById('wokeBalance');
    const controlsSection = document.getElementById('controls-section');
    const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
    const leaderboardListEl = document.getElementById('leaderboard-list');
    const startGameBtn = document.getElementById('startGameBtn');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreEl = document.getElementById('finalScore');
    const claimTokensBtn = document.getElementById('claimTokensBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const claimStatus = document.getElementById('claimStatus');
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');

    // --- Sound Effect Elements ---
    const launchSound = document.getElementById('launchSound');
    const sliceSound = document.getElementById('sliceSound');
    
    // ================== LOBBY LOGIC ==================
    function onWalletConnected() {
        connectWalletBtn.style.display = 'none';
        const userAccount = ethers.getAddress(signer.address);
        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        playerAddressEl.textContent = `Player: ${formattedAddress}`;
        playerAddressEl.classList.remove('hidden');
        wokeBalanceEl.classList.remove('hidden');
        controlsSection.classList.remove('hidden');
        
        updateWokeBalance(wokeBalanceEl);
        getOnChainHighScore().then(hs => {
            highScore = hs;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
        });
        
        leaderboardLoadingEl.style.display = 'none';
        leaderboardListEl.innerHTML = `<li>Leaderboard feature is under construction.</li>`;
    }

    // ================== GAME LOGIC ==================
    class FlyingObject {
        constructor(x, y, vx, vy, radius) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.radius = radius; this.isSliced = false; }
        update() { this.vy += gravity * speedMultiplier; this.x += this.vx; this.y += this.vy; }
    }
    class Coin extends FlyingObject { /* ... same as before ... */ }
    class Bomb extends FlyingObject { /* ... same as before ... */ }

    function showLobby() {
        lobbyContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        updateWokeBalance(wokeBalanceEl);
    }

    function startGame() {
        lobbyContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        score = 0; isGameOver = false; coins = []; bombs = []; speedMultiplier = 1;
        updateScore();
        gameOverModal.classList.add('hidden'); claimTokensBtn.disabled = false; claimStatus.textContent = '';
        gameStartTime = Date.now();
        gameLoop();
        setTimeout(spawnItem, initialSpawnRate);
    }
    
    function endGame() {
        isGameOver = true;
        if (score > highScore) { highScore = score; highScoreDisplay.textContent = `High Score: ${highScore}`; }
        finalScoreEl.textContent = score;
        gameOverModal.classList.remove('hidden');
    }

    function gameLoop() {
        if (isGameOver) return;
        // Increase speed over time
        speedMultiplier = 1 + (Date.now() - gameStartTime) / 30000; // Speed doubles every 30 seconds

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        [...coins, ...bombs].forEach(item => { item.update(); item.draw(); });
        // Cleanup off-screen items
        coins = coins.filter(coin => coin.y < canvas.height + 100);
        bombs = bombs.filter(bomb => bomb.y < canvas.height + 100);

        if (isSlashing && slashes.length > 1) { /* ... same as before ... */ }
        requestAnimationFrame(gameLoop);
    }

    function spawnItem() {
        if (isGameOver) return;
        const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1; // Avoid spawning at very edges
        const y = canvas.height + 50;
        const vx = (Math.random() * 6 - 3) * speedMultiplier;
        const vy = -(Math.random() * 5 + 12) * speedMultiplier; // Stronger upward launch

        if (Math.random() < 0.2) { bombs.push(new Bomb(x, y, vx, vy)); } 
        else { const type = coinKeys[Math.floor(Math.random() * coinKeys.length)]; coins.push(new Coin(x, y, vx, vy, type)); }
        
        launchSound.currentTime = 0;
        launchSound.play();

        const elapsedTime = Date.now() - gameStartTime;
        const nextSpawnTime = Math.max(200, initialSpawnRate - (elapsedTime / 120)); // Spawn rate increases faster
        setTimeout(spawnItem, nextSpawnTime);
    }

    function updateScore() { /* ... same as before ... */ }
    
    function startSlash(e) { /* ... same as before ... */ }
    function endSlash() { /* ... same as before ... */ }
    function moveSlash(e) { /* ... same as before ... */ }
    
    function checkCollision(x, y) {
        coins.forEach(coin => {
            if (!coin.isSliced && Math.hypot(x - coin.x, y - coin.y) < coin.radius) {
                coin.isSliced = true;
                score += coin.score;
                updateScore();
                sliceSound.currentTime = 0;
                sliceSound.play();
            }
        });
        bombs.forEach(bomb => { if (Math.hypot(x - bomb.x, y - bomb.y) < bomb.radius) endGame(); });
    }

    async function claimTokens() { /* ... same as before ... */ }

    // ================== EVENT LISTENERS ==================
    connectWalletBtn.addEventListener('click', () => connectWallet(onWalletConnected));
    gmBtn.addEventListener('click', () => handleGm(gmBtn));
    startGameBtn.addEventListener('click', startGame);
    canvas.addEventListener('mousedown', startSlash);
    canvas.addEventListener('mousemove', moveSlash);
    canvas.addEventListener('mouseup', endSlash);
    canvas.addEventListener('mouseleave', endSlash);
    playAgainBtn.addEventListener('click', startGame);
    claimTokensBtn.addEventListener('click', claimTokens);
    backToLobbyBtn.addEventListener('click', showLobby);
});
