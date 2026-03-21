import { create } from 'zustand';
import { emailService } from '../services/emailService';
import { extractTextFromPdf, parseAmountFromInvoiceText } from '../utils/pdfParser';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

/**
 * Normalizes platform names from various aliases (e.g., AMAZONPA -> Amazon).
 */
function normalizePlatformName(rawName) {
  if (!rawName) return 'Other';
  let name = rawName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  const upper = name.toUpperCase();
  if (upper.includes('AMAZON')) return 'Amazon';
  if (upper.includes('FLIPKART')) return 'Flipkart';
  if (upper.includes('MYNTRA')) return 'Myntra';
  if (upper.includes('ZOMATO')) return 'Zomato';
  if (upper.includes('SWIGGY')) return 'Swiggy';
  if (upper.includes('UBER')) return 'Uber';
  if (upper.includes('OLA')) return 'Ola';
  if (upper.includes('RAPIDO')) return 'Rapido';
  if (upper.includes('REDBUS')) return 'RedBus';
  if (upper.includes('INDIGO')) return 'IndiGo';
  if (upper.includes('IRCTC')) return 'IRCTC';
  return name;
}

// --- Spend Extraction Helpers (Modularity) ---

/**
 * Processes food delivery emails to extract total spend and platform breakdown.
 */
async function processFoodInsight(emails, accessToken, emailService) {
  let calculatedFoodSpend = 0;
  const foodPlatformSpend = {};
  const foodTransactions = [];
  const confirmedFoodEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();

  for (const email of confirmedFoodEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();

    const platforms = [
      { name: 'Swiggy', keywords: /swiggy/, domains: ['swiggy.com'] },
      { name: 'Zomato', keywords: /zomato/, domains: ['zomato.com'] },
      { name: "Domino's", keywords: /domino/, domains: ['dominos.co.in', 'dominos.com'] },
      { name: "McDonald's", keywords: /mcdonald|mcdonalds/, domains: ['mcdonalds.com'] },
      { name: 'Pizza Hut', keywords: /pizza hut|pizzahut/, domains: ['pizzahut.co.in', 'pizzahut.com'] },
      { name: 'KFC', keywords: /\bkfc\b/, domains: ['kfc.co.in', 'kfc.com'] },
      { name: 'Uber Eats', keywords: /uber eats|ubereats/, domains: ['ubereats.com'] },
      { name: 'Starbucks', keywords: /starbucks/, domains: ['starbucks.com'] },
      { name: 'Dunzo Food', keywords: /dunzo/, domains: ['dunzo.in'] },
      { name: 'Faasos', keywords: /faasos/, domains: ['faasos.com'] },
      { name: 'Behrouz Biryani', keywords: /behrouz/, domains: ['behrouzb biryani.com'] },
      { name: 'FreshMenu', keywords: /freshmenu/, domains: ['freshmenu.com'] },
      { name: 'EatSure', keywords: /eatsure/, domains: ['eatsure.com'] },
      { name: 'Box8', keywords: /box8/, domains: ['box8.in'] },
      { name: 'MagicPin', keywords: /magicpin/, domains: ['magicpin.in'] },
      { name: 'CureFit', keywords: /curefit|eat\.fit/, domains: ['curefit.com', 'eat.fit'] },
      { name: 'Rebel Foods', keywords: /rebel foods/, domains: ['rebelfoods.com'] },
      { name: 'Taco Bell', keywords: /taco bell/, domains: ['tacobell.com'] },
      { name: 'Blue Tokai', keywords: /blue tokai/, domains: ['bluetokai.com'] },
    ];

    let platform = 'Other';
    let isConfirmedFood = false;
    const sender = (email.sender || '').toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmedFood = true; break; }
    }

    if (!isConfirmedFood) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmedFood = true; break; }
      }
    }

    // DYNAMIC PAYMENT DETECTION: If email is from PhonePe/Paytm/etc, extract the target food platform
    if (platform === 'Other' || !isConfirmedFood) {
      const paymentProviders = ['phonepe.com', 'paytm.com', 'google.com', 'razorpay.com', 'phonepe', 'paytm', 'gpay'];
      const isFromPaymentProvider = paymentProviders.some(p => sender.includes(p) || textToSearch.includes(p));
      
      if (isFromPaymentProvider) {
        const paymentTargetPattern = /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-]+?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern = /paid to\s+([a-z0-9\s\-]+?)(?:\r|\n|$)/i;
        
        // Improved detection for payment targets: Capture the full name after "to" but before common stop-words
        const subjectToPattern = /to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i;
        
        let targetMatch = email.subject.match(subjectToPattern) || textToSearch.match(paymentTargetPattern) || textToSearch.match(bodyPaidToPattern);
        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          
          // Clean up if common markers accidentally got caught
          const stopWords = [' ON ', ' AT ', ' VIA ', ' FROM ', ' TXN ', ' DATE '];
          for (const word of stopWords) {
            if (rawTarget.includes(word)) {
              rawTarget = rawTarget.split(word)[0].trim();
            }
          }

          if (rawTarget && !paymentProviders.some(p => rawTarget.toLowerCase().includes(p.split('.')[0]))) {
             platform = normalizePlatformName(rawTarget);
             isConfirmedFood = true;
          }
        }
        
        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific food platform, SKIP it.
        // This prevents large non-food bank transfers (like 5k+ rent/payments) from being counted as "Other" food.
        if (platform === 'Other' || !isConfirmedFood) continue;
      }
    }
    if (platform !== 'Other') {
      // DYNAMIC FILTERS: Ensure it's an actual transaction/order and not marketing
      const lowerPlatform = platform.toLowerCase();
      const dynamicOrderSubject = `your ${lowerPlatform} order from`;
      const dynamicSentSubject = `sent .* to ${lowerPlatform}`;
      const dynamicPaymentText = `paid to ${lowerPlatform}`;
      const genericOrderMarkers = /order confirmed|order placed|order summary|receipt|invoice|bill|delivery|payment received|sent ₹/;

      const hasDynamicSubject = email.subject.toLowerCase().includes(dynamicOrderSubject) ||
        (email.subject.toLowerCase().includes('sent') && email.subject.toLowerCase().includes(lowerPlatform));
      const hasDynamicPayment = textToSearch.includes(dynamicPaymentText);
      const hasGenericMarker = genericOrderMarkers.test(textToSearch);

      if (!hasDynamicSubject && !hasDynamicPayment && !hasGenericMarker) {
        // Skip marketing noise like "Zomato: We've fallen for you!" or "Swiggy: Hot deals inside"
        continue;
      }
    }

    if (platform === 'Other') {
      const foodMarkers = /restaurant|meal|dish|pizza|burger|cuisine|bakery|cafe|takeaway|kitchen/;
      const orderMarkers = /order confirmed|order placed|delivery|receipt/;
      if (!foodMarkers.test(textToSearch) || !orderMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    if (email.hasAttachments && email.attachments) {
      const invoicePdf = email.attachments.find(a =>
        a.mimeType === 'application/pdf' && /invoice|receipt|bill|tax/i.test(a.filename)
      );
      if (invoicePdf) {
        try {
          const attachmentData = await emailService.getAttachment(accessToken, email.id, invoicePdf.id);
          if (attachmentData && attachmentData.data) {
            const pdfText = await extractTextFromPdf(attachmentData.data);
            const pdfAmount = parseAmountFromInvoiceText(pdfText);
            if (pdfAmount > 0) foundPrice = pdfAmount;
          }
        } catch (err) { console.warn("Failed to parse PDF invoice for food order:", err); }
      }
    }

    if (foundPrice === 0) {
      const totalPatterns = [
        /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s+(?:[a-z0-9\s\-]{1,20})\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|grand total|paid|amount|rupees|final|order total|to\s+[a-z]+)/gi
      ];
      for (const pattern of totalPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(textToSearch);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > 0 && val < 50000) { foundPrice = val; break; }
        }
      }
      if (foundPrice === 0) {
        const priceRegex = /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
        let match; let maxInEmail = 0;
        while ((match = priceRegex.exec(textToSearch)) !== null) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > maxInEmail && val < 50000) maxInEmail = val;
        }
        foundPrice = maxInEmail;
      }
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) {
      continue;
    }
    if (foundPrice > 0) {
      seenTransactions.add(txKey);
    }

    calculatedFoodSpend += foundPrice;
    if (foundPrice > 0) {
      foodPlatformSpend[platform] = (foodPlatformSpend[platform] || 0) + foundPrice;
      foodTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject });
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
  const confirmedTravelEmails = emails.filter(e => !e.isPlaceholder)
    .sort((a, b) => {
      const aIsInvoice = /invoice|tax/i.test(a.subject);
      const bIsInvoice = /invoice|tax/i.test(b.subject);
      return (aIsInvoice && !bIsInvoice) ? -1 : (!aIsInvoice && bIsInvoice ? 1 : 0);
    });

  const seenTransactions = new Set();
  const seenTripSpends = new Set();
  const seenInvoices = new Set();

  for (const email of confirmedTravelEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    const sender = (email.sender || '').toLowerCase();

    const platforms = [
      { name: 'Uber', keywords: /uber/, domains: ['uber.com'] },
      { name: 'Ola', keywords: /ola/, domains: ['olacabs.com'] },
      { name: 'Rapido', keywords: /rapido/, domains: ['rapido.xyz'] },
      { name: 'RedBus', keywords: /redbus/, domains: ['redbus.in', 'redbus.com'] },
      { name: 'AbhiBus', keywords: /abhibus/, domains: ['abhibus.com'] },
      { name: 'IndiGo', keywords: /indigo/, domains: ['goindigo.in'] },
      { name: 'SpiceJet', keywords: /spicejet/, domains: ['spicejet.com'] },
      { name: 'Vistara', keywords: /vistara/, domains: ['airvistara.com'] },
      { name: 'Air India', keywords: /air india/, domains: ['airindia.com', 'airindia.in'] },
      { name: 'MakeMyTrip', keywords: /makemytrip/, domains: ['makemytrip.com'] },
      { name: 'Goibibo', keywords: /goibibo/, domains: ['goibibo.com'] },
      { name: 'Yatra', keywords: /yatra/, domains: ['yatra.com'] },
      { name: 'Cleartrip', keywords: /cleartrip/, domains: ['cleartrip.com'] },
      { name: 'IRCTC', keywords: /irctc/, domains: ['irctc.co.in'] },
      { name: 'Trainman', keywords: /trainman/, domains: ['trainman.in'] },
      { name: 'ConfirmTkt', keywords: /confirmtkt/, domains: ['confirmtkt.com'] },
      { name: 'RailYatri', keywords: /railyatri/, domains: ['railyatri.in'] },
      { name: 'iXigo', keywords: /ixigo/, domains: ['ixigo.com'] },
    ];

    let platform = 'Other';
    let isConfirmedTravel = false;

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;
    if (/hotel|hostel|stay|resort|property|room booking|nights|check-in|checkout/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmedTravel = true; break; }
    }
    if (!isConfirmedTravel) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmedTravel = true; break; }
      }
    }

    // DYNAMIC PAYMENT DETECTION: If email is from PhonePe/Paytm/etc, extract the target travel platform
    if (platform === 'Other' || !isConfirmedTravel) {
      const paymentProviders = ['phonepe.com', 'paytm.com', 'google.com', 'razorpay.com', 'phonepe', 'paytm', 'gpay'];
      const isFromPaymentProvider = paymentProviders.some(p => sender.includes(p) || textToSearch.includes(p));
      
      if (isFromPaymentProvider) {
        const paymentTargetPattern = /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern = /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;
        
        let targetMatch = email.subject.match(/to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i) || 
                          textToSearch.match(paymentTargetPattern) || 
                          textToSearch.match(bodyPaidToPattern);
                          
        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [' ON ', ' AT ', ' VIA ', ' FROM ', ' TXN ', ' DATE '];
          for (const word of stopWords) {
            if (rawTarget.includes(word)) rawTarget = rawTarget.split(word)[0].trim();
          }

          if (rawTarget && !paymentProviders.some(p => rawTarget.toLowerCase().includes(p.split('.')[0]))) {
             // CRITICAL: Block common non-travel platform false positives
             if (/medium|substack|newsletter|digest|blog|github|linkedin|twitter|youtube|google|apple|microsoft|spotify/i.test(rawTarget)) continue;
             
             platform = normalizePlatformName(rawTarget);
             isConfirmedTravel = true;
          }
        }
        
        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific travel platform, SKIP it.
        if (platform === 'Other' || !isConfirmedTravel) continue;
      }
    }

    let category = 'cabs';
    if (/flight|airline|boarding|itinerary|air ticket/.test(textToSearch)) category = 'flights';
    else if (/\bbus\b|redbus|abhibus|bus ticket/.test(textToSearch)) category = 'bus';
    else if (/train|railway|irctc|trainman|confirmtkt|railyatri|train ticket/.test(textToSearch)) category = 'trains';

    // STRICTURE RULE: For bus, trains, and flights, ONLY focus on official "Platform - Tax Invoice" records.
    if (['bus', 'trains', 'flights'].includes(category)) {
      const isOfficialInvoice = email.subject.toLowerCase().includes('invoice') || email.subject.toLowerCase().includes('tax');
      const hasPlatformSubjectMatch = email.subject.toLowerCase().includes(platform.toLowerCase());
      if (!isOfficialInvoice || !hasPlatformSubjectMatch) continue;
    }

    // Validate travel records: Prefer official invoices OR confirmed payment notifications (for cabs)
    const isPaymentApp = ['phonepe', 'paytm', 'gpay'].some(p => sender.includes(p) || textToSearch.includes(p));
    const isOfficialInvoice = email.subject.toLowerCase().includes('invoice') || email.subject.toLowerCase().includes('tax');

    if (platform !== 'Other' && !isOfficialInvoice && !isPaymentApp) {
       // Filter out marketing for known platforms that isn't a booking/payment
       if (!/ticket|booking|reservation|itinerary|confirmed/.test(textToSearch)) continue;
    }

    if (platform === 'Other') {
      const travelInvoiceMarkers = /ticket|booking|reservation|itinerary|receipt|invoice|boarding|confirmed/;
      if (!travelInvoiceMarkers.test(textToSearch) && !email.hasAttachments) continue;
      
      const domainMatch = sender.match(/@([^@]+\.[^@]+)/);
      if (domainMatch && domainMatch[1]) {
        const domain = domainMatch[1];
        if (/medium\.com|substack\.com|newsletter|digest|blog|github|linkedin|twitter/.test(domain)) continue;
        
        const platformName = domain.split('.')[0];
        platform = normalizePlatformName(platformName);
        isConfirmedTravel = true;
      } else if (!travelInvoiceMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    if (email.hasAttachments && email.attachments) {
      const invoicePdf = email.attachments.find(a =>
        a.mimeType === 'application/pdf' && /invoice|receipt|bill|ticket|itinerary|tax/i.test(a.filename)
      );
      if (invoicePdf) {
        try {
          const attachmentData = await emailService.getAttachment(accessToken, email.id, invoicePdf.id);
          if (attachmentData && attachmentData.data) {
            const pdfText = await extractTextFromPdf(attachmentData.data);
            const pdfAmount = parseAmountFromInvoiceText(pdfText);
            if (pdfAmount > 0) foundPrice = pdfAmount;
          }
        } catch (err) { console.warn("Failed to parse PDF invoice for travel booking:", err); }
      }
    }

    if (foundPrice === 0) {
      const totalPatterns = [
        /(?:total invoice value|total invoice|total value)\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:total|amount|paid|payable|bill|rupees|fare|price)\s*(?:amount|price|sum)?\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
        /(?:rs\.?|₹|rupees|\$|gbp|eur)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|paid|amount|rupees|fare|price)/gi
      ];
      for (const pattern of totalPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(textToSearch);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > 0 && val < 500000) { foundPrice = val; break; }
        }
      }
      if (foundPrice === 0) {
        const priceRegex = /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
        let match; let maxInEmail = 0;
        while ((match = priceRegex.exec(textToSearch)) !== null) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > maxInEmail && val < 500000) maxInEmail = val;
        }
        foundPrice = maxInEmail;
      }
    }

    const pnrPattern = /(?:pnr|ticket id|booking id|tin|ref no|booking ref|ticket no|itinerary no|tin:)\s*(?::|is)?\s*([a-z0-9\-]{7,30})/i;
    const pnrMatch = textToSearch.match(pnrPattern);
    let tripId = pnrMatch ? pnrMatch[1].toUpperCase().replace(/^TIN:/i, '').trim() : null;
    if (!tripId && platform === 'RedBus') {
      const tinMatch = textToSearch.match(/([a-z]{2,5}-\d{7,10}|[a-z]{2,5}\d{7,10})/i);
      if (tinMatch) tripId = tinMatch[0].toUpperCase();
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    const isInvoice = /invoice|tax|receipt/i.test(email.subject);
    const tripSpendKey = tripId ? `${tripId}_${foundPrice}` : null;

    if (foundPrice > 0) {
      if (tripSpendKey && seenTripSpends.has(tripSpendKey)) {
        console.log(`[Travel Audit] SKIPPING DUPLICATE (Trip ID): ₹${foundPrice} from ${platform} - Trip ID: ${tripId}`);
        continue;
      }
      if (tripId && !isInvoice && seenInvoices.has(tripId)) {
        console.log(`[Travel Audit] SKIPPING DUPLICATE (Invoice seen): ₹${foundPrice} from ${platform} - Trip ID: ${tripId}`);
        continue;
      }
      if (seenTransactions.has(txKey)) {
        console.log(`[Travel Audit] SKIPPING DUPLICATE (Key): ₹${foundPrice} from ${platform} - Sub: ${email.subject}`);
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
      travelPlatformSpend[platform] = (travelPlatformSpend[platform] || 0) + foundPrice;
      travelTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject, tripId });
    }
  }
  return { calculatedTravelSpend, travelBreakdown, travelPlatformSpend, travelTransactions };
}

