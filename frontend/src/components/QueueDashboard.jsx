import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaClock, FaUsers } from 'react-icons/fa';

const QueueDashboard = ({ refreshTrigger }) => {
  const [queue, setQueue] = useState([]);
  const [waitingTime, setWaitingTime] = useState(0);

  const fetchQueue = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/queue');
      if (resp.data.success) {
        setQueue(resp.data.queue);
        setWaitingTime(resp.data.waiting_time);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
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
            {queue.map((pt, idx) => (
              <tr key={pt.id} className={`hover:bg-gray-50 bg-white transition-colors ${pt.triage?.is_emergency ? 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-l-red-500' : ''}`}>
                <td className="p-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {pt.queue_position}
                  </span>
                </td>
                <td className="p-3 font-medium text-gray-900">
                  {pt.name}
                  {pt.triage?.is_emergency && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">🚨 ER</span>}
                </td>
                <td className="p-3 text-xs text-gray-600 font-semibold">{pt.doctor_name || "Any"}</td>
                <td className="p-3">
                   <div className="text-xs font-bold text-blue-700">{pt.time_slot || "ASAP"}</div>
                   <div className="text-[10px] text-gray-500">{pt.date || "Today"}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pt.triage?.severity >= 4 ? 'bg-red-500' : pt.triage?.severity === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs font-medium text-gray-700">Lvl {pt.triage?.severity} ({pt.predicted_time}m)</span>
                  </div>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
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
