import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES, PAYMENT_METHODS } from '../../config/categories';
import CategorySelect from '../shared/CategorySelect';
import type { ExpenseEntry } from '../../types';

interface ExpenseTableProps {
  monthIndex: number;
}

const emptyForm: Omit<ExpenseEntry, 'id'> = {
  date: '',
  categoryId: '',
  subcategoryId: '',
  description: '',
  amount: 0,
  paymentMethod: 'credit',
  notes: '',
};

function getCategoryName(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.nameHe ?? categoryId;
}

function getSubcategoryName(categoryId: string, subcategoryId: string): string {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.subcategories.find((s) => s.id === subcategoryId)?.nameHe ?? subcategoryId;
}

function getPaymentMethodName(method: string): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.nameHe ?? method;
}

export default function ExpenseTable({ monthIndex }: ExpenseTableProps) {
  const monthData = useFinanceStore((s) => s.months[monthIndex]);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);
  const clearExpenses = useFinanceStore((s) => s.clearExpenses);

  const expenseEntries = monthData?.expenses ?? [];
  const totalExpenses = sumAmounts(expenseEntries);

  const [newEntry, setNewEntry] = useState<Omit<ExpenseEntry, 'id'>>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<ExpenseEntry, 'id'>>({ ...emptyForm });

  const handleAdd = () => {
    if (!newEntry.date || !newEntry.categoryId || newEntry.amount <= 0) return;
    addExpense(monthIndex, newEntry);
    setNewEntry({ ...emptyForm });
  };

  const startEdit = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setEditForm({
      date: entry.date,
      categoryId: entry.categoryId,
      subcategoryId: entry.subcategoryId,
      description: entry.description,
      amount: entry.amount,
      paymentMethod: entry.paymentMethod,
      notes: entry.notes,
    });
  };

  const saveEdit = (id: string) => {
    updateExpense(monthIndex, id, editForm);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700">הוצאות</h3>
        {expenseEntries.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(`למחוק את כל ${expenseEntries.length} ההוצאות של החודש?`)) {
                clearExpenses(monthIndex);
              }
            }}
            className="text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-3 py-1.5 rounded-lg border border-blush-dark/30 transition-colors cursor-pointer"
          >
            מחק הכל
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-lavender text-gray-700">
              <th className="px-3 py-2 text-right">תאריך</th>
              <th className="px-3 py-2 text-right">קטגוריה</th>
              <th className="px-3 py-2 text-right">תיאור</th>
              <th className="px-3 py-2 text-right">סכום</th>
              <th className="px-3 py-2 text-right">אמצעי תשלום</th>
              <th className="px-3 py-2 text-right">הערות</th>
              <th className="px-3 py-2 text-center">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {expenseEntries.map((entry, idx) => (
              <tr
                key={entry.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {editingId === entry.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, date: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <CategorySelect
                        categoryId={editForm.categoryId}
                        subcategoryId={editForm.subcategoryId}
                        onCategoryChange={(catId, subId) =>
                          setEditForm({
                            ...editForm,
                            categoryId: catId,
                            subcategoryId: subId,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            amount: Number(e.target.value),
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={editForm.paymentMethod}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            paymentMethod: e.target.value as
                              | 'credit'
                              | 'cash'
                              | 'transfer',
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.nameHe}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className="text-sage-dark hover:underline text-xs ml-2"
                      >
                        שמור
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:underline text-xs"
                      >
                        ביטול
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{entry.date}</td>
                    <td className="px-3 py-2">
                      {getCategoryName(entry.categoryId)}
                      {entry.subcategoryId && (
                        <span className="text-gray-400 text-xs mr-1">
                          / {getSubcategoryName(entry.categoryId, entry.subcategoryId)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{entry.description}</td>
                    <td className="px-3 py-2">{formatCurrency(entry.amount)}</td>
                    <td className="px-3 py-2">
                      {getPaymentMethodName(entry.paymentMethod)}
                    </td>
                    <td className="px-3 py-2">{entry.notes}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-lavender-dark hover:underline text-xs ml-2"
                      >
                        עריכה
                      </button>
                      <button
                        onClick={() => deleteExpense(monthIndex, entry.id)}
                        className="text-blush-dark hover:underline text-xs"
                      >
                        מחיקה
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add new row */}
            <tr className="bg-almond-light/30">
              <td className="px-3 py-2">
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                />
              </td>
              <td className="px-3 py-2">
                <CategorySelect
                  categoryId={newEntry.categoryId}
                  subcategoryId={newEntry.subcategoryId}
                  onCategoryChange={(catId, subId) =>
                    setNewEntry({
                      ...newEntry,
                      categoryId: catId,
                      subcategoryId: subId,
                    })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  placeholder="תיאור"
                  value={newEntry.description}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, description: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  placeholder="סכום"
                  value={newEntry.amount || ''}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      amount: Number(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                  min={0}
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={newEntry.paymentMethod}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      paymentMethod: e.target.value as
                        | 'credit'
                        | 'cash'
                        | 'transfer',
                    })
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.nameHe}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  placeholder="הערות"
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, notes: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                />
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={handleAdd}
                  className="bg-sage text-white rounded px-3 py-1 text-xs hover:bg-sage-dark transition-colors"
                >
                  הוסף
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-blush-light/40 font-semibold">
              <td className="px-3 py-2" colSpan={3}>
                סה&quot;כ הוצאות
              </td>
              <td className="px-3 py-2">{formatCurrency(totalExpenses)}</td>
              <td className="px-3 py-2" colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
