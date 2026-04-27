import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';

type BankFormat = 'hapoalim' | 'hapoalim_credit' | 'leumi' | 'discount' | 'mizrahi' | 'max' | 'isracard';
type FileType = 'csv' | 'xlsx';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;           // always ILS amount stored/imported
  originalAmount?: number;  // original foreign-currency amount (display only)
  currency: string;         // 'ILS' | 'USD' | 'EUR' etc.
  type: 'expense' | 'income';
  selected: boolean;
  categoryId: string;
}

interface BankFormatConfig {
  name: string;
  dateCol: number;
  descCol: number;
  // amountCol = original-currency amount; if ilsAmountCol is also set, this is the
  // foreign amount (shown for info) and ilsAmountCol is used for the actual ILS value.
  amountCol: number;
  skipRows: number;
  positiveIsExpense: boolean;
  currencyCol?: number;
  ilsAmountCol?: number;
  // If set, skip any data row where cols[skipHeaderCol] === skipHeaderValue
  // (handles files that repeat the header row between sections)
  skipHeaderCol?: number;
  skipHeaderValue?: string;
}

const BANK_FORMATS: Record<BankFormat, BankFormatConfig> = {
  hapoalim: {
    name: 'פועלים – חשבון עו"ש',
    dateCol: 0, descCol: 1, amountCol: 3, skipRows: 1, positiveIsExpense: true,
  },
  // כרטיסי אשראי הפועלים / כאל – exported from the bank site as XLSX
  // Row structure: כרטיס | בית עסק | תאריך עסקה | סכום העסקה | מנפיק | סוג | פירוט |
  //                תאריך חיוב | סכום חיוב (ILS) | הוצג? | מטבע העסקה | שער | ...
  hapoalim_credit: {
    name: 'פועלים – כרטיסי אשראי (כאל)',
    dateCol: 2, descCol: 1, amountCol: 3, skipRows: 8,
    positiveIsExpense: true,
    currencyCol: 10, ilsAmountCol: 8,
    skipHeaderCol: 0, skipHeaderValue: 'כרטיס',
  },
  leumi: {
    name: 'בנק לאומי',
    dateCol: 0, descCol: 2, amountCol: 6, skipRows: 1, positiveIsExpense: false,
  },
  discount: {
    name: 'בנק דיסקונט',
    dateCol: 0, descCol: 1, amountCol: 2, skipRows: 2, positiveIsExpense: true,
  },
  mizrahi: {
    name: 'בנק מזרחי טפחות',
    dateCol: 0, descCol: 1, amountCol: 3, skipRows: 1, positiveIsExpense: true,
  },
  // Max: col 3 = original-currency amount, col 4 = currency, col 5 = ILS charge
  max: {
    name: 'Max (לאומי קארד)',
    dateCol: 0, descCol: 2, amountCol: 3, skipRows: 1, positiveIsExpense: true,
    currencyCol: 4, ilsAmountCol: 5,
  },
  // Isracard: col 4 = original amount, col 5 = currency, col 6 = ILS charge
  isracard: {
    name: 'ישראכארד',
    dateCol: 0, descCol: 1, amountCol: 4, skipRows: 2, positiveIsExpense: true,
    currencyCol: 5, ilsAmountCol: 6,
  },
};

// Normalise raw currency string to a short code
function normCurrency(raw: string): string {
  const s = raw.trim();
  if (!s || s === '₪' || /שח|שקל/i.test(s)) return 'ILS';
  if (/\$|דול|usd/i.test(s)) return 'USD';
  if (/€|אור|eur/i.test(s)) return 'EUR';
  if (/£|gbp/i.test(s)) return 'GBP';
  return s.toUpperCase().slice(0, 3);
}

// Scan a header row to auto-detect currency / ILS-charge columns (fallback)
function detectExtraColumns(header: (string | number)[]): { currencyCol?: number; ilsAmountCol?: number } {
  let currencyCol: number | undefined;
  let ilsAmountCol: number | undefined;
  header.forEach((cell, i) => {
    const v = String(cell ?? '').trim();
    if (/מטבע|currency/i.test(v) && currencyCol === undefined) currencyCol = i;
    if (/חיוב|לחיוב|בשקל|ils/i.test(v) && ilsAmountCol === undefined) ilsAmountCol = i;
  });
  return { currencyCol, ilsAmountCol };
}

