import React from 'react';

const getSeverityStyles = (level) => {
  if (level <= 2) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Low Severity' };
  if (level === 3) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Moderate Severity' };
  return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', label: 'High Severity' };
};

const TriageResult = ({ appointment }) => {
  if (!appointment || !appointment.triage) return null;

  const { triage, predicted_time, recommendation } = appointment;
  const styles = getSeverityStyles(triage.severity);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">AI Triage Results</h2>
        {triage.is_emergency && (
          <div className="flex items-center space-x-2 bg-red-600 text-white px-4 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-500/30">
            <span className="font-bold text-sm tracking-wide">🚨 EMERGENCY CASE</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Severity Level</p>
          <div className="flex items-baseline space-x-2">
            <span className={`text-4xl font-black ${styles.text}`}>{triage.severity}</span>
            <span className={`text-sm font-medium ${styles.text}`}>/ 5 ({styles.label})</span>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-blue-50 border-blue-100">
           <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Predicted Time</p>
           <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-blue-800">{predicted_time}</span>
            <span className="text-sm font-medium text-blue-800">mins</span>
          </div>
        </div>
      </div>

      {triage.keywords && triage.keywords.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Extracted Symptoms:</p>
          <div className="flex flex-wrap gap-2">
            {triage.keywords.map((kw, i) => (
               <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                 {kw}
               </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-800 font-medium"><strong>Recommendation:</strong> {recommendation}</p>
        <p className="text-sm text-gray-600 mt-2 italic">"{triage.triage_reason}"</p>
      </div>
    </div>
  );
};

export default TriageResult;
