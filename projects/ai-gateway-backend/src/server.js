// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { ethers } from "ethers";

async function assertVaultReady() {
  const [net, code] = await Promise.all([
    provider.getNetwork(),
    provider.getCode(VAULT_ADDRESS),
  ]);
  if (!code || code === "0x") {
    throw new Error(
      `No contract code at ${VAULT_ADDRESS} on chain ${Number(
        net.chainId
      )}. Check RPC_URL/VAULT_ADDRESS.`
    );
  }
  // Light ABI probe: if this throws, your ABI/address doesn’t match the deployed contract
  try {
    await vault.isBackend(signer.address);
  } catch {
    throw new Error(
      `ABI mismatch at ${VAULT_ADDRESS}: isBackend() call failed. Ensure ABI matches deployed contract.`
    );
  }
  return Number(net.chainId);
}

async function safeBalanceOf(addr) {
  try {
    return await vault.balanceOf(addr);
  } catch {
    throw new Error(
      `Failed: balanceOf(${addr}). ABI/address mismatch or no code at VAULT_ADDRESS.`
    );
  }
}

/* -------------------- ENV -------------------- */
const {
  // Server
  PORT = 8787,
  CORS_ORIGIN = "http://localhost:3000",

  // OpenAI / OpenChat
  OPENAI_API_KEY,
  OPENAI_MODEL = "gpt-4o-mini", // or your OpenChat model via OpenRouter
  OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions", // change if using OpenRouter

  // Gemini
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-1.5-flash", // fast & cheap
  GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta",

  // Billing (contract)
  RPC_URL = "https://testnet-rpc.monad.xyz",
  CHAIN_ID = "10143",
  VAULT_ADDRESS,
  BACKEND_PRIVATE_KEY,

  // Optional default price per request (MON)
  DEFAULT_PRICE_MON = "0.1",
} = process.env;

/* ----------------- HARD CHECKS ---------------- */
if (!RPC_URL || !VAULT_ADDRESS || !BACKEND_PRIVATE_KEY) {
  console.error(
    "[FATAL] Missing VAULT configs: RPC_URL / VAULT_ADDRESS / BACKEND_PRIVATE_KEY"
  );
  process.exit(1);
}
if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
  console.warn(
    "[WARN] No AI keys set. /chat endpoints will fail until keys are added."
  );
}

