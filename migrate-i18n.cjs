const fs = require('fs');
const langs = ['zh','en','ja','fr','es','pt','de','it'];

// Strip the namespace prefix from keys so nav.json has "home" not "nav.home"
// Result: t('nav:home') instead of t('nav:nav.home')
langs.forEach(lang => {
  const data = JSON.parse(fs.readFileSync('src/i18n/locales/' + lang + '.json', 'utf8'));
  const common = data.common || {};

  // Group by namespace (first segment)
  const groups = {};
  for (const [key, val] of Object.entries(common)) {
    const dot = key.indexOf('.');
    const ns = dot > 0 ? key.slice(0, dot) : 'common';
    const shortKey = dot > 0 ? key.slice(dot + 1) : key;
    if (!groups[ns]) groups[ns] = {};
    groups[ns][shortKey] = val;
  }

  for (const [ns, values] of Object.entries(groups)) {
    const path = 'public/locales/' + lang + '/' + ns + '.json';
    fs.writeFileSync(path, JSON.stringify(values, null, 2));
    console.log(lang + '/' + ns + '.json: ' + Object.keys(values).length + ' keys');
  }
});
console.log('Flattened migration done');