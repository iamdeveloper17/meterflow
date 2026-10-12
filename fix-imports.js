// fix-imports.js
const fs = require('fs');
const path = require('path');

const dirs = [
  'apps/api/src',
  'apps/worker/src',
  'packages/shared/src',
];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      callback(filepath);
    }
  }
}

let totalFixed = 0;

for (const dir of dirs) {
  walk(dir, (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // Fix relative imports: add .js extension
    const newContent = content.replace(
      /from\s+['"](\.[^'"]+)['"]/g,
      (match, importPath) => {
        // Skip if already has extension
        if (importPath.endsWith('.js') || importPath.endsWith('.json') || importPath.endsWith('.css')) {
          return match;
        }
        modified = true;
        return `from '${importPath}.js'`;
      }
    );

    if (modified) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filepath}`);
      totalFixed++;
    }
  });
}

console.log(`\n🎉 Total files fixed: ${totalFixed}`);