// Guess format from file content (first ~15 rows)
function autoDetectFormat(matrix: (string | number)[][]): BankFormat | null {
  const flat = matrix.slice(0, 15).map((r) => r.map((c) => String(c ?? '').trim()).join('|'));
  const joined = flat.join('\n');
  // Hapoalim credit card export contains "כרטיסי אשראי" header and "מטבע העסקה" column
  if (/כרטיסי אשראי/i.test(joined) || /מטבע העסקה/i.test(joined)) return 'hapoalim_credit';
  return null;
}

function classifyType(amount: number, cfg: BankFormatConfig): 'expense' | 'income' {
  return cfg.positiveIsExpense
    ? (amount > 0 ? 'expense' : 'income')
    : (amount < 0 ? 'expense' : 'income');
}

function parseRows(matrix: (string | number)[][], format: BankFormat): ParsedRow[] {
  const cfg = BANK_FORMATS[format];

  // Use config cols; try to auto-detect from the last header row as fallback
  const headerRow = matrix[Math.max(0, cfg.skipRows - 1)] ?? [];
  const detected  = detectExtraColumns(headerRow);
  const currencyCol  = cfg.currencyCol  ?? detected.currencyCol;
  const ilsAmountCol = cfg.ilsAmountCol ?? detected.ilsAmountCol;

  const rows: ParsedRow[] = [];

  for (let i = cfg.skipRows; i < matrix.length; i++) {
    const cols = matrix[i];
    if (!cols || cols.length < 3) continue;

    // Skip repeated header rows (e.g. Hapoalim credit card sections)
    if (cfg.skipHeaderCol !== undefined &&
        String(cols[cfg.skipHeaderCol] ?? '').trim() === cfg.skipHeaderValue) continue;

    const dateStr = String(cols[cfg.dateCol]  ?? '').trim();
    const desc    = String(cols[cfg.descCol]  ?? '').trim();

    // Original-column amount (may be in foreign currency)
    const rawOrig = String(cols[cfg.amountCol] ?? '').trim().replace(/[,\s₪]/g, '');
    const origAmt = parseFloat(rawOrig);

    if (!dateStr || !desc || isNaN(origAmt) || origAmt === 0) continue;

    // Detect currency
    const currency = currencyCol !== undefined
      ? normCurrency(String(cols[currencyCol] ?? ''))
      : 'ILS';

    // Resolve ILS amount: prefer the ilsAmountCol if available and non-zero
    let ilsAmt = origAmt;
    if (ilsAmountCol !== undefined) {
      const rawIls = String(cols[ilsAmountCol] ?? '').trim().replace(/[,\s₪]/g, '');
      const parsed = parseFloat(rawIls);
      if (!isNaN(parsed) && parsed !== 0) ilsAmt = parsed;
    }

    rows.push({
      date:           dateStr,
      description:    desc,
      amount:         Math.abs(ilsAmt),
      originalAmount: currency !== 'ILS' ? Math.abs(origAmt) : undefined,
      currency,
      type:           classifyType(ilsAmt, cfg),
      selected:       true,
      categoryId:     'other',
    });
  }

  return rows;
}

function parseCSV(text: string, format: BankFormat): ParsedRow[] {
  const lines  = text.split('\n').filter((l) => l.trim());
  const matrix = lines.map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
  return parseRows(matrix, format);
}

function parseXLSX(buffer: ArrayBuffer, format: BankFormat): { rows: ParsedRow[]; detected: BankFormat | null } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const matrix   = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });
  const detected = autoDetectFormat(matrix);
  return { rows: parseRows(matrix, detected ?? format), detected };
}

const CURRENCY_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' };
function currSymbol(c: string) { return CURRENCY_SYMBOL[c] ?? c; }

