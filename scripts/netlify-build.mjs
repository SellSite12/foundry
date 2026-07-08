/* eslint-disable no-console */
import { spawn } from "child_process";
import path from "path";

function bin(name) {
  const ext = process.platform === "win32" ? ".cmd" : "";
  return path.join(process.cwd(), "node_modules", ".bin", name + ext);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const opts = { stdio: "inherit", env: process.env };
    if (process.platform === "win32" && (cmd.endsWith(".cmd") || cmd.endsWith(".bat"))) {
      opts.shell = true;
    }
    const child = spawn(cmd, args, opts);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

await import("./prisma-netlify.mjs");
await run(bin("next"), ["build"]);
