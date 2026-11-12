// Downloads the open-licence fonts used by the app (Manjari for Malayalam, Amiri for Arabic) into www/fonts.
// Optional: if this fails the app falls back to the phone's own fonts.
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "www", "fonts");
fs.mkdirSync(dir, { recursive: true });
const base = "https://raw.githubusercontent.com/google/fonts/main/ofl/";
const files = ["manjari/Manjari-Regular.ttf", "manjari/Manjari-Bold.ttf", "amiri/Amiri-Regular.ttf", "amiriquran/AmiriQuran-Regular.ttf"];
for (const f of files) {
  const out = path.join(dir, path.basename(f));
  if (fs.existsSync(out)) { console.log("• have " + path.basename(f)); continue; }
  try {
    const r = await fetch(base + f);
    if (!r.ok) throw new Error("HTTP " + r.status);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log("• downloaded " + path.basename(f));
  } catch (e) { console.warn("⚠ could not download " + f + " (" + e.message + ") – the phone's font will be used"); }
}
