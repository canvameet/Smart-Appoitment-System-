import React, { useState } from 'react';
import BookingForm from '../components/BookingForm';
import QueueDashboard from '../components/QueueDashboard';
import TriageResult from '../components/TriageResult'; // Assuming this exists based on folder contents
import PatientDoctorSchedule from '../components/patient/PatientDoctorSchedule';
import PatientHistory from '../components/patient/PatientHistory';
import { auth } from '../firebase/firebase';

const UserDashboard = ({ user }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('booking');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-gray-900">Sma</span><span className="text-blue-600">Hosp</span> - Patient Dashboard
            </h1>
            <p className="text-gray-500">Welcome back, {user?.email}! Here's an overview of your health portal.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'availability'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Doctor Availability
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'booking' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form on the left */}
          <div>
            <BookingForm onNewBooking={() => setRefreshTrigger(prev => prev + 1)} />
          </div>

          {/* Live Queue on the right */}
          <div>
            <QueueDashboard refreshTrigger={refreshTrigger} />
          </div>
        </div>
      ) : activeTab === 'availability' ? (
        <PatientDoctorSchedule />
      ) : (
        <PatientHistory 
          patientId={auth.currentUser?.uid} 
          patientName={user?.email?.split('@')[0] || 'Patient'} 
        />
      )}
    </div>
  );
};

export default UserDashboard;
