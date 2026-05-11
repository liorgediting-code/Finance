# Gmail Invoice Import & VAT Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gmail OAuth-based invoice import with Hebrew rule-based parsing and a business-mode VAT report generator that sends formatted reports to an accountant via email.

**Architecture:** A separate Google OAuth 2.0 PKCE flow stores Gmail tokens in Supabase via Vercel functions. Client-side Gmail API calls fetch `category:purchases` emails, parsed in the browser with Hebrew regex (HTML) and pdf.js (PDFs). Business-mode users generate a דוח תשומות CSV/PDF and optionally email it to their accountant via Resend.

**Tech Stack:** React 19, TypeScript, Zustand, Supabase, Vercel Functions (`@vercel/node`), Gmail REST API, `pdfjs-dist`, `jspdf`, `jspdf-autotable`, `resend`

> **Note:** This project has no test framework. Verification steps are manual checks against the dev server (`npm run dev`).

---

## File Map

**New files:**
- `api/gmail-oauth.ts` — Vercel function: exchange OAuth code → tokens, store in Supabase
- `api/gmail-refresh.ts` — Vercel function: refresh expired access token
- `api/send-report.ts` — Vercel function: send CSV+PDF to accountant via Resend
- `src/lib/gmail.ts` — Gmail REST API client (list messages, fetch full message, get attachment)
- `src/lib/invoiceParser.ts` — Hebrew regex extraction from email HTML/text
- `src/lib/pdfExtractor.ts` — pdf.js text extraction from base64 attachment data
- `src/lib/vatReport.ts` — CSV and PDF generation for דוח תשומות
- `src/components/gmail/GmailImportPage.tsx` — full Gmail import flow
- `src/components/vat/VatReportPage.tsx` — VAT report page

**Modified files:**
- `src/types/index.ts` — new optional fields on `ExpenseEntry`, new optional fields on `CloudData`
- `src/store/useFinanceStore.ts` — new state fields and actions for business mode + Gmail flag
- `src/components/settings/SettingsPage.tsx` — two new sections: Gmail connect, business mode
- `src/App.tsx` — two new lazy routes: `/import-gmail`, `/vat-report`

---

## Pre-requisites (do once, manually)

### Google Cloud Console setup
1. Go to console.cloud.google.com → create a project (or use existing)
2. Enable **Gmail API**
3. Create OAuth 2.0 credentials → Web application
4. Add authorized redirect URIs:
   - `http://localhost:5173/settings` (dev)
   - `https://<your-vercel-domain>/settings` (prod)
5. Copy **Client ID** and **Client Secret**

### Supabase SQL (run in Supabase dashboard → SQL Editor)
```sql
create table if not exists user_gmail_tokens (
  user_id       uuid references auth.users on delete cascade primary key,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  gmail_email   text
);

alter table user_gmail_tokens enable row level security;

create policy "Users manage own tokens"
  on user_gmail_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Environment variables
Add to `.env.local` (dev) and Vercel project settings (prod):
```
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
RESEND_API_KEY=<your-resend-api-key>
# Already present:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install pdfjs-dist jspdf jspdf-autotable resend
npm install --save-dev @types/jspdf-autotable
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pdfjs-dist, jspdf, jspdf-autotable, resend"
```

---

## Task 2: Type Model Changes

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add VAT fields to `ExpenseEntry`**

In `src/types/index.ts`, after the existing `linkedSourceType` line in `ExpenseEntry`, add:

```ts
  invoiceNumber?: string;
  supplierVatId?: string;
  amountBeforeVat?: number;
  vatAmount?: number;
  importedFromGmail?: boolean;
```

- [ ] **Step 2: Add business-mode fields to `CloudData`**

In `src/store/useFinanceStore.ts`, add these optional fields to the `CloudData` interface (after `portfolioItems`):

```ts
  businessMode?: boolean;
  accountantName?: string;
  accountantEmail?: string;
  accountantPhone?: string;
  gmailConnected?: boolean;
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/store/useFinanceStore.ts
git commit -m "feat: add VAT fields to ExpenseEntry and business-mode fields to CloudData"
```

---

## Task 3: Store Actions for Business Mode & Gmail Flag

**Files:**
- Modify: `src/store/useFinanceStore.ts`

- [ ] **Step 1: Add default values in `DEFAULT_CLOUD_DATA`**

Find the `DEFAULT_CLOUD_DATA` constant (or wherever the store is initialized) and add:

```ts
businessMode: false,
accountantName: '',
accountantEmail: '',
accountantPhone: '',
gmailConnected: false,
```

- [ ] **Step 2: Add actions to the store**

In the store's action definitions, add:

```ts
setBusinessMode: (val: boolean) => {
  set((s) => ({ businessMode: val }));
  get().sync();
},
setAccountantDetails: (details: { name: string; email: string; phone: string }) => {
  set(() => ({
    accountantName: details.name,
    accountantEmail: details.email,
    accountantPhone: details.phone,
  }));
  get().sync();
},
setGmailConnected: (val: boolean) => {
  set(() => ({ gmailConnected: val }));
  get().sync();
},
```

- [ ] **Step 3: Add state fields to the store's `set`/`get` signature**

Make sure `businessMode`, `accountantName`, `accountantEmail`, `accountantPhone`, and `gmailConnected` are included in the store's top-level state destructuring wherever `CloudData` fields are spread into state.

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/store/useFinanceStore.ts
git commit -m "feat: add business mode and Gmail connection actions to store"
```