/* ---------------- ETHERS (v6) ----------------- */
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
const VAULT_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_treasury",
        type: "address",
        internalType: "address payable",
      },
      { name: "_owner", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "fallback", stateMutability: "payable" },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "adminBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "chargeToAdmin",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "requestId", type: "bytes32", internalType: "bytes32" },
      { name: "memo", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "isBackend",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setBackend",
    inputs: [
      { name: "_backend", type: "address", internalType: "address" },
      { name: "_enabled", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setOwner",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setTreasury",
    inputs: [
      {
        name: "_treasury",
        type: "address",
        internalType: "address payable",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "treasury",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address payable" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawAdmin",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AdminWithdraw",
    inputs: [
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BackendSet",
    inputs: [
      {
        name: "backend",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "enabled",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ChargeToAdmin",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "userNewBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "adminNewBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "requestId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "memo",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnerChanged",
    inputs: [
      {
        name: "oldOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TreasuryChanged",
    inputs: [
      {
        name: "oldTreasury",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newTreasury",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "NotAuthorized", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
];
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

/* ------------------ EXPRESS ------------------- */
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const allow = [
        CORS_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter(Boolean);
      return allow.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS: ${origin} not allowed`));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
  })
);
app.options("*", cors());

/* --------------- HELPERS/LOGGING -------------- */
function logErr(tag, err) {
  console.error(tag, {
    message: err?.message,
    code: err?.code,
    shortMessage: err?.shortMessage,
    reason: err?.reason,
    info: err?.info,
    data: err?.data,
  });
}
const toBytes32 = (s) => ethers.id(String(s));

// --- TEST ROUTES ---

// Quick test OpenAI with GET ?q=hello
app.get("/test/openai", async (req, res) => {
  try {
    const q = req.query.q || "Say hello in one sentence";
    const r = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: String(q) }],
      }),
    });
    const text = await r.text();
    res.type("json").send(text);
  } catch (err) {
    logErr("[TEST /openai]", err);
    res.status(500).json({ error: err.message });
  }
});

// Quick test Gemini Flash with GET ?q=hello
app.get("/test/gemini", async (req, res) => {
  try {
    const q = req.query.q || "Say hello in one sentence";
    const r = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: String(q) }] }],
        }),
      }
    );
    const text = await r.text();
    res.type("json").send(text);
  } catch (err) {
    logErr("[TEST /gemini]", err);
    res.status(500).json({ error: err.message });
  }
});

// Quick test billing: check user balance
app.get("/test/balance/:user", async (req, res) => {
  try {
    await assertVaultReady(); // <—
    const user = req.params.user;
    if (!ethers.isAddress(user))
      return res.status(400).json({ error: "Invalid address" });
    const [bal, adminBal] = await Promise.all([
      safeBalanceOf(user), // <—
      vault.adminBalance(),
    ]);
    res.json({
      user,
      userBalance: ethers.formatEther(bal),
      adminBalance: ethers.formatEther(adminBal),
    });
  } catch (err) {
    logErr("[TEST /balance]", err);
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- AI ---------------------- */
// POST /chat/openai  { messages, temperature?, model? }
app.post("/chat/openai", async (req, res) => {
  try {
    if (!OPENAI_API_KEY)
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    const { messages, temperature, model } = req.body || {};
    const r = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || OPENAI_MODEL,
        messages,
        temperature: temperature ?? 0.7,
      }),
    });
    const text = await r.text();
    if (!r.ok) {
      console.error("[OpenAI API Error]", r.status, r.statusText, text);
      return res.status(r.status).type("json").send(text);
    }
    res.type("json").send(text); // raw passthrough
  } catch (err) {
    logErr("[Backend Error] /chat/openai", err);
    res.status(500).json({ error: err?.message || "openai_error" });
  }
});

// POST /chat/gemini  { messages, temperature? }
app.post("/chat/gemini", async (req, res) => {
  try {
    if (!GEMINI_API_KEY)
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    const { messages, temperature } = req.body || {};
    // convert OpenAI-style to Gemini "contents"
    const contents = [
      {
        parts: (messages || []).map((m) => ({ text: m.content })),
      },
    ];
    const r = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: temperature ?? 0.7 },
        }),
      }
    );
    const text = await r.text();
    if (!r.ok) {
      console.error("[Gemini API Error]", r.status, r.statusText, text);
      return res.status(r.status).type("json").send(text);
    }
    res.type("json").send(text); // raw passthrough
  } catch (err) {
    logErr("[Backend Error] /chat/gemini", err);
    res.status(500).json({ error: err?.message || "gemini_error" });
  }
});

// Quick test: deduct from user balance manually
app.get("/test/deduct/:user/:amount", async (req, res) => {
  try {
    await assertVaultReady(); // make sure contract exists & ABI matches

    const user = req.params.user;
    const amountMon = req.params.amount;

    if (!ethers.isAddress(user)) {
      return res.status(400).json({ ok: false, error: "Invalid user address" });
    }

    const amountWei = ethers.parseEther(String(amountMon));

    // check balance
    const credit = await safeBalanceOf(user);
    if (credit < amountWei) {
      return res.status(400).json({
        ok: false,
        error: "Insufficient credit",
        credit: ethers.formatEther(credit),
        requested: amountMon,
      });
    }

    // perform deduction
    const tx = await vault.chargeToAdmin(
      user,
      amountWei,
      toBytes32("test-deduct-" + Date.now()),
      "manual test deduct"
    );
    console.log("[TEST DEDUCT] tx sent", tx.hash);
    const rcpt = await tx.wait();
    const adminAfter = await vault.adminBalance();

    res.json({
      ok: true,
      user,
      deducted: amountMon,
      txHash: tx.hash,
      blockNumber: rcpt.blockNumber,
      adminBalance: ethers.formatEther(adminAfter),
    });
  } catch (err) {
    logErr("[TEST /deduct]", err);
    res.status(400).json({ ok: false, error: err.message });
  }
});

/* --------- CHAT + BILL IN ONE CALL ----------- */
/**
 * POST /chat-and-bill
 * {
 *   provider: "gemini" | "openai",      // which AI route to use
 *   messages: [...],
 *   temperature?: number,
 *   user: "0x...",                      // wallet to deduct from
 *   priceMon?: "0.01",                  // override price (default DEFAULT_PRICE_MON)
 *   memo?: "free text",
 *   requestId?: "id-123"
 * }
 */
app.post("/chat-and-bill", async (req, res) => {
  const started = Date.now();
  try {
    const {
      provider: prov = "gemini",
      messages = [],
      temperature,
      user,
      priceMon = DEFAULT_PRICE_MON,
      memo = "",
      requestId = cryptoRandom(),
    } = req.body || {};

    if (!ethers.isAddress(user)) {
      return res.status(400).json({ ok: false, error: "Invalid user address" });
    }

    // 1) Call the AI first
    let aiRespText,
      aiOk = false;
    if (prov === "gemini") {
      if (!GEMINI_API_KEY)
        return res
          .status(500)
          .json({ ok: false, error: "GEMINI_API_KEY missing" });
      const contents = [{ parts: messages.map((m) => ({ text: m.content })) }];
      const r = await fetch(
        `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: temperature ?? 0.7 },
          }),
        }
      );
      aiRespText = await r.text();
      aiOk = r.ok;
      if (!aiOk) {
        console.error("[Gemini API Error]", r.status, r.statusText, aiRespText);
        return res.status(r.status).type("json").send(aiRespText);
      }
    } else {
      if (!OPENAI_API_KEY)
        return res
          .status(500)
          .json({ ok: false, error: "OPENAI_API_KEY missing" });
      const r = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature: temperature ?? 0.7,
        }),
      });
      aiRespText = await r.text();
      aiOk = r.ok;
      if (!aiOk) {
        console.error("[OpenAI API Error]", r.status, r.statusText, aiRespText);
        return res.status(r.status).type("json").send(aiRespText);
      }
    }

    // 2) Bill on-chain (deduct MON credit)
    const amountWei = ethers.parseEther(String(priceMon));
    const credit = await vault.balanceOf(user);
    if (credit < amountWei) {
      return res.status(400).json({
        ok: false,
        error: "Insufficient credit",
        credit: ethers.formatEther(credit),
      });
    }

    const tx = await vault.chargeToAdmin(
      user,
      amountWei,
      toBytes32(requestId),
      `${prov}:${memo}`
    );
    const rcpt = await tx.wait();
    const adminAfter = await vault.adminBalance();

    return res.json({
      ok: true,
      provider: prov,
      latencyMs: Date.now() - started,
      ai: JSON.parse(aiRespText),
      billing: {
        txHash: tx.hash,
        blockNumber: rcpt.blockNumber,
        adminBalance: ethers.formatEther(adminAfter),
      },
    });
  } catch (err) {
    logErr("[CHAT&BILL ERROR]", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "chat_and_bill_error" });
  }
});

