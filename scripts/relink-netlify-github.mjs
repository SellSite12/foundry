 
// Re-link site to GitHub App (drop deploy key) and set build cmd.
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const INSTALLATION_ID = 86968658;
const REPO_ID = 1292967568;
const CMD = process.argv[2] ?? "npm exec -- prisma generate && npm exec -- next build";

const token = Object.values(
  JSON.parse(await readFile(path.join(os.homedir(), "AppData/Roaming/netlify/Config/config.json"), "utf8")).users ?? {}
)[0]?.auth?.token;

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// Unlink deploy key repo first
const unlink = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}/unlink_repo`, {
  method: "PUT",
  headers,
});
console.log("unlink:", unlink.status);

const link = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    repo: {
      provider: "github",
      installation_id: INSTALLATION_ID,
      id: REPO_ID,
      repo: "SellSite12/foundry",
      branch: "master",
      cmd: CMD,
      dir: "",
      public_repo: true,
    },
  }),
});

const body = await link.json();
console.log("link:", link.status, body.build_settings?.repo_path, body.build_settings?.cmd);

const build = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
}).then((r) => r.json());

console.log("build:", build.deploy_id ?? build);
