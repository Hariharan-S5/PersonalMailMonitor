import fs from 'fs';

const file = 'c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add `isSubscriptionVerified`
if (!content.includes('isSubscriptionVerified: localStorage')) {
  // Try to find the subscriptionType line
  const searchStr = "subscriptionType: 'Elite',";
  const replaceStr = "isSubscriptionVerified: localStorage.getItem('isSubscriptionVerified') === 'true',\n  subscriptionType: 'Elite',";
  
  if (content.includes(searchStr)) {
      content = content.replace(searchStr, replaceStr);
      console.log("Added isSubscriptionVerified state.");
  } else {
      console.log("Failed to find subscriptionType state.");
  }
}

// 2. Patch fetchEmails
if (!content.includes('isSubscriptionVerified } = get();')) {
  // Try replacing with regex for flexible spacing/newlines
  content = content.replace(
      /fetchEmails:\s*async\s*\(\)\s*=>\s*\{\s*const\s*\{\s*user,\s*accessToken\s*\}\s*=\s*get\(\);\s*console\.log\("Fetching emails for:",\s*user\?\.email,\s*"with token:",\s*!!accessToken\);\s*if\s*\(!user\s*\|\|\s*!accessToken\)\s*\{/,
      `fetchEmails: async () => {
    const { user, accessToken, isSubscriptionVerified } = get();
    console.log("Fetching emails for:", user?.email, "with token:", !!accessToken, "verified:", isSubscriptionVerified);
    if (!user || !accessToken || !isSubscriptionVerified) {`
  );
  console.log("Patched fetchEmails.");
}

fs.writeFileSync(file, content, 'utf8');
console.log("Patch V3 applied.");
