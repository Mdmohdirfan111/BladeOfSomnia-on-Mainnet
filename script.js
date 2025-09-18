import { connectWallet, updateWokeBalance, getOnChainHighScore, handleGm, contract, userAccount } from './wallet.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lobbyContainer = document.getElementById('lobby-container'), gameContainer = document.getElementById('game-container'), connectWalletBtn = document.getElementById('connectWalletBtn'), gmBtn = document.getElementById('gmBtn'), playerAddressEl = document.getElementById('playerAddress'), wokeBalanceEl = document.getElementById('wokeBalance'), controlsSection = document.getElementById('controls-section'), leaderboardLoadingEl = document.getElementById('leaderboard-loading'), leaderboardListEl = document.getElementById('leaderboard-list'), startGameBtn = document.getElementById('startGameBtn'), canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d'), countdownEl = document.getElementById('countdown'), scoreDisplay = document.getElementById('scoreDisplay'), highScoreDisplay = document.getElementById('highScoreDisplay'), gameOverModal = document.getElementById('gameOverModal'), finalScoreEl = document.getElementById('finalScore'), claimTokensBtn = document.getElementById('claimTokensBtn'), playAgainBtn = document.getElementById('playAgainBtn'), claimStatus = document.getElementById('claimStatus'), backToLobbyBtn = document.getElementById('backToLobbyBtn'), launchSound = document.getElementById('launchSound'), sliceSound = document.getElementById('sliceSound');

    // Image & Asset Loading
    const images = {};
    const imageSources = {
        ada: 'ada.png', avax: 'avax.png', bch: 'bch.png', bnb: 'bnb.png', btc: 'btc.png', doge: 'doge.png', dot: 'dot.png', eth: 'eth.png', hbar: 'hbar.png', link: 'link.png', ltc: 'ltc.png', near: 'near.png', pepe: 'pepe.png', shib: 'shib.png', sol: 'sol.png', sui: 'sui.png', tron: 'tron.png', trx: 'trx.png', udsc: 'udsc.png', uni: 'uni.png', usdt: 'usdt.png', xlm: 'xlm.png', xrp: 'xrp.png', bomb: 'bomb.png'
    };

    function loadImages() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '30px "IM Fell English SC"'; ctx.textAlign = 'center';
        ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
        const promises = Object.entries(imageSources).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                images[key] = new Image();
                images[key].src = src;
                images[key].onload = resolve;
                images[key].onerror = () => reject(new Error(`Could not load image: ${src}`));
            });
        });
        return Promise.all(promises);
    }

    // Global Game Variables
    let score = 0, highScore = 0, isGameOver = false, isSlashing = false, gameStartTime, speedMultiplier;
    let coins = [], bombs = [], slashes = [], slicedPieces = [];
   const gravity = 0.06; // Slightly stronger gravity for a better arc
    const initialSpawnRate = 1200; // Yeh line add karni hai
    const coinTypes = {
        btc: { r: 40, s: 100 }, eth: { r: 40, s: 100 }, bnb: { r: 38, s: 80 }, sol: { r: 38, s: 80 }, xrp: { r: 35, s: 70 }, ada: { r: 35, s: 70 }, doge: { r: 32, s: 50 }, shib: { r: 32, s: 50 }, pepe: { r: 30, s: 40 }, link: { r: 35, s: 60 }, dot: { r: 35, s: 60 }, uni: { r: 35, s: 60 }, near: { r: 35, s: 60 }, ltc: { r: 35, s: 60 }, bch: { r: 35, s: 60 }, avax: { r: 35, s: 60 }, tron: { r: 35, s: 60 }, trx: { r: 35, s: 60 }, xlm: { r: 35, s: 60 }, hbar: { r: 35, s: 60 }, sui: { r: 35, s: 60 }, usdt: { r: 30, s: 10 }, udsc: { r: 30, s: 10 }
    };
    const coinKeys = Object.keys(coinTypes);

    // Lobby Logic
    function onWalletConnected() {
        connectWalletBtn.style.display = 'none';
        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        playerAddressEl.textContent = `Player: ${formattedAddress}`;
        playerAddressEl.classList.remove('hidden'); wokeBalanceEl.classList.remove('hidden'); controlsSection.classList.remove('hidden');
        updateWokeBalance(wokeBalanceEl);
        getOnChainHighScore().then(hs => { highScore = hs; highScoreDisplay.textContent = `High Score: ${highScore}`; });
        leaderboardLoadingEl.style.display = 'none';
        leaderboardListEl.innerHTML = `<li>Leaderboard feature is under construction.</li>`;
    }

    // Game Logic & Classes
    class FlyingObject {
        constructor(x, y, vx, vy, radius) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.radius = radius; }
        update() { this.vy += gravity; this.x += this.vx; this.y += this.vy; } // Corrected Physics: Gravity is now constant
    }
    class Coin extends FlyingObject {
        constructor(x, y, vx, vy, type) { const d = coinTypes[type]; super(x, y, vx, vy, d.r); this.type = type; this.score = d.s; }
        draw() { ctx.drawImage(images[this.type], this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2); }
    }
    class Bomb extends FlyingObject {
        constructor(x, y, vx, vy) { super(x, y, vx, vy, 35); }
        draw() { ctx.drawImage(images.bomb, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2); }
    }
    class SlicedCoinPiece extends FlyingObject {
        constructor(x, y, vx, vy, type, isLeft) { super(x, y, vx, vy, coinTypes[type].r); this.type = type; this.isLeft = isLeft; this.angle = 0; this.rotationSpeed = (Math.random() - 0.5) * 0.2; }
        update() { super.update(); this.angle += this.rotationSpeed; }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); const img = images[this.type]; const size = this.radius * 2;
            if (this.isLeft) { ctx.drawImage(img, 0, 0, img.width / 2, img.height, -size/2, -size/2, size/2, size); }
            else { ctx.drawImage(img, img.width / 2, 0, img.width / 2, img.height, 0, -size/2, size/2, size); }
            ctx.restore();
        }
    }

    function showLobby() { lobbyContainer.classList.remove('hidden'); gameContainer.classList.add('hidden'); updateWokeBalance(wokeBalanceEl); }

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
        loadImages().then(() => {
            score = 0; isGameOver = false; coins = []; bombs = []; slicedPieces = []; speedMultiplier = 1;
            updateScore(); gameOverModal.classList.add('hidden'); claimTokensBtn.disabled = false; claimStatus.textContent = '';
            gameStartTime = Date.now();
            gameLoop();
            setTimeout(spawnItem, initialSpawnRate);
        }).catch(error => { console.error(error); alert("Could not load game images. Please check the file names and refresh."); });
    }
    
    function endGame() { isGameOver = true; if (score > highScore) { highScore = score; highScoreDisplay.textContent = `High Score: ${highScore}`; } finalScoreEl.textContent = score; gameOverModal.classList.remove('hidden'); }

    function gameLoop() {
        if (isGameOver) return;
        speedMultiplier = 1 + (Date.now() - gameStartTime) / 45000; // Speed increases over 45 seconds
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        [...coins, ...bombs, ...slicedPieces].forEach(item => { item.update(); item.draw(); });
        coins = coins.filter(coin => coin.y < canvas.height + 100); bombs = bombs.filter(bomb => bomb.y < canvas.height + 100); slicedPieces = slicedPieces.filter(piece => piece.y < canvas.height + 100);
        if (isSlashing && slashes.length > 1) { ctx.strokeStyle = 'white'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(slashes[0].x, slashes[0].y); for (let i = 1; i < slashes.length; i++) ctx.lineTo(slashes[i].x, slashes[i].y); ctx.stroke(); }
        requestAnimationFrame(gameLoop);
    }

    function spawnItem() {
        if (isGameOver) return;
        const elapsedTime = Date.now() - gameStartTime;
        const waveSize = 1 + Math.floor(elapsedTime / 15000); // Add a new item to the wave every 15 seconds
        for (let i = 0; i < waveSize; i++) {
            const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
            const y = canvas.height + 50;
            const vx = (Math.random() * 6 - 3) * speedMultiplier;
            const vy = -(Math.random() * 4 + 8) * speedMultiplier; // Speed aur height kam kar di
            if (Math.random() < (0.15 + elapsedTime / 200000)) { bombs.push(new Bomb(x, y, vx, vy)); }
            else { const type = coinKeys[Math.floor(Math.random() * coinKeys.length)]; coins.push(new Coin(x, y, vx, vy, type)); }
        }
        launchSound.currentTime = 0; launchSound.play().catch(e => {});
        const nextSpawnTime = Math.max(300, initialSpawnRate - (elapsedTime / 150));
        setTimeout(spawnItem, nextSpawnTime);
    }

    function updateScore() { scoreDisplay.textContent = `Score: ${score}`; if (score > highScore) highScoreDisplay.textContent = `High Score: ${score}`; }
    function startSlash(e) { isSlashing = true; slashes = [{ x: e.offsetX, y: e.offsetY }]; }
    function endSlash() { isSlashing = false; slashes = []; }
    function moveSlash(e) { if (!isSlashing) return; const x = e.offsetX; const y = e.offsetY; slashes.push({ x, y }); if (slashes.length > 20) slashes.shift(); checkCollision(x, y); }
    
    function checkCollision(x, y) {
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            if (Math.hypot(x - coin.x, y - coin.y) < coin.radius) {
                score += coin.score; updateScore(); sliceSound.currentTime = 0; sliceSound.play().catch(e => {});
                slicedPieces.push(new SlicedCoinPiece(coin.x, coin.y, -2 * speedMultiplier, coin.vy/2, coin.type, true), new SlicedCoinPiece(coin.x, coin.y, 2 * speedMultiplier, coin.vy/2, coin.type, false));
                coins.splice(i, 1);
            }
        }
        bombs.forEach(bomb => { if (Math.hypot(x - bomb.x, y - bomb.y) < bomb.radius) endGame(); });
    }

    async function claimTokens() {
        if (score === 0) return claimStatus.textContent = "Score is 0, nothing to claim.";
        if (!contract) return claimStatus.textContent = "Wallet not connected.";
        claimTokensBtn.disabled = true; claimStatus.textContent = 'Preparing transaction...';
        try { const tx = await contract.claimTokens(score); claimStatus.textContent = `Claiming... Tx sent.`; await tx.wait(); claimStatus.textContent = `Success! ${score} $WOKE tokens claimed.`; updateWokeBalance(wokeBalanceEl); }
        catch (error) { console.error("Token claim failed:", error); claimStatus.textContent = 'Transaction failed.'; claimTokensBtn.disabled = false; }
    }

    // Event Listeners
    connectWalletBtn.addEventListener('click', () => connectWallet(onWalletConnected));
    gmBtn.addEventListener('click', () => handleGm(gmBtn));
    startGameBtn.addEventListener('click', startCountdown); // Changed to start countdown
    canvas.addEventListener('mousedown', startSlash);
    canvas.addEventListener('mousemove', moveSlash);
    canvas.addEventListener('mouseup', endSlash);
    canvas.addEventListener('mouseleave', endSlash);
    playAgainBtn.addEventListener('click', startCountdown); // Changed to start countdown
    claimTokensBtn.addEventListener('click', claimTokens);
    backToLobbyBtn.addEventListener('click', showLobby);
});