---

## Task 4: Gmail API Client

**Files:**
- Create: `src/lib/gmail.ts`

- [ ] **Step 1: Create the file**

```ts
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailMessageDetail {
  id: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string; size: number };
    parts?: GmailPart[];
    mimeType: string;
  };
  internalDate: string;
}

export interface GmailPart {
  partId: string;
  mimeType: string;
  filename: string;
  body: { attachmentId?: string; data?: string; size: number };
  parts?: GmailPart[];
}

export interface GmailAttachment {
  data: string; // base64url encoded
  size: number;
}

async function gmailFetch(path: string, accessToken: string): Promise<Response> {
  return fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function listPurchaseMessages(
  accessToken: string,
  maxResults = 50
): Promise<GmailMessage[]> {
  const since = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  const query = encodeURIComponent(`category:purchases after:${since}`);
  const res = await gmailFetch(`/messages?q=${query}&maxResults=${maxResults}`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  const json = await res.json();
  return (json.messages as GmailMessage[]) ?? [];
}

export async function getMessageDetail(
  messageId: string,
  accessToken: string
): Promise<GmailMessageDetail> {
  const res = await gmailFetch(`/messages/${messageId}?format=full`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

export async function getAttachment(
  messageId: string,
  attachmentId: string,
  accessToken: string
): Promise<GmailAttachment> {
  const res = await gmailFetch(`/messages/${messageId}/attachments/${attachmentId}`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

export function getHeader(detail: GmailMessageDetail, name: string): string {
  return detail.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

export function extractHtmlBody(payload: GmailMessageDetail['payload']): string {
  if (payload.mimeType === 'text/html' && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        for (const sub of part.parts) {
          if (sub.mimeType === 'text/html' && sub.body.data) {
            return decodeBase64Url(sub.body.data);
          }
        }
      }
    }
  }
  if (payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  return '';
}

export function findPdfAttachments(payload: GmailMessageDetail['payload']): GmailPart[] {
  const results: GmailPart[] = [];
  const scan = (parts: GmailPart[]) => {
    for (const part of parts) {
      if (part.mimeType === 'application/pdf' || part.filename?.endsWith('.pdf')) {
        results.push(part);
      }
      if (part.parts) scan(part.parts);
    }
  };
  if (payload.parts) scan(payload.parts);
  return results;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/gmail.ts
git commit -m "feat: add Gmail REST API client"
```

---

## Task 5: Invoice Parser

**Files:**
- Create: `src/lib/invoiceParser.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/invoiceParser.ts
git commit -m "feat: add Hebrew invoice parser with regex extraction"
```

---

## Task 6: PDF Extractor

**Files:**
- Create: `src/lib/pdfExtractor.ts`

- [ ] **Step 1: Create the file**

```ts
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromBase64Pdf(base64url: string): Promise<string> {
  try {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n');
  } catch {
    return '';
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors. (pdf.js workers load at runtime, not build time.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdfExtractor.ts
git commit -m "feat: add pdf.js text extractor for invoice PDFs"
```

---

## Task 7: Gmail OAuth Vercel Function

**Files:**
- Create: `api/gmail-oauth.ts`

- [ ] **Step 1: Create the file**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const { code, codeVerifier, redirectUri } = req.body as {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  };
  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'code, codeVerifier, and redirectUri required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    return res.status(400).json({ error: err.error_description ?? 'Token exchange failed' });
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { error: upsertError } = await adminClient.from('user_gmail_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    gmail_email: userInfo.email ?? null,
  });

  if (upsertError) return res.status(500).json({ error: 'Failed to store tokens' });

  return res.status(200).json({
    accessToken: tokens.access_token,
    expiresAt,
    gmailEmail: userInfo.email ?? null,
  });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add api/gmail-oauth.ts
