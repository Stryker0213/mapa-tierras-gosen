import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'public');
await mkdir(publicDir, { recursive: true });

for (const directory of ['assets', 'css', 'images', 'js']) {
  await cp(path.join(root, directory), path.join(publicDir, directory), { recursive: true, force: true });
}
await cp(path.join(root, 'data'), path.join(publicDir, 'data'), { recursive: true, force: true });
await cp(path.join(root, 'mapa.html'), path.join(publicDir, 'mapa.html'), { force: true });
