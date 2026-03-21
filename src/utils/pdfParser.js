import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs-dist (using jsDelivr for version consistency with package.json - note .mjs extension for v5+)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF document provided as a base64 string or ArrayBuffer
 * @param {ArrayBuffer|string} data 
 * @returns {Promise<string>}
 */
export const extractTextFromPdf = async (data) => {
  try {
    let loadingTask;
    if (typeof data === 'string') {
      // Handle base64 from Gmail API (it uses URL-safe base64)
      const binaryString = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      loadingTask = pdfjsLib.getDocument({ data: bytes });
    } else {
      loadingTask = pdfjsLib.getDocument({ data });
    }

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
};

/**
 * Specifically looks for total amounts in invoice text
 * @param {string} text 
 * @returns {number}
 */
export const parseAmountFromInvoiceText = (text) => {
  if (!text) return 0;
  
  const textLower = text.toLowerCase();
  
  // Look for total amount patterns
  const patterns = [
    // High Priority: Total Invoice Value (RedBus specific) - often has no currency symbol immediately after
    /(?:total invoice value|total invoice|total value)\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
    // Standard patterns
    /(?:grand total|total amount|amount payable|total|amount paid|paid|payable|bill|rupees|final amount|order total)\s*(?:amount|price|sum)?\s*(?::|is|of)?\s*(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi,
    /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:total|grand total|paid|amount|rupees|final|order total)/gi
  ];

  let maxFound = 0;
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      if (match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > maxFound && val < 1000000) {
          maxFound = val;
        }
      }
    }
  }

  // Fallback: look for any large numbers near currency symbols if no "total" keyword matched well
  if (maxFound === 0) {
    const fallbackPattern = /(?:rs\.?|₹|rupees|\$|gbp|eur|usd)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
    let match;
    while ((match = fallbackPattern.exec(textLower)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxFound && val < 1000000) maxFound = val;
    }
  }

  return maxFound;
};
