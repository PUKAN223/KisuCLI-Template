import { FileManagers, FilterManagers, Logger, Filters, type ConfigOptions, type PackBuilderOptions } from "@kisu/cli";
import chalk from "chalk";
import JSZip from "jszip";
import * as fs from "fs/promises";
import path from "path";

class PackBuilder {
  private packsPath: string = "./packs";
  private distPath: string = "./data/dist";
  private addonsPath: string = "./data/dist/addons";
  private filtersPath: string = `${"../".repeat(4)}data/filters/<filtersName>/index.ts`;
  private filterManagers: FilterManagers;
  private fileManagers: FileManagers;
  private logger: Logger;
  private config: ConfigOptions;

  constructor(options: PackBuilderOptions) {
    this.packsPath = options.packsPath || this.packsPath;
    this.distPath = options.distPath || this.distPath;
    this.config = options.config;
    this.fileManagers = new FileManagers();
    this.filterManagers = new FilterManagers();
    this.logger = new Logger();
  }

  public async build() {
    this.logger.info("Building packs...");
    await this.fileManagers.removeDirectory(this.distPath);
    await this.fileManagers.createDirectory(this.distPath);

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/BP`,
      `${this.distPath}/BP`,
    );

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/RP`,
      `${this.distPath}/RP`,
    );

    await this.loadFilters();
    await this.filterManagers.applyFilters();
    this.logger.success(`Successfully processed files`);
  }

  public async copyTo() {
    const gamePath = this.config.env.GamePath || await this.autoFindGamePath();
    if (!gamePath) {
      this.logger.error(
        "Could not determine Minecraft game path. Please set the GamePath in the config.",
      );
      return;
    }
    const BPPath =
      `${gamePath}/development_behavior_packs/${this.getPackName("BP", this.config)}`;
    const RPPath =
      `${gamePath}/development_resource_packs/${this.getPackName("RP", this.config)}`;
    try {
      await this.fileManagers.removeDirectory(BPPath);
      await this.fileManagers.removeDirectory(RPPath);
    } catch (e) {
      this.logger.error(`Error removing existing packs: ${e}`);
    }

    await this.fileManagers.copyDirectory(`${this.distPath}/BP`, BPPath);
    await this.fileManagers.copyDirectory(`${this.distPath}/RP`, RPPath);

    this.logger.msg(
      `Copied to ${gamePath}/${this.getPackName("BP", this.config)}`,
      "BP",
      chalk.bgHex("#808080"),
    )

    this.logger.msg(
      `Copied to ${gamePath}/${this.getPackName("RP", this.config)}`,
      "RP",
      chalk.bgHex("#808080"),
    )
  }

  public async clean() {
    //fix
    if (!(await this.fileManagers.exists(this.distPath))) {
      this.logger.info("Dist directory does not exist. Nothing to clean.");
      return;
    }
    await this.fileManagers.removeDirectory(this.distPath);
    this.logger.info("Cleaned dist directory.");
  }

  public async pack() {
    try {
      const exists = await fs.stat(this.distPath).catch(() => false);
      if (!exists) {
        this.logger.error(
          "Dist directory does not exist. Please run build first.",
        );
        return;
      }

      await this.fileManagers.createDirectory(this.addonsPath);

      const BPZip = new JSZip();
      const RPZip = new JSZip();
      const AddonZip = new JSZip();

      const addFolderToZip = async (zip: JSZip, folderPath: string) => {
        for await (const entry of (await fs.readdir(folderPath, { withFileTypes: true }))) {
          const fullPath = `${folderPath}/${entry.name}`;

          if (entry.isDirectory()) {
            const subFolder = zip.folder(entry.name);
            if (subFolder) {
              await addFolderToZip(subFolder, fullPath);
            }
          } else if (entry.isFile()) {
            const data = await fs.readFile(fullPath);
            zip.file(entry.name, data);
          }
        }
      };

      await addFolderToZip(BPZip, `${this.distPath}/BP`);
      await addFolderToZip(
        AddonZip.folder("BP")!,
        `${this.distPath}/BP`,
      );

      await addFolderToZip(RPZip, `${this.distPath}/RP`);
      await addFolderToZip(
        AddonZip.folder("RP")!,
        `${this.distPath}/RP`,
      );

      // Write zips
      await fs.writeFile(
        `${this.addonsPath}/${this.getPackName("BP", this.config)}.zip`,
        await BPZip.generateAsync({ type: "uint8array" }),
      );

      await fs.writeFile(
        `${this.addonsPath}/${this.getPackName("RP", this.config)}.zip`,
        await RPZip.generateAsync({ type: "uint8array" }),
      );

      await fs.writeFile(
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.zip`,
        await AddonZip.generateAsync({ type: "uint8array" }),
      );

      await this.fileManagers.renameFile(
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.zip`,
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.mcaddon`,
      );

      this.logger.success(`Packs have been zipped in ${this.addonsPath}`);
    } catch (err) {
      this.logger.error(`Error while packing: ${err}`);
    }
  }

  public filters() {
    return this.filterManagers;
  }

  private getPackName(packType: "BP" | "RP" | "Addon", config: ConfigOptions): string {
    return `${config.meta.name}@${config.meta.version.join(".")}` + (packType === "Addon" ? "" : `_${packType}`);
  }
  
  private async autoFindGamePath(): Promise<string | null> {
    // Probe common Bedrock locations on Windows; return the first that exists
    const candidates: string[] = [];

    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA;
    const userProfile = process.env.USERPROFILE;

    if (appData) {
      candidates.push(path.join(appData, "Minecraft Bedrock", "users", "Shared", "games", "com.mojang"));
    }
    if (localAppData) {
      candidates.push(path.join(localAppData, "Packages", "Microsoft.MinecraftUWP_8wekyb3d8bbwe", "LocalState", "games", "com.mojang"));
    }
    if (userProfile) {
      candidates.push(path.join(userProfile, "AppData", "Local", "Packages", "Microsoft.MinecraftUWP_8wekyb3d8bbwe", "LocalState", "games", "com.mojang"));
    }

    for (const candidate of candidates) {
      if (await this.fileManagers.exists(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private async loadFilters() {
    for (const filterConfig of this.config.filters) {
      const filterPath = `${this.filtersPath.replace("<filtersName>", filterConfig.name)}`;
      const filterModule = await import(filterPath);
      const FilterClass = filterModule[filterConfig.name] as typeof Filters;
      this.filterManagers.registerFilter(FilterClass);
    }
  }
}

export { PackBuilder };