git commit -m "feat: add Gmail OAuth token exchange Vercel function"
```

---

## Task 8: Gmail Refresh Vercel Function

**Files:**
- Create: `api/gmail-refresh.ts`

- [ ] **Step 1: Create the file**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: tokenRow } = await adminClient
    .from('user_gmail_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .single();

  if (!tokenRow?.refresh_token) return res.status(404).json({ error: 'No refresh token found' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokenRow.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    await adminClient.from('user_gmail_tokens').delete().eq('user_id', user.id);
    return res.status(400).json({ error: 'Refresh failed — user must reconnect' });
  }

  const tokens = await tokenRes.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await adminClient.from('user_gmail_tokens').update({
    access_token: tokens.access_token,
    expires_at: expiresAt,
  }).eq('user_id', user.id);

  return res.status(200).json({ accessToken: tokens.access_token, expiresAt });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add api/gmail-refresh.ts
git commit -m "feat: add Gmail token refresh Vercel function"
```

---

## Task 9: Send Report Vercel Function

**Files:**
- Create: `api/send-report.ts`

- [ ] **Step 1: Create the file**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const {
    toEmail,
    toName,
    periodLabel,
    csvBase64,
    pdfBase64,
  } = req.body as {
    toEmail: string;
    toName: string;
    periodLabel: string;
    csvBase64: string;
    pdfBase64: string;
  };

  if (!toEmail || !csvBase64) return res.status(400).json({ error: 'toEmail and csvBase64 required' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const attachments: Array<{ filename: string; content: string }> = [
    { filename: `דוח-תשומות-${periodLabel}.csv`, content: csvBase64 },
  ];
  if (pdfBase64) {
    attachments.push({ filename: `דוח-תשומות-${periodLabel}.pdf`, content: pdfBase64 });
  }

  const { error } = await resend.emails.send({
    from: 'reports@your-domain.com',
    to: toEmail,
    subject: `דוח תשומות ${periodLabel}`,
    html: `<div dir="rtl"><p>שלום ${toName ?? ''},</p><p>מצורף דוח תשומות לתקופה ${periodLabel}.</p><p>הדוח נוצר אוטומטית על ידי מערכת ניהול הכספים.</p></div>`,
    attachments,
  });

  if (error) return res.status(500).json({ error: 'Failed to send email' });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Update the `from` email address**

Replace `reports@your-domain.com` with a verified sender domain from your Resend account.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add api/send-report.ts
git commit -m "feat: add send-report Vercel function using Resend"
```

---

## Task 10: Settings — Gmail Connection Section

**Files:**
- Modify: `src/components/settings/SettingsPage.tsx`

- [ ] **Step 1: Add imports and PKCE helpers**

At the top of `SettingsPage.tsx`, add these imports and helpers after the existing imports:

```ts
import { useEffect, useState as useLocalState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
```

Add these helper functions before the `SettingsPage` component:

```ts
function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';
```

- [ ] **Step 2: Add Gmail state and OAuth callback handler to `SettingsPage`**

Inside the `SettingsPage` component function, add:

```ts
const navigate = useNavigate();
const { session } = useAuthStore(useShallow((s) => ({ session: s.session })));
const { gmailConnected, setGmailConnected } = useFinanceStore(
  useShallow((s) => ({ gmailConnected: s.gmailConnected, setGmailConnected: s.setGmailConnected }))
);
const [gmailEmail, setGmailEmail] = useLocalState<string | null>(
  () => sessionStorage.getItem('gmail_email')
);
const [gmailLoading, setGmailLoading] = useLocalState(false);
const [gmailError, setGmailError] = useLocalState<string | null>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const codeVerifier = sessionStorage.getItem('gmail_code_verifier');
  if (!code || !codeVerifier || !session?.access_token) return;

  window.history.replaceState({}, '', '/settings');
  setGmailLoading(true);

  const redirectUri = `${window.location.origin}/settings`;
  fetch('/api/gmail-oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      sessionStorage.setItem('gmail_access_token', data.accessToken);
      sessionStorage.setItem('gmail_expires_at', data.expiresAt);
      sessionStorage.setItem('gmail_email', data.gmailEmail ?? '');
      sessionStorage.removeItem('gmail_code_verifier');
      setGmailEmail(data.gmailEmail ?? '');
      setGmailConnected(true);
    })
    .catch((e) => setGmailError(e.message))
    .finally(() => setGmailLoading(false));
}, []);

