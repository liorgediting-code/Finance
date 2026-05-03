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
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50" dir="rtl">
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-[#1E1E2E] mb-2">משהו השתבש</h2>
            <p className="text-sm text-[#6B6B8A] mb-6">
              אירעה שגיאה בלתי צפויה. נסה לרענן את הדף — אם הבעיה חוזרת, פנה לתמיכה.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#5B52A0] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4A4290] transition-colors cursor-pointer"
            >
              רענן דף
            </button>
            <details className="mt-6 text-right">
              <summary className="text-xs text-[#9090A8] cursor-pointer hover:text-[#4A4A60]">פרטי שגיאה טכניים</summary>
              <pre className="mt-2 text-[10px] text-left text-red-600 bg-red-50 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
