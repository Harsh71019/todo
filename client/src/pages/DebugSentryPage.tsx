// TEMPORARY — remove after confirming errors reach GlitchTip
import * as Sentry from '@sentry/react';

export default function DebugSentryPage() {
  const throwRenderError = () => {
    throw new Error('GlitchTip test error — render throw');
  };

  const captureManually = () => {
    Sentry.captureException(new Error('GlitchTip test error — manual capture'));
    alert('Manual error sent to GlitchTip. Check your project dashboard.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <h1 className="text-2xl font-bold">Sentry / GlitchTip Debug</h1>
      <p className="text-slate-500 text-sm">Remove this page after confirming errors appear in GlitchTip.</p>
      <button
        onClick={throwRenderError}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Throw render error (triggers ErrorBoundary)
      </button>
      <button
        onClick={captureManually}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Send manual capture
      </button>
    </div>
  );
}
