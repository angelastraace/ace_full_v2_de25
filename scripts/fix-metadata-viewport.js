// scripts/fix-metadata-viewport.js
// Usage: node scripts/fix-metadata-viewport.js path/to/file1.tsx path/to/file2.tsx ...
// Creates .bak backups. Conservative - prints warnings if it can't find or safely update metadata.

const fs = require('fs');
const path = require('path');

function findMatchingBraceIndex(str, startIndex) {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseViewportString(vstr) {
  // vstr like: width=device-width, initial-scale=1.0, maximum-scale=5
  const obj = {};
  vstr.split(',').map(s => s.trim()).forEach(pair => {
    if (!pair) return;
    const [k, v] = pair.split('=').map(x => x && x.trim());
    if (!k) return;
    if (k === 'width') {
      obj.width = v === 'device-width' ? 'device-width' : v;
    } else if (k === 'initial-scale' || k === 'initialScale') {
      const num = parseFloat(v);
      if (!Number.isNaN(num)) obj.initialScale = num;
    } else if (k === 'maximum-scale' || k === 'maximumScale') {
      const num = parseFloat(v);
      if (!Number.isNaN(num)) obj.maximumScale = num;
    } else {
      // keep raw with camelCase fallback
      const key = k.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      const num = parseFloat(v);
      obj[key] = Number.isNaN(num) ? v : num;
    }
  });
  return obj;
}

function buildViewportExport(viewObj, themeColor) {
  const parts = [];
  Object.keys(viewObj).forEach(k => {
    const val = viewObj[k];
    if (typeof val === 'number') parts.push(`  ${k}: ${val}`);
    else parts.push(`  ${k}: '${val}'`);
  });
  if (themeColor) parts.push(`  themeColor: '${themeColor}'`);
  return `export const viewport = {\n${parts.join(',\n')}\n};\n\n`;
}

function updateFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const metaKey = 'export const metadata';
  const idx = src.indexOf(metaKey);
  if (idx === -1) {
    console.warn(`[SKIP] metadata export not found in ${filePath}`);
    return false;
  }

  const startObj = src.indexOf('{', idx);
  if (startObj === -1) {
    console.warn(`[SKIP] could not find metadata object start in ${filePath}`);
    return false;
  }
  const endObj = findMatchingBraceIndex(src, startObj);
  if (endObj === -1) {
    console.warn(`[SKIP] could not find matching brace for metadata in ${filePath}`);
    return false;
  }

  const metadataBlock = src.slice(idx, endObj + 1); // includes export const metadata = { ... }
  // Extract inside object text
  const inner = src.slice(startObj + 1, endObj).trim();

  // find viewport line(s) and themeColor
  // Simple heuristics:
  const viewportRegexString = /viewport\s*:\s*(['"`])([^'"`]+)\1\s*,?/m;
  const viewportObjRegex = /viewport\s*:\s*{([\s\S]*?)}\s*,?/m;
  const themeColorRegex = /themeColor\s*:\s*(['"`])([^'"`]+)\1\s*,?/m;

  let viewportMatch = inner.match(viewportRegexString);
  let viewportObjMatch = inner.match(viewportObjRegex);
  let themeMatch = inner.match(themeColorRegex);

  let viewportObj = null;
  let themeColor = null;

  if (themeMatch) {
    themeColor = themeMatch[2].trim();
  }

  if (viewportMatch) {
    // string form
    const vstr = viewportMatch[2].trim();
    viewportObj = parseViewportString(vstr);
  } else if (viewportObjMatch) {
    // object form - attempt to extract simple key: value pairs
    const objBody = viewportObjMatch[1];
    // naive parse of simple lines like width: 'device-width', initialScale: 1
    const pairs = objBody.split(',').map(s => s.trim()).filter(Boolean);
    viewportObj = {};
    pairs.forEach(p => {
      const m = p.match(/([A-Za-z0-9_$-]+)\s*:\s*(.+)$/);
      if (m) {
        const key = m[1].replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        let val = m[2].trim().replace(/,$/, '');
        if (/^['"`].*['"`]$/.test(val)) val = val.slice(1, -1);
        else if (!Number.isNaN(Number(val))) val = Number(val);
        viewportObj[key] = val;
      }
    });
  }

  if (!viewportObj && !themeColor) {
    console.warn(`[SKIP] no viewport or themeColor found to move in ${filePath}`);
    return false;
  }

  // Remove viewport and themeColor lines from the metadata block text
  let newInner = inner
    .replace(viewportRegexString, '')
    .replace(viewportObjRegex, '')
    .replace(themeColorRegex, '');

  // cleanup trailing commas / formatting: collapse duplicate commas
  newInner = newInner.replace(/,\s*,/g, ',').replace(/,\s*}/g, '\n}');

  // Reassemble metadata export
  const before = src.slice(0, startObj + 1);
  const afterMeta = src.slice(endObj); // includes closing brace and rest

  const newMetadata = `${before}\n${newInner}\n`;

  // find closing '};' (endObj is index of closing brace). Ensure next char is maybe ; or not.
  // We'll insert the rest starting from endObj
  const rest = src.slice(endObj + 1);

  const viewportExport = buildViewportExport(viewportObj || {}, themeColor);

  const updated = src.slice(0, idx) + newMetadata + '\n' + '}' + rest; // keep the original closing brace/state
  // Now we must insert the viewport export right after the metadata block end. Find the end of the metadata export ending line.
  // Find the index of the metadata block end by searching from idx for the first occurrence of '};' after startObj
  const metaEndIdx = (() => {
    const search = src.indexOf('};', startObj);
    if (search !== -1) return search + 2;
    // fallback: use endObj+1
    return endObj + 1;
  })();

  // Build final content: src before metaEndIdx, then ensure a semicolon, newline, add viewportExport, then rest
  const beforeMetaEnd = src.slice(0, metaEndIdx).replace(/\s+$/,'') + '\n\n';
  const afterMetaEnd = src.slice(metaEndIdx);

  const finalContents = beforeMetaEnd + viewportExport + afterMetaEnd;

  // backup
  fs.copyFileSync(filePath, filePath + '.bak');
  fs.writeFileSync(filePath, finalContents, 'utf8');
  console.log(`[OK] updated ${filePath} (backup: ${path.basename(filePath)}.bak)`);
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: node scripts/fix-metadata-viewport.js file1.tsx file2.tsx ...');
    process.exit(1);
  }
  args.forEach(fp => {
    try {
      updateFile(fp);
    } catch (err) {
      console.error(`[ERR] ${fp}:`, err.message || err);
    }
  });
}
