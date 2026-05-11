import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { HEBREW_MONTHS } from '../../config/months';
import { supabase } from '../../lib/supabase';
import {
  collectVatExpenses,
  generateCsv,
  downloadCsv,
  generatePdf,
  pdfToBase64,
  csvToBase64,
} from '../../lib/vatReport';

type PeriodType = 'monthly' | 'bimonthly';

function getMonthIndices(type: PeriodType, anchorMonth: number): number[] {
  if (type === 'monthly') return [anchorMonth];
  const start = anchorMonth % 2 === 0 ? anchorMonth : anchorMonth - 1;
  return [start, start + 1].filter((m) => m >= 0 && m <= 11);
}

export default function VatReportPage() {
  const navigate = useNavigate();
  const { months, businessMode, accountantName, accountantEmail } = useFinanceStore(
    useShallow((s) => ({
      months: s.months,
      businessMode: s.businessMode,
      accountantName: s.accountantName,
      accountantEmail: s.accountantEmail,
    }))
  );

  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [anchorMonth, setAnchorMonth] = useState(new Date().getMonth());
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
  const periodLabel = monthIndices.map((i) => HEBREW_MONTHS[i]).join('-');
  const expenses = collectVatExpenses(months, monthIndices);

  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);

  function handleDownloadCsv() {
    const csv = generateCsv(expenses, periodLabel);
    downloadCsv(csv, `vat-report-${periodLabel}.csv`);
  }

  function handleDownloadPdf() {
    const doc = generatePdf(expenses, periodLabel);
    doc.save(`vat-report-${periodLabel}.pdf`);
  }

  async function handleSendToAccountant() {
    if (!accountantEmail) return;
    setSending(true);
    setSendResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

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
        <button onClick={() => navigate('/settings')} className="text-[#6B6B8A] hover:text-[#1E1E2E] text-sm">
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
          {HEBREW_MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <span className="text-sm text-[#6B6B8A]">תקופה: {periodLabel}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'לפני מע״מ', value: totalBeforeVat },
          { label: 'מע״מ לניכוי', value: totalVat },
          { label: 'סה״כ', value: totalAmount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-[#6B6B8A] mb-1">{label}</p>
            <p className="text-lg font-bold text-[#1E1E2E]">
              ₪{value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
            </p>
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
      {sendResult === 'error' && (
        <p className="text-sm text-red-500">שגיאה בשליחה — הורד את הקובץ ושלח ידנית</p>
      )}

      {/* Table or empty state */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-[#6B6B8A] text-sm mb-3">
            לא נמצאו חשבוניות עם פרטי מע״מ לתקופה זו
          </p>
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
