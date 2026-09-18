import React from 'react';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    const msg = String(error?.message || error);
    if (/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module/i.test(msg)) {
      const last = Number(sessionStorage.getItem('chunk_reload_ts') || 0);
      if (Date.now() - last > 15000) {
        sessionStorage.setItem('chunk_reload_ts', String(Date.now()));
        window.location.reload();
        return;
      }
    }
    console.error('App crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" data-testid="error-boundary-screen">
          <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-lg font-bold text-slate-800 mb-2">Oups, une erreur est survenue</h1>
            <p className="text-sm text-slate-500 mb-4">La page a rencontré un problème. Rechargez ou revenez à l'accueil.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                data-testid="error-reload-btn"
              >
                Recharger la page
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                data-testid="error-home-btn"
              >
                Accueil
              </button>
            </div>
            <details className="mt-4 text-left">
              <summary className="text-xs text-slate-400 cursor-pointer">Détail technique</summary>
              <pre className="text-[10px] text-red-500 whitespace-pre-wrap mt-2">{String(this.state.error?.message || this.state.error)}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