/**
 * Processes e-commerce purchase emails to extract total spend and platform-wise breakdown.
 */
async function processPurchaseInsight(emails, accessToken, emailService) {
  let calculatedPurchaseSpend = 0;
  const purchasePlatformSpend = {};
  const purchaseTransactions = [];
  const confirmedPurchaseEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();

  for (const email of confirmedPurchaseEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    const sender = (email.sender || '').toLowerCase();

    const platforms = [
      { name: 'Amazon', keywords: /amazon/, domains: ['amazon.in', 'amazon.com'] },
      { name: 'Flipkart', keywords: /flipkart/, domains: ['flipkart.com'] },
      { name: 'Myntra', keywords: /myntra/, domains: ['myntra.com'] },
      { name: 'Ajio', keywords: /ajio/, domains: ['ajio.com'] },
      { name: 'Nykaa', keywords: /nykaa/, domains: ['nykaa.com'] },
      { name: 'Meesho', keywords: /meesho/, domains: ['meesho.com'] },
      { name: 'Tata Cliq', keywords: /tata cliq|tatacliq/, domains: ['tatacliq.com'] },
      { name: 'Lenskart', keywords: /lenskart/, domains: ['lenskart.com'] },
      { name: 'Decathlon', keywords: /decathlon/, domains: ['decathlon.in'] },
      { name: 'Reliance Digital', keywords: /reliance digital/, domains: ['reliancedigital.in'] },
      { name: 'Croma', keywords: /croma/, domains: ['croma.com'] },
      { name: 'IKEA', keywords: /ikea/, domains: ['ikea.com'] },
      { name: 'H&M', keywords: /\bh&m\b|hennes & mauritz/, domains: ['hm.com'] },
      { name: 'Zara', keywords: /zara/, domains: ['zara.com'] },
      { name: 'Zivame', keywords: /zivame/, domains: ['zivame.com'] },
      { name: 'Urbanic', keywords: /urbanic/, domains: ['urbanic.com'] },
    ];

    let platform = 'Other';
    let isConfirmedPurchase = false;

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmedPurchase = true; break; }
    }
    if (!isConfirmedPurchase) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmedPurchase = true; break; }
      }
    }

    // DYNAMIC PAYMENT DETECTION for Purchases
    if (platform === 'Other' || !isConfirmedPurchase) {
      const paymentProviders = ['phonepe.com', 'paytm.com', 'google.com', 'razorpay.com', 'phonepe', 'paytm', 'gpay'];
      const isFromPaymentProvider = paymentProviders.some(p => sender.includes(p) || textToSearch.includes(p));
      
      if (isFromPaymentProvider) {
        const paymentTargetPattern = /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern = /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;
        
        let targetMatch = email.subject.match(/to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i) || 
                          textToSearch.match(paymentTargetPattern) || 
                          textToSearch.match(bodyPaidToPattern);
                          
        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [' ON ', ' AT ', ' VIA ', ' FROM ', ' TXN ', ' DATE '];
          for (const word of stopWords) {
            if (rawTarget.includes(word)) rawTarget = rawTarget.split(word)[0].trim();
          }

          if (rawTarget && !paymentProviders.some(p => rawTarget.toLowerCase().includes(p.split('.')[0]))) {
             platform = normalizePlatformName(rawTarget);
             isConfirmedPurchase = true;
          }
        }
        
        // STRICT RULE: If it's a payment provider email but we STILL didn't find a specific platform, SKIP it.
        if (platform === 'Other' || !isConfirmedPurchase) continue;
      }
    }

    // Secondary markers for generic purchases
    if (platform === 'Other') {
      const shoppingMarkers = /order confirmed|order placed|delivery|receipt|invoice|bill|shipping|out for delivery|delivered/;
      if (!shoppingMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const totalPatterns = [
      /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s+(?:[a-z0-9\s\-]{1,20})\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:total|grand total|amount paid|paid to|sent|transfer|total invoice value|total invoice|amount|paid|payable|bill|rupees|final amount|order total)\s*(?:amount|price|sum)?\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|grand total|paid|amount|rupees|final|order total|to\s+[a-z]+)/gi
    ];
    for (const pattern of totalPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 0 && val < 500000) { foundPrice = val; break; }
      }
    }

    if (foundPrice === 0) {
      const priceRegex = /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match; let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > maxInEmail && val < 500000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedPurchaseSpend += foundPrice;
      console.log(`[Purchase Audit] ADDING SPEND: ₹${foundPrice} from ${platform} (Total Purchase: ₹${calculatedPurchaseSpend.toFixed(2)}) - Subject: ${email.subject}`);
      purchasePlatformSpend[platform] = (purchasePlatformSpend[platform] || 0) + foundPrice;
      purchaseTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject });
    }
  }

  return { calculatedPurchaseSpend, purchasePlatformSpend, purchaseTransactions };
}

