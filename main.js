document.addEventListener('DOMContentLoaded', () => {

    // ---- 1. SETUP & CONFIGURATION ----
    
    // Canvas and Drawing Context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to fit the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Game State Variables
    let score = 0;
    let highScore = 0;
    let isGameOver = false;
    let isSlashing = false;
    let gameStartTime;
    
    // Arrays to hold game objects
    let coins = [];
    let bombs = [];
    let slashes = []; // To draw the slash trail

    // Game Physics & Difficulty
    const gravity = 0.05;
    let initialSpawnRate = 1200; // in milliseconds

    // Coin types (for simplicity, we'll use colors. You can replace with images)
    const coinTypes = {
        btc: { color: '#F7931A', radius: 35, score: 50 },
        eth: { color: '#627EEA', radius: 35, score: 50 },
        ada: { color: '#0033AD', radius: 30, score: 30 },
        doge: { color: '#C2A633', radius: 25, score: 20 },
        shiba: { color: '#FFC107', radius: 25, score: 20 }
    };
    const coinKeys = Object.keys(coinTypes);

    // ---- 2. DOM ELEMENTS ----
    const scoreDisplay = document.getElementById('scoreDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreEl = document.getElementById('finalScore');
    const claimTokensBtn = document.getElementById('claimTokensBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const claimStatus = document.getElementById('claimStatus');

    // ---- 3. BLOCKCHAIN CONFIGURATION ----
    // Same details from wallet.js
    const contractAddress = "0xBd5a6849d328FcAE2e60F6F226B01cf34947C903";
    const contractABI = [
        {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_score","type":"uint256"}],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"GMed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokensClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_player","type":"address"}],"name":"getHighScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"highScores","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
    ];
    let provider, signer, contract, userAccount;


    // ---- 4. CLASSES for Game Objects ----

    // Base class for any flying object
    class FlyingObject {
        constructor(x, y, vx, vy, radius) {
            this.x = x;
            this.y = y;
            this.vx = vx; // horizontal velocity
            this.vy = vy; // vertical velocity
            this.radius = radius;
            this.isSliced = false;
        }

        update() {
            this.vy += gravity; // apply gravity
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    class Coin extends FlyingObject {
        constructor(x, y, vx, vy, type) {
            const coinData = coinTypes[type];
            super(x, y, vx, vy, coinData.radius);
            this.color = coinData.color;
            this.score = coinData.score;
            this.type = type;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${this.radius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type.toUpperCase(), this.x, this.y);
            // TODO: Replace this with ctx.drawImage(image, this.x, this.y)
        }
    }

    class Bomb extends FlyingObject {
        constructor(x, y, vx, vy) {
            super(x, y, vx, vy, 30);
            this.color = 'black';
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            // Simple fuse
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + 5, this.y - this.radius - 10);
            ctx.stroke();
        }
    }

    // ---- 5. CORE GAME LOGIC ----

    function startGame() {
        // Reset game state
        score = 0;
        isGameOver = false;
        coins = [];
        bombs = [];
        updateScore();
        
        gameOverModal.classList.add('hidden');
        claimTokensBtn.disabled = false;
        claimStatus.textContent = '';

        gameStartTime = Date.now();
        gameLoop();
        
        // Start spawning items
        setTimeout(spawnItem, initialSpawnRate);
    }
    
    function endGame() {
        isGameOver = true;
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
        }
        
        finalScoreEl.textContent = score;
        gameOverModal.classList.remove('hidden');
    }

    function gameLoop() {
        if (isGameOver) return;

        // Clear the canvas for the next frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw all coins
        coins.forEach((coin, index) => {
            coin.update();
            coin.draw();
            // Remove coin if it's off-screen
            if (coin.y > canvas.height + coin.radius) {
                coins.splice(index, 1);
            }
        });

        // Update and draw all bombs
        bombs.forEach((bomb, index) => {
            bomb.update();
            bomb.draw();
            if (bomb.y > canvas.height + bomb.radius) {
                bombs.splice(index, 1);
            }
        });

        // Draw the slash trail
        if (isSlashing && slashes.length > 1) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(slashes[0].x, slashes[0].y);
            for (let i = 1; i < slashes.length; i++) {
                ctx.lineTo(slashes[i].x, slashes[i].y);
            }
            ctx.stroke();
        }

        // Keep the loop going
        requestAnimationFrame(gameLoop);
    }

    function spawnItem() {
        if (isGameOver) return;
        
        const x = Math.random() * canvas.width;
        const y = canvas.height + 50;
        const vx = Math.random() * 8 - 4; // Horizontal velocity (-4 to 4)
        const vy = -(Math.random() * 5 + 10); // Vertical velocity (always up)

        // Randomly decide to spawn a bomb or a coin
        if (Math.random() < 0.2) { // 20% chance to spawn a bomb
            bombs.push(new Bomb(x, y, vx, vy));
        } else {
            const type = coinKeys[Math.floor(Math.random() * coinKeys.length)];
            coins.push(new Coin(x, y, vx, vy, type));
        }

        // Increase difficulty over time by reducing spawn rate
        const elapsedTime = Date.now() - gameStartTime;
        const nextSpawnTime = Math.max(200, initialSpawnRate - (elapsedTime / 100));

        setTimeout(spawnItem, nextSpawnTime);
    }

    function updateScore() {
        scoreDisplay.textContent = `Score: ${score}`;
        if (score > highScore) {
            highScoreDisplay.textContent = `High Score: ${score}`;
        }
    }
    
    // ---- 6. SLASHING & COLLISION DETECTION ----
    
    function startSlash(e) {
        isSlashing = true;
        slashes = [{ x: e.offsetX, y: e.offsetY }];
    }

    function moveSlash(e) {
        if (!isSlashing) return;
        
        const x = e.offsetX;
        const y = e.offsetY;
        
        slashes.push({ x, y });
        if (slashes.length > 20) { // Keep trail short
            slashes.shift();
        }
        
        // Check for collisions
        checkCollision(x, y);
    }

    function endSlash() {
        isSlashing = false;
        slashes = [];
    }
    
    function checkCollision(x, y) {
        // Check coins
        coins.forEach((coin, index) => {
            if (!coin.isSliced) {
                const distance = Math.hypot(x - coin.x, y - coin.y);
                if (distance < coin.radius) {
                    coin.isSliced = true;
                    score += coin.score;
                    updateScore();
                    // Remove sliced coin after a short delay for effect
                    setTimeout(() => coins.splice(index, 1), 100);
                }
            }
        });
        
        // Check bombs
        bombs.forEach(bomb => {
            const distance = Math.hypot(x - bomb.x, y - bomb.y);
            if (distance < bomb.radius) {
                endGame();
            }
        });
    }

    // ---- 7. WEB3 & TOKEN CLAIMING ----
    
    async function initWeb3() {
        if (typeof window.ethereum === 'undefined') {
            alert('Please connect your wallet in the Lobby first!');
            window.location.href = 'index.html';
            return;
        }

        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            userAccount = await signer.getAddress();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Fetch on-chain high score
            const onChainHighScore = await contract.getHighScore(userAccount);
            highScore = Number(onChainHighScore);
            highScoreDisplay.textContent = `High Score: ${highScore}`;
            
        } catch (error) {
            console.error("Web3 init failed:", error);
            alert('Could not connect to wallet. Please go back to the lobby and connect.');
        }
    }
    
    async function claimTokens() {
        if (score === 0) {
            claimStatus.textContent = "Score is 0, nothing to claim.";
            return;
        }
        if (!contract) {
            claimStatus.textContent = "Wallet not connected.";
            return;
        }
        
        claimTokensBtn.disabled = true;
        claimStatus.textContent = 'Preparing transaction... Please confirm in your wallet.';
        
        try {
            const tx = await contract.claimTokens(score);
            claimStatus.textContent = `Claiming... Tx: ${tx.hash.substring(0,10)}...`;
            
            await tx.wait(); // Wait for transaction to be mined
            
            claimStatus.textContent = `Success! ${score} $WOKE tokens claimed.`;
            
        } catch (error) {
            console.error("Token claim failed:", error);
            claimStatus.textContent = 'Transaction failed or rejected.';
            claimTokensBtn.disabled = false; // Allow user to try again
        }
    }

    // ---- 8. EVENT LISTENERS ----
    canvas.addEventListener('mousedown', startSlash);
    canvas.addEventListener('mousemove', moveSlash);
    canvas.addEventListener('mouseup', endSlash);
    canvas.addEventListener('mouseleave', endSlash); // Stop slashing if mouse leaves canvas

    playAgainBtn.addEventListener('click', startGame);
    claimTokensBtn.addEventListener('click', claimTokens);

    // ---- 9. INITIALIZE ----
    initWeb3().then(() => {
        startGame();
    });

});