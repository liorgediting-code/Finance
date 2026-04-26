import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface SalarySlip {
  grossSalary: number;
  incomeTax: number;
  nationalInsurance: number;
  healthInsurance: number;
  pensionEmployee: number;
  pensionEmployer: number;
  kerenHishtalmutEmployee: number;
  kerenHishtalmutEmployer: number;
  travelAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  otherDeductions: number;
  name: string;
  month: string;
}

const empty = (): SalarySlip => ({
  grossSalary: 0,
  incomeTax: 0,
  nationalInsurance: 0,
  healthInsurance: 0,
  pensionEmployee: 0,
  pensionEmployer: 0,
  kerenHishtalmutEmployee: 0,
  kerenHishtalmutEmployer: 0,
  travelAllowance: 0,
  mealAllowance: 0,
  otherAllowances: 0,
  otherDeductions: 0,
  name: '',
  month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
});

export default function SalarySlipPage() {
  const [slip, setSlip] = useState<SalarySlip>(empty());
  const [savedSlips, setSavedSlips] = useState<(SalarySlip & { id: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'enter' | 'history'>('enter');

  const set = (field: keyof SalarySlip, val: number | string) => {
    setSlip((s) => ({ ...s, [field]: val }));
  };

  const totalAllowances = slip.travelAllowance + slip.mealAllowance + slip.otherAllowances;
  const totalDeductions = slip.incomeTax + slip.nationalInsurance + slip.healthInsurance + slip.pensionEmployee + slip.kerenHishtalmutEmployee + slip.otherDeductions;
  const netSalary = slip.grossSalary + totalAllowances - totalDeductions;
  const totalCost = slip.grossSalary + totalAllowances + slip.pensionEmployer + slip.kerenHishtalmutEmployer;
  const effectiveTaxRate = slip.grossSalary > 0 ? Math.round(((slip.incomeTax + slip.nationalInsurance + slip.healthInsurance) / slip.grossSalary) * 100) : 0;

  const handleSave = () => {
    if (!slip.grossSalary) return;
    setSavedSlips((prev) => [{ ...slip, id: crypto.randomUUID() }, ...prev]);
    setActiveTab('history');
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white text-left';
  const labelCls = 'text-xs font-medium text-[#6B6B8A] mb-1 block';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">ניתוח תלוש שכר</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">הזן נתוני תלוש לחישוב שכר נטו, מס אפקטיבי ועלות מעסיק</p>
      </div>

      <div className="flex gap-2 mb-5">
        {(['enter', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${activeTab === tab ? 'bg-lavender-dark text-white' : 'bg-white border border-gray-200 text-[#6B6B8A] hover:bg-gray-50'}`}
          >
            {tab === 'enter' ? 'הזנת נתונים' : `היסטוריה (${savedSlips.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'enter' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>שם העובד/ת</label>
              <input type="text" value={slip.name} onChange={(e) => set('name', e.target.value)} placeholder="שם" className={inputCls} dir="rtl" />
            </div>
            <div>
              <label className={labelCls}>חודש</label>
              <input type="month" value={slip.month} onChange={(e) => set('month', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3 pb-2 border-b border-gray-100">שכר ותוספות</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>שכר ברוטו (₪)</label>
                <input type="number" value={slip.grossSalary || ''} onChange={(e) => set('grossSalary', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>החזר נסיעות (₪)</label>
                <input type="number" value={slip.travelAllowance || ''} onChange={(e) => set('travelAllowance', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>שי ארוחות (₪)</label>
                <input type="number" value={slip.mealAllowance || ''} onChange={(e) => set('mealAllowance', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>תוספות אחרות (₪)</label>
                <input type="number" value={slip.otherAllowances || ''} onChange={(e) => set('otherAllowances', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3 pb-2 border-b border-gray-100">ניכויים — עובד</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>מס הכנסה (₪)</label>
                <input type="number" value={slip.incomeTax || ''} onChange={(e) => set('incomeTax', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>ביטוח לאומי (₪)</label>
                <input type="number" value={slip.nationalInsurance || ''} onChange={(e) => set('nationalInsurance', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>ביטוח בריאות (₪)</label>
                <input type="number" value={slip.healthInsurance || ''} onChange={(e) => set('healthInsurance', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>פנסיה עובד (₪)</label>
                <input type="number" value={slip.pensionEmployee || ''} onChange={(e) => set('pensionEmployee', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>קרן השתלמות עובד (₪)</label>
                <input type="number" value={slip.kerenHishtalmutEmployee || ''} onChange={(e) => set('kerenHishtalmutEmployee', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>ניכויים אחרים (₪)</label>
                <input type="number" value={slip.otherDeductions || ''} onChange={(e) => set('otherDeductions', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3 pb-2 border-b border-gray-100">השתתפות מעסיק</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>פנסיה מעסיק (₪)</label>
                <input type="number" value={slip.pensionEmployer || ''} onChange={(e) => set('pensionEmployer', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>קרן השתלמות מעסיק (₪)</label>
                <input type="number" value={slip.kerenHishtalmutEmployer || ''} onChange={(e) => set('kerenHishtalmutEmployer', Number(e.target.value))} className={inputCls} min={0} dir="ltr" />
              </div>
            </div>
          </div>

          {/* Summary */}
          {slip.grossSalary > 0 && (
            <div className="bg-lavender-light rounded-xl border border-lavender p-4 mb-4">
              <h3 className="text-sm font-semibold text-[#5B52A0] mb-3">סיכום</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <p className="text-xs text-[#6B6B8A]">שכר נטו לתשלום</p>
                  <p className="text-2xl font-bold text-[#5B52A0]">{formatCurrency(netSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B6B8A]">עלות מעסיק כוללת</p>
                  <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B6B8A]">שיעור מס אפקטיבי</p>
                  <p className="text-xl font-bold text-red-500">{effectiveTaxRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B6B8A]">סה"כ ניכויים</p>
                  <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(totalDeductions)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-lavender space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B8A]">ברוטו + תוספות</span>
                  <span className="font-medium">{formatCurrency(slip.grossSalary + totalAllowances)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B8A]">ניכויים</span>
                  <span className="font-medium text-red-500">-{formatCurrency(totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-lavender pt-1 mt-1">
                  <span>נטו לתשלום</span>
                  <span className="text-[#5B52A0]">{formatCurrency(netSalary)}</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={!slip.grossSalary} className="w-full bg-lavender-dark text-white rounded-xl py-3 text-sm font-semibold cursor-pointer hover:bg-[#5B52A0] disabled:opacity-50 transition-colors">
            שמור תלוש
          </button>
        </>
      )}

      {activeTab === 'history' && (
        <>
          {savedSlips.length === 0 ? (
            <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm">אין תלושים שמורים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSlips.map((s) => {
                const ta = s.travelAllowance + s.mealAllowance + s.otherAllowances;
                const td = s.incomeTax + s.nationalInsurance + s.healthInsurance + s.pensionEmployee + s.kerenHishtalmutEmployee + s.otherDeductions;
                const net = s.grossSalary + ta - td;
                const taxRate = s.grossSalary > 0 ? Math.round(((s.incomeTax + s.nationalInsurance + s.healthInsurance) / s.grossSalary) * 100) : 0;
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[#1E1E2E]">{s.name || 'ללא שם'}</p>
                        <p className="text-xs text-[#9090A8]">{s.month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#5B52A0]">{formatCurrency(net)}</p>
                        <p className="text-xs text-[#9090A8]">ברוטו {formatCurrency(s.grossSalary)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-[#6B6B8A]">
                      <span>מס אפקטיבי: <strong>{taxRate}%</strong></span>
                      <span>ניכויים: <strong>{formatCurrency(td)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
