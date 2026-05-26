import { supabase } from "@/integrations/supabase/client";

export type FarmerInput = {
  name: string;
  mobile: string;
  taluka: string;
  village: string;
  gat_number: string;
  latitude: number;
  longitude: number;
  farm_area_acres: number;
};

export async function insertFarmer(farmer: FarmerInput) {
  const { data, error } = await supabase
    .from("farmers")
    .insert([{ ...farmer, token_status: "pending" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllFarmers() {
  const { data, error } = await supabase
    .from("farmers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateFarmerNDVI(
  farmerId: string,
  ndviScore: number,
  co2Tonnes: number,
  tokenStatus: string,
  polygonscanHash: string | null,
) {
  const { data, error } = await supabase
    .from("farmers")
    .update({
      ndvi_score: ndviScore,
      co2_tonnes: co2Tonnes,
      token_status: tokenStatus,
      polygonscan_hash: polygonscanHash,
    })
    .eq("id", farmerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllTokens() {
  const { data, error } = await supabase
    .from("carbon_tokens")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertToken(token: any) {
  const { data, error } = await supabase
    .from("carbon_tokens")
    .insert([token])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertPurchase(purchase: any) {
  const { data, error } = await supabase
    .from("purchases")
    .insert([purchase])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPurchaseById(purchaseId: string) {
  const { data, error } = await supabase
    .from("purchases")
    .select(
      "*, carbon_tokens:token_id(*), farmers:farmer_id(*)"
    )
    .eq("id", purchaseId)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePurchaseBurnHash(purchaseId: string, burnHash: string) {
  const { data, error } = await supabase
    .from("purchases")
    .update({ burn_hash: burnHash, status: "completed" })
    .eq("id", purchaseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
