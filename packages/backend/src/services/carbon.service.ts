// Car: 0.21 kg CO₂/km, Motorcycle: 0.09 kg CO₂/km → delta = 0.12 kg/km
const CO2_DELTA_KG_PER_KM = 0.12;

export function calculateCarbonSaved(distanceKm: number): number {
  return Math.round(distanceKm * CO2_DELTA_KG_PER_KM * 100) / 100;
}

export function formatCarbonSaved(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g CO₂`;
  return `${kg.toFixed(2)} kg CO₂`;
}
