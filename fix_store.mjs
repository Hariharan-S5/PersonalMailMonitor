import fs from 'fs';

const file = 'c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js';
const content = fs.readFileSync(file, 'utf8');

// The orphaned old fetchEmails body starts right after the new fetchEmails closes with "},\n\n\n"
// We need to remove everything between the new fetchEmails end marker and syncStats:
// Find the pattern: starts with blank lines then old discovery code, ends with "  }," before "  syncStats:"

// Strategy: find the span between "  },\n\n\n\n\n\n" (end of new fetchEmails) and "  syncStats:"
// and remove the orphaned code between them.

// The new fetchEmails ends with:
const startMarker = '  },\n\r\n\r\n\r\n\r\n\r\n\r\n        () => emailService.getEmails(accessToken, user.email, \'(redbus';
const endMarker = '  syncStats: async () => {';

// Let's find the end of the new fetchEmails function and start of syncStats
// The new fetchEmails ends with:  },  then blank lines then old orphaned code then   },  then syncStats

// Simpler: use regex to find and remove the block between the two "  }," separators
// The orphaned block starts after a series of blank lines following the new fetchEmails closing
// and ends with "  }," right before "  syncStats:"

const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Find line index of "  syncStats: async () => {"
const syncStatsIdx = lines.findIndex(l => l.trim().startsWith('syncStats: async () =>'));
console.log('syncStats at line:', syncStatsIdx + 1);

// Find the line index of the last "  }," before syncStats
let endOfOldFetch = -1;
for (let i = syncStatsIdx - 1; i >= 0; i--) {
  if (lines[i].trim() === '},') {
    endOfOldFetch = i;
    break;
  }
}
console.log('End of old fetch body at line:', endOfOldFetch + 1);

// Find the line index of the first "  }," that marks end of new fetchEmails
// Go backward from endOfOldFetch
let endOfNewFetch = -1;
for (let i = endOfOldFetch - 1; i >= 0; i--) {
  if (lines[i].trim() === '},') {
    endOfNewFetch = i;
    break;
  }
}
console.log('End of new fetch body at line:', endOfNewFetch + 1);

// Delete lines from (endOfNewFetch+1) to (endOfOldFetch) inclusive
// That removes the orphaned old code
const newLines = [
  ...lines.slice(0, endOfNewFetch + 1),
  '',
  ...lines.slice(endOfOldFetch + 1)
];

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('Done. New total lines:', newLines.length);
