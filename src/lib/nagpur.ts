/** Official talukas of Nagpur district, Maharashtra */
export const NAGPUR_TALUKAS = [
  "Bhiwapur",
  "Hingna",
  "Kalmeshwar",
  "Kamptee",
  "Katol",
  "Kuhi",
  "Mouda",
  "Nagpur",
  "Narkhed",
  "Parseoni",
  "Ramtek",
  "Savner",
  "Umred",
] as const;

export type NagpurTaluka = (typeof NAGPUR_TALUKAS)[number];

const talukaSet = new Set<string>(NAGPUR_TALUKAS);

export function isNagpurTaluka(value: string): value is NagpurTaluka {
  return talukaSet.has(value);
}
