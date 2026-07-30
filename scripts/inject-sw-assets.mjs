// Postbuild step: reads Vite's build manifest (dist/.vite/manifest.json) and rewrites
// the copied dist/service-worker.js so its SHELL_ASSETS array precaches the real,
// content-hashed JS/CSS bundle paths for this build — the public/service-worker.js
// source file stays a generic template with a placeholder marker.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const manifestPath = path.join(distDir, '.vite', 'manifest.json');
const swPath = path.join(distDir, 'service-worker.js');

if (!existsSync(manifestPath)) {
  throw new Error(`Vite build manifest not found at ${manifestPath} — did the build run with build.manifest enabled?`);
}
if (!existsSync(swPath)) {
  throw new Error(`dist/service-worker.js not found — expected Vite to copy it from public/.`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const assetPaths = new Set();
for (const entry of Object.values(manifest)) {
  if (entry.file) assetPaths.add('/' + entry.file);
  for (const css of entry.css ?? []) assetPaths.add('/' + css);
  for (const asset of entry.assets ?? []) assetPaths.add('/' + asset);
}

const injected = [...assetPaths].map((p) => `  ${JSON.stringify(p)},`).join('\n');

let sw = readFileSync(swPath, 'utf-8');
sw = sw.replace('// __BUILD_ASSETS__', injected);
// Bump the cache name per build so a deploy invalidates any previously cached shell.
const buildTag = Date.now().toString(36);
sw = sw.replace("const CACHE_VERSION = 'ritual-v1';", `const CACHE_VERSION = 'ritual-v1-${buildTag}';`);

writeFileSync(swPath, sw);
console.log(`service-worker.js updated with ${assetPaths.size} built asset path(s), cache tag ${buildTag}`);