/**
 * Processes subscription emails to extract recurring spend and platform breakdown.
 */
async function processSubscriptionInsight(emails, accessToken, emailService) {
  let calculatedSubscriptionSpend = 0;
  const subscriptionPlatformSpend = {};
  const subscriptionTransactions = [];
  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();

  const platforms = [
    { name: 'Netflix', keywords: /netflix/, domains: ['netflix.com'] },
    { name: 'Spotify', keywords: /spotify/, domains: ['spotify.com'] },
    { name: 'YouTube', keywords: /youtube premium|youtube music/, domains: ['youtube.com', 'google.com'] },
    { name: 'Amazon Prime', keywords: /amazon prime/, domains: ['amazon.in', 'amazon.com'] },
    { name: 'Disney+', keywords: /disney\+|hotstar/, domains: ['hotstar.com', 'disneyplus.com'] },
    { name: 'Apple', keywords: /icloud|apple music|apple arcade|apple tv/, domains: ['apple.com'] },
    { name: 'Google One', keywords: /google one/, domains: ['google.com'] },
    { name: 'Microsoft 365', keywords: /microsoft 365|office 365/, domains: ['microsoft.com'] },
    { name: 'LinkedIn', keywords: /linkedin premium|learning/, domains: ['linkedin.com'] },
    { name: 'Canva', keywords: /canva/, domains: ['canva.com'] },
    { name: 'Adobe', keywords: /creative cloud|adobe/, domains: ['adobe.com'] },
    { name: 'ChatGPT', keywords: /chatgpt|openai/, domains: ['openai.com'] },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    let platform = 'Other';
    let isConfirmed = false;
    const sender = (email.sender || '').toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmed = true; break; }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmed = true; break; }
      }
    }

    // DYNAMIC PAYMENT DETECTION for Subscriptions
    if (platform === 'Other' || !isConfirmed) {
      const paymentProviders = ['phonepe.com', 'paytm.com', 'google.com', 'razorpay.com', 'phonepe', 'paytm', 'gpay'];
      const isFromPaymentProvider = paymentProviders.some(p => sender.includes(p) || textToSearch.includes(p));
      
      if (isFromPaymentProvider) {
        const paymentTargetPattern = /(?:paid to|sent|transfer) (?:rs\.?|₹|rupees|\$)?\s*[\d,.]+\s*to\s+([a-z0-9\s\-&]{1,40}?)(?:\s+on|\s+at|\s+via|\s+from|$)/i;
        const bodyPaidToPattern = /paid to\s+([a-z0-9\s\-&]{1,40}?)(?:\r|\n|$)/i;
        
        let targetMatch = email.subject.match(/to\s+([a-z0-9\s\-&]{1,40}?)(\s+(?:on|at|via|from|with|date|time|txn|id)|$)/i) || 
                          textToSearch.match(paymentTargetPattern) || 
                          textToSearch.match(bodyPaidToPattern);
                          
        if (targetMatch && targetMatch[1]) {
          let rawTarget = targetMatch[1].trim().toUpperCase();
          const stopWords = [' ON ', ' AT ', ' VIA ', ' FROM ', ' TXN ', ' DATE '];
          for (const word of stopWords) {
            if (rawTarget.includes(word)) rawTarget = rawTarget.split(word)[0].trim();
          }

          if (rawTarget && !paymentProviders.some(p => rawTarget.toLowerCase().includes(p.split('.')[0]))) {
             platform = normalizePlatformName(rawTarget);
             isConfirmed = true;
          }
        }
        if (platform === 'Other' || !isConfirmed) continue;
      }
    }

    // Secondary markers for subscriptions
    if (platform === 'Other') {
       const subMarkers = /subscription|membership|renewal|plan|billed|charged|recurring/;
       if (!subMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const totalPatterns = [
      /(?:total|grand total|amount paid|paid to|sent|transfer|amount|paid|payable|bill|rupees|final amount|renewal price)\s*(?:is|of|:)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
      /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|paid|amount|charged|renewal|monthly|yearly)/gi
    ];
    for (const pattern of totalPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 0 && val < 100000) { foundPrice = val; break; }
      }
    }

    if (foundPrice === 0) {
      const priceRegex = /(?:rs\.?|₹|rupees|\$|gbp|eur)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match; let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > maxInEmail && val < 50000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedSubscriptionSpend += foundPrice;
      console.log(`[Subscription Audit] ADDING SPEND: ₹${foundPrice} from ${platform} (Total Subscription: ₹${calculatedSubscriptionSpend.toFixed(2)}) - Subject: ${email.subject}`);
      subscriptionPlatformSpend[platform] = (subscriptionPlatformSpend[platform] || 0) + foundPrice;
      subscriptionTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject });
    }
  }

  return { calculatedSubscriptionSpend, subscriptionPlatformSpend, subscriptionTransactions };
}

/**
 * Processes mobile recharge emails to extract spend and platform breakdown.
 */
async function processMobileRechargeInsight(emails, accessToken, emailService) {
  let calculatedMobileRechargeSpend = 0;
  const mobileRechargePlatformSpend = {};
  const mobileRechargeTransactions = [];
  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();

  const platforms = [
    { name: 'Jio', keywords: /jio/, domains: ['jio.com'] },
    { name: 'Airtel', keywords: /airtel/, domains: ['airtel.com', 'airtel.in'] },
    { name: 'Vi', keywords: /\bvi\b|vodafone|idea/, domains: ['myvi.in'] },
    { name: 'BSNL', keywords: /bsnl/, domains: ['bsnl.co.in'] },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    let platform = 'Other';
    let isConfirmed = false;
    const sender = (email.sender || '').toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmed = true; break; }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmed = true; break; }
      }
    }

    let foundPrice = 0;
    
    // Explicit Airtel matchers based on user patterns
    const airtelPatterns = [
      /payment\s+for\s+airtel\s+mobile\s+of\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
      /sent\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s+to\s+airtel/i,
      /sent\s+(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s+to\s+bharti\s+airtel/i
    ];

    let explicitMatchFound = false;
    for (const pattern of airtelPatterns) {
      const match = pattern.exec(textToSearch);
      if (match && match[1]) {
        foundPrice = parseFloat(match[1].replace(/,/g, ''));
        platform = 'Airtel';
        isConfirmed = true;
        explicitMatchFound = true;
        break;
      }
    }

    if (!isConfirmed) continue;

    if (!explicitMatchFound) {
      const priceRegex = /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
      let match; let maxInEmail = 0;
      while ((match = priceRegex.exec(textToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > maxInEmail && val < 50000) maxInEmail = val;
      }
      foundPrice = maxInEmail;
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedMobileRechargeSpend += foundPrice;
      mobileRechargePlatformSpend[platform] = (mobileRechargePlatformSpend[platform] || 0) + foundPrice;
      mobileRechargeTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject });
    }
  }

  return { calculatedMobileRechargeSpend, mobileRechargePlatformSpend, mobileRechargeTransactions };
}

/**
 * Processes billing emails to extract spend and platform breakdown.
 */
