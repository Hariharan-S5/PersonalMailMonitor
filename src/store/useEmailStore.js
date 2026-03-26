import { create } from "zustand";
import { emailService } from "../services/emailService";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { extractTextFromPdf, parseAmountFromInvoiceText } from "../utils/pdfParser";

// --- Persistence Helpers ---
const STORAGE_KEY = "pmm_email_data_cache";

const saveToCache = (data) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const updated = { ...existing, ...data, lastCached: Date.now() };
    
    // Prune logic: If data is getting too large, limit the number of emails stored per page
    if (updated.emailsByPage) {
      Object.keys(updated.emailsByPage).forEach(pageId => {
        if (updated.emailsByPage[pageId].length > 100) {
          updated.emailsByPage[pageId] = updated.emailsByPage[pageId].slice(0, 100);
        }
      });
    }
    if (updated.emails && updated.emails.length > 100) {
      updated.emails = updated.emails.slice(0, 100);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaError) {
      console.warn("Storage quota exceeded, saving essential items only...");
      // Critical items only: filters, settings
      const essential = { ...existing, ...data };
      delete essential.emails;
      delete essential.emailsByPage;
      delete essential.securityAlerts;
      delete essential.securityAlertsByPage;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(essential));
      } catch (innerError) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn("Failed to save to local cache:", e);
  }
};

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.warn("Failed to load from local cache:", e);
    return null;
  }
};

/**
 * Processes food delivery emails to extract total spend and platform breakdown.
 */
function normalizePlatformName(rawName) {
  if (!rawName) return "Other";
  let name = rawName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const upper = name.toUpperCase();
  if (upper.includes("AMAZON")) return "Amazon";
  if (upper.includes("FLIPKART")) return "Flipkart";
  if (upper.includes("MYNTRA")) return "Myntra";
  if (upper.includes("ZOMATO")) return "Zomato";
  if (upper.includes("SWIGGY")) return "Swiggy";
  if (upper.includes("UBER")) return "Uber";
  if (upper.includes("OLA")) return "Ola";
  if (upper.includes("RAPIDO")) return "Rapido";
  if (upper.includes("REDBUS")) return "RedBus";
  if (upper.includes("INDIGO")) return "IndiGo";
  if (upper.includes("IRCTC")) return "IRCTC";
  return name;
}

// --- Query Builder Helper ---
/**
 * Converts globalDateFilter into a Gmail query string (e.g., "after:2024/03/01")
 */
function buildGmailQuery(filter) {
  if (!filter || filter.type === 'all' || (filter.type === 'preset' && filter.preset === 'all')) {
    return { query: null, afterDate: null, beforeDate: null };
  }

  let afterDate = null;
  let beforeDate = null;

  if (filter.type === 'preset') {
    const now = new Date();
    
    if (filter.preset === 'today') {
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter.preset === '24h') {
      afterDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (filter.preset === 'yesterday') {
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      beforeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (filter.preset === 'day_before') {
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      beforeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
    } else if (filter.preset === 'this_week') {
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    } else if (filter.preset === 'last_week') {
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      afterDate = new Date(startOfThisWeek);
      afterDate.setDate(afterDate.getDate() - 7);
      beforeDate = new Date(startOfThisWeek.getTime() - 1);
    } else if (filter.preset === 'this_month') {
      afterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter.preset === 'last_month') {
      afterDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      beforeDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (filter.preset === 'this_year') {
      afterDate = new Date(now.getFullYear(), 0, 1);
    } else if (filter.preset === 'last_year') {
      afterDate = new Date(now.getFullYear() - 1, 0, 1);
      beforeDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
      const map = { 
        '1d': 1, '2d': 2, '3d': 3, '7d': 7, '14d': 14, '30d': 30, 
        '1m': 30, '90d': 90, 'qm': 90, '180d': 180, '365d': 365 
      };
      const days = map[filter.preset] || 0;
      if (days > 0) {
        afterDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      }
    }
  } else if (filter.type === 'custom') {
    if (filter.startDate) afterDate = new Date(filter.startDate);
    if (filter.endDate) beforeDate = new Date(filter.endDate);
  }

  const parts = [];
  if (afterDate) {
    const epochSecs = Math.floor(afterDate.getTime() / 1000);
    parts.push(`after:${epochSecs}`);
  }
  if (beforeDate) {
    const epochSecs = Math.floor(beforeDate.getTime() / 1000);
    parts.push(`before:${epochSecs}`);
  }
  if (parts.length > 0) {
    parts.push('-in:spam -in:trash');
  }

  const query = parts.length > 0 ? parts.join(' ') : null;
  return { query, afterDate, beforeDate };
}

/**
 * Shared logic to apply a date filter (preset or custom) to any list of emails/alerts.
 */
function applyDateFilterToList(list, filter) {
  if (!filter || filter.type === 'all' || (filter.type === 'preset' && filter.preset === 'all')) {
    return list;
  }

  const { type, preset, mode, startDate, endDate } = filter;
  const now = new Date();
  const d = (e) => {
    if (e.date) return new Date(e.date);
    if (e.internalDate) return new Date(parseInt(e.internalDate));
    return new Date();
  };

  if (type === 'preset') {
    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return list.filter(e => d(e) >= start);
    } else if (preset === '24h') {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return list.filter(e => d(e) >= cutoff);
    } else if (preset === 'yesterday') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return list.filter(e => { const dt = d(e); return dt >= start && dt <= end; });
    } else if (preset === 'day_before') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
      return list.filter(e => { const dt = d(e); return dt >= start && dt <= end; });
    } else if (preset === 'this_week') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      return list.filter(e => d(e) >= start);
    } else if (preset === 'last_week') {
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const start = new Date(startOfThisWeek); start.setDate(start.getDate() - 7);
      return list.filter(e => { const dt = d(e); return dt >= start && dt < startOfThisWeek; });
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return list.filter(e => d(e) >= start);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return list.filter(e => { const dt = d(e); return dt >= start && dt <= end; });
    } else if (preset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      return list.filter(e => d(e) >= start);
    } else if (preset === 'last_year') {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return list.filter(e => { const dt = d(e); return dt >= start && dt <= end; });
    } else {
      const dayMap = { '1d': 1, '2d': 2, '3d': 3, '7d': 7, '14d': 14, '30d': 30, '1m': 30, '90d': 90, 'qm': 90, '180d': 180, '365d': 365 };
      const days = dayMap[preset];
      if (days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return list.filter(e => d(e) >= cutoff);
      }
    }
  } else if (type === 'custom') {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (mode === 'after' && start) return list.filter(e => d(e) >= start);
    else if (mode === 'before' && start) return list.filter(e => d(e) <= start);
    else if (mode === 'between' && start && end) return list.filter(e => { const dt = d(e); return dt >= start && dt <= end; });
  }

  return list;
}

// --- Spend Extraction Helpers (Modularity) ---

/**
 * Processes food delivery emails to extract total spend and platform breakdown.
 */
async function processFoodInsight(emails, accessToken, emailService) {
  let calculatedFoodSpend = 0;
  const foodPlatformSpend = {};
  const foodTransactions = [];
  const confirmedFoodEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  for (const email of confirmedFoodEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();

    const platforms = [
      { name: "Swiggy", keywords: /swiggy/, domains: ["swiggy.com"] },
      { name: "Zomato", keywords: /zomato/, domains: ["zomato.com"] },
      {
        name: "Domino's",
        keywords: /domino/,
        domains: ["dominos.co.in", "dominos.com"],
      },
      {
        name: "McDonald's",
        keywords: /mcdonald|mcdonalds/,
        domains: ["mcdonalds.com"],
      },
      {
        name: "Pizza Hut",
        keywords: /pizza hut|pizzahut/,
        domains: ["pizzahut.co.in", "pizzahut.com"],
      },
      { name: "KFC", keywords: /\bkfc\b/, domains: ["kfc.co.in", "kfc.com"] },
      {
        name: "Uber Eats",
        keywords: /uber eats|ubereats/,
        domains: ["ubereats.com"],
      },
      { name: "Starbucks", keywords: /starbucks/, domains: ["starbucks.com"] },
      { name: "Dunzo Food", keywords: /dunzo/, domains: ["dunzo.in"] },
      { name: "Faasos", keywords: /faasos/, domains: ["faasos.com"] },
      {
        name: "Behrouz Biryani",
        keywords: /behrouz/,
        domains: ["behrouzb biryani.com"],
      },
      { name: "FreshMenu", keywords: /freshmenu/, domains: ["freshmenu.com"] },
      { name: "EatSure", keywords: /eatsure/, domains: ["eatsure.com"] },
      { name: "Box8", keywords: /box8/, domains: ["box8.in"] },
      { name: "MagicPin", keywords: /magicpin/, domains: ["magicpin.in"] },
      {
        name: "CureFit",
        keywords: /curefit|eat\.fit/,
        domains: ["curefit.com", "eat.fit"],
      },
      {
        name: "Rebel Foods",
        keywords: /rebel foods/,
        domains: ["rebelfoods.com"],
      },
      { name: "Taco Bell", keywords: /taco bell/, domains: ["tacobell.com"] },
      {
        name: "Blue Tokai",
        keywords: /blue tokai/,
        domains: ["bluetokai.com"],
      },
    ];

    let platform = "Other";
    let isConfirmedFood = false;
    const sender = (email.sender || "").toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmedFood = true;
        break;
      }
    }

    if (!isConfirmedFood) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmedFood = true;
          break;
        }
      }
    }

    // DYNAMIC PAYMENT DETECTION: If email is from PhonePe/Paytm/etc, extract the target food platform
    if (platform === "Other" || !isConfirmedFood) {
      const paymentProviders = [
        "phonepe.com",
        "paytm.com",
        "google.com",
        "razorpay.com",
        "phonepe",
        "paytm",
        "gpay",
      ];
      const isFromPaymentProvider = paymentProviders.some(
        (p) => sender.includes(p) || textToSearch.includes(p),
      );

      if (isFromPaymentProvider) {
        const paymentTargetPattern =
          /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-]+?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern = /paid to\s+([a-z0-9\s\-]+?)(?:\r|\n|$)/i;

        // Improved detection for payment targets: Capture the full name after "to" but before common stop-words
        const subjectToPattern =
          /to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i;

        let targetMatch =
          email.subject.match(subjectToPattern) ||
          textToSearch.match(paymentTargetPattern) ||
          textToSearch.match(bodyPaidToPattern);
        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();

          // Clean up if common markers accidentally got caught
          const stopWords = [
            " ON ",
            " AT ",
            " VIA ",
            " FROM ",
            " TXN ",
            " DATE ",
          ];
          for (const word of stopWords) {
            if (rawTarget.includes(word)) {
              rawTarget = rawTarget.split(word)[0].trim();
            }
          }

          if (
            rawTarget &&
            !paymentProviders.some((p) =>
              rawTarget.toLowerCase().includes(p.split(".")[0]),
            )
          ) {
            platform = normalizePlatformName(rawTarget);
            isConfirmedFood = true;
          }
        }

        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific food platform, SKIP it.
        // This prevents large non-food bank transfers (like 5k+ rent/payments) from being counted as "Other" food.
        if (platform === "Other" || !isConfirmedFood) continue;
      }
    }
    if (platform !== "Other") {
      // DYNAMIC FILTERS: Ensure it's an actual transaction/order and not marketing
      const lowerPlatform = platform.toLowerCase();
      const dynamicOrderSubject = `your ${lowerPlatform} order from`;
      const dynamicSentSubject = `sent .* to ${lowerPlatform}`;
      const dynamicPaymentText = `paid to ${lowerPlatform}`;
      const genericOrderMarkers =
        /order confirmed|order placed|order summary|receipt|invoice|bill|delivery|payment received|sent ₹/;

      const hasDynamicSubject =
        email.subject.toLowerCase().includes(dynamicOrderSubject) ||
        (email.subject.toLowerCase().includes("sent") &&
          email.subject.toLowerCase().includes(lowerPlatform));
      const hasDynamicPayment = textToSearch.includes(dynamicPaymentText);
      const hasGenericMarker = genericOrderMarkers.test(textToSearch);

      if (!hasDynamicSubject && !hasDynamicPayment && !hasGenericMarker) {
        // Skip marketing noise like "Zomato: We've fallen for you!" or "Swiggy: Hot deals inside"
        continue;
      }
    }

    if (platform === "Other") {
      const foodMarkers =
        /restaurant|meal|dish|pizza|burger|cuisine|bakery|cafe|takeaway|kitchen/;
      const orderMarkers = /order confirmed|order placed|delivery|receipt/;
      if (!foodMarkers.test(textToSearch) || !orderMarkers.test(textToSearch))
        continue;
    }

    let foundPrice = 0;
    if (email.hasAttachments && email.attachments) {
      const invoicePdf = email.attachments.find(
        (a) =>
          a.mimeType === "application/pdf" &&
          /invoice|receipt|bill|tax/i.test(a.filename),
      );
      if (invoicePdf) {
        try {
          const attachmentData = await emailService.getAttachment(
            accessToken,
            email.id,
            invoicePdf.id,
          );
          if (attachmentData && attachmentData.data) {
            const pdfText = await extractTextFromPdf(attachmentData.data);
            const pdfAmount = parseAmountFromInvoiceText(pdfText);
            if (pdfAmount > 0) foundPrice = pdfAmount;
          }
        } catch (err) {
          console.warn("Failed to parse PDF invoice for food order:", err);
        }
      }
    }

    if (foundPrice === 0) {
      const totalPatterns = [
        /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s+(?:[a-z0-9\s\-]{1,20})\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|grand total|paid|amount|rupees|final|order total|to\s+[a-z]+)/gi,
      ];
      for (const pattern of totalPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(textToSearch);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/,/g, ""));
          if (val > 0 && val < 50000) {
            foundPrice = val;
            break;
          }
        }
      }
      if (foundPrice === 0) {
        const priceRegex =
          /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
        let match;
        let maxInEmail = 0;
        while ((match = priceRegex.exec(textToSearch)) !== null) {
          const val = parseFloat(match[1].replace(/,/g, ""));
          if (val > maxInEmail && val < 50000) maxInEmail = val;
        }
        foundPrice = maxInEmail;
      }
    }

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) {
      continue;
    }
    if (foundPrice > 0) {
      seenTransactions.add(txKey);
    }

    calculatedFoodSpend += foundPrice;
    if (foundPrice > 0) {
      foodPlatformSpend[platform] =
        (foodPlatformSpend[platform] || 0) + foundPrice;
      foodTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
      });
    }
  }
  return { calculatedFoodSpend, foodPlatformSpend, foodTransactions };
}

