import React from 'react';

const AIInsight = ({ patient }) => {
  const getInsightMessage = () => {
    if (!patient) return { message: 'No active patient', type: 'info' };
    
    const severity = patient.triage?.severity || 1;
    const isEmergency = patient.triage?.is_emergency;
    
    if (isEmergency) {
      return {
        message: '🚨 Critical emergency case - Immediate attention required',
        type: 'emergency'
      };
    }
    
    if (severity >= 4) {
      return {
        message: '⚠️ High priority case - Requires urgent care',
        type: 'high'
      };
    }
    
    if (severity === 3) {
      return {
        message: '📋 Moderate case - Standard consultation',
        type: 'medium'
      };
    }
    
    return {
      message: '✓ Normal case - Routine consultation',
      type: 'low'
    };
  };

  const insight = getInsightMessage();
  
  const getBackgroundColor = () => {
    switch (insight.type) {
      case 'emergency':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (insight.type) {
      case 'emergency':
        return 'text-red-800';
      case 'high':
        return 'text-orange-800';
      case 'medium':
        return 'text-yellow-800';
      case 'low':
        return 'text-green-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`rounded-2xl p-6 border ${getBackgroundColor()} transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className={`w-6 h-6 ${getTextColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
            AI Insight
          </h3>
          <p className={`font-medium ${getTextColor()}`}>
            {insight.message}
          </p>
          {patient?.triage?.confidence && (
            <p className="text-sm text-slate-600 mt-2">
              Confidence: {Math.round(patient.triage.confidence * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsight;