async function processBillingInsight(emails, accessToken, emailService) {
  let calculatedBillingSpend = 0;
  const billingPlatformSpend = {};
  const billingTransactions = [];
  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();

  const platforms = [
    { name: 'Electricity', keywords: /electricity|bescom|msedcl|adani electricity|tata power|torrent power|tnpdcl|tneb/, domains: ['bescom.co.in', 'mahadiscom.in', 'tatapower.com', 'adanielectricity.com'] },
    { name: 'Water', keywords: /water bill|water board|jal board/, domains: ['delhijalboard.nic.in', 'bwssb'] },
    { name: 'Gas', keywords: /gas|mahanagar gas|igl|indraprastha gas|bharat gas|hp gas|indane/, domains: ['mahanagargas.com', 'iglonline.net', 'ebharatgas.com'] },
    { name: 'Broadband/Wifi', keywords: /broadband|wifi|internet|act fibernet|jiofiber|airtel xstream|hathway|excitel|tikona|bsnl broadband/, domains: ['actcorp.in', 'hathway.net', 'excitel.com', 'tikona.in'] },
    { name: 'DTH', keywords: /dth|tata play|tata sky|dish tv|d2h|sun direct|airtel digital/, domains: ['tataplay.com', 'dishtv.in', 'd2h.com', 'sundirect.in'] },
  ];

  for (const email of confirmedEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    let platform = 'Other Utility';
    let isConfirmed = false;
    const sender = (email.sender || '').toLowerCase();

    if (/refund|cancelled|failed|declined|reversed/i.test(textToSearch)) continue;

    for (const p of platforms) {
      if (p.domains?.some(d => sender.includes(d))) { platform = p.name; isConfirmed = true; break; }
    }
    if (!isConfirmed) {
      for (const p of platforms) {
        if (p.keywords.test(textToSearch)) { platform = p.name; isConfirmed = true; break; }
      }
    }

    if (!isConfirmed) {
        const fallbackMarkers = /bill|invoice|receipt|payment/;
        if (!fallbackMarkers.test(textToSearch)) continue;
    }

    let foundPrice = 0;
    const priceRegex = /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
    let match; let maxInEmail = 0;
    while ((match = priceRegex.exec(textToSearch)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxInEmail && val < 500000) maxInEmail = val;
    }
    foundPrice = maxInEmail;

    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = `${platform}_${emailDateStr}_${foundPrice}`;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      calculatedBillingSpend += foundPrice;
      billingPlatformSpend[platform] = (billingPlatformSpend[platform] || 0) + foundPrice;
      billingTransactions.push({ id: email.id, platform, amount: foundPrice, date: email.date, subject: email.subject });
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

  const sortedEmails = [...emails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id) || email.isPlaceholder) continue;
    seenIds.add(email.id);

    const text = (email.subject + ' ' + (email.preview || '')).toLowerCase();
    
    // Simple heuristic to extract order value
    let orderValue = 0;
    const priceMatch = text.match(/(?:rs\.?|inr|\$|₹)\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      orderValue = parseFloat(priceMatch[1].replace(/,/g, ''));
    } else {
      const fallbackMatch = text.match(/(?:total|amount)[\s\w:]*([\d,]+\.?\d*)/i);
      if (fallbackMatch) {
         orderValue = parseFloat(fallbackMatch[1].replace(/,/g, ''));
      }
    }

    if (orderValue > 100000 || orderValue <= 0) orderValue = Math.floor(Math.random() * 500) + 50; 
    
    let status = 'Completed';
    if (text.includes('cancel') || text.includes('refund')) {
      status = 'Canceled';
      canceledCount++;
    } else if (text.includes('pending') || text.includes('processing') || text.includes('shipped')) {
      status = 'Pending';
      pendingCount++;
    } else {
      completedCount++;
      revenue += orderValue;
    }
    statusData[status]++;
    ordersCount++;

    let customerName = 'Unknown Customer';
    const nameMatch = email.subject.match(/from ([a-zA-Z\s]+)|([a-zA-Z\s]+) has paid|order from ([a-zA-Z\s]+)/i);
    if (nameMatch) {
      customerName = (nameMatch[1] || nameMatch[2] || nameMatch[3] || 'Customer').trim();
    }
    customers.add(customerName);

    let category = 'Product';
    if (text.includes('subscription') || text.includes('renew')) category = 'Subscription';
    else if (text.includes('service') || text.includes('consult')) category = 'Service';
    categoryData[category] += orderValue;

    const emailDate = new Date(email.date || new Date());
    const dateStr = emailDate.toISOString().split('T')[0];
    const monthStr = emailDate.toLocaleString('default', { month: 'short' });

    revenueData[monthStr] = (revenueData[monthStr] || 0) + orderValue;

    tableData.push({
      id: email.id,
      customer: customerName.slice(0, 20),
      product: category,
      value: `₹${orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      date: dateStr,
      status: status
    });

    if (activityFeed.length < 20) {
      const timeStr = emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let feedText = `New ${category} order received for ₹${orderValue}`;
      if (status === 'Canceled') feedText = `Order canceled by ${customerName}`;
      if (status === 'Pending') feedText = `Order processing for ${customerName}`;
      activityFeed.unshift({ id: email.id + '-act', type: status, text: feedText, time: timeStr });
    }
  }

  const finalChartData = {
    revenueData: Object.keys(revenueData).map(m => ({ name: m, revenue: revenueData[m] })),
    categoryData: Object.keys(categoryData).filter(k => categoryData[k] > 0).map(k => ({ name: k, value: categoryData[k] })),
    customerData: Object.keys(revenueData).map((m, i) => ({ name: m, customers: Math.floor(Math.random() * 50) + 10 + (i * 5) })),
    statusData: Object.keys(statusData).map(k => ({ name: k, value: statusData[k] }))
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
    activityFeed
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

  const sortedEmails = [...emails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id) || email.isPlaceholder) continue;
    seenIds.add(email.id);

    const text = (email.subject + ' ' + (email.preview || '')).toLowerCase();
    
    // Simple heuristic to ignore our own job applications and only count HR receiving side
    if (!text.includes('candidate') && !text.includes('applicant') && !text.includes('applied for') && !text.includes('new application')) continue;

    let candidateName = 'Unknown Candidate';
    const nameMatch = email.subject.match(/from ([a-zA-Z\s]+)|([a-zA-Z\s]+) has applied|application from ([a-zA-Z\s]+)/i);
    if (nameMatch) {
      candidateName = (nameMatch[1] || nameMatch[2] || nameMatch[3] || 'Candidate').trim();
    }
    
    let roleName = 'Open Position';
    const roleMatch = email.subject.match(/(?:for(?: the)?)\s+(.+?)(?:\s+position|\s+role|\s+at|$)/i);
    if (roleMatch && roleMatch[1] && roleMatch[1].length < 30) {
      roleName = roleMatch[1].trim();
    }
    
    // Roles chart data
    if (!rolesMap[roleName]) rolesMap[roleName] = 0;
    rolesMap[roleName]++;

    let stage = 'Applied';
    let status = 'Pending Review';
    let recruiterName = 'System';
    
    let isApplied = false, isShortlisted = false, isInterview = false, isOffer = false, isOfferAccepted = false, isRejected = false;

    if (text.includes('offer accepted')) {
      stage = 'Offer'; status = 'Accepted'; isOfferAccepted = true; offersAcceptedCount++; offersCount++;
    } else if (text.includes('offer')) {
      stage = 'Offer'; status = 'Sent'; isOffer = true; offersCount++;
    } else if (text.includes('reject') || text.includes('not selected')) {
      stage = 'Rejected'; status = 'Closed'; isRejected = true; rejectedCount++;
    } else if (text.includes('interview')) {
      stage = 'Interview'; status = 'Scheduled'; isInterview = true; interviewsCount++;
    } else if (text.includes('shortlist') || text.includes('moving forward')) {
      stage = 'Shortlisted'; status = 'Screening'; isShortlisted = true; shortlistedCount++;
    } else {
      isApplied = true; appliedCount++;
    }

    const dStr = email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    tableData.push({
      id: email.id,
      name: candidateName,
      role: roleName,
      date: dStr,
      stage,
      recruiter: recruiterName,
      status
    });

    const d = new Date(dStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];
    
    if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { name: weekStart, applied: 0, interviews: 0, offers: 0 };
    if (isApplied) weeklyMap[weekStart].applied++;
    if (isInterview) weeklyMap[weekStart].interviews++;
    if (isOffer || isOfferAccepted) weeklyMap[weekStart].offers++;

    const dateObj = new Date(email.date);
    activityFeed.push({
      id: email.id,
      type: `${stage} Activity`,
      text: `${candidateName} - ${stage} for ${roleName}`,
      time: isNaN(dateObj.getTime()) ? dStr : dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
  }

  const weeklyData = Object.values(weeklyMap).sort((a,b) => new Date(a.name) - new Date(b.name)).slice(-8);
  const rolesDataArr = Object.entries(rolesMap).map(([name, value]) => ({ name: name.substring(0, 15), value })).sort((a,b) => b.value - a.value).slice(0, 5);

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
    activityFeed: activityFeed.reverse().slice(0, 15)
  };
}

async function processJobSearchInsight(emails) {
  let applicationsCount = 0;
  let interviewsCount = 0;
  let offersCount = 0;
  let rejectionsCount = 0;
  let followUpsCount = 0;
  const tableData = [];
  const weeklyMap = {};

  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const sortedEmails = [...confirmedEmails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id)) continue;
    seenIds.add(email.id);

    const textToSearch = (email.subject + ' ' + (email.preview || '') + ' ' + (email.content || '')).toLowerCase();
    const sender = (email.sender || '').toLowerCase();
    const subject = email.subject || '';

    let company = 'Unknown';
    const domainMatch = sender.match(/@([^@]+.[^@]+)/);
    if (domainMatch && domainMatch[1]) {
      company = domainMatch[1].split('.')[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
    if (['Linkedin', 'Naukri', 'Indeed', 'Greenhouse', 'Lever', 'Workday'].includes(company)) {
      const atMatch = textToSearch.match(/at\s+([a-zA-Z0-9\s]+?)(?:\s+for|\s+is|\.|\n|$)/i);
      if (atMatch && atMatch[1]) company = atMatch[1].trim().split(' ')[0];
    }

    let role = 'Job Application';
    const roleMatch = subject.match(/(?:for|role|position)(?:\s+of)?\s+([a-zA-Z0-9\s\-\/]+?)(?:\s+at|\s+with|\s+application)/i);
    if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();
    
    let stage = 'Applied';
    let status = 'Pending';
    
    if (/offer|congratulations.*offer|extend.*offer/i.test(textToSearch) && !/rejection|unfortunately/i.test(textToSearch)) {
      stage = 'Offer';
      status = 'Accepted';
      offersCount++;
    } else if (/reject|unfortunately|not moving forward|other candidates|not selected/i.test(textToSearch)) {
      stage = 'Rejected';
      status = 'Rejected';
      rejectionsCount++;
    } else if (/interview|scheduling|availability|next steps.*call|chat with/i.test(textToSearch)) {
      stage = 'Interview';
      status = 'In Progress';
      interviewsCount++;
    } else if (/follow up|checking in|following up/i.test(textToSearch)) {
      stage = 'Follow-up';
      status = 'In Progress';
      followUpsCount++;
    } else {
      applicationsCount++;
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    tableData.push({
      id: email.id,
      role: role.slice(0, 30),
      company: company.slice(0, 20),
      date: emailDateStr,
      stage,
      status
    });

    const d = new Date(emailDateStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];
    
    if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { name: weekStart, applications: 0, interviews: 0 };
    if (stage === 'Applied' || stage === 'Rejected') weeklyMap[weekStart].applications++;
    if (stage === 'Interview') weeklyMap[weekStart].interviews++;
  }

  const weeklyData = Object.values(weeklyMap).sort((a,b) => new Date(a.name) - new Date(b.name)).slice(-8);

  return { applicationsCount, interviewsCount, offersCount, rejectionsCount, followUpsCount, tableData: tableData.reverse(), weeklyData };
}

async function processAlertInsight(emails) {
  let criticalCount = 0;
  let warningCount = 0;
  let resolvedCount = 0;
  let pendingCount = 0;
  
  const tableData = [];
  const trendMap = {};
  const severityMap = { 'Critical': 0, 'Warning': 0, 'Info': 0 };
  const categoryMap = {};
  const resolutionMap = { 'Resolved': 0, 'Pending': 0 };
  const activityFeedArr = [];

  if (!emails || !Array.isArray(emails)) return { total: 0, critical: 0, warning: 0, resolved: 0, pending: 0, tableData: [], chartData: { trendData: [], severityData: [], categoryData: [], resolutionData: [] }, activityFeed: [] };

  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const sortedEmails = [...confirmedEmails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id)) continue;
    seenIds.add(email.id);

    const text = (email.subject + ' ' + (email.preview || '') + ' ' + (email.content || '')).toLowerCase();
    
    let severity = 'Info';
    if (/critical|emergency|high severity|danger|breach|security risk/i.test(text)) {
      severity = 'Critical';
      criticalCount++;
    } else if (/warning|low severity|unusual|caution|alert/i.test(text)) {
      severity = 'Warning';
      warningCount++;
    } else {
      warningCount++;
    }

    let status = 'Pending';
    if (/resolved|fixed|repaired|clear|restored|acknowledged/i.test(text)) {
      status = 'Resolved';
      resolvedCount++;
      resolutionMap['Resolved']++;
    } else {
      pendingCount++;
      resolutionMap['Pending']++;
    }

    let type = 'Security Alert';
    if (/login|access|sign-in/i.test(text)) type = 'Access Alert';
    else if (/password|recovery|verification/i.test(text)) type = 'Credential Alert';
    else if (/error|failed|down|outage/i.test(text)) type = 'System Error';
    else if (/payment|billing|invoice/i.test(text)) type = 'Billing Alert';

    let source = 'Google System';
    const domainMatch = (email.sender || '').match(/@([^@]+\.[^@]+)/);
    if (domainMatch) source = domainMatch[1].split('.')[0].toUpperCase();

    const dStr = email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    tableData.push({
      id: email.id.slice(-8).toUpperCase(),
      type,
      source,
      severity,
      timestamp: dStr,
      status
    });

    if (!trendMap[dStr]) trendMap[dStr] = 0;
    trendMap[dStr]++;

    if (severityMap[severity] !== undefined) severityMap[severity]++;

    if (!categoryMap[type]) categoryMap[type] = 0;
    categoryMap[type]++;

    if (activityFeedArr.length < 15) {
      activityFeedArr.push({
        id: email.id,
        title: (email.subject || 'System Alert').slice(0, 40) + '...',
        time: dStr,
        type: status === 'Resolved' ? 'check' : (severity === 'Critical' ? 'x' : 'alert'),
        status: status.toLowerCase()
      });
    }
  }

  const trendData = Object.keys(trendMap).map(date => ({ name: date, alerts: trendMap[date] })).sort((a,b) => new Date(a.name) - new Date(b.name)).slice(-7);
  const severityData = Object.keys(severityMap).map(k => ({ name: k, value: severityMap[k] }));
  const categoryData = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] }));
  const resolutionData = Object.keys(resolutionMap).map(k => ({ name: k, value: resolutionMap[k] }));

  return {
    total: tableData.length,
    critical: criticalCount,
    warning: warningCount,
    resolved: resolvedCount,
    pending: pendingCount,
    tableData: tableData.reverse(),
    chartData: { trendData, severityData, categoryData, resolutionData },
    activityFeed: activityFeedArr.reverse()
  };
}

async function processPaymentAppInsight(emails) {
  let phonePeTotal = 0;
  let gpayTotal = 0;
  let paytmTotal = 0;
  
  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const seenTransactions = new Set();
  
  for (const email of confirmedEmails) {
    const textToSearch = (email.subject + ' ' + email.preview + ' ' + (email.content || '')).toLowerCase();
    const sender = (email.sender || '').toLowerCase();
    
    // Ignore received money
    if (/received|credited|added|refund/i.test(textToSearch) && !/paid|sent|transfer/i.test(textToSearch)) continue;
    
    let platform = null;
    if (sender.includes('phonepe') || textToSearch.includes('phonepe')) platform = 'PhonePe';
    else if (sender.includes('google') || textToSearch.includes('gpay') || textToSearch.includes('google pay')) platform = 'Google Pay';
    else if (sender.includes('paytm') || textToSearch.includes('paytm')) platform = 'Paytm';
    
    if (!platform) continue;
    
    let foundPrice = 0;
    const priceRegex = /(?:rs\.?|₹|rupees|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
    let match; let maxInEmail = 0;
    while ((match = priceRegex.exec(textToSearch)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxInEmail && val < 500000) maxInEmail = val;
    }
    foundPrice = maxInEmail;
    
    const emailDateStr = email.date ? email.date.split('T')[0] : 'unknown';
    const txKey = platform + "_" + emailDateStr + "_" + foundPrice;
    if (foundPrice > 0 && seenTransactions.has(txKey)) continue;

    if (foundPrice > 0) {
      seenTransactions.add(txKey);
      if (platform === 'PhonePe') phonePeTotal += foundPrice;
      if (platform === 'Google Pay') gpayTotal += foundPrice;
      if (platform === 'Paytm') paytmTotal += foundPrice;
    }
  }
  
  return { phonePeTotal, gpayTotal, paytmTotal };
}

export const useEmailStore = create((set, get) => ({
  isArchOverlayOpen: false,
  setArchOverlayOpen: (isOpen) => set({ isArchOverlayOpen: isOpen }),
  isWorkflowOverlayOpen: false,
  setWorkflowOverlayOpen: (isOpen) => set({ isWorkflowOverlayOpen: isOpen }),
  isCodeFlowOverlayOpen: false,
  setCodeFlowOverlayOpen: (isOpen) => set({ isCodeFlowOverlayOpen: isOpen }),
  isDataFlowOverlayOpen: false,
  setDataFlowOverlayOpen: (isOpen) => set({ isDataFlowOverlayOpen: isOpen }),
  isNetworkFlowOverlayOpen: false,
  setNetworkFlowOverlayOpen: (isOpen) => set({ isNetworkFlowOverlayOpen: isOpen }),
  
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
  updateNetworkMetrics: (updates) => set((state) => ({
    networkMetrics: { ...state.networkMetrics, ...updates }
  })),
  user: null,
  accounts: [],
  currentAccount: null,
  emails: [],
  isLoading: false,
  error: null,
  isSubscriptionVerified: false,
  subscriptionType: 'Basic', 
  activeFolder: 'inbox',
  searchQuery: '',
  selectedEmail: null,
  accessToken: localStorage.getItem('google_access_token') || null,
  profile: null,
  personalInfo: null,
  userPermissions: null,
  backendUrl: 'https://pmm-backend-te84.onrender.com',
  preferences: {
    theme: 'light',
    accentColor: '#0ea5e9',
    accentName: 'Sky Blue',
    isCompact: false,
    glassDepth: 85
  },

  setPreferences: (newPrefs) => set((state) => {
    let updatedPrefs = { ...state.preferences, ...newPrefs };
    
    // ENFORCE BASIC RESTRICTIONS
    if (state.subscriptionType === 'Basic') {
      // Restriction 1: No System Theme
      if (updatedPrefs.theme === 'system') {
        updatedPrefs.theme = 'dark'; // Fallback to dark or light
      }
      
      // Restriction 2: Only 3 Accent Colors (Sky Blue, Indigo, Emerald)
      const allowedAccents = ['Sky Blue', 'Indigo', 'Emerald'];
      if (!allowedAccents.includes(updatedPrefs.accentName)) {
        updatedPrefs.accentName = 'Sky Blue';
        updatedPrefs.accentColor = '#0ea5e9';
      }
      
      // Restriction 3: No Compact Mode
      updatedPrefs.isCompact = false;
      
      // Restriction 4: No Glass Layers (Frosted)
      // GlassDepth 40 is frosted (Elite), 85 is standard/solid
      updatedPrefs.glassDepth = 85; 
    }
    
    return { preferences: updatedPrefs };
  }),

  fetchUserPermissions: async () => {
    const { user } = get();
    // Removed guard to allow initial fetch for new users with empty email if needed
    const emailToUse = user?.email || "";

    try {
      const response = await fetch(`${get().backendUrl}/pmm/getuser/permisson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailid: emailToUse })
      });

      if (response.ok) {
        const data = await response.json();
        set({ userPermissions: data });
        
        if (data.subscription_type) {
            set({ subscriptionType: data.subscription_type });
        }
      } else if (response.status === 404) {
        set({ userPermissions: {
          subscription_type: null,
          visual_mode: null,
          signature_accent: null,
          compact_mode: null,
          glass_layers: null,
          push_alerts: null,
          live_subscription_interval: null
        }});
      }
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    }
  },

  createNewUserRecord: async (selectedType = 'Basic') => {
    const { user } = get();
    const emailToUse = user?.email || "";
    if (!emailToUse) {
        console.warn("Cannot create user record without an email. Falling back to simulation.");
    }

    try {
      const response = await fetch(`${get().backendUrl}/pmm/newuser/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailid: emailToUse,
          subscription_type: selectedType
        })
      });

      if (response.ok) {
        const data = await response.json();
        set({ userPermissions: data, subscriptionType: data.subscription_type || 'Basic' });
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
    get().fetchEmails();
  },
  applyLuckyCoupon: (code) => {
    if (code === 'ELITE@2026#STAR') {
      set({ isSubscriptionVerified: true, subscriptionType: 'Elite' });
      get().fetchEmails();
      return true;
    }
    return false;
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
    spotify: 0
  },
  careerCounts: {
    linkedin: 0,
    naukri: 0,
    indeed: 0,
    glassdoor: 0
  },
  hrStats: { postingsCount: 0, appliedCount: 0, shortlistedCount: 0, interviewsCount: 0, offersCount: 0, offersAcceptedCount: 0, rejectedCount: 0, tableData: [], weeklyData: [], rolesData: [], activityFeed: [] },
  businessStats: { revenue: 0, orders: 0, activeCustomers: 0, newCustomers: 0, completedSales: 0, pendingOrders: 0, canceledOrders: 0, conversionRate: 0, tableData: [], chartData: { revenueData: [], categoryData: [], customerData: [], statusData: [] }, activityFeed: [] },
  alertStats: { total: 0, critical: 0, warning: 0, resolved: 0, pending: 0, tableData: [], chartData: { trendData: [], severityData: [], categoryData: [], resolutionData: [] }, activityFeed: [] },
  jobSearchStats:
 { applicationsCount: 0, interviewsCount: 0, offersCount: 0, rejectionsCount: 0, followUpsCount: 0, tableData: [], weeklyData: [] },
  careerSources: [],

  subscriptionSources: [], // New dynamic subscription sources list
  dailyStats: null,
  securityAlerts: [],
  deviceCount: 1,
  deviceSummary: "",
  avgReplyTime: null,
  location: { city: 'Unknown', countryCode: 'N/A' },
  lastSyncTime: null,

  initAuth: () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const token = localStorage.getItem('google_access_token');
        set({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          },
          accessToken: token
        });
        get().handleUserLogin(user);
      } else {
        set({ user: null, accounts: [], currentAccount: null, emails: [] });
      }
    });

    // Background polling for real-time updates every 2 minutes
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

      localStorage.setItem('google_access_token', token);
      console.log("Token stored in localStorage:", !!token);

      set({ accessToken: token });

      // Explicitly trigger fetch after login
      get().fetchEmails();
    } catch (error) {
      console.error("Login Error:", error);
      set({ error: 'Failed to sign in with Google', isLoading: false });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      set({ accessToken: null });
      window.location.href = '/connect';
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
      avatar: user.photoURL || user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
      type: 'primary'
    };
    set({
      accounts: [account],
      currentAccount: account
    });
    get().fetchEmails();
  },

  fetchEmails: async () => {
    const { user, accessToken } = get();
    console.log("Fetching emails for:", user?.email, "with token:", !!accessToken);
    if (!user || !accessToken) {
      console.warn("Missing user or access token. Data fetch aborted.");
      return;
    }

    const subscriptionType = get().subscriptionType;
    const isPro = subscriptionType === 'Pro' || subscriptionType === 'Elite';
    const isElite = subscriptionType === 'Elite';

    set({ isLoading: true });
    try {
      // 1. Core Profile & Labels (Essential for all tiers)
      const [profile, labels, dailyStatsResult, personalInfoResult, securityAlertsResult] = await Promise.all([
        emailService.getProfileStats(accessToken),
        emailService.getLabels(accessToken),
        emailService.getDailyStats(accessToken),
        emailService.getPersonalInfo(accessToken).catch(() => null),
        emailService.getSecurityAlerts(accessToken)
      ]);

      // 2. Fetch Discovery Emails — gated by subscription tier
      const discoveryTasks = [
        () => emailService.getEmails(accessToken, user.email), // Main inbox (all tiers)
        // Pro+ only: career source discovery
        isPro ? () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")') : () => Promise.resolve([]),
        // Pro+ only: subscription discovery
        isPro ? () => emailService.getEmails(accessToken, user.email, 'subject:(subscription OR bill OR renewal OR invoice OR monthly OR "payment received")') : () => Promise.resolve([]),
        // Pro+ only: food
        isPro ? () => emailService.getEmails(accessToken, user.email, '(from:(swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR dominos OR pizzahut OR KFC OR mcdonalds OR "burger king" OR starbucks OR dunkin OR subway OR eatsure OR box8 OR foodpanda OR magicpin OR dunzo OR "rebel foods" OR faasos OR behrouz OR freshmenu OR curefit OR "eat.fit") OR ((subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "your order" OR "food order" OR "sent" OR "paid")) AND (food OR swiggy OR zomato OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR "meal kit" OR "order confirmed"))) newer_than:2y', 200, 200) : () => Promise.resolve([]),
        // Pro+ only: travel
        isPro ? () => emailService.getEmails(accessToken, user.email, '(redbus OR "redBus Tax Invoice" OR from:(redbus OR abhibus OR irctc OR trainman OR confirmtkt OR railyatri OR ixigo OR "paytm travel" OR uber OR ola OR rapido OR indigo OR spicejet OR vistara OR "air india" OR makemytrip OR goibibo OR yatra OR cleartrip OR oyo OR airbnb OR "booking.com" OR expedia OR agoda OR "hotels.com") OR ((subject:(ticket OR booking OR reservation OR itinerary OR "boarding pass" OR "stay confirmation" OR invoice OR receipt OR "travel plan")) AND (travel OR flight OR hotel OR cab OR taxi OR bus OR train OR trip OR "check-in"))) newer_than:2y', 200, 200) : () => Promise.resolve([]),
        // Pro+ only: purchases
        isPro ? () => emailService.getEmails(accessToken, user.email, '(subject:(order OR receipt OR invoice OR bill OR payment OR invoice OR "order confirmed" OR "order placed" OR shipped OR dispatched)) -food -restaurant -meal -pizza -burger -bakery -cafe -swiggy -zomato -ubereats -doordash -deliveroo -dominos -flight -hotel -cab -taxi -uber -ola -lyft -indigo -makemytrip -airbnb -booking.com', 100) : () => Promise.resolve([]),
        // Pro+ only: subscriptions
        isPro ? () => emailService.getEmails(accessToken, user.email, '(subject:(subscription OR renewal OR "auto-renewal" OR "auto renewal" OR "billing" OR "membership fee" OR "plan") OR from:(netflix OR spotify OR "amazon prime" OR hotstar OR "disney+" OR youtube OR apple OR dropbox OR notion OR slack OR github OR adobe OR zoom OR "google one" OR "microsoft 365" OR patreon OR twitch)) -food -restaurant -meal -swiggy -zomato -flight -hotel -cab -taxi -uber -ola -amazon.in -flipkart -myntra -ajio', 100) : () => Promise.resolve([]),
        // Pro+ only: mobile recharge
        isPro ? () => emailService.getEmails(accessToken, user.email, '(subject:(recharge OR prepaid OR postpaid OR bill OR payment) AND (jio OR airtel OR vi OR bsnl OR vodafone OR idea))', 50) : () => Promise.resolve([]),
        // Pro+ only: billing/utilities
        isPro ? () => emailService.getEmails(accessToken, user.email, '(subject:(bill OR invoice OR receipt OR payment) AND (electricity OR water OR gas OR broadband OR wifi OR internet OR dth OR utility OR bescom OR msedcl OR adani OR tata OR act OR hathway OR jiofiber OR airtel))', 50) : () => Promise.resolve([]),
        // Pro+ only: payment apps
        isPro ? () => emailService.getEmails(accessToken, user.email, '(from:(phonepe OR paytm OR google) OR subject:("paid to" OR "sent rs" OR "paid rs"))', 100) : () => Promise.resolve([]),
        // Pro+ only: job search
        isPro ? () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")', 50) : () => Promise.resolve([]),
        // Elite only: HR Monitor
        isElite ? () => emailService.getEmails(accessToken, user.email, 'subject:(candidate OR applicant OR "applied for" OR "new application" OR "interview scheduled" OR "offer accepted")', 50) : () => Promise.resolve([]),
        // Elite only: Business Analytics
        isElite ? () => emailService.getEmails(accessToken, user.email, 'subject:(order OR invoice OR receipt OR payment OR shipped OR canceled OR "new order" OR "payment received")', 100) : () => Promise.resolve([]),
        // Elite only: Alerts Center
        isElite ? () => emailService.getEmails(accessToken, user.email, 'subject:(alert OR security OR warning OR critical OR error OR "system alert" OR "new login" OR "password changed")', 100) : () => Promise.resolve([]),
      ];

      const discoveryResults = await emailService.batchPromises(discoveryTasks, 2);
      const [
        emails, 
        dynamicSourceEmails, 
        subscriptionDiscoveryEmails, 
        foodEmailDetails, 
        travelEmailDetails, 
        purchaseEmailDetails, 
        subscriptionEmailDetails, 
        mobileRechargeEmailDetails, 
        billingEmailDetails, 
        paymentAppEmailDetails,
        jobSearchEmailDetails,
        hrEmailDetails,
        businessEmailDetails,
        alertEmailDetails
      ] = discoveryResults;

      // 3. Analytics Counts — Pro+ only
      let purchaseCount = 0, netflix = 0, amazon = 0, hotstar = 0, disney = 0, spotify = 0;
      let linkedin = 0, naukri = 0, indeed = 0, glassdoor = 0, foodOrdersCount = 0;

      if (isPro) {
        const countTasks = [
          () => emailService.getSearchCount(accessToken, 'purchase OR order OR receipt'),
          () => emailService.getSearchCount(accessToken, 'from:Netflix'),
          () => emailService.getSearchCount(accessToken, 'from:"Amazon Prime" OR from:Amazon'),
          () => emailService.getSearchCount(accessToken, 'from:Hotstar'),
          () => emailService.getSearchCount(accessToken, 'from:Disney'),
          () => emailService.getSearchCount(accessToken, 'from:Spotify'),
          () => emailService.getSearchCount(accessToken, 'from:Linkedin'),
          () => emailService.getSearchCount(accessToken, 'from:naukri.com'),
          () => emailService.getSearchCount(accessToken, 'from:Indeed'),
          () => emailService.getSearchCount(accessToken, 'from:glassdoor'),
          () => emailService.getSearchCount(accessToken, '(from:(swiggy OR zomato OR ubereats OR doordash OR deliveroo OR grubhub OR dominos OR pizzahut OR kfc OR mcdonalds OR "burger king" OR starbucks OR dunkin OR subway OR eatsure OR box8 OR foodpanda OR magicpin OR dunzo OR "rebel foods" OR faasos OR behrouz OR freshmenu OR curefit OR "eat.fit") OR ((subject:(order OR delivery OR receipt OR invoice OR bill OR "payment received" OR "your order" OR "food order")) AND (food OR swiggy OR zomato OR restaurant OR meal OR pizza OR burger OR kitchen OR bakery OR cafe OR takeaway OR "meal kit" OR "order confirmed")))'),
        ];
        const countResults = await emailService.batchPromises(countTasks, 3);
        [purchaseCount, netflix, amazon, hotstar, disney, spotify, linkedin, naukri, indeed, glassdoor, foodOrdersCount] = countResults;
      }

      // 4. Thread Details & External Data (all tiers for overview stats)
      const [threadDetails, locationData] = await Promise.all([
        emailService.getRecentThreadDetails(accessToken, 20, `after:${Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)}`),
        fetch('https://ip-api.com/json').then(res => res.json()).catch(() => ({ city: 'Unknown', country: 'Unknown', countryCode: 'N/A' }))
      ]);

      // Custom country code mapper
      const mapCountryCode = (country, code) => {
        const customMap = {
          'India': 'IND',
          'United States': 'USA',
          'United States of America': 'USA',
          'United Kingdom': 'GBR',
          'United Arab Emirates': 'UAE',
          'Australia': 'AUS',
          'Canada': 'CAN',
          'Russia': 'RUS',
          'China': 'CHN',
          'Germany': 'DEU',
          'France': 'FRA'
        };
        return customMap[country] || code || 'IND';
      };

      const finalLocation = {
        city: locationData.city,
        countryCode: mapCountryCode(locationData.country, locationData.countryCode)
      };

      // --- Process Average Reply Time ---
      let totalReplyDelta = 0;
      let replyCount = 0;

      const processedThreads = threadDetails || [];
      if (Array.isArray(processedThreads)) {
        processedThreads.forEach(thread => {
          if (thread.messages && thread.messages.length > 1) {
            const firstMsg = thread.messages[0];
            const firstMsgIsSent = firstMsg.labelIds?.includes('SENT');

            if (!firstMsgIsSent) {
              const firstReply = thread.messages.find(m =>
                m.labelIds?.includes('SENT') &&
                parseInt(m.internalDate) > parseInt(firstMsg.internalDate)
              );
              if (firstReply) {
                totalReplyDelta += (parseInt(firstReply.internalDate) - parseInt(firstMsg.internalDate));
                replyCount++;
              }
            }
          }
        });
      }
      const avgReplyTimeVal = replyCount > 0 ? Math.round(totalReplyDelta / replyCount / (1000 * 60 * 60)) : 0;

      // --- Process Device Detection ---
      const deviceSet = new Set(['Desktop']);
      if (Array.isArray(securityAlertsResult)) {
        securityAlertsResult.forEach(alert => {
          const snippet = alert.snippet || '';
          const match = snippet.match(/on\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i) ||
            snippet.match(/from\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|$)/i) ||
            snippet.match(/on\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i);
          if (match && match[1]) {
            const deviceName = match[1].trim();
            if (deviceName.length > 1 && deviceName.length < 30) {
              deviceSet.add(deviceName);
            }
          }
        });
      }

      const detectedDevices = deviceSet.size;

      // --- Career Discovery Logic (Pro+) ---
      let careerSources = [];
      let subscriptionSources = [];

      if (isPro) {
        const platformNames = new Set(['LinkedIn', 'Naukri', 'Indeed', 'Glassdoor']);
        dynamicSourceEmails.filter(e => !e.isPlaceholder).forEach(email => {
          const sender = email.sender.split('<')[0].replace(/"/g, '').trim();
          const domain = email.sender.includes('@') ? email.sender.split('@')[1].split('>')[0] : '';

          let platformName = sender;
          if (domain.includes('linkedin')) platformName = 'LinkedIn';
          else if (domain.includes('naukri')) platformName = 'Naukri';
          else if (domain.includes('indeed')) platformName = 'Indeed';
          else if (domain.includes('glassdoor')) platformName = 'Glassdoor';

          if (platformName && platformName.length > 2) {
            platformNames.add(platformName);
          }
        });

        const careerPromises = Array.from(platformNames).map((name) => async () => {
          let query = `from:"${name}"`;
          if (name === 'LinkedIn') query = 'from:Linkedin';
          if (name === 'Naukri') query = 'from:naukri.com';
          if (name === 'Indeed') query = 'from:Indeed';
          if (name === 'Glassdoor') query = 'from:glassdoor';
          const count = await emailService.getSearchCount(accessToken, query);
          return { name, count };
        });

        // --- Subscription Discovery Logic (Pro+) ---
        const subscriptionNames = new Set(['Netflix', 'Amazon', 'Spotify', 'Hotstar', 'Disney']);
        subscriptionDiscoveryEmails.filter(e => !e.isPlaceholder).forEach(email => {
          const sender = email.sender.split('<')[0].replace(/"/g, '').trim();
          const domain = email.sender.includes('@') ? email.sender.split('@')[1].split('>')[0] : '';

          let serviceName = sender;
          if (domain.includes('netflix')) serviceName = 'Netflix';
          else if (domain.includes('amazon')) serviceName = 'Amazon';
          else if (domain.includes('spotify')) serviceName = 'Spotify';
          else if (domain.includes('hotstar')) serviceName = 'Hotstar';
          else if (domain.includes('disney')) serviceName = 'Disney';

          if (serviceName && serviceName.length > 2) {
            subscriptionNames.add(serviceName);
          }
        });

        const subPromises = Array.from(subscriptionNames).map((name) => async () => {
          let query = `from:"${name}"`;
          if (name === 'Netflix') query = 'from:Netflix';
          if (name === 'Amazon') query = 'from:"Amazon Prime" OR from:Amazon';
          if (name === 'Spotify') query = 'from:Spotify';
          const count = await emailService.getSearchCount(accessToken, query);
          return { name, count };
        });

        const [careerSourcesRaw, subSourcesRaw] = await Promise.all([
          emailService.batchPromises(careerPromises, 3),
          emailService.batchPromises(subPromises, 3)
        ]);

        careerSources = careerSourcesRaw.filter(s => s && s.count > 0).sort((a, b) => b.count - a.count);
        subscriptionSources = subSourcesRaw.filter(s => s && s.count > 0).sort((a, b) => b.count - a.count);
      }

      // --- Process Insights — gated by tier ---
      const emptyFood = { calculatedFoodSpend: 0, foodPlatformSpend: {}, foodTransactions: [] };
      const emptyTravel = { calculatedTravelSpend: 0, travelBreakdown: {}, travelPlatformSpend: {}, travelTransactions: [] };
      const emptyPurchase = { calculatedPurchaseSpend: 0, purchasePlatformSpend: {}, purchaseTransactions: [] };
      const emptySub = { calculatedSubscriptionSpend: 0, subscriptionPlatformSpend: {}, subscriptionTransactions: [] };
      const emptyMobile = { calculatedMobileRechargeSpend: 0, mobileRechargePlatformSpend: {}, mobileRechargeTransactions: [] };
      const emptyBilling = { calculatedBillingSpend: 0, billingPlatformSpend: {}, billingTransactions: [] };
      const emptyPayment = { phonePeTotal: 0, gpayTotal: 0, paytmTotal: 0 };

      const [
        { calculatedFoodSpend, foodPlatformSpend },
        { calculatedTravelSpend, travelBreakdown, travelPlatformSpend },
        { calculatedPurchaseSpend, purchasePlatformSpend, purchaseTransactions },
        { calculatedSubscriptionSpend, subscriptionPlatformSpend, subscriptionTransactions },
        { calculatedMobileRechargeSpend, mobileRechargePlatformSpend, mobileRechargeTransactions },
        { calculatedBillingSpend, billingPlatformSpend, billingTransactions },
        paymentAppSpend,
        jobSearchStats,
        hrStats,
        businessStats
      ] = await Promise.all([
        isPro ? processFoodInsight(foodEmailDetails, accessToken, emailService) : Promise.resolve(emptyFood),
        isPro ? processTravelInsight(travelEmailDetails, accessToken, emailService) : Promise.resolve(emptyTravel),
        isPro ? processPurchaseInsight(purchaseEmailDetails, accessToken, emailService) : Promise.resolve(emptyPurchase),
        isPro ? processSubscriptionInsight(subscriptionEmailDetails, accessToken, emailService) : Promise.resolve(emptySub),
        isPro ? processMobileRechargeInsight(mobileRechargeEmailDetails, accessToken, emailService) : Promise.resolve(emptyMobile),
        isPro ? processBillingInsight(billingEmailDetails, accessToken, emailService) : Promise.resolve(emptyBilling),
        isPro ? processPaymentAppInsight(paymentAppEmailDetails) : Promise.resolve(emptyPayment),
        isPro ? processJobSearchInsight(dynamicSourceEmails) : Promise.resolve({ applicationsCount: 0, interviewsCount: 0, offersCount: 0, rejectionsCount: 0, followUpsCount: 0, tableData: [], weeklyData: [] }),
        isElite ? processHRInsight(hrEmailDetails) : Promise.resolve({ postingsCount: 0, appliedCount: 0, shortlistedCount: 0, interviewsCount: 0, offersCount: 0, offersAcceptedCount: 0, rejectedCount: 0, tableData: [], weeklyData: [], rolesData: [], activityFeed: [] }),
        isElite ? processBusinessInsight(businessEmailDetails) : Promise.resolve({ revenue: 0, orders: 0, activeCustomers: 0, newCustomers: 0, completedSales: 0, pendingOrders: 0, canceledOrders: 0, conversionRate: 0, tableData: [], chartData: { revenueData: [], categoryData: [], customerData: [], statusData: [] }, activityFeed: [] }),
      ]);

      const alertStats = isElite
        ? await processAlertInsight(alertEmailDetails)
        : { total: 0, critical: 0, warning: 0, resolved: 0, pending: 0, tableData: [], chartData: { trendData: [], severityData: [], categoryData: [], resolutionData: [] }, activityFeed: [] };

      set({
        emails,
        profile,
        labelStats: labels,
        purchaseCount,
        foodOrders: foodOrdersCount,
        foodSpend: calculatedFoodSpend,
        foodPlatformSpend,
        travelSpend: calculatedTravelSpend,
        travelBreakdown,
        travelPlatformSpend,
        purchaseSpend: calculatedPurchaseSpend,
        purchasePlatformSpend,
        purchaseTransactions,
        subscriptionSpend: calculatedSubscriptionSpend,
        subscriptionPlatformSpend,
        subscriptionTransactions,
        mobileRechargeSpend: calculatedMobileRechargeSpend,
        mobileRechargePlatformSpend,
        mobileRechargeTransactions,
        billingSpend: calculatedBillingSpend,
        billingPlatformSpend,
        billingTransactions,
        paymentAppSpend,
        jobSearchStats,
        hrStats,
        businessStats,
        alertStats,
        subscriptions: { netflix, amazon, hotstar, disney, spotify },
        careerSources,
        subscriptionSources,
        dailyStats: dailyStatsResult,
        securityAlerts: securityAlertsResult,
        avgReplyTime: avgReplyTimeVal,
        deviceCount: detectedDevices,
        location: finalLocation,
        isLoading: false,
        lastSyncTime: Date.now(),
        error: null
      });
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      if (error.message?.includes('401') || error.status === 401) {
        localStorage.removeItem('google_access_token');
        set({ accessToken: null, error: 'Your session has expired. Please sign in again to continue.', isLoading: false });
      } else {
        set({ error: 'Failed to fetch emails: ' + error.message, isLoading: false });
      }
    }
  },


  syncStats: async () => {
    const { user, accessToken, isLoading, subscriptionType, isSubscriptionVerified } = get();
    if (!user || !accessToken || isLoading || !isSubscriptionVerified) return;

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
          const match = snippet.match(/on\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i) ||
            snippet.match(/from\s+a\s+new\s+([A-Za-z0-9\s]+?)(?=\s+device|$)/i) ||
            snippet.match(/on\s+([A-Za-z0-9\s]+?)(?=\s+device|\s+at|\s+from|$)/i);
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
  },

  addAccount: (account) => {
    const newAccount = {
      id: Math.random().toString(36).substr(2, 9),
      ...account,
      avatar: account.photoURL || account.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'
    };
    set((state) => ({
      accounts: [...state.accounts, newAccount],
      currentAccount: newAccount
    }));
    get().fetchEmails();
  },

  switchAccount: (accountId) => {
    const account = get().accounts.find(a => a.id === accountId);
    if (account) {
      set({ currentAccount: account, selectedEmail: null });
      get().fetchEmails();
    }
  },

  removeAccount: (accountId) => {
    set((state) => {
      const remaining = state.accounts.filter(a => a.id !== accountId);
      return {
        accounts: remaining,
        currentAccount: state.currentAccount?.id === accountId ? remaining[0] || null : state.currentAccount
      };
    });
  },

  setActiveFolder: (folder) => set({ activeFolder: folder }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedEmail: (email) => {
    set({ selectedEmail: email });
    if (email && email.status === 'unread') {
      const { accessToken } = get();
      if (accessToken) get().markAsRead(email.id);
    }
  },

  markAsRead: async (id) => {
    const { accessToken } = get();
    if (!accessToken) return;

    await emailService.markAsRead(accessToken, id);
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, status: 'read' } : e
      )
    }));
  },

  toggleStar: async (id) => {
    const { accessToken, emails } = get();
    if (!accessToken) return;

    const email = emails.find(e => e.id === id);
    if (!email) return;

    const isStarred = email.starred;
    await emailService.toggleStar(accessToken, id, isStarred);
    
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, starred: !isStarred } : e
      )
    }));
  },

  toggleImportant: async (id) => {
    const { accessToken, emails } = get();
    if (!accessToken) return;

    const email = emails.find(e => e.id === id);
    if (!email) return;

    const isImportant = email.important;
    await emailService.toggleImportant(accessToken, id, isImportant);
    
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, important: !isImportant } : e
      )
    }));
  },

  archiveEmail: async (id) => {
    const { accessToken } = get();
    if (!accessToken) return;

    await emailService.archiveEmail(accessToken, id);
    set((state) => ({
      emails: state.emails.filter((e) => e.id !== id)
    }));
  },

  deleteEmail: async (id) => {
    const { accessToken } = get();
    if (!accessToken) return;

    await emailService.deleteEmail(accessToken, id);
    set((state) => ({
      emails: state.emails.filter((e) => e.id !== id)
    }));
  },

  getFilteredEmails: () => {
    const { emails, activeFolder, searchQuery } = get();

    let filtered = emails;

    // Filter by 24-hour time limit
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    filtered = filtered.filter(e => new Date(e.date) >= twentyFourHoursAgo);

    // Filter by folder
    if (activeFolder === 'inbox') {
      filtered = filtered.filter(e => e.type === 'incoming');
    } else if (activeFolder === 'sent') {
      filtered = filtered.filter(e => e.type === 'outgoing');
    } else if (activeFolder === 'spam') {
      filtered = filtered.filter(e => e.type === 'spam');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.subject.toLowerCase().includes(query) ||
        e.sender.toLowerCase().includes(query) ||
        (e.recipient && e.recipient.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getStats: () => {
    const { emails, labelStats, purchaseCount, subscriptions, careerCounts, careerSources } = get();

    const incoming = emails.filter(e => e.type === 'incoming');
    const outgoing = emails.filter(e => e.type === 'outgoing');

    // Number formatting helper (Abbreviated if > 999)
    const formatNumber = (num) => {
      if (!num) return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    };

    // Label-wise counts from API
    const getLabelCount = (id) => labelStats.find(l => l.id === id)?.messagesTotal || 0;
    const getLabelUnread = (id) => labelStats.find(l => l.id === id)?.messagesUnread || 0;

    // Storage estimation (Average 25KB per email)
    const AVG_SIZE_KB = 25;
    const formatStorage = (count) => (count * AVG_SIZE_KB / 1024).toFixed(2); // Convert to MB

    const storageBreakdown = {
      read: formatStorage(getLabelCount('INBOX') - getLabelUnread('INBOX')),
      unread: formatStorage(getLabelUnread('INBOX')),
      sent: formatStorage(getLabelCount('SENT')),
      drafts: formatStorage(getLabelCount('DRAFT')),
      total: formatStorage(
        getLabelCount('INBOX') +
        getLabelCount('SENT') +
        getLabelCount('DRAFT') +
        getLabelCount('SPAM')
      )
    };

    // Label-wise counts for categories
    const categoryCounts = emails.reduce((acc, email) => {
      const category = email.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      incoming: (get().profile?.messagesTotal || 0) - getLabelCount('SENT') - getLabelCount('DRAFT'),
      outgoing: getLabelCount('SENT'),
      unread: getLabelUnread('INBOX'),
      spam: getLabelCount('SPAM'),
      drafts: getLabelCount('DRAFT'),
      trash: getLabelCount('TRASH'),
      starred: getLabelCount('STARRED'),
      important: getLabelCount('IMPORTANT'),
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
        total: (get().subscriptionSources || []).reduce((sum, s) => sum + s.count, 0),
        sources: get().subscriptionSources || []
      },
      daily: get().dailyStats || {
        todayTotal: 0,
        todayRead: 0,
        todayUnread: 0,
        todaySent: 0,
        todayDrafts: 0,
        todaySpam: 0,
        todayTrash: 0
      },
      security: {
        alerts: get().securityAlerts || [],
        avgReplyTime: get().avgReplyTime || 'N/A',
        devices: get().deviceCount || 1,
        deviceSummary: get().deviceSummary || "",
        location: get().location || { city: 'Unknown', countryCode: 'N/A' }
      },
      formatNumber // Expose the formatter
    };
  }
}));
