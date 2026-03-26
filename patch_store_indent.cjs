const fs = require('fs');
const file = './src/store/useEmailStore.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');

let fixed = 0;
// lines 1575 to 1978 (0-indexed)
// actually, let's just use regex on the whole range 1576 to 1980
for (let i = 1575; i <= 1980; i++) {
  if (lines[i].startsWith('  ') && !lines[i].startsWith('    ') && lines[i].trim() !== '') {
    lines[i] = '  ' + lines[i]; // add 2 spaces to make it 4
    fixed++;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log(`Fixed ${fixed} lines`);