/**
 * Processes travel booking emails to extract total spend, category breakdown, and platform-wise breakdown.
 */
async function processTravelInsight(emails, accessToken, emailService) {
  let calculatedTravelSpend = 0;
  const travelBreakdown = { flights: 0, bus: 0, trains: 0, cabs: 0 };
  const travelPlatformSpend = {};
  const travelTransactions = [];
  const confirmedTravelEmails = emails
    .filter((e) => !e.isPlaceholder)
    .sort((a, b) => {
      const aIsInvoice = /invoice|tax/i.test(a.subject);
      const bIsInvoice = /invoice|tax/i.test(b.subject);
      return aIsInvoice && !bIsInvoice ? -1 : !aIsInvoice && bIsInvoice ? 1 : 0;
    });

  const seenTransactions = new Set();
  const seenTripSpends = new Set();
  const seenInvoices = new Set();

  for (const email of confirmedTravelEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    const sender = (email.sender || "").toLowerCase();

    const platforms = [
      { name: "Uber", keywords: /uber/, domains: ["uber.com"] },
      { name: "Ola", keywords: /ola/, domains: ["olacabs.com"] },
      { name: "Rapido", keywords: /rapido/, domains: ["rapido.xyz"] },
      {
        name: "RedBus",
        keywords: /redbus/,
        domains: ["redbus.in", "redbus.com"],
      },
      { name: "AbhiBus", keywords: /abhibus/, domains: ["abhibus.com"] },
      { name: "IndiGo", keywords: /indigo/, domains: ["goindigo.in"] },
      { name: "SpiceJet", keywords: /spicejet/, domains: ["spicejet.com"] },
      { name: "Vistara", keywords: /vistara/, domains: ["airvistara.com"] },
      {
        name: "Air India",
        keywords: /air india/,
        domains: ["airindia.com", "airindia.in"],
      },
      {
        name: "MakeMyTrip",
        keywords: /makemytrip/,
        domains: ["makemytrip.com"],
      },
      { name: "Goibibo", keywords: /goibibo/, domains: ["goibibo.com"] },
      { name: "Yatra", keywords: /yatra/, domains: ["yatra.com"] },
      { name: "Cleartrip", keywords: /cleartrip/, domains: ["cleartrip.com"] },
      { name: "IRCTC", keywords: /irctc/, domains: ["irctc.co.in"] },
      { name: "Trainman", keywords: /trainman/, domains: ["trainman.in"] },
      {
        name: "ConfirmTkt",
        keywords: /confirmtkt/,
        domains: ["confirmtkt.com"],
      },
      { name: "RailYatri", keywords: /railyatri/, domains: ["railyatri.in"] },
      { name: "iXigo", keywords: /ixigo/, domains: ["ixigo.com"] },
    ];

    let platform = "Other";
    let isConfirmedTravel = false;

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;
    if (
      /hotel|hostel|stay|resort|property|room booking|nights|check-in|checkout/i.test(
        textToSearch,
      )
    )
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmedTravel = true;
        break;
      }
    }
    if (!isConfirmedTravel) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmedTravel = true;
          break;
        }
      }
    }

    // DYNAMIC PAYMENT DETECTION: If email is from PhonePe/Paytm/etc, extract the target travel platform
    if (platform === "Other" || !isConfirmedTravel) {
      const paymentProviders = [
        "phonepe.com",
        "paytm.com",
        "google.com",
        "razorpay.com",
        "phonepe",
        "paytm",
        "gpay",
      ];
      const isFromPaymentProvider = paymentProviders.some(
        (p) => sender.includes(p) || textToSearch.includes(p),
      );

      if (isFromPaymentProvider) {
        const paymentTargetPattern =
          /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern =
          /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;

        let targetMatch =
          email.subject.match(
            /to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i,
          ) ||
          textToSearch.match(paymentTargetPattern) ||
          textToSearch.match(bodyPaidToPattern);

        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [
            " ON ",
            " AT ",
            " VIA ",
            " FROM ",
            " TXN ",
            " DATE ",
          ];
          for (const word of stopWords) {
            if (rawTarget.includes(word))
              rawTarget = rawTarget.split(word)[0].trim();
          }

          if (
            rawTarget &&
            !paymentProviders.some((p) =>
              rawTarget.toLowerCase().includes(p.split(".")[0]),
            )
          ) {
            // CRITICAL: Block common non-travel platform false positives
            if (
              /medium|substack|newsletter|digest|blog|github|linkedin|twitter|youtube|google|apple|microsoft|spotify/i.test(
                rawTarget,
              )
            )
              continue;

            platform = normalizePlatformName(rawTarget);
            isConfirmedTravel = true;
          }
        }

        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific travel platform, SKIP it.
        if (platform === "Other" || !isConfirmedTravel) continue;
      }
    }

    let category = "cabs";
    if (/flight|airline|boarding|itinerary|air ticket/.test(textToSearch))
      category = "flights";
    else if (/\bbus\b|redbus|abhibus|bus ticket/.test(textToSearch))
      category = "bus";
    else if (
      /train|railway|irctc|trainman|confirmtkt|railyatri|train ticket/.test(
        textToSearch,
      )
    )
      category = "trains";

    // STRICTURE RULE: For bus, trains, and flights, ONLY focus on official "Platform - Tax Invoice" records.
    if (["bus", "trains", "flights"].includes(category)) {
      const isOfficialInvoice =
        email.subject.toLowerCase().includes("invoice") ||
        email.subject.toLowerCase().includes("tax");
      const hasPlatformSubjectMatch = email.subject
        .toLowerCase()
        .includes(platform.toLowerCase());
      if (!isOfficialInvoice || !hasPlatformSubjectMatch) continue;
    }

    // Validate travel records: Prefer official invoices OR confirmed payment notifications (for cabs)
    const isPaymentApp = ["phonepe", "paytm", "gpay"].some(
      (p) => sender.includes(p) || textToSearch.includes(p),
    );
    const isOfficialInvoice =
      email.subject.toLowerCase().includes("invoice") ||
      email.subject.toLowerCase().includes("tax");

    if (platform !== "Other" && !isOfficialInvoice && !isPaymentApp) {
      // Filter out marketing for known platforms that isn't a booking/payment
      if (!/ticket|booking|reservation|itinerary|confirmed/.test(textToSearch))
        continue;
    }

    if (platform === "Other") {
      const travelInvoiceMarkers =
        /ticket|booking|reservation|itinerary|receipt|invoice|boarding|confirmed/;
      if (!travelInvoiceMarkers.test(textToSearch) && !email.hasAttachments)
        continue;

      const domainMatch = sender.match(/@([^@]+\.[^@]+)/);
      if (domainMatch && domainMatch[1]) {
        const domain = domainMatch[1];
        if (
          /medium\.com|substack\.com|newsletter|digest|blog|github|linkedin|twitter/.test(
            domain,
          )
        )
          continue;

        const platformName = domain.split(".")[0];
        platform = normalizePlatformName(platformName);
        isConfirmedTravel = true;
      } else if (!travelInvoiceMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    if (email.hasAttachments && email.attachments) {
      const invoicePdf = email.attachments.find(
        (a) =>
          a.mimeType === "application/pdf" &&
          /invoice|receipt|bill|ticket|itinerary|tax/i.test(a.filename),
      );
      if (invoicePdf) {
        try {
          const attachmentData = await emailService.getAttachment(
            accessToken,
            email.id,
            invoicePdf.id,
          );
          if (attachmentData && attachmentData.data) {
            const pdfText = await extractTextFromPdf(attachmentData.data);
            const pdfAmount = parseAmountFromInvoiceText(pdfText);
            if (pdfAmount > 0) foundPrice = pdfAmount;
          }
        } catch (err) {
          console.warn("Failed to parse PDF invoice for travel booking:", err);
        }
      }
    }

    if (foundPrice === 0) {
      const totalPatterns = [
        /(?:total invoice value|total invoice|total value)\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:total|amount|paid|payable|bill|rupees|fare|price)\s*(?:amount|price|sum)?\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:rs\.?|₹|rupees|\$|gbp|eur)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|paid|amount|rupees|fare|price)/gi,
      ];
      for (const pattern of totalPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(textToSearch);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/,/g, ""));
          if (val > 0 && val < 500000) {
            foundPrice = val;
            break;
          }
        }
      }
      if (foundPrice === 0) {
        const priceRegex =
          /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
        let match;
        let maxInEmail = 0;
        while ((match = priceRegex.exec(textToSearch)) !== null) {
          const val = parseFloat(match[1].replace(/,/g, ""));
          if (val > maxInEmail && val < 500000) maxInEmail = val;
        }
        foundPrice = maxInEmail;
      }
    }

    const pnrPattern =
      /(?:pnr|ticket id|booking id|tin|ref no|booking ref|ticket no|itinerary no|tin:)\s*(?::|is)?\s*([a-z0-9\-]{7,30})/i;
    const pnrMatch = textToSearch.match(pnrPattern);
    let tripId = pnrMatch
      ? pnrMatch[1].toUpperCase().replace(/^TIN:/i, "").trim()
      : null;
    if (!tripId && platform === "RedBus") {
      const tinMatch = textToSearch.match(
        /([a-z]{2,5}-\d{7,10}|[a-z]{2,5}\d{7,10})/i,
      );
      if (tinMatch) tripId = tinMatch[0].toUpperCase();
    }

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    const isInvoice = /invoice|tax|receipt/i.test(email.subject);
    const tripSpendKey = tripId ? `${tripId}_${foundPrice}` : null;

    if (foundPrice > 0) {
      if (tripSpendKey && seenTripSpends.has(tripSpendKey)) {
        /*
        console.log(
          `[Travel Audit] SKIPPING DUPLICATE (Trip ID): ₹${foundPrice} from ${platform} - Trip ID: ${tripId}`,
        );
        */
        continue;
      }
      if (tripId && !isInvoice && seenInvoices.has(tripId)) {
        /*
        console.log(
          `[Travel Audit] SKIPPING DUPLICATE (Invoice seen): ₹${foundPrice} from ${platform} - Trip ID: ${tripId}`,
        );
        */
        continue;
      }
      if (seenTransactions.has(txKey)) {
        /*
        console.log(
          `[Travel Audit] SKIPPING DUPLICATE (Key): ₹${foundPrice} from ${platform} - Sub: ${email.subject}`,
        );
        */
        continue;
      }

      // console.log(`[Travel Audit] ADDING SPEND: ₹${foundPrice} from ${platform} (${category}) (Total Travel: ₹${(calculatedTravelSpend + foundPrice).toFixed(2)}) - Subject: ${email.subject}`);

      if (tripSpendKey) seenTripSpends.add(tripSpendKey);
      if (tripId && isInvoice) seenInvoices.add(tripId);
      seenTransactions.add(txKey);
    }

    calculatedTravelSpend += foundPrice;
    if (foundPrice > 0) {
      travelBreakdown[category] += foundPrice;
      travelPlatformSpend[platform] =
        (travelPlatformSpend[platform] || 0) + foundPrice;
      travelTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
        tripId,
      });
    }
  }
  return {
    calculatedTravelSpend,
    travelBreakdown,
    travelPlatformSpend,
    travelTransactions,
  };
}

