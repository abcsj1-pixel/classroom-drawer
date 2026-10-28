export class Timer {
  constructor(seconds = 600) { this.setDuration(seconds); }
  setDuration(seconds) {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10800) throw new RangeError('1초부터 180분까지 설정할 수 있어요.');
    this.duration = seconds; this.reset();
  }
  reset() { this.left = this.duration; this.running = false; this.deadline = null; }
  remaining(now = Date.now()) { return this.running ? Math.max(0, Math.ceil((this.deadline - now) / 1000)) : this.left; }
  start(now = Date.now()) {
    if (this.running) return;
    if (this.left <= 0) this.left = this.duration;
    this.deadline = now + this.left * 1000; this.running = true;
  }
  pause(now = Date.now()) { this.left = this.remaining(now); this.running = false; this.deadline = null; }
}
export function safeUrl(input) {
  try {
    const u = new URL(input);
    if (u.username || u.password) return null;
    const sensitive = /(?:token|secret|password|passwd|api[_-]?key|authorization|auth[_-]?code|email|student[^=&]*|학번|이름)=/i;
    let decoded = u.search + u.hash;
    for (let i = 0; i < 3; i++) {
      if (sensitive.test(decoded)) return null;
      try { const next = decodeURIComponent(decoded); if (next === decoded) break; decoded = next; } catch { return null; }
    }
    if (sensitive.test(decoded)) return null;
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname);
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return null;
    if (!local && (/^(10\.|192\.168\.|169\.254\.|127\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname) || u.hostname.startsWith('['))) return null;
    return u.href;
  } catch { return null; }
}
export function selectApps(apps, {category = 'all', query = '', favoritesOnly = false, favorites = []} = {}) {
  const q = query.trim().toLocaleLowerCase();
  return apps.filter(a => (category === 'all' || (category === 'student' ? a.category !== 'personal' : a.category === category)) && (!favoritesOnly || favorites.includes(a.id)) && (!q || `${a.title} ${a.description} ${(a.tags || []).join(' ')}`.toLocaleLowerCase().includes(q)));
}
