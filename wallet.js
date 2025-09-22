import { connectWallet, updateWokeBalance, getOnChainHighScore, handleGm, contract, userAccount, disconnectWallet } from './wallet.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    const walletInfo = document.getElementById('wallet-info');
    const gmBtn = document.getElementById('gmBtn');
    const playerAddressEl = document.getElementById('playerAddress');
    const wokeBalanceEl = document.getElementById('wokeBalance');
    const controlsSection = document.getElementById('controls-section');
    const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
    const leaderboardListEl = document.getElementById('leaderboard-list');
    const startGameBtn = document.getElementById('startGameBtn');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const countdownEl = document.getElementById('countdown');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreEl = document.getElementById('finalScore');
    const claimTokensBtn = document.getElementById('claimTokensBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const claimStatus = document.getElementById('claimStatus');
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');
    const launchSound = document.getElementById('launchSound');
    const sliceSound = document.getElementById('sliceSound');

    // Global Game Variables
    let score = 0, highScore = 0, isGameOver = false, isSlashing = false, gameStartTime, speedMultiplier;
    let coins = [], bombs = [], slashes = [], slicedPieces = [];

    const gravity = 0.05;
    const initialSpawnRate = 1200;
    const coinTypes = {
        btc: { radius: 40, score: 50 },
        eth: { radius: 40, score: 50 },
        ada: { radius: 35, score: 30 }
        // Add other coin types here if you have images for them
    };
    const coinKeys = Object.keys(coinTypes);

    // ================== LOBBY LOGIC ==================
    function onWalletConnected() {
        connectWalletBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        controlsSection.classList.remove('hidden');

        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        playerAddressEl.textContent = `Player: ${formattedAddress}`;

        updateWokeBalance(wokeBalanceEl);
        getOnChainHighScore().then(hs => {
            highScore = hs;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
        });
        
        // Temporarily disable leaderboard fetching to avoid errors
        leaderboardLoadingEl.style.display = 'none';
        leaderboardListEl.innerHTML = '<li>No scores available.</li>';
    }

    // ================== GAME LOGIC & CLASSES ==================
    class FlyingObject {
        constructor(x, y, vx, vy, radius) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.radius = radius; }
        update() { this.vy += gravity; this.x += this.vx; this.y += this.vy; }
    }
    class Coin extends FlyingObject {
        constructor(x, y, vx, vy, type) { const d = coinTypes[type]; super(x, y, vx, vy, d.radius); this.type = type; this.score = d.score; }
        draw() { 
            // Simple circle drawing logic
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
            ctx.fillStyle = this.type === 'btc' ? '#F7931A' : (this.type === 'eth' ? '#627EEA' : '#0033AD');
            ctx.fill();
        }
    }
    class Bomb extends FlyingObject {
        constructor(x, y, vx, vy) { super(x, y, vx, vy, 30); }
        draw() {
             ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
             ctx.fillStyle = 'black'; ctx.fill();
        }
    }

    function showLobby() { 
        lobbyContainer.classList.remove('hidden'); 
        gameContainer.classList.add('hidden'); 
        if (userAccount) updateWokeBalance(wokeBalanceEl); 
    }

    function startCountdown() {
        lobbyContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        countdownEl.classList.remove('hidden');
        let count = 3;
        countdownEl.textContent = count;
        const interval = setInterval(() => {
            count--;
            if (count > 0) { countdownEl.textContent = count; }
            else {
                countdownEl.textContent = 'SLASH!';
                setTimeout(() => {
                    clearInterval(interval);
                    countdownEl.classList.add('hidden');
                    startGame();
                }, 500);
            }
        }, 1000);
    }
    
    function startGame() {
        score = 0; isGameOver = false; coins = []; bombs = []; slashes = []; speedMultiplier = 1;
        updateScore(); gameOverModal.classList.add('hidden'); claimTokensBtn.disabled = false; claimStatus.textContent = '';
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
        speedMultiplier = 1 + (Date.now() - gameStartTime) / 30000;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        [...coins, ...bombs].forEach(item => { item.update(); item.draw(); });
        coins = coins.filter(coin => coin.y < canvas.height + 100);
        bombs = bombs.filter(bomb => bomb.y < canvas.height + 100);
        if (isSlashing && slashes.length > 1) { 
            ctx.strokeStyle = 'white'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(slashes[0].x, slashes[0].y); 
            for (let i = 1; i < slashes.length; i++) ctx.lineTo(slashes[i].x, slashes[i].y); 
            ctx.stroke(); 
        }
        requestAnimationFrame(gameLoop);
    }

    function spawnItem() {
        if (isGameOver) return;
        const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        const y = canvas.height + 50;
        const vx = (Math.random() * 6 - 3) * speedMultiplier;
        const vy = -(Math.random() * 5 + 12) * speedMultiplier;
        if (Math.random() < 0.2) { bombs.push(new Bomb(x, y, vx, vy)); } 
        else { const type = coinKeys[Math.floor(Math.random() * coinKeys.length)]; coins.push(new Coin(x, y, vx, vy, type)); }
        launchSound.currentTime = 0; launchSound.play().catch(e => {});
        const elapsedTime = Date.now() - gameStartTime;
        const nextSpawnTime = Math.max(200, initialSpawnRate - (elapsedTime / 120));
        setTimeout(spawnItem, nextSpawnTime);
    }

    function updateScore() { scoreDisplay.textContent = `Score: ${score}`; if (score > highScore) highScoreDisplay.textContent = `High Score: ${score}`; }
    function startSlash(e) { isSlashing = true; slashes = [{ x: e.offsetX, y: e.offsetY }]; }
    function endSlash() { isSlashing = false; slashes = []; }
    function moveSlash(e) {
        if (!isSlashing) return;
        const x = e.offsetX; const y = e.offsetY;
        slashes.push({ x, y });
        if (slashes.length > 20) slashes.shift();
        checkCollision(x, y);
    }
    
    function checkCollision(x, y) {
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            if (Math.hypot(x - coin.x, y - coin.y) < coin.radius) {
                score += coin.score;
                updateScore();
                sliceSound.currentTime = 0;
                sliceSound.play().catch(e => {});
                coins.splice(i, 1);
            }
        }
        bombs.forEach(bomb => { if (Math.hypot(x - bomb.x, y - bomb.y) < bomb.radius) endGame(); });
    }

    async function claimTokens() {
        if (score === 0) return claimStatus.textContent = "Score is 0.";
        if (!contract) return claimStatus.textContent = "Wallet not connected.";
        claimTokensBtn.disabled = true; claimStatus.textContent = 'Preparing transaction...';
        try { 
            const tx = await contract.claimTokens(score); 
            claimStatus.textContent = `Claiming... Tx sent.`; 
            await tx.wait(); 
            claimStatus.textContent = `Success! ${score} $WOKE tokens claimed.`; 
            updateWokeBalance(wokeBalanceEl); 
        }
        catch (error) { 
            console.error("Token claim failed:", error); 
            claimStatus.textContent = 'Transaction failed.'; 
            claimTokensBtn.disabled = false;
        }
    }

    // ================== EVENT LISTENERS ==================
    connectWalletBtn.addEventListener('click', () => connectWallet(onWalletConnected));
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
    gmBtn.addEventListener('click', () => handleGm(gmBtn));
    startGameBtn.addEventListener('click', startCountdown);
    canvas.addEventListener('mousedown', startSlash);
    canvas.addEventListener('mousemove', moveSlash);
    canvas.addEventListener('mouseup', endSlash);
    canvas.addEventListener('mouseleave', endSlash);
    playAgainBtn.addEventListener('click', startCountdown);
    claimTokensBtn.addEventListener('click', claimTokens);
    backToLobbyBtn.addEventListener('click', showLobby);
});
