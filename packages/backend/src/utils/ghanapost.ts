import axios from 'axios';

export function isGhanaPostCode(text: string): boolean {
  return /^[A-Z]{2}-?\d{3}-?\d{4}$/i.test((text ?? '').trim());
}

export async function resolveGhanaPost(code: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (process.env.GHANAPOST_ENABLED !== 'true') return null;
  try {
    const { data } = await axios.get('https://ghanapostgps.sperixlabs.org/get-location', {
      params: { address: code.trim().toUpperCase() },
      timeout: 5000,
    });
    if (data?.data?.Results?.[0]) {
      const r = data.data.Results[0];
      return { lat: parseFloat(r.Latitude), lng: parseFloat(r.Longitude), address: r.Area ?? code };
    }
  } catch {
    // Graceful fallback — GhanaPostGPS API may require auth in production
  }
  return null;
}
