import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-blush-dark" />
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-2">אירעה שגיאה</h2>
              <p className="text-sm text-[#6B6B8A] leading-relaxed mb-6">
                משהו השתבש. ניתן לנסות לטעון מחדש את הדף.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-lavender-dark text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
              >
                טען מחדש
              </button>
              {import.meta.env.DEV && (
                <details className="mt-4 text-left text-xs text-red-500">
                  <summary className="cursor-pointer text-right text-[#9090A8] hover:text-[#1E1E2E]">פרטי שגיאה (מצב פיתוח)</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-[10px] overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
