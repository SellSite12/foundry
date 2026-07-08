/* eslint-disable no-console */
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const cmd = process.argv[2] ?? "node scripts/netlify-build-check.mjs";

const token = Object.values(
  JSON.parse(await readFile(path.join(os.homedir(), "AppData/Roaming/netlify/Config/config.json"), "utf8")).users ?? {}
)[0]?.auth?.token;

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

await fetch(`https://api.netlify.com/api/v1/sites/${SITE}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ build_settings: { cmd, dir: "" } }),
});

const build = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
}).then((r) => r.json());

const id = build.deploy_id;
console.log("cmd:", cmd);
console.log("deploy:", id);

for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const d = await fetch(`https://api.netlify.com/api/v1/deploys/${id}`, { headers }).then((r) => r.json());
  console.log(d.state, d.error_message ?? "");
  if (d.state === "ready" || d.state === "error") process.exit(d.state === "ready" ? 0 : 1);
}
