// Prepares adhan sounds and native permissions for Android & iOS.
// Run after `npx cap add android` / `npx cap add ios`, and again whenever you add adhan recordings:
//   npm run setup:native && npx cap sync
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const r = (...p) => path.join(root, ...p);
const log = (m) => console.log("• " + m);
const warn = (m) => console.warn("⚠ " + m);
const mk = (d) => fs.mkdirSync(d, { recursive: true });

function hasFfmpeg() { try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return true; } catch { return false; } }
const ff = hasFfmpeg();
if (!ff) warn("ffmpeg not found – MP3s will be copied as-is, but iPhone adhan clips cannot be made. Install ffmpeg (https://ffmpeg.org) and run again.");

// ---------- 1. Audio ----------
const SRC = r("resources", "adhan-source");
const OUT_WWW = r("www", "audio"), OUT_AND = r("resources", "sounds", "android"), OUT_IOS = r("resources", "sounds", "ios");
[OUT_WWW, OUT_AND, OUT_IOS].forEach(mk);
const sources = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /\.(mp3|m4a|wav|aac|ogg)$/i.test(f)) : [];
if (!sources.length) warn("No adhan recordings in resources/adhan-source/. The app will use the built-in chime until you add them (see README).");
for (const f of sources) {
  const id = path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const inp = path.join(SRC, f), mp3 = path.join(OUT_WWW, `adhan_${id}.mp3`);
  if (ff) {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", inp, "-ac", "1", "-ar", "44100", "-b:a", "96k", mp3]);
    // iOS notification sounds must be < 30 s: make a 29 s clip with a gentle fade-out.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", inp, "-t", "29", "-af", "afade=t=out:st=27:d=2", "-ac", "1", "-ar", "22050", "-acodec", "pcm_s16le", path.join(OUT_IOS, `adhan_${id}.wav`)]);
  } else if (/\.mp3$/i.test(f)) fs.copyFileSync(inp, mp3);
  else { warn(`Skipped ${f} (needs ffmpeg to convert)`); continue; }
  fs.copyFileSync(mp3, path.join(OUT_AND, `adhan_${id}.mp3`));
  log(`Adhan prepared: ${id}`);
}
fs.copyFileSync(r("www", "audio", "chime.wav"), path.join(OUT_AND, "chime.wav"));
fs.copyFileSync(r("www", "audio", "chime.wav"), path.join(OUT_IOS, "chime.wav"));

// ---------- 2. Android ----------
const AND = r("android", "app", "src", "main");
if (fs.existsSync(AND)) {
  const raw = path.join(AND, "res", "raw"); mk(raw);
  for (const f of fs.readdirSync(OUT_AND)) fs.copyFileSync(path.join(OUT_AND, f), path.join(raw, f));
  const dr = path.join(AND, "res", "drawable"); mk(dr);
  fs.writeFileSync(path.join(dr, "ic_stat_prayer.xml"),
`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,3C9,5.5 6,7 6,11h12C18,7 15,5.5 12,3zM11.5,0.5h1v2.5h-1zM4,11h2v10H4zM18,11h2v10h-2zM3,21h18v1.5H3zM7,12h10v9h-3v-3a2,2 0,0 0,-4 0v3H7z"/>
</vector>`);
  const mf = path.join(AND, "AndroidManifest.xml");
  let xml = fs.readFileSync(mf, "utf8");
  const perms = ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "WAKE_LOCK"];
  let add = "";
  for (const p of perms) if (!xml.includes(`android.permission.${p}"`)) add += `\n    <uses-permission android:name="android.permission.${p}" />`;
  if (!xml.includes("android.hardware.location.gps")) add += `\n    <uses-feature android:name="android.hardware.location.gps" android:required="false" />`;
  if (add) { xml = xml.replace(/<\/manifest>\s*$/, add.trimStart().replace(/^/, "    ") + "\n</manifest>\n"); fs.writeFileSync(mf, xml); }
  log("Android: sounds copied, notification icon and permissions added");
} else log("Android platform not added yet (run: npx cap add android) – skipped");

// ---------- 3. iOS ----------
const IOS = r("ios", "App", "App");
if (fs.existsSync(IOS)) {
  const sd = path.join(IOS, "sounds"); mk(sd);
  const files = fs.readdirSync(OUT_IOS);
  for (const f of files) fs.copyFileSync(path.join(OUT_IOS, f), path.join(sd, f));
  // Register sounds in the Xcode project so they are bundled with the app.
  const pbx = r("ios", "App", "App.xcodeproj", "project.pbxproj");
  try {
    const xcode = (await import("xcode")).default;
    const proj = xcode.project(pbx); proj.parseSync();
    const group = proj.findPBXGroupKey({ name: "App" }) || proj.findPBXGroupKey({ path: "App" });
    const target = proj.getFirstTarget().uuid;
    let n = 0;
    for (const f of files) { const rel = `sounds/${f}`; if (!proj.hasFile(rel)) { proj.addResourceFile(rel, { target }, group); n++; } }
    fs.writeFileSync(pbx, proj.writeSync());
    log(`iOS: ${files.length} sound(s) in app bundle (${n} newly added to Xcode project)`);
  } catch (e) {
    warn("Could not update the Xcode project automatically. In Xcode, drag ios/App/App/sounds into the App group and tick 'Add to target: App'. (" + e.message + ")");
  }
  const plist = path.join(IOS, "Info.plist");
  let pl = fs.readFileSync(plist, "utf8");
  const keys = {
    NSLocationWhenInUseUsageDescription: "Your location is used to calculate exact prayer times and the Qibla direction.",
    NSMotionUsageDescription: "The compass is used to show the Qibla direction."
  };
  for (const [k, v] of Object.entries(keys)) if (!pl.includes(`<key>${k}</key>`)) pl = pl.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${k}</key>\n\t<string>${v}</string>\n</dict>\n</plist>\n`);
  fs.writeFileSync(plist, pl);
  log("iOS: location & compass permission texts added");
} else log("iOS platform not added yet (run on a Mac: npx cap add ios) – skipped");

console.log("\nDone. Now run:  npx cap sync");