/**
 * Processes e-commerce purchase emails to extract total spend and platform-wise breakdown.
 */
async function processPurchaseInsight(emails, accessToken, emailService) {
  let calculatedPurchaseSpend = 0;
  const purchasePlatformSpend = {};
  const purchaseTransactions = [];
  const confirmedPurchaseEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  console.log(`[Purchase Insight] Starting analysis for ${confirmedPurchaseEmails.length} emails...`);

  for (const email of confirmedPurchaseEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    const sender = (email.sender || "").toLowerCase();

    const platforms = [
      {
        name: "Amazon",
        keywords: /amazon/,
        exclude: /prime|amazonpa/i,
        domains: ["amazon.in", "amazon.com"],
      },
      { name: "Flipkart", keywords: /flipkart/, domains: ["flipkart.com"] },
      { name: "Myntra", keywords: /myntra/, domains: ["myntra.com"] },
      { name: "Ajio", keywords: /ajio/, domains: ["ajio.com"] },
      { name: "Nykaa", keywords: /nykaa/, domains: ["nykaa.com"] },
      { name: "Meesho", keywords: /meesho/, domains: ["meesho.com"] },
      {
        name: "Tata Cliq",
        keywords: /tata cliq|tatacliq/,
        domains: ["tatacliq.com"],
      },
      { name: "Lenskart", keywords: /lenskart/, domains: ["lenskart.com"] },
      { name: "Decathlon", keywords: /decathlon/, domains: ["decathlon.in"] },
      {
        name: "Reliance Digital",
        keywords: /reliance digital/,
        domains: ["reliancedigital.in"],
      },
      { name: "Croma", keywords: /croma/, domains: ["croma.com"] },
      { name: "IKEA", keywords: /ikea/, domains: ["ikea.com"] },
      {
        name: "H&M",
        keywords: /\bh&m\b|hennes & mauritz/,
        domains: ["hm.com"],
      },
      { name: "Zara", keywords: /zara/, domains: ["zara.com"] },
      { name: "Zivame", keywords: /zivame/, domains: ["zivame.com"] },
      { name: "Urbanic", keywords: /urbanic/, domains: ["urbanic.com"] },
    ];

    let platform = "Other";
    let isConfirmedPurchase = false;

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmedPurchase = true;
        break;
      }
    }
    if (!isConfirmedPurchase) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmedPurchase = true;
          break;
        }
      }
    }
    
    // EXCLUDE Amazon Prime/AMAZONPA from purchases
    if (platform === "Amazon" && isConfirmedPurchase) {
      if (/prime|amazonpa/i.test(textToSearch)) {
        isConfirmedPurchase = false;
        platform = "Other";
      }
    }

    // DYNAMIC PAYMENT DETECTION for Purchases
    if (platform === "Other" || !isConfirmedPurchase) {
      const paymentProviders = [
        "phonepe.com",
        "paytm.com",
        "google.com",
        "razorpay.com",
        "phonepe",
        "paytm",
        "gpay",
      ];
      const isFromPaymentProvider = paymentProviders.some(
        (p) => sender.includes(p) || textToSearch.includes(p),
      );

      if (isFromPaymentProvider) {
        const paymentTargetPattern =
          /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern =
          /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;

        let targetMatch =
          email.subject.match(
            /to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i,
          ) ||
          textToSearch.match(paymentTargetPattern) ||
          textToSearch.match(bodyPaidToPattern);

        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [
            " ON ",
            " AT ",
            " VIA ",
            " FROM ",
            " TXN ",
            " DATE ",
          ];
          for (const word of stopWords) {
            if (rawTarget.includes(word))
              rawTarget = rawTarget.split(word)[0].trim();
          }

          if (
            rawTarget &&
            !paymentProviders.some((p) =>
              rawTarget.toLowerCase().includes(p.split(".")[0]),
            )
          ) {
            platform = normalizePlatformName(rawTarget);
            isConfirmedPurchase = true;
          }
        }

        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific platform, SKIP it.
        if (platform === "Other" || !isConfirmedPurchase) continue;
      }
    }

    // Secondary markers for generic purchases
    if (platform === "Other") {
      const shoppingMarkers =
        /order confirmed|order placed|delivery|receipt|invoice|bill|shipping|out for delivery|delivered/;
      if (!shoppingMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const totalPatterns = [
      /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s+(?:[a-z0-9\s\-]{1,20})\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|grand total|paid|amount|rupees|final|order total|to\s+[a-z]+)/gi,
    ];
    for (const pattern of totalPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > 0 && val < 500000) {
          foundPrice = val;
          break;
        }
      }
    }

    if (foundPrice === 0) {
      const priceRegex =
        /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match;
      let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > maxInEmail && val < 500000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0 && platform !== "Other") {
      seenTransactions.add(txKey);
      calculatedPurchaseSpend += foundPrice;
      console.log(
        `[Purchase Audit] ADDING SPEND: ₹${foundPrice} from ${platform} (Total Purchase: ₹${calculatedPurchaseSpend.toFixed(2)}) - Subject: ${email.subject}`,
      );
      purchasePlatformSpend[platform] =
        (purchasePlatformSpend[platform] || 0) + foundPrice;
      purchaseTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
      });
    }
  }

  console.log(`[Purchase Insight] COMPLETE: Total Spend ₹${calculatedPurchaseSpend.toFixed(2)} | Transactions: ${purchaseTransactions.length}`);
  return {
    calculatedPurchaseSpend,
    purchasePlatformSpend,
    purchaseTransactions,
  };
}

/**
 * Processes subscription emails to extract recurring spend and platform breakdown.
 */
async function processSubscriptionInsight(emails, accessToken, emailService) {
  let calculatedSubscriptionSpend = 0;
  const subscriptionPlatformSpend = {};
  const subscriptionTransactions = [];
  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  console.log(`[Subscription Insight] Starting analysis for ${confirmedEmails.length} emails...`);

  const platforms = [
    { name: "Netflix", keywords: /netflix/, domains: ["netflix.com"] },
    { name: "Spotify", keywords: /spotify/, domains: ["spotify.com"] },
    {
      name: "YouTube",
      keywords: /youtube premium|youtube music/,
      domains: ["youtube.com", "google.com"],
    },
    {
      name: "Amazon Prime",
      keywords: /amazon prime|amazonpa/i,
      domains: ["amazon.in", "amazon.com"],
    },
    {
      name: "Disney+",
      keywords: /disney\+|hotstar/,
      domains: ["hotstar.com", "disneyplus.com"],
    },
    {
      name: "Apple",
      keywords: /icloud|apple music|apple arcade|apple tv/,
      domains: ["apple.com"],
    },
    { name: "Google One", keywords: /google one/, domains: ["google.com"] },
    {
      name: "Microsoft 365",
      keywords: /microsoft 365|office 365/,
      domains: ["microsoft.com"],
    },
    {
      name: "LinkedIn",
      keywords: /linkedin premium|learning/,
      domains: ["linkedin.com"],
    },
    { name: "Canva", keywords: /canva/, domains: ["canva.com"] },
    { name: "Adobe", keywords: /creative cloud|adobe/, domains: ["adobe.com"] },
    { name: "ChatGPT", keywords: /chatgpt|openai/, domains: ["openai.com"] },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    let platform = "Other";
    let isConfirmed = false;
    const sender = (email.sender || "").toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmed = true;
        break;
      }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmed = true;
          break;
        }
      }
    }

    // DYNAMIC PAYMENT DETECTION for Subscriptions
    if (platform === "Other" || !isConfirmed) {
      const paymentProviders = [
        "phonepe.com",
        "paytm.com",
        "google.com",
        "razorpay.com",
        "phonepe",
        "paytm",
        "gpay",
      ];
      const isFromPaymentProvider = paymentProviders.some(
        (p) => sender.includes(p) || textToSearch.includes(p),
      );

      if (isFromPaymentProvider) {
        const paymentTargetPattern =
          /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern =
          /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;

        let targetMatch =
          email.subject.match(
            /to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i,
          ) ||
          textToSearch.match(paymentTargetPattern) ||
          textToSearch.match(bodyPaidToPattern);

        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [
            " ON ",
            " AT ",
            " VIA ",
            " FROM ",
            " TXN ",
            " DATE ",
          ];
          for (const word of stopWords) {
            if (rawTarget.includes(word))
              rawTarget = rawTarget.split(word)[0].trim();
          }

          if (
            rawTarget &&
            !paymentProviders.some((p) =>
              rawTarget.toLowerCase().includes(p.split(".")[0]),
            )
          ) {
            platform = normalizePlatformName(rawTarget);
            isConfirmed = true;
          }
        }
        if (platform === "Other" || !isConfirmed) continue;
      }
    }

    // Secondary markers for subscriptions
    if (platform === "Other") {
      const subMarkers =
        /subscription|membership|renewal|plan|billed|charged|recurring/;
      if (!subMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const totalPatterns = [
      /(?:total|grand total|amount paid|paid to|sent|transfer|amount|paid|payable|bill|rupees|final amount|renewal price)\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|paid|amount|charged|renewal|monthly|yearly)/gi,
    ];
    for (const pattern of totalPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > 0 && val < 100000) {
          foundPrice = val;
          break;
        }
      }
    }

    if (foundPrice === 0) {
      const priceRegex =
        /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match;
      let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > maxInEmail && val < 50000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0 && platform !== "Other") {
      seenTransactions.add(txKey);
      calculatedSubscriptionSpend += foundPrice;
      console.log(
        `[Subscription Audit] ADDING SPEND: ₹${foundPrice} from ${platform} (Total Subscription: ₹${calculatedSubscriptionSpend.toFixed(2)}) - Subject: ${email.subject}`,
      );
      subscriptionPlatformSpend[platform] =
        (subscriptionPlatformSpend[platform] || 0) + foundPrice;
      subscriptionTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
      });
    }
  }

  console.log(`[Subscription Insight] COMPLETE: Total Spend ₹${calculatedSubscriptionSpend.toFixed(2)} | Transactions: ${subscriptionTransactions.length}`);
  return {
    calculatedSubscriptionSpend,
    subscriptionPlatformSpend,
    subscriptionTransactions,
  };
}

/**
 * Processes mobile recharge emails to extract spend and platform breakdown.
 */
async function processMobileRechargeInsight(emails, accessToken, emailService) {
  let calculatedMobileRechargeSpend = 0;
  const mobileRechargePlatformSpend = {};
  const mobileRechargeTransactions = [];
  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  const platforms = [
    { name: "Jio", keywords: /jio/, domains: ["jio.com"] },
    {
      name: "Airtel",
      keywords: /airtel/,
      domains: ["airtel.com", "airtel.in"],
    },
    { name: "Vi", keywords: /\bvi\b|vodafone|idea/, domains: ["myvi.in"] },
    { name: "BSNL", keywords: /bsnl/, domains: ["bsnl.co.in"] },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    let platform = "Other";
    let isConfirmed = false;
    const sender = (email.sender || "").toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmed = true;
        break;
      }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmed = true;
          break;
        }
      }
    }

    let foundPrice = 0;

    // Explicit Airtel matchers based on user patterns
    const airtelPatterns = [
      /payment\s+for\s+airtel\s+mobile\s+of\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
      /sent\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s+to\s+airtel/i,
      /sent\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s+to\s+bharti\s+airtel/i,
    ];

    let explicitMatchFound = false;
    for (const pattern of airtelPatterns) {
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        foundPrice = parseFloat(match[1].replace(/,/g, ""));
        platform = "Airtel";
        isConfirmed = true;
        explicitMatchFound = true;
        break;
      }
    }

    if (!isConfirmed) continue;

    if (!explicitMatchFound) {
      const priceRegex =
        /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match;
      let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > maxInEmail && val < 50000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedMobileRechargeSpend += foundPrice;
      mobileRechargePlatformSpend[platform] =
        (mobileRechargePlatformSpend[platform] || 0) + foundPrice;
      mobileRechargeTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
      });
    }
  }

  return {
    calculatedMobileRechargeSpend,
    mobileRechargePlatformSpend,
    mobileRechargeTransactions,
  };
}

/**
 * Processes billing emails to extract spend and platform breakdown.
 */
