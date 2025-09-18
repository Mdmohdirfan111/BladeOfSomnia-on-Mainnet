document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // ---- 1. CONFIGURATION & GLOBAL VARIABLES ----
    // =================================================================

    // --- Blockchain Config ---
    const contractAddress = "0xBd5a6849d328FcAE2e60F6F226B01cf34947C903";
    const contractABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_score","type":"uint256"}],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"GMed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokensClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_player","type":"address"}],"name":"getHighScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"highScores","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
    const somniaNetwork = { chainId: '0x13A7', chainName: 'Somnia Mainnet', nativeCurrency: { name: 'SOMI', symbol: 'SOMI', decimals: 18 }, rpcUrls: ['https://api.infra.mainnet.somnia.network/'], blockExplorerUrls: ['https://explorer.somnia.network'] };
    
    // --- Global Web3 Variables ---
    let provider, signer, contract, userAccount;
    
    // --- Game State Variables ---
    let score = 0, highScore = 0, isGameOver = false, isSlashing = false, gameStartTime;
    let coins = [], bombs = [], slashes = [];

    // --- Game Physics & Config ---
    const gravity = 0.05;
    const initialSpawnRate = 1200;
    const coinTypes = { btc: { color: '#F7931A', radius: 35, score: 50 }, eth: { color: '#627EEA', radius: 35, score: 50 }, ada: { color: '#0033AD', radius: 30, score: 30 }, doge: { color: '#C2A633', radius: 25, score: 20 }, shiba: { color: '#FFC107', radius: 25, score: 20 } };
    const coinKeys = Object.keys(coinTypes);

    // --- DOM Elements ---
    // Lobby
    const lobbyContainer = document.getElementById('lobby-container');
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const gmBtn = document.getElementById('gmBtn');
    const playerAddressEl = document.getElementById('playerAddress');
    const wokeBalanceEl = document.getElementById('wokeBalance');
    const controlsSection = document.getElementById('controls-section');
    const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
    const leaderboardListEl = document.getElementById('leaderboard-list');
    const startGameBtn = document.getElementById('startGameBtn');
    // Game
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


    // =================================================================
    // ---- 2. LOBBY LOGIC (from wallet.js) ----
    // =================================================================

    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') return alert('Please install MetaMask!');

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(somniaNetwork.chainId)) await switchNetwork();
            
            signer = await provider.getSigner();
            userAccount = await signer.getAddress();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            updateUIForConnectedState();
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert('Failed to connect wallet.');
        }
    }

    async function switchNetwork() {
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: somniaNetwork.chainId }] });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [somniaNetwork] });
            }
        }
    }

    async function updateUIForConnectedState() {
        connectWalletBtn.style.display = 'none';
        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        playerAddressEl.textContent = `Player: ${formattedAddress}`;
        playerAddressEl.classList.remove('hidden');
        wokeBalanceEl.classList.remove('hidden');
        controlsSection.classList.remove('hidden');
        
        await updateWokeBalance();
        await fetchLeaderboard();
        await fetchHighScore();
    }
    
    async function updateWokeBalance() {
        if (!contract) return;
        try {
            const balance = await contract.balanceOf(userAccount);
            const formattedBalance = ethers.formatUnits(balance, 18);
            wokeBalanceEl.textContent = `Balance: ${parseFloat(formattedBalance).toFixed(2)} $WOKE`;
        } catch (error) {
            console.error("Could not fetch balance:", error);
        }
    }
    
    async function fetchHighScore() {
        if(!contract) return;
        try {
            const onChainHighScore = await contract.getHighScore(userAccount);
            highScore = Number(onChainHighScore);
            highScoreDisplay.textContent = `High Score: ${highScore}`;
        } catch (error) {
            console.error("Could not fetch high score:", error);
        }
    }

    async function handleGm() {
        if (!contract) return alert("Please connect wallet.");
        gmBtn.disabled = true;
        gmBtn.textContent = 'Sending...';
        try {
            const tx = await contract.gm();
            await tx.wait();
            alert("Success! GM sent on-chain.");
        } catch (error) {
            console.error("GM failed:", error);
        } finally {
            gmBtn.disabled = false;
            gmBtn.textContent = 'GM On-chain';
        }
    }

    function fetchLeaderboard() {
        leaderboardLoadingEl.style.display = 'none';
        leaderboardListEl.innerHTML = `<li>Leaderboard feature is under construction.</li>`;
    }

    // =================================================================
    // ---- 3. GAME LOGIC (from main.js) ----
    // =================================================================

    class FlyingObject {
        constructor(x, y, vx, vy, radius) {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.radius = radius; this.isSliced = false;
        }
        update() {
            this.vy += gravity; this.x += this.vx; this.y += this.vy;
        }
    }

    class Coin extends FlyingObject {
        constructor(x, y, vx, vy, type) {
            const d = coinTypes[type]; super(x, y, vx, vy, d.radius); this.color = d.color; this.score = d.score; this.type = type;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = `bold ${this.radius*0.8}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.type.toUpperCase(), this.x, this.y);
        }
    }

    class Bomb extends FlyingObject {
        constructor(x, y, vx, vy) { super(x, y, vx, vy, 30); this.color = 'black'; }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
        }
    }
    
    function showLobby() {
        lobbyContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        updateWokeBalance(); // Refresh balance when returning to lobby
    }

    function startGame() {
        lobbyContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        score = 0; isGameOver = false; coins = []; bombs = [];
        updateScore();
        
        gameOverModal.classList.add('hidden');
        claimTokensBtn.disabled = false;
        claimStatus.textContent = '';
        
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        [...coins, ...bombs].forEach((item, index) => {
            item.update(); item.draw();
            if (item.y > canvas.height + item.radius) {
                if(item instanceof Coin) coins.splice(index, 1);
                else bombs.splice(bombs.indexOf(item), 1);
            }
        });
        if (isSlashing && slashes.length > 1) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(slashes[0].x, slashes[0].y);
            for (let i = 1; i < slashes.length; i++) ctx.lineTo(slashes[i].x, slashes[i].y);
            ctx.stroke();
        }
        requestAnimationFrame(gameLoop);
    }

    function spawnItem() {
        if (isGameOver) return;
        const x = Math.random() * canvas.width;
        const y = canvas.height + 50;
        const vx = Math.random() * 8 - 4;
        const vy = -(Math.random() * 5 + 10);

        if (Math.random() < 0.2) {
            bombs.push(new Bomb(x, y, vx, vy));
        } else {
            const type = coinKeys[Math.floor(Math.random() * coinKeys.length)];
            coins.push(new Coin(x, y, vx, vy, type));
        }
        const elapsedTime = Date.now() - gameStartTime;
        const nextSpawnTime = Math.max(200, initialSpawnRate - (elapsedTime / 100));
        setTimeout(spawnItem, nextSpawnTime);
    }

    function updateScore() {
        scoreDisplay.textContent = `Score: ${score}`;
        if (score > highScore) highScoreDisplay.textContent = `High Score: ${score}`;
    }
    
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
        coins.forEach((coin, index) => {
            if (!coin.isSliced && Math.hypot(x - coin.x, y - coin.y) < coin.radius) {
                coin.isSliced = true;
                score += coin.score;
                updateScore();
                setTimeout(() => coins.splice(coins.indexOf(coin), 1), 100);
            }
        });
        bombs.forEach(bomb => {
            if (Math.hypot(x - bomb.x, y - bomb.y) < bomb.radius) endGame();
        });
    }

    async function claimTokens() {
        if (score === 0) return claimStatus.textContent = "Score is 0, nothing to claim.";
        if (!contract) return claimStatus.textContent = "Wallet not connected.";
        
        claimTokensBtn.disabled = true;
        claimStatus.textContent = 'Preparing transaction...';
        try {
            const tx = await contract.claimTokens(score);
            claimStatus.textContent = `Claiming... Tx sent.`;
            await tx.wait();
            claimStatus.textContent = `Success! ${score} $WOKE tokens claimed.`;
            updateWokeBalance();
        } catch (error) {
            console.error("Token claim failed:", error);
            claimStatus.textContent = 'Transaction failed.';
            claimTokensBtn.disabled = false;
        }
    }

    // =================================================================
    // ---- 4. EVENT LISTENERS ----
    // =================================================================

    // Lobby
    connectWalletBtn.addEventListener('click', connectWallet);
    gmBtn.addEventListener('click', handleGm);
    startGameBtn.addEventListener('click', startGame);

    // Game
    canvas.addEventListener('mousedown', startSlash);
    canvas.addEventListener('mousemove', moveSlash);
    canvas.addEventListener('mouseup', endSlash);
    canvas.addEventListener('mouseleave', endSlash);
    
    // Modal
    playAgainBtn.addEventListener('click', startGame);
    claimTokensBtn.addEventListener('click', claimTokens);
    backToLobbyBtn.addEventListener('click', showLobby);
});
