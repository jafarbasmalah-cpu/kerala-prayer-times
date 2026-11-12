// Bundles src/native-entry.js (Capacitor core + plugins) into www/js/native.js.
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const req = createRequire(path.join(root, "package.json"));
let esbuild;
try { esbuild = req("esbuild"); } catch { execSync("npm install --no-save --no-audit --no-fund esbuild", { cwd: root, stdio: "inherit" }); esbuild = req("esbuild"); }
await esbuild.build({
  entryPoints: [path.join(root, "src", "native-entry.js")], bundle: true, format: "iife", target: "es2019", minify: true,
  outfile: path.join(root, "www", "js", "native.js"), logLevel: "info"
});
console.log("• phone plugins bundled into www/js/native.js");
