/* eslint-disable no-console */
// Link Netlify site to GitHub repo using Netlify GitHub App installation ID.
// Usage: node scripts/link-netlify-github.mjs [owner/repo] [branch]

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
const ghHeaders = {
  Authorization: `Bearer ${gh}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`, { headers: ghHeaders });
if (!repoRes.ok) throw new Error(`GitHub repo lookup failed: ${repoRes.status}`);
const repo = await repoRes.json();
console.log(`GitHub repo id: ${repo.id}`);

const instRes = await fetch("https://api.github.com/user/installations", { headers: ghHeaders });
const installations = (await instRes.json()).installations ?? [];
const netlify = installations.find((i) =>
  i.app_slug === "netlify" || i.app_slug?.includes("netlify") || i.app_id === 21084
);

if (!netlify) {
  console.error("\nNetlify GitHub App not installed.");
  console.error("Install it: https://github.com/apps/netlify");
  console.error("Grant access to", repoPath);
  console.error("\nThen run this script again.\n");
  process.exit(1);
}

console.log(`Netlify installation_id: ${netlify.id}`);

const netlifyToken = await getNetlifyToken();
const linkRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${netlifyToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    repo: {
      provider: "github",
      installation_id: netlify.id,
      id: repo.id,
      repo: repoPath,
      private: repo.private,
      branch,
      cmd: "npm run build:netlify",
      dir: "",
    },
  }),
});

const linked = await linkRes.json();
if (!linkRes.ok) {
  console.error("Link failed:", linkRes.status, JSON.stringify(linked, null, 2));
  process.exit(1);
}

console.log("Linked:", linked.name, linked.repo?.repo_path ?? linked.repo?.repo ?? "ok");

const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${netlifyToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ clear_cache: true }),
});

const build = await buildRes.json();
if (!buildRes.ok) {
  console.error("Build trigger failed:", buildRes.status, JSON.stringify(build, null, 2));
  process.exit(1);
}

console.log(`\nBuild triggered: ${build.deploy_id ?? build.id}`);
console.log(`https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${build.deploy_id ?? build.id}`);
