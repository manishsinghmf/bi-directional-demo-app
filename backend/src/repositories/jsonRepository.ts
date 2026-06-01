import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../../..");

export const dataPath = (fileName: string) => resolve(rootDir, "data", fileName);

export class JsonRepository<T> {
  constructor(
    private readonly filePath: string,
    private readonly defaultValue: T
  ) {}

  async read(): Promise<T> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    if (!raw.trim()) {
      return this.defaultValue;
    }
    return JSON.parse(raw) as T;
  }

  async write(value: T): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }

  private async ensureFile(): Promise<void> {
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await this.write(this.defaultValue);
    }
  }
}
