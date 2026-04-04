import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import {
  FaUserClock, FaAmbulance, FaCheckCircle, FaHourglassHalf,
  FaBell, FaSync, FaClock, FaUsers, FaChartBar, FaCalendarAlt, FaCog, FaHistory, FaSignOutAlt, FaBars, FaRupeeSign, FaChartLine
} from 'react-icons/fa';
import { MdCheckCircle } from 'react-icons/md';
import DoctorScheduling from './admin/DoctorScheduling';
import HospitalSettings from './admin/HospitalSettings';
import AdminHistory from './admin/AdminHistory';
import PaymentManagement from './admin/PaymentManagement';
import AnalyticsDashboard from './admin/AnalyticsDashboard';

const API = 'http://localhost:5000';

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'Waiting':     'bg-yellow-100 text-yellow-800',
    'Checked-in':  'bg-green-100  text-green-800',
    'Delayed':     'bg-red-100    text-red-800',
    'In-Progress': 'bg-blue-100   text-blue-800',
    'Completed':   'bg-gray-100   text-gray-800',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

// ─── Priority Indicator ───────────────────────────────────────────────────────
const PriorityDot = ({ priority, emergency }) => {
  if (emergency || priority === 0) return <span className="flex items-center gap-1.5 text-red-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Emergency</span>;
  if (priority <= 2) return <span className="flex items-center gap-1.5 text-orange-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> High</span>;
  if (priority <= 5) return <span className="flex items-center gap-1.5 text-yellow-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Normal</span>;
  return <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Low</span>;
};

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotifPanel = ({ notifications }) => {
  if (!notifications.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">No notifications yet.</div>
  );
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
      {[...notifications].reverse().map((n, i) => (
        <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-bold text-gray-800">{n.patientName}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.timeShift?.startsWith('+') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {n.timeShift}
            </span>
          </div>
          <p className="text-sm text-gray-600">{n.message}</p>
          <p className="text-xs text-gray-400 mt-2 font-medium">{new Date(n.timestamp).toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState('queue');
  const [queue, setQueue]             = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar toggle state
  const [syncing, setSyncing] = useState(false); // Firebase sync state

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchQueue = useCallback(async () => {
    try {
      const [qRes, nRes] = await Promise.all([
        axios.get(`${API}/reschedule/queue`),
        axios.get(`${API}/reschedule/notifications`)
      ]);
      if (qRes.data.success) {
        setQueue(qRes.data.queue);
        setTotalCount(qRes.data.total);
      } else {
        console.error('Queue fetch failed:', qRes.data);
      }
      if (nRes.data.success) setNotifications(nRes.data.notifications);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Queue fetch error', e);
      // Set empty queue on error
      setQueue([]);
      setTotalCount(0);
    }
  }, []);

  // Sync Firebase appointments to queue
  const syncFirebaseToQueue = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${API}/reschedule/sync-firebase`);
      if (response.data.success) {
        toast.success(`✅ Synced ${response.data.synced} appointments to queue`);
        fetchQueue(); // Refresh queue after sync
      } else {
        toast.error('Failed to sync appointments');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync appointments from Firebase');
    } finally {
      setSyncing(false);
    }
  };

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
      ? new Date(Date.now() + 20 * 60 * 1000).toISOString()
      : new Date(Date.now() - 15 * 60 * 1000).toISOString();
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
    <div className="fixed inset-0 flex w-screen h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <div className={`transition-all overflow-visible duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 relative z-30`}>
        <aside 
          className={`absolute left-0 top-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl overflow-hidden
            origin-left transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${sidebarOpen ? 'translate-x-0 scale-100 opacity-100' : '-translate-x-12 scale-90 opacity-0 pointer-events-none'}`}
        >
        <div className="px-6 py-8 border-b border-slate-800 flex items-center gap-3">
           <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
             +
           </div>
           <div>
             <h1 className="text-lg font-bold text-white tracking-tight">Sma<span className="font-normal text-blue-400">Hosp</span></h1>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1">
             <li>
               <button onClick={() => setActiveTab('queue')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'queue' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaChartBar className="text-lg opacity-80" />
                 Queue Management
               </button>
             </li>
             <li>
               <button onClick={() => setActiveTab('scheduling')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'scheduling' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaCalendarAlt className="text-lg opacity-80" />
                 Doctor Scheduling
               </button>
             </li>
             <li>
               <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaChartLine className="text-lg opacity-80" />
                 Analytics
               </button>
             </li>
             <li>
               <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaHistory className="text-lg opacity-80" />
                 History
               </button>
             </li>
             <li>
               <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'payments' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaRupeeSign className="text-lg opacity-80" />
                 Payments
               </button>
             </li>
             <li>
               <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'border-l-[4px] border-blue-500 bg-slate-800 text-white' : 'border-l-[4px] border-transparent hover:bg-slate-800 hover:text-white'}`}>
                 <FaCog className="text-lg opacity-80" />
                 Hospital Settings
               </button>
             </li>
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-3">
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
          >
            <FaSignOutAlt className="text-xs" /> Logout
          </button>

          {/* Sync Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center font-medium">
            <FaClock className="text-slate-400" /> Sync: {lastRefresh || '...'}
          </div>

          {/* Firebase Sync Button */}
          <button 
            onClick={syncFirebaseToQueue} 
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 border border-blue-500 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
          >
            <FaSync className={`text-xs ${syncing ? 'animate-spin' : ''}`} /> 
            {syncing ? 'Syncing...' : 'Sync Firebase'}
          </button>

          {/* Refresh Queue Button */}
          <button onClick={fetchQueue} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium shadow-sm">
            <FaSync className="text-xs" /> Refresh Queue
          </button>
        </div>
        </aside>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col relative z-10 w-full">
        
        {/* Top Header Row */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm flex-shrink-0">
           <div className="flex items-center gap-4">
             {/* Hamburger Menu Button */}
             <button 
               onClick={toggleSidebar}
               className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-gray-900"
               aria-label="Toggle sidebar"
             >
               <FaBars className="text-xl" />
             </button>
             
             <h2 className="text-xl font-bold text-gray-800">
               {activeTab === 'queue' && 'Dynamic Rescheduling Queue'}
               {activeTab === 'scheduling' && 'Doctor Scheduling Matrix'}
               {activeTab === 'analytics' && 'Analytics & Insights'}
               {activeTab === 'history' && 'Platform History'}
               {activeTab === 'payments' && 'Payment Management'}
               {activeTab === 'settings' && 'System Settings'}
             </h2>
           </div>
           
           <div className="flex items-center gap-4">
             {emergencyCount > 0 && (
               <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border border-red-200">
                 <FaAmbulance className="text-red-500" /> {emergencyCount} ACTIVE EMERGENCY
               </div>
             )}
           </div>
        </header>

        {/* Tab Sub-views */}
        {activeTab === 'scheduling' ? (
          <div className="p-8 w-full"><DoctorScheduling /></div>
        ) : activeTab === 'analytics' ? (
          <div className="p-8 w-full"><AnalyticsDashboard /></div>
        ) : activeTab === 'history' ? (
          <div className="p-8 w-full"><AdminHistory /></div>
        ) : activeTab === 'payments' ? (
          <div className="p-8 w-full"><PaymentManagement /></div>
        ) : activeTab === 'settings' ? (
          <div className="p-8 w-full"><HospitalSettings /></div>
        ) : (
          <div className="p-8 w-full">
            
            {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Patients', value: totalCount, icon: <FaUsers /> },
                { label: 'In Queue', value: queue.length, icon: <FaHourglassHalf /> },
                { label: 'Emergencies', value: emergencyCount, icon: <FaAmbulance /> },
                { label: 'Notifications', value: notifications.length, icon: <FaBell /> },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4 text-blue-600">
                    <div className="text-xl">{s.icon}</div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── QUEUE & RIGHT COLUMN ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
              
              {/* Queue Table */}
              <div className="xl:col-span-8 flex flex-col">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-gray-800 text-base">Live Priority Queue</h3>
                    {nextPatient && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                        Next Up: {nextPatient.name}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Pos</th>
                          <th className="px-6 py-4">Patient</th>
                          <th className="px-6 py-4">Priority</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Slot & Est</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {queue.map((pt, idx) => {
                          const isLoading = loading[pt.patientId];
                          const isER = pt.is_emergency;
                          return (
                            <tr key={pt.patientId} className={`hover:bg-gray-50 transition-colors ${isER ? 'bg-red-50/40' : ''}`}>
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-700">{idx + 1}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-gray-900 leading-tight">{pt.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{pt.patientId}</p>
                              </td>
                              <td className="px-6 py-4">
                                <PriorityDot priority={pt.effectivePriority} emergency={pt.is_emergency} />
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">Score: {pt.priorityScore}</p>
                              </td>
                              <td className="px-6 py-4"><StatusBadge status={pt.status} /></td>
                              <td className="px-6 py-4 text-xs">
                                <p className="text-gray-900 font-bold mb-1">
                                  {new Date(pt.originalSlot).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                                <div className="text-gray-500 font-medium">
                                  Est: {pt.predictedDuration}m
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  
                                  {/* Mark Next / Ghost Button */}
                                  <button
                                    onClick={() => handleMarkNext(pt)}
                                    disabled={!!isLoading || pt.status === 'In-Progress' || pt.status === 'Completed'}
                                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm transition-colors font-semibold"
                                  >
                                    <MdCheckCircle className="text-gray-400" />
                                    {isLoading === 'next' ? '...' : 'Next'}
                                  </button>

                                  {/* Mark Completed (Primary) */}
                                  {pt.status === 'In-Progress' && (
                                    <button
                                      onClick={() => handleMarkCompleted(pt)}
                                      disabled={!!isLoading}
                                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white shadow-sm border border-transparent text-xs px-3 py-1.5 rounded-md transition-colors font-semibold"
                                    >
                                      <MdCheckCircle />
                                      {isLoading === 'done' ? '...' : 'Done'}
                                    </button>
                                  )}

                                  {/* Early Arrival Ghost */}
                                  {pt.status === 'Waiting' && (
                                    <button
                                      onClick={() => handleCheckIn(pt, false)}
                                      disabled={!!isLoading}
                                      className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm transition-colors font-semibold"
                                    >
                                      <FaUserClock className="text-gray-400" />
                                      {isLoading === 'checkin' ? '...' : 'Early'}
                                    </button>
                                  )}

                                  {/* Late Arrival Ghost */}
                                  {pt.status === 'Waiting' && (
                                    <button
                                      onClick={() => handleCheckIn(pt, true)}
                                      disabled={!!isLoading}
                                      className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm transition-colors font-semibold"
                                    >
                                      <FaHourglassHalf className="text-gray-400" />
                                      {isLoading === 'checkin' ? '...' : 'Late'}
                                    </button>
                                  )}

                                  {/* Emergency escalation (Destructive Muted Crimson) */}
                                  {!isER && pt.status !== 'Completed' && pt.status !== 'In-Progress' && (
                                    <button
                                      onClick={() => handleEmergency(pt)}
                                      disabled={!!isLoading}
                                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white border border-transparent shadow-sm text-xs px-3 py-1.5 rounded-md transition-colors font-semibold"
                                    >
                                      <FaAmbulance />
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
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="text-gray-400 text-5xl">📋</div>
                                <div>
                                  <p className="text-gray-700 font-semibold mb-2">No patients in queue</p>
                                  <p className="text-gray-500 text-sm mb-4">
                                    If you have appointments in Firebase, click "Sync Firebase" to load them into the queue.
                                  </p>
                                  <button 
                                    onClick={syncFirebaseToQueue}
                                    disabled={syncing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
                                  >
                                    <FaSync className={syncing ? 'animate-spin' : ''} />
                                    {syncing ? 'Syncing...' : 'Sync Firebase Appointments'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="xl:col-span-4 space-y-6 flex flex-col">
                
                {/* Legend Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-800 text-base mb-5 flex items-center gap-2">
                    <FaChartBar className="text-blue-500" /> Rescheduling Guide
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: <MdCheckCircle className="text-gray-500" />, label: 'Next Context', desc: 'Marks patient as actively seeing the doctor.' },
                      { icon: <FaUserClock className="text-green-500" />, label: 'Early Arrival', desc: 'Upgrades priority due to early presence.' },
                      { icon: <FaHourglassHalf className="text-yellow-600" />, label: 'Late Arrival', desc: 'Downgrades priority after 15 minute delay.' },
                      { icon: <FaAmbulance className="text-red-500" />, label: 'ER Override', desc: 'Instant queue escalation to position 1.' },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <span className="bg-gray-50 p-1.5 rounded-md border border-gray-100 shadow-sm">{item.icon}</span> {item.label}
                        </p>
                        <p className="text-xs text-gray-500 ml-[36px]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
                  <h3 className="font-bold text-gray-800 text-base mb-5 flex items-center gap-2">
                    <FaBell className="text-blue-500" /> Event Logs
                    {notifications.length > 0 && (
                      <span className="ml-auto bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold px-2.5 py-0.5 rounded-full">{notifications.length}</span>
                    )}
                  </h3>
                  <NotifPanel notifications={notifications} />
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