async function connectGmail() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('gmail_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/settings`,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function disconnectGmail() {
  sessionStorage.removeItem('gmail_access_token');
  sessionStorage.removeItem('gmail_expires_at');
  sessionStorage.removeItem('gmail_email');
  setGmailEmail(null);
  setGmailConnected(false);
}
```

- [ ] **Step 3: Add the Gmail section JSX**

Inside the `SettingsPage` JSX, add this section (after the existing export/data sections):

```tsx
<SettingsSection title="חיבור Gmail" accentColor="#EA4335">
  {gmailError && (
    <p className="text-sm text-red-500 mb-3">{gmailError}</p>
  )}
  {gmailConnected ? (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1E1E2E]">מחובר</p>
        {gmailEmail && <p className="text-xs text-[#6B6B8A] mt-0.5">{gmailEmail}</p>}
      </div>
      <button
        onClick={() => navigate('/import-gmail')}
        className="px-3 py-1.5 text-xs font-medium bg-lavender text-white rounded-lg hover:bg-lavender-dark transition-colors"
      >
        ייבא חשבוניות
      </button>
      <button
        onClick={disconnectGmail}
        className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
      >
        נתק
      </button>
    </div>
  ) : (
    <div>
      <p className="text-sm text-[#6B6B8A] mb-3">
        חבר את חשבון ה-Gmail שלך כדי לייבא חשבוניות אוטומטית כהוצאות.
      </p>
      <button
        onClick={connectGmail}
        disabled={gmailLoading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {gmailLoading ? (
          <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        )}
        חבר חשבון Gmail
      </button>
    </div>
  )}
