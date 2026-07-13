 
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const ACCOUNT = "SellSite";

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  return Object.values(JSON.parse(await readFile(configPath, "utf8")).users ?? {})[0]?.auth?.token;
}

const token = await getNetlifyToken();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

await fetch(`https://api.netlify.com/api/v1/accounts/${ACCOUNT}/env/NODE_ENV?site_id=${SITE_ID}`, {
  method: "DELETE",
  headers,
});

const res = await fetch(`https://api.netlify.com/api/v1/accounts/${ACCOUNT}/env?site_id=${SITE_ID}`, {
  method: "POST",
  headers,
  body: JSON.stringify([
    {
      key: "NODE_ENV",
      scopes: ["runtime"],
      values: [{ value: "production", context: "all" }],
    },
  ]),
});

const body = await res.json();
console.log("NODE_ENV:", res.status, JSON.stringify(body));

const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
});
const build = await buildRes.json();
console.log("Build:", buildRes.status, build.deploy_id ?? build.id);
