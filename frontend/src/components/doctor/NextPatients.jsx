import React from 'react';

const NextPatients = ({ patients }) => {
  const getSeverityColor = (severity) => {
    if (severity <= 2) return 'bg-green-500';
    if (severity === 3) return 'bg-yellow-500';
    if (severity === 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
          Next Patients
        </h3>
        <p className="text-slate-400 text-center py-8">No patients in queue</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        Next Patients ({patients.length})
      </h3>
      
      <div className="space-y-3">
        {patients.slice(0, 3).map((patient, index) => {
          const patientName = patient.patientName || patient.name || 'Unknown';
          const patientAge = patient.patientAge || patient.age || 'N/A';
          const predictedTime = patient.predictedTime || patient.predicted_time || 20;
          const isEmergency = patient.isEmergency || patient.triage?.is_emergency || false;
          const severity = patient.triage?.severity || 1;
          
          return (
            <div
              key={patient.id || index}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 font-semibold text-sm">#{index + 1}</span>
                    <h4 className="font-semibold text-slate-800">{patientName}</h4>
                    {isEmergency && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        🚨
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Age: {patientAge}</span>
                    <span>•</span>
                    <span>{predictedTime} min</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NextPatients;
