import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaClock, FaUsers } from 'react-icons/fa';

const QueueDashboard = ({ refreshTrigger }) => {
  const [appointments, setAppointments] = useState([]);
  const [waitingTime, setWaitingTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAllAppointments = async () => {
    try {
      // Fetch all doctors
      const doctorsResp = await axios.get('http://localhost:5000/doctors/list');
      
      if (!doctorsResp.data.success) {
        console.error('Failed to fetch doctors');
        return;
      }
      
      const doctors = doctorsResp.data.doctors;
      
      // Fetch appointments for all doctors
      const allAppointments = [];
      
      for (const doctor of doctors) {
        try {
          const apptResp = await axios.get(`http://localhost:5000/appointments/doctor/${doctor.id}`);
          
          if (apptResp.data.success) {
            const doctorAppts = apptResp.data.appointments.map(appt => ({
              ...appt,
              doctor_name: doctor.name,
              // Map Firebase fields to legacy queue format
              name: appt.patientName || appt.name,
              age: appt.patientAge || appt.age,
              time_slot: appt.timeSlot || appt.time_slot,
              predicted_time: appt.predictedTime || appt.predicted_time || 20
            }));
            
            allAppointments.push(...doctorAppts);
          }
        } catch (err) {
          console.error(`Failed to fetch appointments for doctor ${doctor.id}:`, err);
        }
      }
      
      // Filter only pending appointments
      const pendingAppointments = allAppointments.filter(appt => appt.status === 'pending');
      
      // Sort by priority: emergency first, then by severity, then by date/time
      pendingAppointments.sort((a, b) => {
        // Emergency first
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        
        // Then by severity
        const severityA = a.triage?.severity || 1;
        const severityB = b.triage?.severity || 1;
        if (severityA !== severityB) return severityB - severityA;
        
        // Then by date and time
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        
        return (a.timeSlot || '').localeCompare(b.timeSlot || '');
      });
      
      // Add queue positions
      pendingAppointments.forEach((appt, idx) => {
        appt.queue_position = idx + 1;
      });
      
      // Calculate total waiting time
      const totalTime = pendingAppointments.reduce((sum, appt) => sum + (appt.predicted_time || 20), 0);
      
      setAppointments(pendingAppointments);
      setWaitingTime(totalTime);
      setLoading(false);
      
      console.log(`✅ Queue Dashboard: Loaded ${pendingAppointments.length} pending appointments`);
      
    } catch (e) {
      console.error('Failed to fetch appointments:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAppointments();
    const interval = setInterval(fetchAllAppointments, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-3 text-blue-600"/>
          Live Queue Dashboard
        </h2>
        <div className="flex space-x-4">
           <div className="flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-100 font-semibold text-sm">
              <FaClock className="mr-2" /> 
              Wait Time: {waitingTime} mins
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Pos</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Schedule</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500 bg-white">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading appointments...
                  </div>
                </td>
              </tr>
            ) : appointments.length > 0 ? (
              appointments.map((pt, idx) => (
                <tr key={pt.id} className={`hover:bg-gray-50 bg-white transition-colors ${pt.isEmergency || pt.triage?.is_emergency ? 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-l-red-500' : ''}`}>
                  <td className="p-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {pt.queue_position}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-gray-900">
                    {pt.name}
                    {(pt.isEmergency || pt.triage?.is_emergency) && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">🚨 ER</span>}
                  </td>
                  <td className="p-3 text-xs text-gray-600 font-semibold">{pt.doctor_name || "Any"}</td>
                  <td className="p-3">
                     <div className="text-xs font-bold text-blue-700">{pt.time_slot || "ASAP"}</div>
                     <div className="text-[10px] text-gray-500">{pt.date || "Today"}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${pt.triage?.severity >= 4 ? 'bg-red-500' : pt.triage?.severity === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <span className="text-xs font-medium text-gray-700">Lvl {pt.triage?.severity || 1} ({pt.predicted_time}m)</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500 bg-white italic">
                  No appointments in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueueDashboard;
