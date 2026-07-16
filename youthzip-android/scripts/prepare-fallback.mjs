import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../pages-youth-policy/data/app/index.json");
const target = resolve(here, "../public/data/fallback.json");

await stat(source).catch(() => {
  throw new Error("앱 데이터가 없습니다. 먼저 pages-youth-policy에서 generate-pages.mjs를 실행하세요.");
});
await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
console.log(`Bundled fallback data: ${target}`);
