import axios from "axios";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "";
const DECENTRO_KEY = import.meta.env.VITE_DECENTRO_API_KEY || "";
const DECENTRO_BASE_URL = import.meta.env.VITE_DECENTRO_BASE_URL || "https://in.decentro.tech";

export async function triggerN8NWebhook(farmerId: string, farmerData: unknown) {
  if (!N8N_URL) return { skipped: true };
  const res = await axios.post(N8N_URL, { farmerId, farmerData }, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });
  return res.data;
}

export async function generateDecentroPayment(
  amount: number,
  buyerName: string,
  tokenId: string,
) {
  if (!DECENTRO_KEY) {
    throw new Error("Payment service is not configured. Please contact support.");
  }
  const res = await axios.post(
    `${DECENTRO_BASE_URL}/v2/payments/upi/link`,
    { amount, buyer_name: buyerName, reference_id: tokenId },
    {
      headers: {
        "Content-Type": "application/json",
        "client_id": DECENTRO_KEY,
      },
      timeout: 15000,
    },
  );
  return res.data;
}

export async function getPolygonscanTx(hash: string) {
  const res = await axios.get(
    `https://api.polygonscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${hash}`,
    { timeout: 10000 },
  );
  return res.data;
}
