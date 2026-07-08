/* eslint-disable no-console */
// Create GitHub repo and push using stored git credentials (no gh CLI needed).
// Usage: node scripts/github-push.mjs [owner/repo-name]

import { spawn } from "child_process";
import { createInterface } from "readline";

const repoArg = process.argv[2];
let owner;
let name;

if (repoArg?.includes("/")) {
  [owner, name] = repoArg.split("/");
} else {
  name = repoArg ?? "foundry";
}

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
  const input = "protocol=https\nhost=github.com\n\n";
  const out = await run("git", ["credential", "fill"], input);
  const lines = Object.fromEntries(
    out.trim().split("\n").map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
  );
  const token = lines.password;
  if (!token) throw new Error("No GitHub credentials in git credential manager. Run: gh auth login");
  return { username: lines.username, token };
}

const { token } = await getGitHubToken();

let createRes = await fetch("https://api.github.com/user/repos", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
  body: JSON.stringify({ name, private: false, auto_init: false }),
});

if (createRes.status === 422) {
  console.log("Repo may already exist, continuing...");
  if (!owner) {
    const me = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    }).then((r) => r.json());
    owner = me.login;
  }
} else if (!createRes.ok) {
  const err = await createRes.text();
  throw new Error(`Create repo failed (${createRes.status}): ${err}`);
} else {
  const repo = await createRes.json();
  owner = repo.owner.login;
  console.log(`Created: ${repo.html_url}`);
}

if (!owner) {
  const me = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  }).then((r) => r.json());
  owner = me.login;
}

const remote = `https://github.com/${owner}/${name}.git`;
await run("git", ["remote", "remove", "origin"]).catch(() => {});
// Use token embedded in URL to avoid interactive credential prompts
await run("git", ["remote", "add", "origin", `https://x-access-token:${token}@github.com/${owner}/${name}.git`]);
await run("git", ["push", "-u", "origin", "master"]);
console.log(`Pushed to https://github.com/${owner}/${name}.git`);
