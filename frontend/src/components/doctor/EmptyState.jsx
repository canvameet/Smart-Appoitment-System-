import React from 'react';

const EmptyState = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-slate-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-slate-700 mb-2">
          No Patients in Queue
        </h2>
        <p className="text-slate-500 mb-6">
          All consultations are complete. New patients will appear here automatically.
        </p>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          System Active
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
