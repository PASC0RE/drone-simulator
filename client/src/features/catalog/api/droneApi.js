import { env } from '../../../config/env.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The free Neon database sleeps when idle, so the first request can fail once.
// Retry a couple of times with a short pause before giving up.
async function request(path, { signal, retries = 2 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(`${env.apiUrl}${path}`, { signal });
      if (res.ok) return await res.json();

      const body = await res.json().catch(() => ({}));
      const err = new Error(body.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (err.status && err.status < 500) throw err; // 4xx will not fix itself
      lastError = err;
    }
    if (attempt < retries) await sleep(900 * (attempt + 1));
  }
  throw lastError;
}

export async function fetchDrones(signal) {
  const { data } = await request('/drones', { signal });
  return data;
}

export async function fetchDrone(id, signal) {
  const { data } = await request(`/drones/${id}`, { signal });
  return data;
}
