// Wait for the entire page to load before running the script
document.addEventListener('DOMContentLoaded', () => {

    // ---- 1. CONFIGURATION & CONSTANTS ----
    const contractAddress = "0xBd5a6849d328FcAE2e60F6F226B01cf34947C903";
    const contractABI = [
        {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_score","type":"uint256"}],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"GMed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokensClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_player","type":"address"}],"name":"getHighScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"highScores","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
    ];

    const somniaNetwork = {
        chainId: '0x13A7', // 5031 in hexadecimal
        chainName: 'Somnia Mainnet',
        nativeCurrency: { name: 'SOMI', symbol: 'SOMI', decimals: 18 },
        rpcUrls: ['https://api.infra.mainnet.somnia.network/'],
        blockExplorerUrls: ['https://explorer.somnia.network']
    };

    // Global variables
    let provider;
    let signer;
    let contract;
    let userAccount;

    // ---- 2. DOM ELEMENT REFERENCES ----
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const gmBtn = document.getElementById('gmBtn');
    const playerAddressEl = document.getElementById('playerAddress');
    const wokeBalanceEl = document.getElementById('wokeBalance');
    const controlsSection = document.getElementById('controls-section');
    const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
    const leaderboardListEl = document.getElementById('leaderboard-list');

    // ---- 3. EVENT LISTENERS ----
    connectWalletBtn.addEventListener('click', connectWallet);
    gmBtn.addEventListener('click', handleGm);
    
    // ---- 4. FUNCTIONS ----

    /**
     * Connects to the user's wallet (e.g., MetaMask)
     */
    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to play!');
            return;
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];

            // Setup Ethers.js provider and signer
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();

            // Check if user is on the correct network
            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(somniaNetwork.chainId)) {
                await switchNetwork();
            }

            // Create a contract instance
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Update the UI
            updateUIForConnectedState();

        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert('Failed to connect wallet. See console for details.');
        }
    }

    /**
     * Prompts the user to switch to the Somnia network
     */
    async function switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: somniaNetwork.chainId }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [somniaNetwork],
                    });
                } catch (addError) {
                    console.error("Failed to add Somnia network:", addError);
                    alert("Could not add Somnia network to your wallet.");
                }
            } else {
                console.error("Failed to switch network:", switchError);
                alert("Please switch to the Somnia Mainnet in your wallet.");
            }
        }
    }

    /**
     * Updates the UI after a successful wallet connection
     */
    function updateUIForConnectedState() {
        connectWalletBtn.style.display = 'none'; // Hide connect button
        
        // Show player address (formatted)
        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        playerAddressEl.textContent = `Player: ${formattedAddress}`;
        playerAddressEl.classList.remove('hidden');

        // Show WOKE balance
        wokeBalanceEl.classList.remove('hidden');
        updateWokeBalance();
        
        // Show game controls
        controlsSection.classList.remove('hidden');
        
        // Fetch leaderboard data
        fetchLeaderboard();
    }

    /**
     * Fetches and displays the user's WOKE token balance
     */
    async function updateWokeBalance() {
        try {
            const balance = await contract.balanceOf(userAccount);
            // Format the balance from Wei to a readable number
            const formattedBalance = ethers.formatUnits(balance, 18);
            wokeBalanceEl.textContent = `Balance: ${parseFloat(formattedBalance).toFixed(2)} $WOKE`;
        } catch (error) {
            console.error("Could not fetch balance:", error);
            wokeBalanceEl.textContent = "Balance: Error";
        }
    }

    /**
     * Handles the 'GM On-chain' button click
     */
    async function handleGm() {
        if (!contract) {
            alert("Please connect your wallet first.");
            return;
        }

        gmBtn.disabled = true;
        gmBtn.textContent = 'Sending GM...';

        try {
            const tx = await contract.gm();
            console.log("GM transaction sent:", tx.hash);
            await tx.wait(); // Wait for the transaction to be mined
            console.log("GM transaction confirmed!");
            alert("Success! You've sent a GM on-chain.");
        } catch (error) {
            console.error("GM transaction failed:", error);
            alert("GM transaction failed. See console for details.");
        } finally {
            gmBtn.disabled = false;
            gmBtn.textContent = 'GM On-chain';
        }
    }

    /**
     * Fetches and displays the leaderboard data
     */
    async function fetchLeaderboard() {
        leaderboardLoadingEl.textContent = "Fetching top players...";
        
        // IMPORTANT NOTE: Fetching a sorted leaderboard directly from a smart contract is very
        // inefficient and often impossible. A real-world dApp uses an "indexer" service
        // like The Graph to query events and build a leaderboard off-chain.
        // For now, we will display a placeholder message.
        
        setTimeout(() => { // Simulating a fetch
            leaderboardLoadingEl.style.display = 'none';
            leaderboardListEl.innerHTML = `
                <li>Leaderboard feature is under construction.</li>
                <li>It requires an indexer to work efficiently.</li>
            `;
            // In a real implementation, you would query an indexer API here.
        }, 1500);
    }
});