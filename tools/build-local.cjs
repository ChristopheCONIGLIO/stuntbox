const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'js', 'local');
const check = process.argv.includes('--check');
const modules = {};
const seen = new Set();
const encode = src => 'data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64');

function write(name, content) {
  const file = path.join(out, name);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
      throw new Error('Offline bundle out of date: ' + name);
    }
  } else {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(file, content);
  }
}

function visit(file) {
  if (seen.has(file)) return;
  seen.add(file);
  let src = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.startsWith('vendor/')) {
    const id = 'apex/' + file;
    write(path.basename(file), 'globalThis.stuntboxImports[' + JSON.stringify(id) + ']=' + JSON.stringify(encode(src)) + ';\n');
    return;
  }
  if (!file.startsWith('js/')) throw new Error('Unexpected module: ' + file);
  src = src.replace(/(\bfrom\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_, prefix, quote, specifier) => {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    visit(resolved);
    return prefix + quote + (resolved.startsWith('vendor/') ? 'apex/' : 'stuntbox/') + resolved + quote;
  });
  modules['stuntbox/' + file] = encode(src);
}

visit('js/ui/workshop.js');
const ordered = Object.fromEntries(Object.entries(modules).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
write('modules.js', 'Object.assign(globalThis.stuntboxImports,' + JSON.stringify(ordered) + ');\n');
console.log((check ? 'Verified ' : 'Bundled ') + Object.keys(ordered).length + ' application modules.');
