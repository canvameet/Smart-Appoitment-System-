import React, { useEffect } from 'react';

const KeyboardShortcuts = ({ onStart, onComplete, onSkip, isConsulting }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          if (!isConsulting) {
            onStart();
          }
          break;
        case 'c':
          if (isConsulting) {
            onComplete();
          }
          break;
        case 'n':
          onSkip();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onStart, onComplete, onSkip, isConsulting]);

  return (
    <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
        Keyboard Shortcuts
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Start Consultation</span>
          <kbd className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">
            S
          </kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Complete</span>
          <kbd className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">
            C
          </kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Skip / Next</span>
          <kbd className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">
            N
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
