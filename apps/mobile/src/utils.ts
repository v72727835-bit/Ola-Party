export const hash = (s = '') => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const initials = (s?: string) => (s || 'P').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
export const firstName = (s?: string) => (s || 'friend').split(' ')[0];
export const shortId = (id?: string) => String(1000000000 + (hash(id) % 8999999999)).slice(0, 10);
export const ago = (iso?: string) => { if (!iso) return ''; const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); if (m < 1) return 'now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`; };
export const when = (iso?: string) => { if (!iso) return 'Date coming soon'; const d = new Date(iso); return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
export const ZODIAC: [number, string][] = [[120, 'Capricorn'], [219, 'Aquarius'], [320, 'Pisces'], [420, 'Aries'], [521, 'Taurus'], [621, 'Gemini'], [722, 'Cancer'], [823, 'Leo'], [923, 'Virgo'], [1023, 'Libra'], [1122, 'Scorpio'], [1222, 'Sagittarius'], [1231, 'Capricorn']];
export const zodiac = (d?: string) => { const m = d?.match(/^\d{4}-(\d{2})-(\d{2})$/); if (!m) return ''; const v = Number(m[1]) * 100 + Number(m[2]); return (ZODIAC.find(([end]) => v <= end) || ZODIAC[0])[1]; };
