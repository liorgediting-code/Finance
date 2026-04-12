import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

function Spinner() {
  return (
    <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-lavender border-t-lavender-dark rounded-full animate-spin" />
    </div>
  );
}

function PendingScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-honey" />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-honey/20 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-honey-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#1E1E2E] mb-2">ממתין לאישור</h2>
          <p className="text-sm text-[#6B6B8A] leading-relaxed mb-1">
            החשבון שלך ({user?.email}) נמצא בבדיקה.
          </p>
          <p className="text-sm text-[#6B6B8A] leading-relaxed mb-6">
            לאחר שהאדמין יאשר את חשבונך תוכל להיכנס למערכת.
          </p>
          <button
            onClick={signOut}
            className="text-sm text-[#9090A8] hover:text-[#1E1E2E] hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            התנתקות
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return <Spinner />;
  if (!user) return null;
  if (!profile?.is_approved) return <PendingScreen />;

  return <>{children}</>;
}
