import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const assetDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const files = await readdir(assetDirectory);
const javascriptFiles = files.filter(file => file.endsWith('.js'));
const sizes = await Promise.all(
  javascriptFiles.map(async file => ({
    file,
    bytes: (await stat(join(assetDirectory, file))).size,
  })),
);
const main = sizes.find(asset => /^index-[^.]+\.js$/.test(asset.file));
const totalBytes = sizes.reduce((sum, asset) => sum + asset.bytes, 0);
const MAIN_BUDGET = 525 * 1024;
const TOTAL_BUDGET = 1_500 * 1024;

if (!main) throw new Error('Could not find the main JavaScript bundle');
if (main.bytes > MAIN_BUDGET) {
  throw new Error(`Main bundle is ${Math.round(main.bytes / 1024)} KB; budget is 525 KB`);
}
if (totalBytes > TOTAL_BUDGET) {
  throw new Error(`Total JavaScript is ${Math.round(totalBytes / 1024)} KB; budget is 1,500 KB`);
}

console.log(`Bundle budget passed: ${Math.round(main.bytes / 1024)} KB initial, ${Math.round(totalBytes / 1024)} KB total.`);
