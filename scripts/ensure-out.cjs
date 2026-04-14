/* Ensures `out/` exists so rust-embed in `cargo run --release` can compile. */
const fs = require("fs");
const { spawnSync } = require("child_process");

if (!fs.existsSync("out")) {
  console.log("[dev:stack] out/ missing — running npm run build …");
  const r = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });
  process.exit(r.status ?? 1);
}
