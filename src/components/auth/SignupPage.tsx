import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('נא להזין שם מלא'); return; }
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return; }
    setLoading(true);
    const err = await signUp(email, password, fullName.trim());
    setLoading(false);
    if (err) {
      if (err.includes('already registered')) setError('אימייל זה כבר רשום במערכת');
      else setError('שגיאה בהרשמה — נסה שוב');
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-sage-dark" />
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sage-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1E1E2E] mb-2">הרשמה בוצעה בהצלחה!</h2>
            <p className="text-sm text-[#6B6B8A] leading-relaxed mb-6">
              הבקשה שלך התקבלה. לאחר שהאדמין יאשר את חשבונך תוכל להיכנס למערכת.
            </p>
            <Link
              to="/login"
              className="inline-block bg-lavender-dark text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#9088B8] transition-colors"
            >
              חזרה לכניסה
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lavender text-[#5B52A0] mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E2E]">הרשמה</h1>
          <p className="text-sm text-[#9090A8] mt-1">צור חשבון חדש</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-lavender-dark" />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">שם מלא</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="למשל: ישראל ישראלי"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="לפחות 6 תווים"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="הכנס שוב את הסיסמה"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0]"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lavender-dark text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'נרשם...' : 'הרשמה'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#9090A8] mt-5">
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="text-lavender-dark font-medium hover:underline">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
