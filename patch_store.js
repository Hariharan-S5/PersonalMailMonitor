const fs = require('fs');
const file = 'c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add `isSubscriptionVerified` state
content = content.replace(
  /error: null,([\s]+)subscriptionType: '(Basic|Pro|Elite)',/g,
  `error: null,
  isSubscriptionVerified: localStorage.getItem('isSubscriptionVerified') === 'true',
  subscriptionType: '$2',`
);

// 2. Add `verifySubscription` and `applyLuckyCoupon` actions near `upgradeSubscription`
content = content.replace(
  /upgradeSubscription: \(type\) => set\(\{ subscriptionType: type \}\),/g,
  `upgradeSubscription: (type) => set({ subscriptionType: type }),
  verifySubscription: () => {
    localStorage.setItem('isSubscriptionVerified', 'true');
    set({ isSubscriptionVerified: true });
    get().fetchEmails();
  },
  applyLuckyCoupon: (code) => {
    if (code === 'ELITE@2026#STAR') {
      localStorage.setItem('isSubscriptionVerified', 'true');
      set({ isSubscriptionVerified: true, subscriptionType: 'Elite' });
      get().fetchEmails();
      return true;
    }
    return false;
  },`
);

// 3. Gate `fetchEmails`
content = content.replace(
  /const \{ user, accessToken \} = get\(\);([\s]+)console\.log\("Fetching emails for:", user\?\.email, "with token:", !!accessToken\);([\s]+)if \(!user \|\| !accessToken\) \{/g,
  `const { user, accessToken, isSubscriptionVerified } = get();$1console.log("Fetching emails for:", user?.email, "with token:", !!accessToken, "verified:", isSubscriptionVerified);$2if (!user || !accessToken || !isSubscriptionVerified) {`
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patch applied successfully.");
