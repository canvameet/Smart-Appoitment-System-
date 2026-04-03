import React from 'react';

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-slate-700 mb-2">
          Loading Dashboard
        </h2>
        <p className="text-slate-500">
          Fetching patient queue...
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
