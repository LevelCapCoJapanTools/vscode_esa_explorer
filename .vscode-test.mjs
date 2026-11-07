import { readFileSync } from "node:fs";
import { defineConfig } from "@vscode/test-cli";

const { engines } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  version: engines.vscode.replace(/^\^/, ""),
  files: "out/test/**/*.test.js",
  workspaceFolder: ".",
  mocha: {
    timeout: 20000,
  },
});
