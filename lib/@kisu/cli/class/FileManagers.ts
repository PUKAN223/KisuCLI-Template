import { File } from "@kisu/cli";
import * as fs from "fs/promises"

class FileManagers {
  constructor() {
  }

  //Directory Methods
  async copyDirectory(source: string, destination: string) {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = `${source}/${entry.name}`;
      const destPath = `${destination}/${entry.name}`;
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  public async exists(path: string) {
    try {
      await fs.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  public async readDirectory(path: string) {
    return await fs.readdir(path);
  }

  public async removeDirectory(path: string) {
    try {
      await fs.stat(path);
      await fs.rm(path, { recursive: true });
    } catch {
      // Silently ignore if directory doesn't exist
    }
  }

  public async eachFileInDirectory(path: string, callback: (file: File) => void) {
    const dir = await fs.readdir(path, { withFileTypes: true });
    for (const file of dir) {
      if (!file.isFile()) {
        await this.eachFileInDirectory(`${path}/${file.name}`, callback);
        continue;
      }
      // console.log(path)
      const fileInfo: File = new File({
        name: file.name.split(".")[0] as string,
        path: `${path}/${file.name}`,
        content: await this.readFile(`${path}/${file.name}`),
      });
      callback(fileInfo);
    }
  }

  public async createDirectory(path: string) {
    await fs.mkdir(path, { recursive: true });
  }

  public async renameDirectory(oldPath: string, newPath: string) {
    await fs.rename(oldPath, newPath);
  }

  //File Methods
  public readFile(path: string) {
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension && ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)) {
      return fs.readFile(path);
    }
    return fs.readFile(path, "utf-8");
  }

  public async writeFile(path: string, content: string | Uint8Array) {
    //create directory if not exists
    await this.createDirectory(path.split("/").slice(0, -1).join("/"));
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension && ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)) {
      if (content instanceof Uint8Array) {
        return fs.writeFile(path, content);
      } else {
        throw new Error("Binary file content must be provided as Uint8Array");
      }
    } else {
      if (typeof content === "string") {
        return fs.writeFile(path, content);
      } else {
        throw new Error("Text file content must be provided as string");
      }
    }
  }

  public async removeFile(path: string) {
    try {
      await fs.rm(path);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") throw error;
    }
  }

  public async copyFile(source: string, destination: string) {
    try {
      await fs.stat(source);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return; // skip if source missing
      throw error;
    }
    await fs.copyFile(source, destination);
  }

  public async createFile(path: string) {
    await fs.writeFile(path, "");
  }

  public async renameFile(oldPath: string, newPath: string) {
    await fs.rename(oldPath, newPath);
  }
}

export { FileManagers };
