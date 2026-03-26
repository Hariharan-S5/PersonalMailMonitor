import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/store/useEmailStore.js';
const raw = readFileSync(filePath, 'utf8');

// Normalise to LF for processing
const useCRLF = raw.includes('\r\n');
const content = raw.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find the `return {` inside create() callback (after line 1288, 0-indexed)
let inReturn = false;
let returnStart = -1;
let depth = 0;
let returnEnd = -1;

for (let i = 1288; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (!inReturn && trimmed === 'return {') {
    inReturn = true;
    returnStart = i;
    depth = 1;
    continue;
  }
  if (inReturn) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) {
      returnEnd = i;
      break;
    }
  }
}

console.log(`Return block: lines ${returnStart + 1} to ${returnEnd + 1}`);
if (returnStart === -1 || returnEnd === -1) {
  console.error('Could not find return block!');
  process.exit(1);
}

// Fix: any line inside the return block that starts with exactly 2 spaces 
// (key/action at top-level of return {}), add 2 more spaces to normalize to 4.
let fixedCount = 0;
for (let i = returnStart + 1; i < returnEnd; i++) {
  const line = lines[i];
  if (/^  [^ ]/.test(line)) {
    lines[i] = '  ' + line;
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} lines.`);
let result = lines.join('\n');
if (useCRLF) result = result.replace(/\n/g, '\r\n');
writeFileSync(filePath, result, 'utf8');
console.log('Written successfully.');