</SettingsSection>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `/settings`. Verify the "חיבור Gmail" section appears with the connect button. Click it — verify it redirects to Google OAuth (will fail without valid credentials, but the redirect URL should be well-formed).

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/SettingsPage.tsx
git commit -m "feat: add Gmail connection section to Settings"
```

---

## Task 11: Settings — Business Mode Section

**Files:**
- Modify: `src/components/settings/SettingsPage.tsx`

- [ ] **Step 1: Add business mode state to `SettingsPage`**

Inside the component, add to the existing `useFinanceStore` selector:

```ts
const { businessMode, accountantName, accountantEmail, accountantPhone,
        setBusinessMode, setAccountantDetails } = useFinanceStore(
  useShallow((s) => ({
    businessMode: s.businessMode,
    accountantName: s.accountantName,
    accountantEmail: s.accountantEmail,
    accountantPhone: s.accountantPhone,
    setBusinessMode: s.setBusinessMode,
    setAccountantDetails: s.setAccountantDetails,
  }))
);
const [accName, setAccName] = useLocalState(accountantName ?? '');
const [accEmail, setAccEmail] = useLocalState(accountantEmail ?? '');
const [accPhone, setAccPhone] = useLocalState(accountantPhone ?? '');
```

- [ ] **Step 2: Add the business mode section JSX**

After the Gmail section, add:

```tsx
<SettingsSection title="מצב עסקי" accentColor="#F59E0B">
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-sm font-medium text-[#1E1E2E]">מצב עסקי</p>
      <p className="text-xs text-[#6B6B8A] mt-0.5">עצמאי / עוסק מורשה</p>
    </div>
    <button
      onClick={() => setBusinessMode(!businessMode)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        businessMode ? 'bg-lavender-dark' : 'bg-gray-200'
      }`}
      role="switch"
      aria-checked={businessMode}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          businessMode ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>

  {businessMode && (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div>
        <label className="text-xs text-[#6B6B8A] mb-1 block">שם רואה חשבון</label>
        <input
          className={inputCls}
          value={accName}
          onChange={(e) => setAccName(e.target.value)}
          onBlur={() => setAccountantDetails({ name: accName, email: accEmail, phone: accPhone })}
          placeholder="ישראל ישראלי"
          dir="rtl"
        />
      </div>
      <div>
        <label className="text-xs text-[#6B6B8A] mb-1 block">אימייל רואה חשבון</label>
        <input
          className={inputCls}
          type="email"
          value={accEmail}
          onChange={(e) => setAccEmail(e.target.value)}
          onBlur={() => setAccountantDetails({ name: accName, email: accEmail, phone: accPhone })}
          placeholder="accountant@example.com"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-xs text-[#6B6B8A] mb-1 block">טלפון רואה חשבון</label>
        <input
          className={inputCls}
          type="tel"
          value={accPhone}
          onChange={(e) => setAccPhone(e.target.value)}
          onBlur={() => setAccountantDetails({ name: accName, email: accEmail, phone: accPhone })}
          placeholder="050-0000000"
          dir="ltr"
        />
      </div>
      <button
        onClick={() => navigate('/vat-report')}
        className="w-full mt-2 px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        דוח תשומות (מע״מ)
      </button>
    </div>
  )}
</SettingsSection>
```

- [ ] **Step 3: Verify in browser**

Navigate to `/settings`. Toggle "מצב עסקי" on — verify the accountant fields appear. Fill them in and blur — verify they persist after page reload (saved to Supabase via store sync).

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/SettingsPage.tsx
git commit -m "feat: add business mode and accountant details section to Settings"
```

---

## Task 12: Gmail Import Page

**Files:**
- Create: `src/components/gmail/GmailImportPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { MONTHS } from '../../config/months';
import { CATEGORIES } from '../../config/categories';
import {
  listPurchaseMessages,
  getMessageDetail,
  getAttachment,
  getHeader,
  extractHtmlBody,
  findPdfAttachments,
} from '../../lib/gmail';
import { parseHtmlEmail, parseInvoiceText, suggestCategory, isDuplicate } from '../../lib/invoiceParser';
import { extractTextFromBase64Pdf } from '../../lib/pdfExtractor';
import type { ParsedInvoice } from '../../lib/invoiceParser';
import type { ExpenseEntry } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ReviewItem extends ParsedInvoice {
  gmailId: string;
  selected: boolean;
  categoryId: string;
  monthIndex: number;
  alreadyImported: boolean;
}

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export default function GmailImportPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore(useShallow((s) => ({ session: s.session })));
  const { months, addExpense, setGmailConnected } = useFinanceStore(
    useShallow((s) => ({
      months: s.months,
      addExpense: s.addExpense,
      setGmailConnected: s.setGmailConnected,
    }))
  );

  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  const allExpenses = Object.values(months).flatMap((m) => m.expenses);

  async function getAccessToken(): Promise<string | null> {
    const token = sessionStorage.getItem('gmail_access_token');
    const expiresAt = sessionStorage.getItem('gmail_expires_at');
    if (!token || !expiresAt) return null;
    if (new Date(expiresAt) > new Date(Date.now() + 60_000)) return token;

    const res = await fetch('/api/gmail-refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (!res.ok) {
      setGmailConnected(false);
      navigate('/settings');
      return null;
    }
    const data = await res.json();
    sessionStorage.setItem('gmail_access_token', data.accessToken);
    sessionStorage.setItem('gmail_expires_at', data.expiresAt);
    return data.accessToken;
  }

  async function scan() {
    setScanning(true);
    setError(null);
    setItems([]);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setError('נא לחבר את Gmail מחדש'); return; }

      const messages = await listPurchaseMessages(accessToken);
      const results: ReviewItem[] = [];

      for (const msg of messages) {
        try {
          const detail = await getMessageDetail(msg.id, accessToken);
          const merchantName = getHeader(detail, 'from').replace(/<.*>/, '').trim();
          const rawDate = getHeader(detail, 'date');
          const date = rawDate ? new Date(rawDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const monthIndex = new Date(date).getMonth();

          const html = extractHtmlBody(detail.payload);
          let parsed = parseHtmlEmail(html, merchantName, date);

          if (!parsed.totalAmount) {
            const pdfs = findPdfAttachments(detail.payload);
            for (const pdf of pdfs) {
              if (!pdf.body.attachmentId) continue;
              const attachment = await getAttachment(msg.id, pdf.body.attachmentId, accessToken);
              const text = await extractTextFromBase64Pdf(attachment.data);
              if (text) {
                parsed = parseInvoiceText(text, merchantName, date);
                break;
              }
            }
          }

          const alreadyImported = isDuplicate(parsed, allExpenses);
          const suggestedCat = suggestCategory(merchantName) ?? 'other';

          results.push({
            ...parsed,
            gmailId: msg.id,
            selected: !alreadyImported,
            categoryId: suggestedCat,
            monthIndex,
            alreadyImported,
          });
        } catch {
          // skip individual message errors
        }
      }
      setItems(results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בסריקה');
    } finally {
      setScanning(false);
    }
  }

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }

  function updateItem(idx: number, patch: Partial<ReviewItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }

  function approveAll() {
    setItems((prev) => prev.map((it) => ({
      ...it,
      selected: !it.alreadyImported && it.totalAmount !== null,
    })));
  }

  function importSelected() {
    const toImport = items.filter((it) => it.selected && !it.alreadyImported);
    for (const item of toImport) {
      const entry: ExpenseEntry = {
        id: uuidv4(),
        date: item.date,
        categoryId: item.categoryId,
        subcategoryId: '',
        description: item.merchantName,
        amount: item.totalAmount ?? 0,
        paymentMethod: 'transfer',
        notes: '',
        invoiceNumber: item.invoiceNumber ?? undefined,
        supplierVatId: item.supplierVatId ?? undefined,
        amountBeforeVat: item.amountBeforeVat ?? undefined,
        vatAmount: item.vatAmount ?? undefined,
        importedFromGmail: true,
      };
      addExpense(item.monthIndex, entry);
    }
    setImported(toImport.length);
    setItems([]);
  }

  const hasMissingVat = items.some(
    (it) => it.selected && !it.alreadyImported && (!it.invoiceNumber || !it.supplierVatId)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/settings')} className="text-[#6B6B8A] hover:text-[#1E1E2E]">
          ← חזרה
        </button>
        <h1 className="text-lg font-bold text-[#1E1E2E]">ייבוא חשבוניות מ-Gmail</h1>
      </div>

      {imported !== null && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          נוספו {imported} חשבוניות בהצלחה
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={scan}
        disabled={scanning}
        className="flex items-center gap-2 px-5 py-2.5 bg-lavender-dark text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {scanning && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {scanning ? 'סורק...' : 'סרוק חשבוניות (90 ימים אחרונים)'}
      </button>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B6B8A]">נמצאו {items.length} הודעות</p>
            <div className="flex gap-2">
              <button
                onClick={approveAll}
                className="px-3 py-1.5 text-xs font-medium bg-lavender text-white rounded-lg hover:bg-lavender-dark transition-colors"
              >
                אשר הכל
              </button>
              <button
                onClick={importSelected}
                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ייבא נבחרים ({items.filter((it) => it.selected && !it.alreadyImported).length})
              </button>
            </div>
          </div>
          {hasMissingVat && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              חלק מהחשבוניות הנבחרות חסרות פרטי מע״מ. ניתן לייבא אותן ללא פרטים אלו ולהשלים בהמשך.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.gmailId}
                className={`bg-white rounded-xl border p-4 ${
                  item.alreadyImported ? 'opacity-50' : item.selected ? 'border-lavender' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    disabled={item.alreadyImported}
                    onChange={() => toggleItem(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#1E1E2E]">{item.merchantName}</p>
                      {item.alreadyImported && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">כבר יובא</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#6B6B8A]">תאריך: </span>
                        <span>{item.date}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B8A]">סכום: </span>
                        <span>{item.totalAmount ? `₪${item.totalAmount.toLocaleString()}` : '—'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[#6B6B8A]">מספר חשבונית</label>
                        <input
                          className={`w-full border rounded px-2 py-1 text-xs mt-0.5 ${!item.invoiceNumber ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                          value={item.invoiceNumber ?? ''}
                          onChange={(e) => updateItem(idx, { invoiceNumber: e.target.value || null })}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B6B8A]">ח.פ ספק</label>
                        <input
                          className={`w-full border rounded px-2 py-1 text-xs mt-0.5 ${!item.supplierVatId ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                          value={item.supplierVatId ?? ''}
                          onChange={(e) => updateItem(idx, { supplierVatId: e.target.value || null })}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B6B8A]">לפני מע״מ</label>
                        <input
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5"
                          type="number"
                          value={item.amountBeforeVat ?? ''}
                          onChange={(e) => updateItem(idx, { amountBeforeVat: parseFloat(e.target.value) || null })}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B6B8A]">מע״מ</label>
                        <input
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5"
                          type="number"
                          value={item.vatAmount ?? ''}
                          onChange={(e) => updateItem(idx, { vatAmount: parseFloat(e.target.value) || null })}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[#6B6B8A]">קטגוריה</label>
                        <select
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5"
                          value={item.categoryId}
                          onChange={(e) => updateItem(idx, { categoryId: e.target.value })}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#6B6B8A]">חודש</label>
                        <select
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5"
                          value={item.monthIndex}
                          onChange={(e) => updateItem(idx, { monthIndex: parseInt(e.target.value) })}
                        >
                          {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/gmail/GmailImportPage.tsx
git commit -m "feat: add Gmail invoice import page with review flow"
```

---

## Task 13: VAT Report Generator

**Files:**
- Create: `src/lib/vatReport.ts`

- [ ] **Step 1: Create the file**

```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseEntry } from '../types';

export interface VatExpense {
  date: string;
  merchantName: string;
  supplierVatId: string;
  invoiceNumber: string;
  amountBeforeVat: number;
  vatAmount: number;
  total: number;
}

export function collectVatExpenses(
  months: Record<number, { expenses: ExpenseEntry[] }>,
  monthIndices: number[]
): VatExpense[] {
  return monthIndices.flatMap((mi) =>
    (months[mi]?.expenses ?? [])
      .filter((e) => e.vatAmount != null && e.vatAmount > 0)
      .map((e) => ({
        date: e.date,
        merchantName: e.description,
        supplierVatId: e.supplierVatId ?? '',
        invoiceNumber: e.invoiceNumber ?? '',
        amountBeforeVat: e.amountBeforeVat ?? (e.amount - (e.vatAmount ?? 0)),
        vatAmount: e.vatAmount ?? 0,
        total: e.amount,
      }))
  );
}

export function generateCsv(expenses: VatExpense[], periodLabel: string): string {
  const header = 'תאריך,שם ספק,ח.פ,מספר חשבונית,לפני מע"מ,מע"מ,סה"כ';
  const rows = expenses.map((e) =>
    [e.date, e.merchantName, e.supplierVatId, e.invoiceNumber,
     e.amountBeforeVat.toFixed(2), e.vatAmount.toFixed(2), e.total.toFixed(2)].join(',')
  );
  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);
  const summary = `סה"כ,,,, ${totalBeforeVat.toFixed(2)},${totalVat.toFixed(2)},${totalAmount.toFixed(2)}`;
  const titleRow = `דוח תשומות - ${periodLabel}`;
  return [titleRow, header, ...rows, summary].join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const bom = '﻿';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generatePdf(expenses: VatExpense[], periodLabel: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text(`VAT Inputs Report - ${periodLabel}`, 14, 15);

  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);

  doc.setFontSize(9);
  doc.text(`Total before VAT: ${totalBeforeVat.toFixed(2)}   VAT: ${totalVat.toFixed(2)}   Total: ${totalAmount.toFixed(2)}`, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [['Date', 'Supplier', 'VAT ID', 'Invoice #', 'Before VAT', 'VAT', 'Total']],
    body: expenses.map((e) => [
      e.date, e.merchantName, e.supplierVatId, e.invoiceNumber,
      e.amountBeforeVat.toFixed(2), e.vatAmount.toFixed(2), e.total.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [123, 109, 200] },
  });

  return doc;
}

export function pdfToBase64(doc: jsPDF): string {
  return btoa(doc.output());
}

export function csvToBase64(csv: string): string {
  const bom = '﻿';
  return btoa(unescape(encodeURIComponent(bom + csv)));
}
```

> **Note:** jsPDF has limited Hebrew RTL support. Column headers are in English to ensure correct rendering. The CSV (with BOM) will display Hebrew correctly in Excel.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vatReport.ts
git commit -m "feat: add VAT report CSV and PDF generator"
```

---

## Task 14: VAT Report Page

**Files:**
- Create: `src/components/vat/VatReportPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { MONTHS } from '../../config/months';
import {
  collectVatExpenses,
  generateCsv,
  downloadCsv,
  generatePdf,
  pdfToBase64,
  csvToBase64,
} from '../../lib/vatReport';

type PeriodType = 'monthly' | 'bimonthly';

const currentMonth = new Date().getMonth();

function getMonthIndices(type: PeriodType, anchorMonth: number): number[] {
  if (type === 'monthly') return [anchorMonth];
  const start = anchorMonth % 2 === 0 ? anchorMonth : anchorMonth - 1;
  return [start, start + 1].filter((m) => m >= 0 && m <= 11);
}

export default function VatReportPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore(useShallow((s) => ({ session: s.session })));
  const { months, businessMode, accountantName, accountantEmail } = useFinanceStore(
    useShallow((s) => ({
      months: s.months,
      businessMode: s.businessMode,
      accountantName: s.accountantName,
      accountantEmail: s.accountantEmail,
    }))
  );

  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [anchorMonth, setAnchorMonth] = useState(currentMonth);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'ok' | 'error' | null>(null);

  if (!businessMode) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <p className="text-[#6B6B8A] mb-4">דוח תשומות זמין במצב עסקי בלבד.</p>
        <button onClick={() => navigate('/settings')} className="text-lavender-dark underline text-sm">
          עבור להגדרות
        </button>
      </div>
    );
  }

  const monthIndices = getMonthIndices(periodType, anchorMonth);
  const periodLabel = monthIndices.map((i) => MONTHS[i]).join('-');
  const expenses = collectVatExpenses(months, monthIndices);

  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);

  function handleDownloadCsv() {
    const csv = generateCsv(expenses, periodLabel);
    downloadCsv(csv, `דוח-תשומות-${periodLabel}.csv`);
  }

  function handleDownloadPdf() {
    const doc = generatePdf(expenses, periodLabel);
    doc.save(`דוח-תשומות-${periodLabel}.pdf`);
  }

  async function handleSendToAccountant() {
    if (!accountantEmail || !session?.access_token) return;
    setSending(true);
    setSendResult(null);
    try {
      const csv = generateCsv(expenses, periodLabel);
      const doc = generatePdf(expenses, periodLabel);
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          toEmail: accountantEmail,
          toName: accountantName ?? '',
          periodLabel,
          csvBase64: csvToBase64(csv),
          pdfBase64: pdfToBase64(doc),
        }),
      });
      setSendResult(res.ok ? 'ok' : 'error');
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/settings')} className="text-[#6B6B8A] hover:text-[#1E1E2E]">
          ← חזרה
        </button>
        <h1 className="text-lg font-bold text-[#1E1E2E]">דוח תשומות (מע״מ)</h1>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(['monthly', 'bimonthly'] as PeriodType[]).map((t) => (
            <button
              key={t}
              onClick={() => setPeriodType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                periodType === t ? 'bg-lavender-dark text-white' : 'bg-gray-100 text-[#6B6B8A]'
              }`}
            >
              {t === 'monthly' ? 'חודשי' : 'דו-חודשי'}
            </button>
          ))}
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1E1E2E]"
          value={anchorMonth}
          onChange={(e) => setAnchorMonth(parseInt(e.target.value))}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <span className="text-sm text-[#6B6B8A]">תקופה: {periodLabel}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'לפני מע״מ', value: totalBeforeVat },
          { label: 'מע״מ לניכוי', value: totalVat },
          { label: 'סה״כ', value: totalAmount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-[#6B6B8A] mb-1">{label}</p>
            <p className="text-lg font-bold text-[#1E1E2E]">₪{value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownloadCsv}
          disabled={expenses.length === 0}
          className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          הורד CSV
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={expenses.length === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-40"
        >
          הורד PDF
        </button>
        {accountantEmail && (
          <button
            onClick={handleSendToAccountant}
            disabled={sending || expenses.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lavender-dark text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            שלח לרואה חשבון ({accountantEmail})
          </button>
        )}
      </div>

      {sendResult === 'ok' && <p className="text-sm text-green-600">הדוח נשלח בהצלחה ✓</p>}
      {sendResult === 'error' && <p className="text-sm text-red-500">שגיאה בשליחה — הורד את הקובץ ושלח ידנית</p>}

      {/* Table */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-[#6B6B8A] text-sm mb-3">לא נמצאו חשבוניות עם פרטי מע״מ לתקופה זו</p>
          <button onClick={() => navigate('/import-gmail')} className="text-lavender-dark underline text-sm">
            ייבא חשבוניות מ-Gmail
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['תאריך', 'שם ספק', 'ח.פ', 'מספר חשבונית', 'לפני מע״מ', 'מע״מ', 'סה״כ'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-right font-medium text-[#6B6B8A]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{e.date}</td>
                  <td className="px-3 py-2 font-medium">{e.merchantName}</td>
                  <td className="px-3 py-2 text-gray-500" dir="ltr">{e.supplierVatId || '—'}</td>
                  <td className="px-3 py-2 text-gray-500" dir="ltr">{e.invoiceNumber || '—'}</td>
                  <td className="px-3 py-2">₪{e.amountBeforeVat.toFixed(2)}</td>
                  <td className="px-3 py-2">₪{e.vatAmount.toFixed(2)}</td>
                  <td className="px-3 py-2 font-medium">₪{e.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/vat/VatReportPage.tsx
git commit -m "feat: add VAT report page with period selector and report generation"
```

---

## Task 15: Wire Routes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports**

After the last `lazy()` import in `App.tsx`, add:

```ts
const GmailImportPage = lazy(() => import('./components/gmail/GmailImportPage'))
const VatReportPage   = lazy(() => import('./components/vat/VatReportPage'))
```

- [ ] **Step 2: Add routes**

Inside the `<Routes>` inside `<Suspense>`, after the last `<Route>`, add:

```tsx
<Route path="/import-gmail" element={<GmailImportPage />} />
<Route path="/vat-report" element={<VatReportPage />} />
```

- [ ] **Step 3: Verify full build**

```bash
npm run build
```

Expected: build succeeds, no unused variable errors.

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

1. Navigate to `/settings` — verify both new sections appear (Gmail + מצב עסקי)
2. Toggle מצב עסקי on — verify accountant fields appear, fill them in, blur, reload — verify they persisted
3. Navigate to `/vat-report` — verify the page loads (will show empty state if no VAT expenses)
4. Navigate to `/import-gmail` — verify the page loads with the scan button

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /import-gmail and /vat-report routes"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Gmail OAuth PKCE flow (Tasks 7, 10)
- ✅ `category:purchases` Gmail query (Task 4)
- ✅ HTML parsing with Hebrew regex (Task 5)
- ✅ PDF extraction via pdf.js (Task 6)
- ✅ Review screen with bulk approve + per-card editing (Task 12)
- ✅ Duplicate prevention via invoiceNumber + supplierVatId (Task 5, 12)
- ✅ Business mode toggle in Settings (Task 11)
- ✅ Accountant details stored in Supabase (Task 3, 11)
- ✅ VAT report with monthly/bi-monthly period (Task 14)
- ✅ CSV download with BOM for Hebrew Excel (Task 13)
- ✅ PDF download via jsPDF (Task 13, 14)
- ✅ Send to accountant via Resend (Task 9, 14)
- ✅ `/vat-report` gated by businessMode (Task 14)
- ✅ Token refresh on expiry (Task 8, 12)
