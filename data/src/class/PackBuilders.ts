import { PackBuilderOptions } from "../types/PackBuilderOptions.ts";
import { FileManagers } from "./FileManagers.ts";
import { FilterManagers } from "./FilterManagers.ts";
import { Logger } from "./Logger.ts";
import JSZip from "npm:jszip@3.10.1";

class PackBuilder {
  private packsPath: string = "./packs";
  private distPath: string = "./data/dist";
  private addonsPath: string = "./data/dist/addons";
  private filterManagers: FilterManagers;
  private fileManagers: FileManagers;
  private logger: Logger;
  private packName: string = "";
  private env: Record<string, string> = {};

  constructor(options: PackBuilderOptions) {
    this.packsPath = options.packsPath || this.packsPath;
    this.distPath = options.distPath || this.distPath;
    this.packName = options.name || "PackBuilder_Pack";
    this.env = options.env || this.env;
    this.fileManagers = new FileManagers();
    this.filterManagers = new FilterManagers();
    this.logger = new Logger();
  }

  public async build() {
    this.logger.info("Building packs...");
    this.fileManagers.removeDirectory(this.distPath);
    this.fileManagers.createDirectory(this.distPath);

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/BP`,
      `${this.distPath}/BP`,
    );

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/RP`,
      `${this.distPath}/RP`,
    );

    await this.filterManagers.applyFilters();
    this.logger.success(`Successfully processed files`);
  }

  public copyTo() {
    const BPPath =
      `${this.env.GAME_PATH}/development_behavior_packs/${this.packName}`;
    const RPPath =
      `${this.env.GAME_PATH}/development_resource_packs/${this.packName}`;

    try {
      this.fileManagers.removeDirectory(BPPath);
      this.fileManagers.removeDirectory(RPPath);
    } catch (e) {
      this.logger.error(`Error removing existing packs: ${e}`);
    }

    this.fileManagers.copyDirectory(`${this.distPath}/BP`, BPPath);
    this.fileManagers.copyDirectory(`${this.distPath}/RP`, RPPath);

    this.logger.success(`Copied packs to ${this.env.GAME_PATH}`);
  }

  public clean() {
    this.fileManagers.removeDirectory(this.distPath);
    this.logger.info("Cleaned dist directory.");
  }

  public async pack() {
    try {
      const exists = await Deno.stat(this.distPath).catch(() => false);
      if (!exists) {
        this.logger.error(
          "Dist directory does not exist. Please run build first.",
        );
        return;
      }

      this.fileManagers.createDirectory(this.addonsPath);

      const BPZip = new JSZip();
      const RPZip = new JSZip();
      const AddonZip = new JSZip();

      // Helper to recursively add files to zip
      const addFolderToZip = async (zip: JSZip, folderPath: string) => {
        for await (const entry of Deno.readDir(folderPath)) {
          const fullPath = `${folderPath}/${entry.name}`;

          if (entry.isDirectory) {
            const subFolder = zip.folder(entry.name);
            if (subFolder) {
              await addFolderToZip(subFolder, fullPath); // just go deeper
            }
          } else if (entry.isFile) {
            const data = await Deno.readFile(fullPath);
            zip.file(entry.name, data); // ✅ only the file name
          }
        }
      };

      // Process BP recursively
      await addFolderToZip(BPZip, `${this.distPath}/BP`);
      await addFolderToZip(
        AddonZip.folder("BP")!,
        `${this.distPath}/BP`,
      );

      // Process RP recursively
      await addFolderToZip(RPZip, `${this.distPath}/RP`);
      await addFolderToZip(
        AddonZip.folder("RP")!,
        `${this.distPath}/RP`,
      );

      // Write zips
      await Deno.writeFile(
        `${this.addonsPath}/${this.packName}_BP.zip`,
        await BPZip.generateAsync({ type: "uint8array" }),
      );

      await Deno.writeFile(
        `${this.addonsPath}/${this.packName}_RP.zip`,
        await RPZip.generateAsync({ type: "uint8array" }),
      );

      await Deno.writeFile(
        `${this.addonsPath}/${this.packName}_Addon.zip`,
        await AddonZip.generateAsync({ type: "uint8array" }),
      );

      this.fileManagers.renameFile(
        `${this.addonsPath}/${this.packName}_Addon.zip`,
        `${this.addonsPath}/${this.packName}.mcaddon`,
      );

      this.logger.success(`Packs have been zipped in ${this.addonsPath}`);
    } catch (err) {
      this.logger.error(`Error while packing: ${err}`);
    }
  }

  public filters() {
    return this.filterManagers;
  }
}

export { PackBuilder };
