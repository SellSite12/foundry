/* eslint-disable no-console */
// Fetch recent Netlify deploy build log via admin API proxy patterns.
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const deployId = process.argv[2] ?? "6a4db6b96996f000080ab288";
const siteId = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";

const token = Object.values(
  JSON.parse(await readFile(path.join(os.homedir(), "AppData/Roaming/netlify/Config/config.json"), "utf8")).users ?? {}
)[0]?.auth?.token;

const deploy = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());

console.log("deploy:", deploy.state, deploy.error_message);
console.log("build_id:", deploy.build_id);

const endpoints = [
  `https://api.netlify.com/api/v1/deploys/${deployId}/log`,
  `https://api.netlify.com/api/v1/sites/${siteId}/builds/${deploy.build_id}`,
  `https://api.netlify.com/api/v1/sites/${siteId}/builds/${deploy.build_id}/log`,
  `https://api.netlify.com/builds/${deploy.build_id}/log`,
];

for (const url of endpoints) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  console.log("\n---", url, res.status, "---");
  console.log(text.slice(0, 4000));
}
