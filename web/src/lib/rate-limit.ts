const requests = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const LIMIT = 8;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const history = (requests.get(key) || []).filter((item) => now - item < WINDOW_MS);

  if (history.length >= LIMIT) {
    requests.set(key, history);
    return false;
  }

  history.push(now);
  requests.set(key, history);
  return true;
}
