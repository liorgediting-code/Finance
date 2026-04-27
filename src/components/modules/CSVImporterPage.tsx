import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';

type BankFormat = 'hapoalim' | 'leumi' | 'discount' | 'mizrahi' | 'max' | 'isracard';
type FileType = 'csv' | 'xlsx';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  selected: boolean;
  categoryId: string;
}

const BANK_FORMATS: Record<BankFormat, { name: string; dateCol: number; descCol: number; amountCol: number; skipRows: number; creditCol?: number }> = {
  hapoalim: { name: 'בנק הפועלים', dateCol: 0, descCol: 1, amountCol: 3, skipRows: 1 },
  leumi: { name: 'בנק לאומי', dateCol: 0, descCol: 2, amountCol: 6, skipRows: 1 },
  discount: { name: 'בנק דיסקונט', dateCol: 0, descCol: 1, amountCol: 2, skipRows: 2 },
  mizrahi: { name: 'בנק מזרחי טפחות', dateCol: 0, descCol: 1, amountCol: 3, skipRows: 1 },
  max: { name: 'Max (לאומי קארד)', dateCol: 0, descCol: 2, amountCol: 5, skipRows: 1 },
  isracard: { name: 'ישראכארד', dateCol: 0, descCol: 1, amountCol: 4, skipRows: 2 },
};

function parseRows(matrix: string[][], format: BankFormat): ParsedRow[] {
  const cfg = BANK_FORMATS[format];
  const rows: ParsedRow[] = [];

  for (let i = cfg.skipRows; i < matrix.length; i++) {
    const cols = matrix[i];
    if (!cols || cols.length < 3) continue;

    const dateStr = cols[cfg.dateCol]?.trim();
    const desc = cols[cfg.descCol]?.trim();
    const amountStr = (cols[cfg.amountCol] ?? '').toString().trim().replace(/[,\s₪]/g, '');
    const amount = parseFloat(amountStr);

    if (!dateStr || !desc || isNaN(amount) || amount === 0) continue;

    const isExpense = amount < 0 || format === 'max' || format === 'isracard';
    rows.push({
      date: dateStr,
      description: desc,
      amount: Math.abs(amount),
      type: isExpense ? 'expense' : 'income',
      selected: true,
      categoryId: 'other',
    });
  }

  return rows;
}

function parseCSV(text: string, format: BankFormat): ParsedRow[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const matrix = lines.map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
  return parseRows(matrix, format);
}

function parseXLSX(buffer: ArrayBuffer, format: BankFormat): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
  return parseRows(matrix, format);
}

export default function CSVImporterPage() {
  const addExpense = useFinanceStore((s) => s.addExpense);

  const csvRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<BankFormat>('hapoalim');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [imported, setImported] = useState(false);
  const [targetMonthIndex, setTargetMonthIndex] = useState(new Date().getMonth());
  const [fileName, setFileName] = useState('');
  const [activeFileType, setActiveFileType] = useState<FileType>('csv');

  const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  const resetState = () => {
    setRows([]);
    setImported(false);
    setFileName('');
    if (csvRef.current) csvRef.current.value = '';
    if (xlsxRef.current) xlsxRef.current.value = '';
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setActiveFileType('csv');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text, format));
      setImported(false);
    };
    reader.readAsText(file, 'windows-1255');
  };

  const handleXLSXFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setActiveFileType('xlsx');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      setRows(parseXLSX(buffer, format));
      setImported(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleRow = (idx: number) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const setCategory = (idx: number, categoryId: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, categoryId } : r));
  };

  const handleImport = () => {
    const selected = rows.filter((r) => r.selected && r.type === 'expense');
    for (const row of selected) {
      addExpense(targetMonthIndex, {
        description: row.description,
        amount: row.amount,
        categoryId: row.categoryId,
        subcategoryId: '',
        date: row.date,
        isRecurring: false,
        isPending: false,
        paymentMethod: 'credit',
        notes: `יובא מ-${BANK_FORMATS[format].name}`,
      });
    }
    setImported(true);
    resetState();
  };

  const selectedCount = rows.filter((r) => r.selected).length;
  const selectedTotal = rows.filter((r) => r.selected && r.type === 'expense').reduce((s, r) => s + r.amount, 0);

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
            <select
              value={format}
              onChange={(e) => { setFormat(e.target.value as BankFormat); resetState(); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white cursor-pointer"
            >
              {Object.entries(BANK_FORMATS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ייבא לחודש</label>
            <select
              value={targetMonthIndex}
              onChange={(e) => setTargetMonthIndex(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white cursor-pointer"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File upload — two options side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1.5 block">📄 קובץ CSV</label>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVFile}
              className="text-sm text-[#6B6B8A] w-full cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-lavender-light file:text-[#5B52A0] file:text-xs file:font-medium file:cursor-pointer"
            />
          </div>
          <div className="border border-dashed border-emerald-200 rounded-lg p-3 bg-emerald-50">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1.5 block">📊 קובץ Excel (.xlsx)</label>
            <input
              ref={xlsxRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleXLSXFile}
              className="text-sm text-[#6B6B8A] w-full cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-700 file:text-xs file:font-medium file:cursor-pointer"
            />
          </div>
        </div>

        {fileName && rows.length === 0 && (
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#6B6B8A]">{rows.length} שורות זוהו</span>
                <span className="text-xs text-[#9090A8] mr-2">• {selectedCount} נבחרו</span>
                <span className="text-xs text-[#9090A8]">• {activeFileType === 'xlsx' ? '📊 Excel' : '📄 CSV'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: true })))} className="text-xs text-[#5B52A0] cursor-pointer hover:underline">בחר הכל</button>
                <button onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: false })))} className="text-xs text-[#9090A8] cursor-pointer hover:underline">נקה</button>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {rows.map((row, idx) => (
                <div key={idx} className={`px-4 py-3 flex items-center gap-3 ${!row.selected ? 'opacity-40' : ''}`}>
                  <input type="checkbox" checked={row.selected} onChange={() => toggleRow(idx)} className="accent-lavender-dark flex-shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#9090A8]">{row.date}</span>
                      <span className="text-sm font-medium text-[#1E1E2E] truncate">{row.description}</span>
                    </div>
                  </div>
                  <select
                    value={row.categoryId}
                    onChange={(e) => setCategory(idx, e.target.value)}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white cursor-pointer max-w-[120px]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nameHe}</option>
                    ))}
                  </select>
                  <span className={`text-sm font-semibold flex-shrink-0 ${row.type === 'expense' ? 'text-red-500' : 'text-sage-dark'}`}>
                    {row.type === 'expense' ? '-' : '+'}{formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-lavender-light rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-[#5B52A0]">סה"כ לייבוא: {formatCurrency(selectedTotal)}</p>
              <p className="text-xs text-[#9090A8]">{selectedCount} פעולות ל{MONTH_NAMES[targetMonthIndex]}</p>
            </div>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="bg-lavender-dark text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#5B52A0] disabled:opacity-50 transition-colors"
            >
              ייבא {selectedCount} פעולות
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
            <p>• <strong>פועלים:</strong> כרטיסי אשראי → פירוט חיובים → הורדה לאקסל (CSV או XLSX)</p>
            <p>• <strong>לאומי:</strong> שירותי אינטרנט → תנועות בחשבון → ייצוא</p>
            <p>• <strong>Max:</strong> פירוט עסקאות → הורדה כ-CSV או Excel</p>
          </div>
        </div>
      )}
    </div>
  );
}
