import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.7.0/dist/ethers.esm.min.js';

// Blockchain and Contract Configuration
const contractAddress = "0xBd5a6849d328FcAE2e60F6F226B01cf34947C903";
const contractABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_score","type":"uint256"}],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"GMed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokensClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_player","type":"address"}],"name":"getHighScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"highScores","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"getTopScores","outputs":[{"components":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"score","type":"uint256"}],"internalType":"struct BladeOfSomnia.PlayerScore[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"}];
const somniaNetwork = { chainId: '0x13A7', chainName: 'Somnia Mainnet', nativeCurrency: { name: 'SOMI', symbol: 'SOMI', decimals: 18 }, rpcUrls: ['https://api.infra.mainnet.somnia.network/'], blockExplorerUrls: ['https://explorer.somnia.network'] };

// Global Web3 Variables that we will share with script.js
export let provider, signer, contract, userAccount;

async function switchNetwork() {
    try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: somniaNetwork.chainId }] });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [somniaNetwork],
                });
            } catch (addError) {
                console.error("Failed to add Somnia network:", addError);
            }
        }
    }
}

export async function connectWallet(onConnectedCallback) {
    console.log("Attempting to connect wallet...");
    if (typeof window.ethereum === 'undefined') {
        console.log("MetaMask not detected");
        return alert('Please install MetaMask to play!');
    }
    try {
        console.log("Requesting accounts...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(somniaNetwork.chainId)) {
            console.log("Switching network to Somnia Mainnet...");
            await switchNetwork();
        }
        signer = await provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Wallet connected successfully");
        onConnectedCallback();
    } catch (error) {
        console.error("Connection error:", error);
        alert('Failed to connect wallet. Please check the console for details.');
    }
}

export async function disconnectWallet() {
    if (!provider || !userAccount) {
        return alert('No wallet is currently connected.');
    }
    try {
        // Clear global variables
        provider = null;
        signer = null;
        contract = null;
        userAccount = null;
        console.log("Wallet disconnected successfully");
        // Notify user
        alert('Wallet disconnected successfully.');
    } catch (error) {
        console.error("Error disconnecting wallet:", error);
        alert('Failed to disconnect wallet. Please check the console for details.');
    }
}

export async function updateWokeBalance(wokeBalanceEl) {
    if (!contract || !userAccount) {
        wokeBalanceEl.textContent = "Balance: Not Connected";
        return;
    }
    try {
        const balance = await contract.balanceOf(userAccount);
        const formattedBalance = ethers.formatUnits(balance, 18);
        wokeBalanceEl.textContent = `Balance: ${parseFloat(formattedBalance).toFixed(2)} $WOKE`;
    } catch (error) {
        console.error("Could not fetch balance:", error);
        wokeBalanceEl.textContent = "Balance: Error";
    }
}

export async function getOnChainHighScore() {
    if (!contract || !userAccount) return 0;
    try {
        const onChainHighScore = await contract.getHighScore(userAccount);
        return Number(onChainHighScore);
    } catch (error) {
        console.error("Could not fetch high score:", error);
        return 0;
    }
}

export async function handleGm(gmBtn) {
    if (!contract) {
        return alert("Please connect your wallet first.");
    }
    gmBtn.disabled = true;
    gmBtn.textContent = 'Sending...';
    try {
        const tx = await contract.gm();
        await tx.wait();
        alert("Success! GM sent on-chain.");
    } catch (error) {
        console.error("GM transaction failed:", error);
        alert("GM transaction failed.");
    } finally {
        gmBtn.disabled = false;
        gmBtn.textContent = 'GM On-chain';
    }
}