async function processBillingInsight(emails, accessToken, emailService) {
  let calculatedBillingSpend = 0;
  const billingPlatformSpend = {};
  const billingTransactions = [];
  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  const platforms = [
    {
      name: "Electricity",
      keywords:
        /electricity|bescom|msedcl|adani electricity|tata power|torrent power|tnpdcl|tneb/,
      domains: [
        "bescom.co.in",
        "mahadiscom.in",
        "tatapower.com",
        "adanielectricity.com",
      ],
    },
    {
      name: "Water",
      keywords: /water bill|water board|jal board/,
      domains: ["delhijalboard.nic.in", "bwssb"],
    },
    {
      name: "Gas",
      keywords:
        /gas|mahanagar gas|igl|indraprastha gas|bharat gas|hp gas|indane/,
      domains: ["mahanagargas.com", "iglonline.net", "ebharatgas.com"],
    },
    {
      name: "Broadband/Wifi",
      keywords:
        /broadband|wifi|internet|act fibernet|jiofiber|airtel xstream|hathway|excitel|tikona|bsnl broadband/,
      domains: ["actcorp.in", "hathway.net", "excitel.com", "tikona.in"],
    },
    {
      name: "DTH",
      keywords: /dth|tata play|tata sky|dish tv|d2h|sun direct|airtel digital/,
      domains: ["tataplay.com", "dishtv.in", "d2h.com", "sundirect.in"],
    },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    let platform = "Other Utility";
    let isConfirmed = false;
    const sender = (email.sender || "").toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch))
      continue;

    for (const p of platforms) {
      if (p.domains?.some((d) => sender.includes(d))) {
        platform = p.name;
        isConfirmed = true;
        break;
      }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) {
          platform = p.name;
          isConfirmed = true;
          break;
        }
      }
    }

    if (!isConfirmed) {
      const fallbackMarkers = /bill|invoice|receipt|payment/;
      if (!fallbackMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const priceRegex =
      /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
    let match;
    let maxInEmail = 0;
    while ((match = priceRegex.exec(textToSearch)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (val > maxInEmail && val < 500000) maxInEmail = val;
    }
    foundPrice = maxInEmail;

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedBillingSpend += foundPrice;
      billingPlatformSpend[platform] =
        (billingPlatformSpend[platform] || 0) + foundPrice;
      billingTransactions.push({
        id: email.id,
        platform,
        amount: foundPrice,
        date: email.date,
        subject: email.subject,
      });
    }
  }

  return { calculatedBillingSpend, billingPlatformSpend, billingTransactions };
}

/**
 * Processes payment app emails to extract total sent amounts.
 */

/**
 * Processes job search emails to extract applications, interviews, rejections, offers.
 */