function cryptoRandom() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "req-" + Math.random().toString(36).slice(2);
}

/* ------------------- BILLING ------------------ */
// POST /bill  { user, amountMon, requestId?, memo? }
app.post("/bill", async (req, res) => {
  try {
    await assertVaultReady(); // <—
    const { user, amountMon, requestId, memo } = req.body || {};
    if (!ethers.isAddress(user))
      return res.status(400).json({ ok: false, error: "Invalid user address" });
    const amountWei = ethers.parseEther(String(amountMon));
    const credit = await safeBalanceOf(user); // <—
    if (credit < amountWei) {
      return res.status(400).json({
        ok: false,
        error: "Insufficient credit",
        credit: ethers.formatEther(credit),
      });
    }
    const tx = await vault.chargeToAdmin(
      user,
      amountWei,
      toBytes32(requestId || Date.now()),
      memo || ""
    );
    const rcpt = await tx.wait();
    const adminAfter = await vault.adminBalance();
    res.json({
      ok: true,
      txHash: tx.hash,
      blockNumber: rcpt.blockNumber,
      adminBalance: ethers.formatEther(adminAfter),
    });
  } catch (err) {
    logErr("[BILL ERROR]", err);
    res.status(400).json({ ok: false, error: err?.message || "bill_error" });
  }
});

/* --------------- DIAGNOSTICS ------------------ */
app.get("/preflight", async (req, res) => {
  try {
    const user = req.query.user;
    const [net, code, isB, ownerAddr, userBal, adminBal, gasBal] =
      await Promise.all([
        provider.getNetwork(),
        provider.getCode(VAULT_ADDRESS),
        vault.isBackend(signer.address),
        vault.owner(),
        ethers.isAddress(user) ? vault.balanceOf(user) : 0n,
        vault.adminBalance(),
        provider.getBalance(signer.address),
      ]);
    res.json({
      ok: true,
      network: Number(net.chainId),
      expectedChainId: Number(CHAIN_ID),
      contractCodePresent: code && code !== "0x",
      vault: VAULT_ADDRESS,
      owner: ownerAddr,
      backend: signer.address,
      backendWhitelisted: isB,
      backendGasBalance: ethers.formatEther(gasBal),
      userQueried: ethers.isAddress(user) ? user : null,
      userCreditWei: ethers.isAddress(user) ? userBal.toString() : null,
      adminBalanceWei: adminBal.toString(),
    });
  } catch (err) {
    logErr("[PREFLIGHT ERROR]", err);
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.get("/health", async (_req, res) => {
  try {
    const net = await provider.getNetwork();
    res.json({
      ok: true,
      chainIdReported: Number(net.chainId),
      expectedChainId: Number(CHAIN_ID),
      vault: VAULT_ADDRESS,
      backend: signer.address,
    });
  } catch (err) {
    logErr("[HEALTH ERROR]", err);
    res.status(500).json({ ok: false, error: err?.message });
  }
});

/* ------------------- START -------------------- */
app.listen(Number(PORT), () => {
  console.log(`AI + Billing backend on http://localhost:${PORT}`);
  console.log(`Vault: ${VAULT_ADDRESS}`);
  console.log(`Backend signer: ${signer.address}`);
});
