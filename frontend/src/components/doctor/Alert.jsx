import React, { useEffect } from 'react';

const Alert = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getAlertStyles = () => {
    switch (type) {
      case 'emergency':
        return 'bg-red-500 text-white border-red-600';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'error':
        return '❌';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${getAlertStyles()} rounded-xl shadow-lg border p-4 flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in`}>
      <span className="text-xl flex-shrink-0">{getIcon()}</span>
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Alert;
