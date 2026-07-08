/* eslint-disable no-console */
import { execSync } from "child_process";

await import("./prisma-netlify.mjs");
execSync("npx next build", { stdio: "inherit", env: process.env });
