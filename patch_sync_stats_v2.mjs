import fs from 'fs';

const file = 'c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js';
const content = fs.readFileSync(file, 'utf8');

const syncStatsReplacement = `
  syncStats: async () => {
    const { user, accessToken, isLoading, subscriptionType } = get();
    if (!user || !accessToken || isLoading) return;

    const tierOrder = { 'Basic': 0, 'Pro': 1, 'Elite': 2 };
    const currentTier = tierOrder[subscriptionType] || 0;
    const isPro = currentTier >= 1;
    const isElite = currentTier >= 2;

    try {
      // 1. Core Profile & Security alerts
      const [labels, dailyStatsResult, securityAlertsResult, purchaseCount] = await Promise.all([
        emailService.getLabels(accessToken),
        emailService.getDailyStats(accessToken),
        emailService.getSecurityAlerts(accessToken),
        emailService.getSearchCount(accessToken, 'purchase OR order OR receipt')
      ]);

      // 2. Discovery Emails in batches
      const discoveryTasks = [];
      if (isPro) {
        discoveryTasks.push(
          () => emailService.getSearchCount(accessToken, '(subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "sent" OR "paid")) AND (food OR delivery OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR foodhub OR dominos)'),
          () => emailService.getEmails(accessToken, user.email, '(subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "sent" OR "paid")) AND (food OR delivery OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR foodhub OR dominos)', 50),
          () => emailService.getEmails(accessToken, user.email, '(subject:(order OR receipt OR invoice OR bill OR ticket OR booking OR reservation OR itinerary OR confirmation OR "sent" OR "paid")) AND (travel OR flight OR hotel OR cab OR taxi OR uber OR ola OR lyft OR indigo OR "air india" OR spicejet OR vistar OR makemytrip OR airbnb OR booking.com)', 50),
          () => emailService.getEmails(accessToken, user.email, '(subject:(order OR "your order" OR receipt OR invoice OR bill OR "payment received" OR "sent" OR "paid" OR delivery OR "out for delivery" OR delivered)) AND (amazon OR flipkart OR myntra OR ajio OR nykaa OR meesho OR tatacliq OR lenskart OR decathlon OR reliance OR croma OR shopping)', 50),
          () => emailService.getEmails(accessToken, user.email, '(subject:(subscription OR renewal OR membership OR bill OR receipt OR invoice OR "payment received" OR "sent" OR "paid")) AND (netflix OR spotify OR youtube OR "amazon prime" OR "disney+" OR hotstar OR premium OR cloud OR icloud OR "google one" OR canva OR adobe OR chatgpt OR openai)', 50),
          () => emailService.getEmails(accessToken, user.email, '(subject:(recharge OR prepaid OR postpaid OR bill OR payment) AND (jio OR airtel OR vi OR bsnl OR vodafone OR idea))', 20),
          () => emailService.getEmails(accessToken, user.email, '(subject:(bill OR invoice OR receipt OR payment) AND (electricity OR water OR gas OR broadband OR wifi OR internet OR dth OR utility OR bescom OR msedcl OR adani OR tata OR act OR hathway OR jiofiber OR airtel))', 20),
          () => emailService.getEmails(accessToken, user.email, '(from:(phonepe OR paytm OR google) OR subject:("paid to" OR "sent rs" OR "paid rs"))', 100),
          () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")', 50)
        );
      }

      if (isElite) {
        discoveryTasks.push(
          () => emailService.getEmails(accessToken, user.email, 'subject:(candidate OR applicant OR "applied for" OR "new application" OR "interview scheduled" OR "offer accepted")', 50),
          () => emailService.getEmails(accessToken, user.email, 'subject:(order OR invoice OR receipt OR payment OR shipped OR canceled OR "new order" OR "payment received")', 50),
          () => emailService.getEmails(accessToken, user.email, 'subject:(alert OR security OR warning OR critical OR error OR "system alert" OR "new login" OR "password changed")', 50)
        );
      }

      let discoveryResults = [];
      if (discoveryTasks.length > 0) {
        discoveryResults = await emailService.batchPromises(discoveryTasks, 2);
      }

      let idx = 0;
      const foodOrdersCount = isPro ? discoveryResults[idx++] : 0;
      const foodEmailDetails = isPro ? discoveryResults[idx++] : [];
      const travelEmailDetails = isPro ? discoveryResults[idx++] : [];
      const purchaseEmailDetails = isPro ? discoveryResults[idx++] : [];
      const subscriptionEmailDetails = isPro ? discoveryResults[idx++] : [];
      const mobileRechargeEmailDetails = isPro ? discoveryResults[idx++] : [];
      const billingEmailDetails = isPro ? discoveryResults[idx++] : [];
      const paymentAppEmailDetails = isPro ? discoveryResults[idx++] : [];
      const jobSearchEmailDetails = isPro ? discoveryResults[idx++] : [];
      const hrEmailDetails = isElite ? discoveryResults[idx++] : [];
      const businessEmailDetails = isElite ? discoveryResults[idx++] : [];
      const alertEmailDetails = isElite ? discoveryResults[idx++] : [];

      const emptyFood = { calculatedFoodSpend: 0, foodPlatformSpend: [] };
      const emptyTravel = { calculatedTravelSpend: 0, travelPlatformSpend: [] };
      const emptyPurchase = { calculatedPurchaseSpend: 0, purchasePlatformSpend: [], purchaseTransactions: [] };
      const emptySubscription = { calculatedSubscriptionSpend: 0, subscriptionPlatformSpend: [], subscriptionTransactions: [] };
      const emptyMobile = { calculatedMobileRechargeSpend: 0, mobileRechargePlatformSpend: [], mobileRechargeTransactions: [] };
      const emptyBilling = { calculatedBillingSpend: 0, billingPlatformSpend: [], billingTransactions: [] };
      const emptyPayment = { calculatedPaymentAppSpend: 0, paymentAppPlatformSpend: [] };
      const emptyJob = { applicationsCount: 0, interviewsCount: 0, offersCount: 0, rejectionsCount: 0, followUpsCount: 0, tableData: [], weeklyData: [] };
      const emptyHr = { totalEmails: 0, activeDiscussions: 0, pendingActions: 0, positiveSentiment: 0, alerts: [], recentActivity: [] };
      const emptyBusiness = { revenue: 0, expenses: 0, netProfit: 0, activeClients: 0, invoices: [], alerts: [], transactions: [] };
      const emptyAlert = { totalAlerts: 0, criticalAlerts: 0, warnings: 0, resolved: 0, alertData: [] };

      const [
        { calculatedFoodSpend, foodPlatformSpend: newFoodPlatformSpend },
        { calculatedTravelSpend, travelPlatformSpend: newTravelPlatformSpend },
        { calculatedPurchaseSpend, purchasePlatformSpend: newPurchasePlatformSpend, purchaseTransactions: newPurchaseTransactions },
        { calculatedSubscriptionSpend: newSubscriptionSpend, subscriptionPlatformSpend: newSubscriptionPlatformSpend, subscriptionTransactions: newSubscriptionTransactions },
        { calculatedMobileRechargeSpend: newMobileRechargeSpend, mobileRechargePlatformSpend: newMobileRechargePlatformSpend, mobileRechargeTransactions: newMobileRechargeTransactions },
        { calculatedBillingSpend: newBillingSpend, billingPlatformSpend: newBillingPlatformSpend, billingTransactions: newBillingTransactions },
        newPaymentAppSpend,
        newJobSearchStats,
        newHrStats,
        newBusinessStats,
        newAlertStats
      ] = await Promise.all([
        isPro ? processFoodInsight(foodEmailDetails, accessToken, emailService) : emptyFood,
        isPro ? processTravelInsight(travelEmailDetails, accessToken, emailService) : emptyTravel,
        isPro ? processPurchaseInsight(purchaseEmailDetails, accessToken, emailService) : emptyPurchase,
        isPro ? processSubscriptionInsight(subscriptionEmailDetails, accessToken, emailService) : emptySubscription,
        isPro ? processMobileRechargeInsight(mobileRechargeEmailDetails, accessToken, emailService) : emptyMobile,
        isPro ? processBillingInsight(billingEmailDetails, accessToken, emailService) : emptyBilling,
        isPro ? processPaymentAppInsight(paymentAppEmailDetails) : emptyPayment,
        isPro ? processJobSearchInsight(jobSearchEmailDetails) : emptyJob,
        isElite ? processHRInsight(hrEmailDetails) : emptyHr,
        isElite ? processBusinessInsight(businessEmailDetails) : emptyBusiness,
        isElite ? processAlertInsight(alertEmailDetails) : emptyAlert
      ]);

      // --- Process Device Detection ---
      const deviceSet = new Set(['Desktop']);
      if (Array.isArray(securityAlertsResult)) {
        securityAlertsResult.forEach(alert => {
          const snippet = alert.snippet || '';
          const match = snippet.match(/on\\s+a\\s+new\\s+([A-Za-z0-9\\s]+?)(?=\\s+device|\\s+at|\\s+from|$)/i) ||
            snippet.match(/from\\s+a\\s+new\\s+([A-Za-z0-9\\s]+?)(?=\\s+device|$)/i) ||
            snippet.match(/on\\s+([A-Za-z0-9\\s]+?)(?=\\s+device|\\s+at|\\s+from|$)/i);
          if (match && match[1]) {
            const deviceName = match[1].trim();
            if (deviceName.length > 1 && deviceName.length < 30) {
              deviceSet.add(deviceName);
            }
          }
        });
      }
      const detectedDevices = deviceSet.size;

      set({
        labelStats: labels,
        dailyStats: dailyStatsResult,
        securityAlerts: securityAlertsResult,
        deviceCount: detectedDevices,
        foodOrders: foodOrdersCount,
        foodSpend: calculatedFoodSpend,
        foodPlatformSpend: newFoodPlatformSpend,
        travelSpend: calculatedTravelSpend,
        travelPlatformSpend: newTravelPlatformSpend,
        purchaseSpend: calculatedPurchaseSpend,
        purchasePlatformSpend: newPurchasePlatformSpend,
        purchaseTransactions: newPurchaseTransactions,
        purchaseCount,
        subscriptionSpend: newSubscriptionSpend,
        subscriptionPlatformSpend: newSubscriptionPlatformSpend,
        subscriptionTransactions: newSubscriptionTransactions,
        mobileRechargeSpend: newMobileRechargeSpend,
        mobileRechargePlatformSpend: newMobileRechargePlatformSpend,
        mobileRechargeTransactions: newMobileRechargeTransactions,
        billingSpend: newBillingSpend,
        billingPlatformSpend: newBillingPlatformSpend,
        billingTransactions: newBillingTransactions,
        paymentAppSpend: newPaymentAppSpend,
        jobSearchStats: newJobSearchStats,
        hrStats: newHrStats,
        businessStats: newBusinessStats,
        alertStats: newAlertStats,
        error: null
      });
      console.log("Lightweight stats sync successful");
    } catch (error) {
      console.error("Failed to sync stats:", error);
      if (error.message?.includes('401') || error.status === 401) {
        localStorage.removeItem('google_access_token');
        set({ accessToken: null, error: 'Your session has expired. Please sign in again to continue.' });
      }
    }
  },`;

// Find position to replace
const startMarker = '  syncStats: async () => {';
const endMarker = '  addAccount: (account) => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + syncStatsReplacement.trim() + '\\n  },\\n\\n' + content.substring(endIndex);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('Successfully patched syncStats!');
} else {
  console.log('Failed to find markers.');
}
