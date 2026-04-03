import React from 'react';

const PatientCard = ({ patient, onStart, onComplete, onSkip }) => {
  if (!patient) return null;
  
  const getSeverityColor = (severity) => {
    if (severity <= 2) return 'bg-green-100 text-green-800 border-green-200';
    if (severity === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (severity === 4) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const isEmergency = patient?.isEmergency || patient?.triage?.is_emergency || false;
  const severity = patient?.triage?.severity || 1;
  const triageReason = patient?.triage?.triage_reason || patient?.triage?.reason || '';
  const patientName = patient?.patientName || patient?.name || 'Unknown Patient';
  const patientAge = patient?.patientAge || patient?.age || 'N/A';
  const symptoms = patient?.symptoms || 'No symptoms recorded';
  const isOtherDoctorEmergency = patient?.isOtherDoctorEmergency || false;

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      {/* Header with Name and Emergency Badge */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">{patientName}</h2>
          <p className="text-lg text-slate-500">Age: {patientAge}</p>
          {patient?.date && patient?.timeSlot && (
            <p className="text-sm text-slate-400 mt-1">
              {patient.date} at {patient.timeSlot}
            </p>
          )}
        </div>
        
        {isEmergency && (
          <div className="animate-pulse">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white shadow-lg">
              🚨 EMERGENCY
            </span>
          </div>
        )}
      </div>

      {/* Other Doctor Emergency Notice */}
      {isOtherDoctorEmergency && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 font-medium">
            ⚠️ This is an emergency case assigned to another doctor. You can view it for awareness.
          </p>
        </div>
      )}

      {/* Status Badge */}
      {patient?.status && (
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
            patient.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            patient.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            patient.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            Status: {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
          </span>
        </div>
      )}

      {/* Severity Badge */}
      <div className="mb-6">
        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${getSeverityColor(severity)}`}>
          Severity: {severity}/5
        </span>
      </div>

      {/* Symptoms Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Symptoms</h3>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-slate-700 leading-relaxed">
            {symptoms}
          </p>
        </div>
      </div>

      {/* Triage Reason */}
      {triageReason && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">AI Analysis</h3>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-slate-700 text-sm leading-relaxed">
              {triageReason}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onStart}
          disabled={isOtherDoctorEmergency}
          className={`flex-1 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md ${
            isOtherDoctorEmergency 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          Start Consultation
        </button>
        <button
          onClick={onComplete}
          disabled={isOtherDoctorEmergency}
          className={`flex-1 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md ${
            isOtherDoctorEmergency
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          Mark Complete
        </button>
        <button
          onClick={onSkip}
          disabled={isOtherDoctorEmergency}
          className={`font-semibold py-4 px-6 rounded-xl transition-all duration-200 ${
            isOtherDoctorEmergency
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