export default function CSVImporterPage() {
  const addExpense    = useFinanceStore((s) => s.addExpense);
  const addIncome     = useFinanceStore((s) => s.addIncome);
  const familyMembers = useFinanceStore((s) => s.familyMembers);

  const csvRef  = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  const [format, setFormat]                     = useState<BankFormat>('hapoalim');
  const [rows,   setRows]                       = useState<ParsedRow[]>([]);
  const [imported, setImported]                 = useState(false);
  const [targetMonthIndex, setTargetMonthIndex] = useState(new Date().getMonth());
  const [fileName, setFileName]                 = useState('');
  const [activeFileType, setActiveFileType]     = useState<FileType>('csv');
  const [autoDetected, setAutoDetected]         = useState<BankFormat | null>(null);

  const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  const resetState = () => {
    setRows([]); setImported(false); setFileName(''); setAutoDetected(null);
    if (csvRef.current)  csvRef.current.value  = '';
    if (xlsxRef.current) xlsxRef.current.value = '';
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name); setActiveFileType('csv');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRows(parseCSV(ev.target?.result as string, format));
      setImported(false);
    };
    reader.readAsText(file, 'windows-1255');
  };

  const handleXLSXFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name); setActiveFileType('xlsx');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, detected } = parseXLSX(ev.target?.result as ArrayBuffer, format);
      if (detected) { setFormat(detected); setAutoDetected(detected); }
      setRows(parsed);
      setImported(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleRow   = (idx: number) => setRows((p) => p.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  const toggleType  = (idx: number) => setRows((p) => p.map((r, i) => i === idx ? { ...r, type: r.type === 'expense' ? 'income' : 'expense' } : r));
  const setCategory = (idx: number, cat: string) => setRows((p) => p.map((r, i) => i === idx ? { ...r, categoryId: cat } : r));

  const handleImport = () => {
    const selected      = rows.filter((r) => r.selected);
    const defaultMember = familyMembers[0]?.id ?? '';
    for (const row of selected) {
      const note = row.currency !== 'ILS'
        ? `יובא מ-${BANK_FORMATS[format].name} | ${currSymbol(row.currency)}${row.originalAmount?.toLocaleString()}`
        : `יובא מ-${BANK_FORMATS[format].name}`;
      if (row.type === 'expense') {
        addExpense(targetMonthIndex, {
          description: row.description, amount: row.amount,
          categoryId: row.categoryId,  subcategoryId: '',
          date: row.date, isRecurring: false, isPending: false,
          paymentMethod: 'credit', notes: note,
        });
      } else {
        addIncome(targetMonthIndex, {
          source: row.description, amount: row.amount,
          date: row.date, memberId: defaultMember,
          isRecurring: false, notes: note,
        });
      }
    }
    setImported(true); resetState();
  };

  const selectedRows     = rows.filter((r) => r.selected);
  const selectedExpenses = selectedRows.filter((r) => r.type === 'expense');
  const selectedIncomes  = selectedRows.filter((r) => r.type === 'income');
  const selectedTotal    = selectedExpenses.reduce((s, r) => s + r.amount, 0);
  const foreignCount     = rows.filter((r) => r.currency !== 'ILS').length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">ייבוא עסקאות מהבנק</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">ייבא עסקאות מקובץ CSV או Excel של הבנק או חברת האשראי</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">בנק / חברת אשראי</label>
            <select value={format} onChange={(e) => { setFormat(e.target.value as BankFormat); resetState(); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white cursor-pointer">
              {Object.entries(BANK_FORMATS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ייבא לחודש</label>
            <select value={targetMonthIndex} onChange={(e) => setTargetMonthIndex(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white cursor-pointer">
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1.5 block">📄 קובץ CSV</label>
            <input ref={csvRef} type="file" accept=".csv,.txt" onChange={handleCSVFile}
              className="text-sm text-[#6B6B8A] w-full cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-lavender-light file:text-[#5B52A0] file:text-xs file:font-medium file:cursor-pointer" />
          </div>
          <div className="border border-dashed border-emerald-200 rounded-lg p-3 bg-emerald-50">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1.5 block">📊 קובץ Excel (.xlsx)</label>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" onChange={handleXLSXFile}
              className="text-sm text-[#6B6B8A] w-full cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-700 file:text-xs file:font-medium file:cursor-pointer" />
          </div>
        </div>

        {autoDetected && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            ✓ זוהה אוטומטית: <strong>{BANK_FORMATS[autoDetected].name}</strong>
          </div>
        )}

        {fileName && rows.length === 0 && !autoDetected && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3">
            לא נמצאו שורות תקינות ב-"{fileName}". ודא שבחרת את הפורמט הנכון.
          </p>
        )}
      </div>

      {imported && (
        <div className="bg-sage-light border border-sage rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="text-sm font-semibold text-sage-dark">הייבוא הושלם בהצלחה</p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          {foreignCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-3 text-xs text-blue-700">
              <strong>{foreignCount} עסקאות במטבע זר</strong> — הסכום המוצג הוא הסכום שחויב בשקלים.
              הסכום המקורי מוצג מתחת לכל שורה.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#6B6B8A]">{rows.length} שורות זוהו</span>
                <span className="text-xs text-red-500">• {selectedExpenses.length} הוצאות</span>
                <span className="text-xs text-sage-dark">• {selectedIncomes.length} הכנסות</span>
                {foreignCount > 0 && <span className="text-xs text-blue-600">• {foreignCount} במטבע זר</span>}
                <span className="text-xs text-[#9090A8]">({activeFileType === 'xlsx' ? 'Excel' : 'CSV'})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRows((p) => p.map((r) => ({ ...r, selected: true })))}
                  className="text-xs text-[#5B52A0] cursor-pointer hover:underline">בחר הכל</button>
                <button onClick={() => setRows((p) => p.map((r) => ({ ...r, selected: false })))}
                  className="text-xs text-[#9090A8] cursor-pointer hover:underline">נקה</button>
              </div>
            </div>
            <p className="px-4 py-2 text-[10px] text-[#9090A8] bg-amber-50 border-b border-amber-100">
              לחץ על <strong>הוצאה / הכנסה</strong> כדי להחליף סוג עסקה
            </p>

            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {rows.map((row, idx) => (
                <div key={idx} className={`px-4 py-3 flex items-center gap-3 ${!row.selected ? 'opacity-40' : ''}`}>
                  <input type="checkbox" checked={row.selected} onChange={() => toggleRow(idx)}
                    className="accent-lavender-dark flex-shrink-0 cursor-pointer" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#9090A8]">{row.date}</span>
                      <span className="text-sm font-medium text-[#1E1E2E] truncate">{row.description}</span>
                    </div>
                    {row.currency !== 'ILS' && row.originalAmount !== undefined && (
                      <span className="text-[10px] text-blue-500 block mt-0.5">
                        {currSymbol(row.currency)}{row.originalAmount.toLocaleString()} {row.currency} → חויב {formatCurrency(row.amount)}
                      </span>
                    )}
                  </div>

                  {row.type === 'expense' && (
                    <select value={row.categoryId} onChange={(e) => setCategory(idx, e.target.value)}
                      className="border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white cursor-pointer max-w-[110px]">
                      {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.nameHe}</option>)}
                    </select>
                  )}

                  <button onClick={() => toggleType(idx)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer flex-shrink-0 transition-colors ${
                      row.type === 'expense'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}>
                    {row.type === 'expense' ? 'הוצאה' : 'הכנסה'}
                  </button>

                  <div className="text-left flex-shrink-0">
                    <span className={`text-sm font-semibold block ${row.type === 'expense' ? 'text-red-500' : 'text-sage-dark'}`}>
                      {row.type === 'expense' ? '-' : '+'}{formatCurrency(row.amount)}
                    </span>
                    {row.currency !== 'ILS' && (
                      <span className="text-[10px] text-blue-500 block text-center">{row.currency}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-lavender-light rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-[#5B52A0]">
                {selectedExpenses.length > 0 && `הוצאות: ${formatCurrency(selectedTotal)}`}
                {selectedExpenses.length > 0 && selectedIncomes.length > 0 && ' • '}
                {selectedIncomes.length > 0 && `${selectedIncomes.length} הכנסות`}
              </p>
              <p className="text-xs text-[#9090A8]">{selectedRows.length} פעולות ל{MONTH_NAMES[targetMonthIndex]}</p>
            </div>
            <button onClick={handleImport} disabled={selectedRows.length === 0}
              className="bg-lavender-dark text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#5B52A0] disabled:opacity-50 transition-colors">
              ייבא {selectedRows.length} פעולות
            </button>
          </div>
        </>
      )}

      {rows.length === 0 && !imported && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-[#9090A8]">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium mb-1">בחר קובץ CSV או Excel לייבוא</p>
          <p className="text-xs">הורד את הקובץ מאתר הבנק או האפליקציה שלך</p>
          <div className="mt-4 text-right text-xs bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="font-semibold text-[#6B6B8A] mb-2">איך מורידים קובץ:</p>
            <p>• <strong>פועלים – עו"ש:</strong> תנועות בחשבון → ייצוא</p>
            <p>• <strong>פועלים – כרטיסי אשראי:</strong> כרטיסי אשראי → פירוט עסקאות → הורדה לאקסל</p>
            <p>• <strong>לאומי:</strong> שירותי אינטרנט → תנועות בחשבון → ייצוא</p>
            <p>• <strong>Max:</strong> פירוט עסקאות → הורדה כ-CSV או Excel</p>
          </div>
        </div>
      )}
    </div>
  );
}
