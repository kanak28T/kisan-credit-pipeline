/**
 * Real photographs via Unsplash CDN (licensed for use with attribution).
 * Sources: https://unsplash.com — not AI-generated.
 */
export const IMAGES = {
  heroFarm:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1800&q=80",
  farmerField:
    "https://images.unsplash.com/photo-1574943325803-72727bbf0890?auto=format&fit=crop&w=1200&q=80",
  farmerPortrait:
    "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=900&q=80",
  greenCrops:
    "https://images.unsplash.com/photo-1500382017468-9049fed747be?auto=format&fit=crop&w=1200&q=80",
  ruralLandscape:
    "https://images.unsplash.com/photo-1586771100165-bfe046b220e0?auto=format&fit=crop&w=1200&q=80",
  handsSoil:
    "https://images.unsplash.com/photo-1464226184556-4ce0891c5f72?auto=format&fit=crop&w=1200&q=80",
  buyerForest:
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
  sunriseFarm:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
} as const;

/** Rotating farm photos for marketplace cards */
export const FARM_CARD_IMAGES = [
  IMAGES.greenCrops,
  IMAGES.farmerField,
  IMAGES.ruralLandscape,
  IMAGES.handsSoil,
  IMAGES.sunriseFarm,
  IMAGES.heroFarm,
];

export function farmImageForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % FARM_CARD_IMAGES.length;
  return FARM_CARD_IMAGES[hash]!;
}
