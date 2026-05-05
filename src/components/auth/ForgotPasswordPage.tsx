import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await requestPasswordReset(email);
    setLoading(false);
    if (err) {
      setError('שגיאה בשליחת המייל. אנא נסה שוב.');
    } else {
      setSent(true);
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
          <h1 className="text-2xl font-bold text-[#1E1E2E]">איפוס סיסמה</h1>
          <p className="text-sm text-[#9090A8] mt-1">נשלח לך קישור לאיפוס הסיסמה</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-lavender-dark" />

          {sent ? (
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-[#3D3D5C] font-medium">המייל נשלח בהצלחה!</p>
              <p className="text-xs text-[#9090A8]">
                בדוק את תיבת הדואר שלך וסנן ב-<span dir="ltr">{email}</span> ולחץ על הקישור לאיפוס הסיסמה.
              </p>
              <p className="text-xs text-[#9090A8]">הקישור תקף ל-24 שעות.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <p className="text-sm text-[#6B6B8A]">
                הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#C0C0D0] text-right"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lavender-dark text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#9090A8] mt-5">
          <Link to="/login" className="text-lavender-dark font-medium hover:underline">
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
