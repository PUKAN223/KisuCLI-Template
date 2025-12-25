import { Filters } from "@kisu/cli";
import type { Manifest } from "./types/Manifest.ts";
import * as esbuild from "esbuild";
import { parseArgs } from "./utils/parseArgs.ts";
import chalk from "chalk";
import { spawn } from "bun";
import * as fs from "fs";

const [settings] = parseArgs(Bun.argv.slice(2));


class TSBuilds extends Filters {
  private typescript = "ts";
  private bpPath = `${this.basePath}/BP`;

  override async apply(): Promise<void> {
    const manifest = this.readManifest(this.bpPath);
    if (!manifest) return;
    const entryPath = manifest.modules.find((x) => x.entry)?.entry;
    if (!entryPath) return;

    const scriptPath = "./packs" + "/" + entryPath.replace(".js", `.${this.typescript}`);

    // Run linter before building (surface output to console)
    this.msg(`Running linter: ${chalk.yellow("bunx eslint ./packs ./lib")}`);
    const lintProcess = spawn(["bunx", "eslint", "./packs", "./lib"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await lintProcess.exited;

    if (exitCode !== 0) {
      this.msg(`${chalk.red("✗")} Linting failed. Fix errors before building.`);
      return;
    }

    this.msg(`${chalk.green("✓")} Linting passed`);

    // Build KisuLib.js first (contains @kisu/api)
    this.msg(`Building library: ${chalk.blue("KisuLib.js")}`);
    await esbuild.build({
      bundle: true,
      entryPoints: ["./lib/@kisu/api/index.ts"],
      external: [
        "@minecraft/server",
        "@minecraft/server-ui",
      ],
      format: "esm",
      outfile: this.bpPath + "/scripts/KisuLib.js",
      minify: true,
      keepNames: false,
      sourcemap: true,
      ...settings,
    }).then(() => {
      this.msg(`Successfully built library: ${chalk.green("BP/scripts/KisuLib.js")}`);
    });

    // Build main script (excludes @kisu/api)
    this.msg(`Building script: ${chalk.green(scriptPath)}`);
    await esbuild.build({
      plugins: [
        {
          name: "alias-kisu-api",
          setup(build) {
            build.onResolve({ filter: /^@kisu\/api$/ }, () => {
              return { path: "./KisuLib.js", external: true };
            });
          },
        },
      ],
      bundle: true,
      entryPoints: [
        scriptPath,
      ],
      external: [
        "@minecraft/server",
        "@minecraft/server-ui",
      ],
      format: "esm",
      outfile: this.bpPath + "/" + entryPath,
      sourcemap: true,
      ...settings,
    }).then(() => {
      this.msg(`Successfully built script: ${chalk.green("BP/" + entryPath)}`);
    });

    // this.fileManagers.removeDirectory(this.basePath + "/" + "scripts");
  }

  public readManifest(bpPath: string): Manifest | null {
    try {
      return JSON.parse(
        fs.readFileSync(`${bpPath}/manifest.json`, "utf-8"),
      ) as Manifest;
    } catch {
      return null;
    }
  }
}

export { TSBuilds };
