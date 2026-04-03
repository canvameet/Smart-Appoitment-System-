import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaUserClock, FaAmbulance, FaCheckCircle, FaHourglassHalf,
  FaBell, FaSync, FaClock, FaUsers, FaChartBar
} from 'react-icons/fa';
import { MdCheckCircle } from 'react-icons/md';

const API = 'http://localhost:5000';

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'Waiting':     'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Checked-in':  'bg-green-100  text-green-800  border-green-200',
    'Delayed':     'bg-red-100    text-red-800    border-red-200',
    'In-Progress': 'bg-blue-100   text-blue-800   border-blue-200',
    'Completed':   'bg-gray-100   text-gray-600   border-gray-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ─── Priority Indicator ───────────────────────────────────────────────────────
const PriorityDot = ({ priority, emergency }) => {
  if (emergency || priority === 0) return <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> EMERGENCY</span>;
  if (priority <= 2) return <span className="flex items-center gap-1 text-orange-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> HIGH</span>;
  if (priority <= 5) return <span className="flex items-center gap-1 text-yellow-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> NORMAL</span>;
  return <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> LOW</span>;
};

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotifPanel = ({ notifications }) => {
  if (!notifications.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">No notifications yet.</div>
  );
  return (
    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
      {[...notifications].reverse().map((n, i) => (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-800">{n.patientName}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.timeShift?.startsWith('+') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {n.timeShift}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{n.message}</p>
          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [queue, setQueue]             = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      const [qRes, nRes] = await Promise.all([
        axios.get(`${API}/reschedule/queue`),
        axios.get(`${API}/reschedule/notifications`)
      ]);
      if (qRes.data.success) {
        setQueue(qRes.data.queue);
        setTotalCount(qRes.data.total);
      }
      if (nRes.data.success) setNotifications(nRes.data.notifications);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Queue fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const setPatientLoading = (id, val) => setLoading(prev => ({ ...prev, [id]: val }));

  // Action: Check-in (triggers Late/Early detection automatically)
  const handleCheckIn = async (patient, arrivedLate) => {
    setPatientLoading(patient.patientId, 'checkin');
    const arrivalTime = arrivedLate
      ? new Date(Date.now() + 20 * 60 * 1000).toISOString()   // simulate 20min late
      : new Date(Date.now() - 15 * 60 * 1000).toISOString();  // simulate 15min early
    try {
      await axios.post(`${API}/reschedule/update-status`, {
        patientId: patient.patientId,
        status: arrivedLate ? 'Delayed' : 'Checked-in',
        arrivalTime,
      });
      toast.success(arrivedLate
        ? `${patient.name} marked as LATE — priority downgraded`
        : `${patient.name} Checked In early — priority upgraded`);
      fetchQueue();
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setPatientLoading(patient.patientId, null);
    }
  };

  // Action: Mark as "Next" (In-Progress)
  const handleMarkNext = async (patient) => {
    setPatientLoading(patient.patientId, 'next');
    try {
      await axios.post(`${API}/reschedule/update-status`, {
        patientId: patient.patientId,
        status: 'In-Progress',
        arrivalTime: new Date().toISOString(),
      });
      toast.success(`${patient.name} is now being seen by the doctor`);
      fetchQueue();
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setPatientLoading(patient.patientId, null);
    }
  };

  // Action: Mark Emergency (Scenario C)
  const handleEmergency = async (patient) => {
    setPatientLoading(patient.patientId, 'emergency');
    try {
      await axios.post(`${API}/reschedule/emergency`, { patientId: patient.patientId });
      toast.error(`EMERGENCY: ${patient.name} has been moved to the TOP of the queue!`, { duration: 5000, icon: '🚨' });
      fetchQueue();
    } catch (e) {
      toast.error('Failed to escalate emergency');
    } finally {
      setPatientLoading(patient.patientId, null);
    }
  };

  // Action: Mark as "Completed" (Done)
  const handleMarkCompleted = async (patient) => {
    setPatientLoading(patient.patientId, 'done');
    try {
      await axios.post(`${API}/reschedule/update-status`, {
        patientId: patient.patientId,
        status: 'Completed',
        arrivalTime: new Date().toISOString(),
      });
      toast.success(`${patient.name} consultation completed!`);
      fetchQueue();
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setPatientLoading(patient.patientId, null);
    }
  };

  const emergencyCount = queue.filter(p => p.is_emergency).length;
  const nextPatient = queue.find(p => p.status !== 'In-Progress' && p.status !== 'Completed');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-xl">+</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                HealthPriority<span className="text-blue-400">AI</span>
                <span className="ml-3 text-sm font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Admin Panel</span>
              </h1>
              <p className="text-xs text-slate-500">Dynamic Rescheduling Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {emergencyCount > 0 && (
              <div className="flex items-center gap-2 bg-red-900/50 text-red-400 border border-red-700 px-3 py-1.5 rounded-full animate-pulse font-bold">
                <FaAmbulance /> {emergencyCount} EMERGENCY
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FaClock className="text-blue-400" />
              Last sync: {lastRefresh || '...'}
            </div>
            <button onClick={fetchQueue} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-slate-400 hover:text-white">
              <FaSync />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">

        {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: totalCount, icon: <FaUsers />, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800' },
            { label: 'In Queue', value: queue.length, icon: <FaHourglassHalf />, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800' },
            { label: 'Emergencies', value: emergencyCount, icon: <FaAmbulance />, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800' },
            { label: 'Notifications', value: notifications.length, icon: <FaBell />, color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className={`${s.color} text-xl mb-2`}>{s.icon}</div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── QUEUE TABLE ───────────────────────────────────────────────────── */}
        <div className="col-span-8">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FaChartBar className="text-blue-400" /> Live Priority Queue
              </h2>
              {nextPatient && (
                <div className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800 px-3 py-1.5 rounded-full font-semibold">
                  Next Up: {nextPatient.name}
                </div>
              )}
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                    <th className="px-4 py-3 text-left">Pos</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Slot</th>
                    <th className="px-4 py-3 text-left">Est.</th>
                    <th className="px-4 py-3 text-center">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {queue.map((pt, idx) => {
                    const isLoading = loading[pt.patientId];
                    const isER = pt.is_emergency;
                    return (
                      <tr key={pt.patientId} className={`hover:bg-slate-800/40 transition-all ${isER ? 'bg-red-900/10 border-l-2 border-l-red-500' : ''} ${idx === 0 ? 'bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{pt.name}</p>
                          <p className="text-xs text-slate-500">{pt.patientId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityDot priority={pt.effectivePriority} emergency={pt.is_emergency} />
                          <p className="text-[10px] text-slate-500 mt-1">Score: {pt.priorityScore}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={pt.status} /></td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          <p className="font-semibold text-white">{new Date(pt.originalSlot).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          <p>{new Date(pt.originalSlot).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 text-xs flex flex-col gap-1">
                          <span className="font-bold text-blue-400">{pt.predictedDuration}m (Est)</span>
                          {pt.actualDuration && (
                            <span className="font-bold text-emerald-400">{pt.actualDuration}m (Actual)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Mark Next */}
                            <button
                              onClick={() => handleMarkNext(pt)}
                              disabled={!!isLoading || pt.status === 'In-Progress' || pt.status === 'Completed'}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-2 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap"
                              title="Mark as Next / In-Progress"
                            >
                              <FaCheckCircle className="text-[10px]" />
                              {isLoading === 'next' ? '...' : 'Next'}
                            </button>

                            {/* Mark Done */}
                            {pt.status === 'In-Progress' && (
                              <button
                                onClick={() => handleMarkCompleted(pt)}
                                disabled={!!isLoading}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-xs px-2 py-1.5 rounded-lg transition-all font-bold whitespace-nowrap"
                                title="Mark consultation as Completed"
                              >
                                <MdCheckCircle className="text-[10px] text-green-600" />
                                {isLoading === 'done' ? '...' : 'Done'}
                              </button>
                            )}

                            {/* Early Check-In */}
                            {pt.status === 'Waiting' && (
                              <button
                                onClick={() => handleCheckIn(pt, false)}
                                disabled={!!isLoading}
                                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-2 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap"
                                title="Patient arrived early — priority upgrade"
                              >
                                <FaUserClock className="text-[10px]" />
                                {isLoading === 'checkin' ? '...' : 'Early'}
                              </button>
                            )}

                            {/* Late Arrival */}
                            {pt.status === 'Waiting' && (
                              <button
                                onClick={() => handleCheckIn(pt, true)}
                                disabled={!!isLoading}
                                className="flex items-center gap-1 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-2 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap"
                                title="Patient arrived late — priority downgraded"
                              >
                                <FaHourglassHalf className="text-[10px]" />
                                {isLoading === 'checkin' ? '...' : 'Late'}
                              </button>
                            )}

                            {/* Emergency Escalation */}
                            {!isER && pt.status !== 'Completed' && pt.status !== 'In-Progress' && (
                              <button
                                onClick={() => handleEmergency(pt)}
                                disabled={!!isLoading}
                                className="flex items-center gap-1 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-2 py-1.5 rounded-lg transition-all font-bold whitespace-nowrap animate-none hover:animate-pulse"
                                title="Escalate to Emergency (Priority 0)"
                              >
                                <FaAmbulance className="text-[10px]" />
                                {isLoading === 'emergency' ? '...' : 'ER'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-slate-500 italic text-sm">
                        No patients in the rescheduling queue yet. Book an appointment to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Notifications + Legend ───────────────────────── */}
        <div className="col-span-4 space-y-5">

          {/* Action Legend */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5">
            <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
              <FaChartBar className="text-blue-400" /> Rescheduling Scenarios
            </h3>
            <div className="space-y-3">
              {[
                { icon: <FaCheckCircle className="text-blue-400" />, label: 'Next', desc: 'Mark patient as currently In-Progress with doctor.' },
                { icon: <FaUserClock className="text-emerald-400" />, label: 'Early', desc: 'Scenario B: Patient arrived early → Priority upgraded.' },
                { icon: <FaHourglassHalf className="text-amber-400" />, label: 'Late', desc: 'Scenario A: Patient is >15 min late → Priority downgraded.' },
                { icon: <FaAmbulance className="text-red-400" />, label: 'ER', desc: 'Scenario C: Emergency → Forced to Queue Position 1 instantly.' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="mt-0.5 text-lg">{item.icon}</div>
                  <div>
                    <p className="font-bold text-xs text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Feed */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5">
            <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
              <FaBell className="text-amber-400" /> Notification Feed
              {notifications.length > 0 && (
                <span className="ml-auto bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
              )}
            </h3>
            <NotifPanel notifications={notifications} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
