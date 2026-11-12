// Downloads the Quran text (Uthmani script, Tanzil Project) into www/quran/quran.json so the app works offline.
// Format: an array of 114 surahs, each an array of ayah strings (Bismillah removed from the first ayah, shown separately by the app).
// Tanzil text is used verbatim under its terms of use (tanzil.net). If the download fails the app downloads surahs on first use instead.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const dir = path.join(root, "www", "quran"); fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, "quran.json");
const norm = (w) => w.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[ٱأإآ]/g, "ا");
const strip = (n, text) => { if (n === 1) return text; const w = text.split(" "); return (w.length > 4 && norm(w[0]) === "بسم") ? w.slice(4).join(" ") : text; };
function check(q) { return Array.isArray(q) && q.length === 114 && q.reduce((s, a) => s + a.length, 0) === 6236; }
async function fromAlquranCloud() {
  const r = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani"); if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); return j.data.surahs.map((s) => s.ayahs.map((a, i) => (i === 0 ? strip(s.number, a.text) : a.text)));
}
async function fromTanzil() {
  const r = await fetch("https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true"); if (!r.ok) throw new Error("HTTP " + r.status);
  const q = Array.from({ length: 114 }, () => []);
  for (const line of (await r.text()).split(/\r?\n/)) { const m = line.match(/^(\d+)\|(\d+)\|(.+)$/); if (m) q[+m[1] - 1][+m[2] - 1] = +m[2] === 1 ? strip(+m[1], m[3].trim()) : m[3].trim(); }
  return q;
}
let ok = false;
for (const [name, fn] of [["alquran.cloud", fromAlquranCloud], ["tanzil.net", fromTanzil]]) {
  try { const q = await fn(); if (!check(q)) throw new Error("unexpected ayah count"); fs.writeFileSync(out, JSON.stringify(q)); console.log(`• Quran text saved from ${name} (${Math.round(fs.statSync(out).size / 1024)} KB)`); ok = true; break; }
  catch (e) { console.warn(`⚠ ${name}: ${e.message}`); }
}
if (!ok) console.warn("⚠ Quran text not bundled – the app will download each surah the first time it is opened.");