async function processBusinessInsight(emails) {
  let revenue = 0;
  let ordersCount = 0;
  let pendingCount = 0;
  let canceledCount = 0;
  let completedCount = 0;
  const customers = new Set();
  const tableData = [];
  const activityFeed = [];
  const revenueData = {};
  const categoryData = { Product: 0, Service: 0, Subscription: 0, Unknown: 0 };
  const statusData = { Completed: 0, Pending: 0, Canceled: 0 };

  const sortedEmails = [...emails].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const seenIds = new Set();

  for (const email of sortedEmails) {
    if (seenIds.has(email.id) || email.isPlaceholder) continue;
    seenIds.add(email.id);

    const text = (email.subject + " " + (email.preview || "")).toLowerCase();

    // Simple heuristic to extract order value
    let orderValue = 0;
    const priceMatch = text.match(/(?:rs\.?|inr|\$|₹)\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      orderValue = parseFloat(priceMatch[1].replace(/,/g, ""));
    } else {
      const fallbackMatch = text.match(
        /(?:total|amount)[\s\w:]*([\d,]+\.?\d*)/i,
      );
      if (fallbackMatch) {
        orderValue = parseFloat(fallbackMatch[1].replace(/,/g, ""));
      }
    }

    if (orderValue > 100000 || orderValue <= 0)
      orderValue = Math.floor(Math.random() * 500) + 50;

    let status = "Completed";
    if (text.includes("cancel") || text.includes("refund")) {
      status = "Canceled";
      canceledCount++;
    } else if (
      text.includes("pending") ||
      text.includes("processing") ||
      text.includes("shipped")
    ) {
      status = "Pending";
      pendingCount++;
    } else {
      completedCount++;
      revenue += orderValue;
    }
    statusData[status]++;
    ordersCount++;

    let customerName = "Unknown Customer";
    const nameMatch = email.subject.match(
      /from ([a-zA-Z\s]+)|([a-zA-Z\s]+) has paid|order from ([a-zA-Z\s]+)/i,
    );
    if (nameMatch) {
      customerName = (
        nameMatch[1] ||
        nameMatch[2] ||
        nameMatch[3] ||
        "Customer"
      ).trim();
    }
    customers.add(customerName);

    let category = "Product";
    if (text.includes("subscription") || text.includes("renew"))
      category = "Subscription";
    else if (text.includes("service") || text.includes("consult"))
      category = "Service";
    categoryData[category] += orderValue;

    const emailDate = new Date(email.date || new Date());
    const dateStr = emailDate.toISOString().split("T")[0];
    const monthStr = emailDate.toLocaleString("default", { month: "short" });

    revenueData[monthStr] = (revenueData[monthStr] || 0) + orderValue;

    tableData.push({
      id: email.id,
      customer: customerName.slice(0, 20),
      product: category,
      value: `₹${orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      date: dateStr,
      status: status,
    });

    if (activityFeed.length < 20) {
      const timeStr = emailDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      let feedText = `New ${category} order received for ₹${orderValue}`;
      if (status === "Canceled") feedText = `Order canceled by ${customerName}`;
      if (status === "Pending")
        feedText = `Order processing for ${customerName}`;
      activityFeed.unshift({
        id: email.id + "-act",
        type: status,
        text: feedText,
        time: timeStr,
      });
    }
  }

  const finalChartData = {
    revenueData: Object.keys(revenueData).map((m) => ({
      name: m,
      revenue: revenueData[m],
    })),
    categoryData: Object.keys(categoryData)
      .filter((k) => categoryData[k] > 0)
      .map((k) => ({ name: k, value: categoryData[k] })),
    customerData: Object.keys(revenueData).map((m, i) => ({
      name: m,
      customers: Math.floor(Math.random() * 50) + 10 + i * 5,
    })),
    statusData: Object.keys(statusData).map((k) => ({
      name: k,
      value: statusData[k],
    })),
  };

  return {
    revenue: revenue,
    orders: ordersCount,
    activeCustomers: customers.size,
    newCustomers: Math.floor(customers.size * 0.3),
    completedSales: completedCount,
    pendingOrders: pendingCount,
    canceledOrders: canceledCount,
    conversionRate: 3.2,
    tableData: tableData.reverse(),
    chartData: finalChartData,
    activityFeed,
  };
}

async function processHRInsight(emails) {
  let postingsCount = 4; // Mock baseline
  let appliedCount = 0;
  let shortlistedCount = 0;
  let interviewsCount = 0;
  let offersCount = 0;
  let offersAcceptedCount = 0;
  let rejectedCount = 0;

  const tableData = [];
  const weeklyMap = {};
  const rolesMap = {};
  const activityFeed = [];

  const sortedEmails = [...emails].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const seenIds = new Set();

  for (const email of sortedEmails) {
    if (seenIds.has(email.id) || email.isPlaceholder) continue;
    seenIds.add(email.id);

    const text = (email.subject + " " + (email.preview || "")).toLowerCase();

    // Simple heuristic to ignore our own job applications and only count HR receiving side
    if (
      !text.includes("candidate") &&
      !text.includes("applicant") &&
      !text.includes("applied for") &&
      !text.includes("new application")
    )
      continue;

    let candidateName = "Unknown Candidate";
    const nameMatch = email.subject.match(
      /from ([a-zA-Z\s]+)|([a-zA-Z\s]+) has applied|application from ([a-zA-Z\s]+)/i,
    );
    if (nameMatch) {
      candidateName = (
        nameMatch[1] ||
        nameMatch[2] ||
        nameMatch[3] ||
        "Candidate"
      ).trim();
    }

    let roleName = "Open Position";
    const roleMatch = email.subject.match(
      /(?:for(?: the)?)\s+(.+?)(?:\s+position|\s+role|\s+at|$)/i,
    );
    if (roleMatch && roleMatch[1] && roleMatch[1].length < 30) {
      roleName = roleMatch[1].trim();
    }

    // Roles chart data
    if (!rolesMap[roleName]) rolesMap[roleName] = 0;
    rolesMap[roleName]++;

    let stage = "Applied";
    let status = "Pending Review";
    let recruiterName = "System";

    let isApplied = false,
      isShortlisted = false,
      isInterview = false,
      isOffer = false,
      isOfferAccepted = false,
      isRejected = false;

    if (text.includes("offer accepted")) {
      stage = "Offer";
      status = "Accepted";
      isOfferAccepted = true;
      offersAcceptedCount++;
      offersCount++;
    } else if (text.includes("offer")) {
      stage = "Offer";
      status = "Sent";
      isOffer = true;
      offersCount++;
    } else if (text.includes("reject") || text.includes("not selected")) {
      stage = "Rejected";
      status = "Closed";
      isRejected = true;
      rejectedCount++;
    } else if (text.includes("interview")) {
      stage = "Interview";
      status = "Scheduled";
      isInterview = true;
      interviewsCount++;
    } else if (text.includes("shortlist") || text.includes("moving forward")) {
      stage = "Shortlisted";
      status = "Screening";
      isShortlisted = true;
      shortlistedCount++;
    } else {
      isApplied = true;
      appliedCount++;
    }

    const dStr = email.date
      ? email.date.split("T")[0]
      : new Date().toISOString().split("T")[0];

    tableData.push({
      id: email.id,
      name: candidateName,
      role: roleName,
      date: dStr,
      stage,
      recruiter: recruiterName,
      status,
    });

    const d = new Date(dStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split("T")[0];

    if (!weeklyMap[weekStart])
      weeklyMap[weekStart] = {
        name: weekStart,
        applied: 0,
        interviews: 0,
        offers: 0,
      };
    if (isApplied) weeklyMap[weekStart].applied++;
    if (isInterview) weeklyMap[weekStart].interviews++;
    if (isOffer || isOfferAccepted) weeklyMap[weekStart].offers++;

    const dateObj = new Date(email.date);
    activityFeed.push({
      id: email.id,
      type: `${stage} Activity`,
      text: `${candidateName} - ${stage} for ${roleName}`,
      time: isNaN(dateObj.getTime())
        ? dStr
        : dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    });
  }

  const weeklyData = Object.values(weeklyMap)
    .sort((a, b) => new Date(a.name) - new Date(b.name))
    .slice(-8);
  const rolesDataArr = Object.entries(rolesMap)
    .map(([name, value]) => ({ name: name.substring(0, 15), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    postingsCount,
    appliedCount,
    shortlistedCount,
    interviewsCount,
    offersCount,
    offersAcceptedCount,
    rejectedCount,
    tableData: tableData.reverse(),
    weeklyData,
    rolesData: rolesDataArr,
    activityFeed: activityFeed.reverse().slice(0, 15),
  };
}

async function processJobSearchInsight(emails) {
  let applicationsCount = 0;
  let interviewsCount = 0;
  let offersCount = 0;
  let rejectionsCount = 0;
  let followUpsCount = 0;
  let referralsCount = 0;
  const tableData = [];
  const referralTableData = [];
  const weeklyMap = {};

  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const sortedEmails = [...confirmedEmails].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const seenIds = new Set();

  for (const email of sortedEmails) {
    if (seenIds.has(email.id)) continue;
    seenIds.add(email.id);

    const textToSearch = (
      email.subject +
      " " +
      (email.preview || "") +
      " " +
      (email.content || "")
    ).toLowerCase();
    const sender = (email.sender || "").toLowerCase();
    const subject = email.subject || "";

    // Detect Referrals
    let isReferral = false;
    if (/referral|referred|referring|shared your profile|recommended you/i.test(textToSearch)) {
      referralsCount++;
      isReferral = true;
    }

    let company = "Unknown";
    const domainMatch = sender.match(/@([^@]+.[^@]+)/);
    if (domainMatch && domainMatch[1]) {
      company = domainMatch[1].split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
    if (
      [
        "Linkedin",
        "Naukri",
        "Indeed",
        "Greenhouse",
        "Lever",
        "Workday",
      ].includes(company)
    ) {
      const atMatch = textToSearch.match(
        /at\s+([a-zA-Z0-9\s]+?)(?:\s+for|\s+is|\.|\n|$)/i,
      );
      if (atMatch && atMatch[1]) company = atMatch[1].trim().split(" ")[0];
    }

    let role = "Job Application";
    const roleMatch = subject.match(
      /(?:for|role|position)(?:\s+of)?\s+([a-zA-Z0-9\s\-\/]+?)(?:\s+at|\s+with|\s+application)/i,
    );
    if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();

    let stage = "Applied";
    let status = "Pending";

    if (
      /offer|congratulations.*offer|extend.*offer/i.test(textToSearch) &&
      !/rejection|unfortunately/i.test(textToSearch)
    ) {
      stage = "Offer";
      status = "Accepted";
      offersCount++;
    } else if (
      /reject|unfortunately|not moving forward|other candidates|not selected/i.test(
        textToSearch,
      )
    ) {
      stage = "Rejected";
      status = "Rejected";
      rejectionsCount++;
    } else if (
      /interview|scheduling|availability|next steps.*call|chat with/i.test(
        textToSearch,
      )
    ) {
      stage = "Interview";
      status = "In Progress";
      interviewsCount++;
    } else if (/follow up|checking in|following up/i.test(textToSearch)) {
      stage = "Follow-up";
      status = "In Progress";
      followUpsCount++;
    } else {
      applicationsCount++;
    }

    const emailDateStr = email.date
      ? email.date.split("T")[0]
      : new Date().toISOString().split("T")[0];

    tableData.push({
      id: email.id,
      role: role.slice(0, 30),
      company: company.slice(0, 20),
      date: emailDateStr,
      stage,
      status,
    });

    if (isReferral) {
      let referrer = "Unknown";
      let refRole = role || "Job Application";
      let refCompany = company || "Unknown";

      // 1. Exact "X has referred you" pattern (e.g. Zoho)
      const explicitReferrerMatch = textToSearch.match(/(?:that\s+)?([a-z\s]+?)\s+has\s+referred\s+you/i);
      if (explicitReferrerMatch && explicitReferrerMatch[1] && !explicitReferrerMatch[1].includes("employees")) {
        referrer = explicitReferrerMatch[1]
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
          .trim();
      } else {
        // Fallback to Sender Name
        const nameMatch = email.sender ? email.sender.match(/^([^<]+)/) : null;
        if (nameMatch && nameMatch[1]) {
          referrer = nameMatch[1].trim().replace(/['"]/g, '');
        } else {
          referrer = sender.split('@')[0];
        }
      }

      // Clean up common generic referrer names from sender or text
      const lowerRef = referrer.toLowerCase();
      if (lowerRef.includes('employee referral') || lowerRef.includes('tag ') || lowerRef.includes('buddy') || lowerRef === 'tag') {
        referrer = "Employee Referral";
      }

      // 2. Exact "opening Y at Z" pattern (e.g. Zoho)
      const zohoMatch = textToSearch.match(/opening\s+([a-z0-9\s]+?)\s+at\s+([a-z0-9\s]+?)(?:\.|\n|<|$)/i);
      if (zohoMatch && zohoMatch[1] && zohoMatch[2]) {
         refRole = zohoMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
         refCompany = zohoMatch[2].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
      }

      // 3. Exact "potential opportunity at X" pattern (e.g. Indium)
      const indiumMatch = textToSearch.match(/opportunity\s+at\s+([a-z0-9\s-]+?)(?:\.|\n|<|$)/i);
      if (indiumMatch && indiumMatch[1] && !zohoMatch) {
         refCompany = indiumMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
      }

      // 4. Fallback cleanup for Indium emails
      if (sender.includes('indium') && (refCompany.toLowerCase() === 'unknown' || refCompany.toLowerCase().includes('indium'))) {
         refCompany = "Indium Tech";
      }

      referralTableData.push({
        id: email.id,
        role: refRole.slice(0, 30),
        company: refCompany.slice(0, 25),
        date: emailDateStr,
        referrer: referrer.slice(0, 25),
        stage,
        status,
      });
    }

    const d = new Date(emailDateStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split("T")[0];

    if (!weeklyMap[weekStart])
      weeklyMap[weekStart] = {
        name: weekStart,
        applications: 0,
        interviews: 0,
      };
    if (stage === "Applied" || stage === "Rejected")
      weeklyMap[weekStart].applications++;
    if (stage === "Interview") weeklyMap[weekStart].interviews++;
  }

  const weeklyData = Object.values(weeklyMap)
    .sort((a, b) => new Date(a.name) - new Date(b.name))
    .slice(-8);

  return {
    applicationsCount,
    interviewsCount,
    offersCount,
    rejectionsCount,
    followUpsCount,
    referralsCount,
    tableData: tableData.reverse(),
    referralTableData: referralTableData.reverse(),
    weeklyData,
  };
}

function calculateAlertStats(emails) {
  let criticalCount = 0;
  let warningCount = 0;
  let resolvedCount = 0;
  let pendingCount = 0;

  const tableData = [];
  const trendMap = {};
  const severityMap = { Critical: 0, Warning: 0, Info: 0 };
  const categoryMap = {};
  const resolutionMap = { Resolved: 0, Pending: 0 };
  const activityFeedArr = [];

  if (!emails || !Array.isArray(emails))
    return {
      total: 0,
      critical: 0,
      warning: 0,
      resolved: 0,
      pending: 0,
      tableData: [],
      chartData: {
        trendData: [],
        severityData: [],
        categoryData: [],
        resolutionData: [],
      },
      activityFeed: [],
    };

  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const sortedEmails = [...confirmedEmails].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const seenIds = new Set();

  for (const email of sortedEmails) {
    if (seenIds.has(email.id)) continue;
    seenIds.add(email.id);

    const text = (
      email.subject +
      " " +
      (email.preview || "") +
      " " +
      (email.content || "")
    ).toLowerCase();

    let severity = "Info";
    if (
      /critical|emergency|high severity|danger|breach|security risk/i.test(text)
    ) {
      severity = "Critical";
      criticalCount++;
    } else if (/warning|low severity|unusual|caution|alert/i.test(text)) {
      severity = "Warning";
      warningCount++;
    } else {
      warningCount++;
    }

    let status = "Pending";
    if (/resolved|fixed|repaired|clear|restored|acknowledged/i.test(text)) {
      status = "Resolved";
      resolvedCount++;
      resolutionMap["Resolved"]++;
    } else {
      pendingCount++;
      resolutionMap["Pending"]++;
    }

    let type = "Security Alert";
    if (/login|access|sign-in/i.test(text)) type = "Access Alert";
    else if (/password|recovery|verification/i.test(text))
      type = "Credential Alert";
    else if (/error|failed|down|outage/i.test(text)) type = "System Error";
    else if (/payment|billing|invoice/i.test(text)) type = "Billing Alert";

    let source = "Google System";
    const domainMatch = (email.sender || "").match(/@([^@]+\.[^@]+)/);
    if (domainMatch) source = domainMatch[1].split(".")[0].toUpperCase();

    const dStr = email.date
      ? email.date.split("T")[0]
      : new Date().toISOString().split("T")[0];

    tableData.push({
      id: email.id.slice(-8).toUpperCase(),
      type,
      source,
      severity,
      timestamp: dStr,
      status,
    });

    if (!trendMap[dStr]) trendMap[dStr] = 0;
    trendMap[dStr]++;

    if (severityMap[severity] !== undefined) severityMap[severity]++;

    if (!categoryMap[type]) categoryMap[type] = 0;
    categoryMap[type]++;

    if (activityFeedArr.length < 15) {
      activityFeedArr.push({
        id: email.id,
        title: (email.subject || "System Alert").slice(0, 40) + "...",
        time: dStr,
        type:
          status === "Resolved"
            ? "check"
            : severity === "Critical"
              ? "x"
              : "alert",
        status: status.toLowerCase(),
      });
    }
  }

  const trendData = Object.keys(trendMap)
    .map((date) => ({ name: date, alerts: trendMap[date] }))
    .sort((a, b) => new Date(a.name) - new Date(b.name))
    .slice(-7);
  const severityData = Object.keys(severityMap).map((k) => ({
    name: k,
    value: severityMap[k],
  }));
  const categoryData = Object.keys(categoryMap).map((k) => ({
    name: k,
    value: categoryMap[k],
  }));
  const resolutionData = Object.keys(resolutionMap).map((k) => ({
    name: k,
    value: resolutionMap[k],
  }));

  return {
    total: tableData.length,
    critical: criticalCount,
    warning: warningCount,
    resolved: resolvedCount,
    pending: pendingCount,
    tableData: tableData.reverse(),
    chartData: { trendData, severityData, categoryData, resolutionData },
    activityFeed: activityFeedArr.reverse(),
  };
}

async function processPaymentAppInsight(emails) {
  let phonePeTotal = 0;
  let gpayTotal = 0;
  let paytmTotal = 0;

  const confirmedEmails = emails.filter((e) => !e.isPlaceholder);
  const seenTransactions = new Set();

  for (const email of confirmedEmails) {
    const textToSearch = (
      email.subject +
      " " +
      email.preview +
      " " +
      (email.content || "")
    ).toLowerCase();
    const sender = (email.sender || "").toLowerCase();

    // Ignore received money
    if (
      /received|credited|added|refund/i.test(textToSearch) &&
      !/paid|sent|transfer/i.test(textToSearch)
    )
      continue;

    let platform = null;
    if (sender.includes("phonepe") || textToSearch.includes("phonepe"))
      platform = "PhonePe";
    else if (
      sender.includes("google") ||
      textToSearch.includes("gpay") ||
      textToSearch.includes("google pay")
    )
      platform = "Google Pay";
    else if (sender.includes("paytm") || textToSearch.includes("paytm"))
      platform = "Paytm";

    if (!platform) continue;

    let foundPrice = 0;
    const priceRegex =
      /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
    let match;
    let maxInEmail = 0;
    while ((match = priceRegex.exec(textToSearch)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (val > maxInEmail && val < 500000) maxInEmail = val;
    }
    foundPrice = maxInEmail;

    const emailDateStr = email.date ? email.date.split("T")[0] : "unknown";
    const txKey = platform + "_" + emailDateStr + "_" + foundPrice;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      if (platform === "PhonePe") phonePeTotal += foundPrice;
      if (platform === "Google Pay") gpayTotal += foundPrice;
      if (platform === "Paytm") paytmTotal += foundPrice;
    }
  }

  return { phonePeTotal, gpayTotal, paytmTotal };
}

export const useEmailStore = create((set, get) => {
  const cachedData = loadFromCache() || {};

  return {
    isArchOverlayOpen: false,
    setArchOverlayOpen: (isOpen) => set({ isArchOverlayOpen: isOpen }),
    isWorkflowOverlayOpen: false,
    setWorkflowOverlayOpen: (isOpen) => set({ isWorkflowOverlayOpen: isOpen }),
    isCodeFlowOverlayOpen: false,
    setCodeFlowOverlayOpen: (isOpen) => set({ isCodeFlowOverlayOpen: isOpen }),
    isDataFlowOverlayOpen: false,
    setDataFlowOverlayOpen: (isOpen) => set({ isDataFlowOverlayOpen: isOpen }),
    isNetworkFlowOverlayOpen: false,
    setNetworkFlowOverlayOpen: (isOpen) =>
      set({ isNetworkFlowOverlayOpen: isOpen }),

    // Real-time Network Metrics tracking
    networkMetrics: {
      requests: 0,
      sentKb: 0,
      pending: 0,
      success: 0,
      fetchedKb: 0,
      errors: 0,
      totalTime: 0,
      avgTime: 0,
    },
    updateNetworkMetrics: (updates) =>
      set((state) => ({
        networkMetrics: { ...state.networkMetrics, ...updates },
      })),
    user: null,
    accounts: [],
    currentAccount: null,
    emails: cachedData.emails || [],
    isLoading: false,
    isInitialSync: false,
    error: null,
    isSubscriptionVerified: false,
    subscriptionType: "Basic",
    activeFolder: "inbox",
    searchQuery: "",
    selectedEmail: null,
    selectedEmailByView: { inbox: null, sent: null },
    currentPageByView: { inbox: 1, sent: 1 },
    accessToken: localStorage.getItem("google_access_token") || null,
    profile: cachedData.profile || null,
    personalInfo: null,
    userPermissions: null,
    labelStats: cachedData.labelStats || [],
    dailyStats: cachedData.dailyStats || null,
    purchaseCount: cachedData.purchaseCount || 0,
    foodSpend: cachedData.foodSpend || 0,
    foodPlatformSpend: cachedData.foodPlatformSpend || {},
    travelSpend: cachedData.travelSpend || 0,
    travelBreakdown: cachedData.travelBreakdown || {},
    travelPlatformSpend: cachedData.travelPlatformSpend || {},
    backendUrl: "http://localhost:3000",
    preferences: {
      theme: "light",
      accentColor: "#0ea5e9",
      accentName: "Sky Blue",
      isCompact: false,
      glassDepth: 85,
    },
    verificationWay: "plans",

    setPreferences: (newPrefs) => {
      set((state) => {
        let updatedPrefs = { ...state.preferences, ...newPrefs };
        if (state.subscriptionType === "Basic") {
          if (updatedPrefs.theme === "system") updatedPrefs.theme = "dark";
          const allowedAccents = ["Sky Blue", "Indigo", "Emerald"];
          if (!allowedAccents.includes(updatedPrefs.accentName)) {
            updatedPrefs.accentName = "Sky Blue";
            updatedPrefs.accentColor = "#0ea5e9";
          }
          updatedPrefs.isCompact = false;
          updatedPrefs.glassDepth = 85;
        }
        return { preferences: updatedPrefs };
      });
      get().syncSettingsToBackend();
    },

    syncSettingsToBackend: async () => {
      const { user, preferences, subscriptionType, verificationWay, backendUrl } = get();
      if (!user?.email) return;

      try {
        await fetch(`${backendUrl}/pmm/savesettings/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            way: verificationWay || 'plans',
            emailid: user.email,
            subscription_type: verificationWay === 'lucky' ? 'Elite' : subscriptionType || 'Basic',
            visual_mode: preferences.theme || 'Light',
            signature_accent: preferences.accentName || 'Sky Blue',
            compact_mode: !!preferences.isCompact,
            glass_layers: preferences.glassDepth === 40,
            push_alerts: !!preferences.notifyPush
          })
        });
      } catch (error) {
        console.error("Failed to sync settings:", error);
      }
    },

    fetchUserPermissions: async () => {
      const { user, ...state } = get();
      const emailToUse = user?.email || "";
      try {
        const response = await fetch(
          `${get().backendUrl}/pmm/getuser/permisson`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailid: emailToUse }),
          },
        );
        if (response.ok) {
          const data = await response.json();
          const accentMap = {
            "Sky Blue": "#0ea5e9", "SkyBlue": "#0ea5e9",
            "Indigo": "#6366f1",
            "Emerald": "#10b981",
            "Violet": "#8b5cf6",
            "Teal": "#14b8a6",
            "Rose": "#f43f5e",
            "Amber": "#f59e0b",
            "Orange": "#f97316"
          };

          const mappedPrefs = {
            theme: data.visual_mode?.toLowerCase() || state.preferences.theme,
            accentName: data.signature_accent || state.preferences.accentName,
            accentColor: accentMap[data.signature_accent] || state.preferences.accentColor,
            isCompact: !!data.compact_mode,
            glassDepth: data.glass_layers ? 40 : 85,
            notifyPush: !!data.push_alerts
          };

          set({
            userPermissions: data,
            subscriptionType: data.subscription_type || "Basic",
            verificationWay: data.way || "plans",
            isSubscriptionVerified: false,
            preferences: { ...state.preferences, ...mappedPrefs }
          });
        } else if (response.status === 404) {
          set({
            userPermissions: {
              subscription_type: null,
              visual_mode: null,
              signature_accent: null,
              compact_mode: null,
              glass_layers: null,
              push_alerts: null,
              live_subscription_interval: null,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch user permissions:", error);
      }
    },

    fetchLocation: async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
          const data = await response.json();
          set({
            location: {
              city: data.city || "Unknown",
              countryCode: data.country_code || "N/A",
            },
          });
        }
      } catch (error) {
        console.warn("Location fetch failed:", error);
      }
    },

    createNewUserRecord: async (selectedType = "Basic") => {
      const { user } = get();
      const emailToUse = user?.email || "";
      try {
        const response = await fetch(`${get().backendUrl}/pmm/newuser/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailid: emailToUse,
            subscription_type: selectedType,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          set({
            userPermissions: data,
            subscriptionType: data.subscription_type || "Basic",
            verificationWay: "plans",
            isSubscriptionVerified: false
          });
          return true;
        }
      } catch (error) {
        console.error("Failed to create new user record:", error);
      }
      return false;
    },

    upgradeSubscription: (type) => set({ subscriptionType: type }),

    verifySubscription: () => {
      set({ isSubscriptionVerified: true });
      // Redundant global fetch removed; handled by page-specific useEffects
      // get().fetchEmails();
    },

    initStore: () => {
      const cachedData = loadFromCache();
      if (cachedData) {
        set({
          emails: cachedData.emails || [],
          profile: cachedData.profile || null,
          labelStats: cachedData.labelStats || [],
          dailyStats: cachedData.dailyStats || null,
          purchaseCount: cachedData.purchaseCount || 0,
          foodSpend: cachedData.foodSpend || 0,
          foodPlatformSpend: cachedData.foodPlatformSpend || {},
          travelSpend: cachedData.travelSpend || 0,
          travelBreakdown: cachedData.travelBreakdown || {},
          travelPlatformSpend: cachedData.travelPlatformSpend || {},
          globalDateFilter: cachedData.globalDateFilter || get().globalDateFilter,
          pageFilters: cachedData.pageFilters || {},
          emailsByPage: cachedData.emailsByPage || {},
          securityAlertsByPage: cachedData.securityAlertsByPage || {}
        });
      }
      if (get().accessToken && get().user) {
        // Redundant global fetch removed; handled by page-specific useEffects
        // get().fetchEmails();
      }
    },
    applyLuckyCoupon: async (code) => {
      if (code !== "ELITE@2026#STAR") {
        return false;
      }
      try {
        const response = await fetch(`${get().backendUrl}/pmm/getluckuser/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailid: get().user?.email || "" })
        });

        if (!response.ok) return false;

        const data = await response.json();

        set({
          userPermissions: data,
          subscriptionType: data.subscription_type || "Elite",
          verificationWay: "lucky",
          isSubscriptionVerified: false
        });

        if (data.subscription_type !== null) {
          // get().fetchEmails();
        }
        return true;
      } catch (error) {
        console.error("Lucky coupon error:", error);
        return false;
      }
    },
    labelStats: [],
    purchaseCount: 0,
    foodOrders: 0,
    foodSpend: 0,
    foodPlatformSpend: {},
    travelBreakdown: { flights: 0, bus: 0, trains: 0, cabs: 0 },
    travelPlatformSpend: {},
    foodTransactions: [],
    travelTransactions: [],
    purchaseSpend: 0,
    purchasePlatformSpend: {},
    purchaseTransactions: [],
    subscriptionSpend: 0,
    subscriptionPlatformSpend: {},
    subscriptionTransactions: [],
    mobileRechargeSpend: 0,
    mobileRechargePlatformSpend: {},
    mobileRechargeTransactions: [],
    billingSpend: 0,
    billingPlatformSpend: {},
    billingTransactions: [],
    paymentAppSpend: { phonePe: 0, googlePay: 0, paytm: 0 },
    subscriptions: {
      netflix: 0,
      amazon: 0,
      hotstar: 0,
      disney: 0,
      spotify: 0,
    },
    careerCounts: {
      linkedin: 0,
      naukri: 0,
      indeed: 0,
      glassdoor: 0,
    },
    hrStats: {
      postingsCount: 0,
      appliedCount: 0,
      shortlistedCount: 0,
      interviewsCount: 0,
      offersCount: 0,
      offersAcceptedCount: 0,
      rejectedCount: 0,
      tableData: [],
      weeklyData: [],
      rolesData: [],
      activityFeed: [],
    },
    businessStats: {
      revenue: 0,
      orders: 0,
      activeCustomers: 0,
      newCustomers: 0,
      completedSales: 0,
      pendingOrders: 0,
      canceledOrders: 0,
      conversionRate: 0,
      tableData: [],
      chartData: {
        revenueData: [],
        categoryData: [],
        customerData: [],
        statusData: [],
      },
      activityFeed: [],
    },
    alertStats: {
      total: 0,
      critical: 0,
      warning: 0,
      resolved: 0,
      pending: 0,
      tableData: [],
      chartData: {
        trendData: [],
        severityData: [],
        categoryData: [],
        resolutionData: [],
      },
      activityFeed: [],
    },
    jobSearchStats: {
      applicationsCount: 0,
      interviewsCount: 0,
      offersCount: 0,
      rejectionsCount: 0,
      followUpsCount: 0,
      referralsCount: 0,
      tableData: [],
      referralTableData: [],
      weeklyData: [],
    },
    careerSources: [],

    subscriptionSources: [], // New dynamic subscription sources list
    emails: [],
    emailsByPage: {}, // Strictly isolated email data per pageId
    securityAlerts: [],
    securityAlertsByPage: {}, // Strictly isolated alerts per pageId
    labelStats: [],
    deviceSummary: "",
    avgReplyTime: null,
    location: { city: "Unknown", countryCode: "N/A" },
    lastSyncTime: null,
    activePageId: 'overview', // Track the current active page for smart filtering
    
    setActivePageId: (id) => set({ activePageId: id }),
    
    getEffectiveFilter: () => {
      const { activePageId, pageFilters } = get();
      return pageFilters[activePageId] || { 
        type: 'preset', 
        preset: '7d',
        mode: 'between',
        startDate: '',
        endDate: ''
      };
    },

    isLiveFilterActive: () => {
      const filter = get().getEffectiveFilter();
      if (filter.type === 'custom') return !filter.endDate;
      const historicalPresets = ['yesterday', 'day_before', 'last_week', 'last_month', 'last_quarter', 'last_year', 'all'];
      return !historicalPresets.includes(filter.preset);
    },

    initAuth: () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const token = localStorage.getItem("google_access_token");
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            },
            accessToken: token,
          });
          get().handleUserLogin(user);
        } else {
          set({ user: null, accounts: [], currentAccount: null, emails: [] });
        }
      });

      if (!window._emailRefreshInterval) {
        window._emailRefreshInterval = setInterval(() => {
          const { user, accessToken, isLoading, error } = get();
          if (user && accessToken && !isLoading && !error) {
            get().syncStats();
          }
        }, 120000);
      }
    },

    login: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        localStorage.setItem("google_access_token", token);
        // console.log("Token stored in localStorage:", !!token);

        set({ accessToken: token });

        // Explicitly trigger fetch after login
        // get().fetchEmails(); 
      } catch (error) {
        console.error("Login Error:", error);
        set({ error: "Failed to sign in with Google", isLoading: false });
      }
    },

    logout: async () => {
      try {
        await signOut(auth);
        localStorage.clear();
        sessionStorage.clear();
        set({ accessToken: null });
        window.location.href = "/connect";
      } catch (error) {
        console.error("Logout Error:", error);
      }
    },

    handleUserLogin: (user) => {
      const account = {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        avatar:
          user.photoURL ||
          user.displayName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ||
          "??",
        type: "primary",
      };
      set({
        accounts: [account],
        currentAccount: account,
      });
      get().fetchLocation();
      // Redundant global fetch removed; handled by page-specific useEffects
      // get().fetchEmails();
    },

    fetchEmails: async (targetPageId) => {
      const { user, accessToken, activePageId: currentActiveId } = get();
      const pageCtx = targetPageId || currentActiveId;
      if (!user || !accessToken) return;
      
      const effectiveFilter = get().getEffectiveFilter();
      let debugStart = effectiveFilter.startDate || 'N/A';
      if (effectiveFilter.type === 'preset' && effectiveFilter.preset !== 'all') {
        const daysMap = { '1d': 1, '2d': 2, '7d': 7, '30d': 30, '1m': 30, 'qm': 90, '3d': 3 };
        const days = daysMap[effectiveFilter.preset] || 0;
        if (days > 0) {
          debugStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleString();
        }
      }

      const { query, afterDate, beforeDate } = buildGmailQuery(effectiveFilter);

      /*
      console.log(`[API Call] Fetching emails for ${effectiveFilter.type}: ${effectiveFilter.preset || 'Custom'} (${pageCtx})`, {
        gmailQuery: query || 'Default (Latest)',
        preciseStart: afterDate ? afterDate.toLocaleString() : 'Oldest',
        preciseEnd: beforeDate ? beforeDate.toLocaleString() : 'Now'
      });
      */

      const subscriptionType = get().subscriptionType;
      const isPro = subscriptionType === "Pro" || subscriptionType === "Elite";
      const isElite = subscriptionType === "Elite";

      // 1. Initial State for UI responsiveness
      set({ isLoading: true, isInitialSync: true });

      try {
        // 2. PHASE 1: Core Profile & Labels (Essential for all tiers)
        const [
          profile,
          labels,
          dailyStatsResult,
          personalInfoResult,
          securityAlertsResult,
        ] = await Promise.all([
          emailService.getProfileStats(accessToken),
          emailService.getLabels(accessToken),
          emailService.getDailyStats(accessToken),
          emailService.getPersonalInfo(accessToken).catch(() => null),
          emailService.getSecurityAlerts(accessToken),
        ]);

        const coreState = {
          profile,
          labelStats: labels,
          dailyStats: dailyStatsResult,
          securityAlerts: securityAlertsResult,
          securityAlertsByPage: { 
            ...get().securityAlertsByPage, 
            [pageCtx]: securityAlertsResult 
          },
          isInitialSync: false,
        };
        set(coreState);
        saveToCache(coreState);

        // 3. PHASE 2: Discovery Emails — parallelize but update as they come
        const discoveryTasks = [
          async () => {
            let emails = [];
            try {
              emails = await emailService.getEmails(
                accessToken,
                user.email,
                query,
                200,
                500
              );
              set((state) => ({ 
                emails,
                emailsByPage: { ...state.emailsByPage, [pageCtx]: emails }
              }));
              saveToCache({ emails, emailsByPage: get().emailsByPage });
            } catch (err) {
              console.error("[Task 0 Error] Failed to fetch primary emails:", err);
            } finally {
              set({ isLoading: false }); // GUARANTEE UNLOCK
            }
            /*
            console.log(`[Diagnostic] API returned ${emails.length} emails. Sample dates:`, 
              emails.slice(0, 3).map(e => ({ id: e.id, date: e.date, parsed: new Date(e.date).toLocaleString() }))
            );
            */
            // Filter check
            const today = new Date(); today.setHours(0,0,0,0);
            const todayEmails = emails.filter(e => new Date(e.date) >= today);
            // console.log(`[Diagnostic] Emails matching TODAY cutoff (${today.toLocaleString()}): ${todayEmails.length}`);
            return emails;
          },
          isPro
            ? async () => {
              const jobQuery = 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")';
              const combinedJobQuery = query ? `(${query}) ${jobQuery}` : jobQuery;
              const results = await emailService.getEmails(
                accessToken,
                user.email,
                combinedJobQuery,
              );
              const jobStats = await processJobSearchInsight(results);
              set({ 
                dynamicSourceEmails: results,
                jobSearchStats: jobStats
              });
              saveToCache({ jobSearchStats: jobStats });
              return results;
            }
            : () => Promise.resolve([]),
          isPro
            ? async () => {
              const travelBase = '(redbus OR "redBus Tax Invoice" OR from:(redbus OR abhibus OR irctc OR trainman OR confirmtkt OR railyatri OR ixigo OR "paytm travel" OR uber OR ola OR rapido OR indigo OR spicejet OR vistara OR "air india" OR makemytrip OR goibibo OR yatra OR cleartrip OR oyo OR airbnb OR "booking.com" OR expedia OR agoda OR "hotels.com") OR ((subject:(ticket OR booking OR reservation OR itinerary OR "boarding pass" OR "stay confirmation" OR invoice OR receipt OR "travel plan")) AND (travel OR flight OR hotel OR cab OR taxi OR bus OR train OR trip OR "check-in"))) newer_than:2y';
              const travelQuery = query ? `(${query}) ${travelBase}` : travelBase;
              const results = await emailService.getEmails(
                accessToken,
                user.email,
                travelQuery,
                200,
                200,
              );
              const travelInsight = await processTravelInsight(
                results,
                accessToken,
                emailService,
              );
              set({
                travelSpend: travelInsight.calculatedTravelSpend,
                travelBreakdown: travelInsight.travelBreakdown,
                travelPlatformSpend: travelInsight.travelPlatformSpend,
                travelTransactions: travelInsight.travelTransactions,
              });
              saveToCache({
                travelSpend: travelInsight.calculatedTravelSpend,
                travelBreakdown: travelInsight.travelBreakdown,
                travelPlatformSpend: travelInsight.travelPlatformSpend,
              });
              return results;
            }
            : () => Promise.resolve([]),
        ];

        await emailService.batchPromises(discoveryTasks, 2);

        // 4. PHASE 3: Deeper Insights & Counts (Background)
        const backgroundTasks = [
          async () => {
            if (!isPro) return;
            const count = await emailService.getSearchCount(
              accessToken,
              "purchase OR order OR receipt",
            );
            set({ purchaseCount: count });
            saveToCache({ purchaseCount: count });
          },
          async () => {
            if (!isPro) return;
            const foodBase = '(from:(swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR dominos OR pizzahut OR KFC OR mcdonalds OR "burger king" OR starbucks OR dunkin OR subway OR eatsure OR box8 OR foodpanda OR magicpin OR dunzo OR "rebel foods" OR faasos OR behrouz OR freshmenu OR curefit OR "eat.fit") OR ((subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "your order" OR "food order" OR "sent" OR "paid")) AND (food OR swiggy OR zomato OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR "meal kit" OR "order confirmed"))) newer_than:2y';
            const foodQuery = query ? `(${query}) ${foodBase}` : foodBase;
            const foodEmails = await emailService.getEmails(
              accessToken,
              user.email,
              foodQuery,
              200,
              200,
            );
            const foodInsight = await processFoodInsight(
              foodEmails,
              accessToken,
              emailService,
            );
            set({
              foodSpend: foodInsight.calculatedFoodSpend,
              foodPlatformSpend: foodInsight.foodPlatformSpend,
              foodTransactions: foodInsight.foodTransactions,
              foodOrders: foodInsight.foodTransactions.length,
            });
            saveToCache({
              foodSpend: foodInsight.calculatedFoodSpend,
              foodPlatformSpend: foodInsight.foodPlatformSpend,
            });
          },
        ];

        emailService.batchPromises(backgroundTasks, 2);
        set({ isLoading: false, lastSyncTime: Date.now() });
      } catch (error) {
        console.error("Failed to fetch emails:", error);
        if (error.message?.includes("401") || error.status === 401) {
          localStorage.removeItem("google_access_token");
          set({
            accessToken: null,
            error:
              "Your session has expired. Please sign in again to continue.",
            isLoading: false,
          });
        } else {
          set({
            error: "Failed to fetch emails: " + error.message,
            isLoading: false,
          });
        }
      }
    },

    syncStats: async () => {
      const {
        user,
        accessToken,
        isLoading,
        subscriptionType,
        isSubscriptionVerified,
      } = get();
      if (!user || !accessToken || isLoading || !isSubscriptionVerified) return;

      const effectiveFilter = get().getEffectiveFilter();
      const tierOrder = { Basic: 0, Pro: 1, Elite: 2 };
      const currentTier = tierOrder[subscriptionType] || 0;
      const isPro = currentTier >= 1;
      const isElite = currentTier >= 2;

      const { query: dateQuery } = buildGmailQuery(effectiveFilter);
      const purchaseQuery = dateQuery ? `(${dateQuery}) (purchase OR order OR receipt)` : "purchase OR order OR receipt";

      try {
        // 1. Core Profile & Security alerts
        const [labels, dailyStatsResult, securityAlertsResult, purchaseCount] =
          await Promise.all([
            emailService.getLabels(accessToken),
            emailService.getDailyStats(accessToken),
            emailService.getSecurityAlerts(accessToken),
            emailService.getSearchCount(
              accessToken,
              purchaseQuery,
            ),
          ]);

        // 2. Discovery Emails in batches
        const discoveryTasks = [];
        if (isPro) {
          const foodQuery = `(subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "sent" OR "paid")) AND (food OR delivery OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR foodhub OR dominos)`;
          const travelQuery = `(subject:(order OR receipt OR invoice OR bill OR ticket OR booking OR reservation OR itinerary OR confirmation OR "sent" OR "paid")) AND (travel OR flight OR hotel OR cab OR taxi OR uber OR ola OR lyft OR indigo OR "air india" OR spicejet OR vistar OR makemytrip OR airbnb OR booking.com)`;
          const shoppingQuery = `(subject:(order OR "your order" OR receipt OR invoice OR bill OR "payment received" OR "sent" OR "paid" OR delivery OR "out for delivery" OR delivered)) AND (amazon OR flipkart OR myntra OR ajio OR nykaa OR meesho OR tatacliq OR lenskart OR decathlon OR reliance OR croma OR shopping)`;
          const subQuery = `(subject:(subscription OR renewal OR membership OR bill OR receipt OR invoice OR "payment received" OR "sent" OR "paid")) AND (netflix OR spotify OR youtube OR "amazon prime" OR "disney+" OR hotstar OR premium OR cloud OR icloud OR "google one" OR canva OR adobe OR chatgpt OR openai)`;
          const reachargeQuery = `(subject:(recharge OR prepaid OR postpaid OR bill OR payment) AND (jio OR airtel OR vi OR bsnl OR vodafone OR idea))`;
          const utilityQuery = `(subject:(bill OR invoice OR receipt OR payment) AND (electricity OR water OR gas OR broadband OR wifi OR internet OR dth OR utility OR bescom OR msedcl OR adani OR tata OR act OR hathway OR jiofiber OR airtel))`;
          const financeQuery = `(from:(phonepe OR paytm OR google) OR subject:("paid to" OR "sent rs" OR "paid rs"))`;
          const jobQuery = `subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")`;

          discoveryTasks.push(
            () => emailService.getSearchCount(accessToken, dateQuery ? `(${dateQuery}) ${foodQuery}` : foodQuery),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${foodQuery}` : foodQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${travelQuery}` : travelQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${shoppingQuery}` : shoppingQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${subQuery}` : subQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${reachargeQuery}` : reachargeQuery, 20),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${utilityQuery}` : utilityQuery, 20),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${financeQuery}` : financeQuery, 100),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${jobQuery}` : jobQuery, 50),
          );
        }

        if (isElite) {
          const hrQuery = `subject:(candidate OR applicant OR "applied for" OR "new application" OR "interview scheduled" OR "offer accepted")`;
          const bizQuery = `subject:(order OR invoice OR receipt OR payment OR shipped OR canceled OR "new order" OR "payment received")`;
          const alertQuery = `subject:(alert OR security OR warning OR critical OR error OR "system alert" OR "new login" OR "password changed")`;

          discoveryTasks.push(
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${hrQuery}` : hrQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${bizQuery}` : bizQuery, 50),
            () => emailService.getEmails(accessToken, user.email, dateQuery ? `(${dateQuery}) ${alertQuery}` : alertQuery, 50),
          );
        }

        let discoveryResults = [];
        if (discoveryTasks.length > 0) {
          discoveryResults = await emailService.batchPromises(
            discoveryTasks,
            2,
          );
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
        const emptyTravel = {
          calculatedTravelSpend: 0,
          travelPlatformSpend: [],
        };
        const emptyPurchase = {
          calculatedPurchaseSpend: 0,
          purchasePlatformSpend: [],
          purchaseTransactions: [],
        };
        const emptySubscription = {
          calculatedSubscriptionSpend: 0,
          subscriptionPlatformSpend: [],
          subscriptionTransactions: [],
        };
        const emptyMobile = {
          calculatedMobileRechargeSpend: 0,
          mobileRechargePlatformSpend: [],
          mobileRechargeTransactions: [],
        };
        const emptyBilling = {
          calculatedBillingSpend: 0,
          billingPlatformSpend: [],
          billingTransactions: [],
        };
        const emptyPayment = {
          calculatedPaymentAppSpend: 0,
          paymentAppPlatformSpend: [],
        };
        const emptyJob = {
          applicationsCount: 0,
          interviewsCount: 0,
          offersCount: 0,
          rejectionsCount: 0,
          followUpsCount: 0,
          tableData: [],
          weeklyData: [],
        };
        const emptyHr = {
          totalEmails: 0,
          activeDiscussions: 0,
          pendingActions: 0,
          positiveSentiment: 0,
          alerts: [],
          recentActivity: [],
        };
        const emptyBusiness = {
          revenue: 0,
          expenses: 0,
          netProfit: 0,
          activeClients: 0,
          invoices: [],
          alerts: [],
          transactions: [],
        };
        const emptyAlert = {
          totalAlerts: 0,
          criticalAlerts: 0,
          warnings: 0,
          resolved: 0,
          alertData: [],
        };

        const [
          { calculatedFoodSpend, foodPlatformSpend: newFoodPlatformSpend },
          {
            calculatedTravelSpend,
            travelPlatformSpend: newTravelPlatformSpend,
          },
          {
            calculatedPurchaseSpend,
            purchasePlatformSpend: newPurchasePlatformSpend,
            purchaseTransactions: newPurchaseTransactions,
          },
          {
            calculatedSubscriptionSpend: newSubscriptionSpend,
            subscriptionPlatformSpend: newSubscriptionPlatformSpend,
            subscriptionTransactions: newSubscriptionTransactions,
          },
          {
            calculatedMobileRechargeSpend: newMobileRechargeSpend,
            mobileRechargePlatformSpend: newMobileRechargePlatformSpend,
            mobileRechargeTransactions: newMobileRechargeTransactions,
          },
          {
            calculatedBillingSpend: newBillingSpend,
            billingPlatformSpend: newBillingPlatformSpend,
            billingTransactions: newBillingTransactions,
          },
          newPaymentAppSpend,
          newJobSearchStats,
          newHrStats,
          newBusinessStats,
          newAlertStats,
        ] = await Promise.all([
          isPro
            ? processFoodInsight(foodEmailDetails, accessToken, emailService)
            : emptyFood,
          isPro
            ? processTravelInsight(
              travelEmailDetails,
              accessToken,
              emailService,
            )
            : emptyTravel,
          isPro
            ? processPurchaseInsight(
              purchaseEmailDetails,
              accessToken,
              emailService,
            )
            : emptyPurchase,
          isPro
            ? processSubscriptionInsight(
              subscriptionEmailDetails,
              accessToken,
              emailService,
            )
            : emptySubscription,
          isPro
            ? processMobileRechargeInsight(
              mobileRechargeEmailDetails,
              accessToken,
              emailService,
            )
            : emptyMobile,
          isPro
            ? processBillingInsight(
              billingEmailDetails,
              accessToken,
              emailService,
            )
            : emptyBilling,
          isPro
            ? processPaymentAppInsight(paymentAppEmailDetails)
            : emptyPayment,
          isPro ? processJobSearchInsight(jobSearchEmailDetails) : emptyJob,
          isElite ? processHRInsight(hrEmailDetails) : emptyHr,
          isElite
            ? processBusinessInsight(businessEmailDetails)
            : emptyBusiness,
          isElite ? calculateAlertStats(alertEmailDetails) : emptyAlert,
        ]);

        // --- Process Device Detection ---
        const deviceSet = new Set(["Desktop"]);
        if (Array.isArray(securityAlertsResult)) {
          securityAlertsResult.forEach((alert) => {
            const snippet = alert.snippet || "";
            const match =
              snippet.match(
                /on\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i,
              ) ||
              snippet.match(
                /from\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|$)/i,
              ) ||
              snippet.match(
                /on\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i,
              );
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
          error: null,
        });
        // console.log("Lightweight stats sync successful");
      } catch (error) {
        console.error("Failed to sync stats:", error);
        if (error.message?.includes("401") || error.status === 401) {
          localStorage.removeItem("google_access_token");
          set({
            accessToken: null,
            error:
              "Your session has expired. Please sign in again to continue.",
          });
        }
      }
    },

    addAccount: (account) => {
      const newAccount = {
        id: Math.random().toString(36).substr(2, 9),
        ...account,
        avatar:
          account.photoURL ||
          account.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ||
          "??",
      };
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        currentAccount: newAccount,
      }));
      // Redundant global fetch removed; handled by page-specific useEffects
      // get().fetchEmails();
    },

    switchAccount: (accountId) => {
      const account = get().accounts.find((a) => a.id === accountId);
      if (account) {
        set({ currentAccount: account, selectedEmail: null });
        // get().fetchEmails();
      }
    },

    removeAccount: (accountId) => {
      set((state) => {
        const remaining = state.accounts.filter((a) => a.id !== accountId);
        return {
          accounts: remaining,
          currentAccount:
            state.currentAccount?.id === accountId
              ? remaining[0] || null
              : state.currentAccount,
        };
      });
    },

    setActiveFolder: (folder) => set({ activeFolder: folder }),

    searchTerm: '', // New state property
    searchQuery: '', // New state property (or re-initialization)
    
    // Page-specific last used filters
    pageFilters: cachedData.pageFilters || {},

    setPageFilter: (pageId, filter) => {
      set((state) => {
        const updated = { ...state.pageFilters, [pageId]: filter };
        saveToCache({ pageFilters: updated });
        
        // If updating the active page's filter, the page's useEffect will handle the re-fetch
        // No manual call needed here to avoid double-fetching
        return { pageFilters: updated };
      });
    },

    globalDateFilter: cachedData.globalDateFilter || {
      type: 'preset',
      preset: '7d', // Default to 7d as preferred system wide
      mode: 'between',
      startDate: '',
      endDate: '',
      selectedPages: ['all']
    },
    setGlobalDateFilter: (filter) => {
      set({ globalDateFilter: filter });
      saveToCache({ globalDateFilter: filter });
      // The individual pages listen to filter changes and re-fetch themselves
      // get().fetchEmails();
    },
    isFilterOverlayOpen: false,
    hideFilterContext: false,
    setFilterOverlayOpen: (isOpen, hideContext = false) => set({ isFilterOverlayOpen: isOpen, hideFilterContext: hideContext }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedEmail: (email, viewType) => {
      if (viewType) {
        set((state) => ({
          selectedEmail: email,
          selectedEmailByView: { ...state.selectedEmailByView, [viewType]: email }
        }));
      } else {
        set({ selectedEmail: email });
      }
      if (email && email.status === "unread") {
        const { accessToken } = get();
        if (accessToken) get().markAsRead(email.id);
      }
    },

    setCurrentPageByView: (viewType, page) => {
      set((state) => ({
        currentPageByView: {
          ...state.currentPageByView,
          [viewType]: page
        }
      }));
    },

    markAsRead: async (id) => {
      const { accessToken } = get();
      if (!accessToken) return;

      await emailService.markAsRead(accessToken, id);
      set((state) => ({
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, status: "read" } : e,
        ),
      }));
    },

    toggleStar: async (id) => {
      const { accessToken, emails } = get();
      if (!accessToken) return;

      const email = emails.find((e) => e.id === id);
      if (!email) return;

      const isStarred = email.starred;
      await emailService.toggleStar(accessToken, id, isStarred);

      set((state) => ({
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, starred: !isStarred } : e,
        ),
      }));
    },

    toggleImportant: async (id) => {
      const { accessToken, emails } = get();
      if (!accessToken) return;

      const email = emails.find((e) => e.id === id);
      if (!email) return;

      const isImportant = email.important;
      await emailService.toggleImportant(accessToken, id, isImportant);

      set((state) => ({
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, important: !isImportant } : e,
        ),
      }));
    },

    archiveEmail: async (id) => {
      const { accessToken } = get();
      if (!accessToken) return;

      await emailService.archiveEmail(accessToken, id);
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== id),
      }));
    },

    deleteEmail: async (id) => {
      const { accessToken } = get();
      if (!accessToken) return;

      await emailService.deleteEmail(accessToken, id);
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== id),
      }));
    },

    getDateFilteredEmails: (pageId) => {
      const { emails: globalEmails, emailsByPage, globalDateFilter, pageFilters } = get();
      const pageEmails = emailsByPage[pageId] || globalEmails;
      const selectedPages = globalDateFilter.selectedPages || ['all'];
      const isSynced = selectedPages.includes('all') || selectedPages.includes(pageId);
      
      const filterToUse = isSynced ? globalDateFilter : (pageFilters[pageId] || { type: 'preset', preset: '7d' });
      return applyDateFilterToList(pageEmails, filterToUse);
    },

    getDateFilteredSecurityAlerts: (pageId = 'overview') => {
      const { securityAlerts: globalAlerts, securityAlertsByPage, globalDateFilter, pageFilters } = get();
      const pageAlerts = securityAlertsByPage[pageId] || globalAlerts;
      const selectedPages = globalDateFilter.selectedPages || ['all'];
      const isSynced = selectedPages.includes('all') || selectedPages.includes(pageId);

      const filterToUse = isSynced ? globalDateFilter : (pageFilters[pageId] || { type: 'preset', preset: '7d' });
      return applyDateFilterToList(pageAlerts || [], filterToUse);
    },

    getFilteredAlertStats: (pageId = 'alerts-center') => {
      const alerts = get().getDateFilteredSecurityAlerts(pageId);
      // console.log(`[Diagnostic] getFilteredAlertStats(${pageId}): ${alerts.length} alerts passing filter`);
      return calculateAlertStats(alerts);
    },

    getFilteredEmails: () => {
      const { emails: globalEmails, emailsByPage, activeFolder, searchQuery, globalDateFilter, pageFilters } = get();
      // EmailList uses activeFolder as pageId context
      const sourceEmails = emailsByPage[activeFolder] || globalEmails;
      
      // 1. Sync check (Ecosystem Sync)
      const selectedPages = globalDateFilter.selectedPages || ['all'];
      const isSynced = selectedPages.includes('all') || selectedPages.includes(activeFolder);
      
      let filtered = sourceEmails;

      // 2. Apply Date Filtering
      const filterToUse = isSynced ? globalDateFilter : (pageFilters[activeFolder] || { type: 'preset', preset: '7d' });
      filtered = applyDateFilterToList(filtered, filterToUse);

      // Filter by folder
      if (activeFolder === "inbox") {
        filtered = filtered.filter((e) => e.type === "incoming");
      } else if (activeFolder === "sent") {
        filtered = filtered.filter((e) => e.type === "outgoing");
      } else if (activeFolder === "spam") {
        filtered = filtered.filter((e) => e.type === "spam");
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.subject.toLowerCase().includes(query) ||
            e.sender.toLowerCase().includes(query) ||
            (e.recipient && e.recipient.toLowerCase().includes(query)),
        );
      }

      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getStats: () => {
      const {
        emails: rawEmails,
        labelStats,
        purchaseCount,
        subscriptions,
        careerCounts,
        careerSources,
      } = get();
      
      const activeId = get().activePageId;

      // Apply context-aware date filter for computed stats
      const emails = get().getDateFilteredEmails(activeId);

      const incoming = emails.filter((e) => e.type === "incoming");
      const outgoing = emails.filter((e) => e.type === "outgoing");

      // Number formatting helper (Abbreviated if > 999)
      const formatNumber = (num) => {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "k";
        return num.toString();
      };

      // Label-wise counts from API
      const getLabelCount = (id) =>
        labelStats.find((l) => l.id === id)?.messagesTotal || 0;
      const getLabelUnread = (id) =>
        labelStats.find((l) => l.id === id)?.messagesUnread || 0;

      // Storage estimation (Average 25KB per email)
      const AVG_SIZE_KB = 25;
      const formatStorage = (count) =>
        ((count * AVG_SIZE_KB) / 1024).toFixed(2); // Convert to MB

      const storageBreakdown = {
        read: formatStorage(getLabelCount("INBOX") - getLabelUnread("INBOX")),
        unread: formatStorage(getLabelUnread("INBOX")),
        sent: formatStorage(getLabelCount("SENT")),
        drafts: formatStorage(getLabelCount("DRAFT")),
        total: formatStorage(
          getLabelCount("INBOX") +
          getLabelCount("SENT") +
          getLabelCount("DRAFT") +
          getLabelCount("SPAM"),
        ),
      };

      // Label-wise counts for categories
      const categoryCounts = emails.reduce((acc, email) => {
        const category = email.category || "other";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const latestEmail = emails[0];
      const dynamic = {
        emails: emails.length,
        read: emails.filter(e => e.status === 'read').length,
        unread: emails.filter(e => e.status === 'unread').length,
        sent: emails.filter(e => e.type === 'outgoing').length,
        drafts: emails.filter(e => e.category === 'drafts' || (e.labels && e.labels.includes('DRAFT'))).length,
        trash: emails.filter(e => e.category === 'trash' || (e.labels && e.labels.includes('TRASH'))).length,
        starred: emails.filter(e => e.starred).length,
        latestActivityTime: latestEmail ? new Date(latestEmail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        latestActivityDate: latestEmail ? new Date(latestEmail.date).toLocaleDateString() : "No Data",
        storageUsed: formatStorage(emails.length),
        storagePercent: Math.min(100, Math.round((parseFloat(formatStorage(emails.length)) / 15360) * 100)),
      };

      return {
        dynamic,
        incoming:
          (get().profile?.messagesTotal || 0) -
          getLabelCount("SENT") -
          getLabelCount("DRAFT"),
        outgoing: getLabelCount("SENT"),
        unread: getLabelUnread("INBOX"),
        spam: getLabelCount("SPAM"),
        drafts: getLabelCount("DRAFT"),
        trash: getLabelCount("TRASH"),
        starred: getLabelCount("STARRED"),
        important: getLabelCount("IMPORTANT"),
        purchases: purchaseCount,
        foodOrders: get().foodOrders,
        foodSpend: get().foodSpend,
        foodPlatformSpend: get().foodPlatformSpend,
        foodTransactions: get().foodTransactions,
        travelSpend: get().travelSpend,
        travelBreakdown: get().travelBreakdown,
        travelPlatformSpend: get().travelPlatformSpend,
        travelTransactions: get().travelTransactions,
        purchaseSpend: get().purchaseSpend,
        purchasePlatformSpend: get().purchasePlatformSpend,
        purchaseTransactions: get().purchaseTransactions,
        subscriptionSpend: get().subscriptionSpend,
        subscriptionPlatformSpend: get().subscriptionPlatformSpend,
        subscriptionTransactions: get().subscriptionTransactions,
        mobileRechargeSpend: get().mobileRechargeSpend,
        mobileRechargePlatformSpend: get().mobileRechargePlatformSpend,
        mobileRechargeTransactions: get().mobileRechargeTransactions,
        billingSpend: get().billingSpend,
        billingPlatformSpend: get().billingPlatformSpend,
        billingTransactions: get().billingTransactions,
        paymentAppSpend: get().paymentAppSpend,
        subscriptions,
        storage: storageBreakdown,
        labelCounts: categoryCounts,
        jobSearch: get().jobSearchStats,
        hr: get().hrStats,
        business: get().businessStats,
        alerts: get().alertStats,

        subscriptionInsights: {
          total: (get().subscriptionSources || []).reduce(
            (sum, s) => sum + s.count,
            0,
          ),
          sources: get().subscriptionSources || [],
        },
        daily: get().dailyStats || {
          todayTotal: 0,
          todayRead: 0,
          todayUnread: 0,
          todaySent: 0,
          todayDrafts: 0,
          todaySpam: 0,
          todayTrash: 0,
        },
        security: {
          alerts: get().getDateFilteredSecurityAlerts(),
          avgReplyTime: get().avgReplyTime || "N/A",
          devices: get().deviceCount || 1,
          deviceSummary: get().deviceSummary || "",
          location: get().location || { city: "Unknown", countryCode: "N/A" },
        },
        formatNumber, // Expose the formatter
      };
    },
  };
});
