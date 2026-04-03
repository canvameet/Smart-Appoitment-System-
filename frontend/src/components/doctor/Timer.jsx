import React, { useState, useEffect } from 'react';

const Timer = ({ predictedTime, isActive }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds((seconds) => seconds + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = elapsedSeconds / 60;
  const progressPercentage = predictedTime > 0 
    ? Math.min((elapsedMinutes / predictedTime) * 100, 100) 
    : 0;

  const isOvertime = elapsedMinutes > predictedTime;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        Consultation Timer
      </h3>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 mb-1">Elapsed Time</p>
          <p className={`text-3xl font-bold ${isOvertime ? 'text-red-600' : 'text-blue-600'}`}>
            {formatTime(elapsedSeconds)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-slate-500 mb-1">Predicted Time</p>
          <p className="text-3xl font-bold text-slate-700">
            {predictedTime || 0} min
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${
            isOvertime ? 'bg-red-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {isOvertime && (
        <p className="text-sm text-red-600 font-medium mt-3 text-center">
          ⚠️ Consultation exceeding predicted time
        </p>
      )}
    </div>
  );
};

export default Timer;
