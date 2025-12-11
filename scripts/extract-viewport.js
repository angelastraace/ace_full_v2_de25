/*
  Safe extractor: finds `export const metadata = { ... }` and extracts
  `viewport: ...` (object or string) into a top-level `export const viewport = ...`.
  Makes a .bak copy before modifying.
*/
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/extract-viewport.js <file1> <file2> ...');
  process.exit(2);
}

const METADATA_RE = /export\s+const\s+metadata\s*=\s*{([\s\S]*?)\n}\s*;?/m;
const VIEWPORT_RE = /viewport\s*:\s*({[\s\S]*?}|"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')\s*,?/m;

for (const f of files) {
  try {
    const full = path.resolve(f);
    const src = fs.readFileSync(full, 'utf8');
    const metaMatch = src.match(METADATA_RE);
    if (!metaMatch) {
      console.log(`[SKIP] no metadata block found: ${f}`);
      continue;
    }

    const metaBody = metaMatch[1];
    const vpMatch = metaBody.match(VIEWPORT_RE);
    if (!vpMatch) {
      console.log(`[SKIP] no viewport inside metadata: ${f}`);
      continue;
    }

    const viewportValue = vpMatch[1].trim();

    // Remove the viewport property from the metadata body
    const newMetaBody = metaBody.replace(VIEWPORT_RE, '').replace(/\n\s*\n/g, '\n'); // tidy double blank lines

    // Reconstruct metadata block (preserve surrounding braces and trailing semicolon)
    const before = src.slice(0, metaMatch.index);
    const after = src.slice(metaMatch.index + metaMatch[0].length);

    const newMetadataBlock = `export const metadata = {${newMetaBody}\n};\n\n`;

    // Prepare viewport export; keep value as-is (object or string)
    const newViewportExport = `export const viewport = ${viewportValue};\n\n`;

    // Make a backup
    fs.writeFileSync(full + '.bak', src, 'utf8');
    // Write new file
    fs.writeFileSync(full, before + newMetadataBlock + newViewportExport + after, 'utf8');

    console.log(`[OK] updated: ${f} (backup: ${f}.bak)`);
  } catch (err) {
    console.error(`[ERR] ${f}:`, err.message || err);
  }
}
