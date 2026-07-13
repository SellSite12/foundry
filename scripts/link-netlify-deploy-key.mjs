 
// Link Netlify site to GitHub via deploy key (when GitHub App not installed).
// Usage: node scripts/link-netlify-deploy-key.mjs [owner/repo] [branch]

import { readFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const repoPath = process.argv[2] ?? "SellSite12/foundry";
const branch = process.argv[3] ?? "master";

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    if (input) child.stdin.write(input);
    child.stdin.end();
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} failed (${code})`))));
  });
}

async function getGitHubToken() {
  const out = await run("git", ["credential", "fill"], "protocol=https\nhost=github.com\n\n");
  const lines = Object.fromEntries(
    out.trim().split("\n").map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
  );
  if (!lines.password) throw new Error("No GitHub credentials found");
  return lines.password;
}

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  return Object.values(JSON.parse(raw).users ?? {})[0]?.auth?.token;
}

const gh = await getGitHubToken();
const netlifyToken = await getNetlifyToken();
const ghHeaders = {
  Authorization: `Bearer ${gh}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
const netlifyHeaders = {
  Authorization: `Bearer ${netlifyToken}`,
  "Content-Type": "application/json",
};

const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`, { headers: ghHeaders });
const repo = await repoRes.json();
if (!repoRes.ok) throw new Error(`Repo lookup failed: ${repoRes.status}`);

const keyRes = await fetch("https://api.netlify.com/api/v1/deploy_keys", {
  method: "POST",
  headers: netlifyHeaders,
});
const key = await keyRes.json();
if (!keyRes.ok) throw new Error(`Create deploy key failed: ${JSON.stringify(key)}`);
console.log(`Deploy key id: ${key.id}`);

const addKeyRes = await fetch(`https://api.github.com/repos/${repoPath}/keys`, {
  method: "POST",
  headers: { ...ghHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    title: `netlify-${SITE_ID.slice(0, 8)}`,
    key: key.public_key,
    read_only: true,
  }),
});

if (!addKeyRes.ok && addKeyRes.status !== 422) {
  const err = await addKeyRes.text();
  throw new Error(`Add deploy key to GitHub failed: ${addKeyRes.status} ${err}`);
}

const linkRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
  method: "PATCH",
  headers: netlifyHeaders,
  body: JSON.stringify({
    repo: {
      provider: "github",
      deploy_key_id: key.id,
      id: repo.id,
      repo: repoPath,
      private: repo.private,
      branch,
      cmd: "npm run build:netlify",
      dir: "",
      repo_type: "git",
      provider: "github",
      public_repo: !repo.private,
    },
  }),
});

const linked = await linkRes.json();
if (!linkRes.ok) {
  console.error("Link failed:", linkRes.status, JSON.stringify(linked, null, 2));
  process.exit(1);
}

console.log("Linked site to", repoPath);

const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers: netlifyHeaders,
  body: JSON.stringify({ clear_cache: true }),
});

const build = await buildRes.json();
if (!buildRes.ok) {
  console.error("Build trigger failed:", buildRes.status, JSON.stringify(build, null, 2));
  process.exit(1);
}

console.log(`Build: https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${build.deploy_id ?? build.id}`);
