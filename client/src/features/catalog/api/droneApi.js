import { env } from '../../../config/env.js';

export async function fetchDrone(id, signal) {
  const res = await fetch(`${env.apiUrl}/drones/${id}`, { signal });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const { data } = await res.json();
  return data;
}
