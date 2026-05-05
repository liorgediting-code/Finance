import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives from the reset email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if there's already an active recovery session (page reload case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    setError('');
    const err = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError('שגיאה בעדכון הסיסמה. הקישור אולי פג תוקף — בקש קישור חדש.');
    } else {
      setDone(true);
      setTimeout(() => navigate('/'), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lavender text-[#5B52A0] mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E2E]">הגדרת סיסמה חדשה</h1>
          <p className="text-sm text-[#9090A8] mt-1">הזן סיסמה חדשה לחשבונך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-lavender-dark" />

          {done ? (
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-[#3D3D5C] font-medium">הסיסמה עודכנה בהצלחה!</p>
              <p className="text-xs text-[#9090A8]">מועבר לדף הבית...</p>
            </div>
          ) : !ready ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#9090A8]">טוען...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">סיסמה חדשה</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="לפחות 6 תווים"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">אימות סיסמה</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="הזן שוב את הסיסמה"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lavender-dark text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'מעדכן...' : 'עדכן סיסמה'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
