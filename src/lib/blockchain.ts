import { ethers } from "ethers";

// ── Contract config ──────────────────────────────────────────────────────────
const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? "0xd9145CCE52D386f254917e481eB44e9943F39138";

const ABI = [
  "function mintToken(address farmer, string farmerId, string gpsLat, string gpsLon, string ndviScore, string co2Tonnes, uint256 amount) public",
  "function burnToken(uint256 tokenId) public",
  "function getTokenDetails(uint256 tokenId) public view returns (tuple(string farmerId, string gpsLat, string gpsLon, string ndviScore, string co2Tonnes, bool burned))",
  "function tokenCounter() public view returns (uint256)",
];

// Polygon Amoy testnet
const POLYGON_AMOY = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

// ── 1. connectWallet ─────────────────────────────────────────────────────────
export async function connectWallet(): Promise<{
  signer: ethers.Signer;
  address: string;
  provider: ethers.BrowserProvider;
}> {
  console.log("[blockchain] connectWallet: starting...");

  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request account access
  console.log("[blockchain] connectWallet: requesting accounts...");
  await provider.send("eth_requestAccounts", []);

  // Check current network
  const network = await provider.getNetwork();
  console.log("[blockchain] connectWallet: current chainId =", network.chainId.toString());

  // Switch to Polygon Amoy if needed
  if (network.chainId !== 80002n) {
    console.log("[blockchain] connectWallet: switching to Polygon Amoy (80002)...");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added yet — add it
      if (switchError.code === 4902) {
        console.log("[blockchain] connectWallet: Amoy not found, adding network...");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY],
        });
      } else {
        throw switchError;
      }
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  console.log("[blockchain] connectWallet: connected wallet =", address);

  return { signer, address, provider };
}

// ── 2. mintToken ─────────────────────────────────────────────────────────────
export async function mintToken(
  farmerId: string,
  gpsLat: string,
  gpsLon: string,
  ndviScore: string,
  co2Tonnes: string,
  farmerAddress: string,
  amount: number,
): Promise<{ txHash: string; tokenId: string }> {
  console.log("[blockchain] mintToken: starting for farmer =", farmerId);

  const { signer } = await connectWallet();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  console.log("[blockchain] mintToken: calling contract.mintToken...");
  console.log("[blockchain] mintToken: params =", {
    farmerAddress,
    farmerId,
    gpsLat,
    gpsLon,
    ndviScore,
    co2Tonnes,
    amount,
  });

  const tx = await contract.mintToken(
    farmerAddress,
    farmerId,
    gpsLat,
    gpsLon,
    ndviScore,
    co2Tonnes,
    BigInt(amount),
  );

  console.log("[blockchain] mintToken: transaction sent, hash =", tx.hash);
  console.log("[blockchain] mintToken: waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("[blockchain] mintToken: confirmed in block =", receipt.blockNumber);

  // Read tokenCounter to get the latest tokenId (counter increments after mint)
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const counter = await readContract.tokenCounter();
  const tokenId = (counter - 1n).toString();

  console.log("[blockchain] mintToken: tokenId =", tokenId);

  return { txHash: tx.hash, tokenId };
}

// ── 3. burnToken ─────────────────────────────────────────────────────────────
export async function burnToken(tokenId: string): Promise<{ txHash: string }> {
  console.log("[blockchain] burnToken: starting for tokenId =", tokenId);

  const { signer } = await connectWallet();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  console.log("[blockchain] burnToken: calling contract.burnToken...");
  const tx = await contract.burnToken(BigInt(tokenId));

  console.log("[blockchain] burnToken: transaction sent, hash =", tx.hash);
  console.log("[blockchain] burnToken: waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("[blockchain] burnToken: confirmed in block =", receipt.blockNumber);

  return { txHash: tx.hash };
}

// ── 4. getTokenDetails ───────────────────────────────────────────────────────
export async function getTokenDetails(tokenId: string): Promise<{
  farmerId: string;
  gpsLat: string;
  gpsLon: string;
  ndviScore: string;
  co2Tonnes: string;
  burned: boolean;
}> {
  console.log("[blockchain] getTokenDetails: fetching tokenId =", tokenId);

  // Use a read-only provider — no wallet needed for view functions
  let provider: ethers.Provider;

  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    provider = new ethers.JsonRpcProvider(POLYGON_AMOY.rpcUrls[0]);
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log("[blockchain] getTokenDetails: calling contract.getTokenDetails...");
  const result = await contract.getTokenDetails(BigInt(tokenId));

  const details = {
    farmerId: result.farmerId,
    gpsLat: result.gpsLat,
    gpsLon: result.gpsLon,
    ndviScore: result.ndviScore,
    co2Tonnes: result.co2Tonnes,
    burned: result.burned,
  };

  console.log("[blockchain] getTokenDetails: result =", details);
  return details;
}
