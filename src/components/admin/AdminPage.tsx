import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase, type Profile } from '../../lib/supabase';

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type Tab = 'pending' | 'all' | 'create';

export default function AdminPage() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Create form
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'user' | 'admin'>('user');
  const [createApproved, setCreateApproved] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Change password inline state: userId → new password input value
  const [changePwdUserId, setChangePwdUserId] = useState<string | null>(null);
  const [changePwdValue, setChangePwdValue] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdMsg, setChangePwdMsg] = useState<{ userId: string; type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') navigate('/', { replace: true });
  }, [profile, navigate]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/list-users', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      setUsers((json.users as Profile[]) ?? []);
    } catch {
      setUsers([]);
    }
    setLoadingUsers(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const setApproved = async (userId: string, approved: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/admin/update-user', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId, updates: { is_approved: approved } }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_approved: approved } : u));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: createEmail, password: createPassword, role: createRole, is_approved: createApproved }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'שגיאה לא ידועה');
      setCreateMsg({ type: 'ok', text: `חשבון נוצר בהצלחה עבור ${createEmail}` });
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('user');
      setCreateApproved(true);
      loadUsers();
    } catch (err: unknown) {
      setCreateMsg({ type: 'err', text: err instanceof Error ? err.message : 'שגיאה' });
    }
    setCreateLoading(false);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`האם למחוק את המשתמש ${email}? פעולה זו בלתי הפיכה.`)) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error ?? 'שגיאה במחיקת משתמש'); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const openChangePwd = (userId: string) => {
    setChangePwdUserId(userId);
    setChangePwdValue('');
    setChangePwdMsg(null);
  };

  const submitChangePwd = async (userId: string) => {
    if (changePwdValue.length < 6) {
      setChangePwdMsg({ userId, type: 'err', text: 'סיסמה חייבת להכיל לפחות 6 תווים' });
      return;
    }
    setChangePwdLoading(true);
    setChangePwdMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/change-password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId, password: changePwdValue }),
    });
    const json = await res.json();
    if (!res.ok) {
      setChangePwdMsg({ userId, type: 'err', text: json.error ?? 'שגיאה' });
    } else {
      setChangePwdMsg({ userId, type: 'ok', text: 'סיסמה עודכנה בהצלחה' });
      setChangePwdUserId(null);
      setChangePwdValue('');
    }
    setChangePwdLoading(false);
  };

  const pending = users.filter((u) => !u.is_approved);
  const displayed = tab === 'pending' ? pending : users;

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

  if (profile?.role !== 'admin') return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">פאנל ניהול</h1>
          <p className="text-sm text-[#9090A8] mt-0.5">ניהול משתמשים וגישה</p>
        </div>
        <span className="bg-lavender text-lavender-dark text-xs font-semibold px-3 py-1 rounded-full">Admin</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {([['pending', `ממתינים לאישור (${pending.length})`], ['all', 'כל המשתמשים'], ['create', 'צור חשבון']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${tab === t ? 'bg-white text-[#1E1E2E] shadow-sm' : 'text-[#9090A8] hover:text-[#4A4A60]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Users list */}
      {tab !== 'create' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-lavender-dark" />
          {loadingUsers ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-4 border-lavender border-t-lavender-dark rounded-full animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center text-[#9090A8] py-14 text-sm">
              {tab === 'pending' ? 'אין משתמשים ממתינים לאישור' : 'אין משתמשים במערכת'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-lavender-light text-[#4A4A60] text-xs font-semibold">
                  <th className="px-5 py-3 text-right">אימייל</th>
                  <th className="px-5 py-3 text-right">תפקיד</th>
                  <th className="px-5 py-3 text-right">נרשם</th>
                  <th className="px-5 py-3 text-right">סטטוס</th>
                  <th className="px-5 py-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-5 py-3 font-medium text-[#1E1E2E]" dir="ltr">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-lavender text-lavender-dark' : 'bg-gray-100 text-[#6B6B8A]'}`}>
                        {u.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#9090A8] text-xs">{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_approved ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {u.is_approved ? 'מאושר' : 'ממתין'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {!u.is_approved ? (
                            <button
                              onClick={() => setApproved(u.id, true)}
                              className="flex items-center gap-1 text-xs text-white bg-sage-dark hover:bg-[#8AAA7A] px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium"
                            >
                              <CheckIcon /> אשר
                            </button>
                          ) : (
                            <button
                              onClick={() => setApproved(u.id, false)}
                              className="flex items-center gap-1 text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              <XIcon /> בטל אישור
                            </button>
                          )}
                          <button
                            onClick={() => changePwdUserId === u.id ? setChangePwdUserId(null) : openChangePwd(u.id)}
                            className="flex items-center gap-1 text-xs text-[#6B6B8A] hover:text-lavender-dark hover:bg-lavender px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            🔑 סיסמה
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              <XIcon /> מחק
                            </button>
                          )}
                        </div>
                        {changePwdUserId === u.id && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="password"
                              value={changePwdValue}
                              onChange={(e) => setChangePwdValue(e.target.value)}
                              placeholder="סיסמה חדשה"
                              className="border border-gray-200 rounded-md px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-lavender-dark"
                              dir="ltr"
                              onKeyDown={(e) => e.key === 'Enter' && submitChangePwd(u.id)}
                            />
                            <button
                              onClick={() => submitChangePwd(u.id)}
                              disabled={changePwdLoading}
                              className="text-xs text-white bg-lavender-dark hover:bg-[#9088B8] px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {changePwdLoading ? '...' : 'שמור'}
                            </button>
                          </div>
                        )}
                        {changePwdMsg?.userId === u.id && (
                          <span className={`text-xs ${changePwdMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                            {changePwdMsg.text}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create account form */}
      {tab === 'create' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-sage-dark" />
          <form onSubmit={handleCreate} className="p-6 space-y-4 max-w-md">
            <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">צור חשבון חדש</h2>

            {createMsg && (
              <div className={`text-sm rounded-lg px-3 py-2 ${createMsg.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {createMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">אימייל</label>
              <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required className={inputCls} dir="ltr" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">סיסמה</label>
              <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={6} className={inputCls} dir="ltr" placeholder="לפחות 6 תווים" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">תפקיד</label>
              <select value={createRole} onChange={(e) => setCreateRole(e.target.value as 'user' | 'admin')} className={`${inputCls} cursor-pointer`}>
                <option value="user">משתמש רגיל</option>
                <option value="admin">מנהל (Admin)</option>
              </select>
            </div>

            {/* Approved toggle */}
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setCreateApproved((v) => !v)}>
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${createApproved ? 'bg-sage-dark' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${createApproved ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-[#4A4A60]">חשבון מאושר מיד (ללא צורך בתשלום)</span>
            </label>

            <button
              type="submit"
              disabled={createLoading}
              className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
            >
              <PlusIcon />
              {createLoading ? 'יוצר...' : 'צור חשבון'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
