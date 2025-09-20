import { ethers } from "ethers";

// --- Configuration ---
// Update these addresses after deployment
const LUCKYBOX_ADDRESS = "0xYourLuckyBox"; // MemeRouletteLuckyBox
const USDT_ADDRESS = "0xYourUSDT"; // USDT (6 decimals) on your network

// --- ABI (minimal) ---
const LUCKYBOX_ABI = [
  "function spin() external",
  "function getTokens() external view returns (address[])",
  "function getPoolSnapshot() external view returns (address[] tokenList, uint256[] perPieceAmounts, uint256 poolTargetSize)",
  "event Spin(address indexed player, address indexed tokenWon, uint256 amountToken, uint256 feeToTeam, uint256 refillBudget)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 value) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const ONE_USDT = 1_000_000n; // 6 decimals

// --- DOM Elements ---
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const approveBtn = document.getElementById("approveBtn") as HTMLButtonElement;
const spinBtn = document.getElementById("spinBtn") as HTMLButtonElement;
const demoSpinBtn = document.getElementById("demoSpinBtn") as HTMLButtonElement;
const accountEl = document.getElementById("account")!;
const statusEl = document.getElementById("status")!;
const allowanceEl = document.getElementById("allowance")!;
const poolEl = document.getElementById("pool")!;

// --- New Table DOM Elements ---
const poolTableEl = document.getElementById("poolTable")!;
const winnersTableEl = document.getElementById("winnersTable")!;
const totalSpinsEl = document.getElementById("totalSpins")!;
const yourSpinsEl = document.getElementById("yourSpins")!;

// --- State ---
let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let account: string | null = null;

let luckyBox: ethers.Contract | null = null;
let usdt: ethers.Contract | null = null;

// --- Spin History State ---
let spinHistory: Array<{
  player: string;
  tokenWon: string;
  amount: bigint;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}> = [];

// --- Dynamic Pool State ---
let currentPool: Array<{
  id: number;
  token: string;
  amount: string;
  usdValue: number;
  addedAt: number;
}> = [];
let nextItemId = 1;

// --- Dummy Data for Demo ---
const dummySpinHistory = [
  {
    player: "0x1234567890abcdef1234567890abcdef12345678",
    tokenWon: "BTC",
    amount: BigInt("2500000"), // 2.5 with 6 decimals
    timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    blockNumber: 12345,
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  },
  {
    player: "0x9876543210fedcba9876543210fedcba98765432",
    tokenWon: "ETH",
    amount: BigInt("1500000"), // 1.5 with 6 decimals
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    blockNumber: 12344,
    txHash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
  },
  {
    player: "0x1111222233334444555566667777888899990000",
    tokenWon: "DOGE",
    amount: BigInt("100000000"), // 100 with 6 decimals
    timestamp: Date.now() - 8 * 60 * 1000, // 8 minutes ago
    blockNumber: 12343,
    txHash: "0x1111222233334444555566667777888899990000111122223333444455556666"
  },
  {
    player: "0x5555666677778888999900001111222233334444",
    tokenWon: "SOL",
    amount: BigInt("5000000"), // 5.0 with 6 decimals
    timestamp: Date.now() - 12 * 60 * 1000, // 12 minutes ago
    blockNumber: 12342,
    txHash: "0x5555666677778888999900001111222233334444555566667777888899990000"
  },
  {
    player: "0x9999000011112222333344445555666677778888",
    tokenWon: "ADA",
    amount: BigInt("3000000"), // 3.0 with 6 decimals
    timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
    blockNumber: 12341,
    txHash: "0x9999000011112222333344445555666677778888999900001111222233334444"
  },
  {
    player: "0x7777888899990000111122223333444455556666",
    tokenWon: "XRP",
    amount: BigInt("8000000"), // 8.0 with 6 decimals
    timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago
    blockNumber: 12340,
    txHash: "0x7777888899990000111122223333444455556666777788889999000011112222"
  },
  {
    player: "0x3333444455556666777788889999000011112222",
    tokenWon: "BNB",
    amount: BigInt("1200000"), // 1.2 with 6 decimals
    timestamp: Date.now() - 25 * 60 * 1000, // 25 minutes ago
    blockNumber: 12339,
    txHash: "0x3333444455556666777788889999000011112222333344445555666677778888"
  },
  {
    player: "0x6666777788889999000011112222333344445555",
    tokenWon: "TRX",
    amount: BigInt("20000000"), // 20 with 6 decimals
    timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    blockNumber: 12338,
    txHash: "0x6666777788889999000011112222333344445555666677778888999900001111"
  }
];

let totalSpins = 0;
let yourSpins = 0;

// --- Utility Functions ---
async function ensure() {
  if (!provider) throw new Error("Connect wallet first");
  if (!signer) throw new Error("No signer");
}

function status(msg: string, type: 'info' | 'error' | 'success' = 'info') {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

function showError(msg: string) {
  status(msg, 'error');
}

function showSuccess(msg: string) {
  status(msg, 'success');
}

function format(value: bigint, decimals: number): string {
  const denom = 10n ** BigInt(decimals);
  const whole = value / denom;
  const frac = value % denom;
  const s = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return s.length ? `${whole}.${s}` : whole.toString();
}

function formatUSDT(value: bigint): string { 
  return format(value, 6); 
}

// --- Cache for token metadata ---
const symbolCache = new Map<string, string>();
const decimalsCache = new Map<string, number>();

async function symbolOf(addr: string): Promise<string> {
  if (symbolCache.has(addr)) return symbolCache.get(addr)!;
  const c = new ethers.Contract(addr, ERC20_ABI, provider!);
  let s = "TOKEN";
  try { 
    s = await c.symbol(); 
  } catch (e) {
    console.warn(`Failed to get symbol for ${addr}:`, e);
  }
  symbolCache.set(addr, s);
  return s;
}

async function decimalsOf(addr: string): Promise<number> {
  if (decimalsCache.has(addr)) return decimalsCache.get(addr)!;
  const c = new ethers.Contract(addr, ERC20_ABI, provider!);
  let d = 18;
  try { 
    d = await c.decimals(); 
  } catch (e) {
    console.warn(`Failed to get decimals for ${addr}:`, e);
  }
  decimalsCache.set(addr, d);
  return d;
}

// --- Main Functions ---
async function connect() {
  if (!(window as any).ethereum) {
    showError("Please install MetaMask or another Web3 wallet");
    return;
  }

  try {
    status("Connecting to wallet...");
    provider = new ethers.BrowserProvider((window as any).ethereum);
    const accs = await provider.send("eth_requestAccounts", []);
    account = ethers.getAddress(accs[0]);
    signer = await provider.getSigner();

    accountEl.textContent = `${account!.slice(0, 6)}...${account!.slice(-4)}`;
    luckyBox = new ethers.Contract(LUCKYBOX_ADDRESS, LUCKYBOX_ABI, signer);
    usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

    connectBtn.textContent = "Connected ✅";

    await refreshAllowance();
    await renderPool();
    loadDummyData(); // Load dummy data for demo
    renderSpinHistory();
    listenSpinEvents();
    
    showSuccess("Wallet connected successfully!");
  } catch (error: any) {
    console.error("Connection failed:", error);
    showError("Failed to connect wallet: " + (error?.message || "Unknown error"));
  }
}

async function refreshAllowance() {
  if (!account || !usdt) return;
  try {
    const allowance: bigint = await usdt.allowance(account, LUCKYBOX_ADDRESS);
    allowanceEl.textContent = `${formatUSDT(allowance)} USDT`;
    
    // Enable/disable buttons based on allowance
    approveBtn.disabled = allowance >= ONE_USDT;
    spinBtn.disabled = allowance < ONE_USDT;
    
    if (allowance >= ONE_USDT) {
      approveBtn.textContent = "Approved ✅";
      spinBtn.disabled = false;
    } else {
      approveBtn.textContent = "Approve 1 USDT";
      spinBtn.disabled = true;
    }
  } catch (error) {
    console.error("Failed to refresh allowance:", error);
    allowanceEl.textContent = "Error";
    spinBtn.disabled = true;
  }
}

async function approve1() {
  await ensure();
  if (!usdt) {
    showError("USDT contract not available");
    return;
  }
  
  try {
    status("Approving 1 USDT...");
    approveBtn.disabled = true;
    approveBtn.innerHTML = '<div class="loading"></div> Approving...';
    
    const tx = await usdt.approve(LUCKYBOX_ADDRESS, ONE_USDT);
    await tx.wait();
    
    await refreshAllowance();
    showSuccess("USDT approved successfully!");
  } catch (error: any) {
    console.error("Approval failed:", error);
    showError("Approval failed: " + (error?.shortMessage || error?.message || "Unknown error"));
  } finally {
    approveBtn.disabled = false;
    approveBtn.innerHTML = "Approve 1 USDT";
  }
}

async function spin() {
  await ensure();
  
  // Check if user has approved USDT
  if (!usdt) {
    showError("USDT contract not available");
    return;
  }
  
  try {
    const allowance: bigint = await usdt.allowance(account!, LUCKYBOX_ADDRESS);
    if (allowance < ONE_USDT) {
      showError("Please approve USDT first!");
      return;
    }
    
    status("Spinning the wheel... 🎰");
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<div class="loading"></div> Spinning...';
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use dummy logic for spin result
    const wonItem = simulateSpin();
    if (!wonItem) {
      showError("Failed to spin!");
      return;
    }
    
    // Add to spin history
    addSpinToHistory(
      account!,
      wonItem.token,
      BigInt(Math.floor(parseFloat(wonItem.amount) * 1000000)), // Convert to 6 decimals
      "0x" + Math.random().toString(16).substr(2, 64), // Random tx hash
      12345 + totalSpins // Incrementing block number
    );
    
    showSuccess(`You won ${wonItem.amount} ${wonItem.token} (~$${wonItem.usdValue})! 🎉`);
    
    // Simulate reducing allowance (in real contract this would happen automatically)
    // For demo purposes, we'll just refresh the display
    await refreshAllowance();
    
  } catch (error: any) {
    console.error("Spin failed:", error);
    showError("Spin failed: " + (error?.shortMessage || error?.message || "Unknown error"));
  } finally {
    spinBtn.disabled = false;
    spinBtn.innerHTML = "🎰 Spin 1 USDT";
  }
}

// Demo spin function for testing LIFO system
function demoSpin() {
  if (currentPool.length === 0) {
    showError("Pool is empty!");
    return;
  }
  
  const wonItem = simulateSpin();
  if (!wonItem) {
    showError("Failed to spin!");
    return;
  }
  
  // Add to spin history
  const demoPlayer = account || "0xDemoPlayer1234567890abcdef1234567890abcdef";
  addSpinToHistory(
    demoPlayer,
    wonItem.token,
    BigInt(Math.floor(parseFloat(wonItem.amount) * 1000000)), // Convert to 6 decimals
    "0x" + Math.random().toString(16).substr(2, 64), // Random tx hash
    12345 + totalSpins // Incrementing block number
  );
  
  showSuccess(`You won ${wonItem.amount} ${wonItem.token} (~$${wonItem.usdValue})! 🎉`);
}

async function renderPool() {
  try {
    // Check if contracts are available
    if (!luckyBox) {
      console.log("Contract not available, using dummy data");
      renderDummyPoolTable();
      return;
    }

    const snap = await luckyBox.getPoolSnapshot();
    const tokens: string[] = snap[0];
    const perPiece: bigint[] = snap[1];
    
    // Render legacy pool (hidden by default)
    poolEl.innerHTML = "";
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const sym = await symbolOf(t);
      const dec = await decimalsOf(t);
      const amt = format(perPiece[i], dec);
      
      const card = document.createElement("div");
      card.className = "card token-card";
      card.innerHTML = `
        <h4>${sym}</h4>
        <div class="mono" style="margin-bottom: 8px; font-size: 0.8em;">${t.slice(0, 6)}...${t.slice(-4)}</div>
        <div style="margin-bottom: 4px;">Per piece: <strong>${amt} ${sym}</strong></div>
        <div>Available: <strong>10 pieces</strong></div>
      `;
      poolEl.appendChild(card);
    }

    // Render new table format
    await renderPoolTable(tokens, perPiece);
  } catch (error) {
    console.error("Failed to render pool:", error);
    poolEl.innerHTML = '<div class="error">Failed to load pool information</div>';
    // Fallback to dummy data
    renderDummyPoolTable();
  }
}

async function renderPoolTable(tokens: string[], perPiece: bigint[]) {
  try {
    poolTableEl.innerHTML = "";
    
    for (let i = 0; i < tokens.length; i++) {
      const tokenAddress = tokens[i];
      const sym = await symbolOf(tokenAddress);
      const dec = await decimalsOf(tokenAddress);
      const amt = format(perPiece[i], dec);
      
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <div class="col-icon">
          <div class="token-icon">${sym.slice(0, 2)}</div>
        </div>
        <div class="col-name">${sym}</div>
        <div class="col-amount">${amt}</div>
      `;
      
      poolTableEl.appendChild(row);
    }
  } catch (error) {
    console.error("Failed to render pool table:", error);
    // Fallback to dummy data if contract fails
    renderDummyPoolTable();
  }
}

function renderDummyPoolTable() {
  // Initialize pool with 10 items if empty
  if (currentPool.length === 0) {
    initializePool();
  }
  
  renderLIFOPoolTable();
}

function initializePool() {
  const tokenTypes = [
    { symbol: "BTC", amount: "0.0025", usdValue: 150 },
    { symbol: "ETH", amount: "0.0015", usdValue: 120 },
    { symbol: "XRP", amount: "8.0000", usdValue: 100 },
    { symbol: "BNB", amount: "0.0012", usdValue: 80 },
    { symbol: "SOL", amount: "0.0050", usdValue: 90 },
    { symbol: "DOGE", amount: "100.0000", usdValue: 70 },
    { symbol: "ADA", amount: "3.0000", usdValue: 60 },
    { symbol: "TRX", amount: "20.0000", usdValue: 50 },
    { symbol: "HYPE", amount: "50.0000", usdValue: 40 },
    { symbol: "LINK", amount: "0.0080", usdValue: 110 }
  ];

  currentPool = [];
  nextItemId = 1;
  
  // Add 100 items to the pool (10 of each token type)
  for (let i = 0; i < 100; i++) {
    const tokenType = tokenTypes[i % tokenTypes.length];
    addItemToPool(tokenType.symbol, tokenType.amount, tokenType.usdValue);
  }
}

function addItemToPool(token: string, amount: string, usdValue: number) {
  const newItem = {
    id: nextItemId++,
    token,
    amount,
    usdValue,
    addedAt: Date.now()
  };
  
  currentPool.push(newItem);
  console.log(`Added item ${newItem.id}: ${token} ${amount} (~$${usdValue})`);
}

function removeItemFromPool(): { token: string; amount: string; usdValue: number } | null {
  if (currentPool.length === 0) return null;
  
  // Randomly select an item from the pool to remove
  const randomIndex = Math.floor(Math.random() * currentPool.length);
  const removedItem = currentPool.splice(randomIndex, 1)[0];
  console.log(`Removed item ${removedItem.id}: ${removedItem.token} ${removedItem.amount} (~$${removedItem.usdValue})`);
  
  return {
    token: removedItem.token,
    amount: removedItem.amount,
    usdValue: removedItem.usdValue
  };
}

function renderLIFOPoolTable() {
  poolTableEl.innerHTML = "";
  
  // Sort by ID to show items in order, but only show first 20 items for display
  const sortedPool = [...currentPool].sort((a, b) => a.id - b.id);
  const displayItems = sortedPool.slice(0, 20);
  
  for (const item of displayItems) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <div class="col-icon">
        <div class="token-icon">${item.token.slice(0, 2)}</div>
      </div>
      <div class="col-name">${item.token}</div>
      <div class="col-amount">${item.amount}</div>
    `;
    
    poolTableEl.appendChild(row);
  }
  
  // Show "and X more..." if there are more items
  if (currentPool.length > 20) {
    const moreRow = document.createElement("div");
    moreRow.className = "table-row";
    moreRow.style.fontStyle = "italic";
    moreRow.style.color = "#6b7280";
    moreRow.innerHTML = `
      <div class="col-icon"></div>
      <div class="col-name">... and ${currentPool.length - 20} more items</div>
      <div class="col-amount"></div>
    `;
    poolTableEl.appendChild(moreRow);
  }
  
  // Update pool stats
  updatePoolStats();
}

function updatePoolStats() {
  const totalItemsEl = document.getElementById('totalPoolItems');
  const totalValueEl = document.getElementById('totalPoolValue');
  
  if (totalItemsEl) {
    totalItemsEl.textContent = `${currentPool.length} Items`;
  }
  
  if (totalValueEl) {
    const totalValue = currentPool.reduce((sum, item) => sum + item.usdValue, 0);
    totalValueEl.textContent = `~$${totalValue.toLocaleString()} USD`;
  }
}

function loadDummyData() {
  // Load dummy spin history
  spinHistory = [...dummySpinHistory];
  totalSpins = dummySpinHistory.length;
  
  // Count "your" spins (simulate some are from current user)
  if (account) {
    yourSpins = Math.floor(Math.random() * 3); // 0-2 dummy spins for current user
  } else {
    yourSpins = 0;
  }
}

function renderSpinHistory() {
  try {
    winnersTableEl.innerHTML = "";
    
    // Update header stats
    totalSpinsEl.textContent = `${totalSpins} Spins`;
    yourSpinsEl.textContent = `${yourSpins} Yours`;

    if (spinHistory.length === 0) {
      winnersTableEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎰</div>
          <div class="empty-state-text">No spins yet</div>
          <div class="empty-state-subtext">Be the first to spin!</div>
        </div>
      `;
      return;
    }

    // Sort by timestamp (newest first)
    const sortedHistory = [...spinHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    for (let i = 0; i < Math.min(sortedHistory.length, 20); i++) { // Show last 20 spins
      const spin = sortedHistory[i];
      const isRecent = Date.now() - spin.timestamp < 5 * 60 * 1000; // Last 5 minutes
      const isYourSpin = account && ethers.getAddress(spin.player) === ethers.getAddress(account);
      
      const row = document.createElement("div");
      row.className = `table-row ${isRecent ? 'recent' : ''} ${isYourSpin ? 'winner' : ''}`;
      
      const timeStr = new Date(spin.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      row.innerHTML = `
        <div class="col-time">${timeStr}</div>
        <div class="col-address address">${spin.player.slice(0, 6)}...${spin.player.slice(-4)}</div>
        <div class="col-reward">${spin.tokenWon}</div>
        <div class="col-amount">${format(spin.amount, 6)}</div>
        <div class="col-tx">
          <a href="#" class="tx-link" onclick="window.open('https://testnet.monad.xyz/tx/${spin.txHash}', '_blank')">
            ${spin.txHash.slice(0, 6)}...
          </a>
        </div>
      `;
      
      winnersTableEl.appendChild(row);
    }
  } catch (error) {
    console.error("Failed to render spin history:", error);
    winnersTableEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">Failed to load history</div></div>';
  }
}

function simulateSpin() {
  if (currentPool.length === 0) {
    console.log("Pool is empty, cannot spin");
    return null;
  }
  
  // Randomly remove an item from the pool
  const wonItem = removeItemFromPool();
  if (!wonItem) return null;
  
  // Add a completely random new item to the pool
  const newTokenTypes = [
    { symbol: "BTC", amount: "0.0025", usdValue: 150 },
    { symbol: "ETH", amount: "0.0015", usdValue: 120 },
    { symbol: "XRP", amount: "8.0000", usdValue: 100 },
    { symbol: "BNB", amount: "0.0012", usdValue: 80 },
    { symbol: "SOL", amount: "0.0050", usdValue: 90 },
    { symbol: "DOGE", amount: "100.0000", usdValue: 70 },
    { symbol: "ADA", amount: "3.0000", usdValue: 60 },
    { symbol: "TRX", amount: "20.0000", usdValue: 50 },
    { symbol: "HYPE", amount: "50.0000", usdValue: 40 },
    { symbol: "LINK", amount: "0.0080", usdValue: 110 }
  ];
  
  // Randomly select any token to add back
  const randomIndex = Math.floor(Math.random() * newTokenTypes.length);
  const newToken = newTokenTypes[randomIndex];
  
  addItemToPool(newToken.symbol, newToken.amount, newToken.usdValue);
  
  // Re-render the pool table
  renderLIFOPoolTable();
  
  return wonItem;
}

function addSpinToHistory(player: string, tokenWon: string, amount: bigint, txHash: string, blockNumber: number) {
  const spinEntry = {
    player,
    tokenWon,
    amount,
    timestamp: Date.now(),
    blockNumber,
    txHash
  };
  
  spinHistory.unshift(spinEntry); // Add to beginning
  totalSpins++;
  
  if (account && ethers.getAddress(player) === ethers.getAddress(account)) {
    yourSpins++;
  }
  
  // Keep only last 100 entries
  if (spinHistory.length > 100) {
    spinHistory = spinHistory.slice(0, 100);
  }
  
  renderSpinHistory();
}

function listenSpinEvents() {
  if (!luckyBox) {
    console.log("Lucky Box contract not available, skipping event listener setup");
    return;
  }
  
  try {
    luckyBox.on("Spin", async (player: string, tokenWon: string, amountToken: bigint, _feeToTeam: bigint, _refillBudget: bigint, event: any) => {
      // Add to spin history for all players (not just current user)
      const sym = await symbolOf(tokenWon);
      addSpinToHistory(
        player,
        sym,
        amountToken,
        event.transactionHash,
        event.blockNumber
      );
      
      // Show notification only for current user
      if (account && ethers.getAddress(player) === ethers.getAddress(account)) {
        const decimals = await decimalsOf(tokenWon);
        showSuccess(`You won ${format(amountToken, decimals)} ${sym} 🎉`);
      }
    });
  } catch (error) {
    console.error("Failed to set up event listener:", error);
  }
}

// --- Event Listeners ---
connectBtn.onclick = connect;
approveBtn.onclick = approve1;
spinBtn.onclick = spin;
demoSpinBtn.onclick = demoSpin;

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  status("Ready to connect wallet");
  
  // Initialize button states
  spinBtn.disabled = true;
  approveBtn.disabled = true;
  
  // Load dummy data immediately for demo purposes
  loadDummyData();
  renderDummyPoolTable();
  renderSpinHistory();
  
  // Check if wallet is already connected
  if ((window as any).ethereum) {
    (window as any).ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          connect();
        } else {
          // Enable connect button if no accounts
          connectBtn.disabled = false;
        }
      })
      .catch((error: any) => {
        console.error("Failed to check existing accounts:", error);
        status("Wallet check failed, but dummy data is loaded");
        connectBtn.disabled = false;
      });
  } else {
    status("No Web3 wallet detected - showing demo data only");
    connectBtn.disabled = false;
  }
});