import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsVehicle, SavingsVehicleType } from '../../types';

const TYPE_NAMES: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'קרן השתלמות',
  pension: 'קרן פנסיה',
  kupat_gemel: 'קופת גמל',
  child_savings: 'חסכון לכל ילד',
};

const TYPE_COLORS: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: '#4A90C0',
  pension: '#5A9A42',
  kupat_gemel: '#C89E50',
  child_savings: '#C85590',
};

const TYPE_DESCRIPTIONS: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'פטורה ממס לאחר 6 שנים',
  pension: 'קצבת פרישה חודשית',
  kupat_gemel: 'חיסכון לטווח בינוני-ארוך',
  child_savings: '₪58 מהמדינה + 58 אופציונלי',
};

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

const emptyForm = (): Omit<SavingsVehicle, 'id'> => ({
  type: 'keren_hishtalmut',
  name: '',
  balance: 0,
  employeeMonthlyDeposit: 0,
  employerMonthlyDeposit: 0,
  notes: '',
  lockDate: '',
  childName: '',
});

interface VehicleFormProps { f: Omit<SavingsVehicle, 'id'>; setF: (v: Omit<SavingsVehicle, 'id'>) => void; }

function VehicleForm({ f, setF }: VehicleFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סוג</label>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as SavingsVehicleType })} className={`${INPUT_CLS} cursor-pointer`}>
          {Object.entries(TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם / מוסד</label>
        <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="למשל: הפניקס, מגדל" className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יתרה נוכחית (₪)</label>
        <input type="number" value={f.balance || ''} onChange={(e) => setF({ ...f, balance: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדת עובד/ת חודשית (₪)</label>
        <input type="number" value={f.employeeMonthlyDeposit || ''} onChange={(e) => setF({ ...f, employeeMonthlyDeposit: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדת מעסיק חודשית (₪)</label>
        <input type="number" value={f.employerMonthlyDeposit || ''} onChange={(e) => setF({ ...f, employerMonthlyDeposit: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      {f.type === 'keren_hishtalmut' && (
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תאריך פתיחה (לחישוב 6 שנים)</label>
          <input type="date" value={f.lockDate ?? ''} onChange={(e) => setF({ ...f, lockDate: e.target.value })} className={INPUT_CLS} />
        </div>
      )}
      {f.type === 'child_savings' && (
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם הילד/ה</label>
          <input type="text" value={f.childName ?? ''} onChange={(e) => setF({ ...f, childName: e.target.value })} placeholder="שם הילד/ה" className={INPUT_CLS} />
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
        <input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="אופציונלי" className={INPUT_CLS} />
      </div>
    </div>
  );
}

export default function SavingsVehiclesPage() {
  const savingsVehicles = useFinanceStore((s) => s.savingsVehicles);
  const addSavingsVehicle = useFinanceStore((s) => s.addSavingsVehicle);
  const updateSavingsVehicle = useFinanceStore((s) => s.updateSavingsVehicle);
  const deleteSavingsVehicle = useFinanceStore((s) => s.deleteSavingsVehicle);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<SavingsVehicle, 'id'>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<SavingsVehicle, 'id'>>(emptyForm());

  const totalBalance = savingsVehicles.reduce((s, v) => s + v.balance, 0);
  const totalMonthly = savingsVehicles.reduce((s, v) => s + v.employeeMonthlyDeposit + v.employerMonthlyDeposit, 0);

  const handleAdd = () => {
    if (!form.name || form.balance < 0) return;
    addSavingsVehicle(form);
    setForm(emptyForm());
    setShowAdd(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">חסכונות ופנסיה</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">קרן השתלמות, פנסיה, קופת גמל, חסכון לכל ילד</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] cursor-pointer shadow-sm">
          + הוסף
        </button>
      </div>

      {totalBalance > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-sage-dark" />
            <div className="p-4">
              <p className="text-xs text-[#9090A8] mb-1">סה&quot;כ חסכונות מוסדיים</p>
              <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-[#4A90C0]" />
            <div className="p-4">
              <p className="text-xs text-[#9090A8] mb-1">הפקדות חודשיות כוללות</p>
              <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalMonthly)}</p>
              <p className="text-xs text-[#9090A8] mt-1">עובד + מעסיק</p>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">הוסף חיסכון מוסדי</h3>
          <VehicleForm f={form} setF={setForm} />
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowAdd(false); setForm(emptyForm()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleAdd} className="bg-lavender-dark text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer">הוסף</button>
          </div>
        </div>
      )}

      {savingsVehicles.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-sm mb-2">אין חסכונות מוסדיים מוגדרים</p>
          <p className="text-xs">הוסף קרן השתלמות, פנסיה, קופת גמל וחסכון לכל ילד</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(['keren_hishtalmut', 'pension', 'kupat_gemel', 'child_savings'] as SavingsVehicleType[]).map((type) => {
            const typeVehicles = savingsVehicles.filter((v) => v.type === type);
            if (typeVehicles.length === 0) return null;
            const color = TYPE_COLORS[type];

            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {TYPE_NAMES[type]}
                  <span className="text-[10px] font-normal text-[#C89E50]">{TYPE_DESCRIPTIONS[type]}</span>
                </h3>
                <div className="space-y-2">
                  {typeVehicles.map((vehicle) => {
                    const totalDeposit = vehicle.employeeMonthlyDeposit + vehicle.employerMonthlyDeposit;
                    const isKH = vehicle.type === 'keren_hishtalmut';
                    const eligible = isKH && vehicle.lockDate ? (() => {
                      const openDate = new Date(vehicle.lockDate);
                      const eligibleDate = new Date(openDate);
                      eligibleDate.setFullYear(eligibleDate.getFullYear() + 6);
                      const now = new Date();
                      return { isEligible: now >= eligibleDate, date: eligibleDate.toLocaleDateString('he-IL') };
                    })() : null;

                    return (
                      <div key={vehicle.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-1" style={{ backgroundColor: color }} />
                        {editingId === vehicle.id ? (
                          <div className="p-4">
                            <VehicleForm f={editForm} setF={setEditForm} />
                            <div className="flex gap-2 mt-3 justify-end">
                              <button onClick={() => setEditingId(null)} className="text-sm text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                              <button onClick={() => { updateSavingsVehicle(vehicle.id, editForm); setEditingId(null); }} className="bg-sage-dark text-white px-4 py-1.5 rounded-lg text-sm cursor-pointer">שמור</button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-[#1E1E2E]">{vehicle.name || TYPE_NAMES[vehicle.type]}</h4>
                                {vehicle.childName && <p className="text-xs text-[#9090A8]">{vehicle.childName}</p>}
                                {eligible && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${eligible.isEligible ? 'bg-sage-light text-sage-dark' : 'bg-amber-50 text-amber-700'}`}>
                                    {eligible.isEligible ? '✓ פטורה ממס — ניתן למשוך' : `זכאות: ${eligible.date}`}
                                  </span>
                                )}
                                {vehicle.notes && <p className="text-xs text-[#9090A8] mt-1">{vehicle.notes}</p>}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(vehicle.balance)}</p>
                                {totalDeposit > 0 && (
                                  <p className="text-xs text-[#9090A8] mt-0.5">
                                    +{formatCurrency(vehicle.employeeMonthlyDeposit)}
                                    {vehicle.employerMonthlyDeposit > 0 && ` + ${formatCurrency(vehicle.employerMonthlyDeposit)} מעסיק`}
                                    /חודש
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                              <button onClick={() => { setEditingId(vehicle.id); setEditForm({ type: vehicle.type, name: vehicle.name, balance: vehicle.balance, employeeMonthlyDeposit: vehicle.employeeMonthlyDeposit, employerMonthlyDeposit: vehicle.employerMonthlyDeposit, notes: vehicle.notes, lockDate: vehicle.lockDate, childName: vehicle.childName }); }} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">עריכה</button>
                              <button onClick={() => { if (window.confirm('למחוק?')) deleteSavingsVehicle(vehicle.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 cursor-pointer">מחיקה</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
