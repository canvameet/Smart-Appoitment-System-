import React, { useState } from 'react';
import BookingForm from './components/BookingForm';
import TriageResult from './components/TriageResult';
import QueueDashboard from './components/QueueDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import { FaHospital, FaUserShield, FaCalendarPlus } from 'react-icons/fa';

function App() {
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'admin'
  const [latestAppointment, setLatestAppointment] = useState(null);
  const [refreshQueueTrigger, setRefreshQueueTrigger] = useState(0);

  const handleNewAppointment = (appt) => {
    setLatestAppointment(appt);
    setRefreshQueueTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">+</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                HealthPriority<span className="text-blue-600">AI</span>
              </h1>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Smart Triage System</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'booking'
                  ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaCalendarPlus className="text-sm" />
              Patient Booking
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUserShield className="text-sm" />
              Admin Panel
            </button>
          </nav>
        </div>
      </header>

      {/* ── BOOKING VIEW ─────────────────────────────────────────────────── */}
      {activeTab === 'booking' && (
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{ minHeight: 'calc(100vh - 130px)' }}>
            {/* Left: Form + Triage Result */}
            <div className="lg:col-span-5 space-y-6 flex flex-col overflow-y-auto pb-10">
              <BookingForm onNewAppointment={handleNewAppointment} />
              <TriageResult appointment={latestAppointment} />
            </div>
            {/* Right: Live Queue */}
            <div className="lg:col-span-7 pb-10">
              <QueueDashboard refreshTrigger={refreshQueueTrigger} />
            </div>
          </div>
        </main>
      )}

      {/* ── ADMIN VIEW ───────────────────────────────────────────────────── */}
      {activeTab === 'admin' && <AdminDashboard />}
    </div>
  );
}

export default App;
