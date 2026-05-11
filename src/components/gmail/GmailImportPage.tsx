import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { HEBREW_MONTHS } from '../../config/months';
import { CATEGORIES } from '../../config/categories';
import { supabase } from '../../lib/supabase';
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

interface ReviewItem extends ParsedInvoice {
  gmailId: string;
  selected: boolean;
  categoryId: string;
  monthIndex: number;
  alreadyImported: boolean;
}

export default function GmailImportPage() {
  const navigate = useNavigate();
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch('/api/gmail-refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      setGmailConnected(false);
      navigate('/settings');
      return null;
    }
    const data = await res.json() as { accessToken: string; expiresAt: string };
    sessionStorage.setItem('gmail_access_token', data.accessToken);
    sessionStorage.setItem('gmail_expires_at', data.expiresAt);
    return data.accessToken;
  }

  async function scan() {
    setScanning(true);
    setError(null);
    setItems([]);
    setImported(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setError('נא לחבר את Gmail מחדש'); setScanning(false); return; }

      const messages = await listPurchaseMessages(accessToken);
      const results: ReviewItem[] = [];

      for (const msg of messages) {
        try {
          const detail = await getMessageDetail(msg.id, accessToken);
          const fromHeader = getHeader(detail, 'from');
          const merchantName = fromHeader.replace(/<[^>]+>/g, '').trim() || fromHeader;
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
          // skip individual message errors silently
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
      addExpense(item.monthIndex, {
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
      });
    }
    setImported(toImport.length);
    setItems([]);
  }

  const selectedCount = items.filter((it) => it.selected && !it.alreadyImported).length;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/settings')} className="text-[#6B6B8A] hover:text-[#1E1E2E] text-sm">
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
                disabled={selectedCount === 0}
                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                ייבא נבחרים ({selectedCount})
              </button>
            </div>
          </div>

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
                        <span>{item.totalAmount != null ? `₪${item.totalAmount.toLocaleString()}` : '—'}</span>
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
                            <option key={c.id} value={c.id}>{c.nameHe}</option>
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
                          {HEBREW_MONTHS.map((m, i) => (
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
