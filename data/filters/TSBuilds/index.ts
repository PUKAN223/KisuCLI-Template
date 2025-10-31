import { Filters } from "../../src/class/FilterManagers.ts";
import { Manifest } from "./types/Manifest.ts";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11.1";
import { resolve } from "jsr:@std/path@1.1.2";
import * as esbuild from "npm:esbuild@0.25.11";
import { parseArgs } from "./utils/parseArgs.ts";

const [settings] = parseArgs(Deno.args);
const configPath = resolve("./deno.json");

class TSBuilds extends Filters {
  private typescript = "ts";
  private bpPath = `${this.basePath}/BP`;

  override async apply(): Promise<void> {
    const manifest = this.readManifest(this.bpPath);
    if (!manifest) return;
    const entryPath = manifest.modules.find((x) => x.entry)?.entry;
    if (!entryPath) return;

    const scriptPath = "./packs" + "/" + entryPath.replace(".js", `.${this.typescript}`);
    this.msg(`Building script: ${scriptPath}`);

    await esbuild.build({
      plugins: denoPlugins({ configPath }) as esbuild.Plugin[],
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
    });

    // this.fileManagers.removeDirectory(this.basePath + "/" + "scripts");
  }

  public readManifest(bpPath: string): Manifest | null {
    try {
      return JSON.parse(
        Deno.readTextFileSync(`${bpPath}/manifest.json`),
      ) as Manifest;
    } catch {
      return null;
    }
  }
}

export { TSBuilds };
