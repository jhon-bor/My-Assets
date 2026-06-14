const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'src/i18n/index.ts'), 'utf8');

// Find all language blocks
const langBlockRegex = /\n  (zh|en|ja|fr|es|pt|de|it): \{\n([\s\S]*?)\n  \},/g;
let m;
const langs = {};

while ((m = langBlockRegex.exec(content)) !== null) {
  const lang = m[1];
  const block = m[2];
  // Parse key-value pairs, handling escaped characters
  const kvRegex = /"([^"]+)": "((?:[^"\\]|\\.)*)"/g;
  const kv = {};
  let km;
  while ((km = kvRegex.exec(block)) !== null) {
    kv[km[1]] = km[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');
  }
  langs[lang] = kv;
  console.log(`${lang}: ${Object.keys(kv).length} keys`);
}

// Write each language to a separate JSON file
const outDir = path.join(__dirname, '..', 'src/i18n/locales');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const [lang, dict] of Object.entries(langs)) {
  fs.writeFileSync(
    path.join(outDir, `${lang}.json`),
    JSON.stringify({ common: dict }, null, 2)
  );
  console.log(`Wrote ${lang}.json`);
}