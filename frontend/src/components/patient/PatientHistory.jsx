import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PatientHistory = ({ patientId, patientName }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('completed');

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/history/patient/${patientId}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        toast.error('Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/history/appointment/${appointmentId}/report`);
      const data = await response.json();

      if (data.success) {
        setSelectedReport(data);
      } else {
        toast.error('No report available for this appointment');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const AppointmentCard = ({ appointment }) => {
    // Generate styles based on status
    const statusStyles = {
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200/50', icon: 'text-green-500', glow: 'group-hover:shadow-green-500/20' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/50', icon: 'text-red-500', glow: 'group-hover:shadow-red-500/20' },
      upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/50', icon: 'text-blue-500', glow: 'group-hover:shadow-blue-500/20' }
    };
    
    const s = statusStyles[appointment.status] || statusStyles.upcoming;

    return (
      <div className={`group relative bg-white rounded-[2rem] p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${s.glow} border border-gray-100 overflow-hidden`}>
        {/* Decorative corner blur */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-60 ${s.bg}`}></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} bg-opacity-60 border ${s.border} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
              <svg className={`w-7 h-7 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{appointment.doctorName || 'Doctor'}</h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">{formatDate(appointment.date)}</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider border ${s.bg} ${s.text} ${s.border} shadow-sm`}>
            {appointment.status?.toUpperCase()}
          </div>
        </div>

        <div className="space-y-3 mb-8 relative z-10">
          <div className="flex items-center gap-3 text-sm p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 transition-colors group-hover:bg-white group-hover:border-gray-200 shadow-sm">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-600">Time Segment: <span className="text-gray-900 ml-1">{appointment.timeSlot || 'N/A'}</span></span>
          </div>
          
          {appointment.symptoms && (
            <div className="flex items-start gap-3 text-sm p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 transition-colors group-hover:bg-white group-hover:border-gray-200 shadow-sm">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mt-0.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-600 pt-1 leading-relaxed">Symptoms: <span className="text-gray-900 ml-1">{appointment.symptoms}</span></span>
            </div>
          )}

          {appointment.isEmergency && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-bold animate-pulse shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              EMERGENCY PRIORITY
            </div>
          )}
        </div>

        {appointment.reportData ? (
          <button
            onClick={() => viewReport(appointment.id)}
            className="group/btn w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
            <svg className="w-5 h-5 relative z-10 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="relative z-10 tracking-wide">Access Medical Report</span>
          </button>
        ) : appointment.status === 'completed' ? (
          <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Report not generated yet
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-dashed rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent border-solid rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 border border-gray-100">
           <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <p className="text-xl font-bold text-gray-500">No medical history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn flex-1">
      {/* Header - Premium Glass Archive Banner */}
      <div className="relative rounded-[2rem] overflow-hidden bg-blue-600 shadow-2xl shadow-blue-600/20 p-8 sm:p-12 mb-4 group cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-blue-600/50 to-indigo-900/80 mix-blend-multiply transition-opacity duration-1000 group-hover:opacity-80"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-300/20 rounded-full blur-[80px] pointer-events-none transform group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] shadow-inner border border-white/20 transform group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-cyan-400/30 text-white">
            <svg className="w-10 h-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 drop-shadow-sm">Medical Archive</h2>
            <p className="text-blue-100 mt-2 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">Comprehensive insights into your healthcare journey, diagnostic reports, and past appointments.</p>
          </div>
        </div>
      </div>

      {/* Statistics - Floating Glass Neo-Brutal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completed */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 group hover:-translate-y-2 transition-transform duration-300 cursor-default">
           <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
           <div className="relative z-10 flex items-center justify-between">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Completed</p>
               <p className="text-6xl font-black text-gray-900 tracking-tighter">{history.completed.length}</p>
             </div>
             <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-sm text-green-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
             </div>
           </div>
        </div>

        {/* Upcoming */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 group hover:-translate-y-2 transition-transform duration-300 cursor-default">
           <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
           <div className="relative z-10 flex items-center justify-between">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Upcoming</p>
               <p className="text-6xl font-black text-gray-900 tracking-tighter">{history.upcoming.length}</p>
             </div>
             <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center transform group-hover:-rotate-12 transition-transform duration-500 shadow-sm text-blue-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
           </div>
        </div>

        {/* Cancelled */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 group hover:-translate-y-2 transition-transform duration-300 cursor-default">
           <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
           <div className="relative z-10 flex items-center justify-between">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Cancelled</p>
               <p className="text-6xl font-black text-gray-900 tracking-tighter">{history.cancelled.length}</p>
             </div>
             <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center transform group-hover:rotate-[20deg] transition-transform duration-500 shadow-sm text-red-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
             </div>
           </div>
        </div>
      </div>

      {/* Segmented Tabs Control */}
      <div className="flex justify-center md:justify-start pt-4 pb-2">
        <div className="bg-gray-100/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-inner inline-flex gap-2 border border-gray-200/60 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('completed')}
            className={`relative z-10 flex whitespace-nowrap items-center gap-3 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${activeTab === 'completed' ? 'text-blue-700 shadow-md bg-white ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <span>Completed</span> <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${activeTab === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>{history.completed.length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`relative z-10 flex whitespace-nowrap items-center gap-3 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${activeTab === 'upcoming' ? 'text-blue-700 shadow-md bg-white ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <span>Upcoming</span> <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${activeTab === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>{history.upcoming.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`relative z-10 flex whitespace-nowrap items-center gap-3 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${activeTab === 'cancelled' ? 'text-blue-700 shadow-md bg-white ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <span>Cancelled</span> <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${activeTab === 'cancelled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>{history.cancelled.length}</span>
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
        {activeTab === 'completed' && history.completed.map((apt) => (
          <div key={apt.id} className="animate-slideIn" style={{ animationFillMode: 'both' }}><AppointmentCard appointment={apt} /></div>
        ))}
        {activeTab === 'upcoming' && history.upcoming.map((apt) => (
          <div key={apt.id} className="animate-slideIn" style={{ animationFillMode: 'both' }}><AppointmentCard appointment={apt} /></div>
        ))}
        {activeTab === 'cancelled' && history.cancelled.map((apt) => (
          <div key={apt.id} className="animate-slideIn" style={{ animationFillMode: 'both' }}><AppointmentCard appointment={apt} /></div>
        ))}
        
        {((activeTab === 'completed' && history.completed.length === 0) ||
          (activeTab === 'upcoming' && history.upcoming.length === 0) ||
          (activeTab === 'cancelled' && history.cancelled.length === 0)) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300">
            <div className="w-24 h-24 mb-6 bg-white rounded-full flex items-center justify-center p-6 shadow-sm border border-gray-100 text-gray-300">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Clear Queue</h3>
            <p className="text-gray-500 font-medium">You have no {activeTab} appointments.</p>
          </div>
        )}
      </div>

      {/* Premium Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform animate-scaleIn">
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-8 flex-shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight">Diagnostic Report</h3>
                    <p className="text-blue-200 mt-1 font-medium tracking-wide">
                      {selectedReport.appointment.patientName} <span className="opacity-50 mx-2">•</span> {formatDate(selectedReport.appointment.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-blue-100 hover:text-white bg-white/5 hover:bg-white/20 rounded-full p-2.5 transition-all outline-none focus:ring-2 focus:ring-white/50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-8 bg-gray-50/50">
              
              {/* Patient Info Card */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-4">Patient Profile</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Name</p>
                    <p className="font-bold text-gray-900 text-base">{selectedReport.report.patientName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Age</p>
                    <p className="font-bold text-gray-900 text-base">{selectedReport.report.age} yrs</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Gender</p>
                    <p className="font-bold text-gray-900 text-base">{selectedReport.report.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Attending Doctor</p>
                    <p className="font-bold text-gray-900 text-base">{selectedReport.appointment.doctorName}</p>
                  </div>
                </div>
              </div>

              {/* Grid for Symptoms and Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedReport.report.symptoms && selectedReport.report.symptoms.length > 0 && (
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <h4 className="font-bold text-gray-900">Reported Symptoms</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {selectedReport.report.symptoms.map((symptom, i) => (
                        <li key={i} className="flex gap-2 text-gray-700 font-medium">
                          <span className="text-orange-400 mt-1">•</span> {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.report.diagnosis && selectedReport.report.diagnosis.length > 0 && (
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      </div>
                      <h4 className="font-bold text-gray-900">Clinical Diagnosis</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {selectedReport.report.diagnosis.map((diag, i) => (
                        <li key={i} className="flex gap-2 text-gray-700 font-medium">
                          <span className="text-indigo-400 mt-1 flex-shrink-0">✓</span> <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Medicines Grid */}
              {selectedReport.report.medicines && selectedReport.report.medicines.length > 0 && (
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">Prescription</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReport.report.medicines.map((med, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md hover:border-blue-200 transition-all cursor-default group/med">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0 font-bold border border-gray-100 group-hover/med:bg-blue-600 group-hover/med:text-white transition-colors">
                          {i+1}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 text-base mb-1">{med.name}</p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span> {med.dosage}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {med.frequency}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                {selectedReport.report.recommendations && selectedReport.report.recommendations.length > 0 && (
                  <div className="bg-yellow-50/50 border border-yellow-100/50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-yellow-500 text-lg">★</span> Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {selectedReport.report.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-gray-700 font-medium text-sm">
                          <span className="text-yellow-400">•</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.report.followUpInstructions && (
                  <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Follow-up Notes
                    </h4>
                    <p className="text-gray-700 text-sm font-medium leading-relaxed">{selectedReport.report.followUpInstructions}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
