# Gmail Invoice Import & VAT Report — Design Spec
Date: 2026-05-11

## Overview

Two connected features:
1. **Gmail Invoice Import** — users connect their Gmail account to scan purchase emails and auto-import חשבוניות as expense entries with VAT fields.
2. **VAT Report (דוח תשומות)** — business-mode users generate and send a formatted VAT inputs report to their accountant (רואה חשבון) for Israeli VAT reclaim.

## Architecture

Three independent modules:

### 1. Gmail OAuth Module
- Google OAuth 2.0 PKCE flow, separate from Supabase login
- OAuth token exchange handled by a new Vercel function (`api/gmail-oauth.ts`)
- Access + refresh tokens stored in a new Supabase table `user_gmail_tokens` (not in the main JSON blob)
- A second Vercel function (`api/gmail-refresh.ts`) handles token refresh
- Client holds only a short-lived access token in memory for Gmail API calls

### 2. Invoice Import Flow (`/import-gmail`)
- All Gmail API calls made client-side using the access token
- Email parsing (HTML + PDF) done entirely in the browser
- No AI — rule-based Hebrew regex extraction

### 3. Business Tools (gated by business mode toggle)
- Accountant contact stored in main Zustand/Supabase JSON blob
- VAT report page (`/vat-report`) — client-side report generation
- Email sending via new Vercel function (`api/send-report.ts`) using Resend

## Data Model Changes

### `ExpenseEntry` — new optional fields
```ts
invoiceNumber?: string;       // מספר חשבונית
supplierVatId?: string;       // ח.פ / ע.מ של הספק (9-digit)
amountBeforeVat?: number;     // סכום לפני מע"מ
vatAmount?: number;           // סכום מע"מ (17%)
importedFromGmail?: boolean;  // marks auto-imported entries
```

### `CloudData` — new optional fields
```ts
businessMode?: boolean;
accountantName?: string;
accountantEmail?: string;
accountantPhone?: string;
gmailConnected?: boolean;     // display flag only; token stored server-side
```

### New Supabase table: `user_gmail_tokens`
```sql
user_id       uuid references auth.users primary key,
access_token  text,
refresh_token text,
expires_at    timestamptz
```

## Settings Page Changes

### New section: "חיבור Gmail"
- Connection status: shows connected Google account email or "לא מחובר"
- "חבר חשבון Gmail" button → triggers OAuth PKCE flow
- When connected: "נתק" button (revokes token, deletes from DB) + "ייבא חשבוניות" shortcut
- Follows existing `SettingsSection` component pattern

### New section: "מצב עסקי"
- Toggle: "מצב עסקי (עצמאי / עוסק מורשה)"
- When on, reveals:
  - שם רואה חשבון (text)
  - אימייל רואה חשבון (email)
  - טלפון רואה חשבון (phone)
  - "דוח תשומות" button → navigates to `/vat-report`

## Gmail Import Flow (`/import-gmail`)

### Step 1 — Scan
- "סרוק חשבוניות" button
- Queries Gmail API: `category:purchases`, last 90 days
- Loading spinner during fetch

### Step 2 — Parse (client-side)
For each email:
- **HTML body**: parsed via DOM, searching for:
  - Invoice number: `חשבונית מס מספר\s*([\d-]+)`
  - VAT ID: `ח\.?פ\.?\s*(\d{9})` or `ע\.?מ\.?\s*(\d{9})`
  - VAT amount: `מע"מ\s*[:\s]*([\d,.]+)`
  - Total: `סכום לתשלום\s*[:\s]*([\d,.]+)` or `₪\s*([\d,.]+)`
  - Amount before VAT: derived if total and VAT are found (`total / 1.17`)
- **PDF attachments**: extracted as text via `pdf.js`, same patterns applied
- **Merchant name**: from email sender name or `From:` header
- **Date**: from email `Date:` header

Result per email: candidate object with found fields + `null` for missing ones.

### Step 3 — Review Screen
- One card per detected invoice
- Pre-filled fields: merchant, date, total, invoice number, ח.פ, VAT amounts
- Missing required VAT fields highlighted in yellow
- Category selector (auto-suggested from known merchant names)
- Month selector (defaults to current month)
- Per-card checkbox to include/exclude
- "אשר הכל" button — bulk-approves entries that have no missing required fields; entries with missing fields are skipped and highlighted

### Step 4 — Import
- Approved entries added to selected month's expenses with `importedFromGmail: true`
- Toast: "נוספו X חשבוניות לחודש [month]"
- Already-imported invoices (matched by `invoiceNumber` + `supplierVatId`) are skipped on re-scan to prevent duplicates

## VAT Report (`/vat-report`)

### Period selector
- Toggle: חודשי / דו-חודשי
- Month/period picker — defaults to current period

### Summary header
- סה"כ לפני מע"מ
- סה"כ מע"מ לניכוי
- מספר חשבוניות בתקופה

### Expense table
Filters expenses where `vatAmount` is set. Columns:
תאריך | שם ספק | ח.פ | מספר חשבונית | לפני מע"מ | מע"מ | סה"כ

### Actions
- **"הורד CSV"** — downloads CSV with Hebrew column headers, formatted for Israeli accountants
- **"הורד PDF"** — generates Hebrew RTL PDF using `jsPDF` + `jsPDF-AutoTable`
- **"שלח לרואה חשבון"** — visible only when `accountantEmail` is configured. Calls `api/send-report.ts` (Vercel function) with both files attached, using Resend API

### Empty state
"לא נמצאו חשבוניות עם פרטי מע"מ לתקופה זו" + link to `/import-gmail`

## New Vercel Functions

| Function | Purpose |
|----------|---------|
| `api/gmail-oauth.ts` | Exchange OAuth code for tokens, store in `user_gmail_tokens` |
| `api/gmail-refresh.ts` | Refresh expired access token, update DB |
| `api/send-report.ts` | Send email with CSV + PDF attachments to accountant via Resend |

## New Routes

| Path | Component |
|------|-----------|
| `/import-gmail` | `GmailImportPage` |
| `/vat-report` | `VatReportPage` |

Both routes gated by `AuthGuard`. `/vat-report` additionally checks `businessMode === true`.

## New Dependencies

| Package | Purpose |
|---------|---------|
| `pdfjs-dist` | PDF text extraction in browser |
| `jspdf` + `jspdf-autotable` | PDF report generation |
| `resend` | Transactional email (server-side only, in Vercel functions) |

## Error Handling

- Gmail token expired → automatic refresh via `api/gmail-refresh.ts`; if refresh fails, prompt user to reconnect
- Gmail API rate limit → show error with retry button
- PDF parsing fails → all fields left blank, user fills manually
- Email send fails → show error toast, offer download fallback

## Duplicate Prevention

On each scan, invoices already in the store are matched by `invoiceNumber + supplierVatId`. Matched entries are shown as "כבר יובא" and excluded from the default selection.
