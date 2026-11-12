// Downloads freely licensed adhan recordings from Wikimedia Commons into resources/adhan-source/.
// A file you put there yourself with the same name (e.g. makkah.mp3) is never overwritten.
// Licences and authors are listed in the app (Settings › Credits) and in README.md.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const dir = path.join(root, "resources", "adhan-source");
fs.mkdirSync(dir, { recursive: true });
const LIST = [
  ["makkah", "Adhan, Great Mosque of Mecca - Jan 21, 2013.webm"],
  ["madinah", "33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg"],
  ["azeez", "The Adhan - Muslim Call to Prayer - Aaqib Azeez.mp3"],
  ["short", "Adhan wiki.oga"],
  ["makkah_maghrib", "Maghrib Adhan at the Masjid al Haram, Mecca - 25 Feb, 2012.webm"],
  ["istanbul", "Adhan in Istanbul.webm"],
  ["kazakh", "Adhan in Shalqar mosque.webm"],
  ["fajr_malmo", "Eid al-Fitr Fajr azan at Malmö Mosque - 19 August 2012.webm"]
];
const have = fs.readdirSync(dir).map((f) => path.basename(f, path.extname(f)).toLowerCase());
for (const [id, file] of LIST) {
  if (have.includes(id)) { console.log(`• ${id}: using your own file`); continue; }
  const url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file.replace(/ /g, "_"));
  try {
    const r = await fetch(url, { headers: { "User-Agent": "KeralaPrayerTimesBuild/2.1 (GitHub Actions build of an open prayer-times app)" }, redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const out = path.join(dir, id + path.extname(file).toLowerCase());
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log(`• ${id}: downloaded (${Math.round(fs.statSync(out).size / 1024)} KB)`);
  } catch (e) { console.warn(`⚠ ${id}: could not download (${e.message}) – the chime will be used instead`); }
}
