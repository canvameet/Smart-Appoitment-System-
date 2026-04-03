import React, { useState } from 'react';

const HelpButton = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        title="Help & Shortcuts"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Doctor Dashboard Help</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="hover:bg-blue-700 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• <strong>Start Consultation:</strong> Begin timer for current patient</p>
                  <p>• <strong>Mark Complete:</strong> Finish consultation and move to next patient</p>
                  <p>• <strong>Skip:</strong> Move current patient to end of queue</p>
                  <p>• <strong>Save Notes:</strong> Store consultation notes for records</p>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Keyboard Shortcuts</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Start Consultation</span>
                    <kbd className="px-3 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono">S</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Complete Consultation</span>
                    <kbd className="px-3 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono">C</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Skip / Next Patient</span>
                    <kbd className="px-3 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono">N</kbd>
                  </div>
                </div>
              </section>

              {/* Severity Levels */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Severity Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-green-500"></span>
                    <span className="text-slate-700"><strong>1-2:</strong> Low severity (routine care)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                    <span className="text-slate-700"><strong>3:</strong> Medium severity (standard consultation)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-orange-500"></span>
                    <span className="text-slate-700"><strong>4:</strong> High severity (urgent care)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-slate-700"><strong>5:</strong> Critical (emergency)</span>
                  </div>
                </div>
              </section>

              {/* Features */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Features</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• <strong>Auto-refresh:</strong> Queue updates every 10 seconds</p>
                  <p>• <strong>AI Insights:</strong> Automated triage analysis for each patient</p>
                  <p>• <strong>Timer:</strong> Track consultation time vs predicted time</p>
                  <p>• <strong>Statistics:</strong> Real-time dashboard metrics</p>
                  <p>• <strong>Emergency Priority:</strong> Critical cases automatically prioritized</p>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">💡 Tips</h3>
                <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm text-blue-900">
                  <p>• Use keyboard shortcuts for faster workflow</p>
                  <p>• Check AI insights before starting consultation</p>
                  <p>• Monitor timer to stay on schedule</p>
                  <p>• Save notes immediately after consultation</p>
                  <p>• Emergency patients show 🚨 badge with pulse animation</p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 rounded-b-2xl text-center">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
