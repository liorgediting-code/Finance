export interface ParsedInvoice {
  merchantName: string;
  date: string;           // ISO date string
  totalAmount: number | null;
  amountBeforeVat: number | null;
  vatAmount: number | null;
  invoiceNumber: string | null;
  supplierVatId: string | null;
}

const VAT_RATE = 0.17;

function cleanNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₪]/g, '').replace(/ש["״]ח/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export function parseInvoiceText(text: string, merchantName: string, date: string): ParsedInvoice {
  const invoiceNumberPatterns = [
    /חשבונית\s+מס[\'׳]?\s+(?:מספר\s+)?[:\s]*([\d\-/]+)/i,
    /מס(?:פר)?\s+חשבונית[:\s]*([\d\-/]+)/i,
    /invoice\s+(?:no\.?|number|#)\s*[:\s]*([\d\-/]+)/i,
  ];

  const vatIdPatterns = [
    /ח\.?פ\.?\s*[:\s]*([\d]{9})/,
    /ע\.?מ\.?\s*[:\s]*([\d]{9})/,
    /מספר\s+עוסק\s*[:\s]*([\d]{9})/,
    /עוסק\s+מורשה\s*[:\s]*([\d]{9})/,
  ];

  const vatAmountPatterns = [
    /מע["״]\s*מ\s*(?:\(\s*17\s*%\s*\))?\s*[:\s]*([\d,. ]+)/,
    /(?:סכום\s+)?מע["״]\s*מ[:\s]+([\d,. ]+)/,
    /vat\s*[:\s]*([\d,. ]+)/i,
  ];

  const totalPatterns = [
    /סכום\s+לתשלום\s*[:\s]*([\d,. ]+)/,
    /סה["״]\s*כ\s+(?:לתשלום|כולל\s+מע["״]\s*מ)\s*[:\s]*([\d,. ]+)/,
    /סכום\s+כולל\s*[:\s]*([\d,. ]+)/,
    /₪\s*([\d,. ]+)/,
    /ש["״]\s*ח\s+([\d,. ]+)/,
  ];

  const beforeVatPatterns = [
    /(?:סכום\s+)?לפני\s+מע["״]\s*מ\s*[:\s]*([\d,. ]+)/,
    /מחיר\s+(?:לפני\s+מע["״]\s*מ|נטו)\s*[:\s]*([\d,. ]+)/,
    /subtotal\s*[:\s]*([\d,. ]+)/i,
  ];

  const invoiceNumber = firstMatch(text, invoiceNumberPatterns);
  const supplierVatId = firstMatch(text, vatIdPatterns);
  const vatRaw = firstMatch(text, vatAmountPatterns);
  const totalRaw = firstMatch(text, totalPatterns);
  const beforeVatRaw = firstMatch(text, beforeVatPatterns);

  let vatAmount = vatRaw ? cleanNumber(vatRaw) : null;
  let totalAmount = totalRaw ? cleanNumber(totalRaw) : null;
  let amountBeforeVat = beforeVatRaw ? cleanNumber(beforeVatRaw) : null;

  // Derive missing values
  if (totalAmount !== null && vatAmount === null && amountBeforeVat === null) {
    vatAmount = Math.round(totalAmount - totalAmount / (1 + VAT_RATE) * 100) / 100;
    amountBeforeVat = Math.round((totalAmount / (1 + VAT_RATE)) * 100) / 100;
  } else if (totalAmount !== null && vatAmount !== null && amountBeforeVat === null) {
    amountBeforeVat = Math.round((totalAmount - vatAmount) * 100) / 100;
  } else if (amountBeforeVat !== null && vatAmount === null && totalAmount === null) {
    vatAmount = Math.round(amountBeforeVat * VAT_RATE * 100) / 100;
    totalAmount = Math.round((amountBeforeVat + vatAmount) * 100) / 100;
  }

  return { merchantName, date, totalAmount, amountBeforeVat, vatAmount, invoiceNumber, supplierVatId };
}

export function parseHtmlEmail(html: string, merchantName: string, date: string): ParsedInvoice {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = doc.body?.innerText ?? html;
  return parseInvoiceText(text, merchantName, date);
}

const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  'שופרסל': 'food',
  'רמי לוי': 'food',
  'מגה': 'food',
  'ויקטורי': 'food',
  'yellow': 'transport',
  'גט': 'transport',
  'סלקום': 'subscriptions',
  'פרטנר': 'subscriptions',
  'הוט': 'subscriptions',
  'yes': 'subscriptions',
  'בזק': 'subscriptions',
  'חשמל': 'utilities',
  'מים': 'utilities',
  'גז': 'utilities',
};

export function suggestCategory(merchantName: string): string | null {
  const lower = merchantName.toLowerCase();
  for (const [key, cat] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase())) return cat;
  }
  return null;
}

export function isDuplicate(
  invoice: ParsedInvoice,
  existingExpenses: Array<{ invoiceNumber?: string; supplierVatId?: string }>
): boolean {
  if (!invoice.invoiceNumber || !invoice.supplierVatId) return false;
  return existingExpenses.some(
    (e) => e.invoiceNumber === invoice.invoiceNumber && e.supplierVatId === invoice.supplierVatId
  );
}
